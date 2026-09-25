#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  PUBLIC_GIS_CACHE_VERSION,
  buildPublicGisRequest,
  fetchPublicGisFeatureCollection,
  publicGisSource
} from "../src/lib/spatial/publicGisSources.js";

function usage() {
  return `Usage:
  npm run spatial:fetch-public -- \\
    --garden berkshire-botanical-garden \\
    --bbox=-73.340,42.296,-73.331,42.304 \\
    --source massgis-l3-parcels \\
    --source massgis-building-structures

Options:
  --garden <slug>      Required garden snapshot directory.
  --bbox <w,s,e,n>     Required CRS84 longitude/latitude envelope.
  --source <id>        Required; repeat for each queryable source.
  --out-root <path>    Defaults to data/spatial/source-cache.
  --refresh            Replace an existing local source snapshot.
  --dry-run            Validate and print request summaries; do not fetch.
  --help               Show this message.
`;
}

function optionValue(argv, index, name) {
  const argument = argv[index];
  if (argument === name) return {value: argv[index + 1], consumed: 2};
  if (argument.startsWith(`${name}=`)) return {value: argument.slice(name.length + 1), consumed: 1};
  return null;
}

export function parsePublicGisArguments(argv) {
  const parsed = {sources: [], outRoot: "data/spatial/source-cache", refresh: false, dryRun: false, help: false};
  for (let index = 0; index < argv.length;) {
    const argument = argv[index];
    if (argument === "--refresh") { parsed.refresh = true; index += 1; continue; }
    if (argument === "--dry-run") { parsed.dryRun = true; index += 1; continue; }
    if (argument === "--help" || argument === "-h") { parsed.help = true; index += 1; continue; }
    const garden = optionValue(argv, index, "--garden");
    if (garden) { parsed.garden = garden.value; index += garden.consumed; continue; }
    const bbox = optionValue(argv, index, "--bbox");
    if (bbox) { parsed.bbox = bbox.value?.split(",").map(Number); index += bbox.consumed; continue; }
    const source = optionValue(argv, index, "--source");
    if (source) { parsed.sources.push(source.value); index += source.consumed; continue; }
    const outRoot = optionValue(argv, index, "--out-root");
    if (outRoot) { parsed.outRoot = outRoot.value; index += outRoot.consumed; continue; }
    throw new TypeError(`Unknown argument: ${argument}`);
  }
  if (parsed.help) return parsed;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.garden || "")) {
    throw new TypeError("--garden must be a lowercase hyphenated slug.");
  }
  if (!parsed.bbox) throw new TypeError("--bbox is required.");
  if (!parsed.sources.length) throw new TypeError("At least one --source is required.");
  parsed.sources = [...new Set(parsed.sources)];
  parsed.sources.forEach(publicGisSource);
  return parsed;
}

async function fileExists(file) {
  try { return (await stat(file)).isFile(); } catch { return false; }
}

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
}

async function atomicJson(file, value) {
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

async function fileIntegrity(file) {
  const bytes = await readFile(file);
  return {
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
}

async function upsertManifestSource(manifest, {source, sourceId, outputFile, collection, request}) {
  const integrity = await fileIntegrity(outputFile);
  manifest.sources = manifest.sources.filter((entry) => entry.sourceId !== sourceId);
  manifest.sources.push({
    sourceId,
    sourceName: source.name,
    sourcePage: source.sourcePage,
    endpoint: source.endpoint,
    file: `${sourceId}.geojson`,
    featureCount: collection.features.length,
    bbox: collection.bbox,
    sourceTimestamp: collection.properties.sourceTimestamp || collection.properties.retrievedAt || null,
    savedAt: collection.properties.savedAt,
    queryFingerprint: collection.properties.queryFingerprint || fingerprint(sourceId, request.bbox),
    byteLength: integrity.byteLength,
    sha256: integrity.sha256,
    attribution: collection.properties.attribution,
    license: collection.properties.license,
    licenseUrl: collection.properties.licenseUrl
  });
}

function fingerprint(sourceId, bbox) {
  return createHash("sha256")
    .update(JSON.stringify({cacheVersion: PUBLIC_GIS_CACHE_VERSION, sourceId, bbox}))
    .digest("hex");
}

function sameBbox(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === 4
    && left.every((coordinate, index) => Number(coordinate) === Number(right[index]));
}

export async function fetchPublicGisSnapshots(options) {
  const outputDirectory = path.resolve(options.outRoot, options.garden);
  await mkdir(outputDirectory, {recursive: true});
  const manifestFile = path.join(outputDirectory, "manifest.json");
  const manifest = await readJson(manifestFile, {
    schemaVersion: "1.0.0",
    gardenId: options.garden,
    coordinateReferenceSystem: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
    sources: []
  });

  for (const sourceId of options.sources) {
    const source = publicGisSource(sourceId);
    const request = buildPublicGisRequest(sourceId, options.bbox);
    const outputFile = path.join(outputDirectory, `${sourceId}.geojson`);
    if (options.dryRun) {
      console.log(`${sourceId}: ${source.kind}; ${request.bbox.join(",")}; ${new URL(request.url).origin}`);
      continue;
    }
    if (!options.refresh && await fileExists(outputFile)) {
      const existing = await readJson(outputFile, null);
      if (existing?.properties?.sourceId === sourceId && sameBbox(existing.bbox, request.bbox)) {
        await upsertManifestSource(manifest, {
          source,
          sourceId,
          outputFile,
          collection: existing,
          request
        });
        console.log(`${sourceId}: reused ${path.relative(process.cwd(), outputFile)} (pass --refresh to contact the provider)`);
        continue;
      }
      throw new Error(`${sourceId}: the existing snapshot has a different or invalid source/bbox; review it and pass --refresh to replace it.`);
    }
    const collection = await fetchPublicGisFeatureCollection(sourceId, options.bbox, {
      userAgent: process.env.VEGGIE_FARM_GIS_USER_AGENT
        || "veggie.farm-spatial-import/0.1 (+https://veggie.farm/about/data-sources)"
    });
    collection.properties.gardenId = options.garden;
    collection.properties.savedAt = new Date().toISOString();
    collection.properties.queryFingerprint = fingerprint(sourceId, options.bbox);
    await atomicJson(outputFile, collection);
    await upsertManifestSource(manifest, {source, sourceId, outputFile, collection, request});
    console.log(`${sourceId}: saved ${collection.features.length} features to ${path.relative(process.cwd(), outputFile)}`);
  }
  if (!options.dryRun) {
    manifest.sources.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
    manifest.updatedAt = new Date().toISOString();
    await atomicJson(manifestFile, manifest);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const options = parsePublicGisArguments(process.argv.slice(2));
    if (options.help) console.log(usage());
    else await fetchPublicGisSnapshots(options);
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 1;
  }
}
