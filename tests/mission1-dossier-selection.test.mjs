import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const css=readFileSync(new URL('assets/inperioen-integracion-v6.css',root),'utf8');
const html=readFileSync(new URL('inperioen-aztarnak.html',root),'utf8');

test('Egiaztatu aurretik hautatutako metropoliak zirkulu laranja du',()=>{
  const orange=/\.dossier-sheet--case \.dossier-choice:has\(input:checked\):not\(\.is-verified\)::after\s*\{\s*content:''!important;[\s\S]*?border:[^;]*#b9631e!important;[\s\S]*?background:radial-gradient\([^;]*#f6a53e/gi;
  assert.equal([...css.matchAll(orange)].length,2,'Ordenagailuko eta mugikorreko zirkulu laranjak');
});

test('Tic berdea soilik egiaztatutako erantzun zuzenari ezartzen zaio',()=>{
  const green=/\.dossier-sheet--case \.dossier-choice\.is-verified:has\(input:checked\)::after\s*\{\s*content:'✓'!important/gi;
  assert.equal([...css.matchAll(green)].length,2,'Ordenagailuko eta mugikorreko zigilu berdeak');
  assert.doesNotMatch(css,/\.dossier-sheet--case \.dossier-choice:has\(input:checked\)::after\s*\{\s*content:'✓'/);
  assert.match(html,/solvedIt&&selected\[id\]===choice\.id\?'is-verified':''/);
  assert.match(html,/if\(res\.correct\)\{solved\.add\(id\)/);
  assert.match(html,/else\{lastResult\[id\]=\{wrong:true\};selected\[id\]=null;\}/);
  assert.match(html,/check_empire_dossier_with_reading/);
});

test('Berritutako CSS fitxategia eta zuzentzeko botoia mantentzen dira',()=>{
  assert.match(html,/inperioen-integracion-v6\.css\?v=20261122-seleccion-naranja1/);
  assert.match(html,/Erantzuna egiaztatu/);
  assert.match(html,/p_preview:teacherPreview/);
});
