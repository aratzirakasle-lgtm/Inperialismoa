import test from 'node:test';
import assert from 'node:assert/strict';
import { mountGallery } from '../js/galeria-potencias.js';

test('La primera vitrina conserva siempre la bandera europea azul con doce estrellas',()=>{
  const root={
    innerHTML:'',
    addEventListener(){},
    querySelector(){return null},
    querySelectorAll(){return []}
  };
  mountGallery(root,{initial:{},preview:true,navigationPreview:true});
  const europe=root.innerHTML.match(/<article class="gal-vitrine gal-vitrine-eu">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(europe,'La vitrina de Europa debe existir');
  assert.match(europe,/aria-label="Europar Batasuneko bandera \(gaur egungo ikurra\)"/);
  assert.match(europe,/<rect x="5" y="4" width="52" height="32" fill="#003399"\/>/);
  assert.match(europe,/<g fill="#ffcc00">/,'Las estrellas son doradas');
  assert.equal((europe.match(/<polygon points="/g)||[]).length,12,'Son doce estrellas');
  assert.doesNotMatch(europe,/gal-europe-emblem|museoko domina|<text[^>]*>XIX<\/text>/);
});
