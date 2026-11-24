/* Estados de sincronización: no contienen resultados ni pistas. */
export const SAVE_TEXT=Object.freeze({
 saving:'Aldaketak gordetzen…',
 saved:'✓ Taldearen lana gordeta.',
 ready:'Taldearen lana sinkronizatuta.',
 loading:'Taldearen lana sinkronizatzen…',
 error:'Konexio-arazoa. Egiaztatu konexioa.',
 pending:'Konexio-arazoa. Gorde gabeko aldaketa dago.'
});
export function gallerySaveState({busy,ready,connecting,pending}){
 return busy?'saving':connecting?'loading':ready?'ready':pending?'pending':'error';
}
export function gallerySaveText(state,count){
 return state==='ready'?SAVE_TEXT.ready+' · Sinkronizatuta · '+count+' / 20 kartela':SAVE_TEXT[state];
}
export function paintSaveIndicator(el,state,message=SAVE_TEXT[state]){
 if(!el)return;
 el.dataset.saveState=state;
 if(message!=null&&el.textContent!==message)el.textContent=message;
}
