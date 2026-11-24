/* Misión 1 · dos sesiones independientes contra un único servidor simulado.
 * Este archivo NO accede ni escribe en Supabase de producción.
 * La auditoría de RLS real se realiza por separado, con consultas de lectura. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const ROOT=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,channel:process.env.SMOKE_USE_CHROME==='1'?'chrome':undefined,args:['--no-sandbox']});
let passed=0,failed=0;
const clone=x=>structuredClone(x);
function serverFor(exercise){
 const slots=new Map(),revision=new Map(),logs=[],completed=exercise===5?[3]:[];
 const snapshot=n=>({placements:clone(slots.get(n)||{}),revision:revision.get(n)||0});
 const ids={
  3:['capital','exploit','dominion','conqueror','conquered'],
  5:['koloniak','kapitalismoa','nagusitasuna','inperialismoa','ustiapena','metropoliak','merkataritza','dominazioa']
 };
 const legalSlots={3:['purpose','resources','outcome','metropole','colony'],5:['1','2','3','4','5']};
 const rows={
  profiles:[{id:'student-a',role:'student',team_id:'team-classroom',class_id:'class-c'},
            {id:'student-b',role:'student',team_id:'team-classroom',class_id:'class-c'},
            {id:'teacher-t',role:'teacher',team_id:null,class_id:'class-c'}],
  teams:[{id:'team-classroom',name:'Froga taldea',class_id:'class-c'}],
  classes:[{id:'class-c',name:'Proba',teacher_id:'teacher-t'}],
  gallery_team_state:[{team_id:'team-classroom',completed_at:'2026-11-23T16:00:00Z',locked_positions:{}}],
  bi_sistema_team_state:[{team_id:'team-classroom',completed_at:'2026-11-23T16:20:00Z',locked_positions:{},locked_ids:[]}],
  empire_dossier_team_state:exercise===5?[{team_id:'team-classroom',completed_at:'2026-11-23T16:40:00Z',solved_ids:['india','aljeria','indonesia','angola']}]:[],
  mission1_exercise_completions:completed.map(exercise=>({team_id:'team-classroom',exercise})),
  mission_badges:[],mission_completions:[],empire_dossier_clue_reads:[]
 };
 const completedAnswers=()=>false;
 return {
  logs,snapshot,check(){return clone([...slots.entries()])},
  async handle(role,request){
   const isTeacher=role==='teacher';
   if(request.kind==='select'){
    let all=request.table==='mission1_team_drafts'
     ?[...slots].map(([exercise,placements])=>({exercise,team_id:'team-classroom',placements:clone(placements),revision:revision.get(exercise)||0}))
     :clone(rows[request.table]||[]);
    for(const [name,value] of request.filters||[])all=all.filter(row=>String(row[name])===String(value));
    const data=request.single?all[0]||null:all;
    return {data,error:request.single&&!data&&!request.maybe?{message:'Not found'}:null};
   }
   if(request.kind!=='rpc')throw Error('Unrecognized action '+request.kind);
   // Read-only classroom access check; the simulated class is open.
   if(request.name==='class_access_status')return {data:true,error:null};
   if(isTeacher)throw Error('La vista de profesor no puede escribir');
   const {name,args={}}=request;
   logs.push({role,name,exercise:args.p_exercise??null});
   const n=Number(args.p_exercise);
   if(!ids[n])throw Error('Ejercicio no autorizado');
   let current=slots.get(n)||{},rev=revision.get(n)||0;
   if(name==='mission1_draft_move_checked'){
    const old=current[args.p_item]??null,to=args.p_to_slot??null;
    if(args.p_expected_revision!==rev||old!==(args.p_expected_slot??null))
     return {data:{status:'conflict',...snapshot(n)},error:null};
    if(!ids[n].includes(args.p_item)||(to!==null&&!legalSlots[n].includes(to)))
     return {data:null,error:{message:'Invalid piece'}};
    if(old!==to){
     current=clone(current);
     for(const [item,slot] of Object.entries(current))if(item!==args.p_item&&slot===to)delete current[item];
     if(to===null)delete current[args.p_item];else current[args.p_item]=to;
     slots.set(n,current);revision.set(n,++rev);
    }
    return {data:{status:'saved',...snapshot(n)},error:null};
   }
   if(name==='mission1_draft_reset'){
    if(args.p_revision!==rev)return {data:{status:'conflict',...snapshot(n)},error:null};
    slots.set(n,{});revision.set(n,++rev);
    return {data:{status:'saved',...snapshot(n)},error:null};
   }
   if(name==='mission1_draft_submit'){
    if(args.p_revision!==rev)return {data:{status:'conflict',...snapshot(n)},error:null};
    if(Object.keys(current).length!==5)return {data:{status:'incomplete',completed:false,revision:rev},error:null};
    // Este banco de pruebas no evalúa respuestas ni concede insignias.
    return {data:{status:'checked',completed:completedAnswers(),mission_completed:false,revision:rev},error:null};
   }
   throw Error('RPC inesperada '+name);
  }
 };
}
async function open(role,path,server){
 const context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
 await context.route(url=>url.protocol.startsWith('http')&&!['127.0.0.1','localhost'].includes(url.hostname),route=>{
  const url=route.request().url();
  return route.fulfill({status:200,contentType:url.includes('.css')?'text/css':'application/javascript',body:''});
 });
 await context.exposeBinding('__classroom',async(_source,req)=>server.handle(role,req));
 await context.addInitScript(({role})=>{
  window.__classroomOffline=false;
  const userId=role==='teacher'?'teacher-t':role;
  const remote=async data=>{
   if(window.__classroomOffline)throw Error('offline');
   return window.__classroom(data);
  };
  const client={
   auth:{
    getUser:async()=>({data:{user:{id:userId}},error:null}),
    getSession:async()=>({data:{session:{user:{id:userId}}},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
   },
   from(table){
    const filters=[];
    return {
     select(){return this},
     eq(key,value){filters.push([key,value]);return this},
     order(){return this},
     limit(){return this},
     in(){return this},
     maybeSingle(){return remote({kind:'select',table,filters,single:true,maybe:true}).catch(error=>({data:null,error}))},
     single(){return remote({kind:'select',table,filters,single:true}).catch(error=>({data:null,error}))},
     then(ok,bad){return remote({kind:'select',table,filters,single:false}).then(ok,bad)}
    }
   },
   rpc(name,args){return remote({kind:'rpc',name,args}).catch(error=>({data:null,error}))},
   channel(){return {on(){return this},subscribe(){return this}}},
   removeChannel:async()=>{},
  };
  window.supabase={createClient:()=>client};
 },{role});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL(path,ROOT).href,{waitUntil:'domcontentloaded'});
 return {context,page,errors};
}
async function caseRun(label,action){
 try{await action();passed++;console.log('✓ '+label)}
 catch(e){failed++;console.error('✗ '+label);console.error(e?.stack||e)}
}
async function loadReady(page,exercise){
 await page.waitForFunction(n=>n===3?window.m1ThirdDraftSync?.ready===true:window.m1FifthDraftSync?.ready===true,exercise);
}
async function draft(page,exercise){return page.evaluate(n=>(n===3?window.m1ThirdDraftSync:window.m1FifthDraftSync).placements,exercise)}
async function move(page,exercise,id,slot,expected=null){
 return page.evaluate(async ({n,id,slot,expected})=>(n===3?window.m1ThirdDraftSync:window.m1FifthDraftSync).move(id,slot,expected),{n:exercise,id,slot,expected});
}
async function reloadDraft(page,exercise){
 await page.evaluate(n=>(n===3?window.m1ThirdDraftSync:window.m1FifthDraftSync).load(),exercise);
}
try{
 for(const exercise of [3,5]){
  await caseRun('Dos alumnos independientes, revisión CAS y recuperación · ejercicio '+exercise,async()=>{
   const server=serverFor(exercise),pathname=exercise===3?'inperialismoaren-definizioa.html':'esaldiak-osatu.html';
   const query='?classroom=1';
   const first=await open('student-a',pathname+query,server);
   const second=await open('student-b',pathname+query,server);
   try{
    await Promise.all([loadReady(first.page,exercise),loadReady(second.page,exercise)]);
    const [firstId,firstSlot,secondId,secondSlot,thirdId,thirdSlot]=exercise===3?
     ['capital','purpose','exploit','resources','dominion','outcome']:
     ['koloniak','1','metropoliak','2','ustiapena','3'];
    assert.equal(await move(first.page,exercise,firstId,firstSlot),true);
    assert.equal(await move(second.page,exercise,secondId,secondSlot),false,
      'No se acepta una revisión obsoleta en otra sesión');
    await reloadDraft(second.page,exercise);
    assert.equal(await move(second.page,exercise,secondId,secondSlot),true);
    await reloadDraft(first.page,exercise);
    assert.deepEqual(await draft(first.page,exercise),{[firstId]:firstSlot,[secondId]:secondSlot});
    assert.equal(await move(first.page,exercise,thirdId,thirdSlot),true);
    assert.equal(await second.page.evaluate(n=>(n===3?window.m1ThirdDraftSync:window.m1FifthDraftSync).reset(),exercise),false,
      'Un reinicio obsoleto no puede borrar el trabajo ajeno');
    await reloadDraft(second.page,exercise);
    assert.deepEqual(await draft(second.page,exercise),{
     [firstId]:firstSlot,[secondId]:secondSlot,[thirdId]:thirdSlot
    });
    await first.page.reload({waitUntil:'domcontentloaded'});
    await loadReady(first.page,exercise);
    assert.deepEqual(await draft(first.page,exercise),await draft(second.page,exercise));
    assert.equal(server.logs.filter(x=>x.name==='mission1_draft_move_checked').length,4);
    assert.deepEqual(first.errors,[]);assert.deepEqual(second.errors,[]);
   }finally{await first.context.close();await second.context.close()}
  });
  await caseRun('Caída de red y recarga: el cambio pendiente se recupera · ejercicio '+exercise,async()=>{
   const server=serverFor(exercise),pathname=exercise===3?'inperialismoaren-definizioa.html':'esaldiak-osatu.html';
   const a=await open('student-a',pathname,server);
   const b=await open('student-b',pathname,server);
   try{
    await Promise.all([loadReady(a.page,exercise),loadReady(b.page,exercise)]);
    const id=exercise===3?'capital':'koloniak',slot=exercise===3?'purpose':'1';
    await a.page.evaluate(()=>window.__classroomOffline=true);
    assert.equal(await move(a.page,exercise,id,slot),false);
    assert.equal(await a.page.evaluate(n=>(n===3?window.m1ThirdDraftSync:window.m1FifthDraftSync).pending,exercise),true);
    assert.equal(await b.page.evaluate(n=>(n===3?window.m1ThirdDraftSync:window.m1FifthDraftSync).revision,exercise),0);
    await a.page.reload({waitUntil:'domcontentloaded'});
    await loadReady(a.page,exercise);
    assert.deepEqual(await draft(a.page,exercise),{[id]:slot});
    await reloadDraft(b.page,exercise);
    assert.deepEqual(await draft(b.page,exercise),{[id]:slot});
    assert.equal(server.snapshot(exercise).revision,1,
      'La recuperación pendiente no debe duplicar la escritura');
    assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
   }finally{await a.context.close();await b.context.close()}
  });

  await caseRun('Recuperar movimiento sin conexión tras cambio distinto del compañero · ejercicio '+exercise,async()=>{
   const server=serverFor(exercise),pathname=exercise===3?'inperialismoaren-definizioa.html':'esaldiak-osatu.html';
   const a=await open('student-a',pathname,server);
   const b=await open('student-b',pathname,server);
   try{
    await Promise.all([loadReady(a.page,exercise),loadReady(b.page,exercise)]);
    const [firstId,firstSlot,secondId,secondSlot]=exercise===3
     ?['capital','purpose','exploit','resources']
     :['koloniak','1','metropoliak','2'];
    await a.page.evaluate(()=>window.__classroomOffline=true);
    assert.equal(await move(a.page,exercise,firstId,firstSlot),false);
    assert.equal(await move(b.page,exercise,secondId,secondSlot),true);
    await a.page.reload({waitUntil:'domcontentloaded'});
    await loadReady(a.page,exercise);
    await reloadDraft(b.page,exercise);
    const expected={[firstId]:firstSlot,[secondId]:secondSlot};
    assert.deepEqual(await draft(a.page,exercise),expected);
    assert.deepEqual(await draft(b.page,exercise),expected);
    assert.equal(server.snapshot(exercise).revision,2,
      'Ambos movimientos deben guardarse una sola vez');
    assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
   }finally{await a.context.close();await b.context.close()}
  });
  await caseRun('No sobrescribir al compañero al recuperar una misma posición · ejercicio '+exercise,async()=>{
   const server=serverFor(exercise),pathname=exercise===3?'inperialismoaren-definizioa.html':'esaldiak-osatu.html';
   const a=await open('student-a',pathname,server);
   const b=await open('student-b',pathname,server);
   try{
    await Promise.all([loadReady(a.page,exercise),loadReady(b.page,exercise)]);
    const [firstId,secondId,slot]=exercise===3
      ?['capital','exploit','purpose']:['koloniak','metropoliak','1'];
    await a.page.evaluate(()=>window.__classroomOffline=true);
    assert.equal(await move(a.page,exercise,firstId,slot),false);
    assert.equal(await move(b.page,exercise,secondId,slot),true);
    await a.page.reload({waitUntil:'domcontentloaded'});
    await loadReady(a.page,exercise);
    assert.deepEqual(await draft(a.page,exercise),{[secondId]:slot});
    assert.deepEqual(server.snapshot(exercise).placements,{[secondId]:slot});
    assert.equal(server.snapshot(exercise).revision,1,
      'La restauración no debe desplazar lo que guardó otro alumno');
    assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
   }finally{await a.context.close();await b.context.close()}
  });
 }
 await caseRun('Profesor ve los cinco medallones y no escribe en Supabase',async()=>{
  const server=serverFor(3),a=await open('teacher','inperialismoaren-definizioa.html?preview=1',server);
  try{
   await a.page.waitForSelector('.m1-nav');
   assert.equal(await a.page.locator('.m1-route-stop').count(),5);
   assert.equal(await a.page.locator('#check').isDisabled(),true);
   assert.equal(server.logs.length,0);
   assert.deepEqual(a.errors,[]);
  }finally{await a.context.close()}
 });
}finally{await browser.close()}
console.log('AULA M1: '+passed+' comprobaciones correctas; '+failed+' fallidas (dos sesiones de navegador, servidor simulado, sin escrituras reales)');
if(failed)process.exitCode=1;
