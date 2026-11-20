/**
 * Auditoría conservadora de la web PÚBLICA con JavaScript real y Supabase real
 * sin iniciar sesión. Nunca registra usuarios, pulsa "Sartu", envía RPC ni
 * cambia datos. No sustituye las pruebas con cuentas reales autorizadas.
 *
 * Ejecutar: PUBLIC_QA_BASE_URL=https://... node tests/public-live-browser-audit.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.PUBLIC_QA_BASE_URL || 'https://aratzirakasle-lgtm.github.io/Inperialismoa/';
const screenSizes = [
  {name:'ordenador',width:1365,height:900},
  {name:'tableta',width:768,height:1024},
  {name:'movil',width:390,height:844}
];
const protectedPages = [
  'bi-sistema.html',
  'inperialismoaren-definizioa.html',
  'inperioen-aztarnak.html',
  'esaldiak-osatu.html'
];
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
const report = [];
const failures = [];
const median = values => values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
const kb = bytes => +(bytes/1024).toFixed(1);

async function openUnauthenticated(route, size, screenshot = false) {
  const context = await browser.newContext({
    viewport:{width:size.width,height:size.height},
    deviceScaleFactor:1,
    reducedMotion:'reduce',
    serviceWorkers:'block'
  });
  await context.addInitScript(() => {
    window.__qaMetrics={lcp:null,cls:0};
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.__qaMetrics.lcp=Math.round(entry.startTime);
      }).observe({type:'largest-contentful-paint',buffered:true});
    } catch {}
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__qaMetrics.cls+=entry.value;
        }
      }).observe({type:'layout-shift',buffered:true});
    } catch {}
  });
  const page=await context.newPage();
  const errors=[],httpErrors=[],rpcWrites=[];
  let firstPartyBytes=0;
  const origin=new URL(base).origin;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.url().startsWith(origin) && response.status()>=400) httpErrors.push({status:response.status(),url:response.url()});
  });
  page.on('request',request=>{
    try {
      if(request.method()!=='GET'&&new URL(request.url()).pathname.includes('/rest/v1/rpc/'))rpcWrites.push(request.url());
    } catch {}
  });
  page.on('requestfinished',async request=>{
    try {
      if(new URL(request.url()).origin===origin) {
        const sizes=await request.sizes();
        firstPartyBytes+=sizes.responseBodySize;
      }
    } catch {}
  });
  try {
    const target=new URL(route,base).href;
    await page.goto(target,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForURL(url=>url.pathname.endsWith('/index.html')||url.pathname.endsWith('/Inperialismoa/'),{timeout:25000});
    await page.locator('#login-screen').waitFor({state:'visible',timeout:25000});
    await page.locator('#login-form').waitFor({state:'visible',timeout:10000});
    await page.waitForTimeout(800);
    assert.equal(await page.locator('#app-shell').isVisible(),false,'Se muestra el panel privado sin sesión');
    assert.equal(await page.locator('#login-submit').isVisible(),true,'El acceso no aparece');
    assert.equal(await page.locator('#demo-access').isVisible(),false,'La demo se ha activado');
    assert.deepEqual(rpcWrites,[],'Se enviaron RPC sin autorización');
    assert.deepEqual(httpErrors,[],'Error HTTP de un recurso propio');
    assert.deepEqual(errors,[],'Error JavaScript en el navegador');
    const metrics=await page.evaluate(()=>{
      const nav=performance.getEntriesByType('navigation')[0];
      const button=document.querySelector('#login-submit').getBoundingClientRect();
      return {
        domContentLoadedMs:Math.round(nav?.domContentLoadedEventEnd||0),
        pageLoadMs:Math.round(nav?.loadEventEnd||0),
        lcpMs:window.__qaMetrics?.lcp??null,
        cls:+(window.__qaMetrics?.cls||0).toFixed(4),
        documentWidth:document.documentElement.scrollWidth,
        viewportWidth:window.innerWidth,
        loginButtonVisibleInViewport:button.width>0&&button.height>0&&button.right>0&&button.left<window.innerWidth&&button.bottom>0&&button.top<window.innerHeight
      };
    });
    if(screenshot) {
      await fs.mkdir('test-output',{recursive:true});
      await page.screenshot({path:`test-output/login-${size.name}.png`,animations:'disabled'});
    }
    return {...metrics,firstPartyKiB:kb(firstPartyBytes)};
  } finally {
    await context.close();
  }
}

try {
  for(const screen of screenSizes) {
    const samples=[];
    for(let attempt=0;attempt<3;attempt++){
      try{samples.push(await openUnauthenticated('index.html',screen,attempt===0))}
      catch(error){failures.push(`${screen.name} portada #${attempt+1}: ${error.stack||error}`)}
    }
    if(samples.length===3)report.push({
      type:'login real sin credenciales',viewport:screen.name,
      domLoadedMedianMs:median(samples.map(x=>x.domContentLoadedMs)),
      loadMedianMs:median(samples.map(x=>x.pageLoadMs)),
      lcpMedianMs:samples.every(x=>x.lcpMs!==null)?median(samples.map(x=>x.lcpMs)):null,
      clsMedian:median(samples.map(x=>x.cls)),
      transferMedianKiB:median(samples.map(x=>x.firstPartyKiB)),
      horizontalOverflowPx:Math.max(...samples.map(x=>Math.max(0,x.documentWidth-x.viewportWidth))),
      loginButtonInViewport:samples.every(x=>x.loginButtonVisibleInViewport)
    });
    for(const path of protectedPages) {
      try{
        const result=await openUnauthenticated(path,screen,false);
        report.push({type:'protección de ruta sin sesión',viewport:screen.name,route:path,redirectsToLogin:true,cls:result.cls});
      }catch(error){failures.push(`${screen.name} ${path}: ${error.stack||error}`)}
    }
  }
} finally { await browser.close(); }
console.log('AUDITORÍA PÚBLICA con JS y conexión real (sin autenticación ni escrituras)');
console.log(JSON.stringify({base,report,failures},null,2));
if(failures.length)process.exitCode=1;
console.log('LÍMITE: no se ha iniciado sesión ni se ha completado un juego. Medidas en runner CI, no en dispositivos de alumnos.');
