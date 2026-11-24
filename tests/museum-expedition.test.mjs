import test from 'node:test';import assert from 'node:assert/strict';
import {expeditionSummary,renderExpedition,readExpedition} from '../js/museum-expedition.js';import {renderMuseumPassport,stampLabel} from '../js/museum-passport.js';
const stamp='2026-11-24T10:13:05Z',team='atlas',rows=Array.from({length:5},(_,i)=>({team_id:team,exercise:i+1,completed_at:stamp}));
test('Only confirmed steps award mission stamps, never another team or legacy badge',()=>{
 const s=expeditionSummary({team,m1:[rows[4]],m2:[...rows.slice(0,4),{...rows[4],team_id:'other'}],m1Flags:[{team_id:team,mission_completed:true}],mission2Open:true});
 assert.deepEqual(s.completedIds,[1]);assert.equal(s.next,2);assert.equal(s.completedAt[1],'2026-11-24T10:13:05.000Z');assert.equal(s.completedAt[2],null);
 const html=renderExpedition({summary:s,teamName:'<Atlas>'});assert.match(html,/&lt;Atlas&gt;/);assert.match(html,/9 \/ 20/);assert.match(html,/data-atlas-continue="2"/);assert.doesNotMatch(html,/data-atlas-continue="[34]"/);
});
test('Date uses Madrid and original timestamp; no fabricated legacy or preview dates',()=>{
 assert.equal(stampLabel(stamp).time,'11:13:05');const won=renderMuseumPassport({completedIds:[1],completedAt:{1:stamp,2:stamp}});
 assert.equal((won.match(/<time /g)||[]).length,1);assert.match(won,/11:13:05/);
 assert.doesNotMatch(renderMuseumPassport({preview:true,completedIds:[1],completedAt:{1:stamp}}),/<time /);
 assert.match(renderMuseumPassport({completedIds:[1]}),/Data egiaztatu gabe/);
 const s=expeditionSummary({team,m1:[rows[4]],m2:rows,mission2Open:false});assert.deepEqual(s.completedIds,[1,2]);assert.equal(s.next,0);assert.ok(s.completedAt[2]);
});
test('Unknown data are not zero and no unavailable mission can be started',()=>{const s=expeditionSummary({team,m1:null,m2:null});const html=renderExpedition({summary:s});assert.match(html,/Gutxienez/);assert.doesNotMatch(html,/data-atlas-continue/);});
test('Reads only requested team timestamps and existing flags, no writes',async()=>{const calls=[];const db={from(table){return {select(fields){calls.push([table,fields]);return this},async eq(field,id){assert.equal(field,'team_id');assert.equal(id,team);return {data:table.includes('mission1')?[rows[4]]:rows}}}},async rpc(name){assert.equal(name,'mission1_class_progress_members');return {data:[]}}};const s=await readExpedition(db,team,{mission2Open:true});assert.deepEqual(s.completedIds,[1,2]);assert.equal(calls.length,2);});
