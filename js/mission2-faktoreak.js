import { paintSaveIndicator, SAVE_TEXT } from './save-indicator.js?v=20261124-guardado1';
import { startClassAccess } from "./class-access.js?v=20261124-access2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { createMission2Autosave } from './mission2-autosave.js?v=20261124-guardado1';

import { MISSION2_OPEN, MISSION2_LOCKED_TEXT } from './mission-release.js?v=20261124-lock1';
import { mission2RouteMarkup } from './mission1-navigation.js?v=20261124-atlas3';
import {walletButton,walletContext,prepareWallet} from './museum-wallet.js?v=20261124-atlas2';
import { arriveMuseumRoom, stampMuseumExercise, missionBriefButton } from './museum-experience.js?v=2';
import { renderMission1ClassProgress } from './classroom-progress.js?v=20261124-m2board1';
import { renderMuseumPassport } from './museum-passport.js?v=20261125-ceremony29';
const app=document.querySelector('#m2-app');
let passportDates={},mission2TeamName='Taldea',releaseTimer=null,releaseChecking=false,releaseClosed=false;
async function checkMission2Release(){
 if(teacher||releaseChecking)return;
 releaseChecking=true;
 try{const {data,error}=await client.rpc('mission2_access_status',{});if(error||typeof data!=='boolean')return;
 if(data===false&&!releaseClosed){releaseClosed=true;walletContext(null);document.querySelector('#m2-reading-dialog')?.close();autosave?.destroy();cardMessage('Bigarren misioa blokeatuta',MISSION2_LOCKED_TEXT)}
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
  question:'Potentzia batek aurkarien itsas sarbidea mugatu nahi badu, zer interes politikok azalduko luke estrategia hori?',
  options:[['a','Ibilbideen kontrol geoestrategikoa'],['b','Europako biztanleriaren hazkundea'],['c','Erlijio-misioak zabaltzea']]},
 {id:'press',title:'Prentsa eta prestigioa',type:'Propaganda',ref:'14. diapositiba',art:'newspaper',
  body:'Politikariek, egunkarien eta beste hedabideen laguntzarekin, kolonien hedapena sustatu zuten herritarren babesa eskuratu eta nazioaren prestigioa handitzeko.',
  question:'Egunkari batek kolonia gehiago izatea nazioaren ohorearekin lotzen badu, zein ideologia ari da sustatzen?',
  options:[['a','Kapitalen inbertsioa'],['b','Abertzalekeria (chauvinismoa)'],['c','Emigrazioa']]},
 {id:'missions',title:'Agintarien interesa',type:'Erretratuen bilduma',ref:'14. diapositiba',art:'portrait',
  body:'Bismarck, Cecil Rhodes, Jules Ferry, Leopoldo II.a eta Joseph Chamberlain garaiko hedapen kolonialarekin lotutako agintari edo politikariak izan ziren. Beren interesak eta jardunak ez ziren berdinak.',
  question:'Zein helburu politiko parteka zezaketen hedapen koloniala defendatzen zuten agintariek, interes desberdinak izan arren?',
  options:[['a','Herrialde guztien independentzia bermatzea'],['b','Kolonien gaineko kontrola amaitzea'],['c','Estatuaren indarra eta nazioarteko prestigioa handitzea']]},
 {id:'racism',title:'Biologiaren itxurako argudioak',type:'Ideologia',ref:'15. diapositiba',art:'science',
  body:'Kolonialismoaren defendatzaile batzuek teoria arrazistak zientziaren itxurapean aurkezten zituzten, pertsonen arteko hierarkiak eta lurraldeen menderakuntza justifikatzeko. Teoria horiek ez dute balio zientifikorik.',
  question:'Ustezko azalpen biologiko bat erabiliz herri baten askatasuna ukatzen bada, zer funtzio betetzen du argudio horrek?',
  options:[['a','Menderakuntza eta diskriminazioa justifikatzeko'],['b','Herrien eskubide-berdintasuna defendatzeko'],['c','Merkataritza-hesiak kentzeko']]},
 {id:'source1863',title:'1863ko lekukotasuna',type:'Iturriaren azterketa kritikoa',ref:'16. diapositiba',art:'manuscript',
  body:'Londresko Elkarte Antropologikoaren 1863ko saio bati lotutako testu batek pertsona beltzak gutxiesten zituen eta europarren nagusitasuna aldarrikatzen zuen. Giza duintasunaren aurkako ikuspegi arrazista da.',
  question:'Zer ezagutza historiko lor dezakegu 1863ko lekukotasun hori kritikoki aztertuta?',
  options:[['a','Giza taldeen gaitasunen froga objektibo gisa'],['b','Garai hartako ideologia arrazistaren adibide kritiko gisa'],['c','Biztanleria-zentsu zehatz gisa']]}
];
const riverOptions=[['nile','Nilo'],['niger','Niger'],['congo','Kongo'],['zambezi','Zambeze'],['suez','Suez'],['panama','Panama']];
const asiaOptions=[['himalaya','Himalaia'],['siberia','Siberia'],['australia','Australiako basamortua'],['nile','Nilo'],['suez','Suez']];
let teacher=false,teamId=null,active=1,selected=null,submitting=false,teacherEnding=false;
let completions=new Set(),draft={},feedback='',feedbackState='';
let remoteRenderTimer=null,remoteRenderPending=false,dragging=false,pointerEditing=false;
let lastCabinetMove=null;
function interacting(){return dragging||pointerEditing||!!selected||!!atlasSelectedRoute||!!atlasSelectedLuggage||!!document.querySelector('#m2-reading-dialog[open]')||app.contains(document.activeElement)&&document.activeElement?.matches('select')}
function requestRemoteRender(){
 const dossier=document.querySelector('#m2-reading-dialog[open][data-museum-panel="dossier"] .m2-dossier');
 if(dossier){const holder=document.createElement('div');holder.innerHTML=dossierMarkup();dossier.querySelector('ol').innerHTML=holder.querySelector('ol').innerHTML;dossier.querySelector('.m1-note').textContent=holder.querySelector('.m1-note').textContent}
 remoteRenderPending=true;
 if(remoteRenderTimer!==null)return;
 const apply=()=>{remoteRenderTimer=null;if(!remoteRenderPending||releaseClosed)return;if(submitting||interacting()){remoteRenderTimer=setTimeout(apply,250);return}render()};
 remoteRenderTimer=setTimeout(apply,100);
}
function updateMission2PassportDate(rows){
 const valid=rows.filter(r=>steps.includes(Number(r.exercise))&&typeof r.completed_at==='string'&&Number.isFinite(Date.parse(r.completed_at)));
 if(new Set(valid.map(r=>Number(r.exercise))).size===5)passportDates[2]=valid.map(r=>new Date(r.completed_at).toISOString()).sort().at(-1);
}
function markRemoteCompletion(exercise){if(completions.has(exercise))return;completions.add(exercise);window.dispatchEvent(new Event('m2:progress-changed'));if(exercise===active||app.querySelector('.m2-controls'))requestRemoteRender()}

