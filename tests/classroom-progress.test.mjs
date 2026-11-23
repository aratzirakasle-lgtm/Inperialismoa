import assert from 'node:assert/strict';
import test from 'node:test';
import {renderMission1ClassProgress} from '../js/classroom-progress.js';

const rows=[
 {team_id:'a',class_id:'class1',team_name:'Atlas',exercise_1:true,exercise_2:true,exercise_3:false,exercise_4:false,exercise_5:false,mission_completed:false},
 {team_id:'b',class_id:'class1',team_name:'Nilo',exercise_1:true,exercise_2:true,exercise_3:true,exercise_4:true,exercise_5:true,mission_completed:true},
 {team_id:'c',class_id:'class2',team_name:'Beste taldea',exercise_1:true,mission_completed:true}
];
test('El marcador ofrece cinco ejercicios y misión completa sin enseñar resultados privados',()=>{
 const html=renderMission1ClassProgress(rows,{ownTeamId:'a',classId:'class1'});
 assert.equal((html.match(/1\. ariketa/g)||[]).length,2);
 for(const n of [1,2,3,4,5])assert.ok(html.includes(n+'. ariketa'));
 assert.ok(html.includes('1. misioa'));
 assert.ok(html.includes('0/5')===false);
 assert.ok(html.includes('2/5'));
 assert.ok(html.includes('5/5'));
 assert.ok(html.includes('ZUEN TALDEA'));
 assert.ok(!html.includes('Beste taldea'));
 assert.ok(!html.includes('class2'));
});
test('Escapa nombres y no representa respuestas ni intentos del servidor',()=>{
 const html=renderMission1ClassProgress([{...rows[0],team_name:'<script>alert(1)</script>',answers:['secreto'],errors:22}],{classId:'class1'});
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('secreto'));
 assert.ok(!html.includes('22'));
});
test('Sin datos no inventa finalizaciones y comunica un error de conexión',()=>{
 const html=renderMission1ClassProgress([],{error:true});
 assert.match(html,/Ezin da taldeen aurrerapena eguneratu/);
 assert.ok(!html.includes('m1-class-team'));
});
test('La misión completa es una marca separada de los cinco ejercicios',()=>{
 const html=renderMission1ClassProgress([rows[0]],{classId:'class1'});
 assert.ok(html.includes('1. misioa osatu gabe'));
 assert.ok(html.includes('1. ariketa gaindituta'));
});
