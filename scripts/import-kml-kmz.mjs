#!/usr/bin/env node

import {createHash} from "node:crypto";
import {basename, extname, posix, resolve} from "node:path";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname} from "node:path";
import {kmlTextFromKmz, kmlToFeatureCollection} from "../src/lib/spatial/kmlToGeoJson.js";

function usage() {
  return `Usage:
  node scripts/import-kml-kmz.mjs --input source.kmz --output source.geojson \\
    --source-id stable-source-id [--title "Source title"] [--retrieved-at YYYY-MM-DD] \\
    [--extract-archive-to data/raw/spatial/source-name] \\
    [--asset-copy 'archive/path.png=src/assets/reference.png'] \\
    [--previous-output data/spatial/sources/source/revisions/revision-2.geojson] \\
    [--app-output src/data/spatial/sources/source.json]

The output is an evidence-preserving source FeatureCollection in OGC CRS84
(longitude, latitude). Inferred object types are tentative and are not a
substitute for review into canonical parcel/site/bed/plant layers.`;
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return {help: true};
    if (!argument.startsWith("--")) throw new Error(`Unexpected argument: ${argument}`);
    const key = argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    if (key === "assetCopy") (result.assetCopy ||= []).push(value);
    else result[key] = value;
    index += 1;
  }
  return result;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function safeArchiveEntryPath(name) {
  const normalized = posix.normalize(String(name).replaceAll("\\", "/"));
  if (!normalized || normalized === "." || normalized.startsWith("/") || normalized === ".." || normalized.startsWith("../") || normalized.includes("\0")) {
    throw new Error(`Unsafe KMZ archive path: ${name}`);
  }
  return normalized;
}

function mediaTypeFor(name) {
  const extension = extname(name).toLowerCase();
  return ({
    ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".kml": "application/vnd.google-earth.kml+xml",
    ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp"
  })[extension] || "application/octet-stream";
}

function imageDimensions(buffer, mediaType) {
  if (mediaType === "image/png" && buffer.length >= 24 && buffer.subarray(1, 4).toString("ascii") === "PNG") {
    return {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20)};
  }
  return null;
}

function assetCopyMap(specifications = []) {
  return new Map(specifications.map((specification) => {
    const delimiter = specification.indexOf("=");
    if (delimiter <= 0 || delimiter === specification.length - 1) throw new Error(`Invalid --asset-copy value: ${specification}`);
    return [safeArchiveEntryPath(specification.slice(0, delimiter)), specification.slice(delimiter + 1)];
  }));
}

function formatCounts(features) {
  const geometry = {};
  const objects = {};
  for (const feature of features) {
    const geometryType = feature.geometry?.type ?? "null";
    geometry[geometryType] = (geometry[geometryType] ?? 0) + 1;
    const objectType = feature.properties.objectType;
    objects[objectType] = (objects[objectType] ?? 0) + 1;
  }
  return {features: features.length, geometry, objects};
}

function featureIdentity(feature) {
  const source = feature.properties?.source || {};
  return JSON.stringify({
    sourceName: source.nameRaw ?? feature.properties?.name ?? "",
    description: source.descriptionRaw ?? null,
    objectType: feature.properties?.objectType ?? null,
    geometry: feature.geometry,
    declaredGeometryType: feature.geometry ? null : source.geometryOptions?.declaredGeometryType ?? null,
    overlayHref: source.icon?.href ?? null,
    overlayBox: source.latLonBox ?? null
  });
}

async function retainPreviousFeatureIds(collection, previousOutput) {
  if (!previousOutput) return {matched: 0, added: collection.features.length};
  const previous = JSON.parse(await readFile(resolve(previousOutput), "utf8"));
  const currentSourceId = collection.properties.source.id;
  const previousSourceId = previous.properties?.source?.id;
  if (currentSourceId !== previousSourceId) {
    throw new Error(`--previous-output source id ${previousSourceId || "(missing)"} does not match ${currentSourceId}`);
  }
  const previousByIdentity = new Map();
  for (const feature of previous.features ?? []) {
    const identity = featureIdentity(feature);
    if (!previousByIdentity.has(identity)) previousByIdentity.set(identity, []);
    previousByIdentity.get(identity).push(feature);
  }
  const usedIds = new Set();
  let matched = 0;
  for (const feature of collection.features) {
    const match = previousByIdentity.get(featureIdentity(feature))?.shift();
    if (!match || usedIds.has(match.id)) continue;
    feature.id = match.id;
    feature.properties.source.idContinuity = {
      method: "source-name-description-geometry-v1",
      previousFeatureId: match.id,
      previousRevision: previous.properties?.source?.revision ?? null
    };
    usedIds.add(match.id);
    matched += 1;
  }
  // A retained ID can theoretically collide with a later revision's generated
  // fallback ID, so validate the finished set independently of match tracking.
  const finalIds = new Set();
  for (const feature of collection.features) {
    if (finalIds.has(feature.id)) throw new Error(`Feature ID continuity produced duplicate ID ${feature.id}`);
    finalIds.add(feature.id);
  }
  return {matched, added: collection.features.length - matched, previousOutput};
}

