export const CLUES=[
{id:'people',x:22,y:52,title:'Pertsonak',description:'Mahai baten inguruan hainbat gizon daude.',position:'14% 48%'},
{id:'knife',x:39,y:24,title:'Objektua',description:'Erdiko gizonak labana bat du eskuan.',position:'39% 16%'},
{id:'cake',x:53,y:51,title:'Irudia eta testua',description:'Mahai gaineko tartan AFRIQUE hitza irakur daiteke.',position:'53% 51%'}
];
export const CARDS=[
{id:'division',label:'Afrika irudikatzen duen tarta banatzea',icon:'✦'},
{id:'local',label:'Afrikako herriek beren artean lurraldeak banatzea',icon:'◇'},
{id:'powers',label:'Potentzia nagusien ordezkariak',icon:'♛'},
{id:'critique',label:'Potentziek Afrika beren artean banatzea',icon:'⚖'},
{id:'inscription',label:'Tartan dagoen AFRIQUE hitza',icon:'✎'},
{id:'symbol',label:'Lurraldeen banaketa sinbolikoa',icon:'◇'},
{id:'limits',label:'Potentzia bakoitzak zein lurralde hartu zuen',icon:'⌖'},
{id:'literal',label:'Benetako oturuntza baten kontakizuna',icon:'✦'}
];
export const SLOTS=[{id:'who',question:'Nor ageri da?',expected:'powers'},{id:'action',question:'Zer egiten ari dira?',expected:'division'},{id:'message',question:'Zer mezu iradokitzen du?',expected:'critique'},{id:'evidence',question:'Zein xehetasunek lotzen du tarta Afrikarekin?',expected:'inscription'},{id:'meaning',question:'Zer adierazten du tarta zatitzeak modu sinbolikoan?',expected:'symbol'},{id:'boundary',question:'Zer ezin da jakin karikatura honetatik bakarrik?',expected:'limits'}];
export const CARTOON_PAGES=[{title:'1. Behaketa eta mezua',cards:['division','local','powers','critique'],slots:['who','action','message']},{title:'2. Frogak eta mugak',cards:['limits','literal','inscription','symbol'],slots:['evidence','meaning','boundary']}];
export function createCartoon(){return {seen:new Set(),active:null,selected:null,answers:{},checked:false};}
export function observe(s,id){if(CLUES.some(c=>c.id===id)){s.seen.add(id);s.active=id;}}
export function selectCard(s,id){if(CARDS.some(c=>c.id===id))s.selected=s.selected===id?null:id;}
export function place(s,slot,id=s.selected){if(!CARTOON_PAGES.some(p=>p.slots.includes(slot)&&p.cards.includes(id)))return false;for(const key of Object.keys(s.answers))if(s.answers[key]===id)delete s.answers[key];s.answers[slot]=id;s.selected=null;s.checked=false;return true;}
export function remove(s,slot){delete s.answers[slot];s.checked=false;}
export function ready(s){return CLUES.every(c=>s.seen.has(c.id))&&SLOTS.every(x=>CARDS.some(c=>c.id===s.answers[x.id]));}
export function score(s){return SLOTS.filter(x=>s.answers[x.id]===x.expected).length;}
export function sealCartoon(s){s.checked=ready(s);return completeCartoon(s);}
export function completeCartoon(s){return s.checked&&ready(s)&&score(s)===SLOTS.length;}
