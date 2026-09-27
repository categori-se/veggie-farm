// Optional browser acceptance; install Playwright separately or set PLAYWRIGHT_MODULE.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const checks=[];
const origin=new URL(process.env.COMMUNITY_BASE_URL||'http://127.0.0.1:3065');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(origin.hostname));assert.equal(origin.protocol,'http:');assert.ok(!origin.username&&!origin.password);
const base=origin.origin;
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const placements=rows=>rows.map(p=>({...p,name:p.name||'Planting'}));
const plantFields=p=>Object.fromEntries(['id','catalogPlantId','name','scientificName','height','matureDiameter','spacing','sources','studioReference','planningRanges','reviewStatus'].map(k=>[k,p[k]]));
async function setup(width){const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());return {context,page,errors};}
async function download(page){const event=page.waitForEvent('download');await page.locator('[data-action="export"]').evaluate(el=>el.click());const file=await event;return JSON.parse(await fs.readFile(await file.path(),'utf8'));}
try{
for(const width of [1280,390]){
 const {page,context,errors}=await setup(width);console.log('Checking width',width);
 await page.goto(`${base}/content/reference/open-plant-data`);
 const catalogLink=page.getByRole('link',{name:'Download the complete reusable collection (JSON)'});await catalogLink.waitFor({timeout:60000});
 const event=page.waitForEvent('download');await catalogLink.click();const downloaded=await event,catalog=JSON.parse(await fs.readFile(await downloaded.path(),'utf8'));
 assert.equal(catalog.records.length,440);assert.equal(catalog.records.filter(p=>p.rights.license==='CC0-1.0').length,340);
 assert.equal(catalog.coverage.fields.fieldEvidence.present,440);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(`${base}/content/reference/plant-database?search=acorn+squash`);
 await page.getByRole('link',{name:'Acorn Squash',exact:true}).click({timeout:60000});
 await page.getByRole('heading',{name:'Acorn Squash',exact:true}).waitFor();
 assert.match(await page.locator('.plant-report').innerText(),/Historical OpenFarm community record/);
 await page.getByText('Reference sources',{exact:true}).click();await page.getByText('Field provenance',{exact:true}).click();
 assert.match(await page.locator('.plant-report').innerText(),/CC0-1.0/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));

 await page.goto(`${base}/content/reference/plant-database?search=Broccoli`,{waitUntil:'domcontentloaded'});
 await page.locator('a[href="/plants/plant?id=plant%3Acommunity%3Abroccoli"]').waitFor({timeout:60000});
 await page.locator('a[href="/plants/plant?id=plant%3Acommunity%3Abroccoli"]').click();
 await page.getByRole('heading',{name:'Broccoli',exact:true}).waitFor();
 assert.match(await page.locator('.plant-report').innerText(),/not been independently verified/);
 await page.getByText('Reference sources',{exact:true}).click();
 assert.equal(await page.locator('.plant-report details').filter({has:page.locator('summary',{hasText:'Reference sources'})}).locator('a').count(),3);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(`${base}/studio`,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Start with a 4 × 8 bed',exact:true}).waitFor({timeout:60000});
 await page.getByRole('button',{name:'Start with a 4 × 8 bed',exact:true}).click();
 await page.locator('dialog[open]').getByLabel('Garden name',{exact:true}).fill('Common inventory acceptance');
 await page.getByRole('button',{name:'Create bed and choose plants',exact:true}).click();
 await page.getByRole('button',{name:'Continue later',exact:true}).click();
 await page.locator('[data-tool="plants"]').click();
 if(await page.getByLabel('Plant library scope').count())await page.getByLabel('Plant library scope').selectOption('all');
 await page.getByLabel('Filter plants',{exact:true}).fill('Broccoli');
 await page.locator('[data-plant-id="broccoli"]').click();
 await page.locator('[data-action="add-selected"]').click();
 console.log('Plant added',width);let saved=await download(page);
 assert.equal(saved.plants.length,106);
 assert.ok(saved.placements.some(p=>p.plantId==='broccoli'));
 const broccoli=saved.plants.find(p=>p.id==='broccoli');assert.equal(broccoli.catalogPlantId,'plant:community:broccoli');assert.equal(broccoli.height,36);assert.equal(broccoli.sources.length,3);
 assert.equal(saved.plants.find(p=>p.id==='tomato').height,56);
 await page.locator('[data-presentation="3d"]').click();
 await page.waitForTimeout(500);
 await page.locator('[data-presentation="2d"]').click();
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-action="export"]').waitFor({state:'attached',timeout:60000});
 const reloaded=await download(page);assert.deepEqual(placements(reloaded.placements),placements(saved.placements));assert.deepEqual(plantFields(reloaded.plants.find(p=>p.id==='broccoli')),plantFields(broccoli));
 const restored=await setup(width),restorePage=restored.page;
 await restorePage.goto(`${base}/studio#inventory-check`,{waitUntil:'domcontentloaded'});await restorePage.locator('[data-role="backup-input"]').waitFor({state:'attached',timeout:60000});
 assert.ok(!(await download(restorePage)).placements.some(p=>p.plantId==='broccoli'));
 restorePage.once('dialog',dialog=>dialog.accept());
 await restorePage.locator('[data-role="backup-input"]').setInputFiles({name:'common-inventory.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
 await restorePage.waitForFunction(()=>document.querySelector('[data-role="backup-status"]').textContent.length>0);
 const imported=await download(restorePage);assert.deepEqual(placements(imported.placements),placements(saved.placements));assert.deepEqual(plantFields(imported.plants.find(p=>p.id==='broccoli')),plantFields(broccoli));
 assert.ok(await restorePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual([...errors,...restored.errors],[]);
 await restored.context.close();
 checks.push({width,downloadRecords:440,licensedOpenRecords:340,plantReport:true,citations:3,studioPlants:106,addSaveReloadExportImport:true,originalTomatoHeightPreserved:true,pageErrors:errors});await context.close();
}
console.log(JSON.stringify(checks));
}finally{await browser.close();}
