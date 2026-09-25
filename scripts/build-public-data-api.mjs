import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {FLOWER_CATALOG, FLOWER_DATA_SOURCES} from "../src/data/flowerCatalog.js";
import GARDEN_REFERENCE_SOURCES from "../src/data/garden-reference-sources.json" with {type: "json"};
import PUBLIC_GIS_SOURCE_REGISTRY from "../src/data/public-gis-sources.json" with {type: "json"};
import CATALOG from "../src/data/api/v1/catalog.json" with {type: "json"};
import COLLECTIONS from "../src/data/api/v1/collections.json" with {type: "json"};
import GARDEN_ITEMS from "../src/data/api/v1/collections/gardens/items.json" with {type: "json"};
import MODEL_ITEMS from "../src/data/api/v1/collections/models/items.json" with {type: "json"};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const collectionsDirectory = path.join(root, "src/data/api/v1/collections");
const canonicalGardenDirectory = path.join(root, "data/spatial/gardens");
const gardenReferencePreviewDirectory = path.join(root, "src/assets/garden-references/previews");
const timeStamp = `${CATALOG.updated || "2026-08-24"}T00:00:00Z`;

const spatialLayers = Object.freeze({
  parcels: {
    collectionId: "garden-parcels",
    geometryTypes: new Set(["Polygon", "MultiPolygon"])
  },
  site: {
    collectionId: "garden-site",
    geometryTypes: new Set(["Point", "LineString", "MultiLineString", "Polygon", "MultiPolygon"])
  },
  beds: {
    collectionId: "garden-beds",
    geometryTypes: new Set(["Polygon", "MultiPolygon"])
  },
  plants: {
    collectionId: "garden-plants",
    geometryTypes: new Set(["Point", "MultiPoint"])
  }
});

function collection(features, href) {
  return {
    type: "FeatureCollection",
    timeStamp,
    numberMatched: features.length,
    numberReturned: features.length,
    features,
    links: [{rel: "self", type: "application/geo+json", href}]
  };
}

function visitCoordinates(coordinates, callback) {
  if (!Array.isArray(coordinates)) return;
  if (coordinates.length >= 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
    callback(coordinates);
    return;
  }
  for (const child of coordinates) visitCoordinates(child, callback);
}

function featureBounds(features) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const feature of features) {
    visitCoordinates(feature.geometry?.coordinates, ([lon, lat]) => {
      bounds[0] = Math.min(bounds[0], lon);
      bounds[1] = Math.min(bounds[1], lat);
      bounds[2] = Math.max(bounds[2], lon);
      bounds[3] = Math.max(bounds[3], lat);
    });
  }
  return bounds.every(Number.isFinite) ? bounds : undefined;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function validateCanonicalLayer(collectionValue, {file, gardenId, layer, geometryTypes}) {
  if (collectionValue?.type !== "FeatureCollection" || !Array.isArray(collectionValue.features)) {
    throw new TypeError(`${file}: canonical ${layer} layer must be a GeoJSON FeatureCollection`);
  }
  if (collectionValue.properties?.gardenId && collectionValue.properties.gardenId !== gardenId) {
    throw new TypeError(`${file}: collection gardenId must be ${gardenId}`);
  }
  if (collectionValue.properties?.layer && collectionValue.properties.layer !== layer) {
    throw new TypeError(`${file}: collection layer must be ${layer}`);
  }
  const ids = new Set();
  for (const [index, feature] of collectionValue.features.entries()) {
    if (feature?.type !== "Feature") throw new TypeError(`${file}: features[${index}] must be a Feature`);
    if (typeof feature.id !== "string" || !feature.id.trim()) {
      throw new TypeError(`${file}: features[${index}] has no stable string id`);
    }
    const id = feature.id.trim();
    if (ids.has(id)) throw new TypeError(`${file}: duplicate feature id ${id}`);
    ids.add(id);
    if (!geometryTypes.has(feature.geometry?.type)) {
      throw new TypeError(`${file}: ${id} has unsupported ${feature.geometry?.type || "null"} geometry for ${layer}`);
    }
    if (feature.properties?.gardenId !== gardenId) {
      throw new TypeError(`${file}: ${id} properties.gardenId must be ${gardenId}`);
    }
    if (feature.properties?.layer !== layer) {
      throw new TypeError(`${file}: ${id} properties.layer must be ${layer}`);
    }
    visitCoordinates(feature.geometry.coordinates, ([lon, lat]) => {
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new TypeError(`${file}: ${id} has a coordinate outside OGC CRS84 bounds`);
      }
    });
  }
  return collectionValue.features;
}

