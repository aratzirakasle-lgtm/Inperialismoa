import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,dirname,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const files=[
 'index.html','bi-sistema.html','inperialismoaren-definizioa.html',
 'inperioen-aztarnak.html','esaldiak-osatu.html',
 'inperialismoaren-faktoreak.html','preview-bi-sistema.html'
];
const read=file=>readFileSync(resolve(root,file),'utf8');
const local=(owner,ref)=>{
 if(!ref||ref.startsWith('#')||/^(?:https?:|data:|mailto:|tel:|javascript:|\/\/)/i.test(ref))return null;
 const cleaned=ref.split(/[?#]/)[0];
 if(!cleaned||cleaned.startsWith('/'))return null;
 return resolve(root,dirname(owner),cleaned);
};

test('Se conservan todas las pantallas publicadas y cada juego conserva su elemento principal',()=>{
 const expected={
  'index.html':'id="app-shell"',
  'bi-sistema.html':'id="bi-stage"',
  'inperialismoaren-definizioa.html':'id="scene"',
  'inperioen-aztarnak.html':'class="history-file',
  'esaldiak-osatu.html':'data-slot="1"',
  'inperialismoaren-faktoreak.html':'id="m2-app"'
 };
 for(const [file,marker] of Object.entries(expected)){
  assert.ok(existsSync(resolve(root,file)),file);
  assert.ok(read(file).includes(marker),'Interacción principal ausente: '+file);
 }
 assert.ok(read('preview-bi-sistema.html').includes('bi-sistema.html?preview=1'),
  'Debe mantenerse el acceso antiguo a la revisión docente');
});

test('Todos los scripts, estilos y enlaces HTML locales apuntan a archivos reales',()=>{
 for(const page of files){
  const html=read(page);
  for(const match of html.matchAll(/<(?:link|script|a)\b[^>]*?(?:href|src)=["']([^"'<>]+)["'][^>]*>/gi)){
   const ref=match[1],dest=local(page,ref);
   if(dest)assert.ok(existsSync(dest),page+' → '+ref);
  }
 }
});

test('Los imports JavaScript y los imports de los módulos incrustados son válidos',()=>{
 const sources=['js/app.js','js/bi-sistema-live.js','js/bi-sistema-iconos.js',
 'js/galeria-potencias.js','js/galeria-iconos-color.js','js/mission1-navigation.js',
 'js/mission1-third-auth.js','js/mission1-fifth-auth.js',
 'js/mission2-faktoreak.js'];
 for(const path of sources.concat(['inperioen-aztarnak.html'])){
  const content=read(path);
  for(const match of content.matchAll(/\bimport\s+(?:[^;\n]*?from\s*)?['"]([^'"]+)['"]/gm)){
   const dest=local(path,match[1]);
   if(dest)assert.ok(existsSync(dest),path+' → '+match[1]);
  }
 }
});

test('No se duplican identificadores HTML de controles estáticos en una misma pantalla',()=>{
 for(const path of files){
  const html=read(path).split(/<script\b/i)[0];
  const ids=[...html.matchAll(/\bid=["']([A-Za-z][\w-]*)["']/g)].map(m=>m[1]);
  const unique=new Set(ids);
  assert.equal(ids.length,unique.size,'IDs duplicados en '+path);
 }
});

test('El modo alumno sigue registrando; el profesor sigue previsualizando',()=>{
 const gallery=read('js/galeria-potencias.js');
 const third=read('js/mission1-third-auth.js');
 const fifth=read('js/mission1-fifth-auth.js');
 const fourth=read('inperioen-aztarnak.html');
 assert.match(gallery,/sharedSync\?await sharedSync\.submit\(\):await onSubmit\(answers\)/);
 assert.match(gallery,/if\(preview\)/);
 assert.match(third,/createMission1DraftSync/);
 assert.match(third,/window\.m1ThirdProgress=async\(\)=>sync\.submit\(\)/);
 assert.match(fifth,/createMission1DraftSync/);
 assert.match(fifth,/window\.m1FifthProgress=async\(\)=>sync\.submit\(\)/);
 assert.match(read('js/mission1-draft-sync.js'),/mission1_draft_submit/);
 assert.match(fourth,/rpc\('check_empire_dossier_with_reading'/);
 assert.match(third,/role==='teacher'&&previewRequested/);
 assert.match(fifth,/role==='teacher'&&previewRequested/);
 assert.match(fourth,/role==='teacher'&&params\.get\('preview'\)==='1'/);
});

test('El cuarto ejercicio no reabre dos veces el mismo expediente al corregir',()=>{
 const content=read('inperioen-aztarnak.html');
 const section=content.split('async function verifyCase(id)')[1]?.split('function showFinal()')[0]||'';
 assert.equal((section.match(/openCase\(id\)/g)||[]).length,1);
 assert.match(section,/if\(redraw&&modalMode==='case'&&currentCase===id\)openCase\(id\)/);
 assert.match(content,/const retry=\$\('#reflection-verify'\);if\(retry\)retry\.disabled=false/);
});

test('El refresco de paneles en tiempo real no repite cuatro consultas completas',()=>{
 const app=read('js/app.js');
 assert.match(app,/async function refreshFromRealtime\(\)/);
 assert.match(app,/Promise\.all\(\[\s*db\.from\("gallery_team_state"\)/);
 const callbacks=(app.match(/\(\)=>void refreshFromRealtime\(\)/g)||[]).length;
  assert.ok(callbacks>=4&&callbacks<=8,
    'Los eventos de progreso y borradores comparten la misma cola de actualización');
  assert.match(app,/table:"bi_sistema_team_drafts"/);
  assert.match(app,/table:"mission1_exercise_completions"/);
});

test('El foco visible y la preferencia de movimiento se comparten entre los cinco ejercicios',()=>{
  const css=read('assets/accesibilidad-juegos.css');
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  for(const file of files.filter(x=>x!=='preview-bi-sistema.html'&&x!=='inperialismoaren-faktoreak.html'))
    assert.match(read(file),/assets\/accesibilidad-juegos\.css/,file);
});

test('La segunda misión conserva sus protecciones de foco y movimiento',()=>{
 const css=read('assets/mission2-faktoreak.css');
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(read('inperialismoaren-faktoreak.html'),/id="m2-app"/);
});

test('El panel del profesor contabiliza las cuatro misiones actuales sin borrar el archivo histórico',()=>{
 const app=read('js/app.js');
 assert.match(app,/function renderTeacher\(\)\{[^\n]*const missionIds=\[1,2,3,4\]/);
 assert.match(app,/const total=visibleIds\.size\*missionIds\.length/);
 assert.match(app,/Misiones 1–4 completadas/);
 assert.doesNotMatch(app,/Misiones 1–5 completadas/);
});
