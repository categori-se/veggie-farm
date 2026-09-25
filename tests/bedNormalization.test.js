import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Exercise the actual planner normalizers without loading its browser renderer.
const source = fs.readFileSync(new URL('../src/components/gardenPlanner.js', import.meta.url), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(`function ${start}(`), source.indexOf(`function ${end}(`));
function fixture() {
  const defaults = [{id:'first',name:'Bundled bed',width:48,height:96,notes:'Bundled notes',
    polygon:[[0,0],[48,0],[48,96]],provenance:{source:{id:'retained'}}},
    {id:'second',name:'Second bed',width:60,height:120}];
  const context = vm.createContext({DEFAULT_BEDS:defaults,DEFAULT_ACTIVE_BED_ID:'first',
    structuredCloneCompat:structuredClone,clamp:(n,min,max)=>Math.max(min,Math.min(max,n)),uniqueStaticId:()=> 'generated'});
  vm.runInContext(extract('normalizeBeds','normalizeStructures')+extract('normalizedFeatureProvenance','featureSourceReferences'),context);
  return {defaults,normalize:(...args)=>structuredClone(context.normalizeBeds(...args))};
}

test('bed normalization retains legacy defaults and repeated-ID merge behavior', () => {
  const {normalize}=fixture();
  const result=normalize([{id:'first',width:1,notes:'Owner notes'},{id:'first',height:72},null,{}]);
  assert.deepEqual(result.map(b=>b.id),['first','second']);
  assert.equal(result[0].width,24);
  assert.equal(result[0].height,72);
  assert.equal(result[0].name,'Bundled bed');
  assert.equal(result[0].notes,'Owner notes');
  assert.equal(result[0].provenance.source.id,'retained');
  const legacy=normalize(undefined,{id:'legacy-id',name:'Legacy edit',width:80});
  assert.equal(legacy[0].id,'legacy-id');
  assert.equal(legacy[0].width,80);
  assert.equal(legacy[1].id,'second');
});

test('empty workspaces do not acquire defaults and supplied geometry remains detached', () => {
  const {defaults,normalize}=fixture();
  assert.deepEqual(normalize([],null,{includeDefaults:false}),[]);
  const input=[{id:'owner',width:'72',height:1,safeMargin:100,polygon:[[1,2],[3,4],[5,6]],
    sourceReferences:[{sourceId:'map'}],geometryEdit:{previousGeometry:{type:'Point',coordinates:[8,9]}}}];
  const before=structuredClone(input),originalDefaults=structuredClone(defaults);
  const result=normalize(input,null,{includeDefaults:false});
  assert.equal(result.length,1);assert.equal(result[0].width,72);assert.equal(result[0].height,18);assert.equal(result[0].safeMargin,8);
  result[0].polygon[0][0]=100;result[0].sourceReferences[0].sourceId='changed';result[0].geometryEdit.previousGeometry.coordinates[0]=100;
  assert.deepEqual(input,before);assert.deepEqual(defaults,originalDefaults);
  const bundled=normalize();bundled[0].provenance.source.id='changed';assert.deepEqual(defaults,originalDefaults);
});
