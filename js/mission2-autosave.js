/* Misión 2 · autosalvado de borradores del equipo.
 * Envía únicamente las elecciones provisionales; nunca contiene soluciones.
 * Los cambios pendientes permanecen en este dispositivo hasta que Supabase
 * confirme su recepción. La fuente compartida es la tabla con RLS.
 */
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function mergeMission2Patch(base,patch){
 const result={...(object(base)?base:{})};
 for(const [key,value] of Object.entries(object(patch)?patch:{})){
  if((key==='assignments'||key==='multi')&&object(value)){
   const next={...(object(result[key])?result[key]:{})};
   for(const [field,chosen] of Object.entries(value)){
    if(chosen===null)delete next[field];else next[field]=chosen;
   }
   result[key]=next;
  }else if(value===null)delete result[key];
  else result[key]=value;
 }
 return result;
}
function combineEntries(previous,next){
 if(!previous||next.reset)return {reset:!!next.reset,patch:next.patch||{}};
 // Mantener los null: indican que hay que retirar una tarjeta previamente guardada.
 const patch={...previous.patch,...next.patch};
 for(const name of ['assignments','multi']){
  if(object(previous.patch[name])&&object(next.patch[name]))
   patch[name]={...previous.patch[name],...next.patch[name]};
 }
 return {reset:!!previous.reset,patch};
}
export function createMission2Autosave({client,teamId,userId,onRestore,onStatus,onCompleted=()=>{},canRefresh=()=>true}){
 if(!client||!teamId||!userId)throw Error('Taldearen saioa falta da');
 const key='inperialismoa:m2:unsent:'+teamId+':'+userId;
 let entries={};
 try{
  const raw=JSON.parse(localStorage.getItem(key)||'{}');
  if(object(raw))for(const [id,entry] of Object.entries(raw)){
   if([1,2,3,4,5].includes(Number(id))&&object(entry)&&object(entry.patch))
    entries[id]={reset:entry.reset===true,patch:entry.patch};
  }
 }catch(e){console.warn('M2: tokiko borradorra ezin izan da irakurri',e)}
 let timer=null,working=false,loading=false,alive=true,failed=false,hasRestored=false,inFlightId=null,afterFlight=null;
 const busy=()=>Object.keys(entries).length>0;
 let localDurable=busy();
 const persist=()=>{
  try{
   if(busy())localStorage.setItem(key,JSON.stringify(entries));
   else localStorage.removeItem(key);
   localDurable=busy();
  }catch(e){localDurable=false;console.warn('M2: azken mugimendua ezin izan da gailuan gorde',e)}
 };
 const status=(message,kind)=>{if(alive)onStatus(message,kind)};
 function schedule(delay=250){
  if(timer!==null)clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;void flush()},delay);
 }
 function queue(exercise,patch){
  if(!alive||![1,2,3,4,5].includes(exercise)||!object(patch))return;
  const next={reset:false,patch};
  entries[exercise]=combineEntries(entries[exercise],next);
  if(String(exercise)===inFlightId)afterFlight=combineEntries(afterFlight,next);
  failed=false;persist();status('Aldaketak gordetzen…','saving');schedule();
 }
 function reset(exercise){
  if(!alive||![1,2,3,4,5].includes(exercise))return;
  entries[exercise]={reset:true,patch:{}};
  if(String(exercise)===inFlightId)afterFlight={reset:true,patch:{}};
  failed=false;persist();status('Aldaketak gordetzen…','saving');schedule(10);
 }
 async function flush(){
  if(!alive||working||!busy())return;
  if(loading){schedule(100);return}
  working=true;failed=false;
  try{
   for(const id of Object.keys(entries).sort()){
    if(!alive)break;
    const entry=entries[id];
    if(!entry)continue;
    inFlightId=id;afterFlight=null;
    const {data,error}=await client.rpc('save_mission2_team_draft',{
     p_exercise:Number(id),p_patch:entry.patch,p_reset:entry.reset
    });
    if(error)throw error;
    if(!data||!['saved','completed'].includes(data.status))throw Error('Gordetze-erantzun baliogabea');
    // El servidor confirmó este envío; no reenviar campos antiguos al guardar cambios nuevos.
    if(afterFlight&&data.status!=='completed')entries[id]=afterFlight;else delete entries[id];
    inFlightId=null;afterFlight=null;
    if(alive&&data.status==='completed')onCompleted(Number(id));
    persist();
   }
   if(alive&&!busy())status('✓ Taldearen lana gordeta.','saved');
  }catch(e){
   console.error('M2: taldeko borradorra gordetzea',e);
   failed=true;
   status(localDurable?'Konexio-arazoa. Aldaketak gailuan gordeta daude; berriro konektatzean bidaliko dira.':'Konexio-arazoa. Aldaketak ez dira zerbitzarian edo gailuan baieztatu. Ez itxi orria.','error');
  }finally{
   working=false;inFlightId=null;afterFlight=null;
   if(alive&&busy()&&!failed)schedule(10);
  }
 }
 async function load(){
  if(!alive||loading||working||(hasRestored&&!canRefresh()))return false;
  loading=true;
  try{
   const {data,error}=await client.from('mission2_team_drafts')
    .select('exercise,answers').eq('team_id',teamId);
   if(error)throw error;
   const restored={};
   for(const row of data||[]){
    if([1,2,3,4,5].includes(Number(row.exercise))&&object(row.answers))
     restored[row.exercise]=row.answers;
   }
   for(const [id,entry] of Object.entries(entries)){
    restored[id]=mergeMission2Patch(entry.reset?{}:restored[id],entry.patch);
   }
   if(!alive||hasRestored&&!canRefresh())return false;
    hasRestored=true;onRestore(restored);
   if(busy()){status('Aurreko saioko aldaketak berreskuratzen…','saving');schedule(10)}
   else status('Taldearen lana sinkronizatuta.','ready');
   return true;
  }catch(e){
   console.error('M2: borradorrak berreskuratzea',e);
   if(alive&&!hasRestored){
    const local={};for(const [id,entry] of Object.entries(entries))local[id]=mergeMission2Patch({},entry.patch);
    hasRestored=true;onRestore(local);
   }
   status(busy()&&localDurable?'Konexio-arazoa. Gailuko aldaketak berreskuratu dira.':'Taldearen lana ezin izan da sinkronizatu. Egiaztatu konexioa.','error');
   return false;
  }finally{loading=false}
 }
 const onOnline=()=>{if(busy())schedule(10);else if(!working)void load()};
 const onVisible=()=>{if(document.visibilityState==='visible')onOnline()};
 const refreshTimer=setInterval(()=>{if(alive&&document.visibilityState==='visible'&&!working&&!loading){if(busy())schedule(10);else void load()}},5000);
 const onPageHide=()=>{if(busy())void flush()};
 window.addEventListener('online',onOnline);
 window.addEventListener('focus',onOnline);
 window.addEventListener('pagehide',onPageHide);
 document.addEventListener('visibilitychange',onVisible);
 async function flushConfirmed(){
   for(let i=0;i<80&&(working||loading)&&alive;i++)await new Promise(resolve=>setTimeout(resolve,100));
   if(!alive||working||loading)return false;
   if(busy())await flush();
   return alive&&!busy()&&!working;
  }
  return {load,queue,reset,flush,flushConfirmed,hasPending:busy,destroy(){
  alive=false;clearInterval(refreshTimer);if(timer!==null)clearTimeout(timer);
  window.removeEventListener('online',onOnline);
  window.removeEventListener('focus',onOnline);
  window.removeEventListener('pagehide',onPageHide);
  document.removeEventListener('visibilitychange',onVisible);
 }};
}
