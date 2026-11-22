/* Inperialismoa · C kontzeptua · autentifikatutako ikaslearen ataria.
 * Egoeran jadanik dauden datuak erabiltzen ditu. Ez du idazketarik egiten.
 */
const esc = input => String(input??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const display = {
  1:{title:"Aurrekarriak eta oinarriak"},
  2:{title:"Inperialismoaren faktoreak"},
  3:{title:"Inperioen banaketa"},
  4:{title:"Inperioen itzalak"}
};
const hotspot=(css,label,attrs="") =>
 '<button type="button" class="c-museo-hotspot '+css+'" aria-label="'+esc(label)+'" title="'+esc(label)+'" '+attrs+'><span class="c-museo-sr">'+esc(label)+'</span></button>';
export function renderVestibuloC({teamName,completedIds=[],preview=false}={}){
 const done=new Set(completedIds.filter(id=>id===1||id===2));
 const complete1=done.has(1),complete2=done.has(2);
 const count=done.size,pct=count*25;
 const nextId=complete1?(complete2?0:2):1;
 const nextLabel=nextId?nextId+'. Misioa:\n'+display[nextId].title:"3. Misioa:\nInperioen banaketa\n(Prestatzen)";
 const rawName=String(teamName||"Taldea").trim().slice(0,80)||"Taldea";
 const safeName=esc(rawName);
 const shortName=esc(rawName.length>9?rawName.slice(0,8)+'…':rawName);
 const nameSize=rawName.length>18?"smaller":rawName.length>12?"small":"";
 // Jatorrizko irudian "Atlas · 1 / 4 · 25 %" ageri da.
 // Egoera berdina denean, ez dugu papera alferrik estaltzen.
 // Inpimatutako izen, aurrerapen eta hurrengo misioaren gaineko letrak beti kentzen dira.
 // Pergaminoa gardentasuneko geruza txiki batekin leheneratzen da.
 const zones=[
  hotspot("c-museo-portal c-museo-m1 "+(complete1?"is-complete":"is-available"),
   "1. misioa: "+display[1].title+". "+(complete1?"Osatuta":"Eskuragarri"),'data-state="'+(complete1?"complete":"available")+'" data-mission="1"'),
  hotspot("c-museo-portal c-museo-m2 "+(complete2?"is-complete":complete1?"is-available":"is-locked"),
   "2. misioa: "+display[2].title+". "+(complete2?"Osatuta":complete1?"Eskuragarri":"Blokeatuta"),
   'data-state="'+(complete2?"complete":complete1?"available":"locked")+'" '+(complete1?'data-mission="2"':'disabled')),
  hotspot("c-museo-portal c-museo-m3 is-upcoming","3. misioa: "+display[3].title+". Prestatzen",
   'data-state="upcoming" disabled'),
  hotspot("c-museo-portal c-museo-m4 is-upcoming","4. misioa: "+display[4].title+". Prestatzen",
   'data-state="upcoming" disabled'),
  hotspot("c-museo-globe","Esplorazioen atlasa: informazioa ikusi",'data-c-globe="1"'),
  hotspot("c-museo-power","Irten museotik",'data-c-logout="1"'),
  hotspot("c-museo-book1","Taldearen espedientea: "+rawName+", "+count+"/4 misio",'data-c-ledger="1"'),
  hotspot("c-museo-book2",nextId?"Hurrengo erronka: "+display[nextId].title:"Hurrengo bi misioak prestatzen ari gara",
   nextId?'data-mission="'+nextId+'"':'disabled')
 ].join("");
 // Egoerak oihaleko argiarekin eta txanpon txikiekin adierazi:
 // ez dago 'HASI', 'OSATUTA' edo 'BLOKEATUTA' kartel handirik irudian.
 const m1Pin=complete1?'<span class="c-museo-flag-pin c-museo-pin-1 is-complete" aria-hidden="true">✓</span>':'';
 const m2Pin=complete2?'<span class="c-museo-flag-pin c-museo-pin-2 is-complete" aria-hidden="true">✓</span>':
  complete1?'':'<span class="c-museo-flag-pin c-museo-pin-2 is-locked" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>';
 const mobileMissions=[1,2,3,4].map(id=>{
  const doneMission=done.has(id);
  const published=id===1||id===2;
  const unlocked=id===1||id===2&&complete1;
  const state=!published?'Prestatzen':doneMission?'Osatuta':unlocked?'Eskuragarri':'Blokeatuta';
  return '<button type="button" class="c-museo-mobile-mission" '+(published&&unlocked?'data-mission="'+id+'"':'disabled')+'><span class="c-museo-mobile-index">'+String(id).padStart(2,'0')+'</span><span class="c-museo-mobile-info"><strong>'+esc(display[id].title)+'</strong><small>'+state+'</small></span><span class="c-museo-mobile-mark" aria-hidden="true">'+(doneMission?'✓':!published||!unlocked?'🔒':'→')+'</span></button>';
 }).join('');
 return '<div class="c-museo-home" lang="eu">'+
 '<div class="c-museo-toolbar"><span class="c-museo-toolbar-brand">✦ MUSEO DIGITALA <span>· 4 MISIO</span></span>'+
 '<span class="c-museo-toolbar-team" title="'+safeName+'">Taldea: <strong>'+safeName+'</strong></span>'+
 '<div class="c-museo-toolbar-actions">'+
 (preview?'<span class="c-museo-preview-tag">IRAKASLEAREN AURREBISTA · EZ DA GORDETZEN</span>':'')+
 '<button type="button" data-c-toggle="1" class="c-museo-alternative">Aurreko ikuspegia</button>'+
 (preview?'<button type="button" data-view="teacher" class="c-museo-return">← Irakaslearen panela</button>':'')+
 '<button type="button" data-c-logout="1" class="c-museo-exit">Irten ↗</button>'+
 '</div></div>'+
 '<div class="c-museo-stage" aria-label="Inperialismoaren garaia. Lau misioko museoa">'+
 '<iframe class="c-museo-picture" src="./preview-vestibulo-concepto-c.html" title="Museoaren irudi originala, dekorazio hutsa" aria-hidden="true" tabindex="-1" sandbox="" loading="eager"></iframe>'+
 '<img class="c-museo-banner-retouch" src="./assets/museo-c-estandartes-sin-texto.svg?v=1" alt="" aria-hidden="true" draggable="false">'+
 '<div class="c-museo-real-data">'+
 '<span class="c-museo-top-team" title="'+safeName+'">Taldea: '+shortName+'</span>'+
 '<span class="c-museo-book-name '+nameSize+'" title="'+safeName+'">'+safeName+'</span>'+ 
 '<span class="c-museo-book-progress">'+count+' / 4</span>'+ 
 '<span class="c-museo-book-percent">'+pct+' %</span>'+ 
 '<span class="c-museo-book-bar"><i style="width:'+pct+'%"></i></span>'+ 
 '<span class="c-museo-book-next">'+esc(nextLabel)+'</span>'+ 
 // Zigilu organikoak berak estaltzen ditu erreferentziako markak.

 m1Pin+m2Pin+'</div>'+
 '<div class="c-museo-hotspots">'+zones+'</div></div>'+
 '<section class="c-museo-mobile-guide" aria-label="Misioen nabigazioa"><div class="c-museo-mobile-summary"><h2>Taldearen espedientea</h2><strong>'+safeName+'</strong><p>'+count+' / 4 misio osatuta · '+pct+' %</p><div class="c-museo-mobile-progress" role="img" aria-label="'+pct+' % aurrerapena"><span style="width:'+pct+'%"></span></div><p><b>Hurrengo erronka:</b> '+esc(nextLabel).replace(/\n/g,' ')+'</p></div><h2>Misioen aretoak</h2><div class="c-museo-mobile-missions">'+mobileMissions+'</div></section>'+ 
 '<p class="c-museo-footer">Zuen taldearen benetako aurrerapena azaltzen da. 3. eta 4. misioetako aretoak prestatzen ari gara.</p>'+
 '</div>';
}
export const C_MUSEO_TITULUAK=Object.freeze(Object.fromEntries(Object.entries(display).map(([id,v])=>[id,v.title])));
