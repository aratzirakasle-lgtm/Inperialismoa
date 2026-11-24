/* Read-only atlas. Existing server records are the only source of timestamps. */
import {renderMuseumPassport,confirmedStamp,stampLabel} from './museum-passport.js?v=20261124-atlas1';
const titles=['Aurrekarriak eta oinarriak','Inperialismoaren faktoreak','Inperioen banaketa','Inperioen itzalak'];
const files=[['Potentzien galeriaren inbentarioa','Bi sistemen txostena','Inperialismoaren kontzeptu-fitxa','Inperioen espedienteak','Azken sintesiaren zigilua'],['Kausen kabinetea','Kapitalaren ibilbideak','Migrazioen liburua','Boterearen artxiboa','Esploratzaileen espedientea']];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids=[1,2,3,4,5],roman=['I','II','III','IV'];
export function completionRows(rows,team){
 if(!Array.isArray(rows))return null;
 const confirmed=new Map();
 for(const row of rows){
  if(String(row.team_id)!==String(team)||!ids.includes(Number(row.exercise)))continue;
  const n=Number(row.exercise),stamp=confirmedStamp(row.completed_at),old=confirmed.get(n);
  if(!confirmed.has(n)||stamp&&(!old||stamp<old))confirmed.set(n,stamp);
 }
 return confirmed;
}
export function expeditionSummary({team,m1=null,m2=null,m1Flags=null,mission2Open=false}={}){
 const one=completionRows(m1,team),two=completionRows(m2,team);
 const own=Array.isArray(m1Flags)?m1Flags.find(r=>String(r.team_id)===String(team)):null;
 const done1=one?.has(5)||own?.mission_completed===true;
 const steps1=done1?ids:own?ids.filter(n=>own['exercise_'+n]===true||one?.has(n)):null;
 const steps2=two?[...two.keys()].sort((a,b)=>a-b):null;
 const done2=steps2?.length===5;
 const completedIds=[...(done1?[1]:[]),...(done2?[2]:[])];
 const completedAt={1:done1?one?.get(5)||null:null,2:done2&&[...two.values()].every(Boolean)?[...two.values()].sort().at(-1):null};
 const known1=!!own||!!done1,known2=!!two;
 const next=known1&&!done1?1:done1&&known2&&!done2&&mission2Open?2:0;
 return {completedIds,completedAt,steps:[steps1,steps2,null,null],known:[known1,known2,false,false],next};
}
export async function readExpedition(client,team,{mission2Open=false}={}){
 const read=async f=>{try{const r=await f();return r.error?null:Array.isArray(r.data)?r.data:null}catch{return null}};
 const [m1,m2,m1Flags]=await Promise.all([
  read(()=>client.from('mission1_exercise_completions').select('team_id,exercise,completed_at').eq('team_id',team)),
  read(()=>client.from('mission2_exercise_completions').select('team_id,exercise,completed_at').eq('team_id',team)),
  read(()=>client.rpc('mission1_class_progress_members',{}))
 ]);
 return expeditionSummary({team,m1,m2,m1Flags,mission2Open});
}
export function renderExpedition({teamName='Taldea',summary=null,preview=false,demo=false}={}){
 const s=summary||{completedIds:[],completedAt:{},steps:[null,null,null,null],known:[false,false,false,false],next:0};
 const partial=!s.known[0]||!s.known[1],mc=s.completedIds.length,ec=s.steps.slice(0,2).reduce((a,b)=>a+(b?.length||0),0);
 const count=n=>partial?'Gutxienez '+n:n;
 const compass='<svg class="atlas-compass" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#493921" stroke="#d9b66d" stroke-width="2"/><circle cx="50" cy="50" r="39" fill="#e4c48b" stroke="#98713c" stroke-width="2"/><path d="M50 14l7 29 29 7-29 7-7 29-7-29-29-7 29-7Z" fill="#76522d" stroke="#493921"/><path d="M50 18l-7 32h7Z" fill="#8c3829"/><circle cx="50" cy="50" r="4" fill="#c0a05c"/><text x="50" y="11" text-anchor="middle" font-size="8" fill="#f1d99d">N</text></svg>';
 const lock='<svg class="atlas-lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="4" y="9" width="16" height="13" rx="2" fill="currentColor"/><path d="M12 14v4" stroke="#302a20" stroke-width="2"/></svg>';
 const missions=titles.map((title,i)=>{
  const n=i+1,done=s.completedIds.includes(n),steps=s.steps[i],active=s.next===n;
  const state=done?'OSATUTA':active?(steps?.length?'MARTXAN':'HASI'):n>2?'PRESTATZEN':!s.known[i]?'EGIAZTATU GABE':'BLOKEATUTA';
  const cls=done?'done':active?'active':n>2||s.known[i]?'locked':'unknown';
  const stamp=done&&!preview&&!demo?stampLabel(s.completedAt[n]):null;
  return '<article class="atlas-mission is-'+cls+'"><div class="atlas-mission-head"><span class="atlas-roman">'+roman[i]+'</span><div><small>'+state+'</small><h3>'+esc(title)+'</h3></div>'+(cls==='locked'?lock:done?'<span class="atlas-earned" aria-hidden="true">✓</span>':'')+'</div>'+
   (n<=2?'<ol class="atlas-steps" aria-label="Ariketen aurrerapena">'+ids.map(k=>'<li class="'+(steps?.includes(k)?'sealed':'')+'" title="'+esc(files[i][k-1])+'"><span aria-hidden="true">'+(steps?.includes(k)?'✓':steps?k:'?')+'</span><span class="atlas-sr">'+esc(files[i][k-1])+' · '+(steps?.includes(k)?'Zigilatua':steps?'Zain':'Egiaztatu gabe')+'</span></li>').join('')+'</ol><p>'+(steps?steps.length+' / 5 ariketa osatuta':'Egiaztatu gabe')+'</p>':'<p>Aretoa prestatzen ari gara.</p>')+
   (stamp?'<time datetime="'+esc(stamp.iso)+'">'+esc(stamp.date)+' · '+esc(stamp.time)+' h</time>':'')+
   (active?'<button type="button" class="atlas-continue" data-atlas-continue="'+n+'" data-atlas-step="'+(ids.find(k=>!steps?.includes(k))||1)+'">'+(steps?.length?'JARRAITU':'HASI')+' →</button>':'')+'</article>';
 }).join('');
 const archive=files.map((list,i)=>'<section class="atlas-file"><h4>'+roman[i]+'. MISIOA</h4><ol>'+list.map((name,j)=>'<li class="'+(s.steps[i]?.includes(j+1)?'sealed':'')+'"><span>'+ (s.steps[i]?.includes(j+1)?'✓':s.steps[i]?'○':'?')+'</span>'+esc(name)+'</li>').join('')+'</ol></section>').join('');
 return '<section class="museum-expedition" lang="eu"><header class="atlas-header">'+compass+'<div><p>MUSEOKO KARTOGRAFIA · XIX. MENDEA</p><h2 id="modal-title">Ikertzailearen atlasa</h2><span>'+esc(teamName)+'</span></div></header>'+
 (preview||demo?'<p class="atlas-notice">AURREBISTA / SIMULAZIOA · Ez da ezer gordetzen.</p>':!summary?'<p role="status" class="atlas-notice">Aurrerapena kargatzen…</p>':partial?'<p role="status" class="atlas-notice">Datu batzuk egiaztatu gabe daude.</p>':'')+
 '<div class="atlas-desk"><div class="atlas-passport">'+renderMuseumPassport({teamName,completedIds:s.completedIds,completedAt:s.completedAt,otherUnknown:partial,preview:preview||demo})+'</div><div class="atlas-totals"><div class="atlas-map" aria-hidden="true"><img src="./assets/atlas-museum-world.svg" alt="" width="720" height="360"></div><h3>ESPEDIZIOAREN AURRERAPENA</h3><div><strong>'+count(mc)+' / 4 · '+(mc*25)+' %</strong><span>misio osatuta</span><meter min="0" max="4" value="'+mc+'"></meter></div><div><strong>'+count(ec)+' / 20 · '+(ec*5)+' %</strong><span>ariketa osatuta · 10 argitaratuta</span><meter min="0" max="20" value="'+ec+'"></meter></div><p>Orduak: Euskadiko tokiko ordua.</p></div></div><h3 class="atlas-section-title">IKERKETAREN IBILBIDEA</h3><div class="atlas-missions">'+missions+'</div><details class="atlas-archive"><summary>IKERKETA-ESPEDIENTEAK · '+count(ec)+' zigilu</summary><div>'+archive+'</div></details><footer><button type="button" data-atlas-close>← Museora itzuli</button></footer></section>';
}
