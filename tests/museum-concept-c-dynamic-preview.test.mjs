import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));

const read=(p)=>readFileSync(resolve(root,p),'utf8');

test('La réplica original sigue siendo la referencia y la prueba de datos es independiente',()=>{
  const original=read('preview-vestibulo-concepto-c.html');
  const preview=read('preview-vestibulo-concepto-c-datos.html');
  assert.ok(original.length>1_000_000,'Se conserva la imagen original incrustada');
  assert.match(preview,/src="\.\/preview-vestibulo-concepto-c\.html"/);
  assert.match(preview,/id="data-areas"[^>]*hidden/);
  assert.match(preview,/function setOriginal\(\)\{\s*data\.hidden=true/);
  assert.match(preview,/textContent=team/,'Los nombres se insertan como texto, no HTML');
});

test('La página de pruebas no lee ni escribe resultados privados',()=>{
  const preview=read('preview-vestibulo-concepto-c-datos.html');
  assert.doesNotMatch(preview,/\bcreateClient\s*\(/);
  assert.doesNotMatch(preview,/\bfetch\s*\(/);
  assert.doesNotMatch(preview,/\.rpc\s*\(/);
  assert.doesNotMatch(preview,/\blocalStorage\b/);
  assert.match(preview,/noindex,nofollow/);
  assert.match(preview,/id="sample-team"/);
});

test('La vía de entrada y gestión del profesor sigue intacta',()=>{
  const index=read('index.html');
  const app=read('js/app.js');
  assert.match(index,/id="login-screen"/);
  assert.match(index,/id="app-shell"/);
  assert.match(app,/function renderTeacher\(\)/);
  assert.match(app,/teacherPreview=false/);
  assert.match(app,/function renderHome\(\)/);
});
test('La prueba de las cuatro misiones solo permite estados coherentes con las salas creadas',()=>{
 const preview=read('preview-vestibulo-concepto-c-datos.html');
 assert.match(preview,/id="sample-progress"/);
 assert.match(preview,/<option value="0"/);
 assert.match(preview,/<option value="1" selected/);
 assert.match(preview,/<option value="2"/);
 assert.doesNotMatch(preview,/<option value="3"/);
 assert.doesNotMatch(preview,/<option value="4"/);
 assert.match(preview,/nextTitles/);
 assert.match(preview,/progressInput\.addEventListener\('change',setSample\)/);
 assert.match(preview,/\.data-areas \[hidden\]\{display:none!important\}/);
});
