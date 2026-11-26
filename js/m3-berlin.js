import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { chooseMapPoint, chooseMapAnswer, confirmMapAnswer, mapDecisionComplete, mapArrowVisible } from './m3-map-decision.mjs?v=20261126-erabakia13';
const $=s=>document.querySelector(s);
const data={act:new Set(),chain:['','',''],coast:false,interior:false,map:null,mapPoint:null,mapConfirmed:false,mapFeedback:null,cartoon:null};
const clauses=[['date','1884–1885ean egin zen konferentzia.'],['agents','Potentzia nagusiek Afrika kontinente ia osoa beren artean banatu zuten.'],['goal','Hedapen kolonialak sortutako gatazkak eta tirabirak konpontzea zen helburua.'],['wrongDate','1898an egin zen Berlingo Konferentzia.'],['wrongScope','Potentziek Asia kontinente osoa banatu zuten.'],['wrongGoal','Helburua hedapen koloniala amaitzea zen.']];
const chainOptions=[[['expansion','Hedapen koloniala'],['end','Hedapenaren amaiera'],['religion','Misio erlijiosoak']],[['tension','Gatazkak eta tirabirak'],['peace','Gatazka guztien amaiera'],['independence','Independentzia']],[['berlin','Berlingo Konferentzia'],['fashoda','Fachodako gatazka'],['war','1898ko gerra']]];
const mapOptions=[['inside','Lurraldearen barnealdean'],['europe','Europan'],['other','Beste kontinente guztietan']];
const cartoonOptions=[['partition','Potentziek Afrika beren artean banatzea'],['reverse','Afrikako herriek Europa banatzea'],['religion','Misio erlijiosoak bakarrik zabaltzea']];
const expected=['date','agents','goal'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checked=(a,b)=>a===b?' checked':'';
const options=(items,name,value)=>'<div class="choices">'+items.map(([id,label])=>'<label><input type="radio" name="'+name+'" value="'+id+'"'+checked(id,value)+'>'+esc(label)+'</label>').join('')+'</div>';
const actFilled=()=>data.act.size===3&&data.chain.every(Boolean);
const mapFilled=()=>mapDecisionComplete(data);
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
// Six schematic coastal points: the learner chooses any one and validates the same historical principle.
const mapPoints=[
  {x:663,y:165,edge:'M600 179Q642 153 695 157T810 147',arrow:'M663 175Q704 202 737 254'},
  {x:457,y:380,edge:'M465 310Q438 355 457 380T506 446',arrow:'M470 383Q537 360 590 389'},
  {x:800,y:671,edge:'M779 594Q810 632 800 671T813 751',arrow:'M810 677Q852 666 910 701'},
  {x:957,y:925,edge:'M865 910Q898 947 957 925T1013 875',arrow:'M956 917Q944 854 901 813'},
  {x:1133,y:575,edge:'M1198 500Q1148 526 1133 575T1108 635',arrow:'M1130 568Q1069 552 1019 526'},
  {x:1112,y:328,edge:'M1070 253Q1081 295 1112 328T1175 410',arrow:'M1107 334Q1056 327 1000 364'}
];
const coastline='M445 326 Q478 264 527 236L552 198 602 165 670 147 732 153 815 140 796 165 808 194 862 216 892 220 905 198 939 195 971 211 1013 208 1046 217 1074 209 1086 248 1078 267 1101 304 1123 347 1142 374 1178 409 1225 410 1264 391 1262 421 1246 466 1214 503 1162 533 1138 565 1123 602 1105 617 1114 656 1144 669 1133 696 1090 729 1082 775 1046 813 1027 853 1003 888 958 930 910 945 867 929 845 889 823 832 811 785 782 747 777 706 793 672 781 635 752 608 749 574 766 548 751 515 705 492 670 492 634 467 591 477 552 494 512 473 482 440 456 414 453 379 445 326Z';
const inner='M523 349Q563 260 635 220L680 183 744 176 773 191 789 222 837 244 884 269 933 267 978 243 1018 241 1035 281 1043 325 1061 361 1064 397 1092 410 1139 430 1193 438 1207 452 1181 478 1133 513 1094 550 1080 586 1089 625 1073 655 1084 683 1055 710 1037 745 1030 785 998 817 980 856 958 890 917 900 876 874 865 823 843 777 820 740 830 700 840 655 821 607 790 584 798 548 783 505 748 484 706 471 663 445 625 456 585 463 551 463 519 444 514 412Z';
function mapMarkup(){
  return '<div class="map-scene" data-coast="'+data.coast+'" data-interior="'+data.interior+'"><div class="map-artwork"><img class="map-original" src="./assets/m3-berlin-map-clean.webp" width="1536" height="1024" alt="Afrikaren mapa eskematikoa, itsasertza urdinez eta barnealdea marratuta." draggable="false">'+stationNav('map')+
  '<svg class="map-live-overlay" viewBox="0 0 1536 1024" aria-hidden="true"><defs><pattern id="m3-inner-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V14" stroke="#f9d88c" stroke-width="3" opacity=".52"/></pattern><filter id="m3-map-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter><marker id="m3-arrow-head" markerWidth="8" markerHeight="8" refX="6.8" refY="3.5" orient="auto"><path d="M0 0L7 3.5 0 7Z" fill="#ffe7a5"/></marker></defs><path class="map-inner-highlight" d="'+inner+'" fill="url(#m3-inner-hatch)" stroke="#e9b954" stroke-width="3"/><path class="map-coast-highlight" d="'+coastline+'" fill="none" stroke="#7de0ec" stroke-width="4.5" filter="url(#m3-map-glow)"/><path class="map-point-edge" d="" fill="none" stroke="#b4f5ff" stroke-width="8" stroke-linecap="round" filter="url(#m3-map-glow)"/><path class="map-point-arrow" d="" fill="none" stroke="#ffe7a5" stroke-width="7" stroke-linecap="round" marker-end="url(#m3-arrow-head)"/></svg>'+
  mapPoints.map((p,i)=>'<button type="button" class="map-pin" data-map-point="'+i+'" aria-label="Itsasertzeko '+(i+1)+'. simulazio-puntua" aria-pressed="'+(data.mapPoint===i)+'" style="left:'+(p.x/1536*100)+'%;top:'+(p.y/1024*100)+'%"></button>').join('')+
  '</div><section class="map-layer-controls" aria-label="Maparen geruzak"><h2>Geruzak</h2><label class="map-layer map-layer-coast"><input type="checkbox" id="coast"'+(data.coast?' checked':'')+'><span>Itsasertza</span></label><label class="map-layer map-layer-interior"><input type="checkbox" id="interior"'+(data.interior?' checked':'')+'><span>Barnealdea</span></label><p class="map-layer-hint">Aukeratu urrezko puntu bat.</p></section></div><section class="map-question" aria-labelledby="map-decision-title"><div class="map-question-copy"><span class="map-source-tag">18. DIAPOSITIBA · SIMULAZIOA</span><h2 id="map-decision-title">1. Aukeratu itsasertzeko puntu bat</h2><p id="map-decision-prompt">Sakatu mapako urrezko puntu bat eta aztertu zer aginte izango lukeen potentzia kolonialak.</p><p class="map-schematic-note">Mapa eskematikoa: puntuek ez dute benetako kokaleku kolonialik adierazten.</p></div><fieldset class="map-decision-fields" disabled aria-labelledby="map-decision-title">'+options(mapOptions,'map',data.map)+'<div class="map-decision-actions"><button type="button" class="map-confirm" data-map-confirm disabled>Egiaztatu erabakia</button><span class="map-decision-feedback" role="status" aria-live="polite"></span></div></fieldset></section>';
}
function syncMap(){
  const scene=$('.map-scene');if(!scene)return;
  scene.dataset.coast=String(data.coast);scene.dataset.interior=String(data.interior);scene.dataset.confirmed=String(mapDecisionComplete(data));
  $('#coast').checked=data.coast;$('#interior').checked=data.interior;
  const point=data.mapPoint===null?null:mapPoints[data.mapPoint];
  scene.querySelectorAll('.map-pin').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===data.mapPoint)));
  scene.querySelector('.map-point-edge').setAttribute('d',point&&data.coast?point.edge:'');
  scene.querySelector('.map-point-arrow').setAttribute('d',point&&mapArrowVisible(data)?point.arrow:'');
  const fields=$('.map-decision-fields'),confirm=$('[data-map-confirm]'),feedback=$('.map-decision-feedback');
  fields.disabled=!point;confirm.disabled=!point||!data.map||mapDecisionComplete(data);
  fields.querySelectorAll('input[name="map"]').forEach(input=>{input.checked=input.value===data.map;});
  $('#map-decision-title').textContent=point?'2. Itsasertza kontrolatzen zuten potentziek non izango zuten agintea?':'1. Aukeratu itsasertzeko puntu bat';
  $('#map-decision-prompt').textContent=point?'Aukeratutako simulazio-puntua: '+(data.mapPoint+1)+'. Irakurri 18. diapositiba eta hautatu erantzuna.':'Sakatu mapako urrezko puntu bat eta aztertu zer aginte izango lukeen potentzia kolonialak.';
  $('.map-layer-hint').textContent=mapDecisionComplete(data)?'Geziak agintearen hedapena irudikatzen du.':point?'Hautatu eta egiaztatu erantzuna.':'Aukeratu urrezko puntu bat.';
  feedback.textContent=data.mapFeedback==='correct'?'Ondo! Geziak itsasertzetik lurraldearen barnealdera hedatutako agintea irudikatzen du.':data.mapFeedback==='wrong'?'Berrikusi 18. diapositiba eta saiatu berriro.':'';
  feedback.dataset.result=data.mapFeedback||'';
}
function open(name){const title=$('#station-title'),body=$('#station-body');$('#status').textContent='';$('#station').classList.toggle('act-station',name==='act');$('#station').classList.toggle('map-station',name==='map');if(name==='act'){title.textContent='Akta · Berlingo Konferentzia';body.innerHTML=actMarkup();}
else if(name==='map'){title.textContent='Afrikaren mapa';body.innerHTML=mapMarkup();syncMap();}
else if(name==='cartoon'){title.textContent='Karikatura';body.innerHTML='<div class="cartoon-layout"><div><img class="source-image" src="./assets/m3-berlin-karikatura.webp" alt="Afrika tarta baten moduan banatzen duten potentzien karikatura, 18. diapositibatik." onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Karikaturaren jatorrizko irudia falta da. Kontsultatu 18. diapositiba.</p><p class="note">Iturria: 18. diapositiba.</p></div><div><h2>Zer adierazten du karikaturak?</h2><p>Aztertu Afrikaren irudia eta haren inguruan dauden pertsonen ekintza.</p>'+options(cartoonOptions,'cartoon',data.cartoon)+'</div></div>';}
else{title.textContent='Iturria · 18. diapositiba';body.innerHTML='<img class="source-image" src="./assets/m3-berlin-slide18.webp" alt="3.1 Berlingo Konferentzia (1884–85)" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Kontsultatu ikasgelako PDFko 18. diapositiba.</p>';}
if(!$('#station').open)$('#station').showModal();}
$('#station-body').addEventListener('change',e=>{const t=e.target;if(t.dataset.clause){setActClause(t.dataset.clause,t.checked);}else if(t.dataset.chain!==undefined)data.chain[Number(t.dataset.chain)]=t.value;else if(t.id==='coast'){data.coast=t.checked;syncMap();}else if(t.id==='interior'){data.interior=t.checked;syncMap();}else if(t.name==='map'){chooseMapAnswer(data,t.value);syncMap();}else if(t.name==='cartoon')data.cartoon=t.value;paint();});
$('#station-body').addEventListener('click',e=>{const pin=e.target.closest('[data-map-point]');if(pin){const index=Number(pin.dataset.mapPoint);if(mapPoints[index]){chooseMapPoint(data,index);syncMap();paint();}return;}const confirm=e.target.closest('[data-map-confirm]');if(confirm){confirmMapAnswer(data);syncMap();paint();return;}const remove=e.target.closest('[data-remove-clause]');if(remove){const id=remove.dataset.removeClause;setActClause(id,false);document.querySelector('.act-clause[data-drag-clause="'+id+'"] input')?.focus();return;}const station=e.target.closest('[data-station]');if(station)open(station.dataset.station);});
$('#station-body').addEventListener('dragstart',e=>{const clause=e.target.closest('[data-drag-clause]');if(!clause||!e.dataTransfer)return;e.dataTransfer.setData('text/plain',clause.dataset.dragClause);e.dataTransfer.effectAllowed='copy';});
$('#station-body').addEventListener('dragover',e=>{const slot=e.target.closest('[data-drop-slot]');if(slot){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';slot.classList.add('is-drop-target');}});
$('#station-body').addEventListener('dragleave',e=>{e.target.closest('[data-drop-slot]')?.classList.remove('is-drop-target');});
$('#station-body').addEventListener('drop',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot||!e.dataTransfer)return;e.preventDefault();slot.classList.remove('is-drop-target');setActClause(e.dataTransfer.getData('text/plain'),true);});
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));$('#notes').addEventListener('click',()=>open('notes'));['#close','#return'].forEach(s=>$(s).addEventListener('click',()=>$('#station').close()));
$('#verify').addEventListener('click',()=>{if(!actFilled()||!mapFilled()||!cartoonFilled())return;const correct=expected.every(x=>data.act.has(x))&&data.act.size===3&&data.chain.join('|')==='expansion|tension|berlin'&&data.map==='inside'&&data.cartoon==='partition';$('#status').textContent=correct?'Berlingo akta zigilatuta · Irakaslearen aurrebista':'Ez da zuzena. Berrikusi erantzun guztiak eta saiatu berriro.';$('#status').className='status '+(correct?'success':'error');});
const art=$('#room-art');const assetError=$('#asset-error');let localUrl=null;function failed(){assetError.hidden=false;}art.addEventListener('error',failed);art.addEventListener('load',()=>{assetError.hidden=true});if(art.complete&&!art.naturalWidth)failed();$('#local-image').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(localUrl)URL.revokeObjectURL(localUrl);localUrl=URL.createObjectURL(file);art.src=localUrl;});
async function init(){try{if(new URLSearchParams(location.search).get('preview')!=='1')throw Error('preview');if(!window.supabase)throw Error('client');const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);const {data:{user},error}=await db.auth.getUser();if(error||!user)throw Error('user');const {data:profile,error:pe}=await db.from('profiles').select('role').eq('id',user.id).single();if(pe||profile?.role!=='teacher')throw Error('role');$('#gate').hidden=true;$('#berlin').hidden=false;paint();}catch{location.replace('./index.html');}}
window.addEventListener('load',init,{once:true});