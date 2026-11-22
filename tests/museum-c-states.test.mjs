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
 assert.doesNotMatch(html,/HASI|c-museo-brass|c-museo-status1|c-museo-status2/);
 assert.match(html,/museo-c-restauracion-mision1\.svg/);
 assert.match(html,/museo-c-restauracion-mision2\.svg/);
 assert.doesNotMatch(html,/c-museo-flag-pin|c-museo-banner-retouch/);
 assert.doesNotMatch(html,/c-museo-banner-dim|c-museo-second-dim/);
 assert.match(html,/Hurrengo erronka:.*1\. Misioa:/s);
});

test('Egoera 1/4: argazkiaren jatorrizko %25 dago; ez dago tinta bikoiztuta',()=>{
 const html=renderVestibuloC({teamName:'Atlas',completedIds:[1]});
 assert.match(html,/1 \/ 4 misio osatuta · 25 %/);
 assert.match(html,/class="c-museo-book-progress">1 \/ 4/);
 assert.match(html,/class="c-museo-book-bar"><i style="width:25%"/);
 assert.match(html,/class="c-museo-book-next"/);
 assert.match(html,/c-museo-m2[^>]*data-mission="2"/);
 assert.doesNotMatch(html,/c-museo-banner-repair/);
 assert.doesNotMatch(html,/museo-c-restauracion-mision/);
 assert.doesNotMatch(html,/>OSATUTA<|>HASI/);
 assert.match(html,/Inperialismoaren faktoreak/);
});

test('Egoera 2/4: hurrengo misioak oraindik argitaratu gabe',()=>{
 const html=renderVestibuloC({teamName:'Nilo',completedIds:[1,2]});
 assert.match(html,/2 \/ 4 misio osatuta · 50 %/);
 assert.match(html,/class="c-museo-book-bar"><i style="width:50%"/);
 assert.doesNotMatch(html,/museo-c-restauracion-mision1\.svg/);
 assert.match(html,/museo-c-osatuta-mision2\.svg/);
 assert.doesNotMatch(html,/museo-c-restauracion-mision2\.svg/);
 assert.doesNotMatch(html,/c-museo-flag-pin/);
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
 assert.match(student,/data-c-logout="1"/);
 assert.match(student,/c-museo-toolbar-team/);
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


test('Lau estandarteen argiztapena egiaztatutako egoeraren araberakoa da',()=>{
 const css=readFileSync(new URL('../assets/vestibulo-c-auth.css',import.meta.url),'utf8');
 const module=readFileSync(new URL('../js/vestibulo-c-auth.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
 assert.match(css,/\.c-museo-portal:enabled:is\(:hover,:focus-visible\)::before/);
 assert.match(css,/\.c-museo-banner-repair/);
 assert.doesNotMatch(module,/c-museo-flag-pin|c-museo-brass|c-museo-banner-retouch/);
 assert.match(css,/\.c-museo-portal\.is-available:enabled::before/);
 assert.match(module,/museo-c-restauracion-mision1\.svg/);
 assert.match(module,/museo-c-restauracion-mision2\.svg/);
 assert.doesNotMatch(module,/>HASI|>OSATUTA|c-museo-brass/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(module,/data-state="/);
 assert.match(module,/data-c-logout="1"/);
 assert.match(app,/if\(b\.hasAttribute\("data-c-logout"\)\)/);
 assert.match(app,/\$\("#logout-btn"\)\.click\(\)/);
 assert.match(css,/#app-shell\.museo-c-enabled \.topbar\{display:none!important\}/);
});


test('Estandarteak: jatorrizko irudiaren materiala bakarrik zaharberritu, inoiz ez beste txaparik',()=>{
 const names=['mision1','mision2'];
 for(const name of names){
   const file=readFileSync(new URL('../assets/museo-c-restauracion-'+name+'.svg',import.meta.url),'utf8');
   assert.match(file,/viewBox="0 0 1672 941"/);
   assert.doesNotMatch(file,/<text[\s>]/i);
   assert.match(file,/data:image\/webp;base64,/);
   const raw=Buffer.from(file.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)[1],'base64');
   assert.equal(raw.subarray(0,4).toString('ascii'),'RIFF');
   assert.equal(raw.subarray(8,12).toString('ascii'),'WEBP');
   assert.equal(raw.readUInt32LE(4)+8,raw.length);
   assert.ok(raw.length<4000,'Zaharberritzearen geruza txikia izan behar da');
 }
 const original=renderVestibuloC({teamName:'Atlas',completedIds:[1]});
 assert.doesNotMatch(original,/museo-c-restauracion-mision[12]/,
    '1/4 egoeran jatorrizko estandarteak oso-osorik ageri dira');
 const blank=renderVestibuloC({teamName:'Nilo',completedIds:[]});
 assert.equal((blank.match(/c-museo-banner-repair/g)||[]).length,2);
 const completed=renderVestibuloC({teamName:'Nilo',completedIds:[1,2]});
 assert.equal((completed.match(/c-museo-banner-repair/g)||[]).length,1);
 assert.doesNotMatch(completed,/c-museo-flag-pin|HASI →|✓ OSATUTA/);
});


test('Bi misioak OSATUTA: bigarrenean jatorrizko tipografiaren tinta fotografikoa, ez HTML testua',()=>{
 const completed=renderVestibuloC({teamName:'Nilo',completedIds:[1,2]});
 const available=renderVestibuloC({teamName:'Nilo',completedIds:[1]});
 const blocked=renderVestibuloC({teamName:'Nilo',completedIds:[]});
 assert.match(completed,/museo-c-osatuta-mision2\.svg/);
 assert.doesNotMatch(available,/museo-c-osatuta-mision2\.svg/);
 assert.doesNotMatch(blocked,/museo-c-osatuta-mision2\.svg/);
 assert.doesNotMatch(completed,/c-museo-brass|c-museo-flag-pin|>OSATUTA<\/span>/);
 const asset=readFileSync(new URL('../assets/museo-c-osatuta-mision2.svg',import.meta.url),'utf8');
 assert.match(asset,/viewBox="0 0 1672 941"/);
 assert.match(asset,/data:image\/webp;base64,/);
 assert.doesNotMatch(asset,/<text(?:\s|>)/i,'El texto se debe integrar en la pintura, no imprimir con CSS');
 const b64=asset.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)?.[1];
 assert.ok(b64);
 const bytes=Buffer.from(b64,'base64');
 assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
 assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
 assert.ok(bytes.length<4000,'La inscripción debe ser una capa fotográfica mínima');
});