let autosave=null,saveStatus=SAVE_TEXT.loading,saveKind='loading';
function autosaveStatus(message,kind=''){
 saveStatus=message;saveKind=kind;
 const el=$('#m2-autosave');
 if(el){paintSaveIndicator(el,kind,message);el.dataset.state=kind}
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
// Dialogs reuse only the existing teaching materials, never answer keys.
function museumDialog(title,content,{confirm=false,onConfirm=null}={}){
 const old=document.querySelector('#m2-reading-dialog');old?.close();old?.remove();
 const focus=document.activeElement;
 const dialog=document.createElement('dialog');dialog.id='m2-reading-dialog';dialog.className='m2-reading-dialog';
 dialog.setAttribute('aria-labelledby','m2-reading-title');
 dialog.innerHTML='<header><span>✦ MUSEOKO ARTXIBOA ✦</span><h2 id="m2-reading-title">'+esc(title)+'</h2><button type="button" class="m2-dialog-x" aria-label="Itxi">×</button></header><div class="m2-dialog-content">'+content+'</div><footer><button type="button" class="m2-button secondary" data-dialog-close>'+ (confirm?'Utzi':'Itxi')+'</button>'+(confirm?'<button type="button" class="m2-button" data-dialog-confirm>Berriz hasi</button>':'')+'</footer>';
 document.body.append(dialog);
 dialog.querySelector('.m2-dialog-x').onclick=()=>dialog.close();
 dialog.querySelector('[data-dialog-close]').onclick=()=>dialog.close();
 dialog.querySelector('[data-dialog-confirm]')?.addEventListener('click',()=>{dialog.close();if(!releaseClosed&&!submitting)onConfirm?.()});
 dialog.addEventListener('close',()=>{dialog.remove();if(focus?.isConnected)focus.focus({preventScroll:true})},{once:true});
 dialog.showModal();dialog.querySelector('[data-dialog-close]').focus();
}
function openSource(id){
 const source=archives.find(a=>a.id===id);if(!source)return;
 const art=app.querySelector('[data-source="'+id+'"] .m2-source-engraving');
 const style=art?getComputedStyle(art):null;
 const image=style?.backgroundImage||'none',position=style?.backgroundPosition,size=style?.backgroundSize;
 const current=taskState(4)[id],index=archives.indexOf(source);
 museumDialog(source.title,'<p class="m2-dialog-ref">AGIRIA '+(index+1)+' / 5 · '+esc(source.type)+' · '+esc(source.ref)+'</p><div class="m2-archive-zoom-tools" aria-label="Irudia handitzeko kontrolak"><button type="button" data-source-scale="out" aria-label="Txikitu">−</button><span data-source-scale-value role="status">100 %</span><button type="button" data-source-scale="in" aria-label="Handitu">+</button><button type="button" data-source-scale="reset">Hasierako neurria</button></div><div class="m2-archive-zoom-viewport" tabindex="0" aria-label="Ilustrazioa"><div class="m2-dialog-source-art" aria-hidden="true">'+archiveEngraving(source.art)+'</div></div><p class="m2-archive-dialog-art-note">Ilustrazio didaktikoa · Ez da jatorrizko dokumentuaren faksimilea.</p><span class="m2-archive-reading-label">TESTU MOLDATUA</span><p class="m2-dialog-reading">'+esc(source.body)+'</p><fieldset class="m2-reading-choices"><legend>'+esc(source.question)+'</legend>'+source.options.map(([key,label])=>'<label><input type="radio" name="m2-dialog-answer" value="'+esc(key)+'" '+(current===key?'checked':'')+'><span>'+esc(label)+'</span></label>').join('')+'</fieldset><div class="m2-file-navigation"><button type="button" data-file-prev class="m2-button secondary" '+(index===0?'disabled':'')+'>← Aurreko agiria</button><span data-file-status role="status">'+(current?'Erantzuna hautatuta':'Erantzun bat hautatu')+'</span><button type="button" data-file-next class="m2-button secondary" '+(index===archives.length-1?'disabled':'')+'>Hurrengo agiria →</button></div>');
 const dialog=document.querySelector('#m2-reading-dialog');
 dialog.classList.add('m2-archive-reading-dialog');
 dialog.querySelectorAll('input[name="m2-dialog-answer"]').forEach(input=>input.addEventListener('change',()=>{
  if(releaseClosed||submitting||active!==4||!teacher&&completions.has(4))return;
  taskState(4)[id]=input.value;queueMission2({[id]:input.value},4);
  const original=app.querySelector('input[data-archive="'+id+'"][value="'+input.value+'"]');if(original)original.checked=true;
  const dossier=app.querySelector('[data-source="'+id+'"]');if(dossier)dossier.dataset.answered='true';
  const badge=$('[data-archive-progress]');if(badge)badge.textContent=archives.filter(a=>Boolean(taskState(4)[a.id])).length+' / 5';
  const check=$('[data-check]');if(check)check.disabled=!isReady();
  dialog.querySelector('[data-file-status]').textContent='Erantzuna hautatuta';
 }));
 if(!teacher&&completions.has(4))dialog.querySelectorAll('input').forEach(input=>input.disabled=true);
 dialog.querySelector('[data-file-prev]').onclick=()=>{if(index>0)openSource(archives[index-1].id)};
 dialog.querySelector('[data-file-next]').onclick=()=>{if(index<archives.length-1)openSource(archives[index+1].id)};
 dialog.addEventListener('close',()=>{if(!document.querySelector('#m2-reading-dialog[open]'))app.querySelector('[data-source-zoom="'+id+'"]')?.focus({preventScroll:true})},{once:true});
 if(image!=='none'){
  const picture=document.querySelector('.m2-dialog-source-art');
  picture.style.backgroundImage=image;picture.style.backgroundPosition=position;
  picture.style.backgroundSize=size;
  picture.style.aspectRatio='220 / 340';
  picture.style.height='auto';
  picture.classList.add('has-photo');
 }
 const viewport=dialog.querySelector('.m2-archive-zoom-viewport'),picture=dialog.querySelector('.m2-dialog-source-art');
 let scale=1;
 const redraw=()=>{
  picture.style.width='calc(var(--m2-source-width) * '+scale+')';
  dialog.querySelector('[data-source-scale-value]').textContent=Math.round(scale*100)+' %';
  dialog.querySelector('[data-source-scale="out"]').disabled=scale<=1;
  dialog.querySelector('[data-source-scale="in"]').disabled=scale>=2;
  if(scale===1){viewport.scrollTop=0;viewport.scrollLeft=0;}
 };
 dialog.querySelector('.m2-archive-zoom-tools').addEventListener('click',event=>{
  const action=event.target.closest('[data-source-scale]')?.dataset.sourceScale;
  if(!action)return;
  scale=action==='reset'?1:Math.min(2,Math.max(1,scale+(action==='in'?.5:-.5)));redraw();
 });
 redraw();
}
function openMap(kind){
 if(kind==='migration')museumDialog('Munduko atlasa','<img class="m2-dialog-map" src="./assets/m2-migration-map-clean.svg" alt="Munduko mapa historikoa">');
 else if(kind==='expedition'){
  museumDialog('Esplorazioen atlasa','<div class="m2-map-tools" aria-label="Maparen kontrolak"><button type="button" data-map-action="out" aria-label="Txikitu">−</button><span data-map-scale role="status">100 %</span><button type="button" data-map-action="in" aria-label="Handitu">+</button><button type="button" data-map-action="left" aria-label="Ezkerrera">←</button><button type="button" data-map-action="up" aria-label="Gora">↑</button><button type="button" data-map-action="down" aria-label="Behera">↓</button><button type="button" data-map-action="right" aria-label="Eskuinera">→</button><button type="button" data-map-action="reset">Hasierako ikuspegia</button></div><div class="m2-dialog-expedition">'+expeditionMap().replaceAll('id="m2-','id="m2-zoom-').replaceAll('url(#m2-','url(#m2-zoom-')+'</div><p class="m2-map-help">Handitu mapa eta mugitu norabide-botoiekin edo arrastatuz. Ez da erantzunik egiaztatzen.</p>');
  const dialog=document.querySelector('#m2-reading-dialog'),svg=dialog.querySelector('svg');
  let zoom=1,x=0,y=0,drag=null;
  function redraw(){
   const w=540/zoom,h=620/zoom;x=Math.max(0,Math.min(540-w,x));y=Math.max(0,Math.min(620-h,y));
   svg.setAttribute('viewBox',[x,y,w,h].join(' '));dialog.querySelector('[data-map-scale]').textContent=Math.round(zoom*100)+' %';
   dialog.querySelector('[data-map-action="in"]').disabled=zoom>=3;dialog.querySelector('[data-map-action="out"]').disabled=zoom<=1;
   for(const [key,disabled] of [['left',x<=0],['right',x>=540-w-.01],['up',y<=0],['down',y>=620-h-.01]])dialog.querySelector('[data-map-action="'+key+'"]').disabled=disabled;
  }
  dialog.querySelector('.m2-map-tools').addEventListener('click',event=>{
   const action=event.target.closest('[data-map-action]')?.dataset.mapAction;if(!action)return;
   const w=540/zoom,h=620/zoom;
   if(action==='in'||action==='out'){const next=Math.max(1,Math.min(3,zoom+(action==='in'?.5:-.5)));x+=(w-540/next)/2;y+=(h-620/next)/2;zoom=next}
   else if(action==='reset'){zoom=1;x=0;y=0}
   else if(action==='left')x-=w*.22;else if(action==='right')x+=w*.22;else if(action==='up')y-=h*.22;else if(action==='down')y+=h*.22;
   redraw();
  });
  svg.addEventListener('pointerdown',event=>{if(zoom<=1)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};svg.setPointerCapture?.(event.pointerId)});
  svg.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const r=svg.getBoundingClientRect();x-=(event.clientX-drag.x)*540/zoom/r.width;y-=(event.clientY-drag.y)*620/zoom/r.height;drag.x=event.clientX;drag.y=event.clientY;redraw()});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,()=>{drag=null});
  redraw();
 }
}
function animatePlacement(selector){
 const el=app.querySelector(selector);if(!el||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 el.animate?.([{filter:'brightness(1.22)',transform:'translateY(-3px)'},{filter:'brightness(1)',transform:'translateY(0)'}],{duration:230,easing:'ease-out'});
}
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
     .select('exercise,completed_at').eq('team_id',teamId).eq('exercise',5).limit(1);
   if(fifth.error)throw fifth.error;
   if(!fifth.data?.length){
     cardMessage('Bigarren misioa blokeatuta','Lehen misioaren bost ariketak osatu behar dituzue bigarren misioan sartzeko.');
     return;
   }
   passportDates[1]=fifth.data[0]?.completed_at||null;
   const saved=await client.from('mission2_exercise_completions').select('exercise,completed_at').eq('team_id',teamId);
   if(saved.error){
    console.warn('2. misioaren egitura ez dago oraindik aktibatuta:',saved.error.message);
    cardMessage('Bigarren misioa prestatzen','Bost ariketak prestatuta daude, baina irakasleak oraindik datu-baseko aktibazioa amaitu behar du.');return;
   }
   updateMission2PassportDate(saved.data||[]);
   completions=new Set((saved.data||[]).map(x=>Number(x.exercise)).filter(x=>steps.includes(x)));
   active=currentNext();
   if(completions.size===5)teacherEnding=true;
   autosave=createMission2Autosave({
    client,teamId,userId:authUser.id,
    canRefresh:()=>!submitting&&!interacting(),
    onRestore:rows=>{const changed=JSON.stringify(draft)!==JSON.stringify(rows);if(lastCabinetMove&&(rows[1]?.assignments?.[lastCabinetMove.card]||null)!==lastCabinetMove.after)lastCabinetMove=null;draft=rows;if(changed&&!releaseClosed&&app.querySelector('.m2-controls'))requestRemoteRender()},
    onStatus:autosaveStatus,
    onCompleted:markRemoteCompletion
   });
   await autosave.load();
   const poll=async()=>{if(document.hidden||releaseClosed||submitting)return;try{const {data,error}=await client.from('mission2_exercise_completions').select('exercise,completed_at').eq('team_id',teamId);if(error)return;const previousDate=passportDates[2];updateMission2PassportDate(data||[]);let changed=previousDate!==passportDates[2];for(const row of data||[]){const n=Number(row.exercise);if(steps.includes(n)&&!completions.has(n)){completions.add(n);changed=true}}if(changed){window.dispatchEvent(new Event('m2:progress-changed'));requestRemoteRender()}}catch{}};
   const pollTimer=setInterval(poll,5000);window.addEventListener('pagehide',()=>{clearInterval(pollTimer);clearTimeout(remoteRenderTimer);autosave?.destroy()},{once:true});

  }
  walletContext({client,team:teamId,mission:2,preview:teacher});prepareWallet();
  render();
 }catch(error){console.error('M2 hasiera:',error);cardMessage('Ezin izan da misioa kargatu','Konexioa edo sarbidea egiaztatu eta saiatu berriro.')}
}
function hero(){
 return '<header class="m2-hero"><div><span class="m2-eyebrow">MUSEO DIGITALA · BIGARREN MISIOA</span>'+
 '<h1>Inperialismoaren faktoreak</h1><p>Ekonomia, biztanleria, erlijioa, politika eta ideologiak: zergatik hedatu ziren potentzia kolonialak? Bost aretotan aztertuko duzue. Erantzun okerrek ez dute pistarik emango.</p></div>'+
 '<div class="m2-hero-seal" aria-hidden="true"><strong>02</strong><span>IKERKETA HISTORIKOA</span></div></header>';
}
function nav(){
 const trophy='<svg class="m1-progress-emblem" viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" focusable="false"><circle class="m1-progress-medallion" cx="20" cy="20" r="17.5" fill="#392a1a" stroke="#dcb36a" stroke-width="1.2"/><circle cx="20" cy="20" r="14.5" fill="none" stroke="#98733c" stroke-width=".7"/><path d="M14 11H26V19C26 23 23 25 20 25S14 23 14 19Z" fill="#e2b75e" stroke="#fff0bf" stroke-width=".8"/><path d="M14 13H10V16C10 20 12 21 15 21M26 13H30V16C30 20 28 21 25 21" fill="none" stroke="#e8c779" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 25V29M16 29H24L26 32H14Z" fill="#e2b75e" stroke="#edcf86" stroke-width="1.3" stroke-linejoin="round"/><path d="M20 14L21.1 17.2L24.5 17.2L21.8 19.2L22.8 22.4L20 20.5L17.2 22.4L18.2 19.2L15.5 17.2L18.9 17.2Z" fill="#795020"/><path class="m1-progress-spark" d="M31 5V11M28 8H34M8 27V31M6 29H10" stroke="#ffedb0" stroke-width="1.4" stroke-linecap="round"/></svg>';
 return mission2RouteMarkup(activities,active,{teacher,completedSteps:[...completions],canOpen,ending:teacherEnding})+
 '<div class="m2-archive-access m1-archive-open"><button type="button" data-m2-dossier aria-haspopup="dialog">✧ Ikerketa-espedientea <span>'+completions.size+' / 5</span></button>'+(!teacher?'<button type="button" data-m2-class-progress aria-haspopup="dialog">'+trophy+'Taldeen aurrerapena</button>':'')+missionBriefButton(2)+walletButton()+'</div>';
}
function dossierMarkup(){
 const rows=activities.map(({id,title})=>'<li class="'+(completions.has(id)?'m1-sealed':'')+'"><span class="m1-medal">'+(completions.has(id)?'✓':String(id).padStart(2,'0'))+'</span><span>'+esc(title)+'</span><small>'+(completions.has(id)?'ZIGILATUA':'ZAIN')+'</small></li>').join('');
 return '<div class="m1-archive m2-dossier"><p class="m1-overline">MUSEOKO ARTXIBOA · II. MISIOA</p><p class="m1-team">'+esc(teacher?'Probako taldea':mission2TeamName)+'</p><p>Ariketak gainditu ahala, bost dokumentuak zigilatuko dira.</p><ol>'+rows+'</ol><p class="m1-note">'+completions.size+' / 5 · '+(completions.size===5?'Bigarren misioa osatuta.':'Bosgarren ariketa gainditzean, pasaportea zigilatuko da.')+'</p>'+(teacher?'<p>IRAKASLEAREN AURREBISTA · Ez da daturik gordeko.</p>':'')+(completions.size===5?'<button type="button" class="m2-button" data-dossier-passport>Ikusi pasaportea eta dominak ✧</button>':'')+'</div>';
}
function openDossier(){
 museumDialog('Ikerketa-espedientea',dossierMarkup());
 const dialog=document.querySelector('#m2-reading-dialog');
 dialog.dataset.museumPanel='dossier';
 dialog.querySelector('[data-dossier-passport]')?.addEventListener('click',()=>{
  if(releaseClosed||completions.size!==5)return;dialog.close();teacherEnding=true;render();window.scrollTo({top:0,behavior:'instant'});
 });
}
function openClassProgress(){
 if(teacher||!teamId||releaseClosed)return;
 museumDialog('Taldeen aurrerapena','<div class="m1-archive m1-class-archive"><p class="m1-overline">MUSEOKO ARTXIBOA · II. MISIOA</p><p>Gelako taldeen aurrerapena · 15 segundoan behin eguneratzen da.</p><div id="m2-class-modal-board" aria-live="polite" aria-atomic="true"><p>Taldeen aurrerapena kargatzen…</p></div></div>');
 const dialog=document.querySelector('#m2-reading-dialog'),board=dialog.querySelector('#m2-class-modal-board');
 let alive=true,busy=false,rows=[];
 async function refresh(){
  if(!alive||busy||!dialog.open||releaseClosed||document.hidden)return;
  busy=true;let error=false;
  try{const result=await client.rpc('mission2_class_progress_members');if(result.error)throw result.error;rows=Array.isArray(result.data)?result.data:[]}
  catch(e){error=true;console.warn('Taldeen aurrerapenaren kontsulta',e)}
  finally{busy=false;if(alive&&dialog.open&&!releaseClosed){const html=renderMission1ClassProgress(rows,{ownTeamId:teamId,missionId:2,error});if(board.innerHTML!==html)board.innerHTML=html}}
 }
 const timer=setInterval(refresh,15000);
 const cleanup=()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);window.removeEventListener('m2:progress-changed',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pagehide',cleanup)};
 dialog.addEventListener('close',cleanup,{once:true});
 window.addEventListener('focus',refresh);window.addEventListener('online',refresh);window.addEventListener('m2:progress-changed',refresh);document.addEventListener('visibilitychange',refresh);window.addEventListener('pagehide',cleanup,{once:true});
 void refresh();
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
 '</header>';
}
function museumInstruction(){
 return '<div class="m2-museum-instructions"><span class="m2-museum-hand" aria-hidden="true">☞</span> Dagozkion arrazoien arabera, kokatu beheko txartelak bost faktore hauetan:</div>';
}
// Existing full-colour museum illustrations, not historical primary sources.
// Keep the remaining engraved motifs where no suitable illustration exists.
const cabinetArt={
 economic:'atlas-mission-vivid-1.webp',
 demographic:'m2-suitcase-better-restored.webp',
 religious:'m2-suitcase-faith-restored.webp',
 political:'atlas-mission-vivid-2.webp'
};
const cabinetCardArt={
 new_markets:'m2-reference-harbor.webp',
 settlement:'m2-suitcase-settlement-restored.webp',
 working_conditions:'m2-suitcase-conditions-restored.webp',
 conversion:'m2-suitcase-conversion-restored.webp',
 missions:'m2-suitcase-missions-restored.webp',
 sea_routes:'m2-reference-right-steamer.webp'
};
function renderClassification(){
 const state=taskState(1),assigned=state.assignments||{};
 function tile(c){
  const catalogNumber=String(causes.indexOf(c)+1).padStart(2,'0');
  return '<button type="button" draggable="true" data-card="'+c.id+'" class="m2-tile m2-museum-card m2-archive-card" title="'+esc(c.label)+'" aria-label="'+esc(c.label)+'" aria-pressed="'+(selected===c.id)+'">'+
   '<span class="m2-museum-card-art" aria-hidden="true"><img class="m2-card-miniature" src="./assets/'+(cabinetCardArt[c.id]||'m2-card-'+c.id+'.svg')+'" alt="" draggable="false" loading="eager"></span>'+
   '<span class="m2-card-copy-group"><span class="m2-museum-card-copy">'+esc(museumCardShort[c.id]||c.label)+'</span>'+
   '<span class="m2-card-archive-mark" aria-hidden="true">AGIRIA · '+catalogNumber+'</span></span>'+
   '<span class="m2-card-foil" aria-hidden="true">✦</span></button>';
 }
 const cabinets=categories.map(cat=>{
  const inside=causes.filter(c=>assigned[c.id]===cat.id);
  const cabinetTitle=cat.id==='ideological'?'Ideologikoak /<br> zientifikoak':esc(cat.label);
  return '<article class="m2-museum-case m2-case-'+cat.id+'" data-zone="'+cat.id+'" aria-label="'+esc(cat.label)+'">'+
   '<span class="m2-case-crown" aria-hidden="true"></span><div class="m2-case-arch'+(cabinetArt[cat.id]?' m2-photo-vitrine':'')+'"><img class="m2-case-scene" src="./assets/'+(cabinetArt[cat.id]||'m2-painted-'+cat.id+'.svg')+'" alt="" loading="eager" draggable="false"><span class="m2-case-spot" aria-hidden="true"></span>'+museumSceneDetails(cat.id)+'<div class="m2-case-icon" aria-hidden="true">'+museumIllustration(museumCategoryArt[cat.id],true)+'</div>'+
   '<h3 class="m2-case-title"><button type="button" class="m2-case-title-action" aria-label="'+esc(cat.label)+' faktorean kokatu">'+cabinetTitle+'</button></h3></div>'+
   '<div class="m2-case-well"><button class="m2-case-target" type="button" aria-label="'+esc(cat.label)+' faktorean kokatu">+</button>'+
   '<div class="m2-case-contents">'+inside.map(c=>tile(c)).join('')+'</div>'+
   (!inside.length?'<span class="m2-case-empty">0 kartela kokatuta</span>':'')+
   '</div><span class="m2-case-foot" aria-hidden="true"></span><span class="m2-case-foundation" aria-hidden="true"><span class="m2-case-lock"></span></span></article>';
 }).join('');
 const unassigned=causes.filter(c=>!assigned[c.id]);
 return '<section class="m2-museum-interaction'+(selected?' m2-carrying':'')+'" aria-label="Bost faktoreen kabinetearen sailkapena">'+
  '<div class="m2-museum-cabinet-wall">'+cabinets+'</div>'+
  '<div class="m2-museum-desktop"><span class="m2-desk-left-trim" aria-hidden="true"></span><span class="m2-desk-right-trim" aria-hidden="true"></span><div class="m2-museum-desktop-top"><span>TXARTEL HISTORIKOAK · '+(unassigned.length)+' / '+causes.length+'</span>'+
  '<span class="m2-museum-drag">☞ &nbsp; '+(selected?'Hautatu helmuga edo mahaia':'Aukeratu edo arrastatu')+'</span></div>'+
  '<div class="m2-museum-cards" data-unassign aria-label="Sailkatu gabeko kartelak">'+unassigned.map(tile).join('')+
  (unassigned.length===0?'<p class="m2-museum-all-placed">Kartel guztiak kokatuta. Orain, egiaztatu erantzunak.</p>':'')+'</div><span class="m2-desk-front" aria-hidden="true"><span class="m2-desk-cabinet"></span></span></div></section>';
}

