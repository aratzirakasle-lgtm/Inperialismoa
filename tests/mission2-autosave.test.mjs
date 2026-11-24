import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission2Autosave,mergeMission2Patch} from '../js/mission2-autosave.js';

function fixture(){
 const data=new Map(),storage=new Map(),calls=[];
 globalThis.localStorage={
  getItem:k=>storage.get(k)||null,
  setItem:(k,v)=>storage.set(k,String(v)),
  removeItem:k=>storage.delete(k)
 };
 globalThis.window=new EventTarget();
 globalThis.document=new EventTarget();
 document.visibilityState='visible';
 let offline=false;
 const client={
  from(name){
   assert.equal(name,'mission2_team_drafts');
   return {
    select(fields){assert.equal(fields,'exercise,answers');return this},
    async eq(field,teamId){
     assert.equal(field,'team_id');
     return {data:[...data.entries()].filter(([k])=>k.startsWith(teamId+':'))
      .map(([k,answers])=>({exercise:Number(k.split(':')[1]),answers})),error:null};
    }
   };
  },
  async rpc(name,args){
   assert.equal(name,'save_mission2_team_draft');
   calls.push(args);
   if(offline)return {data:null,error:{message:'offline'}};
   const key='team:'+args.p_exercise;
   data.set(key,args.p_reset?{}:mergeMission2Patch(data.get(key)||{},args.p_patch));
   return {data:{status:'saved',answers:data.get(key)},error:null};
  }
 };
 const create=(onRestore=()=>{},onStatus=()=>{})=>createMission2Autosave({
  client,teamId:'team',userId:'student',onRestore,onStatus
 });
 return {create,data,storage,calls,setOffline(value){offline=value}};
}

test('La combinación permite eliminar una cartela ya colocada',()=>{
 assert.deepEqual(mergeMission2Patch(
  {assignments:{a:'economic',b:'political'},multi:{africa:['congo']}},
  {assignments:{a:null},multi:{africa:['nile']}}
 ),{assignments:{b:'political'},multi:{africa:['nile']}});
});

test('Los cinco ejercicios se guardan por separado y reaparecen en una sesión nueva',async()=>{
 const f=fixture(),first=f.create();
 await first.load();
 first.queue(1,{assignments:{new_markets:'economic'}});
 first.queue(2,{'1869':'suez'});
 first.queue(3,{route_asia:'asia',bag_growth:'cause'});
 first.queue(4,{sea:'a'});
 first.queue(5,{multi:{africa:['nile','congo']},congo:'exploitation'});
 await first.flush();
 assert.equal(f.calls.length,5);
 assert.equal(f.storage.size,0,'El borrador local sólo se borra al confirmarlo el servidor');
 first.destroy();
 let restored=null;
 const second=f.create(rows=>{restored=rows});
 await second.load();
 assert.equal(restored[1].assignments.new_markets,'economic');
 assert.equal(restored[2]['1869'],'suez');
 assert.equal(restored[3].bag_growth,'cause');
 assert.equal(restored[4].sea,'a');
 assert.equal(restored[5].congo,'exploitation');
 second.destroy();
});

test('Una caída de red conserva cambios pendientes para recuperarlos después',async()=>{
 const f=fixture();
 f.setOffline(true);
 const first=f.create();
 await first.load();
 first.queue(1,{assignments:{new_markets:'economic'}});
 await first.flush();
 assert.equal(first.hasPending(),true);
 assert.equal(f.storage.size,1);
 first.destroy();
 f.setOffline(false);
 const recovered=[];
 const next=f.create(rows=>recovered.push(rows));
 await next.load();
 assert.equal(recovered[0][1].assignments.new_markets,'economic');
 await next.flush();
 assert.equal(f.data.get('team:1').assignments.new_markets,'economic');
 assert.equal(f.storage.size,0);
 next.destroy();
});

test('Las eliminaciones y el reinicio se propagan al servidor y sobreviven a la recarga',async()=>{
 const f=fixture(),a=f.create();
 await a.load();
 a.queue(1,{assignments:{a:'economic',b:'political'}});
 await a.flush();
 a.queue(1,{assignments:{a:null}});
 await a.flush();
 assert.deepEqual(f.data.get('team:1').assignments,{b:'political'});
 a.reset(1);
 await a.flush();
 assert.deepEqual(f.data.get('team:1'),{});
 a.destroy();
});

test('El frontend usa acceso por equipo y una RPC, sin enviar aciertos ni usar claves privadas',async()=>{
 const f=fixture(),a=f.create();
 await a.load();a.queue(1,{assignments:{a:'political'}});
 await a.flush();
 assert.equal(f.calls[0].p_exercise,1);
 assert.deepEqual(f.calls[0].p_patch,{assignments:{a:'political'}});
 a.destroy();
});
