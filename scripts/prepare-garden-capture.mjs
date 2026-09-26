#!/usr/bin/env node
import {readFile, writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {prepareGardenCapture} from "../src/lib/spatial/gardenCapture.js";
const args = process.argv.slice(2);
if (args.length !== 5) {
  console.error("Usage: node scripts/prepare-garden-capture.mjs GARDEN SELECTED-PARCELS.geojson BUILDINGS.geojson HTTPS-SOURCE-URL NEW-OUTPUT.json");
  process.exitCode = 1;
} else {
  const [gardenId, parcelFile, buildingFile, sourceUrl, output] = args;
  const inputs = await Promise.all([parcelFile, buildingFile].map(async file => {
    const bytes = await readFile(file);
    if (bytes.length > 10 * 1024 * 1024) throw new Error("Input exceeds 10 MB capture limit");
    return {value: JSON.parse(bytes), sha256: createHash("sha256").update(bytes).digest("hex")};
  }));
  const capture = prepareGardenCapture({gardenId, parcels: inputs[0].value, buildings: inputs[1].value, sourceUrl, capturedAt: new Date().toISOString()});
  capture.inputSha256 = {parcels: inputs[0].sha256, buildings: inputs[1].sha256};
  await writeFile(output, JSON.stringify(capture, null, 2) + "\n", {flag: "wx", mode: 0o600});
  console.log(JSON.stringify(capture.analysis));
}
