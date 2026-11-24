/* Acceso discreto al marcador desde los ejercicios 2–5.
 * Lee solo una RPC autorizada por clase. No interfiere con los juegos.
 */
import { renderMission1ClassProgress } from './classroom-progress.js?v=20261124-m2board1';
export function unmountClassroomProgressPanel(){
 const old=document.querySelector('.m1-class-widget');
 if(old?.__classProgressCleanup)old.__classProgressCleanup();
 else old?.remove();
}
export function mountClassroomProgressPanel(client,teamId,{missionId=1}={}){
 const mission=missionId===2?2:1;
 if(!client||!teamId)return;
 unmountClassroomProgressPanel();
 if(!document.querySelector('link[href*="m1-classroom-progress.css"]')){
   const style=document.createElement('link');
   style.rel='stylesheet';
   style.href='./assets/m1-classroom-progress.css?v=20261124-m2board1';
   document.head.append(style);
 }
 const root=document.createElement('aside');
 root.className='m1-class-widget'+(mission===2?' m2-class-widget':'');
 root.setAttribute('aria-label','Taldeen aurrerapena');
 root.innerHTML='<button type="button" class="m1-class-toggle" aria-expanded="false" aria-controls="m1-class-panel">'+
   (mission===2?'<svg class="m2-class-trophy" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="17.5" fill="#392a1a" stroke="#dcb36a" stroke-width="1.2"/><circle cx="20" cy="20" r="14.5" fill="none" stroke="#98733c" stroke-width=".7"/><path d="M14 11H26V19C26 23 23 25 20 25S14 23 14 19Z" fill="#e2b75e" stroke="#fff0bf" stroke-width=".8"/><path d="M14 13H10V16C10 20 12 21 15 21M26 13H30V16C30 20 28 21 25 21" fill="none" stroke="#e8c779" stroke-width="1.8"/><path d="M20 25V29M16 29H24L26 32H14Z" fill="#e2b75e" stroke="#edcf86" stroke-width="1.3"/><path d="M20 14L21.1 17.2L24.5 17.2L21.8 19.2L22.8 22.4L20 20.5L17.2 22.4L18.2 19.2L15.5 17.2L18.9 17.2Z" fill="#795020"/></svg>':'<span aria-hidden="true">✓</span>')+' TALDEEN AURRERAPENA</button>'+
   '<div class="m1-class-panel" id="m1-class-panel" hidden>'+
   '<div class="m1-class-panel-head"><strong>'+mission+'. MISIOA · TALDEAK</strong>'+
   '<button type="button" class="m1-class-close" aria-label="Itxi">×</button></div>'+
   '<div class="m1-class-panel-body"><p>Taldeen aurrerapena kargatzen…</p></div></div>';
 document.body.append(root);
 const toggle=root.querySelector('.m1-class-toggle');
 const close=root.querySelector('.m1-class-close');
 const panel=root.querySelector('.m1-class-panel');
 const body=root.querySelector('.m1-class-panel-body');
 let open=false,alive=true,refreshing=false,pending=false,rows=[],hadError=false;
 function paint(){if(alive){
   const html=renderMission1ClassProgress(rows,{ownTeamId:teamId,error:hadError,missionId:mission});
   if(body.innerHTML!==html)body.innerHTML=html;
 }}
 async function refresh(){
   if(!alive||!open)return;
   if(refreshing){pending=true;return}
   refreshing=true;
   try{
     const {data,error}=await client.rpc(mission===2?'mission2_class_progress_members':'mission1_class_progress_members');
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
 window.addEventListener('m'+mission+':progress-changed',whenCompleted);
 document.addEventListener('visibilitychange',whenVisible);
 const timer=setInterval(()=>{if(!document.hidden)void refresh()},15000);
 function cleanup(){
   if(!alive)return;
   alive=false;clearInterval(timer);
   window.removeEventListener('focus',whenVisible);
   window.removeEventListener('online',whenVisible);
   window.removeEventListener('m'+mission+':progress-changed',whenCompleted);
   document.removeEventListener('visibilitychange',whenVisible);
   root.remove();
 }
 root.__classProgressCleanup=cleanup;
 window.addEventListener('pagehide',cleanup,{once:true});
}
