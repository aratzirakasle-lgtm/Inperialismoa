import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/museum-passport.js',import.meta.url),'utf8');
const {renderMuseumPassport}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('pasaporte: cuatro sellos, solo los confirmados, y medalla de primera misión',()=>{
 const pending=renderMuseumPassport({teamName:'Atlas'});
 assert.equal((pending.match(/class="mp-slot"/g)||[]).length,4);
 assert.doesNotMatch(pending,/class="mp-medal"/);
 const won=renderMuseumPassport({teamName:'Atlas',completedIds:[1,2,2,5],animate:true});
 assert.equal((won.match(/class="mp-slot mp-earned/g)||[]).length,2);
 assert.match(won,/class="mp-medal"/);assert.match(won,/mp-imprint/);assert.match(won,/2 \/ 4/);
});
test('pasaporte: vista previa explícita y nombre seguro',()=>{
 const html=renderMuseumPassport({teamName:'<script>alert(1)</script>',completedIds:[1],preview:true});
 assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
 assert.match(html,/SIMULAZIOA/);assert.doesNotMatch(html,/mp-imprint/);
});

 test('Segunda misión: dos medallas y dos sellos',()=>{const html=renderMuseumPassport({completedIds:[1,2],animate:true,animateMission:2});assert.equal((html.match(/class="mp-medal"/g)||[]).length,2);assert.match(html,/II\. MISIOAREN DOMINA/);});
