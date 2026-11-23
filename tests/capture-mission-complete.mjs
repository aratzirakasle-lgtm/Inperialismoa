/* Captura la pantalla REAL de la web en un navegador Chromium, con una cuenta
 * de ensayo y un Supabase aislado. No conecta con producción ni altera alumnos.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const ROOT='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1672,height:941},deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.route(url=>url.protocol.startsWith('http')&&!['127.0.0.1','localhost'].includes(url.hostname),
   route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 await context.addInitScript(()=>{
   const student='student-capture',team='team-capture',classId='class-capture';
   const iso='2026-11-23T17:00:00Z';
   const state={
     profiles:[{id:student,role:'student',team_id:team,display_name:'Ikaslea (proba)'}],
     gallery_team_state:[{team_id:team,completed_at:iso}],
     bi_sistema_team_state:[{team_id:team,completed_at:iso}],
     mission1_exercise_completions:[
       {team_id:team,exercise:3,completed_at:iso},
       {team_id:team,exercise:5,completed_at:iso}],
     empire_dossier_team_state:[{team_id:team,completed_at:iso}],
     teams:[{id:team,class_id:classId,name:'Probako taldea'}]
   };
   const board=[
     {team_id:team,class_id:classId,team_name:'Probako taldea',
      exercise_1:true,exercise_2:true,exercise_3:true,
      exercise_4:true,exercise_5:true,mission_completed:true},
     {team_id:'team-example',class_id:classId,team_name:'Beste probako taldea',
      exercise_1:true,exercise_2:true,exercise_3:true,
      exercise_4:false,exercise_5:false,mission_completed:false}
   ];
   const from=table=>{
     const filters=[];
     return {
       select(){return this;},
       eq(col,val){filters.push([col,val]);return this;},
       order(){return this;},
       limit(){return this;},
       in(){return this;},
       maybeSingle(){return Promise.resolve({data:getRows()[0]||null,error:null});},
       single(){return Promise.resolve({data:getRows()[0]||null,error:null});},
       then(ok,bad){return Promise.resolve({data:getRows(),error:null}).then(ok,bad);}
     };
     function getRows(){
       return (state[table]||[]).filter(row=>filters.every(([col,val])=>String(row[col])===String(val)));
     }
   };
   const client={
     auth:{
       getUser:async()=>({data:{user:{id:student}},error:null}),
       getSession:async()=>({data:{session:{user:{id:student}}},error:null}),
       onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})
     },
     from,
     rpc:async(name)=>{
       if(name==='mission1_class_progress')return {data:board,error:null};
       return {data:null,error:{message:'Proba: ez dira daturik gordetzen'}};
     },
     channel:()=>({on(){return this;},subscribe(){return this;}}),
     removeChannel:async()=>{}
   };
   window.supabase={createClient:()=>client};
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(new URL('esaldiak-osatu.html',ROOT).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#completion-title')?.textContent?.includes('Lehen misioa osatuta'));
 await page.waitForSelector('.m1-class-toggle');
 await page.locator('.m1-class-toggle').click();
 await page.waitForSelector('.m1-class-team');
 const heading=(await page.locator('#completion-title').textContent())?.trim();
 assert.match(heading,/Lehen misioa osatuta/);
 assert.equal(await page.locator('.m1-class-team').count(),2);
 assert.equal(await page.locator('#success').isVisible(),true);
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(350);
 await mkdir('docs/capturas',{recursive:true});
 const out='docs/capturas/mision-1-osatuta-ikasle-aurrebista.png';
 await page.screenshot({path:out,fullPage:true,animations:'disabled'});
 console.log('Captura verificada:',out,heading,'; dos equipos simulados; sin datos de producción.');
 if(errors.length)console.warn('Avisos de navegador:',JSON.stringify(errors.slice(0,5)));
 await context.close();
}finally{await browser.close();}
