import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('La sala de infraestructuras conserva las tres piezas y las cinco respuestas originales',()=>{
 const js=read('js/mission2-faktoreak.js');
 for(const piece of ['suez','hijaz','panama'])assert.ok(js.includes("['"+piece+"'"),piece);
 for(const year of ['1869','1908','1914'])assert.ok(js.includes("'"+year+"'"),year);
 for(const value of ['credits','salaries','donations','rail_ports_canals','palaces_only','schools_only'])
  assert.ok(js.includes("'"+value+"'"),value);
 assert.match(js,/data-event="\$\{esc\(item\.id\)\}"/);
 assert.match(js,/data-year="\$\{year\}"/);
 assert.match(js,/data-field="\$\{field\}"/);
 assert.match(js,/type="radio"/);
 assert.match(js,/m2-e2-ledger/);
 assert.match(js,/m2-capital-active/);
});
test('El nuevo diseño usa recursos gráficos vectoriales propios y no afecta a otros ejercicios',()=>{
 const html=read('inperialismoaren-faktoreak.html');
 const css=read('assets/m2-e2-cronografo-inmersivo.css');
 const art=read('assets/m2-e2-reference-art.svg');
 assert.match(html,/m2-e2-cronografo-inmersivo\.css/);
 assert.match(css,/#m2-app\.m2-capital-active/);
 assert.match(css,/m2-e2-reference-art\.svg/);
 assert.doesNotMatch(css,/\.m2-archive-active|\.m2-expedition-active|\.m2-atlas-active/);
 assert.match(art,/<svg /);
 for(const feature of ['id="ship"','id="train"','id="sky"','id="paper"','clipPath'])assert.ok(art.includes(feature),feature);
 assert.match(css,/@media\(max-width:620px\)/);
});
