/* Vista panorámica móvil de las salas 3 y 5: sin cambiar escala,
   composición de época, zonas de arrastre ni progreso de Supabase. */
const viewport=document.querySelector('.stage-wrap, .viewport');
if(viewport){
  const bar=document.createElement('nav');
  bar.className='m1-mobile-panorama';
  bar.hidden=true;
  bar.setAttribute('aria-label','Museoko eszena zabala arakatu');
  const info=document.createElement('span');
  info.className='m1-mobile-panorama-info';
  info.textContent='Eszena panoramikoa · mugitu alboetara gela osoa ikusteko';
  const actions=document.createElement('div');
  actions.className='m1-mobile-panorama-actions';
  const make=(text,label,action)=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent=text;
    btn.setAttribute('aria-label',label);
    btn.addEventListener('click',action);
    actions.append(btn);
    return btn;
  };
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const to=left=>viewport.scrollTo({left,behavior:reduced()?'instant':'smooth'});
  const left=make('← Ezkerra','Panoramaren ezkerraldea ikusi',()=>to(Math.max(0,viewport.scrollLeft-viewport.clientWidth*.85)));
  const middle=make('Erdia','Panoramaren erdialdea ikusi',()=>to((viewport.scrollWidth-viewport.clientWidth)/2));
  const right=make('Eskuina →','Panoramaren eskuinaldea ikusi',()=>to(viewport.scrollLeft+viewport.clientWidth*.85));
  bar.append(info,actions);
  viewport.before(bar);
  let initialized=false,scheduled=false;
  const update=()=>{
    scheduled=false;
    const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
    const visible=max>30&&window.innerWidth<=1100;
    bar.hidden=!visible;
    if(!visible)return;
    left.disabled=viewport.scrollLeft<=2;
    right.disabled=viewport.scrollLeft>=max-2;
    middle.disabled=Math.abs(viewport.scrollLeft-max/2)<2;
  };
  const schedule=()=>{
    if(!scheduled){scheduled=true;requestAnimationFrame(update)}
  };
  const adjust=()=>{
    const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
    if(max>30&&window.innerWidth<=1100&&!initialized){
      initialized=true;
      // La mesa y los huecos del juego quedan en el centro al abrir.
      viewport.scrollLeft=Math.round(max/2);
    }
    schedule();
  };
  viewport.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',adjust,{passive:true});
  requestAnimationFrame(adjust);
}
