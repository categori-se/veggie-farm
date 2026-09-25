import {BERKSHIRE_BOTANICAL_REVISION_2} from "../../data/migrations/berkshireBotanicalRevision2.js";

export const BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION = 3;

const STARTER_GEOMETRY_FIELDS = Object.freeze([
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "polygon",
  "localGeometry"
]);

function clone(value) {
  if (value === undefined) return undefined;
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export function sameStarterValue(left, right) {
  if (left === right) return true;
  if ((left && typeof left === "object") || (right && typeof right === "object")) {
    return JSON.stringify(left) === JSON.stringify(right);
  }
  return false;
}

export function sameStarterGeometry(left, right) {
  if (!left || !right) return false;
  const numbersMatch = ["x", "y", "width", "height", "rotation"]
    .every((key) => Math.abs((Number(left[key]) || 0) - (Number(right[key]) || 0)) < 1e-6);
  return numbersMatch
    && sameStarterValue(Array.isArray(left.polygon) ? left.polygon : null, Array.isArray(right.polygon) ? right.polygon : null)
    && sameStarterValue(left.localGeometry || null, right.localGeometry || null);
}

function sameStarterRecord(left, right) {
  if (!left || !right) return false;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => sameStarterValue(left[key], right[key]));
}

function copyCanonicalGeometry(target, current) {
  for (const field of STARTER_GEOMETRY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(current, field)) target[field] = clone(current[field]);
    else delete target[field];
  }
}

// Perform a conservative three-way merge: the saved feature is the working
// copy, legacy is the exact starter it was based on, and current is the new
// canonical reference. Geometry is atomic so one hand-edited path vertex locks
// the whole feature geometry; unchanged geometry receives the complete newer
// polygon/LineString instead of a mixture of two calibration revisions.
function mergeStarterFeature(saved, legacy, current) {
  const next = clone(saved);
  if (sameStarterGeometry(saved, legacy)) copyCanonicalGeometry(next, current);

  const keys = new Set([...Object.keys(legacy), ...Object.keys(current)]);
  for (const key of keys) {
    if (STARTER_GEOMETRY_FIELDS.includes(key) || key === "id") continue;
    const savedHas = Object.prototype.hasOwnProperty.call(saved, key);
    const legacyHas = Object.prototype.hasOwnProperty.call(legacy, key);
    const currentHas = Object.prototype.hasOwnProperty.call(current, key);

    // A field introduced by the new schema is safe to add only when the saved
    // feature does not already carry a user-defined field of the same name.
    if (!legacyHas) {
      if (!savedHas && currentHas) next[key] = clone(current[key]);
      continue;
    }

    // Only advance old metadata or labels that still equal the old starter.
    // Renamed features and edited notes remain exactly as the user saved them.
    if (!savedHas || !sameStarterValue(saved[key], legacy[key])) continue;
    if (currentHas) next[key] = clone(current[key]);
    else delete next[key];
  }
  return next;
}

export function upgradeStarterFeatures(savedFeatures, legacyFeatures, currentFeatures, options = {}) {
  if (!Array.isArray(savedFeatures)) return clone(currentFeatures);
  const legacyById = new Map(legacyFeatures.map((feature) => [feature.id, feature]));
  const currentById = new Map(currentFeatures.map((feature) => [feature.id, feature]));
  const skipAddedIds = new Set(options.skipAddedIds || []);
  const allLegacyFeaturesRemain = legacyFeatures.every((feature) =>
    savedFeatures.some((saved) => saved?.id === feature.id)
  );

  const upgraded = [];
  for (const saved of savedFeatures) {
    const legacy = legacyById.get(saved?.id);
    const current = currentById.get(saved?.id);
    if (!legacy) {
      upgraded.push(saved);
      continue;
    }
    if (!current) {
      // A canonical feature may move to a more appropriate GIS collection.
      // Remove it from the old layer only if the complete record is untouched.
      if (!(options.dropRetiredUntouched && sameStarterRecord(saved, legacy))) upgraded.push(saved);
      continue;
    }
    upgraded.push(mergeStarterFeature(saved, legacy, current));
  }

  const ids = new Set(upgraded.map((feature) => feature?.id));
  for (const current of currentFeatures) {
    if (ids.has(current.id) || skipAddedIds.has(current.id)) continue;
    // New revision features are always added. A missing feature that existed in
    // the saved revision remains deleted unless the whole old starter survived.
    if (!legacyById.has(current.id) || allLegacyFeaturesRemain) upgraded.push(clone(current));
  }
  return upgraded;
}

