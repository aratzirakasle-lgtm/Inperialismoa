import assert from 'node:assert/strict';
import test from 'node:test';
import {renderTeacherRoster} from '../js/teacher-roster.js';

const classes=[{id:'4a',name:'4A'},{id:'4b',name:'4B'}];
const teams=[{id:'a1',class_id:'4a',name:'A taldea'},{id:'b1',class_id:'4b',name:'B taldea'}];
const roster=[
 {id:'r1',team_id:'b1',slot:1,display_name:'Ikasle bat',auth_user_id:null},
 {id:'r2',team_id:'b1',slot:2,display_name:'Bigarren ikaslea',auth_user_id:null}
];
test('teacher enrollment renders only the selected class',()=>{
 const html=renderTeacherRoster(classes,teams,roster,'4b');
 assert.match(html,/2 ikasle/);
 assert.match(html,/data-roster-create="4b"/);
 assert.doesNotMatch(html,/4A/);
 assert.equal((html.match(/Sortzeko/g)||[]).length,2);
});
test('no credentials or private data appear in a non-teacher empty view',()=>{
 const html=renderTeacherRoster(classes,teams,roster,'4a');
 assert.doesNotMatch(html,/Ikasle bat/);
 assert.doesNotMatch(html,/Bigarren ikaslea/);
 assert.doesNotMatch(html,/data-roster-create/);
});
test('a confirmed account enables password reset, and names are escaped',()=>{
 const html=renderTeacherRoster(classes,teams,[
  {...roster[0],auth_user_id:'auth-id',display_name:'<script>eta</script>'},roster[1]
 ],'4b');
 assert.match(html,/data-roster-reset="r1"/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/1 ikasleren kontuak sortu/);
});
