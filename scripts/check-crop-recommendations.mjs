const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const origin = new URL(process.env.RESOURCE_TEST_ORIGIN || 'http://127.0.0.1:3021');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(origin.hostname), 'Use a loopback test server');
assert.equal(origin.protocol, 'http:');
assert.equal(origin.pathname, '/');
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
const report={errors:[],requests:0};
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin.origin&&++report.requests<160?r.continue():r.abort());
 await page.goto(new URL('/tools/what-grows-in-this-bed.html',origin).href,{waitUntil:'networkidle'});
 const review=page.getByLabel('I have reviewed this bed’s recent crop history',{exact:true});
 assert.equal(await review.isChecked(),false);
 await page.getByText(/rotation fit is unknown/).first().waitFor();
 await review.check();
 await page.getByText(/is not listed in the history you reviewed/).first().waitFor();
 assert.equal(await page.getByText(/rotation fit is unknown/).count(),0);
 await review.uncheck();
 await page.getByText(/rotation fit is unknown/).first().waitFor();
 const group=page.getByLabel('Plant group',{exact:true});
 for(const [label,expected] of [['Vegetables','vegetable'],['Herbs','herb'],['Flowers and pollinator plants','flower-or-ornamental'],['Grains and cover crops','grain-or-cover-crop'],['All imported plants',null]]) {
   await group.selectOption({label});
   await page.waitForFunction(expected=>{
     const table=document.querySelector('table');
     const index=[...table.querySelectorAll('thead th')].findIndex(th=>th.textContent.trim().toLowerCase()==='group');
     const rows=[...table.querySelectorAll('tbody tr')];
     return index>=0 && rows.length>1 && !table.textContent.includes('No results.')
       && (!expected || rows.every(row=>row.cells[index]?.textContent.trim()===expected));
   },expected);
 }
 report.cropGroups=5;
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(report.errors,[]);
 report.defaultUnknown=true;report.reviewReactive=true;report.mobileNoPageOverflow=true;
 console.log(JSON.stringify(report));
}finally{await browser.close();}
