/* Acceso discreto al marcador desde los ejercicios 2–5.
 * Lee solo una RPC autorizada por clase. No interfiere con los juegos.
 */
import { renderMission1ClassProgress } from './classroom-progress.js?v=20261123-aula1';
export function unmountClassroomProgressPanel(){
 const old=document.querySelector('.m1-class-widget');
 if(old?.__classProgressCleanup)old.__classProgressCleanup();
 else old?.remove();
}
export function mountClassroomProgressPanel(client,teamId){
 if(!client||!teamId)return;
 unmountClassroomProgressPanel();
 if(!document.querySelector('link[href*="m1-classroom-progress.css"]')){
   const style=document.createElement('link');
   style.rel='stylesheet';
   style.href='./assets/m1-classroom-progress.css?v=20261123-aula2';
   document.head.append(style);
 }
 const root=document.createElement('aside');
 root.className='m1-class-widget';
 root.setAttribute('aria-label','Taldeen aurrerapena');
 root.innerHTML='<button type="button" class="m1-class-toggle" aria-expanded="false" aria-controls="m1-class-panel">'+
   '<span aria-hidden="true">✓</span> TALDEEN AURRERAPENA</button>'+
   '<div class="m1-class-panel" id="m1-class-panel" hidden>'+
   '<div class="m1-class-panel-head"><strong>1. MISIOA · TALDEAK</strong>'+
   '<button type="button" class="m1-class-close" aria-label="Itxi">×</button></div>'+
   '<div class="m1-class-panel-body"><p>Taldeen aurrerapena kargatzen…</p></div></div>';
 document.body.append(root);
 const toggle=root.querySelector('.m1-class-toggle');
 const close=root.querySelector('.m1-class-close');
 const panel=root.querySelector('.m1-class-panel');
 const body=root.querySelector('.m1-class-panel-body');
 let open=false,alive=true,refreshing=false,pending=false,rows=[],hadError=false;
 function paint(){if(alive){
   const html=renderMission1ClassProgress(rows,{ownTeamId:teamId,error:hadError});
   if(body.innerHTML!==html)body.innerHTML=html;
 }}
 async function refresh(){
   if(!alive||!open)return;
   if(refreshing){pending=true;return}
   refreshing=true;
   try{
     const {data,error}=await client.rpc('mission1_class_progress');
     if(error)throw error;
     rows=Array.isArray(data)?data:[];
     hadError=false;
   }catch(e){
     hadError=true;
     console.warn('Taldeen aurrerapenaren kontsulta',e);
   }finally{
     refreshing=false;
     paint();
     if(pending&&alive){pending=false;void refresh()}
   }
 }
 function setOpen(next){
   open=next;panel.hidden=!next;toggle.setAttribute('aria-expanded',String(next));
   if(next){paint();void refresh()}else toggle.focus();
 }
 toggle.addEventListener('click',()=>setOpen(!open));
 close.addEventListener('click',()=>setOpen(false));
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.preventDefault();setOpen(false)}});
 const whenVisible=()=>{if(!document.hidden)void refresh()};
 const whenCompleted=()=>void refresh();
 window.addEventListener('focus',whenVisible);
 window.addEventListener('online',whenVisible);
 window.addEventListener('m1:progress-changed',whenCompleted);
 document.addEventListener('visibilitychange',whenVisible);
 const timer=setInterval(()=>{if(!document.hidden)void refresh()},15000);
 function cleanup(){
   if(!alive)return;
   alive=false;clearInterval(timer);
   window.removeEventListener('focus',whenVisible);
   window.removeEventListener('online',whenVisible);
   window.removeEventListener('m1:progress-changed',whenCompleted);
   document.removeEventListener('visibilitychange',whenVisible);
   root.remove();
 }
 root.__classProgressCleanup=cleanup;
 window.addEventListener('pagehide',cleanup,{once:true});
}
