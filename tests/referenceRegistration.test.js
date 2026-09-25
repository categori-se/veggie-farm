import assert from "node:assert/strict";
import test from "node:test";
import {registerGardenReference} from "../src/lib/spatial/referenceRegistration.js";
import {xyzRasterPixelToLonLat, localPointToXyzRasterPixel} from "../src/lib/spatial/gisAlignment.js";
const raster = {zoom:20,tileOrigin:[310677,388066],tileSize:256,pixelSize:[2304,3072]};
const [lon,lat] = xyzRasterPixelToLonLat([500,500],raster);
const property = {localOrigin:{lon,lat}};
const observations = {controls:[[0,0],[200,0],[0,200],[200,200]].map((sourcePixel,i)=>({
  id:`landmark-${i}`,sourcePixel,targetPixel:localPointToXyzRasterPixel([100+2*sourcePixel[0]-sourcePixel[1],100+sourcePixel[0]+2*sourcePixel[1]],raster,property),role:i===3?"check":"fit"
}))};

test("reference registration recovers rotation/scale and checks an unused landmark",()=>{
  const result=registerGardenReference(observations,raster,property);
  assert.ok(result.transform.rmseFeet<0.01);
  assert.ok(result.checkMaxErrorFeet<0.01);
  assert.ok(Math.abs(result.transform.rotationDegrees-26.565)<0.01);
  for(const c of result.landmarks) assert.ok(Math.hypot(c.fittedPixel[0]-c.targetPixel[0],c.fittedPixel[1]-c.targetPixel[1])<0.01);
});

test("a displaced withheld landmark changes check error, never the fitted transform",()=>{
  const changed=structuredClone(observations);changed.controls[3].targetPixel[0]+=30;
  const result=registerGardenReference(changed,raster,property);
  assert.ok(result.checkMaxErrorFeet>5);
  assert.deepEqual(result.transform,registerGardenReference(observations,raster,property).transform);
  result.landmarks[0].sourcePixel[0]=999;
  assert.equal(changed.controls[0].sourcePixel[0],0);
});

test("registration rejects missing checks, insufficient/collinear anchors and invalid pixels",()=>{
  assert.throws(()=>registerGardenReference({controls:observations.controls.slice(0,3)},raster,property),/separate check/);
  assert.throws(()=>registerGardenReference({controls:observations.controls.slice(1)},raster,property),/three fit/);
  const collinear=structuredClone(observations);collinear.controls[2].sourcePixel=[400,0];
  assert.throws(()=>registerGardenReference(collinear,raster,property),/non-collinear/);
  const invalid=structuredClone(observations);invalid.controls[0].targetPixel=[NaN,0];
  assert.throws(()=>registerGardenReference(invalid,raster,property),/finite/);
});
