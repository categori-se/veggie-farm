import test from "node:test";
import assert from "node:assert/strict";
import evidence from "../src/data/horticultural-evidence.json" with {type: "json"};
import {getCropEvidence, summarizeCropEvidence} from "../src/lib/evidence/horticulturalEvidence.js";

test("curated evidence preserves source-level provenance", () => {
  assert.equal(evidence.evidence.length, 165);
  assert.ok(evidence.evidence.every((record) => record.id && record.sourceId && record.sourceUrl && record.retrievedAt));
  assert.equal(new Set(evidence.evidence.map((record) => record.id)).size, evidence.evidence.length);
});

test("reviewed evidence now covers every Garden Today crop", () => {
  assert.equal(new Set(evidence.evidence.map((record) => record.cropSlug)).size, 23);
});

test("tomato evidence exposes regional transplant, spacing, and indoor-start benchmarks", () => {
  const summary = summarizeCropEvidence(getCropEvidence(evidence, "tomatoes"));
  assert.equal(summary.scope, "central Maine");
  assert.equal(summary.plantSpacing, "18–36 in");
  assert.equal(summary.indoorStartLead, "6–8 weeks");
  assert.equal(summary.plantingWindows[0].method, "transplant");
  assert.deepEqual(new Set(summary.sourceIds), new Set([
    "source:umaine-home-vegetable-chart",
    "source:umaine-spring-to-fall"
  ]));
});
