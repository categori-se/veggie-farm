import test from 'node:test';
import assert from 'node:assert/strict';
import {solarPosition,easternPreviewInstant,structureShadowPolygons,sunlightShapes} from '../src/lib/spatial/solarPreview.js';
test('Eastern time follows the selected date, independently of browser timezone',()=>{
 assert.equal(easternPreviewInstant('2026-06-21',780).toISOString(),'2026-06-21T17:00:00.000Z');
 assert.equal(easternPreviewInstant('2026-12-21',780).toISOString(),'2026-12-21T18:00:00.000Z');
 assert.throws(()=>easternPreviewInstant('2026-02-30',780));assert.throws(()=>easternPreviewInstant('2026-11-01',90));
});
test('solar geometry follows hemispheres, day/night and seasonal noon elevations',()=>{
 const summer=solarPosition('2026-06-21T17:00:00Z',42.36,-71.07),winter=solarPosition('2026-12-21T17:00:00Z',42.36,-71.07);
 assert.ok(summer.solarAltitudeDegrees>70&&summer.solarAltitudeDegrees<72);
 assert.ok(winter.solarAltitudeDegrees>23&&winter.solarAltitudeDegrees<25);
 assert.ok(summer.solarAzimuthDegrees>180&&summer.solarAzimuthDegrees<200);
 assert.ok(solarPosition('2026-06-21T04:00:00Z',42.36,-71.07).solarAltitudeDegrees<0);
 assert.ok(solarPosition('2026-03-20T12:00:00Z',0,0).solarAltitudeDegrees>87);
 assert.throws(()=>solarPosition('invalid',42,-71));
});
test('flat 10-foot obstacle at 45 degree southern sun projects ten feet north',()=>{
 const f={x:0,y:0,width:24,height:24,heightEstimateFeet:10};
 const polygons=structureShadowPolygons(f,{solarAltitudeDegrees:45,solarAzimuthDegrees:180});
 assert.equal(polygons.length,6);assert.ok(Math.abs(polygons[1][0][1]+132)<1e-9);
 assert.deepEqual(structureShadowPolygons({...f,heightEstimateFeet:null},{solarAltitudeDegrees:45,solarAzimuthDegrees:180}),[]);
});
test('uses mapped polygon in world coordinates; skips lines and unknown heights',()=>{
 const f={heightEstimateFeet:10,localGeometry:{type:'Polygon',coordinates:[[[100,100],[120,100],[120,130],[100,100]]]}};
 const solar={solarAltitudeDegrees:45,solarAzimuthDegrees:90};const p=structureShadowPolygons(f,solar);
 assert.deepEqual(p[0],f.localGeometry.coordinates[0]);assert.ok(Math.abs(p[1][0][0]+20)<1e-9);
 assert.deepEqual(structureShadowPolygons({...f,localGeometry:{type:'LineString',coordinates:[[0,0],[10,0]]}},solar),[]);
 assert.equal(sunlightShapes({structures:[f],vegetation:[{x:0,y:0,heightEstimateFeet:null}]},solar).trees.length,0);
 assert.equal(sunlightShapes({structures:[f]},{...solar,solarAltitudeDegrees:4}).lowSun,true);
});
