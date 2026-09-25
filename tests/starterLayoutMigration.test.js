import test from "node:test";
import assert from "node:assert/strict";

import {BERKSHIRE_BOTANICAL_REVISION_2} from "../src/data/migrations/berkshireBotanicalRevision2.js";
import {
  DEFAULT_BEDS,
  DEFAULT_VEGETATION,
  PROPERTY_STRUCTURES
} from "../src/data/propertyContext.js";
import {
  BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION,
  migrateBerkshireBotanicalStarterLayout,
  sameStarterGeometry
} from "../src/lib/spatial/starterLayoutMigration.js";

const CURRENT = {
  beds: DEFAULT_BEDS,
  structures: PROPERTY_STRUCTURES,
  vegetation: DEFAULT_VEGETATION
};

function revision2Workspace() {
  return {
    id: "berkshire-botanical-garden",
    starterLayoutRevision: 2,
    beds: structuredClone(BERKSHIRE_BOTANICAL_REVISION_2.beds),
    structures: structuredClone(BERKSHIRE_BOTANICAL_REVISION_2.structures),
    vegetation: structuredClone(BERKSHIRE_BOTANICAL_REVISION_2.vegetation),
    parcelViewport: {x: 1, y: 2, width: 3, height: 4}
  };
}

function byId(features, id) {
  return features.find((feature) => feature.id === id);
}

test("the BBG revision-2 migration fixture is the exact pre-revision-3 starter inventory", () => {
  assert.equal(BERKSHIRE_BOTANICAL_REVISION_2.revision, 2);
  assert.equal(BERKSHIRE_BOTANICAL_REVISION_2.propertyContextVersion, 6);
  assert.equal(BERKSHIRE_BOTANICAL_REVISION_2.beds.length, 12);
  assert.equal(BERKSHIRE_BOTANICAL_REVISION_2.structures.length, 39);
  assert.equal(BERKSHIRE_BOTANICAL_REVISION_2.vegetation.length, 8);
  assert.deepEqual(
    byId(BERKSHIRE_BOTANICAL_REVISION_2.structures, "bbg-parking-entry-drive").localGeometry.coordinates,
    [[-1510, -5200], [-1280, -4820], [-1060, -4490], [-820, -4150]]
  );
});

test("untouched revision-2 references advance to the current aerial-grid and tree-point model", () => {
  const migrated = migrateBerkshireBotanicalStarterLayout(revision2Workspace(), CURRENT);

  assert.equal(migrated.starterLayoutRevision, BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION);
  assert.equal(migrated.parcelViewport, null);
  assert.equal(migrated.beds.length, DEFAULT_BEDS.length);
  assert.equal(migrated.structures.length, PROPERTY_STRUCTURES.length);
  assert.equal(migrated.vegetation.length, DEFAULT_VEGETATION.length);

  const migratedBed = byId(migrated.beds, "bbg-edible-west-1");
  const currentBed = byId(DEFAULT_BEDS, "bbg-edible-west-1");
  assert.ok(sameStarterGeometry(migratedBed, currentBed));
  assert.equal(migratedBed.parentId, "bbg-edible-north-subplot");
  assert.equal(migratedBed.subplotId, migratedBed.parentId);
  assert.equal(migratedBed.sectionId, "bbg-edible-gardens-section");
  assert.equal(migratedBed.gridCellId, "bbg-grid-estimate-edible-r01-c03");
  assert.equal(migratedBed.centerControlId, "edible-grid-northwest-cell");
  assert.equal(migratedBed.observedFootprintId ?? null, null);
  assert.equal(migratedBed.featureStatus, "aerial-grid-estimate");
  assert.match(migratedBed.geometryBasis, /regular-grid interpolation from six raster center controls/i);

  const migratedDrive = byId(migrated.structures, "bbg-parking-entry-drive");
  const currentDrive = byId(PROPERTY_STRUCTURES, "bbg-parking-entry-drive");
  assert.ok(sameStarterGeometry(migratedDrive, currentDrive));
  assert.equal(migratedDrive.localGeometry.type, "LineString");
  assert.ok(byId(migrated.structures, "bbg-north-entry-spine"));
  assert.ok(byId(migrated.structures, "bbg-wildflower-meadow-main-trail"));
  assert.ok(byId(migrated.structures, "bbg-edible-north-subplot"));
  assert.ok(byId(migrated.structures, "bbg-edible-south-subplot"));
  assert.ok(byId(migrated.structures, "bbg-childrens-main-grid"));

  const migratedTree = byId(migrated.vegetation, "bbg-tree-of-forty-fruit");
  assert.equal(byId(migrated.structures, migratedTree.id), undefined);
  assert.equal(migratedTree.kind, "tree");
  assert.equal(migratedTree.geometryRepresentation, "point");
  assert.equal(migratedTree.localGeometry.type, "Point");
  assert.equal(migratedTree.plantId, null);
  assert.equal(migrated.vegetation.length, 5);
  assert.ok(migrated.vegetation.every((feature) => feature.localGeometry?.type === "Point"));

  // The untouched Native Border changes from the vegetation layer to its
  // canonical named garden-section polygon without leaving a duplicate ID.
  assert.equal(byId(migrated.vegetation, "bbg-native-border"), undefined);
  assert.ok(byId(migrated.structures, "bbg-native-border"));
});

