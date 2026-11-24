import { paintSaveIndicator, SAVE_TEXT } from './save-indicator.js?v=20261124-guardado1';
import { startClassAccess } from "./class-access.js?v=20261124-access2";
/* Bi sistema, bi Europa · fase 2. El servidor guarda las soluciones y las comprobaciones. */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { mountExerciseNav, mountStudentExerciseNav, markMission1NavCompleted, addTeacherStageControls } from "./mission1-navigation.js?v=20261124-wallet1";
import { ICONS } from "./bi-sistema-iconos.js?v=1";
import { createBiSistemaShared } from "./bi-sistema-shared.js?v=20261124-guardado1";

const TRAITS=[
  ["army","Armadak pisu handia",""],
  ["monarch","Monarka bat agintari",""],
  ["parliament","Parlamentua kontrolatu",""],
  ["separation","Botere-banaketa",""],
  ["rights","Eskubide berriak",""],
  ["suffrage","Sufragio-eskubidea",""],
  ["socialist","Alderdi sozialistak sortu",""]
].map(([id,label,icon])=>({id,label,icon}));
const BY_ID=new Map(TRAITS.map(x=>[x.id,x]));
const $=sel=>document.querySelector(sel);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const url=new URLSearchParams(location.search);
let client,teamId=null,teacherPreview=false,teamSync=null,stopTeamSync=null,syncBanner=null;
let locked=new Set(),positions={},challengeLocked=new Set(),pending={},selected=null;
let challengePending={},busy=true,feedback="Taldearen datuak kargatzen…",warning=false,helpOpen=false;
let phase="classify",completed=false,dragging=null,suppressClick=false;
// Mantener cada concepto en su hueco: las demás cartelas no se desplazan al añadir la última.
const slotAssignments=new Map();
const stage=$("#bi-stage"),auth=$("#bi-auth-slots"),lib=$("#bi-lib-slots"),tray=$("#bi-concept-chips");
let note=null,hintBox=null,challengeBox=null;
const controls={help:$("#bi-help"),reset:$("#bi-reset"),check:$("#bi-check"),undo:null,continue:null};
let lastMove=null;
const canUndo=()=>!!lastMove&&!busy&&!completed&&(!teamSync||teamSync.ready)&&
  (!teamSync||teamSync.revision===lastMove.revision)&&
  (lastMove.kind==='card'?(!locked.has(lastMove.id)&&(roomOf(lastMove.id)??null)===lastMove.to):
    (!challengeLocked.has(lastMove.id)&&(challengePending[lastMove.id]??null)===lastMove.to));
