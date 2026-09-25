import test from 'node:test';
import assert from 'node:assert/strict';
import {persistPlannerState} from '../src/lib/garden/plannerStorage.js';

test('saved geometry and named layouts survive serialization', () => {
  const payload = {beds: [{id: 'bed-1', x: 18, y: 27}], layouts: [{name: 'Spring'}]};
  const records = new Map();
  assert.equal(persistPlannerState('planner', payload, () => ({setItem: (key, value) => records.set(key, value)})), true);
  assert.deepEqual(JSON.parse(records.get('planner')), payload);
});

test('quota failure preserves the last saved record and current edits, and a later retry succeeds', () => {
  let stored = '{"beds":[]}';
  const edits = {beds: [{id: 'new-bed'}]};
  const before = structuredClone(edits);
  assert.equal(persistPlannerState('planner', edits, () => ({setItem() { throw new DOMException('Full', 'QuotaExceededError'); }})), false);
  assert.equal(stored, '{"beds":[]}');
  assert.deepEqual(edits, before);
  assert.equal(persistPlannerState('planner', edits, () => ({setItem(key, value) { stored = value; }})), true);
  assert.deepEqual(JSON.parse(stored), edits);
});

test('blocked storage getter, missing storage and invalid serialization never report a save', () => {
  assert.equal(persistPlannerState('planner', {}, () => { throw new DOMException('Blocked', 'SecurityError'); }), false);
  assert.equal(persistPlannerState('planner', {}, () => undefined), false);
  const cycle = {}; cycle.self = cycle;
  assert.equal(persistPlannerState('planner', cycle, () => ({setItem() { assert.fail('must not write invalid payload'); }})), false);
});
