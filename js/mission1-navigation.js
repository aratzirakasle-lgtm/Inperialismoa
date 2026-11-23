/* Recorrido de museo de la primera misión. Navegación docente libre;
 * alumnado con estado real del equipo y enlaces restringidos. Solo lectura. */
const pages=[
 [1,"Potentzien galeria","./index.html#mission1gallery","./index.html#teacherpreviewgallery"],
 [2,"Bi sistema, bi Europa","./bi-sistema.html","./bi-sistema.html?preview=1"],
 [3,"Inperialismoaren definizioa","./inperialismoaren-definizioa.html","./inperialismoaren-definizioa.html?preview=1"],
 [4,"Inperioen aztarnak","./inperioen-aztarnak.html","./inperioen-aztarnak.html?preview=1"],
 [5,"Esaldiak osatu","./esaldiak-osatu.html","./esaldiak-osatu.html?preview=1"]
];
function style(){
 if(document.getElementById("m1-navigation-style"))return;
 const el=document.createElement("style");el.id="m1-navigation-style";
 el.textContent=`
 .m1-nav{position:relative;z-index:90;box-sizing:border-box;width:100%;padding:11px 24px 13px;color:#f6dfb3;isolation:isolate;font-family:Georgia,'Times New Roman',serif;text-align:center;
   background:radial-gradient(ellipse at 50% 15%,#364a32aa,transparent 75%),linear-gradient(180deg,#261609 0%,#5a3216 4%,#140f0a 7%,#103126 16%,#10281f 89%,#3d2514 93%,#78451c 96%,#261509 100%);
   border-top:3px ridge #a16d38;border-bottom:5px ridge #9b6936;box-shadow:0 10px 22px #0008,inset 0 1px #e7bd6c88,inset 0 -2px #dc9b4d77}
 .m1-nav *{box-sizing:border-box}
 .m1-nav-title{display:inline-block;position:relative;margin:0 0 9px;padding:3px 19px;border:1px solid #ae7c48;border-radius:2px;
   color:#f6dfad;background:linear-gradient(180deg,#50301a,#241710 53%,#3c2719);box-shadow:0 2px 5px #000a,inset 0 1px #c9965b55;
   font:bold 12px/1.45 Georgia,'Times New Roman',serif;letter-spacing:.19em;text-shadow:0 1px #000}
 .m1-nav-links{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:start;gap:6px;width:min(100%,1420px);margin:0 auto;isolation:isolate}
 .m1-nav-links::before{content:'';position:absolute;z-index:-1;top:28px;left:9%;right:9%;height:5px;
   border-top:1px solid #f7db99;background:linear-gradient(180deg,#6a3818,#b68c45 30%,#f5d78f 48%,#986327 76%,#5a3217);
   box-shadow:0 1px 4px #000b,0 0 6px #e0aa5455}
 .m1-route-stop{display:flex;min-width:0;align-items:center;flex-direction:column;gap:7px;position:relative;z-index:1;
   padding:0 3px 3px;outline-offset:3px;text-decoration:none!important;color:inherit!important;border:0;background:transparent;cursor:pointer}
 .m1-route-stop:hover .m1-nav-num,.m1-route-stop:focus-visible .m1-nav-num{box-shadow:0 0 0 3px #f3c77588,0 0 20px #ffd78d88,0 2px 8px #000b}
 .m1-route-stop:focus-visible{outline:2px solid #f7db9e;border-radius:4px}
 .m1-nav-num{position:relative;width:59px;height:59px;flex:none;display:grid;place-items:center;color:#f9deb1;
   border:4px ridge #c59d58;border-radius:50%;background:radial-gradient(circle at 32% 24%,#59705a,#224436 58%,#142b24 100%);
   box-shadow:inset 0 1px 4px #fff2b139,inset 0 -5px 8px #0009,0 2px 7px #000b;
   font:700 32px/1 Georgia,serif;text-shadow:0 2px 2px #000b;transition:box-shadow .16s}
 .m1-nav-num::before{content:'';position:absolute;inset:4px;border:1px solid #e7c9849c;border-radius:50%;pointer-events:none}
 .m1-route-seal{position:absolute;z-index:2;right:-6px;bottom:-6px;width:24px;height:24px;border:2px solid #dfc07e;border-radius:50%;display:grid;place-items:center;
   color:#f6eac5;background:linear-gradient(150deg,#437650,#24462e);font:bold 16px Georgia,serif;box-shadow:0 2px 6px #000a}
 .m1-nav-label{display:flex;align-items:center;justify-content:center;width:100%;max-width:265px;min-height:43px;padding:6px 9px;
   border:2px ridge #b49254;border-radius:3px;background:linear-gradient(130deg,#f1d9a8,#ddbc80 65%,#b9945b);color:#352315;
   box-shadow:inset 0 1px #ffedc4,0 2px 5px #0009;font:700 clamp(11px,1.09vw,16px)/1.13 Georgia,'Times New Roman',serif;text-align:center;text-wrap:balance}
 .m1-route-stop.is-current .m1-nav-num{background:radial-gradient(circle at 32% 25%,#b85846,#692822 70%,#3e1614);
   border-color:#ffe5a2;color:#fff0be;box-shadow:0 0 0 3px #d5a3458a,0 0 23px #f9c867b0,inset 0 2px 7px #ffd49f72,0 3px 9px #000a}
 .m1-route-stop.is-current .m1-nav-label{border-color:#fbe0a0;background:linear-gradient(135deg,#fff0be,#e8c688 65%,#d6a75e);box-shadow:0 0 15px #f0b95385,inset 0 1px #fff6d5}
 .m1-route-stop.is-locked{cursor:not-allowed;opacity:.52}
 .m1-route-stop.is-locked .m1-nav-num{background:radial-gradient(circle at 28% 20%,#56514a,#292927 78%);border-color:#897b64;color:#cbbca2}
 .m1-route-stop.is-locked .m1-nav-label{filter:saturate(.52)}
 .m1-route-lock{position:absolute;z-index:2;right:-8px;bottom:-7px;font:15px/1 Georgia,serif;background:#3c3028;border:1px solid #ad9775;padding:4px;border-radius:50%}
 .m1-route-return{display:inline-block;margin-top:9px;padding:5px 12px;border:1px solid #aa8651;border-radius:3px;background:#1e2b20;color:#ead2a9!important;
   text-decoration:none!important;font:bold 12px/1.4 Georgia,'Times New Roman',serif}
 .m1-route-return:hover,.m1-route-return:focus-visible{background:#3b3f26;border-color:#efc47d;outline-offset:2px}
 .m1-stage-tools{display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;padding:7px 12px;
   background:linear-gradient(180deg,#382519,#1e2118 52%,#422b18);color:#ecd7ac;font:600 12px/1.4 Georgia,'Times New Roman',serif;border-bottom:2px ridge #a77842}
 .m1-stage-tools button{cursor:pointer;background:linear-gradient(#665031,#302c20);border:1px solid #c5a06c;border-radius:4px;padding:6px 11px;color:#f5e0bb;font:inherit}
 .m1-stage-tools button:hover,.m1-stage-tools button:focus-visible{background:#6c5533;outline:2px solid #dabc82;outline-offset:1px}
 .m1-teacher-label{font-style:italic;color:#ead5ad;white-space:nowrap}
 @media(min-width:1700px){.m1-nav{padding-top:14px;padding-bottom:16px}.m1-nav-num{width:65px;height:65px;font-size:36px}.m1-nav-links::before{top:31px}}
 @media(max-width:750px){.m1-nav{padding:8px 6px 10px}.m1-nav-title{margin-bottom:9px;padding:2px 6px;font-size:9px;letter-spacing:.07em}
  .m1-nav-links{gap:3px}.m1-nav-links::before{top:17px;height:3px}.m1-nav-num{width:37px;height:37px;font-size:22px;border-width:3px}
  .m1-nav-num::before{inset:2px}.m1-route-seal{width:17px;height:17px;font-size:12px;right:-3px;bottom:-3px}
  .m1-route-lock{font-size:11px;padding:2px;right:-4px;bottom:-4px}.m1-nav-label{min-height:36px;padding:4px 2px;font-size:9px}
  .m1-route-stop{gap:5px;padding:0}.m1-route-return{font-size:11px}}
 @media(prefers-reduced-motion:reduce){.m1-nav-num{transition:none}}
 `;
 document.head.append(el);
}
function navSteps(active,completedSteps){
 const done=new Set(Array.from(completedSteps||[]).map(Number).filter(n=>n>=1&&n<=5));
 // La sala siguiente se abre solo tras superar la anterior; los accesos
 // conservan la comprobación propia del servidor aunque se fuerce la URL.
 const unlocked=new Set([1]);
 for(let n=2;n<=5;n++)if(done.has(n-1))unlocked.add(n);
 return {done,unlocked};
}
export function exerciseNavMarkup(active,{teacher=true,completedSteps=[]}={}){
 style();
 const {done,unlocked}=navSteps(active,completedSteps);
 const items=pages.map(([id,label,studentHref,teacherHref])=>{
   const current=id===active;
   const locked=!teacher&&!unlocked.has(id);
   const complete=done.has(id);
   const state=current?' is-current':complete?' is-done':locked?' is-locked':'';
   const start=locked
     ?'<span class="m1-route-stop'+state+'" data-m1-step="'+id+'" aria-disabled="true" title="'+id+'. ariketa · Blokeatuta">'
     :'<a class="m1-route-stop'+state+'" data-m1-step="'+id+'" href="'+(teacher?teacherHref:studentHref)+'"'+(current?' aria-current="page"':'')+' title="'+id+'. ariketa · '+label+'">';
   const seal=!teacher&&complete?'<small class="m1-route-seal" aria-label="Gaindituta">✓</small>':'';
   const lock=locked?'<small class="m1-route-lock" aria-label="Blokeatuta">⌑</small>':'';
   return start+'<span class="m1-nav-num" aria-hidden="true">'+id+seal+lock+'</span><span class="m1-nav-label">'+label+'</span>'+(locked?'</span>':'</a>');
 }).join("");
 const title=teacher?'IRAKASLEAREN AURREBISTA · 1. MISIOA':'1. MISIOA · MUSEOKO IBILBIDEA';
 const back=teacher?'./index.html?teacherpanel=1':'./index.html';
 const backLabel=teacher?'← Irakaslearen panelera':'← Misiora itzuli';
 return '<nav class="m1-nav m1-museum-route" data-m1-role="'+(teacher?'teacher':'student')+'" aria-label="Lehen misioko bost aretoen ibilbidea"><span class="m1-nav-title">'+title+'</span><div class="m1-nav-links">'+items+'</div><a class="m1-route-return" href="'+back+'">'+backLabel+'</a></nav>';
}
export function mountExerciseNav(active,options){
 const holder=document.createElement("div");holder.innerHTML=exerciseNavMarkup(active,options);
 const nav=holder.firstElementChild;
 document.querySelector('.m1-nav')?.remove();
 document.body.prepend(nav);
 return nav;
}
// Toda lectura es select de las tablas permitidas al alumno; no se consulta
// la tabla privada mission_completions ni se alteran progresos.
export async function loadMission1Completed(client,team){
 if(!client||!team)return [];
 const queries=[
   client.from('gallery_team_state').select('completed_at').eq('team_id',team).maybeSingle(),
   client.from('bi_sistema_team_state').select('completed_at').eq('team_id',team).maybeSingle(),
   client.from('mission1_exercise_completions').select('exercise').eq('team_id',team),
   client.from('empire_dossier_team_state').select('completed_at').eq('team_id',team).maybeSingle()
 ];
 const results=await Promise.all(queries);
 for(const result of results)if(result.error)throw result.error;
 const complete=[];
 if(results[0].data?.completed_at)complete.push(1);
 if(results[1].data?.completed_at)complete.push(2);
 for(const r of results[2].data||[])if(r.exercise===3||r.exercise===5)complete.push(r.exercise);
 if(results[3].data?.completed_at)complete.push(4);
 return complete;
}
export async function mountStudentExerciseNav(active,client,team){
 try{
   const complete=await loadMission1Completed(client,team);
   const nav=mountExerciseNav(active,{teacher:false,completedSteps:complete});
   return nav;
 }catch(err){
   console.warn('Misioko ibilbidea ezin izan da kargatu',err);
   // Falla cerrado: solo queda disponible la sala actual; los demás enlaces
   // no se inventan a partir de una marca histórica.
   return mountExerciseNav(active,{teacher:false,completedSteps:Array.from({length:active-1},(_,i)=>i+1)});
 }
}
export function markMission1NavCompleted(step){
 const nav=document.querySelector('.m1-nav[data-m1-role="student"]');
 if(!nav)return;
 const done=[...nav.querySelectorAll('.m1-route-stop.is-done')].map(x=>Number(x.dataset.m1Step));
 done.push(step);
 const holder=document.createElement('div');
 holder.innerHTML=exerciseNavMarkup(step,{teacher:false,completedSteps:done});
 nav.replaceWith(holder.firstElementChild);
}
export function addTeacherStageControls(stages){
 const nav=document.querySelector('.m1-nav[data-m1-role="teacher"]');if(!nav)return;
 nav.nextElementSibling?.classList.contains("m1-stage-tools")&&nav.nextElementSibling.remove();
 const bar=document.createElement("div");bar.className="m1-stage-tools";
 const title=document.createElement("span");title.className="m1-teacher-label";title.textContent="Pantailak ikusi (ez da gordetzen):";
 bar.append(title);
 for(const [label,callback] of stages){
   const button=document.createElement("button");button.type="button";button.textContent=label;
   button.addEventListener("click",callback);bar.append(button);
 }
 nav.after(bar);
}
