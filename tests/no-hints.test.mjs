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
  assert.match(gallery,/state\.feedback=state\.completed\s*\?/);
  assert.match(gallery,/Object\.keys\(answers\)\.length!==ITEMS\.length/);
  assert.doesNotMatch(gallery,/result\.incorrect|result\.correct|result\.locked_positions/);
  assert.match(bi,/data\.phase_complete/);
  assert.doesNotMatch(bi,/data\.incorrect|wrong=data\.incorrect|delete challengePending\[id\]/,
    'El segundo ejercicio no expone pistas individuales al fallar');
  assert.match(fourth,/if\(result\.wrong\)\{return .*Erantzuna ez da zuzena\. Saiatu berriro/);
  assert.doesNotMatch(fourth,/Berrikusi pistak eta saiatu berriro/);
  assert.doesNotMatch(gallery,/if\(action==='check'\).*state\.help=true/);
  assert.doesNotMatch(bi,/hintLevel\s*\+\+/);
  assert.doesNotMatch(bi,/wrong\.length\s*\+\s*["'] kontzeptu/);
  const third=read('inperialismoaren-definizioa.html');
  const fifth=read('esaldiak-osatu.html');
  assert.doesNotMatch(third,/wrong\.length\s*\+\s*["'] lotura/);
  assert.doesNotMatch(fifth,/wrong\.length\s*\+\s*["'] hutsune/);
  assert.doesNotMatch(fifth,/for\(const k of wrong\).*classList\.add\(['"]error['"]\)/);
  assert.match(gallery,/Ariketa ez dago gaindituta\./);
  for(const text of [bi,third,fifth]){
    assert.match(text,/Ez da zuzena\./);
  }
});

test('La base de datos evalúa el bloque completo sin devolver errores por tarjeta',()=>{
  const migration=read('supabase/migrations/20261123_mission1_safe_atomic_grading.sql');
  assert.match(migration,/v_phase_complete := jsonb_array_length\(v_wrong\)=0/);
  assert.match(migration,/v_remaining := CASE WHEN p_phase='classify'/);
  assert.match(migration,/p_answers\)\)<>v_remaining/);
  assert.match(migration,/'correct','\[\]'::jsonb,'incorrect','\[\]'::jsonb/);
  assert.match(migration,/'completed',false,'incorrect','\[\]'::jsonb/);
  const bi=read('js/bi-sistema-live.js');
  assert.match(bi,/TRAITS.some\(t=>!locked.has\(t.id\)&&!pending\[t.id\]\)/);
  assert.match(bi,/CASES.some\(c=>!challengeLocked.has\(c.id\)&&!challengePending\[c.id\]\)/);
});

test('Se conservan las fuentes primarias de los expedientes como parte del juego',()=>{
  const fourth=read('inperioen-aztarnak.html');
  assert.match(fourth,/c\.clues\.map/);
  assert.match(fourth,/check_empire_dossier_with_reading/);
});
