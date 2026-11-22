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
 '<button type="button" class="c-museo-hotspot '+css+'" aria-label="'+esc(label)+'" '+attrs+'><span class="c-museo-sr">'+esc(label)+'</span></button>';
export function renderVestibuloC({teamName,completedIds=[],preview=false}={}){
 const done=new Set(completedIds.filter(id=>id===1||id===2));
 const complete1=done.has(1),complete2=done.has(2);
 const count=done.size,pct=count*25;
 const nextId=complete1?(complete2?0:2):1;
 const nextLabel=nextId?nextId+'. Misioa:\n'+display[nextId].title:"3. eta 4. misioak\nprestatzen ari gara";
 const rawName=String(teamName||"Taldea").trim().slice(0,80)||"Taldea";
 const safeName=esc(rawName);
 const shortName=esc(rawName.slice(0,12));
 const nameSize=rawName.length>18?"smaller":rawName.length>12?"small":"";
 // Jatorrizko irudian "Atlas · 1 / 4 · 25 %" ageri da.
 // Egoera berdina denean, ez dugu papera alferrik estaltzen.
 const sameName=rawName==="Atlas";
 const originalProgress=complete1&&!complete2;
 const zones=[
  hotspot("c-museo-portal c-museo-m1","1. misioa: "+display[1].title+". "+(complete1?"Osatuta":"Eskuragarri"),'data-mission="1"'),
  hotspot("c-museo-portal c-museo-m2","2. misioa: "+display[2].title+". "+(complete2?"Osatuta":complete1?"Eskuragarri":"Blokeatuta"),complete1?'data-mission="2"':'disabled'),
  hotspot("c-museo-portal c-museo-m3","3. misioa: "+display[3].title+". Prestatzen","disabled"),
  hotspot("c-museo-portal c-museo-m4","4. misioa: "+display[4].title+". Prestatzen","disabled"),
  hotspot("c-museo-globe","Esplorazioen atlasa: informazioa ikusi",'data-c-globe="1"'),
  hotspot("c-museo-book1","Taldearen espedientea: "+String(teamName||"Taldea")+", "+count+"/4 misio",'data-c-ledger="1"'),
  hotspot("c-museo-book2",nextId?"Hurrengo erronka: "+display[nextId].title:"Hurrengo bi misioak prestatzen ari gara",nextId?'data-mission="'+nextId+'"':'disabled')
 ].join("");
 const m1Plate=complete1?"":'<span class="c-museo-brass c-museo-status1">HASI →</span>';
 const m2Plate=complete1?(complete2?'<span class="c-museo-brass c-museo-status2">✓ OSATUTA</span>':''):'<span class="c-museo-brass c-museo-status2 c-museo-locked">🔒 BLOKEATUTA</span>';
 const mobileMissions=[1,2,3,4].map(id=>{
  const doneMission=done.has(id);
  const published=id===1||id===2;
  const unlocked=id===1||id===2&&complete1;
  const state=!published?'Prestatzen':doneMission?'Osatuta':unlocked?'Eskuragarri':'Blokeatuta';
  return '<button type="button" class="c-museo-mobile-mission" '+(published&&unlocked?'data-mission="'+id+'"':'disabled')+'><span class="c-museo-mobile-index">'+String(id).padStart(2,'0')+'</span><span class="c-museo-mobile-info"><strong>'+esc(display[id].title)+'</strong><small>'+state+'</small></span><span class="c-museo-mobile-mark" aria-hidden="true">'+(doneMission?'✓':!published||!unlocked?'🔒':'→')+'</span></button>';
 }).join('');
 return '<div class="c-museo-home" lang="eu">'+
 '<div class="c-museo-toolbar"><span>🏛 &nbsp; IKASLEEN MUSEOA · 4 MISIO</span><div>'+
 (preview?'<span class="c-museo-preview-tag">IRAKASLEAREN AURREBISTA · EZ DA GORDETZEN</span>':'')+
 '<button type="button" data-c-toggle="1" class="c-museo-alternative">Aurreko ikuspegia</button>'+
 (preview?'<button type="button" data-view="teacher" class="c-museo-return">← Irakaslearen panela</button>':'')+
 '</div></div>'+
 '<div class="c-museo-stage" aria-label="Inperialismoaren garaia. Lau misioko museoa">'+
 '<iframe class="c-museo-picture" src="./preview-vestibulo-concepto-c.html" title="Museoaren irudi originala, dekorazio hutsa" aria-hidden="true" tabindex="-1" sandbox="" loading="eager"></iframe>'+
 '<div class="c-museo-real-data">'+
 (sameName?'':'<span class="c-museo-top-team">'+shortName+'</span>')+
 (sameName?'':'<span class="c-museo-book-name '+nameSize+'">'+safeName+'</span>')+
 (originalProgress?'':'<span class="c-museo-book-progress">'+count+' / 4</span>')+
 (originalProgress?'':'<span class="c-museo-book-percent">'+pct+' %</span>')+
 (originalProgress?'':'<span class="c-museo-book-bar"><i style="width:'+pct+'%"></i></span>')+
 (originalProgress?'':'<span class="c-museo-book-next">'+esc(nextLabel)+'</span>')+
 (complete1?"":'<span class="c-museo-banner-dim"></span><span class="c-museo-second-dim"></span>')+
 m1Plate+m2Plate+'</div>'+
 '<div class="c-museo-hotspots">'+zones+'</div></div>'+
 '<section class="c-museo-mobile-guide" aria-label="Misioen nabigazioa"><div class="c-museo-mobile-summary"><h2>Taldearen espedientea</h2><strong>'+safeName+'</strong><p>'+count+' / 4 misio osatuta · '+pct+' %</p><div class="c-museo-mobile-progress" role="img" aria-label="'+pct+' % aurrerapena"><span style="width:'+pct+'%"></span></div><p><b>Hurrengo erronka:</b> '+esc(nextLabel).replace(/\n/g,' ')+'</p></div><h2>Misioen aretoak</h2><div class="c-museo-mobile-missions">'+mobileMissions+'</div></section>'+ 
 '<p class="c-museo-footer">Zuen taldearen benetako aurrerapena azaltzen da. 3. eta 4. misioetako aretoak prestatzen ari gara.</p>'+
 '</div>';
}
export const C_MUSEO_TITULUAK=Object.freeze(Object.fromEntries(Object.entries(display).map(([id,v])=>[id,v.title])));
