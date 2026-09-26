import test from 'node:test';
import assert from 'node:assert/strict';
import {REGIONAL_SOURCES,regionalPoint,lidarCatalogRequest,lookupLidarCatalog} from '../src/lib/spatial/regionalSources.js';
import {soilQueries} from '../src/lib/environment/mappedSoil.js';
import {terrainGridRequest} from '../src/lib/environment/terrainGrid.js';
test('nine explicit regions accept their center; reject malformed and out-of-region input',()=>{
 assert.equal(REGIONAL_SOURCES.length,9);for(const r of REGIONAL_SOURCES){const [w,s,e,n]=r.bounds;assert.equal(regionalPoint(r.id,(w+e)/2,(s+n)/2).length,2);assert.throws(()=>regionalPoint(r.id,0,0));for(const bad of ['',null,true,NaN,'42);DROP TABLE'])assert.throws(()=>regionalPoint(r.id,w,bad));}
});
test('regional soils are explicit; MA terrain never silently expands',()=>{
 assert.match(soilQueries(-89.4,43.1,'WI')[0],/point\(-89.4 43.1\)/);assert.throws(()=>soilQueries(-89.4,43.1));assert.throws(()=>terrainGridRequest(-89.4,43.1));
});
test('LiDAR discovery bounds requests and product types',()=>{
 const r=lidarCatalogRequest('VT',-72.6,44.2);const u=new URL(r.url);assert.equal(u.searchParams.get('max'),'20');assert.equal(r.bbox.length,4);assert.throws(()=>lidarCatalogRequest('VT',-72.6,44.2,{radiusMeters:10000}));assert.throws(()=>lidarCatalogRequest('VT',-72.6,44.2,{kind:'other'}));
});
test('catalog results retain unknowns and suppress untrusted URLs',async()=>{
 const result=await lookupLidarCatalog('CT',-72.7,41.7,{fetchImpl:async(u,o)=>{assert.equal(o.credentials,'omit');return {ok:true,text:async()=>JSON.stringify({total:22,items:[{title:'<b>point cloud</b>',downloadURL:'javascript:alert(1)'},{title:'source',downloadURL:'https://prd-tnm.s3.amazonaws.com/tile.laz',sizeInBytes:100}]})};}});
 assert.equal(result.truncated,true);assert.equal(result.items[0].downloadUrl,null);assert.equal(result.items[0].sizeBytes,null);assert.equal(result.items[1].sizeBytes,100);
});
test('catalog errors do not become empty coverage',async()=>{
 await assert.rejects(lookupLidarCatalog('ME',-69,45,{fetchImpl:async()=>({ok:true,text:async()=>JSON.stringify({error:'unavailable'})})}));
});
