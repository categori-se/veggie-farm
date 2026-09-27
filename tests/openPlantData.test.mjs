import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {openPlantRecord,openPlantExplorer,plantCoverage,commonFieldEvidence} from '../src/lib/plants/openPlantData.js';
import {catalogIdentity} from '../src/lib/plants/catalogIdentity.js';
import {readOpenPlants} from '../scripts/lib/open-plant-input.mjs';
const manifest=JSON.parse(fs.readFileSync(new URL('../data/reference/openfarm/manifest.json',import.meta.url)));
const fixture={slug:'example-crop',name:'Example crop',sun:'Add this information',rowSpacingCm:60,spreadCm:35,heightCm:0,
 source:{license:'CC0-1.0',waybackUrl:'https://web.archive.org/web/20230101/https://openfarm.cc/en/crops/example-crop',captured:'20230101'}};
test('open records retain source identity, terms and archive while distinguishing missing measurements',()=>{
 const before=structuredClone(fixture),p=openPlantRecord(fixture,manifest);
 assert.deepEqual(fixture,before);assert.equal(catalogIdentity(p.id),p.id);assert.equal(p.rowSpacingCm,60);
 assert.equal(p.spacingInches.min,null);assert.equal(p.morphology.spreadCm.reported,35);assert.equal(p.morphology.heightCm.reported,null);
 assert.equal(p.sun,null);assert.equal(p.scientificName,null);assert.equal(p.daysToMaturity.min,null);
 assert.equal(p.fieldEvidence.rowSpacingCm.classification,'direct_source');assert.equal(p.fieldEvidence.sun.classification,'unknown');
 assert.equal(p.rights.license,'CC0-1.0');assert.equal(p.sourceUrl,fixture.source.waybackUrl);
 const browser=openPlantExplorer(p);assert.equal(browser.spacingMin,null);assert.equal(browser.directSow,null);assert.match(browser.additionalFacts[0].text,/not plant spacing/);
});
test('changed license and non-archive destinations fail rather than acquiring implied permission',()=>{
 for(const source of [{...fixture.source,license:null},{...fixture.source,waybackUrl:'https://example.org/plant'},{...fixture.source,waybackUrl:'javascript:alert(1)'}])assert.throws(()=>openPlantRecord({...fixture,source},manifest));
 assert.throws(()=>openPlantRecord({...fixture,slug:'../other'},manifest));
});
test('all 340 pinned input records and their license text validate offline',async()=>{
 const {plants}=await readOpenPlants();assert.equal(plants.length,340);assert.equal(new Set(plants.map(p=>p.id)).size,340);
 assert.ok(plants.every(p=>p.fieldEvidence.scientificName.sourceUrl===p.sourceUrl&&p.rights.license==='CC0-1.0'));
 assert.ok(plants.every(p=>p.spacingInches.min===null&&p.daysToMaturity.min===null));
 assert.ok(plants.every(p=>catalogIdentity(p.id)===p.id));
});
test('contributed field evidence keeps citations unverified and visual assumptions distinct',()=>{
 const evidence=commonFieldEvidence({id:'plant:community:example',sourceIds:['source:example'],sun:{labels:['full sun']},studio:{canonicalArchetype:'tree'}});
 assert.equal(evidence['sunlightReference.labels'].classification,'direct_source');
 assert.match(evidence['sunlightReference.labels'].citationVerification,/not independently checked/);
 assert.equal(evidence['studio.canonicalArchetype'].classification,'visual_inference');
 assert.equal(evidence.germinationDays.classification,'unknown');
});
test('coverage counts numeric evidence without promoting free text or double counting species',()=>{
 const rows=[openPlantRecord(fixture,manifest),{id:'plant:community:example',sun:'full sun',spacingInches:{min:10,max:12},daysToMaturity:{text:'early'}}];
 const coverage=plantCoverage(rows);assert.equal(coverage.records,2);assert.equal(coverage.fields.plantSpacing.present,1);assert.equal(coverage.fields.maturity.unknown,2);assert.equal(coverage.fields.structuredSun.present,0);
});
