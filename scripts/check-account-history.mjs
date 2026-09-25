import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const source=process.env.ACCOUNT_BUILD_ROOT ? pathToFileURL(resolve(process.env.ACCOUNT_BUILD_ROOT)+'/') : new URL('../src/',import.meta.url);
const entry=process.env.ACCOUNT_BUILD_ROOT ? '/_import/components/'+(await readdir(new URL('_import/components/',source))).find(name=>/^plannerAccount\.[a-f0-9]+\.js$/.test(name)) : '/components/plannerAccount.js';
assert.ok(!entry.endsWith('undefined'),'Built account component is missing');
const origin='http://127.0.0.1:3199';
const ids=['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'];
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const report={kind:(process.env.ACCOUNT_BUILD_ROOT?'Built':'Source')+' component in real browser; mocked account transport; no cloud access',errors:[],requests:[]};
let releaseHistory,historyStarted;
const started=new Promise(resolve=>historyStarted=resolve);
const held=new Promise(resolve=>releaseHistory=resolve);
const workspace={id:'personal',property:{id:'personal'},beds:[],structures:[],vegetation:[],placements:[]};
const payload={...workspace,activeParcelId:'personal',parcels:[workspace],plants:[],layouts:[]};
try {
 const page=await browser.newPage();page.setDefaultTimeout(5000);
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin==='https://account-test.invalid') {
   report.requests.push(url.pathname+url.search);
   if(url.pathname==='/plans')return route.fulfill({json:{plans:ids.map(id=>({id,updatedAt:'Synthetic copy'}))}});
   const id=url.pathname.split('/').at(-1);
   if(url.searchParams.has('history')) {
    if(id===ids[0]){historyStarted();await held;}
    return route.fulfill({json:{versions:[{version:id===ids[0]?'version-a':'version-b',updatedAt:'Earlier synthetic version'}]}});
   }
   return route.fulfill({json:{id,name:id===ids[0]?'Copy A':'Copy B',revision:'"1"',payload}});
  }
  assert.equal(url.origin,origin,'No external request allowed');
  if(url.pathname==='/account-config.json')return route.fulfill({json:{version:1,apiBaseUrl:'https://account-test.invalid'}});
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:`<script type="module">
   import {plannerAccount} from '${entry}';
   sessionStorage.setItem('veggie.farm.accessToken','local.test.token');
   sessionStorage.setItem('veggie.farm.accessTokenExpiresAt',String(Date.now()+3600000));
   window.restored=0;
   const component=plannerAccount({exportPlanner:()=>({}),restorePlanner:()=>window.restored++});
   component.open=true;document.body.append(component);
   </script>`});
  assert.ok(/^\/(?:_import\/)?(components|lib)\/[a-zA-Z0-9/.-]+\.js$/.test(url.pathname));
  const file=new URL('.'+url.pathname,source);assert.ok(file.href.startsWith(source.href));
  return route.fulfill({contentType:'text/javascript',body:await readFile(file,'utf8')});
 });
 await page.goto(origin);
 const button=action=>page.locator(`[data-cloud="${action}"]`);
 const select=page.locator('[data-cloud-list]'),history=page.locator('[data-cloud-history]');
 await button('list').click();await page.getByText(/Account copies loaded/).waitFor();
 await select.selectOption(ids[0]);await button('history').click();await started;
 assert.equal(await select.isDisabled(),true,'Copy selector must be locked during history request');
 assert.equal(await history.isDisabled(),true,'Version selector must be locked during history request');
 releaseHistory();await page.getByText('Version history loaded.',{exact:true}).waitFor();
 await history.selectOption('version-a');await select.selectOption(ids[1]);
 assert.equal(await history.locator('option').count(),1,'Changing copies must clear stale history');
 assert.equal(await history.inputValue(),'');
 await button('restore-version').click();await page.getByText('Choose an earlier version first.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.restored),0);
 assert.equal(report.requests.some(path=>path.includes('?version=')),false,'No stale restore request');
 await button('history').click();await page.getByText('Version history loaded.',{exact:true}).waitFor();
 await history.selectOption('version-b');page.once('dialog',dialog=>dialog.accept());
 await button('restore-version').click();await page.getByText(/Earlier version restored locally/).waitFor();
 assert.equal(await page.evaluate(()=>window.restored),1);
 assert.ok(report.requests.includes('/plans/'+ids[1]+'?version=version-b'));
 // Refreshing the account list also clears history whose selection was removed.
 await button('list').click();await page.getByText(/Account copies loaded/).waitFor();
 assert.equal(await history.locator('option').count(),1);
 assert.deepEqual(report.errors,[]);
 report.passed=true;report.copySelectionLocked=true;report.staleHistoryCleared=true;report.selectedCopyRestored=true;
 console.log(JSON.stringify(report));
} finally {releaseHistory();await browser.close();}
