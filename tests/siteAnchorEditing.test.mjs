import test from 'node:test';import assert from 'node:assert/strict';import {changeSiteGeometryVertex,updateConnectedSiteVertices,localSiteGeometryError} from '../src/lib/spatial/siteGeometryEditor.js';
test('inserting and removing path anchors preserves node alignment and original records',()=>{
 const rows=[{id:'a',localGeometry:{type:'LineString',coordinates:[[0,0],[10,0],[20,0]]},topologyNodeIds:['start','middle','end']}],before=JSON.stringify(rows);
 const added=changeSiteGeometryVertex(rows,'a',[0],'insert');assert.equal(added.error,null);assert.deepEqual(added.path,[1]);assert.deepEqual(added.features[0].localGeometry.coordinates,[[0,0],[5,0],[10,0],[20,0]]);assert.deepEqual(added.features[0].topologyNodeIds,['start',null,'middle','end']);
 const removed=changeSiteGeometryVertex(added.features,'a',[1],'remove');assert.deepEqual(removed.features,rows);assert.equal(JSON.stringify(rows),before);
});
test('shared junction removal is rejected but movement still propagates after insertion',()=>{
 const rows=[{id:'a',localGeometry:{type:'LineString',coordinates:[[0,0],[5,0],[10,0]]},topologyNodeIds:[null,null,'join']},{id:'b',localGeometry:{type:'LineString',coordinates:[[10,0],[20,0]]},topologyNodeIds:['join',null]}];
 assert.match(changeSiteGeometryVertex(rows,'a',[2],'remove').error,/joins another path/);
 const added=changeSiteGeometryVertex(rows,'a',[0],'insert').features,moved=updateConnectedSiteVertices(added,'a',[3],[12,3]);assert.deepEqual(moved[1].localGeometry.coordinates[0],[12,3]);
});
test('area anchors retain closure and minimum counts, including holes',()=>{
 const rows=[{id:'area',localGeometry:{type:'Polygon',coordinates:[[[0,0],[20,0],[20,20],[0,20],[0,0]],[[5,5],[5,10],[10,10],[10,5],[5,5]]]}}];
 const added=changeSiteGeometryVertex(rows,'area',[1,3],'insert');assert.equal(added.error,null);assert.equal(localSiteGeometryError(added.features[0].localGeometry),null);assert.deepEqual(added.features[0].localGeometry.coordinates[1].at(-1),[5,5]);
 const removed=changeSiteGeometryVertex(rows,'area',[1,0],'remove');assert.equal(localSiteGeometryError(removed.features[0].localGeometry),null);assert.match(changeSiteGeometryVertex(removed.features,'area',[1,0],'remove').error,/three/);
 assert.match(changeSiteGeometryVertex([{id:'x',localGeometry:{type:'LineString',coordinates:[[0,0],[1,1]]}}],'x',[0],'remove').error,/two/);
});
