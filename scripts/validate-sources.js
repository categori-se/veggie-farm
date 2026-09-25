import fs from "node:fs";

const sources = [
  ...JSON.parse(fs.readFileSync("src/data/sources.json", "utf8")),
  ...JSON.parse(fs.readFileSync("src/data/evidence-sources.json", "utf8"))
];
const errors = [];

for (const source of sources) {
  if (!source.id) errors.push(`${source.name ?? "source"}: missing id`);
  if (!source.name) errors.push(`${source.id ?? "source"}: missing name`);
  if (!source.officialUrl && !source.citationUrl && !source.url) errors.push(`${source.id}: missing URL`);
  if (!source.license) errors.push(`${source.id}: missing license`);
  if (!source.citationFormat && !source.citation) errors.push(`${source.id}: missing citation format`);
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`validated ${sources.length} source records`);
