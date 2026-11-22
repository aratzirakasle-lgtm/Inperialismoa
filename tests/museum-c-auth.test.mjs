import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=file=>readFileSync(resolve(root,file),'utf8');

test('El museo C está disponible solo en una vista optativa del alumno autenticado',()=>{
 const app=read('js/app.js');
 const page=read('index.html');
 assert.match(app,/import \{ renderVestibuloC \} from "\.\/vestibulo-c-auth\.js\?v=20261122-zigiluak11"/);
 assert.match(app,/new URLSearchParams\(location\.search\)\.get\("museo"\)==="c"/);
 assert.match(app,/if\(conceptCHome && viewTeamId\(\)\)/);
 assert.match(app,/completedIds=\[1,2\]\.filter\(missionId=>completed\(id,missionId\)\)/);
 assert.match(app,/classList\.toggle\("museo-c-enabled",!isTeacher\(\)&&currentMission===0&&conceptCHome/);
 assert.match(page,/assets\/vestibulo-c-auth\.css/);
 assert.match(app,/function renderTeacher\(\)/);
 assert.match(app,/teacherPreview=false/);
});

test('La réplica se alimenta de los datos existentes y nunca escribe ni solicita credenciales',()=>{
 const module=read('js/vestibulo-c-auth.js');
 assert.match(module,/completedIds=\[\]/);
 assert.match(module,/teamName/);
 assert.match(module,/src="\.\/preview-vestibulo-concepto-c\.html"/);
 assert.match(module,/sandbox=""/);
 assert.match(module,/data-mission="1"/);
 assert.match(module,/data-mission="2"/);
 assert.match(module,/3\. Misioa/);
 assert.doesNotMatch(module,/createClient\s*\(|\.rpc\s*\(|localStorage|fetch\s*\(/);
 assert.doesNotMatch(module,/data-mission="3"/);
 assert.doesNotMatch(module,/data-mission="4"/);
});

test('La interfaz nueva y la navegación general se presentan en euskera',()=>{
 const page=read('index.html');
 const module=read('js/vestibulo-c-auth.js');
 assert.match(page,/<html lang="eu">/);
 assert.match(page,/ZURE ESPEDIZIOA/);
 assert.match(page,/MISIOA HONETAKO TALDEAK/);
 assert.match(module,/Aurreko ikuspegia/);
 assert.match(module,/Irakaslearen panela/);
 assert.match(module,/IRAKASLEAREN AURREBISTA/);
 assert.doesNotMatch(module,/\bVista del alumno\b/);
});
