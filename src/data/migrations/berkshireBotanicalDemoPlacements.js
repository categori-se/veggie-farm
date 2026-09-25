// Exact revision-3 demo placements formerly embedded in gardenPlanner.js.
// Keep this immutable migration fixture so the revision-4 canonical GIS
// starter can retire false crop claims without deleting any placement whose
// fields were actually changed by a user.
export const BERKSHIRE_BOTANICAL_REVISION_3_DEMO_PLACEMENTS = Object.freeze([
  {id: "p1", bedId: "bbg-edible-west-1", plantId: "tomato", x: 24, y: 32, planted: "2026-05-19", health: "starting", notes: "Trellised north-south", rotation: 0.12},
  {id: "p2", bedId: "bbg-edible-west-1", plantId: "tomato", x: 24, y: 108, planted: "2026-05-19", health: "starting", notes: "Trellised north-south", rotation: -0.2},
  {id: "p3", bedId: "bbg-edible-west-2", plantId: "basil", x: 16, y: 28, planted: "2026-05-26", health: "starting", notes: "Herb succession", rotation: -0.4},
  {id: "p4", bedId: "bbg-edible-west-2", plantId: "basil", x: 32, y: 56, planted: "2026-05-26", health: "starting", notes: "Herb succession", rotation: 0.18},
  {id: "p5", bedId: "bbg-edible-west-2", plantId: "basil", x: 16, y: 84, planted: "2026-05-26", health: "starting", notes: "Herb succession", rotation: 0.44},
  {id: "p6", bedId: "bbg-edible-west-2", plantId: "basil", x: 32, y: 112, planted: "2026-05-26", health: "starting", notes: "Herb succession", rotation: -0.22},
  {id: "p7", bedId: "bbg-edible-west-3", plantId: "kale", x: 24, y: 34, planted: "2026-04-28", health: "strong", notes: "Cool-season planting", rotation: 0.08},
  {id: "p8", bedId: "bbg-edible-west-3", plantId: "kale", x: 24, y: 102, planted: "2026-04-28", health: "strong", notes: "Cool-season planting", rotation: -0.16},
  {id: "p9", bedId: "bbg-edible-east-1", plantId: "carrot", x: 12, y: 30, planted: "2026-04-21", health: "starting", notes: "Direct-sown root band", rotation: 0.2},
  {id: "p10", bedId: "bbg-edible-east-1", plantId: "carrot", x: 24, y: 30, planted: "2026-04-21", health: "starting", notes: "Direct-sown root band", rotation: -0.1},
  {id: "p11", bedId: "bbg-edible-east-1", plantId: "carrot", x: 36, y: 30, planted: "2026-04-21", health: "starting", notes: "Direct-sown root band", rotation: 0.5},
  {id: "p12", bedId: "bbg-edible-east-1", plantId: "carrot", x: 12, y: 72, planted: "2026-05-12", health: "starting", notes: "Second sowing", rotation: -0.32},
  {id: "p13", bedId: "bbg-edible-east-1", plantId: "carrot", x: 24, y: 72, planted: "2026-05-12", health: "starting", notes: "Second sowing", rotation: 0.1},
  {id: "p14", bedId: "bbg-edible-east-1", plantId: "carrot", x: 36, y: 72, planted: "2026-05-12", health: "starting", notes: "Second sowing", rotation: 0.64},
  {id: "p15", bedId: "bbg-edible-east-2", plantId: "lettuce", x: 12, y: 30, planted: "2026-04-21", health: "strong", notes: "Cut-and-come-again greens", rotation: 0.12},
  {id: "p16", bedId: "bbg-edible-east-2", plantId: "lettuce", x: 36, y: 30, planted: "2026-04-21", health: "strong", notes: "Cut-and-come-again greens", rotation: -0.18},
  {id: "p17", bedId: "bbg-edible-east-2", plantId: "lettuce", x: 12, y: 78, planted: "2026-05-12", health: "starting", notes: "Second succession", rotation: 0.3},
  {id: "p18", bedId: "bbg-edible-east-2", plantId: "lettuce", x: 36, y: 78, planted: "2026-05-12", health: "starting", notes: "Second succession", rotation: -0.3},
  {id: "p19", bedId: "bbg-edible-east-4", plantId: "nasturtium", x: 24, y: 34, planted: "2026-05-19", health: "starting", notes: "Edible flower and pollinator edge", rotation: 0.54},
  {id: "p20", bedId: "bbg-edible-east-4", plantId: "nasturtium", x: 24, y: 108, planted: "2026-05-19", health: "starting", notes: "Edible flower and pollinator edge", rotation: -0.46}
].map((placement) => Object.freeze(placement)));

