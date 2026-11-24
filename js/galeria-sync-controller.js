/* Sincronización real de la mesa del equipo.
   Sin información de aciertos: el servidor guarda SOLO colocaciones provisionales. */
export function createGallerySyncController({adapter,state,items,zones,draftKey,draw,saveLocal,onCompleted}){
 const allowed=new Set(items.map(x=>x.id));
 const activeZones=new Set(zones);
 const pendingKey=draftKey?draftKey+':shared-pending':null;
 let alive=true,unsub=null,interval=null,inRefresh=false,recheck=false,connecting=false,revision=0,ready=false;
 let pending=null;
 const normalize=data=>Object.fromEntries(
   Object.entries(data&&typeof data==='object'&&!Array.isArray(data)?data:{})
     .filter(([id,zone])=>allowed.has(id)&&activeZones.has(zone))
 );
 if(pendingKey)try{
   const p=JSON.parse(localStorage.getItem(pendingKey)||'null');
   if(p&&allowed.has(p.id)
     &&(p.zone===null||activeZones.has(p.zone))
     &&(p.expected===null||activeZones.has(p.expected)))
     pending=p;
 }catch(e){console.warn('Borrador lokala ezin izan da irakurri',e)}
 const clearPending=()=>{
   pending=null;
   if(pendingKey)try{localStorage.removeItem(pendingKey)}catch(e){console.warn(e)}
 };
 const setPending=p=>{
   pending=p;
   if(pendingKey)try{localStorage.setItem(pendingKey,JSON.stringify(p))}catch(e){console.warn(e)}
 };
 const apply=data=>{
   if(!alive||!data)return;
   const rev=Number(data.revision);
   if(Number.isSafeInteger(rev)&&rev>=0)revision=rev;
   if(data.placements&&typeof data.placements==='object')
     state.placements=normalize(data.placements);
   if(data.completed||data.status==='completed'){
     state.completed=true;
     state.locked=new Set(items.map(x=>x.id));
   }
   state.selected=null;
   saveLocal();
 };
 const notifyDone=()=>{
   if(typeof onCompleted==='function')
     void Promise.resolve().then(()=>onCompleted()).catch(console.error);
 };
 async function handleResult(result){
   if(!alive)return;
   if(result?.status==='completed'||result?.completed===true){
     try{apply(await adapter.load())}catch(e){console.warn(e)}
     state.completed=true;state.locked=new Set(items.map(x=>x.id));
     state.feedback='Zuen taldeak ariketa gainditu du. Aurrerapena eguneratuta.';
     clearPending();saveLocal();notifyDone();return;
   }
   if(result?.status==='conflict'){
     apply(result);clearPending();
     state.feedback='Taldekide batek aldaketa egin du. Azken bertsioa kargatu da; berrikusi.';
     return;
   }
   if(['saved','exists','imported'].includes(result?.status)){
     apply(result);clearPending();
     state.feedback='';return;
   }
   throw Error('Sinkronizazio-erantzun baliogabea');
 }
 const fail=(error,message)=>{
   console.error('Galeria taldeko sinkronizazioa',error);
   ready=false;state.feedback=message;
 };
 async function commitOperation(op){
   if(!alive)return;
   state.busy=true;draw();
   try{
     const result=await adapter.move(op.id,op.zone,op.expected);
     if(!alive)return;
     await handleResult(result);
     ready=true;
     return result?.status==='saved';
   }catch(e){
     if(alive)fail(e,'Konexio-arazoa. Gorde gabeko aldaketa dago. Sakatu «Berriro konektatu».');
   }finally{
     if(alive){state.busy=false;draw();if(recheck&&ready)void refresh()}
   }
 }
 function move(id,zone){
   if(!alive||!ready||state.busy||state.completed||!allowed.has(id)
     ||(zone!==null&&!activeZones.has(zone)))return;
   const expected=state.placements[id]??null;
   state.selected=null;
   if(expected===zone){draw();return}
   if(zone===null)delete state.placements[id];else state.placements[id]=zone;
   state.feedback='';
   const op={id,zone,expected};
   setPending(op);saveLocal();
   return commitOperation(op);
 }
 async function reset(){
   if(!alive||!ready||state.busy||state.completed)return;
   state.busy=true;draw();
   try{
     const result=await adapter.reset(revision);
     if(!alive)return;
     await handleResult(result);
     if(result?.status==='saved')state.feedback='Taldearen mahaia berrabiarazi da. Gordeta.';
     ready=true;
   }catch(e){
     if(alive)fail(e,'Ezin izan da mahaia berrabiarazi. Berriro konektatu.');
   }finally{if(alive){state.busy=false;draw()}}
 }
 async function connect(){
   if(!alive||state.busy||connecting)return;
   connecting=true;
   ready=false;draw();
   try{
     let data=await adapter.load();
     if(!alive)return;
     if(!data.exists&&!data.completed){
       const localDraft=normalize(state.placements);
       // No escribir un borrador vacío al entrar: el primer movimiento
       // crea la fila de forma atómica; solo se importan borradores reales.
       if(Object.keys(localDraft).length){
         data=await adapter.importLocal(localDraft);
         if(!alive)return;
       }
     }
     if(data.completed){
       const becameDone=!state.completed;
       apply(data);clearPending();
       if(becameDone)notifyDone();
     }else if(pending){
       state.busy=true;
       try{
         await handleResult(await adapter.move(pending.id,pending.zone,pending.expected));
         if(!alive)return;
       }finally{state.busy=false}
     }else apply(data);
     ready=true;draw();
   }catch(e){
     if(alive){fail(e,'Ezin izan da taldearen lana kargatu. Sakatu «Berriro konektatu».');draw()}
   }finally{
     connecting=false;
     if(alive)draw();
     if(alive&&ready&&recheck&&!state.busy){
       recheck=false;
       void refresh();
     }
   }
 }
 async function refresh(){
   if(!alive||!ready||pending)return;
   if(inRefresh||state.busy){recheck=true;return}
   inRefresh=true;recheck=false;
   try{
     const next=await adapter.load();
     if(!alive)return;
     if(state.busy){recheck=true;return}
     if(next.completed&&!state.completed){
       apply(next);state.feedback='Zuen taldeak ariketa gainditu du.';
       draw();notifyDone();
     }else if(Number(next.revision)>revision){
       apply(next);
       state.feedback='Taldekideen aldaketak sinkronizatuta.';
       draw();
     }
   }catch(e){console.warn('Taldeko berrikuspena ezin izan da eguneratu',e)}
   finally{
     inRefresh=false;
     // Una notificación recibida durante la consulta no se pierde. Sin
     // esto, un compañero puede tardar hasta el siguiente sondeo en verla.
     if(alive&&recheck&&ready&&!state.busy&&!pending){
       recheck=false;
       void refresh();
     }
   }
 }
 const focus=()=>{if(ready)void refresh();else if(!state.busy)void connect()};
 function start(){
   if(!alive)return;
   unsub=adapter.subscribe(()=>void refresh());
   interval=window.setInterval(focus,12000);
   window.addEventListener('focus',focus);
   window.addEventListener('online',focus);
   void connect();
 }
 function stop(){
   alive=false;
   if(unsub)unsub();
   if(interval!==null)window.clearInterval(interval);
   window.removeEventListener('focus',focus);
   window.removeEventListener('online',focus);
 }
 return {start,stop,move,reset,refresh,connect,apply,handleResult,
   submit:()=>adapter.submit(revision),
   get ready(){return ready},
   get connecting(){return connecting},
   get revision(){return revision},
   get pending(){return !!pending}
 };
}
