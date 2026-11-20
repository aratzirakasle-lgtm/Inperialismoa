/**
 * Línea base de imágenes incrustadas y peso del documento, sin modificar activos.
 * Ejecutar: node tests/image-baseline.mjs [--json]
 * Mide bytes en el repositorio, NO transferencia gzip/Brotli ni LCP.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  'index.html',
  'bi-sistema.html',
  'inperialismoaren-definizioa.html',
  'inperioen-aztarnak.html',
  'esaldiak-osatu.html'
];

function read(relative) {
  const abs = path.resolve(root, relative);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error('Ruta fuera del repositorio: ' + relative);
  }
  if (!existsSync(abs)) throw new Error('Falta el archivo: ' + relative);
  return readFileSync(abs);
}
function stylesOf(page, source) {
  const refs = new Set();
  const link = /<link\b[^>]*\bhref=["']([^"']+\.css(?:\?[^"'#]*)?)["']/gi;
  for (const match of source.matchAll(link)) {
    const href = match[1].split('?')[0];
    if (/^(?:https?:|data:|\/\/)/i.test(href)) continue;
    const candidate = path.normalize(path.join(path.dirname(page), href));
    refs.add(candidate);
  }
  return [...refs];
}
function embeddedImages(source) {
  const images = [];
  const re = /data:image\/([\w.+-]+);base64,([A-Za-z0-9+/=]+)/g;
  for (const match of source.matchAll(re)) {
    images.push({ type: match[1], bytes: Buffer.from(match[2], 'base64').byteLength });
  }
  return images;
}
function measurePage(page) {
  const html = read(page);
  const cssPaths = stylesOf(page, html.toString('utf8'));
  const files = [page, ...cssPaths];
  let sourceBytes = 0;
  let embeddedImageBytes = 0;
  let embeddedImageCount = 0;
  let largest = { file: null, bytes: 0, type: null };
  for (const file of files) {
    const contents = read(file);
    sourceBytes += contents.byteLength;
    for (const image of embeddedImages(contents.toString('utf8'))) {
      embeddedImageBytes += image.bytes;
      embeddedImageCount++;
      if (image.bytes > largest.bytes) largest = { file, ...image };
    }
  }
  return {
    page,
    htmlBytes: html.byteLength,
    cssFileCount: cssPaths.length,
    htmlCssBytes: sourceBytes,
    embeddedImageCount,
    embeddedImageBytes,
    largestImage: largest
  };
}
const rows = pages.map(measurePage);
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ unit: 'bytes', scope: 'HTML and linked local CSS, source before HTTP compression; JS/images fetched dynamically excluded', rows }, null, 2));
} else {
  const kb = n => (n / 1024).toFixed(1);
  console.log('Línea base de imágenes · sin compresión ni modificaciones');
  console.table(rows.map(row => ({
    pantalla: row.page,
    'HTML + CSS (KiB)': kb(row.htmlCssBytes),
    'imagen incrustada (KiB)': kb(row.embeddedImageBytes),
    'imágenes': row.embeddedImageCount,
    'mayor imagen (KiB)': kb(row.largestImage.bytes)
  })));
  console.log('Nota: estos valores son bytes de origen. No miden velocidad de red, LCP ni CSS/JS dinámico.');
}