const INDICATIVE_KMZ_SOURCE = Object.freeze({
  sourceId: "bbg-google-earth-example-2026-08-23",
  sourceFileName: "Berkshire Botanical Garden - further example.kmz",
  sourceRevision: 3,
  sourceSha256: "065c728cbc46402cac23056057f2701702a22edf52344124960946f585532676",
  geometryMethod: "exact KML coordinate import",
  semanticMethod: "source-name-pattern-v1",
  confidence: "low",
  surveyStatus: "not-surveyed",
  retrievedAt: "2026-08-23",
  importer: "scripts/import-kml-kmz.mjs",
  parcelAssignmentMethod: "representative point within canonical parcel polygon"
});

// Revision 4 briefly treated four anonymous KMZ points as canonical plant
// observations. They are retained here only as an exact migration fixture.
// Their source supplies neither a botanical observation nor an authoritative
// position, so revision 5 retires untouched copies while preserving any record
// the user named, moved, classified, assigned to a bed, or otherwise edited.
export const BERKSHIRE_BOTANICAL_REVISION_4_INDICATIVE_KMZ_PLACEMENTS = Object.freeze([
  {id: "bbg-plant-observation-01", suffix: "012", coordinates: [-73.33644790512643, 42.30000956233251], local: [480.77910701610966, -2267.3010511649345]},
  {id: "bbg-plant-observation-02", suffix: "013", coordinates: [-73.3364390903245, 42.30000203777838], local: [509.39637318977435, -2234.3947236093127]},
  {id: "bbg-plant-observation-03", suffix: "014", coordinates: [-73.33643460639887, 42.29999795211893], local: [523.9534437227887, -2216.5273462655227]},
  {id: "bbg-plant-observation-04", suffix: "015", coordinates: [-73.33644294638019, 42.30000590532704], local: [496.8776832884917, -2251.308260394506]}
].map((item, index) => Object.freeze({
  id: item.id,
  name: `Unidentified plant observation ${index + 1}`,
  kind: "plant-observation",
  plantId: null,
  bedId: null,
  x: item.local[0],
  y: item.local[1],
  absoluteLocalPoint: item.local,
  canonicalGeometry: {type: "Point", coordinates: item.coordinates},
  parcelId: "bbg-parcel-215-1",
  identificationStatus: "unidentified and not yet associated with a mapped bed",
  confidence: "low",
  provenance: {
    sourceId: INDICATIVE_KMZ_SOURCE.sourceId,
    sourceFileName: INDICATIVE_KMZ_SOURCE.sourceFileName,
    sourceRevision: INDICATIVE_KMZ_SOURCE.sourceRevision,
    sourceSha256: INDICATIVE_KMZ_SOURCE.sourceSha256,
    sourceFeatureId: `${INDICATIVE_KMZ_SOURCE.sourceId}:plant:${item.suffix}`,
    geometryMethod: INDICATIVE_KMZ_SOURCE.geometryMethod,
    semanticMethod: INDICATIVE_KMZ_SOURCE.semanticMethod,
    confidence: INDICATIVE_KMZ_SOURCE.confidence,
    surveyStatus: INDICATIVE_KMZ_SOURCE.surveyStatus,
    retrievedAt: INDICATIVE_KMZ_SOURCE.retrievedAt,
    importer: INDICATIVE_KMZ_SOURCE.importer,
    parcelAssignmentMethod: INDICATIVE_KMZ_SOURCE.parcelAssignmentMethod,
    representativePoint: item.coordinates
  },
  notes: null
})));

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function sameExactRecord(left, right) {
  if (!left || !right) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return JSON.stringify(leftKeys) === JSON.stringify(rightKeys)
    && leftKeys.every((key) => JSON.stringify(left[key]) === JSON.stringify(right[key]));
}

/**
 * Retire only byte-for-byte equivalent bundled records. If at least one legacy
 * record is found, include the current canonical plant layer; a completely
 * empty or wholly custom planting list remains untouched.
 */
export function migrateBerkshireBotanicalDemoPlacements(savedPlacements, canonicalPlacements) {
  if (!Array.isArray(savedPlacements)) return clone(canonicalPlacements || []);
  const legacyById = new Map([
    ...BERKSHIRE_BOTANICAL_REVISION_3_DEMO_PLACEMENTS,
    ...BERKSHIRE_BOTANICAL_REVISION_4_INDICATIVE_KMZ_PLACEMENTS
  ].map((item) => [item.id, item]));
  let retired = 0;
  const retained = savedPlacements.filter((saved) => {
    const isUnchangedDemo = sameExactRecord(saved, legacyById.get(saved?.id));
    if (isUnchangedDemo) retired += 1;
    return !isUnchangedDemo;
  });
  if (!retired) return clone(savedPlacements);
  const retainedIds = new Set(retained.map((item) => item?.id));
  return [
    ...clone(retained),
    ...clone(canonicalPlacements || []).filter((item) => !retainedIds.has(item?.id))
  ];
}
