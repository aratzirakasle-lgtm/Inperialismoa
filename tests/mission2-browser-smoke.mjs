/* Ensayo visual y de navegación de la segunda misión con autenticación simulada.
 * No envía datos ni modifica Supabase. Las claves de corrección NO están aquí.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let count=0;
async function open(role='student',size={width:1365,height:900},badge=true){
 const context=await browser.newContext({viewport:size,reducedMotion:'reduce'});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.fulfill({status:200,contentType:r.request().url().endsWith('.css')?'text/css':'application/javascript',body:''}));
 await context.addInitScript(({role,badge})=>{
  const myId=role==='teacher'?'qa-teacher':'qa-student';
  window.__m2RpcCalls=[];
  const table=key=>{
   const rows=key==='profiles'?[{id:myId,role,team_id:role==='student'?'qa-team':null}]:
    key==='mission_badges'?(badge?[{mission_id:1,team_id:'qa-team'}]:[]):
    key==='mission2_exercise_completions'?[]:[];
   const q={
    select(){return this},eq(){return this},limit(){return this},
    single:async()=>({data:rows[0]||null,error:rows.length?null:{message:'not found'}}),
    then(resolve,reject){return Promise.resolve({data:rows,error:null}).then(resolve,reject)}
   };return q;
  };
  window.supabase={createClient:()=>({
   auth:{getUser:async()=>({data:{user:{id:myId}},error:null})},
   from:table,
   rpc:async(name,args)=>{
    window.__m2RpcCalls.push({name,exercise:args.p_exercise});
    return {data:{completed:true,mission_completed:args.p_exercise===5},error:null};
   }
  })};
 },{role,badge});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('inperialismoaren-faktoreak.html'+(role==='teacher'?'?preview=1':''),BASE).href,{waitUntil:'domcontentloaded'});
 await page.locator('.m2-steps').waitFor({state:'visible',timeout:12000}).catch(()=>{});
 return {page,context,errors};
}
async function scenario(name,callback){
 try{await callback();count++;console.log('✓ '+name)}
 catch(error){console.error('✗ '+name);throw error}
}
try{
 await scenario('Profesor: cinco pantallas y final navegables, sin escrituras',async()=>{
  const {page,context,errors}=await open('teacher');
  try{
   assert.equal(await page.locator('.m2-step').count(),5);
   assert.equal(await page.locator('[data-card]').count(),11);
   assert.equal(await page.locator('[data-zone]').count(),5);
   await mkdir('test-output',{recursive:true});
   await page.screenshot({path:'test-output/m2-e1-desktop.png',fullPage:true,animations:'disabled'});
   for(let n=2;n<=5;n++){
    await page.locator('[data-open="'+n+'"]').click();
    assert.ok((await page.locator('.m2-section-head h2').innerText()).length>4);
    await page.screenshot({path:'test-output/m2-e'+n+'-desktop.png',fullPage:true,animations:'disabled'});
   }
   await page.locator('[data-preview-next]').click();
   assert.equal(await page.locator('.m2-finished').count(),1);
   assert.deepEqual(await page.evaluate(()=>window.__m2RpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Alumno: cinco ejercicios progresivos y desbloqueo de final (servidor simulado)',async()=>{
  const {page,context,errors}=await open('student');
  try{
   assert.equal(await page.locator('.m2-step:disabled').count(),4);
   for(const id of ['new_markets','cheap_resources','investments','settlement','working_conditions','conversion','missions','sea_routes','chauvinism','racist_theories','exploration']){
    await page.locator('[data-card="'+id+'"]').click();
    await page.locator('[data-zone="economic"]').click();
    const pending=await page.locator('.m2-museum-desktop [data-card]').count();
    console.log('M2 classify',id,'remaining',pending);
   }
   assert.equal(await page.locator('[data-check]').isEnabled(),true);
   await page.locator('[data-check]').click();
   await page.locator('[data-next]').waitFor();
   await page.locator('[data-next]').click();

   for(const [event,year] of [['suez','1869'],['hijaz','1908'],['panama','1914']]){
    await page.locator('[data-event="'+event+'"]').click();await page.locator('[data-year="'+year+'"]').click();
   }
   await page.locator('[data-field="funding"]').selectOption('credits');
   await page.locator('[data-field="works"]').selectOption('rail_ports_canals');
   await page.locator('[data-check]').click();
   await page.locator('[data-next]').waitFor();
   await page.locator('[data-next]').click();

   for(const [year,pop] of [['1850','266'],['1870','310'],['1900','400']]){
    await page.locator('[data-field="'+year+'"]').selectOption(pop);
   }
   await page.locator('[data-field="migration"]').selectOption('better_life');
   await page.locator('[data-field="missionaries"]').selectOption('catholic_protestant');
   await page.locator('[data-check]').click();
   await page.locator('[data-next]').waitFor();
   await page.locator('[data-next]').click();

   for(const id of ['sea','press','missions','racism','source1863'])
    await page.locator('[data-archive="'+id+'"]').first().check();
   await page.locator('[data-check]').click();
   await page.locator('[data-next]').waitFor();
   await page.locator('[data-next]').click();

   for(const id of ['nile','niger','congo','zambezi'])
    await page.locator('[data-multi="africa"][data-value="'+id+'"]').click();
   for(const id of ['himalaya','siberia','australia'])
    await page.locator('[data-multi="asia"][data-value="'+id+'"]').click();
   for(const [id,value] of [['north','peary'],['south','amundsen'],['meeting','1871'],['congo','exploitation']])
    await page.locator('[data-field="'+id+'"]').selectOption(value);
   await page.locator('[data-check]').click();
   await page.locator('[data-ending]').waitFor();
   await page.locator('[data-ending]').click();
   assert.equal(await page.locator('.m2-finished').count(),1);
   assert.equal(await page.locator('.m2-finished').innerText().then(t=>t.includes('3. misioa')),true);
   assert.deepEqual((await page.evaluate(()=>window.__m2RpcCalls)).map(x=>x.exercise),[1,2,3,4,5]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Alumno: bloqueo de misión 2 si no ha acabado la 1',async()=>{
  const {page,context,errors}=await open('student',{width:768,height:1024},false);
  try{
   await page.locator('.m2-message-card').waitFor({state:'visible'});
   assert.match(await page.locator('.m2-message-card').innerText(),/blokeatuta/i);
   assert.deepEqual(await page.evaluate(()=>window.__m2RpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Portada docente de misión 2 sin desbordamiento en escritorio, tableta y móvil',async()=>{
  for(const size of [{width:1365,height:900},{width:768,height:1024},{width:390,height:844}]){
   const {page,context,errors}=await open('teacher',size);
   try{
    const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
    assert.ok(metrics.scroll<=metrics.viewport+1,JSON.stringify({size,metrics}));
    assert.equal(await page.locator('.m2-hero').isVisible(),true);
    if(size.width===390)await page.screenshot({path:'test-output/m2-e1-mobile.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
}finally{await browser.close()}
console.log('Misión 2: '+count+' escenarios verificados.');
