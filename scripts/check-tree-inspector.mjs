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
  const gardenId = (await read()).activeParcelId;
  await page.locator('[data-tool="vegetation"]').click();
  await page.locator('[data-action="add-vegetation"]').click();
  let state = await read();
  const treeId = state.selectedVegetationId;
  assert.ok(treeId);
  if (touch) {
    // The same drawer may still be open behind the inspector after adding a tree.
    await page.locator('[data-tool="vegetation"]').tap();
    assert.equal(await page.locator('[data-action="add-vegetation"]').isVisible(), true);
    await page.locator(`.vegetation-option[data-feature-id="${treeId}"]`).tap();
  }
  await page.getByText('Tree center, crown, and height', {exact: true}).click();
  const height = page.locator('[data-vegetation-field="heightEstimateFeet"]');
  await height.fill('25'); await height.press('Tab');
  let tree = (await read()).vegetation.find(item => item.id === treeId);
  assert.equal(tree.heightEstimateFeet, 25);
  const geometry = structuredClone(tree.localGeometry);
  const crown = page.locator('[data-vegetation-field="crownWidthFeet"]');
  await crown.fill('42'); await crown.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.vegetationField), 'crownDepthFeet', 'Tab must reach the next measurement');
  assert.equal(await height.isVisible(), true);
  const provenance = await page.locator('[data-role="vegetation-provenance"]').innerText();
  assert.match(provenance, /User-entered crown axes/);
  assert.match(provenance, /User-entered estimate/);
  await height.fill(''); await height.press('Tab');
  assert.equal(await height.isVisible(), true);
  await page.reload({waitUntil: 'networkidle'});
  tree = (await read()).parcels.find(garden => garden.id === gardenId).vegetation.find(item => item.id === treeId);
  assert.ok(tree.heightEstimateFeet == null);
  assert.equal(tree.heightConfidence, 'unknown');
  assert.ok(tree.heightEstimateMethod == null);
  assert.deepEqual(tree.localGeometry, geometry);
  assert.equal(tree.crownWidthFeet, 42);
  assert.deepEqual(report.errors, []);
  Object.assign(report, {practiceGarden: true, keyboardFocusPreserved: true, disclosureStaysOpen: true,
    provenanceRefreshes: true, clearedHeightPersists: true, crownEditPersists: true, geometryPreserved: true, passed: true});
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
