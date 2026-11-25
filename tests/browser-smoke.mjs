/* Navegación real de Chromium con Supabase simulado: ninguna escritura en producción.
 * Ejecutar: npm install --no-save --no-package-lock playwright@1.56.1
 *          npx playwright install chromium
 *          python3 -m http.server 8765 &
 *          node tests/browser-smoke.mjs
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,channel:process.env.SMOKE_USE_CHROME==='1'?'chrome':undefined,args:['--no-sandbox']});
let passed=0,failed=0;
async function open(role,path,viewport={width:1365,height:900}){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});
 // Aislado del servidor: se inyectan insignias de prueba, nunca datos reales.
 const params=new URL(path,BASE).searchParams;
 const badges=(params.get('smoke_badges')||'').split(',').map(Number).filter(id=>id===1||id===2);
 const completedSteps=Math.min(5,Math.max(0,Number(params.get('smoke_m1_steps'))||0));
 const atlasComplete=params.has('smoke_atlas_complete');
 await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,async route=>{
   const url=route.request().url();
   await route.fulfill({status:200,contentType:url.includes('.css')?'text/css':'application/javascript',body:''});
 });
 if(!params.has('smoke_m2_closed')){
 await context.route('**/js/mission-release.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:"export const MISSION2_OPEN=true;export const MISSION2_LOCKED_TEXT='Bigarren misioa irakasleak irekiko du.';"}));
 }
 await context.addInitScript(({role,badges,completedSteps,m2Open,atlasComplete})=>{
   const userId=role==='teacher'?'teacher1':'student1';
   const people=[
     {id:'teacher1',display_name:'Profesor de pruebas',role:'teacher',team_id:null,class_id:'class1'},
     {id:'student1',display_name:'Alumno de pruebas',role:'student',team_id:'team1',class_id:'class1'},
     {id:'student2',display_name:'Ikasle Proba',role:'student',team_id:'team1',class_id:'class1'}
   ];
   // Servidor simulado por contexto; persiste en recargas sin contactar con Supabase.
   let previousDraft=null,previousBiDraft=null,previousBiState=null,previousM1Drafts=null;
   try{previousDraft=JSON.parse(localStorage.getItem('__smokeGalleryTeamDraft')||'null')}catch{}
   try{previousBiDraft=JSON.parse(localStorage.getItem('__smokeBiTeamDraft')||'null')}catch{}
   try{previousBiState=JSON.parse(localStorage.getItem('__smokeBiTeamState')||'null')}catch{}
   try{previousM1Drafts=JSON.parse(localStorage.getItem('__smokeM1Drafts')||'null')}catch{}
   const tables={
     profiles:people,
     teams:[{id:'team1',name:'Exploradores',class_id:'class1'}],
     missions:[1,2,3,4,5,6].map(id=>({id,title:'Misioa '+id,subtitle:'Historia',intro:'Inperialismoa'})),
     classes:[{id:'class1',name:'Clase de pruebas',school_year:'2026-2027',access_open:true}],
     public_questions:[],
     gallery_team_state:completedSteps>=1?[{team_id:'team1',locked_ids:[],locked_positions:{},completed_at:'2026-11-22T11:00:00Z'}]:[],
     bi_sistema_team_state:previousBiState?[previousBiState]:(completedSteps>=2?[{team_id:'team1',locked_ids:[],locked_positions:{},challenge_locked:[],completed_at:'2026-11-22T11:10:00Z'}]:[]),
     bi_sistema_team_drafts:previousBiDraft?[previousBiDraft]:[],
     empire_dossier_team_state:completedSteps>=4?[{team_id:'team1',solved_ids:['india','aljeria','indonesia','angola'],completed_at:'2026-11-22T11:40:00Z'}]:[],
     mission_badges:badges.map(mission_id=>({team_id:'team1',mission_id,completed_at:'2026-11-21T12:00:00Z'})),
     mission_completions:badges.map(mission_id=>({team_id:'team1',mission_id,completed_at:'2026-11-21T12:00:00Z'})),
     mission1_exercise_completions:atlasComplete?Array.from({length:5},(_,i)=>({team_id:'team1',exercise:i+1,completed_at:'2026-11-22T11:00:00Z'})):[...(completedSteps>=3?[{team_id:'team1',exercise:3}]:[]),...(completedSteps>=5?[{team_id:'team1',exercise:5}]:[])],
     mission2_exercise_completions:atlasComplete?Array.from({length:5},(_,i)=>({team_id:'team1',exercise:i+1,completed_at:'2026-11-23T12:00:00Z'})):[],
     mission1_team_drafts:Array.isArray(previousM1Drafts)?previousM1Drafts:[],
     territory_claims:[],territory_markers:[],submissions:[],submission_assessments:[],
     mission_attempts:[],attempt_answers:[],empire_dossier_attempts:[],
     bi_sistema_attempts:[],gallery_attempts:[],empire_dossier_clue_reads:[],
     gallery_team_drafts:previousDraft?[previousDraft]:[]
   };
   const saveMockDraft=()=>{
     const row=tables.gallery_team_drafts[0]||null;
     try{
       if(row)localStorage.setItem('__smokeGalleryTeamDraft',JSON.stringify(row));
       else localStorage.removeItem('__smokeGalleryTeamDraft');
     }catch{}
   };
   const mockDraftState=()=>{
     const row=tables.gallery_team_drafts[0];
     return row?{placements:{...row.placements},revision:row.revision}
       :{placements:{},revision:0};
   };
   const m1Row=exercise=>{
     let row=tables.mission1_team_drafts.find(x=>x.exercise===exercise);
     if(!row){row={team_id:'team1',exercise,placements:{},revision:0};tables.mission1_team_drafts.push(row)}
     return row;
   };
   const saveM1=()=>localStorage.setItem('__smokeM1Drafts',JSON.stringify(tables.mission1_team_drafts));
   const m1Snapshot=exercise=>{
     const row=m1Row(exercise);
     return {placements:{...row.placements},revision:row.revision};
   };
   const biDraft=()=>{
     let row=tables.bi_sistema_team_drafts[0];
     if(!row){row={team_id:'team1',placements:{},cases:{},revision:0};tables.bi_sistema_team_drafts.push(row)}
     return row;
   };
   const biState=()=>{
     let row=tables.bi_sistema_team_state[0];
     if(!row){row={team_id:'team1',locked_ids:[],locked_positions:{},challenge_locked:[],completed_at:null};tables.bi_sistema_team_state.push(row)}
     return row;
   };
   const saveMockBi=()=>{
     try{
       localStorage.setItem('__smokeBiTeamDraft',JSON.stringify(biDraft()));
       localStorage.setItem('__smokeBiTeamState',JSON.stringify(biState()));
     }catch{}
   };
   const biSnapshot=()=>{
     const row=biDraft();
     return {revision:row.revision,placements:{...row.placements},cases:{...row.cases}};
   };
   const builder=table=>{
     let rows=(tables[table]||[]).slice();
     const obj={
       select(){return this},
       eq(field,value){rows=rows.filter(row=>String(row[field])===String(value));return this},
       order(){return this},
       limit(n){rows=rows.slice(0,n);return this},
       in(field,vals){rows=rows.filter(row=>vals.includes(row[field]));return this},
       maybeSingle(){return Promise.resolve({data:rows[0]||null,error:null})},
       single(){return Promise.resolve({data:rows[0]||null,error:rows.length?null:{message:'Not found'}})},
       then(ok,fail){return Promise.resolve({data:rows,error:null}).then(ok,fail)}
     };return obj
   };
   let authSubscriber=null;
   const client={
     auth:{
       getSession:async()=>({data:{session:{user:{id:userId}}},error:null}),
       getUser:async()=>({data:{user:{id:userId}},error:null}),
       onAuthStateChange:fn=>{authSubscriber=fn;return {data:{subscription:{unsubscribe(){authSubscriber=null}}}};},
       signOut:async()=>{authSubscriber?.('SIGNED_OUT');return {error:null}}
     },
     from:table=>builder(table),
     rpc:async(name,args)=>{
       if(name==='mission2_access_status')return {data:m2Open,error:null};
       if(name==='mission2_class_progress_members')return {data:[],error:null};
       if(name==='teacher_set_mission2_access'){tables.classes.find(c=>c.id===args.p_class_id).mission2_open=args.p_open;return {data:args.p_open,error:null}}
       if(name==='class_access_status')return {data:window.__smokeAccessOpen!==false,error:null};
       if(name==='teacher_set_class_access'){tables.classes.find(c=>c.id===args.p_class_id).access_open=args.p_open;return {data:args.p_open,error:null}}
       // Marcador de aula: lectura autorizada, nunca escritura ni intento.
       // No incluir esta consulta en el registro de mutaciones simulado.
       if(name==='mission1_class_progress'||name==='mission1_class_progress_members'){
         const gs=tables.gallery_team_state?.[0];
         const bs=tables.bi_sistema_team_state?.[0];
         const ds=tables.empire_dossier_team_state?.[0];
         const steps=tables.mission1_exercise_completions||[];
         const e3=steps.some(x=>Number(x.exercise)===3);
         const e5=steps.some(x=>Number(x.exercise)===5);
         return {data:[{team_id:'team1',class_id:'class1',team_name:'Exploradores',member_names:['Ane (proba)','Jon (proba)'],
           exercise_1:!!gs?.completed_at,exercise_2:!!bs?.completed_at,
           exercise_3:e3,exercise_4:!!ds?.completed_at,
           exercise_5:e5,mission_completed:e5}],error:null};
       }
       window.__smokeRpcCalls.push(name);
       if(role==='teacher')throw Error('No se permiten RPC en una simulación docente');
       // Modelo de servidor: dos fases enteras, sin pistas por tarjeta.
       if(name==='submit_bi_sistema'){
         let row=tables.bi_sistema_team_state[0];
         if(!row){
           row={team_id:'team1',locked_ids:[],locked_positions:{},
             challenge_locked:[],completed_at:null};
           tables.bi_sistema_team_state.push(row);
         }
         const phase=args?.p_phase,answers=args?.p_answers||{};
         const expected=phase==='classify'?
           {army:'auth',monarch:'auth',parliament:'auth',separation:'lib',
             rights:'lib',suffrage:'lib',socialist:'lib'}:
           {case_monarch:'auth',case_rights:'lib'};
         const ids=Object.keys(expected);
         const previous=phase==='classify'?row.locked_ids:row.challenge_locked;
         const required=ids.filter(id=>!previous.includes(id));
         if(Object.keys(answers).length!==required.length)
           return {data:null,error:{message:'Osatu fase honetako erantzun guztiak'}};
         const good=required.every(id=>answers[id]===expected[id]);
         if(good){
           if(phase==='classify'){row.locked_ids=ids;row.locked_positions=expected;}
           else{row.challenge_locked=ids;row.completed_at=new Date().toISOString();}
         }
         return {data:{status:'checked',phase_complete:good,
           completed:!!row.completed_at,locked:row.locked_ids,
           positions:row.locked_positions,challenge_locked:row.challenge_locked,
           correct:[],incorrect:[],attempt_count:1},error:null};
       }
       if(name==='mission1_draft_move_checked'){
         const exercise=Number(args?.p_exercise),row=m1Row(exercise);
         if(row.revision!==Number(args?.p_expected_revision))
           return {data:{status:'conflict',...m1Snapshot(exercise)},error:null};
         if(tables.mission1_exercise_completions.some(x=>x.exercise===exercise))
           return {data:{status:'completed',...m1Snapshot(exercise)},error:null};
         const old=row.placements[args.p_item]??null,to=args.p_to_slot??null;
         if(old!==(args.p_expected_slot??null))
           return {data:{status:'conflict',...m1Snapshot(exercise)},error:null};
         if(old!==to){
           for(const [item,slot] of Object.entries(row.placements))if(slot===to&&item!==args.p_item)delete row.placements[item];
           if(to===null)delete row.placements[args.p_item];
           else row.placements[args.p_item]=to;
           row.revision++;saveM1();
         }
         return {data:{status:'saved',...m1Snapshot(exercise)},error:null};
       }
       if(name==='mission1_draft_reset'){
         const exercise=Number(args?.p_exercise),row=m1Row(exercise);
         if(row.revision!==Number(args?.p_revision))
           return {data:{status:'conflict',...m1Snapshot(exercise)},error:null};
         if(Object.keys(row.placements).length){row.placements={};row.revision++;saveM1()}
         return {data:{status:'saved',...m1Snapshot(exercise)},error:null};
       }
       if(name==='mission1_draft_submit'){
         const exercise=Number(args?.p_exercise),row=m1Row(exercise);
         if(row.revision!==Number(args?.p_revision))
           return {data:{status:'conflict',...m1Snapshot(exercise)},error:null};
         if(Object.keys(row.placements).length!==5)
           return {data:{status:'incomplete',revision:row.revision},error:null};
         const expected=exercise===3?{capital:'purpose',exploit:'resources',dominion:'outcome',conqueror:'metropole',conquered:'colony'}:
           {inperialismoa:'1',koloniak:'2',metropoliak:'3',ustiapena:'4',nagusitasuna:'5'};
         const correct=Object.keys(expected).every(key=>row.placements[key]===expected[key]);
         if(correct&&!tables.mission1_exercise_completions.some(x=>x.exercise===exercise))
           tables.mission1_exercise_completions.push({team_id:'team1',exercise});
         return {data:{status:'checked',completed:correct,mission_completed:correct&&exercise===5,revision:row.revision},error:null};
       }
       if(name==='bi_sistema_draft_import'){
         const prior=tables.bi_sistema_team_drafts[0];
         if(prior)return {data:{status:'exists',...biSnapshot()},error:null};
         const row=biDraft();
         row.placements={...(args?.p_placements||{})};
         row.cases={...(args?.p_cases||{})};row.revision=1;
         saveMockBi();
         return {data:{status:'imported',...biSnapshot()},error:null};
       }
       if(name==='bi_sistema_draft_move'){
         const row=biDraft(),state=biState();
         const id=args.p_card_id,isCase=id.startsWith('case_');
         const board=isCase?row.cases:row.placements;
         const before=board[id]??null,next=args.p_to_zone??null;
         if(isCase&&state.locked_ids.length!==7)
           return {data:{status:'locked',...biSnapshot()},error:null};
         if(!isCase&&state.locked_ids.includes(id))
           return {data:{status:'locked',...biSnapshot()},error:null};
         if(before!==(args.p_expected_zone??null))
           return {data:{status:'conflict',...biSnapshot()},error:null};
         const limit=next==='auth'?3:next==='lib'?4:7;
         if(!isCase&&next&&Object.entries(board).filter(([key,value])=>key!==id&&value===next).length>=limit)
           return {data:{status:'full',...biSnapshot()},error:null};
         if(next===null)delete board[id];else board[id]=next;
         if(next!==before)row.revision++;
         saveMockBi();
         return {data:{status:'saved',...biSnapshot()},error:null};
       }
       if(name==='bi_sistema_draft_reset'){
         const row=biDraft();
         if(Number(args?.p_revision)!==row.revision)
           return {data:{status:'conflict',...biSnapshot()},error:null};
         row.placements={};row.cases={};row.revision++;
         saveMockBi();
         return {data:{status:'saved',...biSnapshot()},error:null};
       }
       if(name==='bi_sistema_draft_submit'){
         const row=biDraft(),state=biState();
         if(Number(args?.p_revision)!==row.revision)
           return {data:{status:'conflict',...biSnapshot()},error:null};
         const isClass=args?.p_phase==='classify';
         const expected=isClass?
           {army:'auth',monarch:'auth',parliament:'auth',separation:'lib',rights:'lib',suffrage:'lib',socialist:'lib'}:
           {case_monarch:'auth',case_rights:'lib'};
         const answers=isClass?row.placements:row.cases;
         if(Object.keys(answers).length!==Object.keys(expected).length)
           return {data:null,error:{message:'Osatu fase honetako erantzun guztiak'}};
         const correct=Object.keys(expected).every(id=>answers[id]===expected[id]);
         if(correct){
           if(isClass){state.locked_ids=Object.keys(expected);state.locked_positions=expected;row.placements={};}
           else{state.challenge_locked=Object.keys(expected);state.completed_at=new Date().toISOString();row.cases={};}
           row.revision++;
         }
         saveMockBi();
         return {data:{status:'checked',phase_complete:correct,
           completed:!!state.completed_at,locked:state.locked_ids,
           positions:state.locked_positions,challenge_locked:state.challenge_locked,
           correct:[],incorrect:[],...biSnapshot()},error:null};
       }
       if(name==='gallery_draft_import'){
         const prior=tables.gallery_team_drafts[0];
         if(prior)return {data:{status:'exists',...mockDraftState()},error:null};
         const placements={...(args?.p_placements||{})};
         tables.gallery_team_drafts.push({
           team_id:'team1',placements,revision:Object.keys(placements).length?1:0,
           updated_at:new Date().toISOString()
         });
         saveMockDraft();
         return {data:{status:'imported',...mockDraftState()},error:null};
       }
       if(name==='gallery_draft_move'){
         let draft=tables.gallery_team_drafts[0];
         if(!draft){
           draft={team_id:'team1',placements:{},revision:0,updated_at:new Date().toISOString()};
           tables.gallery_team_drafts.push(draft);
         }
         const id=args?.p_card_id;
         const next=args?.p_to_zone??null;
         const before=draft.placements[id]??null;
         const expected=args?.p_expected_zone??null;
         if(before===next)return {data:{status:'saved',...mockDraftState()},error:null};
         if(before!==expected)return {data:{status:'conflict',...mockDraftState()},error:null};
         if(next===null)delete draft.placements[id];else draft.placements[id]=next;
         draft.revision++;
         draft.updated_at=new Date().toISOString();
         saveMockDraft();
         return {data:{status:'saved',...mockDraftState()},error:null};
       }
       if(name==='gallery_draft_reset'){
         let draft=tables.gallery_team_drafts[0];
         if(!draft){
           draft={team_id:'team1',placements:{},revision:0,updated_at:new Date().toISOString()};
           tables.gallery_team_drafts.push(draft);
         }
         if(Number(args?.p_expected_revision)!==draft.revision)
           return {data:{status:'conflict',...mockDraftState()},error:null};
         draft.placements={};
         draft.revision++;
         draft.updated_at=new Date().toISOString();
         saveMockDraft();
         return {data:{status:'saved',...mockDraftState()},error:null};
       }
       if(name==='submit_shared_gallery_attempt'){
         const draft=mockDraftState();
         if(Number(args?.p_expected_revision)!==draft.revision)
           return {data:{status:'conflict',completed:false,...draft},error:null};
         if(Object.keys(draft.placements).length!==20)
           return {data:{status:'incomplete',completed:false,...draft},error:null};
         return {data:{status:'checked',completed:false,
           correct:[],incorrect:[],locked:[],locked_positions:{},
           attempt_count:1,revision:draft.revision},error:null};
       }
       if(name==='submit_gallery_attempt')return {
         data:{locked:[],locked_positions:{},correct:[],incorrect:[],completed:false,attempt_count:1},
         error:null
       };
       return {data:{completed:false},error:null}
     },
     channel:()=>({on(){return this},subscribe(){return this}}),
     removeChannel:async()=>{},
     storage:{from:()=>({upload:async()=>({error:null})})}
   };
   window.__smokeRpcCalls=[];
   window.supabase={createClient:()=>client};
 },{role,badges,completedSteps,m2Open:!params.has('smoke_m2_closed'),atlasComplete});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(new URL(path,BASE).href,{waitUntil:'domcontentloaded'});
 return {page,context,errors};
}
async function scenario(name,fn){
 try{await fn();passed++;console.log('✓ '+name)}
 catch(error){failed++;console.error('✗ '+name+'\n'+(error.stack||error))}
}
async function waitVisible(page,selector){await page.locator(selector).first().waitFor({state:'visible',timeout:20000})}
async function setCard(page,id,zone){
 await page.waitForFunction(()=>!document.querySelector('.gal-shared-banner')
   ||document.querySelector('.gal-shared-banner').textContent.includes('Sinkronizatuta'));
 await page.locator('[data-gallery-card="'+id+'"]').click();
 await page.locator('[data-gallery-zone="'+zone+'"] .gal-zone-heading').click();
 await page.locator('[data-gallery-zone="'+zone+'"] [data-gallery-card="'+id+'"]')
   .waitFor({state:'visible',timeout:20000});
 await page.waitForFunction(()=>!document.querySelector('.gal-shared-banner')
   ||document.querySelector('.gal-shared-banner').textContent.includes('Sinkronizatuta'));
}
function verifyCardsInsideZones(page){
 return page.evaluate(()=>{
   const zones=['eu_auth','eu_liberal'];
   return zones.map(id=>{
     const zone=document.querySelector('[data-gallery-zone="'+id+'"]');
     const rect=zone.getBoundingClientRect();
     const cards=[...zone.querySelectorAll('.gal-tile-placed')];
     const overflow=cards.map(card=>card.getBoundingClientRect()).filter(r=>
       r.top<rect.top-2||r.bottom>rect.bottom+2||r.left<rect.left-2||r.right>rect.right+2);
     return {id,items:cards.length,overflow:overflow.length}
   });
 });
}

