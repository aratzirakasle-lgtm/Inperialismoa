import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { POINTS, PAIRS, createSketch, selectTool, markPoint, clearArrow, ready, seal, complete } from './m3-map-sketch.mjs?v=20261126-kartografia14';
const $=s=>document.querySelector(s);
const data={act:new Set(),chain:['','',''],sketch:createSketch(),sketchPage:0,cartoon:null};
const clauses=[['date','1884–1885ean egin zen konferentzia.'],['agents','Potentzia nagusiek Afrika kontinente ia osoa beren artean banatu zuten.'],['goal','Hedapen kolonialak sortutako gatazkak eta tirabirak konpontzea zen helburua.'],['wrongDate','1898an egin zen Berlingo Konferentzia.'],['wrongScope','Potentziek Asia kontinente osoa banatu zuten.'],['wrongGoal','Helburua hedapen koloniala amaitzea zen.']];
const chainOptions=[[['expansion','Hedapen koloniala'],['end','Hedapenaren amaiera'],['religion','Misio erlijiosoak']],[['tension','Gatazkak eta tirabirak'],['peace','Gatazka guztien amaiera'],['independence','Independentzia']],[['berlin','Berlingo Konferentzia'],['fashoda','Fachodako gatazka'],['war','1898ko gerra']]];
const cartoonOptions=[['partition','Potentziek Afrika beren artean banatzea'],['reverse','Afrikako herriek Europa banatzea'],['religion','Misio erlijiosoak bakarrik zabaltzea']];
const expected=['date','agents','goal'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checked=(a,b)=>a===b?' checked':'';
const options=(items,name,value)=>'<div class="choices">'+items.map(([id,label])=>'<label><input type="radio" name="'+name+'" value="'+id+'"'+checked(id,value)+'>'+esc(label)+'</label>').join('')+'</div>';
const actFilled=()=>data.act.size===3&&data.chain.every(Boolean);
const mapFilled=()=>complete(data.sketch);
const cartoonFilled=()=>!!data.cartoon;
function paint(){const n=[actFilled(),mapFilled(),cartoonFilled()].filter(Boolean).length;$('#count').textContent=n+' / 3 atalak';$('#verify').disabled=n!==3;}
// Akta uses exactly the existing clause IDs and chain values. Its visual slots are not graded individually.
const actOrder=['wrongDate','agents','wrongScope','date','wrongGoal','goal'];
const clauseText=id=>clauses.find(c=>c[0]===id)?.[1]||'';
const actIcons={act:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 11h7M9 14h7M9 17h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',map:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4l7-1 3 3 4 1-1 4-3 2-2 7-3-4-1-4-5-2z" fill="currentColor"/><path d="M19 15l-1 4" stroke="currentColor" stroke-width="1.4"/></svg>',cartoon:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="9" r="2" fill="currentColor"/><path d="M5 17l5-5 3 3 3-5 4 7z" fill="currentColor"/></svg>'};
function actSlots(){
  const chosen=[...data.act];
  return Array.from({length:3},(_,i)=>{const id=chosen[i];return id?'<div class="act-slot filled" data-drop-slot="'+i+'"><span class="act-slot-check" aria-hidden="true">✓</span><span>'+esc(clauseText(id))+'</span><button type="button" class="act-remove" data-remove-clause="'+id+'" aria-label="Kendu: '+esc(clauseText(id))+'">×</button></div>':'<div class="act-slot empty" data-drop-slot="'+i+'"><span aria-hidden="true">⊕</span><span>Klausula arrastatu edo hautatu</span></div>';}).join('');
}
function stationNav(current){
  return '<div class="act-nav" aria-label="Ikerketaren atalak">'+[['act','Akta'],['map','Afrikaren mapa'],['cartoon','Karikatura']].map(([id,label])=>'<button type="button" data-station="'+id+'" aria-label="'+label+'" title="'+label+'" '+(id===current?'aria-current="step"':'')+'>'+actIcons[id]+'</button>').join('<span class="act-nav-line" aria-hidden="true"></span>')+'</div>';
}
function actMarkup(){
  return '<div class="act-scene">'+stationNav('act')+'<section class="act-paper" aria-label="Berlingo Konferentziaren akta"><div class="act-paper-heading"><span>BERLINGO KONFERENTZIAREN AKTA</span><span class="act-selection-count" aria-live="polite">'+data.act.size+' / 3</span></div><div class="act-slots">'+actSlots()+'</div><div class="act-chain"><h2>Gertakarien katea</h2><div class="act-chain-row">'+chainOptions.map((items,i)=>'<label><span>'+['Abiapuntua','Arazoa','Erantzuna'][i]+'</span><select data-chain="'+i+'"><option value="">Aukeratu…</option>'+items.map(([id,label])=>'<option value="'+id+'"'+(data.chain[i]===id?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>').join('<span class="act-chain-arrow" aria-hidden="true">→</span>')+'</div></div></section><section class="act-bank" aria-label="Klausulak"><div class="act-bank-heading"><h2>Klausulak</h2><p>18. diapositibaren arabera, hautatu hiru klausula zuzenak.</p></div><div class="act-options">'+actOrder.map(id=>'<label class="act-clause'+(data.act.has(id)?' is-selected':'')+'" draggable="true" data-drag-clause="'+id+'"><input type="checkbox" data-clause="'+id+'"'+(data.act.has(id)?' checked':'')+'><span>'+esc(clauseText(id))+'</span></label>').join('')+'</div><p class="act-message" role="status"></p></section></div>';
}
function syncAct(){
  const slots=$('.act-slots');if(!slots)return;
  slots.innerHTML=actSlots();$('.act-selection-count').textContent=data.act.size+' / 3';
  document.querySelectorAll('.act-clause').forEach(label=>{const input=label.querySelector('input');input.checked=data.act.has(input.dataset.clause);label.classList.toggle('is-selected',input.checked);});
}
function setActClause(id,selected){
  if(!clauses.some(c=>c[0]===id))return;
  const message=$('.act-message');if(message)message.textContent='';
  if(selected&&data.act.size>=3&&!data.act.has(id)){if(message)message.textContent='Hiru klausula hautatuta. Kendu bat beste bat aukeratzeko.';}
  else if(selected)data.act.add(id);else data.act.delete(id);
  syncAct();paint();
}
// Map workshop. Answers are spatial actions, not a second theory quiz.
const coastline='M445 326 Q478 264 527 236L552 198 602 165 670 147 732 153 815 140 796 165 808 194 862 216 892 220 905 198 939 195 971 211 1013 208 1046 217 1074 209 1086 248 1078 267 1101 304 1123 347 1142 374 1178 409 1225 410 1264 391 1262 421 1246 466 1214 503 1162 533 1138 565 1123 602 1105 617 1114 656 1144 669 1133 696 1090 729 1082 775 1046 813 1027 853 1003 888 958 930 910 945 867 929 845 889 823 832 811 785 782 747 777 706 793 672 781 635 752 608 749 574 766 548 751 515 705 492 670 492 634 467 591 477 552 494 512 473 482 440 456 414 453 379 445 326Z';
const inner='M523 349Q563 260 635 220L680 183 744 176 773 191 789 222 837 244 884 269 933 267 978 243 1018 241 1035 281 1043 325 1061 361 1064 397 1092 410 1139 430 1193 438 1207 452 1181 478 1133 513 1094 550 1080 586 1089 625 1073 655 1084 683 1055 710 1037 745 1030 785 998 817 980 856 958 890 917 900 876 874 865 823 843 777 820 740 830 700 840 655 821 607 790 584 798 548 783 505 748 484 706 471 663 445 625 456 585 463 551 463 519 444 514 412Z';

function mapMarkup(){
 return '<div class="map-scene sketch-scene"><div class="map-artwork"><img class="map-original" src="./assets/m3-berlin-map-clean.webp" width="1536" height="1024" alt="Afrikaren mapa eskematikoa. Ez ditu 1884ko muga politikoak erakusten." draggable="false">'+stationNav('map')+
 '<svg class="map-live-overlay" viewBox="0 0 1536 1024" aria-hidden="true"><defs><pattern id="sketch-paper" width="385" height="150" patternUnits="userSpaceOnUse"><image href="./assets/m3-berlin-akta-paper.webp" width="385" height="150" preserveAspectRatio="none"/></pattern><marker id="sketch-tip" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5 0 7Z" fill="context-stroke"/></marker></defs><path d="'+coastline+'" fill="#d7ba8c" stroke="#76583a" stroke-width="5"/><path d="'+coastline+'" fill="url(#sketch-paper)" opacity=".42"/><path class="sketch-reveal-inner" d="'+inner+'" fill="#d7ad62" stroke="#9d703c" stroke-width="3" opacity="0"/><path class="sketch-reveal-coast" d="'+coastline+'" fill="none" stroke="#478aa3" stroke-width="13" opacity="0"/><g class="sketch-arrows"></g></svg>'+
 POINTS.map(p=>'<button type="button" class="sketch-point" data-sketch-point="'+p.id+'" aria-label="'+p.id+' puntua" aria-pressed="false" style="left:'+(p.x/1536*100)+'%;top:'+(p.y/1024*100)+'%">'+p.id+'</button>').join('')+
 
 '</div><section class="sketch-tools guided-tools" aria-label="Kartografoaren tresnak"><div class="guide-kicker">KARTOGRAFOAREN LANA</div><h2 id="guide-step"></h2><p id="guide-task"></p><div id="guide-example" aria-hidden="true"></div><div id="guide-choices"></div><p id="guide-detail"></p></section></div>'+
 '<section class="sketch-desk guided-desk"><div class="guide-main"><span class="guide-source">BERLINGO KONFERENTZIA · 18. DIAPOSITIBA</span><h2 id="guide-title"></h2><p id="guide-instruction"></p><p class="sketch-feedback" role="status" aria-live="polite"></p></div><div class="guide-actions"><div class="guide-steps" aria-label="Ariketaren urratsak"><span id="guide-phase1">1 · Sailkatu</span><span id="guide-phase2">2 · Lotu</span><span id="guide-phase3">3 · Egiaztatu</span></div><div class="guide-navigation"><button type="button" class="guide-back" data-guide-back>← Atzera</button><span id="guide-progress" aria-live="polite"></span><button type="button" class="map-confirm" data-guide-next>Hurrengoa →</button></div></div></section>';
}
function syncMap(){
 const scene=$('.sketch-scene');if(!scene)return;
 const s=data.sketch,page=data.sketchPage,done=complete(s),point=page<6?POINTS[page]:null,pair=page>=6&&page<9?PAIRS[page-6]:null;
 const pairPoints=pair?POINTS.filter(p=>p.pair===pair):[];
 scene.classList.toggle('sketch-complete',done);
 scene.querySelectorAll('[data-sketch-point]').forEach(b=>{const id=b.dataset.sketchPoint,active=point?point.id===id:pair?pairPoints.some(p=>p.id===id):true;b.dataset.zone=s.zones[id]||'';b.classList.toggle('guide-target',active);b.classList.toggle('guide-muted',!active);b.disabled=!!point||!pair||!active;b.setAttribute('aria-pressed',String(s.origin===id));b.setAttribute('aria-label',id+' puntua'+(s.zones[id]?' · '+(s.zones[id]==='coast'?'Itsasertza':'Barnealdea'):''));});
 const arrowGroup=scene.querySelector('.sketch-arrows');
 arrowGroup.innerHTML=Object.entries(s.arrows).filter(([key])=>!point).map(([key,[a,b]])=>{const from=POINTS.find(p=>p.id===a),to=POINTS.find(p=>p.id===b);const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;const x1=from.x+ux*29,y1=from.y+uy*29,x2=to.x-ux*33,y2=to.y-uy*33;return '<path d="M'+x1+' '+y1+' Q'+((x1+x2)/2-uy*25)+' '+((y1+y2)/2+ux*25)+' '+x2+' '+y2+'" fill="none" stroke="'+(done?'#ffe5a0':'#654326')+'" stroke-width="7" stroke-linecap="round" marker-end="url(#sketch-tip)" opacity="'+(pair&&pair!==key?'.3':'1')+'"/>';}).join('');
 scene.querySelector('.sketch-reveal-inner').setAttribute('opacity',done?'.65':'0');scene.querySelector('.sketch-reveal-coast').setAttribute('opacity',done?'.9':'0');
 const choices=$('#guide-choices'),next=$('[data-guide-next]'),back=$('[data-guide-back]');
 $('#guide-step').textContent=point?'1. Sailkatu':pair?'2. Lotu':'3. Egiaztatu';
 $('#guide-progress').textContent=point?(page+1)+'/6':pair?(page-5)+'/3':'9/9';
 ['guide-phase1','guide-phase2','guide-phase3'].forEach((id,i)=>$('#'+id).classList.toggle('is-current',i===(point?0:pair?1:2)));
 back.disabled=page===0;
 if(point){
  $('#guide-task').textContent=point.id+' puntua non dago?';
  $('#guide-title').textContent=point.id+' puntua sailkatu';
  $('#guide-instruction').textContent='Begiratu urrez inguratuta dagoen '+point.id+' puntua. Sakatu ezkerreko bi aukeretako bat eta, ondoren, Hurrengoa.';
  $('#guide-example').innerHTML='<svg viewBox="0 0 180 58" role="presentation"><path d="M0 0H80Q67 19 83 37T77 58H0Z" fill="#6397aa"/><path d="M80 0H180V58H77Q90 38 83 27T80 0Z" fill="#c6a374"/><path d="M80 0Q67 19 83 37T77 58" fill="none" stroke="#5b4730" stroke-width="2"/><text x="35" y="33" font-size="12" fill="#fff" text-anchor="middle">Itsasoa</text><text x="135" y="33" font-size="12" fill="#513019" text-anchor="middle">Lurra</text></svg>';
  choices.innerHTML=[['coast','Itsasertza'],['interior','Barnealdea']].map(([id,label])=>'<button type="button" class="guide-choice" data-guide-zone="'+id+'" aria-pressed="'+(s.zones[point.id]===id)+'">'+label+'</button>').join('');
  $('#guide-detail').textContent=s.zones[point.id]?'Aukera aldatu dezakezu.':'Hautatu aukera bat.';
  next.disabled=!s.zones[point.id];next.textContent='Hurrengoa →';
 }else if(pair){
  $('#guide-task').textContent=pair+' bikotea: gezi bat marraztu';
  $('#guide-title').textContent=pair+' bikotea · Agintearen norabidea';
  $('#guide-instruction').textContent=s.origin?'Orain sakatu bikoteko beste puntua: geziaren helmuga.':'18. diapositibako akordioa irudikatzeko, sakatu lehenik geziaren jatorria eta gero helmuga. Bi puntuak urrez inguratuta daude.';
  $('#guide-example').innerHTML='<svg viewBox="0 0 180 58" role="presentation"><circle cx="28" cy="27" r="14" fill="#d5b477" stroke="#835b2e"/><circle cx="152" cy="27" r="14" fill="#d5b477" stroke="#835b2e"/><path d="M48 27H128" stroke="#654326" stroke-width="3"/><path d="M120 20L132 27 120 34" fill="none" stroke="#654326" stroke-width="3"/><text x="28" y="31" text-anchor="middle" font-size="12">1</text><text x="152" y="31" text-anchor="middle" font-size="12">2</text></svg>';
  choices.innerHTML='<div class="guide-route">'+(s.arrows[pair]?s.arrows[pair].join(' → '):s.origin?s.origin+' → ?':'? → ?')+'</div><button type="button" class="guide-choice" data-guide-reset '+(!s.arrows[pair]&&!s.origin?'disabled':'')+'>Ezabatu gezia</button>';
  $('#guide-detail').textContent=s.arrows[pair]?'Geziaren norabidea aldatu dezakezu.':'Sakatu mapako bi puntuak.';
  next.disabled=!s.arrows[pair];next.textContent='Hurrengoa →';
 }else{
  $('#guide-task').textContent=done?'Mapa zigilatuta':'Zure mapa prest dago?';
  $('#guide-title').textContent=done?'Mapa zigilatuta':'Aztertu eta zigilatu mapa';
  $('#guide-instruction').textContent=done?'Ikerketaren atal hau osatu duzu. Karikaturara joan zaitezke.':'Berrikusi sei puntuen sailkapena eta hiru gezien norabidea. Zigilua sakatu zuzentzeko.';
  $('#guide-example').innerHTML='';
  choices.innerHTML='<button type="button" class="guide-choice" data-guide-jump="0">Sailkapena berrikusi</button><button type="button" class="guide-choice" data-guide-jump="6">Geziak berrikusi</button>';
  $('#guide-detail').textContent=done?'6/6 marka · 3/3 gezi zuzen':'6 marka · 3 gezi';
  next.disabled=!ready(s);next.textContent=done?'Karikatura →':'Mapa zigilatu';
 }
 const f=$('.sketch-feedback');f.textContent=done?'✓ Mapa zigilatuta.':s.feedback;f.dataset.result=done?'correct':s.checked?'wrong':'';
}
function goGuide(page){data.sketchPage=Math.max(0,Math.min(9,page));data.sketch.origin=null;data.sketch.feedback='';syncMap();}
function open(name){const title=$('#station-title'),body=$('#station-body');$('#status').textContent='';$('#station').classList.toggle('act-station',name==='act');$('#station').classList.toggle('map-station',name==='map');if(name==='act'){title.textContent='Akta · Berlingo Konferentzia';body.innerHTML=actMarkup();}
else if(name==='map'){title.textContent='Afrikaren mapa';body.innerHTML=mapMarkup();syncMap();}
else if(name==='cartoon'){title.textContent='Karikatura';body.innerHTML='<div class="cartoon-layout"><div><img class="source-image" src="./assets/m3-berlin-karikatura.webp" alt="Afrika tarta baten moduan banatzen duten potentzien karikatura, 18. diapositibatik." onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Karikaturaren jatorrizko irudia falta da. Kontsultatu 18. diapositiba.</p><p class="note">Iturria: 18. diapositiba.</p></div><div><h2>Zer adierazten du karikaturak?</h2><p>Aztertu Afrikaren irudia eta haren inguruan dauden pertsonen ekintza.</p>'+options(cartoonOptions,'cartoon',data.cartoon)+'</div></div>';}
else{title.textContent='Iturria · 18. diapositiba';body.innerHTML='<img class="source-image" src="./assets/m3-berlin-slide18.webp" alt="3.1 Berlingo Konferentzia (1884–85)" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Kontsultatu ikasgelako PDFko 18. diapositiba.</p>';}
if(!$('#station').open)$('#station').showModal();}
$('#station-body').addEventListener('change',e=>{const t=e.target;if(t.dataset.clause){setActClause(t.dataset.clause,t.checked);}else if(t.dataset.chain!==undefined)data.chain[Number(t.dataset.chain)]=t.value;else if(t.name==='cartoon')data.cartoon=t.value;paint();});
$('#station-body').addEventListener('click',e=>{const zone=e.target.closest('[data-guide-zone]');if(zone){const p=POINTS[data.sketchPage];if(p){selectTool(data.sketch,zone.dataset.guideZone);markPoint(data.sketch,p.id);syncMap();paint();}return;}const pin=e.target.closest('[data-sketch-point]');if(pin){const p=POINTS.find(p=>p.id===pin.dataset.sketchPoint),pair=PAIRS[data.sketchPage-6];if(pair&&p?.pair===pair){if(data.sketch.tool!=='arrow')selectTool(data.sketch,'arrow');markPoint(data.sketch,p.id);syncMap();paint();}return;}if(e.target.closest('[data-guide-reset]')){clearArrow(data.sketch,PAIRS[data.sketchPage-6]);syncMap();paint();return;}if(e.target.closest('[data-guide-back]')){goGuide(data.sketchPage-1);return;}const jump=e.target.closest('[data-guide-jump]');if(jump){goGuide(Number(jump.dataset.guideJump));return;}if(e.target.closest('[data-guide-next]')){if(data.sketchPage<9)goGuide(data.sketchPage+1);else if(complete(data.sketch))open('cartoon');else{seal(data.sketch);syncMap();paint();}return;}const remove=e.target.closest('[data-remove-clause]');if(remove){const id=remove.dataset.removeClause;setActClause(id,false);document.querySelector('.act-clause[data-drag-clause="'+id+'"] input')?.focus();return;}const station=e.target.closest('[data-station]');if(station)open(station.dataset.station);});
$('#station-body').addEventListener('dragstart',e=>{const clause=e.target.closest('[data-drag-clause]');if(!clause||!e.dataTransfer)return;e.dataTransfer.setData('text/plain',clause.dataset.dragClause);e.dataTransfer.effectAllowed='copy';});
$('#station-body').addEventListener('dragover',e=>{const slot=e.target.closest('[data-drop-slot]');if(slot){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';slot.classList.add('is-drop-target');}});
$('#station-body').addEventListener('dragleave',e=>{e.target.closest('[data-drop-slot]')?.classList.remove('is-drop-target');});
$('#station-body').addEventListener('drop',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot||!e.dataTransfer)return;e.preventDefault();slot.classList.remove('is-drop-target');setActClause(e.dataTransfer.getData('text/plain'),true);});
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));$('#notes').addEventListener('click',()=>open('notes'));['#close','#return'].forEach(s=>$(s).addEventListener('click',()=>$('#station').close()));
$('#verify').addEventListener('click',()=>{if(!actFilled()||!mapFilled()||!cartoonFilled())return;const correct=expected.every(x=>data.act.has(x))&&data.act.size===3&&data.chain.join('|')==='expansion|tension|berlin'&&complete(data.sketch)&&data.cartoon==='partition';$('#status').textContent=correct?'Berlingo akta zigilatuta · Irakaslearen aurrebista':'Ez da zuzena. Berrikusi erantzun guztiak eta saiatu berriro.';$('#status').className='status '+(correct?'success':'error');});
const art=$('#room-art');const assetError=$('#asset-error');let localUrl=null;function failed(){assetError.hidden=false;}art.addEventListener('error',failed);art.addEventListener('load',()=>{assetError.hidden=true});if(art.complete&&!art.naturalWidth)failed();$('#local-image').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(localUrl)URL.revokeObjectURL(localUrl);localUrl=URL.createObjectURL(file);art.src=localUrl;});
async function init(){try{if(new URLSearchParams(location.search).get('preview')!=='1')throw Error('preview');if(!window.supabase)throw Error('client');const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);const {data:{user},error}=await db.auth.getUser();if(error||!user)throw Error('user');const {data:profile,error:pe}=await db.from('profiles').select('role').eq('id',user.id).single();if(pe||profile?.role!=='teacher')throw Error('role');$('#gate').hidden=true;$('#berlin').hidden=false;paint();}catch{location.replace('./index.html');}}
window.addEventListener('load',init,{once:true});