/* Bi sistema, bi Europa · fase 2. El servidor guarda las soluciones y las comprobaciones. */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { ICONS } from "./bi-sistema-iconos.js?v=1";

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
let client,teamId=null,teacherPreview=false;
let locked=new Set(),positions={},challengeLocked=new Set(),pending={},selected=null;
let challengePending={},busy=true,feedback="Taldearen datuak kargatzen…",warning=false,hintLevel=0;
let phase="classify",completed=false,dragging=null,suppressClick=false;
// Mantener cada concepto en su hueco: las demás cartelas no se desplazan al añadir la última.
const slotAssignments=new Map();
const stage=$("#bi-stage"),auth=$("#bi-auth-slots"),lib=$("#bi-lib-slots"),tray=$("#bi-concept-chips");
let note=null,hintBox=null,challengeBox=null;
const controls={help:$("#bi-help"),reset:$("#bi-reset"),check:$("#bi-check")};
const labels={auth:"Sistema autoritarioak",lib:"Erregimen liberalak"};
const roomOf=id=>positions[id]||pending[id]||null;
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
  $("#bi-progress").textContent=locked.size+" / 7 zuzen";
  note.textContent=feedback||"Hautatu kontzeptua eta ondoren aretoa; edo arrastatu txartela.";
  note.classList.toggle("bi-error",warning);
  if(hintBox){
    hintBox.hidden=!hintLevel;
    hintBox.textContent=hintLevel===1?
      "Pista: nork kontrolatzen du parlamentua? Eta zer esan nahi du botere-banaketa izateak?":
      "Beste pista bat: monarkaren agintea eta armadaren pisua aztertu; beste sisteman, askatasun politikoen zabaltzeari begiratu.";
  }
  controls.check.disabled=busy||completed||phase!=="classify"||
    !TRAITS.some(t=>pending[t.id]);
  controls.reset.disabled=busy||!Object.keys(pending).length;
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
}
function move(id,target){
  if(!BY_ID.has(id)||locked.has(id)||busy)return;
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
  paint();
}
function reset(){if(busy)return;pending={};selected=null;warning=false;feedback="Gorde gabeko txartelak mahaira itzuli dira. Zuzenak mantendu dira.";paint()}
function hint(){hintLevel=hintLevel===2?0:hintLevel+1;paint()}
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
  if(completed)phase="complete";else if(locked.size===7)phase="challenge";
  paint();
}
async function submit(answers,kind){
  if(busy||teacherPreview||completed)return;
  busy=true;warning=false;feedback="Erantzunak egiaztatzen…";paint();
  try{
    const {data,error}=await client.rpc("submit_bi_sistema",{p_phase:kind,p_answers:answers});
    if(error)throw error;
    if(!data||!Array.isArray(data.locked))throw new Error("Erantzun baliogabea");
    locked=new Set(data.locked.filter(id=>BY_ID.has(id)));
    positions={};
    for(const [id,z] of Object.entries(data.positions||{}))if(locked.has(id))positions[id]=z;
    for(const id of locked)delete pending[id];
    challengeLocked=new Set(data.challenge_locked||[]);
    const wrong=data.incorrect||[];
    for(const id of wrong)if(kind==="classify")delete pending[id];
    if(kind==="interpret")for(const id of wrong)delete challengePending[id];
    completed=!!data.completed;
    if(completed){
      phase="complete";
      announce("Bikain! Bi sistema politikoak ulertu dituzue. Hurrengo aretoa prest dago.");
    } else if(locked.size===7){
      phase="challenge";
      announce(wrong.length?"Berrikusi azken egoerak eta saiatu berriro.":"Zazpi kontzeptuak zuzen! Orain azken erronka.",wrong.length>0);
    } else {
      announce(wrong.length?
        locked.size+" / 7 zuzen. "+wrong.length+" kontzeptu berrikusi eta berriz kokatu. Saiakera: "+data.attempt_count+".":
        locked.size+" / 7 zuzen. Jarri gainerako kontzeptuak.",wrong.length>0);
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
  if(!Object.keys(answers).length){announce("Kokatu txartel bat gutxienez lehenik.",true);return}
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
      '<a class="bi-challenge-next" href="./index.html#mission1questions">Hurrengo aretora →</a>'+
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
          (fixed||busy||teacherPreview?'disabled ':'')+
          'aria-pressed="'+(challengePending[c.id]===zone)+'" class="'+(challengePending[c.id]===zone?'bi-chosen':'')+'">'+labels[zone]+'</button>').join("")+
          '</div>'+(fixed?'<span class="bi-case-locked">✓ Egiaztatuta</span>':'')+'</section>';
    }).join("")+
    '<div class="bi-challenge-actions"><button type="button" id="bi-check-cases" '+(busy||teacherPreview||!CASES.some(c=>challengePending[c.id]&&!challengeLocked.has(c.id))?'disabled':'')+'>✓ Egoerak egiaztatu</button></div>'+
    '</div>';
}
async function checkCases(){
  const answers=Object.fromEntries(Object.entries(challengePending)
    .filter(([id,zone])=>CASES.some(c=>c.id===id)&&!challengeLocked.has(id)&&["auth","lib"].includes(zone)));
  if(!Object.keys(answers).length)return;
  await submit(answers,"interpret");
}
function initInteractions(){
  stage.addEventListener("click",e=>{
    if(suppressClick){suppressClick=false;return}
    const c=e.target.closest("[data-bi-card]");
    if(c){const id=c.dataset.biCard;if(!locked.has(id)&&!busy){selected=selected===id?null:id;paint()}return}
    const zone=e.target.closest("[data-bi-target]");
    if(zone&&selected){move(selected,zone.dataset.biTarget);return}
    const answer=e.target.closest("[data-case][data-choice]");
    if(answer&&!teacherPreview&&!busy){
      challengePending[answer.dataset.case]=answer.dataset.choice;renderChallenge();return;
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
  controls.help.addEventListener("click",hint);
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
  stage.append(status);note=status;
  const hints=document.createElement("aside");hints.className="bi-hint";hints.id="bi-hint";hints.hidden=true;stage.append(hints);hintBox=hints;
  const overlay=document.createElement("section");overlay.className="bi-challenge-overlay";overlay.id="bi-challenge";overlay.setAttribute("aria-live","polite");overlay.hidden=true;stage.append(overlay);challengeBox=overlay;
  const progress=document.createElement("span");progress.className="bi-live-progress";progress.id="bi-progress";$(".bi-step").append(progress);
  const actions=$(".bi-footer-actions").querySelectorAll("button");
  [controls.help,controls.reset,controls.check]=actions;
  actions.forEach(b=>{b.disabled=false;b.removeAttribute("title")});
  actions[0].id="bi-help";actions[1].id="bi-reset";actions[2].id="bi-check";
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
      const back=$(".bi-back");back.href="./index.html";
      return;
    }
    teamId=profile.team_id;
    if(!teamId){location.replace("./index.html");return}
    const [{data:g,error:ge},{data:legacy,error:le}]=await Promise.all([
      client.from("gallery_team_state").select("completed_at").eq("team_id",teamId).maybeSingle(),
      client.from("mission_badges").select("mission_id").eq("team_id",teamId).eq("mission_id",1).limit(1)
    ]);
    // Si la consulta de insignias no está autorizada, basta la galería.
    if(ge||(!g?.completed_at&&le)){throw ge||le}
    if(!g?.completed_at&&!legacy?.length){
      location.replace("./index.html#mission1gallery");return;
    }
    await fetchState();busy=false;paint();
    window.addEventListener("focus",()=>void fetchState().catch(()=>{}));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)void fetchState().catch(()=>{})});
    client.channel("bi-sistema-team-"+teamId)
      .on("postgres_changes",{event:"*",schema:"public",table:"bi_sistema_team_state",filter:"team_id=eq."+teamId},
        ()=>void fetchState().catch(()=>{})).subscribe();
  }catch(err){
    console.error("Bi sistema:",err);
    announce("Ezin izan dira taldearen datuak kargatu. Berritu orria edo itzuli misiora.",true);
  }
}
boot();
