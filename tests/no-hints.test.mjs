import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Los botones de ayuda explican la mecánica, sin revelar respuestas',()=>{
  const gallery=read('js/galeria-potencias.js');
  const bi=read('js/bi-sistema-live.js');
  assert.match(gallery,/Erabilera: aukeratu txartel bat/);
  assert.match(bi,/Erabilera: hautatu txartel bat/);
  assert.doesNotMatch(gallery,/Pista: Europan sistema autoritarioak/i);
  assert.doesNotMatch(bi,/Beste pista bat:|Pista: nork kontrolatzen/i);
});

test('Un error de corrección nunca activa una pista histórica',()=>{
  const gallery=read('js/galeria-potencias.js');
  const bi=read('js/bi-sistema-live.js');
  const fourth=read('inperioen-aztarnak.html');
  assert.match(gallery,/state\.feedback=state\.completed\?/);
  assert.match(bi,/const wrong=data\.incorrect\|\|\[\]/);
  assert.match(fourth,/if\(result\.wrong\)\{return .*Erantzuna ez da zuzena\. Saiatu berriro/);
  assert.doesNotMatch(fourth,/Berrikusi pistak eta saiatu berriro/);
  assert.doesNotMatch(gallery,/if\(action==='check'\).*state\.help=true/);
  assert.doesNotMatch(bi,/hintLevel\s*\+\+/);
});

test('Se conservan las fuentes primarias de los expedientes como parte del juego',()=>{
  const fourth=read('inperioen-aztarnak.html');
  assert.match(fourth,/c\.clues\.map/);
  assert.match(fourth,/check_empire_dossier_with_reading/);
});
