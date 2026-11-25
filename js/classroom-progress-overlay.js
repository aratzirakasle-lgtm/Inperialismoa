/* Acceso discreto al marcador desde los ejercicios 2–5.
 * Lee solo una RPC autorizada por clase. No interfiere con los juegos.
 */
import { renderMission1ClassProgress, progressEyeMarkup } from './classroom-progress.js?v=20261125-eye1';
export function unmountClassroomProgressPanel(){
 const old=document.querySelector('.m1-class-widget');
 if(old?.__classProgressCleanup)old.__classProgressCleanup();
 else old?.remove();
}
export function mountClassroomProgressPanel(client,teamId,{missionId=1,target=null,preview=false}={}){
 const mission=missionId===2?2:1;
 if(!preview&&(!client||!teamId))return;
 unmountClassroomProgressPanel();
 if(!document.querySelector('link[href*="m1-classroom-progress.css"]')){
   const style=document.createElement('link');
   style.rel='stylesheet';
   style.href='./assets/m1-classroom-progress.css?v=20261125-eye1';
   document.head.append(style);
 }
 const root=document.createElement('aside');
 root.className='m1-class-widget'+(mission===2?' m2-class-widget':'')+(target?' m1-class-widget-inline':'');
 root.setAttribute('aria-label','Taldeen aurrerapena');
 root.innerHTML='<button type="button" class="m1-class-toggle" '+(target?'data-m1-class-progress="1" aria-haspopup="dialog" ':'')+'title="Ikusi gelako taldeen aurrerapena" aria-expanded="false" aria-controls="m1-class-panel">'+
   progressEyeMarkup+(target?'Taldeen aurrerapena':' TALDEEN AURRERAPENA')+'</button>'+
   '<div class="m1-class-panel" id="m1-class-panel" '+(target?'role="dialog" aria-label="Taldeen aurrerapena" ':'')+'hidden>'+
   '<div class="m1-class-panel-head"><strong>'+mission+'. MISIOA · TALDEAK</strong>'+
   '<button type="button" class="m1-class-close" aria-label="Itxi">×</button></div>'+
   '<div class="m1-class-panel-body"><p>Taldeen aurrerapena kargatzen…</p></div></div>';
 (target||document.body).append(root);
 const toggle=root.querySelector('.m1-class-toggle');
 const close=root.querySelector('.m1-class-close');
 const panel=root.querySelector('.m1-class-panel');
 const body=root.querySelector('.m1-class-panel-body');
 let open=false,alive=true,refreshing=false,pending=false,rows=[],hadError=false;
 function paint(){if(alive){
   const html=preview?'<p class="m1-class-empty">Irakaslearen aurrebista · ikaslearen saioan gelako taldeen benetako aurrerapena agertuko da.</p>':renderMission1ClassProgress(rows,{ownTeamId:teamId,error:hadError,missionId:mission,showEmblems:true});
   if(body.innerHTML!==html)body.innerHTML=html;
 }}
 async function refresh(){
   if(!alive||!open||preview)return;
   if(refreshing){pending=true;return}
   refreshing=true;
   try{
     const {data,error}=await client.rpc(mission===2?'mission2_class_progress_members':'mission1_class_progress_members');
     if(error)throw error;
     const list=Array.isArray(data)?data:[];const own=list.find(row=>String(row.team_id)===String(teamId));rows=own?list.filter(row=>String(row.class_id)===String(own.class_id)):[];
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
   if(next){paint();void refresh();if(target)close.focus()}else toggle.focus();
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
