import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {explainGarden} from '../examples/building/walkthrough.mjs';
const evidence = JSON.parse(await fs.readFile(new URL('../src/data/horticultural-evidence.json', import.meta.url), 'utf8'));
const backup = await fs.readFile(new URL('../data/demo/community-garden.json', import.meta.url), 'utf8');
test('walkthrough preserves attribution, separates synthetic dimensions and round-trips garden records', () => {
  const before = structuredClone(evidence), result = explainGarden(evidence, backup);
  assert.ok(result.evidence.length > 0);
  for (const fact of result.evidence) {
    const original = evidence.evidence.find(row => row.id === fact.id);
    assert.equal(fact.sourceUrl, original.sourceUrl);
    assert.equal(fact.sourceId, original.sourceId);
    assert.deepEqual(fact.geographicScope, original.geographicScope);
    assert.equal(fact.reviewStatus, original.reviewStatus);
  }
  assert.match(result.illustration.basis, /Synthetic/);
  assert.ok(result.illustration.organCount > 0);
  const garden = JSON.parse(backup);
  assert.equal(result.backup.beds, garden.beds.length);
  assert.equal(result.backup.placements, garden.placements.length);
  assert.deepEqual(evidence, before);
  assert.deepEqual(explainGarden(evidence, backup), result);
});
test('missing evidence stays empty and invalid dimensions are not invented', () => {
  assert.deepEqual(explainGarden({evidence: []}, backup).evidence, []);
  const garden = JSON.parse(backup);
  delete garden.plants.find(row => row.id === 'demo-tomato').height;
  assert.throws(() => explainGarden(evidence, JSON.stringify(garden)), /valid visual dimensions/);
  assert.throws(() => explainGarden(evidence, '{}'), /garden|property/i);
});