export async function importKmlOrKmz(options) {
  if (!options.input) throw new Error("--input is required");
  if (!options.sourceId) throw new Error("--source-id is required");
  const inputPath = resolve(options.input);
  const bytes = await readFile(inputPath);
  const extension = extname(inputPath).toLowerCase();
  const isKmz = extension === ".kmz" || (bytes[0] === 0x50 && bytes[1] === 0x4b);
  const extracted = isKmz
    ? kmlTextFromKmz(bytes)
    : {xml: bytes.toString("utf8"), entry: null, entries: null, files: []};
  const fileName = basename(inputPath);
  const extractionRoot = options.extractArchiveTo ? resolve(options.extractArchiveTo) : null;
  const assetCopies = assetCopyMap(options.assetCopy);
  const archiveEntries = [];
  for (const file of extracted.files ?? []) {
    const entryName = safeArchiveEntryPath(file.name);
    const extractedPath = options.extractArchiveTo ? posix.join(options.extractArchiveTo.replaceAll("\\", "/").replace(/\/$/, ""), entryName) : null;
    if (extractionRoot && !entryName.endsWith("/")) {
      const destination = resolve(extractionRoot, entryName);
      if (destination !== extractionRoot && !destination.startsWith(`${extractionRoot}/`)) throw new Error(`Unsafe KMZ extraction path: ${file.name}`);
      await mkdir(dirname(destination), {recursive: true});
      await writeFile(destination, file.data);
    }
    const deployablePath = assetCopies.get(entryName) || null;
    if (deployablePath && !entryName.endsWith("/")) {
      const destination = resolve(deployablePath);
      await mkdir(dirname(destination), {recursive: true});
      await writeFile(destination, file.data);
    }
    const mediaType = mediaTypeFor(entryName);
    archiveEntries.push({...file.metadata, sha256: sha256(file.data), mediaType, dimensions: imageDimensions(file.data, mediaType), extractedPath, deployablePath});
  }
  const selectedKmlEntry = archiveEntries.find((entry) => entry.name === extracted.entry?.name) ?? null;
  const assets = archiveEntries.filter((entry) => !entry.name.toLowerCase().endsWith(".kml")).map((entry) => ({
    entryName: entry.name,
    mediaType: entry.mediaType,
    sha256: entry.sha256,
    byteLength: entry.uncompressedSize,
    dimensions: entry.dimensions,
    extractedPath: entry.extractedPath,
    deployablePath: entry.deployablePath
  }));
  const source = {
    id: options.sourceId,
    title: options.title || fileName,
    kind: options.sourceKind || "user-supplied-spatial-reference",
    fileName,
    mediaType: isKmz ? "application/vnd.google-earth.kmz" : "application/vnd.google-earth.kml+xml",
    sha256: sha256(bytes),
    byteLength: bytes.length,
    retrievedAt: options.retrievedAt,
    revision: options.revision ? Number(options.revision) : undefined,
    supersedesSha256: options.supersedesSha256,
    attribution: options.attribution,
    rights: options.rights,
    archive: isKmz ? {entries: archiveEntries, selectedKmlEntry} : null,
    embeddedKml: {sha256: sha256(Buffer.from(extracted.xml)), byteLength: Buffer.byteLength(extracted.xml), extractedPath: selectedKmlEntry?.extractedPath},
    assets,
    import: {
      tool: "scripts/import-kml-kmz.mjs",
      toolVersion: 1,
      commandContract: "npm run spatial:import-kml -- --input <file> --output <file> --source-id <id>",
      normalization: "KML vector coordinates copied to RFC 7946 GeoJSON; names, visibility, view metadata, geometry flags, and resolved styles retained under properties.source."
    }
  };
  const collection = kmlToFeatureCollection(extracted.xml, source);
  collection.properties.source.import.idContinuity = await retainPreviousFeatureIds(collection, options.previousOutput);
  collection.properties.inventory = formatCounts(collection.features);
  return collection;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (!options.output) throw new Error("--output is required");
  const collection = await importKmlOrKmz(options);
  const serialized = `${JSON.stringify(collection, null, 2)}\n`;
  if (options.output === "-") process.stdout.write(serialized);
  else {
    const outputPath = resolve(options.output);
    await mkdir(dirname(outputPath), {recursive: true});
    await writeFile(outputPath, serialized);
    process.stdout.write(`Imported ${collection.features.length} features to ${outputPath}\n`);
  }
  if (options.appOutput) {
    const appOutputPath = resolve(options.appOutput);
    await mkdir(dirname(appOutputPath), {recursive: true});
    await writeFile(appOutputPath, serialized);
    process.stdout.write(`Wrote derived application bundle to ${appOutputPath}\n`);
  }
  process.stdout.write(`${JSON.stringify(collection.properties.inventory)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n\n${usage()}\n`);
    process.exitCode = 1;
  });
}
