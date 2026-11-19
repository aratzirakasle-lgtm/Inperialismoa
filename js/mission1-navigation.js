/* Navegación privilegiada para profesorado autenticado.
 * No se renderiza para estudiantes y no modifica datos del equipo. */
const pages=[
 [1,"Potentzien galeria","./index.html#teacherpreviewgallery"],
 [2,"Bi sistema","./bi-sistema.html?preview=1"],
 [3,"Inperialismoaren definizioa","./inperialismoaren-definizioa.html?preview=1"],
 [4,"Inperioen aztarnak","./inperioen-aztarnak.html?preview=1"],
 [5,"Esaldiak osatu","./esaldiak-osatu.html?preview=1"]
];
function style(){
 if(document.getElementById("m1-navigation-style"))return;
 const el=document.createElement("style");el.id="m1-navigation-style";
 el.textContent=`
 .m1-nav{position:relative;z-index:90;box-sizing:border-box;width:100%;min-height:54px;padding:9px 13px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:14px;background:linear-gradient(100deg,#0a2721,#1c3a30 55%,#0a2721);border-bottom:1px solid #af8958;box-shadow:0 6px 20px #0004;color:#efdab3;font-family:Georgia,'Times New Roman',serif}
 .m1-nav *{box-sizing:border-box}.m1-nav-title{font:bold 12px/1.2 Georgia,'Times New Roman',serif;letter-spacing:.08em;white-space:nowrap}.m1-nav-links{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px}
 .m1-nav-links a{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:5px 9px;background:#e7c89009;color:#f1ddba!important;border:1px solid #d7b87946;border-radius:5px;text-decoration:none!important;font:600 12px/1.2 Georgia,'Times New Roman',serif;white-space:nowrap}
 .m1-nav-links a:hover,.m1-nav-links a:focus-visible{border-color:#e5c287;background:#e5c28724;outline-offset:2px}
 .m1-nav-links a[aria-current="page"]{border-color:#e6c388;background:#e8c48634;box-shadow:inset 0 0 0 1px #e0b96c55;color:#ffe8bd!important}
 .m1-nav-num{flex:none;width:22px;height:22px;display:grid;place-items:center;border:1px solid #deb8798c;border-radius:50%;font-weight:700}
 .m1-stage-tools{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#163429;color:#f0d9ab;font:600 12px/1.4 Georgia,'Times New Roman',serif;border-bottom:1px solid #9c784c}
 .m1-stage-tools button{cursor:pointer;background:#153327;border:1px solid #a68350;border-radius:4px;padding:5px 10px;color:#f5dfb7;font:inherit}
 .m1-stage-tools button:hover,.m1-stage-tools button:focus-visible{background:#38513a;outline:2px solid #c9a76d;outline-offset:1px}
 .m1-teacher-label{font-style:italic;color:#e7ce9d;white-space:nowrap}
 @media(max-width:750px){.m1-nav{gap:7px;padding:8px}.m1-nav-title{font-size:11px}.m1-nav-links a{padding:5px 7px}.m1-nav-links a .m1-nav-label{display:none}.m1-nav-num{width:27px;height:27px}}
 `;document.head.append(el);
}
export function exerciseNavMarkup(active){
 style();
 const items=pages.map(([id,label,href])=>`<a href="${href}" title="${id}. ariketa · ${label}" ${id===active?'aria-current="page"':''}><span class="m1-nav-num" aria-hidden="true">${id}</span><span class="m1-nav-label">${label}</span></a>`).join("");
 return `<nav class="m1-nav" aria-label="Irakaslearen ariketa-nabigazioa"><span class="m1-nav-title">IRAKASLEAREN AURREBISTA · 1. MISIOA</span><div class="m1-nav-links">${items}</div><div class="m1-nav-links"><a href="./index.html?teacherpanel=1" title="Irakaslearen panela">← Panelera</a></div></nav>`;
}
export function mountExerciseNav(active){
 const holder=document.createElement("div");holder.innerHTML=exerciseNavMarkup(active);
 const nav=holder.firstElementChild;document.body.prepend(nav);return nav;
}
export function addTeacherStageControls(stages){
 const nav=document.querySelector(".m1-nav");if(!nav)return;
 nav.nextElementSibling?.classList.contains("m1-stage-tools")&&nav.nextElementSibling.remove();
 const bar=document.createElement("div");bar.className="m1-stage-tools";
 const title=document.createElement("span");title.className="m1-teacher-label";title.textContent="Pantailak ikusi (ez da gordetzen):";
 bar.append(title);
 for(const [label,callback] of stages){const button=document.createElement("button");button.type="button";button.textContent=label;button.addEventListener("click",callback);bar.append(button);}
 nav.after(bar);
}
