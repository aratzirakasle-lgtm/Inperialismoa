/* Shared presentation only: no answers, access decisions or writes. */
const seen=new Set();
const arrivals=new WeakMap();
function ensureStyle(){
 if(document.querySelector('link[data-museum-experience]'))return;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./assets/museum-experience.css?v=2';link.dataset.museumExperience='1';document.head.append(link);
}
export function arriveMuseumRoom(root,key){
 if(!root||arrivals.get(root)===key)return;
 arrivals.set(root,key);ensureStyle();
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 root.animate?.([{opacity:.9},{opacity:1}],{duration:240,easing:'ease-out'});
}
export function stampMuseumExercise(mission,step){
 if(![1,2].includes(mission)||![1,2,3,4,5].includes(step))return false;
 const key=mission+':'+step;if(seen.has(key))return false;seen.add(key);ensureStyle();
 document.querySelector('.museum-seal-notice')?.remove();
 const node=document.createElement('div');node.className='museum-seal-notice';node.dataset.mission=String(mission);node.dataset.exercise=String(step);node.setAttribute('role','status');
 node.innerHTML='<span class="museum-seal-mark" aria-hidden="true"><small>MUSEOA</small><b>✓</b><small>ZIGILATUA</small></span><span><small>MUSEOKO ARTXIBOA · '+(mission===1?'I':'II')+'. MISIOA</small><strong>'+step+'. AGIRIA ZIGILATUTA</strong><span>Ariketa gaindituta · Taldearen aurrerapena gordeta.</span></span>';
 document.body.append(node);
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)node.querySelector('.museum-seal-mark')?.animate?.([{opacity:0,transform:'scale(1.45) rotate(-15deg)'},{opacity:1,transform:'scale(1) rotate(-7deg)'}],{duration:330,easing:'cubic-bezier(.2,.8,.2,1)'});
 setTimeout(()=>node.remove(),2600);return true;
}
const copy={
 1:['Lehen ikerketa','Aztertu inperialismoaren oinarriak eta garaiko potentziak. Osatu bost aretoetako ikerketa-espedientea eta lortu lehen domina.'],
 2:['Ikerketa berri bat','Lehen misioan, inperialismoaren oinarriak aztertu dituzue. Orain, inperioen hedapenaren arrazoiak ikertuko dituzue. Osatu bost aretoetako espedientea eta lortu bigarren domina.']
};
export function missionBriefButton(mission){
 ensureStyle();return '<button type="button" class="museum-brief-button" data-museum-brief="'+mission+'" aria-haspopup="dialog">✧ Ikerketa-enkargua</button>';
}
export function openMuseumBrief(mission){
 const entry=copy[mission];if(!entry)return;
 ensureStyle();if(document.querySelector('#museum-brief-dialog'))return;
 const focus=document.activeElement,dialog=document.createElement('dialog');dialog.id='museum-brief-dialog';dialog.className='museum-brief-dialog';dialog.setAttribute('aria-labelledby','museum-brief-title');
 dialog.innerHTML='<p class="museum-brief-overline">✦ MUSEOKO ZUZENDARITZA ✦</p><h2 id="museum-brief-title">'+entry[0]+'</h2><p>'+entry[1]+'</p><p class="museum-brief-signature">'+(mission===1?'I':'II')+'. MISIOA · BOST ARETO</p><button type="button" class="museum-brief-close">Itxi · Ikerketara itzuli →</button>';
 document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{dialog.remove();if(focus?.isConnected)focus.focus({preventScroll:true})},{once:true});
 dialog.showModal();
}
if(typeof document!=='undefined')document.addEventListener('click',event=>{const button=event.target.closest?.('[data-museum-brief]');if(button)openMuseumBrief(Number(button.dataset.museumBrief))});
