import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.CINEMA_ORIGIN || 'http://127.0.0.1:8765';
const path = '/berlingo-areto-sekretua.html';
const url = origin + path + '?preview=1&station=cinema';
const output = process.env.CINEMA_OUTPUT || 'test-output';
const browser = await chromium.launch({
  headless:true, executablePath:process.env.CINEMA_CHROMIUM,
  channel:process.env.SMOKE_USE_CHROME === '1' ? 'chrome' : undefined, args:['--no-sandbox'],
});
const mock = role => `window.supabase={createClient:()=>({
  auth:{getUser:async()=>({data:{user:${role ? '{id:"preview-test"}' : 'null'}},error:null})},
  from:()=>({select:()=>({eq:()=>({single:async()=>({data:{role:${JSON.stringify(role)}},error:null})})})})
})};`;

try {
  await mkdir(output,{recursive:true});
  for (const role of ['student',null,'teacher']) {
    const gate = await browser.newPage();
    await gate.route('https://cdn.jsdelivr.net/**',route => route.fulfill({contentType:'application/javascript',body:mock(role)}));
    await gate.goto(role === 'teacher' ? origin + path + '?station=cinema' : url);
    await gate.waitForURL('**/index.html');
    assert.equal(await gate.locator('.m3-cinema').count(),0);
    await gate.close();
  }
  const page = await browser.newPage({
    viewport:{width:1440,height:960},
    ...(process.env.CINEMA_VIDEO === '1' && {recordVideo:{dir:output,size:{width:1440,height:960}}}),
  });
  const errors = [];
  let authChecks = 0;
  page.on('pageerror',error => errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/**',route => {
    authChecks++;
    return route.fulfill({contentType:'application/javascript',body:mock('teacher')});
  });
  await page.goto(url);
  const root = page.locator('.m3-cinema');
  const screen = root.locator('[data-cinema-screen]');
  await root.waitFor();
  assert.equal(await root.getAttribute('data-cinema-build'),'premium3');
  const verifyLabels=async()=>{const options=await root.locator('[data-cinema-option]').evaluateAll(els=>els.map(el=>({label:el.getAttribute('aria-label'),text:el.textContent.trim()})));assert.equal(options.length,12);assert.ok(options.every(o=>o.text===o.label&&o.text.length>1),JSON.stringify(options));};
  await verifyLabels();
  const assets = {
    room:[1672,941], train:[1432,876], 'train-wheel':[136,136], ship:[1414,1036],
    'reel-front':[230,230], 'reel-back':[217,217], projector:[825,1083],
    walnut:[740,106], dial:[117,117], button:[58,58],
  };
  await root.evaluate(async (_, assets) => {
    await Promise.all(Object.entries(assets).map(async ([key,[width,height]]) => {
      const img = new Image();
      img.src = './assets/m3-cinema/premium/' + key + '.webp';
      await img.decode();
      if (img.naturalWidth !== width || img.naturalHeight !== height) throw Error('Invalid artwork: ' + key);
    }));
  },assets);
  const projector = root.locator('.cinema-projector');
  assert.equal(await projector.count(),1);
  assert.equal(await projector.locator('.cinema-projector-body').isVisible(),false);
  assert.equal(await projector.locator('.cinema-reel:visible').count(),2);
  const visibleChoices = async () => {
    const faults = await root.locator('.cinema-control').evaluateAll(controls => controls.flatMap(control => {
      const outer = control.getBoundingClientRect();
      if (outer.bottom > control.closest('.cinema-desk').querySelector('.cinema-actions').getBoundingClientRect().top + 1) {
        return ['Overlapping controls: ' + control.dataset.cinemaField];
      }
      return [...control.querySelectorAll('h3,output:not(.cinema-accessible-choice),button')].filter(el => {
        const bounds = el.getBoundingClientRect();
        return bounds.top < outer.top - 1 || bounds.bottom > outer.bottom + 1 ||
          bounds.left < outer.left - 1 || bounds.right > outer.right + 1 ||
          (el.textContent.trim() && el.scrollWidth > el.clientWidth + 1);
      }).map(el => el.textContent?.trim() || el.getAttribute('aria-label'));
    }));
    assert.deepEqual(faults,[]);
  };

  const image = () => screen.evaluate(async el => {
    const src = getComputedStyle(el).getPropertyValue('--shot').trim().slice(5,-2);
    if (!src) throw Error('Missing scene source');
    const img = new Image();
    img.src = src;
    try { await img.decode(); } catch { throw Error('Undecodable backdrop: ' + src); }
    return src.endsWith('.svg') ? img.naturalWidth > 0 : img.naturalWidth >= 800;
  });
  const shot = async name => {
    assert.equal(await image(),true);
    await page.screenshot({path:`${output}/m3-cinema-${name}.png`});
  };
  const choose = (field, option) => root.locator(`[data-cinema-field="${field}"] [data-cinema-option="${option}"]`).click();
  const control = field => root.locator(`[data-cinema-field="${field}"]`);
  const act = field => control(field).locator('[data-cinema-act]').click();
  const count = root.locator('[data-cinema-decisions]');
  const check = root.locator('[data-cinema-check]');
  const skip = root.locator('[data-cinema-skip]');
  const pause = root.locator('[data-cinema-pause]');
  const next = root.locator('[data-cinema-next]');
  await shot('01-inicio');
  assert.equal(await root.locator('.cinema-film-label').allTextContents().then(a => a.join(',')),'A FILMA,B FILMA,C FILMA');
  assert.equal(await root.locator('[data-cinema-film="b"]').isDisabled(),true);
  assert.equal(await page.locator('#m3-dialog-header [data-m3-room="6"]').isDisabled(),true);
  assert.equal(await root.locator('[data-cinema-final]').isDisabled(),true);
  await check.click();
  assert.equal(await root.locator('[data-result="pending"].cinema-montage-frame').count(),4);
  await choose('t_a_sender','jp');
  await check.click();
  assert.equal(await root.locator('[data-result="wrong"].cinema-montage-frame').count(),1);
  await shot('10-montaje-incorrecto');

  const dial = control('t_a_sender').locator('[data-cinema-dial]');
  await dial.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  assert.notEqual(await dial.evaluate(el => getComputedStyle(el).outlineStyle),'none');
  await dial.press('ArrowRight');
  assert.equal(await control('t_a_sender').locator('output').textContent(),'Errusia');
  assert.equal(await control('t_a_sender').getAttribute('data-result'),'selected');
  await check.click();
  assert.equal(await root.locator('[data-cinema-film="a"] .cinema-film-label').textContent(),'Errusia');
  await shot('02-rusia-reposo');
  await choose('t_a_siberia','siberia');
  const lever = control('t_a_siberia').locator('[data-cinema-act]');
  const box = await lever.boundingBox();
  await page.mouse.move(box.x + box.width/2,box.y + box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width/2 + 29,box.y + box.height/2 - 14,{steps:4});
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector('.m3-cinema').dataset.running === 'true');
  const train = screen.locator('.cinema-train');
  assert.match(await train.locator('img').getAttribute('src'),/premium\/train\.webp$/);
  const wheel = screen.locator('.cinema-train-wheel');
  const reels = root.locator('.cinema-reel i');
  const transform = el => el.evaluate(node => getComputedStyle(node).transform);
  const wheelStart = await transform(wheel);
  const reelStarts = await Promise.all([0,1].map(i => transform(reels.nth(i))));
  const trainStart = (await train.boundingBox()).x;
  await page.waitForTimeout(520);
  assert.ok((await train.boundingBox()).x > trainStart + 10);
  assert.notEqual(await transform(wheel),wheelStart);
  for (const [i,start] of reelStarts.entries()) assert.notEqual(await transform(reels.nth(i)),start);
  assert.ok(await screen.locator('.cinema-steam i').first().evaluate(el => Number(getComputedStyle(el).opacity)) > 0);
  await pause.click();
  await shot('03-locomotora');
  assert.equal(await root.getAttribute('data-paused'),'true');
  const trainTransform = () => train.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(35);
  const pausedTransform = await trainTransform();
  await page.waitForTimeout(170);
  assert.equal(await trainTransform(),pausedTransform);
  await root.locator('[data-cinema-notes]').click();
  assert.equal(await root.locator('.cinema-notes-dialog').isVisible(),true);
  await root.locator('[data-notes-file]').setInputFiles({name:'ikasgelako-apunteak.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4')});
  assert.match(await root.locator('[data-notes-link]').getAttribute('href'),/^blob:.*#page=22$/);
  await root.locator('[data-notes-close]').click();
  assert.equal(await count.textContent(),'2 / 12 erabaki osatuta');
  await pause.click();
  await skip.click();
  await root.locator('[data-cinema-replay]').click();
  assert.equal(await screen.getAttribute('data-motion'),'true');
  await page.locator('#return').click();
  await root.waitFor({state:'detached'});
  await page.locator('#m3-room-header [data-m3-room="5"]').click();
  assert.equal(await count.textContent(),'2 / 12 erabaki osatuta');
  assert.equal(await root.getAttribute('data-running'),'false');
  await choose('t_a_direction','himalaya-india');
  await act('t_a_direction');
  await page.waitForSelector('.cinema-effect--direction');
  await choose('t_a_china','cape-verde');
  await act('t_a_china');
  await screen.locator('.cinema-map [data-place="cape-verde"]').waitFor();
  await page.waitForTimeout(540);
  await shot('03b-cabo-verde-mapa');
  await choose('t_a_china','china');
  await act('t_a_china');
  await page.waitForSelector('.cinema-effect--arrive');
  await check.click();
  assert.equal(await root.locator('[data-cinema-count]').textContent(),'1 / 3 film berreskuratuta');
  assert.equal(await control('t_a_siberia').locator('[data-cinema-dial]').isDisabled(),true);
  await shot('11-primer-sello');
  await next.click();

  await verifyLabels();
  await shot('04-estados-unidos');
  await choose('t_b_sender','us');
  await act('t_b_sender');
  await choose('t_b_occupation','philippines-puerto-rico');
  await act('t_b_occupation');
  const ship = screen.locator('.cinema-ship');
  assert.match(await ship.locator('.cinema-premium-vehicle-image').getAttribute('src'),/premium\/ship\.webp$/);
  assert.match(await ship.locator('.cinema-reflection').getAttribute('src'),/premium\/ship\.webp$/);
  const boatStart = (await ship.boundingBox()).x;
  await page.waitForTimeout(630);
  assert.ok((await ship.boundingBox()).x > boatStart + 10);
  assert.ok(await screen.locator('.cinema-wake').evaluate(el => Number(getComputedStyle(el).opacity)) > 0);
  await pause.click();
  await shot('05-barco');
  await choose('t_b_cuba','annex');
  assert.equal(await screen.locator('.cinema-effect--annex').count(),0);
  assert.equal(await screen.locator('.cinema-draft').isVisible(),true);
  await check.click();
  assert.equal(await control('t_b_cuba').getAttribute('data-result'),'wrong');
  assert.equal(await root.locator('[data-cinema-film="c"]').isDisabled(),true);
  await choose('t_b_cuba','control');
  await page.waitForTimeout(650);
  assert.equal(await screen.locator('.cinema-effect--control').count(),1);
  await pause.click();
  await shot('06-control-cuba');
  await choose('t_b_war','war-1898');
  await act('t_b_war');
  await check.click();
  await screen.getByText('Filipinak',{exact:true}).waitFor();
  await screen.getByText('Puerto Rico',{exact:true}).waitFor();
  await pause.click();
  await shot('06b-puerto-rico-verificado');
  await next.click();

  await verifyLabels();
  await shot('07-japon');
  await choose('t_c_sender','jp');
  await choose('t_c_annex','formosa-korea');
  await act('t_c_annex');
  await page.waitForTimeout(650);
  await pause.click();
  await shot('08-anexion');
  await choose('t_c_manchuria','manchuria');
  await act('t_c_manchuria');
  await page.waitForTimeout(650);
  await pause.click();
  await shot('09-protectorado');
  await choose('t_c_rivals','china-russia');
  await act('t_c_rivals');
  assert.equal(await screen.locator('.cinema-map [data-place]').count(),2);
  assert.equal(await screen.locator('.cinema-map--rivals .cinema-rival-thread').count(),1);
  await page.setViewportSize({width:1280,height:720});
  await visibleChoices();
  await page.waitForTimeout(550);
  await shot('09b-mandos-1280');
  await page.setViewportSize({width:1440,height:960});
  await check.click();
  await screen.locator('.cinema-caption strong').filter({hasText:/^Japonia$/}).waitFor();
  await page.waitForTimeout(550);
  await pause.click();
  await shot('07b-japon-proyeccion');
  await skip.click();
  assert.equal(await root.locator('[data-cinema-count]').textContent(),'3 / 3 film berreskuratuta');
  assert.equal(await count.textContent(),'12 / 12 erabaki osatuta');
  assert.equal(await page.locator('#m3-dialog-header [data-m3-room="6"]').isDisabled(),true);
  await shot('12-tres-sellos');
  await root.locator('[data-cinema-final]').click();
  await page.waitForTimeout(500);
  await shot('13-proyeccion-final');
  await skip.click();
  await screen.getByText('HIRU FILMAK BERRESKURATUTA').waitFor();
  await shot('13b-placa-final');
  await root.locator('[data-cinema-final]').click();
  await screen.getByText('HIRU FILMAK BERRESKURATUTA').waitFor({timeout:32000});
  assert.equal(await root.locator('.cinema-seal:visible').count(),3);

  await root.locator('[data-cinema-reset]').click();
  await root.locator('.cinema-reset-dialog [value="cancel"]').click();
  assert.equal(await root.locator('.cinema-seal:visible').count(),3);
  await root.locator('[data-cinema-reset]').click();
  await root.locator('.cinema-reset-dialog [value="confirm"]').click();
  await root.getByText('0 / 12 erabaki osatuta',{exact:true}).waitFor();
  assert.equal(await count.textContent(),'0 / 12 erabaki osatuta');
  for (const [width,height] of [[1920,1080],[1440,960],[1366,768],[1280,720],[1024,768],[820,600],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.locator('#station').evaluate(el => { el.scrollTop = 0; });
    assert.equal(await root.evaluate(el => el.scrollWidth > el.clientWidth + 1),false,`Overflow at ${width}`);
    if (width >= 1280) {
      const [frame, actions] = await Promise.all([page.locator('#station').boundingBox(),root.locator('.cinema-actions').boundingBox()]);
      assert.ok(actions.y + actions.height <= frame.y + frame.height,`Controls require scrolling at ${width} × ${height}`);
    }
    await visibleChoices();
    if (width === 1024) assert.equal(await projector.locator('.cinema-projector-body').isVisible(),true);
    if (width === 1280) {
      const [projection, knob] = await Promise.all([
        screen.boundingBox(),control('t_a_sender').locator('[data-cinema-dial]').boundingBox(),
      ]);
      assert.ok(projection.width >= 590 && projection.height >= 295,'Projection aperture lost usable space');
      assert.ok(knob.width >= 42 && knob.height >= 42,'Dial target is too small');
      const plate=await control('t_a_sender').locator('[data-cinema-option]').first().boundingBox();assert.ok(plate.width>65&&plate.height>=20,'Choice plate too small');
    }
    if (width !== 390) await shot(`14-${width}x${height}`);
    if (width === 390) {
      await shot('15-movil');
      await control('t_a_sender').locator('[data-cinema-dial]').click();
      assert.equal(await count.textContent(),'1 / 12 erabaki osatuta');
      await root.locator('.cinema-actions').scrollIntoViewIfNeeded();
      await shot('15b-movil-consola');
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await choose('t_a_siberia','siberia');
  await act('t_a_siberia');
  assert.equal(await screen.getAttribute('data-motion'),'false');
  assert.ok(authChecks > 0);
  assert.deepEqual(errors,[]);
  await page.close();
  if (page.video()) await page.video().saveAs(`${output}/m3-cinema-demo.webm`);
  console.log('Cinema: teacher gate, 12 decisions, playback, reset, responsive layout and browser captures verified.');
} finally {
  await browser.close();
}
