import test from 'node:test';
import assert from 'node:assert/strict';
import {indexTeacherActivity,renderTeacherLiveProgress} from '../js/teacher-live-progress.js';
test('La actividad no es la superación; faltan datos, se filtran clases y se escapa el HTML',()=>{
 const activity=indexTeacherActivity([{mission:1,exercise:1,rows:[{team_id:'a',updated_at:'2026-11-24T12:00:00Z'}]}]);
 const html=renderTeacherLiveProgress({teams:[{id:'a',name:'<Equipo>',class_id:'c'},{id:'b',name:'Otra clase',class_id:'d'}],m1:[{team_id:'a',exercise_1:false,exercise_2:true,member_names:['A & B']}],activity,classId:'c'});
 assert.match(html,/is-draft/);assert.match(html,/is-done/);assert.match(html,/is-unknown/);
 assert.match(html,/&lt;Equipo&gt;/);assert.match(html,/A &amp; B/);assert.doesNotMatch(html,/Otra clase/);
 assert.match(html,/Actividad registrada/);
 assert.match(html,/sin datos/);
});
test('Actividad conserva la marca más reciente y la demo no muestra registros reales',()=>{
 const a=indexTeacherActivity([{mission:2,rows:[{team_id:'t',exercise:3,updated_at:'2026-11-24T14:00:00Z'},{team_id:'t',exercise:3,updated_at:'2026-11-24T13:00:00Z'}]}]);
 assert.equal(a.get('t:2:3'),'2026-11-24T14:00:00Z');
 assert.doesNotMatch(renderTeacherLiveProgress({demo:true,teams:[{id:'t',name:'Secreto'}]}),/Secreto/);
});
