import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(
  new URL('../supabase/migrations/20261123_mission1_real_prerequisites_legacy_gate.sql',import.meta.url),
  'utf8'
);
function body(name){
  const start=sql.indexOf('CREATE OR REPLACE FUNCTION public.'+name+'(');
  assert.ok(start>=0,'La migración incluye '+name);
  const end=sql.indexOf('CREATE OR REPLACE FUNCTION public.',start+20);
  return sql.slice(start,end<0?undefined:end);
}

test('Una antigua marca administrativa no permite saltarse el primer ejercicio',()=>{
  const m=body('submit_bi_sistema');
  assert.match(m,/public\.gallery_team_state/);
  assert.match(m,/public\.mission1_exercise_completions c/);
  assert.match(m,/c\.exercise=5/);
  assert.doesNotMatch(m,/mission_id\s*=\s*1/);
});

test('Los expedientes siguen exigiendo haber superado los ejercicios 2 y 3',()=>{
  for(const fn of ['record_empire_dossier_clue','check_empire_dossier']){
    const m=body(fn);
    assert.match(m,/public\.bi_sistema_team_state/);
    assert.match(m,/public\.mission1_exercise_completions e/);
    assert.match(m,/e\.exercise=3/);
    assert.match(m,/public\.mission1_exercise_completions m/);
    assert.match(m,/m\.exercise=5/);
    assert.match(m,/public\.mission1_exercise_completions c/);
    assert.match(m,/c\.exercise=5/);
    assert.doesNotMatch(m,/mission_id\s*=\s*1/);
  }
});

test('La segunda misión solo se abre tras completar efectivamente el quinto ejercicio',()=>{
  const m=body('submit_mission2_exercise');
  assert.match(m,/FROM public\.mission1_exercise_completions\s+WHERE team_id=v_team AND exercise=5/);
  assert.doesNotMatch(m,/mission_id\s*=\s*1/);
  assert.match(m,/mission_id=2/,'Conservar el registro privado de la segunda misión');
});

test('La migración conserva todos los usuarios y resultados históricos',()=>{
  assert.doesNotMatch(sql,/\b(?:DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|UPDATE\s+public\.profiles|UPDATE\s+auth\.users)\b/i);
  assert.match(sql,/SECURITY DEFINER/);
  assert.match(sql,/SET search_path TO ''/);
});
