/* M1: cinco posiciones compartidas para ejercicios 3 y 5.
 * Sin soluciones ni corrección local. Los cambios se consolidan en RPC seguras
 * mediante CAS de revisión; un único movimiento fallido sobrevive a recargas. */
export function createMission1DraftSync({client,teamId,exercise,userId,onDraft,onStatus,onCompleted=()=>{}}){
 if(![3,5].includes(exercise)||!teamId||!userId||!client)throw Error('Borrador de misión inválido');
 let current={},revision=0,ready=false,busy=false,loading=false,dirty=false,alive=true;
 let channel=null,ticker=null;
 const pendingKey='inperialismoa:m1:pending:'+teamId+':'+exercise+':'+userId;
 const items=exercise===3?['capital','exploit','dominion','conqueror','conquered']:
  ['koloniak','kapitalismoa','nagusitasuna','inperialismoa',
   'ustiapena','metropoliak','merkataritza','dominazioa'];
 const slots=exercise===3?['purpose','resources','outcome','metropole','colony']:
  ['1','2','3','4','5'];
 const validPending=x=>x&&typeof x==='object'&&items.includes(x.item)&&
   (x.to===null||slots.includes(x.to))&&
   (x.expected===null||slots.includes(x.expected))&&
   Number.isSafeInteger(x.revision)&&x.revision>=0;
 let pending=null;
 try{
   const raw=JSON.parse(localStorage.getItem(pendingKey)||'null');
   if(validPending(raw))pending=raw;
 }catch(e){console.warn('M1: ezin izan da mugimendu lokala irakurri',e)}
 const savePending=x=>{
   pending=x;
   try{
     if(x)localStorage.setItem(pendingKey,JSON.stringify(x));
     else localStorage.removeItem(pendingKey);
   }catch(e){console.warn('M1: ez da mugimendu lokala gorde',e)}
 };
 const clone=places=>Object.fromEntries(Object.entries(places||{})
   .filter(([key,value])=>items.includes(key)&&slots.includes(value)));
 const state=()=>({ready:ready&&!busy&&!pending,busy,revision,pending:!!pending,placements:{...current}});
 const tell=(message,kind='info')=>{if(alive)onStatus(message,kind,state())};
 const paint=()=>{if(alive)onDraft({...current},state())};
 const apply=result=>{
   current=clone(result?.placements);
   revision=Number(result?.revision)||0;
   paint();
 };
 async function load(){
   if(!alive)return false;
   if(loading||busy){dirty=true;return false}
   loading=true;
   let retry=null,success=false;
   try{
     const {data,error}=await client.from('mission1_team_drafts')
       .select('placements,revision').eq('team_id',teamId)
       .eq('exercise',exercise).maybeSingle();
     if(error)throw error;
     ready=true;
     apply(data||{placements:{},revision:0});
     if(pending){
       if((current[pending.item]??null)===pending.to){
         savePending(null);
         tell('✓ Aurreko mugimendua taldean gordeta dago.','saved');
       }else{
         // Un compañero puede haber guardado otra tarjeta mientras estábamos
         // sin conexión. Reintentar solo cuando origen y destino siguen libres.
         const originMatches=(current[pending.item]??null)===pending.expected;
         const destinationFree=pending.to===null||
           !Object.entries(current).some(([id,slot])=>
             id!==pending.item&&slot===pending.to);
         if(!originMatches||!destinationFree){
           savePending(null);
           tell('Taldekide batek kokapen bera aldatu du. Berrikusi kokapenak.','conflict');
         }else{
           retry={p_item:pending.item,p_to_slot:pending.to,
             p_expected_slot:pending.expected,p_expected_revision:revision};
           if(pending.revision!==revision)savePending({...pending,revision});
           tell('Gordetzeko falta zen mugimendua berreskuratzen…','saving');
         }
       }
     }else{
       tell('✓ Taldearen zirriborroa prest dago.','ready');
     }
     success=true;
   }catch(e){
     console.error('M1 borrador · kargatu',e);
     ready=false;tell('Konexioa eten da. Berriro konektatzen saia zaitez.','error');
   }finally{
     loading=false;
     if(alive&&dirty&&!busy){dirty=false;void load()}
   }
   if(retry&&alive)return act('mission1_draft_move_checked',retry,{replaying:true});
   paint();
   return success;
 }
 async function act(rpc,args,{capturePending=false,replaying=false}={}){
   if(!alive||!ready||busy||(pending&&!replaying)){
     tell('Lehenik, berreskuratu taldearen konexioa.','error');
     return false;
   }
   if(capturePending){
     const p={item:args.p_item,to:args.p_to_slot??null,
       expected:args.p_expected_slot??null,revision};
     if(!validPending(p))return false;
     savePending(p);
   }
   busy=true;tell('Aldaketak gordetzen…','saving');paint();
   try{
     const {data,error}=await client.rpc(rpc,{p_exercise:exercise,...args});
     if(error)throw error;
     if(!data||typeof data.status!=='string')throw Error('Erantzun-formatu baliogabea');
     if(data.status==='conflict'){
       savePending(null);apply(data);
       tell('Taldekide baten aldaketak kargatu dira. Berrikusi kokapenak.','conflict');
       return false;
     }
     if(data.status==='completed'){
       savePending(null);apply(data);onCompleted();
       tell('Ariketa hau taldeak dagoeneko gainditu du.','completed');
       return false;
     }
     if(data.status!=='saved')throw Error('Borradorra ez da gorde');
     savePending(null);apply(data);
     tell('✓ Taldearen lana gordeta.','saved');
     return true;
   }catch(e){
     console.error('M1 borrador · gorde',e);
     ready=false;
     tell(pending?'Gorde gabeko mugimendua dago. Berriro konektatu.':
       'Ezin izan da gorde. Berriro konektatu.','error');
     return false;
   }finally{
     busy=false;paint();
     if(alive&&dirty){dirty=false;void load()}
   }
 }
 async function move(item,to,expected){
   if(!items.includes(item)||(to!==null&&!slots.includes(to)))return false;
   return act('mission1_draft_move_checked',{
     p_item:item,p_to_slot:to??null,p_expected_slot:expected??null,
     p_expected_revision:revision
   },{capturePending:true});
 }
 async function reset(){
   if(pending){tell('Lehenik, berreskuratu gorde gabeko mugimendua.','error');return false}
   return act('mission1_draft_reset',{p_revision:revision});
 }
 async function submit(){
   if(!alive||!ready||busy||pending)throw Error('Ezin da egiaztatu konexiorik gabe');
   busy=true;tell('Taldearen erantzunak egiaztatzen…','saving');paint();
   try{
     const {data,error}=await client.rpc('mission1_draft_submit',{
       p_exercise:exercise,p_revision:revision
     });
     if(error)throw error;
     if(!data||typeof data.status!=='string')throw Error('Zerbitzariaren erantzuna ez da baliagarria');
     if(data.status==='conflict'){
       apply(data);tell('Taldekide batek kokapen bat aldatu du. Berrikusi eta saiatu berriro.','conflict');
       return {...data,completed:false};
     }
     if(data.status==='incomplete'){
       tell('Osatu bost kokapenak egiaztatu aurretik.','incomplete');
       return {...data,completed:false};
     }
     if(data.status!=='checked'&&data.status!=='completed')throw Error('Emaitza baliogabea');
     if(data.completed){onCompleted();tell('✓ Ariketa taldearentzat gordeta.','completed')}
     else tell('Ez da zuzena. Berrikusi erantzun guztiak eta saiatu berriro.','incorrect');
     return data;
   }catch(e){
     console.error('M1 borrador · egiaztatu',e);
     ready=false;tell('Ezin izan da egiaztatu. Berriro konektatu eta saiatu berriro.','error');
     throw e;
   }finally{
     busy=false;paint();
     if(alive&&dirty){dirty=false;void load()}
   }
 }
 const refreshed=()=>{if(!document.hidden)void load()};
 const connected=()=>void load();
 async function start(){
   channel=client.channel('m1-draft-'+teamId+'-'+exercise)
     .on('postgres_changes',{
       event:'*',schema:'public',table:'mission1_team_drafts',
       filter:'team_id=eq.'+teamId
     },payload=>{
       if(Number(payload.new?.exercise)===exercise&&alive){
         if(busy||loading)dirty=true;else void load();
       }
     }).subscribe();
   window.addEventListener('focus',refreshed);
   window.addEventListener('online',connected);
   document.addEventListener('visibilitychange',refreshed);
   ticker=window.setInterval(()=>{if(alive&&!document.hidden)void load()},15000);
   return load();
 }
 function stop(){
   alive=false;
   window.removeEventListener('focus',refreshed);
   window.removeEventListener('online',connected);
   document.removeEventListener('visibilitychange',refreshed);
   if(ticker!==null)window.clearInterval(ticker);
   ticker=null;
   if(channel)void client.removeChannel(channel);
   channel=null;
 }
 return {start,stop,load,move,reset,submit,get ready(){return ready&&!busy&&!pending},
   get revision(){return revision},get placements(){return {...current}},
   get pending(){return !!pending}};
}
