import assert from 'node:assert/strict';
import test from 'node:test';
import {bedFillPositions} from '../src/lib/garden/bedFill.js';

const bed = Object.freeze({width:96, height:48, safeMargin:6, crowding:1});
test('fill previews keep spacing margins and leave their inputs untouched', () => {
  const plant = Object.freeze({spacing:30, matureDiameter:30});
  const positions = bedFillPositions(bed, plant);
  assert.deepEqual(positions, [{x:21,y:21},{x:51,y:21}]);
  for (const {x,y} of positions) {
    assert.ok(x >= 21 && x <= 75);
    assert.ok(y >= 21 && y <= 27);
  }
});
test('oversized plants and unusable dimensions produce no destructive replacement', () => {
  assert.deepEqual(bedFillPositions(bed,{spacing:360,matureDiameter:360}),[]);
  assert.deepEqual(bedFillPositions(bed,{spacing:0,matureDiameter:0}),[]);
  assert.deepEqual(bedFillPositions({...bed,width:NaN},{spacing:18,matureDiameter:18}),[]);
});
test('dense fills have a bounded number of placements', () => {
  assert.equal(bedFillPositions({...bed,width:10000,height:10000},{spacing:2,matureDiameter:2}).length,160);
});
