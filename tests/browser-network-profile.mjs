/**
 * Perfil de red de los documentos y CSS que cargan fondos/ilustraciones.
 * JavaScript desactivado para evitar logins, redirecciones y escrituras.
 * Es una medición de carga de recursos estáticos, NO de interacción autenticada,
 * Core Web Vitals, ni rendimiento global con la aplicación en funcionamiento.
 *
 * PROFILE_BASE_URL=https://... node tests/browser-network-profile.mjs
 * Por defecto: http://127.0.0.1:8765/
 */
import { performance } from 'node:perf_hooks';
import { chromium } from 'playwright';

const base = process.env.PROFILE_BASE_URL || 'http://127.0.0.1:8765/';
const pages = [
  'index.html',
  'bi-sistema.html',
  'inperialismoaren-definizioa.html',
  'inperioen-aztarnak.html',
  'esaldiak-osatu.html'
];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const results = [];
try {
  for (const route of pages) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      viewport: { width: 1365, height: 900 }
    });
    const page = await context.newPage();
    const finished = [];
    const failed = [];
    page.on('requestfinished', request => finished.push(request));
    page.on('requestfailed', request => failed.push(request.url()));
    const t0 = performance.now();
    const target = new URL(route, base).href;
    try {
      const response = await page.goto(target, { waitUntil: 'load', timeout: 60000 });
      if (!response || !response.ok()) throw new Error('HTTP ' + (response?.status() ?? 'sin respuesta') + ' para ' + route);
      // Cronometrar el evento load ANTES de la espera de recogida de recursos.
      const loadedMs = Math.round(performance.now() - t0);
      await page.waitForTimeout(400);
      const requests = await Promise.all(finished.map(async request => {
        const response = await request.response();
        if (!response) return null;
        const sizes = await request.sizes();
        const type = request.resourceType();
        return {
          type,
          url: request.url(),
          encodedBodyBytes: sizes.responseBodySize,
          responseHeadersBytes: sizes.responseHeadersSize,
          contentType: response.headers()['content-type'] || ''
        };
      }));
      const own = requests.filter(r => r && new URL(r.url).origin === new URL(target).origin);
      const staticResources = own.filter(r => r.type === 'document' || r.type === 'stylesheet' || r.type === 'image');
      const css = own.filter(r => r.type === 'stylesheet');
      const images = own.filter(r => r.type === 'image');
      const sum = entries => entries.reduce((acc, r) => acc + r.encodedBodyBytes, 0);
      results.push({
        page: route,
        loadedMs,
        ownResourceRequests: staticResources.length,
        ownTransferredKiB: +(sum(staticResources) / 1024).toFixed(1),
        stylesheetRequests: css.length,
        stylesheetTransferredKiB: +(sum(css) / 1024).toFixed(1),
        standaloneImageRequests: images.length,
        standaloneImagesTransferredKiB: +(sum(images) / 1024).toFixed(1),
        failedRequests: failed.length
      });
    } finally {
      await context.close();
    }
  }
  console.log('Perfil de recursos estáticos (JS desactivado, caché nueva en cada pantalla).');
  console.table(results);
  console.log('NO mide experiencia autenticada, LCP/CLS, velocidad de alumno ni imágenes generadas por JavaScript.');
  if (process.argv.includes('--json')) console.log(JSON.stringify({ base, results }, null, 2));
} finally {
  await browser.close();
}
