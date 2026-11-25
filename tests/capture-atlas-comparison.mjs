import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
await mkdir('docs/capturas',{recursive:true});
try{
 for(const [label,port] of [['antes',8765],['despues',8766]]){
  const page=await browser.newPage({viewport:{width:1672,height:1020},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:'+port+'/tests/atlas-visual-preview.html',{waitUntil:'networkidle'});
  await page.locator('.atlas-photo').waitFor();
  await page.locator('.atlas-photo img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.evaluate(()=>document.fonts.ready);
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
}finally{await browser.close()}
