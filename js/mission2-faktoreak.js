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
 3:['1850','1870','1900','migration','missionaries'],
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
function renderClassification(){
 const state=taskState(1),assigned=state.assignments||{};
 const tileHtml=causes.map(c=>'<button type="button" draggable="true" data-card="'+c.id+'" class="m2-tile '+(assigned[c.id]?'m2-used':'')+'" aria-pressed="'+(selected===c.id?'true':'false')+'">'+esc(c.label)+'</button>').join('');
 const zoneHtml=categories.map(cat=>{
  const inside=causes.filter(c=>assigned[c.id]===cat.id);
  return '<button type="button" class="m2-zone" data-zone="'+cat.id+'" aria-label="'+esc(cat.label)+'"><strong>'+esc(cat.label)+'</strong><small>'+inside.length+' kartela kokatuta</small><span class="m2-zone-items">'+inside.map(x=>'<span class="m2-mini">'+esc(x.label)+'</span>').join('')+'</span></button>';
 }).join('');
 return '<div class="m2-panels"><section class="m2-panel"><h3>Dokumentu solteak · '+causes.length+'</h3><div class="m2-tray">'+tileHtml+'</div>'+
 '<p class="m2-caption">Egin klik kartela batean eta, gero, dagokion faktorean. Arrastatu ere egin dezakezu. Kartela berriro hautatuta lekuz alda dezakezu.</p></section>'+
 '<section class="m2-panel"><h3>Faktoreen bost kutxak</h3><div class="m2-zones">'+zoneHtml+'</div></section></div>';
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
function renderPopulation(){
 const state=taskState(3);
 const bars=[['1850',66],['1870',78],['1900',100]].map(([year,height])=>
  '<div class="m2-chart-bar"><span class="m2-chart-column" style="height:'+height+'px" aria-hidden="true"></span><strong>'+year+'</strong>'+
  '<label class="m2-field"><span class="m2-sr-only">'+year+'ko biztanleria</span><select data-field="'+year+'"><option value="">Milioika…</option>'+
  ['266','310','400','450'].map(v=>option(v,v+' milioi',state[year])).join('')+'</select></label></div>'
 ).join('');
 return '<div class="m2-panels"><section class="m2-panel"><h3>Europako biztanleriaren erregistroa</h3><p class="m2-caption">Lotu urtea eta biztanle kopurua. Erabili 10. diapositibako taularen datuak.</p>'+
 '<div class="m2-chart">'+bars+'</div></section><section class="m2-panel"><h3>Bi espediente osagarri</h3>'+
 '<label class="m2-field">Zergatik bilatzen zuten zenbait langilek bizitza berria kolonizatutako lurretan?<select data-field="migration"><option value="">Aukeratu</option>'+
 option('better_life','Industria-herrialdeetako lan eta bizi-baldintza gogorrengatik',state.migration)+option('sea_control','Itsasontzien nagusitasun militarra lortzeko',state.migration)+option('press','Egunkari berriak zabaltzeko',state.migration)+'</select></label>'+
 '<div style="height:16px"></div><label class="m2-field">Zein elizak bultzatu zituzten misioak Asian, Afrikan eta Ozeanian?<select data-field="missionaries"><option value="">Aukeratu</option>'+
 option('catholic_protestant','Eliza katolikoak eta protestanteak',state.missionaries)+option('states_only','Estatu bakoitzeko parlamentuek soilik',state.missionaries)+option('merchants_only','Merkataritza-enpresek soilik',state.missionaries)+'</select></label>'+
 '<aside class="m2-evidence">Ikerketaren ikuspegi kritikoa: misiolarien jarduera kolonizazioaren justifikazio erlijioso gisa erabili zen eta tokiko sinesmen eta kulturen gaineko presioa ekarri zuen.</aside></section></div>';
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
 (teacher?'<button type="button" class="m2-button" data-preview-next>'+ (active===5?'Amaierako pantaila ikusi':'Hurrengo aretoa →')+'</button>':
 done&&active<5?'<button type="button" class="m2-button" data-next>Hurrengo aretoa →</button>':
 done&&active===5?'<button type="button" class="m2-button" data-ending>Amaiera ikusi</button>':
 '<button type="button" class="m2-button" data-check '+(!isReady()||submitting?'disabled':'')+'>Erantzunak egiaztatu →</button>')+
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
 if(teacherEnding){app.innerHTML=renderEnd();return}
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
 if(active!==1||!selected)return;
 const state=taskState(1);state.assignments=state.assignments||{};
 state.assignments[selected]=catId;const former=selected;selected=null;render();
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
app.addEventListener('click',event=>{
 const elem=event.target.closest('button');
 if(!elem||!app.contains(elem))return;
 if(elem.hasAttribute('data-open'))return openExercise(Number(elem.dataset.open));
 if(elem.hasAttribute('data-card')){selected=elem.dataset.card;render();$('[data-card="'+selected+'"]')?.focus({preventScroll:true});return}
 if(elem.hasAttribute('data-zone'))return assignToCategory(elem.dataset.zone);
 if(elem.hasAttribute('data-event')){selected=elem.dataset.event;render();$('[data-event="'+selected+'"]')?.focus({preventScroll:true});return}
 if(elem.hasAttribute('data-year'))return assignYear(elem.dataset.year);
 if(elem.hasAttribute('data-multi'))return toggleMulti(elem.dataset.multi,elem.dataset.value);
 if(elem.hasAttribute('data-reset')){draft[active]={};selected=null;feedback='';feedbackState='';render();return}
 if(elem.hasAttribute('data-check')){void check();return}
 if(elem.hasAttribute('data-next')){openExercise(active+1);return}
 if(elem.hasAttribute('data-preview-next')){if(active===5){teacherEnding=true;render()}else openExercise(active+1);return}
 if(elem.hasAttribute('data-ending')){teacherEnding=true;render()}
});
app.addEventListener('change',event=>{
 const target=event.target;
 if(target.matches('select[data-field]'))taskState(active)[target.dataset.field]=target.value;
 if(target.matches('input[data-archive]'))taskState(4)[target.dataset.archive]=target.value;
 const button=$('[data-check]');if(button&&!submitting)button.disabled=!isReady();
});
app.addEventListener('dragstart',event=>{
 const card=event.target.closest('[data-card]')||event.target.closest('[data-event]');
 if(!card)return;
 selected=card.dataset.card||card.dataset.event;
 event.dataTransfer?.setData('text/plain',selected);
 if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
});
app.addEventListener('dragover',event=>{
 if(event.target.closest('[data-zone]')||event.target.closest('[data-year]'))event.preventDefault();
});
app.addEventListener('drop',event=>{
 const zone=event.target.closest('[data-zone]');
 const year=event.target.closest('[data-year]');
 if(!zone&&!year)return;
 event.preventDefault();
 const moved=event.dataTransfer?.getData('text/plain');
 if(moved)selected=moved;
 if(zone)assignToCategory(zone.dataset.zone);
 if(year)assignYear(year.dataset.year);
});
initialize();
