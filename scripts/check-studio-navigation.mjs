const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const origin = new URL(process.env.STUDIO_TEST_ORIGIN || 'http://127.0.0.1:3089');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(origin.hostname));
const base=new URL('/studio.html',origin).href;
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox','--enable-unsafe-swiftshader']});const report={passed:false,checks:[],errors:[]};
try {for(const [width,height] of [[390,844],[844,390],[1440,1000]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width<1000});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});
 const root=page.locator('.garden-planner-app');await root.waitFor();
 const close=async()=>{for(const name of ['close-inspector','close-tool-drawer']){const el=page.locator(`[data-action="${name}"]`);if(await el.isVisible())await el.click();}};await close();
 await page.getByRole('button',{name:'Start a practice garden'}).click();await close();
 const geometry=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('veggie.farm:garden-studio:v8'));return JSON.stringify([s.beds,s.placements,s.structures,s.vegetation]);});
 for(const mode of ['map','2d','3d']){
  await page.locator(`[data-presentation="${mode}"]`).click();
  const nav=page.locator('.view-navigation:visible');await nav.locator('[data-view-nav="pan"]').click();
  assert.equal(await root.getAttribute('data-active-tool'),'select');
  await nav.locator('[data-view-nav="zoom-in"]').click();await nav.locator('[data-view-nav="zoom-in"]').click();
  const surface=page.locator(mode==='map'?'.parcel-svg':mode==='2d'?'.plan-svg':'.three-host canvas');await surface.scrollIntoViewIfNeeded();
  
  const before=await geometry();const view=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('veggie.farm:garden-studio:v8'));return JSON.stringify([s.parcelViewport,s.bedCameras]);});const cameraBefore=await view();
  const box=await surface.boundingBox();const x=box.x+box.width*.5,y=Math.max(20,Math.min(height-100,box.y+box.height*.4));
  if(width<1000){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let n=1;n<=5;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-10*n,y:y+3*n}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else {await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-70,y+30,{steps:6});await page.mouse.up();}
  await page.waitForTimeout(300);assert.notEqual(await view(),cameraBefore,`Camera must move ${width} ${mode}`);assert.equal(await geometry(),before,'Pan changed garden geometry');
  for(const b of await nav.locator('button').all()){await b.scrollIntoViewIfNeeded();assert.ok(await b.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===hit||el.contains(hit);}),`Covered navigation ${width} ${mode} ${await b.getAttribute('data-view-nav')}`);}
  report.checks.push({width,height,mode,pan:true,geometryUnchanged:true,navigationAccessible:true});
 }
 for(const tool of ['beds','structures','vegetation','plants']){await page.locator(`[data-tool="${tool}"]`).click();await page.locator('[data-role="tool-drawer"]').waitFor();await page.locator('[data-action="close-tool-drawer"]').click();}
 await page.locator('[data-tool="select"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await context.close();
}assert.deepEqual(report.errors,[]);report.passed=true;}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await browser.close();console.log(JSON.stringify(report));}
