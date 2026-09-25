// Acceptance of a loopback community build. No accounts or external services.
import assert from 'node:assert/strict';
const origin=new URL(process.env.COMMUNITY_BASE_URL||'http://127.0.0.1:3065');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(origin.hostname));
assert.equal(origin.protocol,'http:');assert.ok(!origin.username&&!origin.password);
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const report={pages:[],external:[],writes:[],errors:[]};
try{
 for(const route of ['/','/content/reference/plant-database.html','/tools/my-garden.html','/studio.html','/demo.html']){
  const context=await browser.newContext();let requests=0;
  await context.route('**/*',async r=>{const q=r.request(),url=new URL(q.url());assert.ok(++requests<=400,'Request ceiling');if(url.origin!==origin.origin){report.external.push({page:route,origin:url.origin});return r.abort();}if(q.method()!=='GET'){report.writes.push(q.method());return r.abort();}await r.continue();});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>report.errors.push({page:route,error:e.message}));
  page.on('dialog',d=>d.type()==='prompt'?d.accept('Sandbox copy'):d.accept());
  await page.goto(origin.origin+route);await page.waitForTimeout(1500);
  assert.deepEqual(await page.locator('.observablehq--error').allTextContents(),[],route);
  if(route==='/tools/my-garden.html')await page.getByRole('heading',{name:'Browser-local notebook'}).waitFor();
  if(route==='/demo.html'){
   await page.locator('.planner-account summary').click();
   const action=async name=>{await page.locator(`[data-cloud="${name}"]`).click();await page.waitForTimeout(350);};
   await action('create');assert.match(await page.locator('[data-cloud-status]').innerText(),/Demo copy saved/);
   await action('update');assert.match(await page.locator('[data-cloud-status]').innerText(),/updated/);
   await action('list');assert.equal(await page.locator('[data-cloud-list] option').count(),2);
   await page.locator('[data-cloud-list]').selectOption({index:1});await action('history');assert.equal(await page.locator('[data-cloud-history] option').count(),3);
   await page.locator('[data-cloud-history]').selectOption({index:1});await action('restore-version');assert.match(await page.locator('[data-cloud-status]').innerText(),/Earlier version restored/);
   assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[]);
   await action('delete');assert.match(await page.locator('[data-cloud-status]').innerText(),/Demo copy and its versions deleted/);
   await action('create');await page.reload();await page.waitForTimeout(1500);
   await page.locator('.planner-account summary').click();assert.equal(await page.locator('[data-cloud-list] option').count(),1);
   assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[]);
   report.demo={saveUpdateHistoryRestoreDelete:true,reloadClears:true,persistentStorageEmpty:true};
  }
  report.pages.push({route,requests});await context.close();
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.writes,[]);assert.deepEqual(report.external,[]);
}finally{await browser.close();console.log(JSON.stringify(report,null,2));}
