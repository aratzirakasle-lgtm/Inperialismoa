import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const has=(path,pattern)=>assert.match(read(path),pattern,'Regla esperada en '+path);

test('Los alumnos no saltan de ejercicio en ejercicio',()=>{
 has('js/app.js',/const canSkip=teacherPreview\|\|completed\(team,1\)/);
 has('js/app.js',/navigationEnabled:teacherPreview/);
 has('js/bi-sistema-live.js',/if\(!first\?\.completed_at&&!legacy\?\.length\)/);
 has('js/mission1-third-auth.js',/if\(!second\?\.completed_at&&!legacy\?\.length\)/);
 has('inperioen-aztarnak.html',/if\(!third\?\.exercise&&!legacy\?\.length\)/);
 has('js/mission1-fifth-auth.js',/if\(\(!third\|\|!fourth\?\.completed_at\)&&!legacy\?\.length\)/);
});
test('La navegación libre exige un perfil de profesor',()=>{
 has('js/app.js',/accountIsTeacher\(\)&&hash==="#teacherpreviewgallery"/);
 has('js/app.js',/const available=id=>accountIsTeacher\(\)\|\|\(id===1\|\|id===2&&completed\(viewTeamId\(\),1\)\)/);
 has('js/bi-sistema-live.js',/teacherPreview=profile\.role==="teacher"&&url\.get\("preview"\)==="1"/);
 has('js/mission1-third-auth.js',/const preview=profile\.role==='teacher'&&previewRequested/);
 has('js/mission1-fifth-auth.js',/const preview=profile\.role==='teacher'&&previewRequested/);
 has('inperioen-aztarnak.html',/teacherPreview=profile\.role==='teacher'&&params\.get\('preview'\)==='1'/);
 has('js/mission1-navigation.js',/teacherpreviewgallery/);
});
test('Las vistas docentes no guardan respuestas reales',()=>{
 has('js/bi-sistema-live.js',/if\(busy\|\|teacherPreview\|\|completed\)return/);
 has('js/mission1-third-auth.js',/m1ThirdProgress=async\(\)=>\(\{completed:true,preview:true\}\)/);
 has('js/mission1-fifth-auth.js',/m1FifthProgress=async\(\)=>\(\{completed:true,preview:true,mission_completed:false\}\)/);
 has('inperioen-aztarnak.html',/p_preview:teacherPreview/);
 has('inperioen-aztarnak.html',/if\(!teacherPreview\)\{\s*const \{error\}=await client\.rpc\('record_empire_dossier_clue'/);
});
test('Continúan disponibles las pantallas de victoria y el acceso al segundo ejercicio',()=>{
 has('js/mission1-third-auth.js',/addTeacherStageControls/);
 has('js/mission1-fifth-auth.js',/addTeacherStageControls/);
 has('inperioen-aztarnak.html',/addTeacherStageControls/);
 has('js/bi-sistema-live.js',/addTeacherStageControls/);
 has('esaldiak-osatu.html',/response\.mission_completed/);
 has('esaldiak-osatu.html',/index\.html#mission2/);
});
