import test from 'node:test';
import assert from 'node:assert/strict';
import {getGardenSpatialDataset,getCatalogItem} from '../src/lib/data/publicCatalogApi.js';
import {gardenSpatialDatasetToWorkspace} from '../src/lib/spatial/gardenFeatureCollections.js';
import {deriveTreeShadowVector,derivedTreeCanopyEllipse} from '../src/lib/spatial/treeObservation.js';

test('Ashintully crowns stay architectural Points with observed axes and unknown species/height', () => {
  const id='ashintully-terrace-garden',dataset=getGardenSpatialDataset(id);
  const garden=getCatalogItem('gardens',id);
  const property={localOrigin:garden.properties.mapping.layoutAnchor.coordinates};
  const workspace=gardenSpatialDatasetToWorkspace(dataset,property);
  assert.equal(workspace.structures.length,10);
  assert.equal(workspace.beds.length,0);
  assert.equal(workspace.placements.length,0);
  const trees=workspace.vegetation;
  assert.equal(trees.length,2);
  for(const tree of trees){
    assert.equal(tree.geometryRepresentation,'point');
    assert.equal(tree.localGeometry.type,'Point');
    assert.equal(tree.plantId,null);
    assert.equal(tree.heightEstimateFeet,null);
    assert.equal(tree.observationType,'aerial-crown');
    assert.equal(tree.crownConfidence,'low');
    assert.match(tree.notes,/trunk not resolved/i);
    assert.ok(tree.crownWidthFeet>50&&tree.crownWidthFeet<70);
    const ring=derivedTreeCanopyEllipse(tree);
    assert.equal(ring.rx,tree.crownWidthFeet*6);
    assert.equal(ring.ry,tree.crownDepthFeet*6);
    assert.equal(deriveTreeShadowVector(tree,{solarAltitudeDegrees:45,solarAzimuthDegrees:180}),null);
  }
});
