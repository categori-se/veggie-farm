import fs from "node:fs";

const citations = JSON.parse(fs.readFileSync("src/data/source-citations.json", "utf8"));
const errors = [];

for (const citation of citations) {
  const label = citation.id ?? citation.name ?? "citation";
  if (!citation.id) errors.push(`${label}: missing id`);
  if (!citation.citation) errors.push(`${label}: missing citation`);
  if (!citation.license) errors.push(`${label}: missing license`);
  if (!citation.url) errors.push(`${label}: missing url`);
  if (citation.type === "plant-fact-source" && !citation.plantId) errors.push(`${label}: missing plantId`);
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`checked ${citations.length} citations`);
