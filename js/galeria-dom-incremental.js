/* Galeria: actualización parcial de cartelas sin reconstruir las vitrinas.
   Nunca recibe claves correctas ni decide destinos; solo refleja el estado. */
export function createGalleryIncremental(root,{items,state,tile,count,shared,allow,canSkip}){
 const regions=[['eu_auth',4],['eu_liberal',5],['ru',4],['us',4],['jp',3]];
 const signatures=new Map();
 let traySignature='',modeRendered=null;
 const cardsIn=key=>items.filter(x=>state.placements[x.id]===key);
 const currentMode=()=>allow()
   ?[Boolean(state.help),Boolean(state.completed),Boolean(canSkip)].join('|'):null;
 function rememberFull(){
   modeRendered=currentMode();
   signatures.clear();
   for(const [key] of regions)signatures.set(key,cardsIn(key).map(x=>x.id).join('|'));
   traySignature=items.filter(x=>!state.placements[x.id]).map(x=>x.id).join('|');
 }
 function tryUpdate(){
   const mode=currentMode();
   if(mode===null||modeRendered!==mode||!root.querySelector||!root.querySelectorAll)return false;
   const zones=regions.map(([id])=>root.querySelector('[data-gallery-zone="'+id+'"]'));
   const trayGrid=root.querySelector('.gal-tray .gal-tile-grid');
   const remaining=root.querySelector('.gal-tray h2 small');
   const progress=root.querySelector('.gal-progress-chips > span');
   const status=root.querySelector('.gal-status');
   const check=root.querySelector('[data-gallery-action="check"]');
   const reset=root.querySelector('[data-gallery-action="reset"]');
   const team=shared();
   const banner=team?root.querySelector('.gal-shared-banner'):null;
   if(zones.some(z=>!z||!z.querySelector('.gal-zone-list')||!z.querySelector('.gal-zone-heading small'))
     ||!trayGrid||!remaining||!progress||!status||!check||!reset||(team&&!banner))return false;

   for(let i=0;i<regions.length;i++){
     const [key,capacity]=regions[i],zone=zones[i],members=cardsIn(key);
     const signature=members.map(x=>x.id).join('|');
     if(signatures.get(key)!==signature){
       zone.querySelector('.gal-zone-list').innerHTML=members.length
         ?members.map(item=>tile(item,true)).join('')
         :'<span class="gal-zone-placeholder">↓ Arrastatu hona</span>';
       zone.querySelector('.gal-zone-heading small').textContent=members.length+' / '+capacity;
       signatures.set(key,signature);
     }
     zone.classList.toggle('gal-zone-selectable',Boolean(state.selected));
   }
   const missing=items.filter(x=>!state.placements[x.id]);
   const nextSignature=missing.map(x=>x.id).join('|');
   if(traySignature!==nextSignature){
     trayGrid.innerHTML=missing.length?missing.map(item=>tile(item)).join('')
       :'<span class="gal-all-placed">Kontzeptu guztiak kokatu dituzue. Egiaztatu!</span>';
     traySignature=nextSignature;
     remaining.textContent=missing.length+' falta dira';
   }
   // Selección, cambios de red y guardado: actualizar atributos, no ilustraciones.
   for(const card of root.querySelectorAll('[data-gallery-card]')){
     const id=card.dataset.galleryCard;
     const selected=state.selected===id;
     card.classList.toggle('gal-selected',selected);
     card.setAttribute('aria-pressed',String(selected));
     card.draggable=!state.locked.has(id)&&!state.busy;
   }
   progress.textContent=count()+' / '+items.length+' kokatuta';
   status.textContent=state.completed?'Zorionak! Kontzeptu guztiak zuzen kokatu dituzue.'
     :state.feedback||(state.selected
       ?'Txartela hautatuta. Aukeratu erakusleihoa edo itzuli mahaira. Esc: ezeztatu.'
       :'Sakatu kontzeptu bat eta dagokion erakusleihoa, edo arrastatu txartela.');
   check.disabled=state.busy||state.completed||(team&&!team.ready)||count()!==items.length;
   check.textContent=state.busy?'Egiaztatzen…':'✓ Erantzunak egiaztatu';
   reset.disabled=state.busy;
   if(team){
     const syncText=banner.querySelector('span:not(.gal-shared-dot)');
     if(syncText)syncText.textContent=state.busy?'Aldaketa gordetzen…'
       :team.ready?'Sinkronizatuta · '+count()+' / 20 kartela'
       :'Konexioa eten da. Tokiko kopia gordeta dago.';
     const oldRetry=banner.querySelector('[data-gallery-action="sync-retry"]');
     if(!team.ready&&!state.busy&&!oldRetry){
       const button=document.createElement('button');
       button.type='button';button.className='gal-shared-retry';
       button.dataset.galleryAction='sync-retry';
       button.textContent='↻ Berriro konektatu';
       banner.append(button);
     }else if((team.ready||state.busy)&&oldRetry)oldRetry.remove();
   }
   return true;
 }
 return {tryUpdate,rememberFull};
}
