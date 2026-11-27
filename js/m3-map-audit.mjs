// Visual audit of the three spatial statements in slide 18. All geometry is schematic.
export const ARROWS=[
 {id:1,coast:[663,165],inside:[750,340],bend:[790,210]},
 {id:2,coast:[457,380],inside:[700,390],bend:[580,330]},
 {id:3,coast:[1133,575],inside:[930,516],bend:[1030,540]},
 {id:4,coast:[957,925],inside:[905,710],bend:[970,805]}
];
export const SCOPES=['small','almost','all'];
export function createAudit(){return {scope:'small',directions:[false,true,false,true],legend:['authority','control'],checked:false};}
export function changeScope(s,value){if(SCOPES.includes(value)){s.scope=value;s.checked=false;}}
export function reverseArrow(s,id){if(Number.isInteger(id)&&id>=1&&id<=4){s.directions[id-1]=!s.directions[id-1];s.checked=false;}}
export function swapLegend(s){s.legend.reverse();s.checked=false;}
export function score(s){return {scope:Number(s.scope==='almost'),arrows:s.directions.filter(Boolean).length,legend:Number(s.legend[0]==='control'&&s.legend[1]==='authority')};}
export function seal(s){s.checked=true;return complete(s);}
export function complete(s){const r=score(s);return s.checked&&r.scope===1&&r.arrows===4&&r.legend===1;}

// Independent snapshots for the cartographer's undo history. Restoring always requires a fresh seal.
export function snapshotAudit(s){return {scope:s.scope,directions:[...s.directions],legend:[...s.legend],checked:!!s.checked};}
export function restoreAudit(s,previous){Object.assign(s,snapshotAudit(previous),{checked:false});return s;}
