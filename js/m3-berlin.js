import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { ARROWS, createAudit, changeScope, reverseArrow, swapLegend, score, seal, complete } from './m3-map-audit.mjs?v=20261126-audit16';
const $=s=>document.querySelector(s);
const data={act:new Set(),chain:['','',''],audit:createAudit(),cartoon:null};
const clauses=[['date','1884–1885ean egin zen konferentzia.'],['agents','Potentzia nagusiek Afrika kontinente ia osoa beren artean banatu zuten.'],['goal','Hedapen kolonialak sortutako gatazkak eta tirabirak konpontzea zen helburua.'],['wrongDate','1898an egin zen Berlingo Konferentzia.'],['wrongScope','Potentziek Asia kontinente osoa banatu zuten.'],['wrongGoal','Helburua hedapen koloniala amaitzea zen.']];
const chainOptions=[[['expansion','Hedapen koloniala'],['end','Hedapenaren amaiera'],['religion','Misio erlijiosoak']],[['tension','Gatazkak eta tirabirak'],['peace','Gatazka guztien amaiera'],['independence','Independentzia']],[['berlin','Berlingo Konferentzia'],['fashoda','Fachodako gatazka'],['war','1898ko gerra']]];
const cartoonOptions=[['partition','Potentziek Afrika beren artean banatzea'],['reverse','Afrikako herriek Europa banatzea'],['religion','Misio erlijiosoak bakarrik zabaltzea']];
const expected=['date','agents','goal'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checked=(a,b)=>a===b?' checked':'';
const options=(items,name,value)=>'<div class="choices">'+items.map(([id,label])=>'<label><input type="radio" name="'+name+'" value="'+id+'"'+checked(id,value)+'>'+esc(label)+'</label>').join('')+'</div>';
const actFilled=()=>data.act.size===3&&data.chain.every(Boolean);
const mapFilled=()=>complete(data.audit);
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
// Cartographic audit; the old point-classification exercise is no longer shown.
const coastline='M445 326 Q478 264 527 236L552 198 602 165 670 147 732 153 815 140 796 165 808 194 862 216 892 220 905 198 939 195 971 211 1013 208 1046 217 1074 209 1086 248 1078 267 1101 304 1123 347 1142 374 1178 409 1225 410 1264 391 1262 421 1246 466 1214 503 1162 533 1138 565 1123 602 1105 617 1114 656 1144 669 1133 696 1090 729 1082 775 1046 813 1027 853 1003 888 958 930 910 945 867 929 845 889 823 832 811 785 782 747 777 706 793 672 781 635 752 608 749 574 766 548 751 515 705 492 670 492 634 467 591 477 552 494 512 473 482 440 456 414 453 379 445 326Z';
const inner='M523 349Q563 260 635 220L680 183 744 176 773 191 789 222 837 244 884 269 933 267 978 243 1018 241 1035 281 1043 325 1061 361 1064 397 1092 410 1139 430 1193 438 1207 452 1181 478 1133 513 1094 550 1080 586 1089 625 1073 655 1084 683 1055 710 1037 745 1030 785 998 817 980 856 958 890 917 900 876 874 865 823 843 777 820 740 830 700 840 655 821 607 790 584 798 548 783 505 748 484 706 471 663 445 625 456 585 463 551 463 519 444 514 412Z';


const madagascar='M1251 646L1261 669 1255 695 1246 708 1241 739 1226 768 1214 800 1199 821 1184 815 1174 797 1178 768 1191 744 1192 716 1214 699 1231 679Z';
const scopeNames={small:'Afrikaren zati txiki bat',almost:'Afrika kontinente ia osoa',all:'Afrika kontinente osoa'};
const legendNames={control:'Kontrolatutako eremua',authority:'Agintepeko eremua'};
function auditNav(){return '<nav class="audit-nav" aria-label="Ikerketaren atalak">'+[['act','Akta'],['map','Afrikaren mapa'],['cartoon','Karikatura']].map(([id,label])=>'<button type="button" data-station="'+id+'" '+(id==='map'?'aria-current="step"':'')+'>'+actIcons[id]+'<span>'+label+'</span></button>').join('<span class="audit-nav-line" aria-hidden="true"></span>')+'</nav>';}
function mapMarkup(){
 return '<div class="audit-scene">'+
 '<header class="audit-header"><div class="audit-title">Afrikaren mapa</div>'+auditNav()+'</header>'+
 '<div class="audit-workspace"><aside class="audit-parchment audit-brief"><h2>Kartografoaren akatsak</h2><p>Mapa honetako kartografoak Berlingo Konferentziaren akordioak irudikatu ditu, baina akatsak egin ditu.</p><h3>Zure lana</h3><ol><li><strong>Banaketa:</strong> hautatu mapak erakutsi behar duen hedadura.</li><li><strong>Geziak:</strong> sakatu norabide okerra duten geziak, alderantzikatzeko.</li><li><strong>Legenda:</strong> aztertu bi etiketak eta trukatu behar izanez gero.</li></ol><div class="audit-source">Iturria: 18. diapositiba<br>Mapa eskematikoa da; ez ditu benetako muga kolonialak erakusten.</div></aside>'+
 '<section class="audit-map" aria-label="Zuzendu Afrikaren mapa"><svg class="audit-cartography" viewBox="360 120 950 850" role="img" aria-label="Afrikako mapa eskematikoa, banaketaren hedadura eta agintearen geziak"><defs><clipPath id="audit-land"><path d="'+coastline+'"/><path d="'+madagascar+'"/></clipPath><pattern id="audit-stripes" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="14" height="14" fill="#85466d" fill-opacity=".32"/><path d="M0 0V14" stroke="#6e345d" stroke-width="4" opacity=".68"/></pattern><mask id="audit-almost"><rect width="1536" height="1024" fill="white"/><path d="M535 260L590 234 622 258 600 302 553 312Z" fill="black"/></mask><marker id="audit-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5 0 10Z" fill="#fff0bf"/></marker></defs><image href="./assets/m3-berlin-map-clean.webp" width="1536" height="1024"/><g clip-path="url(#audit-land)"><rect class="audit-full-fill" x="360" y="120" width="950" height="850" fill="url(#audit-stripes)"/><path class="audit-small-fill" d="M527 351L575 295 643 306 680 358 650 410 591 432 537 403Z" fill="url(#audit-stripes)" stroke="#8e5271" stroke-width="4"/></g><g class="audit-arrows"></g></svg>'+
 ARROWS.map(a=>'<button type="button" class="audit-arrow-button" data-audit-arrow="'+a.id+'" style="left:'+((a.bend[0]-360)/950*100)+'%;top:'+((a.bend[1]-120)/850*100)+'%" aria-label="'+a.id+'. gezia alderantzikatu" title="Geziaren norabidea aldatu">'+a.id+' ↻</button>').join('')+
 '<div class="audit-map-note">Banaketaren eskema · ez mapa historiko zehatza</div></section>'+
 '<aside class="audit-parchment audit-tools"><h2>Zuzentzeko tresnak</h2><h3>1 · Banaketaren hedadura</h3><p>Aukeratu irudikapen egokia. Mapa aldatuko da.</p><div class="audit-scopes">'+['small','all','almost'].map(id=>'<button type="button" data-audit-scope="'+id+'">'+scopeNames[id]+'</button>').join('')+'</div><h3>2 · Agintearen norabidea</h3><p>Sakatu mapako ↻ ikurrak geziak alderantzikatzeko.</p><h3>3 · Legenda</h3><div class="audit-legend"><div><i class="audit-swatch coast-swatch"></i><span data-audit-legend="0"></span></div><div><i class="audit-swatch inland-swatch"></i><span data-audit-legend="1"></span></div></div><button type="button" class="audit-swap" data-audit-swap>↕ Etiketak trukatu</button></aside></div>'+
 '<footer class="audit-footer"><div><strong>Mapa berrikusi eta zigilatu</strong><p class="audit-feedback" role="status" aria-live="polite">Egindako aldaketak mapan ikusiko dituzu. Egiaztatu amaitzean.</p></div><button type="button" class="audit-seal" data-audit-seal><span aria-hidden="true">◈</span> Mapa zigilatu</button></footer></div>';
}
function syncMap(){
 const scene=$('.audit-scene');if(!scene)return;
 const s=data.audit,done=complete(s);
 scene.dataset.scope=s.scope;scene.classList.toggle('audit-complete',done);
 scene.querySelector('.audit-full-fill').setAttribute('mask',s.scope==='almost'?'url(#audit-almost)':'none');
 scene.querySelector('.audit-full-fill').style.display=s.scope==='small'?'none':'';
 scene.querySelector('.audit-small-fill').style.display=s.scope==='small'?'':'none';
 scene.querySelectorAll('[data-audit-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.auditScope===s.scope)));
 scene.querySelectorAll('[data-audit-legend]').forEach(b=>{b.textContent=legendNames[s.legend[Number(b.dataset.auditLegend)]];});
 scene.querySelector('.audit-arrows').innerHTML=ARROWS.map((a,i)=>{
 const [start,end]=s.directions[i]?[a.coast,a.inside]:[a.inside,a.coast];
 return '<path d="M'+start.join(' ')+' Q'+a.bend.join(' ')+' '+end.join(' ')+'" stroke="#73502d" stroke-width="15" stroke-linecap="round" fill="none" opacity=".6"/><path d="M'+start.join(' ')+' Q'+a.bend.join(' ')+' '+end.join(' ')+'" stroke="#fff0bf" stroke-width="10" stroke-linecap="round" fill="none" marker-end="url(#audit-arrowhead)"/>';
 }).join('');
 const feedback=$('.audit-feedback'),n=score(s);
 feedback.textContent=done?'Mapa zigilatuta! Sei erabakiak zuzenak dira.':s.checked?'Berrikusi 18. diapositiba: '+(n.scope+n.arrows+n.legend)+'/6 erabaki zuzen. Zuzendu mapa eta saiatu berriro.':'Egindako aldaketak mapan ikusiko dituzu. Egiaztatu amaitzean.';
 feedback.dataset.result=done?'correct':s.checked?'wrong':'';
 $('[data-audit-seal]').innerHTML=done?'<span aria-hidden="true">✓</span> Karikatura →':'<span aria-hidden="true">◈</span> Mapa zigilatu';
}
function open(name){const title=$('#station-title'),body=$('#station-body');$('#status').textContent='';$('#station').classList.toggle('act-station',name==='act');$('#station').classList.toggle('map-station',name==='map');if(name==='act'){title.textContent='Akta · Berlingo Konferentzia';body.innerHTML=actMarkup();}
else if(name==='map'){title.textContent='Afrikaren mapa';body.innerHTML=mapMarkup();syncMap();}
else if(name==='cartoon'){title.textContent='Karikatura';body.innerHTML='<div class="cartoon-layout"><div><img class="source-image" src="./assets/m3-berlin-karikatura.webp" alt="Afrika tarta baten moduan banatzen duten potentzien karikatura, 18. diapositibatik." onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Karikaturaren jatorrizko irudia falta da. Kontsultatu 18. diapositiba.</p><p class="note">Iturria: 18. diapositiba.</p></div><div><h2>Zer adierazten du karikaturak?</h2><p>Aztertu Afrikaren irudia eta haren inguruan dauden pertsonen ekintza.</p>'+options(cartoonOptions,'cartoon',data.cartoon)+'</div></div>';}
else{title.textContent='Iturria · 18. diapositiba';body.innerHTML='<img class="source-image" src="./assets/m3-berlin-slide18.webp" alt="3.1 Berlingo Konferentzia (1884–85)" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><p hidden>Kontsultatu ikasgelako PDFko 18. diapositiba.</p>';}
if(!$('#station').open)$('#station').showModal();}
$('#station-body').addEventListener('change',e=>{const t=e.target;if(t.dataset.clause){setActClause(t.dataset.clause,t.checked);}else if(t.dataset.chain!==undefined)data.chain[Number(t.dataset.chain)]=t.value;else if(t.name==='cartoon')data.cartoon=t.value;paint();});
$('#station-body').addEventListener('click',e=>{const scope=e.target.closest('[data-audit-scope]');if(scope){changeScope(data.audit,scope.dataset.auditScope);syncMap();paint();return;}const arrow=e.target.closest('[data-audit-arrow]');if(arrow){reverseArrow(data.audit,Number(arrow.dataset.auditArrow));syncMap();paint();return;}if(e.target.closest('[data-audit-swap]')){swapLegend(data.audit);syncMap();paint();return;}if(e.target.closest('[data-audit-seal]')){if(complete(data.audit))open('cartoon');else{seal(data.audit);syncMap();paint();}return;}const remove=e.target.closest('[data-remove-clause]');if(remove){const id=remove.dataset.removeClause;setActClause(id,false);document.querySelector('.act-clause[data-drag-clause="'+id+'"] input')?.focus();return;}const station=e.target.closest('[data-station]');if(station)open(station.dataset.station);});
$('#station-body').addEventListener('dragstart',e=>{const clause=e.target.closest('[data-drag-clause]');if(!clause||!e.dataTransfer)return;e.dataTransfer.setData('text/plain',clause.dataset.dragClause);e.dataTransfer.effectAllowed='copy';});
$('#station-body').addEventListener('dragover',e=>{const slot=e.target.closest('[data-drop-slot]');if(slot){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';slot.classList.add('is-drop-target');}});
$('#station-body').addEventListener('dragleave',e=>{e.target.closest('[data-drop-slot]')?.classList.remove('is-drop-target');});
$('#station-body').addEventListener('drop',e=>{const slot=e.target.closest('[data-drop-slot]');if(!slot||!e.dataTransfer)return;e.preventDefault();slot.classList.remove('is-drop-target');setActClause(e.dataTransfer.getData('text/plain'),true);});
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));$('#notes').addEventListener('click',()=>open('notes'));['#close','#return'].forEach(s=>$(s).addEventListener('click',()=>$('#station').close()));
$('#verify').addEventListener('click',()=>{if(!actFilled()||!mapFilled()||!cartoonFilled())return;const correct=expected.every(x=>data.act.has(x))&&data.act.size===3&&data.chain.join('|')==='expansion|tension|berlin'&&complete(data.audit)&&data.cartoon==='partition';$('#status').textContent=correct?'Berlingo akta zigilatuta · Irakaslearen aurrebista':'Ez da zuzena. Berrikusi erantzun guztiak eta saiatu berriro.';$('#status').className='status '+(correct?'success':'error');});
const art=$('#room-art');const assetError=$('#asset-error');let localUrl=null;function failed(){assetError.hidden=false;}art.addEventListener('error',failed);art.addEventListener('load',()=>{assetError.hidden=true});if(art.complete&&!art.naturalWidth)failed();$('#local-image').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(localUrl)URL.revokeObjectURL(localUrl);localUrl=URL.createObjectURL(file);art.src=localUrl;});
async function init(){try{if(new URLSearchParams(location.search).get('preview')!=='1')throw Error('preview');if(!window.supabase)throw Error('client');const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);const {data:{user},error}=await db.auth.getUser();if(error||!user)throw Error('user');const {data:profile,error:pe}=await db.from('profiles').select('role').eq('id',user.id).single();if(pe||profile?.role!=='teacher')throw Error('role');$('#gate').hidden=true;$('#berlin').hidden=false;paint();}catch{location.replace('./index.html');}}
window.addEventListener('load',init,{once:true});