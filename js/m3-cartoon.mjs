// Asmatu includes two teacher-supplied historical context questions, not named in slide 18.
export const QUIZ=[
{id:'politician',x:51,y:13,question:'Nor da politikari hau?',options:[['napoleon','Napoleon III.a'],['bismarck','Bismarck'],['cavour','Cavour']],expected:'bismarck'},
{id:'beneficiaries',x:17,y:36,question:'Nortzuk izan ziren banaketan onuradun nagusiak?',options:[['italyspain','Italia eta Espainia'],['germanyportugal','Alemania eta Portugal'],['britainfrance','Britainia Handia eta Frantzia']],expected:'britainfrance'},
{id:'continent',x:48,y:61,question:'Zein kontinenteri egiten dio erreferentzia tartak?',options:[['africa','Afrika'],['asia','Asia'],['america','Amerika']],expected:'africa'}
];
export function quizScore(s){return QUIZ.filter(q=>s.quizAnswers[q.id]===q.expected).length;}
export function quizReady(s){return QUIZ.every(q=>q.options.some(([id])=>id===s.quizAnswers[q.id]));}
export function quizComplete(s){return s.quizChecked&&quizReady(s)&&quizScore(s)===QUIZ.length;}
export function chooseQuiz(s,qid,value){const q=QUIZ.find(q=>q.id===qid);if(!q?.options.some(([id])=>id===value)||quizComplete(s))return false;s.quizAnswers[qid]=value;s.quizChecked=false;s.checked=false;return true;}
export function sealQuiz(s){s.quizChecked=quizReady(s);return quizComplete(s);}
export const CLUES=[
{id:'people',x:17,y:36,title:'Pertsonak',description:'Mahai baten inguruan hainbat gizon daude.',position:'10% 32%'},
{id:'knife',x:45,y:45,title:'Objektua',description:'Erdiko gizonak labana bat du eskuan.',position:'43% 44%'},
{id:'cake',x:48,y:61,title:'Irudia eta testua',description:'Mahai gaineko tartan AFRIQUE hitza irakur daiteke.',position:'48% 63%'}
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
export function createCartoon(){return {seen:new Set(),active:null,selected:null,answers:{},checked:false,quizActive:null,quizAnswers:{},quizChecked:false};}
export function observe(s,id){if(CLUES.some(c=>c.id===id)){s.seen.add(id);s.active=id;}}
export function selectCard(s,id){if(CARDS.some(c=>c.id===id))s.selected=s.selected===id?null:id;}
export function place(s,slot,id=s.selected){if(!CARTOON_PAGES.some(p=>p.slots.includes(slot)&&p.cards.includes(id)))return false;for(const key of Object.keys(s.answers))if(s.answers[key]===id)delete s.answers[key];s.answers[slot]=id;s.selected=null;s.checked=false;return true;}
export function remove(s,slot){delete s.answers[slot];s.checked=false;}
export function ready(s){return quizComplete(s)&&CLUES.every(c=>s.seen.has(c.id))&&SLOTS.every(x=>CARDS.some(c=>c.id===s.answers[x.id]));}
export function score(s){return SLOTS.filter(x=>s.answers[x.id]===x.expected).length;}
export function sealCartoon(s){s.checked=ready(s);return completeCartoon(s);}
export function completeCartoon(s){return s.checked&&ready(s)&&score(s)===SLOTS.length;}
