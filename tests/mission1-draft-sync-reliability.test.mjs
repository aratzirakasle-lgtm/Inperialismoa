import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMission1DraftSync} from '../js/mission1-draft-sync.js';

function setup(){
 const storage=new Map(),events=new Map();
 globalThis.localStorage={
   getItem:key=>storage.get(key)??null,
   setItem:(key,v)=>storage.set(key,String(v)),
   removeItem:key=>storage.delete(key)
 };
 const add=(name,fn)=>events.set(name,fn);
 globalThis.window={addEventListener:add,removeEventListener(name){events.delete(name)},
   setInterval(){return 1},clearInterval(){}};
 globalThis.document={hidden:false,addEventListener:add,removeEventListener(name){events.delete(name)}};
 const server={placements:{},revision:0,present:false},calls=[],statuses=[];
 let fail='none';
 const copy=()=>({placements:{...server.placements},revision:server.revision});
 const client={
   from(name){
     assert.equal(name,'mission1_team_drafts');
     return {select(){return this},eq(){return this},
       async maybeSingle(){return {data:server.present?copy():null,error:null}}};
   },
   channel(){return {on(){return this},subscribe(){return this}}},
   async removeChannel(){},
   async rpc(name,args){
     calls.push({name,args});
     if(name==='mission1_draft_move_checked'){
       const old=server.placements[args.p_item]??null;
       if(server.revision!==args.p_expected_revision||old!==(args.p_expected_slot??null))
         return {data:{status:'conflict',...copy()},error:null};
       if(fail==='before'){
         fail='none';return {data:null,error:{message:'temporary connection failure'}};
       }
       if(old!==(args.p_to_slot??null)){
         for(const [id,slot] of Object.entries(server.placements))
           if(slot===args.p_to_slot&&id!==args.p_item)delete server.placements[id];
         if(args.p_to_slot===null)delete server.placements[args.p_item];
         else server.placements[args.p_item]=args.p_to_slot;
         server.revision++;server.present=true;
       }
       if(fail==='after'){
         fail='none';return {data:null,error:{message:'response was lost'}};
       }
       return {data:{status:'saved',...copy()},error:null};
     }
     if(name==='mission1_draft_reset'){
       if(server.revision!==args.p_revision)
         return {data:{status:'conflict',...copy()},error:null};
       server.placements={};server.revision++;server.present=true;
       return {data:{status:'saved',...copy()},error:null};
     }
     if(name==='mission1_draft_submit'){
       if(server.revision!==args.p_revision)
         return {data:{status:'conflict',...copy()},error:null};
       if(Object.keys(server.placements).length!==5)
         return {data:{status:'incomplete',revision:server.revision},error:null};
       // El simulador devuelve un único booleano; nunca respuestas individuales.
       return {data:{status:'checked',completed:false,
         mission_completed:false,revision:server.revision},error:null};
     }
     throw Error('RPC no esperada: '+name);
   }
 };
 function make(exercise,userId){
   const snapshots=[];
   const sync=createMission1DraftSync({client,teamId:'team-x',exercise,userId,
     onDraft:(draft,state)=>snapshots.push({draft,state}),
     onStatus:(msg,kind)=>statuses.push({msg,kind}),
     onCompleted:()=>{throw Error('Un intento incorrecto no puede completar la misión')}
   });
   return {sync,snapshots};
 }
 return {server,storage,calls,statuses,make,failOnce:mode=>{fail=mode}};
}
test('Los dos alumnos respetan revisión CAS y recuperan posiciones al recargar',async()=>{
 const e=setup();
 const a=e.make(3,'student-a'),b=e.make(3,'student-b');
 await Promise.all([a.sync.start(),b.sync.start()]);
 assert.equal(await a.sync.move('capital','resources',null),true);
 assert.equal(await b.sync.move('exploit','metropole',null),false,
   'Con la revisión anterior no puede pisarse la actualización de un compañero');
 assert.deepEqual(b.sync.placements,{capital:'resources'});
 await b.sync.load();
 assert.equal(await b.sync.move('exploit','metropole',null),true);
 await a.sync.load();
 assert.deepEqual(a.sync.placements,{capital:'resources',exploit:'metropole'});
 assert.ok(e.calls.filter(x=>x.name==='mission1_draft_move_checked').every(x=>
   Number.isSafeInteger(x.args.p_expected_revision)));
 a.sync.stop();b.sync.stop();
});
test('Un movimiento no guardado sobrevive a la recarga y se reintenta sin perder la selección',async()=>{
 const e=setup();
 const a=e.make(5,'student-a');
 await a.sync.start();
 e.failOnce('before');
 assert.equal(await a.sync.move('koloniak','2',null),false);
 const pendingKey='inperialismoa:m1:pending:team-x:5:student-a';
 assert.ok(e.storage.has(pendingKey));
 assert.equal(a.sync.ready,false);
 a.sync.stop();
 const again=e.make(5,'student-a');
 assert.equal(await again.sync.start(),true);
 assert.deepEqual(again.sync.placements,{koloniak:'2'});
 assert.equal(e.server.revision,1);
 assert.equal(e.storage.has(pendingKey),false);
 again.sync.stop();
});
test('La respuesta de red perdida no duplica una colocación ya aceptada',async()=>{
 const e=setup(),a=e.make(3,'student-a');
 await a.sync.start();e.failOnce('after');
 assert.equal(await a.sync.move('conquered','colony',null),false);
 assert.equal(e.server.revision,1);
 a.sync.stop();
 const b=e.make(3,'student-a');
 await b.sync.start();
 assert.equal(e.server.revision,1);
 assert.equal(b.sync.placements.conquered,'colony');
 assert.equal(e.storage.size,0);
 b.sync.stop();
});
test('Un movimiento offline obsoleto se descarta sin borrar trabajo posterior',async()=>{
 const e=setup(),a=e.make(5,'student-a');
 await a.sync.start();e.failOnce('before');
 assert.equal(await a.sync.move('koloniak','2',null),false);a.sync.stop();
 e.server.placements={dominazioa:'2'};e.server.revision=1;e.server.present=true;
 const again=e.make(5,'student-a');
 await again.sync.start();
 assert.deepEqual(again.sync.placements,{dominazioa:'2'});
 assert.equal(e.server.revision,1);
 assert.equal(e.storage.size,0);
 assert.ok(e.statuses.some(x=>x.kind==='conflict'));
 again.sync.stop();
});
test('Reinicio protegido frente a revisiones antiguas, sin pistas al corregir',async()=>{
 const e=setup();
 const a=e.make(5,'a'),b=e.make(5,'b');
 await Promise.all([a.sync.start(),b.sync.start()]);
 for(const [word,slot] of [['koloniak','1'],['kapitalismoa','2'],
   ['nagusitasuna','3'],['inperialismoa','4'],['ustiapena','5']]){
   assert.equal(await a.sync.move(word,slot,null),true);
 }
 const answer=await a.sync.submit();
 assert.deepEqual(Object.keys(answer).sort(),
   ['completed','mission_completed','revision','status']);
 assert.equal(answer.completed,false);
 assert.ok(e.statuses.some(x=>x.kind==='incorrect'));
 assert.equal(await b.sync.reset(),false,'Un borrado antiguo no borra un equipo actualizado');
 assert.equal(e.server.revision,5);
 a.sync.stop();b.sync.stop();
});
test('La RPC de Supabase exige equipo, revisión y nunca cambia el historial',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261123_mission1_draft_revision_guarded_moves.sql',import.meta.url),'utf8');
 assert.match(sql,/private\.m1_draft_allowed\(/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/v_revision IS DISTINCT FROM p_expected_revision/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.mission1_draft_move_checked/);
 assert.doesNotMatch(sql,/\b(?:DELETE FROM|TRUNCATE|UPDATE public\.profiles|UPDATE auth\.users)\b/i);
 const clientCode=readFileSync(new URL('../js/mission1-draft-sync.js',import.meta.url),'utf8');
 assert.match(clientCode,/localStorage\.setItem\(pendingKey/);
 assert.match(clientCode,/mission1_draft_move_checked/);
 assert.match(clientCode,/mission1_draft_submit/);
 assert.doesNotMatch(clientCode,/correctAnswers|answer\[|correctMap|soluciones/i);
});
