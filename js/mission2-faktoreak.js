import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const app=document.querySelector('#m2-app');
const $=(selector,root=document)=>root.querySelector(selector);
const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=value=>String(value??'').replace(/[&<>"']/g,character=>ESC[character]);
const client=window.supabase?.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const previewRequested=new URLSearchParams(location.search).get('preview')==='1';
const activities=[
 {id:1,title:'Kausen kabinetea',sub:'Zergatik hedatu ziren inperioak?',pages:'6. diapositiba',kind:'classification'},
 {id:2,title:'Kapitalaren ibilbideak',sub:'Portuak, kanalak eta trenbideak',pages:'7.–9. diapositibak',kind:'timeline'},
 {id:3,title:'Migrazioen liburua',sub:'Biztanleria eta misio erlijiosoak',pages:'10.–12. diapositibak',kind:'population'},
 {id:4,title:'Boterearen artxiboa',sub:'Propaganda eta nagusitasunaren justifikazioak',pages:'13.–16. diapositibak',kind:'archive'},
 {id:5,title:'Esploratzaileen espedientea',sub:'Ibilbideak eta Kongoko kasua',pages:'17.–18. diapositibak',kind:'expedition'}
];
const causes=[
 ['new_markets','Produktu industrialak saltzeko merkatu berriak'],
 ['cheap_resources','Lehengai eta eskulan merkeak eskuratzea'],
 ['investments','Metatutako kapitala inbertitzea'],
 ['settlement','Europako biztanleak lurralde berrietan finkatzea'],
 ['working_conditions','Langileen bizi-baldintza neketsuetatik ihes egitea'],
 ['conversion','Tokiko biztanleak kristautzeko nahia'],
 ['missions','Misio katolikoak eta protestanteak zabaltzea'],
 ['sea_routes','Itsas eta lurreko bide estrategikoak kontrolatzea'],
 ['chauvinism','Abertzalekeria eta estatuen prestigioa'],
 ['racist_theories','Menderakuntza justifikatzeko teoria arrazistak'],
 ['exploration','Lurraldeak esploratzeko espedizioak']
].map(([id,label])=>({id,label}));
const categories=[
 ['economic','Ekonomikoak'],['demographic','Demografikoak'],
 ['religious','Erlijiosoak'],['political','Politikoak'],
 ['ideological','Ideologikoak / zientifikoak']
].map(([id,label])=>({id,label}));
const infrastructure=[
 ['suez','Suezko kanala'],['hijaz','Hijazko trenbidea'],['panama','Panamako kanala']
].map(([id,label])=>({id,label}));
const archives=[
 {id:'sea',title:'Itsasbideen kontrola',body:'Potentziek itsasoko eta lurreko ibilbide komertzial eta militarrak kontrolatu nahi zituzten; aurkarien hedapena ere oztopatu nahi zuten.',question:'Zer da hemen agertzen den faktore nagusia?',options:[['a','Eskakizun geoestrategikoak'],['b','Biztanleria europarraren hazkundea'],['c','Erlijio-misioak']]},
 {id:'press',title:'Prentsa eta prestigioa',body:'Politikariek, prentsaren laguntzaz, eremu kolonial zabalak eratzea bultzatu zuten herritarren babesa eta prestigioa lortzeko.',question:'Zein kontzepturekin lotzen da iturri hau?',options:[['a','Kapitalen inbertsioarekin'],['b','Abertzalekeriarekin (chauvinismoa)'],['c','Emigrazioarekin']]},
 {id:'missions',title:'Eliza eta kolonizazioa',body:'Eliza katolikoaren eta protestantearen misiolariek Asian, Afrikan eta Ozeanian misioak sortu zituzten.',question:'Nola erabiltzen zen ideia hau hedapena justifikatzeko?',options:[['a','Itsas armadak murriztuz'],['b','Meatzeak eraikiz'],['c','Herrien kristautzea helburu gisa aurkeztuz']]},
 {id:'racism',title:'Arrazismo zientifikoa',body:'XIX. mendean teoria arrazistak biologiaren itxurarekin aurkezten ziren, menderakuntza koloniala zuritzeko. Ez dira azalpen zientifiko baliozkoak.',question:'Zer funtzio zuten teoria horiek kolonialismoan?',options:[['a','Menderakuntza arrazista justifikatzea'],['b','Herrien arteko eskubide-berdintasuna defendatzea'],['c','Merkataritza-hesiak desagerraraztea']]},
 {id:'source1863',title:'1863ko iturri historikoa',body:'Londresko Elkarte Antropologikoko saio bateko testu batek pertsona beltzak gutxiesten zituen eta europarren nagusitasuna defendatzen zuen.',question:'Zer moduz aztertu behar dugu lekukotasun hori?',options:[['a','Giza taldeen gaitasunen froga objektibo gisa'],['b','Garai hartako arrazakeriaren adibide kritiko gisa'],['c','Biztanleriaren zentsu zehatz gisa']]}
];
const riverOptions=[['nile','Nilo'],['niger','Niger'],['congo','Kongo'],['zambezi','Zambeze'],['suez','Suez'],['panama','Panama']];
const asiaOptions=[['himalaya','Himalaia'],['siberia','Siberia'],['australia','Australiako basamortua'],['nile','Nilo'],['suez','Suez']];
let teacher=false,teamId=null,active=1,selected=null,submitting=false,teacherEnding=false;
let completions=new Set(),draft={},feedback='',feedbackState='';
const steps=[1,2,3,4,5];
const responseKeys={
 1:causes.map(item=>item.id),
 2:['1869','1908','1914','funding','works'],
 3:['1850','1870','1900','migration','missionaries','route_africa','route_asia','route_oceania','statement_1','statement_2','statement_3','statement_4','statement_5','bag_growth','bag_conditions','bag_better','bag_conversion','bag_settlement','bag_missions','bag_oceania','bag_faith'],
 4:archives.map(item=>item.id),
 5:['africa','asia','north','south','meeting','congo']
};
function activity(n){return activities.find(item=>item.id===n)}
function taskState(n){if(!draft[n])draft[n]={};return draft[n]}
function currentNext(){return steps.find(n=>!completions.has(n))||5}
function canOpen(n){return teacher||completions.has(n)||n===currentNext()}
function setFeedback(value,kind=''){feedback=value;feedbackState=kind;const status=$('#m2-feedback');if(status){status.textContent=value;status.dataset.state=kind}}
function cardMessage(title,message){
 app.innerHTML='<div class="m2-message-card"><span class="m2-eyebrow">MISIOA 02</span><h1>'+esc(title)+'</h1><p>'+esc(message)+'</p><a class="m2-link" href="./index.html">← Museora itzuli</a></div>';
}
async function initialize(){
 if(!client){cardMessage('Konexioa ez dago prest','Ezin izan da identifikazio-sistema kargatu. Berritu orria.');return}
 try{
  const auth=await client.auth.getUser();
  const authUser=auth.data?.user;
  if(auth.error||!authUser){location.replace('./index.html#mission2');return}
  const profileResult=await client.from('profiles').select('id,role,team_id').eq('id',authUser.id).single();
  if(profileResult.error||!profileResult.data)throw Error('Erabiltzaile-profila ez dago eskuragarri');
  const profile=profileResult.data;
  teacher=profile.role==='teacher'&&previewRequested;
  if(profile.role==='teacher'&&!teacher){location.replace('./inperialismoaren-faktoreak.html?preview=1');return}
  if(!teacher){
   if(profile.role!=='student'||!profile.team_id){cardMessage('Sarrera mugatua','Talde bateko ikasle gisa sartu behar duzu.');return}
   teamId=profile.team_id;
   const badge=await client.from('mission_badges').select('mission_id').eq('team_id',teamId).eq('mission_id',1).limit(1);
   if(badge.error)throw badge.error;
   if(!badge.data?.length){cardMessage('Bigarren misioa blokeatuta','Lehen misioa osatu behar duzue bigarren misioan sartzeko.');return}
   const saved=await client.from('mission2_exercise_completions').select('exercise,completed_at').eq('team_id',teamId);
   if(saved.error){
    console.warn('2. misioaren egitura ez dago oraindik aktibatuta:',saved.error.message);
    cardMessage('Bigarren misioa prestatzen','Bost ariketak prestatuta daude, baina irakasleak oraindik datu-baseko aktibazioa amaitu behar du.');return;
   }
   completions=new Set((saved.data||[]).map(x=>Number(x.exercise)).filter(x=>steps.includes(x)));
   active=currentNext();
  }
  render();
 }catch(error){console.error('M2 hasiera:',error);cardMessage('Ezin izan da misioa kargatu','Konexioa edo sarbidea egiaztatu eta saiatu berriro.')}
}
function hero(){
 return '<header class="m2-hero"><div><span class="m2-eyebrow">MUSEO DIGITALA · BIGARREN MISIOA</span>'+
 '<h1>Inperialismoaren faktoreak</h1><p>Ekonomia, biztanleria, erlijioa, politika eta ideologiak: zergatik hedatu ziren potentzia kolonialak? Bost aretotan aztertuko duzue. Erantzun okerrek ez dute pistarik emango.</p></div>'+
 '<div class="m2-hero-seal" aria-hidden="true"><strong>02</strong><span>IKERKETA HISTORIKOA</span></div></header>';
}
function nav(){
 return '<ol class="m2-steps" aria-label="Bost ariketen aurrerapena">'+activities.map(item=>
  '<li><button type="button" class="m2-step '+(completions.has(item.id)?'m2-done':'')+'" data-open="'+item.id+'" '+(canOpen(item.id)?'':'disabled')+' '+(active===item.id?'aria-current="step"':'')+' title="'+esc(item.title)+'"><strong>'+(completions.has(item.id)?'✓':item.id)+'</strong><span>'+esc(item.title)+'</span></button></li>'
 ).join('')+'</ol>';
}
function intro(){
 const item=activity(active);
 return '<div class="m2-section-head"><div><span class="m2-eyebrow">ARIKETA '+active+' / 5</span>'+
 '<h2>'+esc(item.title)+'</h2><p>'+esc(item.sub)+' · Aukeratu eta kokatu elementuak. Erantzun guztiak osatu ondoren egiaztatu ahal izango duzue.</p></div>'+
 '<span class="m2-chip">'+esc(item.pages)+'</span></div>';
}

/* Ilustraciones vectoriales integradas: piezas del gabinete histórico.
 * Son decorativas; las tarjetas y vitrinas siguen siendo HTML interactivo. */
const museumDrawings={
 coins:'<ellipse cx="39" cy="63" rx="26" ry="10" fill="#f8cb48" stroke="#805018" stroke-width="3"/><path d="M13 40v23c0 6 52 6 52 0V40" fill="#d9941c" stroke="#805018" stroke-width="3"/><ellipse cx="39" cy="40" rx="26" ry="10" fill="#ffdd68" stroke="#805018" stroke-width="3"/><path d="M13 51c17 10 35 10 52 0M13 60c17 10 35 10 52 0" stroke="#9e621a" stroke-width="2"/><path d="M57 32V18c0-7 29-7 29 0v34c0 6-29 6-29 0" fill="#dc9925" stroke="#81501c" stroke-width="3"/><ellipse cx="71.5" cy="18" rx="14.5" ry="6" fill="#ffe27c" stroke="#81501c" stroke-width="3"/><path d="M58 29c8 5 20 5 28 0M58 39c8 5 20 5 28 0" stroke="#9b671e" stroke-width="2"/>',
 ship:'<path d="M8 56h84l-13 16H23z" fill="#5d3623" stroke="#2b2720" stroke-width="3"/><path d="M19 53V34h60v19z" fill="#e7dcb8" stroke="#50412e" stroke-width="3"/><path d="M30 31V14h40v17" fill="#d9c6a1" stroke="#50412e" stroke-width="3"/><rect x="52" y="6" width="11" height="30" rx="2" fill="#383635"/><path d="M63 11h25M75 11v23" stroke="#45423b" stroke-width="3"/><circle cx="30" cy="41" r="4" fill="#4b9fb3"/><circle cx="46" cy="41" r="4" fill="#4b9fb3"/><circle cx="62" cy="41" r="4" fill="#4b9fb3"/><path d="M8 80q12-9 24 0t24 0t24 0t20 0" fill="none" stroke="#71b4c4" stroke-width="5"/>',
 church:'<path d="M17 72V38l32-21 34 21v34z" fill="#e7be76" stroke="#67422d" stroke-width="3"/><path d="M12 37L49 13l39 24" stroke="#7d4332" stroke-width="5"/><path d="M43 72V49q6-8 12 0v23" fill="#6a3e35"/><rect x="27" y="45" width="10" height="12" rx="5" fill="#8bb4ad"/><rect x="66" y="45" width="10" height="12" rx="5" fill="#8bb4ad"/><path d="M49 3v27M40 11h18" stroke="#b67918" stroke-width="6" stroke-linecap="round"/>',
 cannon:'<path d="M8 71h84" stroke="#4d5630" stroke-width="7"/><circle cx="32" cy="61" r="13" fill="#a37135" stroke="#483629" stroke-width="4"/><circle cx="32" cy="61" r="4" fill="#edc884"/><path d="M28 47l31-24 18 11-31 25" fill="#344a43" stroke="#1d3337" stroke-width="4"/><path d="M60 24l14-11 16 8-13 13" fill="#687a60" stroke="#1d3337" stroke-width="3"/><path d="M10 72V33h14V20h15v12h17" fill="#c9ad71" stroke="#7e6034" stroke-width="3"/><path d="M7 34h46" stroke="#866338" stroke-width="3"/>',
 globe:'<circle cx="42" cy="35" r="28" fill="#83aca8" stroke="#5b492c" stroke-width="4"/><ellipse cx="42" cy="35" rx="13" ry="27" stroke="#426e67" stroke-width="2" fill="none"/><path d="M16 35h52M24 18h36M24 53h36" stroke="#426e67" stroke-width="2"/><path d="M30 22l13-6 8 8-6 8-14 0-6 8-9-9zM45 42l14 4-6 9-12 3-6-7z" fill="#d2b869" opacity=".88"/><path d="M10 63L30 83h55" stroke="#825b35" stroke-width="5" fill="none"/><path d="M40 64v14M26 79h37" stroke="#9a6e34" stroke-width="4"/><path d="M69 50l19-8 8 25-22 8z" fill="#8a4934" stroke="#5a3d2c" stroke-width="3"/><path d="M72 57l21-8" stroke="#e8bb65" stroke-width="2"/>',
 factory:'<path d="M10 73V37l21 13V36l20 13V22h35v51z" fill="#9d5036" stroke="#5e362e" stroke-width="3"/><path d="M55 18V4h13v18" fill="#6f6050"/><path d="M77 23V7h8v22" fill="#6f6050"/><path d="M60 5q-12-8-8-17M83 6q-10-9-8-17" stroke="#a6a49a" stroke-width="5" opacity=".85"/><path d="M19 59h11m7 0h11m10 0h11m7 0h8" stroke="#f9c579" stroke-width="6"/>',
 bullion:'<path d="M7 59l16-24h29l16 24z" fill="#e5a72e" stroke="#97672e" stroke-width="3"/><path d="M30 73l16-24h30l15 24z" fill="#e5ad37" stroke="#97672e" stroke-width="3"/><path d="M15 58h46m-24 15h45" stroke="#fff0aa" stroke-width="3"/>',
 people:'<circle cx="22" cy="18" r="10" fill="#57496c"/><circle cx="50" cy="13" r="12" fill="#57496c"/><circle cx="78" cy="18" r="10" fill="#57496c"/><path d="M10 41q12-10 24 0v30H10zM37 37q13-15 27 0v37H37zM66 41q12-10 24 0v30H66z" fill="#695c83"/><path d="M22 60v18m28-17v20m28-21v19" stroke="#463d57" stroke-width="5"/>',
 suitcase:'<rect x="22" y="32" width="51" height="41" rx="4" fill="#9c6c45" stroke="#543f34" stroke-width="4"/><path d="M37 31V21q12-10 22 0v10M48 33v40" stroke="#4e392b" stroke-width="4"/><path d="M18 74h62" stroke="#e7be72" stroke-width="3"/><circle cx="24" cy="18" r="11" fill="#5e7667"/><path d="M8 50q11-24 25 0" stroke="#5e7667" stroke-width="10"/>',
 cross:'<path d="M44 7h12v23h22v13H56v36H44V43H22V30h22z" fill="#c9a151" stroke="#7a552a" stroke-width="3"/><path d="M50 8v70" stroke="#fae5b0" stroke-width="2"/>',
 wheel:'<circle cx="50" cy="42" r="27" fill="#d1b881" stroke="#6e4824" stroke-width="6"/><circle cx="50" cy="42" r="10" fill="#d1b881" stroke="#6e4824" stroke-width="4"/><path d="M50 2v80M10 42h80M21 13l58 58M79 13L21 71" stroke="#6e4824" stroke-width="5"/><circle cx="50" cy="42" r="4" fill="#a65d24"/>',
 shield:'<path d="M50 5L85 19v27q-7 31-35 40-28-9-35-40V19z" fill="#8f392b" stroke="#c19c4e" stroke-width="5"/><path d="M50 18l6 20h21L60 51l6 20-16-12-16 12 6-20-17-13h21z" fill="#eac05c"/>',
 flags:'<path d="M27 12v68M70 10v70" stroke="#624b38" stroke-width="5"/><path d="M29 14q22-9 36 0v29q-20-10-36 0z" fill="#ad3d3b" stroke="#663830" stroke-width="3"/><path d="M72 12q18-10 23 2v28q-12-8-23 0z" fill="#d3a13d" stroke="#755322" stroke-width="3"/>',
 microscope:'<path d="M39 11l20 10-17 35-20-10z" fill="#53756a" stroke="#314f4a" stroke-width="4"/><path d="M33 8l37 18" stroke="#d6ab62" stroke-width="7"/><path d="M62 38q22 30-12 33M34 74h49" stroke="#38594e" stroke-width="8" fill="none"/><path d="M21 78h70" stroke="#786144" stroke-width="8"/>',
 maps:'<path d="M10 17l25-6 27 8 28-9v56l-28 8-27-8-25 6z" fill="#e7c47e" stroke="#815f39" stroke-width="3"/><path d="M35 11v55m27-47v55" stroke="#aa8556" stroke-width="2"/><path d="M20 39l16-11 20 18 22-17M52 50l14 9" stroke="#6a9473" stroke-width="5" fill="none"/><circle cx="68" cy="35" r="6" fill="#a34e36"/>'
};
/* Figuras históricas decorativas, independientes del contenido evaluable. */
const museumSceneFigures={
 economic:'<g transform="translate(152 39)"><path d="M8 17Q-4 0 21 0H40Q58 23 42 40L52 77Q27 90 1 75L0 46Z" fill="#b78b56" stroke="#6c4625" stroke-width="4"/><path d="M8 27Q29 33 43 25M6 56Q30 66 48 56" stroke="#eed19b" stroke-width="3" fill="none"/></g><g transform="translate(194 105)"><rect width="34" height="33" rx="3" fill="#805031" stroke="#30231a" stroke-width="3"/><path d="M3 9H31M17 1V31" stroke="#deb575" stroke-width="3"/></g>',
 demographic:'<g transform="translate(0 121)" fill="#293c3a" stroke="#ad9571" stroke-width="1.5"><circle cx="20" cy="5" r="7"/><path d="M8 15q12-8 24 0l5 29H4z"/><circle cx="55" cy="5" r="7"/><path d="M43 15q12-8 24 0l6 29H39z"/><circle cx="90" cy="5" r="7"/><path d="M78 15q12-8 24 0l6 29H74z"/></g>',
 religious:'<g transform="translate(5 112)" stroke="#3b2b29" stroke-width="2"><circle cx="28" cy="8" r="8" fill="#987057"/><path d="M16 19q12-7 24 0l5 29H11z" fill="#3c3535"/><circle cx="73" cy="13" r="8" fill="#986d52"/><path d="M61 24q12-9 24 0l6 23H54z" fill="#a96d48"/><circle cx="119" cy="14" r="8" fill="#a87d62"/><path d="M106 24q13-11 26 0l6 23H98z" fill="#5f7c72"/><circle cx="165" cy="13" r="8" fill="#9c7356"/><path d="M153 23q12-10 24 0l6 23H146z" fill="#895d86"/><circle cx="208" cy="14" r="8" fill="#9c6d54"/><path d="M196 24q12-8 24 0l6 23H190z" fill="#d3a16c"/></g>',
 political:'<g transform="translate(4 108)" stroke="#2d2926" stroke-width="2"><circle cx="26" cy="10" r="8" fill="#ce9565"/><path d="M16 20q10-9 20 0l5 29H11z" fill="#b43830"/><path d="M16 1H36L40 7H12z" fill="#273234"/><path d="M19 49V65M34 49V65" stroke="#25363b" stroke-width="7"/><circle cx="70" cy="10" r="8" fill="#ca9465"/><path d="M60 20q10-9 20 0l5 29H55z" fill="#a93430"/><path d="M60 1H80L84 7H56z" fill="#273234"/><path d="M63 49V65M78 49V65" stroke="#25363b" stroke-width="7"/></g><path d="M48 108V170M91 108V170" stroke="#444039" stroke-width="3"/>',
 ideological:'<g transform="translate(151 113)"><path d="M0 13Q18 0 41 13Q61 0 88 15L84 53Q62 42 42 56Q19 42 4 53Z" fill="#eed9a4" stroke="#7e5d34" stroke-width="3"/><path d="M42 15V53" stroke="#b99860" stroke-width="3"/><path d="M8 21q17-7 29 0M8 31q17-7 29 0M47 22q15-7 31 0M47 31q15-7 31 0" fill="none" stroke="#af8b5c" stroke-width="1.5"/></g><g transform="translate(4 108)"><circle cx="38" cy="24" r="24" fill="none" stroke="#d6ac62" stroke-width="4"/><ellipse cx="38" cy="24" rx="11" ry="24" fill="none" stroke="#b68a52" stroke-width="2"/><path d="M12 24H64M38 0V50M38 50V63M16 63H61" stroke="#b88946" stroke-width="4"/></g>'
};
function museumSceneDetails(kind){
 return '<svg class="m2-case-details" aria-hidden="true" focusable="false" viewBox="0 0 240 170">'+(museumSceneFigures[kind]||'')+'</svg>';
}
const museumCardArt={
 new_markets:'factory',cheap_resources:'coins',investments:'bullion',
 settlement:'people',working_conditions:'suitcase',
 conversion:'cross',missions:'church',sea_routes:'wheel',
 chauvinism:'flags',racist_theories:'microscope',exploration:'maps'
};
// Rótulos breves como en la maqueta aprobada; la descripción original
// permanece íntegra en title y aria-label, sin alterar los IDs ni la corrección.
const museumCardShort={
 new_markets:'Merkatu berriak',
 cheap_resources:'Lehengai merkeak',
 investments:'Kapitala inbertitu',
 settlement:'Europako biztanleria finkatzea',
 working_conditions:'Emigrazioari irteera ematea',
 conversion:'Herriak kristautzea',
 missions:'Misio katolikoak eta protestanteak',
 sea_routes:'Itsas-bideen kontrola',
 chauvinism:'Abertzalekeria (chauvinismoa)',
 racist_theories:'Teoria arrazistak',
 exploration:'Lurrak esploratu eta ezagutzea'
};
const museumCategoryArt={
 economic:'coins',demographic:'ship',religious:'church',
 political:'cannon',ideological:'globe'
};
function museumIllustration(kind,large=false){
 const shapes=museumDrawings[kind]||museumDrawings.maps;
 return '<svg class="m2-illustration '+(large?'m2-illustration-large':'')+'" viewBox="0 0 100 92" role="img" aria-label="'+esc(kind)+'" focusable="false" xmlns="http://www.w3.org/2000/svg">'+shapes+'</svg>';
}
function museumHeader(){
 return '<header class="m2-hero m2-museum-title-row">'+
 '<div class="m2-museum-mission-plaque"><span class="m2-museum-world" aria-hidden="true">◉</span><div><strong>2. MISIOA</strong><span>Inperialismoaren faktoreak</span></div></div>'+
 '<div class="m2-museum-title"><h1>1. Kausen kabinetea</h1><p>Inperialismoa zergatik hedatu zen?</p></div>'+
 '<div class="m2-museum-step-holder"><span class="m2-sr-only">Bost ariketak</span>'+nav()+'</div></header>';
}
function museumInstruction(){
 return '<div class="m2-museum-instructions"><span class="m2-museum-hand" aria-hidden="true">☞</span> Dagozkion arrazoien arabera, kokatu beheko txartelak bost faktore hauetan:</div>';
}
function renderClassification(){
 const state=taskState(1),assigned=state.assignments||{};
 function tile(c){
  const catalogNumber=String(causes.indexOf(c)+1).padStart(2,'0');
  return '<button type="button" draggable="true" data-card="'+c.id+'" class="m2-tile m2-museum-card m2-archive-card" title="'+esc(c.label)+'" aria-label="'+esc(c.label)+'" aria-pressed="'+(selected===c.id)+'">'+
   '<span class="m2-museum-card-art" aria-hidden="true"><img class="m2-card-miniature" src="./assets/m2-card-'+c.id+'.svg" alt="" draggable="false" loading="eager"></span>'+
   '<span class="m2-card-copy-group"><span class="m2-museum-card-copy">'+esc(museumCardShort[c.id]||c.label)+'</span>'+
   '<span class="m2-card-archive-mark" aria-hidden="true">AGIRIA · '+catalogNumber+'</span></span>'+
   '<span class="m2-card-foil" aria-hidden="true">✦</span></button>';
 }
 const cabinets=categories.map(cat=>{
  const inside=causes.filter(c=>assigned[c.id]===cat.id);
  const cabinetTitle=cat.id==='ideological'?'Ideologikoak /<br> zientifikoak':esc(cat.label);
  return '<article class="m2-museum-case m2-case-'+cat.id+'" data-zone="'+cat.id+'" aria-label="'+esc(cat.label)+'">'+
   '<span class="m2-case-crown" aria-hidden="true"></span><div class="m2-case-arch"><img class="m2-case-scene" src="./assets/m2-painted-'+cat.id+'.svg" alt="" loading="eager" draggable="false"><span class="m2-case-spot" aria-hidden="true"></span>'+museumSceneDetails(cat.id)+'<div class="m2-case-icon" aria-hidden="true">'+museumIllustration(museumCategoryArt[cat.id],true)+'</div>'+
   '<h3 class="m2-case-title"><button type="button" class="m2-case-title-action" aria-label="'+esc(cat.label)+' faktorean kokatu">'+cabinetTitle+'</button></h3></div>'+
   '<div class="m2-case-well"><button class="m2-case-target" type="button" aria-label="'+esc(cat.label)+' faktorean kokatu">+</button>'+
   '<div class="m2-case-contents">'+inside.map(c=>tile(c)).join('')+'</div>'+
   (!inside.length?'<span class="m2-case-empty">0 kartela kokatuta</span>':'')+
   '</div><span class="m2-case-foot" aria-hidden="true"></span><span class="m2-case-foundation" aria-hidden="true"><span class="m2-case-lock"></span></span></article>';
 }).join('');
 const unassigned=causes.filter(c=>!assigned[c.id]);
 return '<section class="m2-museum-interaction" aria-label="Bost faktoreen kabinetearen sailkapena">'+
  '<div class="m2-museum-cabinet-wall">'+cabinets+'</div>'+
  '<div class="m2-museum-desktop"><span class="m2-desk-left-trim" aria-hidden="true"></span><span class="m2-desk-right-trim" aria-hidden="true"></span><div class="m2-museum-desktop-top"><span>TXARTEL HISTORIKOAK · '+(unassigned.length)+' / '+causes.length+'</span>'+
  '<span class="m2-museum-drag">☞ &nbsp; Aukeratu edo arrastatu</span></div>'+
  '<div class="m2-museum-cards" data-unassign aria-label="Sailkatu gabeko kartelak">'+unassigned.map(tile).join('')+
  (unassigned.length===0?'<p class="m2-museum-all-placed">Kartel guztiak kokatuta. Orain, egiaztatu erantzunak.</p>':'')+'</div><span class="m2-desk-front" aria-hidden="true"><span class="m2-desk-cabinet"></span></span></div></section>';
}

function renderTimeline(){
 const state=taskState(2);
 const taken=new Set(['1869','1908','1914'].map(year=>state[year]).filter(Boolean));
 const events=infrastructure.map(item=>'<button type="button" class="m2-tile '+(taken.has(item.id)?'m2-used':'')+'" data-event="'+item.id+'" aria-pressed="'+(selected===item.id?'true':'false')+'">'+esc(item.label)+'</button>').join('');
 const years=['1869','1908','1914'].map(year=>{
  const record=infrastructure.find(item=>item.id===state[year]);
  return '<button type="button" class="m2-year '+(record?'m2-selected-year':'')+'" data-year="'+year+'"><strong>'+year+'</strong><span>'+(record?esc(record.label):'Hautatu obra bat eta kokatu hemen')+'</span></button>';
 }).join('');
 return '<div class="m2-panel"><h3>Azpiegituren kronologia</h3><p class="m2-caption">Kolonialismoan, metatutako kapitalarekin kredituak eman eta garraio-azpiegiturak finantzatu ziren.</p>'+
 '<div class="m2-tray">'+events+'</div><div class="m2-timeline">'+years+'</div>'+
 '<div class="m2-form-row"><label class="m2-field">Nola erabili zen metatutako kapitala?<select data-field="funding"><option value="">Aukeratu</option>'+
 option('credits','Kredituak emanez',state.funding)+option('salaries','Soldatak soilik ordainduz',state.funding)+option('donations','Opari pribatuak eginez',state.funding)+'</select></label>'+
 '<label class="m2-field">Zer lan mota finantzatu ziren?<select data-field="works"><option value="">Aukeratu</option>'+
 option('rail_ports_canals','Trenbideak, portuak eta kanalak',state.works)+option('palaces_only','Jauregiak soilik',state.works)+option('schools_only','Eskolak soilik',state.works)+'</select></label></div>'+
 '<aside class="m2-evidence">Iturriak: Suezko kanalaren inaugurazioa (1869), Hijazko trenbidea (1908) eta Panamako kanala (1914). Biak, garraioa eta kapital-inbertsioa, hedapen ekonomikoarekin lotzen dira.</aside></div>';
}
function option(id,label,actual){return '<option value="'+id+'" '+(actual===id?'selected':'')+'>'+esc(label)+'</option>'}
/* Una sala, cuatro actividades: atlas fiel al concepto visual elegido.
 * Los campos y las opciones de la parte teórica provienen de las págs. 10-12
 * del PDF del proyecto. Las nuevas respuestas también deben añadirse a la
 * clave privada de Supabase antes de publicar esta rama. */
const atlasRoutes=[
 {id:'africa',title:'Afrika',x:52,y:52},
 {id:'asia',title:'Asia',x:84,y:36},
 {id:'oceania',title:'Ozeania',x:88,y:76}
];
const atlasStatements=[
 ['statement_1','1850ean Europako biztanleria 266 milioikoa zen.'],
 ['statement_2','1870ean Europako biztanleria 450 milioikoa zen.'],
 ['statement_3','Langileen bizi-baldintza gogorrek kolonizatutako lurretan aukera berriak bilatzera bultzatu zituzten.'],
 ['statement_4','Eliza katoliko eta protestanteek Asian, Afrikan eta Ozeanian misioak sortu zituzten.'],
 ['statement_5','Erlijioa ez zen inoiz kolonizazioa justifikatzeko erabili.']
];
const atlasSuitcase=[
 ['growth','Europako biztanleria-hazkundea','m2-card-settlement.svg'],
 ['conditions','Langileen bizi-baldintza neketsuak','m2-card-working_conditions.svg'],
 ['better','Bizi-aukera hobeak bilatzeko nahia','m2-card-settlement.svg'],
 ['conversion','Tokiko herriak kristautzeko nahia','m2-card-conversion.svg'],
 ['settlement','Europarrak lurralde berrietan finkatzea','m2-card-exploration.svg'],
 ['missions','Misio katoliko eta protestanteak sortzea','m2-card-missions.svg'],
 ['oceania','Misioak Ozeanian zabaltzea','m2-card-missions.svg'],
 ['faith','Tokiko erlijioen desagerpena Afrikan','m2-card-racist_theories.svg']
];
const atlasKeys=['1850','1870','1900','migration','missionaries',
 'route_africa','route_asia','route_oceania',
 ...atlasStatements.map(x=>x[0]),...atlasSuitcase.map(x=>'bag_'+x[0])];
let atlasSelectedRoute=null,atlasSelectedLuggage=null;
function atlasInput(field,label,value,choices){
 return '<fieldset class="m2-atlas-radios"><legend>'+esc(label)+'</legend>'+
 choices.map(([key,text],index)=>'<label class="m2-atlas-radio"><input type="radio" data-field="'+field+'" name="atlas-'+field+'" value="'+key+'" '+(value===key?'checked':'')+'>'+
 '<span class="m2-atlas-radio-circle" aria-hidden="true"></span><span>'+esc(text)+'</span></label>').join('')+'</fieldset>';
}
function atlasSectionStatus(num,count,total){
 return '<span class="m2-atlas-section-status" data-atlas-count="'+num+'">'+count+' / '+total+' osatuta</span>';
}
function renderPopulation(){
 const state=taskState(3);
 const filled=atlasKeys.filter(key=>!!state[key]).length;
 const population=['1850','1870','1900'].map(year=>
  '<label class="m2-atlas-pop-row m2-ledger-year" data-ledger-year="'+year+'">'+
   '<span class="m2-atlas-pop-year">'+year+'</span>'+
   '<select data-field="'+year+'" aria-label="'+year+'ko Europako biztanleria (milioitan)">'+
    '<option value="">Aukeratu…</option>'+
    ['266','310','400','450'].map(v=>option(v,v+' milioi',state[year])).join('')+
   '</select><small>milioi</small></label>'
 ).join('');
 const dossierOne=atlasInput('migration','Zergatik bilatzen zuten zenbait langilek bizitza berria kolonizatutako lurretan?',state.migration,[
  ['better_life','Industria-herrialdeetako lan eta bizi-baldintza gogorrengatik'],
  ['sea_control','Itsasontzien nagusitasun militarra lortzeko'],
  ['press','Egunkari berriak zabaltzeko']]);
 const dossierTwo=atlasInput('missionaries','Zein elizak bultzatu zituzten misioak Asian, Afrikan eta Ozeanian?',state.missionaries,[
  ['catholic_protestant','Eliza katolikoak eta protestanteak'],
  ['states_only','Estatu bakoitzeko parlamentuek soilik'],
  ['merchants_only','Merkataritza-enpresek soilik']]);
 const routes=atlasRoutes.map((dest,i)=>
  '<div class="m2-atlas-route-line">'+
   '<button type="button" draggable="true" data-atlas-route="'+dest.id+'" aria-pressed="'+(atlasSelectedRoute===dest.id)+'" class="m2-atlas-route-card">'+
   '<span class="m2-atlas-route-numeral">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(dest.title)+'</span>'+
   '<span aria-hidden="true" class="m2-atlas-route-connector">◉</span></button></div>'
 ).join('');
 const placed=atlasRoutes.filter(dest=>!!state['route_'+dest.id]).length;
 const routePins=atlasRoutes.map(dest=>'<button type="button" class="m2-atlas-pin '+(Object.values(state).includes(dest.id)?'m2-pin-used':'')+'" data-atlas-target="'+dest.id+'" style="left:'+dest.x+'%;top:'+dest.y+'%;" aria-label="Mapako tokia: '+esc(dest.title)+'">'+
 (atlasRoutes.find(item=>state['route_'+item.id]===dest.id)?'<span>✓</span>':'<span>+</span>')+'</button>').join('');
 const lines=atlasRoutes.filter(dest=>!!state['route_'+dest.id]).map(dest=>{
  const point=atlasRoutes.find(item=>item.id===state['route_'+dest.id]);
  return point?'<path d="M 50 22 Q '+((50+point.x)/2-10)+' 1 '+point.x+' '+point.y+'" fill="none" stroke="#c13020" stroke-width="1.1" stroke-linecap="round" marker-end="url(#atlasArrow)"/>':'';
 }).join('');
 const statements=atlasStatements.map(([key,text],i)=>'<div class="m2-atlas-statement">'+
  '<span class="m2-atlas-statement-label">'+esc(text)+'</span>'+
  '<div class="m2-atlas-truth" role="group" aria-label="'+esc(text)+'">'+
  ['egia','gezurra'].map(value=>'<label class="m2-atlas-truth-option">'+
  '<input type="radio" name="atlas-'+key+'" data-field="'+key+'" value="'+value+'" '+(state[key]===value?'checked':'')+'>'+
  '<span>'+ (value==='egia'?'E':'G') +'</span></label>').join('')+
  '</div></div>').join('');
 const cards=atlasSuitcase.filter(c=>!state['bag_'+c[0]]).map(c=>
  '<button type="button" draggable="true" data-atlas-bag-card="'+c[0]+'" aria-pressed="'+(atlasSelectedLuggage===c[0])+'" class="m2-atlas-luggage-card">'+
  '<img src="./assets/'+c[2]+'" alt="" draggable="false"><span>'+esc(c[1])+'</span></button>').join('');
 const cases=[['cause','Emigrazioaren kausak','ZERGATIK?'],['effect','Emigrazioaren ondorioak','ZER ERAGIN?']].map(([key,title,subtitle])=>{
  const inside=atlasSuitcase.filter(c=>state['bag_'+c[0]]===key);
  return '<section class="m2-atlas-suitcase m2-atlas-suitcase-'+key+'" data-atlas-bag-zone="'+key+'">'+
   '<header><strong>'+esc(title)+'</strong><small>'+subtitle+'</small></header>'+
   '<button type="button" class="m2-atlas-luggage-drop" data-atlas-bag-zone="'+key+'" aria-label="'+esc(title)+' maletan kokatu">+ KOKATU HEMEN</button>'+
   '<div class="m2-atlas-suitcase-items">'+inside.map(c=>
     '<button type="button" draggable="true" class="m2-atlas-packed" data-atlas-bag-card="'+c[0]+'" aria-label="'+esc(c[1])+'; berriz hautatu lekuz aldatzeko"><img src="./assets/'+c[2]+'" alt="">'+esc(c[1])+'</button>').join('')+
   '</div></section>';
 }).join('');
 const stage1=['1850','1870','1900','migration','missionaries'].filter(k=>!!state[k]).length;
 const stage3=atlasStatements.filter(c=>!!state[c[0]]).length;
 const stage4=atlasSuitcase.filter(c=>!!state['bag_'+c[0]]).length;
 const stageAction=(n,label,ready)=>'<button type="button" class="m2-atlas-check" data-atlas-stage="'+n+'" '+(!ready?'disabled':'')+'>'+label+' ✦</button>';
 return '<section class="m2-atlas-screen m2-migration-gallery" aria-label="Migrazioen bulegoa: lau jarduera interaktibo">'+
  '<header class="m2-atlas-heading"><span class="m2-atlas-navigation">BIGARREN MISIOA · 3 / 5</span><h1>MIGRAZIOEN BULEGOA <em>(1850–1900)</em></h1>'+
  '<div class="m2-atlas-total" aria-label="Erantzun osatuak">'+filled+' / '+atlasKeys.length+' osatuta</div></header>'+
  '<div class="m2-atlas-navigation-strip">'+nav()+'</div>'+
  (teacher?'<p class="m2-atlas-teacher">IRAKASLEAREN AURREBISTA · Ez da daturik gordeko</p>':'')+
  '<div class="m2-atlas-main">'+
   '<section class="m2-atlas-intro"><div class="m2-atlas-roundel">B</div><h2>Mundu<br> mugimenduan</h2><p>Europatik mundura: biztanleria, migrazioak eta misio erlijiosoak. Aztertu mapa, osatu datuak eta erantzun galderak.</p><span class="m2-atlas-intro-ornament" aria-hidden="true">✦ ❧ ✦</span></section>'+
   '<section class="m2-atlas-pop m2-migration-folio"><h3>Europako biztanleria <small>(milioi biztanle)</small></h3>'+
    '<p>Lotu urtea eta biztanle kopurua. Erabili 10. diapositibako taularen datuak.</p>'+
    '<div class="m2-atlas-pop-list">'+population+'</div>'+
    '<img class="m2-atlas-migrants-foreground" src="./assets/m2-atlas-original-migrants.webp" alt="" draggable="false"></section>'+
   '<div class="m2-atlas-main-map"><img src="./assets/m2-atlas-original-map.webp" alt="XIX. mendeko atlas historikoaren ilustrazioa" draggable="false">'+
    '<span class="m2-atlas-map-label">EUROPATIK MUNDURA</span><span class="m2-atlas-map-stamp" aria-hidden="true">✵</span></div>'+
   '<section class="m2-atlas-top-question m2-atlas-top-migration m2-migration-dossier"><img class="m2-atlas-top-scene" src="./assets/m2-atlas-original-migrants.webp" alt="" draggable="false">'+
    '<h3>Migrazioak</h3>'+dossierOne+'</section>'+
   '<section class="m2-atlas-top-question m2-atlas-top-mission m2-migration-dossier"><img class="m2-atlas-top-scene" src="./assets/m2-atlas-original-mission.webp" alt="" draggable="false">'+
    '<h3>Misio erlijiosoak</h3>'+dossierTwo+'</section>'+
   '<aside class="m2-atlas-critical"><strong>Interpretazio historiko kritikoa:</strong> Ikerketaren ikuspegi kritikoa: misiolarien jarduera kolonizazioaren justifikazio erlijioso gisa erabili zen eta tokiko sinesmen eta kulturen gaineko presioa ekarri zuen.</aside>'+
   '<div class="m2-atlas-top-check">'+stageAction(1,'EGIAZTATU',stage1===5)+'</div>'+
  '</div>'+
  '<div class="m2-atlas-row-two">'+
   '<section class="m2-atlas-route-activity m2-atlas-activity">'+
    '<header><span class="m2-atlas-number">2</span><h2>Norantz hedatu ziren misioak?</h2></header>'+
    '<p class="m2-atlas-exercise-instruction">Lotu PDFan aipatutako hiru eremuak atlasaren tokiekin. Hautatu izena eta jarri mapan.</p>'+
    '<div class="m2-atlas-route-stage"><div class="m2-atlas-route-labels">'+routes+'</div>'+
    '<div class="m2-atlas-route-map"><img src="./assets/m2-atlas-original-map.webp" alt="Munduko mapa" draggable="false">'+
    '<svg class="m2-atlas-route-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="atlasArrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z" fill="#c13020"/></marker></defs>'+lines+'</svg>'+
    routePins+'</div></div>'+
    '<footer>'+atlasSectionStatus(2,placed,3)+stageAction(2,'EGIAZTATU',placed===3)+'</footer>'+
   '</section>'+
   '<section class="m2-atlas-facts-activity m2-atlas-activity">'+
    '<header><span class="m2-atlas-number">3</span><h2>Egia ala gezurra?</h2></header>'+
    '<p class="m2-atlas-exercise-instruction">PDFko baieztapenak: aukeratu E (egia) edo G (gezurra). Ez dago pistarik.</p>'+
    '<div class="m2-atlas-fact-head"><span>BAIEZTAPEN HISTORIKOAK</span><span>EGIA · GEZURRA</span></div>'+
    '<div class="m2-atlas-statements">'+statements+'</div>'+
    '<footer>'+atlasSectionStatus(3,stage3,5)+stageAction(3,'EGIAZTATU',stage3===5)+'</footer>'+
   '</section>'+
  '</div>'+
  '<div class="m2-atlas-luggage-activity m2-atlas-activity">'+
   '<header><span class="m2-atlas-number">4</span><h2>Emigrantearen maleta</h2>'+
    '<p>Zer bultzatu zuen kolonizazioa eta zer eragin izan zuen? Sailkatu zortzi agiriak.</p></header>'+
   '<div class="m2-atlas-luggage-board"><div class="m2-atlas-luggage-available" data-atlas-bag-reset><span class="m2-atlas-luggage-note">SAILKATZEKO AGIRIAK · '+(8-stage4)+'</span><div class="m2-atlas-luggage-cards">'+cards+'</div></div>'+
   '<div class="m2-atlas-luggage-targets">'+cases+'</div></div>'+
   '<footer>'+atlasSectionStatus(4,stage4,8)+stageAction(4,'EGIAZTATU',stage4===8)+'</footer></div>'+
  '<div class="m2-atlas-final-controls">'+controls()+'</div>'+
 '</section>';
}
function renderArchive(){
 const state=taskState(4);
 const cards=archives.map((a,i)=>{
  return '<article class="m2-source"><span class="m2-eyebrow">AGIRIA '+String(i+1).padStart(2,'0')+'</span><h3>'+esc(a.title)+'</h3>'+
  '<p>'+esc(a.body)+'</p><fieldset><legend>'+esc(a.question)+'</legend>'+
  a.options.map(([key,label])=>'<label class="m2-choice"><input type="radio" name="source-'+a.id+'" value="'+key+'" data-archive="'+a.id+'" '+(state[a.id]===key?'checked':'')+'><span>'+esc(label)+'</span></label>').join('')+'</fieldset></article>';
 }).join('');
 return '<div class="m2-source-grid">'+cards+'</div><aside class="m2-evidence">Kontuan izan: arrazismo zientifikoa deritzona ideologia arrazista historikoa da, ez giza taldeen arteko desberdintasun biologikoak frogatzen dituen zientzia. Aztertu dokumentuak ikuspegi kritikoarekin.</aside>';
}
function multiButtons(group,options,selectedIds){
 const ids=new Set(selectedIds||[]);
 return '<div class="m2-multi">'+options.map(([id,label])=>'<button type="button" class="m2-tile" data-multi="'+group+'" data-value="'+id+'" aria-pressed="'+ids.has(id)+'">'+esc(label)+'</button>').join('')+'</div>';
}
function renderExpedition(){
 const state=taskState(5),data=state.multi||{};
 return '<div class="m2-expedition"><aside class="m2-atlas" role="img" aria-label="Atlas eskematikoa: Afrika, Asia, kontinentea eta esplorazioak">'+
 '<span class="m2-atlas-title">ESPLORAZIOEN ATLASA · XIX. MENDEA</span><span class="m2-atlas-label a">AFRIKA</span>'+
 '<span class="m2-atlas-label b">ASIA</span><span class="m2-atlas-label c">IBAI HANDIAK</span>'+
 '<span class="m2-atlas-label d">BIDE BERRIAK</span><span class="m2-compass" aria-hidden="true">✥</span></aside>'+
 '<div class="m2-atlas-notes"><section class="m2-panel"><h3>1 · Afrikako ibaiak</h3><p class="m2-caption">Aukeratu diapositiban aipatzen diren LAU ibaiak.</p>'+
 multiButtons('africa',riverOptions,data.africa)+'</section>'+
 '<section class="m2-panel"><h3>2 · Asia eta Ozeaniako esplorazioak</h3><p class="m2-caption">Aukeratu aipatzen diren HIRU eremuak.</p>'+
 multiButtons('asia',asiaOptions,data.asia)+'</section>'+
 '<section class="m2-panel"><h3>3 · Poloak</h3><div class="m2-mini-grid"><label class="m2-field">Ipar Poloa<select data-field="north"><option value="">Aukeratu</option>'+
 option('peary','Peary',state.north)+option('amundsen','Amundsen',state.north)+'</select></label><label class="m2-field">Hego Poloa<select data-field="south"><option value="">Aukeratu</option>'+
 option('peary','Peary',state.south)+option('amundsen','Amundsen',state.south)+'</select></label></div></section>'+
 '<section class="m2-panel"><h3>4 · Stanley eta Livingstone</h3>'+
 '<label class="m2-field">Zein urtetan aurkitu zuen Henry M. Stanleyk David Livingstone?<select data-field="meeting"><option value="">Aukeratu</option>'+
 option('1869','1869',state.meeting)+option('1871','1871',state.meeting)+option('1908','1908',state.meeting)+'</select></label></section>'+
 '<section class="m2-panel"><h3>5 · Kongoko azken lekukotasuna</h3><p class="m2-caption">Stanleyk Leopoldo II.arekin izan zuen lotura aztertzen da azken diapositiban.</p>'+
 '<label class="m2-field">Zein da espedienteak azaltzen duen lotura?<select data-field="congo"><option value="">Aukeratu</option>'+
 option('research_only','Bidaia zientifiko hutsa, ustiapenarekin loturarik gabe',state.congo)+option('exploitation','Kongoko ustiapenean eta haren ankerkerietan izandako parte-hartzea',state.congo)+option('independence','Kongoko independentzia demokratikoa antolatzea',state.congo)+'</select></label></section></div></div>';
}
function renderExercise(){
 switch(active){
  case 1:return renderClassification();
  case 2:return renderTimeline();
  case 3:return renderPopulation();
  case 4:return renderArchive();
  default:return renderExpedition();
 }
}
function isReady(){
 const state=taskState(active);
 if(active===1)return Object.keys(state.assignments||{}).length===causes.length;
 if(active===5)return (state.multi?.africa?.length===4&&state.multi?.asia?.length===3&&['north','south','meeting','congo'].every(k=>!!state[k]));
 return responseKeys[active].every(key=>!!state[key]);
}
function controls(){
 const done=completions.has(active);
 const canGoForward=teacher||done;
 return '<div class="m2-controls"><p id="m2-feedback" class="m2-feedback" role="status" data-state="'+esc(feedbackState)+'">'+esc(feedback||(done?'Ariketa hau osatu duzue.':'Aukerak osatu eta egiaztatu. Ez da erantzun zuzenik agertuko akatsen ondoren.'))+'</p>'+
 '<div class="m2-buttons"><button type="button" class="m2-button secondary" data-reset '+(submitting?'disabled':'')+'>Berriz hasi</button>'+
 (teacher?(active===1?'<button type="button" class="m2-button" data-preview-check>✓ EGIAZTATU</button><button type="button" class="m2-button secondary" data-preview-next>Hurrengo aretoa →</button>':'<button type="button" class="m2-button" data-preview-next>'+ (active===5?'Amaierako pantaila ikusi':'Hurrengo aretoa →')+'</button>'):
 done&&active<5?'<button type="button" class="m2-button" data-next>Hurrengo aretoa →</button>':
 done&&active===5?'<button type="button" class="m2-button" data-ending>Amaiera ikusi</button>':
 '<button type="button" class="m2-button" data-check '+(!isReady()||submitting?'disabled':'')+'>'+(active===1?'✓ EGIAZTATU':'Erantzunak egiaztatu →')+'</button>')+
 '</div></div>';
}
function renderEnd(){
 const label=teacher?'IRAKASLEAREN AURREBISTA · EZ DA GORDE':'2. MISIOA GAINDITUTA';
 return hero()+nav()+'<section class="m2-finished"><div class="m2-star" aria-hidden="true">✦</div><span class="m2-eyebrow">'+label+'</span>'+
 '<h2>Inperialismoaren faktoreak aztertu dituzue!</h2><p>Bost ariketetan ekonomiaren, demografiaren, erlijioaren, politikaren eta ideologiaren eragina ikertu duzue. Erabili ikuspegi kritikoa kolonialismoaren justifikazioak aztertzerakoan.</p>'+
 (teacher?'<p>Irakaslearen aurrebista da. Ez da saiakerarik edo osatzerik gorde.</p>':
 '<p><strong>3. misioa desblokeatuta dago.</strong> Taldearen aurrerapena zerbitzarian gordeta dago.</p>')+
 '<a class="m2-button" style="display:inline-flex;align-items:center;text-decoration:none" href="./index.html'+(teacher?'?teacherpanel=1':'#mission3')+'">Museora itzuli →</a></section>';
}
function render(){
 const firstRoom=active===1&&!teacherEnding;
 const atlasRoom=active===3&&!teacherEnding;
 app.classList.toggle('m2-first-room',firstRoom);
 app.classList.toggle('m2-atlas-active',atlasRoom);
 document.querySelector('.m2-page')?.classList.toggle('m2-first-active',firstRoom);
 document.querySelector('.m2-page')?.classList.toggle('m2-atlas-page',atlasRoom);
 if(teacherEnding){app.innerHTML=renderEnd();return}
 if(atlasRoom){app.innerHTML=renderPopulation();return}
 if(firstRoom){
  app.innerHTML=museumHeader()+museumInstruction()+
    (teacher?'<p class="m2-museum-preview">IRAKASLEAREN AURREBISTA · EZ DA DATURIK GORDEKO</p>':'')+
    renderClassification()+controls();
  return;
 }
 const item=activity(active);
 app.innerHTML=hero()+(teacher?'<p class="m2-chip">IRAKASLEAREN AURREBISTA · EZ DA DATURIK GORDEKO</p>':'')+
 nav()+intro()+'<section class="m2-work" aria-label="'+esc(item.title)+'">'+renderExercise()+'</section>'+controls();
}
function getAnswers(){
 const state=taskState(active);
 if(active===1)return {...state.assignments};
 if(active===5)return {
  africa:(state.multi?.africa||[]).slice().sort().join(','),
  asia:(state.multi?.asia||[]).slice().sort().join(','),
  north:state.north,south:state.south,meeting:state.meeting,congo:state.congo
 };
 return Object.fromEntries(responseKeys[active].map(key=>[key,state[key]]));
}
async function check(){
 if(teacher){setFeedback('Irakaslearen aurrebistan ez da erantzunik bidaltzen.','');return}
 if(submitting||completions.has(active)||!isReady())return;
 submitting=true;
 setFeedback('Erantzunak egiaztatzen…');
 const saveButton=$('[data-check]');if(saveButton)saveButton.disabled=true;
 try{
  const {data,error}=await client.rpc('submit_mission2_exercise',{p_exercise:active,p_answers:getAnswers()});
  if(error)throw error;
  if(data?.completed){
   completions.add(active);
   feedback='Ariketa gaindituta! Taldearen aurrerapena gorde da.';
   feedbackState='success';
   render();
  }else{
   setFeedback('Ez da zuzena. Berrikusi erantzun guztiak eta saiatu berriro.','error');
  }
 }catch(error){
  console.error('M2 egiaztapena:',error);
  setFeedback('Ezin izan dira erantzunak egiaztatu. Konexioa egiaztatu eta saiatu berriro.','error');
 }finally{submitting=false;const checkButton=$('[data-check]');if(checkButton)checkButton.disabled=!isReady()}
}
function openExercise(n){
 if(!steps.includes(n)||!canOpen(n))return;
 active=n;selected=null;feedback='';feedbackState='';teacherEnding=false;render();
 window.scrollTo({top:0,behavior:'instant'});
}
function assignToCategory(catId){
 if(active!==1||!selected||!categories.some(c=>c.id===catId))return;
 const state=taskState(1);state.assignments=state.assignments||{};
 state.assignments[selected]=catId;const former=selected;selected=null;
 feedback='';feedbackState='';render();
 $('[data-card="'+former+'"]')?.focus({preventScroll:true});
}
function assignYear(year){
 if(active!==2||!selected)return;
 const state=taskState(2);
 for(const y of ['1869','1908','1914'])if(state[y]===selected)delete state[y];
 state[year]=selected;selected=null;render();
 $('[data-year="'+year+'"]')?.focus({preventScroll:true});
}
function toggleMulti(group,value){
 const state=taskState(5);state.multi=state.multi||{};
 const list=new Set(state.multi[group]||[]);
 if(list.has(value))list.delete(value);else list.add(value);
 state.multi[group]=[...list];render();
 $('[data-multi="'+group+'"][data-value="'+value+'"]')?.focus({preventScroll:true});
}

/* Los cuatro paneles conservan los campos en draft[3], no corrigen en el cliente.
   Las respuestas de la misión se validan únicamente mediante la RPC privada. */
function atlasMoveRoute(location){
 if(active!==3||!atlasSelectedRoute||!atlasRoutes.some(r=>r.id===location))return;
 const state=taskState(3);
 for(const route of atlasRoutes){
  if(route.id!==atlasSelectedRoute&&state['route_'+route.id]===location)delete state['route_'+route.id];
 }
 state['route_'+atlasSelectedRoute]=location;
 atlasSelectedRoute=null;
 feedback='';feedbackState='';render();
}
function atlasPack(bag){
 if(active!==3||!atlasSelectedLuggage||!['cause','effect'].includes(bag))return;
 taskState(3)['bag_'+atlasSelectedLuggage]=bag;
 atlasSelectedLuggage=null;
 feedback='';feedbackState='';render();
}
function atlasPartCheck(part){
 const state=taskState(3);
 const keys=part===1?['1850','1870','1900','migration','missionaries']:
  part===2?['route_africa','route_asia','route_oceania']:
  part===3?atlasStatements.map(item=>item[0]):atlasSuitcase.map(item=>'bag_'+item[0]);
 const ready=keys.every(key=>!!state[key]);
 setFeedback(ready?'Atala osatuta. Erantzunak amaieran egiaztatuko dira.':'Osatu atal honetako erantzun guztiak.');
}
app.addEventListener('click',event=>{
 const elem=event.target.closest('button');
 if(!elem||!app.contains(elem)){
   const zone=event.target.closest('[data-zone]');
   if(zone&&app.contains(zone)&&active===1)return assignToCategory(zone.dataset.zone);
   const desk=event.target.closest('[data-unassign]');
   if(desk&&selected&&active===1){
     const assignments=taskState(1).assignments||{};
     delete assignments[selected];selected=null;feedback='';feedbackState='';render();
   }
   return;
 }
 if(elem.hasAttribute('data-open'))return openExercise(Number(elem.dataset.open));
 if(active===3&&elem.hasAttribute('data-atlas-route')){
  atlasSelectedRoute=atlasSelectedRoute===elem.dataset.atlasRoute?null:elem.dataset.atlasRoute;
  atlasSelectedLuggage=null;render();return;
 }
 if(active===3&&elem.hasAttribute('data-atlas-target'))return atlasMoveRoute(elem.dataset.atlasTarget);
 if(active===3&&elem.hasAttribute('data-atlas-bag-card')){
  atlasSelectedLuggage=atlasSelectedLuggage===elem.dataset.atlasBagCard?null:elem.dataset.atlasBagCard;
  atlasSelectedRoute=null;render();return;
 }
 if(active===3&&elem.hasAttribute('data-atlas-bag-zone'))return atlasPack(elem.dataset.atlasBagZone);
 if(active===3&&elem.hasAttribute('data-atlas-stage'))return atlasPartCheck(Number(elem.dataset.atlasStage));
 if(elem.hasAttribute('data-card')){selected=selected===elem.dataset.card?null:elem.dataset.card;const chosen=elem.dataset.card;render();$('[data-card="'+chosen+'"]')?.focus({preventScroll:true});return}
 const zone=elem.closest('[data-zone]');if(zone&&active===1)return assignToCategory(zone.dataset.zone);
 if(active===3&&elem.closest('[data-atlas-bag-zone]'))return atlasPack(elem.closest('[data-atlas-bag-zone]').dataset.atlasBagZone);
 if(elem.hasAttribute('data-event')){selected=elem.dataset.event;render();$('[data-event="'+selected+'"]')?.focus({preventScroll:true});return}
 if(elem.hasAttribute('data-year'))return assignYear(elem.dataset.year);
 if(elem.hasAttribute('data-multi'))return toggleMulti(elem.dataset.multi,elem.dataset.value);
 if(elem.hasAttribute('data-reset')){draft[active]={};selected=null;atlasSelectedRoute=null;atlasSelectedLuggage=null;feedback='';feedbackState='';render();return}
 if(elem.hasAttribute('data-check')){void check();return}
 if(elem.hasAttribute('data-next')){openExercise(active+1);return}
 if(elem.hasAttribute('data-preview-check')){setFeedback('Aurrebista: irakaslearen erantzunak ez dira gordetzen.','');return}
 if(elem.hasAttribute('data-preview-next')){if(active===5){teacherEnding=true;render()}else openExercise(active+1);return}
 if(elem.hasAttribute('data-ending')){teacherEnding=true;render()}
});
app.addEventListener('change',event=>{
 const target=event.target;
 if(target.matches('select[data-field],input[type="radio"][data-field]'))taskState(active)[target.dataset.field]=target.value;
 if(active===3&&target.matches('select[data-field],input[type="radio"][data-field]')){
  render();return;
 }
 if(target.matches('input[data-archive]'))taskState(4)[target.dataset.archive]=target.value;
 const button=$('[data-check]');if(button&&!submitting)button.disabled=!isReady();
});
app.addEventListener('keydown',event=>{
 if(active!==1||!['Enter',' '].includes(event.key))return;
 const zone=event.target.closest('[data-zone]');
 if(zone&&event.target===zone){event.preventDefault();assignToCategory(zone.dataset.zone)}
});
app.addEventListener('dragstart',event=>{
 if(active===3){
  const route=event.target.closest('[data-atlas-route]');
  const item=event.target.closest('[data-atlas-bag-card]');
  if(route){atlasSelectedRoute=route.dataset.atlasRoute;event.dataTransfer?.setData('text/plain','route:'+atlasSelectedRoute);return}
  if(item){atlasSelectedLuggage=item.dataset.atlasBagCard;event.dataTransfer?.setData('text/plain','bag:'+atlasSelectedLuggage);return}
 }
 const card=event.target.closest('[data-card]')||event.target.closest('[data-event]');
 if(!card)return;
 selected=card.dataset.card||card.dataset.event;
 event.dataTransfer?.setData('text/plain',selected);
 if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
});
app.addEventListener('dragover',event=>{
 if(active===3&&event.target.closest('[data-atlas-target],[data-atlas-bag-zone]')){
  event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';return;
 }
 if(event.target.closest('[data-zone]')||event.target.closest('[data-year]')||event.target.closest('[data-unassign]'))event.preventDefault();
});
app.addEventListener('drop',event=>{
 if(active===3){
  const pin=event.target.closest('[data-atlas-target]');
  const bag=event.target.closest('[data-atlas-bag-zone]');
  if(pin||bag){
   event.preventDefault();
   const type=event.dataTransfer?.getData('text/plain')||'';
   if(type.startsWith('route:'))atlasSelectedRoute=type.slice(6);
   if(type.startsWith('bag:'))atlasSelectedLuggage=type.slice(4);
   if(pin)return atlasMoveRoute(pin.dataset.atlasTarget);
   if(bag)return atlasPack(bag.dataset.atlasBagZone);
  }
 }
 const zone=event.target.closest('[data-zone]');
 const year=event.target.closest('[data-year]');
 const loose=event.target.closest('[data-unassign]');
 if(!zone&&!year&&!loose)return;
 event.preventDefault();
 const moved=event.dataTransfer?.getData('text/plain');
 if(moved)selected=moved;
 if(loose&&active===1&&selected){
   delete taskState(1).assignments?.[selected];selected=null;feedback='';feedbackState='';render();return;
 }
 if(zone)assignToCategory(zone.dataset.zone);
 if(year)assignYear(year.dataset.year);
});
initialize();
