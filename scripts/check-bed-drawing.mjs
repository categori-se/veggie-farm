// Run against a locally served build; fresh browser context, no account or imagery calls.
import assert from 'node:assert/strict';
const origin = new URL(process.env.STUDIO_BASE_URL || 'http://127.0.0.1:3000');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname), 'Use a loopback Studio URL');
assert.equal(origin.protocol, 'http:');
assert.ok(!origin.username && !origin.password, 'Do not supply credentials');
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {})});
const touch = process.env.STUDIO_TOUCH === '1';
const report = {touchViewport: touch, kind: 'Local Studio tree inspector; external requests blocked, WebGL fallback', requests: 0, errors: []};
const storageKey = 'veggie.farm:garden-studio:v8';
try {
  const page = await browser.newPage(touch ? {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true} : {viewport: {width: 1440, height: 1100}});
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push(error.message));
  const cache = new Map();
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin.origin) return route.abort();
    assert.equal(route.request().method(), 'GET', 'This local check must not write to a service');
    if (!cache.has(url.href)) {
      assert.ok(++report.requests <= 180, 'Request ceiling exceeded');
      cache.set(url.href, (async () => {
        const response = await route.fetch({maxRedirects: 0});
        assert.ok(response.status() < 300 || response.status() >= 400, 'Redirects are outside this local check');
        const headers = response.headers();
        delete headers['content-encoding']; delete headers['content-length'];
        return {status: response.status(), headers, body: await response.body()};
      })());
    }
    return route.fulfill(await cache.get(url.href));
  });
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/i.test(type) ? null : get.call(this, type, ...args);
    };
  });
  const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  await page.goto(new URL('/studio.html', origin).href, {waitUntil: 'networkidle'});
  await page.locator('[data-role="start-practice-garden"]').click();
  const initial = await read();
  const gardenId = initial.activeParcelId;
  const bedCount = initial.beds.length;
  if (!await page.locator('[data-action="draw-bed"]').isVisible()) await page.locator('[data-tool="beds"]').click();
  await page.locator('[data-action="draw-bed"]').click();
  const map = page.locator('[data-role="parcel-svg"]');
  const finish = page.locator('[data-action="finish-map-bed"]');
  assert.equal(await map.isVisible(), true, 'Drawing must expose the map');
  assert.equal(await finish.isVisible(), true);
  assert.equal(await finish.isDisabled(), true);
  const bounds = await map.boundingBox();
  for (const [x,y] of [[.15,.2],[.32,.2],[.32,.35],[.15,.35]]) {
    await map.click({position:{x:bounds.width*x,y:bounds.height*y}});
  }
  assert.equal(await page.locator('.draft-bed-point').count(),4);
  assert.equal(await finish.isEnabled(),true);
  await finish.click();
  let state=await read();
  assert.equal(state.beds.length,bedCount+1);
  const added=state.beds.find(b=>!initial.beds.some(old=>old.id===b.id));
  assert.equal(added.polygon.length,4);
  assert.equal(await finish.isVisible(),false);
  await page.reload({waitUntil:'networkidle'});
  state=await read();
  assert.deepEqual(state.parcels.find(g=>g.id===gardenId).beds.find(b=>b.id===added.id).polygon,added.polygon);
  if (!await page.locator('[data-action="draw-bed"]').isVisible()) await page.locator('[data-tool="beds"]').click();
  await page.locator('[data-action="draw-bed"]').click();
  await map.click({position:{x:bounds.width*.15,y:bounds.height*.2}});
  await page.locator('[data-action="cancel-map-bed"]').click();
  assert.equal(await page.locator('.draft-bed-point').count(),0);
  assert.equal((await read()).beds.length,bedCount+1);
  assert.deepEqual(report.errors,[]);
  Object.assign(report,{kind:'Local bed drawing from 3D; external requests blocked, WebGL fallback',mapRevealed:true,finishAndCancelVisible:true,polygonPersisted:true,cancelPreservesBeds:true,passed:true});
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
