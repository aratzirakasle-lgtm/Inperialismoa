// Schematic examples only: no historic colonial boundaries or powers are inferred.
export const POINTS=[
 {id:'A1',pair:'A',x:663,y:165,zone:'coast'},
 {id:'A2',pair:'A',x:740,y:300,zone:'interior'},
 {id:'B1',pair:'B',x:650,y:399,zone:'interior'},
 {id:'B2',pair:'B',x:457,y:380,zone:'coast'},
 {id:'C1',pair:'C',x:957,y:925,zone:'coast'},
 {id:'C2',pair:'C',x:930,y:758,zone:'interior'}
];
export const PAIRS=['A','B','C'];
export function createSketch(){return {zones:{},arrows:{},tool:'coast',origin:null,checked:false,feedback:''};}
export function selectTool(s,tool){
 if(!['coast','interior','arrow'].includes(tool))return;
 s.tool=tool;s.origin=null;
}
export function markPoint(s,id){
 const p=POINTS.find(p=>p.id===id);if(!p)return;
 if(s.tool==='arrow'){
  if(Object.keys(s.zones).length!==POINTS.length){s.feedback='Lehenik, sailkatu sei puntuak.';return;}
  if(!s.origin){s.origin=id;s.feedback='';return;}
  const a=POINTS.find(p=>p.id===s.origin);
  if(a.id===id){s.origin=null;return;}
  if(a.pair!==p.pair){s.feedback='Lotu letra bera duten bi puntuak.';return;}
  s.arrows[p.pair]=[a.id,p.id];s.origin=null;
 }else {s.zones[id]=s.tool;}
 s.checked=false;s.feedback='';
}
export function clearArrow(s,pair){delete s.arrows[pair];s.origin=null;s.checked=false;s.feedback='';}
export function scores(s){
 return {zones:POINTS.filter(p=>s.zones[p.id]===p.zone).length,arrows:PAIRS.filter(pair=>{const a=s.arrows[pair];return a&&POINTS.find(p=>p.id===a[0])?.zone==='coast'&&POINTS.find(p=>p.id===a[1])?.zone==='interior'&&a.every(id=>POINTS.find(p=>p.id===id)?.pair===pair);}).length};
}
export function ready(s){return POINTS.every(p=>['coast','interior'].includes(s.zones[p.id]))&&PAIRS.every(p=>s.arrows[p]?.length===2);}
export function seal(s){if(!ready(s)){s.feedback='Osatu sei markak eta hiru geziak.';return false;}s.origin=null;s.checked=true;const n=scores(s);s.feedback=n.zones===6&&n.arrows===3?'Mapa zigilatuta.': 'Berrikusi mapa: '+n.zones+'/6 marka eta '+n.arrows+'/3 gezi zuzen.';return n.zones===6&&n.arrows===3;}
export function complete(s){const n=scores(s);return s.checked&&ready(s)&&n.zones===6&&n.arrows===3;}