function berkshireBotanicalRevision1Beds() {
  const geometry = new Map([
    ["bbg-edible-west-1", [1640, -2660, 48, 144, -6]],
    ["bbg-edible-west-2", [1730, -2615, 48, 144, -6]],
    ["bbg-edible-west-3", [1820, -2570, 48, 144, -6]],
    ["bbg-edible-east-1", [2050, -2470, 48, 144, -6]],
    ["bbg-edible-east-2", [2140, -2425, 48, 144, -6]],
    ["bbg-edible-east-3", [2230, -2380, 48, 144, -6]],
    ["bbg-edible-east-4", [2320, -2335, 48, 144, -6]],
    ["bbg-childrens-1", [3710, -85, 96, 48, 5]],
    ["bbg-childrens-2", [3850, -65, 96, 48, 5]],
    ["bbg-childrens-3", [3730, 45, 96, 48, 5]],
    ["bbg-childrens-4", [3880, 65, 96, 48, 5]],
    ["bbg-discovery-food-flowers", [1710, -1940, 240, 96, -6]]
  ]);
  return BERKSHIRE_BOTANICAL_REVISION_2.beds.map((bed) => {
    const [x, y, width, height, rotation] = geometry.get(bed.id);
    return {...clone(bed), x, y, width, height, rotation};
  });
}

function berkshireBotanicalRevision1Structures() {
  const geometry = new Map([
    ["bbg-passive-solar-greenhouse", [-664, -5011, 650, 180, 0]],
    ["bbg-visitor-center", [620, -3820, 500, 900, 6]],
    ["bbg-fitzpatrick-conservatory", [2410, -3425, 740, 290, 10]],
    ["bbg-lexan-greenhouse", [1010, -1710, 930, 370, 12]],
    ["bbg-education-center", [2730, -810, 1450, 930, 35]],
    ["bbg-mother-earth-lodge", [3380, 220, 980, 720, 20]],
    ["bbg-main-parking", [-420, -3420, 1320, 2050, -2]],
    ["bbg-parking-entry-drive", [-1040, -4680, 230, 1420, -32]],
    ["bbg-parking-aisle", [-370, -3630, 250, 1460, 1]],
    ["bbg-main-garden-walk", [960, -2900, 110, 1510, -116]],
    ["bbg-edible-walk-west", [1370, -2710, 92, 830, 28]],
    ["bbg-edible-cross-walk", [1990, -2860, 92, 950, -66]],
    ["bbg-discovery-garden-walk", [1710, -2120, 88, 900, -51]]
  ]);
  const revision2ById = new Map(BERKSHIRE_BOTANICAL_REVISION_2.structures.map((feature) => [feature.id, feature]));
  return [...geometry].map(([id, values]) => {
    const legacy = {...clone(revision2ById.get(id)), x: values[0], y: values[1], width: values[2], height: values[3], rotation: values[4]};
    for (const field of ["localGeometry", "geometryBasis", "surveyStatus", "boundaryPolicy", "featureStatus", "sourceReferences"]) delete legacy[field];
    if (id === "bbg-visitor-center") legacy.name = "Visitor Center · map 1";
    return legacy;
  });
}

function berkshireBotanicalRevision1Vegetation() {
  return BERKSHIRE_BOTANICAL_REVISION_2.vegetation.map((feature) => {
    const legacy = clone(feature);
    for (const field of ["geometryBasis", "surveyStatus", "boundaryPolicy", "featureStatus", "taxonStatus", "sourceReferences"]) delete legacy[field];
    if (feature.id === "bbg-native-border") legacy.name = "Native Plant Border · map 6";
    return legacy;
  });
}

