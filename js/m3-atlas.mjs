export const POWERS={uk:{name:'Britainia Handia',color:'#d75a4d',pattern:'diagonal'},fr:{name:'Frantzia',color:'#527ec5',pattern:'dots'},de:{name:'Alemania',color:'#c9a236',pattern:'vertical'}};
export const TERRITORIES=[
['india','India','uk','temple'],['egypt','Egipto','uk','pyramid'],['suez','Suezko kanala','uk','ship'],['algeria','Aljeria','fr','arch'],['tunisia','Tunisia','fr','arch'],['morocco','Marokoko protektoratua (20. diap.)','fr','fort'],['indochina','Indotxina','fr','temple'],['swafrica','Hego-mendebaldeko Afrika','de','tree'],['cameroon','Kamerun','de','tree'],['eafrica','Ekialdeko Afrika','de','tree']].map(([id,name,answer,icon])=>({id,name,answer,icon}));
export const STRATEGIES=[['ns','Iparraldea–Hegoaldea'],['ew','Ekialdea–Mendebaldea'],['late','Berandu sartzea']];
export const STRATEGY_ANSWERS={uk:'ns',fr:'ew',de:'late'};
const validPower=p=>Object.hasOwn(POWERS,p);
export function createAtlas(){return {territories:{},strategies:{},rivalry:[],checked:false};}
export function snapshot(s){return {territories:{...s.territories},strategies:{...s.strategies},rivalry:[...s.rivalry],checked:s.checked};}
export function restore(s,v){Object.assign(s,snapshot(v),{checked:false});}
export function assign(s,id,p){if(!TERRITORIES.some(t=>t.id===id)||p!==''&&!validPower(p))return false;if((s.territories[id]||'')===p)return false;if(p)s.territories[id]=p;else delete s.territories[id];s.checked=false;return true;}
export function strategy(s,p,v){if(!validPower(p)||v!==''&&!STRATEGIES.some(([id])=>id===v))return false;if((s.strategies[p]||'')===v)return false;if(v)s.strategies[p]=v;else delete s.strategies[p];s.checked=false;return true;}
export function rivalry(s,p){if(!validPower(p))return false;if(s.rivalry.includes(p))s.rivalry=s.rivalry.filter(x=>x!==p);else if(s.rivalry.length<2)s.rivalry.push(p);else return false;s.checked=false;return true;}
export function progress(s){return TERRITORIES.filter(t=>validPower(s.territories[t.id])).length+Object.keys(POWERS).filter(p=>STRATEGIES.some(([id])=>id===s.strategies[p])).length+Number(s.rivalry.length===2);}
export function correct(s){return TERRITORIES.every(t=>s.territories[t.id]===t.answer)&&Object.keys(STRATEGY_ANSWERS).every(p=>s.strategies[p]===STRATEGY_ANSWERS[p])&&s.rivalry.length===2&&s.rivalry.includes('uk')&&s.rivalry.includes('fr');}
export const finished=s=>s.checked&&correct(s);
export function seal(s){if(progress(s)!==14)return false;s.checked=true;return finished(s);}
