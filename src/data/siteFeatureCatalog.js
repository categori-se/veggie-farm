/**
 * Declarative classifications and cartographic styles for non-bed site features.
 *
 * The planning studio currently persists these objects in its `structures` array.
 * Keep that storage contract until a versioned migration exists: this catalog adds
 * meaning and presentation without renaming collections or rewriting saved layouts.
 * Feature type slugs that are not listed here are deliberately retained and receive
 * the generic fallback definition, so importing a newer/custom type is lossless.
 */

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

const CATEGORY_SOURCE = {
  buildings: {
    label: "Buildings & structures",
    visibilityKey: "showBuildings",
    order: 10
  },
  circulation: {
    label: "Roads & paths",
    visibilityKey: "showCirculation",
    order: 20
  },
  barriers: {
    label: "Fences & boundaries",
    visibilityKey: "showBarriers",
    order: 30
  },
  utilities: {
    label: "Utilities",
    visibilityKey: "showUtilities",
    order: 40
  },
  water: {
    label: "Water & drainage",
    visibilityKey: "showWater",
    order: 50
  },
  landscape: {
    label: "Landscape features",
    visibilityKey: "showLandscapeFeatures",
    order: 60
  }
};

export const SITE_FEATURE_CATEGORIES = deepFreeze(Object.fromEntries(
  Object.entries(CATEGORY_SOURCE).map(([id, category]) => [id, {id, ...category}])
));

export const SITE_FEATURE_CATEGORY_IDS = Object.freeze(Object.keys(SITE_FEATURE_CATEGORIES));

const AREA_LOD = {estate: "footprint", parcel: "footprint", site: "footprint", garden: "footprint", detail: "footprint"};
const LINE_LOD = {estate: "line", parcel: "line", site: "line", garden: "line-detail", detail: "line-detail"};
const POINT_LOD = {estate: "point", parcel: "point", site: "symbol", garden: "symbol", detail: "object"};

const style = (swatch, values) => ({
  swatch,
  fillOpacity: values.fillOpacity ?? 1,
  strokeOpacity: values.strokeOpacity ?? 1,
  strokeWidth: values.strokeWidth ?? 1,
  strokeDasharray: values.strokeDasharray ?? "none",
  strokeLinecap: values.strokeLinecap ?? "round",
  strokeLinejoin: values.strokeLinejoin ?? "round",
  ...values
});

const definition = ({
  label,
  category,
  geometryKinds,
  defaultGeometryKind = geometryKinds[0],
  legacyEnvelope = false,
  legend,
  lod
}) => ({
  label,
  category,
  geometryKinds,
  defaultGeometryKind,
  legacyEnvelope,
  legend,
  lod
});

