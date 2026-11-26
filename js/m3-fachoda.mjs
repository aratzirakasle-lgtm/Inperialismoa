export const COLORS=['red','blue'];
export const POINTS={N:{x:480,y:45,label:'Iparraldea'},S:{x:480,y:553,label:'Hegoaldea'},W:{x:105,y:237,label:'Mendebaldea'},E:{x:700,y:237,label:'Ekialdea'}};
export const COUNTRIES=['uk','fr'];
export const REGIONS={algeria:{x:285,y:125,label:'Aljeria'},cameroon:{x:356,y:275,label:'Kamerun'},sudan:{x:480,y:237,label:'Sudan'}};
export const FIELDS=[
 {id:'cause',question:'Zergatik sortu zen gatazka?',options:[['trade','Merkataritza-itun bat sinatu nahi zutelako'],['rail','Koloniak lotzeko trenbide-proiektuek talka egin zutelako'],['independence','Koloniek independentzia lortu zutelako']],expected:'rail'},
 {id:'withdrawal',question:'Nor erretiratu zen?',options:[['uk','Britainiar tropak'],['fr','Frantziar tropak'],['both','Bi potentzietako tropak']],expected:'fr'},
 {id:'result',question:'Zein izan zen gatazkaren ondorioa?',options:[['fr','Frantziak iparraldea eta hegoaldea menderatu zituen'],['uk','Britainiarrek iparraldeko eta hegoaldeko lurralde afrikarrak menderatu zituzten'],['none','Bi potentziek Afrikako koloniak utzi zituzten']],expected:'uk'}];
export function createFachoda(){return {phase:0,unlocked:0,active:'red',flag:null,axes:{red:{points:[],country:null},blue:{points:[],country:null}},region:null,year:null,answers:{},sealed:[false,false,false],feedback:null};}
function invalidate(s,phase){for(let i=phase;i<3;i++)s.sealed[i]=false;s.unlocked=Math.min(s.unlocked,phase);s.feedback=null;}
export function chooseColor(s,color){if(!COLORS.includes(color)||s.phase!==0)return false;s.active=color;s.flag=null;return true;}
export function choosePoint(s,point){if(!Object.hasOwn(POINTS,point)||s.phase!==0)return false;const a=s.axes[s.active];if(a.points.length===1&&a.points[0]===point){a.points=[];}else if(a.points.length>=2){a.points=[point];a.country=null;}else{a.points.push(point);}s.flag=null;invalidate(s,0);return true;}
export function chooseFlag(s,country){if(!COUNTRIES.includes(country)||s.phase!==0)return false;s.flag=s.flag===country?null:country;return true;}
export function assignFlag(s,color,country=s.flag){if(s.phase!==0||!COLORS.includes(color)||!COUNTRIES.includes(country)||s.axes[color].points.length!==2)return false;for(const c of COLORS)if(s.axes[c].country===country)s.axes[c].country=null;s.axes[color].country=country;s.flag=null;invalidate(s,0);return true;}
export function clearAxis(s,color=s.active){if(s.phase!==0||!COLORS.includes(color))return false;s.axes[color]={points:[],country:null};s.flag=null;invalidate(s,0);return true;}
export function removeFlag(s,color){if(s.phase!==0||!COLORS.includes(color)||!s.axes[color].country)return false;s.axes[color].country=null;s.flag=null;invalidate(s,0);return true;}
export function chooseRegion(s,region){if(s.phase!==1||!Object.hasOwn(REGIONS,region))return false;s.region=region;invalidate(s,1);return true;}
export function chooseYear(s,year){if(s.phase!==1||!['1885','1898','1914'].includes(year))return false;s.year=year;invalidate(s,1);return true;}
export function chooseAnswer(s,id,value){const f=FIELDS.find(q=>q.id===id);if(s.phase!==2||!f?.options.some(([key])=>key===value))return false;s.answers[id]=value;invalidate(s,2);return true;}
export function orientation(a){const key=[...a.points].sort().join('');return key==='NS'?'vertical':key==='EW'?'horizontal':null;}
export function phaseReady(s,p=s.phase){return p===0?COLORS.every(c=>s.axes[c].points.length===2&&s.axes[c].country):p===1?!!s.region&&!!s.year:p===2?FIELDS.every(f=>f.options.some(([id])=>id===s.answers[f.id])):false;}
export function phaseScore(s,p=s.phase){if(p===0)return COLORS.filter(c=>{const a=s.axes[c];return (a.country==='uk'&&orientation(a)==='vertical')||(a.country==='fr'&&orientation(a)==='horizontal');}).length;if(p===1)return Number(s.region==='sudan')+Number(s.year==='1898');return FIELDS.filter(f=>s.answers[f.id]===f.expected).length;}
export function phaseCorrect(s,p=s.phase){return phaseReady(s,p)&&phaseScore(s,p)===(p===2?3:2);}
export function sealPhase(s){if(!phaseReady(s))return false;const p=s.phase;s.sealed[p]=phaseCorrect(s,p);s.feedback={correct:s.sealed[p],score:phaseScore(s,p)};if(s.sealed[p])s.unlocked=Math.max(s.unlocked,Math.min(2,p+1));return s.sealed[p];}
export function goPhase(s,p){if(!Number.isInteger(p)||p<0||p>s.unlocked)return false;s.phase=p;s.flag=null;s.feedback=null;return true;}
export function finished(s){return s.sealed.every(Boolean)&&[0,1,2].every(p=>phaseCorrect(s,p));}
export function resetPhase(s){if(s.phase===0){for(const c of COLORS)s.axes[c]={points:[],country:null};s.flag=null;}else if(s.phase===1){s.region=null;s.year=null;}else s.answers={};invalidate(s,s.phase);}