/**
 * Aggregate each garden's four canonical CRS84 layers into API-wide layer
 * collections. A source directory is deliberately all-or-nothing: publishing
 * parcels without its matching site/bed/plant files would imply a completeness
 * the canonical dataset does not have. An absent root is allowed for a fresh
 * checkout, but once any layer exists its garden must satisfy the full contract.
 */
async function canonicalGardenLayerItems() {
  const featuresByLayer = Object.fromEntries(Object.keys(spatialLayers).map((layer) => [layer, []]));
  let directories = [];
  try {
    directories = (await fs.readdir(canonicalGardenDirectory, {withFileTypes: true}))
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  for (const directory of directories) {
    const gardenId = directory.name;
    const layerFiles = Object.fromEntries(Object.keys(spatialLayers).map((layer) => [
      layer,
      path.join(canonicalGardenDirectory, gardenId, `${layer}.geojson`)
    ]));
    const layerValues = {};
    const missing = [];
    for (const [layer, file] of Object.entries(layerFiles)) {
      try {
        layerValues[layer] = await readJson(file);
      } catch (error) {
        if (error.code !== "ENOENT") throw new Error(`${file}: ${error.message}`, {cause: error});
        missing.push(layer);
      }
    }
    if (missing.length === Object.keys(spatialLayers).length) continue;
    if (missing.length) {
      throw new Error(`${gardenId}: canonical spatial dataset is incomplete; missing ${missing.map((layer) => `${layer}.geojson`).join(", ")}`);
    }
    for (const [layer, definition] of Object.entries(spatialLayers)) {
      featuresByLayer[layer].push(...validateCanonicalLayer(layerValues[layer], {
        file: layerFiles[layer],
        gardenId,
        layer,
        geometryTypes: definition.geometryTypes
      }));
    }
  }

  return Object.fromEntries(Object.entries(spatialLayers).map(([layer, definition]) => {
    const features = featuresByLayer[layer].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const items = collection(features, "./items.json");
    const bbox = featureBounds(features);
    if (bbox) items.bbox = bbox;
    items.links.push(
      {rel: "collection", type: "application/json", href: "../../collections.json"},
      {rel: "describedby", type: "application/schema+json", href: "../../schemas/garden-spatial-feature.schema.json"}
    );
    return [layer, items];
  }));
}

function featureSourceIds(feature) {
  const properties = feature.properties || {};
  return [...new Set([
    properties.provenance?.sourceId,
    ...(properties.provenance?.sources || []).map((source) => typeof source === "string" ? source : source.id || source.sourceId),
    ...(properties.sourceReferences || []).map((source) => typeof source === "string" ? source : source.id || source.sourceId)
  ].filter(Boolean).map(String))];
}

function publicSourceRegistry(canonicalSpatialItems) {
  const sources = new Map();
  for (const source of Object.values(FLOWER_DATA_SOURCES)) {
    sources.set(source.id, {
      type: "Feature",
      id: source.id,
      geometry: null,
      properties: {...source, title: source.title}
    });
  }
  for (const source of GARDEN_REFERENCE_SOURCES) {
    sources.set(source.id, {
      type: "Feature",
      id: source.id,
      geometry: null,
      properties: {
        ...source,
        url: source.originalUrl,
        access: source.rights?.redistribution === "open-public-data"
          ? "Public data with attribution"
          : source.archive?.preview
          ? "Public reference with a locally preserved preview"
          : source.archive?.status === "private-research-copy"
          ? "Public reference; local research copy is not redistributed"
          : "Public reference with a project-authored local record",
        fields: source.supports,
        usedBy: []
      }
    });
  }
  for (const source of PUBLIC_GIS_SOURCE_REGISTRY.sources || []) {
    sources.set(source.id, {
      type: "Feature",
      id: source.id,
      geometry: null,
      properties: {
        id: source.id,
        title: source.name,
        publisher: source.authority,
        url: source.sourcePage,
        originalUrl: source.sourcePage,
        endpoint: source.endpoint,
        sourceType: source.kind,
        role: source.role,
        access: source.rights?.redistributable
          ? "Public GIS data with provider attribution and license conditions"
          : "Provider-hosted visual service; redistribution is not permitted",
        summary: `Public GIS ${source.role.replaceAll("-", " ")} source for bounded garden-site evidence.`,
        description: source.cache?.note || "",
        supports: source.fitness?.resolves || [],
        fields: source.fitness?.resolves || [],
        doesNotResolve: source.fitness?.doesNotResolve || [],
        query: source.query || null,
        tile: source.tile || null,
        cache: source.cache || null,
        usedBy: [],
        rights: {
          redistribution: source.rights?.redistributable ? "open-public-data" : "restricted",
          copyrightHolder: source.authority,
          note: [source.rights?.license, source.rights?.attribution].filter(Boolean).join("; ")
        },
        licenseUrl: source.rights?.licenseUrl || null
      }
    });
  }
  for (const garden of GARDEN_ITEMS.features) {
    for (const source of garden.properties.sources || []) {
      const previous = sources.get(source.id);
      if (!previous) throw new Error(`Garden ${garden.id} references unregistered source ${source.id}`);
      if (previous.properties.originalUrl !== source.url) {
        throw new Error(`Garden ${garden.id} source URL differs from registry for ${source.id}`);
      }
      const usedBy = [...new Set([...(previous?.properties?.usedBy || []), garden.id])];
      sources.set(source.id, {
        ...previous,
        properties: {
          ...previous.properties,
          usedBy
        }
      });
    }
  }
  for (const items of Object.values(canonicalSpatialItems || {})) {
    for (const feature of items.features || []) {
      for (const sourceId of featureSourceIds(feature)) {
        const previous = sources.get(sourceId);
        // A user-supplied/private evidence source may be deliberately absent
        // from the public source registry. Retain its id on the spatial feature
        // without manufacturing a public URL or rights statement for it.
        if (!previous) continue;
        sources.set(sourceId, {
          ...previous,
          properties: {
            ...previous.properties,
            usedBy: [...new Set([...(previous.properties.usedBy || []), feature.properties.gardenId])].sort()
          }
        });
      }
    }
  }
  return [...sources.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const flowerFeatures = FLOWER_CATALOG.map(({id, ...properties}) => ({
  type: "Feature",
  id,
  geometry: null,
  properties
}));

await fs.mkdir(path.join(collectionsDirectory, "flowers"), {recursive: true});
await fs.mkdir(path.join(collectionsDirectory, "sources"), {recursive: true});
const flowerItems = collection(flowerFeatures, "./items.json");
const canonicalSpatialItems = await canonicalGardenLayerItems();
const sourceItems = collection(publicSourceRegistry(canonicalSpatialItems), "./items.json");
for (const definition of Object.values(spatialLayers)) {
  await fs.mkdir(path.join(collectionsDirectory, definition.collectionId), {recursive: true});
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function inlineSourcePreview(source) {
  const preview = source.archive?.preview;
  if (!preview) return null;
  const absolute = path.resolve(root, preview.file || "");
  if (!absolute.startsWith(`${gardenReferencePreviewDirectory}${path.sep}`)) {
    throw new Error(`${source.id}: preview path escapes src/assets/garden-references/previews`);
  }
  if (preview.mediaType !== "image/webp") {
    throw new Error(`${source.id}: unsupported preview media type ${preview.mediaType || "missing"}`);
  }
  const buffer = await fs.readFile(absolute);
  if (buffer.subarray(0, 4).toString() !== "RIFF" || buffer.subarray(8, 12).toString() !== "WEBP") {
    throw new Error(`${source.id}: preview file is not WebP`);
  }
  return {
    ...preview,
    dataUrl: `data:${preview.mediaType};base64,${buffer.toString("base64")}`
  };
}

async function sourceArchiveHtml(records) {
  const previews = new Map((await Promise.all(records.map(async (source) => (
    [source.id, await inlineSourcePreview(source)]
  )))).filter(([, preview]) => preview));
  const indexLinks = records.map((source) => `
    <a href="#${escapeHtml(source.archive.fragment)}">
      <span>${escapeHtml(source.sourceType.replaceAll("-", " "))}</span>
      <strong>${escapeHtml(source.title)}</strong>
      <small>${escapeHtml(source.publisher)}</small>
    </a>
  `).join("");
  const articles = records.map((source) => {
    const preview = previews.get(source.id);
    const previewId = `preview-${source.archive.fragment}`;
    const previewMarkup = preview ? `
        <figure class="reference-preview" data-source-preview="${escapeHtml(source.id)}">
          <div class="reference-preview-heading">
            <div>
              <span>Locally preserved map</span>
              <strong>Page ${escapeHtml(preview.sourcePage)} preview</strong>
            </div>
            <button type="button" data-preview-toggle aria-controls="${escapeHtml(previewId)}" aria-expanded="false">View full resolution</button>
          </div>
          <div class="reference-preview-scroll" id="${escapeHtml(previewId)}">
            <img src="${preview.dataUrl}" alt="${escapeHtml(preview.alt)}" width="${escapeHtml(preview.width)}" height="${escapeHtml(preview.height)}" decoding="sync" fetchpriority="high">
          </div>
          <figcaption>${escapeHtml(preview.caption)}</figcaption>
        </figure>
    ` : "";
    const archiveLabel = preview
      ? "Locally preserved map preview available on this page; full research copy retained"
      : source.archive?.status === "private-research-copy"
      ? "Research copy retained locally; not redistributed"
      : source.archive?.status === "local-data-and-record"
      ? "Local data and source record"
      : "Local source record";
    return `
      <article id="${escapeHtml(source.archive.fragment)}">
        <a class="back-link" href="#">← All local source records</a>
        <p class="eyebrow">${escapeHtml(source.sourceType.replaceAll("-", " "))} · ${escapeHtml(source.publisher)}</p>
        <h1>${escapeHtml(source.title)}</h1>
        <p class="summary">${escapeHtml(source.summary)}</p>
        <p>${escapeHtml(source.description)}</p>
        ${previewMarkup}
        <dl>
          <div><dt>Used for</dt><dd>${source.supports.map(escapeHtml).join(" · ")}</dd></div>
          <div><dt>Local preservation</dt><dd>${escapeHtml(archiveLabel)} (${escapeHtml(source.archive.scope.replaceAll("-", " "))})</dd></div>
          <div><dt>Retrieved</dt><dd>${escapeHtml(source.retrievedAt)}</dd></div>
          <div><dt>Rights</dt><dd>${escapeHtml(source.rights.note)}</dd></div>
        </dl>
        <a href="${escapeHtml(source.originalUrl)}" target="_blank" rel="noopener noreferrer">Open authoritative original ↗</a>
      </article>
    `;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Garden reference archive · veggie.farm</title>
  <style>
    :root { color-scheme: light dark; --paper:#f4f6ef; --ink:#1d2920; --muted:#627067; --line:#bdc9ba; --accent:#2e704d; }
    @media (prefers-color-scheme: dark) { :root { --paper:#111a13; --ink:#e5eadf; --muted:#a9b6a8; --line:#3c4c3d; --accent:#9bc18d; } }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.55 system-ui,sans-serif; }
    main { width:min(1120px,calc(100% - 32px)); margin:48px auto; }
    .archive-index,article { padding:clamp(22px,5vw,52px); border:1px solid var(--line); border-radius:18px; background:color-mix(in srgb,var(--paper) 92%,var(--accent)); }
    article > :not(.reference-preview) { max-width:760px; }
    .archive-index { display:grid; gap:18px; }
    .archive-index p { margin:0; color:var(--muted); }
    .reference-index { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:8px; }
    .reference-index a { display:grid; gap:2px; padding:12px; border:1px solid var(--line); border-radius:10px; color:var(--ink); text-decoration:none; }
    .reference-index a:hover { border-color:var(--accent); }
    .reference-index span { color:var(--accent); font-size:.7rem; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
    .reference-index small { color:var(--muted); }
    article { display:none; }
    article:target { display:block; }
    body:has(article:target) .archive-index { display:none; }
    .eyebrow,dt { color:var(--accent); font-size:.75rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    h1 { margin:.25rem 0 1rem; font-family:Georgia,serif; font-size:clamp(2rem,7vw,3.5rem); line-height:1; }
    .summary { font-size:1.12rem; }
    dl { display:grid; gap:12px; margin:28px 0; }
    dl div { padding-top:12px; border-top:1px solid var(--line); }
    dd { margin:3px 0 0; color:var(--muted); }
    a { color:var(--accent); font-weight:750; }
    .back-link { display:inline-block; margin-bottom:18px; font-size:.8rem; text-decoration:none; }
    .reference-preview { margin:30px 0; border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--paper); }
    .reference-preview-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 14px; border-bottom:1px solid var(--line); }
    .reference-preview-heading div { display:grid; gap:1px; }
    .reference-preview-heading span { color:var(--accent); font-size:.7rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
    .reference-preview-heading strong { font-size:.92rem; }
    .reference-preview button { appearance:none; padding:8px 11px; border:1px solid var(--line); border-radius:8px; background:transparent; color:var(--ink); font:inherit; font-size:.78rem; font-weight:750; cursor:pointer; }
    .reference-preview button:hover { border-color:var(--accent); color:var(--accent); }
    .reference-preview-scroll { overflow:auto; background:#fff; }
    .reference-preview img { display:block; width:100%; height:auto; }
    .reference-preview.is-full-size img { width:auto; max-width:none; }
    figcaption { padding:11px 14px; border-top:1px solid var(--line); color:var(--muted); font-size:.78rem; }
    @media (max-width:560px) { .reference-preview-heading { align-items:flex-start; flex-direction:column; } }
  </style>
</head>
<body><main>
  <section class="archive-index">
    <div>
      <p class="eyebrow">veggie.farm · locally maintained provenance</p>
      <h1>Garden reference archive</h1>
      <p>Project-authored records for the public websites, maps, plans, and datasets used by the Garden Planning Studio. Choose a source below; each record keeps its authoritative original URL as secondary provenance.</p>
    </div>
    <nav class="reference-index" aria-label="Garden reference records">${indexLinks}</nav>
  </section>
  ${articles}
</main>
<script>
  for (const button of document.querySelectorAll("[data-preview-toggle]")) {
    button.addEventListener("click", () => {
      const figure = button.closest(".reference-preview");
      const expanded = !figure.classList.contains("is-full-size");
      figure.classList.toggle("is-full-size", expanded);
      button.setAttribute("aria-expanded", String(expanded));
      button.textContent = expanded ? "Fit to page" : "View full resolution";
    });
  }
</script>
</body>
</html>\n`;
}

await fs.writeFile(
  path.join(collectionsDirectory, "flowers/items.json"),
  `${JSON.stringify(flowerItems, null, 2)}\n`
);
await fs.writeFile(
  path.join(collectionsDirectory, "sources/items.json"),
  `${JSON.stringify(sourceItems, null, 2)}\n`
);
for (const [layer, definition] of Object.entries(spatialLayers)) {
  await fs.writeFile(
    path.join(collectionsDirectory, definition.collectionId, "items.json"),
    `${JSON.stringify(canonicalSpatialItems[layer], null, 2)}\n`
  );
}
const gardenReferenceAssetsDirectory = path.join(root, "src/assets/garden-references");
await fs.mkdir(gardenReferenceAssetsDirectory, {recursive: true});
await fs.writeFile(
  path.join(gardenReferenceAssetsDirectory, "reference-archive.html"),
  await sourceArchiveHtml(GARDEN_REFERENCE_SOURCES)
);

const generatedDirectory = path.join(root, "src/data/api/v1/generated");
await fs.mkdir(generatedDirectory, {recursive: true});
await fs.writeFile(path.join(generatedDirectory, "collections.js"), `// Generated by scripts/build-public-data-api.mjs. Do not edit by hand.\n\nexport const CATALOG = Object.freeze(${JSON.stringify(CATALOG, null, 2)});\n\nexport const COLLECTIONS = Object.freeze(${JSON.stringify(COLLECTIONS, null, 2)});\n\nexport const GARDEN_ITEMS = Object.freeze(${JSON.stringify(GARDEN_ITEMS, null, 2)});\n\nexport const GARDEN_PARCEL_ITEMS = Object.freeze(${JSON.stringify(canonicalSpatialItems.parcels, null, 2)});\n\nexport const GARDEN_SITE_ITEMS = Object.freeze(${JSON.stringify(canonicalSpatialItems.site, null, 2)});\n\nexport const GARDEN_BED_ITEMS = Object.freeze(${JSON.stringify(canonicalSpatialItems.beds, null, 2)});\n\nexport const GARDEN_PLANT_ITEMS = Object.freeze(${JSON.stringify(canonicalSpatialItems.plants, null, 2)});\n\nexport const FLOWER_ITEMS = Object.freeze(${JSON.stringify(flowerItems, null, 2)});\n\nexport const SOURCE_ITEMS = Object.freeze(${JSON.stringify(sourceItems, null, 2)});\n\nexport const MODEL_ITEMS = Object.freeze(${JSON.stringify(MODEL_ITEMS, null, 2)});\n`);

const spatialSummary = Object.entries(canonicalSpatialItems)
  .map(([layer, items]) => `${items.features.length} ${layer}`)
  .join(", ");
console.log(`Built public data API: ${GARDEN_ITEMS.features.length} gardens, ${spatialSummary}, ${flowerFeatures.length} flowers, ${sourceItems.features.length} sources, ${MODEL_ITEMS.features.length} models.`);
