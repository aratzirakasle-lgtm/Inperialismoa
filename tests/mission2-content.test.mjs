import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('La misión 2 ofrece cinco ejercicios con fuentes delimitadas (diapositivas 6-18)',()=>{
 const js=read('js/mission2-faktoreak.js');
 const html=read('inperialismoaren-faktoreak.html');
 for(const name of ['Kausen kabinetea','Kapitalaren ibilbideak','Migrazioen liburua','Boterearen artxiboa','Esploratzaileen espedientea'])
  assert.ok(js.includes(name),name);
 for(const range of ['6. diapositiba','7.–9. diapositibak','10.–12. diapositibak','13.–16. diapositibak','17.–18. diapositibak'])
  assert.ok(js.includes(range),range);
 assert.ok(html.includes('mission2-faktoreak.js'));
 assert.ok(html.includes('mission2-faktoreak.css'));
});
test('El cliente no contiene un banco de respuestas correctas ni ofrece pistas tras un error',()=>{
 const js=read('js/mission2-faktoreak.js');
 const sql=read('supabase/mission2_faktoreak.sql');
 assert.match(js,/submit_mission2_exercise/);
 assert.match(js,/Ez da zuzena\. Berrikusi erantzun guztiak/);
 assert.doesNotMatch(js,/response\.incorrect|data\.incorrect|wrong_ids|correct_option/);
 assert.doesNotMatch(sql,/"new_markets":"economic"/);
 assert.doesNotMatch(sql,/"africa":"congo,niger,nile,zambezi"/);
 assert.match(sql,/mission2_answer_keys/);
 assert.match(sql,/REVOKE ALL ON public\.mission2_answer_keys FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/IF p_answers<>v_expected THEN[\s\S]*'completed',false/);
});
test('El servidor solo avanza en orden, reserva el guardado a alumnos y desbloquea misión 3 al terminar cinco ejercicios',()=>{
 const sql=read('supabase/mission2_faktoreak.sql');
 assert.match(sql,/v_role IS DISTINCT FROM 'student'/);
 assert.match(sql,/mission_id=1/);
 assert.match(sql,/exercise=v_previous/);
 assert.match(sql,/IF p_exercise=5 THEN[\s\S]*mission_completions/);
 assert.match(sql,/next_mission_id.*CASE WHEN p_exercise=5 THEN 3/);
 assert.match(sql,/p_mission_id IN \(1,2\)/);
});
test('La primera misión no cambia sus juegos ni pantallas',()=>{
 const js=read('js/app.js');
 assert.match(js,/currentMission===2&&!demo/);
 assert.match(js,/currentMission===1&&\(!galleryQuestionsOpen/);
 for(const screen of ['bi-sistema.html','inperialismoaren-definizioa.html','inperioen-aztarnak.html','esaldiak-osatu.html'])
  assert.ok(js.includes(screen),screen);
});


test('El ejercicio de la maleta usa los ocho dibujos antiguos, transparentes y ampliados',()=>{
 const script=read('js/mission2-faktoreak.js');
 for(const id of ['growth','conditions','better','conversion','settlement','missions','oceania','faith']){
  const filename='m2-vintage-'+id+'-transparent.webp';
  assert.ok(script.includes(filename),filename);
  const data=readFileSync(new URL('../assets/'+filename,import.meta.url));
  assert.ok(data.length>10000,filename+' demasiado pequeño');
  assert.equal(data.toString('ascii',0,4),'RIFF',filename);
  assert.equal(data.toString('ascii',8,12),'WEBP',filename);
  assert.equal(data.toString('ascii',12,16),'VP8X',filename);
  assert.ok((data[20]&0x10)!==0,filename+' sin canal alfa');
  const width=data[24]+(data[25]<<8)+(data[26]<<16)+1;
  const height=data[27]+(data[28]<<8)+(data[29]<<16)+1;
  assert.deepEqual([width,height],[720,540],filename);
 }
 assert.doesNotMatch(script,/m2-suitcase-[a-z]+-restored\.webp/);
});
