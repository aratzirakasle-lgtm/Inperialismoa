/* Shared, read-only museum portfolio. Class scope and progress come from existing RPCs.
 * No answer data, new grants, audio, local achievements or writes. */
import {renderMuseumPassport} from './museum-passport.js?v=3';
import {renderMission1ClassProgress} from './classroom-progress.js?v=20261124-m2board1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const archiveTitles=[
 ['Boterearen mapa','Bi sistema, bi Europa','Inperioaren giltzak','Kolonien espedienteak','Azken zigilua'],
 ['Kausen kabinetea','Kapitalaren ibilbideak','Migrazioen liburua','Boterearen artxiboa','Esploratzaileen espedientea']
];
let context=null,session=null;
export function walletButton(){return '<button class="museum-wallet-button" type="button" data-museum-wallet aria-haspopup="dialog"><span aria-hidden="true">▣</span> Ikertzailearen zorroa</button>'}
export function walletContext(next){
 if(!next||context?.client!==next.client||context?.team!==next.team||context?.preview!==next.preview||context?.mission!==next.mission)closeWallet();
 context=next;
}
export function closeWallet(){if(session){session.stop();session=null}const d=typeof document==='undefined'?null:document.querySelector('#museum-wallet-dialog');if(d){if(d.open)d.close();d.remove()}}
export function walletSummary(rowsByMission,team){
 return [1,2].map(m=>{
  const rows=rowsByMission[m];const row=Array.isArray(rows)?rows.find(r=>String(r.team_id)===String(team)):null;
  if(!row)return null;
  const steps=[1,2,3,4,5].filter(n=>row['exercise_'+n]===true);
  return {steps,completed:row.mission_completed===true,teamName:row.team_name};
 });
}
export function archiveMarkup(summary){
 return archiveTitles.map((titles,i)=>{
  const state=summary[i];return '<section class="mw-file"><h3>'+['I','II'][i]+'. MISIOA <small>'+(state?state.steps.length+' / 5':'Egiaztatu gabe')+'</small></h3><ol>'+titles.map((name,j)=>{
   const done=state?.steps.includes(j+1);return '<li class="'+(done?'mw-sealed':'')+'"><span aria-hidden="true">'+(done?'✓':String(j+1).padStart(2,'0'))+'</span><b>'+esc(name)+'</b><small>'+(done?'ZIGILATUA':state?'ZAIN':'—')+'</small></li>';
  }).join('')+'</ol></section>';
 }).join('')+'<p class="mw-future">III. eta IV. misioak · Prestatzen</p>';
}
function ensureStyle(){
 for(const [key,href] of [['wallet','./assets/museum-wallet.css?v=1'],['wallet-passport','./assets/museum-passport.css?v=3'],['wallet-class','./assets/m1-classroom-progress.css?v=20261124-m2board1']]){
  if(document.querySelector('link[data-museum-style="'+key+'"]')||Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l=>l.getAttribute('href')?.split('?')[0]===href.split('?')[0]))continue;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.museumStyle=key;document.head.append(link);
 }
}
export function prepareWallet(){if(typeof document!=='undefined')ensureStyle()}
export function openWallet(){
 if(!context||(!context.preview&&(!context.client||!context.team)))return;
 closeWallet();ensureStyle();const cfg=context,focus=document.activeElement;
 const d=document.createElement('dialog');d.id='museum-wallet-dialog';d.setAttribute('aria-labelledby','mw-title');
 d.innerHTML='<header><p>MUSEOKO ARTXIBOA</p><h2 id="mw-title">Ikertzailearen zorroa</h2><button type="button" data-mw-close aria-label="Itxi">×</button></header><nav aria-label="Zorroaren atalak"><button type="button" data-mw-tab="passport" aria-pressed="true">Pasaportea · Dominak</button><button type="button" data-mw-tab="archive" aria-pressed="false">Espedienteak</button><button type="button" data-mw-tab="class" aria-pressed="false" '+(cfg.preview?'disabled':'')+'>Taldeen aurrerapena</button><button type="button" data-mw-tab="help" aria-pressed="false">Nola jokatu</button></nav><p class="mw-status" role="status"></p><div class="mw-content"></div><footer><button type="button" data-mw-close>Itxi · Ikerketara itzuli</button></footer>';
 document.body.append(d);
 let active='passport',boardMission=cfg.mission===2?2:1,rows={},errors={},busy=false,alive=true,loading=!cfg.preview;
 const content=d.querySelector('.mw-content'),status=d.querySelector('.mw-status');
 function paint(){
  if(!alive)return;
  const summary=cfg.preview?[{steps:[],completed:false},{steps:[],completed:false}]:walletSummary(rows,cfg.team);
  const known=summary.every(Boolean);
  status.textContent=cfg.preview?'IRAKASLEAREN AURREBISTA · SIMULAZIOA':loading?'Aurrerapena kargatzen…':!known||Object.values(errors).some(Boolean)?'Datu batzuk ezin izan dira egiaztatu. Egiaztatutako zigiluak soilik agertzen dira.':'Zerbitzarian egiaztatutako aurrerapena.';
  let html='';
  if(active==='passport'){
   if(!known&&summary.every(s=>!s))html='<p>Pasaportea ezin da oraindik egiaztatu.</p>';
   else html=renderMuseumPassport({teamName:cfg.preview?'Probako taldea':summary.find(Boolean)?.teamName||'Taldea',completedIds:summary.flatMap((s,i)=>s?.completed?[i+1]:[]),preview:cfg.preview,otherUnknown:!known});
  }else if(active==='archive')html=archiveMarkup(summary);
  else if(active==='class'){
   html='<div class="mw-mission-tabs"><button type="button" data-mw-mission="1" aria-pressed="'+(boardMission===1)+'">I. misioa</button><button type="button" data-mw-mission="2" aria-pressed="'+(boardMission===2)+'">II. misioa</button></div>'+renderMission1ClassProgress(rows[boardMission]||[],{ownTeamId:cfg.team,missionId:boardMission,error:!!errors[boardMission]});
  }else html='<section class="mw-help"><h3>Nola jokatu</h3><p>Hautatu edo arrastatu elementuak, areto bakoitzeko jarraibideen arabera. Aukerak osatutakoan, sakatu «Egiaztatu».</p><p>Medailoiak: gorria uneko aretoa da; zigiluak gainditutako ariketak dira; giltzarrapoak blokeatutako aretoak dira.</p><p>Konexioa eteten bada, begiratu gordetze-mezua eta berriro konektatu. Ez itxi orria aldaketak gordetzen ari badira.</p><p>Laguntza honek ez du erantzun zuzenik edo akatsen inguruko pistarik ematen.</p></section>';
  if(content.innerHTML!==html){
   const focused=document.activeElement?.dataset?.mwMission;
   content.innerHTML=html;if(focused)content.querySelector('[data-mw-mission="'+focused+'"]')?.focus({preventScroll:true});
  }
 }
 async function refresh(){
  if(!alive||busy||cfg.preview||document.hidden)return;
  busy=true;
  try{await Promise.all([1,2].map(async m=>{
   try{const result=await cfg.client.rpc(m===1?'mission1_class_progress_members':'mission2_class_progress_members',{});if(result.error)throw result.error;if(!alive)return;const data=Array.isArray(result.data)?result.data:[];const own=data.find(r=>String(r.team_id)===String(cfg.team));if(!own)throw Error('team not returned');rows[m]=data.filter(r=>String(r.class_id)===String(own.class_id));errors[m]=false}
   catch{if(alive)errors[m]=true}
  }))}finally{busy=false;loading=false;paint()}
 }
 function stop(){alive=false;clearInterval(timer);window.removeEventListener('online',refresh);window.removeEventListener('m1:progress-changed',refresh);window.removeEventListener('m2:progress-changed',refresh)}
 const timer=cfg.preview?null:setInterval(refresh,15000);
 session={stop};
 d.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-mw-close')){d.close();return}
  if(b.dataset.mwTab){active=b.dataset.mwTab;d.querySelectorAll('[data-mw-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));paint()}
  if(b.dataset.mwMission){boardMission=Number(b.dataset.mwMission);paint()}
 });
 d.addEventListener('close',()=>{stop();if(session?.stop===stop)session=null;d.remove();if(focus?.isConnected)focus.focus({preventScroll:true})},{once:true});
 window.addEventListener('online',refresh);window.addEventListener('m1:progress-changed',refresh);window.addEventListener('m2:progress-changed',refresh);
 d.showModal();paint();void refresh();
}
if(typeof document!=='undefined')document.addEventListener('click',e=>{if(e.target.closest?.('[data-museum-wallet]'))openWallet()});
