import assert from "node:assert/strict";
import test from "node:test";

import {
  BERKSHIRE_BOTANICAL_REVISION_3_DEMO_PLACEMENTS,
  BERKSHIRE_BOTANICAL_REVISION_4_INDICATIVE_KMZ_PLACEMENTS,
  migrateBerkshireBotanicalDemoPlacements
} from "../src/data/migrations/berkshireBotanicalDemoPlacements.js";

const canonical = [
  {id: "bbg-observation-1", bedId: null, plantId: null, absoluteLocalPoint: [10, 20]},
  {id: "bbg-observation-2", bedId: null, plantId: null, absoluteLocalPoint: [30, 40]}
];

test("unchanged revision-3 demo crops retire in favor of canonical observations", () => {
  const result = migrateBerkshireBotanicalDemoPlacements(
    BERKSHIRE_BOTANICAL_REVISION_3_DEMO_PLACEMENTS,
    canonical
  );
  assert.deepEqual(result, canonical);
  assert.equal(result.some(({id}) => /^p(?:[1-9]|1\d|20)$/.test(id)), false);
});

test("edited and custom placements survive while exact demo siblings retire", () => {
  const edited = {
    ...BERKSHIRE_BOTANICAL_REVISION_3_DEMO_PLACEMENTS[0],
    notes: "User changed this planting"
  };
  const custom = {id: "my-plant", bedId: "my-bed", plantId: "bean", x: 12, y: 18};
  const result = migrateBerkshireBotanicalDemoPlacements([
    edited,
    BERKSHIRE_BOTANICAL_REVISION_3_DEMO_PLACEMENTS[1],
    custom
  ], canonical);

  assert.deepEqual(result.find(({id}) => id === edited.id), edited);
  assert.deepEqual(result.find(({id}) => id === custom.id), custom);
  assert.ok(canonical.every(({id}) => result.some((item) => item.id === id)));
  assert.equal(result.some(({id}) => id === "p2"), false);
});

test("an intentionally empty or wholly custom placement list is not repopulated", () => {
  assert.deepEqual(migrateBerkshireBotanicalDemoPlacements([], canonical), []);
  const custom = [{id: "only-custom", bedId: "bed", plantId: "pea", x: 3, y: 4}];
  assert.deepEqual(migrateBerkshireBotanicalDemoPlacements(custom, canonical), custom);
});

test("untouched indicative KMZ points retire without deleting an edited point", () => {
  const edited = {
    ...BERKSHIRE_BOTANICAL_REVISION_4_INDICATIVE_KMZ_PLACEMENTS[0],
    name: "User-confirmed specimen"
  };
  const result = migrateBerkshireBotanicalDemoPlacements([
    edited,
    ...BERKSHIRE_BOTANICAL_REVISION_4_INDICATIVE_KMZ_PLACEMENTS.slice(1)
  ], []);

  assert.deepEqual(result, [edited]);
});
