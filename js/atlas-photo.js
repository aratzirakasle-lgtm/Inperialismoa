/* Reference artwork, with real expedition values layered above it.
   The original artwork is optional: if absent, keep the established atlas. */
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderAtlasPhoto({teamName,s,partial,mc,ec,preview,demo,archive,next,pending,canContinue,dateLabels}){
 const completed=n=>s.completedIds.includes(n);
 const status=n=>completed(n)?'OSATUTA':s.next===n?(s.steps[n-1]?.length?'MARTXAN':'HASI'):n>2?'PRESTATZEN':s.known[n-1]?'BLOKEATUTA':'EGIAZTATU GABE';
 const stamps=[1,2].map(n=>'<div class="ap-stamp ap-stamp-'+n+(completed(n)?' ap-earned':'')+'" aria-label="'+n+'. misioa: '+status(n)+'">'+(completed(n)?'<span class="ap-sr">'+n+'. MISIOA · OSATUTA</span>':'<div class="ap-stamp-ring"><b>'+n+'. MISIOA</b><span aria-hidden="true">'+(s.next===n?'✧':'◇')+'</span><strong>'+status(n)+'</strong></div>')+'</div><div class="ap-date ap-date-'+n+'">'+esc(completed(n)?dateLabels[n]||'Data egiaztatu gabe':s.next===n?'Ikerketa zabalik':'Zain')+'</div>'+(completed(n)?'':'<div class="ap-medal-mask ap-medal-'+n+'" aria-hidden="true"></div>')).join('');
 const cards=[1,2,3,4].map(n=>'<div class="ap-card ap-card-'+n+'" role="img" aria-label="'+n+'. misioa: '+status(n)+'" title="'+n+'. MISIOA · '+status(n)+'">'+((n<=2&&!completed(n))?'<div class="ap-card-shade" aria-hidden="true"></div><div class="ap-card-badge '+(s.next===n?'ap-active':'')+'">'+status(n)+'</div>':'')+'</div>').join('');
 const total=(n,max,id,label)=>'<div class="ap-number ap-number-'+id+'" title="'+esc(label)+(partial?' · Gutxienez':'')+'">'+(partial?'≥':'')+n+' / '+max+'</div><div class="ap-meter ap-meter-'+id+'" role="progressbar" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+n+'"><span style="width:'+Math.min(100,100*n/max)+'%"></span></div>';
 const actionText=canContinue?(s.steps[next-1]?.length?'JARRAITU':'HASI'):'MUSEORA ITZULI';
 return '<section class="atlas-photo" lang="eu" aria-label="Ikertzailearen atlasa"><img class="atlas-photo-img" src="./assets/atlas-reference.webp" alt="" decoding="async"><h2 class="ap-sr">Ikertzailearen atlasa</h2><div class="ap-team">'+esc(teamName)+'</div>'+((preview||demo)?'<div class="ap-notice">AURREBISTA · EZ DA GORDETZEN</div>':partial?'<div class="ap-notice">DATU BATZUK EGIAZTATU GABE</div>':'')+stamps+total(mc,4,'m','Misio osatuak')+total(ec,20,'e','Ariketa osatuak')+cards+
 '<details class="ap-archive"><summary aria-label="Ireki ikerketa-espedienteak"><span class="ap-sr">Ireki ikerketa-espedienteak</span></summary><div class="ap-archive-panel"><h3>IKERKETA-ESPEDIENTEAK</h3>'+archive+'</div></details>'+
 '<button type="button" class="ap-action '+(actionText==='JARRAITU'?'ap-action-original':'')+'" '+(canContinue?'data-atlas-continue="'+next+'" data-atlas-step="'+pending+'"':'data-atlas-close')+'><span>'+actionText+'</span></button><div class="ap-action-caption">'+(canContinue?next+'. MISIOA · '+pending+'. ARIKETA':partial?'AURRERAPENA EGIAZTATZEN':'HURRENGO ARETOA · PRESTATZEN')+'</div></section>';
}
export function activateAtlasPhoto(root){
 const shell=root?.querySelector('.atlas-reference-shell'),img=shell?.querySelector('.atlas-photo-img');
 if(!img)return;
 const ready=()=>{if(img.naturalWidth>0&&shell.isConnected)shell.classList.add('atlas-photo-ready')};
 img.addEventListener('load',ready,{once:true});
 if(img.complete)ready();
}
