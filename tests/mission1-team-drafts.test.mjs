import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMission1DraftSync} from '../js/mission1-draft-sync.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function environment(){
 const listeners=new Map();
 const add=(event,listener)=>{
   if(!listeners.has(event))listeners.set(event,new Set());
   listeners.get(event).add(listener);
 };
 const remove=(event,listener)=>listeners.get(event)?.delete(listener);
 globalThis.window={addEventListener:add,removeEventListener:remove};
 globalThis.document={hidden:false,addEventListener:add,removeEventListener:remove};
 return {emit:event=>listeners.get(event)?.forEach(listener=>listener())};
}
function fakeServer(){
 const rows=new Map();
 let offline=false;
 const rpcCalls=[];
 const key=n=>String(n);
 const row=n=>{
   if(!rows.has(key(n)))rows.set(key(n),{team_id:'test-team',exercise:n,
     placements:{},revision:0});
   return rows.get(key(n));
 };
 const snapshot=n=>({placements:{...row(n).placements},revision:row(n).revision});
 const client={
   from(table){
     assert.equal(table,'mission1_team_drafts');
     const query={exercise:null,select(){return this},
       eq(name,val){if(name==='exercise')this.exercise=val;return this},
       async maybeSingle(){
         if(offline)return {data:null,error:{message:'network'}};
         const val=rows.get(key(this.exercise));
         return {data:val?structuredClone(val):null,error:null};
       }};
     return query;
   },
   channel(){return {on(){return this},subscribe(){return this}}},
   async removeChannel(){},
   async rpc(name,args){
     rpcCalls.push(name);
     if(offline)return {data:null,error:{message:'network'}};
     const n=args.p_exercise,current=row(n);
     if(name==='mission1_draft_move'){
       const before=current.placements[args.p_item]??null;
       if(before!==(args.p_expected_slot??null))
         return {data:{status:'conflict',...snapshot(n)},error:null};
       const target=args.p_to_slot??null;
       if(before!==target){
         for(const [item,slot] of Object.entries(current.placements))
           if(item!==args.p_item&&slot===target)delete current.placements[item];
         if(target===null)delete current.placements[args.p_item];
         else current.placements[args.p_item]=target;
         current.revision++;
       }
       return {data:{status:'saved',...snapshot(n)},error:null};
     }
     if(name==='mission1_draft_reset'){
       if(current.revision!==args.p_revision)
         return {data:{status:'conflict',...snapshot(n)},error:null};
       current.placements={};current.revision++;
       return {data:{status:'saved',...snapshot(n)},error:null};
     }
     if(name==='mission1_draft_submit'){
       if(current.revision!==args.p_revision)
         return {data:{status:'conflict',...snapshot(n)},error:null};
       if(Object.keys(current.placements).length!==5)
         return {data:{status:'incomplete',completed:false,revision:current.revision},error:null};
       return {data:{status:'checked',completed:false,mission_completed:false,
         revision:current.revision},error:null};
     }
     throw Error('RPC inesperada: '+name);
   }
 };
 return {client,rows,row,setOffline:value=>{offline=value},rpcCalls};
}
test('Dos alumnos sincronizan colocaciones independientes y el reinicio obsoleto no borra nada',async()=>{
 environment();
 const server=fakeServer(),a=[],b=[],events=[];
 const first=createMission1DraftSync({client:server.client,teamId:'test-team',
   exercise:3,onDraft:p=>a.push(p),onStatus:(msg,kind)=>events.push(kind)});
 const second=createMission1DraftSync({client:server.client,teamId:'test-team',
   exercise:3,onDraft:p=>b.push(p),onStatus:(msg,kind)=>events.push(kind)});
 await first.start();await second.start();
 try{
   assert.equal(first.ready,true);
   assert.equal(await first.move('capital','resources',null),true);
   assert.equal(await second.move('exploit','purpose',null),true);
   assert.equal(await first.reset(),false,'El reinicio antiguo debe sufrir conflicto');
   assert.equal(a.at(-1).exploit,'purpose');
   await first.load();
   assert.deepEqual(first.placements,{capital:'resources',exploit:'purpose'});
   assert.equal(await first.move('capital','outcome',null),false,
     'Los cambios obsoletos a la misma cartela se rechazan');
   assert.equal(await first.reset(),true);
   await second.load();
   assert.deepEqual(second.placements,{});
   assert.ok(events.includes('conflict'));
 }finally{first.stop();second.stop()}
});
test('Desconexión deshabilita cambios; reconexión conserva borrador sin pistas',async()=>{
 const env=environment(),server=fakeServer(),states=[],reports=[];
 const draft=createMission1DraftSync({client:server.client,teamId:'test-team',exercise:5,
   onDraft:p=>states.push(p),onStatus:(msg,kind)=>reports.push({msg,kind})});
 await draft.start();
 try{
   assert.equal(await draft.move('koloniak','1',null),true);
   server.setOffline(true);
   assert.equal(await draft.move('metropoliak','2',null),false);
   assert.equal(draft.ready,false);
   assert.equal(await draft.move('ustiapena','3',null),false);
   server.setOffline(false);env.emit('online');
   await new Promise(resolve=>setImmediate(resolve));
   assert.equal(draft.ready,true);
   assert.deepEqual(draft.placements,{koloniak:'1'});
   assert.equal(await draft.move('metropoliak','2',null),true);
   assert.equal(await draft.reset(),true);
   assert.deepEqual(draft.placements,{});
   const log=reports.map(x=>x.msg).join(' ');
   assert.doesNotMatch(log,/1.*koloniak|2.*metropoliak|zuzena.*metropoliak/i,
     'Los mensajes de guardado no deben dar pistas de soluciones');
 }finally{draft.stop()}
});
test('El servidor debe verificar las cinco respuestas como conjunto y proteger el progreso',()=>{
 const sql=read('supabase/migrations/20261123_mission1_exercises_3_5_shared_drafts.sql');
 for(const pattern of [/ENABLE ROW LEVEL SECURITY/,
   /GRANT SELECT ON public\.mission1_team_drafts TO authenticated/,
   /public\.teacher_owns_team/,/role='student'/,
   /pg_advisory_xact_lock/,/p_expected_slot/,/p_revision/,
   /public\.submit_mission1_exercise\(p_exercise,v_places\)/,
   /REV(?:OKE|OKE ALL) ON FUNCTION public\.mission1_draft_submit/]){
   assert.match(sql,pattern);
 }
 assert.doesNotMatch(sql,/GRANT (INSERT|UPDATE|DELETE) ON public\.mission1_team_drafts TO authenticated/i);
 assert.match(sql,/mission1_exercise_completions/);
 assert.match(sql,/empire_dossier_team_state/);
});
test('El navegador no publica las soluciones de los ejercicios 3 y 5',()=>{
 const third=read('inperialismoaren-definizioa.html');
 const fifth=read('esaldiak-osatu.html');
 const modelRaw=third.match(/const model=(\{.*?\});\nconst scene=/s)?.[1];
 assert.ok(modelRaw,'Debe existir modelo de las cartelas');
 const model=JSON.parse(modelRaw);
 assert.equal(model.items.length,5);
 assert.equal(model.slots.length,5);
 assert.ok(model.items.every(x=>!Object.hasOwn(x,'target')));
 assert.ok(model.slots.every(x=>!Object.hasOwn(x,'expected')));
 assert.doesNotMatch(third,/slot\.expected|item\.target|const wrong=model/);
 assert.doesNotMatch(fifth,/const answer=|answer\[slot\]|Object\.entries\(answer\)/);
 for(const html of [third,fifth]){
   assert.match(html,/DraftApply/);
   assert.doesNotMatch(html,/rpc\('submit_mission1_exercise'/);
 }
});
test('El cuarto ejercicio diferencia lectura personal de expedientes compartidos',()=>{
 const src=read('inperioen-aztarnak.html');
 assert.match(src,/Zuk irakurritako agiriak/);
 assert.match(src,/Taldeak argitutakoak/);
 assert.match(src,/\.eq\('student_id',studentId\)\.eq\('team_id',teamId\)/);
 assert.match(src,/record_empire_dossier_clue/);
 assert.match(src,/p_preview:teacherPreview/);
});
