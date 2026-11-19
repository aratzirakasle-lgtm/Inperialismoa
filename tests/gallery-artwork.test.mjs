import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { galleryIllustration } from '../js/galeria-iconos-color.js';

const gallery = readFileSync(new URL('../js/galeria-potencias.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/galeria-potencias.css', import.meta.url), 'utf8');
const ids = [...gallery.matchAll(/^\["([a-z]+_[a-z_]+)","/gm)].map(([,id]) => id);

test('Cada una de las veinte tarjetas conserva su concepto y tiene una ilustración propia a color', () => {
  assert.equal(ids.length,20,'La galería debe seguir teniendo veinte conceptos');
  assert.equal(new Set(ids).size,20,'Ningún concepto duplicado');
  for (const id of ids) {
    const svg=galleryIllustration(id);
    assert.match(svg,/^<svg class="gal-tile-artwork"/,id);
    assert.match(svg,/viewBox="0 0 36 36"/,id);
    assert.match(svg,/aria-hidden="true"/,id);
    assert.match(svg,/fill="#[a-fA-F0-9]{6}"/,id+' debe tener colores');
    assert.doesNotMatch(svg,/<(?:image|script|foreignObject|use)\b/i,id);
    assert.equal((svg.match(/<svg\b/g)||[]).length,1,id);
  }
});

test('No cambia la lógica del arrastre, selección y comprobación', () => {
  assert.match(gallery,/galleryIllustration\(item\.id\)/);
  assert.match(gallery,/data-gallery-card/);
  assert.match(gallery,/data-gallery-zone/);
  assert.match(gallery,/addEventListener\('dragstart'/);
  assert.match(gallery,/addEventListener\('drop'/);
  assert.match(gallery,/const result=await onSubmit\(answers\)/);
});

test('Las ilustraciones transparentes son pequeñas y no reciben eventos de ratón', () => {
  assert.match(css,/gal-tile-icon \.gal-tile-artwork\{[^}]*width:24px;height:24px[^}]*pointer-events:none\}/);
  assert.match(css,/gal-tile-placed \.gal-tile-icon \.gal-tile-artwork\{width:16px;height:16px\}/);
  assert.match(css,/gal-tile-icon\{[^}]*pointer-events:none\}/);
});
