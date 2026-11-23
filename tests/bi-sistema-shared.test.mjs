import test from 'node:test';
import assert from 'node:assert/strict';
import {createBiSistemaShared} from '../js/bi-sistema-shared.js';

function environment(){
 const store=new Map();
 globalThis.localStorage={
   getItem:key=>store.get(key)??null,
   setItem:(key,value)=>{store.set(key,String(value))},
   removeItem:key=>{store.delete(key)}
 };
 globalThis.window={
   addEventListener(){},removeEventListener(){},
   setInterval(){return 1},clearInterval(){}
 };
 globalThis.document={hidden:false,addEventListener(){},removeEventListener(){}};
 return store;
}
async function until(predicate){
 for(let n=0;n<80;n++){
   if(predicate())return;
   await new Promise(resolve=>setImmediate(resolve));
 }
 throw Error('La copia compartida no se sincronizó');
}
test('Dos alumnos reutilizan el mismo tablero sin perder movimientos ni indicar respuestas correctas',async()=>{
 environment();
 const server={draft:null},calls=[];
 const client={
   from(name){
     assert.equal(name,'bi_sistema_team_drafts');
     return {select(){return this},eq(){return this},
       async maybeSingle(){return {data:server.draft?structuredClone(server.draft):null,error:null}}};
   },
   channel(){return {on(){return this},subscribe(){return this}}},
   async removeChannel(){},
   async rpc(name,args){
     calls.push(name);
     if(name==='bi_sistema_draft_move'){
       const row=server.draft??={team_id:'same-team',revision:0,placements:{},cases:{}};
       const {p_card_id:id,p_to_zone:to,p_expected_zone:expected}=args;
       const old=row.placements[id]??null;
       if(old!==expected)
         return {data:{status:'conflict',...structuredClone(row)},error:null};
       if(to===null)delete row.placements[id];else row.placements[id]=to;
       row.revision++;
       return {data:{status:'saved',...structuredClone(row)},error:null};
     }
     if(name==='bi_sistema_draft_reset'){
       const row=server.draft;
       if(args.p_revision!==row.revision)
         return {data:{status:'conflict',...structuredClone(row)},error:null};
       row.placements={};row.cases={};row.revision++;
       return {data:{status:'saved',...structuredClone(row)},error:null};
     }
     throw Error('RPC inesperado: '+name);
   }
 };
 let first=null,second=null;
 const make=(userId,save)=>createBiSistemaShared({
   client,teamId:'same-team',userId,localDraft:{places:{},cases:{}},
   onDraft:save,onStatus(){},onRemote(){}
 });
 const a=make('alumno-a',value=>{first=value}),b=make('alumno-b',value=>{second=value});
 const stopA=a.start(),stopB=b.start();
 try{
   await until(()=>a.ready&&b.ready);
   assert.equal(await a.move('army','auth',null),true);
   await b.load();
   assert.equal(second.placements.army,'auth');
   assert.equal(await b.move('monarch','auth',null),true);
   await a.load();
   assert.deepEqual(first.placements,{army:'auth',monarch:'auth'});
   assert.equal(await a.move('army','lib',null),false,
     'El servidor rechaza un cambio sobre una colocación que ya cambió');
   assert.equal(first.placements.army,'auth');
   assert.equal(await b.reset(),false,
     'Un reinicio con revisión desactualizada no borra el tablero');
   await b.load();
   assert.equal(await b.reset(),true);
   await a.load();
   assert.deepEqual(first.placements,{});
   assert.equal(calls.filter(x=>x==='bi_sistema_draft_move').length,3);
 }finally{stopA();stopB()}
});
