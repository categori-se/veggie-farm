export const MA_SPATIAL_CACHE_VERSION = "ma-spatial-v1";

export const MA_SPATIAL_ENVELOPE = Object.freeze({
  west: -73.6,
  south: 41.1,
  east: -69.8,
  north: 42.95
});

const objectUrls = new Map();
const inFlight = new Map();
const failedUntil = new Map();
const IMAGE_RETRY_DELAY_MS = 60_000;
const IMAGE_FETCH_TIMEOUT_MS = 15_000;

function cacheStorageOrNull(cacheStorage) {
  if (cacheStorage) return cacheStorage;
  try {
    return globalThis.caches ?? null;
  } catch {
    return null;
  }
}

function fetchOrThrow(fetchImpl) {
  const implementation = fetchImpl ?? globalThis.fetch;
  if (typeof implementation !== "function") throw new TypeError("No fetch implementation is available.");
  return implementation;
}

export function isInsideMassachusettsEnvelope(lon, lat) {
  const longitude = Number(lon);
  const latitude = Number(lat);
  return Number.isFinite(longitude)
    && Number.isFinite(latitude)
    && longitude >= MA_SPATIAL_ENVELOPE.west
    && longitude <= MA_SPATIAL_ENVELOPE.east
    && latitude >= MA_SPATIAL_ENVELOPE.south
    && latitude <= MA_SPATIAL_ENVELOPE.north;
}

export function spatialCacheKey(url, version = MA_SPATIAL_CACHE_VERSION) {
  const resolved = new URL(String(url), globalThis.location?.href ?? "https://veggie.farm/");
  resolved.hash = "";
  resolved.searchParams.set("vf-cache", version);
  return resolved.toString();
}

export async function fetchSpatialAsset(url, options = {}) {
  const requestUrl = String(url);
  const cacheStorage = cacheStorageOrNull(options.cacheStorage);
  const cacheName = options.cacheName ?? MA_SPATIAL_CACHE_VERSION;
  const cacheKey = spatialCacheKey(requestUrl, options.version ?? cacheName);
  const fetchImpl = fetchOrThrow(options.fetchImpl);

  if (!cacheStorage) return fetchImpl(requestUrl, options.fetchOptions);

  const cache = await cacheStorage.open(cacheName);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const response = await fetchImpl(requestUrl, options.fetchOptions);
  if (response?.ok || response?.type === "opaque") {
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

function directImageUrl(url, imageFactory = () => new Image()) {
  return new Promise(resolve => {
    let image;
    try { image = imageFactory(); } catch { resolve(null); return; }
    const finish = value => {
      clearTimeout(timer);
      image.onload = image.onerror = null;
      if (!value) image.removeAttribute?.("src");
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 10_000);
    image.onload = () => finish(url);
    image.onerror = () => finish(null);
    image.src = url;
  });
}

export async function cachedSpatialImageUrl(url, options = {}) {
  const requestUrl = String(url);
  if (objectUrls.has(requestUrl)) return objectUrls.get(requestUrl);
  if ((failedUntil.get(requestUrl) ?? 0) > Date.now()) return null;
  if (inFlight.has(requestUrl)) return inFlight.get(requestUrl);

  const pending = (async () => {
    let resolved = null;
    const controller = new AbortController();
    const callerSignal = options.fetchOptions?.signal;
    const signal = callerSignal ? AbortSignal.any([controller.signal, callerSignal]) : controller.signal;
    const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
      ? options.timeoutMs : IMAGE_FETCH_TIMEOUT_MS;
    let onAbort;
    const aborted = new Promise((_, reject) => {
      onAbort = () => reject(signal.reason);
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, {once: true});
    });
    const timer = setTimeout(() => controller.abort(new DOMException("Imagery request timed out", "TimeoutError")), timeoutMs);
    try {
      // Include cache access and body reading in the deadline, not just headers.
      // No object URL is created by a late result after the race has timed out.
      const result = await Promise.race([aborted, (async () => {
        signal.throwIfAborted();
        const response = await fetchSpatialAsset(requestUrl, {
          ...options,
          fetchOptions: {mode: "cors", credentials: "omit", ...(options.fetchOptions || {}), signal}
        });
        if (response?.type === "opaque") return {opaque: true};
        return response?.ok ? {blob: await response.blob()} : null;
      })()]);
      clearTimeout(timer);
      if (result?.blob && typeof URL?.createObjectURL === "function") {
        resolved = URL.createObjectURL(result.blob);
      } else if (result?.opaque && !signal.aborted) {
        resolved = await directImageUrl(requestUrl, options.imageFactory);
      }
    } catch {
      // Some imagery providers allow image display but not CORS fetches.
      // Probe once, shared across callers; never hand a known failure to each SVG.
      // Cancellation/timeouts must release the queue, not start another request.
      if (!signal.aborted) resolved = await directImageUrl(requestUrl, options.imageFactory);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }
    if (resolved) {
      objectUrls.set(requestUrl, resolved);
      failedUntil.delete(requestUrl);
    } else {
      failedUntil.set(requestUrl, Date.now() + IMAGE_RETRY_DELAY_MS);
    }
    return resolved;
  })();
  inFlight.set(requestUrl, pending);
  try { return await pending; } finally { inFlight.delete(requestUrl); }
}

export async function clearSpatialCache(options = {}) {
  for (const objectUrl of objectUrls.values()) URL.revokeObjectURL?.(objectUrl);
  objectUrls.clear();
  inFlight.clear();
  failedUntil.clear();
  const cacheStorage = cacheStorageOrNull(options.cacheStorage);
  return cacheStorage ? cacheStorage.delete(options.cacheName ?? MA_SPATIAL_CACHE_VERSION) : false;
}
