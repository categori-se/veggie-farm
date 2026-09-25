import test from 'node:test';
import assert from 'node:assert/strict';
import legacyGardens from '../src/data/migrations/publicGardenStarters.js';
import {migratePublicGardenSite} from '../src/lib/spatial/publicGardenMigration.js';

for (const [id, legacy] of Object.entries(legacyGardens)) {
  const current = {beds: [], structures: [{id: 'reviewed-path', name: 'Observed walk'}], vegetation: []};
  const revision = legacy.starterLayoutRevision + 1;
  const viewport = {x: 100, y: 200, width: 300, height: 400};
  test(`${id}: retires untouched schematic features without mutating source`, () => {
    const workspace = structuredClone(legacy);
    const before = structuredClone(workspace);
    const result = migratePublicGardenSite(workspace, legacy, current, revision, viewport);
    assert.deepEqual(result.beds, []);
    assert.deepEqual(result.placements, []);
    assert.deepEqual(result.structures, current.structures);
    assert.deepEqual(workspace, before);
    assert.equal(migratePublicGardenSite(result, legacy, current, revision, viewport), result);
  });
  test(`${id}: preserves edited features, occupied beds, custom work and history`, () => {
    const workspace = structuredClone(legacy);
    workspace.structures[0].notes = 'My site observation';
    workspace.structures[0].x += 100;
    workspace.beds[0].name = 'My renamed bed';
    const occupied = workspace.beds[1];
    workspace.placements.push({id: 'owner-plant', bedId: occupied.id, plantId: 'tomato', x: 12, y: 24});
    workspace.beds.push({id: 'custom-bed', name: 'My bed', x: 0, y: 0});
    workspace.activeBedId = occupied.id;
    workspace.history = [{name: 'Earlier work'}];
    const before = structuredClone(workspace);
    const result = migratePublicGardenSite(workspace, legacy, current, revision, viewport);
    assert.deepEqual(result.structures.find(f => f.id === workspace.structures[0].id), workspace.structures[0]);
    for (const bed of [workspace.beds[0], occupied, workspace.beds.at(-1)]) {
      assert.deepEqual(result.beds.find(f => f.id === bed.id), bed);
    }
    assert.ok(result.placements.some(p => p.id === 'owner-plant'));
    assert.equal(result.activeBedId, occupied.id);
    assert.deepEqual(result.history, workspace.history);
    assert.deepEqual(workspace, before);
  });
}

test('additive reconstruction preserves deleted/edited features, beds, history and camera', () => {
  const legacy=legacyGardens['naumkeag-garden-rooms'];
  const workspace={starterLayoutRevision:4,structures:[{id:'retained',notes:'Owner edit'},{id:'new-pool',notes:'Owner ID collision'}],
    beds:[{id:'planted-bed'}],placements:[{id:'crop',bedId:'planted-bed'}],vegetation:[{id:'tree'}],
    activeBedId:'planted-bed',parcelViewport:{x:12,y:34,width:56,height:78},history:[{name:'Earlier'}]};
  const current={beds:[],vegetation:[],structures:[{id:'retained',notes:'Original'},{id:'owner-deleted'},
    {id:'new-pool',notes:'Canonical pool'},{id:'new-path',localGeometry:{type:'LineString',coordinates:[[0,0],[2,2]]}}]};
  const steps=[{revision:5,structureIds:['new-pool','new-path']}];
  const before=structuredClone(workspace);
  const result=migratePublicGardenSite(workspace,legacy,current,5,{},steps);
  assert.deepEqual(result.structures.map(f=>f.id),['retained','new-pool','new-path']);
  assert.deepEqual(result.structures.slice(0,2),workspace.structures);
  for(const key of ['beds','placements','vegetation','activeBedId','parcelViewport','history'])assert.deepEqual(result[key],workspace[key]);
  assert.deepEqual(workspace,before);
  result.structures.at(-1).localGeometry.coordinates[0][0]=100;
  assert.equal(current.structures.at(-1).localGeometry.coordinates[0][0],0);
  result.structures=result.structures.filter(f=>f.id!=='new-path');
  assert.equal(migratePublicGardenSite(result,legacy,current,5,{},steps),result);
  const later=migratePublicGardenSite(result,legacy,{...current,structures:[...current.structures,{id:'later-tree'}]},6,{},[...steps,{revision:6,structureIds:['later-tree']}]);
  assert.deepEqual(later.structures.map(f=>f.id),['retained','new-pool','later-tree']);
});

test('additive tree observations preserve edits, collisions and deletions across revisions', () => {
  const legacy=legacyGardens['ashintully-terrace-garden'];
  const tree=id=>({id,localGeometry:{type:'Point',coordinates:[12,34]},crownWidthFeet:30});
  const workspace={starterLayoutRevision:3,structures:[{id:'owner-path'}],beds:[{id:'bed'}],placements:[{id:'crop',bedId:'bed'}],vegetation:[{...tree('north'),crownWidthFeet:22},{id:'owner-tree'}],parcelViewport:{x:2,y:4,width:100,height:200}};
  const before=structuredClone(workspace),current={structures:[{id:'deleted-path'}],vegetation:[tree('north'),tree('south')]};
  const steps=[{revision:4,vegetationIds:['north','south']}];
  const result=migratePublicGardenSite(workspace,legacy,current,4,{},steps);
  assert.deepEqual(workspace,before);
  assert.deepEqual(result.vegetation.slice(0,2),workspace.vegetation);
  assert.deepEqual(result.vegetation.map(f=>f.id),['north','owner-tree','south']);
  for(const key of ['structures','beds','placements','parcelViewport'])assert.deepEqual(result[key],workspace[key]);
  result.vegetation.at(-1).localGeometry.coordinates[0]=999;
  assert.equal(current.vegetation.at(-1).localGeometry.coordinates[0],12);
  result.vegetation=result.vegetation.filter(f=>f.id!=='south');
  assert.equal(migratePublicGardenSite(result,legacy,current,4,{},steps),result);
  const later=migratePublicGardenSite(result,legacy,{...current,vegetation:[...current.vegetation,tree('later')]},5,{},[...steps,{revision:5,vegetationIds:['later']}]);
  assert.deepEqual(later.vegetation.map(f=>f.id),['north','owner-tree','later']);
});
