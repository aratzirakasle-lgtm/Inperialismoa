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
  assert.match(preview,/function setOriginal\(\)\{data\.hidden=true/);
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