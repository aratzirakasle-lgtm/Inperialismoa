export const BOXES=['A','B','C','D'];
export const COUNTRIES={it:'Italia',be:'Belgika',pt:'Portugal',es:'Espainia'};
export const IDENTITIES={A:'be',B:'it',C:'pt',D:'es'};
export const CLUES={
A:{text:'Nire hedapena Leopoldoren II.arekin lotuta dago.',question:'Norekin lotuta dago inperioaren hedapena?',options:[['one','Leopoldo I.arekin'],['two','Leopoldo II.arekin'],['three','Leopoldo III.arekin']],answer:'two',art:'portrait'},
B:{text:'Berandu iritsi nintzen hedapen imperialistara. Eritrea nire lurraldeetako bat zen.',question:'Zein lurralde aipatzen da esaldian?',options:[['somalia','Somalia'],['libya','Libia'],['eritrea','Eritrea']],answer:'eritrea',art:'eritrea'},
C:{text:'Nire inperioak Angola eta Mozambike zituen.',question:'Zein bi lurralde aipatzen dira?',options:[['am','Angola eta Mozambike'],['ac','Angola eta Kongo'],['ms','Mozambike eta Somalia']],answer:'am',art:'angola'},
D:{text:'Sahara eta Ekuatore Ginea nire lurraldeetako bi ziren.',question:'Zein bi lurralde aipatzen dira esaldian?',options:[['sc','Sahara eta Kongo'],['sg','Sahara eta Ekuatore Ginea'],['ge','Ekuatore Ginea eta Eritrea']],answer:'sg',art:'sahara'}
};
export const TERRITORIES=[
['congo','Kongo','A','river'],['angola','Angola','C','savanna'],['mozambique','Mozambike','C','harbor'],['libya','Libia','B','ruins'],['eritrea','Eritrea','B','mountain'],['somalia','Somalia','B','camel'],['capeverde','Cabo Verde','C','island'],['bissau','Guinea Bissau','C','mangrove'],['morocco','Marokoko protektoratua','D','fort'],['equatorial','Ekuatore Ginea','D','forest'],['sahara','Sahara Espainiarra','D','dunes']
].map(([id,name,box,art])=>({id,name,box,art}));
export const createEnigma=()=>({identities:{},territories:{},opened:{},read:{},answers:{},verified:{},checked:false});
export function identify(s,b,p){if(!BOXES.includes(b)||p!==''&&!Object.hasOwn(COUNTRIES,p))return false;if(p&&BOXES.some(x=>x!==b&&s.identities[x]===p))return false;if(p)s.identities[b]=p;else delete s.identities[b];s.checked=false;return true;}
export function assign(s,id,b){if(!TERRITORIES.some(t=>t.id===id)||b!==''&&!BOXES.includes(b))return false;if(b)s.territories[id]=b;else delete s.territories[id];s.checked=false;return true;}
export function acknowledge(s,b,field,value){if(!BOXES.includes(b)||!['read','answers'].includes(field))return false;if(field==='read'&&!['','yes','no'].includes(value))return false;if(field==='answers'&&value!==''&&!CLUES[b].options.some(([id])=>id===value))return false;s[field][b]=value;delete s.verified[b];s.checked=false;return true;}
export const clueReady=(s,b)=>s.read[b]==='yes'&&s.answers[b]===CLUES[b]?.answer;
export function confirmClue(s,b){if(!BOXES.includes(b)||!clueReady(s,b))return false;s.verified[b]=true;return true;}
export const cluesDone=s=>BOXES.every(b=>s.verified[b]&&clueReady(s,b));
export const progress=s=>BOXES.filter(b=>Object.hasOwn(COUNTRIES,s.identities[b])).length+TERRITORIES.filter(t=>BOXES.includes(s.territories[t.id])).length;
export const correct=s=>BOXES.every(b=>s.identities[b]===IDENTITIES[b])&&TERRITORIES.every(t=>s.territories[t.id]===t.box);
export const finished=s=>s.checked&&cluesDone(s)&&correct(s);
export const canCheck=s=>cluesDone(s)&&BOXES.every(b=>Object.hasOwn(COUNTRIES,s.identities[b]));
export function seal(s){s.checked=canCheck(s);return finished(s);}
// Capacities follow the selected country, not the secret identity of a drawer.
export const COUNTRY_TERRITORY_COUNT=Object.freeze(Object.fromEntries(Object.keys(COUNTRIES).map(p=>[p,TERRITORIES.filter(t=>IDENTITIES[t.box]===p).length])));
export const expectedSlotsForBox=(s,b)=>COUNTRY_TERRITORY_COUNT[s.identities[b]]||0;
// Score photographs against the displayed country. Identity is checked independently.
export function boxResults(s,b){if(!s.checked||!BOXES.includes(b)||!expectedSlotsForBox(s,b))return null;const country=s.identities[b],total=expectedSlotsForBox(s,b),assigned=TERRITORIES.filter(t=>s.territories[t.id]===b),right=assigned.filter(t=>IDENTITIES[t.box]===country).length,wrong=assigned.length-right;return {right,wrong,missing:Math.max(0,total-assigned.length),total,overflow:Math.max(0,assigned.length-total),identityCorrect:IDENTITIES[b]===country};}
export function reset(s){Object.assign(s,createEnigma());}
