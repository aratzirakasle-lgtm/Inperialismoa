/* Navegación real de Chromium con Supabase simulado: ninguna escritura en producción.
 * Ejecutar: npm install --no-save --no-package-lock playwright@1.56.1
 *          npx playwright install chromium
 *          python3 -m http.server 8765 &
 *          node tests/browser-smoke.mjs
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,channel:process.env.SMOKE_USE_CHROME==='1'?'chrome':undefined,args:['--no-sandbox']});
let passed=0,failed=0;
async function open(role,path,viewport={width:1365,height:900}){
 const context=await browser.newContext({viewport,reducedMotion:'reduce'});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,async route=>{
   const url=route.request().url();
   await route.fulfill({status:200,contentType:url.includes('.css')?'text/css':'application/javascript',body:''});
 });
 await context.addInitScript(({role})=>{
   const userId=role==='teacher'?'teacher1':'student1';
   const people=[
     {id:'teacher1',display_name:'Profesor de pruebas',role:'teacher',team_id:null,class_id:'class1'},
     {id:'student1',display_name:'Alumno de pruebas',role:'student',team_id:'team1',class_id:'class1'}
   ];
   const tables={
     profiles:people,
     teams:[{id:'team1',name:'Exploradores',class_id:'class1'}],
     missions:[1,2,3,4,5,6].map(id=>({id,title:'Misioa '+id,subtitle:'Historia',intro:'Inperialismoa'})),
     classes:[{id:'class1',name:'Clase de pruebas',school_year:'2026-2027'}],
     public_questions:[],
     gallery_team_state:[],bi_sistema_team_state:[],empire_dossier_team_state:[],
     mission_badges:[],mission_completions:[],mission1_exercise_completions:[],
     territory_claims:[],territory_markers:[],submissions:[],submission_assessments:[],
     mission_attempts:[],attempt_answers:[],empire_dossier_attempts:[],
     bi_sistema_attempts:[],gallery_attempts:[],empire_dossier_clue_reads:[]
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
   const client={
     auth:{
       getSession:async()=>({data:{session:{user:{id:userId}}},error:null}),
       getUser:async()=>({data:{user:{id:userId}},error:null}),
       onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
     },
     from:table=>builder(table),
     rpc:async(name,args)=>{
       window.__smokeRpcCalls.push(name);
       if(role==='teacher')throw Error('No se permiten RPC en una simulación docente');
       if(name==='submit_gallery_attempt')return {
         data:{locked:[],locked_positions:{},incorrect:Object.keys(args?.p_answers||{}),completed:false,attempt_count:1},
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
 },{role});
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
 await page.locator('[data-gallery-card="'+id+'"]').click();
 await page.locator('[data-gallery-zone="'+zone+'"] .gal-zone-heading').click();
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
 await scenario('Alumno: el primer ejercicio tiene 20 tarjetas y no permite saltar al segundo',async()=>{
   const {page,context,errors}=await open('student','index.html#mission1gallery');
   try{
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('.gal-tile').count(),20);
     assert.equal(await page.locator('[data-gallery-action="next"]').count(),0);
     assert.equal(await page.locator('.m1-nav').count(),0);
     await page.locator('[data-gallery-action="hint"]').click();
     const help=await page.locator('.gal-hint').innerText();
     assert.match(help,/aukeratu txartel bat|arrastatu txartela/i);
     assert.doesNotMatch(help,/pista:|tsarrak|meiji|monarkaren/i);
     await setCard(page,'eu_auth_head','eu_liberal');
     await page.locator('[data-gallery-action="check"]').click();
     await page.waitForFunction(()=>document.querySelector('.gal-status')?.textContent?.includes('Ez da zuzena'));
     assert.equal(await page.locator('.gal-wrong').count(),0,'Un error no debe destacar respuestas incorrectas');
     assert.doesNotMatch(await page.locator('.gal-status').innerText(),/\d+.*birkokatu|\d+.*kontzeptu.*zuzendu/i);
     assert.equal(await page.locator('[data-gallery-action="next"]').count(),0);
     assert.deepEqual(errors,[]);
   }finally{await context.close()}
 });
 await scenario('Galería: mejora visual antes/después, foco de teclado y controles sin pistas',async()=>{
   const {page,context,errors}=await open('teacher','index.html#teacherpreviewgallery',{width:1672,height:941});
   try{
     await waitVisible(page,'.gal-hall');
     const sheet=page.locator('link[href*="galeria-mision1-pulido-20261121.css"]');
     assert.equal(await sheet.count(),1,'El pulido gráfico debe estar enlazado');
     assert.equal(await page.locator('.gal-europe-medallion').count(),1,'El símbolo de Europa no debe ser una bandera contemporánea');
     for(const [id,zone] of [['eu_auth_head','eu_auth'],['eu_liberal_head','eu_liberal'],['ru_tsar','ru'],['us_west','us'],['jp_meiji','jp']])
       await setCard(page,id,zone);
     assert.equal(await page.locator('.gal-tile').count(),20);
     await page.locator('[data-gallery-card="eu_army"]').focus();
     await page.keyboard.press('Enter');
     assert.equal(await page.locator('[data-gallery-card="eu_army"]').getAttribute('aria-pressed'),'true');
     assert.equal(await page.locator('[data-gallery-card="eu_army"]').evaluate(el=>document.activeElement===el),true,
       'La tarjeta debe recuperar el foco después de actualizar la sala');

     await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});
     await page.mouse.move(5,5);
     await mkdir('test-output',{recursive:true});
     // Reconstruir en la captura "antes" el símbolo europeo original,
     // no fotografiar el nuevo medallón sin sus propios estilos.
     const medallion=await page.locator('.gal-europe-medallion').evaluate(el=>el.outerHTML);
     await sheet.evaluate(el=>el.disabled=true);
     await page.evaluate(()=>{
       const cloth="M5 5 C14 2 22 7 31 4 C39 2 47 3 56 5 L56 35 C47 33 39 31 31 35 C21 38 13 32 5 35 Z";
       const star=(cx,cy)=>'<polygon points="'+Array.from({length:10},(_,i)=>{
         const a=-Math.PI/2+i*Math.PI/5,r=i%2?1.05:2.45;
         return (cx+Math.cos(a)*r).toFixed(2)+','+(cy+Math.sin(a)*r).toFixed(2);
       }).join(' ')+'"/>';
       const stars=Array.from({length:12},(_,i)=>{
         const a=-Math.PI/2+i*Math.PI/6;
         return star(31+10.5*Math.cos(a),19.6+10.5*Math.sin(a));
       }).join('');
       document.querySelector('.gal-europe-medallion').outerHTML=
         '<svg class="gal-flag-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 42" role="img" aria-label="Antiguo símbolo europeo" focusable="false">'+
         '<defs><clipPath id="gal-flag-cloth-eu"><path d="'+cloth+'"/></clipPath></defs>'+
         '<g clip-path="url(#gal-flag-cloth-eu)"><rect x="5" y="4" width="52" height="32" fill="#003399"/>'+
         '<g fill="#ffcc00">'+stars+'</g></g></svg>';
     });
     await page.screenshot({path:'test-output/m1-galeria-antes-ordenador.png',fullPage:true,animations:'disabled'});
     await page.evaluate(original=>{
       document.querySelector('.gal-flag-illustration').outerHTML=original;
     },medallion);
     await sheet.evaluate(el=>el.disabled=false);
     await page.screenshot({path:'test-output/m1-galeria-despues-ordenador.png',fullPage:true,animations:'disabled'});
     assert.equal(await page.locator('.gal-tile.gal-selected').count(),1);
     assert.equal(await page.locator('.gal-vitrine').count(),4);
     assert.equal(await page.locator('.gal-tile').count(),20);
     await page.locator('[data-gallery-card="eu_army"]').focus();
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('.gal-tile.gal-selected').count(),0,
       'Escape debe cancelar la selección sin mover ninguna cartela');

     await page.locator('[data-gallery-zone="eu_auth"] [data-gallery-card="eu_auth_head"]').focus();
     await page.keyboard.press('Delete');
     assert.equal(await page.locator('.gal-tray [data-gallery-card="eu_auth_head"]').count(),1,
       'Suprimir debe devolver una cartela no confirmada a la mesa');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[],
       'La vista docente no puede registrar respuestas');
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
     await page.locator('[data-mission="1"]').first().click();
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] .gal-tile-placed').count(),1);
     assert.equal(await page.locator('[data-gallery-action="next"]').count(),0);
     await page.locator('[data-gallery-action="reset"]').click();
     await page.reload({waitUntil:'domcontentloaded'});
     await page.locator('[data-mission="1"]').first().click();
     await waitVisible(page,'.gal-hall');
     assert.equal(await page.locator('[data-gallery-zone="eu_auth"] .gal-tile-placed').count(),0);
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
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
 await scenario('Alumno: la segunda pantalla no se abre si la primera está pendiente',async()=>{
   const {page,context,errors}=await open('student','bi-sistema.html');
   try{
     await waitVisible(page,'.gal-hall');
     assert.ok(page.url().includes('index.html'));
     assert.equal(await page.locator('.m1-nav').count(),0);
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
     assert.equal(await page.locator('.m1-nav').count(),0);
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
   const {page,context,errors}=await open('teacher','bi-sistema.html?preview=1');
   try{
     await waitVisible(page,'.m1-nav');
     await page.getByRole('button',{name:'Amaierako pantaila'}).click();
     assert.equal(await page.locator('#bi-stage').getAttribute('data-phase'),'complete');
     assert.deepEqual(await page.evaluate(()=>window.__smokeRpcCalls),[]);
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
}finally{await browser.close()}
console.log('Resultado: '+passed+' pruebas superadas; '+failed+' fallidas');
if(failed)process.exitCode=1;
