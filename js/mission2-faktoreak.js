import { startClassAccess } from "./class-access.js?v=20261124-access2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createMission2Autosave } from './mission2-autosave.js?v=20261124-sync2';

import { MISSION2_OPEN, MISSION2_LOCKED_TEXT } from './mission-release.js?v=20261124-lock1';
import { mountClassroomProgressPanel } from './classroom-progress-overlay.js?v=20261124-m2board1';
import { renderMuseumPassport } from './museum-passport.js?v=3';
const app=document.querySelector('#m2-app');
let mission2TeamName='Taldea',releaseTimer=null,releaseChecking=false,releaseClosed=false;
async function checkMission2Release(){
 if(teacher||releaseChecking)return;
 releaseChecking=true;
 try{const {data,error}=await client.rpc('mission2_access_status',{});if(error||typeof data!=='boolean')return;
 if(data===false&&!releaseClosed){releaseClosed=true;autosave?.destroy();document.querySelector('.m2-class-widget')?.__classProgressCleanup?.();cardMessage('Bigarren misioa blokeatuta',MISSION2_LOCKED_TEXT)}
 else if(data===true&&releaseClosed)location.reload();
 }catch{}finally{releaseChecking=false}
}
function watchMission2Release(){
 if(releaseTimer!==null)return;
 releaseTimer=setInterval(()=>{if(!document.hidden)void checkMission2Release()},5000);
 window.addEventListener('focus',checkMission2Release);
 window.addEventListener('pagehide',()=>{clearInterval(releaseTimer);window.removeEventListener('focus',checkMission2Release)},{once:true});
}
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
 {id:'sea',title:'Ibilbide estrategikoak',type:'Geografia politikoa',ref:'13. diapositiba',art:'chart',
  body:'Itsasoko eta lurreko ibilbideak kontrolatzeko lehian, potentziek merkataritzaren eta armadaren joan-etorriak zaindu eta aurkarien hedapena oztopatu nahi zuten.',
  question:'Zein interes politiko ageri da dokumentu honetan?',
  options:[['a','Ibilbideen kontrol geoestrategikoa'],['b','Europako biztanleriaren hazkundea'],['c','Erlijio-misioak zabaltzea']]},
 {id:'press',title:'Prentsa eta prestigioa',type:'Propaganda',ref:'14. diapositiba',art:'newspaper',
  body:'Politikariek, egunkarien eta beste hedabideen laguntzarekin, kolonien hedapena sustatu zuten herritarren babesa eskuratu eta nazioaren prestigioa handitzeko.',
  question:'Zein ideologia politiko erabiltzen da justifikazio horretan?',
  options:[['a','Kapitalen inbertsioa'],['b','Abertzalekeria (chauvinismoa)'],['c','Emigrazioa']]},
 {id:'missions',title:'Agintarien interesa',type:'Erretratuen bilduma',ref:'14. diapositiba',art:'portrait',
  body:'Bismarck, Cecil Rhodes, Jules Ferry, Leopoldo II.a eta Joseph Chamberlain garaiko hedapen kolonialarekin lotutako agintari edo politikariak izan ziren. Beren interesak eta jardunak ez ziren berdinak.',
  question:'Zer bultzatu nahi zuten hedapen koloniala defendatzen zuten agintariek?',
  options:[['a','Herrialde guztien independentzia bermatzea'],['b','Kolonien gaineko kontrola amaitzea'],['c','Estatuaren indarra eta nazioarteko prestigioa handitzea']]},
 {id:'racism',title:'Biologiaren itxurako argudioak',type:'Ideologia',ref:'15. diapositiba',art:'science',
  body:'Kolonialismoaren defendatzaile batzuek teoria arrazistak zientziaren itxurapean aurkezten zituzten, pertsonen arteko hierarkiak eta lurraldeen menderakuntza justifikatzeko. Teoria horiek ez dute balio zientifikorik.',
  question:'Zertarako erabiltzen ziren teoria horiek?',
  options:[['a','Menderakuntza eta diskriminazioa justifikatzeko'],['b','Herrien eskubide-berdintasuna defendatzeko'],['c','Merkataritza-hesiak kentzeko']]},
 {id:'source1863',title:'1863ko lekukotasuna',type:'Iturriaren azterketa kritikoa',ref:'16. diapositiba',art:'manuscript',
  body:'Londresko Elkarte Antropologikoaren 1863ko saio bati lotutako testu batek pertsona beltzak gutxiesten zituen eta europarren nagusitasuna aldarrikatzen zuen. Giza duintasunaren aurkako ikuspegi arrazista da.',
  question:'Nola aztertu behar da lekukotasun historiko hori?',
  options:[['a','Giza taldeen gaitasunen froga objektibo gisa'],['b','Garai hartako ideologia arrazistaren adibide kritiko gisa'],['c','Biztanleria-zentsu zehatz gisa']]}
];
const riverOptions=[['nile','Nilo'],['niger','Niger'],['congo','Kongo'],['zambezi','Zambeze'],['suez','Suez'],['panama','Panama']];
const asiaOptions=[['himalaya','Himalaia'],['siberia','Siberia'],['australia','Australiako basamortua'],['nile','Nilo'],['suez','Suez']];
let teacher=false,teamId=null,active=1,selected=null,submitting=false,teacherEnding=false;
let completions=new Set(),draft={},feedback='',feedbackState='';
let autosave=null,saveStatus='Taldearen aurrerapena kargatzen…',saveKind='saving';
function autosaveStatus(message,kind=''){
 saveStatus=message;saveKind=kind;
 const el=$('#m2-autosave');
 if(el){el.textContent=message;el.dataset.state=kind}
}
function queueMission2(patch,exercise=active){
 if(!teacher&&!completions.has(exercise))autosave?.queue(exercise,patch);
}
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
   const access=await client.rpc('mission2_access_status',{});
   if(access.error||access.data!==true){releaseClosed=true;cardMessage('Bigarren misioa blokeatuta',MISSION2_LOCKED_TEXT);watchMission2Release();return}
   watchMission2Release();
    if(!(await startClassAccess(client)))return;
   teamId=profile.team_id;
   try{const team=await client.from('teams').select('name').eq('id',teamId).single();if(!team.error&&team.data?.name)mission2TeamName=team.data.name}catch{}
   // Lehen misioaren lehenagoko lorpena datu-basean mantentzen da,
   // baina bost joko berriak amaitu arte ez du bigarren misioa irekitzen.
   const fifth=await client.from('mission1_exercise_completions')
     .select('exercise').eq('team_id',teamId).eq('exercise',5).limit(1);
   if(fifth.error)throw fifth.error;
   if(!fifth.data?.length){
     cardMessage('Bigarren misioa blokeatuta','Lehen misioaren bost ariketak osatu behar dituzue bigarren misioan sartzeko.');
     return;
   }
   const saved=await client.from('mission2_exercise_completions').select('exercise,completed_at').eq('team_id',teamId);
   if(saved.error){
    console.warn('2. misioaren egitura ez dago oraindik aktibatuta:',saved.error.message);
    cardMessage('Bigarren misioa prestatzen','Bost ariketak prestatuta daude, baina irakasleak oraindik datu-baseko aktibazioa amaitu behar du.');return;
   }
   completions=new Set((saved.data||[]).map(x=>Number(x.exercise)).filter(x=>steps.includes(x)));
   active=currentNext();
   if(completions.size===5)teacherEnding=true;
   autosave=createMission2Autosave({
    client,teamId,userId:authUser.id,
    onRestore:rows=>{const changed=JSON.stringify(draft)!==JSON.stringify(rows);draft=rows;if(changed&&!submitting&&!releaseClosed&&app.querySelector('.m2-controls'))render()},
    onStatus:autosaveStatus,
    onCompleted:exercise=>{completions.add(exercise);window.dispatchEvent(new Event('m2:progress-changed'));if(exercise===active)render()}
   });
   await autosave.load();
   const poll=async()=>{if(document.hidden||releaseClosed||submitting)return;try{const {data,error}=await client.from('mission2_exercise_completions').select('exercise,completed_at').eq('team_id',teamId);if(error)return;let changed=false;for(const row of data||[]){const n=Number(row.exercise);if(steps.includes(n)&&!completions.has(n)){completions.add(n);changed=true}}if(changed){window.dispatchEvent(new Event('m2:progress-changed'));render()}}catch{}};
   const pollTimer=setInterval(poll,5000);window.addEventListener('pagehide',()=>{clearInterval(pollTimer);autosave?.destroy()},{once:true});
   mountClassroomProgressPanel(client,teamId,{missionId:2});
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
   '<span class="m2-case-crown" aria-hidden="true"></span><div class="m2-case-arch"><img class="m2-case-scene" src="./assets/m2-painted-'+cat.id+'.svg'+(cat.id==='economic'?'?v=20261123-monedas2':'')+'" alt="" loading="eager" draggable="false"><span class="m2-case-spot" aria-hidden="true"></span>'+museumSceneDetails(cat.id)+'<div class="m2-case-icon" aria-hidden="true">'+museumIllustration(museumCategoryArt[cat.id],true)+'</div>'+
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
 const years=['1869','1908','1914'];
 const placed=years.filter(year=>Boolean(state[year])).length;
 const taken=new Set(years.map(year=>state[year]).filter(Boolean));
 const cards=infrastructure.map(item=>
  `<button type="button" class="m2-tile m2-e2-piece ${taken.has(item.id)?'m2-used':''} ${selected===item.id?'m2-e2-piece-active':''}" draggable="true" data-event="${esc(item.id)}" aria-pressed="${selected===item.id?'true':'false'}">
   <span class="m2-e2-picture m2-e2-art-${esc(item.id)}" aria-hidden="true"></span>
   <span class="m2-e2-piece-info"><strong>${esc(item.label)}</strong><small>Hartu pieza · Kokatu urtean</small></span><span class="m2-e2-grip" aria-hidden="true">⋮</span></button>`
 ).join('');
 const slots=years.map(year=>{
  const item=infrastructure.find(p=>p.id===state[year]);
  return `<button type="button" class="m2-year m2-e2-slot m2-e2-slot-${year} ${item?'m2-selected-year':''}" data-year="${year}" aria-label="${year}: ${item?esc(item.label):'Kokatu pieza hemen'}">
     <strong>${year}</strong><span class="m2-e2-slot-face">${item?`<span class="m2-e2-small-picture m2-e2-art-${esc(item.id)}" aria-hidden="true"></span><span class="m2-e2-filled-label">${esc(item.label)}</span>`:'<span class="m2-e2-empty-mark" aria-hidden="true">✣</span><span class="m2-e2-empty-label">Kokatu pieza hemen</span>'}</span>
    </button>`;
 }).join('');
 const choices=(field,items)=>items.map(([value,label,icon])=>
  `<label class="m2-e2-option"><input type="radio" name="m2-e2-${field}" data-field="${field}" value="${value}" ${state[field]===value?'checked':''}><span class="m2-e2-radio" aria-hidden="true"></span><span class="m2-e2-option-copy">${esc(label)}</span><span class="m2-e2-option-icon m2-e2-icon-${icon}" aria-hidden="true"></span></label>`
 ).join('');
 return `<div class="m2-e2-scene">
 <div class="m2-e2-upper">
  <div class="m2-e2-left">
   <header class="m2-e2-intro"><span>ARIKETA 2 / 5 · 2. MISIOA</span><h2>Kapitalaren ibilbideak</h2><p>Hartu hiru obra historikoak eta kokatu dagozkien urteetan; osatu kapitalaren ibilbidea.</p></header>
   <section class="m2-e2-catalogue" aria-label="Obren bilduma"><header><strong>✦ &nbsp; OBREN BILDUMA &nbsp; ✦</strong><small>Garraio-azpiegitura handiak</small></header>
     <div class="m2-e2-pieces">${cards}</div>
   </section>
  </div>
  <section class="m2-e2-chronograph" aria-label="Azpiegituren kronologia">
   <header class="m2-e2-chronograph-title"><strong>AZPIEGITUREN KRONOLOGIA</strong><small>Inperialismoaren azpiegitura handiak eta kapitalaren hedapena</small></header>
   <div class="m2-e2-clock-dial">
    <div class="m2-e2-inner-ring"></div>
    <div class="m2-e2-globe" aria-hidden="true">
      <svg viewBox="0 0 400 400" focusable="false"><g fill="none" stroke="#c8b989" stroke-width="1.1" opacity=".48">
      <path d="M10 125H390M2 188H398M3 247H397M30 307H370M200 0V400M130 5Q165 200 130 395M270 5Q235 200 270 395M65 45Q145 200 65 350M335 45Q255 200 335 350"/>
      </g><g fill="#d9c69c" stroke="#ae9870" stroke-width="2.3" stroke-linejoin="round">
      <path d="M60 70L101 56 132 75 128 99 148 114 137 139 113 146 107 177 88 179 91 202 72 202 57 185 45 164 30 154 29 126 45 111Z"/>
      <path d="M124 206L156 214 171 245 166 275 150 293 153 323 131 350 113 339 109 315 99 286 93 258 111 238Z"/>
      <path d="M193 86L223 66 249 68 270 62 298 79 327 91 359 105 362 127 337 138 322 164 300 167 289 189 262 179 252 151 229 156 220 136 202 130Z"/>
      <path d="M211 155L236 168 254 189 277 198 287 229 276 254 264 282 246 318 221 320 199 293 194 260 180 248 190 204Z"/>
      <path d="M295 272L324 268 348 280 347 302 321 315 297 298Z"/>
      <path d="M162 80L180 71 187 87 177 100 161 98Z"/>
      </g><circle cx="201" cy="201" r="13" fill="#d6a861" stroke="#815322" stroke-width="5"/></svg>
    </div>
    ${slots}
   </div>
   <div class="m2-e2-dial-progress" role="status" aria-live="polite">✦ <strong>${placed} / 3</strong> pieza ✦</div>
  </section>
 </div>
 <section class="m2-e2-ledger" aria-label="Kapitalaren inbertsioen liburua">
  <h3>✦ &nbsp; KAPITALAREN INBERTSIOEN LIBURUA &nbsp; ✦</h3>
  <div class="m2-e2-ledger-pages">
   <fieldset class="m2-e2-ledger-page m2-e2-ledger-finance"><legend><b>1</b> Nola erabili zen metatutako kapitala?</legend>
    <div class="m2-e2-book-illustration m2-e2-finance-illustration" role="img" aria-label="XIX. mendeko bankaria, diru-zakua eta kreditu-agiriak"></div>
    <div class="m2-e2-options">${choices('funding',[['credits','Kredituak emanez','coins'],['salaries','Soldatak soilik ordainduz','bag'],['donations','Opari pribatuak eginez','gift']])}</div>
   </fieldset>
   <fieldset class="m2-e2-ledger-page m2-e2-ledger-works"><legend><b>2</b> Zer lan mota finantzatu ziren?</legend>
    <div class="m2-e2-book-illustration m2-e2-works-illustration" role="img" aria-label="Trenbidea, ubideak, portua eta merkataritza-ontziak"></div>
    <div class="m2-e2-options">${choices('works',[['rail_ports_canals','Trenbideak, portuak eta kanalak','train'],['palaces_only','Jauregiak soilik','palace'],['schools_only','Eskolak soilik','school']])}</div>
   </fieldset>
  </div>
  <p class="m2-e2-source-note">Iturriak: Suezko kanalaren inaugurazioa (1869), Hijazko trenbidea (1908) eta Panamako kanala (1914). Garraioa eta kapital-inbertsioa hedapen ekonomikoarekin lotzen dira.</p>
 </section></div>`;
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
 ['growth','Europako biztanleria-hazkundea','m2-vintage-growth-transparent.webp'],
 ['conditions','Langileen bizi-baldintza neketsuak','m2-vintage-conditions-transparent.webp'],
 ['better','Bizi-aukera hobeak bilatzeko nahia','m2-vintage-better-transparent.webp'],
 ['conversion','Tokiko herriak kristautzeko nahia','m2-vintage-conversion-transparent.webp'],
 ['settlement','Europarrak lurralde berrietan finkatzea','m2-vintage-settlement-transparent.webp'],
 ['missions','Misio katoliko eta protestanteak sortzea','m2-vintage-missions-transparent.webp'],
 ['oceania','Misioak Ozeanian zabaltzea','m2-vintage-oceania-transparent.webp'],
 ['faith','Tokiko erlijioen desagerpena Afrikan','m2-vintage-faith-transparent.webp']
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
 const statements=atlasStatements.map(([key,text],i)=>'<label class="m2-atlas-statement">'+
  '<span class="m2-atlas-statement-label">'+esc(text)+'</span>'+
  '<span class="m2-atlas-truth"><select class="m2-atlas-statement-select" data-field="'+key+'" aria-label="'+esc(text)+' — egia edo gezurra">'+
  '<option value="">Aukeratu…</option>'+
  option('egia','E · Egia',state[key])+option('gezurra','G · Gezurra',state[key])+
  '</select></span></label>').join('');
 const cards=atlasSuitcase.filter(c=>!state['bag_'+c[0]]).map(c=>
  '<button type="button" draggable="true" data-atlas-bag-card="'+c[0]+'" aria-pressed="'+(atlasSelectedLuggage===c[0])+'" class="m2-atlas-luggage-card">'+
  '<img class="m2-atlas-card-illustration" src="./assets/'+c[2]+'" width="112" height="76" alt="" loading="eager" decoding="sync" draggable="false" fetchpriority="high"><span>'+esc(c[1])+'</span></button>').join('');
 const cases=[['cause','Emigrazioaren kausak','ZERGATIK?'],['effect','Emigrazioaren ondorioak','ZER ERAGIN?']].map(([key,title,subtitle])=>{
  const inside=atlasSuitcase.filter(c=>state['bag_'+c[0]]===key);
  return '<section class="m2-atlas-suitcase m2-atlas-suitcase-'+key+'" data-atlas-bag-zone="'+key+'">'+
   '<header><strong>'+esc(title)+'</strong><small>'+subtitle+'</small></header>'+
   '<button type="button" class="m2-atlas-luggage-drop" data-atlas-bag-zone="'+key+'" aria-label="'+esc(title)+' maletan kokatu">+ KOKATU HEMEN</button>'+
   '<div class="m2-atlas-suitcase-items">'+inside.map(c=>
     '<button type="button" draggable="true" class="m2-atlas-packed" data-atlas-bag-card="'+c[0]+'" aria-label="'+esc(c[1])+'; berriz hautatu lekuz aldatzeko"><img class="m2-atlas-card-illustration" src="./assets/'+c[2]+'" width="52" height="40" alt="" loading="eager" decoding="sync" draggable="false">'+esc(c[1])+'</button>').join('')+
   '</div></section>';
 }).join('');
 const stage1=['1850','1870','1900','migration','missionaries'].filter(k=>!!state[k]).length;
 const stage3=atlasStatements.filter(c=>!!state[c[0]]).length;
 const stage4=atlasSuitcase.filter(c=>!!state['bag_'+c[0]]).length;
 const stageAction=(n,label,ready)=>'<button type="button" class="m2-atlas-check" data-atlas-stage="'+n+'" '+(!ready?'disabled':'')+'>'+label+' ✦</button>';
 return '<section class="m2-atlas-screen m2-migration-gallery" aria-label="Migrazioen bulegoa: lau jarduera interaktibo">'+
  '<header class="m2-atlas-heading"><a class="m2-atlas-home-link" href="./index.html" aria-label="Museora itzuli">← MUSEOA</a><span class="m2-atlas-navigation">BIGARREN MISIOA · 3 / 5</span><h1>MIGRAZIOEN BULEGOA <em>(1850–1900)</em></h1>'+
  '<div class="m2-atlas-total" aria-label="Erantzun osatuak">'+filled+' / '+atlasKeys.length+' osatuta</div></header>'+
  '<div class="m2-atlas-navigation-strip">'+nav()+'</div>'+
  (teacher?'<p class="m2-atlas-teacher">IRAKASLEAREN AURREBISTA · Ez da daturik gordeko</p>':'')+
  '<div class="m2-atlas-main">'+
   '<section class="m2-atlas-intro"><div class="m2-atlas-roundel">B</div><h2>Mundu<br> mugimenduan</h2><p>Europatik mundura: biztanleria, migrazioak eta misio erlijiosoak. Aztertu mapa, osatu datuak eta erantzun galderak.</p><span class="m2-atlas-intro-ornament" aria-hidden="true">✦ ❧ ✦</span></section>'+
   '<section class="m2-atlas-pop m2-migration-folio"><h3>Europako biztanleria <small>(milioi biztanle)</small></h3>'+
    '<p>Lotu urtea eta biztanle kopurua. Erabili 10. diapositibako taularen datuak.</p>'+
    '<div class="m2-atlas-pop-list">'+population+'</div>'+
    '<img class="m2-atlas-migrants-foreground" src="./assets/m2-atlas-travelers-cutout.webp" alt="" draggable="false"></section>'+
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
    '<header><span class="m2-atlas-number">3</span><h2>Emigrazioaren ondorioak</h2></header>'+
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
function archiveEngraving(type){
 const groups={
  chart:'<path d="M16 70q34-42 80-9m-86 42q50-39 107-9M10 21h104M27 11v110M63 8v115M101 9v106" fill="none" stroke="#987c53" stroke-width="1.2"/><path d="M30 73l32-15 42 15-7 7H39Z" fill="#987442"/><path d="M63 58V22l27 26H63Z" fill="#d4b17b" stroke="#735432"/><path d="M59 60V39l-21 19Z" fill="#e6cca0" stroke="#775432"/><path d="M21 94q9-5 18 0t18 0t18 0t18 0" stroke="#765c38" fill="none" stroke-width="2"/>',
  newspaper:'<path d="M20 13h84v101H20Z" fill="#e4d1a7" stroke="#7d5c34" stroke-width="2"/><path d="M27 27h70M27 32h70M27 38h42M27 44h69" stroke="#715436" stroke-width="2"/><path d="M28 52h27v42H28Z" fill="#bea078" stroke="#69502d"/><path d="M62 55h33M62 61h33M62 67h33M62 73h33M62 81h28M62 87h28M28 101h67" stroke="#8b704d" stroke-width="1.5"/>',
  portrait:'<path d="M17 112v-13q5-25 27-30M79 69q27 12 29 30v14Z" fill="#ad8d61" stroke="#755431" stroke-width="2"/><path d="M38 50q-4-31 21-35q27 3 23 34l-6 17q-17 18-31-1Z" fill="#d6ba8e" stroke="#775534" stroke-width="2"/><path d="M37 40q9-33 31-25q14 5 17 29q-7-5-13-20q-12 9-34 16Z" fill="#765a3b"/><path d="M43 70q14 17 31 0l-8 15H53Z" fill="#efe0b8"/><path d="M24 99q17-21 29-14l6 23 9-22q18-7 35 13" fill="#796044" stroke="#59402b" stroke-width="2"/>',
  science:'<path d="M24 15h74v94H24Z" fill="#e9d2a8" stroke="#84633b" stroke-width="2"/><path d="M38 26q25-17 48 0M35 35h47M35 41h47M35 88h47M35 95h47" fill="none" stroke="#9a8159"/><circle cx="58" cy="64" r="17" fill="none" stroke="#6e5839" stroke-width="2"/><path d="M58 49v30M43 64h30M49 52l18 24M68 53L48 75" stroke="#84623c" stroke-width="1.3"/>',
  manuscript:'<path d="M28 11h64v98H28Z" fill="#e8d3aa" stroke="#79603b" stroke-width="2"/><path d="M38 25h44M38 33h40M38 41h44M38 49h31M38 57h42M38 65h44M38 73h37" stroke="#927c59" stroke-width="1.8"/><path d="M48 97q3-23 22-11q-12-2-9 13" fill="none" stroke="#73522b" stroke-width="2"/><circle cx="83" cy="93" r="12" fill="#a45337" stroke="#713b2a" stroke-width="2"/><path d="M80 87l3 4 4-3-3 7" fill="none" stroke="#e7bd83" stroke-width="1.5"/>'
 };
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 126" focusable="false" aria-hidden="true">'+(groups[type]||groups.manuscript)+'</svg>';
}
function renderArchive(){
 const state=taskState(4),answered=archives.filter(a=>Boolean(state[a.id])).length;
 const cards=archives.map((a,i)=>{
  const chosen=Boolean(state[a.id]);
  return '<article class="m2-source m2-source-file m2-source-'+a.art+' m2-archive-dossier" data-source="'+esc(a.id)+'" data-answered="'+chosen+'">'+
   '<span class="m2-archive-folder-tab" aria-hidden="true"></span><span class="m2-archive-fileclip" aria-hidden="true"></span>'+
   '<header class="m2-source-heading"><span class="m2-source-index">AGIRIA '+String(i+1).padStart(2,'0')+'</span>'+
    '<span class="m2-source-kind">'+esc(a.type)+'</span></header>'+
   '<div class="m2-archive-card-body">'+
    '<div class="m2-archive-illustration"><div class="m2-source-engraving" aria-hidden="true">'+archiveEngraving(a.art)+'</div>'+
     '<span class="m2-archive-image-caption">'+esc(a.ref)+'</span></div>'+
    '<div class="m2-archive-card-writing"><div class="m2-source-titling"><h3>'+esc(a.title)+'</h3></div>'+
     '<p class="m2-source-text">'+esc(a.body)+'</p>'+
     '<fieldset><legend><span class="m2-archive-question-mark" aria-hidden="true">?</span>'+esc(a.question)+'</legend>'+
      a.options.map(([key,label])=>'<label class="m2-choice"><input type="radio" name="source-'+esc(a.id)+'" value="'+esc(key)+'" data-archive="'+esc(a.id)+'" '+(state[a.id]===key?'checked':'')+'><span>'+esc(label)+'</span></label>').join('')+
     '</fieldset></div>'+
   '</div><span class="m2-source-seal" aria-hidden="true">ARTXIBOA</span></article>';
 }).join('');
 return '<div class="m2-archive-scene">'+
   '<div class="m2-archive-room-props" aria-hidden="true"></div>'+
   '<div class="m2-archive-desk">'+
    '<div class="m2-archive-desk-crest"><span aria-hidden="true">❧</span><div><span class="m2-archive-eyebrow">IKERKETA HISTORIKOA · 04 / 05</span>'+
     '<h3>Boterearen artxiboa</h3><p>Aztertu bost agiriak eta aukeratu galdera bakoitzaren erantzuna.</p></div>'+
     '<div class="m2-archive-progress" role="status" aria-live="polite"><span>AZTERTUTAKO AGIRIAK</span><strong data-archive-progress>'+answered+' / 5</strong></div>'+
    '</div>'+
    '<div class="m2-source-grid m2-source-grid-museum m2-archive-five-files">'+cards+'</div>'+
    '<div class="m2-archive-desk-front" aria-hidden="true"><span>ARTXIBO HISTORIKOA · XIX. MENDEA</span></div>'+
   '</div>'+
   '<aside class="m2-evidence m2-archive-warning"><span class="m2-archive-warning-emblem" aria-hidden="true">!</span>'+
    '<div><strong>OHAR KRITIKOA</strong><p>Arrazismoa justifikatzeko erabiltzen ziren teoriak ideologia historikoak ziren, ez zientzia baliozkoa. Horrelako argudioek kolonialismoa eta diskriminazioa legitimatzeko balio izan zuten.</p></div></aside>'+
  '</div>';
}
function multiButtons(group,options,selectedIds){
 const ids=new Set(selectedIds||[]);
 return '<div class="m2-multi">'+options.map(([id,label])=>'<button type="button" class="m2-tile" data-multi="'+group+'" data-value="'+id+'" aria-pressed="'+ids.has(id)+'">'+esc(label)+'</button>').join('')+'</div>';
}
function expeditionMap(){
 return '<svg class="m2-expedition-svg" viewBox="0 0 540 620" role="img" aria-label="Afrikako eskema historikoan ibai nagusiak, meridianoak eta iparrorratza agertzen dira. Mapa orientagarria da, ez eskala zehatzekoa." xmlns="http://www.w3.org/2000/svg">'+
 '<defs><radialGradient id="m2-land" cx=".39" cy=".34" r=".79"><stop stop-color="#e3d4a9"/><stop offset=".68" stop-color="#cbbb87"/><stop offset="1" stop-color="#aa9b6c"/></radialGradient>'+
 '<pattern id="m2-paper-lines" patternUnits="userSpaceOnUse" width="28" height="28"><path d="M28 0H0V28" fill="none" stroke="#988e6b" stroke-opacity=".17" stroke-width="1"/></pattern></defs>'+
 '<rect width="540" height="620" fill="#d6d6b8"/><rect width="540" height="620" fill="url(#m2-paper-lines)"/>'+
 '<g stroke="#9aa393" stroke-opacity=".7" stroke-width="1" fill="none"><path d="M0 150H540M0 260H540M0 370H540M0 480H540"/><path d="M95 0V620M195 0V620M295 0V620M395 0V620M495 0V620"/></g>'+
 '<g font-family="Georgia,serif" font-size="15" fill="#647e78" opacity=".82"><text x="18" y="318" transform="rotate(-90 18 318)">OZEANO ATLANTIKOA</text><text x="513" y="280" transform="rotate(90 513 280)">INDIAKO OZEANOA</text><text x="263" y="53" font-size="14" text-anchor="middle">MEDITERRANEO ITSASOA</text></g>'+
 '<path class="m2-expedition-land" d="M107 98C129 81 166 70 204 72L240 75 259 66 291 81 320 96 349 104 371 117 387 138 405 146 421 168 445 191 431 202 410 199 397 213 415 239 434 252 461 254 470 281 451 300 426 311 418 340 407 365 391 384 385 410 366 434 351 460 337 486 314 521 282 550 260 573 236 550 225 526 203 508 194 480 177 467 165 432 143 418 130 390 112 362 112 339 88 317 72 290 69 266 58 245 77 213 65 190 74 163 91 144 87 125Z"/>'+
 '<path class="m2-expedition-land" d="M455 413L475 420 486 448 480 475 464 498 450 484 444 451Z"/>'+
 '<path class="m2-expedition-land-shade" d="M164 129Q253 89 325 151T385 335Q350 410 305 449T225 498Q143 399 132 260Z"/>'+
 '<path d="M75 332Q246 333 436 332" stroke="#947246" stroke-width="1.5" stroke-dasharray="5 6" fill="none"/>'+
 '<text x="75" y="327" font-family="Georgia,serif" font-size="10" fill="#715738">EKUATOREA</text>'+
 '<g class="m2-historic-rivers" fill="none" stroke="#688b90" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".90">'+
 '<path d="M333 151Q322 185 324 217T340 263Q334 297 314 313Q296 332 297 353"/>'+
 '<path d="M99 218Q137 223 151 253Q177 262 191 249T220 265Q199 295 160 293T118 285"/>'+
 '<path d="M305 346Q263 313 224 339T189 371Q161 368 137 386"/>'+
 '<path d="M312 412Q335 401 342 417T361 434Q389 426 412 415"/>'+
 '</g>'+
 '<g fill="#8ba6a1" stroke="#537978" stroke-width="1.8"><circle cx="333" cy="151" r="5"/><circle cx="118" cy="285" r="5"/><circle cx="137" cy="386" r="5"/><circle cx="412" cy="415" r="5"/></g>'+
 '<path d="M69 193Q117 155 162 140M352 160Q381 181 411 203" fill="none" stroke="#8c654a" stroke-width="1.6" stroke-dasharray="4 6"/>'+
 '<g transform="translate(459 90)" fill="none" stroke="#81673d"><circle r="31" stroke-width="2"/><circle r="23" stroke-width="1"/><path d="M-37 0H37M0-37V37M-17-17L17 17M17-17L-17 17" stroke-width="1.2"/><path d="M0-22L6 0 0 22-6 0Z" fill="#956845"/><circle r="4" fill="#c5aa78"/></g>'+
 '<text x="458" y="46" text-anchor="middle" font="700 13px Georgia,serif" fill="#675639">I</text>'+
 '<g font-family="Georgia,serif" fill="#755b3d" opacity=".79"><text x="193" y="234" font-size="21" letter-spacing="7">AFRIKA</text><text x="161" y="592" font-size="12" letter-spacing="3">XIX. MENDEKO ATLASA</text></g>'+
 '<path d="M20 20H520V600H20Z" fill="none" stroke="#a89462" stroke-width="2"/><path d="M29 29H511V591H29Z" fill="none" stroke="#ad9b6b" stroke-width="1"/>'+
 '</svg>';
}
function renderExpedition(){
 const state=taskState(5),data=state.multi||{};
 const chosen=[...(data.africa||[])];
 const chosenLabels=chosen.map(id=>riverOptions.find(x=>x[0]===id)?.[1]||id);
 return '<div class="m2-expedition m2-expedition-research">'+
  '<aside class="m2-atlas m2-historical-map">'+
   '<div class="m2-atlas-museum-title"><span>ESPLORAZIOEN ATLASA</span><small>XIX. MENDEA · AGIRIA 05</small></div>'+
   expeditionMap()+
   '<div class="m2-atlas-route-ledger"><strong>Aukeratutako izenak · '+chosen.length+' / 4</strong>'+
    '<div class="m2-atlas-route-tags" aria-live="polite">'+(chosenLabels.length?chosenLabels.map(label=>'<span>'+esc(label)+'</span>').join(''):'<em>Oraindik ez da izenik aukeratu.</em>')+'</div></div>'+
   '<p class="m2-atlas-footnote">Atlas eskematikoa. Ibaien ibilbideek esplorazioaren eta kolonizazioaren historia ulertzen laguntzen dute.</p>'+
  '</aside>'+
  '<div class="m2-atlas-notes m2-expedition-files">'+
   '<div class="m2-expedition-intro"><span class="m2-archive-eyebrow">IKERKETA GEOGRAFIKOA · 05 / 05</span><h3>Esploratzaileen espedientea</h3>'+
    '<p>Lotu mapa, espedizioak eta Kongoko ustiapen kolonialaren testuingurua. Aztertu bost agiriak; erantzun guztiak osatu arte ezingo dituzue egiaztatu.</p></div>'+
   '<section class="m2-panel m2-expedition-panel"><header><span>AGIRIA 01</span><h3>Afrikako ibai handiak</h3></header>'+
    '<p class="m2-caption">Aukeratu diapositiban aipatzen diren LAU ibaiak.</p>'+
    multiButtons('africa',riverOptions,data.africa)+'</section>'+
   '<section class="m2-panel m2-expedition-panel"><header><span>AGIRIA 02</span><h3>Asia eta Ozeaniako esplorazioak</h3></header>'+
    '<p class="m2-caption">Aukeratu aipatzen diren HIRU eremuak.</p>'+
    multiButtons('asia',asiaOptions,data.asia)+'</section>'+
   '<section class="m2-panel m2-expedition-panel"><header><span>AGIRIA 03</span><h3>Poloetarako espedizioak</h3></header>'+
    '<div class="m2-mini-grid"><label class="m2-field">Ipar Poloa<select data-field="north"><option value="">Aukeratu</option>'+
     option('peary','Peary',state.north)+option('amundsen','Amundsen',state.north)+'</select></label>'+
    '<label class="m2-field">Hego Poloa<select data-field="south"><option value="">Aukeratu</option>'+
     option('peary','Peary',state.south)+option('amundsen','Amundsen',state.south)+'</select></label></div></section>'+
   '<section class="m2-panel m2-expedition-panel m2-expedition-meeting"><header><span>AGIRIA 04</span><h3>Stanley eta Livingstone</h3></header>'+
    '<p class="m2-caption">Prentsak ospetsu egin zuen bi esploratzaileen topaketa. Aztertu 18. diapositibako gertakaria.</p>'+
    '<label class="m2-field">Zein urtetan aurkitu zuen Henry M. Stanleyk David Livingstone?<select data-field="meeting"><option value="">Aukeratu</option>'+
     option('1869','1869',state.meeting)+option('1871','1871',state.meeting)+option('1908','1908',state.meeting)+'</select></label></section>'+
   '<section class="m2-panel m2-expedition-panel m2-expedition-congo"><header><span>AGIRIA 05</span><h3>Kongoko espediente koloniala</h3></header>'+
    '<p class="m2-caption">Aztertu Henry M. Stanleyren eta Leopoldo II.aren arteko lotura. Esplorazioa eta ustiapena ez dira gauza bera, baina lotuta egon ziren.</p>'+
    '<label class="m2-field">Zer lotura nabarmentzen du azken diapositibak?<select data-field="congo"><option value="">Aukeratu</option>'+
     option('research_only','Bidaia zientifiko hutsa, ustiapenarekin loturarik gabe',state.congo)+
     option('exploitation','Kongoko ustiapen kolonialarekin izandako lotura',state.congo)+
     option('independence','Kongoko independentzia demokratikoa antolatzea',state.congo)+'</select></label></section>'+
  '</div></div>';
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
 return '<div class="m2-controls">'+(teacher?'':'<p id="m2-autosave" class="m2-autosave-status" role="status" data-state="'+esc(saveKind)+'">'+esc(saveStatus)+'</p>')+'<p id="m2-feedback" class="m2-feedback" role="status" data-state="'+esc(feedbackState)+'">'+esc(feedback||(done?'Ariketa hau osatu duzue.':'Aukerak osatu eta egiaztatu. Ez da erantzun zuzenik agertuko akatsen ondoren.'))+'</p>'+
 '<div class="m2-buttons"><button type="button" class="m2-button secondary" data-reset '+(submitting?'disabled':'')+'>Berriz hasi</button>'+
 (teacher?(active===1?'<button type="button" class="m2-button" data-preview-check>✓ EGIAZTATU</button><button type="button" class="m2-button secondary" data-preview-next>Hurrengo aretoa →</button>':'<button type="button" class="m2-button" data-preview-next>'+ (active===5?'Amaierako pantaila ikusi':'Hurrengo aretoa →')+'</button>'):
 done&&active<5?'<button type="button" class="m2-button" data-next>Hurrengo aretoa →</button>':
 done&&active===5?'<button type="button" class="m2-button" data-ending>Amaiera ikusi</button>':
 '<button type="button" class="m2-button" data-check '+(!isReady()||submitting?'disabled':'')+'>'+(active===1?'✓ EGIAZTATU':'Erantzunak egiaztatu →')+'</button>')+
 '</div></div>';
}
function animateRoomArrival(room){
 if(app.dataset.museumRoom===room)return;
 app.dataset.museumRoom=room;
 if(typeof app.animate!=='function'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 app.animate([{opacity:.82,filter:'brightness(1.06)'},{opacity:1,filter:'brightness(1)'}],
  {duration:320,easing:'ease-out'});
}
function renderEnd(){
 const label=teacher?'IRAKASLEAREN AURREBISTA · EZ DA GORDE':'2. MISIOA GAINDITUTA';
 return hero()+nav()+'<section class="m2-finished"><div class="m2-star" aria-hidden="true">✦</div><span class="m2-eyebrow">'+label+'</span>'+
 '<h2>Inperialismoaren faktoreak aztertu dituzue!</h2><p>Bost ariketetan ekonomiaren, demografiaren, erlijioaren, politikaren eta ideologiaren eragina ikertu duzue. Erabili ikuspegi kritikoa kolonialismoaren justifikazioak aztertzerakoan.</p>'+
 (teacher?'<p>Irakaslearen aurrebista da. Ez da saiakerarik edo osatzerik gorde.</p>':
 '<p><strong>3. misioa prestatzen ari gara.</strong> Taldearen aurrerapena zerbitzarian gordeta dago.</p>')+
 renderMuseumPassport({teamName:teacher?'Probako taldea':mission2TeamName,completedIds:[1,2],preview:teacher,animate:true,animateMission:2})+
 '<a class="m2-button" style="display:inline-flex;align-items:center;text-decoration:none" href="./index.html'+(teacher?'?teacherpanel=1':'')+'">Museora itzuli →</a></section>';
}
function render(){
 if(releaseClosed)return;
 animateRoomArrival(teacherEnding?'amaiera':String(active));
 const firstRoom=active===1&&!teacherEnding;
 const atlasRoom=active===3&&!teacherEnding;
 app.classList.toggle('m2-first-room',firstRoom);
 app.classList.toggle('m2-atlas-active',atlasRoom);
 app.classList.toggle('m2-capital-active',active===2&&!teacherEnding);
 app.classList.toggle('m2-archive-active',active===4&&!teacherEnding);
 app.classList.toggle('m2-expedition-active',active===5&&!teacherEnding);
 document.querySelector('.m2-page')?.classList.toggle('m2-first-active',firstRoom);
 document.querySelector('.m2-page')?.classList.toggle('m2-atlas-page',atlasRoom);
 document.querySelector('.m2-page')?.classList.toggle('m2-capital-page',active===2&&!teacherEnding);
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
 if(releaseClosed||submitting||completions.has(active)||!isReady())return;
 submitting=true;
 setFeedback('Erantzunak egiaztatzen…');
 const saveButton=$('[data-check]');if(saveButton)saveButton.disabled=true;
 try{
  const {data,error}=await client.rpc('submit_mission2_exercise',{p_exercise:active,p_answers:getAnswers()});
  if(error)throw error;
  if(data?.completed){
   completions.add(active);
   window.dispatchEvent(new Event('m2:progress-changed'));
   feedback='Ariketa gaindituta! Taldearen aurrerapena gorde da.';
   feedbackState='success';
   render();
  }else{
   setFeedback('Ez da zuzena. Berrikusi erantzun guztiak eta saiatu berriro.','error');
  }
 }catch(error){
  console.error('M2 egiaztapena:',error);
  setFeedback('Ezin izan dira erantzunak egiaztatu. Konexioa egiaztatu eta saiatu berriro.','error');
 }finally{submitting=false;const checkButton=$('[data-check]');if(checkButton)checkButton.disabled=!isReady()||completions.has(active)}
}
function openExercise(n){
 if(releaseClosed||submitting||!steps.includes(n)||!canOpen(n))return;
 if(!teacher)void autosave?.flush();
 active=n;selected=null;feedback='';feedbackState='';teacherEnding=false;render();
 window.scrollTo({top:0,behavior:'instant'});
}
function assignToCategory(catId){
 if(active!==1||!selected||!categories.some(c=>c.id===catId))return;
 const state=taskState(1);state.assignments=state.assignments||{};
 state.assignments[selected]=catId;const former=selected;selected=null;
 queueMission2({assignments:{[former]:catId}},1);
 feedback='';feedbackState='';render();
 $('[data-card="'+former+'"]')?.focus({preventScroll:true});
}
function assignYear(year){
 if(active!==2||!selected)return;
 const state=taskState(2);
 const patch={};
 for(const y of ['1869','1908','1914'])if(state[y]===selected){delete state[y];patch[y]=null}
 state[year]=selected;patch[year]=selected;queueMission2(patch,2);selected=null;render();
 $('[data-year="'+year+'"]')?.focus({preventScroll:true});
}
function toggleMulti(group,value){
 const state=taskState(5);state.multi=state.multi||{};
 const list=new Set(state.multi[group]||[]);
 if(list.has(value))list.delete(value);else list.add(value);
 state.multi[group]=[...list];queueMission2({multi:{[group]:state.multi[group]}},5);render();
 $('[data-multi="'+group+'"][data-value="'+value+'"]')?.focus({preventScroll:true});
}

/* Los cuatro paneles conservan los campos en draft[3], no corrigen en el cliente.
   Las respuestas de la misión se validan únicamente mediante la RPC privada. */
function atlasMoveRoute(location){
 if(active!==3||!atlasSelectedRoute||!atlasRoutes.some(r=>r.id===location))return;
 const state=taskState(3);
 const patch={};
 for(const route of atlasRoutes){
  if(route.id!==atlasSelectedRoute&&state['route_'+route.id]===location){delete state['route_'+route.id];patch['route_'+route.id]=null}
 }
 state['route_'+atlasSelectedRoute]=location;
 patch['route_'+atlasSelectedRoute]=location;queueMission2(patch,3);
 atlasSelectedRoute=null;
 feedback='';feedbackState='';render();
}
function atlasPack(bag){
 if(active!==3||!atlasSelectedLuggage||!['cause','effect'].includes(bag))return;
 taskState(3)['bag_'+atlasSelectedLuggage]=bag;
 queueMission2({['bag_'+atlasSelectedLuggage]:bag},3);
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
     const removed=selected;delete assignments[removed];queueMission2({assignments:{[removed]:null}},1);
     selected=null;feedback='';feedbackState='';render();
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
 if(elem.hasAttribute('data-reset')){if(completions.has(active)&&!teacher)return;draft[active]={};if(!teacher)autosave?.reset(active);selected=null;atlasSelectedRoute=null;atlasSelectedLuggage=null;feedback='';feedbackState='';render();return}
 if(elem.hasAttribute('data-check')){void check();return}
 if(elem.hasAttribute('data-next')){openExercise(active+1);return}
 if(elem.hasAttribute('data-preview-check')){setFeedback('Aurrebista: irakaslearen erantzunak ez dira gordetzen.','');return}
 if(elem.hasAttribute('data-preview-next')){if(active===5){teacherEnding=true;render()}else openExercise(active+1);return}
 if(elem.hasAttribute('data-ending')&&(teacher||completions.size===5)){teacherEnding=true;render()}
});
app.addEventListener('change',event=>{
 const target=event.target;
 if(target.matches('select[data-field],input[type="radio"][data-field]')){
  taskState(active)[target.dataset.field]=target.value;
  queueMission2({[target.dataset.field]:target.value});
 }
 if(active===3&&target.matches('select[data-field],input[type="radio"][data-field]')){
  render();return;
 }
 if(target.matches('input[data-archive]')){
  taskState(4)[target.dataset.archive]=target.value;
  queueMission2({[target.dataset.archive]:target.value},4);
  const dossier=target.closest('.m2-archive-dossier');
  if(dossier)dossier.dataset.answered='true';
  const badge=$('[data-archive-progress]');
  if(badge)badge.textContent=archives.filter(a=>Boolean(taskState(4)[a.id])).length+' / 5';
 }
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
   const removed=selected;delete taskState(1).assignments?.[removed];
   queueMission2({assignments:{[removed]:null}},1);selected=null;feedback='';feedbackState='';render();return;
 }
 if(zone)assignToCategory(zone.dataset.zone);
 if(year)assignYear(year.dataset.year);
});
initialize();
