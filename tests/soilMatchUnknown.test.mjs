import test from 'node:test';import assert from 'node:assert/strict';
import {soilMatch} from '../src/lib/recommendations/soilMatch.js';
test('missing texture never counts as a preferred-texture match',()=>{
 const plant={name:'Carrot'},preference={preferredTexture:['loam'],toleratedTexture:['sand']};
 for(const soilTexture of [undefined,null,'','   ']){const result=soilMatch(plant,preference,{soilTexture});assert.equal(result.label,'unknown');assert.equal(result.score,.5);}
 assert.equal(soilMatch(plant,preference,{soilTexture:'loam'}).label,'good');
 assert.equal(soilMatch(plant,preference,{soilTexture:'clay'}).label,'risky');
});
