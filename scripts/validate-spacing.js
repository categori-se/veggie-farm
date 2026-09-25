import fs from "node:fs";

const rows = JSON.parse(fs.readFileSync("src/data/spacing.json", "utf8"));
const errors = [];
const warnings = [];

for (const row of rows) {
  if (!row.plantId) errors.push("spacing row missing plantId");
  if (!row.name) errors.push(`${row.plantId}: missing name`);
  const hasNumeric = row.plantSpacingInchesMin != null || row.plantSpacingInchesMax != null;
  const hasText = Boolean(row.plantSpacingText);
  if (!hasNumeric && !hasText) warnings.push(`${row.name}: source did not list spacing`);
  if (hasNumeric && (Number.isNaN(Number(row.plantSpacingInchesMin)) || Number.isNaN(Number(row.plantSpacingInchesMax)))) {
    errors.push(`${row.name}: spacing inches are not numeric`);
  }
  if (!hasNumeric && hasText && !/(in|inch|apart|thin|space|surface|not listed|\d)/i.test(row.plantSpacingText)) {
    errors.push(`${row.name}: spacing text lacks a recognizable unit or spacing instruction`);
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`validated ${rows.length} spacing records with ${warnings.length} warnings`);
