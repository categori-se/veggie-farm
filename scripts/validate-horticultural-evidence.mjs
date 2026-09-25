import fs from "node:fs";

const dataset = JSON.parse(fs.readFileSync("src/data/horticultural-evidence.json", "utf8"));
const crops = JSON.parse(fs.readFileSync("src/data/vegetables.json", "utf8"));
const evidenceSources = JSON.parse(fs.readFileSync("src/data/evidence-sources.json", "utf8"));
const validCrops = new Set(crops.map((crop) => crop.slug));
const validSources = new Set(evidenceSources.map((source) => source.id));
const ids = new Set();
const errors = [];

if (dataset.schemaVersion !== "1.0.0") errors.push("unsupported or missing schemaVersion");
if (!Array.isArray(dataset.evidence) || !dataset.evidence.length) errors.push("evidence must be a non-empty array");

for (const record of dataset.evidence ?? []) {
  if (!record.id || ids.has(record.id)) errors.push(`missing or duplicate id: ${record.id}`);
  ids.add(record.id);
  if (!validCrops.has(record.cropSlug)) errors.push(`${record.id}: unknown cropSlug ${record.cropSlug}`);
  if (!record.trait) errors.push(`${record.id}: missing trait`);
  if (!record.sourceId || !record.sourceUrl) errors.push(`${record.id}: missing source provenance`);
  if (!validSources.has(record.sourceId)) errors.push(`${record.id}: unknown evidence source ${record.sourceId}`);
  if (!record.retrievedAt || !record.reviewStatus || !record.confidenceClass) errors.push(`${record.id}: incomplete review metadata`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`error: ${error}`));
  process.exit(1);
}

const covered = new Set(dataset.evidence.map((record) => record.cropSlug));
const missingCrops = [...validCrops].filter((cropSlug) => !covered.has(cropSlug));
if (missingCrops.length) {
  console.error(`error: core crops without reviewed evidence: ${missingCrops.join(", ")}`);
  process.exit(1);
}
console.log(`validated ${dataset.evidence.length} horticultural evidence records across ${covered.size} core crops`);
