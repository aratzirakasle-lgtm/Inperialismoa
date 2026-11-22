import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderVestibuloC} from '../js/vestibulo-c-auth.js';

test('Egoera 0/4: lehen misioa erabilgarri, bigarrena itxita',()=>{
 const html=renderVestibuloC({teamName:'Ikerlariak',completedIds:[]});
 assert.match(html,/0 \/ 4 misio osatuta · 0 %/);
 assert.match(html,/c-museo-book-progress[^>]*>0 \/ 4/);
 assert.match(html,/c-museo-m1[^>]*data-mission="1"/);
 assert.match(html,/c-museo-m2[^>]*disabled/);
 assert.match(html,/c-museo-m3[^>]*disabled/);
 assert.match(html,/c-museo-m4[^>]*disabled/);
 assert.match(html,/c-museo-second-dim/);
 assert.match(html,/Hurrengo erronka:.*1\. Misioa:/s);
});

test('Egoera 1/4: argazkiaren jatorrizko %25 dago; ez dago tinta bikoiztuta',()=>{
 const html=renderVestibuloC({teamName:'Atlas',completedIds:[1]});
 assert.match(html,/1 \/ 4 misio osatuta · 25 %/);
 assert.match(html,/class="c-museo-book-progress">1 \/ 4/);
 assert.match(html,/class="c-museo-book-bar"><i style="width:25%"/);
 assert.match(html,/class="c-museo-book-next"/);
 assert.match(html,/c-museo-m2[^>]*data-mission="2"/);
 assert.match(html,/Inperialismoaren faktoreak/);
});

test('Egoera 2/4: hurrengo misioak oraindik argitaratu gabe',()=>{
 const html=renderVestibuloC({teamName:'Nilo',completedIds:[1,2]});
 assert.match(html,/2 \/ 4 misio osatuta · 50 %/);
 assert.match(html,/class="c-museo-book-bar"><i style="width:50%"/);
 assert.match(html,/3\. Misioa:/);
 assert.match(html,/c-museo-m3[^>]*disabled/);
 assert.match(html,/c-museo-m4[^>]*disabled/);
 assert.match(html,/c-museo-mobile-missions/);
 assert.match(html,/c-museo-preview-tag|c-museo-toolbar/);
});

test('Ikasleen izenak HTML gisa ez dira interpretatzen',()=>{
 const html=renderVestibuloC({teamName:'<script>erasoa</script>',completedIds:[]});
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
});

test('Irakaslearen aurrebista eta kontrolak bereizita daude',()=>{
 const prev=renderVestibuloC({teamName:'Atlas',completedIds:[1],preview:true});
 const student=renderVestibuloC({teamName:'Atlas',completedIds:[1],preview:false});
 assert.match(prev,/IRAKASLEAREN AURREBISTA/);
 assert.match(prev,/data-view="teacher"/);
 assert.doesNotMatch(student,/data-view="teacher"/);
 assert.match(prev,/Aurreko ikuspegia/);
 assert.doesNotMatch(student,/\b(Profesor|Alumno|Siguiente|Bloqueada)\b/);
});


test('Pergamino restaurado: imagen WebP íntegra, transparente y compacta',()=>{
 const css=readFileSync(new URL('../assets/vestibulo-c-auth.css',import.meta.url),'utf8');
 const match=css.match(/C_MUSEO_BOOK_ERASE_V3[\s\S]*?data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
 assert.ok(match,'Se conserva la limpieza localizada de la tinta original');
 const bytes=Buffer.from(match[1],'base64');
 assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
 assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'El WebP está completo');
 assert.ok(bytes.length<=3500,'La corrección visual no debe añadir una imagen pesada');
});
