// Run against a locally served production build. No account or cloud access.
import assert from "node:assert/strict";
const origin = new URL(process.env.STUDIO_TEST_ORIGIN || "http://127.0.0.1:3021");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname), "Use a loopback test server");
assert.equal(origin.protocol, "http:");
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {})
});
try {
 for (const desktop of [false, true]) {
  const context = await browser.newContext({viewport:{width:desktop?1440:390,height:950},hasTouch:!desktop,isMobile:!desktop});
  const page = await context.newPage();
  const report = {viewport:desktop?"desktop":"mobile",requests:0,errors:[]};
  page.on("pageerror", error => report.errors.push(error.message));
  await page.route("**/*", route => {
    if (new URL(route.request().url()).origin !== origin.origin) return route.abort();
    if (route.request().method() !== "GET" || ++report.requests > 180) return route.abort();
    return route.continue();
  });
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return /webgl/i.test(type) ? null : get.call(this, type, ...args);
    };
  });
  await page.goto(new URL("studio.html", origin).href,{waitUntil:"networkidle"});
 const close=async()=>{for(const name of ['close-inspector','close-tool-drawer']){const b=page.locator(`[data-action="${name}"]`);if(await b.isVisible())await b.click();}};
 await close();await page.getByRole('button',{name:'Start a practice garden'}).click();
 const edit=page.getByRole('tab',{name:'Edit',exact:true});
 const diagnostics=page.getByRole('tab',{name:'Diagnostics',exact:true});
 await edit.focus();await page.keyboard.press('ArrowRight');
 assert.equal(await diagnostics.getAttribute('aria-selected'),'true');
 assert.equal(await diagnostics.evaluate(el=>el===document.activeElement),true);
 assert.equal(await edit.getAttribute('tabindex'),'-1');
 assert.equal(await page.getByRole('tabpanel').count(),1);
 assert.equal(await page.getByRole('tabpanel').getAttribute('id'),await diagnostics.getAttribute('aria-controls'));
 await page.keyboard.press('ArrowRight');assert.equal(await edit.getAttribute('aria-selected'),'true');
 await page.keyboard.press('End');assert.equal(await diagnostics.getAttribute('aria-selected'),'true');
 await page.keyboard.press('Home');assert.equal(await edit.getAttribute('aria-selected'),'true');
 assert.equal(await page.getByRole('tabpanel').getAttribute('aria-labelledby'),await edit.getAttribute('id'));
 report.inspectorTabsPassed=true;
 const inspector=page.locator('[data-role="context-inspector"]');
 const drawer=page.locator('[data-role="tool-drawer"]');
 const rail=page.locator('[data-tool="beds"]');
 await page.locator('[data-bed-field="name"]').focus();
 await page.keyboard.press('Escape');
 assert.equal(await inspector.isVisible(),false);
 assert.equal(await rail.evaluate(el=>el===document.activeElement),true);
 // Keyboard-only open and close, followed by normal Tab navigation.
 if(await drawer.isVisible()) {await page.locator('[data-action="close-tool-drawer"]').focus();await page.keyboard.press('Enter');}
 await rail.focus();await page.keyboard.press('Enter');assert.equal(await drawer.isVisible(),true);
 await page.locator('[data-action="close-tool-drawer"]').focus();await page.keyboard.press('Enter');
 assert.equal(await drawer.isVisible(),false);assert.equal(await rail.evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.tool),'plants');
 await page.keyboard.press('Enter');await page.getByRole('searchbox',{name:'Filter plants'}).focus();await page.keyboard.press('Escape');
 assert.equal(await drawer.isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.dataset.tool),'plants');
 // Explicit inspector close must also restore visible focus.
 await page.getByRole('button',{name:'Start a practice garden'}).focus();await page.keyboard.press('Enter');
 await page.locator('[data-action="close-inspector"]').focus();await page.keyboard.press('Enter');
 assert.equal(await inspector.isVisible(),false);assert.equal(await rail.evaluate(el=>el===document.activeElement),true);
 report.keyboardPanelChecksPassed=true;

  assert.ok(report.requests <= 180, "Local request ceiling exceeded");
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify({...report,passed:true}));
  await context.close();
 }
} finally {
 await browser.close();
}
