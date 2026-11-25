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
 assert.equal((html.match(/aria-label="1\. ariketa (?:gaindituta|osatu gabe)"/g)||[]).length,2);
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

test('Los integrantes aparecen bajo su equipo y nunca se muestran los de otra clase',()=>{
 const html=renderMission1ClassProgress([{...rows[0],member_names:['Ane','Jon <b>']},{...rows[2],member_names:['Beste ikaslea']}],{classId:'class1'});
 assert.match(html,/Atlas<span class="m1-class-members"><span>Ane<\/span><span>Jon &lt;b&gt;<\/span>/);
 assert.ok(!html.includes('Beste ikaslea'));
 assert.ok(!html.includes('Jon <b>'));
});


test('La misión 2 reutiliza las cinco marcas y etiqueta correctamente su sello',()=>{
 const html=renderMission1ClassProgress([{...rows[0],member_names:['Ane']},rows[1]],{ownTeamId:'a',classId:'class1',missionId:2});
 assert.match(html,/2\. misioa: taldeen/);assert.match(html,/2\. misioa osatu gabe/);assert.match(html,/2\. misioa gaindituta/);
 assert.doesNotMatch(html,/1\. misioa/);assert.match(html,/Ane/);assert.match(html,/ZUEN TALDEA/);
});

test('Medallones ilustrados: ocho motivos y variantes sin duplicados en un aula de diez equipos',()=>{
 const ten=Array.from({length:10},(_,i)=>({team_id:'team-'+i,team_name:'Taldea '+i,class_id:'class1'}));
 const images=html=>[...html.matchAll(/data-emblem="([^"]+)"[^>]*><span class="m1-class-name" title="([^"]+)"/g)].map(m=>[m[2],m[1]]);
 const before=renderMission1ClassProgress(ten,{showEmblems:true});
 const after=renderMission1ClassProgress(ten.map(r=>({...r,exercise_1:true})).reverse(),{showEmblems:true,missionId:2});
 assert.equal(images(before).length,10);
 assert.equal(new Set(images(before).map(x=>x[1])).size,10);
 assert.deepEqual(Object.fromEntries(images(before)),Object.fromEntries(images(after)));
 assert.equal((before.match(/<img class="m1-team-emblem /g)||[]).length,10);
 assert.doesNotMatch(renderMission1ClassProgress(ten),/team-emblem-/);
});

test('Ocho equipos agotan los ocho motivos antes de cambiar de color',()=>{
 const eight=Array.from({length:8},(_,i)=>({team_id:'a-'+i,team_name:'Taldea '+i,class_id:'class1'}));
 const emblems=[...renderMission1ClassProgress(eight,{showEmblems:true}).matchAll(/data-emblem="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(emblems).size,8);
 assert.equal(new Set(emblems.map(e=>e.split('-')[0])).size,1);
});
