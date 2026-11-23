/* Primera misión · borradores sincronizados para los ejercicios 3 y 5.
 * Las soluciones, el cotejo y los desbloqueos residen exclusivamente en Supabase.
 * El cliente solo almacena desplazamientos comprobados por revisión y autor. */
export function createMission1DraftSync({client,teamId,exercise,onDraft,onStatus,onCompleted=()=>{}}){
 if(![3,5].includes(exercise)||!teamId||!client)throw Error('Borrador de misión inválido');
 let current={},revision=0,ready=false,busy=false,loading=false,dirty=false,alive=true;
 let channel=null;
 const clone=places=>Object.fromEntries(Object.entries(places||{})
   .filter(([key,value])=>typeof key==='string'&&typeof value==='string'));
 const state=()=>({ready,busy,revision,placements:{...current}});
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
   try{
     const {data,error}=await client.from('mission1_team_drafts')
       .select('placements,revision').eq('team_id',teamId)
       .eq('exercise',exercise).maybeSingle();
     if(error)throw error;
     ready=true;
     apply(data||{placements:{},revision:0});
     tell('Taldearen zirriborroa prest dago.','ready');
     return true;
   }catch(e){
     console.error('M1 borrador · kargatu',e);
     ready=false;tell('Konexioa eten da. Berriro konektatzen saia zaitez.','error');
     return false;
   }finally{
     loading=false;
     if(alive&&dirty&&!busy){dirty=false;void load()}
   }
 }
 async function act(rpc,args){
   if(!alive||!ready||busy){tell('Lehenik, berreskuratu taldearen konexioa.','error');return false}
   busy=true;tell('Aldaketa gordetzen…','saving');
   try{
     const {data,error}=await client.rpc(rpc,{p_exercise:exercise,...args});
     if(error)throw error;
     if(!data||typeof data.status!=='string')throw Error('Erantzun-formatu baliogabea');
     if(data.status==='conflict'){
       apply(data);
       tell('Taldekide baten aldaketak kargatu dira. Berrikusi kokapenak.','conflict');
       return false;
     }
     if(data.status==='completed'){
       apply(data);onCompleted();
       tell('Ariketa hau taldeak dagoeneko gainditu du.','completed');
       return false;
     }
     if(data.status!=='saved')throw Error('Borradorra ez da gorde');
     apply(data);tell('✓ Taldearen lana gordeta.','saved');
     return true;
   }catch(e){
     console.error('M1 borrador · gorde',e);
     ready=false;tell('Ezin izan da gorde. Konexioa berreskuratu eta egiaztatu.','error');
     return false;
   }finally{
     busy=false;paint();
     if(alive&&dirty){dirty=false;void load()}
   }
 }
 async function move(item,to,expected){
   return act('mission1_draft_move',{
     p_item:item,p_to_slot:to??null,p_expected_slot:expected??null
   });
 }
 async function reset(){
   return act('mission1_draft_reset',{p_revision:revision});
 }
 async function submit(){
   if(!alive||!ready||busy)throw Error('Ezin da egiaztatu konexiorik gabe');
   busy=true;tell('Taldearen erantzunak egiaztatzen…','saving');
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
 function refreshed(){if(document.hidden)return;void load()}
 function connected(){void load()}
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
   return load();
 }
 function stop(){
   alive=false;
   window.removeEventListener('focus',refreshed);
   window.removeEventListener('online',connected);
   document.removeEventListener('visibilitychange',refreshed);
   if(channel)void client.removeChannel(channel);
   channel=null;
 }
 return {start,stop,load,move,reset,submit,get ready(){return ready&&!busy},
   get revision(){return revision},get placements(){return {...current}}};
}
