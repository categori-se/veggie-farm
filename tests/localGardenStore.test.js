import test from "node:test";
import assert from "node:assert/strict";
import {
  addGardenObservation,
  createGardenExport,
  loadGardenProfile,
  normalizeGardenProfile,
  profileDatesForYear,
  saveGardenProfile
} from "../src/lib/garden/localGardenStore.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test("garden profiles keep user overrides separate and reusable by year", () => {
  const profile = normalizeGardenProfile({
    gardenName: "Kitchen beds",
    lastFrostDate: "2026-05-18",
    firstFrostDate: "2026-10-03",
    soilTexture: "loam",
    drainage: "fast"
  });
  assert.equal(profile.soil.source, "user_override");
  assert.deepEqual(profile.soil.effective, {texture: "loam", drainage: "fast"});
  assert.deepEqual(profileDatesForYear(profile, 2027), {
    lastFrostDate: "2027-05-18",
    firstFrostDate: "2027-10-03"
  });
});

test("profile and observations round-trip through browser-like storage", () => {
  const storage = memoryStorage();
  assert.equal(saveGardenProfile({gardenName: "Back garden"}, storage).saved, true);
  assert.equal(loadGardenProfile(storage).gardenName, "Back garden");

  const result = addGardenObservation({
    type: "seeded",
    date: "2026-08-20",
    bed: "Bed 2",
    crop: "Spinach",
    notes: "Short fall row"
  }, storage, {id: "observation:test", createdAt: "2026-08-20T12:00:00.000Z"});
  assert.equal(result.saved, true);
  assert.equal(createGardenExport(storage).observations[0].provenance.kind, "user_observation");
});

test("unsupported observation types are rejected", () => {
  assert.throws(() => addGardenObservation({type: "guess", date: "2026-08-20"}, memoryStorage()), /Unsupported observation type/);
  assert.throws(() => addGardenObservation({type: "note", date: "2026-02-30"}, memoryStorage()), /Invalid observation date/);
});

test('missing soil texture and drainage stay unknown through save and reload', () => {
  const storage = memoryStorage();
  const empty = normalizeGardenProfile({gardenName: 'New garden'});
  assert.deepEqual(empty.soil.effective, {texture: null, drainage: null});
  assert.equal(empty.soil.source, 'unknown');
  saveGardenProfile({soilTexture: '', drainage: ''}, storage);
  assert.deepEqual(loadGardenProfile(storage).soil.effective, empty.soil.effective);
  const partial = normalizeGardenProfile({drainage: 'slow'});
  assert.deepEqual(partial.soil.effective, {texture: null, drainage: 'slow'});
  const legacy = normalizeGardenProfile({soil: {userOverride: {texture: 'managed raised-bed loam', drainage: 'moderate'}}});
  assert.equal(legacy.soil.effective.texture, 'managed raised-bed loam');
});
