const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin=new URL(process.env.STUDIO_TEST_ORIGIN || 'http://127.0.0.1:3021');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(origin.hostname), 'Use a loopback test server');
assert.equal(origin.protocol,'http:');
assert.equal(origin.pathname,'/');
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const report={kind:'Local mocked transport; not real sign-in or hosted acceptance',writes:0,errors:[]};
let saved,serviceUnavailable=false,configUnavailable=false;
try {
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('dialog',d=>d.accept(d.type()==='prompt'?'My own garden':undefined));
await page.route('**/*',async r=>{
 const u=new URL(r.request().url());
 if(u.pathname==='/account-config.json')return configUnavailable?r.fulfill({status:503,body:'Unavailable'}):r.fulfill({json:{version:1,apiBaseUrl:'https://account-test.invalid'}});
 if(u.origin==='https://account-test.invalid'){
  if(serviceUnavailable)return r.fulfill({status:503,json:{error:'account_store_unavailable'}});
  const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  if(r.request().method()==='POST'){
   saved=r.request().postDataJSON();report.writes++;
   return r.fulfill({status:201,json:{id,revision:'"1"',name:saved.name}});
  }
  if(u.pathname==='/plans')return r.fulfill({json:{plans:[{id,updatedAt:'local test'}]}});
  return r.fulfill({json:{id,revision:'"1"',name:saved.name,payload:saved.payload}});
 }
 if(u.origin===origin.origin)return r.continue();
 return r.abort();
});
await page.addInitScript(()=>{
 sessionStorage.setItem('veggie.farm.accessToken','local.test.token');
 sessionStorage.setItem('veggie.farm.accessTokenExpiresAt',String(Date.now()+3600000));
 const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:get.call(this,t,...a)};
});
await page.goto(new URL('/studio.html',origin).href,{waitUntil:'networkidle'});
const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('veggie.farm:garden-studio:v8')));
await page.locator('.planner-account summary').click();
await page.locator('[data-cloud="create"]').click();
await page.getByText('Create your own garden first. Public demo edits stay in this browser.',{exact:true}).waitFor();
assert.equal(report.writes,0);
await page.locator('[data-role="start-practice-garden"]').click();
const own=(await read()).activeParcelId;
await page.locator('[data-action="save-layout"]').click();
await page.locator('[data-cloud="create"]').click();
await page.getByText('Private account copy saved. Further edits still need an explicit account update.',{exact:true}).waitFor();
assert.equal(report.writes,1);assert.deepEqual(saved.payload.parcels.map(p=>p.id),[own]);assert.equal(saved.payload.spatial,undefined);assert.equal(saved.payload.bed,undefined);
assert.equal(saved.payload.layouts.length,1);
assert.equal(saved.payload.layouts[0].gardenId,own);
assert.deepEqual(saved.payload.layouts[0].beds,saved.payload.layouts[0].workspace.beds);
assert.deepEqual(saved.payload.structures,saved.payload.parcels[0].structures);
const demos=(await read()).parcels.filter(p=>p.id!==own);
await page.locator('[data-cloud="list"]').click();
await page.locator('[data-cloud-list]').selectOption('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
await page.locator('[data-cloud="restore"]').click();
await page.getByText('Account copy restored. Check browser-save status before leaving; further cloud updates are explicit.',{exact:true}).waitFor();
assert.deepEqual((await read()).parcels.filter(p=>p.id!==own),demos);
assert.equal((await read()).activeParcelId,own);
await page.locator('[data-scope="attributes"]').click();
assert.equal(await page.locator('[data-tool="structures"]').getAttribute('aria-pressed'),'true');
await page.locator('[data-scope="bed"]').click();
assert.equal(await page.locator('[data-tool="beds"]').getAttribute('aria-pressed'),'true');
// Optional hosting failures must not damage canonical browser work or backups.
const localBefore=await read();
const canonical=state=>({activeParcelId:state.activeParcelId,parcels:state.parcels,layouts:state.layouts,beds:state.beds,placements:state.placements});
const unavailable=page.getByText('Account save service is unavailable. Your local work is unchanged; download a JSON backup before leaving.',{exact:true});
serviceUnavailable=true;
await page.locator('[data-cloud="update"]').click();await unavailable.waitFor();
assert.deepEqual(canonical(await read()),canonical(localBefore));
assert.equal(await page.locator('[data-cloud="update"]').isDisabled(),false);
const pending=page.waitForEvent('download');
await page.locator('[data-action="export"]').evaluate(button=>button.click());
const backup=JSON.parse(await readFile(await (await pending).path(),'utf8'));
assert.equal(backup.activeParcelId,own);
assert.deepEqual(backup.parcels,localBefore.parcels);
assert.deepEqual(backup.layouts,localBefore.layouts);
configUnavailable=true;
await page.reload({waitUntil:'networkidle'});
await page.locator('[data-action="save-layout"]').waitFor();
assert.deepEqual(canonical(await read()),canonical(localBefore));
await page.locator('.planner-account summary').click();
await page.locator('[data-cloud="list"]').click();await unavailable.waitFor();
assert.deepEqual(canonical(await read()),canonical(localBefore));
assert.equal(await page.locator('[data-cloud="list"]').isDisabled(),false);
await page.locator('[data-action="open-bed-tool"]').click();
const bedName=page.locator('[data-bed-field="name"]');
if(!await bedName.isVisible())await page.locator('.bed-option[aria-pressed="true"]').click();
await bedName.fill('Local edit during hosting outage');await bedName.press('Tab');
assert.ok((await read()).beds.some(bed=>bed.name==='Local edit during hosting outage'));
await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="save-layout"]').waitFor();
assert.ok((await read()).beds.some(bed=>bed.name==='Local edit during hosting outage'));
report.editDuringOutageSurvivesReload=true;
report.hostingFailurePreservesLocalWork=true;report.backupWorksDuringOutage=true;report.reloadWorksWithoutAccountConfig=true;
assert.deepEqual(report.errors,[]);report.demoExclusion=true;report.personalRecovery=true;report.localDemosPreserved=true;report.separateEditors=true;
console.log(JSON.stringify(report));
}finally{await browser.close();}
