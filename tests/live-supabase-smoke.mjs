/**
 * Prueba con autenticación REAL de Supabase, en modo SOLO LECTURA.
 * No usa usuarios simulados ni envía respuestas, por lo que no completa la misión.
 *
 * LIVE_STUDENT_EMAIL=... LIVE_STUDENT_PASSWORD=... \
 * LIVE_TEACHER_EMAIL=... LIVE_TEACHER_PASSWORD=... \
 * node tests/live-supabase-smoke.mjs
 *
 * Opcional: LIVE_BASE_URL, LIVE_STUDENT2_EMAIL, LIVE_STUDENT2_PASSWORD.
 * Utilizar SOLO cuentas de ensayo autorizadas; nunca registrar contraseñas.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.LIVE_BASE_URL || 'https://aratzirakasle-lgtm.github.io/Inperialismoa/';
const roles = {
  student: [process.env.LIVE_STUDENT_EMAIL, process.env.LIVE_STUDENT_PASSWORD],
  teacher: [process.env.LIVE_TEACHER_EMAIL, process.env.LIVE_TEACHER_PASSWORD]
};
for (const [role, values] of Object.entries(roles)) {
  if (values.some(value => !value)) {
    throw new Error('Faltan LIVE_' + role.toUpperCase() + '_EMAIL/PASSWORD. No se ejecutan pruebas con cuentas ficticias.');
  }
}
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const report = [];
const url = route => new URL(route, base).href;

async function userProfile(page) {
  return page.evaluate(async () => {
    const cfg = await import(new URL('./js/config.js', document.baseURI).href);
    const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const auth = await client.auth.getUser();
    if (auth.error || !auth.data.user) throw new Error('Sesión no válida');
    const found = await client.from('profiles').select('role,team_id').eq('id', auth.data.user.id).single();
    if (found.error || !found.data) throw new Error('Perfil no accesible por RLS');
    return { role: found.data.role, teamId: found.data.team_id };
  });
}
async function login(role, credentialPair = roles[role]) {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const attemptedWrites = [];
  context.on('request', request => {
    if (request.method() !== 'GET' && /\/rest\/v1\/rpc\//.test(new URL(request.url()).pathname)) {
      attemptedWrites.push(request.url().split('/rpc/')[1].split('?')[0]);
    }
  });
  const page = await context.newPage();
  await page.goto(url('index.html'), { waitUntil: 'domcontentloaded' });
  await page.locator('#login-user').fill(credentialPair[0]);
  await page.locator('#login-password').fill(credentialPair[1]);
  await page.locator('#login-submit').click();
  await page.locator('#app-shell').waitFor({ state: 'visible', timeout: 30000 });
  const profile = await userProfile(page);
  assert.equal(profile.role, role, 'El rol devuelto por Supabase no coincide');
  report.push('Autenticación real de ' + role + ' y RLS del perfil: OK');
  return { context, page, profile, attemptedWrites };
}
async function checkStudent() {
  const session = await login('student');
  const { page, context, profile, attemptedWrites } = session;
  try {
    assert.ok(profile.teamId, 'La cuenta de ensayo de alumno necesita equipo');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#app-shell').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal((await userProfile(page)).role, 'student');
    report.push('Persistencia de sesión real tras recargar: OK');
    await page.goto(url('index.html#mission1gallery'), { waitUntil: 'domcontentloaded' });
    await page.locator('.gal-hall').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.locator('.gal-tile').count(), 20);
    assert.equal(await page.locator('.m1-nav').count(), 0);
    report.push('Galería de 20 tarjetas y sin navegación docente: OK');
    await page.goto(url('bi-sistema.html?preview=1'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1250);
    assert.equal(await page.locator('.m1-nav').count(), 0, 'Un alumno vio navegación de profesor');
    report.push('Parámetro preview=1 no otorga privilegios: OK');
    assert.deepEqual(attemptedWrites, [], 'La prueba de solo lectura realizó escrituras RPC');
  } finally {
    await context.close();
  }
  if (process.env.LIVE_STUDENT2_EMAIL && process.env.LIVE_STUDENT2_PASSWORD) {
    const second = await login('student', [process.env.LIVE_STUDENT2_EMAIL, process.env.LIVE_STUDENT2_PASSWORD]);
    try {
      assert.equal(second.profile.teamId, profile.teamId, 'Los alumnos no pertenecen al mismo equipo');
      assert.deepEqual(second.attemptedWrites, []);
      report.push('Dos cuentas reales pertenecen al mismo equipo: OK (sin prueba de concurrencia de escrituras)');
    } finally {
      await second.context.close();
    }
  }
}
async function checkTeacher() {
  const { page, context, attemptedWrites } = await login('teacher');
  try {
    await page.goto(url('index.html#teacherpreviewgallery'), { waitUntil: 'domcontentloaded' });
    await page.locator('.gal-hall').waitFor({ state: 'visible', timeout: 30000 });
    assert.ok((await page.locator('.m1-nav-links a').count()) >= 5);
    await page.locator('[data-gallery-action="preview-complete"]').click();
    assert.equal(await page.locator('.gal-action-next').count(), 1);
    report.push('Previsualización docente de galería y pantalla final: OK');
    const views = [
      ['bi-sistema.html?preview=1', '#bi-stage[data-phase="complete"]'],
      ['inperialismoaren-definizioa.html?preview=1', '.scene.solved'],
      ['inperioen-aztarnak.html?preview=1', '#dossier-heading'],
      ['esaldiak-osatu.html?preview=1', '#success']
    ];
    for (const [route, completedSelector] of views) {
      await page.goto(url(route), { waitUntil: 'domcontentloaded' });
      await page.locator('.m1-nav').waitFor({ state: 'visible', timeout: 30000 });
      await page.getByRole('button', { name: 'Amaierako pantaila' }).click();
      await page.locator(completedSelector).waitFor({ state: 'visible', timeout: 30000 });
      report.push('Vista docente ' + route.split('?')[0] + ': OK');
    }
    assert.deepEqual(attemptedWrites, [], 'La previsualización docente intentó registrar respuestas');
    report.push('Ninguna escritura RPC durante la previsualización: OK');
  } finally {
    await context.close();
  }
}
try {
  await checkStudent();
  await checkTeacher();
  for (const line of report) console.log('✓ ' + line);
  console.log('LÍMITE: esta prueba NO completa los cinco ejercicios, no verifica escrituras ni mide imágenes.');
} catch (error) {
  for (const line of report) console.log('✓ ' + line);
  console.error('FALLO en ensayo con Supabase real: ' + (error.stack || error));
  process.exitCode = 1;
} finally {
  await browser.close();
}
