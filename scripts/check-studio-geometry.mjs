import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
// Exercise the locally served production build in fresh browser storage.
const origin = new URL(process.env.STUDIO_TEST_ORIGIN || "http://127.0.0.1:3021");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname), "Use a loopback test server");
assert.equal(origin.protocol, "http:");
assert.equal(origin.pathname, "/", "Supply an origin without a path");
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {})
});
const report={requests:0,errors:[]};
try {
const p=await browser.newPage({viewport:{width:1440,height:1000}});
p.on('pageerror',e=>report.errors.push(e.message));
await p.route('**/*',r=>new URL(r.request().url()).origin===origin.origin && r.request().method()==='GET'&&++report.requests<=180?r.continue():r.abort());
await p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:get.call(this,t,...a)};});
await p.goto(new URL('/studio.html',origin).href,{waitUntil:'networkidle'});
const saved=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('veggie.farm:garden-studio:v8')));
const initial=await saved(); const polygon=initial.structures.find(s=>s.localGeometry?.type==='Polygon' && s.localGeometry.coordinates[0].length===5);
assert.ok(polygon);report.featureId=polygon.id;
await p.locator('[data-tool="structures"]').click();
await p.locator(`.structure-option[data-feature-id="${polygon.id}"]`).click();
await p.getByRole('button',{name:'Edit map vertices',exact:true}).click();
await p.locator('[data-view-nav="fit-selection"]:visible').first().click();
const handles=await p.locator('[data-site-vertex]').all();
assert.equal(handles.length,4,'the bundled example contains a quadrilateral');
const ring=polygon.localGeometry.coordinates[0];
// Exercise the keyboard event handler repeatedly to cross the opposite edge.
const delta=[0,1].map(axis=>Math.round((ring[1][axis]+ring[2][axis]-ring[3][axis]-ring[0][axis])/12));
await handles[0].evaluate((el,delta)=>{
  for(let axis=0;axis<2;axis++)for(let i=0;i<Math.abs(delta[axis]);i++)
    el.dispatchEvent(new KeyboardEvent('keydown',{key:axis===0?(delta[axis]>0?'ArrowRight':'ArrowLeft'):(delta[axis]>0?'ArrowDown':'ArrowUp'),bubbles:true}));
},delta);
await p.getByRole('button',{name:'Apply geometry',exact:true}).click();
await p.locator('[data-role="site-geometry-error"]').filter({hasText:/must not/}).waitFor();
assert.deepEqual((await saved()).structures,initial.structures);
assert.equal(await p.locator('[data-site-vertex]').count(),4);
report.invalidPreviewRejectedWithoutSaving=true;
await p.getByRole('button',{name:'Cancel geometry edit',exact:true}).click();
await p.getByRole('button',{name:'Edit map vertices',exact:true}).click();
let vertex=p.locator('[data-site-vertex="0"]'); await vertex.focus();
await p.keyboard.press('ArrowRight');await p.keyboard.press('Shift+ArrowDown');
assert.deepEqual((await saved()).structures,initial.structures);report.previewNotSaved=true;
await p.locator('[data-view-nav="fit-selection"]:visible').first().click();
const handleBox=await vertex.boundingBox();const previousTransform=await vertex.getAttribute('transform');
await p.mouse.move(handleBox.x+handleBox.width/2,handleBox.y+handleBox.height/2);await p.mouse.down();await p.mouse.move(handleBox.x+handleBox.width/2+24,handleBox.y+handleBox.height/2+16,{steps:4});await p.mouse.up();
assert.notEqual(await vertex.getAttribute('transform'),previousTransform);assert.deepEqual((await saved()).structures,initial.structures);report.pointerPreviewNotSaved=true;
await p.getByRole('button',{name:'Cancel geometry edit',exact:true}).click();
assert.equal(await p.locator('[data-site-vertex]').count(),0);
assert.deepEqual((await saved()).structures,initial.structures);report.cancelUnchanged=true;
await p.getByRole('button',{name:'Edit map vertices',exact:true}).click();await vertex.focus();
await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');await p.keyboard.press('Shift+ArrowDown');
await p.getByRole('button',{name:'Apply geometry',exact:true}).click();
const edited=(await saved()).structures.find(s=>s.id===polygon.id);
const expected=structuredClone(polygon.localGeometry);expected.coordinates[0][0][0]+=24;expected.coordinates[0][0][1]+=1;expected.coordinates[0][expected.coordinates[0].length-1]=[...expected.coordinates[0][0]];
assert.deepEqual(edited.localGeometry,expected);assert.equal(edited.source,polygon.source);
assert.deepEqual(edited.geometryEdit.previousGeometry,polygon.localGeometry);report.polygonClosureAndProvenance=true;
await p.getByRole('button',{name:'Edit map vertices',exact:true}).click();await vertex.focus();await p.keyboard.press('ArrowLeft');await p.keyboard.press('Escape');
assert.equal(await p.locator('[data-site-vertex]').count(),0);assert.deepEqual((await saved()).structures.find(s=>s.id===polygon.id),edited);report.escapeCancels=true;
if (!await p.locator('.structure-list').isVisible()) await p.locator('[data-tool="structures"]').click();
const paths=(await saved()).structures.filter(s=>s.localGeometry?.type==='LineString');
const path=paths[0];
assert.ok(path,'fixture contains a path');
await p.locator(`.structure-option[data-feature-id="${path.id}"]`).click();
await p.locator('.structure-editor details').first().locator('summary').click();
await p.locator('[data-structure-field="corridorWidthFeet"]').fill('7.5');await p.locator('[data-structure-field="name"]').focus();
let beforePaths=(await saved()).structures;
assert.deepEqual(beforePaths.find(s=>s.id===path.id).localGeometry,path.localGeometry);
assert.equal(beforePaths.find(s=>s.id===path.id).corridorWidthFeet,7.5);
assert.ok(await p.locator('.site-corridor[stroke-width="90"]').count());report.widthPreservesCenterline=true;
await p.getByRole('button',{name:'Edit map vertices',exact:true}).click();
const nodeIndex=0;
await p.locator(`[data-site-vertex="${nodeIndex}"]`).focus();await p.keyboard.press('ArrowUp');
// Build the expected connected move independently of the production helper.
const expectedPaths=structuredClone(beforePaths);
const nodeId=path.topologyNodeIds?.[nodeIndex];
const next=[path.localGeometry.coordinates[nodeIndex][0],path.localGeometry.coordinates[nodeIndex][1]-12];
for(const feature of expectedPaths) {
  if(feature.localGeometry?.type!=='LineString') continue;
  for(let index=0;index<feature.localGeometry.coordinates.length;index++) {
    if((feature.id===path.id && index===nodeIndex) || (nodeId && feature.topologyNodeIds?.[index]===nodeId))
      feature.localGeometry.coordinates[index]=[...next];
  }
}
assert.deepEqual((await saved()).structures,beforePaths);
await p.getByRole('button',{name:'Apply geometry',exact:true}).click();
const afterPaths=(await saved()).structures;
for(const expectedPath of expectedPaths)assert.deepEqual(afterPaths.find(s=>s.id===expectedPath.id).localGeometry,expectedPath.localGeometry);
report.pathVertexAndUnchangedNeighbors=true;
for(const action of ['close-inspector','close-tool-drawer']){const el=p.locator(`[data-action="${action}"]`);if(await el.isVisible())await el.click();}
await p.locator('.project-menu > summary').click();await p.getByText('Backup and restore',{exact:true}).click();
const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Download full planner JSON',exact:true}).click();const download=await downloadPromise;
const backup=JSON.parse(await fs.readFile(await download.path()));assert.deepEqual(backup.structures,afterPaths);assert.ok(backup.spatial);report.backupPreserved=true;
await p.reload({waitUntil:'networkidle'});assert.deepEqual((await saved()).structures.find(s=>s.id===polygon.id),edited);report.reloadPreserved=true;
assert.deepEqual(report.errors,[]);assert.ok(report.requests<=180,'Local request ceiling exceeded');report.passed=true;
} finally {await browser.close();console.log(JSON.stringify(report));}
