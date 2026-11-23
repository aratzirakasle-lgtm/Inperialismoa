import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { galleryIllustration } from '../js/galeria-iconos-color.js';
import { MUSEUM_SCENES_A } from '../js/galeria-miniaturas-pintadas-a.js';
import { MUSEUM_SCENES_B } from '../js/galeria-miniaturas-pintadas-b.js';

const scenes={...MUSEUM_SCENES_A,...MUSEUM_SCENES_B};
const all=Object.keys(scenes);
const source=readFileSync(new URL('../js/galeria-iconos-color.js',import.meta.url),'utf8');
const gallery=readFileSync(new URL('../js/galeria-potencias.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/galeria-miniaturas-pintadas-20261123.css',import.meta.url),'utf8');

test('Las veinte cartelas tienen pinturas históricas individuales y sin fondo',()=>{
  assert.equal(Object.keys(MUSEUM_SCENES_A).length,10);
  assert.equal(Object.keys(MUSEUM_SCENES_B).length,10);
  assert.equal(all.length,20);
  assert.equal(new Set(all).size,20);
  assert.ok(all.every(id=>gallery.includes('["'+id+'","')),
    'Todos los temas del ejercicio deben mantener su escena');
  const images=all.map(id=>{
    const markup=galleryIllustration(id);
    assert.match(markup,/^<img class="gal-tile-artwork" src="\.\/assets\/galeria-miniaturas\//);
    assert.match(markup,/width="64" height="64"/);
    assert.match(markup,/draggable="false"/);
    const svg=readFileSync(new URL('../assets/galeria-miniaturas/'+id+'.svg',import.meta.url),'utf8');
    assert.match(svg,/viewBox="0 0 96 96"/);
    assert.match(svg,/filter="url\(#paint\)"/);
    assert.doesNotMatch(svg,/<(?:rect|path)[^>]*fill="#(?:fff|ffffff)"[^>]*>/i,
      'El pergamino sigue visible detrás de la imagen');
    assert.ok((svg.match(/<(?:path|ellipse|circle|rect)\b/g)||[]).length>9,
      'La miniatura es una escena detallada, no un glifo: '+id);
    return svg;
  });
  assert.equal(new Set(images).size,20,'Ninguna pintura se repite');
  assert.match(source,/PAINTED_PATH\+id\+'\.svg\?v='/,'Cada ilustración se solicita como archivo SVG real');
});

test('Las imágenes se muestran realmente en la web, no como muestras externas',()=>{
  assert.match(gallery,/galleryIllustration\(item\.id\)/);
  assert.match(html,/galeria-miniaturas-pintadas-20261123\.css/);
  assert.match(css,/background:transparent!important/);
  assert.match(css,/border:0!important/);
  assert.match(css,/\.gal-vitrine \.gal-tile\.gal-tile-placed/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test('El nuevo diseño mantiene intacta la bandera de Europa',()=>{
  assert.match(gallery,/eu:flagSvg\("eu"\)/);
  assert.doesNotMatch(gallery,/eu:europeSeal|gal-europe-emblem/);
});