function renderTimeline(){
 const state=taskState(2);
 const years=['1869','1908','1914'];
 const placed=years.filter(year=>Boolean(state[year])).length;
 const taken=new Set(years.map(year=>state[year]).filter(Boolean));
 const cards=['panama','suez','hijaz'].map(id=>infrastructure.find(item=>item.id===id)).map(item=>
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
 return `<div class="m2-e2-scene ${selected?'m2-carrying':''}">
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
      <img src="./assets/atlas-mapa-cartografico.svg" width="720" height="360" alt="" draggable="false">
    </div>
    ${slots}
   </div>
   <div class="m2-e2-dial-progress" role="status" aria-live="polite">✦ <strong>${placed} / 3</strong> pieza ✦</div>
   ${selected&&taken.has(selected)?'<button type="button" class="m2-button secondary m2-return-piece" data-year-return>↶ Itzuli bildumara</button>':''}
  </section>
 </div>
 <section class="m2-e2-ledger" aria-label="Kapitalaren inbertsioen liburua">
  <h3>✦ &nbsp; KAPITALAREN INBERTSIOEN LIBURUA &nbsp; ✦</h3>
  <div class="m2-e2-ledger-pages">
   <fieldset class="m2-e2-ledger-page m2-e2-ledger-finance"><legend><b>1</b> Nola erabili zen metatutako kapitala?</legend>
    <div class="m2-e2-book-illustration m2-e2-finance-illustration" role="img" aria-label="XIX. mendeko inbertsioen liburuko apaindura"></div>
    <div class="m2-e2-options">${choices('funding',[['salaries','Soldatak soilik ordainduz','bag'],['credits','Kredituak emanez','coins'],['donations','Opari pribatuak eginez','gift']])}</div>
   </fieldset>
   <fieldset class="m2-e2-ledger-page m2-e2-ledger-works"><legend><b>2</b> Zer lan mota finantzatu ziren?</legend>
    <div class="m2-e2-book-illustration m2-e2-works-illustration" role="img" aria-label="XIX. mendeko inbertsioen liburuko apaindura"></div>
    <div class="m2-e2-options">${choices('works',[['schools_only','Eskolak soilik','school'],['palaces_only','Jauregiak soilik','palace'],['rail_ports_canals','Trenbideak, portuak eta kanalak','train']])}</div>
   </fieldset>
  </div>
  <p class="m2-e2-source-note">Iturria: 7.–9. diapositibak. Aztertu dokumentazioa eta osatu kronologia eta inbertsioen liburua.</p>
 </section></div>`;
}
function option(id,label,actual){return '<option value="'+id+'" '+(actual===id?'selected':'')+'>'+esc(label)+'</option>'}
/* Una sala, cuatro actividades: atlas fiel al concepto visual elegido.
 * Los campos y las opciones de la parte teórica provienen de las págs. 10-12
 * del PDF del proyecto. Las nuevas respuestas también deben añadirse a la
 * clave privada de Supabase antes de publicar esta rama. */
const atlasRoutes=[
 {id:'africa',title:'Afrika',x:56,y:51},
 {id:'asia',title:'Asia',x:77,y:34},
 {id:'oceania',title:'Ozeania',x:89,y:68}
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
   '<button type="button" draggable="true" data-atlas-route="'+dest.id+'" aria-pressed="'+(atlasSelectedRoute===dest.id)+'" class="m2-atlas-route-card'+(state['route_'+dest.id]?' m2-route-placed':'')+'">'+
   '<span class="m2-atlas-route-numeral">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(dest.title)+'</span>'+
   '<span aria-hidden="true" class="m2-atlas-route-connector">◉</span></button></div>'
 ).join('');
 const placed=atlasRoutes.filter(dest=>!!state['route_'+dest.id]).length;
 const routePins=atlasRoutes.map(dest=>'<button type="button" class="m2-atlas-pin '+(atlasRoutes.some(item=>state['route_'+item.id]===dest.id)?'m2-pin-used':'')+'" data-atlas-target="'+dest.id+'" style="left:'+dest.x+'%;top:'+dest.y+'%;" aria-label="Mapako tokia: '+esc(dest.title)+'">'+
 (atlasRoutes.find(item=>state['route_'+item.id]===dest.id)?'<span>●</span>':'<span>+</span>')+'</button>').join('');
 const lines=atlasRoutes.filter(dest=>!!state['route_'+dest.id]).map(dest=>{
  const point=atlasRoutes.find(item=>item.id===state['route_'+dest.id]);
  return point?'<path data-route-trace="'+dest.id+'" pathLength="1" d="M 53 22 Q '+((53+point.x)/2-8)+' 10 '+point.x+' '+point.y+'" fill="none" stroke="#c13020" stroke-width="1.1" stroke-linecap="round" marker-end="url(#atlasArrow)"/>':'';
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
     '<button type="button" draggable="true" class="m2-atlas-packed" data-atlas-bag-card="'+c[0]+'" aria-pressed="'+(atlasSelectedLuggage===c[0])+'" aria-label="'+esc(c[1])+'; berriz hautatu lekuz aldatzeko"><img class="m2-atlas-card-illustration" src="./assets/'+c[2]+'" width="52" height="40" alt="" loading="eager" decoding="sync" draggable="false">'+esc(c[1])+'</button>').join('')+
   '</div></section>';
 }).join('');
 const stage1=['1850','1870','1900','migration','missionaries'].filter(k=>!!state[k]).length;
 const stage3=atlasStatements.filter(c=>!!state[c[0]]).length;
 const stage4=atlasSuitcase.filter(c=>!!state['bag_'+c[0]]).length;
 const stageAction=(n,label,ready)=>'<button type="button" class="m2-atlas-check" data-atlas-stage="'+n+'" '+(!ready?'disabled':'')+' title="Atalaren osotasuna soilik; zuzentasuna amaieran egiaztatuko da." aria-label="'+n+'. atala: osotasuna egiaztatu">'+(ready?'OSATUTA':'OSATU ATALA')+' ✦</button>';
 return '<section class="m2-atlas-screen m2-migration-gallery" aria-label="Migrazioen bulegoa: lau jarduera interaktibo">'+
  '<header class="m2-atlas-heading"><a class="m2-atlas-home-link" href="./index.html" aria-label="Museora itzuli">← MUSEOA</a><span class="m2-atlas-navigation">BIGARREN MISIOA · 3 / 5</span><h1>MIGRAZIOEN BULEGOA <em>(1850–1900)</em></h1>'+
  '<div class="m2-atlas-total" aria-label="Erantzun osatuak">'+filled+' / '+atlasKeys.length+' osatuta</div></header>'+
  ''+
  (teacher?'<p class="m2-atlas-teacher">IRAKASLEAREN AURREBISTA · Ez da daturik gordeko</p>':'')+
  '<div class="m2-atlas-main">'+
   '<section class="m2-atlas-intro"><div class="m2-atlas-roundel">B</div><h2>Mundu<br> mugimenduan</h2><p>Europatik mundura: biztanleria, migrazioak eta misio erlijiosoak. Aztertu mapa, osatu datuak eta erantzun galderak.</p><span class="m2-atlas-intro-ornament" aria-hidden="true">✦ ❧ ✦</span></section>'+
   '<section class="m2-atlas-pop m2-migration-folio"><h3><span class="m2-migration-index" aria-hidden="true">1</span> Europako biztanleria <small>(milioi biztanle)</small></h3>'+
    '<p>Lotu urtea eta biztanle kopurua. Erabili 10. diapositibako taularen datuak.</p>'+
    '<div class="m2-atlas-pop-list">'+population+'</div>'+
    '<img class="m2-atlas-migrants-foreground" src="./assets/m2-atlas-travelers-cutout.webp" alt="" draggable="false"></section>'+
   '<div class="m2-atlas-main-map"><img src="./assets/m2-migration-map-clean.svg" alt="Munduko mapa orientagarria; muga historikorik eta ibilbiderik gabe" draggable="false">'+
    '<span class="m2-atlas-map-label">EUROPATIK MUNDURA</span><span class="m2-atlas-map-stamp" aria-hidden="true">✵</span><button type="button" class="m2-zoom-button m2-map-zoom" data-map-zoom="migration" aria-label="Munduko mapa handitu" title="Mapa handitu">＋</button></div>'+
   '<section class="m2-atlas-top-question m2-atlas-top-migration m2-migration-dossier"><img class="m2-atlas-top-scene" src="./assets/m2-suitcase-better-restored.webp" alt="" draggable="false">'+
    '<h3>Migrazioak</h3>'+dossierOne+'</section>'+
   '<section class="m2-atlas-top-question m2-atlas-top-mission m2-migration-dossier"><img class="m2-atlas-top-scene" src="./assets/m2-suitcase-missions-restored.webp" alt="" draggable="false">'+
    '<h3>Misio erlijiosoak</h3>'+dossierTwo+'</section>'+
   '<aside class="m2-atlas-critical"><strong>Interpretazio historiko kritikoa:</strong> Ikerketaren ikuspegi kritikoa: misiolarien jarduera kolonizazioaren justifikazio erlijioso gisa erabili zen eta tokiko sinesmen eta kulturen gaineko presioa ekarri zuen.</aside>'+
   '<div class="m2-atlas-top-check">'+atlasSectionStatus(1,stage1,5)+stageAction(1,'EGIAZTATU',stage1===5)+'</div>'+
  '</div>'+
  '<div class="m2-atlas-row-two">'+
   '<section class="m2-atlas-route-activity m2-atlas-activity">'+
    '<header><span class="m2-atlas-number">2</span><h2>Norantz hedatu ziren misioak?</h2></header>'+
    '<p class="m2-atlas-exercise-instruction">Lotu PDFan aipatutako hiru eremuak atlasaren tokiekin. Hautatu izena eta jarri mapan.</p>'+
    '<div class="m2-atlas-route-stage"><div class="m2-atlas-route-labels">'+routes+'</div>'+
    '<div class="m2-atlas-route-map"><img src="./assets/m2-migration-map-clean.svg" alt="Munduko mapa" draggable="false">'+
    '<svg class="m2-atlas-route-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="atlasArrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0 0L4 2L0 4Z" fill="#c13020"/></marker></defs>'+lines+'</svg>'+
    routePins+'</div></div>'+
    '<footer>'+atlasSectionStatus(2,placed,3)+(atlasSelectedRoute&&state['route_'+atlasSelectedRoute]?'<button type="button" class="m2-bag-return" data-route-return>↶ Kendu ibilbidea</button>':'')+stageAction(2,'EGIAZTATU',placed===3)+'</footer>'+
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
   '<div class="m2-atlas-luggage-board"><div class="m2-atlas-luggage-available" data-atlas-bag-reset><span class="m2-atlas-luggage-note">SAILKATZEKO AGIRIAK · '+(8-stage4)+'</span><button type="button" data-bag-return class="m2-bag-return" '+(!atlasSelectedLuggage||!state['bag_'+atlasSelectedLuggage]?'hidden':'')+'>↶ Itzuli mahaira</button><div class="m2-atlas-luggage-cards">'+cards+'</div></div>'+
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
     '<span class="m2-archive-image-caption">'+esc(a.ref)+'</span><small class="m2-archive-art-note">Ilustrazio didaktikoa</small><button type="button" class="m2-zoom-button m2-source-zoom" data-source-zoom="'+esc(a.id)+'" aria-label="'+esc(a.title)+' handitu" title="Agiria handitu">＋</button></div>'+
    '<div class="m2-archive-card-writing"><div class="m2-source-titling"><h3>'+esc(a.title)+'</h3></div>'+
     '<span class="m2-archive-reading-label">TESTU MOLDATUA</span><p class="m2-source-text">'+esc(a.body)+'</p>'+
     '<fieldset><legend><span class="m2-archive-question-mark" aria-hidden="true">?</span>'+esc(a.question)+'</legend>'+
      a.options.map(([key,label])=>'<label class="m2-choice"><input type="radio" name="source-'+esc(a.id)+'" value="'+esc(key)+'" data-archive="'+esc(a.id)+'" '+(state[a.id]===key?'checked':'')+'><span>'+esc(label)+'</span></label>').join('')+
     '</fieldset></div>'+
   '</div><span class="m2-source-seal" aria-hidden="true">ARTXIBOA</span></article>';
 }).join('');
 return '<div class="m2-archive-scene">'+
   '<div class="m2-archive-room-props" aria-hidden="true"></div>'+
   '<div class="m2-archive-desk">'+
    '<div class="m2-archive-desk-crest"><span aria-hidden="true">❧</span><div><span class="m2-archive-eyebrow">IKERKETA HISTORIKOA · 04 / 05</span>'+
     '<h3>Boterearen artxiboa</h3><p>Aztertu bost agiriak, interpretatu testuinguru historikoa eta aukeratu galdera bakoitzaren erantzuna. Irudiak ilustrazio didaktikoak dira.</p></div>'+
     '<div class="m2-archive-progress" role="status" aria-live="polite"><span>ERANTZUNDAKO AGIRIAK</span><strong data-archive-progress>'+answered+' / 5</strong></div>'+
    '</div>'+
    '<div class="m2-source-grid m2-source-grid-museum m2-archive-five-files">'+cards+'</div>'+
    '<div class="m2-archive-desk-front" aria-hidden="true"><span>ARTXIBO HISTORIKOA · XIX. MENDEA</span></div>'+
   '</div>'+
   '<aside class="m2-evidence m2-archive-warning"><span class="m2-archive-warning-emblem" aria-hidden="true">!</span>'+
    '<div><strong>OHAR KRITIKOA</strong><p>Arrazismoa justifikatzeko erabiltzen ziren teoriak ideologia historikoak ziren, ez zientzia baliozkoa. Horrelako argudioek kolonialismoa eta diskriminazioa legitimatzeko balio izan zuten.</p></div></aside>'+
  '</div>';
}
function multiButtons(group,options,selectedIds){
 const ids=new Set(selectedIds||[]),limit=group==='africa'?4:3;
 return '<div class="m2-multi">'+options.map(([id,label])=>'<button type="button" class="m2-tile" data-multi="'+group+'" data-value="'+id+'" aria-pressed="'+ids.has(id)+'">'+esc(label)+'</button>').join('')+'</div><p class="m2-selection-count" role="status">'+ids.size+' / '+limit+' hautatuta</p>';
}
function expeditionMap(){
 return "<svg class=\"m2-expedition-svg\" viewBox=\"0 0 540 620\" role=\"img\" aria-label=\"Afrikako mapa orientagarria, kostaldeak eta lau ibai eskematiko izenik gabe. Ez du muga historikorik erakusten.\" xmlns=\"http://www.w3.org/2000/svg\"><defs><radialGradient id=\"m2-paper\"><stop stop-color=\"#f7e6bd\"/><stop offset=\"1\" stop-color=\"#c5a16b\"/></radialGradient><linearGradient id=\"m2-ink\"><stop stop-color=\"#346f83\"/><stop offset=\"1\" stop-color=\"#206078\"/></linearGradient></defs><rect width=\"540\" height=\"620\" fill=\"url(#m2-paper)\"/><rect x=\"16\" y=\"16\" width=\"508\" height=\"588\" rx=\"3\" fill=\"none\" stroke=\"#957343\" stroke-width=\"2\"/><rect x=\"22\" y=\"22\" width=\"496\" height=\"576\" fill=\"none\" stroke=\"#b48c53\"/><text x=\"270\" y=\"52\" text-anchor=\"middle\" fill=\"#594022\" font-family=\"Georgia,serif\" font-size=\"19\" font-weight=\"bold\" letter-spacing=\"4\">AFRIKAKO ATLASA</text><image class=\"m2-africa-cartography\" href=\"./assets/m2-africa-cartography.svg\" x=\"32\" y=\"70\" width=\"476\" height=\"476\"/><rect x=\"32\" y=\"70\" width=\"476\" height=\"476\" fill=\"none\" stroke=\"#85683d\" stroke-width=\"2\"/><path d=\"M32 308H508\" stroke=\"#987746\" stroke-dasharray=\"5 5\" opacity=\".7\"/><text x=\"40\" y=\"301\" fill=\"#5e563d\" font-family=\"Georgia\" font-size=\"10\">EKUATOREA</text><g class=\"m2-historic-rivers\" fill=\"none\" stroke=\"url(#m2-ink)\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M338 313Q326 298 331 280L330 261 342 241 329 211 331 184 326 154 328 144\"/><path d=\"M111 255Q126 232 148 218Q169 223 177 242L183 263 196 282\"/><path d=\"M302 366Q288 351 292 331T296 308Q280 298 259 308L250 321 244 329 228 340\"/><path d=\"M291 371Q284 386 302 403Q317 413 328 399L339 393 350 398 355 409\"/></g><g fill=\"#365e60\" font-family=\"Georgia,serif\" font-size=\"12\" letter-spacing=\"1\"><text x=\"51\" y=\"392\" transform=\"rotate(-90 51 392)\">OZEANO ATLANTIKOA</text><text x=\"490\" y=\"320\" transform=\"rotate(90 490 320)\">INDIAKO OZEANOA</text><text x=\"250\" y=\"112\" text-anchor=\"middle\" font-size=\"11\">MEDITERRANEO ITSASOA</text></g><g transform=\"translate(460 500)\" stroke=\"#604725\" fill=\"#dec28b\"><circle r=\"28\" stroke-width=\"1.5\"/><circle r=\"21\" fill=\"none\"/><path d=\"M0-32 5-5 32 0 5 5 0 32-5 5-32 0-5-5Z\" fill=\"#bc9152\"/><path d=\"M0-32V0L5-5ZM32 0H0L5 5ZM0 32V0L-5 5ZM-32 0H0L-5-5Z\" fill=\"#664a2a\"/><text y=\"-36\" text-anchor=\"middle\" font-family=\"Georgia\" font-size=\"10\" fill=\"#604725\" stroke=\"none\">I</text></g><path d=\"M45 568H77\" stroke=\"#346f83\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><text x=\"85\" y=\"572\" fill=\"#5a4328\" font-family=\"Georgia\" font-size=\"13\">Ibaiak (eskema)</text><text x=\"495\" y=\"572\" text-anchor=\"end\" fill=\"#5a4328\" font-family=\"Georgia\" font-size=\"10\">Natural Earth · 1:110m</text><text x=\"270\" y=\"590\" text-anchor=\"middle\" fill=\"#715736\" font-family=\"Georgia\" font-size=\"10\">Mapa orientagarria · Muga historikorik gabe</text></svg>";
}
function explorerCards(field,label,options,state){
 return '<fieldset class="m2-explorer-cards"><legend>'+esc(label)+'</legend><div class="m2-explorer-options">'+options.map(([value,name])=>'<button type="button" class="m2-explorer-card" data-expedition-field="'+field+'" data-expedition-value="'+value+'" aria-pressed="'+(state[field]===value)+'"><span aria-hidden="true">'+(field==='meeting'?'✦':'✥')+'</span><strong>'+esc(name)+'</strong></button>').join('')+'</div></fieldset>';
}
function renderExpedition(){
 const state=taskState(5),data=state.multi||{};
 const chosen=[...(data.africa||[])];
 const filled=[chosen.length===4,(data.asia||[]).length===3,!!(state.north&&state.south),!!state.meeting,!!state.congo];
 const fileStatus=n=>'<span class="m2-expedition-file-status" data-file-filled="'+filled[n-1]+'">'+(filled[n-1]?'Erantzunda':'Zain')+'</span>';
 const dossierArt=(src,cls,caption)=>'<figure class="m2-exploration-art '+cls+'"><img src="./assets/'+src+'" alt="" decoding="async"><figcaption>'+caption+'</figcaption></figure>';
 const chosenLabels=chosen.map(id=>riverOptions.find(x=>x[0]===id)?.[1]||id);
 return '<div class="m2-expedition m2-expedition-research">'+
  '<aside class="m2-atlas m2-historical-map">'+
   '<div class="m2-atlas-museum-title"><span>ESPLORAZIOEN ATLASA</span><small>XIX. MENDEA · AGIRIA 05</small></div>'+
   '<div class="m2-expedition-map-wrap">'+expeditionMap()+'<button type="button" class="m2-zoom-button m2-map-zoom" data-map-zoom="expedition" aria-label="Esplorazioen mapa handitu" title="Mapa handitu">＋</button></div>'+
   '<div class="m2-atlas-route-ledger"><strong>Aukeratutako izenak · '+chosen.length+' / 4</strong>'+
    '<div class="m2-atlas-route-tags" aria-live="polite">'+(chosenLabels.length?chosenLabels.map(label=>'<span>'+esc(label)+'</span>').join(''):'<em>Oraindik ez da izenik aukeratu.</em>')+'</div></div>'+
   '<p class="m2-atlas-footnote">Kostaldeak: Natural Earth. Ibaien trazadurak eskematikoak eta izenik gabeak dira. Handitu mapa xehetasunak aztertzeko.</p>'+
  '</aside>'+
  '<div class="m2-atlas-notes m2-expedition-files">'+
   '<div class="m2-expedition-intro"><span class="m2-archive-eyebrow">IKERKETA GEOGRAFIKOA · 05 / 05</span><h3>Esploratzaileen espedientea</h3>'+
    '<p>Lotu mapa, espedizioak eta Kongoko ustiapen kolonialaren testuingurua. Aztertu bost agiriak; erantzun guztiak osatu arte ezingo dituzue egiaztatu.</p><div class="m2-expedition-progress" role="status"><span>ERANTZUNDAKO AGIRIAK</span><strong>'+filled.filter(Boolean).length+' / 5</strong><span class="m2-expedition-progress-track" aria-hidden="true"><i style="width:'+filled.filter(Boolean).length*20+'%"></i></span></div></div>'+
   '<section class="m2-panel m2-expedition-panel"><header><span>AGIRIA 01</span><h3>Afrikako ibai handiak</h3>'+fileStatus(1)+'</header>'+
    '<p class="m2-caption">Aukeratu diapositiban aipatzen diren LAU ibaiak.</p>'+
    multiButtons('africa',riverOptions,data.africa)+'</section>'+
   '<section class="m2-panel m2-expedition-panel"><header><span>AGIRIA 02</span><h3>Asia eta Ozeaniako esplorazioak</h3>'+fileStatus(2)+'</header>'+
    ''+dossierArt('m2-migration-map-clean.svg','m2-exploration-map-art','Mapa orientagarria · Ez da garaiko dokumentua.')+'<p class="m2-caption">Aukeratu aipatzen diren HIRU eremuak.</p>'+
    multiButtons('asia',asiaOptions,data.asia)+'</section>'+
   '<section class="m2-panel m2-expedition-panel"><header><span>AGIRIA 03</span><h3>Poloetarako espedizioak</h3>'+fileStatus(3)+'</header>'+
    '<div class="m2-polar-plate" aria-hidden="true"><svg viewBox="0 0 320 58" xmlns="http://www.w3.org/2000/svg"><path d="M0 42 42 19 66 34 105 12 140 39 180 27 210 7 253 37 290 24 320 41V58H0Z" fill="#b6c6c6"/><path d="M0 47 56 39 102 51 160 39 222 49 284 40 320 48V58H0Z" fill="#f7f4e8"/><g fill="#49656b"><path d="M140 34h35l-8 7h-21Z"/><path d="M156 13v21h-17Z" fill="#e8e1c9"/><path d="M157 16v18h15Z" fill="#b78453"/></g></svg></div><div class="m2-mini-grid">'+explorerCards('north','Ipar Poloa',[['peary','Peary'],['amundsen','Amundsen']],state)+explorerCards('south','Hego Poloa',[['peary','Peary'],['amundsen','Amundsen']],state)+'</div></section>'+
   '<section class="m2-panel m2-expedition-panel m2-expedition-meeting"><header><span>AGIRIA 04</span><h3>Stanley eta Livingstone</h3>'+fileStatus(4)+'</header>'+
    ''+dossierArt('atlas-mission-vivid-2.webp','m2-exploration-meeting-art','AA bidez sortutako giro historikoa; ez da Stanleyren eta Livingstoneren erretratua.')+'<p class="m2-caption">Prentsak ospetsu egin zuen bi esploratzaileen topaketa. Aztertu 18. diapositibako gertakaria.</p>'+
    explorerCards('meeting','Zein urtetan aurkitu zuen Henry M. Stanleyk David Livingstone?',[['1869','1869'],['1871','1871'],['1908','1908']],state)+'</section>'+
   '<section class="m2-panel m2-expedition-panel m2-expedition-congo"><header><span>AGIRIA 05</span><h3>Kongoko espediente koloniala</h3>'+fileStatus(5)+'</header>'+
    ''+dossierArt('atlas-expediente-foto-hd.webp','m2-exploration-congo-art','Artxiboko apaindura · Ez da Kongoko jatorrizko dokumentua.')+'<p class="m2-caption">Aztertu Henry M. Stanleyren eta Leopoldo II.aren arteko lotura 18. diapositibako testuinguruan. Bereizi esplorazioaren helburuak eta ondorioak.</p>'+
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
 if(active===1)return causes.every(c=>categories.some(cat=>cat.id===state.assignments?.[c.id]));
 if(active===5)return (state.multi?.africa?.length===4&&state.multi?.asia?.length===3&&['north','south','meeting','congo'].every(k=>!!state[k]));
 return responseKeys[active].every(key=>!!state[key]);
}
function canUndoCabinet(){return active===1&&!!lastCabinetMove&&(teacher||!completions.has(1))&&(taskState(1).assignments?.[lastCabinetMove.card]||null)===lastCabinetMove.after}
function controls(){
 const done=completions.has(active);

 return '<div class="m2-controls">'+(teacher?'':'<p id="m2-autosave" class="m2-autosave-status" role="status" data-save-state="'+esc(saveKind)+'" data-state="'+esc(saveKind)+'">'+esc(saveStatus)+'</p>')+'<p id="m2-feedback" class="m2-feedback" role="status" data-state="'+esc(feedbackState)+'">'+esc(feedback||(done?'Ariketa hau osatu duzue.':'Aukerak osatu eta egiaztatu. Ez da erantzun zuzenik agertuko akatsen ondoren.'))+'</p>'+
 '<div class="m2-buttons">'+(active===1?'<button type="button" class="m2-button secondary" data-cabinet-undo '+(!canUndoCabinet()||submitting?'disabled':'')+'>↶ Desegin</button>':'')+'<button type="button" class="m2-button secondary" data-reset '+((submitting||done&&!teacher)?'disabled':'')+'>↻ Berrabiarazi</button>'+
 (teacher?(active===1?'<button type="button" class="m2-button" data-preview-check>✓ EGIAZTATU</button><button type="button" class="m2-button secondary" data-preview-next>Hurrengo aretoa →</button>':'<button type="button" class="m2-button" data-preview-next>'+ (active===5?'Amaierako pantaila ikusi':'Hurrengo aretoa →')+'</button>'):
 done&&active<5?'<button type="button" class="m2-button" data-next>Hurrengo aretoa →</button>':
 done&&active===5?'<button type="button" class="m2-button" data-ending>Amaiera ikusi</button>':
 '<button type="button" class="m2-button" data-check '+(!isReady()||submitting?'disabled':'')+'>'+'✓ Erantzunak egiaztatu'+'</button>')+
 '</div></div>';
}
function animateRoomArrival(room){arriveMuseumRoom(app,'2:'+room)}
function renderEnd(){
 // Preview never changes the student's stored completions.
 const label=teacher?'IRAKASLEAREN AURREBISTA · EZ DA GORDE':'2. MISIOA GAINDITUTA';
 const team=teacher?'Probako taldea':mission2TeamName;
 const files=activities.map(({id,title})=>'<li><span class="m2-ceremony-file-seal" aria-hidden="true">✓</span><span><small>AGIRIA '+String(id).padStart(2,'0')+'</small><strong>'+esc(title)+'</strong></span><small class="m2-ceremony-file-mark">'+(teacher?'SIMULAZIOA':'ZIGILATUA')+'</small></li>').join('');
 return nav()+'<section class="m2-finished m2-award-ceremony" data-ceremony-preview="'+teacher+'" aria-labelledby="m2-ceremony-title">'+
 '<div class="m2-ceremony-frame"><header class="m2-ceremony-header"><span class="m2-ceremony-plaque">MUSEOKO ARTXIBOA · II. MISIOA</span><span class="m2-ceremony-label">'+label+'</span><h1 id="m2-ceremony-title">'+(teacher?'Bigarren misioaren amaiera':'Zorionak, ikertzaileak!')+'</h1><p>Inperialismoaren faktoreak aztertu dituzue!</p></header>'+
 '<div class="m2-ceremony-layout"><article class="m2-ceremony-certificate"><div class="m2-ceremony-certificate-heading"><span>IKERKETA HISTORIKOAREN EGIAZTAGIRIA</span><h2>'+esc(team)+'</h2><div class="m2-victory-ribbon"><span aria-hidden="true">✦</span> BOST ARIKETAK OSATUTA <span aria-hidden="true">✦</span></div></div>'+
 '<ol class="m2-ceremony-files" aria-label="Bost ikerketa-agiriak">'+files+'</ol><p class="m2-ceremony-reflection">Ekonomiaren, demografiaren, erlijioaren, politikaren eta ideologien eragina ikertu duzue. Erabili ikuspegi kritikoa kolonialismoaren justifikazioak aztertzerakoan.</p></article>'+
 '<div class="m2-ceremony-reward"><div class="m2-ceremony-award-title">BIGARREN MISIOAREN DOMINA</div>'+
 renderMuseumPassport({teamName:team,completedIds:[1,2],completedAt:passportDates,preview:teacher,animate:!teacher,animateMission:2,variant:'ceremony'})+
 '</div></div>'+
 '<footer class="m2-ceremony-footer"><div>'+(teacher?'<p><strong>Irakaslearen aurrebista.</strong> Ez da saiakerarik edo osatzerik gorde.</p>':'<p><strong>3. misioa prestatzen ari gara.</strong> Taldearen aurrerapena zerbitzarian gordeta dago.</p>')+'</div>'+
 '<a class="m2-button m2-ceremony-return" href="./index.html'+(teacher?'?teacherpanel=1':'')+'">Museora itzuli →</a></footer></div></section>';
}
function render(){
 if(releaseClosed)return;
 if(teacherEnding&&!teacher&&completions.size!==5)teacherEnding=false;
 remoteRenderPending=false;clearTimeout(remoteRenderTimer);remoteRenderTimer=null;
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
 if(atlasRoom){app.innerHTML=nav()+renderPopulation();return}
 if(firstRoom){
  app.innerHTML=nav()+museumHeader()+museumInstruction()+
    (teacher?'<p class="m2-museum-preview">IRAKASLEAREN AURREBISTA · EZ DA DATURIK GORDEKO</p>':'')+
    renderClassification()+controls();
  return;
 }
 const item=activity(active);
 app.innerHTML=nav()+hero()+(teacher?'<p class="m2-chip">IRAKASLEAREN AURREBISTA · EZ DA DATURIK GORDEKO</p>':'')+
 intro()+'<section class="m2-work" aria-label="'+esc(item.title)+'">'+renderExercise()+'</section>'+controls();
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
   if(completions.size===5)try{const r=await client.from('mission2_exercise_completions').select('exercise,completed_at').eq('team_id',teamId);if(!r.error)updateMission2PassportDate(r.data||[])}catch{}
   window.dispatchEvent(new Event('m2:progress-changed'));
   feedback='Ariketa gaindituta! Taldearen aurrerapena gorde da.';
   feedbackState='success';
   render();stampMuseumExercise(2,active);
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
 active=n;lastCabinetMove=null;selected=null;atlasSelectedRoute=null;atlasSelectedLuggage=null;dragging=false;feedback='';feedbackState='';teacherEnding=false;render();
 window.scrollTo({top:0,behavior:'instant'});
}
function assignToCategory(catId){
 if(active!==1||!causes.some(c=>c.id===selected)||!categories.some(c=>c.id===catId))return;
 const state=taskState(1);state.assignments=state.assignments||{};
 const former=selected;const before=state.assignments[former]||null;
 if(before!==catId)lastCabinetMove={card:former,before,after:catId};
 state.assignments[former]=catId;selected=null;
 queueMission2({assignments:{[former]:catId}},1);
 feedback='';feedbackState='';render();
 $('[data-card="'+former+'"]')?.focus({preventScroll:true});animatePlacement('[data-card="'+former+'"]');
}
function assignYear(year){
 if(active!==2||!infrastructure.some(i=>i.id===selected)||!['1869','1908','1914'].includes(year))return;
 const state=taskState(2);
 const patch={};
 for(const y of ['1869','1908','1914'])if(state[y]===selected){delete state[y];patch[y]=null}
 state[year]=selected;patch[year]=selected;queueMission2(patch,2);selected=null;render();
 $('[data-year="'+year+'"]')?.focus({preventScroll:true});animatePlacement('[data-year="'+year+'"]');
 const dial=$('.m2-e2-globe');if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)dial?.animate?.([{transform:'rotate(-3deg)'},{transform:'rotate(2deg)'},{transform:'rotate(0deg)'}],{duration:460,easing:'ease-out'});
}
function toggleMulti(group,value){
 const state=taskState(5);state.multi=state.multi||{};
 if(!['africa','asia'].includes(group)||!(group==='africa'?riverOptions:asiaOptions).some(([id])=>id===value))return;
 const list=new Set(state.multi[group]||[]),limit=group==='africa'?4:3;
 if(list.has(value))list.delete(value);else if(list.size<limit)list.add(value);else{setFeedback('Kendu hautatutako aukera bat beste bat hautatu aurretik.');return}
 state.multi[group]=[...list];queueMission2({multi:{[group]:state.multi[group]}},5);render();
 $('[data-multi="'+group+'"][data-value="'+value+'"]')?.focus({preventScroll:true});
}

