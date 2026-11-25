/* Photo-first atlas: a cleaned native-resolution scene plus confirmed live data.
   No sample dates, progress or rewards are shown on the base image. */
import {renderAtlasSignatures} from './museum-passport.js?v=20261125-pulido32';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rects={s1:[25.9709,29.7414,7.8883,13.4698],s2:[34.0413,29.0948,7.6456,13.4698],d1:[26.7597,44.181,7.0995,2.2629],d2:[34.6481,43.1034,7.0995,2.1552],med1:[28.7621,60.1293,4.915,14.4397],med2:[35.4369,59.5905,5.0364,14.2241],b1:[47.7549,63.7931,9.1626,5.4957],b2:[59.4053,63.7931,9.2233,5.3879]};
const box=r=>'left:'+r[0]+'%;top:'+r[1]+'%;width:'+r[2]+'%;height:'+r[3]+'%';
const sprite=(key,cls)=>{const r=rects[key];return '<span class="ap-sprite '+cls+'" style="'+box(r)+';background-size:'+10000/r[2]+'% '+10000/r[3]+'%;background-position:'+100*r[0]/(100-r[2])+'% '+100*r[1]/(100-r[3])+'%" aria-hidden="true"></span>'};
// Original frame openings measured in the 1672 × 941 reference, independent of image resolution.
const artworkRects=[[790,493,168,121],[987,493,168,121],[1182,493,169,117],[1376,493,169,117]];
const artworkPath=n=>'./assets/atlas-mission-vivid-'+n+'.webp';
const nativeRect=([x,y,w,h])=>[100*x/1672,100*y/941,100*w/1672,100*h/941];
const artLock=(n)=>{
 const r=n===3?nativeRect([1254,578,27,33]):nativeRect([1448,578,27,33]);
 return '<span class="ap-sprite ap-art-lock" style="'+box(r)+';background-size:'+10000/r[2]+'% '+10000/r[3]+'%;background-position:'+100*r[0]/(100-r[2])+'% '+100*r[1]/(100-r[3])+'%" aria-hidden="true"></span>';
};
const artwork=n=>'<img class="ap-mission-artwork'+(n>2?' ap-art-locked':'')+'" style="'+box(nativeRect(artworkRects[n-1]))+'" src="'+artworkPath(n)+'" width="1619" height="971" alt="" decoding="async">'+(n>2?artLock(n):'');
// Explicit local timestamp format; independent of browser locale support.
const printedDate=iso=>{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));
 const get=k=>parts.find(p=>p.type===k)?.value||'';
 return get('year')+'-'+get('month')+'-'+get('day')+' · '+get('hour')+':'+get('minute');
};
export function renderAtlasPhoto({teamName,memberNames=[],s,partial,mc,ec,preview,demo,archive,next,pending,canContinue,dateLabels,titles,files,loading=false}){
 const signatures=renderAtlasSignatures(memberNames);
 const completed=n=>s.completedIds.includes(n);
 const status=n=>completed(n)?'OSATUTA':s.next===n?(s.steps[n-1]?.length?'MARTXAN':'HASI'):n>2?'PRESTATZEN':s.known[n-1]?'BLOKEATUTA':'EGIAZTATU GABE';
 const stamps=[1,2].map(n=>{
  const won=completed(n),date=won&&!preview&&!demo?dateLabels[n]:null;
  return (won?sprite('s'+n,'ap-earned-seal'):'<span class="ap-seal-state ap-seal-'+n+'">'+esc(status(n))+'</span>')+
   '<span class="ap-sr">'+n+'. MISIOA · '+esc(status(n))+'</span>'+
   '<span class="ap-date ap-date-'+n+'" style="'+box(rects['d'+n])+'">'+(date?'<time datetime="'+esc(date.iso)+'">'+esc(printedDate(date.iso))+'</time>':esc(won?(preview||demo?'AURREBISTA':'Data egiaztatu gabe'):s.next===n?'Ikerketa zabalik':s.known[n-1]?'Zain':'Egiaztatu gabe'))+'</span>'+
   (won?sprite('med'+n,'ap-earned-medal ap-earned-medal-'+n)+'<span class="ap-sr">'+n+'. misioaren domina</span>':'');
 }).join('');
 const cards=[1,2,3,4].map(n=>{
  const won=completed(n),state=status(n),steps=s.steps[n-1],active=s.next===n;
  const label=n<=2?(won?sprite('b'+n,'ap-earned-badge'):'<span class="ap-card-label ap-label-'+n+(active?' ap-label-active':'')+'" style="'+box(rects['b'+n])+'"><span>'+esc(state)+'</span></span>'):'';
  const list=n<=2?'<ol>'+files[n-1].map((name,i)=>'<li><span aria-hidden="true">'+(steps?.includes(i+1)?'✓':steps?'○':'?')+'</span>'+esc(name)+'<span class="ap-sr"> · '+(steps?.includes(i+1)?'Zigilatua':steps?'Zain':'Egiaztatu gabe')+'</span></li>').join('')+'</ol>':'<p>Aretoa prestatzen ari gara.</p>';
  return artwork(n)+label+'<details class="ap-card ap-card-'+n+(active?' ap-current':'')+'"><summary aria-label="'+n+'. misioa · '+esc(titles[n-1])+' · '+esc(state)+'"></summary><section class="ap-card-panel"><h3>'+n+'. MISIOA · '+esc(titles[n-1])+'</h3><p><strong>'+esc(state)+'</strong>'+(n<=2?' · '+(steps?steps.length+' / 5 ariketa':'Egiaztatu gabe'):'')+'</p><figure class="ap-art-preview"><img src="'+artworkPath(n)+'" width="1619" height="971" alt="" loading="lazy"><figcaption>AA bidez sortutako ilustrazio historikoa; ez da garaiko iturria.</figcaption></figure>'+list+'</section></details>';
 }).join('');
 const total=(n,max,id,label)=>'<span class="ap-number ap-number-'+id+'">'+(partial?'≥ ':'')+n+' / '+max+'</span><div class="ap-meter ap-meter-'+id+'" role="progressbar" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+n+'" aria-valuetext="'+(partial?'Gutxienez ':'')+n+' / '+max+'"><span style="width:'+Math.min(100,100*n/max)+'%"></span></div>';
 const actionText=canContinue?(s.steps[next-1]?.length?'JARRAITU':'HASI'):'Museora itzuli';
 return '<section class="atlas-photo" lang="eu" aria-labelledby="modal-title"><img class="atlas-photo-img" src="./assets/atlas-escena-base-2x-v26.webp" alt="" width="3344" height="1882" decoding="async"><h2 id="modal-title" class="ap-sr">Ikertzailearen atlasa</h2><span class="ap-team">TALDEA · '+esc(teamName)+'</span>'+(signatures?'<div class="ap-signatures"><span class="ap-signature-paper" aria-hidden="true"></span>'+signatures+'</div>':'')+((preview||demo)?'<span class="ap-notice">AURREBISTA · EZ DA GORDETZEN</span>':loading?'<span class="ap-notice" role="status">Aurrerapena kargatzen…</span>':partial?'<span class="ap-notice" role="status">DATU BATZUK EGIAZTATU GABE</span>':'')+
 stamps+'<span class="ap-sr">3. MISIOA · PRESTATZEN; 4. MISIOA · PRESTATZEN</span>'+'<span class="ap-progress-label ap-progress-label-m">Misio osatuta</span><span class="ap-progress-label ap-progress-label-e">Ariketa osatuta</span>'+total(mc,4,'m','Misio osatuta')+total(ec,20,'e','Ariketa osatuta')+cards+
 '<details class="ap-archive"><summary aria-label="Ireki ikerketa-espedienteak"></summary><div class="ap-archive-panel"><h3>IKERKETA-ESPEDIENTEAK</h3><p>'+ (partial?'Gutxienez ':'')+ec+' zigilu · 10 ariketa argitaratuta</p>'+archive+'</div></details>'+
 '<span class="ap-action-enamel" aria-hidden="true"></span><button type="button" class="ap-action" '+(canContinue?'data-atlas-continue="'+next+'" data-atlas-step="'+pending+'"':'data-atlas-close')+'><span>'+actionText+'</span></button><span class="ap-caption-surface" aria-hidden="true"></span><span class="ap-action-caption">'+(canContinue?next+'. MISIOA · '+pending+'. ARIKETA':partial?'AURRERAPENA EGIAZTATZEN':'HURRENGO ARETOA · PRESTATZEN')+'</span></section>';
}
// Kept for callers using the old API; the photo now renders as a single view.
export function activateAtlasPhoto(root){
 const stage=root?.querySelector('.atlas-photo');
 if(!stage)return null;
 const panels=[...stage.querySelectorAll('.ap-card,.ap-archive')];
 for(const panel of panels)panel.addEventListener('toggle',()=>{if(panel.open)for(const other of panels)if(other!==panel)other.open=false;});
 return stage.querySelector('.atlas-photo-img');
}