function remember(kind,id,from,to){
 if(from!==to)lastMove={kind,id,from,to,revision:teamSync?.revision??null};
}
function undoLast(){
 if(!canUndo()){
   lastMove=null;announce('Taldearen egoera aldatu da. Azken aldaketa ezin da desegin.',true);paint();return;
 }
 const entry=lastMove;lastMove=null;
 if(entry.kind==='card'){move(entry.id,entry.from??'tray');return}
 if(teamSync){
   busy=true;paint();
   void teamSync.move(entry.id,entry.from,entry.to).finally(()=>{busy=false;paint()});
 }else{
   if(entry.from===null)delete challengePending[entry.id];
   else challengePending[entry.id]=entry.from;
   feedback='Azken hautaketa desegin da.';paint();
 }
}
const labels={auth:"Sistema autoritarioak",lib:"Erregimen liberalak"};
const roomOf=id=>positions[id]||pending[id]||null;
function syncStatus(message,problem=false){
  if(syncBanner){
    const kind=problem?'error':message===SAVE_TEXT.saving?'saving':message===SAVE_TEXT.saved?'saved':message===SAVE_TEXT.loading?'loading':'ready';
    paintSaveIndicator(syncBanner.querySelector('.bi-sync-message'),kind,message);
    syncBanner.classList.toggle('bi-sync-error',problem);
    syncBanner.querySelector('.bi-sync-retry').hidden=!!teamSync?.ready&&!problem;
  }
  if(problem)announce(message,true);
  // Tras conectar o reconectar, volver a habilitar los botones cuando
  // el borrador de equipo está disponible (no solo al mover una tarjeta).
  if(teamSync&&!busy)paint();
}
function applySharedDraft(data){
  pending=Object.fromEntries(Object.entries(data.placements||{})
    .filter(([id,zone])=>BY_ID.has(id)&&!locked.has(id)&&(zone==='auth'||zone==='lib')));
  challengePending=Object.fromEntries(Object.entries(data.cases||{})
    .filter(([id,zone])=>['case_monarch','case_rights'].includes(id)
      &&!challengeLocked.has(id)&&(zone==='auth'||zone==='lib')));
  paint();
}
const localDraftKey=()=>teamId&&!teacherPreview?'inperialismoa:bi-sistema:borrador:'+teamId:null;
function saveLocalDraft(){
 const key=localDraftKey();if(!key)return;
 try{
  const valid=Object.fromEntries(Object.entries(pending).filter(([id,z])=>BY_ID.has(id)&&!locked.has(id)&&(z==='auth'||z==='lib')));
  const cases=Object.fromEntries(Object.entries(challengePending).filter(([id,z])=>['case_monarch','case_rights'].includes(id)&&!challengeLocked.has(id)&&(z==='auth'||z==='lib')));
  if(Object.keys(valid).length||Object.keys(cases).length)
    localStorage.setItem(key,JSON.stringify({v:1,places:valid,cases}));
  else localStorage.removeItem(key);
 }catch(e){console.warn('Bigarren ariketako tokiko borradorra',e)}
}
function restoreLocalDraft(){
 const key=localDraftKey();if(!key)return;
 try{
  const stored=JSON.parse(localStorage.getItem(key)||'null');
  if(!stored||stored.v!==1)return;
  pending=Object.fromEntries(Object.entries(stored.places||{}).filter(([id,z])=>BY_ID.has(id)&&(z==='auth'||z==='lib')));
  challengePending=Object.fromEntries(Object.entries(stored.cases||{}).filter(([id,z])=>['case_monarch','case_rights'].includes(id)&&(z==='auth'||z==='lib')));
 }catch(e){console.warn('Tokiko borradorra ezin izan da berreskuratu',e)}
}
const count=()=>locked.size;
function safeButton(label,attrs=""){return '<button type="button" '+attrs+'>'+esc(label)+'</button>';}
function card(id,placed){
  const t=BY_ID.get(id);
  if(!t)return "";
  const fixed=locked.has(id),isSelected=selected===id;
  return '<button type="button" data-bi-card="'+id+'" draggable="'+(!fixed&&!busy)+'" aria-pressed="'+isSelected+'" '+
    (fixed?'disabled ':'')+
    'class="bi-card '+(placed?'bi-card-placed':'bi-card-tray')+(fixed?' bi-locked':'')+(isSelected?' bi-selected':'')+
    '" title="'+(fixed?'Kontzeptu zuzena, gordeta':'Sakatu edo arrastatu sailkatzeko')+'">'+
    '<span class="bi-card-icon" aria-hidden="true">'+ICONS[id]+'</span>'+
    '<span class="bi-card-word">'+esc(t.label)+'</span>'+
    (fixed?'<span class="bi-card-tick" aria-label="Zuzena">✓</span>':placed?'<span class="bi-card-grip" aria-hidden="true">↗</span>':'<span class="bi-card-grip" aria-hidden="true">⠿</span>')+
    '</button>';
}
function cardsFor(zone){
  const limit=zone==="auth"?3:4;
  const inRoom=TRAITS.filter(x=>roomOf(x.id)===zone);
  const slots=Array(limit).fill(null);
  // Primero conservar los huecos ya ocupados, sin reordenar las tarjetas anteriores.
  for(const item of inRoom){
    const saved=slotAssignments.get(item.id);
    if(saved?.zone===zone&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<limit&&!slots[saved.index])
      slots[saved.index]=item.id;
  }
  for(const item of inRoom){
    if(slots.includes(item.id))continue;
    const index=slots.indexOf(null);
    if(index<0)continue;
    slots[index]=item.id;
    slotAssignments.set(item.id,{zone,index});
  }
  // Las ranuras vacías tienen posición, pero ningún recuadro HTML visible.
  // El soporte de marfil ya está pintado en la fotografía del museo.
  return slots.map((id,index)=>id
    ?card(id,true)
    :'<div class="bi-card bi-card-empty" data-bi-slot="'+index+'" aria-hidden="true"></div>'
  ).join("");
}
function announce(message,isWarning=false){
  feedback=message;warning=isWarning;
  if(note){note.textContent=message;note.classList.toggle("bi-error",isWarning)}
}
function illuminate(){
  const checked=Object.keys(positions);
  stage.classList.toggle("bi-light-guards",locked.has("army"));
  stage.classList.toggle("bi-light-throne",locked.has("monarch"));
  stage.classList.toggle("bi-light-parliament",locked.has("separation"));
  stage.classList.toggle("bi-light-rights",locked.has("rights"));
  stage.classList.toggle("bi-all-correct",checked.length===7);
}
function paint(){
  const placed=TRAITS.filter(x=>roomOf(x.id));
  stage.dataset.state=placed.length?"live":"empty";
  stage.dataset.phase=phase;
  auth.innerHTML=cardsFor("auth");
  lib.innerHTML=cardsFor("lib");
  const bank=TRAITS.filter(x=>!roomOf(x.id));
  stage.dataset.trayCount=String(bank.length);
  tray.innerHTML=bank.length?bank.map(x=>card(x.id,false)).join(""):'<p class="bi-desk-complete">Kontzeptu guztiak kokatuta daude.</p>';
  $("#bi-progress").textContent=TRAITS.filter(t=>!!roomOf(t.id)).length+" / 7 kokatuta";
  note.textContent=feedback||"";
  note.classList.toggle("bi-error",warning);
  if(hintBox){
    hintBox.hidden=!helpOpen;
    hintBox.textContent="Erabilera: hautatu txartel bat eta sakatu aretoa, edo arrastatu txartela. Egin klik «Erantzunak egiaztatu» botoian kokapena egiaztatzeko.";
  }
  controls.check.disabled=busy||completed||(teamSync&&!teamSync.ready)||phase!=="classify"||
    TRAITS.some(t=>!locked.has(t.id)&&!pending[t.id]);
  controls.reset.disabled=busy||(teamSync&&!teamSync.ready)||(!Object.keys(pending).length&&!Object.keys(challengePending).length);
  if(controls.undo)controls.undo.disabled=!canUndo();
  // La acción principal cambia de fase, no se acumulan botones desactivados.
  controls.check.hidden=phase!=='classify';
  if(controls.continue)controls.continue.hidden=phase!=='challenge';
  controls.help.disabled=false;
  controls.check.querySelector("span").textContent=busy?"Egiaztatzen…":"Erantzunak egiaztatu";
  const selectedFlag=!!selected;
  for(const target of [auth,lib,tray]){
    target.classList.toggle("bi-select-target",selectedFlag);
    if(!target.hasAttribute("tabindex"))target.tabIndex=0;
    target.setAttribute("role","button");
  }
  illuminate();
  renderChallenge();
  saveLocalDraft();
}
// La selección no altera el contenido de las vitrinas ni desmonta botones.
function paintSelection(){
 for(const el of stage.querySelectorAll('[data-bi-card]')){
   const active=el.dataset.biCard===selected;
   el.classList.toggle('bi-selected',active);
   el.setAttribute('aria-pressed',String(active));
 }
 for(const target of [auth,lib,tray])target.classList.toggle('bi-select-target',!!selected);
}
function paintChallengeChoice(caseId){
 if(!challengeBox)return;
 for(const el of challengeBox.querySelectorAll('[data-case]')){
   if(el.dataset.case!==caseId)continue;
   const active=challengePending[caseId]===el.dataset.choice;
   el.classList.toggle('bi-chosen',active);
   el.setAttribute('aria-pressed',String(active));
 }
 const check=challengeBox.querySelector('#bi-check-cases');
 if(check)check.disabled=busy||(teamSync&&!teamSync.ready)
   ||CASES.some(c=>!challengeLocked.has(c.id)&&!challengePending[c.id]);
}
function move(id,target){
  if(!BY_ID.has(id)||locked.has(id)||busy||(teamSync&&!teamSync.ready))return;
  const expected=pending[id]??null;
  if(target==="tray")delete pending[id];
  else if(target==="auth"||target==="lib"){
    if(roomOf(id)===target){selected=null;paint();return;}
    const limit=target==="auth"?3:4;
    const current=TRAITS.filter(t=>t.id!==id&&roomOf(t.id)===target).length;
    if(current>=limit){
      announce("Areto honetan ez dago toki gehiagorik. Mugitu beste txartel bat mahaira edo beste aretora.",true);
      return;
    }
    pending[id]=target;
  } else return;
  selected=null;warning=false;feedback="";
  if(teamSync){
    busy=true;paint();
    void teamSync.move(id,target==="tray"?null:target,expected).then(ok=>{
      if(ok)remember('card',id,expected,target==='tray'?null:target);
      else lastMove=null;
    }).finally(()=>{busy=false;paint()});
  }else{remember('card',id,expected,target==='tray'?null:target);paint()}
}
function reset(){
  if(busy||(teamSync&&!teamSync.ready)||(!Object.keys(pending).length&&!Object.keys(challengePending).length))return;
  if(!teacherPreview&&!window.confirm(
    "Mahai honetako kokatu gabeko erantzunak ezabatuko dira; taldearen aurreko aurrerapena gordeta dago. Ziur zaudete?"
  ))return;
  lastMove=null;
  if(teamSync){
    busy=true;paint();
    void teamSync.reset().finally(()=>{busy=false;paint()});
    return;
  }
  pending={};selected=null;warning=false;
  feedback="Mahai honetako behin-behineko kartelak itzuli dira. Taldearen aurrerapena mantendu da.";
  paint();
}
function toggleHelp(){helpOpen=!helpOpen;paint()}
async function fetchState(){
  if(!teamId||teacherPreview)return;
  const {data,error}=await client.from("bi_sistema_team_state")
    .select("team_id,locked_ids,locked_positions,challenge_locked,completed_at")
    .eq("team_id",teamId).maybeSingle();
  if(error)throw error;
  if(!data)return;
  locked=new Set((data.locked_ids||[]).filter(id=>BY_ID.has(id)));
  positions={};
  for(const [id,zone] of Object.entries(data.locked_positions||{}))
    if(locked.has(id)&&(zone==="auth"||zone==="lib"))positions[id]=zone;
  for(const id of locked)delete pending[id];
  challengeLocked=new Set((data.challenge_locked||[]).filter(id=>["case_monarch","case_rights"].includes(id)));
  completed=!!data.completed_at;
  if(completed){phase="complete";markMission1NavCompleted(2);}
  else if(locked.size===7)phase="challenge";
  paint();
}
async function submit(answers,kind){
  if(busy||teacherPreview||completed)return;
  busy=true;warning=false;feedback="Erantzunak egiaztatzen…";paint();
  try{
    let data;
    if(teamSync){
      data=await teamSync.submit(kind);
      if(data.status==='conflict'){
        announce("Taldekide batek kokapen bat aldatu du. Berrikusi erantzunak.",true);
        await teamSync.load();return;
      }
    }else{
      const response=await client.rpc("submit_bi_sistema",{p_phase:kind,p_answers:answers});
      if(response.error)throw response.error;
      data=response.data;
    }
    if(!data||!Array.isArray(data.locked)||typeof data.phase_complete!=="boolean")
      throw new Error("Erantzun baliogabea");
    locked=new Set(data.locked.filter(id=>BY_ID.has(id)));
    positions={};
    for(const [id,z] of Object.entries(data.positions||{}))if(locked.has(id))positions[id]=z;
    for(const id of locked)delete pending[id];
    challengeLocked=new Set(data.challenge_locked||[]);
    // Erantzun globala: errorean ez da ezer ezabatzen edo finkatzen.
    // Fase osoa ondo dagoenean bakarrik gordetzen da multzo osoa.
    completed=!!data.completed;
    if(completed){
      lastMove=null;markMission1NavCompleted(2);
      phase="complete";
      announce("Bikain! Bi sistema politikoak ulertu dituzue. Hurrengo aretoa prest dago.");
    } else if(data.phase_complete&&locked.size===7){
      lastMove=null;phase="challenge";
      announce("Zazpi kontzeptuak kokatu dituzue! Orain bi egoerak aztertu.");
    } else if(!data.phase_complete){
      announce("Ez da zuzena. Berrikusi fase osoko erantzunak eta saiatu berriro.",true);
    } else {
      announce("Fasea gordeta dago. Jarraitu hurrengo erronkarekin.");
    }
    await fetchState().catch(()=>{});
  }catch(err){
    console.error("Bi sistema, bi Europa:",err);
    announce("Ezin izan da egiaztatu. Egiaztatu konexioa eta saiatu berriro.",true);
  }finally{
    busy=false;paint();
    if((phase==="challenge"||phase==="complete")&&window.matchMedia("(max-width: 980px), (orientation: portrait)").matches){
      challengeBox?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
    }
  }
}
async function checkCards(){
  if(teacherPreview){
    announce("Irakaslearen aurrebista: txartelak mugi eta aldatu ditzakezu. Ez da zuzenketarik egiten eta ez da daturik gordetzen.");
    return;
  }
  const answers=Object.fromEntries(Object.entries(pending).filter(([id,zone])=>!locked.has(id)&&BY_ID.has(id)&&["auth","lib"].includes(zone)));
  if(TRAITS.some(t=>!locked.has(t.id)&&!pending[t.id])){
    announce("Kokatu zazpi kontzeptuak egiaztatu aurretik.",true);return;
  }
  await submit(answers,"classify");
}
const CASES=[
  {id:"case_monarch",icon:"♛",text:"Monarkak parlamentua kontrolatzen du eta armadak botere handia du."},
  {id:"case_rights",icon:"⚖",text:"Botere-banaketa dago, eta herritarrek eskubide politikoak eta sufragio-eskubidea dituzte."}
];
function renderChallenge(){
  if(!challengeBox)return;
  const visible=phase==="challenge"||phase==="complete";
  challengeBox.hidden=!visible;
  if(!visible)return;
  if(completed){
    challengeBox.innerHTML='<div class="bi-challenge-panel bi-victory">'+
      '<span class="bi-victory-icon" aria-hidden="true">✦</span>'+
      '<p class="bi-challenge-kicker">MISIOA 1 · 2. ARIKETA GAINDITUTA</p>'+
      '<h2>Bi sistema politikoak identifikatu dituzue!</h2>'+
      '<p>Zazpi kontzeptuak eta bi egoera historikoak zuzen sailkatu dituzue.</p>'+
      '<a class="bi-challenge-next" href="./inperialismoaren-definizioa.html'+(teacherPreview?'?preview=1':'')+'">3. ariketa · Inperialismoaren definizioa →</a>'+
      '</div>';
    return;
  }
  challengeBox.innerHTML='<div class="bi-challenge-panel"><p class="bi-challenge-kicker">AZKEN ERRONKA · HISTORIA INTERPRETATU</p>'+
    '<h2>Bi egoera historiko</h2><p>Irakurri bi egoerak eta hautatu dagokien sistema. Emaitza ez da agertuko egiaztatu arte.</p><p class="bi-challenge-feedback" role="status">'+esc(feedback)+'</p>'+
    CASES.map(c=>{
      const fixed=challengeLocked.has(c.id);
      return '<section class="bi-case"><p><span aria-hidden="true">'+c.icon+'</span> '+esc(c.text)+'</p>'+
        '<div class="bi-case-choices">'+["auth","lib"].map(zone=>
          '<button type="button" data-case="'+c.id+'" data-choice="'+zone+'" '+
          (fixed||busy?'disabled ':'')+
          'aria-pressed="'+(challengePending[c.id]===zone)+'" class="'+(challengePending[c.id]===zone?'bi-chosen':'')+'">'+labels[zone]+'</button>').join("")+
          '</div>'+(fixed?'<span class="bi-case-locked">✓ Egiaztatuta</span>':'')+'</section>';
    }).join("")+
    '<div class="bi-challenge-actions"><button type="button" id="bi-check-cases" '+(busy||CASES.some(c=>!challengeLocked.has(c.id)&&!challengePending[c.id])?'disabled':'')+'>✓ Egoerak egiaztatu</button></div>'+
    '</div>';
}
async function checkCases(){
  if(teacherPreview){
    if(CASES.some(c=>!challengePending[c.id])){
      announce('Aukeratu bi erantzunak aurrebistan.',true);return;
    }
    // No comprobar soluciones ni enviar respuestas: simulación totalmente local.
    completed=true;phase='complete';lastMove=null;
    feedback='Irakaslearen simulazioa: ez da ezer gordetzen.';paint();return;
  }
  const answers=Object.fromEntries(Object.entries(challengePending)
    .filter(([id,zone])=>CASES.some(c=>c.id===id)&&!challengeLocked.has(id)&&["auth","lib"].includes(zone)));
  if(CASES.some(c=>!challengeLocked.has(c.id)&&!challengePending[c.id])){
    announce("Erantzun bi egoerak egiaztatu aurretik.",true);return;
  }
  await submit(answers,"interpret");
}
function initInteractions(){
  stage.addEventListener("click",e=>{
    if(suppressClick){suppressClick=false;return}
    const c=e.target.closest("[data-bi-card]");
    if(c){const id=c.dataset.biCard;if(!locked.has(id)&&!busy){selected=selected===id?null:id;paintSelection()}return}
    const zone=e.target.closest("[data-bi-target]");
    if(zone&&selected){move(selected,zone.dataset.biTarget);return}
    const answer=e.target.closest("[data-case][data-choice]");
    if(answer&&!busy&&(!teamSync||teamSync.ready)){
      const id=answer.dataset.case,zone=answer.dataset.choice;
      const expected=challengePending[id]??null;
      challengePending[id]=zone;saveLocalDraft();
      if(teamSync){
        busy=true;paint();
        void teamSync.move(id,zone,expected).then(ok=>{
          if(ok)remember('case',id,expected,zone);else lastMove=null;
        }).finally(()=>{busy=false;paint()});
      }else{remember('case',id,expected,zone);paintChallengeChoice(id)}
      return;
    }
    if(e.target.closest("#bi-check-cases"))void checkCases();
  });
  stage.addEventListener("keydown",e=>{
    const z=e.target.closest("[data-bi-target]");
    if(z&&selected&&(e.key==="Enter"||e.key===" ")){e.preventDefault();move(selected,z.dataset.biTarget)}
  });
  stage.addEventListener("dragstart",e=>{
    const card=e.target.closest("[data-bi-card]");
    if(!card||locked.has(card.dataset.biCard)||busy){e.preventDefault();return}
    e.dataTransfer.setData("text/plain",card.dataset.biCard);e.dataTransfer.effectAllowed="move";
  });
  stage.addEventListener("dragover",e=>{
    const target=e.target.closest("[data-bi-target]");
    if(target){e.preventDefault();e.dataTransfer.dropEffect="move";target.classList.add("bi-over")}
  });
  stage.addEventListener("dragleave",e=>{
    const target=e.target.closest("[data-bi-target]");
    if(target&&!target.contains(e.relatedTarget))target.classList.remove("bi-over");
  });
  stage.addEventListener("drop",e=>{
    const target=e.target.closest("[data-bi-target]");
    if(!target)return;e.preventDefault();target.classList.remove("bi-over");
    move(e.dataTransfer.getData("text/plain"),target.dataset.biTarget);
  });
  // Táctil: desplazamiento real con eventos pointer, más selección por pulsación.
  stage.addEventListener("pointerdown",e=>{
    const card=e.target.closest("[data-bi-card]");
    if(!card||locked.has(card.dataset.biCard)||busy||e.pointerType==="mouse")return;
    dragging={id:card.dataset.biCard,startX:e.clientX,startY:e.clientY,active:false,ghost:null};
  });
  stage.addEventListener("pointermove",e=>{
    if(!dragging)return;
    if(!dragging.active&&Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY)>12){
      dragging.active=true;
      const item=BY_ID.get(dragging.id);
      const ghost=document.createElement("div");ghost.className="bi-touch-ghost";
      ghost.textContent=item.label;document.body.append(ghost);dragging.ghost=ghost;
    }
    if(dragging.active&&dragging.ghost){
      e.preventDefault();dragging.ghost.style.left=e.clientX+"px";dragging.ghost.style.top=e.clientY+"px";
      stage.querySelectorAll(".bi-over").forEach(el=>el.classList.remove("bi-over"));
      document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-bi-target]")?.classList.add("bi-over");
    }
  },{passive:false});
  stage.addEventListener("pointerup",e=>{
    if(!dragging)return;
    const d=dragging;dragging=null;d.ghost?.remove();
    stage.querySelectorAll(".bi-over").forEach(el=>el.classList.remove("bi-over"));
    if(d.active){
      suppressClick=true;
      const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest("[data-bi-target]");
      if(zone)move(d.id,zone.dataset.biTarget);
      window.setTimeout(()=>{suppressClick=false},100);
    }
  });
  stage.addEventListener("pointercancel",()=>{dragging?.ghost?.remove();dragging=null});
  controls.help.addEventListener("click",toggleHelp);
  controls.reset.addEventListener("click",reset);
  controls.check.addEventListener("click",()=>void checkCards());
  $(".bi-back").addEventListener("click",e=>{
    e.preventDefault();location.assign("./index.html#mission1gallery");
  });
}
function setupStage(){
  for(const [el,zone] of [[auth,"auth"],[lib,"lib"],[tray,"tray"]]){
    el.dataset.biTarget=zone;
    el.tabIndex=0;
    el.setAttribute("aria-label",zone==="tray"?"Mahaira itzuli":labels[zone]+": jarri txartela hemen");
  }
  $(".bi-preview-toolbar")?.remove();
  $(".bi-preview-footnote")?.remove();
  $(".bi-instructions p").innerHTML="<strong>Jarraibidea:</strong> mugitu txartelak dagokien aretora. Ez duzu jakingo zuzenak diren <em>«Erantzunak egiaztatu» sakatu arte.</em>";
  const status=document.createElement("div");status.className="bi-live-status";status.id="bi-feedback";
  status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  stage.after(status);note=status;
  const hints=document.createElement("aside");hints.className="bi-hint";hints.id="bi-hint";hints.hidden=true;stage.append(hints);hintBox=hints;
  const overlay=document.createElement("section");overlay.className="bi-challenge-overlay";overlay.id="bi-challenge";overlay.setAttribute("aria-live","polite");overlay.hidden=true;stage.append(overlay);challengeBox=overlay;
  const progress=document.createElement("span");progress.className="bi-live-progress";progress.id="bi-progress";$(".bi-step").append(progress);
  const actions=$(".bi-footer-actions").querySelectorAll("button");
  [controls.help,controls.reset,controls.check]=actions;
  actions.forEach(b=>{b.disabled=false;b.removeAttribute("title")});
  actions[0].id="bi-help";actions[1].id="bi-reset";actions[2].id="bi-check";
  const undo=document.createElement('button');
  undo.type='button';undo.id='bi-undo';undo.textContent='↶ Desegin';
  undo.className=controls.reset.className;undo.title='Desegin azken mugimendua';
  undo.addEventListener('click',undoLast);
  controls.reset.before(undo);controls.undo=undo;
  const next=document.createElement('button');
  next.type='button';next.id='bi-continue-phase';
  next.textContent='2. fasea · Egoerak aztertu →';
  next.className=controls.check.className;next.hidden=true;
  next.addEventListener('click',()=>{
    if(phase!=='challenge')return;
    challengeBox?.scrollIntoView({
      block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
    });
    challengeBox?.querySelector('h2')?.focus({preventScroll:true});
  });
  controls.check.after(next);controls.continue=next;
  initInteractions();
  paint();
}
async function boot(){
  setupStage();
  if(!window.supabase||!SUPABASE_URL||!SUPABASE_ANON_KEY){
    announce("Ezin izan da saioa egiaztatu. Itzuli hasierara.",true);return;
  }
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  try{
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){location.replace("./index.html");return}
    const {data:profile,error:profileError}=await client.from("profiles").select("id,role,team_id").eq("id",user.id).single();
    if(profileError||!profile){location.replace("./index.html");return}
    teacherPreview=profile.role==="teacher"&&url.get("preview")==="1";
    if(profile.role==="teacher"&&!teacherPreview){location.replace("./index.html");return}
    if(profile.role!=="student"&&!teacherPreview){location.replace("./index.html");return}
    if(teacherPreview){
      stage.classList.add("bi-teacher-preview");busy=false;
      announce("Irakaslearen aurrebista: mugitu zazpi kontzeptuak. Ez da daturik gordetzen.");
      // La vista docente debe empezar vacía. Nunca inyectar soluciones de ejemplo.
      // Los alumnos recuperan únicamente los aciertos que realmente tenga guardados su equipo.
      locked=new Set();
      positions={};
      challengeLocked=new Set();
      pending={};
      challengePending={};
      completed=false;
      phase="classify";
      paint();
      const back=$(".bi-back");back.href="./index.html#teacherpreviewgallery";
      mountExerciseNav(2);
      addTeacherStageControls([
        ["Hasierako pantaila",()=>{locked=new Set();positions={};pending={};challengeLocked=new Set();completed=false;phase="classify";feedback="";paint()}],
        ["Azken erronka",()=>{locked=new Set(TRAITS.map(t=>t.id));positions={};pending={};challengeLocked=new Set();completed=false;phase="challenge";feedback="Irakaslearen aurrebista (simulatua).";paint()}],
        ["Amaierako pantaila",()=>{locked=new Set(TRAITS.map(t=>t.id));positions={};pending={};challengeLocked=new Set();completed=true;phase="complete";paint()}]
      ]);
      return;
    }
    if(!(await startClassAccess(client)))return;
    teamId=profile.team_id;
    if(!teamId){location.replace("./index.html");return}
    // Lehen ariketa benetan osatu behar da: lehengo misio-zigiluak
    // ez du bost joko berrien arteko urratsik saltatzeko baimenik ematen.
    const {data:first,error:firstError}=await client.from("gallery_team_state")
      .select("completed_at").eq("team_id",teamId).maybeSingle();
    if(firstError)throw firstError;
    if(!first?.completed_at){
      location.replace("./index.html#mission1gallery");return;
    }
    restoreLocalDraft();
    await fetchState();busy=false;paint();
    await mountStudentExerciseNav(2,client,teamId);
    syncBanner=document.createElement("div");
    syncBanner.className="bi-shared-banner";syncBanner.setAttribute("role","status");
    syncBanner.setAttribute("aria-live","polite");
    const message=document.createElement("span");message.className="bi-sync-message";
    paintSaveIndicator(message,"loading");
    const retry=document.createElement("button");retry.type="button";
    retry.className="bi-sync-retry";retry.textContent="↻ Berriro konektatu";
    retry.addEventListener("click",()=>void teamSync?.load());
    syncBanner.append(message,retry);stage.before(syncBanner);
    teamSync=createBiSistemaShared({
      client,teamId,userId:user.id,
      localDraft:{places:{...pending},cases:{...challengePending}},
      onDraft:applySharedDraft,
      onStatus:syncStatus,
      onRemote:()=>{if(!busy)void fetchState().catch(console.error)}
    });
    stopTeamSync=teamSync.start();
    window.addEventListener("pagehide",()=>stopTeamSync?.(),{once:true});
  }catch(err){
    console.error("Bi sistema:",err);
    announce("Ezin izan dira taldearen datuak kargatu. Berritu orria edo itzuli misiora.",true);
  }
}
boot();
