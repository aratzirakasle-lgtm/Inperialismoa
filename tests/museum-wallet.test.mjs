import test from 'node:test';import assert from 'node:assert/strict';import {walletSummary,archiveMarkup} from '../js/museum-wallet.js';
test('La cartera distingue datos no verificados, usa solo el propio equipo y no infiere medallas',()=>{
 const summary=walletSummary({1:[{team_id:'other',mission_completed:true,exercise_1:true},{team_id:'mine',team_name:'<Atlas>',exercise_1:true,mission_completed:false}]},'mine');
 assert.deepEqual(summary,[{steps:[1],completed:false,teamName:'<Atlas>'},null]);assert.equal((archiveMarkup(summary).match(/mw-sealed/g)||[]).length,1);assert.match(archiveMarkup(summary),/Egiaztatu gabe/);
});
