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
   const {page,context,errors}=await open('student','index.html#mission1gallery',{width:1672,height:941});
   try{
     await waitVisible(page,'.gal-hall');
     await mkdir('test-output',{recursive:true});
     await page.screenshot({path:'test-output/m1-museo-cinematico-alumno-ordenador.png',fullPage:true,animations:'disabled'});
     const cabinets=await page.locator('.gal-vitrine').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().bottom));
     assert.ok(Math.max(...cabinets)-Math.min(...cabinets)<5,
       'En escritorio las cuatro vitrinas deben terminar alineadas sin recortar las zonas');
     await page.screenshot({path:'test-output/m1-museo-fidelidad-v2-alumno-escritorio.png',fullPage:true,animations:'disabled'});
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
     assert.equal(await page.locator('.gal-tray-corner').count(),4,'La mesa debe llevar cuatro filigranas');
     const glassBackdrop=await page.locator('.gal-vitrine-ru .gal-zone').evaluate(el=>getComputedStyle(el).backgroundImage);
     assert.ok(glassBackdrop.includes('gradient')&&!glassBackdrop.includes('data:image'),
       'Los paneles de respuesta deben tener textura neutra, sin fotografías duplicadas');
     const stylesV2=page.locator('link[href*="galeria-museo-fidelidad-v2.css"]');
     assert.equal(await stylesV2.count(),1,'Debe estar enlazado el CSS de fidelidad');
     assert.equal(await page.locator('.gal-case-column').first().evaluate(el=>getComputedStyle(el).pointerEvents),'none',
       'Los adornos no deben bloquear las zonas de respuesta');
     const sideArt=await page.locator('.gal-side-art').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).backgroundImage));
     assert.ok(sideArt[0].includes('m2-museo-izquierdo.svg')&&sideArt[1].includes('m2-museo-derecho.svg'),
       'Deben reutilizarse los dos fondos históricos laterales del museo');
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