try{
 await scenario('Control de acceso: cierre durante una sesión y reapertura',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery');
   try{
     await waitVisible(page,'.gal-hall');
     await page.evaluate(()=>{window.__smokeAccessOpen=false;window.dispatchEvent(new Event('focus'))});
     await waitVisible(page,'#class-access-dialog');
     assert.match(await page.locator('#class-access-dialog').textContent(),/Museoa itxita dago/);
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('#class-access-dialog').isVisible(),true);
     await page.evaluate(()=>{window.__smokeAccessOpen=true;window.dispatchEvent(new Event('focus'))});
     await page.locator('#class-access-dialog').waitFor({state:'hidden',timeout:15000});
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Control de acceso: profesor cierra y abre su clase',async()=>{
   const {page,context,errors}=await open('teacher','index.html');
   try{
     await waitVisible(page,'[data-class-access]');
     await page.locator('[data-class-access][data-access-open="false"]').click();
     await waitVisible(page,'[data-class-access][data-access-open="true"]');
     await page.locator('[data-class-access][data-access-open="true"]').click();
     await waitVisible(page,'[data-class-access][data-access-open="false"]');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Galería: marcador de aula junto al expediente, sin modificar el juego',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery');
   try{
     await waitVisible(page,'.gal-hall');
     const buttons=page.locator('.m1-archive-open button');
     assert.equal(await buttons.count(),4);
     for(const selector of ['[data-m1-dossier]','[data-m1-class-progress]','[data-museum-brief]','[data-museum-wallet]']){
       assert.equal(await page.locator('.m1-archive-open '+selector).count(),1);
     }
     await page.locator('.m1-archive-open [data-museum-wallet]').click();
     await waitVisible(page,'#museum-wallet-dialog');
     assert.match(await page.locator('#museum-wallet-dialog').innerText(),/Ikertzailearen zorroa/);
     await page.locator('#museum-wallet-dialog [data-mw-close]').first().click();
     await page.locator('#museum-wallet-dialog').waitFor({state:'detached'});
     assert.equal(await page.locator('#museum-wallet-dialog').count(),0);
     await page.locator('[data-museum-brief="1"]').click();
     await waitVisible(page,'#museum-brief-dialog');
     assert.match(await page.locator('#museum-brief-dialog').innerText(),/Lehen ikerketa/);
     await page.locator('#museum-brief-dialog button').click();
     assert.equal(await page.locator('[data-m1-class-progress] .m1-progress-emblem').count(),1);
     assert.equal(await page.locator('[data-m1-class-progress] .m1-progress-emblem').getAttribute('aria-hidden'),'true');
     assert.match(await buttons.first().textContent(),/Ikerketa-espedientea/);
     await page.locator('[data-m1-class-progress]').click();
     await waitVisible(page,'#m1-class-modal-board .m1-class-team');
     assert.match(await page.locator('#m1-class-modal-board').textContent(),/Exploradores/);
     assert.match(await page.locator('#m1-class-modal-board .m1-class-members').textContent(),/Ane \(proba\)/);
     assert.match(await page.locator('#m1-class-modal-board .m1-class-members').textContent(),/Jon \(proba\)/);
     assert.match(await page.locator('#m1-class-modal-board').textContent(),/ZUEN TALDEA/);
     assert.equal(await page.locator('#m1-class-modal-board .m1-class-mark').count(),6);
     await page.locator('#modal-close').click();
     assert.equal(await page.locator('#modal').isVisible(),false);
     await page.locator('[data-m1-dossier]').click();
     await waitVisible(page,'.m1-archive ol');
     await page.locator('#modal-close').click();
     assert.equal(await page.locator('.gal-hall').isVisible(),true);
     assert.equal(await page.locator('[data-gallery-zone]').count(),5);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Vestíbulo C: menú predeterminado sin parámetros, progreso real y vista anterior opcional',async()=>{
   const {page,context,errors}=await open('student','index.html?atlas=classic',{width:1672,height:941});
   try{
     await waitVisible(page,'.c-museo-stage');
     assert.equal(await page.locator('.c-museo-home').count(),1);
     assert.equal(await page.locator('.c-museo-portal').count(),4);
     assert.equal(await page.locator('.c-museo-book-progress').innerText(),'0 / 4');
     assert.equal(await page.locator('.c-museo-book-percent').innerText(),'0 %');
     assert.equal(await page.locator('.c-museo-m2').isDisabled(),true,'La misión 2 requiere completar la primera');
     assert.equal(await page.locator('.c-museo-m3').isDisabled(),true,'Misión 3 aún no publicada');
     assert.equal(await page.locator('.c-museo-m4').isDisabled(),true,'Misión 4 aún no publicada');
     await page.locator('.c-museo-globe').click();
     assert.match(await page.locator('#modal-title').innerText(),/Ikertzailearen atlasa/);
     assert.equal(await page.locator('.museum-expedition .mp-slot').count(),4);
     assert.equal(await page.locator('.atlas-mission').count(),4);
     await page.locator('.atlas-continue[data-atlas-continue="1"]').waitFor();
     await page.locator('.atlas-mission-art img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
     const layout=await page.locator('.atlas-desk').evaluate(el=>({w:el.clientWidth,scroll:el.scrollWidth,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length}));
     assert.ok(layout.scroll<=layout.w+3,'El atlas no debe desbordar horizontalmente');
     assert.equal(layout.columns,2);
     const atlasGeometry=await page.locator('.atlas-concept-one').evaluate(el=>{
       const card=el.closest('.modal-card'),btn=el.querySelector('.atlas-continue'),table=el.querySelector('.atlas-table');
       const rect=x=>{const r=x.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}};
       return {card:rect(card),atlas:rect(el),table:rect(table),continueButton:rect(btn),viewport:innerHeight};
     });
     console.log('ATLAS_GEOMETRY '+JSON.stringify(atlasGeometry));
     assert.ok(atlasGeometry.continueButton.bottom<=atlasGeometry.card.bottom+2,'El botón principal debe estar visible sin desplazar en escritorio');

     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/c-museo-atlas-concepto1-escritorio.png',animations:'disabled'});
     await page.locator('.atlas-archive summary').click();
     assert.equal(await page.locator('.atlas-archive[open] .atlas-file li').count(),10);
     await page.locator('.atlas-archive summary').click();
     await page.locator('#modal-close').click();
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/c-museo-alumno-autenticado-escritorio.png',fullPage:true,animations:'disabled'});
     await page.locator('[data-c-toggle]').click();
     await waitVisible(page,'.museum-gallery-home');
     assert.equal(await page.locator('.c-museo-home').count(),0);
     assert.match(page.url(),/museo=anterior/);
     await page.reload({waitUntil:'domcontentloaded'});
     await waitVisible(page,'.museum-gallery-home');
     await page.locator('[data-c-toggle]').click();
     await waitVisible(page,'.c-museo-stage');
     assert.equal(new URL(page.url()).searchParams.has('museo'),false);
     await page.reload({waitUntil:'domcontentloaded'});
     await waitVisible(page,'.c-museo-stage');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Vestíbulo C: el profesor conserva el panel y puede entrar y salir de la vista del alumno',async()=>{
   const {page,context,errors}=await open('teacher','index.html',{width:1365,height:900});
   try{
     await waitVisible(page,'#view');
     assert.equal(await page.locator('.c-museo-home').count(),0,'El panel docente permanece por defecto');
     await page.locator('[data-view="preview"]').click();
     await waitVisible(page,'.c-museo-home');
     assert.equal(await page.locator('.c-museo-preview-tag').count(),1);
     assert.equal(await page.locator('.c-museo-book-progress').innerText(),'0 / 4');
     await page.locator('.c-museo-return').click();
     assert.equal(await page.locator('.c-museo-home').count(),0);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Vestíbulo C: el escenario conserva proporción de referencia en móvil',async()=>{
   const {page,context,errors}=await open('student','index.html',{width:390,height:844});
   try{
     await waitVisible(page,'.c-museo-stage');
     const geom=await page.locator('.c-museo-stage').evaluate(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}});
     assert.ok(Math.abs(geom.w/geom.h-1672/941)<.025,'El museo no debe deformarse en pantallas pequeñas');
     assert.equal(await page.locator('.c-museo-portal').count(),4);
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/c-museo-alumno-movil.png',fullPage:true,animations:'disabled'});
     await page.locator('.c-museo-mobile-atlas').click();
     await page.locator('.atlas-continue[data-atlas-continue="1"]').waitFor();
     await page.locator('.atlas-mission-art img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
     assert.equal(await page.locator('.atlas-desk').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
     const overflow=await page.locator('.modal-card').evaluate(el=>el.scrollWidth-el.clientWidth);
     assert.ok(overflow<=3,'El atlas móvil no debe desbordarse');
     await page.screenshot({path:'test-output/c-museo-atlas-concepto1-movil.png',animations:'disabled'});
     await page.locator('.atlas-continue').scrollIntoViewIfNeeded();
     await page.screenshot({path:'test-output/c-museo-atlas-movil-escritorio-inferior.png',animations:'disabled'});
     await page.locator('#modal-close').click();
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });

 await scenario('Vestíbulo C: cabecera limpia, enfoque accesible y cierre de sesión conservado',async()=>{
   const {page,context,errors}=await open('student','index.html?museo=c',{width:1440,height:900});
   try{
     await waitVisible(page,'.c-museo-stage');
     assert.equal(await page.locator('#app-shell .topbar').isVisible(),false,
       'No se repiten dos cabeceras en la pantalla inmersiva');
     assert.equal(await page.locator('.c-museo-toolbar-team').isVisible(),true);
     assert.equal(await page.locator('.c-museo-banner-dim').count(),0,
       'No deben usarse parches rectangulares sobre el estandarte');
     assert.equal(await page.locator('.c-museo-second-dim').count(),0);
     assert.equal(await page.locator('.c-museo-brass').count(),0,
       'Ez dago estandarteak estaltzen dituen botoi handirik');
     assert.equal(await page.locator('.c-museo-flag-pin').count(),0,
       'La pintura original no debe tener medallones superpuestos');
     assert.equal(await page.locator('.c-museo-banner-retouch').count(),0,
       'No se utiliza el parche panorámico que se veía postizo');
     assert.equal(await page.locator('.c-museo-banner-repair').count(),2,
       'Se restauran solo el escudo y la cartela con texto incompatible');
     await page.locator('.c-museo-banner-repair').evaluateAll(
       imgs=>Promise.all(imgs.map(img=>img.decode())));
     assert.equal(await page.locator('.c-museo-inscription-1.is-next').innerText(),'HASI');
     assert.equal(await page.locator('.c-museo-inscription-2.is-locked svg').count(),1);
     assert.equal(await page.locator('.c-museo-m2').isDisabled(),true);
     for(const id of [2,3,4]){
       const state=await page.locator('.c-museo-m'+id).evaluate(el=>({bg:getComputedStyle(el).backgroundColor,shade:Number(getComputedStyle(el,'::before').opacity)}));
       assert.equal(state.bg,'rgba(0, 0, 0, 0)');assert.ok(state.shade>0&&state.shade<1);
     }
     await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.c-museo-m1'),'::before').opacity)>.72);
     await page.locator('.c-museo-m1').hover();
     await page.locator('.c-museo-m1').focus();
     assert.equal(await page.locator('.c-museo-m1').evaluate(el=>document.activeElement===el),true);
     assert.match(await page.locator('.c-museo-m1').getAttribute('aria-label'),/Eskuragarri/);
     assert.equal(await page.locator('.c-museo-toolbar [data-c-logout]').count(),1);
     assert.equal(await page.locator('.c-museo-power[data-c-logout]').count(),1);
     await page.locator('.c-museo-power[data-c-logout]').click();
     await waitVisible(page,'#login-screen');
     assert.equal(await page.locator('#app-shell').isVisible(),false);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Vestíbulo C: las insignias reales simuladas producen 1/4 y 2/4, sin revelar otras misiones',async()=>{
  for(const [badges,expected] of [['1',25],['1,2',50]]){
   const {page,context,errors}=await open('student','index.html?museo=c&smoke_m1_steps=5&smoke_badges='+badges,{width:1672,height:941});
   try{
     await waitVisible(page,'.c-museo-stage');
     assert.equal(await page.locator('.c-museo-mobile-mission').count(),4);
     assert.equal(await page.locator('.c-museo-m2').isDisabled(),false);
     assert.equal(await page.locator('.c-museo-m3').isDisabled(),true);
     assert.equal(await page.locator('.c-museo-m4').isDisabled(),true);
     const summary=await page.locator('.c-museo-mobile-summary').textContent();
     assert.match(summary,new RegExp((expected/25)+' / 4 misio osatuta'));
     assert.match(summary,new RegExp(expected+' %'));
     if(expected===25){
       assert.equal(await page.locator('.c-museo-banner-repair').count(),1,
        '1/4 conserva OSATUTA en M1 y sustituye JARRAITU por HASI en M2');
       assert.equal(await page.locator('.c-museo-inscription-2.is-next').innerText(),'HASI');
       assert.equal(await page.locator('.c-museo-inscription-1').count(),0);
       assert.equal(await page.locator('.c-museo-book-progress').innerText(),'1 / 4',
        'El dato real se imprime una sola vez en el pergamino restaurado');
     }else{
       assert.equal(await page.locator('.c-museo-banner-repair').count(),1,
        '2/4 conserva el estandarte original primero y adapta solo la inscripción del segundo');
       assert.equal(await page.locator('.c-museo-inscription.is-next').count(),0);
       const image=page.locator('.c-museo-banner-repair');
       assert.match(await image.getAttribute('src'),/museo-c-osatuta-mision2\.svg/);
       await image.evaluate(img=>img.decode());
       const imageTransparency=await image.evaluate(img=>{
         const canvas=document.createElement('canvas');
         canvas.width=1672;canvas.height=941;
         const ctx=canvas.getContext('2d',{willReadFrequently:true});
         ctx.drawImage(img,0,0,1672,941);
         return [ctx.getImageData(635,513,1,1).data[3],
                 ctx.getImageData(516,499,1,1).data[3]];
       });
       assert.deepEqual(imageTransparency,[0,0],
        'La flecha y los bordes de la cartela original deben permanecer completamente intactos');
       assert.equal(await page.locator('.c-museo-flag-pin,.c-museo-brass').count(),0);
       assert.equal(await page.locator('.c-museo-book-progress').innerText(),'2 / 4');
       assert.equal(await page.locator('.c-museo-book-percent').innerText(),'50 %');
     }
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/c-museo-progreso-'+expected+'.png',animations:'disabled',fullPage:true});
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
 await scenario('Atlas: dos misiones confirmadas, grabados, fechas y expediente visible',async()=>{
   const {page,context,errors}=await open('student','index.html?museo=c&atlas=classic&smoke_m1_steps=5&smoke_badges=1,2&smoke_atlas_complete=1',{width:1672,height:941});
   try{
     await waitVisible(page,'.c-museo-stage');
     const widgetWasVisible=await page.locator('.m1-class-widget').isVisible();
     await page.locator('.c-museo-globe').click();
     await page.locator('.atlas-original-seal').nth(1).waitFor();
     assert.equal(await page.locator('.atlas-original-seal').count(),2);
     assert.equal(await page.locator('.atlas-photo-medal').count(),2);
     assert.equal(await page.locator('.atlas-seals time[datetime]').count(),2);
     assert.equal(await page.locator('.atlas-totals meter').first().getAttribute('value'),'2');
     assert.equal(await page.locator('.atlas-totals meter').nth(1).getAttribute('value'),'10');
     assert.equal(await page.locator('.atlas-mission.is-locked').count(),2);
     assert.equal(await page.locator('.m1-class-widget').isVisible(),false);
     await page.locator('.atlas-mission-art img,.atlas-photo-medal').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/c-museo-atlas-dos-misiones-escritorio.png',animations:'disabled'});
     await page.locator('.atlas-archive summary').click();
     assert.equal(await page.locator('.atlas-archive[open] .atlas-file li').count(),10);
     await page.locator('.atlas-archive[open]').scrollIntoViewIfNeeded();
     await page.screenshot({path:'test-output/c-museo-atlas-dos-misiones-expediente.png',animations:'disabled'});
     await page.locator('#modal-close').click();
     await page.locator('#modal').waitFor({state:'hidden'});
     if(widgetWasVisible)await page.locator('.m1-class-widget').waitFor({state:'visible'});
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Atlas fotográfico: escena nativa y progreso confirmado, sin premios de muestra',async()=>{
   for(const done of [false,true]){
    const suffix=done?'&smoke_m1_steps=5&smoke_badges=1,2&smoke_atlas_complete=1':'';
    const {page,context,errors}=await open('student','index.html?museo=c'+suffix,{width:1672,height:941});
    try{
     await waitVisible(page,'.c-museo-stage');
     await page.locator('.c-museo-globe').click();
     const stage=page.locator('.atlas-photo');await stage.waitFor();
     if(done)await stage.locator('.ap-earned-medal').nth(1).waitFor();
     else await stage.locator('[data-atlas-continue="1"]').waitFor();
     await stage.locator('.atlas-photo-img').evaluate(img=>img.decode());
     assert.equal(await stage.locator('.atlas-photo-img').evaluate(img=>img.naturalWidth),3344);
     assert.deepEqual(await stage.locator('.ap-name-signature').allTextContents(),['Alumno d. p.','Ikasle P.']);
     await stage.locator('.ap-mission-artwork').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
     assert.deepEqual(await stage.locator('.ap-mission-artwork').evaluateAll(imgs=>imgs.map(img=>[img.naturalWidth,img.naturalHeight])),Array.from({length:4},()=>[1619,971]));
     assert.equal(await stage.locator('.ap-art-lock').count(),2);
     assert.equal(await stage.locator('.ap-earned-medal').count(),done?2:0);
     assert.equal(await stage.locator('.ap-earned-seal').count(),done?2:0);
     assert.equal(await stage.locator('time[datetime]').count(),done?2:0);
     if(done){for(const date of await stage.locator('time[datetime]').allTextContents())assert.match(date,/^\d{4}-\d{2}-\d{2} · \d{2}:\d{2}$/);}
     assert.equal(await stage.locator('.ap-card-label').count(),done?0:2);
     assert.equal(await stage.locator('.ap-caption-surface').count(),1);

     assert.equal(await stage.locator('.ap-meter-m').getAttribute('aria-valuenow'),done?'2':'0');
     assert.deepEqual(await stage.locator('.ap-progress-label').allTextContents(),['Misio osatuta','Ariketa osatuta']);
     if(done)assert.equal(await stage.locator('.ap-action').textContent(),'Museora itzuli');
     assert.equal(await stage.locator('.ap-meter-e').getAttribute('aria-valuenow'),done?'10':'0');
     const geom=await stage.evaluate(el=>{const r=el.getBoundingClientRect(),b=el.querySelector('.ap-action').getBoundingClientRect();return {ratio:r.width/r.height,top:r.top,bottom:r.bottom,button:b.bottom,viewport:innerHeight}});
     assert.ok(Math.abs(geom.ratio-1672/941)<.02);
     assert.ok(geom.top>=-2&&geom.bottom<=geom.viewport+2&&geom.button<=geom.bottom);
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/c-museo-atlas-fotografico-'+(done?'dos':'cero')+'.png',animations:'disabled'});
     await stage.locator('.ap-archive summary').click();assert.equal(await stage.locator('.ap-archive[open] .atlas-file li').count(),10);
     await stage.locator('.ap-archive summary').click();
     await stage.locator('.ap-card-1 summary').click();assert.equal(await stage.locator('.ap-card-1[open] li').count(),5);
     await stage.locator('.ap-card-1 summary').click();
     await page.locator('#modal-close').click();await page.locator('#modal').waitFor({state:'hidden'});
     assert.deepEqual(errors,[]);
    }finally{await context.close()}
   }
 });
 await scenario('Vestíbulo C: la navegación móvil es legible y no desbloquea misiones futuras',async()=>{
   const {page,context,errors}=await open('student','index.html?museo=c&smoke_m1_steps=5&smoke_badges=1',{width:390,height:844});
   try{
     await waitVisible(page,'.c-museo-mobile-guide');
     assert.equal(await page.locator('.c-museo-mobile-mission').count(),4);
     for(const [index,enabled] of [[0,true],[1,true],[2,false],[3,false]]){
       const button=page.locator('.c-museo-mobile-mission').nth(index);
       assert.equal(await button.isDisabled(),!enabled);
       const box=await button.boundingBox();
       assert.ok(box&&box.height>=60&&box.width>=300,'Botón accesible de tamaño suficiente');
     }
     await page.locator('.c-museo-mobile-mission').nth(1).click();
     assert.equal(await page.locator('.c-museo-home').count(),0);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Alumno: el primer ejercicio tiene 20 tarjetas y no permite saltar al segundo',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery',{width:1672,height:941});
   try{
     await waitVisible(page,'.gal-hall');
     await mkdir('test-output',{recursive:true});
     const detailSheet=page.locator('link[href*="galeria-mapa-cartelas-20261121.css"]');
     assert.equal(await detailSheet.count(),1,'El CSS de mapa y cartelas debe estar cargado en la web oficial');
     // Comparación real: misma vista sin recolocar ninguna cartela.
     await detailSheet.evaluate(el=>{el.disabled=true});
     await page.screenshot({path:'test-output/m1-mapa-cartelas-antes-20261121.png',fullPage:true,animations:'disabled'});
     await detailSheet.evaluate(el=>{el.disabled=false});
     await page.screenshot({path:'test-output/m1-mapa-cartelas-despues-20261121.png',fullPage:true,animations:'disabled'});
     const mapInfo=await page.locator('.gal-side-art-left').evaluate(el=>{
       const map=getComputedStyle(el.querySelector('.gal-historical-map-frame'));
       const lower=getComputedStyle(el,'::after');
       return {background:getComputedStyle(el).backgroundImage,
         tilted:map.transform,upperImage:map.backgroundImage,
         border:map.borderStyle,lowerImage:lower.backgroundImage,lowerClip:lower.clipPath};
     });
     assert.equal(mapInfo.background,'none','El mapa y los objetos inferiores deben mostrarse por separado');
     assert.notEqual(mapInfo.tilted,'none','El mapa debe quedar ladeado');
     assert.equal(mapInfo.border,'ridge','El mapa ladeado debe conservar su marco de museo');
     assert.ok(mapInfo.upperImage.includes('m2-museo-izquierdo.svg')&&mapInfo.lowerImage.includes('m2-museo-izquierdo.svg'),
       'Mapa y globo deben conservar la misma ilustración original');
     assert.match(mapInfo.lowerClip,/inset/);
     const paper=await page.locator('.gal-tray .gal-tile').first().evaluate(el=>{
       const css=getComputedStyle(el);
       const icon=getComputedStyle(el.querySelector('.gal-tile-icon'));
       const artwork=el.querySelector('.gal-tile-artwork');
       return {background:css.backgroundImage,iconBackground:icon.backgroundImage,
         iconRadius:icon.borderRadius,artworkSrc:artwork?.getAttribute('src')||''};
     });
     assert.ok(paper.background.includes('gradient')&&
       paper.iconBackground==='none'&&paper.iconRadius==='0px'&&
       paper.artworkSrc.includes('/assets/galeria-miniaturas/')&&paper.artworkSrc.includes('.svg?v='),
       'El pergamino debe incluir imágenes pintadas transparentes, sin el antiguo medallón circular');
     const paintings=await page.locator('.gal-tray .gal-tile-artwork').evaluateAll(async imgs=>{
       await Promise.all(imgs.map(img=>img.decode().catch(()=>{})));
       return imgs.map(img=>{
         const rect=img.getBoundingClientRect();
         return {loaded:img.complete&&img.naturalWidth>0,
           width:rect.width,height:rect.height,
           src:img.getAttribute('src')};
       })
     });
     assert.equal(paintings.length,20,'Las 20 cartelas deben mostrar una ilustración');
     assert.ok(paintings.every(p=>p.loaded),'Las 20 imágenes SVG cargan desde assets');
     assert.ok(paintings.every(p=>p.src.includes('/assets/galeria-miniaturas/')),
       'Las ilustraciones no dependen de imágenes incrustadas en el JavaScript');
     assert.ok(paintings.every(p=>p.width>=43&&p.height>=43),
       'Las ilustraciones son suficientemente grandes para distinguirse');
     assert.equal(new Set(paintings.map(p=>p.src)).size,20,
       'Cada concepto tiene una imagen diferente');
          assert.equal(await page.locator('.gal-tray .gal-tile').count(),20);
     await page.screenshot({path:'test-output/m1-museo-cinematico-alumno-ordenador.png',fullPage:true,animations:'disabled'});
     const cabinets=await page.locator('.gal-vitrine').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().bottom));
     assert.ok(Math.max(...cabinets)-Math.min(...cabinets)<5,
       'En escritorio las cuatro vitrinas deben terminar alineadas sin recortar las zonas');
     await page.screenshot({path:'test-output/m1-museo-fidelidad-v2-alumno-escritorio.png',fullPage:true,animations:'disabled'});
     await page.screenshot({path:'test-output/m1-museo-cupulas-v3-alumno-escritorio.png',fullPage:true,animations:'disabled'});
     assert.equal(await page.locator('.gal-tile').count(),20);
     assert.equal(await page.locator('[data-gallery-action="next"]').count(),0);
     assert.equal(await page.locator('.m1-nav[data-m1-role="student"]').count(),1);
     assert.equal(await page.locator('.m1-nav-links a').count(),1,
       'El primer ejercicio es el único acceso sin logros confirmados');
     await page.locator('[data-gallery-action="hint"]').click();
     const help=await page.locator('.gal-hint').innerText();
     assert.match(help,/aukeratu txartel bat|arrastatu txartela/i);
     assert.doesNotMatch(help,/pista:|tsarrak|meiji|monarkaren/i);
     await page.waitForFunction(()=>
       document.querySelector('.gal-shared-banner')?.textContent?.includes('Sinkronizatuta'));
     await page.evaluate(()=>{
       window.__stableMuseumNodes={
         hall:document.querySelector('.gal-hall'),
         display:document.querySelector('.gal-display'),
         europeanFlag:document.querySelector('.gal-vitrine-eu .gal-flag-illustration'),
         untouchedCard:document.querySelector('[data-gallery-card="jp_trade"]'),
         untouchedArtwork:document.querySelector('[data-gallery-card="jp_trade"] img')
       };
     });
     await setCard(page,'eu_auth_head','eu_liberal');
     const stable=await page.evaluate(()=>{
       const prev=window.__stableMuseumNodes;
       return {
         hall:prev.hall===document.querySelector('.gal-hall'),
         display:prev.display===document.querySelector('.gal-display'),
         europeanFlag:prev.europeanFlag===document.querySelector('.gal-vitrine-eu .gal-flag-illustration'),
         untouchedCard:prev.untouchedCard===document.querySelector('[data-gallery-card="jp_trade"]'),
         untouchedArtwork:prev.untouchedArtwork===document.querySelector('[data-gallery-card="jp_trade"] img')
       };
     });
     assert.ok(Object.values(stable).every(Boolean),
       'Mover una cartela no debe reconstruir vitrinas, banderas ni imágenes ajenas');
     assert.equal(await page.locator('[data-gallery-action="check"]').isDisabled(),true,
       'La corrección exige colocar las veinte cartelas');
     const rest=await page.locator('.gal-tray [data-gallery-card]').evaluateAll(cards=>
       cards.map(card=>card.dataset.galleryCard));
     const zones=['eu_auth','eu_liberal','ru','us','jp'];
     for(let i=0;i<rest.length;i++)await setCard(page,rest[i],zones[i%zones.length]);
     assert.equal(await page.locator('[data-gallery-action="check"]').isEnabled(),true);
     await page.locator('[data-gallery-action="check"]').click();
     await page.waitForFunction(()=>document.querySelector('.gal-status')?.textContent?.includes('Ariketa ez dago gaindituta'));
     assert.equal(await page.locator('.gal-wrong').count(),0,'Un error no debe destacar respuestas incorrectas');
     assert.doesNotMatch(await page.locator('.gal-status').innerText(),/\d+.*birkokatu|\d+.*kontzeptu.*zuzendu/i);
     assert.equal(await page.locator('[data-gallery-action="next"]').count(),0);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Galería: arrastre táctil ilumina los destinos y limpia al soltar',async()=>{
    const {page,context,errors}=await open('student','index.html#mission1gallery',{width:390,height:844});
    try{
      await waitVisible(page,'.gal-hall');
      await page.waitForFunction(()=>
        document.querySelector('.gal-shared-banner')?.textContent?.includes('Sinkronizatuta'));
      const sample=await page.evaluate(()=>{
        const card=document.querySelector('[data-gallery-card="eu_army"]');
        const zone=document.querySelector('[data-gallery-zone="eu_auth"]');
        const hall=document.querySelector('.gal-hall');
        const original=document.elementFromPoint;
        card.setPointerCapture=()=>{};
        card.hasPointerCapture=()=>false;
        document.elementFromPoint=()=>zone;
        const fire=(type,x,y)=>card.dispatchEvent(new PointerEvent(type,{
          bubbles:true,cancelable:true,pointerType:'touch',pointerId:61,
          clientX:x,clientY:y,isPrimary:true
        }));
        let active=false,hover=false;
        try{
          fire('pointerdown',20,20);
          fire('pointermove',85,100);
          active=hall.classList.contains('gal-drag-mode');
          hover=zone.classList.contains('gal-touch-target');
          fire('pointerup',85,100);
        }finally{
          document.elementFromPoint=original;
        }
        return {active,hover,cleared:!hall.classList.contains('gal-drag-mode'),
          ghostGone:!document.querySelector('.gal-touch-ghost'),
          hoverGone:!zone.classList.contains('gal-touch-target')};
      });
      assert.ok(Object.values(sample).every(Boolean),
        'Iluminación uniforme durante el arrastre y limpieza al soltar');
      await page.locator('[data-gallery-zone="eu_auth"] [data-gallery-card="eu_army"]')
        .waitFor({state:'visible',timeout:15000});
      assert.equal(await page.locator('.gal-wrong').count(),0);
      assert.deepEqual(errors,[]);
    }finally{await context.close()}
  });
  await scenario('Galería: mejora visual antes/después, foco de teclado y controles sin pistas',async()=>{
   const {page,context,errors}=await open('teacher','index.html#teacherpreviewgallery',{width:1672,height:941});
   try{
     await waitVisible(page,'.gal-hall');
     const sheet=page.locator('link[href*="galeria-mision1-pulido-20261121.css"]');
     assert.equal(await sheet.count(),1,'El pulido gráfico debe estar enlazado');
     assert.equal(await page.locator('.gal-vitrine-eu .gal-flag-illustration').count(),1,'Debe conservarse la bandera europea original');
     assert.match(await page.locator('.gal-vitrine-eu .gal-flag-illustration').getAttribute('aria-label'),/Europar Batasuneko bandera/);
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/m1-museo-cinematico-vacio-escritorio.png',fullPage:true,animations:'disabled'});
     for(const [id,zone] of [['eu_auth_head','eu_auth'],['eu_liberal_head','eu_liberal'],['ru_tsar','ru'],['us_west','us'],['jp_meiji','jp']])
       await setCard(page,id,zone);
     assert.equal(await page.locator('.gal-tile').count(),20);
     const sceneInfo=await page.evaluate(()=>{
       const el=document.querySelector('.gal-display');
       const rect=el.getBoundingClientRect();
       return {width:rect.width,viewport:innerWidth,columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
         imageCount:document.querySelectorAll('.gal-vitrine-image').length};
     });
     assert.equal(sceneInfo.columns,4,'En ordenador debe haber cuatro vitrinas en la misma fila');
     assert.equal(sceneInfo.imageCount,4);
     await page.locator('[data-gallery-card="eu_army"]').focus();
     await page.keyboard.press('Enter');
     assert.equal(await page.locator('[data-gallery-card="eu_army"]').getAttribute('aria-pressed'),'true');
     assert.equal(await page.locator('[data-gallery-card="eu_army"]').evaluate(el=>document.activeElement===el),true,
       'La tarjeta debe recuperar el foco después de actualizar la sala');

     await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});
     await page.mouse.move(5,5);
     await mkdir('test-output',{recursive:true});
     // Misma bandera europea y mismas cinco colocaciones en ambos estados.
     await sheet.evaluate(el=>el.disabled=true);
     await page.screenshot({path:'test-output/m1-galeria-antes-ordenador.png',fullPage:true,animations:'disabled'});
     await sheet.evaluate(el=>el.disabled=false);
     await page.screenshot({path:'test-output/m1-galeria-despues-ordenador.png',fullPage:true,animations:'disabled'});
     assert.equal(await page.locator('.gal-tile.gal-selected').count(),1);
     assert.equal(await page.locator('.gal-vitrine').count(),4);
     assert.equal(await page.locator('.gal-museum-set').count(),1,'La escenografía debe estar montada');
     assert.equal(await page.locator('.gal-side-art').count(),2,'El museo debe incluir sus objetos laterales');
     assert.equal(await page.locator('.gal-case-finial').count(),4,'Las cuatro vitrinas deben tener remates de latón');
     assert.equal(await page.locator('.gal-case-column').count(),8,'Cada vitrina debe conservar sus dos columnas');
     assert.equal(await page.locator('.gal-vitrine-velvet').count(),4,'Cada vitrina debe tener base de terciopelo');
     assert.equal(await page.locator('.gal-case-amber-light').count(),4,'Cada vitrina mantiene luz cálida en la base');
     assert.equal(await page.locator('.gal-case-spotlight').count(),0,'No deben superponerse focos físicos sobre las banderas');
     assert.equal(await page.locator('.gal-case-glass').count(),4,'Las capas de cristal no pueden desaparecer');
     assert.equal(await page.locator('.gal-museum-tablefront').count(),1,'La mesa debe mostrar su canto de nogal');
     assert.equal(await page.locator('.gal-museum-tablefront').evaluate(el=>getComputedStyle(el).pointerEvents),'none',
       'El canto de la mesa nunca debe bloquear botones');
     assert.equal(await page.locator('.gal-case-glass').first().evaluate(el=>getComputedStyle(el).pointerEvents),'none');
     const dome=await page.locator('.gal-vitrine').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
     assert.ok(dome.includes('galeria-cupula-cristal-laton.svg'),'Debe conservar la cúpula vectorial compartida');
     const domeAsset=await page.evaluate(async()=>{const r=await fetch('./assets/galeria-cupula-cristal-laton.svg');return {ok:r.ok,svg:(await r.text()).includes('<svg')}}); 
     assert.ok(domeAsset.ok&&domeAsset.svg,'Debe cargarse el recurso de cúpulas desde la web');
     const photos=await page.locator('.gal-vitrine-image').evaluateAll(nodes=>nodes.map(el=>{
       const style=getComputedStyle(el);
       return {data:style.backgroundImage.includes('data:image/webp'),position:style.backgroundPosition};
     }));
     assert.ok(photos.length===4&&photos.every(p=>p.data),
       'Las cuatro fotografías originales WebP deben permanecer en cada vitrina');
     assert.equal(new Set(photos.map(p=>p.position)).size,4,
       'Cada foto debe conservar su encuadre original y distinto');
     assert.equal(await page.locator('.gal-tray-corner').count(),4,'La mesa debe llevar cuatro filigranas');
     const glassBackdrop=await page.locator('.gal-vitrine-ru .gal-zone').evaluate(el=>getComputedStyle(el).backgroundImage);
     assert.ok(glassBackdrop.includes('gradient')&&!glassBackdrop.includes('data:image'),
       'Los paneles de respuesta deben tener textura neutra, sin fotografías duplicadas');
     const stylesV2=page.locator('link[href*="galeria-museo-fidelidad-v2.css"]');
     assert.equal(await stylesV2.count(),1,'Debe estar enlazado el CSS de fidelidad');
     assert.equal(await page.locator('.gal-case-column').first().evaluate(el=>getComputedStyle(el).pointerEvents),'none',
       'Los adornos no deben bloquear las zonas de respuesta');
     const sideArt=await page.locator('.gal-side-art').evaluateAll(nodes=>nodes.map(el=>({
       main:getComputedStyle(el).backgroundImage,
       upper:el.querySelector('.gal-historical-map-frame')
         ? getComputedStyle(el.querySelector('.gal-historical-map-frame')).backgroundImage
         : getComputedStyle(el,'::before').backgroundImage,
       lower:getComputedStyle(el,'::after').backgroundImage
     })));
     assert.ok(sideArt[0].upper.includes('m2-museo-izquierdo.svg')&&sideArt[0].lower.includes('m2-museo-izquierdo.svg')&&
       sideArt[1].main.includes('m2-museo-derecho.svg'),
       'Deben conservarse las dos ilustraciones históricas laterales incluso con el mapa inclinado');
     assert.equal(await page.locator('.gal-flag-shelf .gal-flag-illustration').count(),4,'Las cuatro banderas deben estar dentro de las vitrinas');
     assert.equal(await page.locator('[data-gallery-zone]').count(),5,'No deben desaparecer zonas de clasificación');
     assert.equal(await page.locator('.gal-museum-set').getAttribute('aria-hidden'),'true');
     assert.equal(await page.locator('.gal-tile').count(),20);
     await page.locator('[data-gallery-card="eu_army"]').focus();
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('.gal-tile.gal-selected').count(),0,
       'Escape debe cancelar la selección sin mover ninguna cartela');

     // Un botón dentro de una vitrina no debe interpretarse como el destino
     // al pulsar Enter: primero se selecciona, luego se coloca.
     await page.locator('[data-gallery-zone="eu_auth"] [data-gallery-card="eu_auth_head"]').focus();
     await page.keyboard.press('Enter');
     assert.equal(await page.locator('[data-gallery-card="eu_auth_head"]').getAttribute('aria-pressed'),'true',
       'Enter en una tarjeta colocada debe seleccionarla');
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] [data-gallery-card="eu_auth_head"]').count(),1,
       'No debe moverse al seleccionarla');
     await page.locator('[data-gallery-zone="eu_liberal"]').focus();
     await page.keyboard.press('Enter');
     assert.equal(await page.locator('[data-gallery-zone="eu_liberal"] [data-gallery-card="eu_auth_head"]').count(),1,
       'Enter en otro destino debe recolocar la tarjeta');

     await page.locator('[data-gallery-zone="eu_liberal"] [data-gallery-card="eu_auth_head"]').focus();
     await page.keyboard.press('Delete');
     assert.equal(await page.locator('.gal-tray [data-gallery-card="eu_auth_head"]').count(),1,
       'Suprimir debe devolver una cartela no confirmada a la mesa');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
       'La vista docente no puede registrar respuestas');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Galería móvil: bandera original y cuatro vitrinas accesibles sin desbordes',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery',{width:390,height:844});
   try{
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('.gal-vitrine').count(),4);
     assert.equal(await page.locator('.gal-vitrine-eu .gal-flag-illustration').count(),1);
     assert.equal(await page.locator('.gal-tile').count(),20);
     assert.equal(await page.locator('.gal-museum-set').count(),1);
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/m1-museo-cinematico-vacio-movil.png',fullPage:true,animations:'disabled'});
     await page.screenshot({path:'test-output/m1-museo-cupulas-v3-movil.png',fullPage:true,animations:'disabled'});
     const metrics=await page.evaluate(()=>{
       const cabinets=[...document.querySelectorAll('.gal-vitrine')].map(el=>{
         const r=el.getBoundingClientRect();
         return {left:r.left,right:r.right,width:r.width};
       });
       return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,cabinets};
     });
     assert.ok(metrics.scrollWidth<=metrics.viewport+2,JSON.stringify(metrics));
     assert.ok(metrics.cabinets.every(c=>c.left>=-2&&c.right<=metrics.viewport+2&&c.width>270),JSON.stringify(metrics));
     const mobileCards=await page.locator('.gal-tray [data-gallery-card]').evaluateAll(cards=>{
       const positions=cards.map(c=>{const r=c.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
       return {firstFour:positions.slice(0,4),narrow:positions.filter(p=>p.w<100).length};
     });
     assert.equal(mobileCards.narrow,0,'En móviles no deben comprimirse las tarjetas hasta poner el texto vertical');
     assert.ok(mobileCards.firstFour[0].y===mobileCards.firstFour[1].y&&
       mobileCards.firstFour[0].y<mobileCards.firstFour[2].y,
       'En móvil debe haber dos columnas de cartelas legibles');
     await setCard(page,'ru_tsar','ru');
     assert.equal(await page.locator('[data-gallery-zone="ru"] [data-gallery-card="ru_tsar"]').count(),1);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Alumno: las tarjetas pendientes sobreviven a una recarga, sin desbloquear el juego',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery');
   try{
     await waitVisible(page,'.gal-hall');
     await setCard(page,'eu_army','eu_auth');
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] .gal-tile-placed').count(),1);
     await page.reload({waitUntil:'domcontentloaded'});
     await page.locator('.c-museo-m1').click();
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] .gal-tile-placed').count(),1);
     assert.equal(await page.locator('[data-gallery-action="next"]').count(),0);
     // Cancelar no debe borrar el trabajo de todo el equipo.
     page.once('dialog',d=>d.dismiss());
     await page.locator('[data-gallery-action="reset"]').click();
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] .gal-tile-placed').count(),1);
     assert.equal((await page.evaluate(()=>window.__smokeRpcCalls))
       .filter(name=>name==='gallery_draft_reset').length,0,
       'La cancelación no debe escribir nada en Supabase');
     page.once('dialog',d=>d.accept());
     await page.locator('[data-gallery-action="reset"]').click();
     await page.waitForFunction(()=>document.querySelector('.gal-shared-banner')?.textContent?.includes('Sinkronizatuta')
       &&document.querySelectorAll('.gal-zone .gal-tile-placed').length===0);
     assert.ok((await page.evaluate(()=>window.__smokeRpcCalls)).includes('gallery_draft_reset'),
       'El reinicio se registra en el borrador compartido antes de recargar');
     await page.reload({waitUntil:'domcontentloaded'});
     await page.locator('.c-museo-m1').click();
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] .gal-tile-placed').count(),0);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
       'La recarga del borrador vacío no debe escribir en Supabase');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Galería: cuatro tarjetas autoritarias y cinco liberales visibles sin recorte',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery');
   try{
     await waitVisible(page,'.gal-hall');
     for(const id of ['eu_auth_head','eu_army','eu_monarch','eu_parliament'])await setCard(page,id,'eu_auth');
     for(const id of ['eu_liberal_head','eu_separation','eu_rights','eu_vote','eu_social'])await setCard(page,id,'eu_liberal');
     const result=await verifyCardsInsideZones(page);
     assert.deepEqual(result.map(x=>x.items),[4,5]);
     assert.deepEqual(result.map(x=>x.overflow),[0,0]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Galería: las nueve tarjetas europeas también quedan visibles en tableta',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery',{width:768,height:1024});
   try{
     await waitVisible(page,'.gal-hall');
     for(const id of ['eu_auth_head','eu_army','eu_monarch','eu_parliament'])await setCard(page,id,'eu_auth');
     for(const id of ['eu_liberal_head','eu_separation','eu_rights','eu_vote','eu_social'])await setCard(page,id,'eu_liberal');
     const result=await verifyCardsInsideZones(page);
     assert.deepEqual(result.map(x=>x.items),[4,5]);
     assert.deepEqual(result.map(x=>x.overflow),[0,0]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Cuenta heredada: el sello OSATUTA no permite saltarse los cinco ejercicios nuevos',async()=>{
   for(const path of [
     'bi-sistema.html?smoke_badges=1',
     'inperialismoaren-definizioa.html?smoke_badges=1',
     'inperioen-aztarnak.html?smoke_badges=1',
     'esaldiak-osatu.html?smoke_badges=1'
   ]){
     const {page,context,errors}=await open('student',path);
     try{
       await waitVisible(page,'.gal-hall');
       assert.ok(page.url().includes('index.html'),path+' debe volver al primer juego');
       assert.equal(await page.locator('.m1-nav[data-m1-role="student"]').count(),1);
     assert.equal(await page.locator('.m1-nav-links a').count(),1,
       'El primer ejercicio es el único acceso sin logros confirmados');
       assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
       assert.deepEqual(errors,[]);
     }finally{await context.close()}
   }
   const {page,context,errors}=await open('student','index.html?smoke_badges=1#mission1gallery');
   try{
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('.gal-action-next').count(),0,
       'Un sello antiguo no debe activar el paso al segundo juego');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Alumno: la segunda pantalla no se abre si la primera está pendiente',async()=>{
   const {page,context,errors}=await open('student','bi-sistema.html');
   try{
     await waitVisible(page,'.gal-hall');
     assert.ok(page.url().includes('index.html'));
     assert.equal(await page.locator('.m1-nav[data-m1-role="student"]').count(),1);
     assert.equal(await page.locator('.m1-nav-links a').count(),1,
       'El primer ejercicio es el único acceso sin logros confirmados');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Alumno: segundo ejercicio sin pistas, borrador recuperable y dos fases completas',async()=>{
    const {page,context,errors}=await open('student','bi-sistema.html?smoke_m1_steps=1');
    try{
      await waitVisible(page,'#bi-stage');
      await page.waitForTimeout(300);
      // Seleccionar una cartela no debe destruir el botón enfocado.
      await page.locator('[data-bi-card="army"]').focus();
      await page.evaluate(()=>{
        window.__biStableCard=document.querySelector('[data-bi-card="army"]');
      });
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('[data-bi-card="army"]').getAttribute('aria-pressed'),'true');
      assert.equal(await page.evaluate(()=>
        window.__biStableCard===document.querySelector('[data-bi-card="army"]')),true,
        'La selección en el segundo ejercicio mantiene el botón montado');
      await page.keyboard.press('Enter');
      const put=async(id,zone)=>{
        await page.locator('[data-bi-card="'+id+'"]').click();
        await page.evaluate(z=>document.querySelector('[data-bi-target="'+z+'"]')
          .dispatchEvent(new MouseEvent('click',{bubbles:true})),zone);
        await page.waitForFunction(card=>!!document.querySelector('[data-bi-target] .bi-card-placed[data-bi-card="'+card+'"]'),id);
      };
      await put('army','auth');await put('monarch','auth');
      assert.equal(await page.locator('#bi-check').isDisabled(),true,
        'No corregir antes de que estén todas las cartelas');
      await page.reload({waitUntil:'domcontentloaded'});
      await waitVisible(page,'#bi-stage');
      await page.waitForFunction(()=>document.querySelectorAll('.bi-card-placed').length===2);
      assert.equal(await page.locator('#bi-check').isDisabled(),true,
        'El borrador se restaura sin revelar aciertos');
      for(const [id,zone] of [
        ['parliament','auth'],['separation','lib'],['rights','lib'],
        ['suffrage','lib'],['socialist','lib']])await put(id,zone);
      assert.equal(await page.locator('#bi-check').isEnabled(),true);
      // Playwright desplaza el botón al área visible y comprueba si puede
      // recibir eventos sin ejecutar todavía la corrección del ejercicio.
      await page.locator('#bi-check').click({trial:true,timeout:5000});
      await page.locator('#bi-check').click();
      await page.waitForFunction(()=>document.querySelector('#bi-stage')?.dataset.phase==='challenge');
      assert.equal(await page.locator('.bi-card.bi-locked').count(),7);
      assert.equal(await page.locator('#bi-check-cases').isDisabled(),true);
      await page.locator('[data-case="case_monarch"][data-choice="auth"]').click();
      await page.locator('[data-case="case_rights"][data-choice="lib"]').click();
      assert.equal(await page.locator('#bi-check-cases').isEnabled(),true);
      await page.locator('#bi-check-cases').click();
      await page.waitForFunction(()=>document.querySelector('#bi-stage')?.dataset.phase==='complete');
      assert.equal(await page.locator('.bi-challenge-next').count(),1);
      const calls=await page.evaluate(()=>window.__smokeRpcCalls.filter(n=>n==='bi_sistema_draft_submit'));
      assert.equal(calls.length,2);
      assert.deepEqual(errors,[]);
    }finally{await context.close()}
  });
  await scenario('Profesor: abre directamente el primer ejercicio y todos los controles de vista previa sin guardar',async()=>{
    const {page,context,errors}=await open('teacher','index.html');
    try{
      await waitVisible(page,'#teacher-preview-gallery');
      await page.locator('#teacher-preview-gallery').click();
      await waitVisible(page,'.gal-hall');
      assert.equal(await page.locator('.m1-stage-tools').count(),1);
      assert.equal(await page.locator('.gal-flag-illustration').count(),4);
      assert.equal(await page.locator('[data-gallery-action="next"]').count(),1);
      assert.equal(await page.locator('.m1-teacher-label').count(),1);
      await page.locator('[data-gallery-action="preview-complete"]').click();
      assert.equal(await page.locator('.gal-preview-ribbon').count(),1);
      assert.equal(await page.locator('[data-gallery-action="check"]').isDisabled(),true);
      assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
      assert.deepEqual(errors,[]);
    }finally{await context.close()}
  });
  await scenario('Alumno: no puede abrir directamente los ejercicios tercero y cuarto',async()=>{
   for(const path of ['inperialismoaren-definizioa.html','inperioen-aztarnak.html']){
     const {page,context,errors}=await open('student',path);
     try{
       await waitVisible(page,'.gal-hall');
       assert.ok(page.url().includes('index.html'),path);
       assert.deepEqual(errors,[]);
     }finally{await context.close()}
   }
 });
 await scenario('Alumno: tampoco puede abrir directamente el quinto ejercicio',async()=>{
   const {page,context,errors}=await open('student','esaldiak-osatu.html');
   try{
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('.m1-nav[data-m1-role="student"]').count(),1);
     assert.equal(await page.locator('.m1-nav-links a').count(),1,
       'El primer ejercicio es el único acceso sin logros confirmados');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Medallones: acceso libre para profesor y recorrido por logros para alumno',async()=>{
   const teacher=await open('teacher','bi-sistema.html?preview=1',{width:1365,height:900});
   try{
     await waitVisible(teacher.page,'.m1-nav[data-m1-role="teacher"]');
     assert.equal(await teacher.page.locator('.m1-route-stop').count(),5);
     assert.equal(await teacher.page.locator('.m1-nav-links a').count(),5);
     assert.equal(await teacher.page.locator('.m1-route-stop.is-current').count(),1);
     assert.equal(await teacher.page.locator('.m1-route-stop.is-locked').count(),0);
     assert.equal(await teacher.page.locator('.m1-nav-num').count(),5);
     const wood=await teacher.page.locator('.m1-nav').evaluate(el=>getComputedStyle(el).backgroundImage);
     assert.match(wood,/gradient/);
     // El concepto 2 debe reproducirse como un elemento museístico material,
     // no como cinco botones verdes planos.
     const relief=await teacher.page.locator('.m1-museum-route').evaluate(nav=>{
       const num=nav.querySelector('.m1-nav-num');
       const plaque=nav.querySelector('.m1-nav-label');
       const current=nav.querySelector('.m1-route-stop.is-current .m1-nav-num');
       const outer=getComputedStyle(nav);
       return {
         frame:outer.backgroundImage,
         border:outer.borderTopWidth,
         ornament:getComputedStyle(nav,'::before').backgroundImage,
         navHeight:nav.getBoundingClientRect().height,
         coinWidth:num.getBoundingClientRect().width,
         wreath:getComputedStyle(num,'::after').backgroundImage,
         plaqueHeight:plaque.getBoundingClientRect().height,
         navLinkCount:nav.querySelectorAll('.m1-nav-links a').length,
         labelsVisible:[...nav.querySelectorAll('.m1-nav-label')].every(el=>{
           const rect=el.getBoundingClientRect();
           return rect.height>35&&el.scrollHeight<=el.clientHeight+2;
         }),
         activeBackground:getComputedStyle(current).backgroundImage,
         rail:getComputedStyle(nav.querySelector('.m1-nav-links'),'::before').backgroundImage
       };
     });
     assert.ok(relief.coinWidth>=54&&relief.coinWidth<=65&&
       relief.plaqueHeight>=39&&relief.plaqueHeight<=57,
       'Los medallones de escritorio deben ser compactos y las cartelas legibles');
     assert.ok(relief.navHeight<=185&&relief.navHeight>=125,
       'El friso debe dejar más pantalla al juego: altura '+relief.navHeight+'px');
     assert.equal(relief.labelsVisible,true,'Ningún título museístico debe quedar cortado');
     assert.equal(relief.navLinkCount,5);
     assert.match(relief.ornament,/m1-roleau-esquina\.svg/);
     assert.match(relief.wreath,/m1-laurel-bronce\.svg/);
     assert.match(relief.frame,/m1-textura-madera\.svg/);
     assert.match(relief.rail,/gradient/);
     assert.match(relief.activeBackground,/conic-gradient/);
     const assets=await teacher.page.evaluate(async()=>Promise.all(
       ['m1-laurel-bronce.svg','m1-roleau-esquina.svg','m1-textura-madera.svg']
         .map(async name=>({name,status:(await fetch('./assets/'+name)).status}))));
     assert.ok(assets.every(x=>x.status===200),
       'Deben publicarse los grabados, laureles y vetas usados en la barra');
     await mkdir('test-output',{recursive:true});
     await teacher.page.screenshot({
       path:'test-output/m1-medallones-compactos-docente-escritorio.png',
       fullPage:false,animations:'disabled'
     });
     await teacher.page.locator('.m1-route-stop[data-m1-step="4"]').click();
     await teacher.page.waitForURL(/inperioen-aztarnak\.html\?preview=1/);
     await waitVisible(teacher.page,'.m1-nav[data-m1-role="teacher"]');
     assert.equal(await teacher.page.locator('.m1-route-stop[aria-current="page"]').getAttribute('data-m1-step'),'4');
     assert.deepEqual(await teacher.page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(teacher.errors,[]);
   }finally{await teacher.context.close()}
   for(const [steps,pageName,current] of [
     [0,'index.html',1],
     [1,'bi-sistema.html',2],
     [2,'inperialismoaren-definizioa.html',3],
     [3,'inperioen-aztarnak.html',4],
     [4,'esaldiak-osatu.html',5]
   ]){
     const route=pageName==='index.html'
       ?'index.html?smoke_m1_steps='+steps+'#mission1gallery'
       :pageName+'?smoke_m1_steps='+steps;
     const {page,context,errors}=await open('student',route,{width:1365,height:900});
     try{
       await waitVisible(page,'.m1-nav[data-m1-role="student"]');
       assert.equal(await page.locator('.m1-route-stop').count(),5);
       assert.equal(await page.locator('.m1-nav-links a').count(),steps+1,
         'Alumno desbloquea exclusivamente '+(steps+1)+' salas');
       assert.equal(await page.locator('.m1-route-stop.is-locked').count(),4-steps);
       assert.equal(await page.locator('.m1-route-stop[aria-current="page"]').getAttribute('data-m1-step'),String(current));
       assert.equal(await page.locator('.m1-route-stop.is-done').count(),steps);
       if(steps===2)await page.screenshot({
         path:'test-output/m1-medallones-compactos-alumno-tercer-ejercicio.png',
         fullPage:false,animations:'disabled'
       });
       assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
       assert.deepEqual(errors,[]);
     }finally{await context.close()}
   }
 });
 await scenario('Alumno: cada ejercicio se abre cuando el anterior consta completado en Supabase',async()=>{
   for(const [file,steps,selector] of [
     ['bi-sistema.html',1,'#bi-stage'],
     ['inperialismoaren-definizioa.html',2,'#check'],
     ['inperioen-aztarnak.html',3,'.history-file'],
     ['esaldiak-osatu.html',4,'#verify']
   ]){
     const {page,context,errors}=await open('student',file+'?smoke_m1_steps='+steps);
     try{
       await waitVisible(page,selector);
       await page.waitForTimeout(550);
       assert.ok(page.url().includes(file),file+' no debe redirigir cuando el estado real anterior existe');
       assert.deepEqual(errors,[]);
       assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     }finally{await context.close()}
   }
 });
 await scenario('Tercer juego: borrador compartido sobrevive a recarga y corrección sin pistas',async()=>{
   const {page,context,errors}=await open('student','inperialismoaren-definizioa.html?smoke_m1_steps=2');
   try{
     await page.waitForFunction(()=>window.m1ThirdDraftSync?.ready===true);
     assert.equal(await page.locator('#check').isDisabled(),true);
     await page.evaluate(async()=>window.m1ThirdDraftSync.move('capital','resources',null));
     await page.waitForFunction(()=>document.querySelector('[data-piece="capital"]')?.classList.contains('placed'));
     await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.m1ThirdDraftSync?.ready===true);
     assert.equal(await page.locator('[data-piece="capital"]').evaluate(el=>el.classList.contains('placed')),true);
     await page.evaluate(async()=>{
       const draft=window.m1ThirdDraftSync;
       for(const [id,slot] of [['exploit','purpose'],['dominion','outcome'],['conqueror','metropole'],['conquered','colony']])
         await draft.move(id,slot,null);
     });
     await page.waitForFunction(()=>!document.querySelector('#check')?.disabled);
     await page.locator('#check').click();
     await page.waitForFunction(()=>document.querySelector('#message')?.textContent?.includes('Ez da zuzena'));
     assert.equal(await page.locator('.scene.solved').count(),0);
     assert.ok((await page.evaluate(()=>window.__smokeRpcCalls)).includes('mission1_draft_submit'));
     assert.ok(!(await page.evaluate(()=>window.__smokeRpcCalls)).includes('submit_mission1_exercise'),
       'La corrección debe consultar el borrador confirmado en el servidor');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Quinto juego: palabras compartidas, recarga y error global sin pistas',async()=>{
   const {page,context,errors}=await open('student','esaldiak-osatu.html?smoke_m1_steps=4');
   try{
     await page.waitForFunction(()=>window.m1FifthDraftSync?.ready===true);
     await page.evaluate(async()=>window.m1FifthDraftSync.move('koloniak','1',null));
     await page.waitForFunction(()=>document.querySelector('.hole[data-slot="1"]')?.textContent==='koloniak');
     await page.reload({waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.m1FifthDraftSync?.ready===true);
     assert.equal(await page.locator('.hole[data-slot="1"]').textContent(),'koloniak');
     await page.evaluate(async()=>{
       const draft=window.m1FifthDraftSync;
       for(const [word,slot] of [['inperialismoa','2'],['metropoliak','3'],['ustiapena','4'],['nagusitasuna','5']])
         await draft.move(word,slot,null);
     });
     await page.waitForFunction(()=>!document.querySelector('#verify')?.disabled);
     await page.locator('#verify').click();
     await page.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('Ez da zuzena'));
     assert.equal(await page.locator('#success').isVisible(),false);
     assert.equal(await page.locator('#m1-passport-reward .mp-earned').count(),0);
     const calls=await page.evaluate(()=>window.__smokeRpcCalls);
     assert.ok(calls.includes('mission1_draft_submit'));
     assert.ok(!calls.includes('submit_mission1_exercise'));
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Alumno: al volver al tercer ejercicio superado puede continuar sin repetirlo',async()=>{
   const {page,context,errors}=await open('student','inperialismoaren-definizioa.html?smoke_m1_steps=3');
   try{
     await waitVisible(page,'#m1-third-resume a');
     assert.equal(await page.locator('#result').isVisible(),false,
       'No se deben mostrar las respuestas de una partida anterior');
     const next=page.locator('#m1-third-resume a');
     assert.match(await next.innerText(),/4\. ariketa/);
     assert.equal(await next.getAttribute('href'),'./inperioen-aztarnak.html');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     await next.click();
     await page.waitForURL(/inperioen-aztarnak\.html/);
     await waitVisible(page,'.history-file');
     assert.deepEqual(errors,[]);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
   }finally{await context.close()}
 });
 await scenario('Cierre temporal: el alumno conserva el pasaporte pero no entra en misión 2',async()=>{
   const {page,context,errors}=await open('student','esaldiak-osatu.html?smoke_m1_steps=5&smoke_m2_closed=1');
   try{
     await waitVisible(page,'#success');
     assert.equal(await page.locator('#m1-passport-reward .mp-medal').isVisible(),true);
     assert.equal(await page.locator('#mission2-link').getAttribute('href'),'./index.html');
     assert.match(await page.locator('#completion-copy').innerText(),/irakasleak irekiko du/);
     await page.goto(new URL('inperialismoaren-faktoreak.html',BASE).href);
     await waitVisible(page,'.m2-message-card');
     assert.match(await page.locator('.m2-message-card').innerText(),/Bigarren misioa blokeatuta/);
     assert.equal(await page.locator('.m2-steps').count(),0);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Alumno: al regresar al quinto ejercicio ve el sello, accede a misión 2 y puede repetir opcionalmente',async()=>{
   const {page,context,errors}=await open('student','esaldiak-osatu.html?smoke_m1_steps=5');
   try{
     await waitVisible(page,'#success');
     assert.match(await page.locator('#completion-title').innerText(),/Lehen misioa osatuta/);
     assert.equal(await page.locator('#m1-passport-reward .mp-earned').count(),1);
     assert.equal(await page.locator('#m1-passport-reward .mp-medal').isVisible(),true);
     assert.equal(await page.locator('#mission2-link').getAttribute('href'),'./index.html#mission2');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
       'Recuperar el sello no vuelve a registrar intentos');
     await page.locator('#review').click();
     assert.equal(await page.locator('#success').isVisible(),false);
     assert.equal(await page.locator('#verify').isDisabled(),true);
     assert.equal(await page.locator('.word.selected').count(),0);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
       'Repetir las frases sin guardar debe ser una acción local');
     await page.reload({waitUntil:'domcontentloaded'});
     await waitVisible(page,'#success');
     await page.locator('#mission2-link').click();
     await page.waitForURL(/inperialismoaren-faktoreak\.html/);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Profesor: puede abrir la galería y su pantalla final sin guardar',async()=>{
   const {page,context,errors}=await open('teacher','index.html#teacherpreviewgallery');
   try{
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('.m1-nav-links a').count()>=5,true);
     await page.locator('[data-gallery-action="preview-complete"]').click();
     assert.equal(await page.locator('.gal-action-next').count(),1);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Profesor: segundo ejercicio, navegación y fases sin guardar',async()=>{
   const {page,context,errors}=await open('teacher','bi-sistema.html?preview=1',{width:1672,height:941});
   try{
     await waitVisible(page,'.m1-nav');
     await waitVisible(page,'#bi-stage');
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/m1-ejercicio2-bi-sistema-actual.png',fullPage:true,animations:'disabled'});
     const parchmentSheet=page.locator('link[href*="bi-sistema-pergamino-20261121.css"]');
     assert.equal(await parchmentSheet.count(),1,'El ejercicio 2 debe cargar las cartelas de pergamino');
     assert.equal(await page.locator('.bi-desk-chips .bi-card-tray').count(),7);
     const clipping=await page.locator('.bi-desk-chips .bi-card-tray').evaluateAll(cards=>cards.map(card=>{
       const word=card.querySelector('.bi-card-word');
       const range=document.createRange();range.selectNodeContents(word);
       const r=card.getBoundingClientRect();
       const rects=[...range.getClientRects()];
       return {id:card.dataset.biCard,width:Math.round(r.width),height:Math.round(r.height),
         overflow:rects.some(x=>x.left<r.left-1||x.right>r.right+1||x.top<r.top-1||x.bottom>r.bottom+1)};
     }));
     assert.ok(clipping.every(c=>!c.overflow),'No debe sobresalir ningún texto de la mesa: '+JSON.stringify(clipping));
     const socialist=clipping.find(c=>c.id==='socialist');
     assert.ok(socialist.width>clipping[0].width*1.5,'La cartela socialista debe aprovechar el hueco libre de la fila');
     await page.screenshot({path:'test-output/m1-ejercicio2-pergamino-actual.png',fullPage:true,animations:'disabled'});
     await page.locator('.bi-desk-chips [data-bi-card="socialist"]').click();
     await page.locator('#bi-lib-slots').click({position:{x:30,y:30}});
     assert.equal(await page.locator('#bi-lib-slots [data-bi-card="socialist"]').count(),1,
       'La nueva cartela debe seguir siendo interactiva');
     await page.screenshot({path:'test-output/m1-ejercicio2-pergamino-colocada.png',fullPage:true,animations:'disabled'});
     await page.getByRole('button',{name:'Amaierako pantaila'}).click();
     assert.equal(await page.locator('#bi-stage').getAttribute('data-phase'),'complete');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Segundo ejercicio móvil: pergamino legible, siete conceptos y sin desbordes',async()=>{
   const {page,context,errors}=await open('teacher','bi-sistema.html?preview=1',{width:390,height:844});
   try{
     await waitVisible(page,'#bi-stage');
     await page.locator('.bi-desk-chips .bi-card-tray').first().waitFor({state:'visible'});
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/m1-ejercicio2-pergamino-movil.png',fullPage:true,animations:'disabled'});
     const cardBoxes=await page.locator('.bi-desk-chips .bi-card-tray').evaluateAll(cards=>cards.map(c=>{
       const box=c.getBoundingClientRect();
       const word=c.querySelector('.bi-card-word');
       const range=document.createRange();range.selectNodeContents(word);
       return {id:c.dataset.biCard,width:Math.round(box.width),
         overflow:[...range.getClientRects()].some(r=>r.right>box.right+1||r.bottom>box.bottom+1||r.left<box.left-1||r.top<box.top-1),
         outsideViewport:box.left<0||box.right>innerWidth+1};
     }));
     assert.equal(cardBoxes.length,7);
     assert.ok(cardBoxes.every(c=>!c.overflow&&!c.outsideViewport),
       'Las cartelas móviles deben caber completamente: '+JSON.stringify(cardBoxes));
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Profesor: ejercicios tercero y cuarto y pantallas finales sin guardar',async()=>{
   const views=[
     {path:'inperialismoaren-definizioa.html?preview=1',after:'.scene.solved'},
     {path:'inperioen-aztarnak.html?preview=1',after:'#dossier-heading'}
   ];
   for(const {path,after} of views){
     const {page,context,errors}=await open('teacher',path);
     try{
       await waitVisible(page,'.m1-nav');
       await page.getByRole('button',{name:'Amaierako pantaila'}).click();
       await waitVisible(page,after);
       assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
       assert.deepEqual(errors,[]);
     }finally{await context.close()}
   }
 });
 await scenario('Cuarto ejercicio: círculo naranja al elegir y tic verde solo al comprobar',async()=>{
   const {page,context,errors}=await open('teacher','inperioen-aztarnak.html?preview=1',{width:1365,height:900});
   try{
     await waitVisible(page,'.m1-nav');
     await page.locator('.history-file[data-file="india"] button').click();
     await waitVisible(page,'.dossier-sheet--case');
     const opened=page.locator('details[data-clue]');
     assert.equal(await opened.count(),3);
     await opened.evaluateAll(elements=>elements.forEach(item=>{item.open=true}));
     await page.waitForFunction(()=>[...document.querySelectorAll('input[name="choice"]')].every(el=>!el.disabled),{timeout:10000});
     const selected=page.locator('.dossier-choice').first();
     await selected.click();
     assert.equal(await selected.locator('input').isChecked(),true);
     assert.equal(await selected.evaluate(el=>el.classList.contains('is-verified')),false);
     const orange=await selected.evaluate(el=>{
       const style=getComputedStyle(el,'::after');
       return {content:style.content,background:style.backgroundImage};
     });
     assert.equal(orange.content,'""','La opción elegida no muestra ningún tic');
     assert.match(orange.background,/246, 165, 62/,'El círculo de selección es naranja');
     await selected.evaluate(el=>el.classList.add('is-verified'));
     const confirmed=await selected.evaluate(el=>{
       const style=getComputedStyle(el,'::after');
       return {content:style.content,background:style.backgroundImage};
     });
     assert.match(confirmed.content,/✓/,'La marca verde aparece al confirmar respuesta correcta');
     assert.match(confirmed.background,/214, 241, 221/,'Se mantiene el acabado verde anterior');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],'La comprobación visual no escribe en Supabase');
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Cuatro grabados coloniales: WebP intactos y descargables en el navegador',async()=>{
   const {page,context,errors}=await open('teacher','inperioen-aztarnak.html?preview=1');
   try{
     await waitVisible(page,'.m1-nav');
     const photos=await page.evaluate(async()=>{
       return await Promise.all(['aljeria','angola','india','indonesia'].map(async name=>{
         const response=await fetch('./assets/inperioen-art-'+name+'-v5.webp');
         const bytes=new Uint8Array(await response.arrayBuffer());
         return {name,ok:response.ok,bytes:bytes.length,
           riff:String.fromCharCode(...bytes.subarray(0,4))==='RIFF',
           webp:String.fromCharCode(...bytes.subarray(8,12))==='WEBP'};
       }));
     });
     assert.ok(photos.every(p=>p.ok&&p.bytes>600000&&p.riff&&p.webp),
      'Algún expediente perdió su imagen original: '+JSON.stringify(photos));
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Profesor: quinto ejercicio, final simulado sin guardar',async()=>{
   const {page,context,errors}=await open('teacher','esaldiak-osatu.html?preview=1');
   try{
     await waitVisible(page,'.m1-nav');
     await page.getByRole('button',{name:'Amaierako pantaila'}).click();
     assert.equal(await page.locator('#success').isVisible(),true);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Intervención 2: deshacer cartela sin escrituras en la galería del profesor',async()=>{
  const {page,context,errors}=await open('teacher','index.html?teacherpanel=1#teacherpreviewgallery');
  try{
   await waitVisible(page,'[data-gallery-card]');
   const card=page.locator('[data-gallery-card]').first(),id=await card.getAttribute('data-gallery-card');
   await card.click();
   await page.locator('[data-gallery-zone]').first().click({force:true});
   await page.waitForFunction(id=>!!document.querySelector('[data-gallery-card="'+id+'"].gal-tile-placed'),id);
   await page.waitForFunction(()=>!document.querySelector('[data-gallery-action="undo"]')?.disabled);
   await page.locator('[data-gallery-action="undo"]').click();
   await page.waitForFunction(id=>!document.querySelector('[data-gallery-card="'+id+'"].gal-tile-placed'),id);
   assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Intervención 2: profesor prueba las dos elecciones finales sin enviar respuestas',async()=>{
  const {page,context,errors}=await open('teacher','bi-sistema.html?preview=1');
  try{
   await waitVisible(page,'#bi-stage');
   await page.getByRole('button',{name:'Azken erronka'}).click();
   await waitVisible(page,'#bi-check-cases');
   assert.equal(await page.locator('#bi-check-cases').isDisabled(),true);
   await page.locator('[data-case="case_monarch"][data-choice="auth"]').click();
   await page.locator('[data-case="case_rights"][data-choice="lib"]').click();
   assert.equal(await page.locator('#bi-check-cases').isEnabled(),true);
   await page.locator('#bi-check-cases').click();
   await page.waitForFunction(()=>document.querySelector('#bi-stage')?.dataset.phase==='complete');
   assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Intervención 2: deshacer y reiniciar en los ejercicios compartidos 3 y 5',async()=>{
  const third=await open('student','inperialismoaren-definizioa.html?smoke_m1_steps=2');
  try{
   await third.page.waitForFunction(()=>window.m1ThirdDraftSync?.ready===true);
   await third.page.locator('[data-piece="capital"]').click();
   await third.page.locator('[data-slot="purpose"]').click({force:true});
   await third.page.waitForFunction(()=>!document.querySelector('#undo-last')?.disabled);
   await third.page.locator('#undo-last').click();
   await third.page.waitForFunction(()=>!document.querySelector('[data-piece="capital"]')?.classList.contains('placed'));
   assert.deepEqual(third.errors,[]);
  }finally{await third.context.close()}
  const fifth=await open('student','esaldiak-osatu.html?smoke_m1_steps=4');
  try{
   await fifth.page.waitForFunction(()=>window.m1FifthDraftSync?.ready===true);
   await fifth.page.locator('.word[data-word="koloniak"]').click({force:true});
   await fifth.page.locator('.hole[data-slot="1"]').click({force:true});
   await fifth.page.waitForFunction(()=>!document.querySelector('#undo-last')?.disabled);
   await fifth.page.locator('#undo-last').click();
   await fifth.page.waitForFunction(()=>document.querySelector('.hole[data-slot="1"]')?.textContent==='');
   assert.equal(await fifth.page.locator('#reset-draft').isDisabled(),true);
   await fifth.page.locator('.word[data-word="koloniak"]').click({force:true});
   await fifth.page.locator('.hole[data-slot="1"]').click({force:true});
   await fifth.page.waitForFunction(()=>!document.querySelector('#reset-draft')?.disabled);
   fifth.page.once('dialog',d=>d.accept());
   await fifth.page.locator('#reset-draft').click();
   await fifth.page.waitForFunction(()=>document.querySelector('.hole[data-slot="1"]')?.textContent==='');
   assert.deepEqual(fifth.errors,[]);
  }finally{await fifth.context.close()}
 });
 await scenario('Intervención 2: siguiente expediente y regreso a la pantalla final',async()=>{
  const fourth=await open('teacher','inperioen-aztarnak.html?preview=1');
  try{
   await waitVisible(fourth.page,'.m1-nav');
   await fourth.page.locator('#next-pending-dossier').click();
   await waitVisible(fourth.page,'.dossier-sheet--case');
   assert.match(await fourth.page.locator('#dossier-heading').textContent(),/India/i);
   assert.deepEqual(await fourth.page.evaluate(()=>window.__smokeRpcCalls),[]);
   assert.deepEqual(fourth.errors,[]);
  }finally{await fourth.context.close()}
  const fifth=await open('teacher','esaldiak-osatu.html?preview=1');
  try{
   await waitVisible(fifth.page,'.m1-nav');
   await fifth.page.getByRole('button',{name:'Amaierako pantaila'}).click();
   await waitVisible(fifth.page,'#success');
   await fifth.page.locator('#review').click();
   assert.equal(await fifth.page.locator('#success').isVisible(),false);
   await fifth.page.locator('#reopen-success').click();
   assert.equal(await fifth.page.locator('#success').isVisible(),true);
   assert.deepEqual(await fifth.page.evaluate(()=>window.__smokeRpcCalls),[]);
   assert.deepEqual(fifth.errors,[]);
  }finally{await fifth.context.close()}
 });
 await scenario('Salas 3 y 5: panorámica móvil centrada, accesible, reversible y sin envíos',async()=>{
   for(const [n,path,step] of [
     [3,'inperialismoaren-definizioa.html',2],
     [5,'esaldiak-osatu.html',4]
   ]){
     for(const role of ['student','teacher']){
       const url=path+(role==='teacher'?'?preview=1':'?smoke_m1_steps='+step);
       const {page,context,errors}=await open(role,url,{width:390,height:844});
       try{
         await waitVisible(page,'.m1-mobile-panorama');
         await page.waitForFunction(()=>{
           const el=document.querySelector('.stage-wrap, .viewport');
           return el&&el.scrollLeft>40;
         });
         const start=await page.locator('.stage-wrap, .viewport').evaluate(el=>({
           left:el.scrollLeft,max:el.scrollWidth-el.clientWidth
         }));
         assert.ok(start.max>300&&Math.abs(start.left-start.max/2)<5,
           'La escena debe iniciar centrada, con sus espacios de juego a la vista');
         const bar=page.locator('.m1-mobile-panorama');
         assert.equal(await bar.getByRole('button').count(),3);
         await bar.getByRole('button',{name:'Panoramaren ezkerraldea ikusi'}).click();
         await page.waitForFunction(()=>document.querySelector('.stage-wrap, .viewport').scrollLeft<30);
         await bar.getByRole('button',{name:'Panoramaren eskuinaldea ikusi'}).click();
         await page.waitForFunction(()=>document.querySelector('.stage-wrap, .viewport').scrollLeft>30);
         assert.equal(await bar.getByRole('button',{name:'Panoramaren erdialdea ikusi'}).isEnabled(),true,
           'Volver al centro debe ser posible incluso si el scroll ya está cerca del centro');
         await bar.getByRole('button',{name:'Panoramaren erdialdea ikusi'}).click();
         await page.waitForFunction(()=>{
           const el=document.querySelector('.stage-wrap, .viewport');
           return Math.abs(el.scrollLeft-(el.scrollWidth-el.clientWidth)/2)<5;
         });
         await page.screenshot({
           path:'test-output/m1-auditoria-ejercicio'+n+'-movil-panorama-corregida-'+role+'.png',
           fullPage:true,animations:'disabled'
         });
         assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
           'La navegación panorámica no puede registrar respuestas ni saltar ejercicios');
         assert.deepEqual(errors,[]);
       }finally{await context.close()}
     }
   }
 });
 await scenario('Auditoría visual: salas 3–5 y transición, móvil/escritorio, sin escribir datos',async()=>{
   const rooms=[
     {n:3,path:'inperialismoaren-definizioa.html?preview=1'},
     {n:4,path:'inperioen-aztarnak.html?preview=1'},
     {n:5,path:'esaldiak-osatu.html?preview=1'}
   ];
   const audited=[];
   await mkdir('test-output',{recursive:true});
   for(const room of rooms){
     for(const layout of [
       {name:'escritorio',width:1365,height:900},
       {name:'movil',width:390,height:844}
     ]){
       const {page,context,errors}=await open('teacher',room.path,{width:layout.width,height:layout.height});
       try{
         await waitVisible(page,'.m1-nav');
         await page.evaluate(()=>document.fonts.ready);
         await page.waitForTimeout(250);
         const slug='m1-auditoria-ejercicio'+room.n+'-'+layout.name;
         await page.screenshot({path:'test-output/'+slug+'-inicio.png',fullPage:true,animations:'disabled'});
         async function inspect(stage){
           const m=await page.evaluate(()=>{
             const d=document.documentElement;
             const width=d.clientWidth;
             const picture=[...document.images].filter(im=>im.getBoundingClientRect().width>5);
             const interactive=[...document.querySelectorAll('button,a,input,select')].filter(el=>{
               const r=el.getBoundingClientRect();const c=getComputedStyle(el);
               return r.width>0&&r.height>0&&c.visibility!=='hidden'&&c.display!=='none';
             });
             return {
               viewport:width,documentWidth:d.scrollWidth,
               overflowPx:Math.max(0,d.scrollWidth-width),
               visibleImages:picture.length,
               unloadedImages:picture.filter(im=>!im.complete||im.naturalWidth===0).map(im=>im.getAttribute('src')),
               controls:interactive.length,
               tinyControls:interactive.filter(el=>{
                 const r=el.getBoundingClientRect();return r.width<28||r.height<28;
               }).slice(0,12).map(el=>({name:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,40),
                 w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})),
               teacherNav:document.querySelectorAll('.m1-nav-links a').length,
               teacherPreview:!!document.querySelector('.m1-teacher-label')
             };
           });
           audited.push({exercise:room.n,device:layout.name,stage,...m});
         }
         await inspect('inicio');
         const finish=page.getByRole('button',{name:'Amaierako pantaila'});
         if(await finish.count()){
           await finish.click();
           await page.waitForTimeout(120);
           await page.screenshot({path:'test-output/'+slug+'-final.png',fullPage:true,animations:'disabled'});
           await inspect('final');
         }
         assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
           'Las capturas docentes no deben enviar respuestas reales');
         assert.deepEqual(errors,[]);
       }finally{await context.close()}
     }
   }
   await writeFile('test-output/m1-auditoria-mediciones.json',JSON.stringify(audited,null,2));
   console.log('AUDITORÍA M1: '+JSON.stringify(audited));
 });
}finally{await browser.close()}
console.log('Resultado: '+passed+' pruebas superadas; '+failed+' fallidas');
if(failed)process.exitCode=1;
