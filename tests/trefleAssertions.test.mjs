import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {trefleAssertions, eligibleTraitAssertions} from '../src/lib/plants/trefleAssertions.js';
const species = {data: {id: 42, scientific_name: 'Synthetic test species', rank: 'species', sources: [{name: 'example', id: 'x', licence: 'CC0-1.0', url: 'https://example.org/x?token=secret'}], growth: {light: 9}}};
const options = {plantId: 'synthetic-only', retrievedAt: '2026-09-25T00:00:00Z'};
const fact = {id: 1, attribute_name: 'light', source: 'example', source_record_id: 'x', value: '9', status: 'active', evidence_type: 'reported'};

test('Trefle claims retain disagreements, source states and ecological semantics', () => {
  const result = trefleAssertions(species, {data: [fact, {...fact, id: 2, source: 'other', value: '4'}, {...fact, id: 3, status: 'rejected'}]}, options);
  assert.equal(result.assertions.length, 3);
  assert.equal(result.assertions[0].trait, 'observed_habitat_light');
  assert.equal(result.assertions[0].basis, 'ecological_indicator');
  assert.equal(result.assertions[0].source_url, 'https://example.org/x');
  assert.equal(result.assertions[0].license, 'CC0-1.0');
  assert.equal(result.assertions[1].license, null);
  assert.equal(result.assertions[2].source_status, 'rejected');
  assert.equal(eligibleTraitAssertions(result.assertions, {plantId: options.plantId, trait: 'observed_habitat_light', basis: 'ecological_indicator'}).length, 0);
});

test('empty facts never manufacture provenance from flattened species data; zero is retained', () => {
  assert.deepEqual(trefleAssertions(species, {data: []}, options).assertions, []);
  const [a] = trefleAssertions(species, {data: [{...fact, attribute_name: 'soil_salinity', value: 0}]}, options).assertions;
  assert.equal(a.value, 0);
  assert.equal(a.basis, 'ecological_indicator');
  assert.throws(() => trefleAssertions(species, {data: [fact, fact]}, options), /duplicate/);
});

test('maturity basis stays unspecified and selection cannot mix cultivars, places or provider status', () => {
  const [a] = trefleAssertions(species, {data: [{...fact, attribute_name: 'days_to_harvest', value: '75'}]}, options).assertions;
  assert.equal(a.basis, 'planting_to_harvest_unspecified');
  assert.equal(a.start_stage, null);
  const approved = {...a, review_status: 'approved', publication_status: 'approved'};
  const query = {plantId: options.plantId, trait: a.trait, basis: a.basis};
  assert.equal(eligibleTraitAssertions([approved, {...approved, cultivar_id: 'cultivar'}, {...approved, geography: 'Massachusetts'}, {...approved, source_status: 'superseded'}], query).length, 1);
  assert.equal(eligibleTraitAssertions([approved], {...query, basis: 'transplant_to_first_harvest'}).length, 0);
});

test('offline importer archives unchanged exports and digests; refuses overwrites and credentials', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'veggie-trefle-test-'));
  try {
    const cleanSpecies = {...species, data: {...species.data, sources: []}};
    const raw = JSON.stringify(cleanSpecies);
    fs.writeFileSync(path.join(cwd, 'species.json'), raw);
    fs.writeFileSync(path.join(cwd, 'facts.json'), JSON.stringify({data: [fact]}));
    const script = fileURLToPath(new URL('../scripts/import-trefle-assertions.mjs', import.meta.url));
    const run = output => spawnSync(process.execPath, [script, 'species.json', 'facts.json', options.plantId, options.retrievedAt, output], {cwd, encoding: 'utf8'});
    assert.equal(run('data/raw/trefle/first').status, 0);
    const archive = path.join(cwd, 'data/raw/trefle/first');
    assert.equal(fs.readFileSync(path.join(archive, 'species.json'), 'utf8'), raw);
    const manifest = JSON.parse(fs.readFileSync(path.join(archive, 'manifest.json')));
    assert.equal(manifest.files[0].sha256, createHash('sha256').update(raw).digest('hex'));
    assert.notEqual(run('data/raw/trefle/first').status, 0);
    assert.notEqual(run('src/data/unsafe').status, 0);
    fs.writeFileSync(path.join(cwd, 'species.json'), JSON.stringify(species));
    assert.notEqual(run('data/raw/trefle/token-bearing').status, 0);
    assert.equal(fs.existsSync(path.join(cwd, 'data/raw/trefle/token-bearing')), false);
  } finally { fs.rmSync(cwd, {recursive: true, force: true}); }
});
