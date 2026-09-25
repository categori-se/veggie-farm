import fs from "node:fs";

const plants = JSON.parse(fs.readFileSync("src/data/plants.json", "utf8"));
const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];
const ids = new Set();

for (const [index, plant] of plants.entries()) {
  const label = plant.name ?? `row ${index}`;
  if (!plant.id) errors.push(`${label}: missing id`);
  if (ids.has(plant.id)) errors.push(`${label}: duplicate id ${plant.id}`);
  ids.add(plant.id);
  if (!plant.name) errors.push(`${label}: missing name`);
  if (!plant.sourceUrl) errors.push(`${label}: missing sourceUrl`);
  if (!plant.scientificName) {
    const message = `${label}: missing scientificName`;
    if (strict || plant.reviewStatus === "reviewed") errors.push(message);
    else warnings.push(message);
  }
  if (!plant.germinationDays?.text && plant.germinationDays?.min == null) warnings.push(`${label}: missing germination window`);
  if (!plant.spacingInches?.text && plant.spacingInches?.min == null) warnings.push(`${label}: missing spacing`);
}

for (const warning of warnings.slice(0, 25)) console.warn(`warning: ${warning}`);
if (warnings.length > 25) console.warn(`warning: ${warnings.length - 25} additional plant warnings omitted`);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`validated ${plants.length} plant records with ${warnings.length} warnings`);
