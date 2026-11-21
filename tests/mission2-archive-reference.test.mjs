import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('El archivo del poder carga exactamente cinco grabados tomados de la referencia',()=>{
 const html=read('inperialismoaren-faktoreak.html');
 const css=read('assets/m2-e4-referencia-fotos-20261121.css');
 assert.match(html,/m2-e4-referencia-fotos-20261121\.css\?v=1/);
 const encoded=css.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
 assert.ok(encoded,'Falta el atlas original de las cinco imágenes');
 const bytes=Buffer.from(encoded[1],'base64');
 assert.ok(bytes.length>4000,'El grabado se ha quedado vacío');
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'Atlas WEBP incompleto o corrupto');
 for(const pos of ['25%','50%','75%','100%'])
  assert.ok(css.includes('background-position:'+pos+' center'),'Falta un recorte del atlas '+pos);
 assert.match(css,/\.m2-archive-five-files\s*\{grid-template-columns:repeat\(6,/);
 assert.match(css,/nth-child\(-n\+2\)\s*\{grid-column:span 3/);
 assert.match(css,/grid-column:span 2/);
 assert.match(css,/@media\(max-width:760px\)/);
});

test('La presentación del archivo no cambia preguntas, envío o comprobación del equipo',()=>{
 const js=read('js/mission2-faktoreak.js');
 for(const key of ["id:'sea'","id:'press'","id:'missions'","id:'racism'","id:'source1863'"])
  assert.ok(js.includes(key),'Se ha perdido la pregunta '+key);
 assert.match(js,/data-archive=/);
 assert.match(js,/type="radio"/);
 assert.match(js,/submit_mission2_exercise/);
 assert.match(js,/data-reset/);
 assert.match(js,/data-next/);
});