/* Los cuatro paneles conservan los campos en draft[3], no corrigen en el cliente.
   Las respuestas de la misión se validan únicamente mediante la RPC privada. */
function atlasMoveRoute(location){
 if(active!==3||!atlasRoutes.some(r=>r.id===atlasSelectedRoute)||!atlasRoutes.some(r=>r.id===location))return;
 const state=taskState(3);
 const patch={};
 for(const route of atlasRoutes){
  if(route.id!==atlasSelectedRoute&&state['route_'+route.id]===location){delete state['route_'+route.id];patch['route_'+route.id]=null}
 }
 const moved=atlasSelectedRoute;state['route_'+moved]=location;
 patch['route_'+moved]=location;queueMission2(patch,3);
 atlasSelectedRoute=null;
 feedback='';feedbackState='';render();
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)$('[data-route-trace="'+moved+'"]')?.animate?.([{strokeDasharray:'1',strokeDashoffset:1},{strokeDasharray:'1',strokeDashoffset:0}],{duration:550,easing:'ease-out'});
}
function atlasPack(bag){
 if(active!==3||!atlasSuitcase.some(c=>c[0]===atlasSelectedLuggage)||!['cause','effect'].includes(bag))return;
 const item=atlasSelectedLuggage;taskState(3)['bag_'+item]=bag;
 queueMission2({['bag_'+item]:bag},3);
 atlasSelectedLuggage=null;
 feedback='';feedbackState='';render();animatePlacement('[data-atlas-bag-card="'+item+'"]');
}
function atlasReturnBag(){
 if(active!==3||!atlasSuitcase.some(c=>c[0]===atlasSelectedLuggage))return;
 const item=atlasSelectedLuggage;delete taskState(3)['bag_'+item];queueMission2({['bag_'+item]:null},3);
 atlasSelectedLuggage=null;render();$('[data-atlas-bag-card="'+item+'"]')?.focus({preventScroll:true});
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
 if(submitting||releaseClosed)return;
 const elem=event.target.closest('button');
 if(!elem||!app.contains(elem)){
   const zone=event.target.closest('[data-zone]');
   if(zone&&app.contains(zone)&&active===1)return assignToCategory(zone.dataset.zone);
   const desk=event.target.closest('[data-unassign]');
   if(desk&&selected&&active===1){
     const assignments=taskState(1).assignments||{};
     const removed=selected;if(assignments[removed])lastCabinetMove={card:removed,before:assignments[removed],after:null};delete assignments[removed];queueMission2({assignments:{[removed]:null}},1);
     selected=null;feedback='';feedbackState='';render();
   }
   return;
 }
 if(elem.hasAttribute('data-source-zoom'))return openSource(elem.dataset.sourceZoom);
 if(elem.hasAttribute('data-map-zoom'))return openMap(elem.dataset.mapZoom);
 if(elem.hasAttribute('data-bag-return'))return atlasReturnBag();
 if(elem.hasAttribute('data-m2-dossier'))return openDossier();
 if(elem.hasAttribute('data-m2-class-progress'))return openClassProgress();
 if(elem.hasAttribute('data-open'))return openExercise(Number(elem.dataset.open));
 if(active===3&&elem.hasAttribute('data-atlas-route')){
  atlasSelectedRoute=atlasSelectedRoute===elem.dataset.atlasRoute?null:elem.dataset.atlasRoute;
  atlasSelectedLuggage=null;render();return;
 }
 if(active===3&&elem.hasAttribute('data-atlas-target'))return atlasMoveRoute(elem.dataset.atlasTarget);
 if(active===3&&elem.hasAttribute('data-route-return')){
  if(!atlasRoutes.some(r=>r.id===atlasSelectedRoute))return;
  const field='route_'+atlasSelectedRoute;delete taskState(3)[field];queueMission2({[field]:null},3);atlasSelectedRoute=null;render();return;
 }
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
 if(elem.hasAttribute('data-year')){
  if(!selected&&active===2&&taskState(2)[elem.dataset.year]){selected=taskState(2)[elem.dataset.year];render();return}
  return assignYear(elem.dataset.year)
 }
 if(elem.hasAttribute('data-year-return')){
  if(active!==2||!selected)return;
  const state=taskState(2),patch={};for(const year of ['1869','1908','1914'])if(state[year]===selected){delete state[year];patch[year]=null}
  selected=null;if(Object.keys(patch).length)queueMission2(patch,2);render();return;
 }
 if(elem.hasAttribute('data-multi'))return toggleMulti(elem.dataset.multi,elem.dataset.value);
 if(elem.hasAttribute('data-expedition-field')){
  if(active!==5||!teacher&&completions.has(5))return;
  const field=elem.dataset.expeditionField,value=elem.dataset.expeditionValue;
  const permitted={north:['peary','amundsen'],south:['peary','amundsen'],meeting:['1869','1871','1908']};
  if(!permitted[field]?.includes(value))return;
  const state=taskState(5);if(state[field]===value){delete state[field];queueMission2({[field]:null},5)}else{state[field]=value;queueMission2({[field]:value},5)}
  render();$('[data-expedition-field="'+field+'"][data-expedition-value="'+value+'"]')?.focus({preventScroll:true});return;
 }
 if(elem.hasAttribute('data-cabinet-undo')){
  if(!canUndoCabinet())return;
  const {card,before}=lastCabinetMove;lastCabinetMove=null;const assignments=taskState(1).assignments||(taskState(1).assignments={});
  if(before)assignments[card]=before;else delete assignments[card];
  queueMission2({assignments:{[card]:before}},1);selected=null;feedback='';feedbackState='';render();return;
 }
 if(elem.hasAttribute('data-reset')){
  if(completions.has(active)&&!teacher)return;
  const exercise=active;
  museumDialog('Ariketa berriz hasi?','<p class="m2-dialog-reading">'+(teacher?'Aurrebistako erantzunak ezabatuko dira.':'Ariketa honetako taldearen erantzunak ezabatuko dira, baita beste kideek gordetakoak ere. Lortutako zigiluak ez dira galduko.')+'</p>',{confirm:true,onConfirm:()=>{if(active!==exercise||!teacher&&completions.has(exercise))return;draft[exercise]={};if(exercise===1)lastCabinetMove=null;if(!teacher)autosave?.reset(exercise);selected=null;atlasSelectedRoute=null;atlasSelectedLuggage=null;feedback='';feedbackState='';render()}});return
 }
 if(elem.hasAttribute('data-check')){void check();return}
 if(elem.hasAttribute('data-next')){openExercise(active+1);return}
 if(elem.hasAttribute('data-preview-check')){setFeedback('Aurrebista: irakaslearen erantzunak ez dira gordetzen.','');return}
 if(elem.hasAttribute('data-preview-next')){if(active===5){teacherEnding=true;render()}else openExercise(active+1);return}
 if(elem.hasAttribute('data-ending')&&(teacher||completions.size===5)){teacherEnding=true;render()}
});
app.addEventListener('change',event=>{
 if(submitting||releaseClosed)return;
 const target=event.target;
 if(target.matches('select[data-field],input[type="radio"][data-field]')){
  if(target.value)taskState(active)[target.dataset.field]=target.value;else delete taskState(active)[target.dataset.field];
  queueMission2({[target.dataset.field]:target.value||null});
 }
 if(active===3&&target.matches('select[data-field],input[type="radio"][data-field]')){
  const selector=target.tagName==='SELECT'?'select[data-field="'+target.dataset.field+'"]':'input[data-field="'+target.dataset.field+'"][value="'+target.value+'"]';
  render();$(selector)?.focus({preventScroll:true});return;
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
 if(event.key==='Escape'&&(selected||atlasSelectedRoute||atlasSelectedLuggage)){event.preventDefault();selected=null;atlasSelectedRoute=null;atlasSelectedLuggage=null;render();return}
 if(active!==1||!['Enter',' '].includes(event.key))return;
 const zone=event.target.closest('[data-zone]');
 if(zone&&event.target===zone){event.preventDefault();assignToCategory(zone.dataset.zone)}
});
app.addEventListener('pointerdown',()=>{pointerEditing=true});
window.addEventListener('pointerup',()=>{pointerEditing=false});
window.addEventListener('pointercancel',()=>{pointerEditing=false});
window.addEventListener('blur',()=>{pointerEditing=false;dragging=false});
app.addEventListener('dragstart',event=>{
 if(submitting||releaseClosed){event.preventDefault();return}
 dragging=true;pointerEditing=false;
 if(active===3){
  const route=event.target.closest('[data-atlas-route]');
  const item=event.target.closest('[data-atlas-bag-card]');
  if(route){atlasSelectedRoute=route.dataset.atlasRoute;event.dataTransfer?.setData('text/plain','route:'+atlasSelectedRoute);return}
  if(item){atlasSelectedLuggage=item.dataset.atlasBagCard;event.dataTransfer?.setData('text/plain','bag:'+atlasSelectedLuggage);return}
 }
 const card=event.target.closest('[data-card]')||event.target.closest('[data-event]');
 if(!card){dragging=false;return}
 selected=card.dataset.card||card.dataset.event;
 event.dataTransfer?.setData('text/plain',selected);
 if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
});
app.addEventListener('dragover',event=>{
 if(active===3&&event.target.closest('[data-atlas-target],[data-atlas-bag-zone],[data-atlas-bag-reset]')){
  event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';return;
 }
 if(event.target.closest('[data-zone]')||event.target.closest('[data-year]')||event.target.closest('[data-unassign]'))event.preventDefault();
});
app.addEventListener('drop',event=>{
 dragging=false;pointerEditing=false;
 if(submitting||releaseClosed){event.preventDefault();return}
 if(active===3){
  const pin=event.target.closest('[data-atlas-target]');
  const bag=event.target.closest('[data-atlas-bag-zone]');
  const tray=event.target.closest('[data-atlas-bag-reset]');
  if(pin||bag||tray){
   event.preventDefault();
   const type=event.dataTransfer?.getData('text/plain')||'';
   if(pin&&type.startsWith('route:')){atlasSelectedRoute=type.slice(6);return atlasMoveRoute(pin.dataset.atlasTarget)}
   if((bag||tray)&&type.startsWith('bag:')){atlasSelectedLuggage=type.slice(4);return bag?atlasPack(bag.dataset.atlasBagZone):atlasReturnBag()}
   return;
  }
 }
 const zone=event.target.closest('[data-zone]');
 const year=event.target.closest('[data-year]');
 const loose=event.target.closest('[data-unassign]');
 if(!zone&&!year&&!loose)return;
 event.preventDefault();
 const moved=event.dataTransfer?.getData('text/plain');
 if(active===1&&!causes.some(c=>c.id===moved)||active===2&&!infrastructure.some(i=>i.id===moved))return;
 if(moved)selected=moved;
 if(loose&&active===1&&selected){
   const removed=selected;const before=taskState(1).assignments?.[removed];if(before)lastCabinetMove={card:removed,before,after:null};delete taskState(1).assignments?.[removed];
   queueMission2({assignments:{[removed]:null}},1);selected=null;feedback='';feedbackState='';render();return;
 }
 if(zone)assignToCategory(zone.dataset.zone);
 if(year)assignYear(year.dataset.year);
});
document.addEventListener('dragend',()=>{dragging=false;pointerEditing=false;if(selected||atlasSelectedRoute||atlasSelectedLuggage){selected=null;atlasSelectedRoute=null;atlasSelectedLuggage=null;render()}});
initialize();
