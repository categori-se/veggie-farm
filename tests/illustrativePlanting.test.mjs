import test from 'node:test';
import assert from 'node:assert/strict';
import {illustrativePlanting} from '../src/lib/spatial/illustrativePlanting.js';
const area={id:'border',type:'border',localGeometry:{type:'Polygon',coordinates:[[[0,0],[1000,0],[1000,1000],[0,1000],[0,0]],[[400,400],[600,400],[600,600],[400,600],[400,400]]]}};
const viewport={x:0,y:0,width:1000,height:1000};
test('illustrative planting is bounded, repeatable and preserves paths and source data',()=>{
 const before=structuredClone(area),path={localGeometry:{type:'LineString',coordinates:[[200,0],[200,1000]]}};
 const result=illustrativePlanting([area],[path],viewport,30);
 assert.ok(result.length>0&&result.length<=30);assert.deepEqual(result,illustrativePlanting([area],[path],viewport,30));assert.deepEqual(area,before);
 for(const p of result){assert.equal(p.basis,'illustrative-reconstruction');assert.ok(Math.abs(p.x-200)>=p.radius+36);assert.ok(!(p.x>400&&p.x<600&&p.y>400&&p.y<600));}
 assert.deepEqual(illustrativePlanting([{...area,type:'lawn'}],[],viewport),[]);
});
