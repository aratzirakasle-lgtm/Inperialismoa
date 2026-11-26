import test from 'node:test';
import assert from 'node:assert/strict';
import {POINTS,PAIRS,createSketch,selectTool,markPoint,clearArrow,ready,seal,complete,scores} from '../js/m3-map-sketch.mjs';
function classify(s){for(const p of POINTS){selectTool(s,p.zone);markPoint(s,p.id);}}
function connect(s,pair,reverse=false){const p=POINTS.filter(p=>p.pair===pair);const a=p.find(p=>p.zone==='coast'),b=p.find(p=>p.zone==='interior');selectTool(s,'arrow');markPoint(s,reverse?b.id:a.id);markPoint(s,reverse?a.id:b.id);}
test('map workshop starts blank and rejects incomplete submissions',()=>{const s=createSketch();assert.equal(ready(s),false);assert.equal(seal(s),false);assert.equal(complete(s),false);});
test('all six labels and three directed pairs required, not answer order',()=>{const s=createSketch();classify(s);PAIRS.forEach(p=>connect(s,p));assert.deepEqual(scores(s),{zones:6,arrows:3});assert.equal(ready(s),true);assert.equal(complete(s),false);assert.equal(seal(s),true);assert.equal(complete(s),true);});
test('wrong direction and wrong classification can be revised',()=>{const s=createSketch();classify(s);connect(s,'A',true);connect(s,'B');connect(s,'C');selectTool(s,'interior');markPoint(s,'A1');assert.equal(seal(s),false);assert.deepEqual(scores(s),{zones:5,arrows:2});selectTool(s,'coast');markPoint(s,'A1');connect(s,'A');assert.equal(seal(s),true);clearArrow(s,'A');assert.equal(complete(s),false);});
test('unrelated pairs cannot create an arrow',()=>{const s=createSketch();classify(s);selectTool(s,'arrow');markPoint(s,'A1');markPoint(s,'B1');assert.equal(Object.keys(s.arrows).length,0);assert.equal(s.origin,'A1');});
