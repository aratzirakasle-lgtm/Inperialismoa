import { exerciseNavMarkup } from './mission1-navigation.js?v=20261119-teacher-2';
import { galleryIllustration } from './galeria-iconos-color.js?v=20261119-miniaturas2';
/* Museo · Potentzia handien galeria. Las claves de respuestas residen solo en Supabase. */
export const ITEMS=[
["eu_auth_head","Sistema autoritarioak","♜"],
["eu_army","Armadak pisu handia","⚔"],
["eu_monarch","Monarka bat agintari","♛"],
["eu_parliament","Parlamentua kontrolatu","▥"],
["eu_liberal_head","Erregimen liberalak","⚖"],
["eu_separation","Botere-banaketa","⚖"],
["eu_rights","Eskubide berriak (askatasunak)","✧"],
["eu_vote","Sufragio-eskubidea","▣"],
["eu_social","Alderdi sozialistak sortu","♧"],
["ru_autocracy","Autokrazia","♛"],
["ru_tsar","Tsarrak botere guztia","♜"],
["ru_serfs","Jopuak emantzipatu","⛓"],
["ru_ethnic","Etnia-aniztasun handia (errusiartzea)","♧"],
["us_power","Potentzia nagusi berria","↗"],
["us_west","Mendebaldea konkistatu","◈"],
["us_north","Iparraldea: biztanle beltzen eskubideak","⚖"],
["us_south","Hegoaldea: arraza-bereizkeria","⚠"],
["jp_meiji","Meiji aroa (1867–1914)","❀"],
["jp_industry","Herria industrializatu eta modernizatu","⚙"],
["jp_trade","Isolamendua bukatu (merkataritza-akordioak)","⛵"]
].map(([id,label,icon])=>({id,label,icon}));
const LOOKUP=new Map(ITEMS.map(x=>[x.id,x]));
const ZONES=new Set(["eu_auth","eu_liberal","ru","us","jp"]);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function mountGallery(root,{initial={},onSubmit,onContinue,onBack,canSkip=false,preview=false,navigationEnabled=false,navigationPreview=false,draftKey=null,dossierProgress=null}={}){
 if(root.__galleryCleanup)root.__galleryCleanup();
 const controller=new AbortController();
 let touchDrag=null,suppressTouchClick=false;
 root.__galleryCleanup=()=>{
   touchDrag?.ghost?.remove();
   controller.abort();
 };
 // El alumnado no recibe validaciones parciales: solo se sellan las 20 cartas cuando la misión está completa.
 const finished=!!initial.completed_at;
 const state={placements:{},locked:new Set(finished?ITEMS.map(x=>x.id):[]),completed:finished,selected:null,busy:false,attempts:0,feedback:"",wrong:new Set(),help:false,previewFull:false};
 // Los antiguos avances parciales se respetan como borrador editable, sin indicadores de acierto.
 for(const [id,zone] of Object.entries(initial.locked_positions||{})){if(LOOKUP.has(id)&&ZONES.has(zone))state.placements[id]=zone}
 // Guardado local solo de las colocaciones provisionales de esta pestaña.
 // No conserva aciertos como si fueran válidos ni escribe nada en Supabase.
 const saveDraft=()=>{
   if(!draftKey)return;
   try{
     const pending=Object.fromEntries(Object.entries(state.placements).filter(([id])=>!state.locked.has(id)));
     if(Object.keys(pending).length)sessionStorage.setItem(draftKey,JSON.stringify(pending));
     else sessionStorage.removeItem(draftKey);
   }catch(error){console.warn('Borrador local no disponible',error)}
 };
 if(draftKey&&!state.completed){
   try{
     const pending=JSON.parse(sessionStorage.getItem(draftKey)||'{}');
     if(pending&&typeof pending==='object'&&!Array.isArray(pending)){
       for(const [id,zone] of Object.entries(pending))
         if(LOOKUP.has(id)&&ZONES.has(zone)&&!state.locked.has(id))state.placements[id]=zone;
     }
   }catch(error){console.warn('No se pudo recuperar el borrador local',error)}
 }else if(draftKey)saveDraft();
 const count=()=>Object.keys(state.placements).length;
 const refocus=selector=>root.querySelector(selector)?.focus({preventScroll:true});
 const canMove=id=>LOOKUP.has(id)&&!state.locked.has(id)&&!state.busy;
 const place=(id,zone)=>{if(!canMove(id)||!ZONES.has(zone))return;state.placements[id]=zone;state.selected=null;state.wrong.delete(id);state.feedback="";saveDraft();draw();refocus('[data-gallery-zone="'+zone+'"]')};
 const reset=()=>{if(state.busy)return;for(const id of Object.keys(state.placements))if(!state.locked.has(id))delete state.placements[id];state.selected=null;state.wrong.clear();state.feedback="";state.previewFull=false;saveDraft();draw();refocus('[data-gallery-action="reset"]')};
 const tile=(item,placed=false)=>{
   const locked=state.locked.has(item.id),selected=state.selected===item.id;
   return '<button type="button" class="gal-tile '+(placed?'gal-tile-placed ':'')+(locked?'gal-locked ':'')+(selected?'gal-selected ':'')+'" data-gallery-card="'+item.id+'" draggable="'+(!locked&&!state.busy)+'" '+(locked?'disabled':'')+' aria-pressed="'+selected+'" title="'+(locked?'Zuzena':'Sakatu edo arrastatu')+'"><span class="gal-tile-icon" aria-hidden="true">'+(galleryIllustration(item.id)||esc(item.icon))+'</span><span class="gal-tile-name">'+esc(item.label)+'</span>'+(locked?'<span class="gal-tile-check" aria-label="Zuzena">✓</span>':placed?'<span class="gal-tile-move">↗</span>':'')+'</button>';
 };
 const PREVIEW_TEXTS=["Kontzeptu historikoaren eredu luzea","Ikerketako adibide-kartela","Museoko erakusketaren deskribapena","Ereduko kartela"];
 const target=(zone,label,cap)=>{
  const sample=state.previewFull&&navigationPreview;
  const items=ITEMS.filter(x=>state.placements[x.id]===zone);
  const samples=sample?Array.from({length:cap},(_,i)=>'<span class="gal-tile gal-tile-placed gal-preview-sample" aria-label="Diseinu-simulazioko kartela">'+esc(PREVIEW_TEXTS[i%PREVIEW_TEXTS.length])+'</span>').join(''):'';
  return '<div class="gal-zone '+(state.selected?'gal-zone-selectable':'')+'" data-gallery-zone="'+zone+'" tabindex="0" role="button" aria-label="'+esc(label)+': jarri kontzeptua hemen"><div class="gal-zone-heading"><span>'+esc(label)+'</span><small>'+(sample?cap:items.length)+(cap?' / '+cap:'')+'</small></div><div class="gal-zone-list">'+(sample?samples:items.length?items.map(x=>tile(x,true)).join(''):'<span class="gal-zone-placeholder">↓ Arrastatu hona</span>')+'</div></div>';
 };

 // Banderas vectoriales sin marco ni fondo ajeno a la propia tela.
 // La de la UE es un símbolo gráfico contemporáneo para Europa, no una bandera del XIX.
 const flagStars=(cx,cy,outer,inner)=>{
   const points=Array.from({length:10},(_,i)=>{
     const angle=-Math.PI/2+i*Math.PI/5,rad=i%2?inner:outer;
     return (cx+Math.cos(angle)*rad).toFixed(2)+","+(cy+Math.sin(angle)*rad).toFixed(2);
   });
   return '<polygon points="'+points.join(" ")+'"/>';
 };
 const flagSvg=(key)=>{
   const names={eu:"Europar Batasuneko bandera (gaur egungo ikurra)",ru:"Errusiako bandera",us:"Estatu Batuetako bandera",jp:"Japoniako bandera"};
   const clipId="gal-flag-cloth-"+key;
   const cloth="M5 5 C14 2 22 7 31 4 C39 2 47 3 56 5 L56 35 C47 33 39 31 31 35 C21 38 13 32 5 35 Z";
   let graphic="";
   if(key==="eu"){
     graphic='<rect x="5" y="4" width="52" height="32" fill="#003399"/>';
     graphic+='<g fill="#ffcc00">'+Array.from({length:12},(_,i)=>{
       const angle=-Math.PI/2+i*Math.PI/6;
       return flagStars(31+10.5*Math.cos(angle),19.6+10.5*Math.sin(angle),2.45,1.05);
     }).join("")+'</g>';
   }
   if(key==="ru"){
     graphic='<rect x="5" y="4" width="52" height="11" fill="#fff"/><rect x="5" y="15" width="52" height="10" fill="#1345a7"/><rect x="5" y="25" width="52" height="11" fill="#c73542"/>';
   }
   if(key==="jp"){
     graphic='<rect x="5" y="4" width="52" height="32" fill="#fff"/><circle cx="31" cy="19.7" r="9.5" fill="#bc002d"/>';
   }
   if(key==="us"){
     graphic='<rect x="5" y="4" width="52" height="32" fill="#fff"/>';
     for(let i=0;i<13;i+=2)graphic+='<rect x="5" y="'+(4+i*32/13).toFixed(3)+'" width="52" height="'+(32/13).toFixed(3)+'" fill="#b22234"/>';
     graphic+='<rect x="5" y="4" width="23.5" height="17.5" fill="#3c3b6e"/>';
     graphic+='<g fill="#fff">'+Array.from({length:5},(_,row)=>Array.from({length:6},(_,col)=>flagStars(7+col*3.7+(row%2?1.7:0),6+row*3.2,.85,.37)).join("")).join("")+'</g>';
   }
   return '<svg class="gal-flag-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 42" role="img" aria-label="'+names[key]+'" focusable="false"><title>'+names[key]+'</title><defs><clipPath id="'+clipId+'"><path d="'+cloth+'"/></clipPath></defs><g clip-path="url(#'+clipId+')">'+graphic+'</g></svg>';
 };
 /* El XIX europeo no tiene bandera común: medallón museográfico, sin confundirlo con la UE actual. */
 const europeSeal='<svg class="gal-flag-illustration gal-europe-emblem" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 42" role="img" aria-label="Europa, XIX. mendea: museoko domina, ez bandera" focusable="false"><title>Europa XIX. mendea</title><ellipse cx="31" cy="21" rx="27" ry="18" fill="#72512d" stroke="#e1c282" stroke-width="2"/><ellipse cx="31" cy="21" rx="23.5" ry="14.5" fill="#ad8145" stroke="#f3ddb0" stroke-width="0.9"/><text x="31" y="26.6" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-weight="bold" fill="#fff3d7">XIX</text></svg>';
 const flagHtml={eu:europeSeal,ru:flagSvg("ru"),us:flagSvg("us"),jp:flagSvg("jp")};
 const showcase=(key,name,flags,desc,content)=>'<article class="gal-vitrine gal-vitrine-'+key+'"><span class="gal-case-finial" aria-hidden="true"></span><span class="gal-case-column gal-case-column-left" aria-hidden="true"></span><span class="gal-case-column gal-case-column-right" aria-hidden="true"></span><header class="gal-vitrine-top"><h2>'+name+'</h2></header><div class="gal-flag-shelf">'+flagHtml[key]+'</div><div class="gal-vitrine-image gal-photo-'+key+'" role="img" aria-label="'+esc(desc)+'"></div><div class="gal-vitrine-velvet" aria-hidden="true"><span class="gal-case-amber-light"></span></div><span class="gal-case-glass" aria-hidden="true"></span><div class="gal-vitrine-contents">'+content+'</div></article>';

 const museumDecor=`<div class="gal-museum-set" aria-hidden="true">
   <div class="gal-room-cornice"></div>
   <div class="gal-room-lamp gal-room-lamp-one"></div>
   <div class="gal-room-lamp gal-room-lamp-two"></div>
   <aside class="gal-side-art gal-side-art-left"><span class="gal-historical-map-frame" aria-hidden="true"></span></aside>
   <aside class="gal-side-art gal-side-art-right"></aside>
 </div>`;
 function draw(){
   const tray=state.previewFull?[]:ITEMS.filter(x=>!state.placements[x.id]);
   const archiveButton=typeof dossierProgress==='function'?'<div class="m1-archive-open"><button type="button" data-m1-dossier="1">✧ Ikerketa-espedientea <span>'+Math.max(0,Math.min(5,Number(dossierProgress())||0))+' / 5</span></button></div>':'';
   const previewNotice=state.previewFull?'Irakaslearen maketa: 20 adibide-kartela, ez benetako erantzunak. Ez da ezer gordetzen.':'';

   root.innerHTML=(navigationEnabled?exerciseNavMarkup(1):'')+(navigationPreview?'<div class="m1-stage-tools"><span class="m1-teacher-label">Pantailak ikusi (ez da gordetzen):</span><button type="button" data-gallery-action="preview-start">Hasierako pantaila</button><button type="button" data-gallery-action="preview-complete">20 kartela (maketa)</button></div>':'')+archiveButton+'<div class="gal-hall">'+museumDecor+'<header class="gal-masthead"><div class="gal-museum-brand"><strong>INPERIALISMOA</strong><small>MUSEO HISTORIKOA</small></div><div class="gal-museum-chapter"><span>1 / 5</span><span class="gal-chapter-dots"><i></i><i></i><i></i><i></i><i></i></span></div><button type="button" class="gal-return" data-gallery-action="back">← Misiora itzuli</button><div class="gal-topline"><span>INPERIALISMOAREN GARAIA</span><span>1. MISIOA · 1. ARIKETA</span></div><div class="gal-titlebar"><span class="gal-wreath" aria-hidden="true">❧</span><div><span class="gal-title-small">Misioa 1 · 1. ariketa</span><h1><span class="gal-title-prefix">1. MISIOA · </span>Potentzia handien galeria</h1><p>Arrastatu ezaugarriak dagokien erakusleihoetara. Europan, bereizi bi sistema politikoak.</p></div><span class="gal-wreath" aria-hidden="true">❧</span></div><div class="gal-progress-chips"><span>'+(state.previewFull?ITEMS.length+' / '+ITEMS.length+' · maketa':count()+' / '+ITEMS.length+' kokatuta')+'</span><span>✦ '+(state.completed?'Osatua':'Ariketa martxan')+'</span></div></header><section class="gal-display" aria-label="Lau potentzien erakusleihoak">'+
   showcase('eu','EUROPA','🇩🇪 🇫🇷','Europako parlamentua eta industria',target('eu_auth','Sistema autoritarioak',4)+target('eu_liberal','Erregimen liberalak',5))+
   showcase('ru','ERRUSIA','🇷🇺','Errusiako tsarraren garaiko irudia',target('ru','Errusiaren ezaugarriak',4))+
   showcase('us','EEBB','🇺🇸','Estatu Batuetako irudi historikoa',target('us','EEBBko ezaugarriak',4))+
   showcase('jp','JAPONIA','🇯🇵','Japoniako eraikin historikoa',target('jp','Japoniaren ezaugarriak',3))+
   '</section><section class="gal-tray" data-gallery-tray tabindex="0" aria-label="Kontzeptuen erretilua: hautatutako txartela itzultzeko sakatu"><span class="gal-tray-corner gal-tray-corner-tl" aria-hidden="true">❧</span><span class="gal-tray-corner gal-tray-corner-tr" aria-hidden="true">❧</span><span class="gal-tray-corner gal-tray-corner-bl" aria-hidden="true">❧</span><span class="gal-tray-corner gal-tray-corner-br" aria-hidden="true">❧</span><h2><span aria-hidden="true">▣</span> Lotu beharreko kontzeptuak <small>'+tray.length+' falta dira</small></h2><div class="gal-tile-grid">'+(state.previewFull?'<span class="gal-all-placed">Bistaratze-proba bakarrik: 20 adibide-kartela, erantzunik gabe.</span>':tray.length?tray.map(x=>tile(x)).join(''):'<span class="gal-all-placed">Kontzeptu guztiak kokatu dituzue. Egiaztatu!</span>')+'</div></section><div class="gal-museum-tablefront" aria-hidden="true"><span></span></div><div class="gal-bottom-bar"><button type="button" class="gal-action gal-action-outline" data-gallery-action="hint">◉ Laguntza</button><span class="gal-status" role="status" aria-live="polite">'+esc(state.completed?'Zorionak! Kontzeptu guztiak zuzen kokatu dituzue.':previewNotice||state.feedback||(state.selected?'Txartela hautatuta. Aukeratu erakusleihoa edo itzuli mahaira. Esc: ezeztatu.':'Sakatu kontzeptu bat eta dagokion erakusleihoa, edo arrastatu txartela.'))+'</span><button type="button" class="gal-action gal-action-outline" data-gallery-action="reset" '+(state.busy?'disabled':'')+'>↻ Berrabiarazi</button><button type="button" class="gal-action gal-action-primary" data-gallery-action="check" '+(state.busy||state.completed||state.previewFull||Object.keys(state.placements).length!==ITEMS.length?'disabled':'')+'>'+(state.busy?'Egiaztatzen…':'✓ Erantzunak egiaztatu')+'</button>'+(state.completed||canSkip?'<button type="button" class="gal-action gal-action-next" data-gallery-action="next">2. ariketa · Bi sistema, bi Europa →</button>':'')+'</div>'+(state.help?'<p class="gal-hint" role="note">Erabilera: aukeratu txartel bat eta sakatu kokatu nahi duzun eremua, edo arrastatu txartela bertara. Erantzunak «Egiaztatu» botoiarekin egiaztatzen dira.</p>':'')+'<p class="gal-critical">Ohar historikoa: Europako domina museoko ikurra da, ez bandera ofiziala. Beste banderak herrialdeak identifikatzeko erabiltzen dira. Inperialismoak menderatzea eta ustiapena ekarri zituen.</p></div>';
 }
 async function check(){
   if(state.busy||state.completed||state.previewFull)return;
   const answers=Object.fromEntries(Object.entries(state.placements).filter(([id,zone])=>LOOKUP.has(id)&&ZONES.has(zone)));
   if(Object.keys(answers).length!==ITEMS.length){
     state.feedback='Kokatu 20 kontzeptuak egiaztatu aurretik.';draw();return;
   }
   if(preview){state.feedback='Irakaslearen aurrebista: ezin da benetako saiakerarik bidali.';draw();return}
   state.busy=true;draw();
   try{
     const result=await onSubmit(answers);
     if(!result||typeof result.completed!=='boolean')throw Error('Erantzun baliogabea');
     state.completed=result.completed;
     // El servidor solo comunica el resultado global. Nunca revelar ni fijar subconjuntos.
     state.locked=state.completed?new Set(ITEMS.map(x=>x.id)):new Set();
     state.attempts=Number(result.attempt_count||0);
     state.wrong.clear();
     state.feedback=state.completed
      ?'Bikain! Ariketa osoa gainditu duzue. Hurrengo atala prest dago.'
      :'Ariketa ez dago gaindituta. Berrikusi erantzunak eta saiatu berriro.';
     saveDraft();
   }catch(err){
     console.error('Galeria: ezin izan dira erantzunak egiaztatu',err);
     state.feedback='Ezin izan dira erantzunak egiaztatu. Egiaztatu konexioa eta saiatu berriro.';
   }finally{state.busy=false;draw()}
 }
 root.addEventListener('click',e=>{
   if(suppressTouchClick){suppressTouchClick=false;return}
   const action=e.target.closest('[data-gallery-action]')?.dataset.galleryAction;
   if(action){if(action==='preview-start'&&navigationPreview){state.previewFull=false;state.completed=false;state.feedback='Irakaslearen simulazioa: hasierako pantaila.';state.locked=new Set();state.placements={};draw();return}if(action==='preview-complete'&&navigationPreview){state.previewFull=true;state.completed=false;state.locked=new Set();state.placements={};state.selected=null;state.feedback='';draw();return}if(action==='back')onBack?.();if(action==='reset')reset();if(action==='hint'){state.help=!state.help;draw()}if(action==='check')void check();if(action==='next'&&(state.completed||canSkip))onContinue?.();return}
   const card=e.target.closest('[data-gallery-card]');
   if(card){const id=card.dataset.galleryCard;if(canMove(id)){state.selected=state.selected===id?null:id;state.feedback='';draw();refocus('[data-gallery-card="'+id+'"]')}return}
   const zone=e.target.closest('[data-gallery-zone]');if(zone&&state.selected){place(state.selected,zone.dataset.galleryZone);return;}
   if(e.target.closest('[data-gallery-tray]')&&state.selected&&canMove(state.selected)){delete state.placements[state.selected];state.selected=null;saveDraft();draw();refocus('[data-gallery-tray]');}
 },{signal:controller.signal});
 root.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&state.selected){
     const previous=state.selected;state.selected=null;state.feedback='';draw();
     refocus('[data-gallery-card="'+previous+'"]');return;
   }
   const moving=e.target.closest('[data-gallery-card]');
   if(moving&&(e.key==='Delete'||e.key==='Backspace')&&canMove(moving.dataset.galleryCard)&&state.placements[moving.dataset.galleryCard]){
     e.preventDefault();delete state.placements[moving.dataset.galleryCard];state.selected=null;saveDraft();draw();
     refocus('[data-gallery-tray]');return;
   }
   const zone=e.target.matches('[data-gallery-zone]')?e.target:null;if(zone&&state.selected&&(e.key==='Enter'||e.key===' ')){e.preventDefault();place(state.selected,zone.dataset.galleryZone)}else if(e.target.matches('[data-gallery-tray]')&&state.selected&&(e.key==='Enter'||e.key===' ')){e.preventDefault();delete state.placements[state.selected];state.selected=null;saveDraft();draw();refocus('[data-gallery-tray]');}},{signal:controller.signal});
 // Arrastre táctil real: se mantiene además el método de pulsar cartela y vitrina.
 // No calcula respuestas correctas ni modifica la comprobación de Supabase.
 const touchTargets=()=>root.querySelectorAll('.gal-touch-target');
 const cleanTouch=()=>{
   touchDrag?.ghost?.remove();
   touchTargets().forEach(el=>el.classList.remove('gal-touch-target'));
   touchDrag=null;
 };
 root.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'||touchDrag)return;
   const card=e.target.closest('[data-gallery-card]');
   if(!card||!canMove(card.dataset.galleryCard))return;
   touchDrag={id:card.dataset.galleryCard,pid:e.pointerId,card,
     x:e.clientX,y:e.clientY,moving:false,ghost:null};
   if(card.setPointerCapture)card.setPointerCapture(e.pointerId);
 },{signal:controller.signal});
 root.addEventListener('pointermove',e=>{
   const d=touchDrag;
   if(!d||d.pid!==e.pointerId)return;
   if(!d.moving&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<12)return;
   if(!d.moving){
     d.moving=true;
     const ghost=d.card.cloneNode(true);
     ghost.removeAttribute('data-gallery-card');
     ghost.removeAttribute('draggable');
     ghost.removeAttribute('aria-pressed');
     ghost.setAttribute('aria-hidden','true');
     ghost.classList.remove('gal-selected');
     ghost.classList.add('gal-touch-ghost');
     ghost.style.width=Math.min(310,Math.max(175,d.card.getBoundingClientRect().width))+'px';
     root.append(ghost);d.ghost=ghost;
     d.card.classList.add('gal-touch-source');
   }
   e.preventDefault();
   d.ghost.style.left=e.clientX+'px';
   d.ghost.style.top=e.clientY+'px';
   touchTargets().forEach(el=>el.classList.remove('gal-touch-target'));
   const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-gallery-zone], [data-gallery-tray]');
   if(hit&&root.contains(hit))hit.classList.add('gal-touch-target');
 },{signal:controller.signal,passive:false});
 root.addEventListener('pointerup',e=>{
   const d=touchDrag;
   if(!d||d.pid!==e.pointerId)return;
   const hit=d.moving?document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-gallery-zone], [data-gallery-tray]'):null;
   if(d.card.hasPointerCapture?.(e.pointerId))d.card.releasePointerCapture(e.pointerId);
   cleanTouch();
   if(!d.moving)return; // Una pulsación normal sigue seleccionando la cartela.
   e.preventDefault();
   suppressTouchClick=true;
   window.setTimeout(()=>{suppressTouchClick=false},160);
   if(!hit||!root.contains(hit))return; // Dejar la tarjeta donde estaba.
   if(hit.hasAttribute('data-gallery-tray')){
     if(canMove(d.id)){
       delete state.placements[d.id];state.selected=null;saveDraft();draw();
     }
   }else place(d.id,hit.dataset.galleryZone);
 },{signal:controller.signal});
 root.addEventListener('pointercancel',e=>{
   if(touchDrag?.pid===e.pointerId)cleanTouch();
 },{signal:controller.signal});
 root.addEventListener('dragstart',e=>{const card=e.target.closest('[data-gallery-card]');if(!card||!canMove(card.dataset.galleryCard)){e.preventDefault();return}e.dataTransfer.setData('text/plain',card.dataset.galleryCard);e.dataTransfer.effectAllowed='move'},{signal:controller.signal});
 root.addEventListener('dragover',e=>{const zone=e.target.closest('[data-gallery-zone], [data-gallery-tray]');if(zone){e.preventDefault();e.dataTransfer.dropEffect='move';zone.classList.add('gal-dragover')}},{signal:controller.signal});
 root.addEventListener('dragleave',e=>{const zone=e.target.closest('[data-gallery-zone], [data-gallery-tray]');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('gal-dragover')},{signal:controller.signal});
 root.addEventListener('drop',e=>{const zone=e.target.closest('[data-gallery-zone], [data-gallery-tray]');if(!zone)return;e.preventDefault();zone.classList.remove('gal-dragover');const id=e.dataTransfer.getData('text/plain');if(zone.hasAttribute('data-gallery-tray')){if(canMove(id)){delete state.placements[id];state.selected=null;saveDraft();draw()}}else place(id,zone.dataset.galleryZone)},{signal:controller.signal});
 draw();
}