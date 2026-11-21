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
export function mountGallery(root,{initial={},onSubmit,onContinue,onBack,canSkip=false,preview=false,navigationEnabled=false,navigationPreview=false,draftKey=null}={}){
 if(root.__galleryCleanup)root.__galleryCleanup();
 const controller=new AbortController();
 let touchDrag=null,suppressTouchClick=false;
 root.__galleryCleanup=()=>{
   touchDrag?.ghost?.remove();
   controller.abort();
 };
 const state={placements:{},locked:new Set(Array.isArray(initial.locked_ids)?initial.locked_ids:[]),completed:!!initial.completed_at,selected:null,busy:false,attempts:0,feedback:"",wrong:new Set(),help:false};
 for(const [id,zone] of Object.entries(initial.locked_positions||{})){if(LOOKUP.has(id)&&ZONES.has(zone)&&state.locked.has(id))state.placements[id]=zone}
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
 const count=()=>state.locked.size;
 const refocus=selector=>root.querySelector(selector)?.focus({preventScroll:true});
 const canMove=id=>LOOKUP.has(id)&&!state.locked.has(id)&&!state.busy;
 const place=(id,zone)=>{if(!canMove(id)||!ZONES.has(zone))return;state.placements[id]=zone;state.selected=null;state.wrong.delete(id);state.feedback="";saveDraft();draw();refocus('[data-gallery-zone="'+zone+'"]')};
 const reset=()=>{if(state.busy)return;for(const id of Object.keys(state.placements))if(!state.locked.has(id))delete state.placements[id];state.selected=null;state.wrong.clear();state.feedback="";saveDraft();draw();refocus('[data-gallery-action="reset"]')};
 const tile=(item,placed=false)=>{
   const locked=state.locked.has(item.id),selected=state.selected===item.id;
   return '<button type="button" class="gal-tile '+(placed?'gal-tile-placed ':'')+(locked?'gal-locked ':'')+(selected?'gal-selected ':'')+'" data-gallery-card="'+item.id+'" draggable="'+(!locked&&!state.busy)+'" '+(locked?'disabled':'')+' aria-pressed="'+selected+'" title="'+(locked?'Zuzena':'Sakatu edo arrastatu')+'"><span class="gal-tile-icon" aria-hidden="true">'+(galleryIllustration(item.id)||esc(item.icon))+'</span><span class="gal-tile-name">'+esc(item.label)+'</span>'+(locked?'<span class="gal-tile-check" aria-label="Zuzena">✓</span>':placed?'<span class="gal-tile-move">↗</span>':'')+'</button>';
 };
 const target=(zone,label,cap)=>{
  const items=ITEMS.filter(x=>state.placements[x.id]===zone);
  return '<div class="gal-zone '+(state.selected?'gal-zone-selectable':'')+'" data-gallery-zone="'+zone+'" tabindex="0" role="button" aria-label="'+esc(label)+': jarri kontzeptua hemen"><div class="gal-zone-heading"><span>'+esc(label)+'</span><small>'+items.length+(cap?' / '+cap:'')+'</small></div><div class="gal-zone-list">'+(items.length?items.map(x=>tile(x,true)).join(''):'<span class="gal-zone-placeholder">↓ Arrastatu hona</span>')+'</div></div>';
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
 const flagHtml={eu:flagSvg("eu"),ru:flagSvg("ru"),us:flagSvg("us"),jp:flagSvg("jp")};
 const showcase=(key,name,flags,desc,content)=>'<article class="gal-vitrine gal-vitrine-'+key+'"><header class="gal-vitrine-top"><h2>'+name+'</h2></header><div class="gal-flag-shelf">'+flagHtml[key]+'</div><div class="gal-vitrine-image gal-photo-'+key+'" role="img" aria-label="'+esc(desc)+'"></div><div class="gal-vitrine-contents">'+content+'</div></article>';

 const museumDecor=`<div class="gal-museum-set" aria-hidden="true">
  <div class="gal-room-cornice"></div>
  <div class="gal-room-lamp gal-room-lamp-one"></div><div class="gal-room-lamp gal-room-lamp-two"></div>
  <aside class="gal-side-art gal-side-art-left">
   <div class="gal-art-frame">
    <svg viewBox="0 0 240 265" xmlns="http://www.w3.org/2000/svg">
     <defs><linearGradient id="gal-map-paper" x2="0" y2="1"><stop stop-color="#eadab0"/><stop offset="1" stop-color="#c7a878"/></linearGradient></defs>
     <rect width="240" height="265" fill="url(#gal-map-paper)"/>
     <g stroke="#806b46" stroke-width=".6" opacity=".6">
      <path d="M0 22h240M0 55h240M0 88h240M0 121h240M0 154h240M0 187h240M0 220h240M0 248h240"/>
      <path d="M19 0v265M54 0v265M89 0v265M124 0v265M159 0v265M194 0v265M228 0v265"/>
      <ellipse cx="120" cy="119" rx="112" ry="102" fill="none"/>
     </g>
     <g stroke="#775533" stroke-width="1.3" stroke-linejoin="round">
      <path d="M24 37l19-13 27 4 17 15-4 15-17 10 2 15-16 9-13-12-19-5-13-16z" fill="#bd8f5c"/>
      <path d="M58 102l24 12 15 19 3 34-11 42-16 25-13-21 6-25-14-32 5-20-9-19z" fill="#a48953"/>
      <path d="M109 34l13-12 25-6 16 12 35-3 31 23-13 20-34-4-15 19-19-6-9-23-23-4z" fill="#c3a46b"/>
      <path d="M123 77l30 7 14 18-4 44-26 49-19-18-8-41 3-27z" fill="#b68a4c"/>
      <path d="M200 178l19 7 10 15-7 11-29-5-5-16z" fill="#d1af75"/>
      <path d="M169 106l14-4 17 21-9 16-14-8z" fill="#c4a86d"/>
     </g>
     <path d="M23 239C55 195 93 181 125 135s68-64 92-64" fill="none" stroke="#a45239" stroke-width="1.8" stroke-dasharray="4 5" opacity=".75"/>
     <g fill="#4f3a24" font-family="Georgia,serif" text-anchor="middle">
      <text x="120" y="12" font-size="10" font-weight="bold" letter-spacing="3">ATLAS HISTORIKOA</text>
      <text x="120" y="255" font-size="12" font-weight="bold" letter-spacing="3">XIX. MENDEA</text>
     </g>
     <rect x="6" y="6" width="228" height="253" fill="none" stroke="#89653a" stroke-width="2"/>
    </svg>
   </div>
   <div class="gal-frame-caption">Munduko mapa · XIX. mendea</div>
   <div class="gal-antique-books"><i></i><i></i><i></i><i></i></div>
   <div class="gal-globe">
    <svg viewBox="0 0 210 242" xmlns="http://www.w3.org/2000/svg">
     <defs><radialGradient id="gal-globe-g" cx=".28" cy=".22" r=".8"><stop stop-color="#fff4c8"/><stop offset=".4" stop-color="#c0a16f"/><stop offset=".78" stop-color="#907044"/><stop offset="1" stop-color="#473721"/></radialGradient></defs>
     <ellipse cx="106" cy="228" rx="66" ry="11" fill="#28180c" opacity=".7"/>
     <path d="M88 177l12 45h13l10-47" fill="#956b3c" stroke="#e7bd7c" stroke-width="3"/>
     <ellipse cx="106" cy="226" rx="58" ry="8" fill="#b88945" stroke="#41240f" stroke-width="4"/>
     <circle cx="104" cy="97" r="82" fill="url(#gal-globe-g)" stroke="#c89c57" stroke-width="5"/>
     <g fill="none" stroke="#6b512f" stroke-width="1.5" opacity=".8">
      <ellipse cx="104" cy="97" rx="31" ry="82"/><ellipse cx="104" cy="97" rx="63" ry="82"/>
      <path d="M23 97h162M32 62c50 18 100 18 144 0M32 132c50-18 100-18 144 0"/>
      <path d="M47 43c36 21 79 23 120 0M48 153c43-21 84-20 113 0"/>
     </g>
     <g fill="#846b3c" stroke="#46361e" stroke-width=".9" opacity=".83">
      <path d="M45 51l19-15 27 3 4 12-10 8 7 17-19 13-18-3-12-18z"/>
      <path d="M79 95l24 4 16 21-10 20-11 19-14-16-4-24z"/>
      <path d="M119 44l27-13 18 11 12 15-12 13-8-4-16 10-19-9z"/>
      <path d="M116 83l25-4 9 16-14 35-17 9-12-35z"/>
      <path d="M152 142l23 3-7 18-19-8z"/>
     </g>
     <path d="M190 94C197 27 157 1 105 5 29 10 8 77 20 125" fill="none" stroke="#d7ac69" stroke-width="7"/>
     <path d="M183 164l12 13" stroke="#cda26a" stroke-width="8" stroke-linecap="round"/>
    </svg>
   </div>
   <div class="gal-side-table"></div>
   <div class="gal-archive-props">
    <svg viewBox="0 0 150 75" xmlns="http://www.w3.org/2000/svg">
     <path d="M8 43l72-14 53 22-69 16z" fill="#ebd6a5" stroke="#6e4b2c" stroke-width="3"/>
     <path d="M22 51l52-9M30 58l50-10M74 45l30 7" stroke="#907350" stroke-width="1.3"/>
     <path d="M107 13l11 37" stroke="#2c1b11" stroke-width="7" stroke-linecap="round"/>
     <path d="M100 16q-20-14 6-16l14 7 2 14-17 6z" fill="#eee1b0"/>
     <path d="M13 28l6-20 7 22" fill="#ede5c9"/>
     <ellipse cx="31" cy="57" rx="22" ry="15" fill="none" stroke="#bc8c46" stroke-width="7"/>
     <path d="M47 68l20 5" stroke="#bc8c46" stroke-width="8" stroke-linecap="round"/>
    </svg>
   </div>
  </aside>
  <aside class="gal-side-art gal-side-art-right">
   <div class="gal-art-frame">
    <svg viewBox="0 0 240 265" xmlns="http://www.w3.org/2000/svg">
     <defs><linearGradient id="gal-paint-sky" x2="0" y2="1"><stop stop-color="#d2b78b"/><stop offset=".6" stop-color="#eddeb8"/><stop offset="1" stop-color="#836442"/></linearGradient></defs>
     <rect width="240" height="265" fill="url(#gal-paint-sky)"/>
     <path d="M0 170l41-24 30 8 37-19 29 12 25-16 78 36v98H0z" fill="#ae8a5c"/>
     <path d="M0 209l31-18 68 6 42-18 99 6v80H0z" fill="#785a40"/>
     <g fill="#4d3927">
      <circle cx="62" cy="120" r="13"/><path d="M46 132l30-1 7 61-40 4z"/><path d="M43 163L29 221h16l19-40 19 40h13l-22-57z"/>
      <circle cx="137" cy="126" r="12"/><path d="M120 139l33 2 14 52-55 2z"/><path d="M121 183l-8 55h16l10-32 15 32h17l-20-58z"/>
      <path d="M78 113l-15-18 27-22 32-6 30 17-17 15-30-6z"/>
      <path d="M176 75l8-40 5 1-6 47 22 19-8 7-19-23z"/>
      <path d="M44 152l-18-27-9 8 24 39zM153 157l25-25 6 12-24 25z"/>
     </g>
     <path d="M12 234c35-27 96-29 153-18s62 16 75 13" fill="none" stroke="#c2aa7b" stroke-width="4"/>
     <g stroke="#6a5136" opacity=".5">
      <path d="M0 40h240M0 89h240M0 132h240"/>
      <path d="M33 0v265M103 0v265M185 0v265"/>
     </g>
     <rect x="6" y="6" width="228" height="253" fill="none" stroke="#7f623c" stroke-width="2"/>
    </svg>
   </div>
   <div class="gal-frame-caption">Garaiko grabatua</div>
   <div class="gal-glass-prop">
    <svg viewBox="0 0 190 150" xmlns="http://www.w3.org/2000/svg">
     <path d="M33 77a60 58 0 01124 0z" fill="#e5ce9d" stroke="#a17843" stroke-width="4"/>
     <path d="M35 80h123v8H35z" fill="#c5a56f"/>
     <path d="M91 82v23M49 128h88" stroke="#c2a476" stroke-width="6" stroke-linecap="round"/>
     <path d="M85 107l-14 22M99 107l14 22" stroke="#e5c88e" stroke-width="4"/>
     <path d="M60 77c0-24 15-38 35-44M116 35c15 11 20 21 23 42" fill="none" stroke="#b39664" stroke-width="2"/>
     <circle cx="98" cy="29" r="5" fill="#d7a75b"/>
    </svg>
   </div>
   <div class="gal-side-table"></div>
   <div class="gal-telescope-props">
    <svg viewBox="0 0 190 80" xmlns="http://www.w3.org/2000/svg">
     <path d="M26 44l110-28 15 14L39 59z" fill="#9c642e" stroke="#f2c47a" stroke-width="5"/>
     <path d="M34 39l11 22M128 15l12 23" stroke="#3c210f" stroke-width="8"/>
     <ellipse cx="146" cy="28" rx="14" ry="17" fill="#be9048" stroke="#352013" stroke-width="4"/>
     <path d="M95 47l4 19 25 8" fill="none" stroke="#e4ba75" stroke-width="5"/>
     <path d="M111 70l-18-14-15 15" fill="none" stroke="#ba8c4a" stroke-width="5"/>
     <path d="M12 41l9-3 10 20-11 3z" fill="#daba79"/>
    </svg>
   </div>
  </aside>
 </div>`;
 function draw(){
   const tray=ITEMS.filter(x=>!state.placements[x.id]);
   root.innerHTML=(navigationEnabled?exerciseNavMarkup(1):'')+(navigationPreview?'<div class="m1-stage-tools"><span class="m1-teacher-label">Pantailak ikusi (ez da gordetzen):</span><button type="button" data-gallery-action="preview-start">Hasierako pantaila</button><button type="button" data-gallery-action="preview-complete">Amaierako pantaila</button></div>':'')+'<div class="gal-hall">'+museumDecor+'<header class="gal-masthead"><div class="gal-museum-brand"><strong>INPERIALISMOA</strong><small>MUSEO HISTORIKOA</small></div><div class="gal-museum-chapter"><span>1 / 5</span><span class="gal-chapter-dots"><i></i><i></i><i></i><i></i><i></i></span></div><button type="button" class="gal-return" data-gallery-action="back">← Misiora itzuli</button><div class="gal-topline"><span>INPERIALISMOAREN GARAIA</span><span>1. MISIOA · 1. ARIKETA</span></div><div class="gal-titlebar"><span class="gal-wreath" aria-hidden="true">❧</span><div><span class="gal-title-small">Misioa 1 · 1. ariketa</span><h1>Potentzia handien galeria</h1><p>Arrastatu ezaugarriak dagokien erakusleihoetara. Europan, bereizi bi sistema politikoak.</p></div><span class="gal-wreath" aria-hidden="true">❧</span></div><div class="gal-progress-chips"><span>'+count()+' / '+ITEMS.length+' zuzen</span><span>✦ '+(state.completed?'Osatua':'Ariketa martxan')+'</span></div></header><section class="gal-display" aria-label="Lau potentzien erakusleihoak">'+
   showcase('eu','EUROPA','🇩🇪 🇫🇷','Europako parlamentua eta industria',target('eu_auth','Sistema autoritarioak',4)+target('eu_liberal','Erregimen liberalak',5))+
   showcase('ru','ERRUSIA','🇷🇺','Errusiako tsarraren garaiko irudia',target('ru','Errusiaren ezaugarriak',4))+
   showcase('us','EEBB','🇺🇸','Estatu Batuetako irudi historikoa',target('us','EEBBko ezaugarriak',4))+
   showcase('jp','JAPONIA','🇯🇵','Japoniako eraikin historikoa',target('jp','Japoniaren ezaugarriak',3))+
   '</section><section class="gal-tray" data-gallery-tray tabindex="0" aria-label="Kontzeptuen erretilua: hautatutako txartela itzultzeko sakatu"><h2><span aria-hidden="true">▣</span> Lotu beharreko kontzeptuak <small>'+tray.length+' falta dira</small></h2><div class="gal-tile-grid">'+(tray.length?tray.map(x=>tile(x)).join(''):'<span class="gal-all-placed">Kontzeptu guztiak kokatu dituzue. Egiaztatu!</span>')+'</div></section><div class="gal-bottom-bar"><button type="button" class="gal-action gal-action-outline" data-gallery-action="hint">◉ Laguntza</button><span class="gal-status" role="status" aria-live="polite">'+esc(state.completed?'Zorionak! Kontzeptu guztiak zuzen kokatu dituzue.':state.feedback||(state.selected?'Txartela hautatuta. Aukeratu erakusleihoa edo itzuli mahaira. Esc: ezeztatu.':'Sakatu kontzeptu bat eta dagokion erakusleihoa, edo arrastatu txartela.'))+'</span><button type="button" class="gal-action gal-action-outline" data-gallery-action="reset" '+(state.busy?'disabled':'')+'>↻ Berrabiarazi</button><button type="button" class="gal-action gal-action-primary" data-gallery-action="check" '+(state.busy||state.completed||Object.keys(state.placements).length===state.locked.size?'disabled':'')+'>'+(state.busy?'Egiaztatzen…':'✓ Erantzunak egiaztatu')+'</button>'+(state.completed||canSkip?'<button type="button" class="gal-action gal-action-next" data-gallery-action="next">2. ariketa · Bi sistema, bi Europa →</button>':'')+'</div>'+(state.help?'<p class="gal-hint" role="note">Erabilera: aukeratu txartel bat eta sakatu kokatu nahi duzun eremua, edo arrastatu txartela bertara. Erantzunak «Egiaztatu» botoiarekin egiaztatzen dira.</p>':'')+'<p class="gal-critical">Ohar historikoa: Europako banderak adibideak dira, ez XIX. mendeko Europa osoaren bandera. Inperialismoak menderatzea eta ustiapena ekarri zituen.</p></div>';
 }
 async function check(){
   if(state.busy||state.completed)return;
   const answers=Object.fromEntries(Object.entries(state.placements).filter(([id])=>!state.locked.has(id)));
   if(!Object.keys(answers).length){state.feedback='Kokatu gutxienez txartel bat egiaztatu aurretik.';draw();return}
   if(preview){state.feedback='Irakaslearen aurrebista: ezin da benetako saiakerarik bidali.';draw();return}
   state.busy=true;draw();
   try{
     const result=await onSubmit(answers);
     if(!result||!Array.isArray(result.locked))throw Error('Erantzun baliogabea');
     state.locked=new Set(result.locked.filter(id=>LOOKUP.has(id)));
     for(const [id,zone] of Object.entries(result.locked_positions||{}))if(state.locked.has(id)&&ZONES.has(zone))state.placements[id]=zone;
     const wrong=Array.isArray(result.incorrect)?result.incorrect:[];
     state.wrong=new Set(); // Sin marcar tarjetas incorrectas tras comprobar
     for(const id of wrong)if(!state.locked.has(id))delete state.placements[id];
     state.completed=!!result.completed;state.attempts=Number(result.attempt_count||0);
     state.feedback=state.completed?'Bikain! 20/20. Hurrengo atala prest dago.':'Ez da zuzena. Berrikusi sailkapena eta saiatu berriro.';
     saveDraft();
   }catch(err){state.feedback='Ezin izan dira erantzunak bidali. Egiaztatu konexioa eta saiatu berriro.'}
   finally{state.busy=false;draw()}
 }
 root.addEventListener('click',e=>{
   if(suppressTouchClick){suppressTouchClick=false;return}
   const action=e.target.closest('[data-gallery-action]')?.dataset.galleryAction;
   if(action){if(action==='preview-start'&&navigationPreview){state.completed=false;state.feedback='Irakaslearen simulazioa: hasierako pantaila.';state.locked=new Set();state.placements={};draw();return}if(action==='preview-complete'&&navigationPreview){state.completed=true;state.feedback='Irakaslearen simulazioa: amaierako egoera.';draw();return}if(action==='back')onBack?.();if(action==='reset')reset();if(action==='hint'){state.help=!state.help;draw()}if(action==='check')void check();if(action==='next'&&(state.completed||canSkip))onContinue?.();return}
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