import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {fetchPublicGisSnapshots} from "../scripts/fetch-public-gis.mjs";

test("a reused bounded snapshot receives byte-level manifest provenance without refetching", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "veggie-farm-gis-snapshot-"));
  context.after(() => fs.rm(root, {recursive: true, force: true}));
  const garden = "test-garden";
  const sourceId = "massgis-l3-parcels";
  const bbox = [-73.34, 42.296, -73.331, 42.304];
  const directory = path.join(root, garden);
  await fs.mkdir(directory, {recursive: true});
  const snapshot = {
    type: "FeatureCollection",
    bbox,
    properties: {
      sourceId,
      sourceName: "MassGIS Level 3 Property Tax Parcels",
      retrievedAt: "Mon, 24 Aug 2026 04:11:10 GMT",
      savedAt: "2026-08-24T04:11:10.563Z",
      attribution: "MassGIS",
      license: "Massachusetts public record",
      licenseUrl: "https://www.mass.gov/info-details/about-massgis"
    },
    features: []
  };
  const snapshotFile = path.join(directory, `${sourceId}.geojson`);
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  await fs.writeFile(snapshotFile, serialized);

  await fetchPublicGisSnapshots({garden, bbox, sources: [sourceId], outRoot: root});
  const manifest = JSON.parse(await fs.readFile(path.join(directory, "manifest.json"), "utf8"));
  const entry = manifest.sources[0];
  assert.equal(entry.byteLength, Buffer.byteLength(serialized));
  assert.equal(entry.sha256, createHash("sha256").update(serialized).digest("hex"));
  assert.equal(entry.sourcePage, "https://www.mass.gov/info-details/massgis-data-property-tax-parcels");
  assert.equal(entry.featureCount, 0);
});
