import assert from "node:assert/strict";
import test from "node:test";
import {createImageLoadQueue} from "../src/lib/spatial/imageLoadQueue.js";

const tick = () => new Promise(resolve => setImmediate(resolve));

test("a full parcel loads completely with at most six active images", async () => {
  let active = 0, peak = 0, count = 0;
  const enqueue = createImageLoadQueue({load: async url => {
    count++;
    peak = Math.max(peak, ++active);
    await tick();
    active--;
    return url;
  }});
  const urls = Array.from({length: 294}, (_, i) => `tile-${i}`);
  assert.deepEqual(await Promise.all(urls.map(url => enqueue(url))), urls);
  assert.equal(count, 294);
  assert.equal(peak, 6);
});

test("switching views skips obsolete queued tiles and allows the current view to load", async () => {
  const started = [];
  let release;
  let current = true;
  const enqueue = createImageLoadQueue({concurrency: 1, load: async url => {
    started.push(url);
    if (url === "in-flight") await new Promise(resolve => { release = resolve; });
    return url;
  }});
  const first = enqueue("in-flight", () => current);
  const stale = Array.from({length: 293}, (_, i) => enqueue(`old-${i}`, () => current));
  await tick();
  current = false;
  const latest = enqueue("new-view");
  release();
  assert.equal(await first, "in-flight");
  assert.deepEqual(await Promise.all(stale), Array(293).fill(null));
  assert.equal(await latest, "new-view");
  assert.deepEqual(started, ["in-flight", "new-view"]);
});

test("a load failure releases its slot without stalling later tiles", async () => {
  const enqueue = createImageLoadQueue({concurrency: 1, load: url => {
    if (url === "failed") throw new Error("provider failed");
    return url;
  }});
  const results = await Promise.allSettled([enqueue("failed"), enqueue("next")]);
  assert.equal(results[0].status, "rejected");
  assert.equal(results[1].value, "next");
});
