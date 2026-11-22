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
 assert.match(html,/c-museo-flag-pin c-museo-pin-2 is-locked/);
 assert.doesNotMatch(html,/c-museo-pin-1/);
 assert.match(html,/museo-c-estandartes-sin-texto\.svg/);
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
 assert.match(html,/c-museo-flag-pin c-museo-pin-1 is-complete/);
 assert.doesNotMatch(html,/c-museo-pin-2/);
 assert.doesNotMatch(html,/>OSATUTA<|>HASI/);
 assert.match(html,/Inperialismoaren faktoreak/);
});

test('Egoera 2/4: hurrengo misioak oraindik argitaratu gabe',()=>{
 const html=renderVestibuloC({teamName:'Nilo',completedIds:[1,2]});
 assert.match(html,/2 \/ 4 misio osatuta · 50 %/);
 assert.match(html,/class="c-museo-book-bar"><i style="width:50%"/);
 assert.match(html,/c-museo-flag-pin c-museo-pin-1 is-complete/);
 assert.match(html,/c-museo-flag-pin c-museo-pin-2 is-complete/);
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
 assert.match(css,/\.c-museo-flag-pin\.is-complete/);
 assert.match(css,/\.c-museo-flag-pin\.is-locked/);
 assert.match(css,/\.c-museo-portal\.is-available:enabled::before/);
 assert.match(css,/\.c-museo-banner-retouch/);
 assert.doesNotMatch(module,/>HASI|>OSATUTA|c-museo-brass/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(module,/data-state="/);
 assert.match(module,/data-c-logout="1"/);
 assert.match(app,/if\(b\.hasAttribute\("data-c-logout"\)\)/);
 assert.match(app,/\$\("#logout-btn"\)\.click\(\)/);
 assert.match(css,/#app-shell\.museo-c-enabled \.topbar\{display:none!important\}/);
});


test('Estatuko testu finkoak desagertzen dira estandarteen geruza apaingarritik',()=>{
 const svg=readFileSync(new URL('../assets/museo-c-estandartes-sin-texto.svg',import.meta.url),'utf8');
 assert.match(svg,/<svg[\s\S]*viewBox="0 0 1672 941"/);
 assert.match(svg,/cartela/);
 assert.match(svg,/medallón original|medall[oó]n original/i);
 assert.doesNotMatch(svg,/<text[\s>]/i);
 const html=renderVestibuloC({teamName:'Taldea',completedIds:[1,2]});
 assert.match(html,/c-museo-banner-retouch/);
 assert.doesNotMatch(html,/BLOKEATUTA<\/span>|OSATUTA<\/span>/);
});
