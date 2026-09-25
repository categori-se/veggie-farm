import test from 'node:test';
import assert from 'node:assert/strict';
import {growingText,publicPlant} from '../scripts/lib/catalog-editorial.mjs';

test('public descriptions retain growing facts while removing delivery sentences',()=>{
 assert.equal(growingText('Sweet fruit ripens in June. Shipped as 25 bareroot crowns. Plant in full sun.'),'Sweet fruit ripens in June. Plant in full sun.');
 assert.equal(growingText('Keep soil moist.We are unable to ship to ME.'),'Keep soil moist.');
 assert.equal(growingText('Shipping Note: January through May. No minimum quantity required.'),null);
 assert.equal(growingText('Our trees are trimmed before shipping. Two year trees are feathered.'),null);
 assert.equal(growingText('Plant dormant bare-root trees in well-drained soil.'),'Plant dormant bare-root trees in well-drained soil.');
});
test('commercial facts and sales options do not become plant characteristics',()=>{
 const source={description:'Enjoy 15% off with this bundle!',careNotes:['Sold in pots.','Ripens in late summer.'],additionalFacts:[{text:'Shape when Shipped: Small bush'},{text:'Pollination: Self fertile'}]};
 const result=publicPlant(source);
 assert.equal(result.description,null);assert.deepEqual(result.careNotes,['Ripens in late summer.']);
 assert.deepEqual(result.additionalFacts,[{text:'Pollination: Self fertile'}]);
 assert.equal(source.additionalFacts.length,2,'source evidence remains unchanged');
});
