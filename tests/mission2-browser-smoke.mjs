/* Ensayo visual y de navegación de la segunda misión con autenticación simulada.
 * No envía datos ni modifica Supabase. Las claves de corrección NO están aquí.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,channel:process.env.SMOKE_USE_CHROME==='1'?'chrome':undefined,args:['--no-sandbox']});
let count=0;
async function ensureAtlasPicturesDecoded(page){
 await page.locator('.m2-atlas-screen img.m2-atlas-card-illustration').evaluateAll(async imgs=>{
  await Promise.all(imgs.map(async img=>{
   if(img.decode)await img.decode();
   if(!img.complete||img.naturalWidth<680)throw Error('Falta la imagen ilustrada '+img.src);
  }));
 });
}
async function open(role='student',size={width:1365,height:900},badge=true){
 const context=await browser.newContext({viewport:size,reducedMotion:'reduce'});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.fulfill({status:200,contentType:r.request().url().endsWith('.css')?'text/css':'application/javascript',body:''}));
 await context.route('**/js/mission-release.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:"export const MISSION2_OPEN=true;export const MISSION2_LOCKED_TEXT='Bigarren misioa irakasleak irekiko du.';"}));
 await context.addInitScript(({role,badge})=>{
  const myId=role==='teacher'?'qa-teacher':'qa-student';
  window.__m2RpcCalls=[];
  const table=key=>{
   const rows=key==='profiles'?[{id:myId,role,team_id:role==='student'?'qa-team':null}]:
    key==='mission_badges'?[{mission_id:1,team_id:'qa-team'}]:
    key==='mission1_exercise_completions'?(badge?[{exercise:5,team_id:'qa-team'}]:[]):
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
    if(name==='mission2_access_status')return {data:true,error:null};
    if(name==='class_access_status')return {data:true,error:null};
    if(name==='mission2_class_progress_members')return {data:[{team_id:'qa-team',class_id:'qa-class',team_name:'Atlas',member_names:['Ane'],exercise_1:true,mission_completed:false},{team_id:'other-team',class_id:'qa-class',team_name:'Nilo',member_names:['Jon'],exercise_1:true,exercise_2:true,mission_completed:false}],error:null};
    window.__m2RpcCalls.push({name,exercise:args.p_exercise});
    if(name==='save_mission2_team_draft')return {data:{status:'saved',answers:args.p_patch},error:null};
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
 await scenario('Vitrinas: comparación real antes/después y luz uniforme sin pistas',async()=>{
  const {page,context,errors}=await open('teacher',{width:1672,height:941});
  try{
   const sheet=page.locator('link[href*="m2-vitrinas-iluminacion.css"]');
   assert.equal(await sheet.count(),1,'La iluminación nueva debe estar cargada');
   const count=await page.locator('.m2-museum-case').count();
   assert.equal(count,5);
   await page.locator('[data-card="new_markets"]').click();
   assert.equal(await page.locator('[data-card="new_markets"]').getAttribute('aria-pressed'),'true');
   await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});
   await page.mouse.move(4,4);
   // La selección activa por igual todas las vitrinas: sin insinuar soluciones.
   const lights=await page.locator('.m2-museum-case').evaluateAll(cases=>cases.map(el=>getComputedStyle(el).boxShadow));
   assert.equal(new Set(lights).size,1,'La selección no puede iluminar una respuesta por encima de otra');

   // Antes/después: misma pantalla, misma cartela seleccionada y mismo hover.
   await sheet.evaluate(el=>{el.disabled=true});
   await page.locator('[data-zone="political"]').hover();
   const before=await page.locator('.m2-museum-case').evaluateAll(cases=>cases.map(el=>{
    const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};
   }));
   const beforeShadow=await page.locator('[data-zone="political"]').evaluate(el=>getComputedStyle(el).boxShadow);
   await mkdir('test-output',{recursive:true});
   await page.screenshot({path:'test-output/m2-vitrinas-antes-ordenador.png',fullPage:true,animations:'disabled'});
   await sheet.evaluate(el=>{el.disabled=false});
   await page.locator('[data-zone="political"]').hover();
   const after=await page.locator('.m2-museum-case').evaluateAll(cases=>cases.map(el=>{
    const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};
   }));
   const afterShadow=await page.locator('[data-zone="political"]').evaluate(el=>getComputedStyle(el).boxShadow);
   assert.notEqual(beforeShadow,afterShadow,'El nuevo foco debe ser visualmente distinto');
   before.forEach((r,i)=>['x','y','w','h'].forEach(k=>assert.ok(Math.abs(r[k]-after[i][k])<.5,'La iluminación no debe desplazar vitrinas')));
   await page.screenshot({path:'test-output/m2-vitrinas-despues-ordenador.png',fullPage:true,animations:'disabled'});
   assert.equal(await page.locator('.m2-archive-card').count(),11);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Vitrinas resueltas: antes y después en el mismo encuadre de ordenador',async()=>{
  const {page,context,errors}=await open('teacher',{width:1672,height:941});
  try{
   const assignment={
    economic:['new_markets','cheap_resources','investments'],
    demographic:['settlement','working_conditions'],
    religious:['conversion','missions'],
    political:['sea_routes','chauvinism'],
    ideological:['racist_theories','exploration']
   };
   for(const [zone,ids] of Object.entries(assignment)){
    for(const id of ids){
     await page.locator('.m2-museum-desktop [data-card="'+id+'"]').click();
     await page.locator('[data-zone="'+zone+'"] .m2-case-title-action').click();
    }
   }
   assert.equal(await page.locator('.m2-museum-desktop [data-card]').count(),0);
   assert.equal(await page.locator('.m2-museum-case .m2-archive-card').count(),11);
   for(const [zone,ids] of Object.entries(assignment)){
    assert.equal(await page.locator('[data-zone="'+zone+'"] .m2-archive-card').count(),ids.length);
   }
   await page.locator('[data-zone="political"] .m2-case-title-action').hover();
   const sheet=page.locator('link[href*="m2-vitrinas-iluminacion.css"]');
   assert.equal(await sheet.count(),1);
   await sheet.evaluate(el=>el.disabled=true);
   await page.screenshot({path:'test-output/m2-resuelto-antes-1672.png',fullPage:true,animations:'disabled'});
   await sheet.evaluate(el=>el.disabled=false);
   await page.locator('[data-zone="political"] .m2-case-title-action').hover();
   await page.screenshot({path:'test-output/m2-resuelto-despues-1672.png',fullPage:true,animations:'disabled'});
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Profesor: cinco pantallas y final navegables, sin escrituras',async()=>{
  const {page,context,errors}=await open('teacher');
  try{
   assert.equal(await page.locator('.m2-step').count(),5);
   assert.equal(await page.locator('.m2-passport').count(),0,'La sala no debe mostrar pasaporte');
   assert.equal(await page.locator('[data-card]').count(),11);
   assert.equal(await page.locator('.m2-archive-card').count(),11,'Once cartelas históricas independientes');
   const art=await page.locator('.m2-archive-card .m2-card-miniature').evaluateAll(images=>images.map(img=>({
     loaded:img.complete&&img.naturalWidth>0,
     src:new URL(img.src).pathname
   })));
   assert.equal(art.length,11);
   assert.equal(new Set(art.map(x=>x.src)).size,11,'Cada concepto debe tener una miniatura diferente');
   assert.ok(art.every(x=>x.loaded),'Las once miniaturas ilustradas deben cargar');

   assert.equal(await page.locator('[data-zone]').count(),5);
   assert.equal(await page.locator('.m2-case-title-action').count(),5);
   assert.equal(await page.locator('.m2-case-crown').count(),5);
   assert.equal(await page.locator('.m2-case-foundation').count(),5);
   assert.equal(await page.locator('.m2-desk-front').count(),1);
   assert.equal(await page.locator('.m2-case-scene').count(),5);
   assert.equal(await page.locator('.m2-case-details').count(),5,'Cinco vitrinas con objetos y figuras decorativas');
   const ornate=await page.locator('.m2-case-title').first().evaluate(el=>getComputedStyle(el).backgroundImage.includes('m2-ref-ornate-plaque.svg'));
   assert.ok(ornate,'Las placas doradas deben usar la ornamentación histórica');

   assert.equal(await page.locator('.m2-case-spot').count(),5,'Las vitrinas necesitan sus cinco focos');
   const sceneLayout=await page.locator('.m2-case-scene').evaluateAll(images=>images.map(img=>({
     loaded:img.complete&&img.naturalWidth>0,
     fit:getComputedStyle(img).objectFit
   })));
   assert.ok(sceneLayout.every(x=>x.loaded&&x.fit==='fill'),'Las cinco escenas deben verse enteras sin cortes laterales');
   assert.equal(await page.locator('.m2-case-spot').first().evaluate(el=>getComputedStyle(el).pointerEvents),'none');

   assert.equal(await page.locator('.m2-case-scene').evaluateAll(els=>els.every(img=>img.complete&&img.naturalWidth>0)),true,'Las cinco escenas históricas deben cargar');
   await mkdir('test-output',{recursive:true});
   await page.screenshot({path:'test-output/m2-e1-desktop.png',fullPage:true,animations:'disabled'});

   await page.locator('[data-card="new_markets"]').click();
   assert.equal(await page.locator('[data-card="new_markets"]').getAttribute('aria-pressed'),'true','El resplandor de selección debe activarse sin resolver nada');
   await page.locator('[data-card="new_markets"]').dragTo(page.locator('[data-zone="economic"] .m2-case-target'));
   assert.equal(await page.locator('[data-zone="economic"] [data-card="new_markets"]').count(),1);
   assert.equal(await page.locator('[data-zone="economic"] .m2-card-miniature').count(),1,'Las imágenes deben acompañar a la cartela dentro de la vitrina');
   await page.locator('[data-zone="economic"] [data-card="new_markets"]').dragTo(page.locator('[data-zone="demographic"] .m2-case-target'));
   assert.equal(await page.locator('[data-zone="demographic"] [data-card="new_markets"]').count(),1);
   await page.locator('[data-zone="demographic"] [data-card="new_markets"]').click();
   await page.locator('[data-zone="economic"] .m2-case-target').click();
   assert.equal(await page.locator('[data-zone="economic"] [data-card="new_markets"]').count(),1);
   for(let n=2;n<=5;n++){
    await page.locator('[data-open="'+n+'"]').click();
    assert.ok((await page.locator(n===3?'.m2-atlas-heading h1':'.m2-section-head h2').innerText()).length>4);
    await page.screenshot({path:'test-output/m2-e'+n+'-desktop.png',fullPage:true,animations:'disabled'});
   }
   await page.locator('[data-preview-next]').click();
   assert.equal(await page.locator('.m2-finished').count(),1);
   assert.deepEqual(await page.evaluate(()=>window.__m2RpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Misión 2 · Cronógrafo interactivo: tres obras, dos preguntas y maquetas adaptables',async()=>{
  for(const [size,label] of [[{width:1672,height:941},'escritorio'],[{width:390,height:844},'movil']]){
   const {page,context,errors}=await open('teacher',size);
   try{
    await page.locator('[data-open="2"]').click();
    assert.equal(await page.locator('.m2-e2-chronograph').count(),1);
    assert.equal(await page.locator('.m2-e2-piece').count(),3);
    assert.equal(await page.locator('.m2-e2-slot').count(),3);
    assert.equal(await page.locator('.m2-e2-ledger-page').count(),2);
    assert.equal(await page.locator('.m2-e2-option input[type="radio"]').count(),6);
    const bg=await page.locator('.m2-e2-picture').first().evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.match(bg,/m2-e2-reference-art\.svg/,'Las ilustraciones de transporte deben cargar');
    await mkdir('test-output',{recursive:true});
    await page.screenshot({path:'test-output/m2-e2-'+label+'-nuevo.png',fullPage:true,animations:'disabled'});
    for(const [id,year] of [['suez','1914'],['hijaz','1869'],['panama','1908']]){
     await page.locator('[data-event="'+id+'"]').click();
     await page.locator('[data-year="'+year+'"]').click();
    }
    assert.equal(await page.locator('.m2-e2-slot.m2-selected-year').count(),3);
    assert.match(await page.locator('.m2-e2-dial-progress').innerText(),/3\s*\/\s*3/);
    await page.locator('input[data-field="funding"][value="credits"]').check();
    await page.locator('input[data-field="works"][value="rail_ports_canals"]').check();
    assert.equal(await page.locator('.m2-e2-option input:checked').count(),2);
    await page.locator('[data-reset]').click();
    assert.equal(await page.locator('.m2-e2-slot.m2-selected-year').count(),0);
    assert.equal(await page.locator('.m2-e2-option input:checked').count(),0);
    const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(horizontalOverflow<5,'No debe existir desbordamiento horizontal ('+label+'): '+horizontalOverflow);
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
 await scenario('Misión 2 · Archivo 4 y atlas 5: fuentes, preguntas, interacción y vistas reales',async()=>{
  for(const [size,label] of [[{width:1672,height:941},'escritorio'],[{width:390,height:844},'movil']]){
   const {page,context,errors}=await open('teacher',size);
   try{
    const styles=page.locator('link[href*="m2-botere-artxiboa-esploratzaileak.css"]');
    assert.equal(await styles.count(),1,'El estilo del archivo y atlas debe cargarse');
    await page.locator('[data-open="4"]').click();
    await page.locator('.m2-source-file').first().waitFor();
    assert.equal(await page.locator('.m2-source-file').count(),5);
    assert.equal(await page.locator('.m2-source-engraving svg').count(),5);
    assert.equal(await page.locator('input[data-archive]').count(),15);
    assert.equal(await page.locator('.m2-source-file .m2-archive-image-caption').count(),5);
    assert.equal(await page.locator('.m2-archive-dossier').count(),5);
    assert.equal(await page.locator('.m2-archive-desk-front').count(),1);
    assert.equal(await page.locator('.m2-archive-warning').count(),1);
    assert.equal(await page.locator('[data-archive-progress]').innerText(),'0 / 5');
    const archiveSheet=page.locator('link[href*="m2-e4-archivo-fidelidad-concepto1.css"]');
    assert.equal(await archiveSheet.count(),1,'El diseño elegido debe estar enlazado');
    const realismSheet=page.locator('link[href*="m2-e4-fotorrealismo-20261121.css"]');
    assert.equal(await realismSheet.count(),1,'Debe estar enlazado el pulido fotográfico');
    const galleryMaterials=await page.locator('.m2-archive-dossier').evaluateAll(items=>items.map((el,i)=>({
      paper:getComputedStyle(el).backgroundImage,
      illustration:getComputedStyle(el.querySelector('.m2-source-engraving')).backgroundImage,
      pointer:getComputedStyle(el.querySelector('.m2-choice')).pointerEvents,
      index:i
    })));
    assert.ok(galleryMaterials.every(d=>d.paper.includes('gradient')&&!d.paper.includes('pergamino-papel-artesanal.svg')),
      'Los cinco expedientes deben utilizar papel antiguo sin textura SVG que oscurezca el texto');
    assert.ok(galleryMaterials.every(d=>d.illustration.includes('m2-e4-archivos-color-hd.avif')),
      'Los cinco expedientes deben mostrar las ilustraciones coloreadas de alta resolución de la referencia');
    const colorSheet=page.locator('link[href*="m2-e4-color-hd-20261121.css"]');
    assert.equal(await colorSheet.count(),1,'La versión restaurada y coloreada debe estar enlazada');
    const hdArt=await page.evaluate(async()=>{
      const image=await fetch('./assets/m2-e4-archivos-color-hd.avif');
      if(!image.ok)throw Error('No carga la lámina en color');
      const bitmap=await createImageBitmap(await image.blob());
      const result={width:bitmap.width,height:bitmap.height};
      bitmap.close();return result;
    });
    assert.deepEqual(hdArt,{width:1100,height:340},'La lámina coloreada debe conservar la resolución mayor');
    const referenceSheet=page.locator('link[href*="m2-e4-referencia-fotos-20261121.css"]');
    assert.equal(await referenceSheet.count(),1,'Debe estar enlazada la composición de referencia del ejercicio 4');
    const crops=await page.locator('.m2-archive-dossier .m2-source-engraving').evaluateAll(items=>items.map(el=>getComputedStyle(el).backgroundPosition.split(' ')[0]));
    assert.deepEqual(crops,['0%','25%','50%','75%','100%'],
      'Las cinco fichas deben mostrar grabados distintos, en orden y sin duplicados');
    const noteColor=await page.locator('.m2-archive-warning').evaluate(el=>{
      const s=getComputedStyle(el);return {background:s.backgroundImage,text:s.color}
    });
    assert.ok(noteColor.background.includes('gradient')&&!noteColor.background.includes('pergamino-papel-artesanal'),
      'La nota crítica debe conservar contraste y un papel claro sin filtros fotográficos');
    assert.ok(galleryMaterials.every(d=>d.pointer!=='none'),
      'El realismo gráfico nunca debe bloquear las respuestas');
    const backdrop=await page.locator('.m2-archive-room-props').evaluate(el=>({
      background:getComputedStyle(el).backgroundImage,pointer:getComputedStyle(el).pointerEvents
    }));
    assert.ok(backdrop.background.includes('m2-e4-mesa-archivo-museo.svg'),'Deben existir mesa, lámpara, globo y objetos del archivo');
    assert.equal(backdrop.pointer,'none','La escenografía no debe impedir responder');
    const propResource=await page.evaluate(async()=>{
      const r=await fetch('./assets/m2-e4-mesa-archivo-museo.svg');
      return r.ok&&(await r.text()).includes('<svg');
    });
    assert.equal(propResource,true,'La escenografía museística debe descargarse correctamente');
    if(label==='escritorio'){
      const cards=await page.locator('.m2-archive-dossier').evaluateAll(els=>els.map(el=>{
        const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};
      }));
      assert.ok(Math.abs(cards[0].y-cards[1].y)<8,'Dos expedientes arriba');
      assert.ok(cards[2].y>cards[0].y+80&&Math.abs(cards[2].y-cards[3].y)<8&&Math.abs(cards[3].y-cards[4].y)<8,
       'Tres expedientes abajo');
      assert.ok(cards[0].width>cards[2].width,'Las dos fichas superiores deben ser más anchas');
    }
    const documentLayout=await page.locator('.m2-source-file').evaluateAll(items=>items.map(el=>{
     const b=el.getBoundingClientRect();
     return {width:b.width,inside:b.left>=-1&&b.right<=innerWidth+1};
    }));
    assert.ok(documentLayout.every(d=>d.width>215&&d.inside),
      'Todos los expedientes deben caber en pantalla: '+JSON.stringify(documentLayout));
    await mkdir('test-output',{recursive:true});
    await page.screenshot({path:'test-output/m2-e4-boterearen-artxiboa-'+label+'.png',fullPage:true,animations:'disabled'});
    // Una selección no debe aportar pistas ni navegar fuera del ejercicio.
    await page.locator('input[data-archive="press"][value="a"]').check();
    assert.equal(await page.locator('.m2-archive-dossier[data-source="press"]').getAttribute('data-answered'),'true');
    assert.equal(await page.locator('[data-archive-progress]').innerText(),'1 / 5');
    assert.equal(await page.locator('input[data-archive="press"][value="a"]').isChecked(),true);
    await page.locator('[data-reset]').click();
    assert.equal(await page.locator('[data-archive-progress]').innerText(),'0 / 5');
    assert.equal(await page.locator('input[data-archive="press"][value="a"]').isChecked(),false);
    assert.equal(await page.locator('.m2-source-file').count(),5);
    assert.equal(await page.locator('[data-open="4"]').getAttribute('aria-current'),'step');

    await page.locator('[data-open="5"]').click();
    await page.locator('.m2-expedition-svg').waitFor();
    assert.equal(await page.locator('.m2-expedition-panel').count(),5);
    assert.equal(await page.locator('.m2-expedition-svg .m2-historic-rivers path').count(),4);
    assert.equal(await page.locator('[data-multi="africa"]').count(),6);
    assert.equal(await page.locator('[data-multi="asia"]').count(),5);
    assert.equal(await page.locator('select[data-field]').count(),4);
    const expLayout=await page.locator('.m2-expedition-research').evaluate(el=>{
     const root=el.getBoundingClientRect(),atlas=el.querySelector('.m2-atlas').getBoundingClientRect();
     return {rootWidth:root.width,rootLeft:root.left,rootRight:root.right,
        atlasRight:atlas.right,viewport:innerWidth};
    });
    assert.ok(expLayout.rootLeft>=-1&&expLayout.rootRight<=expLayout.viewport+2
        &&expLayout.atlasRight<=expLayout.viewport+2,
      'El atlas y sus preguntas deben caber: '+JSON.stringify(expLayout));
    await page.screenshot({path:'test-output/m2-e5-esploratzaileen-espedientea-'+label+'.png',fullPage:true,animations:'disabled'});
    await page.locator('[data-multi="africa"][data-value="congo"]').click();
    assert.match(await page.locator('.m2-atlas-route-ledger').innerText(),/Kongo/);
    assert.equal(await page.locator('[data-multi="africa"][data-value="congo"]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-field="meeting"]').selectOption('1869');
    assert.equal(await page.locator('[data-field="meeting"]').inputValue(),'1869');
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
 await scenario('Alumno: pestaña de compañeros de la misión 2',async()=>{
  const {page,context,errors}=await open('student');
  try{
   const toggle=page.locator('.m2-class-widget .m1-class-toggle');
   await toggle.waitFor({state:'visible'});
   assert.equal(await page.locator('.m1-class-panel').isVisible(),false);
   await toggle.click();
   await page.locator('.m1-class-team').first().waitFor({state:'visible'});
   assert.match(await page.locator('.m1-class-panel').innerText(),/2\. MISIOA/);
   assert.equal(await page.locator('.m1-class-team').count(),2);
   assert.match(await page.locator('.m1-class-panel').innerText(),/ZUEN TALDEA/);
   assert.match(await page.locator('.m1-class-panel').innerText(),/Nilo/);
   await page.locator('.m1-class-close').click();
   assert.equal(await page.locator('.m1-class-panel').isVisible(),false);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Alumno: cinco ejercicios progresivos y desbloqueo de final (servidor simulado)',async()=>{
  const {page,context,errors}=await open('student');
  try{
   assert.equal(await page.locator('.m2-step:disabled').count(),4);
   for(const id of ['new_markets','cheap_resources','investments','settlement','working_conditions','conversion','missions','sea_routes','chauvinism','racist_theories','exploration']){
    await page.locator('[data-card="'+id+'"]').click();
    await page.locator('[data-zone="economic"] .m2-case-title-action').click();
   }
   assert.equal(await page.locator('.m2-museum-desktop [data-card]').count(),0);
   assert.equal(await page.locator('[data-zone="economic"] [data-card]').count(),11);
   const allCardsVisible=await page.locator('[data-zone="economic"]').evaluate(zone=>{
     const well=zone.querySelector('.m2-case-well').getBoundingClientRect();
     return [...zone.querySelectorAll('[data-card]')].every(card=>{
       const rect=card.getBoundingClientRect();
       return rect.width>0&&rect.height>0&&rect.top>=well.top-2&&rect.bottom<=well.bottom+2;
     });
   });
   assert.equal(allCardsVisible,true,'Todas las tarjetas deben caber dentro de la vitrina y ser visibles');
   assert.equal(await page.locator('[data-check]').isEnabled(),true);
   await page.locator('[data-check]').click();
   await page.locator('[data-next]').waitFor();
   await page.locator('[data-next]').click();

   for(const [event,year] of [['suez','1869'],['hijaz','1908'],['panama','1914']]){
    await page.locator('[data-event="'+event+'"]').click();await page.locator('[data-year="'+year+'"]').click();
   }
   await page.locator('input[data-field="funding"][value="credits"]').check();
   await page.locator('input[data-field="works"][value="rail_ports_canals"]').check();
   await page.locator('[data-check]').click();
   await page.locator('[data-next]').waitFor();
   await page.locator('[data-next]').click();

   for(const [year,pop] of [['1850','266'],['1870','310'],['1900','400']]){
    await page.locator('[data-field="'+year+'"]').selectOption(pop);
   }
   await page.locator('input[data-field="migration"][value="better_life"]').check();
   await page.locator('input[data-field="missionaries"][value="catholic_protestant"]').check();
   for(const dest of ['africa','asia','oceania']){
    await page.locator('[data-atlas-route="'+dest+'"]').click();
    await page.locator('[data-atlas-target="'+dest+'"]').click();
   }
   for(const [id,value] of [['statement_1','egia'],['statement_2','gezurra'],['statement_3','egia'],['statement_4','egia'],['statement_5','gezurra']])
    await page.locator('select.m2-atlas-statement-select[data-field="'+id+'"]').selectOption(value);
   for(const [id,bag] of [['growth','cause'],['conditions','cause'],['better','cause'],['conversion','cause'],
      ['settlement','effect'],['missions','effect'],['oceania','effect'],['faith','effect']]){
    await page.locator('[data-atlas-bag-card="'+id+'"]').click();
    await page.locator('.m2-atlas-luggage-drop[data-atlas-bag-zone="'+bag+'"]').click();
   }
   assert.equal(await page.locator('[data-check]').isEnabled(),true);
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
   assert.deepEqual((await page.evaluate(()=>window.__m2RpcCalls))
     .filter(x=>x.name==='submit_mission2_exercise').map(x=>x.exercise),[1,2,3,4,5]);
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

 // Prueba visual de estrés: ninguna cartela debe salirse ni recortarse
 // aunque las once se coloquen juntas en cualquiera de las vitrinas.
 await scenario('Once cartelas visibles dentro de vitrinas en 5 anchuras y destinos distintos',async()=>{
  const cases=[
   {size:{width:1672,height:941},zone:'economic',key:'wide'},
   {size:{width:1365,height:900},zone:'demographic',key:'desktop'},
   {size:{width:768,height:1024},zone:'religious',key:'tablet'},
   {size:{width:390,height:844},zone:'political',key:'mobile'},
   {size:{width:320,height:700},zone:'ideological',key:'small-mobile'}
  ];
  for(const {size,zone,key} of cases){
   const {page,context,errors}=await open('teacher',size);
   try{
    const cardIds=await page.locator('.m2-museum-desktop [data-card]').evaluateAll(cards=>cards.map(c=>c.dataset.card));
    assert.equal(cardIds.length,11);
    for(const id of cardIds){
     await page.locator('.m2-museum-desktop [data-card="'+id+'"]').click();
     await page.locator('[data-zone="'+zone+'"] .m2-case-title-action').click();
    }
    assert.equal(await page.locator('.m2-museum-desktop [data-card]').count(),0);
    assert.equal(await page.locator('[data-zone="'+zone+'"] .m2-archive-card').count(),11);
    const layout=await page.locator('[data-zone="'+zone+'"]').evaluate(cabinet=>{
     const rect=el=>el.getBoundingClientRect();
     const well=cabinet.querySelector('.m2-case-well'),wr=rect(well);
     const cards=[...cabinet.querySelectorAll('.m2-case-contents .m2-archive-card')];
     const metrics=cards.map(card=>{
      const r=rect(card),text=card.querySelector('.m2-museum-card-copy'),
       copy=card.querySelector('.m2-card-copy-group'),
       art=card.querySelector('.m2-card-miniature');
      const tr=rect(text),cr=rect(copy);
      return {
       id:card.dataset.card,top:r.top,bottom:r.bottom,
       width:r.width,
       inWell:r.left>=wr.left-2 && r.right<=wr.right+2 && r.top>=wr.top-2 && r.bottom<=wr.bottom+2,
       textVisible:tr.width>0 && tr.height>0 && tr.left>=cr.left-2 && tr.right<=cr.right+2 &&
          text.scrollHeight<=text.clientHeight+2 && text.scrollWidth<=text.clientWidth+2,
       artVisible:art.complete && art.naturalWidth>0 && rect(art).width>=19,
       visuallyVisible:getComputedStyle(card).visibility!=='hidden' && getComputedStyle(card).opacity!=='0'
      };
     });
     return {
      zone:cabinet.dataset.zone,
      cards:metrics,
      wellClipped:well.scrollHeight>well.clientHeight+2,
      cabinetFramesCards:cards.every(card=>card.getBoundingClientRect().bottom<=cabinet.getBoundingClientRect().bottom+2),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
      wellWidth:wr.width,
      nonOverlapping:metrics.every((card,i)=>i===0||card.top>=metrics[i-1].bottom-2)
     };
    });
    assert.ok(layout.cards.every(x=>x.inWell&&x.textVisible&&x.artVisible&&x.visuallyVisible),
      JSON.stringify({size,zone,layout}));
    assert.equal(layout.wellClipped,false,JSON.stringify({size,zone,layout}));
    assert.equal(layout.cabinetFramesCards,true,JSON.stringify({size,zone,layout}));
    assert.equal(layout.horizontalOverflow,false,JSON.stringify({size,zone,layout}));
    assert.equal(layout.nonOverlapping,true,JSON.stringify({size,zone,layout}));
    await page.screenshot({path:'test-output/m2-e1-filled-'+key+'.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
 await scenario('Once cartelas repartidas sin recortes: arrastre en escritorio y pulsación móvil',async()=>{
  for(const mode of ['desktop-drag','mobile-tap']){
   const size=mode==='desktop-drag'?{width:1365,height:900}:{width:390,height:844};
   const {page,context,errors}=await open('teacher',size);
   try{
    const zones=['economic','demographic','religious','political','ideological'];
    const ids=await page.locator('.m2-museum-desktop [data-card]').evaluateAll(cards=>cards.map(c=>c.dataset.card));
    for(const [index,id] of ids.entries()){
     const zone=zones[index%zones.length];
     if(mode==='desktop-drag'){
      await page.locator('.m2-museum-desktop [data-card="'+id+'"]').dragTo(
       page.locator('[data-zone="'+zone+'"] .m2-case-target'));
     }else{
      await page.locator('.m2-museum-desktop [data-card="'+id+'"]').click();
      await page.locator('[data-zone="'+zone+'"] .m2-case-title-action').click();
     }
     assert.equal(await page.locator('[data-zone="'+zone+'"] [data-card="'+id+'"]').count(),1,
       'La ficha '+id+' debe llegar a '+zone+' mediante '+mode);
    }
    assert.equal(await page.locator('.m2-museum-desktop [data-card]').count(),0);
    for(const zone of zones){
     const target=page.locator('[data-zone="'+zone+'"] .m2-case-target');
     await target.scrollIntoViewIfNeeded();
     const canReceive=await target.evaluate(element=>{
      const rect=element.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
      return element.contains(document.elementFromPoint(x,y)) &&
       getComputedStyle(element).pointerEvents!=='none' && rect.height>=24;
     });
     assert.ok(canReceive,'La zona de soltar en '+zone+' no debe quedar tapada por las tarjetas ('+mode+')');
    }
    const result=await page.locator('[data-zone]').evaluateAll(cabinets=>cabinets.map(cabinet=>{
     const w=cabinet.querySelector('.m2-case-well'),wr=w.getBoundingClientRect();
     const cards=[...cabinet.querySelectorAll('.m2-archive-card')];
     return {
      zone:cabinet.dataset.zone,count:cards.length,
      fit:cards.every(c=>{
       const r=c.getBoundingClientRect(),text=c.querySelector('.m2-museum-card-copy');
       return r.left>=wr.left-2&&r.right<=wr.right+2&&r.top>=wr.top-2&&r.bottom<=wr.bottom+2 &&
        c.querySelector('.m2-card-miniature').naturalWidth>0 &&
        text.scrollWidth<=text.clientWidth+2 && text.scrollHeight<=text.clientHeight+2;
      })
     };
    }));
    assert.deepEqual(result.map(x=>x.count),[3,2,2,2,2]);
    assert.ok(result.every(x=>x.fit),JSON.stringify({mode,result}));
    await page.screenshot({path:'test-output/m2-e1-distributed-'+mode+'.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });



 await scenario('Atlas 3: cuatro apartados con datos PDF, radios, mapa y maletas',async()=>{
  const {page,context,errors}=await open('teacher',{width:1672,height:941});
  try{
   await page.locator('[data-open="3"]').click();
   await page.locator('.m2-atlas-screen').waitFor({state:'visible'});
   assert.equal(await page.locator('.m2-atlas-heading h1').innerText().then(t=>t.includes('MIGRAZIOEN BULEGOA')),true);
   assert.equal(await page.locator('.m2-atlas-pop-row').count(),3);
   assert.equal(await page.locator('.m2-atlas-top-question').count(),2);
   assert.equal(await page.locator('.m2-atlas-route-card').count(),3);
   assert.equal(await page.locator('.m2-atlas-statement').count(),5);
   assert.equal(await page.locator('.m2-atlas-luggage-card').count(),8);
   assert.equal(await page.locator('.m2-atlas-luggage-card img.m2-atlas-card-illustration').count(),8,
     'Las ocho cartelas deben llevar una imagen independiente y sin fondo');
   const art=await page.locator('.m2-atlas-luggage-card img.m2-atlas-card-illustration').evaluateAll(imgs=>imgs.map(img=>{
     const canvas=document.createElement('canvas');
     // No reducir a 2×2: el reescalado mezclaría píxeles opacos y
     // transparentes, produciendo un falso fallo en los bordes.
     canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(img,0,0);
     return {
      url:new URL(img.src).pathname,
      loaded:img.complete&&img.naturalWidth>=680&&img.naturalHeight>=500,
      transparent:ctx.getImageData(0,0,1,1).data[3]<10,
      illustrated:[[.28,.43],[.50,.52],[.70,.53],[.5,.78]].some(([fx,fy])=>
        ctx.getImageData(Math.floor(img.naturalWidth*fx),Math.floor(img.naturalHeight*fy),1,1).data[3]>90),
      visible:getComputedStyle(img).display!=='none'&&img.getBoundingClientRect().height>=52
     };
   }));
   assert.equal(new Set(art.map(img=>img.url)).size,8,'Cada cartela debe tener su propia escena');
   const expectedBagArt=['growth','conditions','better','conversion','settlement','missions','oceania','faith'];
   assert.deepEqual(
    art.map(img=>img.url.split('/').pop()),
    expectedBagArt.map(name=>'m2-vintage-'+name+'-transparent.webp'),
    'Las ocho imágenes deben ser los motivos del diseño antiguo, a 720×540 con transparencia, no las escenas nuevas'
   );
   assert.ok(art.every(img=>img.loaded&&img.visible&&img.transparent&&img.illustrated),JSON.stringify(art));
   assert.equal(await page.locator('[data-atlas-bag-zone].m2-atlas-suitcase').count(),2);
   assert.equal(await page.locator('.m2-atlas-check[data-atlas-stage="4"]').isDisabled(),true);
   const imgs=await page.locator('.m2-atlas-screen img').evaluateAll(els=>els.map(i=>({name:i.src,loaded:i.complete&&i.naturalWidth>0})));
   assert.ok(imgs.length>=5&&imgs.every(x=>x.loaded),JSON.stringify(imgs));
   const artAssets=await page.evaluate(async()=>{
    const files=[
     'm2-reference-harbor.webp','m2-reference-port-photo.webp',
     'm2-reference-old-luggage.webp','m2-reference-right-steamer.webp',
     'm2-reference-red-suitcase.webp','m2-reference-blue-suitcase.webp',
     'm2-reference-open-leather.webp',
     'm2-atlas-original-luggage-clean.svg'
    ];
    return Promise.all(files.map(file=>new Promise(resolve=>{
     const im=new Image();
     im.onload=()=>resolve({file,loaded:im.naturalWidth>40&&im.naturalHeight>40});
     im.onerror=()=>resolve({file,loaded:false});
     im.src='./assets/'+file;
    })));
   });
   assert.ok(artAssets.every(item=>item.loaded),'Las piezas de la ilustración aprobada deben cargar: '+JSON.stringify(artAssets));
   const cssArt=await page.locator('.m2-atlas-screen').evaluate(root=>{
    const get=(selector,pseudo)=>getComputedStyle(root.querySelector(selector),pseudo).backgroundImage;
    return {
     harbour:get('.m2-atlas-route-activity','::before'),
     luggage:get('.m2-atlas-luggage-activity','::before'),
     photograph:get('.m2-atlas-facts-activity','::after'),
     tray:get('.m2-atlas-luggage-available'),
     red:get('.m2-atlas-suitcase-cause'),
     blue:get('.m2-atlas-suitcase-effect')
    };
   });
   for(const [part,file] of Object.entries({
    harbour:'m2-reference-harbor.webp',
    luggage:'m2-atlas-original-luggage-clean.svg',
    photograph:'m2-reference-port-photo.webp',
    tray:'m2-reference-open-leather.webp',
    red:'m2-reference-red-suitcase.webp',
    blue:'m2-reference-blue-suitcase.webp'
   }))assert.ok(cssArt[part].includes(file),part+' debería conservar la ilustración original');
   await ensureAtlasPicturesDecoded(page);
   await page.screenshot({path:'test-output/m2-e3-atlas-initial-1672x941.png',fullPage:true,animations:'disabled'});
   // Incorrect entries are allowed; no truth coloring or hints.
   await page.locator('select[data-field="1850"]').selectOption('450');
   await page.locator('input[data-field="migration"][value="sea_control"]').check();
   assert.equal(await page.locator('[data-state="error"]').count(),0);
   assert.equal(await page.locator('.m2-atlas-total').innerText().then(x=>x.trim().startsWith('2 /')),true);
   await page.locator('[data-atlas-route="africa"]').click();
   assert.equal(await page.locator('[data-atlas-route="africa"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-atlas-target="oceania"]').click();
   assert.equal(await page.locator('[data-atlas-pin]').count(),0);
   await page.locator('[data-atlas-bag-card="growth"]').click();
   assert.equal(await page.locator('[data-atlas-bag-card="growth"]').getAttribute('aria-pressed'),'true');
   await page.locator('.m2-atlas-luggage-drop[data-atlas-bag-zone="cause"]').click();
   assert.equal(await page.locator('.m2-atlas-suitcase-cause [data-atlas-bag-card="growth"]').count(),1);
   assert.equal(await page.locator('.m2-atlas-suitcase-cause [data-atlas-bag-card="growth"] img.m2-atlas-card-illustration').count(),1,
     'La misma ilustración debe acompañar a la ficha al colocarla');
   await page.locator('.m2-atlas-suitcase-cause [data-atlas-bag-card="growth"]').click();
   await page.locator('.m2-atlas-luggage-drop[data-atlas-bag-zone="effect"]').click();
   assert.equal(await page.locator('.m2-atlas-suitcase-effect [data-atlas-bag-card="growth"]').count(),1);
   await ensureAtlasPicturesDecoded(page);
   await page.screenshot({path:'test-output/m2-e3-atlas-partial-1672x941.png',fullPage:true,animations:'disabled'});
   await page.locator('[data-open="4"]').click();
   await page.locator('[data-open="3"]').click();
   assert.equal(await page.locator('select[data-field="1850"]').inputValue(),'450');
   assert.equal(await page.locator('input[data-field="migration"][value="sea_control"]').isChecked(),true);
   assert.equal(await page.locator('.m2-atlas-suitcase-effect [data-atlas-bag-card="growth"]').count(),1);
   assert.deepEqual(await page.evaluate(()=>window.__m2RpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });

 await scenario('Atlas 3: encuadre de la captura original 1536×691 con márgenes 16:9',async()=>{
  const {page,context,errors}=await open('teacher',{width:1536,height:691});
  try{
   await page.locator('[data-open="3"]').click();
   await page.locator('.m2-atlas-screen').waitFor({state:'visible'});
   await ensureAtlasPicturesDecoded(page);
   const bounds=await page.locator('.m2-atlas-screen').evaluate(el=>{
    const r=el.getBoundingClientRect();
    const cards=[...el.querySelectorAll('.m2-atlas-luggage-card')];
    const inside=cards.every(c=>{const q=c.getBoundingClientRect();return q.width>40&&q.height>55});
    const captionsFit=cards.every(c=>{const p=c.querySelector('span:last-child');return p&&p.getBoundingClientRect().bottom<=c.getBoundingClientRect().bottom+2});
    const main=el.querySelector('.m2-atlas-main');
    const travellers=getComputedStyle(main,'::before');
    const travellersBottom=main.getBoundingClientRect().top+
      parseFloat(travellers.top)+parseFloat(travellers.height);
    const secondTitleTop=el.querySelector('.m2-atlas-route-activity>header h2').getBoundingClientRect().top;
    const titleUnobscured=travellersBottom<secondTitleTop+1;
    return {left:r.left,width:r.width,height:r.height,visibleCards:cards.length,
      cardsReadable:inside,captionsFit,titleUnobscured,travellersBottom,secondTitleTop,viewport:innerWidth};
   });
   assert.ok(Math.abs(bounds.left-154)<4&&Math.abs(bounds.width-1228)<4,
     'La sala debe centrarse en 16:9 como la captura antigua: '+JSON.stringify(bounds));
   assert.equal(bounds.visibleCards,8);
   assert.equal(bounds.cardsReadable,true);
   assert.equal(bounds.captionsFit,true,'Los ocho rótulos deben verse completos sin recorte: '+JSON.stringify(bounds));
   assert.equal(bounds.titleUnobscured,true,'El grabado de viajeros no puede tapar el título de la vitrina 2: '+JSON.stringify(bounds));
   await page.screenshot({path:'test-output/m2-e3-reference-1536x691.png',fullPage:true,animations:'disabled'});
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });

 await scenario('Atlas 3: cinco desplegables reales y ocho cartelas visibles en una sola maleta',async()=>{
  for(const size of [{width:1672,height:941},{width:390,height:844}]){
   const {page,context,errors}=await open('teacher',size);
   try{
    await page.locator('[data-open="3"]').click();
    assert.equal(await page.locator('.m2-atlas-statement-select').count(),5);
    assert.equal(await page.locator('.m2-atlas-migrants-foreground').evaluate(el=>el.complete&&el.naturalWidth>0&&el.src.includes('m2-atlas-travelers-cutout.webp')),true);
    await page.locator('.m2-atlas-statement-select[data-field="statement_1"]').selectOption('gezurra');
    assert.equal(await page.locator('.m2-atlas-statement-select[data-field="statement_1"]').inputValue(),'gezurra');
    assert.equal(await page.locator('.m2-atlas-screen [data-state="error"]').count(),0);
    const ids=await page.locator('.m2-atlas-luggage-cards [data-atlas-bag-card]').evaluateAll(els=>els.map(el=>el.dataset.atlasBagCard));
    assert.equal(ids.length,8);
    for(const id of ids){
     await page.locator('.m2-atlas-luggage-cards [data-atlas-bag-card="'+id+'"]').click();
     await page.locator('.m2-atlas-luggage-drop[data-atlas-bag-zone="cause"]').click();
    }
    assert.equal(await page.locator('.m2-atlas-suitcase-cause .m2-atlas-packed').count(),8);
    const allPacked=await page.locator('.m2-atlas-suitcase-cause .m2-atlas-packed img').evaluateAll(imgs=>imgs.map(img=>({
     source:new URL(img.src).pathname.split('/').pop(),
     loaded:img.complete&&img.naturalWidth>=680,
     visible:img.getBoundingClientRect().width>=32
    })));
    assert.ok(allPacked.every(x=>x.loaded&&x.visible&&x.source.endsWith('-transparent.webp')),JSON.stringify(allPacked));
    const metrics=await page.locator('.m2-atlas-suitcase-cause').evaluate(box=>{
     const items=[...box.querySelectorAll('.m2-atlas-packed')];
     const bound=box.getBoundingClientRect();
     return {num:items.length,clipped:items.some(el=>{
      const r=el.getBoundingClientRect();return r.left<bound.left-2||r.right>bound.right+2||r.bottom>bound.bottom+2;
     }),missing:items.some(el=>el.offsetWidth<25||el.offsetHeight<20),
     overlapping:items.some((el,i)=>items.slice(0,i).some(prev=>{
      const a=el.getBoundingClientRect(),b=prev.getBoundingClientRect();
      return Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 &&
       Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
     }))};
    });
    assert.deepEqual(metrics,{num:8,clipped:false,missing:false,overlapping:false},JSON.stringify({size,metrics}));
    assert.ok(await page.locator('.m2-atlas-luggage-drop[data-atlas-bag-zone="cause"]').isVisible());
    await ensureAtlasPicturesDecoded(page);
    await page.screenshot({path:'test-output/m2-e3-filled-suitcase-'+size.width+'.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
 await scenario('Atlas 3: cabecera panorámica fiel y respuestas superiores completas',async()=>{
  for(const width of [1672,1365]){
   const {page,context,errors}=await open('teacher',{width,height:941});
   try{
    await page.locator('[data-open="3"]').click();
    assert.equal(await page.locator('.m2-atlas-home-link').isVisible(),true);
    const geometry=await page.locator('.m2-atlas-screen').evaluate(root=>{
     const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
     const head=box(root.querySelector('.m2-atlas-heading'));
     const main=box(root.querySelector('.m2-atlas-main'));
     const questions=[...root.querySelectorAll('.m2-atlas-top-question')].map(q=>{
      const outer=box(q),last=box(q.querySelector('.m2-atlas-radio:last-child'));
      return {outer,last,inside:last.bottom<=outer.bottom+2&&last.right<=outer.right+2};
     });
     return {head,main,questions,viewport:innerWidth};
    });
    assert.ok(geometry.head.height<=80,JSON.stringify(geometry));
    assert.ok(geometry.main.height<=285,JSON.stringify(geometry));
    assert.ok(geometry.questions.every(q=>q.inside),'Las respuestas no deben cortarse al igualar la referencia: '+JSON.stringify(geometry));
    assert.ok(geometry.main.left>=-2&&geometry.main.right<=width+2,JSON.stringify(geometry));
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });

 await scenario('Atlas 3: sin desbordes ni controles cortados a 1672, 1365, 768, 390 y 320 px',async()=>{
  for(const size of [{width:1672,height:941},{width:1365,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
   const {page,context,errors}=await open('teacher',size);
   try{
    await page.locator('[data-open="3"]').click();
    const metrics=await page.locator('.m2-atlas-screen').evaluate(root=>{
     const fields=[...root.querySelectorAll('select,.m2-atlas-radio input,.m2-atlas-luggage-drop,.m2-atlas-pin')];
     const rects=[...root.querySelectorAll('.m2-atlas-activity,.m2-atlas-main,.m2-atlas-heading')].map(el=>{
      const r=el.getBoundingClientRect();return {x:r.left,right:r.right,w:r.width};
     });
     const offscreen=fields.filter(el=>{const r=el.getBoundingClientRect();return r.width<0||r.left<0||r.right>innerWidth+2}).length;
     return {scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
       offscreen,rects};
    });
    assert.ok(metrics.scrollWidth<=metrics.viewport+1,JSON.stringify({size,metrics}));
    assert.ok(metrics.rects.every(r=>r.w>100&&r.x>=-2&&r.right<=size.width+2),JSON.stringify({size,metrics}));
    if([1672,390,320].includes(size.width))
     await ensureAtlasPicturesDecoded(page);
     await page.screenshot({path:'test-output/m2-e3-atlas-'+size.width+'.png',fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
 await scenario('Referencia 16:9 en 1672×941: cinco vitrinas y escenografía visible',async()=>{
  const {page,context,errors}=await open('teacher',{width:1672,height:941});
  try{
   assert.equal(await page.locator('.m2-case-scene').count(),5);
   const cardLayout=await page.locator('.m2-museum-cards').evaluate(grid=>{
     const last=grid.querySelector('.m2-museum-card:last-of-type')?.getBoundingClientRect();
     const rect=grid.getBoundingClientRect();
     return {lastEdge:last?.right??0,edge:rect.right};
   });
   assert.ok(cardLayout.edge-cardLayout.lastEdge<25,'La segunda fila de cartelas debe ocupar toda la mesa');
   const dimensions=await page.evaluate(()=>{
     const names=['.m2-museum-interaction','.m2-museum-cabinet-wall','.m2-museum-desktop','.m2-controls'];
     return names.map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {part:sel,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}});
   });
   console.log('M2 museum geometry 1672×941:',JSON.stringify(dimensions));
   const {overflow,height}=await page.evaluate(()=>({
     overflow:document.documentElement.scrollWidth-innerWidth,
     height:document.documentElement.scrollHeight
   }));
   assert.ok(overflow<=1,'Desbordamiento horizontal en 16:9: '+overflow);
   assert.ok(height<=1200,'El ejercicio pierde la composición panorámica: '+height+'px');
   const lateral=await page.locator('.m2-first-room').evaluate(el=>{
     const l=getComputedStyle(el,'::before'),r=getComputedStyle(el,'::after');
     return {left:parseFloat(l.left),right:parseFloat(r.left),rightWidth:parseFloat(r.width),viewport:innerWidth};
   });
   assert.ok(lateral.left<=1,'El adorno izquierdo se ha desplazado: '+JSON.stringify(lateral));
   assert.ok(lateral.right+lateral.rightWidth>=lateral.viewport-2,'La decoración derecha se ha colocado encima de la izquierda: '+JSON.stringify(lateral));
   await page.screenshot({path:'test-output/m2-e1-concepto-1672x941.png',fullPage:true,animations:'disabled'});
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
    if(size.width===390){
     const title=await page.locator('.m2-case-ideological .m2-case-title-action').evaluate(el=>({
      sw:el.scrollWidth,cw:el.clientWidth,sh:el.scrollHeight,ch:el.clientHeight
     }));
     assert.ok(title.sw<=title.cw+1 && title.sh<=title.ch+1,'El rótulo ideológico no debe recortarse en móvil');
     await page.screenshot({path:'test-output/m2-e1-mobile.png',fullPage:true,animations:'disabled'});
    }
    assert.deepEqual(errors,[]);
   }finally{await context.close()}
  }
 });
}finally{await browser.close()}
console.log('Misión 2: '+count+' escenarios verificados.');
