import assert from "node:assert/strict";
import test from "node:test";

import {
  MA_SPATIAL_CACHE_VERSION,
  fetchSpatialAsset,
  isInsideMassachusettsEnvelope,
  spatialCacheKey
} from "../src/lib/spatial/maSpatialCache.js";

function memoryCacheStorage() {
  const stores = new Map();
  return {
    async open(name) {
      const store = stores.get(name) ?? new Map();
      stores.set(name, store);
      return {
        async match(key) {
          return store.get(String(key))?.clone();
        },
        async put(key, response) {
          store.set(String(key), response.clone());
        }
      };
    },
    async delete(name) {
      return stores.delete(name);
    }
  };
}

test("Massachusetts envelope rejects obviously out-of-state points", () => {
  assert.equal(isInsideMassachusettsEnvelope(-71.06, 42.36), true);
  assert.equal(isInsideMassachusettsEnvelope(-73.76, 42.65), false);
  assert.equal(isInsideMassachusettsEnvelope("nope", 42), false);
});

test("spatial cache keys are versioned and do not retain URL fragments", () => {
  const key = spatialCacheKey("https://data.veggie.farm/ma/parcels/12/1/2.pbf#feature");
  assert.equal(key, `https://data.veggie.farm/ma/parcels/12/1/2.pbf?vf-cache=${MA_SPATIAL_CACHE_VERSION}`);
});

test("spatial responses are fetched once and reused across visits", async () => {
  const cacheStorage = memoryCacheStorage();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(JSON.stringify({parcel: "demo"}), {
      headers: {"content-type": "application/json"}
    });
  };

  const first = await fetchSpatialAsset("https://data.veggie.farm/ma/parcel/demo.json", {cacheStorage, fetchImpl});
  const second = await fetchSpatialAsset("https://data.veggie.farm/ma/parcel/demo.json", {cacheStorage, fetchImpl});

  assert.equal(calls, 1);
  assert.deepEqual(await first.json(), {parcel: "demo"});
  assert.deepEqual(await second.json(), {parcel: "demo"});
});

test("failed responses are not persisted", async () => {
  const cacheStorage = memoryCacheStorage();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response("unavailable", {status: 503});
  };

  await fetchSpatialAsset("https://data.veggie.farm/ma/missing", {cacheStorage, fetchImpl});
  await fetchSpatialAsset("https://data.veggie.farm/ma/missing", {cacheStorage, fetchImpl});
  assert.equal(calls, 2);
});

test('failed image requests are shared and suppressed across redraws', async () => {
  const {cachedSpatialImageUrl} = await import('../src/lib/spatial/maSpatialCache.js');
  let fetches = 0, images = 0;
  const options = {
    cacheStorage: memoryCacheStorage(),
    fetchImpl: async () => { fetches++; throw Error('offline'); },
    imageFactory: () => { images++; return {set src(value) { queueMicrotask(() => this.onerror()); }}; }
  };
  const url = 'https://example.test/offline-tile.png';
  assert.deepEqual(await Promise.all(Array.from({length: 20}, () => cachedSpatialImageUrl(url, options))), Array(20).fill(null));
  assert.equal(await cachedSpatialImageUrl(url, options), null);
  assert.equal(fetches, 1);
  assert.equal(images, 1);
});

test('CORS-blocked image providers retain a successful shared display fallback', async () => {
  const {cachedSpatialImageUrl} = await import('../src/lib/spatial/maSpatialCache.js');
  let fetches = 0, images = 0;
  const options = {
    cacheStorage: memoryCacheStorage(),
    fetchImpl: async () => { fetches++; throw Error('CORS'); },
    imageFactory: () => { images++; return {set src(value) { queueMicrotask(() => this.onload()); }}; }
  };
  const url = 'https://example.test/display-only-tile.png';
  assert.equal(await cachedSpatialImageUrl(url, options), url);
  assert.equal(await cachedSpatialImageUrl(url, options), url);
  assert.equal(fetches, 1);
  assert.equal(images, 1);
});

test('stalled image fetches abort without a second display request or immediate retry', async () => {
  const {cachedSpatialImageUrl} = await import('../src/lib/spatial/maSpatialCache.js');
  let fetches = 0, fallbacks = 0, requestSignal;
  const options = {
    timeoutMs: 15,
    cacheStorage: memoryCacheStorage(),
    fetchImpl: (_url, {signal}) => {
      fetches++; requestSignal = signal;
      return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), {once: true}));
    },
    imageFactory: () => { fallbacks++; throw Error('unexpected fallback'); }
  };
  const url = 'https://example.test/stalled-image';
  assert.equal(await cachedSpatialImageUrl(url, options), null);
  assert.equal(requestSignal.aborted, true);
  assert.equal(requestSignal.reason.name, 'TimeoutError');
  assert.equal(await cachedSpatialImageUrl(url, options), null);
  assert.equal(fetches, 1);
  assert.equal(fallbacks, 0);
});

test('image deadline includes stalled cache access and never starts a fetch', async () => {
  const {cachedSpatialImageUrl} = await import('../src/lib/spatial/maSpatialCache.js');
  let fetches = 0;
  const result = await cachedSpatialImageUrl('https://example.test/stalled-cache', {
    timeoutMs: 15,
    cacheStorage: {open: () => new Promise(() => {})},
    fetchImpl: () => { fetches++; throw Error('unexpected fetch'); },
    imageFactory: () => { throw Error('unexpected fallback'); }
  });
  assert.equal(result, null);
  assert.equal(fetches, 0);
});

test('late image body completion cannot turn a timeout into a cached success', async () => {
  const {cachedSpatialImageUrl} = await import('../src/lib/spatial/maSpatialCache.js');
  let finishBody;
  const response = {ok: true, type: 'cors', clone() { return this; }, blob: () => new Promise(resolve => { finishBody = resolve; })};
  const options = {
    timeoutMs: 15,
    cacheStorage: {open: async () => ({match: async () => null, put: async () => {}})},
    fetchImpl: async () => response
  };
  const url = 'https://example.test/stalled-body';
  assert.equal(await cachedSpatialImageUrl(url, options), null);
  finishBody(new Blob(['late image']));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(await cachedSpatialImageUrl(url, options), null);
});

test('all six timed-out requests release the image queue for the next tile', async () => {
  const {cachedSpatialImageUrl} = await import('../src/lib/spatial/maSpatialCache.js');
  const {createImageLoadQueue} = await import('../src/lib/spatial/imageLoadQueue.js');
  let started = 0, aborted = 0;
  const enqueue = createImageLoadQueue({load: url => cachedSpatialImageUrl(url, {
    timeoutMs: 15,
    cacheStorage: memoryCacheStorage(),
    fetchImpl: (_url, {signal}) => {
      started++;
      if (url.endsWith('/next')) return Promise.resolve(new Response('', {status: 404}));
      return new Promise((_, reject) => signal.addEventListener('abort', () => { aborted++; reject(signal.reason); }, {once: true}));
    }
  })});
  const urls = [...Array.from({length: 6}, (_, i) => `https://example.test/queue-stall/${i}`), 'https://example.test/queue-stall/next'];
  assert.deepEqual(await Promise.all(urls.map(url => enqueue(url))), Array(7).fill(null));
  assert.equal(started, 7);
  assert.equal(aborted, 6);
});
