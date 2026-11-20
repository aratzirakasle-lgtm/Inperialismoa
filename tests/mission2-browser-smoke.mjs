/* Ensayo visual y de navegación de la segunda misión con autenticación simulada.
 * No envía datos ni modifica Supabase. Las claves de corrección NO están aquí.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const BASE=process.env.SMOKE_BASE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,channel:process.env.SMOKE_USE_CHROME==='1'?'chrome':undefined,args:['--no-sandbox']});
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


 await scenario('Tercer ejercicio: libro histórico con cinco respuestas y sin pistas',async()=>{
  const {page,context,errors}=await open('teacher',{width:1672,height:941});
  try{
   await page.locator('[data-open="3"]').click();
   await page.locator('.m2-migration-book').waitFor({state:'visible'});
   assert.equal(await page.locator('.m2-migration-folio').count(),2);
   assert.equal(await page.locator('.m2-ledger-year').count(),3);
   assert.equal(await page.locator('.m2-migration-dossier').count(),2);
   assert.deepEqual(await page.locator('select[data-field]').evaluateAll(els=>els.map(el=>el.dataset.field)),
    ['1850','1870','1900','migration','missionaries']);
   const art=await page.locator('.m2-migration-gallery img').evaluateAll(imgs=>imgs.map(img=>({loaded:img.complete&&img.naturalWidth>0,src:img.getAttribute('src')})));
   assert.equal(art.length,3);
   assert.ok(art.every(img=>img.loaded),JSON.stringify(art));
   assert.deepEqual(await page.locator('.m2-migration-gallery select').evaluateAll(els=>els.map(el=>el.value)),['','','','','']);
   assert.match(await page.locator('.m2-migration-progress-count').innerText(),/0 \/ 5/);
   // Selecting a deliberately incorrect value must not reveal a hint or mark it as correct.
   await page.locator('[data-field="1850"]').selectOption('450');
   assert.equal(await page.locator('[data-field="1850"]').inputValue(),'450');
   assert.match(await page.locator('.m2-migration-progress-count').innerText(),/1 \/ 5/);
   assert.equal(await page.locator('.m2-migration-gallery [data-state="error"]').count(),0);
   await page.locator('[data-field="1870"]').selectOption('310');
   await page.locator('[data-field="1900"]').selectOption('400');
   await page.locator('[data-field="migration"]').selectOption('sea_control');
   await page.locator('[data-field="missionaries"]').selectOption('merchants_only');
   assert.match(await page.locator('.m2-migration-progress-count').innerText(),/5 \/ 5/);
   await page.screenshot({path:'test-output/m2-e3-ledger-filled-1672x941.png',fullPage:true,animations:'disabled'});
   // Navigating away/back preserves student-owned draft, not pre-filled correct answers.
   await page.locator('[data-open="4"]').click();
   await page.locator('[data-open="3"]').click();
   assert.equal(await page.locator('[data-field="1850"]').inputValue(),'450');
   assert.equal(await page.locator('[data-field="migration"]').inputValue(),'sea_control');
   assert.deepEqual(await page.evaluate(()=>window.__m2RpcCalls),[]);
   assert.deepEqual(errors,[]);
  }finally{await context.close()}
 });
 await scenario('Tercer ejercicio: texto, controles e ilustraciones visibles de 320 a 1672 px',async()=>{
  for(const size of [{width:1672,height:941},{width:1365,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:700}]){
   const {page,context,errors}=await open('teacher',size);
   try{
    await page.locator('[data-open="3"]').click();
    await page.locator('.m2-migration-gallery').waitFor({state:'visible'});
    const metrics=await page.locator('.m2-migration-gallery').evaluate(root=>{
     const rect=el=>el.getBoundingClientRect();
     const fields=[...root.querySelectorAll('select')];
     const folios=[...root.querySelectorAll('.m2-migration-folio')];
     const r=rect(root);
     return{
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
      foliosVisible:folios.every(f=>{const b=rect(f);return b.width>0&&b.height>0&&b.left>=-1&&b.right<=innerWidth+1}),
      controlsVisible:fields.every(field=>{
       const b=rect(field),parent=rect(field.parentElement);
       return b.width>=100 && b.height>=40 &&
         b.left>=parent.left-2 && b.right<=parent.right+2 &&
         b.left>=-1 && b.right<=innerWidth+1;
      }),
      textFits:[...root.querySelectorAll('.m2-migration-question-title')].every(el=>{
       const b=rect(el);return b.width>100&&el.scrollHeight<=el.clientHeight+2;
      }),
      galleryWidth:r.width
     };
    });
    assert.equal(metrics.horizontalOverflow,false,JSON.stringify({size,metrics}));
    assert.equal(metrics.foliosVisible,true,JSON.stringify({size,metrics}));
    assert.equal(metrics.controlsVisible,true,JSON.stringify({size,metrics}));
    assert.equal(metrics.textFits,true,JSON.stringify({size,metrics}));
    if([1672,390,320].includes(size.width))
     await page.screenshot({path:'test-output/m2-e3-ledger-'+size.width+'.png',fullPage:true,animations:'disabled'});
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
