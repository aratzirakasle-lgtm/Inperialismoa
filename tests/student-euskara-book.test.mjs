import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {euskaratuMisioa,euskaratuGaldera} from '../js/euskara-ikasleak.js';

const read=p=>readFileSync(fileURLToPath(new URL('../'+p,import.meta.url)),'utf8');

test('Erantzunen identifikatzaileak, zuzenketa-indizeak eta ordena mantentzen dira',()=>{
 const original={id:1,title:'¿Por qué expandirse?',questions:[
   {id:'a1',text:'¿Qué buscaban obtener las potencias industriales en las colonias?',
     options:['Materias primas y nuevos mercados','El cierre de sus fábricas','El fin del comercio exterior'],
     correct:0,metadata:'mantendu'}
 ]};
 const translated=euskaratuMisioa(original);
 assert.equal(translated.title,'Aurrekarriak eta oinarriak');
 assert.match(translated.questions[0].text,/Zer lortu nahi/);
 assert.equal(translated.questions[0].correct,0);
 assert.equal(translated.questions[0].id,'a1');
 assert.equal(translated.questions[0].metadata,'mantendu');
 assert.equal(translated.questions[0].options.length,3);
 assert.deepEqual(original.questions[0].options,['Materias primas y nuevos mercados','El cierre de sus fábricas','El fin del comercio exterior']);
});

test('15 galdera historiko eta 6 titulu aurkezteko mapak datuak ez ditu ezabatzen',()=>{
 const js=read('js/euskara-ikasleak.js');
 const match=[...js.matchAll(/^\s+[a-e]\d:/gm)];
 assert.equal(match.length,15);
 for(let id=1;id<=6;id++){
   const m=euskaratuMisioa({id,questions:[]});
   assert.ok(m.title);
   assert.doesNotMatch(m.title,/[¿¡]/);
 }
 const unchanged=euskaratuGaldera({id:'future-new-question',text:'Etorkizuneko galdera',options:['Bat','Bi']});
 assert.equal(unchanged.text,'Etorkizuneko galdera');
});

test('Argazki originalean inprimatutako datuak ez dira bigarrenez idazten',()=>{
 const c=read('js/vestibulo-c-auth.js');
 const css=read('assets/vestibulo-c-auth.css');
 assert.match(c,/const originalProgress=complete1\&\&!complete2/);
 assert.match(c,/originalProgress\?'':'<span class="c-museo-book-progress"/);
 assert.match(c,/sameName\?'':'<span class="c-museo-book-name/);
 assert.match(css,/data:image\/webp;base64/);
 assert.match(css,/c-museo-book-next/);
 assert.match(css,/top:77\.08%/);
});

test('Ikasleen lau aretoak ikusgai, azken biak itxita, irakaslearen kudeaketa bere horretan',()=>{
 const app=read('js/app.js');
 const index=read('index.html');
 assert.match(app,/missions\.filter\(m=>m\.id>=1&&m\.id<=4\)/);
 assert.match(app,/const available=id=>accountIsTeacher\(\)\|\|/);
 assert.match(app,/function renderTeacher\(\)/);
 assert.match(app,/missions=.*euskaratuMisioa/);
 assert.match(index,/<html lang="eu">/);
 assert.match(index,/aria-label="Misioen nabigazioa"/);
});