test("geometry, labels, notes, and deletions genuinely edited in revision 2 survive", () => {
  const workspace = revision2Workspace();
  const editedBed = byId(workspace.beds, "bbg-edible-west-1");
  editedBed.x += 37;
  editedBed.name = "Aaron's tomato bed";
  editedBed.notes = "Keep this measured location.";

  const renamedOnlyBed = byId(workspace.beds, "bbg-edible-west-2");
  renamedOnlyBed.name = "Herb trial A";

  const editedPath = byId(workspace.structures, "bbg-parking-entry-drive");
  editedPath.localGeometry.coordinates[1] = [-1266, -4798];
  editedPath.notes = "Field-checked bend.";

  workspace.beds = workspace.beds.filter((bed) => bed.id !== "bbg-edible-east-4");
  workspace.structures = workspace.structures.filter((feature) => feature.id !== "bbg-rain-garden");

  const migrated = migrateBerkshireBotanicalStarterLayout(workspace, CURRENT);
  const migratedBed = byId(migrated.beds, editedBed.id);
  const migratedRenamedOnlyBed = byId(migrated.beds, renamedOnlyBed.id);
  const migratedPath = byId(migrated.structures, editedPath.id);

  assert.equal(migratedBed.x, editedBed.x);
  assert.equal(migratedBed.width, editedBed.width);
  assert.equal(migratedBed.name, "Aaron's tomato bed");
  assert.equal(migratedBed.notes, "Keep this measured location.");
  assert.equal(migratedRenamedOnlyBed.name, "Herb trial A");
  assert.ok(sameStarterGeometry(migratedRenamedOnlyBed, byId(DEFAULT_BEDS, renamedOnlyBed.id)));
  assert.deepEqual(migratedPath.localGeometry, editedPath.localGeometry);
  assert.equal(migratedPath.notes, "Field-checked bend.");
  assert.equal(byId(migrated.beds, "bbg-edible-east-4"), undefined);
  assert.equal(byId(migrated.structures, "bbg-rain-garden"), undefined);

  // New canonical IDs are still added even when an older canonical feature
  // was deliberately deleted.
  assert.ok(byId(migrated.beds, "bbg-edible-grid-r7-c5"));
  assert.ok(byId(migrated.structures, "bbg-childrens-garden-walk"));
});

test("a localGeometry-only path edit locks the whole geometry during migration", () => {
  const workspace = revision2Workspace();
  const edited = byId(workspace.structures, "bbg-edible-cross-walk");
  const oldEnvelope = [edited.x, edited.y, edited.width, edited.height, edited.rotation];
  edited.localGeometry.coordinates[2][0] += 19;

  const migrated = migrateBerkshireBotanicalStarterLayout(workspace, CURRENT);
  const result = byId(migrated.structures, edited.id);
  assert.deepEqual([result.x, result.y, result.width, result.height, result.rotation], oldEnvelope);
  assert.deepEqual(result.localGeometry, edited.localGeometry);
  assert.ok(!sameStarterGeometry(result, byId(PROPERTY_STRUCTURES, edited.id)));
});

test("an edited or deleted revision-2 Native Border is not duplicated into the site layer", () => {
  const editedWorkspace = revision2Workspace();
  const nativeBorder = byId(editedWorkspace.vegetation, "bbg-native-border");
  nativeBorder.x += 24;
  nativeBorder.name = "My native border";
  const edited = migrateBerkshireBotanicalStarterLayout(editedWorkspace, CURRENT);
  assert.equal(byId(edited.vegetation, "bbg-native-border").name, "My native border");
  assert.equal(byId(edited.structures, "bbg-native-border"), undefined);

  const deletedWorkspace = revision2Workspace();
  deletedWorkspace.vegetation = deletedWorkspace.vegetation.filter((feature) => feature.id !== "bbg-native-border");
  const deleted = migrateBerkshireBotanicalStarterLayout(deletedWorkspace, CURRENT);
  assert.equal(byId(deleted.vegetation, "bbg-native-border"), undefined);
  assert.equal(byId(deleted.structures, "bbg-native-border"), undefined);
});

test("an edited or deleted legacy tree is not duplicated by the canonical tree Point", () => {
  const editedWorkspace = revision2Workspace();
  const legacyTree = byId(editedWorkspace.structures, "bbg-tree-of-forty-fruit");
  legacyTree.x += 24;
  legacyTree.name = "My field-checked tree";
  const edited = migrateBerkshireBotanicalStarterLayout(editedWorkspace, CURRENT);
  assert.equal(byId(edited.structures, legacyTree.id).name, "My field-checked tree");
  assert.equal(byId(edited.vegetation, legacyTree.id), undefined);

  const deletedWorkspace = revision2Workspace();
  deletedWorkspace.structures = deletedWorkspace.structures.filter((feature) => feature.id !== legacyTree.id);
  const deleted = migrateBerkshireBotanicalStarterLayout(deletedWorkspace, CURRENT);
  assert.equal(byId(deleted.structures, legacyTree.id), undefined);
  assert.equal(byId(deleted.vegetation, legacyTree.id), undefined);
});

test("a missing legacy vegetation collection is treated as unsaved, not as a Native Border deletion", () => {
  const workspace = revision2Workspace();
  delete workspace.vegetation;
  const migrated = migrateBerkshireBotanicalStarterLayout(workspace, CURRENT);
  assert.equal(migrated.vegetation.length, DEFAULT_VEGETATION.length);
  assert.ok(byId(migrated.structures, "bbg-native-border"));
});

test("revision-1 workspaces migrate through the revision-2 base before the current starter", () => {
  const revision1 = revision2Workspace();
  revision1.starterLayoutRevision = 1;
  const bed = byId(revision1.beds, "bbg-edible-west-1");
  Object.assign(bed, {x: 1640, y: -2660, width: 48, height: 144, rotation: -6});
  const migrated = migrateBerkshireBotanicalStarterLayout(revision1, CURRENT);
  assert.equal(migrated.starterLayoutRevision, BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION);
  assert.ok(sameStarterGeometry(byId(migrated.beds, bed.id), byId(DEFAULT_BEDS, bed.id)));
});
