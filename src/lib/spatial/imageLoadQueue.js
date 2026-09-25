import {cachedSpatialImageUrl} from "./maSpatialCache.js";

// Keep a large map from saturating the connection. Obsolete views lose queued
// work; already-started loads finish into the shared cache for later reuse.
export function createImageLoadQueue({concurrency = 6, load = cachedSpatialImageUrl} = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError("Invalid image concurrency");
  const waiting = [];
  let active = 0;
  function drain() {
    while (active < concurrency && waiting.length) {
      const {url, isCurrent, resolve, reject} = waiting.shift();
      try {
        if (!isCurrent()) { resolve(null); continue; }
      } catch (error) { reject(error); continue; }
      active++;
      Promise.resolve().then(() => load(url)).then(resolve, reject).finally(() => {
        active--;
        drain();
      });
    }
  }
  return (url, isCurrent = () => true) => new Promise((resolve, reject) => {
    waiting.push({url, isCurrent, resolve, reject});
    queueMicrotask(drain);
  });
}
