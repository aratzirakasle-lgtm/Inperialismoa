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
export function mountGallery(root,{initial={},onSubmit,onContinue,onBack,canSkip=false,preview=false}={}){
 if(root.__galleryCleanup)root.__galleryCleanup();
 const controller=new AbortController();
 root.__galleryCleanup=()=>controller.abort();
 const state={placements:{},locked:new Set(Array.isArray(initial.locked_ids)?initial.locked_ids:[]),completed:!!initial.completed_at,selected:null,busy:false,attempts:0,feedback:"",wrong:new Set(),hint:false};
 for(const [id,zone] of Object.entries(initial.locked_positions||{})){if(LOOKUP.has(id)&&ZONES.has(zone)&&state.locked.has(id))state.placements[id]=zone}
 const count=()=>state.locked.size;
 const canMove=id=>LOOKUP.has(id)&&!state.locked.has(id)&&!state.busy;
 const place=(id,zone)=>{if(!canMove(id)||!ZONES.has(zone))return;state.placements[id]=zone;state.selected=null;state.wrong.delete(id);state.feedback="";draw()};
 const reset=()=>{if(state.busy)return;for(const id of Object.keys(state.placements))if(!state.locked.has(id))delete state.placements[id];state.selected=null;state.wrong.clear();state.feedback="";draw()};
 const tile=(item,placed=false)=>{
   const locked=state.locked.has(item.id),selected=state.selected===item.id;
   return '<button type="button" class="gal-tile '+(placed?'gal-tile-placed ':'')+(locked?'gal-locked ':'')+(selected?'gal-selected ':'')+(state.wrong.has(item.id)?'gal-wrong':'')+'" data-gallery-card="'+item.id+'" draggable="'+(!locked&&!state.busy)+'" '+(locked?'disabled':'')+' aria-pressed="'+selected+'" title="'+(locked?'Zuzena':'Sakatu edo arrastatu')+'"><span class="gal-tile-icon" aria-hidden="true">'+esc(item.icon)+'</span><span class="gal-tile-name">'+esc(item.label)+'</span>'+(locked?'<span class="gal-tile-check" aria-label="Zuzena">✓</span>':placed?'<span class="gal-tile-move">↗</span>':'')+'</button>';
 };
 const target=(zone,label,cap)=>{
  const items=ITEMS.filter(x=>state.placements[x.id]===zone);
  return '<div class="gal-zone '+(state.selected?'gal-zone-selectable':'')+'" data-gallery-zone="'+zone+'" tabindex="0" role="button" aria-label="'+esc(label)+': jarri kontzeptua hemen"><div class="gal-zone-heading"><span>'+esc(label)+'</span><small>'+items.length+(cap?' / '+cap:'')+'</small></div><div class="gal-zone-list">'+(items.length?items.map(x=>tile(x,true)).join(''):'<span class="gal-zone-placeholder">↓ Arrastatu hona</span>')+'</div></div>';
 };
 const flagHtml={
  eu:'<span class="gal-flags"><span class="gal-flag-de" title="Alemania" aria-label="Alemaniako bandera"></span><span class="gal-flag-fr" title="Frantzia" aria-label="Frantziako bandera"></span></span>',
  ru:'<span class="gal-flags"><span class="gal-flag-ru" title="Errusia" aria-label="Errusiako bandera"></span></span>',
  us:'<span class="gal-flags"><span class="gal-flag-us" title="EEBB" aria-label="Estatu Batuetako bandera"></span></span>',
  jp:'<span class="gal-flags"><span class="gal-flag-jp" title="Japonia" aria-label="Japoniako bandera"></span></span>'
 };
 const showcase=(key,name,flags,desc,content)=>'<article class="gal-vitrine gal-vitrine-'+key+'"><header class="gal-vitrine-top">'+flagHtml[key]+'<h2>'+name+'</h2></header><div class="gal-vitrine-image gal-photo-'+key+'" role="img" aria-label="'+esc(desc)+'"></div><div class="gal-vitrine-contents">'+content+'</div></article>';
 function draw(){
   const tray=ITEMS.filter(x=>!state.placements[x.id]);
   root.innerHTML='<div class="gal-hall"><header class="gal-masthead"><button type="button" class="gal-return" data-gallery-action="back">← Misiora itzuli</button><div class="gal-topline"><span>INPERIALISMOAREN GARAIA</span><span>1. MISIOA · 1. ARIKETA</span></div><div class="gal-titlebar"><span class="gal-wreath" aria-hidden="true">❧</span><div><span class="gal-title-small">Misioa 1 · 1. ariketa</span><h1>Potentzia handien galeria</h1><p>Arrastatu ezaugarriak dagokien erakusleihoetara. Europan, bereizi bi sistema politikoak.</p></div><span class="gal-wreath" aria-hidden="true">❧</span></div><div class="gal-progress-chips"><span>'+count()+' / '+ITEMS.length+' zuzen</span><span>✦ '+(state.completed?'Osatua':'Ariketa martxan')+'</span></div></header><section class="gal-display" aria-label="Lau potentzien erakusleihoak">'+
   showcase('eu','EUROPA','🇩🇪 🇫🇷','Europako parlamentua eta industria',target('eu_auth','Sistema autoritarioak',4)+target('eu_liberal','Erregimen liberalak',5))+
   showcase('ru','ERRUSIA','🇷🇺','Errusiako tsarraren garaiko irudia',target('ru','Errusiaren ezaugarriak',4))+
   showcase('us','EEBB','🇺🇸','Estatu Batuetako irudi historikoa',target('us','EEBBko ezaugarriak',4))+
   showcase('jp','JAPONIA','🇯🇵','Japoniako eraikin historikoa',target('jp','Japoniaren ezaugarriak',3))+
   '</section><section class="gal-tray" data-gallery-tray tabindex="0" aria-label="Kontzeptuen erretilua: hautatutako txartela itzultzeko sakatu"><h2><span aria-hidden="true">▣</span> Lotu beharreko kontzeptuak <small>'+tray.length+' falta dira</small></h2><div class="gal-tile-grid">'+(tray.length?tray.map(x=>tile(x)).join(''):'<span class="gal-all-placed">Kontzeptu guztiak kokatu dituzue. Egiaztatu!</span>')+'</div></section><div class="gal-bottom-bar"><button type="button" class="gal-action gal-action-outline" data-gallery-action="hint">◉ Laguntza</button><span class="gal-status" role="status" aria-live="polite">'+esc(state.completed?'Zorionak! Kontzeptu guztiak zuzen kokatu dituzue.':state.feedback||'Sakatu kontzeptu bat eta dagokion erakusleihoa, edo arrastatu txartela.')+'</span><button type="button" class="gal-action gal-action-outline" data-gallery-action="reset" '+(state.busy?'disabled':'')+'>↻ Berrabiarazi</button><button type="button" class="gal-action gal-action-primary" data-gallery-action="check" '+(state.busy||state.completed||Object.keys(state.placements).length===state.locked.size?'disabled':'')+'>'+(state.busy?'Egiaztatzen…':'✓ Erantzunak egiaztatu')+'</button>'+(state.completed||canSkip?'<button type="button" class="gal-action gal-action-next" data-gallery-action="next">Galderetara jarraitu →</button>':'')+'</div>'+(state.hint?'<p class="gal-hint" role="note">Pista: Europan sistema autoritarioak eta liberalak bereizten dira. Errusian tsarrak agintzen zuen; Japonian Meiji aroa izan zen.</p>':'')+'<p class="gal-critical">Ohar historikoa: Europako banderak adibideak dira, ez XIX. mendeko Europa osoaren bandera. Inperialismoak menderatzea eta ustiapena ekarri zituen.</p></div>';
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
     state.wrong=new Set(wrong);
     for(const id of wrong)if(!state.locked.has(id))delete state.placements[id];
     state.completed=!!result.completed;state.attempts=Number(result.attempt_count||0);
     state.feedback=state.completed?'Bikain! 20/20. Hurrengo atala prest dago.':state.locked.size+' kontzeptu zuzen. '+wrong.length+' birkokatu behar dira. Saiakerak: '+state.attempts+'.';
   }catch(err){state.feedback='Ezin izan dira erantzunak bidali. Egiaztatu konexioa eta saiatu berriro.'}
   finally{state.busy=false;draw()}
 }
 root.addEventListener('click',e=>{
   const action=e.target.closest('[data-gallery-action]')?.dataset.galleryAction;
   if(action){if(action==='back')onBack?.();if(action==='reset')reset();if(action==='hint'){state.hint=!state.hint;draw()}if(action==='check')void check();if(action==='next'&&(state.completed||canSkip))onContinue?.();return}
   const card=e.target.closest('[data-gallery-card]');
   if(card){const id=card.dataset.galleryCard;if(canMove(id)){state.selected=state.selected===id?null:id;state.feedback='';draw()}return}
   const zone=e.target.closest('[data-gallery-zone]');if(zone&&state.selected){place(state.selected,zone.dataset.galleryZone);return;}
   if(e.target.closest('[data-gallery-tray]')&&state.selected&&canMove(state.selected)){delete state.placements[state.selected];state.selected=null;draw();}
 },{signal:controller.signal});
 root.addEventListener('keydown',e=>{const zone=e.target.closest('[data-gallery-zone]');if(zone&&state.selected&&(e.key==='Enter'||e.key===' ')){e.preventDefault();place(state.selected,zone.dataset.galleryZone)}else if(e.target.matches('[data-gallery-tray]')&&state.selected&&(e.key==='Enter'||e.key===' ')){e.preventDefault();delete state.placements[state.selected];state.selected=null;draw();}},{signal:controller.signal});
 root.addEventListener('dragstart',e=>{const card=e.target.closest('[data-gallery-card]');if(!card||!canMove(card.dataset.galleryCard)){e.preventDefault();return}e.dataTransfer.setData('text/plain',card.dataset.galleryCard);e.dataTransfer.effectAllowed='move'},{signal:controller.signal});
 root.addEventListener('dragover',e=>{const zone=e.target.closest('[data-gallery-zone], [data-gallery-tray]');if(zone){e.preventDefault();e.dataTransfer.dropEffect='move';zone.classList.add('gal-dragover')}},{signal:controller.signal});
 root.addEventListener('dragleave',e=>{const zone=e.target.closest('[data-gallery-zone], [data-gallery-tray]');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('gal-dragover')},{signal:controller.signal});
 root.addEventListener('drop',e=>{const zone=e.target.closest('[data-gallery-zone], [data-gallery-tray]');if(!zone)return;e.preventDefault();zone.classList.remove('gal-dragover');const id=e.dataTransfer.getData('text/plain');if(zone.hasAttribute('data-gallery-tray')){if(canMove(id)){delete state.placements[id];state.selected=null;draw()}}else place(id,zone.dataset.galleryZone)},{signal:controller.signal});
 draw();
}