const BUILDING_STYLE = style("area", {fill: "#8a765f", fillOpacity: 0.34, stroke: "#6b7567"});
const HOUSE_STYLE = style("area", {fill: "#7f817a", fillOpacity: 0.38, stroke: "#676960"});
const GREENHOUSE_STYLE = style("area", {fill: "#9fbfb5", fillOpacity: 0.34, stroke: "#668c84"});
const COMPOST_STYLE = style("area", {fill: "#66513f", fillOpacity: 0.38, stroke: "#5c4635"});
const PATH_STYLE = style("line", {stroke: "#a98354", strokeWidth: 3});
const ROAD_STYLE = style("line", {stroke: "#666b66", strokeWidth: 6});
const PARKING_STYLE = style("area", {fill: "#777a73", fillOpacity: 0.3, stroke: "#656a65", strokeDasharray: "7 3"});
const FENCE_STYLE = style("line", {stroke: "#6f705f", strokeWidth: 1.6, strokeDasharray: "4 2"});
const WALL_STYLE = style("line", {stroke: "#777269", strokeWidth: 3});
const GATE_STYLE = style("symbol", {symbol: "diamond", fill: "#f4f1df", stroke: "#6f705f", strokeWidth: 1.4});
const POLE_STYLE = style("symbol", {symbol: "cross", fill: "#f4f1df", stroke: "#4d554f", strokeWidth: 1.3});
const UTILITY_LINE_STYLE = style("line", {stroke: "#5d6470", strokeWidth: 1.4, strokeDasharray: "5 3"});
const WATER_AREA_STYLE = style("area", {fill: "#4d7f95", fillOpacity: 0.42, stroke: "#3d7188"});
const WATER_POINT_STYLE = style("symbol", {symbol: "circle", fill: "#6d9db2", stroke: "#315f75", strokeWidth: 1.2});
const DRAIN_STYLE = style("symbol", {symbol: "cross", fill: "#d5e4e9", stroke: "#486c79", strokeWidth: 1.2});
const CULVERT_STYLE = style("line", {stroke: "#4d7f95", strokeWidth: 2.2, strokeDasharray: "3 2"});
const ORCHARD_STYLE = style("area", {fill: "#577754", fillOpacity: 0.25, stroke: "#587857", strokeDasharray: "4 3"});
const GARDEN_SECTION_STYLE = style("area", {fill: "#789158", fillOpacity: 0.22, stroke: "#607a4c", strokeDasharray: "5 3"});
const GARDEN_SUBPLOT_STYLE = style("area", {fill: "#9aaa6e", fillOpacity: 0.12, stroke: "#7f925a", strokeDasharray: "3 3"});
const PLANTED_BORDER_STYLE = style("line", {stroke: "#718c52", strokeWidth: 5, strokeOpacity: 0.78, strokeLinecap: "round"});
const GARDEN_LANDMARK_STYLE = style("symbol", {symbol: "diamond", fill: "#d6b767", stroke: "#705e31", strokeWidth: 1.4});
const SPECIMEN_TREE_STYLE = style("symbol", {symbol: "circle", fill: "#47704b", stroke: "#315239", strokeWidth: 1.5});
const AMPHITHEATER_STYLE = style("area", {fill: "#aa916f", fillOpacity: 0.3, stroke: "#7d694e", strokeDasharray: "3 2"});
const ARBORETUM_STYLE = style("area", {fill: "#446c4c", fillOpacity: 0.22, stroke: "#3f6245", strokeDasharray: "7 3"});
const ROCK_GARDEN_STYLE = style("area", {fill: "#8a8777", fillOpacity: 0.3, stroke: "#666459", strokeDasharray: "2 2"});
const MEADOW_STYLE = style("area", {fill: "#98a958", fillOpacity: 0.28, stroke: "#718044", strokeDasharray: "5 4"});

