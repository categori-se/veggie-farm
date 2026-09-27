import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeStudioMode, studioModeTransition} from '../src/lib/garden/studioMode.js';

test('mode transitions cancel drawing without changing garden data or camera', () => {
  const state = {activeTool:'structures',drawMode:'polygon',draftBedPoints:[[1,2]],
    beds:[{id:'b',x:13}],placements:[{id:'p',plannedUntil:'2027-09-01'}],
    walkCamera:{x:40,y:50},previewDate:'2027-06-01',studioMode:'advanced'};
  const before=structuredClone(state);
  const next={...state,...studioModeTransition(state,'simple')};
  assert.deepEqual(state,before);
  assert.equal(next.activeTool,'beds');
  assert.equal(next.drawMode,null);
  assert.deepEqual(next.draftBedPoints,[]);
  assert.equal(next.inspectorOpen,false);
  assert.equal(next.toolDrawerOpen,false);
  for(const key of ['beds','placements','walkCamera','previewDate']) assert.deepEqual(next[key],before[key]);
  const advanced={...next,...studioModeTransition(next,'advanced')};
  assert.equal(advanced.studioMode,'advanced');
  assert.deepEqual(advanced.beds,before.beds);
});

test('legacy preferences default to simple; normal planting tools remain selected',()=>{
  for(const value of [undefined,null,'unexpected'])assert.equal(normalizeStudioMode(value),'simple');
  for(const activeTool of ['beds','plants','flowers','select'])assert.equal(studioModeTransition({activeTool},'simple').activeTool,activeTool);
});
