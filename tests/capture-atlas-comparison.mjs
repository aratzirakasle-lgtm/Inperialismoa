import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
await mkdir('docs/capturas',{recursive:true});
try{
 for(const [label,port] of [['antes',8765],['despues',8766]]){
  const page=await browser.newPage({viewport:{width:1672,height:1020},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:'+port+'/tests/atlas-visual-preview.html',{waitUntil:'domcontentloaded',timeout:15000});
  await page.locator('.atlas-photo').waitFor();
  await page.locator('.atlas-photo-img, .ap-mission-artwork').evaluateAll(imgs=>Promise.race([Promise.all(imgs.map(img=>img.decode())),new Promise((_,reject)=>setTimeout(()=>reject(Error('Image decode timeout')),12000))]));
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,3000))]));
  assert.equal(await page.locator('.atlas-signature-ink text').count(),3);
  assert.equal(await page.locator('.ap-earned-medal').count(),2);
  assert.equal(await page.locator('.ap-meter[aria-valuenow="2"]').count(),1);
  await page.locator('.atlas-photo').screenshot({path:'docs/capturas/atlas-'+label+'.png',animations:'disabled'});
  await page.locator('#progress').click();
  await page.locator('#progress').click();
  assert.equal(await page.locator('.ap-earned-medal').count(),1);
  await page.locator('.atlas-photo').screenshot({path:'docs/capturas/atlas-'+label+'-en-curso.png',animations:'disabled'});
  await page.close();
 }
 const comparison=await browser.newPage({viewport:{width:1672,height:1000},deviceScaleFactor:1});
 const before=(await readFile('docs/capturas/atlas-antes.png')).toString('base64');
 const after=(await readFile('docs/capturas/atlas-despues.png')).toString('base64');
 await comparison.setContent('<html><head><style>body{margin:0;background:#191f1a;color:#ecd8b0;font:20px Georgia,serif}main{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px}h1{font:700 23px Georgia;margin:0 0 10px}img{display:block;width:100%;height:auto}section{min-width:0}</style></head><body><main><section><h1>ANTES · versión oficial</h1><img src="data:image/png;base64,'+before+'"></section><section><h1>DESPUÉS · propuesta</h1><img src="data:image/png;base64,'+after+'"></section></main></body></html>');
 await comparison.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 await comparison.locator('main').screenshot({path:'docs/capturas/atlas-comparativa.png'});
 await comparison.close();
}finally{await browser.close()}