function revision2NativeBorderState(workspace) {
  const legacy = BERKSHIRE_BOTANICAL_REVISION_2.vegetation.find((feature) => feature.id === "bbg-native-border");
  // A missing collection means the old workspace never serialized that layer;
  // it is not evidence that the user deliberately deleted this one feature.
  if (!Array.isArray(workspace?.vegetation)) return "untouched";
  const saved = workspace?.vegetation?.find((feature) => feature?.id === "bbg-native-border");
  if (!saved) return "deleted";
  return sameStarterRecord(saved, legacy) ? "untouched" : "edited";
}

function revision2MovedTreeState(workspace) {
  const legacy = BERKSHIRE_BOTANICAL_REVISION_2.structures.find(
    (feature) => feature.id === "bbg-tree-of-forty-fruit"
  );
  if (!Array.isArray(workspace?.structures)) return "untouched";
  const saved = workspace.structures.find((feature) => feature?.id === legacy?.id);
  if (!saved) return "deleted";
  return sameStarterRecord(saved, legacy) ? "untouched" : "edited";
}

export function migrateBerkshireBotanicalStarterLayout(workspace, current, targetRevision = BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION) {
  const requestedRevision = Math.max(BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION, Number(targetRevision) || 0);
  let revision = Math.max(0, Number(workspace?.starterLayoutRevision) || 0);
  if (revision >= requestedRevision) return workspace;
  let next = {...workspace};

  // Migrations are intentionally stepwise. A revision-2 browser save must be
  // compared with the exact revision-2 fixture—not with revision 1 or today's
  // geometry—or its untouched features would be mistaken for user edits.
  if (revision < 2) {
    next = {
      ...next,
      beds: upgradeStarterFeatures(next.beds, berkshireBotanicalRevision1Beds(), BERKSHIRE_BOTANICAL_REVISION_2.beds),
      structures: upgradeStarterFeatures(next.structures, berkshireBotanicalRevision1Structures(), BERKSHIRE_BOTANICAL_REVISION_2.structures),
      vegetation: upgradeStarterFeatures(next.vegetation, berkshireBotanicalRevision1Vegetation(), BERKSHIRE_BOTANICAL_REVISION_2.vegetation),
      starterLayoutRevision: 2
    };
    revision = 2;
  }

  if (revision < 3) {
    const nativeBorderState = revision2NativeBorderState(next);
    const movedTreeState = revision2MovedTreeState(next);
    next = {
      ...next,
      beds: upgradeStarterFeatures(next.beds, BERKSHIRE_BOTANICAL_REVISION_2.beds, current.beds),
      structures: upgradeStarterFeatures(
        next.structures,
        BERKSHIRE_BOTANICAL_REVISION_2.structures,
        current.structures,
        {
          skipAddedIds: nativeBorderState === "untouched" ? [] : ["bbg-native-border"],
          // The named specimen tree moved from the generic site-feature layer
          // to the canonical tree-Point collection. Drop only the untouched
          // legacy copy; a user edit remains recoverable below.
          dropRetiredUntouched: true
        }
      ),
      vegetation: upgradeStarterFeatures(
        next.vegetation,
        BERKSHIRE_BOTANICAL_REVISION_2.vegetation,
        current.vegetation,
        {
          dropRetiredUntouched: true,
          // Respect an edited/deleted legacy tree instead of creating a second
          // feature with the same identity in another layer. A later explicit
          // review can promote the retained edit to the Point model.
          skipAddedIds: movedTreeState === "untouched" ? [] : ["bbg-tree-of-forty-fruit"]
        }
      ),
      starterLayoutRevision: 3,
      parcelViewport: null
    };
    revision = 3;
  }

  return revision === requestedRevision
    ? next
    : {...next, starterLayoutRevision: requestedRevision, parcelViewport: null};
}
