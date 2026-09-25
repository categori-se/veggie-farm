import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePlannerBackup, PLANNER_BACKUP_FORMAT} from '../src/lib/garden/plannerBackup.js';
const workspace = () => ({property: {id: 'garden'}, beds: [{id: 'bed', x: 12, y: 24}], structures: [], vegetation: [], placements: [{id: 'planting', bedId: 'bed', x: 3, y: 5}, {id: 'observation', bedId: null, absoluteLocalPoint: [30, 40]}]});
const backup = () => ({...workspace(), activeParcelId: 'garden', parcels: [{id: 'garden', ...workspace()}], plants: [{id: 'tomato'}], layouts: [{id: 'spring', name: 'Spring', workspace: {id: 'garden', ...workspace()}}]});
test('legacy full export and versioned backup preserve gardens, positions, observations and saved versions', () => {
  for (const data of [backup(), {...backup(), backupFormat: PLANNER_BACKUP_FORMAT, backupVersion: 1}]) assert.deepEqual(parsePlannerBackup(JSON.stringify(data)), data);
});
test('rejects unrelated spatial files, truncated backups and unsupported future versions', () => {
  for (const data of [{type: 'FeatureCollection', features: []}, {...backup(), parcels: []}, {...backup(), backupFormat: PLANNER_BACKUP_FORMAT, backupVersion: 2}]) assert.throws(() => parsePlannerBackup(JSON.stringify(data)));
  assert.throws(() => parsePlannerBackup('{'));
});
test('rejects corrupt nested saved versions without mutating the source', () => {
  const data = backup();
  data.layouts[0].workspace.placements[0].bedId = 'missing';
  const text = JSON.stringify(data);
  assert.throws(() => parsePlannerBackup(text), /missing bed/);
  assert.equal(JSON.stringify(data), text);
  const duplicate = backup(); duplicate.parcels.push(duplicate.parcels[0]);
  assert.throws(() => parsePlannerBackup(JSON.stringify(duplicate)), /Duplicate/);
  assert.throws(() => parsePlannerBackup('{"__proto__": {}}'), /unsupported property/);
});
