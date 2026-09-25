import test from 'node:test';
import assert from 'node:assert/strict';
import {rotationRisk} from '../src/lib/recommendations/rotationRisk.js';
import {recommendCrops} from '../src/lib/recommendations/recommendCrops.js';
const crop = {id:'tomato',name:'Tomato',family:'Solanaceae'};
const families = [{family:'Solanaceae',label:'Nightshades',avoidFollowingSameFamily:true,commonRisks:['reviewed risk']}];

test('missing, empty and partial unreviewed crop histories remain unknown',()=>{
  for(const profile of [{},{previousCropFamilies:[]},{previousCropFamilies:null},{previousCropFamilies:'Solanaceae'},{previousCropFamilies:['Brassicaceae']}]) {
    const result=rotationRisk(crop,families,profile);
    assert.equal(result.label,'unknown');
    assert.match(result.reason,/not been reviewed/);
  }
});
test('a recorded same-family planting remains a warning even with incomplete history',()=>{
  for(const reviewed of [false,true]) {
    const result=rotationRisk(crop,families,{previousCropFamilies:['Solanaceae'],rotationHistoryReviewed:reviewed});
    assert.equal(result.label,'risk');
    assert.ok(result.score<rotationRisk(crop,families).score);
  }
});
test('a favorable rotation comparison requires explicit history review and reviewed family rules',()=>{
  const profile={previousCropFamilies:['Brassicaceae'],rotationHistoryReviewed:true};
  assert.equal(rotationRisk(crop,families,profile).label,'good');
  assert.match(rotationRisk(crop,families,profile).reason,/does not rule out/);
  assert.equal(rotationRisk({family:'Unreviewed'},families,profile).label,'unknown');
});
test('recommendations expose missing-history reasoning and do not award its former bonus',()=>{
  const unknown=recommendCrops([crop],{rotationFamilies:families},{previousCropFamilies:[]})[0];
  const reviewed=recommendCrops([crop],{rotationFamilies:families},{previousCropFamilies:[],rotationHistoryReviewed:true})[0];
  assert.ok(unknown.reasons.some(reason=>reason.includes('rotation fit is unknown')));
  assert.ok(unknown.score<reviewed.score);
  assert.ok(Number.isFinite(unknown.score));
});
