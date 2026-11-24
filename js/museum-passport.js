// Recompensa visual derivada del progreso confirmado, sin escrituras ni nuevos permisos.
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roman=['I','II','III','IV'];
export function confirmedStamp(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!/(Z|[+-]\d{2}:?\d{2})$/i.test(value)||!Number.isFinite(Date.parse(value)))return null;
 return new Date(value).toISOString();
}
export function stampLabel(value,locale='eu-ES'){
 const stamp=confirmedStamp(value);if(!stamp)return null;
 const d=new Date(stamp);
 return {iso:stamp,date:new Intl.DateTimeFormat(locale,{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric'}).format(d),time:new Intl.DateTimeFormat(locale,{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(d)};
}
function stampDate(value){const stamp=stampLabel(value);return stamp?'<time class="mp-stamp-date" datetime="'+escapeHtml(stamp.iso)+'"><span>'+escapeHtml(stamp.date)+'</span><span>'+escapeHtml(stamp.time)+' h</span></time>':'<span class="mp-stamp-date mp-date-unknown">Data egiaztatu gabe</span>';}

function medal(mission=1){
 return `<svg class="mp-medal" viewBox="0 0 132 172" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M32 4H100L88 66 66 78 44 66Z" fill="${mission===2?'#254b6a':'#762e29'}" stroke="#bc9148" stroke-width="2"/><path d="M48 5H55L60 70 53 67ZM77 5H84L79 67 72 70Z" fill="#e8ce8b"/><path d="M62 68h8v13h-8z" fill="#94703a"/><path d="M66 77l9 6 11-1 6 10 11 4 1 11 8 8-4 11 4 10-8 8-1 11-11 4-6 10-11-1-9 6-9-6-11 1-6-10-11-4-1-11-8-8 4-10-4-11 8-8 1-11 11-4 6-10 11 1z" fill="#b68b42" stroke="#64451f" stroke-width="2"/><circle cx="66" cy="126" r="37" fill="#e7c77b" stroke="#795522" stroke-width="2"/><circle cx="66" cy="126" r="31" fill="#d4a75b" stroke="#f9e0a5" stroke-width="2"/><path d="${mission===2?'M66 113l3 10 12 3-12 3-3 13-3-13-12-3 12-3zM48 126a18 18 0 1 0 36 0a18 18 0 1 0-36 0':'M43 125l23-13 23 13zM46 128h40M48 146h36M43 150h46M51 131v13m10-13v13m10-13v13m10-13v13'}" fill="none" stroke="#64451f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M39 110l5-6m49 6-5-6" stroke="#fff1c5" stroke-width="2"/><text x="66" y="106" text-anchor="middle" font-size="11" font-family="Georgia,serif" fill="#62421d">${mission===2?'II':'I'}</text></svg>`;
}
export function renderMuseumPassport({teamName='Taldea',completedIds=[],preview=false,animate=false,animateMission=1,otherUnknown=false,completedAt={},variant='default',nextMission=0}={}){
 const earned=new Set(completedIds.filter(id=>[1,2,3,4].includes(id)));
 if(variant==='atlas'){
  const seals=roman.map((n,i)=>{
   const id=i+1,won=earned.has(id),available=nextMission===id;
   const mark=won?'ZIGILATUA':available?'MARTXAN':id>2?'PRESTATZEN':otherUnknown?'EGIAZTATU GABE':'ZAIN';
   return '<li class="mp-slot atlas-seal'+(won?' mp-earned':'')+(available?' is-current':'')+'"><span class="mp-stamp atlas-ink-stamp"><span class="mp-stamp-ring"><span>'+id+'. MISIOA</span><b>'+n+'</b><span>'+mark+'</span></span></span>'+(won&&!preview?stampDate(completedAt[id]):'<span class="atlas-seal-caption">'+(won?'OSATUTA':available?'Hurrengo zigilua':id>2?'Prestatzen':'Zain')+'</span>')+'</li>';
  }).join('');
  const medals=[1,2,3,4].filter(id=>earned.has(id));
  return '<section class="mp-passport atlas-book" aria-label="Ikerketa-pasaportea"><div class="atlas-book-spread"><div class="atlas-book-page atlas-identity"><div class="atlas-paper-frame"><span class="atlas-page-emblem" aria-hidden="true">✧</span><h3>IKERTZAILEAREN<br>PASAPORTEA</h3><div class="atlas-identity-photo" aria-hidden="true"><img src="./assets/m2-reference-port-photo.webp" alt="" width="232" height="190"></div><span class="atlas-team-label">TALDEA</span><strong class="atlas-team-name">'+escapeHtml(teamName)+'</strong><span class="atlas-signature">Inperialismoa</span><span class="atlas-page-caption">MUSEOKO ARTXIBOA · XIX. MENDEA</span></div></div><div class="atlas-book-page atlas-stamp-page"><div class="atlas-paper-frame"><h3>ESPEDIZIOAREN<br>ZIGILUAK ETA DOMINAK</h3><ol class="mp-stamps atlas-seals">'+seals+'</ol><div class="mp-medals atlas-medals">'+(medals.length?medals.map(id=>'<div>'+medal(id)+'<span class="mp-award">'+roman[id-1]+'. MISIOA</span></div>').join(''):'<span class="atlas-medals-empty">Dominak misioak amaitzean lortuko dituzue.</span>')+'</div><span class="atlas-page-caption">'+earned.size+' / 4 · MISIO OSATUTA</span></div></div></div></section>';
 }
 const slots=roman.map((n,i)=>{
   const won=earned.has(i+1);
   return `<li class="mp-slot${won?' mp-earned':''}${won&&i===animateMission-1&&animate?' mp-imprint':''}"><span class="mp-stamp"><span class="mp-stamp-ring"><span>${won?'MUSEOA':'MISIOA'}</span><b>${n}</b><span>${won?'ZIGILATUA':'· · ·'}</span></span></span><span class="mp-slot-label">${won?'Lortuta':otherUnknown&&i>0?'Museoan ikusi':'Zain'}</span>${won&&!preview?stampDate(completedAt[i+1]):''}</li>`;
 }).join('');
 return `<section class="mp-passport" aria-label="Ikerketa-pasaportea"><div class="mp-heading"><span>✦ &nbsp; MUSEOKO ARTXIBOA &nbsp; ✦</span><strong>IKERKETA-PASAPORTEA</strong><small>INPERIALISMOAREN GARAIA</small></div><div class="mp-spread"><div class="mp-identity"><span class="mp-label">TALDEA</span><strong class="mp-name">${escapeHtml(teamName)}</strong>${earned.has(1)||earned.has(2)?'<div class="mp-medals">'+[1,2].filter(n=>earned.has(n)).map(n=>'<div>'+medal(n)+'<span class="mp-award">'+roman[n-1]+'. MISIOAREN DOMINA</span></div>').join('')+'</div>':'<span class="mp-unearned-emblem" aria-hidden="true">✧</span><span class="mp-award">IKERKETA HISTORIKOA</span>'}</div><div class="mp-page"><span class="mp-label">MISIOEN ZIGILUAK</span><ol class="mp-stamps">${slots}</ol><span class="mp-count">${otherUnknown?'Gainerako zigiluak museoan':earned.size+' / 4 misio osatuta'}</span>${earned.size===4&&!preview&&roman.every((_,i)=>confirmedStamp(completedAt[i+1]))?'<div class="mp-final-date">ESPEDIZIOA AMAITUTA · '+stampDate(roman.map((_,i)=>confirmedStamp(completedAt[i+1])).sort().at(-1))+'</div>':''}</div></div>${preview?'<p class="mp-preview">IRAKASLEAREN AURREBISTA · SIMULAZIOA</p>':''}</section>`;
}
