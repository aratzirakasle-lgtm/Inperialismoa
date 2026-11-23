import test from 'node:test';
import assert from 'node:assert/strict';
import { createGallerySyncController } from '../js/galeria-sync-controller.js';

const zones=['eu_auth','ru','us','jp','eu_liberal'];
const items=[{id:'a'},{id:'b'}];
function runtime(){
  const store=new Map(),listeners=new Map();
  globalThis.localStorage={
    getItem:key=>store.has(key)?store.get(key):null,
    setItem:(key,value)=>{store.set(key,String(value))},
    removeItem:key=>store.delete(key)
  };
  globalThis.window={
    setInterval:()=>1,clearInterval:()=>{},
    addEventListener:(type,fn)=>{listeners.set(type,fn)},
    removeEventListener:(type,fn)=>{if(listeners.get(type)===fn)listeners.delete(type)}
  };
  return {store,listeners};
}
function state(){
  return {placements:{},locked:new Set(),completed:false,selected:null,busy:false,feedback:''};
}
function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
  return {promise,resolve,reject};
}
async function until(check){
  for(let i=0;i<150;i++){
    if(check())return;
    await new Promise(done=>setImmediate(done));
  }
  throw Error('La sincronización no alcanzó el estado esperado');
}
function controller(adapter,view,key){
  return createGallerySyncController({
    adapter,state:view,items,zones,draftKey:key,
    draw(){},saveLocal(){},onCompleted(){}
  });
}

test('Una notificación concurrente se procesa sin esperar doce segundos',async()=>{
  runtime();
  const blocked=deferred();
  let loads=0,notify;
  const snapshot=(revision,placements)=>({exists:true,revision,placements,completed:false});
  const adapter={
    load:()=>{
      loads++;
      if(loads===1)return Promise.resolve(snapshot(0,{}));
      if(loads===2)return blocked.promise;
      return Promise.resolve(snapshot(1,{a:'eu_auth'}));
    },
    subscribe(fn){notify=fn;return ()=>{notify=null}},
    move:async()=>{throw Error('No se esperaba ningún movimiento')},
    reset:async()=>{throw Error('No se esperaba reset')}
  };
  const view=state(),sync=controller(adapter,view,'m1-notify');
  try{
    sync.start();await until(()=>sync.ready);
    notify();await until(()=>loads===2);
    notify(); // Llegó mientras estaba esperando la respuesta anterior
    blocked.resolve(snapshot(0,{}));
    await until(()=>sync.revision===1);
    assert.equal(loads,3,'Debe reconsultar inmediatamente la notificación pendiente');
    assert.deepEqual(view.placements,{a:'eu_auth'});
  }finally{sync.stop()}
});

test('Dos llamadas a reconectar no duplican la lectura inicial',async()=>{
  runtime();
  const blocked=deferred();
  let loads=0;
  const adapter={
    load:()=>{loads++;return blocked.promise},
    subscribe:()=>()=>{}
  };
  const sync=controller(adapter,state(),'m1-reconnect-once');
  try{
    sync.start();
    await sync.connect();
    await sync.connect();
    assert.equal(loads,1,'No debe haber dos descargas simultáneas del mismo equipo');
    blocked.resolve({exists:true,revision:0,placements:{},completed:false});
    await until(()=>sync.ready);
  }finally{sync.stop()}
});

test('Dos alumnos combinan movimientos diferentes y reciben el reinicio común',async()=>{
  runtime();
  const server={placements:{},revision:0},subscribers=new Set();
  const snapshot=()=>({exists:true,revision:server.revision,placements:{...server.placements},completed:false});
  const adapter=()=>({
    load:async()=>snapshot(),
    subscribe:fn=>{subscribers.add(fn);return ()=>subscribers.delete(fn)},
    move:async(id,to,expected)=>{
      const current=server.placements[id]??null;
      if(current!==expected)return {status:'conflict',...snapshot()};
      if(to===null)delete server.placements[id];else server.placements[id]=to;
      server.revision++;
      queueMicrotask(()=>{for(const notify of subscribers)notify()});
      return {status:'saved',...snapshot()};
    },
    reset:async revision=>{
      if(revision!==server.revision)return {status:'conflict',...snapshot()};
      server.placements={};server.revision++;
      queueMicrotask(()=>{for(const notify of subscribers)notify()});
      return {status:'saved',...snapshot()};
    }
  });
  const a=state(),b=state(),one=controller(adapter(),a,'m1-team-alumno-1'),
    two=controller(adapter(),b,'m1-team-alumno-2');
  try{
    one.start();two.start();await until(()=>one.ready&&two.ready);
    one.move('a','eu_auth');
    await until(()=>one.revision===1&&two.revision===1&&one.ready&&two.ready);
    two.move('b','ru');
    await until(()=>one.revision===2&&two.revision===2&&one.ready&&two.ready);
    assert.deepEqual(a.placements,{a:'eu_auth',b:'ru'});
    assert.deepEqual(b.placements,{a:'eu_auth',b:'ru'});
    await one.reset();
    await until(()=>two.revision===3&&two.ready);
    assert.deepEqual(a.placements,{});
    assert.deepEqual(b.placements,{});
  }finally{one.stop();two.stop()}
});

test('Una caída de red deja el movimiento pendiente y lo recupera al reconectar',async()=>{
  const {store}=runtime();
  const server={placements:{},revision:0};
  let failOnce=true;
  const snapshot=()=>({exists:true,revision:server.revision,placements:{...server.placements},completed:false});
  const adapter={
    load:async()=>snapshot(),
    subscribe:()=>()=>{},
    move:async(id,to,expected)=>{
      if(failOnce){failOnce=false;throw Error('Red temporalmente desconectada')}
      if((server.placements[id]??null)!==expected)throw Error('CAS inconsistente');
      server.placements[id]=to;server.revision++;
      return {status:'saved',...snapshot()};
    }
  };
  const view=state(),sync=controller(adapter,view,'m1-offline');
  try{
    sync.start();await until(()=>sync.ready);
    sync.move('a','eu_auth');
    await until(()=>!sync.ready&&sync.pending);
    assert.ok(store.has('m1-offline:shared-pending'),'El cambio continúa guardado en el equipo');
    await sync.connect();
    await until(()=>sync.ready&&!sync.pending&&sync.revision===1);
    assert.deepEqual(server.placements,{a:'eu_auth'});
    assert.equal(store.has('m1-offline:shared-pending'),false);
  }finally{sync.stop()}
});
