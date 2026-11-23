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
    const image=galleryIllustration(id);
    assert.match(image,/^<img class="gal-tile-artwork"/,id);
    assert.match(image,new RegExp('src="\\./assets/galeria-miniaturas/'+id+'\\.svg\\?v='),id);
    assert.match(image,/aria-hidden="true"/,id);
    assert.match(image,/draggable="false"/,id);
    assert.equal((image.match(/<img\\b/g)||[]).length,1,id);
    const svg=readFileSync(new URL('../assets/galeria-miniaturas/'+id+'.svg',import.meta.url),'utf8');
    assert.match(svg,/viewBox="0 0 96 96"/,id);
    assert.match(svg,/fill="#[a-fA-F0-9]{6}"/,id+' debe mantener color');
    assert.doesNotMatch(svg,/<rect[^>]*fill="#(?:fff|ffffff)"/i,id+' sin fondo opaco');
    assert.doesNotMatch(svg,/<(?:script|iframe|foreignObject|use)\\b/i,id);
  }
});

test('No cambia la lógica del arrastre, selección y comprobación', () => {
  assert.match(gallery,/galleryIllustration\(item\.id\)/);
  assert.match(gallery,/data-gallery-card/);
  assert.match(gallery,/data-gallery-zone/);
  assert.match(gallery,/addEventListener\('dragstart'/);
  assert.match(gallery,/addEventListener\('drop'/);
  assert.match(gallery,/sharedSync\?await sharedSync\.submit\(\):await onSubmit\(answers\)/);
  assert.match(gallery,/Object\.keys\(answers\)\.length!==ITEMS\.length/);
});

test('Las ilustraciones transparentes son pequeñas y no reciben eventos de ratón', () => {
  assert.match(css,/gal-tile-icon \.gal-tile-artwork\{[^}]*width:24px;height:24px[^}]*pointer-events:none\}/);
  assert.match(css,/gal-tile-placed \.gal-tile-icon \.gal-tile-artwork\{width:16px;height:16px\}/);
  assert.match(css,/gal-tile-icon\{[^}]*pointer-events:none\}/);
});

test('Los dos sistemas europeos caben completos (cuatro autoritarias y cinco liberales)',()=>{
  assert.match(css,/\.gal-vitrine\{[\s\S]{0,100}height:auto;min-height:clamp\(/);
  assert.match(css,/\.gal-vitrine-eu\{[^}]*height:max-content;[^}]*overflow:visible/);
  assert.match(css,/\.gal-vitrine-eu \.gal-vitrine-contents\{[^}]*flex:0 0 auto;[^}]*height:auto;[^}]*overflow:visible/);
  assert.match(css,/\.gal-vitrine-eu \.gal-zone:last-child\{[^}]*flex:none;[^}]*height:auto/);
  assert.match(css,/\.gal-vitrine-eu \.gal-zone-list\{[^}]*flex-direction:column;[^}]*flex-wrap:nowrap;[^}]*overflow:visible/);
  assert.match(css,/\.gal-vitrine-eu \.gal-tile-placed\{[^}]*flex:0 0 auto;[^}]*height:auto/);
  assert.doesNotMatch(css,/\.gal-vitrine-eu \.gal-vitrine-contents\{display:grid;grid-template-rows:1fr 1fr/);
  assert.doesNotMatch(css,/\.gal-vitrine-eu \.gal-zone:last-child\{[^}]*flex:1 0 72px/);
  assert.doesNotMatch(css,/\.gal-vitrine\{height:(?:380|400|440)px/);
});