const DEFINITION_SOURCE = {
  // Existing studio types. `legacyEnvelope` means x/y/width/height/rotation
  // remains a valid persisted representation even when richer geometry is allowed.
  structure: definition({label: "Structure", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: BUILDING_STYLE, lod: AREA_LOD}),
  building: definition({label: "Building", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: BUILDING_STYLE, lod: AREA_LOD}),
  house: definition({label: "House", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: HOUSE_STYLE, lod: AREA_LOD}),
  greenhouse: definition({label: "Greenhouse", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: GREENHOUSE_STYLE, lod: AREA_LOD}),
  shed: definition({label: "Shed", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: BUILDING_STYLE, lod: AREA_LOD}),
  barn: definition({label: "Barn", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: HOUSE_STYLE, lod: AREA_LOD}),
  garage: definition({label: "Garage", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: HOUSE_STYLE, lod: AREA_LOD}),
  pavilion: definition({label: "Pavilion", category: "buildings", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: BUILDING_STYLE, lod: AREA_LOD}),
  compost: definition({label: "Compost", category: "buildings", geometryKinds: ["Polygon", "Point"], legacyEnvelope: true, legend: COMPOST_STYLE, lod: AREA_LOD}),

  path: definition({label: "Path", category: "circulation", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: PATH_STYLE, lod: LINE_LOD}),
  trail: definition({label: "Trail", category: "circulation", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: {...PATH_STYLE, strokeDasharray: "4 3"}, lod: LINE_LOD}),
  stairs: definition({label: "Steps & stairs", category: "circulation", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: {...PATH_STYLE, strokeDasharray: "2 2"}, lod: LINE_LOD}),
  road: definition({label: "Road", category: "circulation", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: ROAD_STYLE, lod: LINE_LOD}),
  driveway: definition({label: "Driveway", category: "circulation", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: {...ROAD_STYLE, strokeWidth: 4}, lod: LINE_LOD}),
  parking: definition({label: "Parking", category: "circulation", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: PARKING_STYLE, lod: AREA_LOD}),

  fence: definition({label: "Fence", category: "barriers", geometryKinds: ["LineString"], legacyEnvelope: true, legend: FENCE_STYLE, lod: LINE_LOD}),
  wall: definition({label: "Wall", category: "barriers", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: WALL_STYLE, lod: LINE_LOD}),
  "retaining-wall": definition({label: "Retaining wall", category: "barriers", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: {...WALL_STYLE, strokeDasharray: "8 2"}, lod: LINE_LOD}),
  gate: definition({label: "Gate", category: "barriers", geometryKinds: ["Point", "LineString"], defaultGeometryKind: "Point", legacyEnvelope: true, legend: GATE_STYLE, lod: POINT_LOD}),

  "utility-pole": definition({label: "Utility pole", category: "utilities", geometryKinds: ["Point"], legacyEnvelope: true, legend: POLE_STYLE, lod: POINT_LOD}),
  "electric-pole": definition({label: "Electric pole", category: "utilities", geometryKinds: ["Point"], legacyEnvelope: true, legend: {...POLE_STYLE, stroke: "#735d3f"}, lod: POINT_LOD}),
  "telephone-pole": definition({label: "Telephone pole", category: "utilities", geometryKinds: ["Point"], legacyEnvelope: true, legend: {...POLE_STYLE, stroke: "#52657b"}, lod: POINT_LOD}),
  "joint-use-pole": definition({label: "Joint-use pole", category: "utilities", geometryKinds: ["Point"], legacyEnvelope: true, legend: {...POLE_STYLE, stroke: "#66557a"}, lod: POINT_LOD}),
  "light-pole": definition({label: "Light pole", category: "utilities", geometryKinds: ["Point"], legacyEnvelope: true, legend: {...POLE_STYLE, fill: "#f0d682"}, lod: POINT_LOD}),
  "utility-line": definition({label: "Utility line", category: "utilities", geometryKinds: ["LineString"], legacyEnvelope: true, legend: UTILITY_LINE_STYLE, lod: LINE_LOD}),
  "electric-line": definition({label: "Electric line", category: "utilities", geometryKinds: ["LineString"], legacyEnvelope: true, legend: {...UTILITY_LINE_STYLE, stroke: "#735d3f"}, lod: LINE_LOD}),
  "telephone-line": definition({label: "Telephone line", category: "utilities", geometryKinds: ["LineString"], legacyEnvelope: true, legend: {...UTILITY_LINE_STYLE, stroke: "#52657b"}, lod: LINE_LOD}),

  water: definition({label: "Water feature", category: "water", geometryKinds: ["Polygon", "LineString", "Point"], defaultGeometryKind: "Polygon", legacyEnvelope: true, legend: WATER_AREA_STYLE, lod: AREA_LOD}),
  pond: definition({label: "Pond", category: "water", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: WATER_AREA_STYLE, lod: AREA_LOD}),
  stream: definition({label: "Stream", category: "water", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: {...CULVERT_STYLE, strokeDasharray: "none"}, lod: LINE_LOD}),
  well: definition({label: "Well", category: "water", geometryKinds: ["Point", "Polygon"], defaultGeometryKind: "Point", legacyEnvelope: true, legend: WATER_POINT_STYLE, lod: POINT_LOD}),
  spigot: definition({label: "Spigot", category: "water", geometryKinds: ["Point"], legacyEnvelope: true, legend: {...WATER_POINT_STYLE, symbol: "triangle"}, lod: POINT_LOD}),
  hydrant: definition({label: "Hydrant", category: "water", geometryKinds: ["Point"], legacyEnvelope: true, legend: {...WATER_POINT_STYLE, symbol: "square", fill: "#b75545"}, lod: POINT_LOD}),
  drain: definition({label: "Drain", category: "water", geometryKinds: ["Point", "LineString"], defaultGeometryKind: "Point", legacyEnvelope: true, legend: DRAIN_STYLE, lod: POINT_LOD}),
  culvert: definition({label: "Culvert", category: "water", geometryKinds: ["LineString", "Point"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: CULVERT_STYLE, lod: LINE_LOD}),
  "irrigation-line": definition({label: "Irrigation line", category: "water", geometryKinds: ["LineString"], legacyEnvelope: true, legend: {...CULVERT_STYLE, strokeWidth: 1.4, strokeDasharray: "2 2"}, lod: LINE_LOD}),

  orchard: definition({label: "Orchard", category: "landscape", geometryKinds: ["Polygon", "Point"], defaultGeometryKind: "Polygon", legacyEnvelope: true, legend: ORCHARD_STYLE, lod: AREA_LOD}),
  "garden-section": definition({label: "Garden section", category: "landscape", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: GARDEN_SECTION_STYLE, lod: AREA_LOD}),
  "garden-subplot": definition({label: "Garden subplot", category: "landscape", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: GARDEN_SUBPLOT_STYLE, lod: AREA_LOD}),
  "planted-border": definition({label: "Planted border", category: "landscape", geometryKinds: ["LineString", "Polygon"], defaultGeometryKind: "LineString", legacyEnvelope: true, legend: PLANTED_BORDER_STYLE, lod: LINE_LOD}),
  "garden-landmark": definition({label: "Garden landmark", category: "landscape", geometryKinds: ["Point"], legacyEnvelope: true, legend: GARDEN_LANDMARK_STYLE, lod: POINT_LOD}),
  "specimen-tree": definition({label: "Specimen tree", category: "landscape", geometryKinds: ["Point"], legacyEnvelope: true, legend: SPECIMEN_TREE_STYLE, lod: POINT_LOD}),
  amphitheater: definition({label: "Amphitheater", category: "landscape", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: AMPHITHEATER_STYLE, lod: AREA_LOD}),
  arboretum: definition({label: "Arboretum", category: "landscape", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: ARBORETUM_STYLE, lod: AREA_LOD}),
  "rock-garden": definition({label: "Rock garden", category: "landscape", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: ROCK_GARDEN_STYLE, lod: AREA_LOD}),
  meadow: definition({label: "Meadow", category: "landscape", geometryKinds: ["Polygon"], legacyEnvelope: true, legend: MEADOW_STYLE, lod: AREA_LOD})
};

export const SITE_FEATURE_DEFINITIONS = deepFreeze(Object.fromEntries(
  Object.entries(DEFINITION_SOURCE).map(([type, item], index) => [type, {
    type,
    known: true,
    order: index,
    ...item,
    visibilityKey: SITE_FEATURE_CATEGORIES[item.category].visibilityKey
  }])
));

export const SITE_FEATURE_TYPES = Object.freeze(Object.keys(SITE_FEATURE_DEFINITIONS));

export const DEFAULT_SITE_FEATURE_VISIBILITY = deepFreeze({
  showStructures: true,
  ...Object.fromEntries(Object.values(SITE_FEATURE_CATEGORIES).map((category) => [category.visibilityKey, true]))
});

const UNKNOWN_STYLE = deepFreeze(style("area", {
  fill: "#8a765f",
  fillOpacity: 0.28,
  stroke: "#6b7567",
  strokeDasharray: "3 2"
}));
const unknownDefinitions = new Map();

/** Return a stable kebab-case slug without restricting it to the bundled catalog. */
export function normalizeSiteFeatureType(value, fallback = "structure") {
  const slug = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function titleCaseSlug(value) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Resolve a known definition or a non-destructive generic definition. Unknown
 * slugs retain their normalized type instead of being coerced to `structure`.
 */
export function siteFeatureDefinition(value) {
  const type = normalizeSiteFeatureType(typeof value === "object" ? value?.type : value);
  if (SITE_FEATURE_DEFINITIONS[type]) return SITE_FEATURE_DEFINITIONS[type];
  if (!unknownDefinitions.has(type)) {
    unknownDefinitions.set(type, deepFreeze({
      type,
      known: false,
      label: titleCaseSlug(type),
      category: "buildings",
      visibilityKey: SITE_FEATURE_CATEGORIES.buildings.visibilityKey,
      geometryKinds: ["Polygon", "LineString", "Point"],
      defaultGeometryKind: "Polygon",
      legacyEnvelope: true,
      legend: UNKNOWN_STYLE,
      lod: AREA_LOD,
      order: Number.MAX_SAFE_INTEGER
    }));
  }
  return unknownDefinitions.get(type);
}

export function siteFeatureCategory(value) {
  return SITE_FEATURE_CATEGORIES[siteFeatureDefinition(value).category];
}

export function siteFeatureVisibilityKey(value) {
  return siteFeatureDefinition(value).visibilityKey;
}

/**
 * Expand the legacy `showStructures` master switch into category switches.
 * Explicit category values are retained, while omitted values inherit the master.
 */
export function normalizeSiteFeatureVisibility(settings = {}, legacyShowStructures = true) {
  const source = settings && typeof settings === "object" ? settings : {};
  const showStructures = source.showStructures === undefined
    ? legacyShowStructures !== false
    : source.showStructures !== false;
  const normalized = {showStructures};
  for (const category of Object.values(SITE_FEATURE_CATEGORIES)) {
    normalized[category.visibilityKey] = source[category.visibilityKey] === undefined
      ? showStructures
      : source[category.visibilityKey] !== false;
  }
  return normalized;
}

export function isSiteFeatureVisible(featureOrType, settings = DEFAULT_SITE_FEATURE_VISIBILITY) {
  const visibility = normalizeSiteFeatureVisibility(settings, settings?.showStructures !== false);
  return visibility.showStructures && visibility[siteFeatureVisibilityKey(featureOrType)] !== false;
}

export function filterVisibleSiteFeatures(features = [], settings = DEFAULT_SITE_FEATURE_VISIBILITY) {
  return Array.isArray(features)
    ? features.filter((feature) => isSiteFeatureVisible(feature, settings))
    : [];
}

/** A map-folio-compatible symbol/fill/line descriptor for one feature type. */
export function siteFeatureLegendDescriptor(featureOrType, settings = DEFAULT_SITE_FEATURE_VISIBILITY) {
  const item = siteFeatureDefinition(featureOrType);
  return {
    id: `site-feature:${item.type}`,
    type: item.type,
    label: item.label,
    category: item.category,
    geometryKind: item.defaultGeometryKind,
    active: isSiteFeatureVisible(item.type, settings),
    ...item.legend
  };
}

/**
 * Build a de-duplicated legend from feature records or type slugs. By default,
 * hidden entries are omitted, matching map-folio's active-item convention.
 */
export function siteFeatureLegendItems(featuresOrTypes = [], settings = DEFAULT_SITE_FEATURE_VISIBILITY, options = {}) {
  const types = new Set((Array.isArray(featuresOrTypes) ? featuresOrTypes : [])
    .map((item) => normalizeSiteFeatureType(typeof item === "object" ? item?.type : item)));
  const items = [...types].map((type) => siteFeatureLegendDescriptor(type, settings));
  const visibleItems = options.includeHidden ? items : items.filter((item) => item.active);
  return visibleItems.sort((first, second) => {
    const categoryOrder = SITE_FEATURE_CATEGORIES[first.category].order - SITE_FEATURE_CATEGORIES[second.category].order;
    if (categoryOrder) return categoryOrder;
    const definitionOrder = siteFeatureDefinition(first.type).order - siteFeatureDefinition(second.type).order;
    return definitionOrder || first.label.localeCompare(second.label);
  });
}
