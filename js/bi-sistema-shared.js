/* Segunda sala: borrador cooperativo sin claves de respuesta. Solo estudiantes.
 * El servidor comprueba revisiones y aplica cambios atómicamente por equipo. */
export function createBiSistemaShared({client,teamId,userId,localDraft,onDraft,onStatus,onRemote}){
 let revision=0,ready=false,busy=false,active=true,loading=false,dirty=false;
 let channel=null,ticker=null,pending=null;
 const pendingKey='inperialismoa:bi:pending:'+teamId+':'+userId;
 try{
   const saved=JSON.parse(localStorage.getItem(pendingKey)||'null');
   if(saved&&['army','monarch','parliament','separation','rights','suffrage','socialist','case_monarch','case_rights'].includes(saved.id)
      &&(saved.zone===null||saved.zone==='auth'||saved.zone==='lib')
      &&(saved.expected===null||saved.expected==='auth'||saved.expected==='lib'))pending=saved;
 }catch(e){console.warn('Bi sistema: aldaketa lokala ezin da irakurri',e)}
 const savePending=op=>{
   pending=op;
   try{if(op)localStorage.setItem(pendingKey,JSON.stringify(op));else localStorage.removeItem(pendingKey)}
   catch(e){console.warn('Bi sistema: gailuko memoria',e)}
 };
 const draft=(data={})=>({
   revision:Number(data.revision)||0,
   placements:data.placements&&typeof data.placements==='object'&&!Array.isArray(data.placements)?data.placements:{},
   cases:data.cases&&typeof data.cases==='object'&&!Array.isArray(data.cases)?data.cases:{}
 });
 const apply=data=>{
   if(!active)return;
   const row=draft(data);revision=row.revision;
   onDraft(row);return row;
 };
 const call=async(name,args)=>{
   const {data,error}=await client.rpc(name,args);
   if(error)throw error;
   if(!data||typeof data!=='object')throw Error('Taldeko erantzun baliogabea');
   return data;
 };
 async function load({importLegacy=false}={}){
   if(!active)return;
   if(loading||busy){dirty=true;return}
   loading=true;
   try{
     const {data,error}=await client.from('bi_sistema_team_drafts')
       .select('team_id,revision,placements,cases').eq('team_id',teamId).maybeSingle();
     if(error)throw error;
     let snapshot=data;
     if(!snapshot&&importLegacy&&localDraft&&
       (Object.keys(localDraft.places||{}).length||Object.keys(localDraft.cases||{}).length)){
       snapshot=await call('bi_sistema_draft_import',{
         p_placements:localDraft.places||{},p_cases:localDraft.cases||{}
       });
     }
     if(!active)return;
     const next=draft(snapshot||{});
     const changed=!ready||next.revision!==revision;
     if(changed)apply(next);
     ready=true;
     if(changed)onStatus('Sinkronizatuta · taldearen mahai partekatua',false);
     if(pending){
       const saved=pending;
       // Reintentar exactamente la última acción no confirmada; si otro
       // compañero movió la cartela, el servidor devuelve un conflicto.
       queueMicrotask(()=>{if(active)void move(saved.id,saved.zone,saved.expected)});
     }
     if(changed)onRemote?.();
   }catch(e){
     ready=false;
     console.error('Bi sistema · karga',e);
     onStatus('Konexioa eten da. Sakatu «Berriro konektatu».',true);
   }finally{
     loading=false;
     if(active&&dirty&&!busy){dirty=false;void load()}
   }
 }
 async function move(id,zone,expected){
   if(!active||!ready||busy)return false;
   busy=true;onStatus('Aldaketa gordetzen…',false);
   savePending({id,zone,expected});
   try{
     const data=await call('bi_sistema_draft_move',{
       p_card_id:id,p_to_zone:zone,p_expected_zone:expected
     });
     if(!active)return false;
     apply(data);
     savePending(null);
     if(data.status==='conflict')onStatus('Taldekide batek txartela mugitu du. Berrikusi kokapena.',true);
     else if(data.status==='full')onStatus('Erakusleiho hau beteta dago.',true);
     else if(data.status==='locked')onStatus('Fase hau jada egiaztatuta dago.',false);
     else if(data.status==='completed')onStatus('Ariketa hau taldeak gainditu du.',false);
     else if(data.status==='saved')onStatus('Sinkronizatuta · taldearen mahai partekatua',false);
     else throw Error('Egoera ezezaguna');
     return data.status==='saved';
   }catch(e){
     if(!active)return false;
     ready=false;console.error('Bi sistema · gorde',e);
     onStatus('Konexio-arazoa. Aldaketa gailuan gordeta dago. Berriro konektatu.',true);
     return false;
   }finally{
     busy=false;
     if(active&&dirty){dirty=false;void load()}
   }
 }
 async function reset(){
   if(!active||!ready||busy)return false;
   busy=true;
   try{
     const data=await call('bi_sistema_draft_reset',{p_revision:revision});
     if(!active)return false;
     apply(data);savePending(null);
     if(data.status==='conflict')onStatus('Beste ikasle batek aldaketa egin du; eguneratu da.',true);
     else onStatus('Taldearen mahai partekatua berrabiarazita.',false);
     return data.status==='saved';
   }catch(e){
     ready=false;console.error('Bi sistema · reset',e);
     onStatus('Ezin izan da taldea berrabiarazi. Berriro konektatu.',true);
     return false;
   }finally{
     busy=false;if(active&&dirty){dirty=false;void load()}
   }
 }
 async function submit(phase){
   if(!active||!ready||busy)throw Error('Ez dago konexiorik');
   busy=true;
   try{
     const data=await call('bi_sistema_draft_submit',{
       p_phase:phase,p_revision:revision
     });
     if(active)apply(data);
     if(data.status==='conflict'){
       onStatus('Beste ikasle batek aldaketa egin du. Egiaztatu berriro.',true);
     }
     return data;
   }catch(e){
     if(active){ready=false;onStatus('Konexio-arazoa. Berriro konektatu.',true)}
     throw e;
   }finally{
     busy=false;if(active&&dirty){dirty=false;void load()}
   }
 }
 function start(){
   if(!active)return;
   channel=client.channel('bi-sistema-draft-'+teamId)
     .on('postgres_changes',{event:'*',schema:'public',table:'bi_sistema_team_drafts',
       filter:'team_id=eq.'+teamId},()=>{if(busy||loading)dirty=true;else void load()})
     .on('postgres_changes',{event:'*',schema:'public',table:'bi_sistema_team_state',
       filter:'team_id=eq.'+teamId},()=>{
         onRemote?.();
         if(busy||loading)dirty=true;else void load();
       })
     .subscribe();
   const focus=()=>{if(active&&!document.hidden)void load()};
   window.addEventListener('focus',focus);
   window.addEventListener('online',focus);
   document.addEventListener('visibilitychange',focus);
   ticker=window.setInterval(()=>{if(active&&!document.hidden)void load()},12000);
   void load({importLegacy:true});
   return ()=>{
     active=false;if(ticker!==null)window.clearInterval(ticker);
     window.removeEventListener('focus',focus);
     window.removeEventListener('online',focus);
     document.removeEventListener('visibilitychange',focus);
     if(channel)void client.removeChannel(channel);
   };
 }
 return {start,load,move,reset,submit,
   get ready(){return ready},get busy(){return busy},get revision(){return revision}
 };
}
