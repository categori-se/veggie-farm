import {gardenHome} from "./garden-home.js";
import {recordPlantingObservation} from "../lib/garden/plantingJournal.js";
import {plannedSize} from "../lib/garden/plannedSize.js";
import {plannerSizeScenario} from "./planner-size-scenario.js";
import {solarSceneDirection,solarScenePolygons,bedShadowPolygons} from "../lib/spatial/solarScene.js";
import {plannerSunPreview} from "./planner-sun-preview.js";
import {illustrativePlanting} from "../lib/spatial/illustrativePlanting.js";
import {gardenResearch} from "../data/gardenResearch.js";
import {visiblePlannedPlacements} from "../lib/garden/plannedOccupancy.js";
import {plannerTimePreview} from "./planner-time-preview.js";
import {mappedSoil} from "./mapped-soil.js";
import LEGACY_PUBLIC_GARDENS from "../data/migrations/publicGardenStarters.js";
import {migratePublicGardenSite} from "../lib/spatial/publicGardenMigration.js";
import {spatialCollectionInspector} from "./spatialCollectionInspector.js";
import {defaultBedViewport, normalizeBedCamera, normalizeBedCameras, zoomBedCamera} from "../lib/spatial/bedCamera.js";
import {referenceMapInspector} from "./referenceMapInspector.js";
import {accountGardenPayload, mergeAccountGardens, isPublicDemo} from "../lib/garden/accountGardens.js";
import {notebookOwner} from "../lib/account/notebookStorage.js";
import {plannerAccount} from "./plannerAccount.js";
import {studioCollections} from "./studioCollections.js";
import {publicCollection} from "./publicCollection.js";
import {selectedSharedGarden} from "../lib/garden/sharedGarden.js";
import {parsePlannerBackup, MAX_PLANNER_BACKUP_BYTES, PLANNER_BACKUP_FORMAT} from "../lib/garden/plannerBackup.js";
import {persistPlannerState} from "../lib/garden/plannerStorage.js";
import {bedFillPositions} from "../lib/garden/bedFill.js";
import {modelAppliesToPlant} from "../lib/garden/plantModel.js";
import * as d3 from "npm:d3@7.9.0";
import * as THREE from "npm:three@0.184.0";
import {createImageLoadQueue} from "../lib/spatial/imageLoadQueue.js";
import {
  parcelImageryCoverage,
  tileBoundsLonLat,
  xyzTileUrl
} from "../lib/spatial/gisAlignment.js";
import {
  GARDEN_SPATIAL_SCHEMA_VERSION,
  gardenSpatialReference,
  gardenStateSpatialExport,
  localPointToLonLat,
  lonLatToLocalPoint
} from "../lib/spatial/gardenSpatial.js";
import {
  exteriorRingsArea,
  flattenExteriorRings,
  normalizeParcelGeometry as normalizeGeoJsonParcelGeometry,
  parcelExteriorRings
} from "../lib/spatial/parcelGeometry.js";
import {
  MIN_GARDEN_VIEW_SPAN_INCHES,
  clampViewportToExtent,
  fitViewportToBounds,
  gardenViewProfileForElement,
  scaleBarForView
} from "../lib/spatial/gardenViewScale.js";
import {groundOverlayLocalFrame} from "../lib/spatial/groundOverlay.js";
import {gardenSpatialDatasetToWorkspace} from "../lib/spatial/gardenFeatureCollections.js";
import {
  SPATIAL_INTERCHANGE_VERSION,
  gardenToGeoJsonText,
  gardenToKml,
  stageGeoJsonImport,
  stageKmlImport
} from "../lib/spatial/spatialInterchange.js";
import {
  derivedTreeCanopyEllipse,
  treeCrownAxesInches,
  updateTreeHeightEstimate
} from "../lib/spatial/treeObservation.js";
import {changeSiteGeometryVertex, localSiteGeometryError, localSiteGeometryVertices, updateConnectedSiteVertices} from "../lib/spatial/siteGeometryEditor.js";
import {getGardenSpatialDataset} from "../lib/data/publicCatalogApi.js";
import {
  BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION,
  migrateBerkshireBotanicalStarterLayout,
  sameStarterGeometry,
  upgradeStarterFeatures
} from "../lib/spatial/starterLayoutMigration.js";
import {
  DEFAULT_BEDS as INTERPRETED_DEFAULT_BEDS,
  DEFAULT_VEGETATION as INTERPRETED_DEFAULT_VEGETATION,
  FALLBACK_MASSGIS_PARCEL_SERVICE,
  MASSGIS_PARCEL_SERVICE,
  PROPERTY_CONTEXT,
  PROPERTY_STRUCTURES as INTERPRETED_PROPERTY_STRUCTURES
} from "../data/propertyContext.js";
import {migrateBerkshireBotanicalDemoPlacements} from "../data/migrations/berkshireBotanicalDemoPlacements.js";
import {
  BERKSHIRE_GARDEN_REFERENCES,
  gardenReferenceById,
  gardenReferenceSourceById
} from "../data/gardenCatalog.js";
import {FLOWER_CATALOG, FLOWER_DATA_SOURCES, flowerSourceById} from "../data/flowerCatalog.js";
import {
  SITE_FEATURE_TYPES,
  filterVisibleSiteFeatures,
  normalizeSiteFeatureType,
  normalizeSiteFeatureVisibility,
  siteFeatureDefinition,
  siteFeatureLegendItems
} from "../data/siteFeatureCatalog.js";

// Drafts are deliberately excluded from browser saves and account backups.
const siteGeometryDrafts = new WeakMap();
const loadParcelImage = createImageLoadQueue();
const PLANNER_OWNER = notebookOwner();
const STORAGE_KEY = PLANNER_OWNER ? `veggie.farm:account-planner:${encodeURIComponent(PLANNER_OWNER)}:v8` : "veggie.farm:garden-studio:v8";
const LEGACY_STORAGE_KEYS = [
  "veggie.farm:garden-studio:v7",
  "veggie.farm:garden-studio:v6",
  "veggie.farm:garden-studio:v5",
  "veggie.farm:garden-studio:v4",
  "veggie.farm:garden-studio:v3"
];
const referenceSiteWorkspaces = new Map();
const DEFAULT_MAP_SETTINGS = {
  showImagery: true,
  showReferenceOverlay: false,
  referenceOverlayOpacity: 0.45,
  showParcel: true,
  showStructures: true,
  showVegetation: true,
  showPlantings: true,
  showBuildings: true,
  showCirculation: true,
  showBarriers: true,
  showUtilities: true,
  showWater: true,
  showLandscapeFeatures: true,
  bedVisibility: "all"
};
const DEFAULT_VIEW_BEARING = 0;
const DEFAULT_VIEW_PITCH = 45;
// Source evidence is intentionally runtime-only: these collections are useful
// for comparing rough KML/KMZ traces with the canonical plan, but must never be
// merged into workspace state, browser saves, or spatial exports implicitly.
const SOURCE_EVIDENCE_RUNTIME = new WeakMap();
// User imports are a separate runtime-only comparison sidecar. A valid upload
// does not become canonical planner state, a named layout, or part of a later
// export until a future curation workflow explicitly promotes reviewed records.
const SPATIAL_IMPORT_REVIEW_RUNTIME = new WeakMap();
const MAX_SPATIAL_IMPORT_BYTES = 20 * 1024 * 1024;
// The browser planner consumes the same project-owned CRS84 collections as the
// public API. Local-inch features are only a derived editing projection; their
// canonical geometry and provenance remain attached through save/export.
const BERKSHIRE_BOTANICAL_SPATIAL_DATASET = getGardenSpatialDataset(PROPERTY_CONTEXT.id);
const BERKSHIRE_BOTANICAL_CANONICAL_WORKSPACE = gardenSpatialDatasetToWorkspace(
  BERKSHIRE_BOTANICAL_SPATIAL_DATASET,
  PROPERTY_CONTEXT
);
const DEFAULT_BEDS = BERKSHIRE_BOTANICAL_CANONICAL_WORKSPACE.beds;
const PROPERTY_STRUCTURES = BERKSHIRE_BOTANICAL_CANONICAL_WORKSPACE.structures;
const DEFAULT_VEGETATION = BERKSHIRE_BOTANICAL_CANONICAL_WORKSPACE.vegetation;
const DEFAULT_PLACEMENTS = BERKSHIRE_BOTANICAL_CANONICAL_WORKSPACE.placements;
// Revision 5 removes four indicative KMZ points that revision 4 briefly exposed
// as canonical observations. The migration retires only untouched bundled
// records; user-edited or user-created placements remain intact.
const DEFAULT_STARTER_LAYOUT_REVISION = Math.max(BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION + 2, 5);
const DEFAULT_ACTIVE_BED_ID = DEFAULT_BEDS[0].id;
// The active tray tool is also the write lock for the spatial canvas. All
// layers stay visible and inspectable, but only one feature family can mutate
// at a time. This mirrors desktop GIS editors, where selecting a feature does
// not silently make its source layer editable.
const PLANNER_EDIT_LAYER_BY_TOOL = Object.freeze({
  beds: "beds",
  plants: "plants",
  flowers: "plants",
  structures: "site",
  vegetation: "vegetation"
});
const PLANNER_EDIT_LAYER_BY_FEATURE = Object.freeze({
  bed: "beds",
  placement: "plants",
  structure: "site",
  vegetation: "vegetation"
});

export function plannerEditLayerForTool(tool) {
  return PLANNER_EDIT_LAYER_BY_TOOL[tool] || null;
}

const explicitEditSessions = new WeakMap();
export function plannerCanEditFeature(state, featureType) {
  const session = state && explicitEditSessions.get(state);
  return Boolean(session && session.gardenId === state.activeParcelId && session.tool === state.activeTool && session.layer === PLANNER_EDIT_LAYER_BY_FEATURE[featureType]);
}
function beginExplicitEditing(state) {
  const layer = plannerEditLayerForTool(state.activeTool);
  if (layer) explicitEditSessions.set(state, {gardenId: state.activeParcelId, tool: state.activeTool, layer});
}

function plannerEditToolForFeature(state, featureType) {
  if (featureType === "bed") return "beds";
  if (featureType === "structure") return "structures";
  if (featureType === "vegetation") return "vegetation";
  if (featureType === "placement") {
    const placement = selectedPlacement(state);
    return plantById(state, placement?.plantId)?.group === "Flower" ? "flowers" : "plants";
  }
  return "select";
}

function plannerEditLayerLabel(layer) {
  return ({beds: "beds", plants: "plantings", site: "site features", vegetation: "vegetation"})[layer] || "inspect only";
}
// Site systems are not garden furniture: a woodland compartment, access road,
// fence, or utility run can legitimately span an entire estate. Keep a finite
// guardrail for malformed imports while allowing features up to ten miles long.
const MAX_SITE_FEATURE_SPAN_INCHES = 10 * 5280 * 12;
const DEMO_STRUCTURE_IDS = new Set([
  "house-roof",
  "greenhouse-10x12",
  "compost-bay",
  "mulch-path",
  "water-manifold",
  "orchard-edge"
]);
const MASSGIS_PARCEL_SERVICES = [MASSGIS_PARCEL_SERVICE, FALLBACK_MASSGIS_PARCEL_SERVICE];
const MASSGIS_PARCEL_OUT_FIELDS = [
  "OBJECTID",
  "MAP_PAR_ID",
  "LOC_ID",
  "PROP_ID",
  "SITE_ADDR",
  "CITY",
  "ADDR_NUM",
  "FULL_STR",
  "LOT_SIZE",
  "LOT_UNITS",
  "FY",
  "Shape__Area"
];
const PRIVATE_PARCEL_ATTRIBUTE_FIELDS = new Set([
  "OWNER1",
  "OWNER2",
  "OWNER_ADDR",
  "OWN_ADDR",
  "OWN_CITY",
  "OWN_STATE",
  "OWN_ZIP",
  "SITE_ADDR",
  "CITY",
  "ADDR_NUM",
  "FULL_STR",
  "LOCATION"
]);

const CORE_PLANTS = [
  {
    id: "tomato",
    name: "Tomato",
    group: "Fruiting",
    matureDiameter: 28,
    spacing: 30,
    height: 56,
    sun: "Full sun",
    soil: "Loamy, even fertility",
    waterStyle: "Deep watering",
    waterCadence: "2 deep cycles weekly",
    emitter: "2 x 1 gph emitters",
    zone: "A",
    gauge: "1/2 in main, 1/4 in laterals",
    color: "#c64d3d",
    leafColor: "#3f8f5f",
    visual: {
      habit: "vine",
      leafShape: "compound",
      leafCount: 34,
      density: 1.25,
      layers: 5,
      leafLength: 9,
      leafWidth: 3.4,
      heightProfile: "upright",
      fruitColor: "#ca4335"
    },
    seed: 12
  },
  {
    id: "basil",
    name: "Basil",
    group: "Herb",
    matureDiameter: 16,
    spacing: 14,
    height: 22,
    sun: "Full sun",
    soil: "Rich, quick draining",
    waterStyle: "Consistent moisture",
    waterCadence: "Short cycles every 1-2 days",
    emitter: "1 x 0.5 gph emitter",
    zone: "B",
    gauge: "1/4 in microline",
    color: "#5d9f64",
    leafColor: "#2f7d43",
    visual: {
      habit: "paired",
      leafShape: "oval",
      leafCount: 30,
      density: 1.35,
      layers: 3,
      leafLength: 4.8,
      leafWidth: 2.7,
      heightProfile: "mounded"
    },
    seed: 28
  },
  {
    id: "kale",
    name: "Kale",
    group: "Leafy",
    matureDiameter: 24,
    spacing: 18,
    height: 24,
    sun: "Sun to part shade",
    soil: "Nitrogen rich, steady moisture",
    waterStyle: "Consistent moisture",
    waterCadence: "Moderate cycles 2-3x weekly",
    emitter: "Dripline at 9 in spacing",
    zone: "B",
    gauge: "1/4 in dripline",
    color: "#4d7f6a",
    leafColor: "#355f52",
    visual: {
      habit: "rosette",
      leafShape: "lobed",
      leafCount: 18,
      density: 1.12,
      layers: 4,
      leafLength: 8.5,
      leafWidth: 4.2,
      heightProfile: "upright"
    },
    seed: 36
  },
  {
    id: "lettuce",
    name: "Lettuce",
    group: "Seed bed",
    matureDiameter: 12,
    spacing: 10,
    height: 10,
    sun: "Morning sun",
    soil: "Fine seed bed, cool and moist",
    waterStyle: "Light frequent watering",
    waterCadence: "Brief daily pulses in heat",
    emitter: "Mist or 6 in dripline",
    zone: "C",
    gauge: "1/4 in dripline",
    color: "#8abd55",
    leafColor: "#6a9e40",
    visual: {
      habit: "rosette",
      leafShape: "spoon",
      leafCount: 22,
      density: 1.4,
      layers: 3,
      leafLength: 5.2,
      leafWidth: 3.8,
      heightProfile: "low"
    },
    seed: 47
  },
  {
    id: "carrot",
    name: "Carrot",
    group: "Root",
    matureDiameter: 5,
    spacing: 3,
    height: 12,
    sun: "Full sun",
    soil: "Loose, stone-free, deep",
    waterStyle: "Light frequent watering",
    waterCadence: "Even surface moisture until sized",
    emitter: "Dripline at 4-6 in spacing",
    zone: "C",
    gauge: "1/4 in dripline",
    color: "#d48436",
    leafColor: "#5f9b4a",
    visual: {
      habit: "frond",
      leafShape: "filament",
      leafCount: 28,
      density: 1.15,
      layers: 4,
      leafLength: 6.4,
      leafWidth: 0.8,
      heightProfile: "tuft",
      rootColor: "#d48436"
    },
    seed: 55
  },
  {
    id: "blueberry",
    name: "Blueberry",
    group: "Perennial",
    matureDiameter: 42,
    spacing: 48,
    height: 60,
    sun: "Full sun",
    soil: "Acidic, mulched, high organic matter",
    waterStyle: "Deep watering",
    waterCadence: "Slow soak weekly, more in fruit",
    emitter: "2-4 x 1 gph emitters",
    zone: "D",
    gauge: "1/2 in main, pressure regulated",
    color: "#5369a6",
    leafColor: "#3f7656",
    visual: {
      habit: "shrub",
      leafShape: "small-oval",
      leafCount: 44,
      density: 1.3,
      layers: 5,
      leafLength: 5.5,
      leafWidth: 2.5,
      heightProfile: "woody",
      fruitColor: "#5369a6"
    },
    seed: 68
  },
  {
    id: "nasturtium",
    name: "Nasturtium",
    group: "Companion",
    matureDiameter: 20,
    spacing: 16,
    height: 12,
    sun: "Sun to part shade",
    soil: "Lean to average",
    waterStyle: "Moderate watering",
    waterCadence: "One moderate cycle weekly",
    emitter: "1 x 0.5 gph emitter",
    zone: "A",
    gauge: "1/4 in microline",
    color: "#db8b2d",
    leafColor: "#4f8e57",
    visual: {
      habit: "trailing",
      leafShape: "round",
      leafCount: 26,
      density: 1.18,
      layers: 2,
      leafLength: 4.8,
      leafWidth: 4.8,
      heightProfile: "low",
      flowerColor: "#db8b2d"
    },
    seed: 81
  },
  {
    id: "eastern-white-pine",
    name: "Eastern White Pine",
    group: "Native Tree",
    matureDiameter: 480,
    spacing: 360,
    height: 900,
    sun: "Full sun to part shade",
    soil: "Acidic, well-drained woodland soil",
    waterStyle: "Established drought tolerant",
    waterCadence: "Deep watering during establishment only",
    emitter: "Tree ring or slow soaker while establishing",
    zone: "Canopy",
    gauge: "Separate tree establishment zone",
    color: "#2f6650",
    leafColor: "#2f6650",
    visual: {
      habit: "conifer",
      leafShape: "filament",
      leafCount: 72,
      density: 1.45,
      layers: 7,
      leafLength: 14,
      leafWidth: 1.1,
      heightProfile: "woody"
    },
    seed: 104
  },
  {
    id: "red-maple",
    name: "Red Maple",
    group: "Native Tree",
    matureDiameter: 420,
    spacing: 360,
    height: 720,
    sun: "Sun to part shade",
    soil: "Moist to average, adaptable",
    waterStyle: "Deep establishment watering",
    waterCadence: "Weekly deep soak during establishment",
    emitter: "Tree ring or slow soaker while establishing",
    zone: "Canopy",
    gauge: "Separate tree establishment zone",
    color: "#7c8f4d",
    leafColor: "#5f7f48",
    visual: {
      habit: "tree",
      leafShape: "lobed",
      leafCount: 62,
      density: 1.15,
      layers: 6,
      leafLength: 12,
      leafWidth: 9,
      heightProfile: "woody"
    },
    seed: 118
  },
  {
    id: "sugar-maple",
    name: "Sugar Maple",
    group: "Native Tree",
    matureDiameter: 540,
    spacing: 420,
    height: 840,
    sun: "Sun to part shade",
    soil: "Rich, cool, well-drained",
    waterStyle: "Deep establishment watering",
    waterCadence: "Weekly deep soak during dry establishment periods",
    emitter: "Tree ring or slow soaker while establishing",
    zone: "Canopy",
    gauge: "Separate tree establishment zone",
    color: "#79945a",
    leafColor: "#567448",
    visual: {
      habit: "tree",
      leafShape: "lobed",
      leafCount: 70,
      density: 1.12,
      layers: 7,
      leafLength: 13,
      leafWidth: 10,
      heightProfile: "woody"
    },
    seed: 132
  },
  {
    id: "northern-red-oak",
    name: "Northern Red Oak",
    group: "Native Tree",
    matureDiameter: 600,
    spacing: 480,
    height: 900,
    sun: "Full sun to part shade",
    soil: "Well-drained acidic upland soil",
    waterStyle: "Deep establishment watering",
    waterCadence: "Weekly deep soak during establishment",
    emitter: "Tree ring or slow soaker while establishing",
    zone: "Canopy",
    gauge: "Separate tree establishment zone",
    color: "#6f7f4e",
    leafColor: "#4f6f43",
    visual: {
      habit: "tree",
      leafShape: "lobed",
      leafCount: 76,
      density: 1.08,
      layers: 7,
      leafLength: 14,
      leafWidth: 8,
      heightProfile: "woody"
    },
    seed: 146
  },
  {
    id: "eastern-hemlock",
    name: "Eastern Hemlock",
    group: "Native Tree",
    matureDiameter: 420,
    spacing: 360,
    height: 720,
    sun: "Part shade to shade",
    soil: "Cool, acidic, evenly moist",
    waterStyle: "Consistent establishment moisture",
    waterCadence: "Slow deep soak during dry establishment periods",
    emitter: "Tree ring or slow soaker while establishing",
    zone: "Canopy",
    gauge: "Separate tree establishment zone",
    color: "#2f5d4a",
    leafColor: "#2f5d4a",
    visual: {
      habit: "conifer",
      leafShape: "filament",
      leafCount: 68,
      density: 1.4,
      layers: 7,
      leafLength: 10,
      leafWidth: 1,
      heightProfile: "woody"
    },
    seed: 159
  }
];

const DEFAULT_PLANTS = [...CORE_PLANTS, ...FLOWER_CATALOG];

function proposedBedPlantings(beds, existing = [], plants = DEFAULT_PLANTS) {
  const occupied = new Set(existing.map(p => p.bedId));
  const palette = ["lettuce", "kale", "carrot", "basil", "tomato", "nasturtium"].map(id => plants.find(p => p.id === id)).filter(Boolean);
  const blooms = plants.filter(p => /\b(aster|coneflower|bee balm|goldenrod)\b/i.test(p.name));
  return beds.filter(b => !occupied.has(b.id)).flatMap((bed, index) => {
    const flowering = /flower|border|terrace|spring greens/i.test(bed.name);
    const choices = flowering && blooms.length ? blooms : palette;
    const plant = choices[index % choices.length];
    if (!plant) return [];
    return bedFillPositions(normalizeBed(bed), plant).slice(0, 24).map((point, j) => ({id:`${bed.id}-proposal-${j}`,bedId:bed.id,plantId:plant.id,...point,health:"planned",rotation:0,notes:"Illustrative planting inspired by public garden themes; species and placement are proposed, not verified specimens."}));
  });
}

const DEFAULT_STATE = {
  viewMode: "garden",
  viewPresentation: "map",
  activeTool: "beds",
  toolDrawerOpen: false,
  inspectorOpen: false,
  inspectorMode: "bed",
  inspectorTab: "edit",
  layoutName: "BBG edible garden study",
  layouts: [],
  activeParcelId: PROPERTY_CONTEXT.id,
  parcels: [{
    id: PROPERTY_CONTEXT.id,
    name: PROPERTY_CONTEXT.name,
    property: PROPERTY_CONTEXT,
    activeBedId: DEFAULT_ACTIVE_BED_ID,
    beds: DEFAULT_BEDS,
    structures: PROPERTY_STRUCTURES,
    vegetation: DEFAULT_VEGETATION,
    placements: DEFAULT_PLACEMENTS,
    selectedVegetationId: null,
    selectedStructureId: null,
    selectedPlacementId: null,
    starterLayoutRevision: DEFAULT_STARTER_LAYOUT_REVISION,
    parcelBufferInches: 1800,
    parcelViewport: null,
    viewBearing: DEFAULT_VIEW_BEARING,
    viewPitch: DEFAULT_VIEW_PITCH
  }],
  property: PROPERTY_CONTEXT,
  basemapId: PROPERTY_CONTEXT.imagery.activeBasemapId,
  activeBedId: DEFAULT_ACTIVE_BED_ID,
  beds: DEFAULT_BEDS,
  structures: PROPERTY_STRUCTURES,
  vegetation: DEFAULT_VEGETATION,
  selectedVegetationId: null,
  selectedStructureId: null,
  starterLayoutRevision: DEFAULT_STARTER_LAYOUT_REVISION,
  parcelBufferInches: 1800,
  parcelViewport: null,
  viewBearing: DEFAULT_VIEW_BEARING,
  viewPitch: DEFAULT_VIEW_PITCH,
  showVegetation: true,
  vegetationOpacity: 0.62,
  mapSettings: {...DEFAULT_MAP_SETTINGS},
  bed: bedControlSnapshot(DEFAULT_BEDS[0]),
  selectedPlantId: "tomato",
  selectedPlacementId: null,
  placements: DEFAULT_PLACEMENTS
};

DEFAULT_STATE.parcels[0].placements = DEFAULT_STATE.placements;
DEFAULT_STATE.placements = [...DEFAULT_STATE.placements, ...proposedBedPlantings(DEFAULT_BEDS, DEFAULT_STATE.placements)];
DEFAULT_STATE.parcels[0].placements = DEFAULT_STATE.placements;
DEFAULT_STATE.parcels[0].selectedPlacementId = DEFAULT_STATE.selectedPlacementId;
for (const reference of BERKSHIRE_GARDEN_REFERENCES.filter((garden) => garden.id !== PROPERTY_CONTEXT.id)) {
  DEFAULT_STATE.parcels.push(createReferenceGardenWorkspace(reference));
}

let stylesInjected = false;

const plannerStorageOverrides = new WeakMap();
export function gardenPlanner(options = {}) {
  injectStyles();
  let hadSavedState = false;
  try { hadSavedState = Boolean((options.storage || localStorage).getItem(STORAGE_KEY)); } catch { /* Fresh, nonpersistent canvas. */ }
  const state = loadState(options.storage);
  if (!options.initialState) {
    explicitEditSessions.delete(state); state.activeTool = "select";
    state.inspectorOpen = false;
    state.toolDrawerOpen = false;
  }
  if(options.initialState){Object.assign(state,parsePlannerBackup(JSON.stringify(options.initialState)));normalizeStateShape(state);}
  if(options.storage)plannerStorageOverrides.set(state,options.storage);
  let exploringDemos = !PLANNER_OWNER;
  if (PLANNER_OWNER) {
    const own = state.parcels.find(workspace => !isPublicDemo(workspace));
    if (own) applyParcelWorkspace(state, own);
  }
  applyGardenReferenceOverlayAssets(state, options.referenceOverlayAssets);
  // Both the registered source-map raster and its indicative KMZ vectors start
  // off. A reviewer can opt into either comparison layer in Map settings, but
  // opening the planner never makes rough evidence look like canonical data.
  configureGardenSourceEvidence(state, options.sourceEvidenceByGardenId, options.showSourceEvidence === true);
  configureSpatialImportReview(state);
  const root = document.createElement("div");
  root.className = "garden-planner-app";
  root.id = "garden-studio";
  state.previewDate = null;
  let interacted = false;
  for (const event of ['pointerdown','keydown','input']) root.addEventListener(event,() => {interacted = true;},{capture:true});
  const viewNavigationMarkup = `
    <div class="view-navigation" aria-label="Shared view navigation" title="Drag to pan · wheel to zoom · Ctrl-drag or right-drag to rotate and change pitch">
      <button data-view-nav="pan" type="button" aria-label="Pan mode — move the view without editing" title="Pan mode: drag anywhere without moving garden elements">Pan</button>
      <button data-view-nav="zoom-in" type="button" aria-label="Zoom in" title="Zoom in">+</button>
      <button data-view-nav="zoom-out" type="button" aria-label="Zoom out" title="Zoom out">−</button>
      <details class="camera-panel"><summary>Camera</summary><div class="camera-panel-body">
        <button data-view-nav="north-up" type="button" aria-label="Reset north and overhead"><span data-role="view-compass" aria-hidden="true">↑</span> North / overhead</button>
        <label>Heading <input data-camera="bearing" type="range" min="-180" max="180" step="1" aria-label="Camera heading in degrees"></label>
        <label>Tilt <input data-camera="pitch" type="range" min="0" max="75" step="1" aria-label="Camera tilt in degrees"></label>
        <small data-role="view-navigation-status"></small>
        <button data-view-nav="fit-parcel" type="button">Fit garden</button>
        <button data-view-nav="fit-plan" type="button">Fit features</button>
        <button data-view-nav="fit-selection" type="button">Fit selection</button>
        <button data-view-nav="capture" type="button">Save 3D image</button>
        <small data-role="capture-status" role="status"></small>
        <p>Drag to pan. Ctrl/right-drag rotates and tilts. On touch, use these sliders and +/−. Walk uses a flat surface at 5½ ft eye height; no obstacle collision. Image captures are illustrative, not measured sunlight.</p>
        <button data-view-nav="close-camera" type="button">Close camera controls</button>
      </div></details>
    </div>
    <div class="walk-buttons" data-role="walk-controls" role="group" aria-label="Walk around the garden" hidden>
      <button data-view-nav="walk-left" type="button" aria-label="Turn left" title="Turn left (A or left arrow)">↶</button>
      <button data-view-nav="walk-forward" type="button" title="Step forward (W or up arrow)">↑ Forward</button>
      <button data-view-nav="walk-back" type="button" title="Step backward (S or down arrow)">↓ Back</button>
      <button data-view-nav="walk-right" type="button" aria-label="Turn right" title="Turn right (D or right arrow)">↷</button>
    </div>
    <div class="view-gesture-hint">Pan mode: drag anywhere · wheel zoom · Ctrl/right-drag rotate</div>
  `;
  root.innerHTML = `
    <section class="planner-quick-start" aria-label="Start a garden plan">
      <div><strong>Garden Planning Studio</strong><p>Try an editable 4 × 8 ft bed. No account needed.</p></div>
      <button data-role="start-practice-garden" type="button">Start a practice garden</button>
    </section>
    <div class="garden-shell">
      <header class="garden-topbar">
        <div>
          <h1>Planning canvas</h1>
          <div class="garden-subtitle" data-role="garden-subtitle">${escapeHtml(state.property?.name || "Massachusetts parcel")} · parcel context, plant spacing, mature canopy, and irrigation zones</div>
        </div>
      </header>

      <div class="garden-layout" data-role="garden-layout">
        <nav class="garden-tool-rail" aria-label="Planner tools">
          <button data-tool="select" type="button" aria-label="Pan mode — close editing tools" title="Pan without editing"><span aria-hidden="true">↔</span><small>Pan</small></button>
          <button data-tool="parcel" type="button" aria-label="Open garden and parcel tools" title="Garden and parcel"><span aria-hidden="true">◇</span><small>Garden</small></button>
          <button data-tool="beds" type="button" aria-label="Open garden bed tools" title="Beds"><span aria-hidden="true">▦</span><small>Beds</small></button>
          <button data-tool="plants" type="button" aria-label="Open plant library" title="Plants"><span aria-hidden="true">♧</span><small>Plants</small></button>
          <button data-tool="flowers" type="button" aria-label="Open data-backed flower reference" title="Flowers"><span aria-hidden="true">✿</span><small>Flowers</small></button>
          <button data-tool="structures" type="button" aria-label="Open buildings and infrastructure tools" title="Site features"><span aria-hidden="true">▤</span><small>Site</small></button>
          <button data-tool="vegetation" type="button" aria-label="Open vegetation tools" title="Vegetation"><span aria-hidden="true">♣</span><small>Canopy</small></button>
        </nav>

        <aside class="garden-sidebar" data-role="tool-drawer" aria-label="Planner tool drawer">
          <header class="drawer-heading">
            <div><span>Tool</span><strong data-role="tool-drawer-title">Beds</strong></div>
            <button data-action="close-tool-drawer" type="button" aria-label="Close tool drawer" title="Close">×</button>
          </header>

          <section class="planner-section tool-panel" data-tool-panel="parcel">
            <div class="property-card" data-role="property-card"></div>
            <div data-role="spatial-collection-inspector"></div>
            <details class="advanced-disclosure"><summary>Garden identity and parcel lookup</summary><div data-role="parcel-editor"></div></details>
          </section>

          <section class="planner-section tool-panel" data-tool-panel="beds">
            <div class="section-heading"><span>Garden beds</span><span class="section-count" data-role="bed-count"></span></div>
            <div class="bed-list" data-role="bed-list"></div>
            <details class="advanced-disclosure"><summary>Seasonal examples &amp; snapshots</summary><label>Month<input data-role="snapshot-month" type="month" value="${todayIso().slice(0,7)}"></label><button type="button" data-action="populate-empty-beds">Populate empty example beds</button><button type="button" data-action="seasonal-example">Add seasonal example beds</button><button type="button" data-action="bed-snapshot">Save selected bed snapshot</button><p data-role="snapshot-status" role="status">Example plantings are proposed designs, not records of this garden. Winter beds may be resting.</p></details>
            <div class="drawer-action-row">
              <button data-action="add-bed" type="button">+ Add bed</button>
              <button data-action="draw-bed" type="button">Draw polygon</button>
              <button data-action="finish-bed" type="button">Finish polygon</button>
              <button data-action="cancel-draw" type="button">Cancel</button>
            </div>
          </section>

          <section class="planner-section tool-panel" data-tool-panel="plants">
            <button type="button" data-action="plant-gallery">3D plant library</button><button type="button" data-action="bed-seasons">Seasons</button><button type="button" data-action="garden-home">My garden · Log</button>
            <div class="section-heading"><span>Plant library</span><span class="section-count" data-role="plant-count"></span></div>
            <input class="search-input" data-role="plant-search" type="search" aria-label="Filter plants" placeholder="Filter plants">
            <p class="library-help">Choose a plant and Add selected, or drag it into the bed. Existing plants stay locked until you choose Edit plants.</p>
            <div class="plant-list" data-role="plant-list"></div>
            <div class="drawer-action-row">
              <button class="primary-action" data-action="add-selected" type="button">Add to selected bed</button>
              <button data-action="fill-bed" type="button">Fill bed</button>
            </div>
            <p data-role="fill-bed-status" role="status" hidden></p>
            <details class="advanced-disclosure">
              <summary>+ Create custom plant</summary>
              <form class="plant-form" data-role="plant-form">
                <input name="name" type="text" placeholder="Plant name" required>
                <div class="form-grid">
                  <label><span>Canopy in</span><input name="matureDiameter" type="number" min="2" max="120" step="1" value="18"></label>
                  <label><span>Spacing in</span><input name="spacing" type="number" min="2" max="144" step="1" value="18"></label>
                  <label><span>Height in</span><input name="height" type="number" min="2" max="120" step="1" value="24"></label>
                  <label><span>Zone</span><input name="zone" type="text" maxlength="4" value="A"></label>
                </div>
                <details class="nested-disclosure">
                  <summary>Water, soil, and irrigation</summary>
                  <label><span>Watering</span><select name="waterStyle"><option>Deep watering</option><option>Consistent moisture</option><option>Light frequent watering</option><option>Moderate watering</option></select></label>
                  <input name="waterCadence" type="text" value="Moderate cycles 2x weekly" placeholder="Water cadence">
                  <input name="soil" type="text" value="Loamy, compost amended" placeholder="Soil preference">
                  <input name="emitter" type="text" value="1 x 0.5 gph emitter" placeholder="Drip emitter">
                </details>
                <button type="submit">Create plant</button>
              </form>
            </details>
          </section>

          <section class="planner-section tool-panel flower-tool-panel" data-tool-panel="flowers">
            <div class="section-heading"><span>Flower reference</span><span class="section-count" data-role="flower-count"></span></div>
            <div class="flower-context" data-role="flower-context"></div>
            <div class="flower-filter-grid" aria-label="Flower filters">
              <input class="search-input" data-role="flower-search" type="search" aria-label="Search flowers" placeholder="Search flowers">
              <select data-role="flower-season" aria-label="Filter flowers by bloom season">
                <option value="all">Any bloom</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
              </select>
              <select data-role="flower-light" aria-label="Filter flowers by light">
                <option value="all">Any light</option>
                <option value="full sun">Full sun</option>
                <option value="part shade">Part shade</option>
                <option value="shade">Shade</option>
              </select>
              <select data-role="flower-moisture" aria-label="Filter flowers by soil moisture">
                <option value="all">Any moisture</option>
                <option value="dry">Dry</option>
                <option value="average">Average</option>
                <option value="moist">Moist</option>
                <option value="wet">Wet</option>
              </select>
            </div>
            <div class="flower-list" data-role="flower-list"></div>
            <div class="drawer-action-row">
              <button class="primary-action" data-action="add-selected-flower" type="button">Add flower to bed</button>
            </div>
            <details class="advanced-disclosure flower-sources">
              <summary>Data sources and limits</summary>
              <p>Conditions come from public government and Extension references. Bed footprints are planning proxies; cultivar dimensions and the site itself still need checking.</p>
              <div class="flower-source-list" data-role="flower-sources">
                ${Object.values(FLOWER_DATA_SOURCES).map((source) => `
                  <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
                    <strong>${escapeHtml(source.title)}</strong>
                    <span>${escapeHtml(source.publisher)} · ${escapeHtml(source.access)}</span>
                  </a>
                `).join("")}
              </div>
            </details>
          </section>

          <section class="planner-section tool-panel" data-tool-panel="structures">
            <div class="section-heading"><span>Site features</span><span class="section-count" data-role="structure-count"></span></div>
            <label>Find site features<input type="search" data-role="structure-search" placeholder="Name or type"></label>
            <div class="structure-list" data-role="structure-list"></div>
            <button data-action="add-structure" type="button">+ Add site feature</button>
            <div data-role="reference-map-inspector"></div>
          </section>

          <section class="planner-section tool-panel" data-tool-panel="vegetation">
            <div class="section-heading"><span>Site trees & vegetation</span><span class="section-count" data-role="vegetation-count"></span></div>
            <div class="planting-palette" aria-label="Structural planting palette">
              <button type="button" data-planting="tree"><span aria-hidden="true">♣</span>Deciduous tree</button>
              <button type="button" data-planting="evergreen"><span aria-hidden="true">▲</span>Evergreen tree</button>
              <button type="button" data-planting="shrub"><span aria-hidden="true">●</span>Shrub</button>
              <button type="button" data-planting="hedge"><span aria-hidden="true">▰</span>Hedge mass</button>
              <button type="button" data-planting="canopy"><span aria-hidden="true">♣♣</span>Canopy area</button>
            </div>
            <p>Choose a form, then click the map to place it. Sizes are editable planning estimates; species is unspecified. Hedge masses are area placeholders, not traced hedge lines.</p>
            <label>Find vegetation features<input type="search" data-role="vegetation-search" placeholder="Name or type"></label>
            <div class="vegetation-list" data-role="vegetation-list"></div>
            <button data-action="add-vegetation" type="button">+ Plan a tree</button>
            <button data-action="mark-tree" type="button">Mark existing tree on map</button>
            <p data-role="tree-placement-status" role="status" hidden>Click the aerial map at the tree center. Crown size starts as an estimate; refine it in the inspector. Escape cancels.</p>
          </section>
        </aside>

        <main class="garden-workspace" data-role="garden-workspace">
          <section class="planner-commandbar" aria-label="Planner command bar">
            <label class="garden-switcher">
              <span>Garden</span>
              <select data-control="activeGarden" aria-label="Active garden"></select>
            </label>
            <div class="view-tray" role="group" aria-label="Canvas view">
              <button data-presentation="map" type="button" title="Parcel map">Map</button>
              <button data-presentation="2d" type="button" title="Two-dimensional garden plan">2D</button>
              <button data-presentation="3d" type="button" title="Three-dimensional canopy preview">3D</button>
              <button data-presentation="split" type="button" title="Split two- and three-dimensional views">Split</button>
            </div>
            <span class="edit-mode-status" data-role="edit-mode-status" role="status">
              <span data-role="edit-mode-icon" aria-hidden="true">✎</span>
              <strong data-role="edit-mode-label">Inspect only</strong>
              <button data-action="toggle-edit-lock" type="button">Edit layer</button>
              <button data-action="cancel-tree" type="button" hidden>Cancel tree placement</button>
            </span>
            <label class="focus-control">
              <span>Focus</span>
              <select data-control="viewMode"><option value="garden">Adaptive site plan</option><option value="bed">Active bed detail</option></select>
            </label>
            <button class="active-bed-command" data-action="open-bed-tool" type="button" title="Open garden beds"><span>Bed</span><strong data-role="active-bed-name"></strong></button>
            <button class="save-command" data-action="save-layout" type="button">Save</button>
            <details class="project-menu">
              <summary aria-label="Open garden and layout menu" title="Gardens and saved layouts">•••</summary>
              <div class="project-menu-panel">
                <div class="project-menu-heading"><span>Garden collection</span><strong data-role="garden-count"></strong></div>
                <div class="project-action-grid">
                  <button data-action="create-garden" type="button">New</button>
                  <button data-action="duplicate-garden" type="button">Duplicate</button>
                  <button data-action="rename-garden" type="button">Rename</button>
                </div>
                <label><span>Saved version</span><select data-role="layout-select"></select></label>
                <div class="project-action-grid">
                  <button data-action="load-layout" type="button">Load</button>
                  <button data-action="delete-layout" type="button">Delete version</button>
                </div>
                <button data-action="reset-demo" type="button">Restore reference starter</button>
                <div class="project-menu-divider" role="separator"></div>
                <div class="project-menu-heading"><span>Spatial interchange</span><strong>Active garden</strong></div>
                <div class="project-action-grid spatial-export-grid">
                  <button data-action="export-geojson" type="button" title="RFC 7946 GeoJSON for QGIS">QGIS GeoJSON</button>
                  <button data-action="export-kml" type="button" title="Styled KML for Google Earth">Google Earth KML</button>
                </div>
                <button data-action="import-spatial" type="button">Review GeoJSON / KML…</button>
                <input data-role="spatial-import-input" type="file" accept=".geojson,.json,.kml,application/geo+json,application/json,application/vnd.google-earth.kml+xml" hidden>
                <div class="spatial-import-status" data-role="spatial-import-status" role="status" aria-live="polite" hidden></div>
                <button data-action="clear-spatial-import" type="button" hidden>Clear review layer</button>
                <details class="project-menu-backup">
                  <summary>Backup and restore</summary>
                  <button data-action="export" type="button">Download full planner JSON</button>
                  <button data-role="restore-backup" type="button">Restore full planner JSON…</button>
                  <input data-role="backup-input" type="file" accept=".json,application/json" hidden>
                  <p data-role="backup-status" role="status" aria-live="polite"></p>
                </details>
                <button class="danger-action" data-action="clear" type="button">Clear plant placements</button>
                <button class="danger-action" data-action="delete-garden" type="button">Remove garden</button>
              </div>
            </details>
          </section>

          <details class="studio-preview-options"><summary>Planting date preview</summary><div data-role="time-preview-host"></div></details>
          <nav class="planning-scope" aria-label="Planning scope" style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 12px">
            <button type="button" data-workspace="explore">Explore garden</button>
            <button type="button" data-workspace="walk">Walk through</button>
            <button type="button" data-scope="attributes">Site features</button>
            <button type="button" data-scope="garden">Garden & beds</button>
            <button type="button" data-scope="bed">Plan selected bed</button>
            <button type="button" data-action="plant-gallery">3D plant library</button><button type="button" data-action="bed-seasons">Seasons</button><button type="button" data-action="garden-home">My garden · Log</button>
          </nav>
          <section class="planner-view parcel-map-view">
            <div class="view-heading parcel-heading">
              <span>Garden canvas</span>
              <span data-role="parcel-label"></span>
              <details class="map-settings">
                <summary>
                  <span>Map settings</span>
                  <small data-role="map-settings-summary">4 layers</small>
                </summary>
                <div class="map-settings-panel">
                  <fieldset>
                    <legend>Context layers</legend>
                    <label><span>Feature overlay opacity</span><input data-role="feature-opacity" type="range" min="0" max="1" step="0.05" value="1" aria-label="Feature overlay opacity"></label>
                    <label><input data-map-setting="showImagery" type="checkbox"> <span>Aerial imagery</span></label>
                    <label><input data-map-setting="showReferenceOverlay" type="checkbox"> <span>Georeferenced source map</span></label>
                    <label class="map-settings-opacity"><span>Source map opacity</span><input data-map-setting="referenceOverlayOpacity" type="range" min="0" max="1" step="0.05"></label>
                    <label title="Source marks and uploaded files are comparison evidence only and are never added to the editable plan."><input data-map-setting="showSourceEvidence" type="checkbox"> <span data-role="source-evidence-label">Review evidence <small>not canonical</small></span></label>
                    <label><input data-map-setting="showParcel" type="checkbox"> <span>Parcel outline</span></label>
                    <label><input data-map-setting="showVegetation" type="checkbox"> <span>Vegetation</span></label>
                    <label><input data-map-setting="showPlantings" type="checkbox"> <span>Plantings</span></label>
                  </fieldset>
                  <fieldset>
                    <legend>Site systems</legend>
                    <label><input data-map-setting="showBuildings" type="checkbox"> <span>Buildings</span></label>
                    <label><input data-map-setting="showCirculation" type="checkbox"> <span>Roads & paths</span></label>
                    <label><input data-map-setting="showBarriers" type="checkbox"> <span>Fences & walls</span></label>
                    <label><input data-map-setting="showUtilities" type="checkbox"> <span>Utilities</span></label>
                    <label><input data-map-setting="showWater" type="checkbox"> <span>Water systems</span></label>
                    <label><input data-map-setting="showLandscapeFeatures" type="checkbox"> <span>Garden sections &amp; orchards</span></label>
                  </fieldset>
                  <label class="map-settings-basemap">
                    <span>Basemap</span>
                    <select data-control="basemap"></select>
                  </label>
                  <label class="map-settings-beds">
                    <span>Bed visibility</span>
                    <select data-map-setting="bedVisibility">
                      <option value="all">All beds</option>
                      <option value="active">Selected bed only</option>
                      <option value="none">Hide beds</option>
                    </select>
                  </label>
                </div>
              </details>
            </div>
            ${viewNavigationMarkup}
            <div class="bed-drawing-controls" data-role="bed-drawing-controls" hidden>
              <span data-role="bed-drawing-status" role="status"></span>
              <button data-action="finish-map-bed" type="button">Finish</button>
              <button data-action="cancel-map-bed" type="button">Cancel</button>
            </div>
            <svg class="parcel-svg" data-role="parcel-svg" aria-label="Parcel map with editable beds and structures"></svg>
            <div class="map-scale" data-role="map-scale" aria-label="Map scale"><i></i><span></span></div>
            <details class="map-legend" data-role="map-legend">
              <summary>Legend</summary>
              <div class="map-legend-grid" data-role="map-legend-items"></div>
            </details>
            <div data-role="mapped-soil-host"></div>
          </section>

          <div class="garden-views">
            <section class="planner-view two-d-view">
              <div class="view-heading">
                <span data-role="plan-title">2D bed plan</span>
                <span data-role="selected-label"></span><button type="button" data-view-nav="fit-selection" class="fit-bed-view">Fit bed / selection</button>
              </div>
              ${viewNavigationMarkup}
              <svg class="plan-svg" data-role="plan-svg" aria-label="2D garden bed plan"></svg>
              <div class="map-scale" data-role="map-scale" aria-label="Plan scale"><i></i><span></span></div>
              <details class="map-legend" data-role="map-legend">
                <summary>Legend</summary>
                <div class="map-legend-grid" data-role="map-legend-items"></div>
              </details>
            </section>
            <section class="planner-view three-d-view">
              <div class="view-heading">
                <span>3D garden · illustrative heights</span>
                <select data-role="camera-angle" aria-label="3D viewing angle"><option value="60">Oblique</option><option value="0">Overhead</option><option value="75">Low angle</option><option value="walk">Walk at eye level</option></select>
                <span data-role="three-status">WebGL</span>
              </div>
              ${viewNavigationMarkup}
              <div class="three-host" data-role="three-host"></div>
            </section>
          </div>
          <p data-role="planning-scope-help" style="margin:0;padding:0 12px 8px"></p>
          <p data-role="imagery-status" role="status" hidden></p>
          <div class="planner-storage-notice">
            <p data-role="storage-status" role="status" aria-live="polite"></p>
            <button data-role="storage-backup" type="button" hidden>Download unsaved planner JSON</button>
          </div>
          <footer class="garden-statusbar" data-role="metrics" aria-label="Garden plan status"></footer>
          <details class="garden-information-card" data-role="garden-information-card">
            <summary>
              <span class="garden-information-summary-label">Garden reference</span>
              <strong>${escapeHtml(state.property?.name || "Garden")}</strong>
              <small>Information, alignment, and locally preserved sources</small>
            </summary>
            <div class="garden-information-body">
              <p>Loading this garden's reference record…</p>
            </div>
          </details>
        </main>

        <aside class="garden-inspector" data-role="context-inspector" aria-label="Selection inspector">
          <header class="drawer-heading">
            <div><span>Inspector</span><strong data-role="inspector-title">Selected bed</strong></div>
            <button data-action="close-inspector" type="button" aria-label="Close inspector" title="Close">×</button>
          </header>
          <div class="inspector-tabs" role="tablist" aria-label="Inspector view">
            <button data-inspector-tab="edit" type="button" role="tab">Edit</button>
            <button data-inspector-tab="diagnostics" type="button" role="tab">Diagnostics</button>
          </div>
          <section class="planner-section inspector-panel" data-inspector-panel="bed">
            <div data-role="selected-bed"></div>
          </section>
          <section class="planner-section inspector-panel" data-inspector-panel="structure">
            <div data-role="selected-structure"></div>
          </section>
          <section class="planner-section inspector-panel" data-inspector-panel="vegetation">
            <div data-role="selected-vegetation"></div>
          </section>
          <section class="planner-section inspector-panel" data-inspector-panel="plant">
            <div data-role="selected-plant"></div>
          </section>
          <section class="planner-section inspector-panel" data-inspector-panel="placement">
            <div data-role="selected-placement"></div>
          </section>
          <section class="planner-section inspector-panel diagnostics-panel" data-inspector-panel="diagnostics">
            <div class="diagnostic-block"><div class="section-heading">Spacing check</div><div data-role="spacing-check"></div></div>
            <div class="diagnostic-block"><div class="section-heading">Irrigation zones</div><div data-role="irrigation-zones"></div></div>
          </section>
        </aside>
      </div>
    </div>
    <div class="feature-hover-card" data-role="feature-hover-card" role="tooltip" hidden></div>
  `;

  const refs = collectRefs(root);
  const storageStatus = root.querySelector('[data-role="storage-status"]');
  const storageBackup = root.querySelector('[data-role="storage-backup"]');
  storageBackup.addEventListener("click", () => refs.actions.export.click());
  const persistAndReport = () => {
    const saved = saveState(state);
    const message = saved
      ? "Changes saved in this browser only. Export a backup before clearing browser data or changing devices."
      : "Changes are not saved: browser storage is unavailable or full. Keep this page open and download your planner JSON before leaving.";
    if (storageStatus.textContent !== message) storageStatus.textContent = message;
    storageStatus.dataset.saved = String(saved);
    storageBackup.hidden = saved;
  };
  let three = null;
  let sharedViewFrame = null;
  let sharedViewSettleTimer = null;

  const renderSharedViews = () => {
    if (sharedViewFrame !== null) return;
    sharedViewFrame = requestAnimationFrame(() => {
      sharedViewFrame = null;
      state.parcelViewport = normalizeParcelViewport(state, state.parcelViewport);
      state.viewBearing = normalizeViewBearing(state.viewBearing);
      state.viewPitch = normalizeViewPitch(state.viewPitch);
      applySharedViewState(refs, state, three);
      persistAndReport();
      clearTimeout(sharedViewSettleTimer);
      // During a gesture only the shared camera transforms. Once it settles,
      // rebuild scale-dependent plant glyphs, labels, and the detail imagery
      // mosaic without making every pointermove perform a full scene rebuild.
      sharedViewSettleTimer = setTimeout(() => {
        sharedViewSettleTimer = null;
        renderAll();
      }, 140);
    });
  };

  let previewGardenId=state.activeParcelId;
  const timePreview=plannerTimePreview({getBedName:id=>state.beds.find(b=>b.id===id)?.name || (id ? "Unknown bed" : "Outside a named bed"),getPlantName:id=>plantById(state,id)?.name || "Unidentified plant",getPlacements:()=>state.placements,getDate:()=>state.previewDate,onChange:date=>{state.previewDate=date;if(matchMedia("(max-width: 920px)").matches){state.toolDrawerOpen=false;state.inspectorOpen=false;}renderAll();}});
  root.querySelector('[data-role="time-preview-host"]').append(timePreview.root);
  const sunPreview=plannerSunPreview({getState:()=>state,onChange:()=>{if(matchMedia("(max-width: 920px)").matches){state.toolDrawerOpen=false;state.inspectorOpen=false;}renderAll();}});
  root.querySelector('.studio-preview-options').insertAdjacentElement('afterend',sunPreview.root);

  let soilBoundaries=[],soilGardenId=state.activeParcelId;
  const soilPanel=mappedSoil({getLocation:()=>gardenSpatialReference(state.property).origin.coordinates,onBoundary:rows=>{soilBoundaries=rows;queueMicrotask(()=>renderSoilOverlay());},invalidation:options.invalidation});
  root.querySelector('[data-role="mapped-soil-host"]').append(soilPanel);
  const renderSoilOverlay=()=>{const world=refs.parcelSvg.querySelector('.shared-view-world');if(!world)return;world.querySelector('.mapped-soil-overlay')?.remove();const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('class','mapped-soil-overlay');group.setAttribute('pointer-events','none');for(const boundary of soilBoundaries){const shape=document.createElementNS(group.namespaceURI,'path');shape.setAttribute('d',boundary.rings.map(ring=>'M '+ring.map(point=>lonLatToLocalPoint(point,state.property).join(',')).join(' L ')+' Z').join(' '));shape.setAttribute('fill','none');shape.setAttribute('stroke','#d99331');shape.setAttribute('stroke-width','3');shape.setAttribute('stroke-dasharray','8 5');shape.setAttribute('vector-effect','non-scaling-stroke');const title=document.createElementNS(group.namespaceURI,'title');title.textContent='USDA soil map unit '+boundary.mukey;shape.append(title);group.append(shape);}world.append(group);};
  soilPanel.addEventListener('change',()=>queueMicrotask(renderSoilOverlay));
  const renderAll = ({preserveEditor = null} = {}) => {
    if(previewGardenId!==state.activeParcelId){previewGardenId=state.activeParcelId;state.previewDate=null;}
    timePreview.sync();
    if(soilGardenId!==state.activeParcelId){soilGardenId=state.activeParcelId;soilPanel.clear();}

    if (sharedViewFrame !== null) cancelAnimationFrame(sharedViewFrame);
    sharedViewFrame = null;
    if (sharedViewSettleTimer !== null) clearTimeout(sharedViewSettleTimer);
    sharedViewSettleTimer = null;
    hideFeatureHover(refs.featureHoverCard);
    clampPlacements(state);
    refs.referenceMapInspector?.sync();
    const hasPersonalGardens = state.parcels.some(workspace => !isPublicDemo(workspace));
    root.querySelector('.garden-shell').hidden = Boolean(PLANNER_OWNER && !hasPersonalGardens && !exploringDemos);
    const intro = root.querySelector('[data-workspace-intro]');
    if (intro) intro.textContent = hasPersonalGardens ? 'Your gardens stay in your account workspace. Save an account copy to keep changes online.' : 'Create your first garden, or load an account save below. Public demos are a separate reference.';
    renderControls(refs, state);
    refs.spatialCollectionInspector?.sync();
    renderGardenInformationCard(refs, state, options.referenceAssets);
    renderPlantList(refs, state, renderAll);
    renderFlowerLibrary(refs, state, renderAll);
    renderPropertyBeds(refs, state, renderAll);
    renderMetrics(refs, state);
    renderParcelMap(refs, state, renderAll);
    renderSoilOverlay();
    render2dPlan(refs, state, renderAll);
    sunPreview.draw(refs.parcelSvg);
    sunPreview.draw(refs.planSvg,state.viewMode === "bed" ? activeBed(state) : null);
    renderInspector(refs, state, renderAll, {preserveEditor});
    if (three) syncThreeScene(three, state);
    syncSelectedToolCard(refs, state);
    persistAndReport();
  };

  refs.spatialCollectionInspector = spatialCollectionInspector({
    host: root.querySelector('[data-role="spatial-collection-inspector"]'),
    getState: () => state,
    download: downloadPlannerText,
    onApply: (ref, attributes) => {
      const list = ref.type === "structure" ? state.structures : ref.type === "vegetation" ? state.vegetation : ref.type === "bed" ? state.beds : state.placements;
      const feature = list.find(item => item.id === ref.id);
      if (feature) {feature.name = attributes.name;feature.notes = attributes.notes;renderAll();}
    },
    onLocate: ref => {
      state.viewPresentation = "map";
      if (ref.type === "parcel") {
        const member = state.property.parcel?.members?.find(item => item.id === ref.id);
        const points = member ? flattenExteriorRings(parcelExteriorRings(member.geometry)).map(point => lonLatToLocalPoint(point,state.property)) : [];
        if (points.length) fitParcelViewport(state,boundsFromPoints(points,0),0.12);
        else state.parcelViewport = parcelViewBounds(state);
      }
      else {selectGardenFeature(state,ref.type,ref.id);fitParcelViewport(state,selectedFeatureBounds(state),0.42);}
      state.inspectorOpen = false;
      renderAll();
    },
    onPlan: id => {
      selectGardenFeature(state,"bed",id);
      openPlantingWorkspace(state,id);
      renderAll();
    }
  });
  refs.referenceMapInspector = referenceMapInspector({
    host: root.querySelector('[data-role="reference-map-inspector"]'),
    getState: () => state,
    onChange: () => renderAll(),
    onStart: () => {
      state.drawMode = null;
      siteGeometryDrafts.delete(state);
      state.viewPresentation = "map";
      state.inspectorOpen = false;
    }
  });
  // A paired-landmark pick takes priority over feature drags and selection.
  for (const type of ["pointerdown", "mousedown", "touchstart"]) {
    refs.parcelSvg.addEventListener(type, event => {
      if (refs.referenceMapInspector.isPicking()) event.stopImmediatePropagation();
    }, true);
  }
  refs.parcelSvg.addEventListener("click", event => {
    if (!refs.referenceMapInspector.isPicking()) return;
    event.preventDefault(); event.stopImmediatePropagation();
    refs.referenceMapInspector.captureMapPoint(pointerInSharedWorld(event, refs.parcelSvg));
  }, true);
  root.addEventListener("keydown", event => {
    if (event.key === "Escape" && refs.referenceMapInspector.cancelPick()) {
      event.preventDefault(); event.stopImmediatePropagation(); renderAll();
    }
  }, true);
  setupControls(refs, state, () => renderAll(), renderSharedViews);
  setupActions(refs, state, () => renderAll());
  const accountPanel = plannerAccount({
    ...(options.accountAdapter || {}),
    exportPlanner: () => accountGardenPayload(stateExportPayload(state)),
    restorePlanner: candidate => {
      candidate = mergeAccountGardens(stateExportPayload(state), candidate);
      normalizeStateShape(candidate);
      const previous = structuredCloneCompat(state);
      Object.assign(state, candidate);
      exploringDemos = false;
      try { renderAll(); }
      catch (error) { Object.assign(state, previous); renderAll(); throw error; }
    }
  });
  root.append(accountPanel);
  const copySharedGarden = garden => {
    const selected = selectedSharedGarden(garden);
    // Sharing opens an explicit new personal/browser copy. Never overwrite a
    // public reference or a gardener's existing workspace by matching its ID.
    const id = `garden-${globalThis.crypto.randomUUID()}`;
    selected.id = id; selected.property.id = id;
    selected.name = `Copy of ${selected.name}`.slice(0,160);
    selected.property.name = selected.name;
    syncActiveParcelWorkspace(state);
    state.parcels.push(normalizeParcelWorkspace(selected));
    exploringDemos = false;
    switchActiveParcelWorkspace(state,id);
    state.viewPresentation = 'map';
    renderAll();
  };
  const collectionsPanel = options.sandbox ? document.createElement("div") : studioCollections({
    getGarden: () => {syncActiveParcelWorkspace(state);return activeParcelWorkspace(state);},
    copyGarden: copySharedGarden
  });
  accountPanel.after(collectionsPanel);
  const publishedPanel = options.sandbox ? null : publicCollection({copyGarden:copySharedGarden,
    reference:options.publicCollection,autoLoad:!PLANNER_OWNER,
    onReference:(edition,explicit) => {
      if (!explicit && (PLANNER_OWNER || hadSavedState || interacted)) return;
      if (!edition.gardens.length || edition.gardens.some(garden => !isPublicDemo(garden))) return;
      syncActiveParcelWorkspace(state);
      state.parcels = [...state.parcels.filter(garden => !isPublicDemo(garden)),...edition.gardens.map(normalizeParcelWorkspace)];
      state.layouts = state.layouts.filter(layout => !isPublicDemo({id:layout.gardenId || layout.activeParcelId || layout.workspace?.id}));
      exploringDemos = true;
      applyParcelWorkspace(state,state.parcels.find(garden => garden.id === edition.gardens[0].id));
      state.viewMode = 'garden';
      resetInitialGardenView(state);
      fitParcelViewport(state,mappedPlanBounds(state),0.12);
      root.dataset.referenceEdition = edition.editionId;
      renderAll();
    }
  });
  if (publishedPanel) accountPanel.before(publishedPanel);
  const workspaceHome = document.createElement("section");
  workspaceHome.className = "planner-quick-start";
  workspaceHome.id = "my-gardens";
  workspaceHome.hidden = !PLANNER_OWNER;
  workspaceHome.innerHTML = '<div><strong>Your garden workspace</strong><p data-workspace-intro>Create your first garden, or load an account save below. Public demos are a separate reference.</p></div><button type="button" data-own-workspace>My gardens</button><button type="button" data-demo-workspace>Explore public demos</button>';
  accountPanel.before(workspaceHome);
  workspaceHome.querySelector('[data-demo-workspace]').onclick = () => {exploringDemos = true; switchActiveParcelWorkspace(state, BERKSHIRE_GARDEN_REFERENCES[0].id); renderAll();};
  workspaceHome.querySelector('[data-own-workspace]').onclick = () => {exploringDemos = false; const own = state.parcels.find(workspace => !isPublicDemo(workspace)); if (own) switchActiveParcelWorkspace(state, own.id); renderAll();};
  if (PLANNER_OWNER) {
    accountPanel.open = true;
    root.querySelector('.planner-quick-start strong').textContent = 'Create a garden';
    root.querySelector('.planner-quick-start p').textContent = 'Begin with a 4 × 8 ft bed, then add your own spaces and plants. Save an account copy to keep it online.';
    root.querySelector('[data-role="start-practice-garden"]').textContent = 'Create my first garden';
  }
  root.querySelector('[data-role="start-practice-garden"]').addEventListener("click", () => {
    exploringDemos = false;
    createBlankGardenWorkspace(state, PLANNER_OWNER ? "My garden" : "Practice garden");
    state.viewPresentation = "2d";
    state.viewMode = "bed";
    state.activeTool = "beds";
    state.toolDrawerOpen = true;
    openInspector(state, "bed");
    renderAll();
    refs.selectedBed.querySelector('[data-bed-field="name"]')?.focus();
  });
  const backupInput = root.querySelector('[data-role="backup-input"]');
  const backupStatus = root.querySelector('[data-role="backup-status"]');
  const restoreButton = root.querySelector('[data-role="restore-backup"]');
  restoreButton.addEventListener("click", () => backupInput.click());
  backupInput.addEventListener("change", async () => {
    const file = backupInput.files?.[0];
    if (!file) return;
    restoreButton.disabled = true;
    try {
      if (file.size > MAX_PLANNER_BACKUP_BYTES) throw Error("Planner backups are limited to 20 MB.");
      const candidate = parsePlannerBackup(await file.text());
      // Normalize a detached candidate before touching the current garden.
      normalizeStateShape(candidate);
      if (!window.confirm(`Restore ${candidate.parcels.length} gardens and ${candidate.layouts.length} saved versions? This replaces the current planner. Download your current planner JSON first if you want to keep it.`)) {
        backupStatus.textContent = "Restore cancelled. Your current planner is unchanged.";
        return;
      }
      const previous = structuredCloneCompat(state);
      Object.assign(state, candidate);
      try {
        renderAll();
      } catch (error) {
        Object.assign(state, previous);
        renderAll();
        throw error;
      }
      backupStatus.textContent = "Backup restored. Check the save status above the canvas before leaving this page.";
    } catch (error) {
      backupStatus.textContent = `Backup could not be restored: ${error.message}`;
    } finally {
      backupInput.value = "";
      restoreButton.disabled = false;
    }
  });
  setupPlantForm(refs, state, () => renderAll());
  setupSearch(refs, state, () => renderPlantList(refs, state, renderAll));
  setupFlowerLibrary(refs, state, () => renderAll());
  setupSvgInteractions(refs, state, () => renderAll(), renderSharedViews);
  refs.planSvg.addEventListener("dragover", event => {
    if (state.viewMode === "bed" && event.dataTransfer.types.includes("application/x-veggie-plant")) event.preventDefault();
  });
  refs.planSvg.addEventListener("drop", event => {
    if (state.viewMode !== "bed") return;
    const id = event.dataTransfer.getData("application/x-veggie-plant");
    if (!state.plants.some(plant => plant.id === id)) return;
    event.preventDefault();
    const [x,y] = pointerInSharedWorld(event, refs.planSvg);
    if (!isInsideBed(x,y,activeBed(state))) return;
    addPlacement(state,id,x,y); renderAll();
  });
  setupParcelInteractions(refs, state, () => renderAll(), renderSharedViews);
  setupKeyboardShortcuts(refs, state, () => renderAll());

  root.querySelectorAll('[data-action="garden-home"]').forEach(button=>button.addEventListener('click',()=>{
    const dialog=gardenHome({getWorkspace:()=>({id:state.activeParcelId,name:activeParcelWorkspace(state)?.name,property:state.property,beds:state.beds,placements:state.placements}),getPlants:()=>state.plants,selectedPlantingId:state.selectedPlacementId,
      onLog:(id,input)=>{const index=state.placements.findIndex(p=>p.id===id);if(index<0)throw Error('This planting is no longer in the garden.');const previous=state.placements[index];state.placements[index]=recordPlantingObservation(previous,input);if(!saveState(state)){state.placements[index]=previous;syncActiveParcelWorkspace(state);throw Error('Could not save. Keep this form open and copy your observation.');}renderAll();},
      onPlan:id=>{openPlantingWorkspace(state,id);renderAll();},onBackup:()=>refs.actions.export.click()});root.append(dialog);dialog.showModal();
  }));
  root.querySelectorAll('[data-action="bed-seasons"]').forEach(button=>button.addEventListener('click',()=>openBedSeasons(root,state,renderAll)));
  root.querySelectorAll('[data-action="plant-gallery"]').forEach(button=>button.addEventListener('click',()=>openPlantGallery(root,state,()=>three,renderAll)));

  root.addEventListener("veggie-farm:select-garden", (event) => {
    exploringDemos = true;
    const gardenId = String(event.detail?.id || "");
    if (!(state.parcels || []).some((workspace) => workspace.id === gardenId)) return;
    switchActiveParcelWorkspace(state, gardenId);
    renderAll();
  });

  requestAnimationFrame(() => {
    three = createThreeScene(refs.threeHost, state, renderSharedViews, {
      ...options,
      onStateChange: renderAll,
      getSolarPreview: sunPreview.sync,
      hoverCard: refs.featureHoverCard
    });
    renderAll();
  });

  renderAll();
  return root;
}

/**
 * Observable fingerprints FileAttachment assets at build time. Saved planner
 * workspaces keep the stable evidence ID, while this runtime-only hydration
 * supplies the deployable URL without writing a transient build path into a
 * user's garden JSON.
 */
export function applyGardenReferenceOverlayAssets(state, assets = {}) {
  if (!state || !assets || typeof assets !== "object") return state;
  const hydrateProperty = (property) => {
    if (!Array.isArray(property?.referenceOverlays)) return;
    property.referenceOverlays = property.referenceOverlays.map((overlay) => {
      const href = assets[overlay?.id];
      return href ? {...overlay, href: String(href)} : overlay;
    });
  };
  hydrateProperty(state.property);
  for (const workspace of state.parcels || []) hydrateProperty(workspace?.property);
  for (const layout of state.layouts || []) {
    hydrateProperty(layout?.property);
    for (const workspace of layout?.parcels || []) hydrateProperty(workspace?.property);
  }
  return state;
}

const SOURCE_EVIDENCE_GEOMETRY_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "Polygon",
  "MultiLineString",
  "MultiPolygon"
]);

/**
 * Keep imported KML/KMZ vectors in a runtime sidecar keyed by garden ID.
 *
 * This intentionally returns a Map rather than writing anything onto planner
 * state: a rough source trace may inform curation, but it is not canonical plan
 * geometry merely because a user turned on the comparison layer.
 */
export function normalizeGardenSourceEvidenceByGardenId(value = {}) {
  const collections = new Map();
  for (const [gardenId, collection] of Object.entries(value || {})) {
    if (!gardenId || collection?.type !== "FeatureCollection" || !Array.isArray(collection.features)) continue;
    const features = collection.features.filter((feature) => {
      const geometryType = feature?.geometry?.type;
      return SOURCE_EVIDENCE_GEOMETRY_TYPES.has(geometryType)
        && feature?.properties?.objectType !== "raster-overlay";
    });
    collections.set(String(gardenId), Object.freeze({
      type: "FeatureCollection",
      properties: collection.properties || {},
      features: Object.freeze([...features])
    }));
  }
  return collections;
}

function configureGardenSourceEvidence(state, collections, visible = false) {
  SOURCE_EVIDENCE_RUNTIME.set(state, {
    collections: normalizeGardenSourceEvidenceByGardenId(collections),
    visible: visible === true
  });
}

function gardenSourceEvidenceRuntime(state) {
  return SOURCE_EVIDENCE_RUNTIME.get(state) || {collections: new Map(), visible: false};
}

function configureSpatialImportReview(state) {
  SPATIAL_IMPORT_REVIEW_RUNTIME.set(state, {byGardenId: new Map()});
}

function spatialImportReviewRuntime(state) {
  return SPATIAL_IMPORT_REVIEW_RUNTIME.get(state) || {byGardenId: new Map()};
}

function activeSpatialImportReview(state) {
  return spatialImportReviewRuntime(state).byGardenId.get(String(state?.activeParcelId || "")) || null;
}

function setActiveSpatialImportReview(state, review) {
  let runtime = SPATIAL_IMPORT_REVIEW_RUNTIME.get(state);
  if (!runtime) {
    runtime = {byGardenId: new Map()};
    SPATIAL_IMPORT_REVIEW_RUNTIME.set(state, runtime);
  }
  const gardenId = String(state?.activeParcelId || "");
  if (!gardenId) return;
  if (review) runtime.byGardenId.set(gardenId, review);
  else runtime.byGardenId.delete(gardenId);
}

function spatialImportDisplayCollection(review) {
  if (!review?.stage?.collection?.features) return null;
  // Global errors such as an unsupported/projected CRS make every coordinate
  // unsafe to draw. Feature-scoped geometry errors suppress only that feature;
  // valid neighbors remain useful comparison evidence.
  if ((review.stage.errors || []).some((item) => !item.featureId)) return null;
  const invalidIds = new Set((review.stage.errors || []).map((item) => item.featureId).filter(Boolean));
  const features = review.stage.collection.features
    .filter((feature) => !invalidIds.has(String(feature.id || "")))
    .map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        __vfEvidenceKind: "staged-import",
        __vfEvidenceSourceTitle: review.fileName,
        __vfEvidenceIssueCodes: feature.properties?.interchangeReview?.issueCodes || []
      }
    }));
  return features.length ? {
    type: "FeatureCollection",
    properties: {
      ...(review.stage.collection.properties || {}),
      name: review.fileName,
      reviewOnly: true
    },
    features
  } : null;
}

function gardenSourceEvidenceCollection(state) {
  const gardenId = String(state?.activeParcelId || "");
  const source = gardenSourceEvidenceRuntime(state).collections.get(gardenId) || null;
  const staged = spatialImportDisplayCollection(activeSpatialImportReview(state));
  if (!source && !staged) return null;
  const sourceTitle = source?.properties?.source?.title || source?.properties?.name || "Indicative source evidence";
  return {
    type: "FeatureCollection",
    properties: {name: "Review evidence", reviewOnly: true},
    features: [
      ...(source?.features || []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties || {}),
          __vfEvidenceKind: "source",
          __vfEvidenceSourceTitle: sourceTitle
        }
      })),
      ...(staged?.features || [])
    ]
  };
}

function gardenBundledSourceEvidenceAvailable(state) {
  return Boolean(gardenSourceEvidenceRuntime(state).collections.get(String(state?.activeParcelId || "")));
}

function gardenStagedImportEvidenceAvailable(state) {
  return Boolean(spatialImportDisplayCollection(activeSpatialImportReview(state)));
}

function gardenSourceEvidenceVisible(state) {
  return gardenSourceEvidenceRuntime(state).visible && Boolean(gardenSourceEvidenceCollection(state));
}

function setGardenSourceEvidenceVisibility(state, visible) {
  const runtime = SOURCE_EVIDENCE_RUNTIME.get(state);
  if (runtime) runtime.visible = Boolean(visible);
}

function collectRefs(root) {
  const byRole = (role) => root.querySelector(`[data-role="${role}"]`);
  const byAction = (action) => root.querySelector(`[data-action="${action}"]`);
  return {
    root,
    metrics: byRole("metrics"),
    gardenSubtitle: byRole("garden-subtitle"),
    gardenCount: byRole("garden-count"),
    gardenInformationCard: byRole("garden-information-card"),
    featureHoverCard: byRole("feature-hover-card"),
    plantCount: byRole("plant-count"),
    plantSearch: byRole("plant-search"),
    plantList: byRole("plant-list"),
    flowerCount: byRole("flower-count"),
    flowerContext: byRole("flower-context"),
    flowerSearch: byRole("flower-search"),
    flowerSeason: byRole("flower-season"),
    flowerLight: byRole("flower-light"),
    flowerMoisture: byRole("flower-moisture"),
    flowerList: byRole("flower-list"),
    propertyCard: byRole("property-card"),
    bedCount: byRole("bed-count"),
    bedList: byRole("bed-list"),
    structureCount: byRole("structure-count"),
    structureList: byRole("structure-list"),
    vegetationCount: byRole("vegetation-count"),
    vegetationList: byRole("vegetation-list"),
    plantForm: byRole("plant-form"),
    layoutSelect: byRole("layout-select"),
    spatialImportInput: byRole("spatial-import-input"),
    spatialImportStatus: byRole("spatial-import-status"),
    sourceEvidenceLabel: byRole("source-evidence-label"),
    activeBedName: byRole("active-bed-name"),
    toolDrawer: byRole("tool-drawer"),
    toolDrawerTitle: byRole("tool-drawer-title"),
    toolButtons: [...root.querySelectorAll("[data-tool]")],
    toolPanels: [...root.querySelectorAll("[data-tool-panel]")],
    presentationButtons: [...root.querySelectorAll("[data-presentation]")],
    editModeStatus: byRole("edit-mode-status"),
    editModeIcon: byRole("edit-mode-icon"),
    editModeLabel: byRole("edit-mode-label"),
    contextInspector: byRole("context-inspector"),
    inspectorTitle: byRole("inspector-title"),
    inspectorTabs: [...root.querySelectorAll("[data-inspector-tab]")],
    inspectorPanels: [...root.querySelectorAll("[data-inspector-panel]")],
    parcelLabel: byRole("parcel-label"),
    mapSettingsSummary: byRole("map-settings-summary"),
    mapSettingInputs: [...root.querySelectorAll("[data-map-setting]")],
    parcelSvg: byRole("parcel-svg"),
    featureOpacity: byRole("feature-opacity"),
    planTitle: byRole("plan-title"),
    selectedLabel: byRole("selected-label"),
    planSvg: byRole("plan-svg"),
    threeHost: byRole("three-host"),
    threeStatus: byRole("three-status"),
    viewNavigationButtons: [...root.querySelectorAll("[data-view-nav]")],
    viewCompasses: [...root.querySelectorAll('[data-role="view-compass"]')],
    viewNavigationStatuses: [...root.querySelectorAll('[data-role="view-navigation-status"]')],
    mapScales: [...root.querySelectorAll('[data-role="map-scale"]')],
    mapLegendItems: [...root.querySelectorAll('[data-role="map-legend-items"]')],
    selectedBed: byRole("selected-bed"),
    parcelEditor: byRole("parcel-editor"),
    selectedStructure: byRole("selected-structure"),
    selectedVegetation: byRole("selected-vegetation"),
    selectedPlant: byRole("selected-plant"),
    selectedPlacement: byRole("selected-placement"),
    spacingCheck: byRole("spacing-check"),
    irrigationZones: byRole("irrigation-zones"),
    controls: {
      activeGarden: root.querySelector('[data-control="activeGarden"]'),
      viewMode: root.querySelector('[data-control="viewMode"]'),
      basemap: root.querySelector('[data-control="basemap"]')
    },
    actions: {
      addSelected: byAction("add-selected"),
      addSelectedFlower: byAction("add-selected-flower"),
      addBed: byAction("add-bed"),
      addStructure: byAction("add-structure"),
      addVegetation: byAction("add-vegetation"),
      drawBed: byAction("draw-bed"),
      finishBed: byAction("finish-bed"),
      cancelDraw: byAction("cancel-draw"),
      closeToolDrawer: byAction("close-tool-drawer"),
      closeInspector: byAction("close-inspector"),
      openBedTool: byAction("open-bed-tool"),
      fillBed: byAction("fill-bed"),
      saveLayout: byAction("save-layout"),
      loadLayout: byAction("load-layout"),
      deleteLayout: byAction("delete-layout"),
      createGarden: byAction("create-garden"),
      duplicateGarden: byAction("duplicate-garden"),
      renameGarden: byAction("rename-garden"),
      deleteGarden: byAction("delete-garden"),
      resetDemo: byAction("reset-demo"),
      export: byAction("export"),
      exportGeoJson: byAction("export-geojson"),
      exportKml: byAction("export-kml"),
      importSpatial: byAction("import-spatial"),
      clearSpatialImport: byAction("clear-spatial-import"),
      clear: byAction("clear")
    }
  };
}

function replaceBundledFeatures(savedFeatures, revisedDefaults) {
  const customFeatures = Array.isArray(savedFeatures)
    ? savedFeatures.filter((feature) => feature?.id && !String(feature.id).startsWith("bbg-"))
    : [];
  return [
    ...structuredCloneCompat(revisedDefaults),
    ...structuredCloneCompat(customFeatures)
  ];
}

function upgradeBundledParcelWorkspaces(parcels) {
  if (!Array.isArray(parcels)) return [];
  return parcels.map((workspace) => {
    const propertyId = workspace?.property?.id || workspace?.id;
    if (propertyId !== PROPERTY_CONTEXT.id) return workspace;
    return {
      ...workspace,
      id: PROPERTY_CONTEXT.id,
      name: PROPERTY_CONTEXT.name,
      property: structuredCloneCompat(PROPERTY_CONTEXT),
      beds: replaceBundledFeatures(workspace.beds, DEFAULT_BEDS),
      structures: replaceBundledFeatures(workspace.structures, PROPERTY_STRUCTURES),
      vegetation: replaceBundledFeatures(workspace.vegetation, DEFAULT_VEGETATION),
      parcelViewport: null
    };
  });
}

function upgradeBundledLayouts(layouts) {
  if (!Array.isArray(layouts)) return [];
  return layouts.map((layout) => {
    if (layout?.property?.id !== PROPERTY_CONTEXT.id) return layout;
    return {
      ...layout,
      property: structuredCloneCompat(PROPERTY_CONTEXT),
      parcels: upgradeBundledParcelWorkspaces(layout.parcels),
      beds: replaceBundledFeatures(layout.beds, DEFAULT_BEDS),
      structures: replaceBundledFeatures(layout.structures, PROPERTY_STRUCTURES),
      vegetation: replaceBundledFeatures(layout.vegetation, DEFAULT_VEGETATION),
      parcelViewport: null
    };
  });
}

function addMissingReferenceGardenWorkspaces(parcels) {
  const collection = Array.isArray(parcels) ? [...parcels] : [];
  const ids = new Set(collection.map((workspace) => workspace?.id || workspace?.property?.id));
  for (const reference of BERKSHIRE_GARDEN_REFERENCES) {
    if (ids.has(reference.id)) continue;
    const workspace = defaultGardenWorkspaceById(reference.id);
    if (workspace) collection.push(workspace);
  }
  return collection;
}

function legacyNaumkeagStarterBeds(reference) {
  return [
    referenceBed(reference, "rose-west", "Rose Garden · west", "Rose Garden", -390, -250, 180, 360),
    referenceBed(reference, "rose-east", "Rose Garden · east", "Rose Garden", 390, -250, 180, 360),
    referenceBed(reference, "peony-1", "Peony Terrace 1", "Peony Terraces", -360, 300, 300, 84),
    referenceBed(reference, "peony-2", "Peony Terrace 2", "Peony Terraces", 0, 300, 300, 84),
    referenceBed(reference, "peony-3", "Peony Terrace 3", "Peony Terraces", 360, 300, 300, 84),
    referenceBed(reference, "afternoon", "Afternoon Garden border", "Afternoon Garden", 0, -540, 540, 96),
    referenceBed(reference, "kitchen", "Seasonal kitchen study", "Editable food garden", 0, 600, 360, 120)
  ];
}

function legacyNaumkeagStarterStructures(reference) {
  const source = reference.sources?.[0]?.label || "public garden reference";
  const feature = (id, name, type, x, y, width, height, rotation = 0) => normalizeStructure({
    id: `${reference.id}-${id}`,
    name,
    type,
    x,
    y,
    width,
    height,
    rotation,
    confidence: "low",
    source,
    notes: "Approximate diagram element for organizing an editable starter layout; not a surveyed feature."
  });
  return [
    feature("axis-walk", "Formal garden axis", "path", 0, -60, 96, 1360),
    feature("cross-walk", "Garden-room walk", "path", 0, 80, 1050, 90),
    feature("pool", "Formal pool study", "water", 0, -250, 150, 150)
  ];
}

function upgradeBerkshireBotanicalCanonicalStarter(workspace, targetRevision) {
  const requestedRevision = Math.max(DEFAULT_STARTER_LAYOUT_REVISION, Number(targetRevision) || 0);
  if (Number(workspace?.starterLayoutRevision) >= requestedRevision) return workspace;

  // First finish the established 1 -> 2 -> 3 migrations against the exact
  // revision-3 interpretation they were written for. Revision 4 then performs
  // a conservative three-way replacement: untouched bundled objects retire,
  // user-moved/renamed objects remain, and the canonical source features are
  // added with new stable IDs. Exact old p1..p20 demos and the four untouched
  // revision-4 KMZ points retire, while any edited or custom placement survives.
  const revisionThree = migrateBerkshireBotanicalStarterLayout(workspace, {
    beds: INTERPRETED_DEFAULT_BEDS,
    structures: INTERPRETED_PROPERTY_STRUCTURES,
    vegetation: INTERPRETED_DEFAULT_VEGETATION
  }, BERKSHIRE_BOTANICAL_STARTER_LAYOUT_REVISION);
  return {
    ...revisionThree,
    beds: upgradeStarterFeatures(
      revisionThree.beds,
      INTERPRETED_DEFAULT_BEDS,
      DEFAULT_BEDS,
      {dropRetiredUntouched: true}
    ),
    structures: upgradeStarterFeatures(
      revisionThree.structures,
      INTERPRETED_PROPERTY_STRUCTURES,
      PROPERTY_STRUCTURES,
      {dropRetiredUntouched: true}
    ),
    vegetation: upgradeStarterFeatures(
      revisionThree.vegetation,
      INTERPRETED_DEFAULT_VEGETATION,
      DEFAULT_VEGETATION,
      {dropRetiredUntouched: true}
    ),
    placements: migrateBerkshireBotanicalDemoPlacements(
      revisionThree.placements,
      DEFAULT_PLACEMENTS
    ),
    starterLayoutRevision: requestedRevision,
    parcelViewport: null
  };
}

function upgradeReferenceGardenStarterLayout(workspace, reference) {
  if (reference.siteReconstructionRevision && LEGACY_PUBLIC_GARDENS[reference.id]) {
    return migratePublicGardenSite(workspace, LEGACY_PUBLIC_GARDENS[reference.id], {
      beds: referenceStarterBeds(reference), structures: referenceStarterStructures(reference),
      vegetation: referenceStarterVegetation(reference)
    }, reference.starterLayout.revision, referenceStarterViewport(reference), reference.siteReconstructionAdditions);
  }
  if (reference.id === PROPERTY_CONTEXT.id) {
    const targetRevision = Math.max(
      DEFAULT_STARTER_LAYOUT_REVISION,
      Number(reference.mapping?.layoutCalibration?.revision) || 0
    );
    return upgradeBerkshireBotanicalCanonicalStarter(workspace, targetRevision);
  }
  if (reference.id !== "naumkeag-garden-rooms") {
    const targetRevision = Math.max(
      1,
      Number(reference.starterLayout?.revision) || 0,
      Number(reference.mapping?.layoutCalibration?.revision) || 0
    );
    return Number(workspace?.starterLayoutRevision) >= targetRevision
      ? workspace
      : {...workspace, starterLayoutRevision: targetRevision};
  }
  const targetRevision = Math.max(1, Number(reference.starterLayout?.revision) || 1);
  const savedRevision = Math.max(0, Number(workspace?.starterLayoutRevision) || 0);
  if (savedRevision >= targetRevision) return workspace;
  return {
    ...workspace,
    beds: upgradeStarterFeatures(
      workspace?.beds,
      legacyNaumkeagStarterBeds(reference),
      referenceStarterBeds(reference)
    ),
    structures: upgradeStarterFeatures(
      workspace?.structures,
      legacyNaumkeagStarterStructures(reference),
      referenceStarterStructures(reference)
    ),
    starterLayoutRevision: targetRevision
  };
}

function translateFeatureOrigin(feature, offset) {
  const translated = {
    ...feature,
    x: (Number(feature.x) || 0) + offset[0],
    y: (Number(feature.y) || 0) + offset[1]
  };
  if (Array.isArray(feature.polygon)) {
    translated.polygon = feature.polygon.map(([x, y]) => [
      (Number(x) || 0) + offset[0],
      (Number(y) || 0) + offset[1]
    ]);
  }
  if (structureLocalGeometry(feature)) {
    translated.localGeometry = {
      ...feature.localGeometry,
      coordinates: mapLocalGeometryCoordinates(feature.localGeometry.coordinates, (x, y) => [
        x + offset[0],
        y + offset[1]
      ])
    };
  }
  return translated;
}

function preserveEditedFeatureLocations(workspace, reference, canonicalProperty, savedAnchor) {
  const expectedAnchor = reference.mapping?.layoutAnchor?.coordinates;
  if (!Array.isArray(savedAnchor) || !Array.isArray(expectedAnchor)) return workspace;
  if (Math.abs(savedAnchor[0] - expectedAnchor[0]) < 1e-10 && Math.abs(savedAnchor[1] - expectedAnchor[1]) < 1e-10) return workspace;
  const offset = lonLatToLocalPoint(savedAnchor, canonicalProperty);
  const preserveCollection = (items, canonicalItems) => {
    const canonicalById = new Map(canonicalItems.map((item) => [item.id, item]));
    return (items || []).map((item) => sameStarterGeometry(item, canonicalById.get(item.id))
      ? item
      : translateFeatureOrigin(item, offset));
  };
  return {
    ...workspace,
    beds: preserveCollection(workspace.beds, referenceStarterBeds(reference)),
    structures: preserveCollection(workspace.structures, referenceStarterStructures(reference)),
    vegetation: preserveCollection(workspace.vegetation, referenceStarterVegetation(reference))
  };
}

function preserveReferenceRegistration(property, savedProperty) {
  // Landmark targets are geographic, so they survive a refreshed local origin.
  return savedProperty?.referenceRegistration
    ? {...property, referenceRegistration: structuredCloneCompat(savedProperty.referenceRegistration)}
    : property;
}

function upgradeReferenceGardenSpatialContexts(parcels) {
  if (!Array.isArray(parcels)) return [];
  return parcels.map((workspace) => {
    const reference = gardenReferenceById(workspace?.id || workspace?.property?.id);
    if (!reference?.geometry) return workspace;
    const canonicalProperty = preserveReferenceRegistration(reference.id === PROPERTY_CONTEXT.id
      ? sanitizePropertyContext(PROPERTY_CONTEXT)
      : referenceConceptProperty(reference), workspace.property);
    const upgradedStarter = upgradeReferenceGardenStarterLayout(workspace, reference);
    const expectedAnchor = reference.mapping?.layoutAnchor?.coordinates;
    const savedAnchor = workspace?.property?.spatialReference?.origin?.coordinates;
    const alreadyCurrent = workspace?.property?.spatialStatus === "mapped"
      && workspace?.property?.parcel?.attributes?.MAP_PAR_ID === reference.mapping?.parcelId
      && workspace?.property?.imagery?.enabled !== false
      && Array.isArray(workspace?.property?.imagery?.basemaps)
      && workspace.property.imagery.basemaps.length > 0
      && workspace?.property?.spatialReference?.schemaVersion === GARDEN_SPATIAL_SCHEMA_VERSION
      && Array.isArray(savedAnchor)
      && (!Array.isArray(expectedAnchor)
        || (Math.abs(savedAnchor[0] - expectedAnchor[0]) < 1e-10
          && Math.abs(savedAnchor[1] - expectedAnchor[1]) < 1e-10));
    if (alreadyCurrent) return upgradedStarter;
    const rebasedWorkspace = preserveEditedFeatureLocations(upgradedStarter, reference, canonicalProperty, savedAnchor);
    return {
      ...rebasedWorkspace,
      id: reference.id,
      name: rebasedWorkspace.name || reference.name,
      property: canonicalProperty,
      // Keep the user's layout and edits; only replace the earlier unlocated
      // reference canvas with its shared parcel context.
      beds: rebasedWorkspace.beds,
      structures: rebasedWorkspace.structures,
      vegetation: rebasedWorkspace.vegetation,
      placements: rebasedWorkspace.placements,
      parcelViewport: reference.id === PROPERTY_CONTEXT.id
        ? rebasedWorkspace.parcelViewport
        : referenceStarterViewport(reference)
    };
  });
}

function upgradeReferenceGardenLayouts(layouts) {
  if (!Array.isArray(layouts)) return [];
  return layouts.map((layout) => {
    const reference = gardenReferenceById(layout?.property?.id || layout?.activeParcelId);
    const targetRevision = reference?.id === PROPERTY_CONTEXT.id
      ? Math.max(DEFAULT_STARTER_LAYOUT_REVISION, Number(reference.mapping?.layoutCalibration?.revision) || 0)
      : null;
    const upgradedLayout = targetRevision
      ? upgradeBerkshireBotanicalCanonicalStarter(layout, targetRevision)
      : layout;
    return {
      ...upgradedLayout,
      property: preserveReferenceRegistration(reference?.geometry
        ? reference.id === PROPERTY_CONTEXT.id
          ? sanitizePropertyContext(PROPERTY_CONTEXT)
          : referenceConceptProperty(reference)
        : upgradedLayout.property, upgradedLayout.property),
      workspace: targetRevision && upgradedLayout.workspace
        ? upgradeBerkshireBotanicalCanonicalStarter(upgradedLayout.workspace, targetRevision)
        : upgradedLayout.workspace,
      parcels: upgradeReferenceGardenSpatialContexts(upgradedLayout.parcels)
    };
  });
}

function loadState(storageOverride) {
  const base = structuredCloneCompat(DEFAULT_STATE);
  base.plants = structuredCloneCompat(DEFAULT_PLANTS);

  try {
    const storage = storageOverride || window.localStorage;
    const currentRaw = storage?.getItem(STORAGE_KEY);
    const legacyEntry = !PLANNER_OWNER && !currentRaw
      ? LEGACY_STORAGE_KEYS.map((key) => ({key, raw: storage?.getItem(key)})).find((entry) => entry.raw)
      : null;
    const raw = currentRaw || legacyEntry?.raw;
    if (!raw) {
      normalizeStateShape(base);
      base.viewMode = "garden";
      base.viewPresentation = "2d";
      resetInitialGardenView(base);
      return base;
    }
    const saved = JSON.parse(raw);
    const upgradesBundledSpatialContext = legacyEntry?.key === "veggie.farm:garden-studio:v3"
      && (saved.property?.id === PROPERTY_CONTEXT.id || saved.activeParcelId === PROPERTY_CONTEXT.id);
    const dropsLegacyDemoFeatures = legacyEntry?.key === "veggie.farm:garden-studio:v3";
    const plants = mergePlants(DEFAULT_PLANTS, Array.isArray(saved.plants) ? saved.plants : []);
    const legacyDraftProperty = !saved.property?.parcel?.geometry;
    const savedBedsAreOnlyBundledDrafts = legacyDraftProperty && Array.isArray(saved.beds)
      && saved.beds.length > 0
      && saved.beds.every((bed) => DEFAULT_BEDS.some((item) => item.id === bed?.id));
    const hasSavedBeds = Array.isArray(saved.beds) && !savedBedsAreOnlyBundledDrafts;
    const structures = upgradesBundledSpatialContext
      ? replaceBundledFeatures(saved.structures, PROPERTY_STRUCTURES)
      : hasSavedBeds && Array.isArray(saved.structures)
      ? normalizeStructures(saved.structures, {dropDemo: dropsLegacyDemoFeatures})
      : base.structures;
    const beds = upgradesBundledSpatialContext
      ? replaceBundledFeatures(saved.beds, DEFAULT_BEDS)
      : hasSavedBeds ? saved.beds : base.beds;
    const vegetation = upgradesBundledSpatialContext
      ? replaceBundledFeatures(saved.vegetation, DEFAULT_VEGETATION)
      : Array.isArray(saved.vegetation) ? saved.vegetation : base.vegetation;
    const state = {
      viewMode: normalizeViewMode(dropsLegacyDemoFeatures ? base.viewMode : saved.viewMode || base.viewMode),
      viewPresentation: normalizeViewPresentation(saved.viewPresentation || base.viewPresentation),
      activeTool: normalizeActiveTool(saved.activeTool || base.activeTool),
      toolDrawerOpen: saved.toolDrawerOpen === true,
      inspectorOpen: saved.inspectorOpen === true,
      inspectorMode: normalizeInspectorMode(saved.inspectorMode || base.inspectorMode),
      inspectorTab: normalizeInspectorTab(saved.inspectorTab || base.inspectorTab),
      layoutName: saved.layoutName || base.layoutName,
      layouts: Array.isArray(saved.layouts)
        ? normalizeLayouts(upgradeReferenceGardenLayouts(upgradesBundledSpatialContext ? upgradeBundledLayouts(saved.layouts) : saved.layouts), {dropDemo: dropsLegacyDemoFeatures})
        : base.layouts,
      activeParcelId: saved.activeParcelId || saved.property?.id || base.activeParcelId,
      parcels: Array.isArray(saved.parcels)
        ? upgradesBundledSpatialContext ? upgradeBundledParcelWorkspaces(saved.parcels) : saved.parcels
        : [],
      property: upgradesBundledSpatialContext ? base.property : saved.property || base.property,
      basemapId: saved.basemapId || saved.property?.imagery?.activeBasemapId || base.basemapId,
      activeBedId: saved.activeBedId || base.activeBedId,
      bedCameras: saved.bedCameras || {},
      beds,
      structures,
      vegetation,
      selectedVegetationId: saved.selectedVegetationId || null,
      selectedStructureId: saved.selectedStructureId || null,
      parcelBufferInches: saved.parcelBufferInches || base.parcelBufferInches,
      parcelViewport: upgradesBundledSpatialContext ? null : saved.parcelViewport || null,
      viewBearing: normalizeViewBearing(saved.viewBearing),
      viewPitch: normalizeViewPitch(saved.viewPitch),
      showVegetation: saved.showVegetation !== false,
      vegetationOpacity: saved.vegetationOpacity ?? base.vegetationOpacity,
      mapSettings: normalizeMapSettings(saved.mapSettings, saved.showVegetation),
      bed: {...base.bed, ...(saved.bed || {})},
      plants,
      selectedPlantId: saved.selectedPlantId || base.selectedPlantId,
      selectedPlacementId: saved.selectedPlacementId || base.selectedPlacementId,
      placements: Array.isArray(saved.placements) ? saved.placements : base.placements
    };
    state.parcels = upgradeReferenceGardenSpatialContexts(addMissingReferenceGardenWorkspaces(state.parcels));
    normalizeStateShape(state);
    resetInitialGardenView(state);
    return state;
  } catch {
    normalizeStateShape(base);
    resetInitialGardenView(base);
    return base;
  }
}

function resetInitialGardenView(state) {
  // Camera navigation is intentionally session-like. Garden content persists,
  // but every page load starts with the active parcel visible and north-up.
  state.parcelViewport = parcelViewBounds(state);
  state.viewBearing = DEFAULT_VIEW_BEARING;
  state.viewPitch = DEFAULT_VIEW_PITCH;
}

function saveState(state) {
  try {
    syncActiveParcelWorkspace(state);
    const payload = {
      viewMode: state.viewMode,
      viewPresentation: state.viewPresentation,
      activeTool: state.activeTool,
      toolDrawerOpen: state.toolDrawerOpen,
      inspectorOpen: state.inspectorOpen,
      inspectorMode: state.inspectorMode,
      inspectorTab: state.inspectorTab,
      basemapId: state.basemapId,
      layoutName: state.layoutName,
      layouts: state.layouts,
      activeParcelId: state.activeParcelId,
      parcels: state.parcels,
      property: state.property,
      activeBedId: state.activeBedId,
      bedCameras: structuredCloneCompat(state.bedCameras || {}),
      beds: state.beds,
      structures: state.structures,
      vegetation: state.vegetation,
      selectedVegetationId: state.selectedVegetationId,
      selectedStructureId: state.selectedStructureId,
      parcelBufferInches: state.parcelBufferInches,
      parcelViewport: state.parcelViewport,
      viewBearing: state.viewBearing,
      viewPitch: state.viewPitch,
      showVegetation: state.showVegetation,
      vegetationOpacity: state.vegetationOpacity,
      mapSettings: state.mapSettings,
      bed: state.bed,
      plants: state.plants,
      selectedPlantId: state.selectedPlantId,
      selectedPlacementId: state.selectedPlacementId,
      placements: state.placements
      // Derived GeoJSON belongs in explicit exports, not every synchronous save.
      // Reload restores the canonical records above; stateExportPayload retains
      // the complete spatial export for downloads and account copies.
    };
    return persistPlannerState(STORAGE_KEY, payload, () => plannerStorageOverrides.get(state) || window.localStorage);
  } catch {
    // Keep the working plan available for export even if preparing a save fails.
    return false;
  }
}

function stateExportPayload(state) {
  syncActiveParcelWorkspace(state);
  return {
    backupFormat: PLANNER_BACKUP_FORMAT,
    backupVersion: 1,
    viewMode: state.viewMode,
    viewPresentation: state.viewPresentation,
    activeTool: state.activeTool,
    toolDrawerOpen: state.toolDrawerOpen,
    inspectorOpen: state.inspectorOpen,
    inspectorMode: state.inspectorMode,
    inspectorTab: state.inspectorTab,
    basemapId: state.basemapId,
    layoutName: state.layoutName,
    layouts: state.layouts,
    activeParcelId: state.activeParcelId,
    parcels: state.parcels,
    property: state.property,
    activeBedId: state.activeBedId,
    bedCameras: structuredCloneCompat(state.bedCameras || {}),
    beds: state.beds,
    structures: state.structures,
    vegetation: state.vegetation,
    selectedVegetationId: state.selectedVegetationId,
    selectedStructureId: state.selectedStructureId,
    parcelBufferInches: state.parcelBufferInches,
    parcelViewport: state.parcelViewport,
    viewBearing: state.viewBearing,
    viewPitch: state.viewPitch,
    showVegetation: state.showVegetation,
    vegetationOpacity: state.vegetationOpacity,
    mapSettings: state.mapSettings,
    bed: state.bed,
    plants: state.plants,
    selectedPlantId: state.selectedPlantId,
    selectedPlacementId: state.selectedPlacementId,
    placements: state.placements,
    spatial: gardenStateSpatialExport(state)
  };
}

function activeGardenSpatialDataset(state) {
  syncActiveParcelWorkspace(state);
  const spatial = gardenStateSpatialExport(state);
  return spatial.datasets?.find((dataset) => dataset.gardenId === state.activeParcelId)
    || spatial.datasets?.[0]
    || null;
}

function spatialDownloadName(state, extension) {
  const workspace = activeParcelWorkspace(state);
  const base = slugify(workspace?.name || state.property?.name || state.activeParcelId || "garden-plan");
  return `${base || "garden-plan"}.${extension}`;
}

function downloadPlannerText(text, type, fileName) {
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function stageSpatialImportFile(file, text) {
  const lowerName = String(file?.name || "").toLowerCase();
  const source = {fileName: file?.name || "uploaded spatial file"};
  return lowerName.endsWith(".kml")
    ? stageKmlImport(text, {source})
    : stageGeoJsonImport(text, {source});
}

function failedSpatialImportStage(code, message, sourceFormat = "unknown") {
  const error = {severity: "error", code, message};
  return {
    type: "GardenSpatialImportStage",
    schemaVersion: SPATIAL_INTERCHANGE_VERSION,
    reviewOnly: true,
    sourceFormat,
    promotion: {eligible: false, reason: "The uploaded file was not accepted as canonical garden data."},
    summary: {featureCount: 0, errorCount: 1, warningCount: 0, categories: {}},
    errors: [error],
    warnings: [],
    collection: {
      type: "FeatureCollection",
      properties: {reviewOnly: true, sourceFormat, promotionRequired: true},
      features: []
    }
  };
}

function renderSpatialImportReview(refs, state) {
  const review = activeSpatialImportReview(state);
  refs.actions.clearSpatialImport.hidden = !review;
  refs.spatialImportStatus.hidden = !review;
  const evidenceLabels = [
    ...(gardenBundledSourceEvidenceAvailable(state) ? ["Source"] : []),
    ...(gardenStagedImportEvidenceAvailable(state) ? ["upload"] : [])
  ];
  refs.sourceEvidenceLabel.innerHTML = `${evidenceLabels.length ? `${evidenceLabels.join(" + ")} evidence` : "Review evidence"} <small>not canonical</small>`;
  if (!review) {
    refs.spatialImportStatus.replaceChildren();
    delete refs.spatialImportStatus.dataset.severity;
    return;
  }
  const {stage} = review;
  const visibleCount = spatialImportDisplayCollection(review)?.features?.length || 0;
  const errorCount = stage.errors?.length || 0;
  const warningCount = stage.warnings?.length || 0;
  const severity = errorCount ? "error" : warningCount ? "warning" : "ok";
  refs.spatialImportStatus.dataset.severity = severity;
  const issues = [...(stage.errors || []), ...(stage.warnings || [])].slice(0, 4);
  refs.spatialImportStatus.innerHTML = `
    <strong>${escapeHtml(review.fileName)}</strong>
    <span>${stage.summary?.featureCount || 0} staged · ${visibleCount} safe to compare · ${errorCount} error${errorCount === 1 ? "" : "s"} · ${warningCount} warning${warningCount === 1 ? "" : "s"}</span>
    <small>Review layer only — no plan geometry was changed.</small>
    ${issues.length ? `<ul>${issues.map((item) => `<li><b>${escapeHtml(item.code)}</b> ${escapeHtml(item.message)}</li>`).join("")}</ul>` : ""}
  `;
}

function normalizeStateShape(state) {
  state.viewPresentation = normalizeViewPresentation(state.viewPresentation);
  state.activeTool = normalizeActiveTool(state.activeTool);
  state.toolDrawerOpen = state.toolDrawerOpen === true;
  state.inspectorOpen = state.inspectorOpen === true;
  state.inspectorMode = normalizeInspectorMode(state.inspectorMode);
  state.inspectorTab = normalizeInspectorTab(state.inspectorTab);
  state.layouts = Array.isArray(state.layouts) ? normalizeLayouts(state.layouts) : [];
  const savedProperty = state.property || {};
  state.property = savedProperty.parcel?.geometry
    ? {
        ...structuredCloneCompat(PROPERTY_CONTEXT),
        ...sanitizePropertyContext(savedProperty),
        imagery: {
          ...structuredCloneCompat(PROPERTY_CONTEXT.imagery),
          ...(savedProperty.imagery || {}),
          basemaps: structuredCloneCompat(PROPERTY_CONTEXT.imagery.basemaps || [])
        }
      }
    : structuredCloneCompat(PROPERTY_CONTEXT);
  const legacyWorkspace = captureParcelWorkspace({
    ...state,
    property: state.property,
    activeParcelId: state.activeParcelId || state.property.id || PROPERTY_CONTEXT.id
  }, {
    id: state.activeParcelId || state.property.id || PROPERTY_CONTEXT.id,
    name: state.property.name || "Current parcel"
  });
  state.parcels = normalizeParcelWorkspaces(Array.isArray(state.parcels) ? state.parcels : [], legacyWorkspace);
  if (!state.parcels.some((parcel) => parcel.id === state.activeParcelId)) {
    state.activeParcelId = state.parcels[0]?.id || PROPERTY_CONTEXT.id;
  }
  const activeWorkspace = state.parcels.find((parcel) => parcel.id === state.activeParcelId) || state.parcels[0];
  if (activeWorkspace) applyParcelWorkspace(state, activeWorkspace);
  state.basemapId = normalizeBasemapId(state, state.basemapId || state.property.imagery?.activeBasemapId);
  state.property.imagery.activeBasemapId = state.basemapId;
  state.beds = normalizeBeds(state.beds, state.bed, {includeDefaults: !Array.isArray(state.beds)});
  if (!state.beds.some((bed) => bed.id === state.activeBedId)) state.activeBedId = state.beds[0]?.id || DEFAULT_ACTIVE_BED_ID;
  state.structures = normalizeStructures(
    Array.isArray(state.structures) ? state.structures : structuredCloneCompat(PROPERTY_STRUCTURES)
  );
  if (!state.structures.some((structure) => structure.id === state.selectedStructureId)) state.selectedStructureId = null;
  state.vegetation = normalizeVegetation(Array.isArray(state.vegetation) ? state.vegetation : structuredCloneCompat(DEFAULT_VEGETATION));
  if (!state.vegetation.some((vegetation) => vegetation.id === state.selectedVegetationId)) state.selectedVegetationId = null;
  state.parcelBufferInches = clamp(Number(state.parcelBufferInches) || 1800, 360, 7200);
  state.parcelViewport = normalizeParcelViewport(state, state.parcelViewport);
  state.viewBearing = normalizeViewBearing(state.viewBearing);
  state.viewPitch = normalizeViewPitch(state.viewPitch);
  state.mapSettings = normalizeMapSettings(state.mapSettings, state.showVegetation);
  state.showVegetation = state.mapSettings.showVegetation;
  state.vegetationOpacity = clamp(Number(state.vegetationOpacity) || 0.62, 0.12, 1);
  state.placements = Array.isArray(state.placements)
    ? state.placements.map((placement) => normalizePlacement(placement, state.beds))
    : [];
  state.viewMode = normalizeViewMode(state.viewMode);
  if (!Array.isArray(state.draftBedPoints)) state.draftBedPoints = [];
  state.bed = bedControlSnapshot(activeBed(state));
}

function normalizeParcelWorkspaces(parcels, fallbackWorkspace) {
  const normalized = [];
  const seen = new Set();
  for (const parcel of parcels) {
    const workspace = normalizeParcelWorkspace(parcel);
    if (!workspace || seen.has(workspace.id)) continue;
    normalized.push(workspace);
    seen.add(workspace.id);
  }
  const fallback = normalizeParcelWorkspace(fallbackWorkspace || createDefaultParcelWorkspace());
  if (!normalized.length && fallback) normalized.push(fallback);
  return normalized;
}

function normalizeParcelWorkspace(workspace = {}) {
  const property = sanitizePropertyContext(workspace.property || PROPERTY_CONTEXT, {
    name: workspace.name || "Parcel"
  });
  const hasWorkspaceBeds = Array.isArray(workspace.beds);
  const beds = normalizeBeds(hasWorkspaceBeds ? workspace.beds : DEFAULT_BEDS, workspace.bed, {
    includeDefaults: !hasWorkspaceBeds
  });
  const activeBedId = beds.some((bed) => bed.id === workspace.activeBedId)
    ? workspace.activeBedId
    : beds[0]?.id || DEFAULT_ACTIVE_BED_ID;
  const parcelBufferInches = clamp(Number(workspace.parcelBufferInches) || 1800, 360, 7200);
  const viewportState = {property, parcelBufferInches};
  return {
    id: workspace.id || property.id || uniqueStaticId("parcel"),
    name: safeParcelDisplayName(workspace.name || property.name, "Parcel"),
    property,
    activeBedId,
    bedCameras: normalizeBedCameras(beds, workspace.bedCameras),
    beds,
    structures: normalizeStructures(Array.isArray(workspace.structures) ? workspace.structures : []),
    vegetation: normalizeVegetation(Array.isArray(workspace.vegetation) ? workspace.vegetation : []),
    placements: Array.isArray(workspace.placements)
      ? workspace.placements.map((placement) => normalizePlacement(placement, beds))
      : [],
    selectedVegetationId: workspace.selectedVegetationId || null,
    selectedStructureId: workspace.selectedStructureId || null,
    selectedPlacementId: workspace.selectedPlacementId || null,
    starterLayoutRevision: Math.max(0, Number(workspace.starterLayoutRevision) || 0),
    parcelBufferInches,
    parcelViewport: normalizeParcelViewport(viewportState, workspace.parcelViewport),
    viewBearing: normalizeViewBearing(workspace.viewBearing),
    viewPitch: normalizeViewPitch(workspace.viewPitch)
  };
}

function createDefaultParcelWorkspace() {
  return {
    id: PROPERTY_CONTEXT.id,
    name: PROPERTY_CONTEXT.name,
    property: structuredCloneCompat(PROPERTY_CONTEXT),
    activeBedId: DEFAULT_ACTIVE_BED_ID,
    beds: structuredCloneCompat(DEFAULT_BEDS),
    structures: structuredCloneCompat(PROPERTY_STRUCTURES),
    vegetation: structuredCloneCompat(DEFAULT_VEGETATION),
    placements: structuredCloneCompat(DEFAULT_STATE.placements || []),
    selectedVegetationId: null,
    selectedStructureId: null,
    selectedPlacementId: DEFAULT_STATE.selectedPlacementId,
    starterLayoutRevision: DEFAULT_STARTER_LAYOUT_REVISION,
    parcelBufferInches: 1800,
    parcelViewport: null,
    viewBearing: DEFAULT_VIEW_BEARING,
    viewPitch: DEFAULT_VIEW_PITCH
  };
}

function referenceConceptBoundary(referenceId) {
  if (referenceId === "the-mount-kitchen-garden") {
    return [[-900, -700], [900, -700], [900, 700], [-900, 700], [-900, -700]];
  }
  if (referenceId === "naumkeag-garden-rooms") {
    return [[-1200, -900], [1200, -900], [1200, 900], [-1200, 900], [-1200, -900]];
  }
  return [[-1400, -1000], [1400, -1000], [1400, 1000], [-1400, 1000], [-1400, -1000]];
}

function referenceConceptProperty(reference) {
  const primarySource = reference.sources?.[0];
  const parcelMatched = reference.mapping?.parcelStatus === "matched" && reference.geometry;
  const layoutIsDiagrammatic = reference.mapping?.layoutStatus === "diagrammatic";
  return sanitizePropertyContext({
    id: reference.id,
    version: PROPERTY_CONTEXT.version,
    name: reference.name,
    source: parcelMatched
      ? `MassGIS Level 3 parcel geometry with an editable layout based on ${primarySource?.label || "official garden information"}.`
      : `Public reference starter based on ${primarySource?.label || "official garden information"}.`,
    acreage: reference.acreage || null,
    units: "inches",
    northDegrees: 0,
    aspect: reference.planningFocus,
    spatialStatus: parcelMatched ? "mapped" : "concept",
    localOrigin: parcelMatched
      ? layoutAnchorOrigin(reference.mapping?.layoutAnchor) || localOriginFromGeometry(reference.geometry)
      : undefined,
    reference: structuredCloneCompat(reference),
    boundary: referenceConceptBoundary(reference.id),
    landmark: {
      name: reference.name,
      kind: reference.kind,
      website: primarySource?.url || "",
      gardenMap: reference.sources?.[1]?.url || primarySource?.url || "",
      mapEdition: "Official public garden references",
      interpretation: layoutIsDiagrammatic
        ? "The parcel boundary is mapped from MassGIS. Beds, structures, vegetation, and paths are diagrammatic planning references, not surveyed interior features."
        : "Parcel and interior overlays are public-data interpretations, not surveyed features."
    },
    parcel: {
      ...structuredCloneCompat(PROPERTY_CONTEXT.parcel),
      queried: parcelMatched
        ? "Public landmark matched to a MassGIS parcel; identifying assessor fields are not retained"
        : "Reference-only concept canvas; connect a MassGIS parcel to georeference this garden",
      attributes: parcelMatched ? {
        MAP_PAR_ID: reference.mapping.parcelId,
        PROP_ID: reference.mapping.parcelId,
        LOT_SIZE: reference.parcelAcreage || reference.acreage || null,
        LOT_UNITS: "Acres",
        FY: reference.mapping.parcelFiscalYear
      } : {},
      members: reference.siteReconstructionRevision ? getGardenSpatialDataset(reference.id).collections.parcels.features.map(feature => ({
        id: feature.id, geometry: structuredCloneCompat(feature.geometry),
        attributes: structuredCloneCompat(feature.properties),
        acreage: feature.properties.LOT_UNITS === "Sq. Ft." ? feature.properties.LOT_SIZE / 43560 : null
      })) : [],
      geometry: parcelMatched ? structuredCloneCompat(reference.geometry) : undefined
    },
    imagery: {
      ...structuredCloneCompat(PROPERTY_CONTEXT.imagery),
      enabled: Boolean(parcelMatched),
      name: parcelMatched ? PROPERTY_CONTEXT.imagery.name : "Reference diagram",
      attribution: parcelMatched ? PROPERTY_CONTEXT.imagery.attribution : "Concept layout; no parcel imagery"
    },
    importSources: (reference.sources || []).map((source) => ({
      name: source.label,
      service: source.url,
      status: source.id === "source:massgis-parcels"
        ? "matched public parcel geometry"
        : "public reference for editable interior layout"
    }))
  }, {name: reference.name});
}

function referenceStarterViewport(reference) {
  if (!reference?.geometry) return null;
  if (reference.starterLayout?.viewport) return structuredCloneCompat(reference.starterLayout.viewport);
  if (reference.id === "the-mount-kitchen-garden") return {x: -1500, y: -1100, width: 3000, height: 2200};
  return {x: -2200, y: -1650, width: 4400, height: 3300};
}

function referenceBed(reference, id, name, zone, x, y, width, height, rotation = 0) {
  return normalizeBed({
    id: `${reference.id}-${id}`,
    name,
    zone,
    x,
    y,
    width,
    height,
    rotation,
    safeMargin: 6,
    grid: 6,
    crowding: 1,
    showSpacing: true,
    notes: `Editable concept bed informed by ${reference.sources?.[0]?.label || "the public garden reference"}; not a surveyed feature.`
  });
}

function referenceSiteWorkspace(reference) {
  if (!reference.siteReconstructionRevision) return null;
  if (!referenceSiteWorkspaces.has(reference.id)) {
    referenceSiteWorkspaces.set(reference.id, gardenSpatialDatasetToWorkspace(
      getGardenSpatialDataset(reference.id), referenceConceptProperty(reference)
    ));
  }
  return referenceSiteWorkspaces.get(reference.id);
}

function referenceStarterBeds(reference) {
  if (reference.siteReconstructionRevision) {
    const observed = structuredCloneCompat(referenceSiteWorkspace(reference).beds);
    if (observed.length) return observed;
    const viewport = referenceStarterViewport(reference), x = viewport.x + viewport.width / 2, y = viewport.y + viewport.height / 2;
    return ["Spring greens", "Summer kitchen", "Seasonal flowers"].map((name, i) => referenceBed(reference, `illustrative-${i}`, `${name} · proposed`, "Illustrative seasonal design", x + (i - 1) * 96, y, 60, 120));
  }
  if (Array.isArray(reference.starterLayout?.beds)) {
    return reference.starterLayout.beds.map((bed) => normalizeBed(structuredCloneCompat(bed)));
  }
  if (reference.id === "the-mount-kitchen-garden") {
    return [
      referenceBed(reference, "west-1", "Kitchen West 1", "Historic kitchen garden", -360, -300, 48, 144),
      referenceBed(reference, "west-2", "Kitchen West 2", "Historic kitchen garden", -240, -300, 48, 144),
      referenceBed(reference, "west-3", "Kitchen West 3", "Historic kitchen garden", -120, -300, 48, 144),
      referenceBed(reference, "east-1", "Kitchen East 1", "Historic kitchen garden", 120, -300, 48, 144),
      referenceBed(reference, "east-2", "Kitchen East 2", "Historic kitchen garden", 240, -300, 48, 144),
      referenceBed(reference, "east-3", "Kitchen East 3", "Historic kitchen garden", 360, -300, 48, 144),
      referenceBed(reference, "herbs", "Kitchen Herb Beds", "Historic kitchen garden", -250, 220, 180, 72),
      referenceBed(reference, "flowers", "Cut Flower Beds", "Historic kitchen garden", 250, 220, 180, 72)
    ];
  }
  return [
    referenceBed(reference, "terrace-1", "Lower Terrace 1", "Terrace gardens", -420, -360, 360, 96, -3),
    referenceBed(reference, "terrace-2", "Lower Terrace 2", "Terrace gardens", 0, -330, 360, 96, 2),
    referenceBed(reference, "terrace-3", "Lower Terrace 3", "Terrace gardens", 420, -360, 360, 96, 4),
    referenceBed(reference, "border-west", "Woodland Border · west", "Woodland transition", -600, 180, 180, 420, -8),
    referenceBed(reference, "border-east", "Woodland Border · east", "Woodland transition", 600, 180, 180, 420, 8),
    referenceBed(reference, "flowers", "Seasonal Flower Terrace", "Terrace gardens", 0, 360, 600, 120)
  ];
}

function referenceStarterStructures(reference) {
  if (reference.siteReconstructionRevision) return normalizeStructures(structuredCloneCompat(referenceSiteWorkspace(reference).structures));
  if (Array.isArray(reference.starterLayout?.structures)) {
    return normalizeStructures(structuredCloneCompat(reference.starterLayout.structures));
  }
  const source = reference.sources?.[0]?.label || "public garden reference";
  const feature = (id, name, type, x, y, width, height, rotation = 0) => normalizeStructure({
    id: `${reference.id}-${id}`,
    name,
    type,
    x,
    y,
    width,
    height,
    rotation,
    confidence: "low",
    source,
    notes: "Approximate diagram element for organizing an editable starter layout; not a surveyed feature."
  });
  if (reference.id === "the-mount-kitchen-garden") {
    return [
      feature("center-walk", "Kitchen garden center walk", "path", 0, -110, 84, 900),
      feature("cross-walk", "Kitchen garden cross walk", "path", 0, 40, 900, 84)
    ];
  }
  return [
    feature("terrace-walk", "Terrace walk", "path", 0, -80, 1100, 84),
    feature("stream-walk", "Stream-side walk", "path", 0, 250, 96, 1200, -12)
  ];
}

function referenceStarterVegetation(reference) {
  if (reference.siteReconstructionRevision) return normalizeVegetation(structuredCloneCompat(referenceSiteWorkspace(reference).vegetation));
  if (Array.isArray(reference.starterLayout?.vegetation)) {
    return normalizeVegetation(structuredCloneCompat(reference.starterLayout.vegetation));
  }
  if (reference.id !== "ashintully-terrace-garden") return [];
  const source = reference.sources?.[0]?.label || "public garden reference";
  return normalizeVegetation([
    {id: `${reference.id}-woodland-west`, name: "West woodland edge", kind: "forest", canopyClass: "mixed", plantId: "red-maple", x: -980, y: 240, width: 620, height: 1280, rotation: -8, confidence: "low", source, notes: "Diagrammatic woodland context; not surveyed."},
    {id: `${reference.id}-woodland-east`, name: "East woodland edge", kind: "forest", canopyClass: "mixed", plantId: "red-maple", x: 980, y: 240, width: 620, height: 1280, rotation: 8, confidence: "low", source, notes: "Diagrammatic woodland context; not surveyed."}
  ]);
}

function referenceStarterPlacements(reference, beds) {
  if (reference.siteReconstructionRevision) {
    const observed = structuredCloneCompat(referenceSiteWorkspace(reference).placements);
    const proposals = beds.filter(b => b.id.includes("-illustrative-"));
    const plants = [CORE_PLANTS.find(p => p.id === "lettuce"), CORE_PLANTS.find(p => p.id === "basil"), CORE_PLANTS.find(p => p.id === "nasturtium")];
    return [...observed, ...proposals.flatMap((bed,i) => bedFillPositions(bed, plants[i % plants.length]).slice(0,24).map((point,j) => ({id:`${bed.id}-plant-${j}`,bedId:bed.id,plantId:plants[i % plants.length].id,...point,health:"planned",notes:"Illustrative seasonal planting, not an institutional inventory",rotation:0})))];
  }
  const candidates = Array.isArray(reference.starterLayout?.placements)
    ? structuredCloneCompat(reference.starterLayout.placements)
    : [];
  const knownBeds = new Set(beds.map((bed) => bed.id));
  return candidates.filter((item) => knownBeds.has(item.bedId));
}

function createReferenceGardenWorkspace(reference) {
  const property = referenceConceptProperty(reference);
  const beds = referenceStarterBeds(reference);
  return normalizeParcelWorkspace({
    id: reference.id,
    name: reference.name,
    property,
    activeBedId: beds[0]?.id,
    beds,
    structures: referenceStarterStructures(reference),
    vegetation: referenceStarterVegetation(reference),
    placements: [...referenceStarterPlacements(reference, beds), ...proposedBedPlantings(beds, referenceStarterPlacements(reference, beds))],
    selectedVegetationId: null,
    selectedStructureId: null,
    selectedPlacementId: null,
    // A garden whose only calibrated element is its geographic origin may not
    // have a literal starterLayout object. In that case the mapping calibration
    // revision is still the version saved workspaces must retain.
    starterLayoutRevision: Math.max(
      1,
      Number(reference.starterLayout?.revision) || 0,
      Number(reference.mapping?.layoutCalibration?.revision) || 0
    ),
    parcelBufferInches: 360,
    parcelViewport: referenceStarterViewport(reference),
    viewBearing: DEFAULT_VIEW_BEARING,
    viewPitch: DEFAULT_VIEW_PITCH
  });
}

function defaultGardenWorkspaceById(id) {
  if (id === PROPERTY_CONTEXT.id) return createDefaultParcelWorkspace();
  const reference = gardenReferenceById(id);
  return reference ? createReferenceGardenWorkspace(reference) : null;
}

function captureParcelWorkspace(state, base = {}) {
  return {
    id: base.id || state.activeParcelId || state.property?.id || uniqueStaticId("parcel"),
    name: base.name || activeParcelWorkspace(state)?.name || state.property?.name || "Parcel",
    property: sanitizePropertyContext(state.property || PROPERTY_CONTEXT, {
      name: base.name || state.property?.name || "Parcel"
    }),
    activeBedId: state.activeBedId,
    bedCameras: structuredCloneCompat(state.bedCameras || {}),
    beds: structuredCloneCompat(state.beds || []),
    structures: structuredCloneCompat(state.structures || []),
    vegetation: structuredCloneCompat(state.vegetation || []),
    placements: structuredCloneCompat(state.placements || []),
    selectedVegetationId: state.selectedVegetationId || null,
    selectedStructureId: state.selectedStructureId || null,
    selectedPlacementId: state.selectedPlacementId || null,
    starterLayoutRevision: Math.max(0, Number(state.starterLayoutRevision ?? base.starterLayoutRevision) || 0),
    parcelBufferInches: state.parcelBufferInches,
    parcelViewport: structuredCloneCompat(state.parcelViewport || null),
    viewBearing: normalizeViewBearing(state.viewBearing),
    viewPitch: normalizeViewPitch(state.viewPitch)
  };
}

function activeParcelWorkspace(state) {
  return (state.parcels || []).find((parcel) => parcel.id === state.activeParcelId) || (state.parcels || [])[0] || null;
}

function syncActiveParcelWorkspace(state) {
  const workspace = activeParcelWorkspace(state);
  if (!workspace) return;
  Object.assign(workspace, normalizeParcelWorkspace(captureParcelWorkspace(state, workspace)));
}

function applyParcelWorkspace(state, workspace) {
  const normalized = normalizeParcelWorkspace(workspace);
  state.walkCamera = null;
  explicitEditSessions.delete(state);
  state.activeParcelId = normalized.id;
  state.property = structuredCloneCompat(normalized.property);
  state.activeBedId = normalized.activeBedId;
  state.bedCameras = normalized.bedCameras;
  state.beds = structuredCloneCompat(normalized.beds);
  state.structures = structuredCloneCompat(normalized.structures);
  state.vegetation = structuredCloneCompat(normalized.vegetation);
  state.placements = structuredCloneCompat(normalized.placements);
  state.selectedVegetationId = normalized.selectedVegetationId;
  state.selectedStructureId = normalized.selectedStructureId;
  state.selectedPlacementId = normalized.selectedPlacementId;
  state.starterLayoutRevision = normalized.starterLayoutRevision;
  state.parcelBufferInches = normalized.parcelBufferInches;
  state.parcelViewport = structuredCloneCompat(normalized.parcelViewport);
  state.viewBearing = normalized.viewBearing;
  state.viewPitch = normalized.viewPitch;
  state.basemapId = normalizeBasemapId(state, normalized.property.imagery?.activeBasemapId || state.basemapId);
}

function sanitizePropertyContext(property, options = {}) {
  const source = structuredCloneCompat(property || PROPERTY_CONTEXT);
  const geometry = normalizeParcelGeometry(source.parcel?.geometry || source.geometry || PROPERTY_CONTEXT.parcel?.geometry);
  const origin = source.localOrigin || localOriginFromGeometry(geometry) || PROPERTY_CONTEXT.localOrigin;
  const cleanAttributes = sanitizeParcelAttributes(source.parcel?.attributes || source.attributes || {});
  // Older saves retained the campus MultiPolygon but dropped its parcel records.
  // Recover known members only when the complete source boundary still matches.
  const memberSource = Array.isArray(source.parcel?.members) && source.parcel.members.length
    ? source.parcel.members
    : source.id === PROPERTY_CONTEXT.id && JSON.stringify(geometry) === JSON.stringify(PROPERTY_CONTEXT.parcel.geometry)
    ? PROPERTY_CONTEXT.parcel.members : [];
  const members = (memberSource || []).flatMap(member => {
    const memberGeometry = normalizeGeoJsonParcelGeometry(member.geometry);
    if (!member.id || !memberGeometry) return [];
    return [{id: String(member.id), geometry: memberGeometry,
      acreage: Number.isFinite(member.acreage) ? member.acreage : null,
      attributes: sanitizeParcelAttributes(member.attributes || {})}];
  });
  const sanitized = {
    ...structuredCloneCompat(PROPERTY_CONTEXT),
    ...source,
    id: source.id || uniqueStaticId("parcel"),
    name: safeParcelDisplayName(options.name || source.name, "Parcel"),
    source: source.source || "MassGIS Level 3 Property Tax Parcels.",
    localOrigin: origin,
    importSources: structuredCloneCompat(source.importSources || PROPERTY_CONTEXT.importSources || []),
    parcel: {
      service: source.parcel?.service || MASSGIS_PARCEL_SERVICE,
      queried: safeParcelQueryDescription(source.parcel?.queried),
      spatialReference: "EPSG:4326",
      attributes: cleanAttributes,
      ...(members.length ? {members} : {}),
      geometry
    },
    imagery: {
      ...structuredCloneCompat(PROPERTY_CONTEXT.imagery),
      ...(source.imagery || {}),
      basemaps: structuredCloneCompat(PROPERTY_CONTEXT.imagery.basemaps || [])
    }
  };
  sanitized.spatialReference = gardenSpatialReference({...sanitized, spatialReference: undefined});
  return sanitized;
}

function layoutAnchorOrigin(layoutAnchor) {
  const coordinates = layoutAnchor?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const lon = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  return Number.isFinite(lon) && Number.isFinite(lat) ? {lon, lat} : null;
}

function safeParcelDisplayName(name, fallback = "Parcel") {
  const label = String(name || "").trim();
  if (!label) return fallback;
  const looksLikeAddress = /\d/.test(label) && /\b(parcel|road|rd|street|st|avenue|ave|drive|dr|lane|ln|court|ct|circle|cir)\b/i.test(label);
  return looksLikeAddress ? fallback : label;
}

function safeParcelQueryDescription(description) {
  const value = String(description || "").trim();
  if (!value) return "User-selected MassGIS parcel";
  if (/\bADDR_NUM\b|\bFULL_STR\b|\bCITY\b|'.*'/.test(value)) return "Sanitized MassGIS parcel geometry";
  return value;
}

function sanitizeParcelAttributes(attributes = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(attributes || {})) {
    if (PRIVATE_PARCEL_ATTRIBUTE_FIELDS.has(key)) continue;
    if (/^OWNER/i.test(key) || /^OWN_/i.test(key)) continue;
    clean[key] = value;
  }
  return clean;
}

function normalizeParcelGeometry(geometry) {
  return normalizeGeoJsonParcelGeometry(geometry)
    || structuredCloneCompat(PROPERTY_CONTEXT.parcel.geometry);
}

function localOriginFromGeometry(geometry) {
  const points = flattenExteriorRings(parcelExteriorRings(geometry));
  if (!points.length) return null;
  const sums = points.reduce((total, point) => ({
    lon: total.lon + (Number(point[0]) || 0),
    lat: total.lat + (Number(point[1]) || 0)
  }), {lon: 0, lat: 0});
  return {
    lon: sums.lon / points.length,
    lat: sums.lat / points.length
  };
}

function normalizeViewPresentation(value) {
  return ["map", "2d", "3d", "split"].includes(value) ? value : "map";
}

function normalizeViewBearing(value) {
  const bearing = Number(value);
  if (!Number.isFinite(bearing)) return DEFAULT_VIEW_BEARING;
  return ((bearing + 180) % 360 + 360) % 360 - 180;
}

function normalizeViewPitch(value) {
  const pitch = Number(value);
  return Number.isFinite(pitch) ? clamp(pitch, 0, 75) : DEFAULT_VIEW_PITCH;
}

function normalizeActiveTool(value) {
  return ["select", "parcel", "beds", "plants", "flowers", "structures", "vegetation"].includes(value) ? value : "beds";
}

function normalizeInspectorMode(value) {
  return ["bed", "structure", "vegetation", "plant", "placement"].includes(value) ? value : "bed";
}

function normalizeInspectorTab(value) {
  return ["edit", "diagnostics"].includes(value) ? value : "edit";
}

function openInspector(state, mode, tab = "edit") {
  state.inspectorMode = normalizeInspectorMode(mode);
  state.inspectorTab = normalizeInspectorTab(tab);
  state.inspectorOpen = true;
}

// Workspaces change the view, never the edit authorization or garden records.
const walkingReturns = new WeakMap();
function openPlantingWorkspace(state, bedId = state.activeBedId) {
  const bed = state.beds.find(item => item.id === bedId);
  if (!bed) return false;
  if (state.walkCamera) walkingReturns.set(state,{gardenId:state.activeParcelId,walk:{...state.walkCamera},bearing:planningBearing(state)});
  explicitEditSessions.delete(state);
  state.activeBedId = bed.id;
  state.viewMode = "bed";
  state.viewPresentation = state.viewPresentation === "map" ? "2d" : state.viewPresentation;
  state.walkCamera = null;
  state.activeTool = "plants";
  state.drawMode = null;
  state.toolDrawerOpen = true;
  state.inspectorOpen = false;
  state.bedCameras[bed.id] ||= normalizeBedCamera(bed);
  syncSelectedPlacementToActiveBed(state);
  return true;
}

function selectGardenFeature(state, type, id) {
  if (type === "bed") {
    state.activeBedId = id;
    state.selectedStructureId = null;
    state.selectedVegetationId = null;
    syncSelectedPlacementToActiveBed(state);
  } else if (type === "structure") {
    state.selectedStructureId = id;
    state.selectedVegetationId = null;
    state.selectedPlacementId = null;
  } else if (type === "vegetation") {
    state.selectedVegetationId = id;
    state.selectedStructureId = null;
    state.selectedPlacementId = null;
  } else if (type === "placement") {
    const placement = (state.placements || []).find((item) => item.id === id);
    if (!placement) return false;
    state.activeBedId = placement.bedId;
    state.selectedPlacementId = placement.id;
    state.selectedPlantId = placement.plantId;
    state.selectedStructureId = null;
    state.selectedVegetationId = null;
  } else {
    return false;
  }
  openInspector(state, type);
  return true;
}

function featureInteractionHint(state, type) {
  if (plannerCanEditFeature(state, type)) return "Click to inspect · drag to move";
  const featureLayer = plannerEditLayerLabel(PLANNER_EDIT_LAYER_BY_FEATURE[type]);
  return `Click to inspect · ${featureLayer} locked`;
}

function featureHoverContent(state, type, feature) {
  if (!feature) return null;
  if (type === "bed") {
    const area = feature.polygon
      ? polygonAreaSqFt(feature.polygon)
      : feature.width * feature.height / 144;
    const reference = primaryFeatureSourceReference(feature);
    return {
      eyebrow: feature.zone || "Garden bed",
      title: feature.name,
      details: [
        `${round(area)} sq ft`,
        `${placementsForBed(state, feature.id).length} plants`,
        ...(reference ? [formatFeatureSourceReference(reference)] : []),
        featureInteractionHint(state, "bed")
      ]
    };
  }
  if (type === "structure") {
    const definition = siteFeatureDefinition(feature);
    const reference = primaryFeatureSourceReference(feature);
    const geometry = structureLocalGeometry(feature);
    const extent = geometry?.type === "Point"
      ? "Mapped point"
      : geometry?.type === "LineString"
      ? `${round(Math.max(feature.width, feature.height) / 12)} ft mapped line`
      : `${round(feature.width / 12)} × ${round(feature.height / 12)} ft extent`;
    return {
      eyebrow: definition.label,
      title: feature.name,
      details: [
        extent,
        `${titleCase(feature.confidence || "medium")} confidence`,
        ...(reference ? [formatFeatureSourceReference(reference)] : []),
        featureInteractionHint(state, "structure")
      ]
    };
  }
  if (type === "vegetation") {
    const reference = primaryFeatureSourceReference(feature);
    return {
      eyebrow: titleCase(feature.kind || "vegetation"),
      title: feature.name,
      details: [
        `${plantById(state, feature.plantId)?.name || titleCase(feature.canopyClass)}`,
        `${titleCase(feature.confidence || "medium")} confidence`,
        ...(reference ? [formatFeatureSourceReference(reference)] : []),
        featureInteractionHint(state, "vegetation")
      ]
    };
  }
  if (type === "placement") {
    const plant = plantById(state, feature.plantId);
    const bed = bedForPlacement(state, feature);
    const status = placementStatus(feature, state);
    return {
      eyebrow: bed?.name || "Planting",
      title: plant?.name || "Plant",
      details: [status.messages.join(" ") || "Spacing checks pass", feature.planted ? `Planted ${feature.planted}` : "Date not recorded", featureInteractionHint(state, "placement")]
    };
  }
  return null;
}

function positionFeatureHover(card, event) {
  if (!card || card.hidden) return;
  const gap = 14;
  const bounds = card.getBoundingClientRect();
  const left = clamp(event.clientX + gap, 8, Math.max(8, window.innerWidth - bounds.width - 8));
  const top = clamp(event.clientY + gap, 8, Math.max(8, window.innerHeight - bounds.height - 8));
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}

function showFeatureHover(card, state, type, feature, event) {
  const content = featureHoverContent(state, type, feature);
  if (!card || !content) return;
  card.innerHTML = `
    <span>${escapeHtml(content.eyebrow)}</span>
    <strong>${escapeHtml(content.title)}</strong>
    <small>${content.details.map((detail) => escapeHtml(detail)).join(" <b aria-hidden=\"true\">·</b> ")}</small>
  `;
  card.hidden = false;
  positionFeatureHover(card, event);
}

function hideFeatureHover(card) {
  if (!card) return;
  card.hidden = true;
}

function bindFeatureHover(selection, state, type, featureFromDatum = (datum) => datum) {
  const root = selection.node()?.closest?.(".garden-planner-app");
  const card = root?.querySelector?.('[data-role="feature-hover-card"]');
  if (!card) return selection;
  return selection
    .on("pointerenter.feature-hover", (event, datum) => showFeatureHover(card, state, type, featureFromDatum(datum), event))
    .on("pointermove.feature-hover", (event, datum) => positionFeatureHover(card, event))
    .on("pointerleave.feature-hover", () => hideFeatureHover(card));
}

function selectedToolCardKey(state) {
  if (state.activeTool === "beds") return state.activeBedId ? `bed:${state.activeBedId}` : "";
  if (state.activeTool === "structures") return state.selectedStructureId ? `structure:${state.selectedStructureId}` : "";
  if (state.activeTool === "vegetation") return state.selectedVegetationId ? `vegetation:${state.selectedVegetationId}` : "";
  if (["plants", "flowers"].includes(state.activeTool)) return state.selectedPlantId ? `plant:${state.selectedPlantId}` : "";
  return "";
}

function syncSelectedToolCard(refs, state) {
  if (!state.toolDrawerOpen) {
    delete refs.root.dataset.scrolledSelection;
    return;
  }
  const key = selectedToolCardKey(state);
  if (!key || refs.root.dataset.scrolledSelection === key) return;
  const [type, id] = key.split(":");
  const selector = type === "bed"
    ? `.bed-option[data-feature-id="${CSS.escape(id)}"]`
    : type === "structure"
    ? `.structure-option[data-feature-id="${CSS.escape(id)}"]`
    : type === "vegetation"
    ? `.vegetation-option[data-feature-id="${CSS.escape(id)}"]`
    : `[data-plant-id="${CSS.escape(id)}"]`;
  requestAnimationFrame(() => {
    const card = refs.toolDrawer.querySelector(selector);
    if (!card) return;
    card.scrollIntoView({block: "nearest"});
    refs.root.dataset.scrolledSelection = key;
  });
}

function normalizeViewMode(mode) {
  // Older saves called the spatial overview "acre" or "parcel". Keep those
  // layouts spatial instead of unexpectedly opening an isolated bed canvas.
  if (mode === "acre" || mode === "parcel") return "garden";
  return ["bed", "garden"].includes(mode) ? mode : "bed";
}

function normalizeBasemapId(state, id) {
  const basemaps = parcelBasemaps(state);
  return basemaps.some((basemap) => basemap.id === id) ? id : basemaps[0]?.id || "esri-world";
}

function normalizeBedVisibility(value) {
  return ["all", "active", "none"].includes(value) ? value : "all";
}

function normalizeMapSettings(settings = {}, legacyShowVegetation = true) {
  const source = settings && typeof settings === "object" ? settings : {};
  const legacyStructures = source.showStructures !== false;
  const siteVisibility = normalizeSiteFeatureVisibility(source, legacyStructures);
  const showVegetation = source.showVegetation === undefined
    ? legacyShowVegetation !== false
    : source.showVegetation !== false;
  return {
    showImagery: source.showImagery !== false,
    showReferenceOverlay: source.showReferenceOverlay === true,
    referenceOverlayOpacity: clamp(Number(source.referenceOverlayOpacity) || 0.45, 0, 1),
    showParcel: source.showParcel !== false,
    // `showStructures` remains in saved state as the backward-compatible
    // master flag. New plans can independently expose the site systems below.
    ...siteVisibility,
    showVegetation,
    showPlantings: source.showPlantings !== false,
    bedVisibility: normalizeBedVisibility(source.bedVisibility)
  };
}

function mapVisibleBeds(state) {
  const visibility = normalizeBedVisibility(state.mapSettings?.bedVisibility);
  if (visibility === "none") return [];
  if (visibility === "active") return state.beds.filter((bed) => bed.id === state.activeBedId);
  return state.beds;
}

function visibleSiteFeatures(state) {
  return filterVisibleSiteFeatures(state.structures || [], state.mapSettings);
}

function normalizeLayouts(layouts, options = {}) {
  return layouts
    .filter((layout) => layout?.id && layout?.name)
    .map((layout) => {
      const gardenId = layout.gardenId || layout.activeParcelId || layout.workspace?.id || layout.property?.id || null;
      return {
        ...layout,
        gardenId,
        viewMode: normalizeViewMode(layout.viewMode),
        viewPresentation: normalizeViewPresentation(layout.viewPresentation),
        activeParcelId: layout.activeParcelId || gardenId,
        parcels: Array.isArray(layout.parcels) && layout.parcels.length ? normalizeParcelWorkspaces(layout.parcels, null) : [],
        workspace: layout.workspace ? normalizeParcelWorkspace(layout.workspace) : undefined,
        property: layout.property ? sanitizePropertyContext(layout.property) : undefined,
        structures: normalizeStructures(layout.structures || [], options),
        vegetation: normalizeVegetation(layout.vegetation || []),
        selectedStructureId: layout.selectedStructureId || null,
        selectedVegetationId: layout.selectedVegetationId || null,
        parcelBufferInches: layout.parcelBufferInches || 1800,
        parcelViewport: normalizeParcelViewport({...layout, property: layout.property || PROPERTY_CONTEXT}, layout.parcelViewport),
        viewBearing: normalizeViewBearing(layout.viewBearing),
        viewPitch: normalizeViewPitch(layout.viewPitch),
        showVegetation: layout.showVegetation !== false,
        vegetationOpacity: layout.vegetationOpacity ?? 0.62,
        mapSettings: normalizeMapSettings(layout.mapSettings, layout.showVegetation)
      };
    });
}

function normalizeBeds(savedBeds, legacyBed, options = {}) {
  const includeDefaults = options.includeDefaults !== false;
  const defaults = includeDefaults ? structuredCloneCompat(DEFAULT_BEDS) : [];
  const byId = new Map(includeDefaults ? defaults.map((bed) => [bed.id, bed]) : []);
  const normalizedIds = new Set();
  if (Array.isArray(savedBeds)) {
    for (const bed of savedBeds) {
      if (!bed?.id) continue;
      byId.set(bed.id, normalizeBed({...byId.get(bed.id), ...bed}));
      normalizedIds.add(bed.id);
    }
  } else if (legacyBed) {
    byId.set(DEFAULT_ACTIVE_BED_ID, normalizeBed({...byId.get(DEFAULT_ACTIVE_BED_ID), ...legacyBed}));
    normalizedIds.add(DEFAULT_ACTIVE_BED_ID);
  }
  // Supplied records are already normalized, including repeated-ID merges.
  // Only untouched defaults still need normalization and detached provenance.
  const beds = [...byId].map(([id, bed]) => normalizedIds.has(id) ? bed : normalizeBed(bed));
  return beds.length ? beds : (includeDefaults ? defaults.map((bed) => normalizeBed(bed)) : []);
}

function normalizeBed(bed) {
  const polygon = Array.isArray(bed.polygon)
    ? bed.polygon
        .filter((point) => Array.isArray(point) && point.length >= 2)
        .map((point) => [Number(point[0]) || 0, Number(point[1]) || 0])
    : null;
  const width = Math.max(24, Number(bed.width) || 96);
  const height = Math.max(18, Number(bed.height) || 48);
  const safeMarginMax = Math.max(1, Math.min(width, height) / 2 - 1);
  return {
    id: bed.id || uniqueStaticId("bed"),
    name: bed.name || "Garden bed",
    zone: bed.zone || "Garden",
    x: Number(bed.x) || 0,
    y: Number(bed.y) || 0,
    width,
    height,
    rotation: Number(bed.rotation) || 0,
    safeMargin: clamp(Number(bed.safeMargin) || 0, 0, safeMarginMax),
    grid: Math.max(3, Number(bed.grid) || 6),
    crowding: clamp(Number(bed.crowding) || 1, 0.72, 1.35),
    showSpacing: bed.showSpacing !== false,
    notes: bed.notes || "",
    ...normalizedFeatureProvenance(bed),
    ...(polygon?.length >= 3 ? {polygon} : {})
  };
}

function normalizeStructures(structures, options = {}) {
  if (!Array.isArray(structures)) return [];
  return structures
    .filter((structure) => structure?.id && (!options.dropDemo || !DEMO_STRUCTURE_IDS.has(structure.id)))
    .map((structure) => normalizeStructure(structure));
}

function normalizeStructure(structure = {}) {
  const type = normalizeSiteFeatureType(structure.type);
  const localGeometry = structureLocalGeometry(structure);
  const geometryBounds = localGeometry
    ? boundsFromPoints(featureEnvelopePoints({localGeometry}), 0)
    : null;
  return {
    id: structure.id || uniqueStaticId("structure"),
    name: structure.name || siteFeatureDefinition(type).label,
    // Unknown imported slugs stay intact. Treating every new GIS class as a
    // generic building would lose precisely the utility/barrier information
    // estate plans need as this catalog grows.
    type,
    x: Number.isFinite(Number(structure.x))
      ? Number(structure.x)
      : geometryBounds ? geometryBounds.x + geometryBounds.width / 2 : 0,
    y: Number.isFinite(Number(structure.y))
      ? Number(structure.y)
      : geometryBounds ? geometryBounds.y + geometryBounds.height / 2 : 0,
    width: clamp(Number(structure.width) || geometryBounds?.width || 96, 12, MAX_SITE_FEATURE_SPAN_INCHES),
    height: clamp(Number(structure.height) || geometryBounds?.height || 48, 12, MAX_SITE_FEATURE_SPAN_INCHES),
    rotation: Number(structure.rotation) || 0,
    confidence: ["high", "medium", "low"].includes(structure.confidence) ? structure.confidence : "low",
    source: structure.source || "Manual structure overlay",
    notes: structure.notes || "",
    ...normalizedFeatureProvenance(structure),
    ...(localGeometry
      ? {localGeometry: structuredCloneCompat(localGeometry)}
      : {})
  };
}

// These fields distinguish an editable interpretation from surveyed source
// geometry. Keep them intact through browser storage, garden switching, and
// layout import/export; otherwise a schematic-derived polygon can silently
// become indistinguishable from a measured feature after the first render.
function normalizedFeatureProvenance(feature = {}) {
  const provenance = {};
  // Keep this list local rather than in a later module-level `const`: beds are
  // normalized while the module's default state is being constructed, before
  // declarations in this portion of the file have initialized.
  for (const field of [
    "geometryBasis",
    "surveyStatus",
    "boundaryPolicy",
    "featureStatus",
    "taxonStatus",
    "identificationStatus",
    "collection",
    "observationType",
    "geometryRepresentation",
    "crownWidthFeet",
    "crownDepthFeet",
    "crownDiameterFeet",
    "crownRadiusEastWestFeet",
    "crownRadiusNorthSouthFeet",
    "crownMeasurementMethod",
    "crownConfidence",
    "heightEstimateFeet",
    "heightEstimateRangeFeet",
    "heightEstimateMethod",
    "heightConfidence",
    "sourcePixel",
    "sourceMapNumber",
    "digitizationRasterId",
    "imageryId",
    "imageryZoom",
    "imageryTileOrigin",
    "networkId",
    "topologyNodeIds",
    "corridorWidthFeet",
    "parcelId",
    "parentId",
    "sectionId",
    "subplotId",
    // Stable curation controls supersede the overloaded legacy footprint id:
    // the grid cell identifies the mapped unit, center control ties it to the
    // registered imagery check, and boundary confidence states evidentiary fit.
    "gridCellId",
    "centerControlId",
    "boundaryConfidence",
    // Retained only so older browser saves and exports remain lossless.
    "observedFootprintId",
    "snappedToFeatureId",
    "plantingAssignment",
    "cropTaxon",
    "sourceFeatureId",
    "provenance",
    "canonicalGeometry",
    "geometryEdit"
  ]) {
    if (feature[field] !== undefined && feature[field] !== null) {
      provenance[field] = structuredCloneCompat(feature[field]);
    }
  }
  if (Array.isArray(feature.sourceReferences)) {
    provenance.sourceReferences = structuredCloneCompat(feature.sourceReferences);
  }
  return provenance;
}

function featureSourceReferences(feature) {
  return Array.isArray(feature?.sourceReferences)
    ? feature.sourceReferences.filter((reference) => reference && typeof reference === "object")
    : [];
}

function primaryFeatureSourceReference(feature) {
  return featureSourceReferences(feature)[0] || null;
}

function formatFeatureSourceReference(reference) {
  if (!reference) return "";
  const number = Number(reference.mapNumber);
  const locator = Number.isFinite(number)
    ? `Visitor map #${number}`
    : reference.locator || reference.sourceId || "Source reference";
  return [locator, reference.label].filter(Boolean).join(" · ");
}

function normalizeVegetation(vegetation = []) {
  if (!Array.isArray(vegetation)) return [];
  return vegetation
    .filter((item) => item?.id)
    .map((item) => {
      const kind = ["tree", "canopy", "forest", "shrub"].includes(item.kind) ? item.kind : "canopy";
      const isTreePoint = kind === "tree" || item.geometryRepresentation === "point";
      const point = item.localGeometry?.type === "Point"
        && Array.isArray(item.localGeometry.coordinates)
        && item.localGeometry.coordinates.slice(0, 2).every((value) => Number.isFinite(Number(value)))
        ? item.localGeometry.coordinates.slice(0, 2).map(Number)
        : null;
      const x = Number.isFinite(Number(item.x)) ? Number(item.x) : point?.[0] || 0;
      const y = Number.isFinite(Number(item.y)) ? Number(item.y) : point?.[1] || 0;
      const axes = isTreePoint ? treeCrownAxesInches(item) : null;
      const normalized = {
        id: item.id || uniqueStaticId("veg"),
        // Aerial observations establish that a tree exists, not what species
        // it is. Taxonomic identity remains null until a cited record or a
        // deliberate user edit supplies one.
        plantId: item.plantId || null,
        name: item.name || (isTreePoint ? "Unidentified mature tree" : "Vegetation cover"),
        kind,
        canopyClass: ["unknown", "deciduous", "evergreen", "mixed", "shrub"].includes(item.canopyClass)
          ? item.canopyClass
          : "unknown",
        x,
        y,
        // A tree's width/depth are derived from crown-axis attributes. Broad
        // contextual cover remains an editable area and keeps its own extent.
        width: clamp(Number(axes?.width ?? item.width) || 360, 36, MAX_SITE_FEATURE_SPAN_INCHES),
        height: clamp(Number(axes?.height ?? item.height) || 300, 36, MAX_SITE_FEATURE_SPAN_INCHES),
        rotation: Number(item.rotation) || 0,
        confidence: ["high", "medium", "low"].includes(item.confidence) ? item.confidence : "medium",
        source: item.source || "Manual vegetation overlay",
        notes: item.notes || "",
        ...normalizedFeatureProvenance(item)
      };
      if (isTreePoint) {
        normalized.kind = "tree";
        normalized.geometryRepresentation = "point";
        normalized.localGeometry = {type: "Point", coordinates: [x, y]};
        normalized.absoluteLocalPoint = [x, y];
      } else if (item.localGeometry) {
        normalized.localGeometry = structuredCloneCompat(item.localGeometry);
      }
      return normalized;
    });
}

function syncTreePointGeometry(vegetation) {
  if (!vegetation || (vegetation.kind !== "tree" && vegetation.geometryRepresentation !== "point")) return;
  vegetation.kind = "tree";
  vegetation.geometryRepresentation = "point";
  vegetation.localGeometry = {type: "Point", coordinates: [Number(vegetation.x) || 0, Number(vegetation.y) || 0]};
  vegetation.absoluteLocalPoint = [...vegetation.localGeometry.coordinates];
}

function vegetationCanopyEllipse(vegetation) {
  return vegetation?.kind === "tree" || vegetation?.geometryRepresentation === "point"
    ? derivedTreeCanopyEllipse(vegetation)
    : {
        cx: Number(vegetation?.x) || 0,
        cy: Number(vegetation?.y) || 0,
        rx: Math.max(18, Number(vegetation?.width) || 360) / 2,
        ry: Math.max(18, Number(vegetation?.height) || 300) / 2,
        rotationDegrees: Number(vegetation?.rotation) || 0,
        derivedFrom: "mapped vegetation-area extent"
      };
}

function normalizePlacement(placement = {}, beds = []) {
  const absoluteLocalPoint = Array.isArray(placement.absoluteLocalPoint)
    && placement.absoluteLocalPoint.length >= 2
    && placement.absoluteLocalPoint.slice(0, 2).every((value) => Number.isFinite(Number(value)))
    ? placement.absoluteLocalPoint.slice(0, 2).map(Number)
    : null;
  const requestedBedId = placement.bedId || null;
  const bedId = beds.some((bed) => bed.id === requestedBedId) ? requestedBedId : null;
  return {
    ...placement,
    id: placement.id || uniqueStaticId("placement"),
    name: placement.name || (placement.plantId ? "Planting" : "Unidentified plant observation"),
    plantId: placement.plantId || null,
    bedId,
    x: Number(placement.x) || 0,
    y: Number(placement.y) || 0,
    ...(absoluteLocalPoint ? {absoluteLocalPoint} : {})
  };
}

function bedControlSnapshot(bed) {
  return {
    width: bed.width,
    height: bed.height,
    safeMargin: bed.safeMargin,
    grid: bed.grid,
    crowding: bed.crowding,
    showSpacing: bed.showSpacing !== false
  };
}

function uniqueStaticId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function mergePlants(defaultPlants, savedPlants) {
  const map = new Map(defaultPlants.map((plant) => [plant.id, normalizePlant(structuredCloneCompat(plant))]));
  for (const plant of savedPlants) {
    if (plant?.id && plant?.name) map.set(plant.id, normalizePlant({...map.get(plant.id), ...plant}));
  }
  return [...map.values()];
}

function normalizePlant(plant) {
  const defaults = {
    habit: plant.group === "Root" ? "frond" : "mounded",
    leafShape: plant.group === "Root" ? "filament" : "oval",
    leafCount: Math.max(12, Math.round((plant.matureDiameter || 18) * 1.1)),
    density: 1,
    layers: 3,
    leafLength: Math.max(3, (plant.matureDiameter || 18) * 0.28),
    leafWidth: Math.max(1.2, (plant.matureDiameter || 18) * 0.14),
    heightProfile: "mounded"
  };
  return {...plant, visual: {...defaults, ...(plant.visual || {})}};
}

// Panel controls disappear when closed; return keyboard focus to the visible rail.
function closePlannerPanel(refs, state, renderAll, panel) {
  if (panel === "tools") state.toolDrawerOpen = false;
  else state.inspectorOpen = false;
  renderAll();
  const tool = refs.toolButtons.find(button => button.dataset.tool === state.activeTool);
  (tool || refs.toolButtons[0]).focus({preventScroll: true});
}

function setupControls(refs, state, renderAll, renderSharedViews = renderAll) {
  refs.root.querySelector('[data-role="structure-search"]').addEventListener('input',()=>renderStructureList(refs,state,renderAll));
  refs.root.querySelector('[data-role="vegetation-search"]').addEventListener('input',()=>renderVegetationList(refs,state,renderAll));
  for (const slider of refs.root.querySelectorAll('[data-camera]')) {
    slider.addEventListener('input', () => {
      setPlanningOrientation(state, slider.dataset.camera === 'bearing' ? Number(slider.value) : planningBearing(state), slider.dataset.camera === 'pitch' ? Number(slider.value) : planningPitch(state));
      renderSharedViews();
    });
    slider.addEventListener('change', renderAll);
  }
  refs.root.addEventListener('keydown', event => {
    const panel=event.target.closest?.('.camera-panel[open]');
    if(event.key==='Escape' && panel){event.preventDefault();event.stopImmediatePropagation();panel.open=false;panel.querySelector('summary').focus();}
  },true);
  // Inspection is view-only: fading overlays neither changes geometry nor
  // reloads imagery. Fully hidden features must not intercept map clicks.
  refs.featureOpacity.addEventListener("input", () => {
    const opacity = Number(refs.featureOpacity.value);
    d3.select(refs.parcelSvg).selectAll(".map-feature-overlay")
      .attr("opacity", opacity).attr("pointer-events", opacity === 0 ? "none" : null);
  });
  refs.layoutSelect.addEventListener("change", () => {
    const hasSavedVersion = refs.layoutSelect.value !== "__current__";
    refs.actions.loadLayout.disabled = !hasSavedVersion;
    refs.actions.deleteLayout.disabled = !hasSavedVersion;
  });

  refs.root.querySelector('[data-action="toggle-edit-lock"]').addEventListener("click", () => {
    if(explicitEditSessions.has(state)) {explicitEditSessions.delete(state);state.drawMode=null;state.draftBedPoints=[];}
    else beginExplicitEditing(state);
    renderAll();
  });
  for (const button of refs.toolButtons) {
    button.addEventListener("click", () => {
      explicitEditSessions.delete(state);
      const tool = button.dataset.tool;
      if (tool === "select") {
        explicitEditSessions.delete(state); state.activeTool = "select";
        state.toolDrawerOpen = false;
        state.inspectorOpen = false;
      } else {
        const nextTool = normalizeActiveTool(tool);
        const narrowScreen = refs.root.ownerDocument.defaultView.matchMedia("(max-width: 920px)").matches;
        // Mobile uses one bottom sheet: a tool tap must reveal its drawer even
        // when the inspector currently covers an already-open tool drawer.
        state.toolDrawerOpen = (narrowScreen && state.inspectorOpen)
          || !(state.toolDrawerOpen && state.activeTool === nextTool);
        if (narrowScreen && state.toolDrawerOpen) state.inspectorOpen = false;
        state.activeTool = nextTool;
      }
      if (state.activeTool !== "beds") {
        state.drawMode = null;
        state.draftBedPoints = [];
      }
      renderAll();
    });
  }

  for(const button of refs.root.querySelectorAll('[data-planting]'))button.addEventListener('click',()=>{
    state.pendingPlantingKind=button.dataset.planting;state.drawMode='planting-point';state.viewMode='garden';state.viewPresentation='map';state.toolDrawerOpen=false;state.inspectorOpen=false;renderAll();refs.parcelSvg.focus({preventScroll:true});
  });
  for (const button of refs.presentationButtons) {
    button.addEventListener("click", () => {
      state.walkCamera = null;
      state.viewPresentation = normalizeViewPresentation(button.dataset.presentation);
      if (["3d", "split"].includes(state.viewPresentation) && planningPitch(state) < 55) {
        setPlanningOrientation(state, planningBearing(state) || 30, 60);
      }
      renderAll();
    });
  }

  refs.root.querySelector('[data-role="camera-angle"]').addEventListener("change", event => {
    if(event.target.value==='walk'){
      refs.root.querySelector('button[data-workspace="walk"]').click();
      return;
    }else{state.walkCamera=null;setPlanningOrientation(state, planningBearing(state), Number(event.target.value));}
    renderAll();
  });
  const inspectorId = `inspector-${crypto.randomUUID()}`;
  for (const panel of refs.inspectorPanels) {
    panel.id = `${inspectorId}-${panel.dataset.inspectorPanel}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `${inspectorId}-tab-${panel.dataset.inspectorPanel === "diagnostics" ? "diagnostics" : "edit"}`);
  }
  for (const button of refs.inspectorTabs) {
    button.id = `${inspectorId}-tab-${button.dataset.inspectorTab}`;
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      const tabs = refs.inspectorTabs;
      const index = tabs.indexOf(button);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    });
    button.addEventListener("click", () => {
      state.inspectorTab = normalizeInspectorTab(button.dataset.inspectorTab);
      state.inspectorOpen = true;
      renderAll();
    });
  }

  refs.actions.closeToolDrawer.addEventListener("click", () => {
    closePlannerPanel(refs, state, renderAll, "tools");
  });

  refs.actions.closeInspector.addEventListener("click", () => {
    closePlannerPanel(refs, state, renderAll, "inspector");
  });

  const changeScope = scope => {
    explicitEditSessions.delete(state);
    refs.referenceMapInspector?.cancelPick();
    siteGeometryDrafts.delete(state);
    state.drawMode = null;
    state.inspectorOpen = false;
    if (scope === "attributes") {
      state.activeTool = "structures";
      state.viewMode = "garden";
      state.toolDrawerOpen = true;
      state.viewPresentation = "map";
    } else {
      state.viewMode = scope;
      state.activeTool = "beds";
      state.toolDrawerOpen = scope === "bed";
      if (scope === "bed" && state.viewPresentation === "map") state.viewPresentation = "2d";
    }
    if (scope === "bed") openPlantingWorkspace(state);
    renderAll();
  };
  refs.root.querySelectorAll("[data-workspace]").forEach(button => button.addEventListener("click", () => {
    explicitEditSessions.delete(state);
    const bed = activeBed(state);
    const fromBed = state.viewMode === "bed";
    state.viewMode = "garden"; state.activeTool = "select";
    state.drawMode = null; state.toolDrawerOpen = false; state.inspectorOpen = false;
    if (button.dataset.workspace === "walk") {
      const bounds = parcelViewportBounds(state);
      state.viewPresentation = "3d";
      const previous=walkingReturns.get(state);
      if(fromBed && previous?.gardenId===state.activeParcelId){state.walkCamera={...previous.walk};setPlanningOrientation(state,previous.bearing,60);}
      else if(bed){const angle=(bed.rotation||0)*Math.PI/180,distance=bed.height/2+72;state.walkCamera={x:bed.x-Math.sin(angle)*distance,y:bed.y+Math.cos(angle)*distance,look:-12};setPlanningOrientation(state,bed.rotation||0,60);}
      else state.walkCamera={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2,look:0};
    } else {
      state.walkCamera = null;
      if (state.viewPresentation === "3d") setPlanningOrientation(state, planningBearing(state), 60);
    }
    renderAll();
    if (state.walkCamera) refs.threeHost.querySelector("canvas")?.focus({preventScroll:true});
  }));
  refs.root.querySelectorAll("[data-scope]").forEach(button => {
    button.addEventListener("click", () => changeScope(button.dataset.scope));
  });
  refs.actions.openBedTool.addEventListener("click", () => changeScope("bed"));

  for (const input of refs.mapSettingInputs) {
    input.addEventListener("input", () => {
      const key = input.dataset.mapSetting;
      if (key === "bedVisibility") {
        state.mapSettings.bedVisibility = normalizeBedVisibility(input.value);
      } else if (key === "referenceOverlayOpacity") {
        state.mapSettings.referenceOverlayOpacity = clamp(Number(input.value), 0, 1);
      } else if (key === "showSourceEvidence") {
        setGardenSourceEvidenceVisibility(state, input.checked);
      } else {
        state.mapSettings[key] = input.checked;
        if (["showBuildings", "showCirculation", "showBarriers", "showUtilities", "showWater", "showLandscapeFeatures"].includes(key) && input.checked) {
          state.mapSettings.showStructures = true;
        }
      }
      state.showVegetation = state.mapSettings.showVegetation;
      renderAll();
    });
  }

  for (const [key, input] of Object.entries(refs.controls)) {
    input.addEventListener("input", () => {
      if (key === "activeGarden") {
        switchActiveParcelWorkspace(state, input.value);
      } else if (key === "viewMode") {
        state.viewMode = normalizeViewMode(input.value);
      } else if (key === "basemap") {
        state.basemapId = normalizeBasemapId(state, input.value);
        state.property.imagery.activeBasemapId = state.basemapId;
      }
      state.bed = bedControlSnapshot(activeBed(state));
      renderAll();
    });
  }
}

function setupActions(refs, state, renderAll) {
  refs.actions.addBed.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "bed")) return;
    const base = activeBed(state);
    const index = state.beds.length + 1;
    const bed = normalizeBed({
      ...base,
      id: uniqueBedId(state),
      name: `Garden bed ${index}`,
      x: base.x + base.width + 36,
      y: base.y + 18,
      notes: "New bed"
    });
    state.beds.push(bed);
    state.activeBedId = bed.id;
    state.selectedPlacementId = null;
    state.selectedStructureId = null;
    state.selectedVegetationId = null;
    openInspector(state, "bed");
    renderAll();
  });

  refs.actions.addStructure.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "structure")) return;
    addStructure(state);
    openInspector(state, "structure");
    renderAll();
  });

  refs.root.querySelector('[data-action="cancel-tree"]').addEventListener("click", () => {
    state.drawMode = null;
    renderAll();
    refs.toolButtons.find(button => button.dataset.tool === "vegetation").focus();
  });
  refs.root.querySelector('[data-action="mark-tree"]').addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "vegetation")) return;
    state.viewPresentation = "map";
    state.drawMode = "tree-point";
    state.inspectorOpen = false;
    state.toolDrawerOpen = false;
    renderAll();
    refs.parcelSvg.focus({preventScroll: true});
  });

  refs.actions.addVegetation.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "vegetation")) return;
    addVegetation(state);
    openInspector(state, "vegetation");
    renderAll();
  });

  refs.actions.drawBed.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "bed")) return;
    state.draftBedPoints = [];
    state.drawMode = "bed-polygon";
    state.viewPresentation = "map";
    state.inspectorOpen = false;
    state.toolDrawerOpen = false;
    renderAll();
    refs.parcelSvg.focus({preventScroll: true});
  });

  refs.actions.finishBed.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "bed")) return;
    if (finishDraftBedPolygon(state)) {
      openInspector(state, "bed");
      renderAll();
    }
  });

  refs.root.querySelector('[data-action="finish-map-bed"]').addEventListener("click", () => refs.actions.finishBed.click());
  refs.root.querySelector('[data-action="cancel-map-bed"]').addEventListener("click", () => {
    refs.actions.cancelDraw.click();
    refs.toolButtons.find(button => button.dataset.tool === "beds").focus();
  });

  refs.actions.cancelDraw.addEventListener("click", () => {
    state.drawMode = null;
    state.draftBedPoints = [];
    renderAll();
  });

  for (const button of refs.viewNavigationButtons) {
    button.addEventListener("click", () => {
      const action = button.dataset.viewNav;
      if(action==='close-camera'){const panel=button.closest('details');panel.open=false;panel.querySelector('summary').focus();return;}
      if(action==='north-up'){state.walkCamera=null;setPlanningOrientation(state,0,0);renderAll();return;}
      if(action.startsWith('walk-')){moveWalkCamera(state,action.slice(5));renderAll();return;}
      if(action==='capture'){
        const canvas=refs.root.querySelector('.three-canvas'),status=button.closest('details').querySelector('[data-role="capture-status"]');
        try{if(!canvas)throw Error('3D is unavailable');canvas.toBlob(blob=>{
          if(!blob){status.textContent='Image capture unavailable.';return;}
          const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='garden-view.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='3D image downloaded.';
        },'image/png');}catch{status.textContent='Image capture unavailable in this browser.';}return;
      }
      if(state.walkCamera && ['zoom-in','zoom-out'].includes(action)){moveWalkCamera(state,action==='zoom-in'?'forward':'back');renderAll();return;}
      if(action==='pan'||action.startsWith('fit'))state.walkCamera=null;
      if (action === "pan") {
        explicitEditSessions.delete(state); state.activeTool = "select";
        state.toolDrawerOpen = false;
        state.inspectorOpen = false;
        state.drawMode = null;
        state.draftBedPoints = [];
        renderAll();
        return;
      }
      if (state.viewMode === "bed" && !button.closest(".parcel-map-view")) {
        if (action === "zoom-in") zoomPlanningViewport(state,0.78);
        if (action === "zoom-out") zoomPlanningViewport(state,1.28);
        if (action === "reset-bearing") activeBedCamera(state).bearing = 0;
        if (["fit-plan","fit-selection","fit"].includes(action)) activeBedCamera(state).viewport = defaultBedViewport(activeBed(state));
        if (action === "fit-parcel") {state.viewMode="garden";state.parcelViewport=parcelViewBounds(state);}
        renderAll(); return;
      }
      if (action === "zoom-in") zoomParcelViewport(state, 0.78);
      if (action === "zoom-out") zoomParcelViewport(state, 1.28);
      if (action === "reset-bearing") state.viewBearing = DEFAULT_VIEW_BEARING;
      if (action === "fit" || action === "fit-parcel") state.parcelViewport = parcelViewBounds(state);
      if (action === "fit-plan") fitParcelViewport(state, mappedPlanBounds(state), 0.12);
      if (action === "fit-selection") fitParcelViewport(state, selectedFeatureBounds(state), 0.42);
      renderAll();
    });
  }

  refs.actions.addSelected.addEventListener("click", () => {
    if (state.viewMode !== "bed" && !plannerCanEditFeature(state, "placement")) return;
    addPlacementAtBestOpenPoint(state);
    renderAll();
  });

  refs.actions.addSelectedFlower.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "placement")) return;
    if (selectedPlant(state)?.group !== "Flower") return;
    addPlacementAtBestOpenPoint(state);
    openInspector(state, "placement");
    renderAll();
  });

  refs.actions.fillBed.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "placement")) return;
    const plant = selectedPlant(state);
    if (!plant) return;
    const bed = activeBed(state);
    const positions = bedFillPositions(bed, plant);
    const status = refs.root.querySelector('[data-role="fill-bed-status"]');
    if (!positions.length) {
      status.hidden = false;
      status.textContent = `${plant.name} does not fit this bed at the current spacing and root margin. Existing plantings are unchanged.`;
      return;
    }
    const existing = placementsForBed(state, bed.id).length;
    if (existing && !window.confirm(`Replace ${existing} existing planting${existing === 1 ? "" : "s"} in “${bed.name}” with ${positions.length} ${plant.name} planting${positions.length === 1 ? "" : "s"}? Their dates, health records and notes will be removed.`)) return;
    fillBedWithSelectedPlant(state, positions);
    if (state.selectedPlacementId) openInspector(state, "placement");
    renderAll();
  });

  refs.root.querySelector('[data-action="populate-empty-beds"]').addEventListener("click", () => {
    const additions=proposedBedPlantings(state.beds,state.placements,state.plants);
    state.placements.push(...additions);renderAll();
    refs.root.querySelector('[data-role="snapshot-status"]').textContent=`Added ${additions.length} proposed plantings to empty beds. Existing plantings were preserved.`;
  });
  refs.root.querySelector('[data-action="seasonal-example"]').addEventListener("click", () => {
    const month = refs.root.querySelector('[data-role="snapshot-month"]').value;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return;
    const season=Number(month.slice(5)), bounds=parcelViewportBounds(state), cx=bounds.x+bounds.width/2,cy=bounds.y+bounds.height/2;
    const ids=season<3||season>11?[]:season<6||season>8?["lettuce","kale","carrot"]:["tomato","basil","pepper"];
    const flowers=state.plants.filter(p=>/\b(zinnia|marigold|aster)\b/i.test(p.name));
    const choices=[state.plants.find(p=>p.id===ids[0]),state.plants.find(p=>p.id===ids[1]),season>4&&season<11?flowers[0]:null];
    let created=0;
    for(let i=0;i<3;i++){
      const id=`${state.activeParcelId}-seasonal-${month}-${i}`;
      if(state.beds.some(b=>b.id===id))continue;
      const bed=normalizeBed({id,name:`${month} · ${i===2?"Flower border":"Kitchen bed "+(i+1)} · proposed`,zone:"Seasonal design study",x:cx+(i-1)*84,y:cy,width:48,height:96,rotation:0,notes:"Illustrative placement at view center. Move to a suitable area; check light, access and local planting dates. Not an observed garden bed.",safeMargin:6,grid:6});
      state.beds.push(bed);const plant=choices[i];
      if(plant)for(const point of bedFillPositions(bed,plant).slice(0,32))state.placements.push({id:uniquePlacementId(state),bedId:id,plantId:plant.id,...point,planted:`${month}-15`,health:"planned",notes:"Seasonal example, not field observation",rotation:0});
      state.activeBedId=id;created++;
    }
    state.activeTool="beds";state.viewMode="garden";renderAll();
    refs.root.querySelector('[data-role="snapshot-status"]').textContent=created?`Added ${created} proposed beds. Adjust their location and dates before using the plan.`:"Examples for this month already exist; your edits were preserved.";
  });
  refs.root.querySelector('[data-action="bed-snapshot"]').addEventListener("click", () => {
    const bed=activeBed(state),month=refs.root.querySelector('[data-role="snapshot-month"]').value;
    if(!bed?.id||!state.beds.some(b=>b.id===bed.id)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return;
    const previous=state.layouts.find(l=>l.bedSnapshot?.bedId===bed.id&&l.gardenId===state.activeParcelId);
    const count=placementsForBed(state,bed.id).length;
    saveNamedLayout(state,`${month} · ${bed.name} · ${new Date().toISOString()}`);
    state.layouts[0].bedSnapshot={bedId:bed.id,month,plantCount:count};
    renderAll();
    refs.root.querySelector('[data-role="snapshot-status"]').textContent=previous?`Saved ${month}: ${count} plantings; ${previous.bedSnapshot.month}: ${previous.bedSnapshot.plantCount}. Saved versions retain each full plan for review and export.`:`Saved ${month}: ${count} plantings. Save another month to compare. Snapshots use the existing 48-version limit; export a backup for long-term history.`;
  });

  refs.actions.saveLayout.addEventListener("click", () => {
    const gardenName = activeParcelWorkspace(state)?.name || state.property?.name || "Garden";
    const name = window.prompt("Saved version name", `${gardenName} · ${new Date().toLocaleDateString()}`);
    if (!name) return;
    saveNamedLayout(state, name.trim());
    renderAll();
  });

  refs.actions.loadLayout.addEventListener("click", () => {
    const layout = state.layouts.find(item => item.id === refs.layoutSelect.value);
    if (!layout || !window.confirm(`Load saved version “${layout.name}”? This replaces that garden’s working plan. Save a version first to keep its current edits.`)) return;
    loadNamedLayout(state, refs.layoutSelect.value);
    renderAll();
  });

  refs.actions.deleteLayout.addEventListener("click", () => {
    const layout = state.layouts.find(item => item.id === refs.layoutSelect.value);
    if (!layout || !window.confirm(`Delete saved version “${layout.name}” from this browser? The working plan will remain.`)) return;
    deleteNamedLayout(state, refs.layoutSelect.value);
    renderAll();
  });

  refs.actions.createGarden.addEventListener("click", () => {
    const name = window.prompt("New garden name", "Untitled garden");
    if (!name?.trim()) return;
    createBlankGardenWorkspace(state, name.trim());
    renderAll();
  });

  refs.actions.duplicateGarden.addEventListener("click", () => {
    const sourceName = activeParcelWorkspace(state)?.name || "Garden";
    const name = window.prompt("Duplicate garden as", `${sourceName} copy`);
    if (!name?.trim()) return;
    duplicateActiveGardenWorkspace(state, name.trim());
    renderAll();
  });

  refs.actions.renameGarden.addEventListener("click", () => {
    const currentName = activeParcelWorkspace(state)?.name || state.property?.name || "Garden";
    const name = window.prompt("Garden name", currentName);
    if (!name?.trim()) return;
    renameActiveParcelWorkspace(state, name.trim());
    renderAll();
  });

  refs.actions.deleteGarden.addEventListener("click", () => {
    const currentName = activeParcelWorkspace(state)?.name || "this garden";
    if (!window.confirm(`Remove ${currentName} from this browser? Saved versions for it will also be removed.`)) return;
    removeActiveParcelWorkspace(state, {removeLayouts: true});
    renderAll();
  });

  refs.actions.resetDemo.addEventListener("click", () => {
    const reference = gardenReferenceById(state.activeParcelId);
    if (!reference) return;
    if (!window.confirm(`Restore the ${reference.name} starter and discard its current edits?`)) return;
    restoreActiveReferenceGarden(state);
    renderAll();
  });

  refs.actions.exportGeoJson.addEventListener("click", () => {
    const dataset = activeGardenSpatialDataset(state);
    if (!dataset) return;
    const name = activeParcelWorkspace(state)?.name || state.property?.name || "Garden plan";
    downloadPlannerText(
      gardenToGeoJsonText(dataset, {name}),
      "application/geo+json;charset=utf-8",
      spatialDownloadName(state, "geojson")
    );
  });

  refs.actions.exportKml.addEventListener("click", () => {
    const dataset = activeGardenSpatialDataset(state);
    if (!dataset) return;
    const name = activeParcelWorkspace(state)?.name || state.property?.name || "Garden plan";
    downloadPlannerText(
      gardenToKml(dataset, {name, includeDerivedTreeCrowns: true}),
      "application/vnd.google-earth.kml+xml;charset=utf-8",
      spatialDownloadName(state, "kml")
    );
  });

  refs.actions.importSpatial.addEventListener("click", () => refs.spatialImportInput.click());

  refs.spatialImportInput.addEventListener("change", async () => {
    const file = refs.spatialImportInput.files?.[0];
    if (!file) return;
    let stage;
    if (file.size > MAX_SPATIAL_IMPORT_BYTES) {
      stage = failedSpatialImportStage(
        "FILE_TOO_LARGE",
        `File is ${(file.size / 1024 / 1024).toFixed(1)} MB; review imports are limited to ${MAX_SPATIAL_IMPORT_BYTES / 1024 / 1024} MB.`,
        file.name.toLowerCase().endsWith(".kml") ? "KML" : "GeoJSON"
      );
    } else {
      try {
        stage = stageSpatialImportFile(file, await file.text());
      } catch (error) {
        stage = failedSpatialImportStage("FILE_READ_FAILED", error?.message || "The spatial file could not be read.");
      }
    }
    setActiveSpatialImportReview(state, {fileName: file.name, stage});
    if (spatialImportDisplayCollection(activeSpatialImportReview(state))) {
      setGardenSourceEvidenceVisibility(state, true);
    }
    refs.spatialImportInput.value = "";
    renderAll();
  });

  refs.actions.clearSpatialImport.addEventListener("click", () => {
    setActiveSpatialImportReview(state, null);
    renderAll();
  });

  refs.actions.export.addEventListener("click", () => {
    syncActiveParcelWorkspace(state);
    const blob = new Blob([JSON.stringify(stateExportPayload(state), null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "garden-planner-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  refs.actions.clear.addEventListener("click", () => {
    if (!plannerCanEditFeature(state, "placement")) return;
    const bed = activeBed(state);
    const count = placementsForBed(state, bed.id).length;
    if (!count || !window.confirm(`Remove all ${count} planting${count === 1 ? "" : "s"} from “${bed.name}”, including their dates, health records and notes? Other beds will remain unchanged.`)) return;
    const activeId = bed.id;
    state.placements = state.placements.filter((placement) => placement.bedId !== activeId);
    syncSelectedPlacementToActiveBed(state);
    renderAll();
  });
}

function setupPlantForm(refs, state, renderAll) {
  refs.plantForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(refs.plantForm);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const seed = Math.floor(Math.random() * 1000) + 100;
    const color = d3.interpolateRainbow(((state.plants.length * 0.137) % 1));
    const plant = {
      id: uniquePlantId(state, slugify(name)),
      name,
      group: "Custom",
      matureDiameter: numberFromForm(form, "matureDiameter", 18),
      spacing: numberFromForm(form, "spacing", 18),
      height: numberFromForm(form, "height", 24),
      sun: "Needs observation",
      soil: String(form.get("soil") || "Loamy, compost amended"),
      waterStyle: String(form.get("waterStyle") || "Moderate watering"),
      waterCadence: String(form.get("waterCadence") || "Moderate cycles 2x weekly"),
      emitter: String(form.get("emitter") || "1 x 0.5 gph emitter"),
      zone: String(form.get("zone") || "A").trim().toUpperCase() || "A",
      gauge: "To size",
      color,
      leafColor: d3.color(color)?.darker(0.8).formatHex() || "#3f7d51",
      visual: {
        habit: "mounded",
        leafShape: "oval",
        leafCount: Math.max(12, Math.round(numberFromForm(form, "matureDiameter", 18) * 1.1)),
        density: 1,
        layers: 3,
        leafLength: Math.max(3, numberFromForm(form, "matureDiameter", 18) * 0.28),
        leafWidth: Math.max(1.2, numberFromForm(form, "matureDiameter", 18) * 0.14),
        heightProfile: "mounded"
      },
      seed
    };

    state.plants.push(plant);
    state.selectedPlantId = plant.id;
    openInspector(state, "plant");
    refs.plantForm.reset();
    refs.plantForm.elements.matureDiameter.value = plant.matureDiameter;
    refs.plantForm.elements.spacing.value = plant.spacing;
    refs.plantForm.elements.height.value = plant.height;
    refs.plantForm.elements.zone.value = "A";
    refs.plantForm.elements.waterCadence.value = "Moderate cycles 2x weekly";
    refs.plantForm.elements.soil.value = "Loamy, compost amended";
    refs.plantForm.elements.emitter.value = "1 x 0.5 gph emitter";
    renderAll();
  });
}

function setupSearch(refs, state, renderPlantListOnly) {
  refs.plantSearch.addEventListener("input", () => renderPlantListOnly(refs, state, () => {}));
}

function setupFlowerLibrary(refs, state, renderAll) {
  for (const input of [refs.flowerSearch, refs.flowerSeason, refs.flowerLight, refs.flowerMoisture]) {
    input.addEventListener("input", renderAll);
  }
}

function setupKeyboardShortcuts(refs, state, renderAll) {
  refs.root.tabIndex = -1;
  refs.root.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Escape" && siteGeometryDrafts.has(state)) {
      siteGeometryDrafts.delete(state);
      event.preventDefault();
      renderAll();
      return;
    }
    if (event.key === "Escape" && state.drawMode) {
      state.drawMode = null;
      state.draftBedPoints = [];
      event.preventDefault();
      renderAll();
      return;
    }
    if (event.key === "Escape") {
      const panel = refs.contextInspector.contains(event.target) && state.inspectorOpen
        ? "inspector"
        : refs.toolDrawer.contains(event.target) && state.toolDrawerOpen ? "tools" : null;
      if (panel) {
        event.preventDefault();
        closePlannerPanel(refs, state, renderAll, panel);
        return;
      }
    }
    if (event.key === "Enter" && state.drawMode === "bed-polygon") {
      if (finishDraftBedPolygon(state)) {
        openInspector(state, "bed");
        event.preventDefault();
        renderAll();
      }
      return;
    }
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    if (isEditableTarget(event.target)) return;
    const deleted = plannerCanEditFeature(state, "placement")
      ? deleteSelectedPlacement(state)
      : plannerCanEditFeature(state, "structure")
      ? deleteSelectedStructure(state)
      : plannerCanEditFeature(state, "vegetation")
      ? deleteSelectedVegetation(state)
      : false;
    if (!deleted) return;
    event.preventDefault();
    renderAll();
  });
}

function isEditableTarget(target) {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable]"));
}

function svgFeatureTypeFromTarget(target) {
  if (!target?.closest) return null;
  if (target.closest(".plant-node")) return "placement";
  if (target.closest(".property-bed")) return "bed";
  if (target.closest(".structure")) return "structure";
  if (target.closest(".vegetation-node")) return "vegetation";
  return null;
}

function setupSvgInteractions(refs, state, renderAll, renderSharedViews = renderAll) {
  refs.planSvg.setAttribute("tabindex", "0");
  const svg = d3.select(refs.planSvg);
  let navigationState = null;
  let suppressNextPlanClick = false;
  refs.planSvg.addEventListener("click", event => {
    if (!suppressNextPlanClick) return;
    suppressNextPlanClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);


  svg.on("wheel", (event) => {
    refs.planSvg.focus({preventScroll: true});
    event.preventDefault();
    const [x, y] = pointerInSharedWorld(event, refs.planSvg);
    zoomPlanningViewport(state, event.deltaY < 0 ? 0.82 : 1.22, {x, y});
    renderSharedViews();
  }, {passive: false});

  svg.on("pointerdown", (event) => {
    if (navigationState) return;
    suppressNextPlanClick = false;
    const rotating = event.ctrlKey || event.button === 2;
    if (!rotating && event.button !== 0 && event.button !== 1) return;
    const targetFeatureType = svgFeatureTypeFromTarget(event.target);
    if (!rotating && event.button !== 1 && targetFeatureType && plannerCanEditFeature(state, targetFeatureType)) return;
    refs.planSvg.focus({preventScroll: true});
    navigationState = {
      pointerId: event.pointerId,
      rotating,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewport: {...planViewBounds(state)},
      startBearing: normalizeViewBearing(planningBearing(state)),
      startPitch: normalizeViewPitch(planningPitch(state)),
      moved: false
    };
    refs.planSvg.setPointerCapture?.(event.pointerId);
    if (rotating) event.preventDefault();
  });

  svg.on("pointermove", (event) => {
    if (!navigationState || event.pointerId !== navigationState.pointerId) return;
    const dx = event.clientX - navigationState.startClientX;
    const dy = event.clientY - navigationState.startClientY;
    if (!navigationState.moved && Math.hypot(dx, dy) < 4) return;
    navigationState.moved = true;
    suppressNextPlanClick = true;
    event.preventDefault();
    if (navigationState.rotating) {
      setPlanningOrientation(state,navigationState.startBearing + dx*0.35,navigationState.startPitch - dy*0.25);
    } else {
      panPlanningViewport(
        state,
        navigationState.startViewport,
        dx,
        dy,
        refs.planSvg.getBoundingClientRect()
      );
    }
    renderSharedViews();
  });

  const finishNavigation = (event) => {
    if (!navigationState || event.pointerId !== navigationState.pointerId) return;
    if (refs.planSvg.hasPointerCapture?.(event.pointerId)) refs.planSvg.releasePointerCapture(event.pointerId);
    const didMove = navigationState.moved;
    navigationState = null;
    if (didMove) {
      event.preventDefault();
      renderAll();
    }
  };
  svg.on("pointerup", finishNavigation);
  svg.on("pointercancel", finishNavigation);
  svg.on("lostpointercapture", finishNavigation);
  svg.on("contextmenu", (event) => event.preventDefault());

  // Capture placement before feature-selection handlers; an existing crown or
  // mapped polygon must not steal the click intended for a new observation.
  refs.parcelSvg.addEventListener("click", event => {
    if (!["tree-point","planting-point"].includes(state.drawMode) || refs.parcelSvg.dataset.panMoved === "true") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const [x, y] = pointerInSharedWorld(event, refs.parcelSvg);
    if(state.drawMode==='planting-point')addPlannedPlanting(state,state.pendingPlantingKind,{x,y});
    else addVegetation(state, {x, y});
    state.drawMode = null;
    openInspector(state, "vegetation");
    renderAll();
  }, true);

  svg.on("click", (event) => {
    refs.planSvg.focus({preventScroll: true});
    if (suppressNextPlanClick) {
      suppressNextPlanClick = false;
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    if (event.target.closest?.(".plant-node")) return;
    if (state.drawMode) return;
    if (!plannerCanEditFeature(state, "placement")) return;
    const [x, y] = state.viewMode === "garden"
      ? pointerInSharedWorld(event, refs.planSvg)
      : d3.pointer(event, refs.planSvg);
    if (state.viewMode !== "bed") {
      const bed = bedAtPoint(state, x, y);
      if (!bed) return;
      const point = pointToBedLocal(x, y, bed);
      state.activeBedId = bed.id;
      addPlacement(state, state.selectedPlantId, point.x, point.y);
      openInspector(state, "placement");
      renderAll();
      return;
    }
    const bed = activeBed(state);
    if (!isInsideBed(x, y, bed)) return;
    addPlacement(state, state.selectedPlantId, x, y);
    openInspector(state, "placement");
    renderAll();
  });

  svg.on("dblclick", null);
}

function setupParcelInteractions(refs, state, renderAll, renderSharedViews = renderAll) {
  refs.parcelSvg.setAttribute("tabindex", "0");
  const svg = d3.select(refs.parcelSvg);
  let panState = null;
  let suppressNextParcelClick = false;
  refs.parcelSvg.addEventListener("click", event => {
    if (!suppressNextParcelClick) return;
    suppressNextParcelClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);


  svg.on("wheel", (event) => {
    refs.parcelSvg.focus({preventScroll: true});
    event.preventDefault();
    const [x, y] = pointerInSharedWorld(event, refs.parcelSvg);
    zoomParcelViewport(state, event.deltaY < 0 ? 0.82 : 1.22, {x, y});
    renderSharedViews();
  }, {passive: false});

  svg.on("pointerdown", (event) => {
    if (panState) return;
    suppressNextParcelClick = false;
    refs.parcelSvg.dataset.panMoved="false";
    const rotating = event.ctrlKey || event.button === 2;
    if (!rotating && event.button !== 0 && event.button !== 1) return;
    const targetFeatureType = svgFeatureTypeFromTarget(event.target);
    if (!rotating && event.button !== 1 && targetFeatureType && plannerCanEditFeature(state, targetFeatureType)) return;
    refs.parcelSvg.focus({preventScroll: true});
    const viewport = parcelViewportBounds(state);
    panState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startViewport: {...viewport},
      startBearing: normalizeViewBearing(state.viewBearing),
      startPitch: normalizeViewPitch(state.viewPitch),
      rotating,
      moved: false
    };
    refs.parcelSvg.setPointerCapture?.(event.pointerId);
    if (rotating) event.preventDefault();
  });

  svg.on("pointermove", (event) => {
    if (!panState || event.pointerId !== panState.pointerId) return;
    const dx = event.clientX - panState.startClientX;
    const dy = event.clientY - panState.startClientY;
    if (!panState.moved && Math.hypot(dx, dy) < 4) return;
    panState.moved = true;
    refs.parcelSvg.dataset.panMoved="true";
    suppressNextParcelClick = true;
    event.preventDefault();
    if (panState.rotating) {
      state.viewBearing = normalizeViewBearing(panState.startBearing + dx * 0.35);
      state.viewPitch = normalizeViewPitch(panState.startPitch - dy * 0.25);
    } else {
      state.parcelViewport = panParcelViewportFromScreenDelta(
        state,
        panState.startViewport,
        dx,
        dy,
        refs.parcelSvg.getBoundingClientRect()
      );
    }
    renderSharedViews();
  });

  const finishPan = (event) => {
    if (!panState || event.pointerId !== panState.pointerId) return;
    if (refs.parcelSvg.hasPointerCapture?.(event.pointerId)) refs.parcelSvg.releasePointerCapture(event.pointerId);
    const didMove = panState.moved;
    panState = null;
    if (didMove) {
      event.preventDefault();
      renderAll();
    }
  };

  svg.on("pointerup", finishPan);
  svg.on("pointercancel", finishPan);
  svg.on("lostpointercapture", finishPan);
  svg.on("contextmenu", (event) => event.preventDefault());

  svg.on("click", (event) => {
    refs.parcelSvg.focus({preventScroll: true});
    if (suppressNextParcelClick) {
      suppressNextParcelClick = false;
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    if (event.target.closest?.(".property-bed, .structure, .vegetation-node")) return;
    const [x, y] = pointerInSharedWorld(event, refs.parcelSvg);
    if (state.drawMode === "bed-polygon") {
      state.draftBedPoints.push([x, y]);
      renderAll();
      return;
    }
    state.selectedStructureId = null;
    state.selectedVegetationId = null;
    state.inspectorOpen = false;
    renderAll();
  });

  svg.on("dblclick", (event) => {
    if (state.drawMode !== "bed-polygon") return;
    event.preventDefault();
    refs.parcelSvg.focus({preventScroll: true});
    if (finishDraftBedPolygon(state)) {
      openInspector(state, "bed");
      renderAll();
    }
  });
}

function renderControls(refs, state) {
  const walkButton=refs.root.querySelector('button[data-workspace="walk"]');
  if(walkButton)walkButton.textContent=state.viewMode==="bed" && walkingReturns.get(state)?.gardenId===state.activeParcelId ? "Back to walk" : "Walk through";
  refs.root.dataset.workspace = state.walkCamera ? "walk" : state.viewMode === "bed" ? "plant" : "explore";
  refs.root.querySelectorAll("[data-workspace]").forEach(button => button.setAttribute("aria-pressed",
    String(button.dataset.workspace === (state.walkCamera ? "walk" : state.viewMode === "garden" ? "explore" : "plant"))));
  const scope = ["parcel", "structures", "vegetation"].includes(state.activeTool) ? "attributes" : state.viewMode;
  refs.root.querySelector('[data-role="planning-scope-help"]').textContent = scope === "attributes"
    ? "Edit site points, paths, areas and established trees. These are separate from planting beds."
    : "Draw planting beds and arrange crops. Site features remain visible as context.";
  refs.root.querySelectorAll("[data-scope]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.scope === scope));
    button.disabled = button.dataset.scope === "bed" && !state.beds.length;
  });
  const bed = activeBed(state);
  const mapSettings = normalizeMapSettings(state.mapSettings, state.showVegetation);
  const inspectorSelectionAvailable = {
    bed: Boolean(bed),
    structure: Boolean(selectedStructure(state)),
    vegetation: Boolean(selectedVegetation(state)),
    plant: Boolean(selectedPlant(state)),
    placement: Boolean(selectedPlacement(state))
  };
  if (state.inspectorTab === "edit" && !inspectorSelectionAvailable[state.inspectorMode]) {
    state.inspectorOpen = false;
  }
  state.mapSettings = mapSettings;
  state.showVegetation = mapSettings.showVegetation;
  refs.root.classList.toggle("tool-drawer-open", state.toolDrawerOpen);
  refs.root.classList.toggle("inspector-open", state.inspectorOpen);
  refs.root.dataset.viewPresentation = state.viewPresentation;
  refs.root.dataset.viewMode = state.viewMode;
  refs.root.dataset.activeTool = state.activeTool;
  for(const hint of refs.root.querySelectorAll('.view-gesture-hint'))hint.textContent=state.walkCamera?'Walk · drag to look · W/S step · A/D turn · Use arrows to walk · Escape exits':'Pan mode: drag anywhere · wheel zoom · Ctrl/right-drag rotate';
  for(const controls of refs.root.querySelectorAll('[data-role="walk-controls"]'))controls.hidden=!state.walkCamera;
  if(state.walkCamera)refs.root.querySelector('[data-role="camera-angle"]').value='walk';
  for(const slider of refs.root.querySelectorAll('[data-camera]')){
    slider.disabled=Boolean(state.walkCamera)&&slider.dataset.camera==='pitch';
    if(slider!==document.activeElement)slider.value=String(slider.dataset.camera==='bearing'?normalizeViewBearing(planningBearing(state)):planningPitch(state));
    slider.setAttribute('aria-valuetext',slider.value+' degrees');
  }
  for(const capture of refs.root.querySelectorAll('[data-view-nav="capture"]'))capture.disabled=!['3d','split'].includes(state.viewPresentation);
  const cameraAngle = refs.root.querySelector('[data-role="camera-angle"]');
  cameraAngle.value = state.walkCamera ? "walk" : String(planningPitch(state) < 25 ? 0 : planningPitch(state) > 67 ? 75 : 60);
  for (const button of refs.viewNavigationButtons) {
    if (button.dataset.viewNav === "pan") button.setAttribute("aria-pressed", String(state.activeTool === "select"));
  }
  const activeGarden = activeParcelWorkspace(state);
  const activeReference = gardenReferenceById(state.activeParcelId);
  refs.gardenSubtitle.textContent = `${activeGarden?.name || state.property?.name || "Garden"} · ${isPublicDemo(activeGarden) ? "public demo · edits stay in this browser" : "my garden · save an account copy to keep it online"}`;
  refs.gardenCount.textContent = `${(state.parcels || []).length} gardens`;

  const toolTitles = {
    select: "Inspect canvas",
    parcel: "Garden & parcel",
    beds: "Garden beds",
    plants: "Plant library",
    flowers: "Flower reference",
    structures: "Site features",
    vegetation: "Vegetation"
  };
  refs.toolDrawerTitle.textContent = toolTitles[state.activeTool] || "Garden beds";
  for (const button of refs.toolButtons) {
    const active = button.dataset.tool === state.activeTool;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
  for (const panel of refs.toolPanels) panel.hidden = panel.dataset.toolPanel !== state.activeTool;
  for (const button of refs.presentationButtons) {
    const active = button.dataset.presentation === state.viewPresentation;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
  refs.activeBedName.textContent = state.beds.length ? bed.name : "No planning beds";
  const session = explicitEditSessions.get(state);
  if (session && (session.tool !== state.activeTool || session.gardenId !== state.activeParcelId)) explicitEditSessions.delete(state);
  const editLayer = explicitEditSessions.get(state)?.layer || null;
  const lockButton = refs.root.querySelector('[data-action="toggle-edit-lock"]');
  lockButton.textContent = editLayer ? "Done editing" : "Edit layer";
  lockButton.disabled = !plannerEditLayerForTool(state.activeTool);
  lockButton.setAttribute("aria-pressed", String(Boolean(editLayer)));
  refs.editModeStatus.dataset.editLayer = editLayer || "locked";
  refs.editModeIcon.textContent = editLayer ? "✎" : "⌕";
  refs.editModeLabel.textContent = editLayer ? `Editing ${plannerEditLayerLabel(editLayer)}` : "Inspect only";
  refs.editModeStatus.title = editLayer
    ? `Only ${plannerEditLayerLabel(editLayer)} can be moved or changed. Other map layers remain selectable.`
    : "Map features can be inspected, but spatial layers are locked.";

  const inspectorTitles = {
    bed: "Selected bed",
    structure: "Selected site feature",
    vegetation: "Selected vegetation",
    plant: "Plant reference",
    placement: "Selected planting"
  };
  refs.inspectorTitle.textContent = state.inspectorTab === "diagnostics"
    ? "Garden diagnostics"
    : inspectorTitles[state.inspectorMode] || "Selection";
  for (const button of refs.inspectorTabs) {
    const active = button.dataset.inspectorTab === state.inspectorTab;
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
    const panelName = button.dataset.inspectorTab === "diagnostics" ? "diagnostics" : state.inspectorMode;
    const panel = refs.inspectorPanels.find(panel => panel.dataset.inspectorPanel === panelName);
    if (panel) button.setAttribute("aria-controls", panel.id);
  }
  const visibleInspectorPanel = state.inspectorTab === "diagnostics" ? "diagnostics" : state.inspectorMode;
  for (const panel of refs.inspectorPanels) panel.hidden = panel.dataset.inspectorPanel !== visibleInspectorPanel;

  refs.controls.viewMode.value = normalizeViewMode(state.viewMode);
  const gardenOptions = workspaces => workspaces.map(workspace => {
    const reference = gardenReferenceById(workspace.id) || workspace.property?.reference;
    const place = reference?.town ? ` · ${reference.town}` : "";
    return `<option value="${escapeHtml(workspace.id)}">${escapeHtml(workspace.name || "Garden")}${escapeHtml(place)}</option>`;
  }).join("");
  const personalGardens = (state.parcels || []).filter(workspace => !isPublicDemo(workspace));
  const publicDemos = (state.parcels || []).filter(isPublicDemo);
  refs.controls.activeGarden.innerHTML = `${personalGardens.length ? `<optgroup label="My gardens">${gardenOptions(personalGardens)}</optgroup>` : ""}<optgroup label="Public demos · browser only">${gardenOptions(publicDemos)}</optgroup>`;
  refs.actions.duplicateGarden.textContent = isPublicDemo(activeGarden) ? "Copy to my gardens" : "Duplicate";
  refs.controls.activeGarden.value = state.activeParcelId;
  refs.root.dispatchEvent(new CustomEvent("veggie-farm:active-garden", {
    bubbles: true,
    detail: {id: state.activeParcelId}
  }));
  const basemaps = parcelBasemaps(state);
  refs.controls.basemap.innerHTML = basemaps
    .map((basemap) => `<option value="${escapeHtml(basemap.id)}">${escapeHtml(basemap.name)}</option>`)
    .join("");
  refs.controls.basemap.value = normalizeBasemapId(state, state.basemapId);
  const gardenLayouts = (state.layouts || []).filter((layout) => (layout.gardenId || layout.activeParcelId) === state.activeParcelId);
  refs.layoutSelect.innerHTML = [
    `<option value="__current__">Working copy · auto-saved</option>`,
    ...gardenLayouts.map((layout) => `<option value="${escapeHtml(layout.id)}">${escapeHtml(layout.name)}</option>`)
  ].join("");
  refs.actions.loadLayout.disabled = refs.layoutSelect.value === "__current__" || !gardenLayouts.length;
  refs.actions.deleteLayout.disabled = refs.layoutSelect.value === "__current__" || !gardenLayouts.length;
  refs.actions.resetDemo.disabled = !activeReference;
  refs.actions.deleteGarden.disabled = (state.parcels || []).length <= 1;
  renderSpatialImportReview(refs, state);
  for (const input of refs.mapSettingInputs) {
    const key = input.dataset.mapSetting;
    if (key === "bedVisibility") input.value = mapSettings.bedVisibility;
    else if (key === "referenceOverlayOpacity") {
      input.value = String(mapSettings.referenceOverlayOpacity);
      input.disabled = !referenceOverlays(state).length || !mapSettings.showReferenceOverlay;
    }
    else if (key === "showSourceEvidence") {
      input.checked = gardenSourceEvidenceVisible(state);
      input.disabled = !gardenSourceEvidenceCollection(state);
    }
    else {
      input.checked = mapSettings[key] !== false;
      input.disabled = key === "showImagery" && state.property?.imagery?.enabled === false
        || key === "showReferenceOverlay" && !referenceOverlays(state).length;
    }
  }
  refs.controls.basemap.disabled = state.property?.imagery?.enabled === false;
  const imageryVisible = mapSettings.showImagery && state.property?.imagery?.enabled !== false;
  const contextLayerKeys = [
    "showImagery",
    ...(referenceOverlays(state).length ? ["showReferenceOverlay"] : []),
    ...(gardenSourceEvidenceCollection(state) ? ["showSourceEvidence"] : []),
    "showParcel",
    "showVegetation",
    "showPlantings",
    "showBuildings",
    "showCirculation",
    "showBarriers",
    "showUtilities",
    "showWater",
    "showLandscapeFeatures"
  ];
  const visibleContextLayers = contextLayerKeys
    .filter((key) => key === "showImagery"
      ? imageryVisible
      : key === "showSourceEvidence" ? gardenSourceEvidenceVisible(state) : mapSettings[key]).length;
  const bedLabel = mapSettings.bedVisibility === "all"
    ? "all beds"
    : mapSettings.bedVisibility === "active" ? "selected bed" : "beds hidden";
  refs.mapSettingsSummary.textContent = `${visibleContextLayers}/${contextLayerKeys.length} · ${bedLabel}`;
  renderViewNavigation(refs, state);
  renderCartographicLegends(refs, state);
  const drawing = state.drawMode === "bed-polygon";
  const bedsEditable = plannerCanEditFeature(state, "bed");
  const siteEditable = plannerCanEditFeature(state, "structure");
  const vegetationEditable = plannerCanEditFeature(state, "vegetation");
  const plantingsEditable = plannerCanEditFeature(state, "placement");
  refs.actions.addBed.disabled = !bedsEditable;
  refs.actions.addStructure.disabled = !siteEditable;
  refs.actions.addVegetation.disabled = !vegetationEditable;
  refs.root.querySelector('[data-action="mark-tree"]').disabled = !vegetationEditable;
  const markingTree = ["tree-point", "planting-point"].includes(state.drawMode);
  refs.root.querySelector('[data-action="cancel-tree"]').hidden = !markingTree;
  refs.root.querySelector('[data-role="tree-placement-status"]').hidden = !markingTree;
  if (markingTree) refs.editModeLabel.textContent = "Click map to place planting · Escape cancels";
  refs.actions.addSelected.disabled = state.viewMode !== "bed" && !plantingsEditable;
  refs.actions.fillBed.disabled = !plantingsEditable;
  refs.actions.fillBed.textContent = placementsForBed(state, bed.id).length ? "Replace bed planting…" : "Fill bed";
  refs.root.querySelector('[data-role="fill-bed-status"]').hidden = true;
  refs.actions.clear.disabled = !plantingsEditable || !placementsForBed(state, bed.id).length;
  refs.actions.drawBed.hidden = false;
  refs.actions.finishBed.hidden = !drawing;
  refs.actions.cancelDraw.hidden = !drawing;
  refs.actions.drawBed.setAttribute("aria-pressed", drawing ? "true" : "false");
  refs.actions.drawBed.disabled = drawing || !bedsEditable;
  refs.actions.drawBed.textContent = drawing ? "Drawing bed polygon" : "Draw bed polygon";
  refs.actions.finishBed.disabled = !bedsEditable || !drawing || (state.draftBedPoints || []).length < 3;
  refs.root.querySelector('[data-role="bed-drawing-controls"]').hidden = !drawing;
  refs.root.querySelector('[data-action="finish-map-bed"]').disabled = refs.actions.finishBed.disabled;
  refs.root.querySelector('[data-role="bed-drawing-status"]').textContent =
    `Tap map corners · ${(state.draftBedPoints || []).length} points`;
  refs.actions.finishBed.textContent = drawing
    ? `Finish polygon (${(state.draftBedPoints || []).length})`
    : "Finish polygon";
}

function renderViewNavigation(refs, state) {
  const zoom = parcelZoomLevel(state);
  const bearing = normalizeViewBearing(state.viewPresentation === "map" ? state.viewBearing : planningBearing(state));
  const pitch = normalizeViewPitch(state.viewPresentation === "map" ? state.viewPitch : planningPitch(state));
  const element = [refs.parcelSvg, refs.planSvg, refs.threeHost]
    .find((candidate) => candidate?.getBoundingClientRect?.().width > 0) || refs.parcelSvg;
  const bounds = state.viewMode === "bed" && state.viewPresentation !== "map"
    ? planViewBounds(state)
    : parcelViewportBounds(state);
  const profile = gardenViewProfileForElement(bounds, element, gardenInformationContext(state, bounds));
  const resolution = profile.inchesPerPixel < 12
    ? `${profile.inchesPerPixel < .1 ? profile.inchesPerPixel.toFixed(3) : round(profile.inchesPerPixel)} in/px`
    : `${round(profile.inchesPerPixel / 12)} ft/px`;
  const focusLabel = state.viewMode === "bed" && state.viewPresentation !== "map" ? "local focus" : `${zoom}×`;
  const label = `${profile.label} · ${resolution} · ${focusLabel} · ${Math.round(bearing)}°`;
  for (const compass of refs.viewCompasses) {
    compass.style.transform = `rotate(${-bearing}deg)`;
  }
  for (const status of refs.viewNavigationStatuses) status.textContent = label;
  refs.threeStatus.textContent = label;
  refs.root.dataset.detailLevel = profile.id;
  refs.root.dataset.contextAdapted = profile.contextAdapted ? "true" : "false";
  renderScaleBars(refs, state);
}

function gardenInformationContext(state, viewport = null) {
  const localBedFocus = state.viewMode === "bed" && state.viewPresentation !== "map";
  const active = activeBed(state);
  const currentViewport = viewport || parcelViewportBounds(state);
  const overlapsViewport = (feature) => boundsOverlap(
    boundsFromPoints(featureEnvelopePoints(feature), 0),
    currentViewport
  );
  const scopedStructures = localBedFocus
    ? []
    : visibleSiteFeatures(state).filter(overlapsViewport);
  const scopedVegetation = localBedFocus
    ? []
    : (state.vegetation || []).filter(overlapsViewport);
  const scopedBeds = localBedFocus
    ? (active ? [active] : [])
    : mapVisibleBeds(state).filter(overlapsViewport);
  const scopedPlacements = localBedFocus
    ? placementsForBed(state, active?.id)
    : (state.placements || []).filter((placement) => {
        const point = placementParcelPosition(state, placement);
        return point.x >= currentViewport.x
          && point.x <= currentViewport.x + currentViewport.width
          && point.y >= currentViewport.y
          && point.y <= currentViewport.y + currentViewport.height;
      });
  const categoryCount = (category) => scopedStructures
    .filter((feature) => siteFeatureDefinition(feature).category === category).length;
  const focusByTool = {
    parcel: "estate",
    structures: "site",
    vegetation: "forest",
    beds: "garden",
    plants: "plant",
    flowers: "flowers"
  };
  return {
    // A local 2D/3D view is inherently bed-centric. At intermediate site
    // scales, an open tool tray can instead bias the interpretation toward the
    // information the user is actively working with.
    informationFocus: state.toolDrawerOpen
      ? focusByTool[state.activeTool]
      : localBedFocus ? "bed" : "",
    featureCounts: {
      plants: scopedPlacements.length,
      beds: scopedBeds.length,
      structures: categoryCount("buildings"),
      paths: categoryCount("circulation"),
      barriers: categoryCount("barriers"),
      utilities: categoryCount("utilities"),
      water: categoryCount("water"),
      landscape: categoryCount("landscape"),
      vegetation: scopedVegetation.length,
      forests: scopedVegetation.filter((item) => item.kind === "forest").length
    }
  };
}

function renderScaleBars(refs, state) {
  for (const scale of refs.mapScales) {
    const view = scale.closest(".planner-view");
    const isParcel = view?.classList.contains("parcel-map-view");
    const viewport = isParcel || state.viewMode === "garden" ? parcelViewportBounds(state) : planViewBounds(state);
    const surface = isParcel ? refs.parcelSvg : refs.planSvg;
    const rect = surface?.getBoundingClientRect?.() || {width: 960, height: 640};
    const bar = scaleBarForView(viewport, rect, 104);
    scale.querySelector("i").style.width = `${Math.max(24, Math.min(132, bar.pixels))}px`;
    scale.querySelector("span").textContent = bar.label;
    scale.title = `${bar.label} on the ground`;
  }
}

function legendSwatchStyle(item) {
  return [
    item.fill ? `--legend-fill:${item.fill}` : "",
    item.stroke ? `--legend-stroke:${item.stroke}` : "",
    item.fillOpacity !== undefined ? `--legend-fill-opacity:${item.fillOpacity}` : "",
    item.strokeDasharray && item.strokeDasharray !== "none" ? `--legend-dash:${item.strokeDasharray}` : ""
  ].filter(Boolean).join(";");
}

function renderCartographicLegends(refs, state) {
  const fixedItems = [
    ...(state.mapSettings.showParcel ? [{id: "parcel", label: "Parcel", swatch: "line", stroke: "#f4e6b8"}] : []),
    ...(gardenSourceEvidenceVisible(state) && gardenBundledSourceEvidenceAvailable(state)
      ? [{id: "source-evidence", label: "Source evidence", swatch: "line", stroke: "#d764a8", strokeDasharray: "7 4"}]
      : []),
    ...(gardenSourceEvidenceVisible(state) && gardenStagedImportEvidenceAvailable(state)
      ? [{id: "staged-evidence", label: "Uploaded review layer", swatch: "line", stroke: "#f2a94a", strokeDasharray: "4 3"}]
      : []),
    ...(state.mapSettings.bedVisibility !== "none" ? [{id: "beds", label: "Garden beds", swatch: "area", fill: "#8a7258", stroke: "#6f5b45", fillOpacity: 0.48}] : []),
    ...(state.mapSettings.showPlantings ? [{id: "plantings", label: "Plantings", swatch: "symbol", fill: "#4f8b5d", stroke: "#315d3e"}] : []),
    ...(state.mapSettings.showVegetation ? [{id: "vegetation", label: "Canopy / forest", swatch: "area", fill: "#55775a", stroke: "#46644b", fillOpacity: 0.28}] : [])
  ];
  const items = [...fixedItems, ...siteFeatureLegendItems(state.structures || [], state.mapSettings)];
  const markup = items.map((item) => `
    <span class="map-legend-item">
      <i class="legend-swatch legend-swatch-${escapeHtml(item.swatch || "area")}" style="${legendSwatchStyle(item)}"></i>
      <span>${escapeHtml(item.label)}</span>
    </span>
  `).join("");
  for (const legend of refs.mapLegendItems) legend.innerHTML = markup;
}

function renderPlantList(refs, state, renderAll) {
  const query = refs.plantSearch.value.trim().toLowerCase();
  const plants = state.plants.filter((plant) => {
    const haystack = `${plant.name} ${plant.group} ${plant.waterStyle} ${plant.soil}`.toLowerCase();
    return haystack.includes(query);
  });

  refs.plantCount.textContent = `${plants.length}`;
  refs.plantList.innerHTML = "";

  for (const plant of plants) {
    const button = document.createElement("button");
    button.className = "plant-option";
    button.type = "button";
    button.dataset.plantId = plant.id;
    button.draggable = state.viewMode === "bed";
    button.title = "Choose a plant, then Add selected; or drag into the bed";
    button.addEventListener("dragstart", event => {
      if (state.viewMode !== "bed") {event.preventDefault(); return;}
      event.dataTransfer.setData("application/x-veggie-plant", plant.id);
      event.dataTransfer.effectAllowed = "copy";
    });
    button.setAttribute("aria-pressed", plant.id === state.selectedPlantId ? "true" : "false");
    button.innerHTML = `
      <span class="plant-swatch" style="--plant-color:${plant.leafColor || plant.color}"></span>
      <span class="plant-option-main">
        <strong>${escapeHtml(plant.name)}</strong>
        <span>${escapeHtml(plant.group)} · ${plant.height || "?"} in mature height · ${plant.matureDiameter || "?"} in spread · 3D preview</span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.selectedPlantId = plant.id;
      if (state.viewMode !== "bed") openInspector(state, "plant");
      renderAll();
    });
    refs.plantList.append(button);
  }
}

function renderFlowerLibrary(refs, state, renderAll) {
  const query = refs.flowerSearch.value.trim().toLowerCase();
  const season = refs.flowerSeason.value;
  const light = refs.flowerLight.value;
  const moisture = refs.flowerMoisture.value;
  const activeReference = gardenReferenceById(state.activeParcelId);
  const flowers = state.plants.filter((plant) => {
    if (plant.group !== "Flower") return false;
    const haystack = [
      plant.name,
      plant.scientificName,
      plant.naumkeagUse,
      plant.soil,
      ...(plant.flowerColors || [])
    ].join(" ").toLowerCase();
    const matchesSeason = season === "all" || plant.bloomSeasons?.includes(season);
    const matchesLight = light === "all" || plant.light?.some((value) => value.toLowerCase() === light);
    const matchesMoisture = moisture === "all" || plant.moisture?.some((value) => value.toLowerCase() === moisture);
    return haystack.includes(query) && matchesSeason && matchesLight && matchesMoisture;
  });

  const isNaumkeag = state.activeParcelId === "naumkeag-garden-rooms";
  refs.flowerContext.innerHTML = `
    <span>${isNaumkeag ? "Naumkeag condition study" : "Massachusetts flower palette"}</span>
    <strong>${isNaumkeag ? "Formal rooms, locally grounded" : "Open-data growing conditions"}</strong>
    <p>${isNaumkeag
      ? "Use these records as condition-matching references for the Rose Garden, Peony Terraces, Afternoon Garden, and pool edge. They are not a historical inventory."
      : `Filter Massachusetts-oriented references for ${escapeHtml(activeReference?.name || activeParcelWorkspace(state)?.name || "this garden")}.`}</p>
  `;
  refs.flowerCount.textContent = `${flowers.length}/${FLOWER_CATALOG.length}`;
  refs.actions.addSelectedFlower.disabled = !plannerCanEditFeature(state, "placement") || selectedPlant(state)?.group !== "Flower";
  refs.flowerList.innerHTML = "";

  if (!flowers.length) {
    refs.flowerList.innerHTML = `<div class="empty-state">No flowers match these conditions.</div>`;
    return;
  }

  for (const plant of flowers) {
    const button = document.createElement("button");
    const sourceCount = (plant.sourceIds || []).length;
    button.className = "flower-option";
    button.type = "button";
    button.dataset.plantId = plant.id;
    button.setAttribute("aria-pressed", plant.id === state.selectedPlantId ? "true" : "false");
    button.innerHTML = `
      <span class="flower-swatch" style="--flower-color:${plant.color}"></span>
      <span class="flower-option-main">
        <strong>${escapeHtml(plant.name)}</strong>
        <em>${escapeHtml(plant.scientificName)}</em>
        <span class="flower-tags">
          <small>${escapeHtml((plant.bloomSeasons || []).join(" + "))}</small>
          <small>${escapeHtml((plant.light || []).join(" / "))}</small>
          <small>${escapeHtml((plant.moisture || []).join(" / "))}</small>
        </span>
        ${isNaumkeag ? `<span class="flower-room">${escapeHtml(plant.naumkeagUse || "Flexible garden-room reference")}</span>` : ""}
        <span class="flower-evidence">${sourceCount} source${sourceCount === 1 ? "" : "s"} · ${plant.nativeToNewEngland ? "New England native" : "formal-garden species"}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      state.selectedPlantId = plant.id;
      openInspector(state, "plant");
      renderAll();
    });
    refs.flowerList.append(button);
  }
}

function renderPropertyBeds(refs, state, renderAll) {
  const property = state.property || PROPERTY_CONTEXT;
  const parcel = property.parcel?.attributes;
  const reference = gardenReferenceById(state.activeParcelId) || property.reference;
  const bed = activeBed(state);
  const parcelArea = property.spatialStatus === "concept"
    ? "Concept canvas"
    : parcel?.LOT_SIZE
    ? `${round(parcel.LOT_SIZE)} ${parcel.LOT_UNITS || "acres"}`
    : `${round(polygonRingsAreaSqFt(propertyBoundaryRings(state)) / 43560)} acres`;
  refs.propertyCard.innerHTML = `
    <strong>${escapeHtml(property.name || "Property working map")}</strong>
    <span>${escapeHtml(parcelArea)} | ${escapeHtml(property.aspect || "Planting aspect pending")}</span>
    <small>${escapeHtml(reference?.mapping?.layoutStatus === "diagrammatic"
      ? `MassGIS FY${parcel?.FY || reference.mapping.parcelFiscalYear} parcel | diagrammatic interior layout`
      : parcel?.FY ? `MassGIS FY${parcel.FY} | identifying assessor fields not stored` : property.source || "Property source pending")}</small>
  `;

  refs.bedCount.textContent = `${state.beds.length}`;
  refs.bedList.innerHTML = "";
  for (const item of state.beds) {
    const count = placementsForBed(state, item.id).length;
    const button = document.createElement("button");
    button.className = "bed-option";
    button.type = "button";
    button.dataset.featureId = item.id;
    button.setAttribute("aria-pressed", item.id === bed.id ? "true" : "false");
    button.innerHTML = `
      <span class="bed-swatch"></span>
      <span class="bed-option-main">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${Math.round(item.width / 12)} x ${round(item.height / 12)} ft | ${count} plants | ${escapeHtml(item.zone || "Garden")}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      selectGardenFeature(state, "bed", item.id);
      renderAll();
    });
    refs.bedList.append(button);
  }

  renderStructureList(refs, state, renderAll);
  renderVegetationList(refs, state, renderAll);
}

function renderStructureList(refs, state, renderAll) {
  refs.structureCount.textContent = `${state.structures.length}`;
  refs.structureList.innerHTML = "";
  if (!state.structures.length) {
    refs.structureList.innerHTML = `<div class="empty-state">No structures on the map</div>`;
    return;
  }
  const search=refs.root.querySelector('[data-role="structure-search"]').value.toLowerCase().trim();
  for (const structure of state.structures) {
    const definition = siteFeatureDefinition(structure);
    if(search&&!`${structure.name} ${definition.label}`.toLowerCase().includes(search))continue;
    const swatchColor = definition.legend.fill || definition.legend.stroke || "#8a6b4c";
    const button = document.createElement("button");
    button.className = "structure-option";
    button.type = "button";
    button.dataset.featureId = structure.id;
    button.setAttribute("aria-pressed", structure.id === state.selectedStructureId ? "true" : "false");
    button.innerHTML = `
      <span class="structure-swatch structure-swatch-${escapeHtml(structure.type)}" style="--feature-swatch:${escapeHtml(swatchColor)}"></span>
      <span class="bed-option-main">
        <strong>${escapeHtml(structure.name)}</strong>
        <span>${escapeHtml(definition.label)} | ${round(structure.width / 12)} x ${round(structure.height / 12)} ft</span>
      </span>
    `;
    button.addEventListener("click", () => {
      selectGardenFeature(state, "structure", structure.id);
      renderAll();
    });
    const row=document.createElement('div');row.className='feature-list-row';
    const locate=document.createElement('button');locate.type='button';locate.textContent='Locate';locate.setAttribute('aria-label',`Locate ${structure.name}`);
    locate.addEventListener('click',()=>{selectGardenFeature(state,"structure",structure.id);state.walkCamera=null;state.viewMode='garden';state.viewPresentation='map';fitParcelViewport(state,selectedFeatureBounds(state),.5);if(window.matchMedia('(max-width:920px)').matches){state.toolDrawerOpen=false;state.inspectorOpen=false;}renderAll();});
    row.append(button,locate);refs.structureList.append(row);
  }
}

function renderVegetationList(refs, state, renderAll) {
  refs.vegetationCount.textContent = `${state.vegetation.length}`;
  refs.vegetationList.innerHTML = "";
  if (!state.vegetation.length) {
    refs.vegetationList.innerHTML = `<div class="empty-state">No vegetation overlays</div>`;
    return;
  }
  const search=refs.root.querySelector('[data-role="vegetation-search"]').value.toLowerCase().trim();
  for (const vegetation of state.vegetation) {
    if(search&&!`${vegetation.name} ${vegetation.kind}`.toLowerCase().includes(search))continue;
    const plant = plantById(state, vegetation.plantId);
    const crown = vegetationCanopyEllipse(vegetation);
    const crownSummary = vegetation.kind === "tree"
      ? `${round(crown.rx * 2 / 12)} × ${round(crown.ry * 2 / 12)} ft crown`
      : `${escapeHtml(vegetation.canopyClass)} cover`;
    const button = document.createElement("button");
    button.className = "vegetation-option";
    button.type = "button";
    button.dataset.featureId = vegetation.id;
    button.setAttribute("aria-pressed", vegetation.id === state.selectedVegetationId ? "true" : "false");
    button.innerHTML = `
      <span class="vegetation-swatch vegetation-swatch-${escapeHtml(vegetation.canopyClass)}"></span>
      <span class="bed-option-main">
        <strong>${escapeHtml(vegetation.name)}</strong>
        <span>${escapeHtml(titleCase(vegetation.kind || "canopy"))} | ${escapeHtml(plant?.name || vegetation.identificationStatus || "taxon unidentified")} | ${crownSummary} | ${escapeHtml(vegetation.confidence)}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      selectGardenFeature(state, "vegetation", vegetation.id);
      renderAll();
    });
    const row=document.createElement('div');row.className='feature-list-row';
    const locate=document.createElement('button');locate.type='button';locate.textContent='Locate';locate.setAttribute('aria-label',`Locate ${vegetation.name}`);
    locate.addEventListener('click',()=>{selectGardenFeature(state,"vegetation",vegetation.id);state.walkCamera=null;state.viewMode='garden';state.viewPresentation='map';fitParcelViewport(state,selectedFeatureBounds(state),.5);if(window.matchMedia('(max-width:920px)').matches){state.toolDrawerOpen=false;state.inspectorOpen=false;}renderAll();});
    row.append(button,locate);refs.vegetationList.append(row);
  }
}

function renderMetrics(refs, state) {
  const bed = activeBed(state);
  const conflicts = collectSpacingIssues(state).length;
  const areaSqFt = (state.beds.length ? bed.width * bed.height / 144 : 0).toFixed(1);
  const totalBeds = state.beds.length;
  refs.metrics.innerHTML = `
    <span><strong>${visiblePlannedPlacements(activePlacements(state), state.previewDate).length}</strong> ${state.previewDate ? "shown plants" : "active plants"}</span>
    <span><strong>${areaSqFt}</strong> sq ft</span>
    <span><strong>${totalBeds}</strong> beds</span>
    <span><strong>${conflicts}</strong> checks</span>
  `;
}

function renderParcelMap(refs, state, renderAll) {
  // Failure feedback belongs to this mosaic, not to the garden or later views.
  // Current failed tiles (including cached failures) can report it again below.
  const imageryStatus = refs.root.querySelector('[data-role="imagery-status"]');
  imageryStatus.hidden = true;
  imageryStatus.textContent = "";
  const viewBounds = parcelViewportBounds(state);
  const zoom = parcelZoomLevel(state);
  const editLayer = plannerEditLayerForTool(state.activeTool);
  const editInstruction = {
    beds: "Select or move beds",
    plants: "Select or move plantings",
    site: "Select or move whole site features",
    vegetation: "Select or move vegetation"
  }[editLayer] || "Inspect mapped features";
  refs.parcelLabel.textContent = state.drawMode === "bed-polygon"
    ? `${(state.draftBedPoints || []).length} polygon points | ${zoom}x`
    : `${editInstruction} | ${zoom}x`;
  const svg = d3.select(refs.parcelSvg)
    .attr("viewBox", `${viewBounds.x} ${viewBounds.y} ${viewBounds.width} ${viewBounds.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  svg.selectAll("*").remove();
  const boundaries = propertyBoundaryRings(state);
  const parcelClipId = `parcel-feature-clip-${slugify(state.property?.id || "active-parcel")}`;
  svg.append("defs")
    .append("clipPath")
    .attr("id", parcelClipId)
    .attr("clipPathUnits", "userSpaceOnUse")
    .append("path")
    .attr("clip-rule", "evenodd")
    .attr("d", polygonRingsPath(boundaries));
  const featureClipPath = `url(#${parcelClipId})`;
  const world = svg.append("g")
    .attr("class", "shared-view-world")
    .attr("transform", sharedWorldTransform(state, viewBounds));
  const context = world.append("g").attr("class", "plot-context parcel");
  // The parcel map is hidden in 2D, 3D and Split (2D/3D) presentations.
  // Keep its geometry ready without downloading imagery the visitor cannot see.
  if (state.viewPresentation === "map" && state.mapSettings.showImagery) renderParcelImagery(context, state);
  const overlay = world.append("g").attr("class", "map-feature-overlay")
    .attr("opacity", Number(refs.featureOpacity.value))
    .attr("pointer-events", Number(refs.featureOpacity.value) === 0 ? "none" : null);
  renderReferenceOverlays(overlay, state);
  renderGardenSourceEvidence(overlay, state);

  if (state.mapSettings.showParcel) {
    overlay.append("path")
      .attr("class", "parcel-boundary")
      .attr("fill-rule", "evenodd")
      .attr("d", polygonRingsPath(boundaries));
  }

  if (state.mapSettings.showVegetation) {
    renderVegetation2d(overlay, state, renderAll, {
      editable: state.drawMode !== "bed-polygon" && plannerCanEditFeature(state, "vegetation"),
      clipPath: featureClipPath
    });
  }
  if (state.mapSettings.showStructures) {
    renderPropertyStructures2d(overlay, state, renderAll, {
      editable: !activeSiteGeometryDraft(state) && state.drawMode !== "bed-polygon" && plannerCanEditFeature(state, "structure"),
      clipPath: featureClipPath
    });
  }
  renderPropertyBeds2d(overlay, state, renderAll, {
    editable: state.drawMode !== "bed-polygon" && plannerCanEditFeature(state, "bed"),
    plantsEditable: state.drawMode !== "bed-polygon" && plannerCanEditFeature(state, "placement"),
    showPlants: state.mapSettings.showPlantings,
    selectOnly: true,
    beds: mapVisibleBeds(state),
    clipPath: featureClipPath
  });
  refs.referenceMapInspector?.renderOverlay(world.node());
  renderSiteGeometryDraft(world, state);
  renderDraftBedPolygon(world, state);
  renderNorthArrow(svg, state, viewBounds);
  renderParcelAttribution(svg, state, viewBounds);
}

function render2dPlan(refs, state, renderAll) {
  const bed = activeBed(state);
  const bounds = planViewBounds(state);
  const svg = d3.select(refs.planSvg)
    .attr("viewBox", `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  refs.planTitle.textContent = state.viewMode === "garden" ? "2D Garden Bed Placement" : "2D Bed Placement";
  refs.selectedLabel.textContent = state.viewMode === "garden"
    ? `${bed.name} selected`
    : selectedPlant(state)?.name || "";
  svg.selectAll("*").remove();

  const defs = svg.append("defs");
  defs.append("filter")
    .attr("id", "plant-shadow")
    .attr("x", "-30%")
    .attr("y", "-30%")
    .attr("width", "160%")
    .attr("height", "160%")
    .html(`
      <feDropShadow dx="0" dy="0.8" stdDeviation="0.7" flood-color="#1f3529" flood-opacity="0.18"></feDropShadow>
    `);

  if (state.viewMode !== "bed") {
    const world = svg.append("g")
      .attr("class", "shared-view-world")
      .attr("transform", sharedWorldTransform(state, bounds));
    renderPropertyPlan(world, state, renderAll);
    renderNorthArrow(svg, state, bounds);
    return;
  }

  const world = svg.append("g").attr("class", "shared-view-world")
    .attr("transform", sharedWorldTransform({...state,viewBearing:planningBearing(state)},bounds));
  const grid = world.append("g").attr("class", "grid-layer");
  const gridStep = visibleGridStep(bed.width, bed.height, bed.grid, 160);
  for (let x = 0; x <= bed.width; x += gridStep) {
    grid.append("line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", bed.height);
  }
  for (let y = 0; y <= bed.height; y += gridStep) {
    grid.append("line").attr("x1", 0).attr("x2", bed.width).attr("y1", y).attr("y2", y);
  }

  world.append("path")
    .attr("class", "bed-outline")
    .attr("d", bedOutlinePath(bed.width, bed.height));

  const spacing = world.append("g").attr("class", "spacing-layer");
  if (bed.showSpacing) {
    spacing.selectAll("circle")
      .data(visiblePlannedPlacements(activePlacements(state), state.previewDate), (d) => d.id)
      .join("circle")
      .attr("class", (d) => placementStatus(d, state).ok ? "spacing-ring" : "spacing-ring warning")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => spacingRadius(plantById(state, d.plantId), bed));
  }

  const dragOffsets = new Map();
  const drag = d3.drag()
    .on("start", (event, d) => {
      refs.planSvg.focus({preventScroll: true});
      const [x, y] = pointerInSharedWorld(event.sourceEvent, refs.planSvg);
      dragOffsets.set(d.id, {x: d.x - x, y: d.y - y});
      selectGardenFeature(state, "placement", d.id);
      event.sourceEvent?.stopPropagation();
    })
    .on("drag", (event, d) => {
      const [x, y] = pointerInSharedWorld(event.sourceEvent, refs.planSvg);
      const offset = dragOffsets.get(d.id) || {x: 0, y: 0};
      d.x = clamp(x + offset.x, 0, bed.width);
      d.y = clamp(y + offset.y, 0, bed.height);
      d.rotation = (d.rotation || 0) + event.dx * 0.002;
      state.selectedPlacementId = d.id;
      renderAll();
    })
    .on("end", (event, d) => {
      dragOffsets.delete(d.id);
    });

  const plants = world.append("g")
    .attr("class", "plant-layer")
    .selectAll("g")
    .data(visiblePlannedPlacements(activePlacements(state), state.previewDate), (d) => d.id)
    .join("g")
    .attr("class", (d) => {
      const status = placementStatus(d, state);
      return `plant-node${d.id === state.selectedPlacementId ? " selected" : ""}${status.ok ? "" : " warning"}${plannerCanEditFeature(state, "placement") ? " layer-editable" : " layer-locked"}`;
    })
    .attr("transform", (d) => `translate(${d.x},${d.y}) rotate(${((d.rotation || 0) * 180 / Math.PI).toFixed(2)})`);

  if (plannerCanEditFeature(state, "placement")) plants.call(drag);

  bindFeatureHover(plants, state, "placement");

  plants.append("path")
    .attr("class", "plant-canopy-halo")
    .attr("d", (d) => plantFootprintPath(plantById(state, d.plantId), d))
    .attr("fill", (d) => plantById(state, d.plantId)?.leafColor || "#58895d");

  plants.each(function(d) {
    renderSizedPlant2d(d3.select(this), state, d);
  });

  plants.append("circle")
    .attr("class", "root-dot")
    .attr("r", 1.4);

  plants.append("text")
    .attr("class", "plant-token")
    .attr("dy", "0.38em")
    .text((d) => plantInitials(plantById(state, d.plantId)));

  plants.append("title")
    .text((d) => {
      const plant = plantById(state, d.plantId);
      const status = placementStatus(d, state);
      return `${plant?.name || "Plant"}: ${status.messages.join(", ") || "spacing ok"}`;
    });

  plants.on("click", (event, d) => {
    event.stopPropagation();
    refs.planSvg.focus({preventScroll: true});
    selectGardenFeature(state, "placement", d.id);
    renderAll();
  });

  plants.on("dblclick", (event, d) => {
    if (!plannerCanEditFeature(state, "placement")) return;
    event.preventDefault();
    event.stopPropagation();
    refs.planSvg.focus({preventScroll: true});
    deletePlacement(state, d.id);
    renderAll();
  });
}

function renderPropertyPlan(svg, state, renderAll) {
  renderPlotContext(svg, state, {showBoundary: state.mapSettings.showParcel});
  renderGardenSourceEvidence(svg, state);
  if (state.mapSettings.showVegetation) renderVegetation2d(svg, state, renderAll, {editable: plannerCanEditFeature(state, "vegetation")});
  if (state.mapSettings.showStructures) renderPropertyStructures2d(svg, state, renderAll, {editable: plannerCanEditFeature(state, "structure")});
  renderPropertyBeds2d(svg, state, renderAll, {
    editable: plannerCanEditFeature(state, "bed"),
    plantsEditable: plannerCanEditFeature(state, "placement"),
    showPlants: state.mapSettings.showPlantings,
    beds: mapVisibleBeds(state)
  });
}

function activeSiteGeometryDraft(state) {
  const draft = siteGeometryDrafts.get(state);
  if (draft && (draft.parcelId !== state.activeParcelId || draft.featureId !== state.selectedStructureId
    || !plannerCanEditFeature(state, "structure"))) {
    siteGeometryDrafts.delete(state);
    return null;
  }
  return draft || null;
}

function renderSiteGeometryDraft(world, state) {
  const draft = activeSiteGeometryDraft(state);
  if (!draft) return;
  const layer = world.append("g").attr("class", "site-geometry-preview");
  const radius = localUnitsForScreenPixels(world, 9);
  const redraw = () => {
    layer.selectAll(".site-geometry-outline").remove();
    for (const feature of draft.features) {
      const original = state.structures.find((item) => item.id === feature.id);
      if (feature.id !== draft.featureId && JSON.stringify(feature.localGeometry) === JSON.stringify(original?.localGeometry)) continue;
      const geometry = feature.localGeometry;
      if (geometry.type === "Point") continue;
      layer.insert("path", ":first-child").attr("class", "site-geometry-outline")
        .attr("d", geometry.type === "Polygon" ? polygonRingsPath(geometry.coordinates) : pointsPath(geometry.coordinates))
        .attr("fill", geometry.type === "Polygon" ? "#00d9ee" : "none").attr("fill-opacity", 0.12)
        .attr("stroke", "#00d9ee").attr("stroke-width", 3).attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");
    }
    const feature = draft.features.find((item) => item.id === draft.featureId);
    const vertices = localSiteGeometryVertices(feature.localGeometry);
    layer.selectAll("[data-site-vertex]").data(vertices).attr("transform", (v) => `translate(${v.coordinate})`);
  };
  const move = (vertex, point) => {
    draft.features = updateConnectedSiteVertices(draft.features, draft.featureId, vertex.path, point);
    redraw();
  };
  const feature = draft.features.find((item) => item.id === draft.featureId);
  const handles = layer.selectAll("[data-site-vertex]").data(localSiteGeometryVertices(feature.localGeometry))
    .enter().append("g").attr("data-site-vertex", (_, i) => i).attr("tabindex", 0)
    .attr("role", "button").attr("aria-label", (_, i) => `Anchor ${i + 1}; arrows move, Insert adds, Delete removes`)
    .style("cursor", "move")
    .on("click", (event,vertex) => {event.stopPropagation();draft.selectedVertex=vertex.path;layer.selectAll('[data-site-vertex] circle').attr('fill',v=>JSON.stringify(v.path)===JSON.stringify(vertex.path)?'#ae6616':'#092c32');})
    .on("focus", (event,vertex) => {draft.selectedVertex=vertex.path;})
    .on("keydown", (event, vertex) => {
      if(['Delete','Backspace','Insert'].includes(event.key)){event.preventDefault();event.stopPropagation();draft.selectedVertex=vertex.path;world.node().closest('.garden-planner-app')?.querySelector(`[data-action="${event.key==='Insert'?'insert':'remove'}-site-anchor"]`)?.click();return;}
      const delta = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
      if (!delta) return;
      event.preventDefault(); event.stopPropagation();
      move(vertex, vertex.coordinate.map((v, i) => v + delta[i] * (event.shiftKey ? 1 : 12)));
    })
    .call(d3.drag().on("start", (event,vertex) => {event.sourceEvent.stopPropagation();draft.selectedVertex=vertex.path;})
      .on("drag", (event, vertex) => move(vertex, d3.pointer(event.sourceEvent, world.node()))));
  handles.append("circle").attr("r", radius).attr("fill", v=>JSON.stringify(v.path)===JSON.stringify(draft.selectedVertex)?"#ae6616":"#092c32").attr("stroke", "#00d9ee")
    .attr("stroke-width", 2).attr("vector-effect", "non-scaling-stroke");
  handles.append("text").text((_, i) => i + 1).attr("text-anchor", "middle").attr("dy", ".35em")
    .attr("font-size", radius).attr("fill", "white").attr("pointer-events", "none");
  redraw();
}

function renderPropertyStructures2d(svg, state, renderAll = () => {}, options = {}) {
  const parent = svg.select(".plot-context").empty() ? svg : svg.select(".plot-context");
  const context = parent.append("g").attr("class", "site-feature-layer").attr("clip-path", options.clipPath || null);
  const referenceContext = parent.append("g").attr("class", "site-reference-layer");
  const viewport = options.viewport || parcelViewportBounds(state);
  const profile = gardenViewProfileForElement(
    viewport,
    svg.node()?.ownerSVGElement || svg.node(),
    gardenInformationContext(state, viewport)
  );
  const pointRadius = localUnitsForScreenPixels(svg, 6);
  const dragOffsets = new Map();
  const drag = d3.drag()
    .on("start", (event, structure) => {
      svg.node()?.focus({preventScroll: true});
      const [x, y] = d3.pointer(event.sourceEvent, svg.node());
      dragOffsets.set(structure.id, {x: structure.x - x, y: structure.y - y});
      selectGardenFeature(state, "structure", structure.id);
      event.sourceEvent?.stopPropagation();
    })
    .on("drag", (event, structure) => {
      const [x, y] = d3.pointer(event.sourceEvent, svg.node());
      const offset = dragOffsets.get(structure.id) || {x: 0, y: 0};
      moveStructureTo(structure, x + offset.x, y + offset.y);
      state.selectedStructureId = structure.id;
      renderAll();
    })
    .on("end", (event, structure) => {
      dragOffsets.delete(structure.id);
    });

  const structures = [...detailVisibleFeatures(
    visibleSiteFeatures(state),
    viewport,
    profile,
    state.selectedStructureId
  )].sort((a, b) => structureLayerRank(a) - structureLayerRank(b));
  for (const structure of structures) {
    const definition = siteFeatureDefinition(structure);
    const featureStyle = definition.legend;
    const preciseGeometry = localGeometryInStructureFrame(structure);
    const featureContext = ["reference-locator", "allow-external-connector"].includes(structure.boundaryPolicy) ? referenceContext : context;
    const group = featureContext.append("g")
      .attr("class", `structure structure-${structure.type}${structure.id === state.selectedStructureId ? " selected" : ""}${options.editable ? " layer-editable" : " layer-locked"}`)
      .attr("data-feature-category", definition.category)
      .attr("transform", `translate(${structure.x},${structure.y}) rotate(${structure.rotation || 0})`)
      .style("--feature-fill", featureStyle.fill || "transparent")
      .style("--feature-stroke", featureStyle.stroke || "#6b7567")
      .style("--feature-fill-opacity", featureStyle.fillOpacity ?? 0.3)
      .style("--feature-dash", featureStyle.strokeDasharray || "none");

    if (preciseGeometry?.type === "Point" || (!preciseGeometry && definition.defaultGeometryKind === "Point")) {
      const [pointX, pointY] = preciseGeometry?.coordinates || [0, 0];
      if (featureStyle.symbol === "diamond" || featureStyle.symbol === "square") {
        group.append("rect")
          .attr("class", "site-point-symbol")
          .attr("x", pointX - pointRadius * 0.78)
          .attr("y", pointY - pointRadius * 0.78)
          .attr("width", pointRadius * 1.56)
          .attr("height", pointRadius * 1.56)
          .attr("transform", featureStyle.symbol === "diamond" ? `rotate(45 ${pointX} ${pointY})` : null);
      } else if (featureStyle.symbol === "triangle") {
        group.append("path")
          .attr("class", "site-point-symbol")
          .attr("d", `M ${pointX},${pointY - pointRadius} L ${pointX + pointRadius},${pointY + pointRadius * 0.82} L ${pointX - pointRadius},${pointY + pointRadius * 0.82} Z`);
      } else {
        group.append("circle")
          .attr("class", "site-point-symbol")
          .attr("cx", pointX)
          .attr("cy", pointY)
          .attr("r", pointRadius);
      }
      if (["cross"].includes(featureStyle.symbol)) {
        group.append("path")
          .attr("class", "site-point-mark")
          .attr("transform", `translate(${pointX},${pointY})`)
          .attr("d", `M ${-pointRadius},0 H ${pointRadius} M 0,${-pointRadius} V ${pointRadius}`);
      }
    } else if (preciseGeometry?.type === "LineString") {
      const path = pointsPath(preciseGeometry.coordinates);
      if (Number(structure.corridorWidthFeet) > 0) {
        group.append("path").attr("class", "site-corridor")
          .attr("d", path).attr("fill", "none").attr("stroke", featureStyle.stroke || "#b6a78a")
          .attr("stroke-opacity", 0.25).attr("stroke-width", structure.corridorWidthFeet * 12)
          .attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("pointer-events", "none");
      }
      group.append("path")
        .attr("class", "site-line-hit")
        .attr("d", path);
      group.append("path")
        .attr("class", "site-line-symbol")
        .attr("d", path);
    } else if (preciseGeometry?.type === "Polygon") {
      group.append("path")
        .attr("class", "site-area-symbol")
        .attr("fill-rule", "evenodd")
        .attr("d", preciseGeometry.coordinates.map((ring) => pointsPath(ring, true)).join(" "));
    } else if (definition.defaultGeometryKind === "LineString" && ["barriers", "utilities"].includes(definition.category)) {
      const vertical = structure.height >= structure.width;
      const half = Math.max(structure.width, structure.height) / 2;
      group.append("line")
        .attr("class", "site-line-hit")
        .attr("x1", vertical ? 0 : -half)
        .attr("x2", vertical ? 0 : half)
        .attr("y1", vertical ? -half : 0)
        .attr("y2", vertical ? half : 0);
      group.append("line")
        .attr("class", "site-line-symbol")
        .attr("x1", vertical ? 0 : -half)
        .attr("x2", vertical ? 0 : half)
        .attr("y1", vertical ? -half : 0)
        .attr("y2", vertical ? half : 0);
    } else if (structure.type === "orchard") {
      group.append("ellipse")
        .attr("rx", structure.width / 2)
        .attr("ry", structure.height / 2);
    } else if (structure.type === "water") {
      group.append("circle")
        .attr("r", Math.max(structure.width, structure.height) / 2);
    } else {
      group.append("rect")
        .attr("x", -structure.width / 2)
        .attr("y", -structure.height / 2)
        .attr("width", structure.width)
        .attr("height", structure.height)
        .attr("rx", ["path", "road", "parking"].includes(structure.type) ? 6 : 2);
    }

    group.append("text")
      .attr("display", () => {
        if (["all", "named"].includes(profile.showLabels)) return null;
        return structure.id === state.selectedStructureId ? null : "none";
      })
      .attr("dy", "0.32em")
      .text(structureLabel(structure));

    group.append("title")
      .text([
        structure.name,
        `${structure.confidence || "low"} confidence`,
        formatFeatureSourceReference(primaryFeatureSourceReference(structure)),
        structure.source || "manual overlay"
      ].filter(Boolean).join("; "));

    bindFeatureHover(group, state, "structure");

    if (options.editable) group.call(drag);
    group.on("click", (event) => {
      event.stopPropagation();
      svg.node()?.focus({preventScroll: true});
      selectGardenFeature(state, "structure", structure.id);
      renderAll();
    });
  }
}

function renderVegetation2d(svg, state, renderAll = () => {}, options = {}) {
  if (!state.showVegetation) return;
  const viewport = options.viewport || parcelViewportBounds(state);
  const profile = gardenViewProfileForElement(
    viewport,
    svg.node()?.ownerSVGElement || svg.node(),
    gardenInformationContext(state, viewport)
  );
  const layer = svg.append("g")
    .attr("class", "vegetation-layer")
    .attr("clip-path", options.clipPath || null)
    .attr("opacity", state.vegetationOpacity);
  const dragOffsets = new Map();
  const drag = d3.drag()
    .on("start", (event, vegetation) => {
      svg.node()?.focus({preventScroll: true});
      const [x, y] = d3.pointer(event.sourceEvent, svg.node());
      dragOffsets.set(vegetation.id, {x: vegetation.x - x, y: vegetation.y - y});
      selectGardenFeature(state, "vegetation", vegetation.id);
      event.sourceEvent?.stopPropagation();
    })
    .on("drag", (event, vegetation) => {
      const [x, y] = d3.pointer(event.sourceEvent, svg.node());
      const offset = dragOffsets.get(vegetation.id) || {x: 0, y: 0};
      vegetation.x = x + offset.x;
      vegetation.y = y + offset.y;
      syncTreePointGeometry(vegetation);
      state.selectedVegetationId = vegetation.id;
      renderAll();
    })
    .on("end", (event, vegetation) => {
      dragOffsets.delete(vegetation.id);
    });

  const nodes = layer.selectAll("g.vegetation-node")
    .data(detailVisibleFeatures(state.vegetation || [], viewport, profile, state.selectedVegetationId), (vegetation) => vegetation.id)
    .join("g")
    .attr("class", (vegetation) => `vegetation-node vegetation-${vegetation.canopyClass} vegetation-kind-${vegetation.kind || "canopy"}${vegetation.id === state.selectedVegetationId ? " selected" : ""}${options.editable ? " layer-editable" : " layer-locked"}`)
    .attr("transform", (vegetation) => `translate(${vegetation.x},${vegetation.y}) rotate(${vegetation.rotation || 0})`);

  nodes.append("ellipse")
    .attr("rx", (vegetation) => vegetationCanopyEllipse(vegetation).rx)
    .attr("ry", (vegetation) => vegetationCanopyEllipse(vegetation).ry)
    .attr("data-geometry-role", (vegetation) => vegetation.kind === "tree" ? "derived-crown" : "mapped-cover")
    .attr("fill", (vegetation) => vegetationFill(vegetation, state));

  // The small center mark is the actual GIS feature. Its surrounding ellipse
  // is a derived crown envelope and can change without moving the tree Point.
  nodes.filter((vegetation) => vegetation.kind === "tree")
    .append("circle")
    .attr("class", "tree-center-marker")
    .attr("r", localUnitsForScreenPixels(svg, 3.2))
    .attr("aria-hidden", "true");

  nodes.filter((vegetation) => {
    if (["all", "named"].includes(profile.showLabels)) return true;
    return vegetation.id === state.selectedVegetationId;
  })
    .append("text")
    .attr("dy", "0.34em")
    .text((vegetation) => plantById(state, vegetation.plantId)?.name || (vegetation.kind === "tree" ? "unidentified tree" : vegetation.canopyClass));

  nodes.append("title")
    .text((vegetation) => {
      const crown = vegetationCanopyEllipse(vegetation);
      return [
        vegetation.name,
        plantById(state, vegetation.plantId)?.name || vegetation.identificationStatus || "taxon unidentified",
        vegetation.kind === "tree" ? `${round(crown.rx * 2 / 12)} × ${round(crown.ry * 2 / 12)} ft derived crown` : `${vegetation.canopyClass} cover`,
        vegetation.heightEstimateFeet ? `estimated height ${round(vegetation.heightEstimateFeet)} ft (${vegetation.heightConfidence || "unknown"} confidence)` : null,
        vegetation.source
      ].filter(Boolean).join("; ");
    });

  bindFeatureHover(nodes, state, "vegetation");

  if (options.editable) nodes.call(drag);
  nodes.on("click", (event, vegetation) => {
    event.stopPropagation();
    svg.node()?.focus({preventScroll: true});
    selectGardenFeature(state, "vegetation", vegetation.id);
    renderAll();
  });
}

function renderPropertyBeds2d(svg, state, renderAll, bedOptions = {}) {
  const options = {editable: false, plantsEditable: false, showPlants: true, selectOnly: false, beds: state.beds, ...bedOptions};
  const viewport = options.viewport || parcelViewportBounds(state);
  const profile = gardenViewProfileForElement(
    viewport,
    svg.node()?.ownerSVGElement || svg.node(),
    gardenInformationContext(state, viewport)
  );
  const pointRadius = localUnitsForScreenPixels(svg, profile.plantMode === "point" ? 2.6 : 5.2);
  const renderedBeds = detailVisibleFeatures(options.beds, viewport, profile, state.activeBedId);
  const bedLayer = svg.append("g")
    .attr("class", "property-bed-layer")
    .attr("data-detail-level", profile.id)
    .attr("clip-path", options.clipPath || null);

  const bedDragOffsets = new Map();
  const bedDrag = d3.drag()
    .on("start", (event, bed) => {
      svg.node()?.focus({preventScroll: true});
      const [x, y] = d3.pointer(event.sourceEvent || event, svg.node());
      bedDragOffsets.set(bed.id, bed.polygon
        ? {
            startX: x,
            startY: y,
            points: bed.polygon.map((point) => [...point])
          }
        : {
            x: bed.x - x,
            y: bed.y - y
          });
      selectGardenFeature(state, "bed", bed.id);
      event.sourceEvent?.stopPropagation();
    })
    .on("drag", (event, bed) => {
      const [x, y] = d3.pointer(event.sourceEvent || event, svg.node());
      const offset = bedDragOffsets.get(bed.id);
      if (bed.polygon) {
        const dx = x - (offset?.startX || x);
        const dy = y - (offset?.startY || y);
        const points = offset?.points || bed.polygon;
        bed.polygon = points.map(([pointX, pointY]) => [pointX + dx, pointY + dy]);
        const box = boundsFromPoints(bed.polygon, 0);
        bed.x = box.x + box.width / 2;
        bed.y = box.y + box.height / 2;
      } else {
        bed.x = x + (offset?.x || 0);
        bed.y = y + (offset?.y || 0);
      }
      state.activeBedId = bed.id;
      renderAll();
    })
    .on("end", (event, bed) => {
      bedDragOffsets.delete(bed.id);
    });

  const plantDragOffsets = new Map();
  const plantDrag = d3.drag()
    .on("start", (event, placement) => {
      svg.node()?.focus({preventScroll: true});
      selectGardenFeature(state, "placement", placement.id);
      const bed = bedForPlacement(state, placement);
      const [x, y] = d3.pointer(event.sourceEvent, svg.node());
      const local = pointToBedLocal(x, y, bed);
      plantDragOffsets.set(placement.id, {
        x: placement.x - local.x,
        y: placement.y - local.y
      });
      event.sourceEvent?.stopPropagation();
    })
    .on("drag", (event, placement) => {
      const bed = bedForPlacement(state, placement);
      const [x, y] = d3.pointer(event.sourceEvent, svg.node());
      const local = pointToBedLocal(x, y, bed);
      const offset = plantDragOffsets.get(placement.id) || {x: 0, y: 0};
      placement.x = clamp(local.x + offset.x, 0, bed.width);
      placement.y = clamp(local.y + offset.y, 0, bed.height);
      placement.rotation = (placement.rotation || 0) + event.dx * 0.002;
      renderAll();
    })
    .on("end", (event, placement) => {
      plantDragOffsets.delete(placement.id);
    });

  const beds = bedLayer.selectAll("g.property-bed")
    .data(renderedBeds, (bed) => bed.id)
    .join("g")
    .attr("class", (bed) => `property-bed${bed.id === state.activeBedId ? " active" : ""}${options.editable ? " layer-editable" : " layer-locked"}`)
    .attr("transform", (bed) => bed.polygon ? null : bedTransform(bed));

  if (options.editable) beds.call(bedDrag);

  bindFeatureHover(beds, state, "bed");

  beds.on("click", (event, bed) => {
    if (state.drawMode === "bed-polygon") return;
    event.stopPropagation();
    selectGardenFeature(state, "bed", bed.id);
    if (!options.editable && !options.plantsEditable) openPlantingWorkspace(state, bed.id);
    renderAll();
  });

  beds.on("dblclick", (event, bed) => {
    if (!options.plantsEditable || state.drawMode === "bed-polygon") return;
    event.preventDefault();
    event.stopPropagation();
    const [x, y] = d3.pointer(event, svg.node());
    const local = pointToBedLocal(x, y, bed);
    if (!isInsideBed(local.x, local.y, bed)) return;
    state.activeBedId = bed.id;
    addPlacement(state, state.selectedPlantId, local.x, local.y);
    openInspector(state, "placement");
    renderAll();
  });

  beds.append("path")
    .attr("class", "bed-selection-backdrop")
    .attr("d", (bed) => bedDisplayPath(bed));

  beds.append("path")
    .attr("class", "bed-outline property-bed-outline")
    .attr("d", (bed) => bedDisplayPath(bed));

  beds.each(function(bed) {
    if (bed.polygon || !profile.showBedGrid) return;
    const group = d3.select(this);
    const rows = group.append("g").attr("class", "grid-layer bed-grid");
    const gridStep = visibleGridStep(bed.width, bed.height, bed.grid, 120);
    for (let x = 0; x <= bed.width; x += gridStep) {
      rows.append("line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", bed.height);
    }
    for (let y = 0; y <= bed.height; y += gridStep) {
      rows.append("line").attr("x1", 0).attr("x2", bed.width).attr("y1", y).attr("y2", y);
    }
  });

  beds.append("text")
    .attr("class", "bed-label")
    .attr("display", (bed) => {
      if (profile.showLabels === "all" || profile.showLabels === "named") return null;
      return bed.id === state.activeBedId ? null : "none";
    })
    .attr("x", (bed) => bed.polygon ? polygonCentroid(bed.polygon)[0] : bed.width / 2)
    .attr("y", (bed) => bed.polygon ? polygonCentroid(bed.polygon)[1] : -6)
    .text((bed) => bed.name);

  beds.each(function(bed) {
    const group = d3.select(this);
    if (bed.polygon || !options.showPlants) return;
    const placements = detailVisiblePlacements(state, placementsForBed(state, bed.id), viewport, profile);
    if (profile.showBedGrid && bed.showSpacing && bed.id === state.activeBedId) {
      group.append("g")
        .attr("class", "spacing-layer")
        .selectAll("circle")
        .data(placements, (d) => d.id)
        .join("circle")
        .attr("class", (d) => placementStatus(d, state).ok ? "spacing-ring" : "spacing-ring warning")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => spacingRadius(plantById(state, d.plantId), bed));
    }

    const plantNodes = group.append("g")
      .attr("class", "plant-layer")
      .selectAll("g")
      .data(placements, (d) => d.id)
      .join("g")
      .attr("class", (d) => {
        const status = placementStatus(d, state);
        return `plant-node${d.id === state.selectedPlacementId ? " selected" : ""}${status.ok ? "" : " warning"}${options.plantsEditable ? " layer-editable" : " layer-locked"}`;
      })
      .attr("transform", (d) => `translate(${d.x},${d.y}) rotate(${((d.rotation || 0) * 180 / Math.PI).toFixed(2)})`);

    if (options.plantsEditable) plantNodes.call(plantDrag);

    bindFeatureHover(plantNodes, state, "placement");

    if (["point", "swatch"].includes(profile.plantMode)) {
      plantNodes.append("circle")
        .attr("class", `plant-lod-symbol plant-lod-${profile.plantMode}`)
        .attr("r", (d) => d.id === state.selectedPlacementId ? pointRadius * 1.45 : pointRadius)
        .attr("fill", (d) => plantById(state, d.plantId)?.leafColor || "#58895d");
      if (profile.plantMode === "swatch") {
        plantNodes.append("text")
          .attr("class", "plant-token plant-lod-token")
          .attr("dy", "0.38em")
          .style("font-size", `${Math.max(pointRadius * 1.05, 2)}px`)
          .text((d) => plantInitials(plantById(state, d.plantId)));
      }
    } else {
      plantNodes.append("path")
        .attr("class", "plant-canopy-halo")
        .attr("d", (d) => plantFootprintPath(plantById(state, d.plantId), d))
        .attr("fill", (d) => plantById(state, d.plantId)?.leafColor || "#58895d");

      plantNodes.each(function(d) {
        renderSizedPlant2d(d3.select(this), state, d);
      });

      plantNodes.append("circle").attr("class", "root-dot").attr("r", 1.4);
      plantNodes.append("text")
        .attr("class", "plant-token")
        .attr("dy", "0.38em")
        .text((d) => plantInitials(plantById(state, d.plantId)));
    }

    plantNodes.on("click", (event, d) => {
      event.stopPropagation();
      svg.node()?.focus({preventScroll: true});
      selectGardenFeature(state, "placement", d.id);
      if(state.viewMode==="garden" && !options.plantsEditable)openPlantingWorkspace(state,d.bedId);
      renderAll();
    });

    plantNodes.on("dblclick", (event, d) => {
      if (!options.plantsEditable) return;
      event.preventDefault();
      event.stopPropagation();
      svg.node()?.focus({preventScroll: true});
      state.activeBedId = d.bedId;
      deletePlacement(state, d.id);
      renderAll();
    });
  });

  // Source observations may be geographically known before anyone has
  // identified the taxon or associated the point with a bed. Render those as
  // neutral GIS observation symbols in the shared garden view. They must not
  // disappear merely because the bed-relative planting renderer cannot yet
  // classify them.
  if (options.showPlants) {
    const observations = detailVisiblePlacements(
      state,
      (state.placements || []).filter((placement) => !placement.bedId && Array.isArray(placement.absoluteLocalPoint)),
      viewport,
      profile
    );
    const observationDragOffsets = new Map();
    const observationDrag = d3.drag()
      .on("start", (event, placement) => {
        const point = placementParcelPosition(state, placement);
        const [x, y] = d3.pointer(event.sourceEvent || event, svg.node());
        observationDragOffsets.set(placement.id, {x: point.x - x, y: point.y - y});
        selectGardenFeature(state, "placement", placement.id);
        event.sourceEvent?.stopPropagation();
      })
      .on("drag", (event, placement) => {
        const [x, y] = d3.pointer(event.sourceEvent || event, svg.node());
        const offset = observationDragOffsets.get(placement.id) || {x: 0, y: 0};
        placement.x = x + offset.x;
        placement.y = y + offset.y;
        placement.absoluteLocalPoint = [placement.x, placement.y];
        renderAll();
      })
      .on("end", (event, placement) => observationDragOffsets.delete(placement.id));
    const observationNodes = bedLayer.append("g")
      .attr("class", "unassigned-observation-layer")
      .selectAll("g")
      .data(observations, (placement) => placement.id)
      .join("g")
      .attr("class", (placement) => `plant-node unassigned-observation${placement.id === state.selectedPlacementId ? " selected" : ""}${options.plantsEditable ? " layer-editable" : " layer-locked"}`)
      .attr("transform", (placement) => {
        const point = placementParcelPosition(state, placement);
        return `translate(${point.x},${point.y})`;
      });
    if (options.plantsEditable) observationNodes.call(observationDrag);
    bindFeatureHover(observationNodes, state, "placement");
    observationNodes.append("circle")
      .attr("class", "plant-lod-symbol plant-observation-symbol")
      .attr("r", (placement) => placement.id === state.selectedPlacementId ? pointRadius * 1.55 : pointRadius * 1.15)
      .attr("fill", (placement) => plantById(state, placement.plantId)?.leafColor || "#d8b35f")
      .attr("stroke", "#26382e")
      .attr("stroke-width", Math.max(1, pointRadius * 0.22))
      .attr("stroke-dasharray", `${Math.max(1, pointRadius * 0.45)} ${Math.max(1, pointRadius * 0.3)}`);
    observationNodes.append("title")
      .text((placement) => `${placement.name || "Unidentified plant observation"}: ${placement.identificationStatus || "taxon and bed unassigned"}`);
    observationNodes.on("click", (event, placement) => {
      event.stopPropagation();
      svg.node()?.focus({preventScroll: true});
      selectGardenFeature(state, "placement", placement.id);
      renderAll();
    });
  }

  if (options.editable) {
    const handleSize = localUnitsForScreenPixels(svg, 34);
    const handleOffset = handleSize / 2;
    beds.append("path")
      .attr("class", "bed-move-target")
      .attr("d", (bed) => bedDisplayPath(bed));

    beds.append("rect")
      .attr("class", "bed-move-handle")
      .attr("x", (bed) => bed.polygon ? polygonCentroid(bed.polygon)[0] - handleOffset : -handleOffset)
      .attr("y", (bed) => bed.polygon ? polygonCentroid(bed.polygon)[1] - handleOffset : -handleOffset)
      .attr("width", handleSize)
      .attr("height", handleSize)
      .attr("rx", Math.max(4, handleSize * 0.14));

    beds.selectAll(".bed-move-target, .bed-move-handle").call(bedDrag);
  }
}

function activeBedCamera(state) {
  state.bedCameras ||= {};
  const bed = activeBed(state);
  const camera = normalizeBedCamera(bed, state.bedCameras[bed.id]);
  state.bedCameras[bed.id] = camera;
  return camera;
}

function planningBearing(state) { return state.viewMode === "bed" ? activeBedCamera(state).bearing : state.viewBearing; }
function planningPitch(state) { return state.viewMode === "bed" ? activeBedCamera(state).pitch : state.viewPitch; }
function setPlanningOrientation(state, bearing, pitch) {
  if (state.viewMode === "bed") Object.assign(activeBedCamera(state), {bearing:normalizeViewBearing(bearing),pitch:normalizeViewPitch(pitch)});
  else {state.viewBearing=normalizeViewBearing(bearing);state.viewPitch=normalizeViewPitch(pitch);}
}
function zoomPlanningViewport(state, factor, anchor = null) {
  if (state.viewMode !== "bed") return zoomParcelViewport(state,factor,anchor);
  const bed=activeBed(state);
  const camera=activeBedCamera(state);
  state.bedCameras[bed.id]=zoomBedCamera(bed,camera,factor,anchor);
}
function panPlanningViewport(state, start, dx, dy, rect) {
  if (state.viewMode !== "bed") {state.parcelViewport=panParcelViewportFromScreenDelta(state,start,dx,dy,rect);return;}
  const scale=Math.max(0.001,Math.min(rect.width/start.width,rect.height/start.height));
  const angle=planningBearing(state)*Math.PI/180, x=-dx/scale, y=-dy/scale;
  const camera=activeBedCamera(state);
  camera.viewport={...start,x:start.x+x*Math.cos(angle)-y*Math.sin(angle),y:start.y+x*Math.sin(angle)+y*Math.cos(angle)};
}
function planViewBounds(state) {
  return state.viewMode === "garden" ? parcelViewportBounds(state) : activeBedCamera(state).viewport;
}

function parcelViewBounds(state) {
  return boundsFromPoints(propertyBoundaryPoints(state), state.parcelBufferInches || 1800);
}

function parcelViewportBounds(state) {
  state.parcelViewport = normalizeParcelViewport(state, state.parcelViewport);
  return state.parcelViewport;
}

function normalizeParcelViewport(state, viewport) {
  const bounds = parcelViewBounds(state);
  if (!viewport || !Number.isFinite(Number(viewport.x)) || !Number.isFinite(Number(viewport.y))) return {...bounds};
  return clampParcelViewport({
    x: Number(viewport.x),
    y: Number(viewport.y),
    width: Number(viewport.width),
    height: Number(viewport.height)
  }, bounds);
}

function clampParcelViewport(viewport, bounds) {
  return clampViewportToExtent(viewport, bounds, {minimumSpan: MIN_GARDEN_VIEW_SPAN_INCHES, panPaddingRatio: 0.5});
}

function zoomParcelViewport(state, factor, anchor = null) {
  const current = parcelViewportBounds(state);
  const bounds = parcelViewBounds(state);
  const point = anchor || {
    x: current.x + current.width / 2,
    y: current.y + current.height / 2
  };
  const nextWidth = current.width * factor;
  const nextHeight = current.height * factor;
  const scaleX = nextWidth / Math.max(1, current.width);
  const scaleY = nextHeight / Math.max(1, current.height);
  state.parcelViewport = clampParcelViewport({
    x: point.x - (point.x - current.x) * scaleX,
    y: point.y - (point.y - current.y) * scaleY,
    width: nextWidth,
    height: nextHeight
  }, bounds);
}

function parcelZoomLevel(state) {
  const bounds = parcelViewBounds(state);
  const viewport = parcelViewportBounds(state);
  return Math.max(1, round(Math.min(bounds.width / viewport.width, bounds.height / viewport.height)));
}

function featureEnvelopePoints(feature) {
  if (Array.isArray(feature?.polygon) && feature.polygon.length >= 3) return feature.polygon;
  const geometry = structureLocalGeometry(feature);
  if (geometry) {
    const points = [];
    const visit = (value) => {
      if (!Array.isArray(value)) return;
      if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
        points.push([Number(value[0]), Number(value[1])]);
        return;
      }
      value.forEach(visit);
    };
    visit(geometry.coordinates);
    if (points.length) return points;
  }
  const width = Math.max(1, Number(feature?.width) || 1);
  const height = Math.max(1, Number(feature?.height) || 1);
  const centerX = Number(feature?.x) || 0;
  const centerY = Number(feature?.y) || 0;
  return [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2]
  ].map(([x, y]) => {
    const point = rotatePoint(x, y, Number(feature?.rotation) || 0);
    return [centerX + point.x, centerY + point.y];
  });
}

function mappedPlanBounds(state) {
  const points = [
    ...(state.beds || []).flatMap(featureEnvelopePoints),
    ...(state.structures || []).flatMap(featureEnvelopePoints),
    ...(state.vegetation || []).flatMap(featureEnvelopePoints),
    ...(state.placements || [])
      .filter((placement) => !placement.bedId && Array.isArray(placement.absoluteLocalPoint))
      .map((placement) => placement.absoluteLocalPoint)
  ];
  return points.length ? boundsFromPoints(points, 0) : parcelViewBounds(state);
}

function expandedViewport(viewport, ratio = 0.4) {
  const padX = viewport.width * ratio;
  const padY = viewport.height * ratio;
  return {
    x: viewport.x - padX,
    y: viewport.y - padY,
    width: viewport.width + padX * 2,
    height: viewport.height + padY * 2
  };
}

function boundsOverlap(first, second) {
  return first.x <= second.x + second.width
    && first.x + first.width >= second.x
    && first.y <= second.y + second.height
    && first.y + first.height >= second.y;
}

function detailVisibleFeatures(features, viewport, profile, selectedId = null) {
  if (!Array.isArray(features) || !["bed", "plant"].includes(profile?.id)) return features || [];
  const padded = expandedViewport(viewport);
  return features.filter((feature) => feature.id === selectedId
    || boundsOverlap(boundsFromPoints(featureEnvelopePoints(feature), 0), padded));
}

function detailVisiblePlacements(state, placements, viewport, profile) {
  placements = visiblePlannedPlacements(placements, state.previewDate);
  if (!["bed", "plant"].includes(profile?.id)) return placements || [];
  const padded = expandedViewport(viewport);
  return (placements || []).filter((placement) => {
    if (placement.id === state.selectedPlacementId) return true;
    const point = placementParcelPosition(state, placement);
    return point.x >= padded.x
      && point.x <= padded.x + padded.width
      && point.y >= padded.y
      && point.y <= padded.y + padded.height;
  });
}

function placementParcelPosition(state, placement) {
  if (!placement?.bedId && Array.isArray(placement?.absoluteLocalPoint)) {
    return {
      x: Number(placement.absoluteLocalPoint[0]) || 0,
      y: Number(placement.absoluteLocalPoint[1]) || 0
    };
  }
  const bed = bedForPlacement(state, placement);
  if (!bed) return {x: 0, y: 0};
  const local = rotatePoint(
    Number(placement.x) - bed.width / 2,
    Number(placement.y) - bed.height / 2,
    bed.rotation || 0
  );
  return {x: bed.x + local.x, y: bed.y + local.y};
}

function selectedFeatureBounds(state) {
  const placement = selectedPlacement(state);
  if (placement) {
    const point = placementParcelPosition(state, placement);
    const plant = plantById(state, placement.plantId);
    const diameter = Math.max(12, Number(plant?.matureDiameter) || Number(plant?.spacing) || 18);
    return {x: point.x - diameter / 2, y: point.y - diameter / 2, width: diameter, height: diameter};
  }
  const selected = state.inspectorMode === "structure"
    ? selectedStructure(state)
    : state.inspectorMode === "vegetation"
    ? selectedVegetation(state)
    : activeBed(state);
  return boundsFromPoints(featureEnvelopePoints(selected), 0);
}

function fitParcelViewport(state, target, paddingRatio = 0.16) {
  const extent = parcelViewBounds(state);
  const current = parcelViewportBounds(state);
  const aspect = current.width / Math.max(1, current.height);
  const fitted = fitViewportToBounds(target, aspect, {
    paddingRatio,
    minimumSpan: MIN_GARDEN_VIEW_SPAN_INCHES
  });
  state.parcelViewport = clampParcelViewport(fitted, extent);
}

function applyParcelViewBox(svgNode, viewport) {
  svgNode.setAttribute("viewBox", `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`);
}

function sharedWorldTransform(state, viewBounds = parcelViewportBounds(state)) {
  const centerX = viewBounds.x + viewBounds.width / 2;
  const centerY = viewBounds.y + viewBounds.height / 2;
  return `rotate(${-normalizeViewBearing(state.viewBearing)} ${centerX} ${centerY})`;
}

function sharedWorldLayer(svgNode) {
  return svgNode?.querySelector?.(".shared-view-world") || svgNode;
}

function pointerInSharedWorld(event, svgNode) {
  return d3.pointer(event, sharedWorldLayer(svgNode));
}

function panParcelViewportFromScreenDelta(state, startViewport, dx, dy, rect) {
  const screenScale = Math.min(
    rect.width / Math.max(1, startViewport.width),
    rect.height / Math.max(1, startViewport.height)
  );
  const screenX = -dx / Math.max(screenScale, 0.001);
  const screenY = -dy / Math.max(screenScale, 0.001);
  const angle = normalizeViewBearing(state.viewBearing) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const worldX = screenX * cos - screenY * sin;
  const worldY = screenX * sin + screenY * cos;
  return clampParcelViewport({
    x: startViewport.x + worldX,
    y: startViewport.y + worldY,
    width: startViewport.width,
    height: startViewport.height
  }, parcelViewBounds(state));
}

function updateSharedWorld(svgNode, state, bounds = parcelViewportBounds(state)) {
  if (!svgNode) return;
  applyParcelViewBox(svgNode, bounds);
  svgNode.querySelector(".shared-view-world")?.setAttribute("transform", sharedWorldTransform(state, bounds));
  const arrow = svgNode.querySelector(".north-arrow");
  if (arrow) {
    const x = Number(arrow.dataset.anchorX);
    const y = Number(arrow.dataset.anchorY);
    arrow.setAttribute("transform", `translate(${x},${y}) rotate(${(state.property?.northDegrees || 0) - normalizeViewBearing(state.viewBearing)})`);
  }
}

function applySharedViewState(refs, state, three) {
  const viewport = parcelViewportBounds(state);
  updateSharedWorld(refs.parcelSvg, state, viewport);
  if (state.viewMode === "garden") updateSharedWorld(refs.planSvg, state, viewport);
  else updateSharedWorld(refs.planSvg, {...state,viewBearing:planningBearing(state)}, planViewBounds(state));
  renderViewNavigation(refs, state);
  if (three) syncThreeCamera(three, state);
}

function renderPlotContext(svg, state, options = {}) {
  const context = svg.append("g").attr("class", `plot-context ${state.viewMode}`);
  // The garden-level 2D plan shares the mapped parcel context with Map and 3D.
  // Keep each exterior ring as its own SVG subpath so detached campus parcels
  // are not joined by an artificial line. Bed detail never calls this renderer.
  const boundaries = propertyBoundaryRings(state);
  const labelPoint = boundsFromPoints(flattenExteriorRings(boundaries), 0);

  if (options.showBoundary !== false) {
    context.append("path")
      .attr("class", "plot-boundary")
      .attr("fill-rule", "evenodd")
      .attr("d", polygonRingsPath(boundaries));

    context.append("text")
      .attr("class", "plot-label")
      .attr("x", labelPoint.x + 10)
      .attr("y", labelPoint.y + 18)
      .text("Garden parcel context");
  }
}

function renderNorthArrow(svg, state, viewBounds = planViewBounds(state)) {
  const bounds = viewBounds;
  const screenUnit = localUnitsForScreenPixels(svg, 1);
  const x = bounds.x + bounds.width - 34 * screenUnit;
  const y = bounds.y + 34 * screenUnit;
  const angle = (state.property?.northDegrees || 0) - normalizeViewBearing(state.viewBearing);
  const arrow = svg.append("g")
    .attr("class", "north-arrow")
    .attr("data-anchor-x", x)
    .attr("data-anchor-y", y)
    .attr("transform", `translate(${x},${y}) rotate(${angle})`);
  arrow.append("line")
    .attr("x1", 0)
    .attr("y1", 14 * screenUnit)
    .attr("x2", 0)
    .attr("y2", -14 * screenUnit);
  arrow.append("path")
    .attr("d", `M 0,${-20 * screenUnit} L ${-6 * screenUnit},${-8 * screenUnit} L ${6 * screenUnit},${-8 * screenUnit} Z`);
  arrow.append("text")
    .attr("y", 27 * screenUnit)
    .style("font-size", `${8 * screenUnit}px`)
    .text("N");
}

function renderParcelImagery(group, state) {
  const property = state.property || PROPERTY_CONTEXT;
  const imagery = activeBasemap(state);
  if (property.imagery?.enabled === false) return;
  const coverage = parcelImageryCoverage({
    property,
    imagery,
    viewport: parcelViewportBounds(state),
    bearing: normalizeViewBearing(state.viewBearing)
  });
  // Fail closed if even minZoom exceeds the explicit budget. Rendering a
  // partial parcel would be misleading, while loading an unbounded mosaic would
  // violate the spatial delivery contract.
  if (!coverage?.budgetSatisfied) return;
  const imageryLayer = group.append("g")
    .attr("class", "parcel-imagery")
    .attr("data-coverage", coverage.coveragePolicy)
    .attr("data-tile-count", coverage.totalTileCount ?? coverage.range.count)
    .attr("data-tile-zoom", coverage.zoom)
    .attr("data-detail-zoom", coverage.detailZoom ?? "none");

  // Paint the complete parcel first, then the optional higher-resolution
  // viewport mosaic. The cache de-duplicates repeat visits and the coverage
  // resolver holds both layers to one explicit per-view tile budget.
  for (const mosaic of coverage.mosaics || [{role: "parcel", range: coverage.range, zoom: coverage.zoom}]) {
    const {range, zoom: z} = mosaic;
    const mosaicLayer = imageryLayer.append("g")
      .attr("class", `parcel-imagery-mosaic parcel-imagery-${mosaic.role}`)
      .attr("data-tile-count", mosaic.tileCount ?? range.count)
      .attr("data-tile-zoom", z);
    for (let y = range.yMin; y <= range.yMax; y += 1) {
      for (let x = range.xMin; x <= range.xMax; x += 1) {
        const tileBounds = tileBoundsLonLat(x, y, z);
        const nw = projectLonLatToLocal(tileBounds.west, tileBounds.north, property);
        const se = projectLonLatToLocal(tileBounds.east, tileBounds.south, property);
        const sourceUrl = xyzTileUrl(imagery.tileUrl, x, y, z);
        const image = mosaicLayer.append("image")
          .attr("x", nw[0])
          .attr("y", nw[1])
          .attr("width", Math.max(1, se[0] - nw[0]))
          .attr("height", Math.max(1, se[1] - nw[1]))
          .attr("opacity", imagery.opacity ?? 1)
          .attr("preserveAspectRatio", "none");
        const svg = group.node().ownerSVGElement;
        loadParcelImage(sourceUrl, () => state.viewPresentation === "map" && svg.contains(image.node())).then((resolvedUrl) => {
          if (!image.node()?.isConnected) return;
          if (resolvedUrl) image.attr("href", resolvedUrl);
          else {
            const notice = image.node().closest(".garden-planner-app")?.querySelector('[data-role="imagery-status"]');
            if (notice) {
              notice.hidden = false;
              notice.textContent = "Some aerial imagery is unavailable. You can continue editing the plan; failed tiles can retry after one minute when the view changes.";
            }
          }
        });
      }
    }
  }
}

function referenceOverlays(state) {
  return Array.isArray(state.property?.referenceOverlays)
    ? state.property.referenceOverlays.filter((overlay) => overlay?.href && overlay?.latLonBox)
    : [];
}

function renderReferenceOverlays(group, state) {
  if (!state.mapSettings.showReferenceOverlay) return;
  const layer = group.append("g")
    .attr("class", "reference-overlay-layer")
    .attr("data-layer", "source-raster");
  for (const overlay of referenceOverlays(state)) {
    let frame;
    try {
      frame = groundOverlayLocalFrame(overlay, state.property || PROPERTY_CONTEXT);
    } catch {
      continue;
    }
    const image = layer.append("image")
      .attr("class", "reference-overlay")
      .attr("data-overlay-id", frame.id)
      .attr("x", frame.x)
      .attr("y", frame.y)
      .attr("width", frame.width)
      .attr("height", frame.height)
      .attr("href", frame.href)
      .attr("opacity", state.mapSettings.referenceOverlayOpacity)
      .attr("preserveAspectRatio", "none")
      .attr("transform", `rotate(${frame.svgRotation} ${frame.center[0]} ${frame.center[1]})`)
      .attr("pointer-events", "none");
    image.append("title").text(`${frame.name} · georeferenced source evidence, not authoritative geometry`);
  }
}

function projectedSourceEvidenceGeometry(geometry, property) {
  if (!geometry || !SOURCE_EVIDENCE_GEOMETRY_TYPES.has(geometry.type)) return null;
  const projectPoint = (coordinate) => {
    if (!Array.isArray(coordinate) || !Number.isFinite(Number(coordinate[0])) || !Number.isFinite(Number(coordinate[1]))) return null;
    return lonLatToLocalPoint([Number(coordinate[0]), Number(coordinate[1])], property);
  };
  const projectLine = (coordinates) => (Array.isArray(coordinates) ? coordinates : [])
    .map(projectPoint)
    .filter(Boolean);
  const projectPolygon = (coordinates) => (Array.isArray(coordinates) ? coordinates : [])
    .map(projectLine)
    .filter((ring) => ring.length >= 3);

  if (geometry.type === "Point") {
    const coordinates = projectPoint(geometry.coordinates);
    return coordinates ? {type: "Point", coordinates} : null;
  }
  if (geometry.type === "MultiPoint") {
    const coordinates = (Array.isArray(geometry.coordinates) ? geometry.coordinates : [])
      .map(projectPoint)
      .filter(Boolean);
    return coordinates.length ? {type: "MultiPoint", coordinates} : null;
  }
  if (geometry.type === "LineString") {
    const coordinates = projectLine(geometry.coordinates);
    return coordinates.length >= 2 ? {type: "LineString", coordinates} : null;
  }
  if (geometry.type === "Polygon") {
    const coordinates = projectPolygon(geometry.coordinates);
    return coordinates.length ? {type: "Polygon", coordinates} : null;
  }
  if (geometry.type === "MultiLineString") {
    const coordinates = (Array.isArray(geometry.coordinates) ? geometry.coordinates : [])
      .map(projectLine)
      .filter((line) => line.length >= 2);
    return coordinates.length ? {type: "MultiLineString", coordinates} : null;
  }
  const coordinates = (Array.isArray(geometry.coordinates) ? geometry.coordinates : [])
    .map(projectPolygon)
    .filter((polygon) => polygon.length);
  return coordinates.length ? {type: "MultiPolygon", coordinates} : null;
}

function sourceEvidenceFeatureTitle(collection, feature) {
  const properties = feature?.properties || {};
  const classification = properties.classification && typeof properties.classification === "object"
    ? properties.classification
    : {};
  const source = collection?.properties?.source || {};
  const parts = [
    properties.name || feature?.id || "Imported source feature",
    properties.objectType || properties.vf_category || "unclassified",
    classification.confidence,
    properties.__vfEvidenceSourceTitle || source.title || collection?.properties?.name,
    ...(properties.__vfEvidenceIssueCodes?.length ? [`review: ${properties.__vfEvidenceIssueCodes.join(", ")}`] : [])
  ].filter(Boolean);
  return `${parts.join(" · ")} · review-only evidence (not editable plan geometry)`;
}

function renderGardenSourceEvidence(group, state) {
  if (!gardenSourceEvidenceVisible(state)) return;
  const collection = gardenSourceEvidenceCollection(state);
  const property = state.property || PROPERTY_CONTEXT;
  const layer = group.append("g")
    .attr("class", "source-evidence-layer")
    .attr("data-layer", "review-source-vectors")
    .attr("data-review-only", "true");
  const pointRadius = localUnitsForScreenPixels(group, 5);

  for (const feature of collection.features) {
    const geometry = projectedSourceEvidenceGeometry(feature.geometry, property);
    if (!geometry) continue;
    const objectType = slugify(feature.properties?.objectType || feature.properties?.vf_category || "unclassified");
    const evidenceKind = feature.properties?.__vfEvidenceKind === "staged-import" ? " source-evidence-staged" : "";
    const commonClass = `source-evidence-feature source-evidence-${objectType}${evidenceKind}`;
    let node;

    if (geometry.type === "Point") {
      const [x, y] = geometry.coordinates;
      node = layer.append("circle")
        .attr("class", `${commonClass} source-evidence-point`)
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", pointRadius);
    } else if (geometry.type === "MultiPoint") {
      node = layer.append("g").attr("class", `${commonClass} source-evidence-multipoint`);
      node.selectAll("circle")
        .data(geometry.coordinates)
        .join("circle")
        .attr("class", "source-evidence-point")
        .attr("cx", (point) => point[0])
        .attr("cy", (point) => point[1])
        .attr("r", pointRadius);
    } else if (geometry.type === "LineString" || geometry.type === "MultiLineString") {
      const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
      node = layer.append("path")
        .attr("class", `${commonClass} source-evidence-line`)
        .attr("d", lines.map((line) => pointsPath(line)).join(" "));
    } else {
      const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
      node = layer.append("path")
        .attr("class", `${commonClass} source-evidence-area`)
        .attr("fill-rule", "evenodd")
        .attr("d", polygons.map((polygon) => polygonRingsPath(polygon)).join(" "));
    }

    node
      .attr("data-source-feature-id", String(feature.id || ""))
      .attr("data-object-type", feature.properties?.objectType || feature.properties?.vf_category || "unclassified")
      .attr("vector-effect", "non-scaling-stroke");
    node.append("title").text(sourceEvidenceFeatureTitle(collection, feature));
  }
}

function renderDraftBedPolygon(svg, state) {
  const points = state.draftBedPoints || [];
  if (!points.length) return;
  const layer = svg.append("g").attr("class", "draft-bed-layer");
  layer.append("path")
    .attr("class", "draft-bed-polygon")
    .attr("d", pointsPath(points, points.length >= 3));
  layer.selectAll("circle")
    .data(points)
    .join("circle")
    .attr("class", "draft-bed-point")
    .attr("cx", (point) => point[0])
    .attr("cy", (point) => point[1])
    .attr("r", 18);
  layer.append("text")
    .attr("class", "draft-bed-label")
    .attr("x", points[points.length - 1][0] + 28)
    .attr("y", points[points.length - 1][1] - 24)
    .text(points.length >= 3 ? "Enter or Finish polygon" : "Click parcel corners");
}

function renderParcelAttribution(svg, state, viewBounds = parcelViewBounds(state)) {
  const imagery = activeBasemap(state);
  const bounds = viewBounds;
  const screenUnit = localUnitsForScreenPixels(svg, 1);
  const conceptPlan = state.property?.spatialStatus === "concept";
  const imageryLabel = conceptPlan
    ? "Reference concept · not parcel aligned"
    : state.mapSettings.showImagery
    ? imagery?.attribution || imagery?.name || "Imagery"
    : "Imagery hidden";
  svg.append("text")
    .attr("class", "parcel-attribution")
    .attr("x", bounds.x + 12 * screenUnit)
    .attr("y", bounds.y + bounds.height - 12 * screenUnit)
    .style("font-size", `${10 * screenUnit}px`)
    .style("stroke-width", `${2.2 * screenUnit}px`)
    .text(conceptPlan
      ? imageryLabel
      : `${imageryLabel} | Parcel: MassGIS FY${state.property?.parcel?.attributes?.FY || ""}`);
}

function polygonPath(points) {
  if (!Array.isArray(points) || !points.length) return "";
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function samePoint(first, second) {
  return Array.isArray(first)
    && Array.isArray(second)
    && first[0] === second[0]
    && first[1] === second[1];
}

function polygonRingsPath(rings) {
  return (Array.isArray(rings) ? rings : [])
    .map((ring) => polygonPath(ring))
    .filter(Boolean)
    .join(" ");
}

function pointsPath(points, closed = false) {
  if (!Array.isArray(points) || !points.length) return "";
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")}${closed ? " Z" : ""}`;
}

function boundsFromPoints(points, pad = 0) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2};
}

function boundsFromObjects(objects, pad = 0) {
  const points = objects.flatMap((item) => [
    [item.x - item.width / 2, item.y - item.height / 2],
    [item.x + item.width / 2, item.y + item.height / 2]
  ]);
  return boundsFromPoints(points.length ? points : PROPERTY_CONTEXT.boundary, pad);
}

function hullAroundObjects(objects, pad = 0) {
  const bounds = boundsFromObjects(objects, pad);
  return [
    [bounds.x, bounds.y],
    [bounds.x + bounds.width, bounds.y],
    [bounds.x + bounds.width, bounds.y + bounds.height],
    [bounds.x, bounds.y + bounds.height]
  ];
}

function bedTransform(bed) {
  return `translate(${bed.x},${bed.y}) rotate(${bed.rotation || 0}) translate(${-bed.width / 2},${-bed.height / 2})`;
}

function bedDisplayPath(bed) {
  return bed.polygon ? polygonPath(bed.polygon) : bedOutlinePath(bed.width, bed.height);
}

function updateBedSize(bed, changes = {}) {
  const nextWidth = Math.max(24, Number(changes.width) || bed.width || 96);
  const nextHeight = Math.max(18, Number(changes.height) || bed.height || 48);
  if (bed.polygon) {
    resizePolygonBed(bed, nextWidth, nextHeight);
  } else {
    resizeRectangularBed(bed, nextWidth, nextHeight);
  }
  bed.safeMargin = clamp(Number(bed.safeMargin) || 0, 0, bedSafeMarginMax(bed));
}

function resizeRectangularBed(bed, width, height) {
  const anchor = rotatePoint(-bed.width / 2, -bed.height / 2, bed.rotation || 0);
  const topLeft = {x: bed.x + anchor.x, y: bed.y + anchor.y};
  const centerOffset = rotatePoint(width / 2, height / 2, bed.rotation || 0);
  bed.width = width;
  bed.height = height;
  bed.x = topLeft.x + centerOffset.x;
  bed.y = topLeft.y + centerOffset.y;
}

function resizePolygonBed(bed, width, height) {
  const bounds = boundsFromPoints(bed.polygon, 0);
  const scaleX = width / Math.max(1, bounds.width);
  const scaleY = height / Math.max(1, bounds.height);
  bed.polygon = bed.polygon.map(([x, y]) => [
    bounds.x + (x - bounds.x) * scaleX,
    bounds.y + (y - bounds.y) * scaleY
  ]);
  syncPolygonBedFrame(bed);
}

function moveBedTo(bed, x, y) {
  const nextX = Number.isFinite(x) ? x : bed.x;
  const nextY = Number.isFinite(y) ? y : bed.y;
  const dx = nextX - bed.x;
  const dy = nextY - bed.y;
  if (bed.polygon) {
    bed.polygon = bed.polygon.map(([pointX, pointY]) => [pointX + dx, pointY + dy]);
  }
  bed.x = nextX;
  bed.y = nextY;
}

function rotateBedTo(bed, rotation) {
  const nextRotation = Number(rotation) || 0;
  if (bed.polygon) {
    const delta = nextRotation - (bed.rotation || 0);
    bed.polygon = bed.polygon.map(([x, y]) => {
      const rotated = rotatePoint(x - bed.x, y - bed.y, delta);
      return [bed.x + rotated.x, bed.y + rotated.y];
    });
    syncPolygonBedFrame(bed, {preserveRotation: true});
  }
  bed.rotation = nextRotation;
}

function syncPolygonBedFrame(bed, options = {}) {
  if (!Array.isArray(bed.polygon) || bed.polygon.length < 3) return;
  const bounds = boundsFromPoints(bed.polygon, 0);
  bed.x = bounds.x + bounds.width / 2;
  bed.y = bounds.y + bounds.height / 2;
  bed.width = Math.max(24, bounds.width);
  bed.height = Math.max(18, bounds.height);
  if (!options.preserveRotation) bed.rotation = Number(bed.rotation) || 0;
}

function bedSafeMarginMax(bed) {
  return Math.max(1, Math.min(Number(bed.width) || 96, Number(bed.height) || 48) / 2 - 1);
}

function rotatePoint(x, y, degrees = 0) {
  const angle = degrees * Math.PI / 180;
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  };
}

function mapLocalGeometryCoordinates(value, mapper) {
  if (!Array.isArray(value)) return value;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    const [x, y] = mapper(Number(value[0]), Number(value[1]));
    return [x, y, ...value.slice(2)];
  }
  return value.map((child) => mapLocalGeometryCoordinates(child, mapper));
}

function structureLocalGeometry(structure) {
  const geometry = structure?.localGeometry;
  const isPosition = (position) => Array.isArray(position)
    && position.length >= 2
    && Number.isFinite(position[0])
    && Number.isFinite(position[1]);
  if (!geometry || !Array.isArray(geometry.coordinates)) return null;
  if (geometry.type === "Point") return isPosition(geometry.coordinates) ? geometry : null;
  if (geometry.type === "LineString") {
    return geometry.coordinates.length >= 2 && geometry.coordinates.every(isPosition) ? geometry : null;
  }
  if (geometry.type === "Polygon") {
    const valid = geometry.coordinates.length > 0 && geometry.coordinates.every((ring) => (
      Array.isArray(ring) && ring.length >= 4 && ring.every(isPosition)
    ));
    return valid ? geometry : null;
  }
  return null;
}

function transformStructureLocalGeometry(structure, mapper) {
  const geometry = structureLocalGeometry(structure);
  if (!geometry) return;
  structure.localGeometry = {
    ...geometry,
    coordinates: mapLocalGeometryCoordinates(geometry.coordinates, mapper)
  };
}

function moveStructureTo(structure, x, y) {
  const nextX = Number.isFinite(x) ? x : structure.x;
  const nextY = Number.isFinite(y) ? y : structure.y;
  const dx = nextX - structure.x;
  const dy = nextY - structure.y;
  transformStructureLocalGeometry(structure, (pointX, pointY) => [pointX + dx, pointY + dy]);
  structure.x = nextX;
  structure.y = nextY;
}

function resizeStructureTo(structure, width, height) {
  const nextWidth = clamp(Number(width) || structure.width, 12, MAX_SITE_FEATURE_SPAN_INCHES);
  const nextHeight = clamp(Number(height) || structure.height, 12, MAX_SITE_FEATURE_SPAN_INCHES);
  const scaleX = nextWidth / Math.max(1, structure.width);
  const scaleY = nextHeight / Math.max(1, structure.height);
  transformStructureLocalGeometry(structure, (pointX, pointY) => {
    const local = rotatePoint(pointX - structure.x, pointY - structure.y, -(structure.rotation || 0));
    const world = rotatePoint(local.x * scaleX, local.y * scaleY, structure.rotation || 0);
    return [structure.x + world.x, structure.y + world.y];
  });
  structure.width = nextWidth;
  structure.height = nextHeight;
}

function rotateStructureTo(structure, rotation) {
  const nextRotation = Number(rotation) || 0;
  const delta = nextRotation - (structure.rotation || 0);
  transformStructureLocalGeometry(structure, (pointX, pointY) => {
    const rotated = rotatePoint(pointX - structure.x, pointY - structure.y, delta);
    return [structure.x + rotated.x, structure.y + rotated.y];
  });
  structure.rotation = nextRotation;
}

function localGeometryInStructureFrame(structure) {
  const geometry = structureLocalGeometry(structure);
  if (!geometry) return null;
  return {
    ...geometry,
    coordinates: mapLocalGeometryCoordinates(geometry.coordinates, (pointX, pointY) => {
      const point = rotatePoint(pointX - structure.x, pointY - structure.y, -(structure.rotation || 0));
      return [point.x, point.y];
    })
  };
}

function polygonCentroid(points) {
  if (!Array.isArray(points) || points.length < 3) return [0, 0];
  const centroid = d3.polygonCentroid(points);
  if (centroid.every(Number.isFinite)) return centroid;
  const bounds = boundsFromPoints(points, 0);
  return [bounds.x + bounds.width / 2, bounds.y + bounds.height / 2];
}

function pointToBedLocal(x, y, bed) {
  const angle = -(bed.rotation || 0) * Math.PI / 180;
  const dx = x - bed.x;
  const dy = y - bed.y;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle) + bed.width / 2,
    y: dx * Math.sin(angle) + dy * Math.cos(angle) + bed.height / 2
  };
}

function bedAtPoint(state, x, y) {
  return state.beds.find((bed) => {
    if (bed.polygon) return d3.polygonContains(bed.polygon, [x, y]);
    const point = pointToBedLocal(x, y, bed);
    return isInsideBed(point.x, point.y, bed);
  }) || null;
}

function localBoundaryRings(boundary) {
  if (!Array.isArray(boundary) || !boundary.length) return [];
  const first = boundary[0];
  if (Array.isArray(first) && Number.isFinite(first[0]) && Number.isFinite(first[1])) {
    return [boundary];
  }
  return boundary.filter((ring) => Array.isArray(ring) && ring.length);
}

function propertyBoundaryRings(state) {
  const property = state.property || PROPERTY_CONTEXT;
  if (property.spatialStatus === "concept") {
    const conceptRings = localBoundaryRings(property.boundary);
    if (conceptRings.length) return conceptRings;
  }
  const projectedRings = parcelExteriorRings(property.parcel?.geometry)
    .map((ring) => ring.map(([lon, lat]) => projectLonLatToLocal(lon, lat, property)));
  if (projectedRings.length) return projectedRings;
  const fallbackRings = localBoundaryRings(property.boundary);
  return fallbackRings.length ? fallbackRings : [PROPERTY_CONTEXT.boundary];
}

function propertyBoundaryPoints(state) {
  return flattenExteriorRings(propertyBoundaryRings(state));
}

function polygonAreaSqFt(points) {
  return Math.abs(d3.polygonArea(points || [])) / 144;
}

function polygonRingsAreaSqFt(rings) {
  return exteriorRingsArea(rings) / 144;
}

function parcelBasemaps(state) {
  const basemaps = state.property?.imagery?.basemaps || PROPERTY_CONTEXT.imagery.basemaps || [];
  return basemaps.length ? basemaps : [state.property?.imagery || PROPERTY_CONTEXT.imagery];
}

function activeBasemap(state) {
  const basemaps = parcelBasemaps(state);
  const id = normalizeBasemapId(state, state.basemapId || state.property?.imagery?.activeBasemapId);
  return basemaps.find((basemap) => basemap.id === id) || basemaps[0] || PROPERTY_CONTEXT.imagery;
}

function projectLonLatToLocal(lon, lat, property = PROPERTY_CONTEXT) {
  return lonLatToLocalPoint([lon, lat], property);
}

function projectLocalToLonLat(x, y, property = PROPERTY_CONTEXT) {
  return localPointToLonLat([x, y], property);
}

function renderSizedPlant2d(group, state, placement) {
  const plant=plantById(state,placement.plantId),size=plannedSize(placement,state.previewDate);
  group.attr('data-size-scale',size.scale);
  if(size.scale<1)group.append('path').attr('class','mature-size-outline').attr('d',plantFootprintPath(plant,placement)).attr('fill','none').attr('stroke','currentColor').attr('stroke-dasharray','3 3').attr('stroke-width',.5).attr('opacity',.5).style('pointer-events','none');
  const symbol=group.append('g').attr('class','planned-size-symbol').attr('transform',`scale(${size.scale})`);
  symbol.append('path').attr('class','plant-canopy-halo').attr('d',plantFootprintPath(plant,placement)).attr('fill',plant?.leafColor||'#58895d');
  render2dLeaves(symbol,plant,placement,false);
  if(placement.sizeScenario)group.append('title').text(`Planned size: ${Math.round(size.scale*100)}% of mature dimensions. Geometric scenario, not observed growth.`);
}

function render2dLeaves(group, plant, placement, ghost) {
  if (!plant) return;
  const leaves = leafInstances(plant, placement);
  const leafGroup = group.append("g").attr("class", "leaf-layer");

  leafGroup.selectAll("path")
    .data(leaves)
    .join("path")
    .attr("class", (leaf) => `leaf-shape leaf-${leaf.type}`)
    .attr("d", (leaf) => leafPath2d(leaf.type, leaf.length, leaf.width, leaf.seed))
    .attr("transform", (leaf) => `translate(${round(leaf.x)},${round(leaf.y)}) rotate(${round(leaf.rotation * 180 / Math.PI)})`)
    .attr("fill", (leaf) => leaf.color)
    .attr("fill-opacity", (leaf) => ghost ? 0.34 : leaf.opacity)
    .attr("stroke-opacity", ghost ? 0.42 : 0.78);

  if (!ghost) {
    leafGroup.selectAll("line")
      .data(leaves.filter((_, index) => index % 2 === 0))
      .join("line")
      .attr("class", "leaf-vein")
      .attr("x1", (leaf) => round(leaf.x - Math.cos(leaf.rotation) * leaf.length * 0.2))
      .attr("y1", (leaf) => round(leaf.y - Math.sin(leaf.rotation) * leaf.length * 0.2))
      .attr("x2", (leaf) => round(leaf.x + Math.cos(leaf.rotation) * leaf.length * 0.34))
      .attr("y2", (leaf) => round(leaf.y + Math.sin(leaf.rotation) * leaf.length * 0.34));
  }
}

function gardenReferenceAssetHref(referenceAssets, source) {
  const assetId = source?.archive?.renderAssetId;
  const assetUrl = assetId ? referenceAssets?.[assetId] : null;
  if (!assetUrl) return "";
  const fragment = String(source.archive?.fragment || "").replace(/^#/, "");
  return `${String(assetUrl).split("#")[0]}${fragment ? `#${fragment}` : ""}`;
}

function gardenReferenceSourceRecords(reference, state) {
  const sourceLinks = Array.isArray(reference?.sources)
    ? reference.sources
    : (state.property?.parcel?.attributes?.MAP_PAR_ID || state.property?.parcel?.attributes?.PROP_ID)
    ? [{id: "source:massgis-parcels"}]
    : [];
  return sourceLinks.map((sourceLink) => {
    const source = gardenReferenceSourceById(sourceLink.id) || {};
    return {
      ...sourceLink,
      ...source,
      title: source.title || sourceLink.label || sourceLink.id,
      originalUrl: source.originalUrl || source.url || sourceLink.url || ""
    };
  });
}

function gardenReferenceResourceKind(source) {
  const sourceType = String(source?.sourceType || "").toLowerCase();
  if (/(map|plan|tour|schematic)/.test(sourceType)) return {id: "plan", label: "Plan / map / schematic"};
  if (/(dataset|aerial|imagery)/.test(sourceType)) return {id: "dataset", label: "Dataset / imagery"};
  return {id: "website", label: "Website / article"};
}

function gardenInformationResourceMarkup(source, referenceAssets) {
  const localHref = gardenReferenceAssetHref(referenceAssets, source);
  const resourceKind = gardenReferenceResourceKind(source);
  const preservationDetail = source.archive?.preview
    ? "Local source record with a preserved visual preview"
    : source.archive?.status === "private-research-copy"
    ? "Local cited-data record · research copy preserved"
    : source.archive?.status === "local-data-and-record"
    ? "Local data and source record"
    : "Local source record";
  const preservationLabel = source.archive?.preview
    ? "Local preview & record"
    : source.archive?.status === "local-data-and-record"
    ? "Local data record"
    : "Local record";
  return `
    <article class="garden-information-resource garden-information-resource-${escapeHtml(resourceKind.id)}">
      <div class="garden-information-resource-heading">
        <span>${escapeHtml(resourceKind.label)}</span>
        <strong>${escapeHtml(source.title)}</strong>
        <small>${escapeHtml(source.publisher || titleCase(source.sourceType || "Public source"))}${source.retrievedAt ? ` · retrieved ${escapeHtml(source.retrievedAt)}` : ""}</small>
      </div>
      ${source.summary ? `<p>${escapeHtml(source.summary)}</p>` : ""}
      <div class="garden-information-resource-links">
        ${localHref
          ? `<a class="local-reference-link" href="${escapeHtml(localHref)}" target="_blank" rel="noopener" title="${escapeHtml(preservationDetail)}">${escapeHtml(preservationLabel)} ↗</a>`
          : `<span class="local-reference-unavailable">Local record unavailable</span>`}
        ${source.originalUrl
          ? `<a href="${escapeHtml(source.originalUrl)}" target="_blank" rel="noopener noreferrer">Authoritative original ↗</a>`
          : ""}
      </div>
    </article>
  `;
}

function renderGardenInformationCard(refs, state, referenceAssets = {}, options = {}) {
  const card = refs.gardenInformationCard;
  if (!card) return;
  const workspace = activeParcelWorkspace(state);
  const property = state.property || PROPERTY_CONTEXT;
  const reference = gardenReferenceById(state.activeParcelId) || property.reference || null;
  const isDerived = reference?.status === "derived";
  const mapping = reference?.mapping || null;
  const calibration = mapping?.layoutCalibration || null;
  const parcel = property.parcel?.attributes || {};
  const parcelAcreage = Number(reference?.parcelAcreage ?? parcel.LOT_SIZE ?? property.acreage);
  const campusAcreage = Number(reference?.campusAcreage);
  const parcelId = mapping?.parcelId || parcel.MAP_PAR_ID || parcel.PROP_ID || "";
  const parcelFiscalYear = mapping?.parcelFiscalYear || parcel.FY || "";
  const sourceRecords = gardenReferenceSourceRecords(reference, state);
  const activeName = workspace?.name || property.name || reference?.name || "Garden";
  const location = reference
    ? [reference.town, reference.county || reference.region].filter(Boolean).join(", ")
    : property.spatialStatus === "concept" ? "Custom concept canvas" : "Custom mapped garden";
  const kind = reference?.kind || (property.spatialStatus === "concept" ? "User-created garden" : "User-mapped garden");
  const planningFocus = reference?.planningFocus || property.aspect || "Editable garden plan";
  const summary = reference?.summary || (property.spatialStatus === "concept"
    ? "An editable garden workspace awaiting a parcel or other geographic reference."
    : "An editable garden workspace anchored to geographic parcel data supplied through the planner.");
  const lineage = isDerived
    ? `Editable copy of ${reference.name || "a public garden reference"}`
    : reference ? "Bundled public-garden reference" : "Project workspace";
  const parcelFact = Number.isFinite(parcelAcreage) && parcelAcreage > 0
    ? `${round(parcelAcreage)} acres${parcelId ? ` · parcel ${parcelId}` : ""}${parcelFiscalYear ? ` · FY${parcelFiscalYear}` : ""}`
    : parcelId ? `Parcel ${parcelId}${parcelFiscalYear ? ` · FY${parcelFiscalYear}` : ""}` : "No parcel connected";
  const campusFact = Number.isFinite(campusAcreage) && campusAcreage > 0
    ? `${round(campusAcreage)} acres described by the garden`
    : "Not separately reported";
  const layoutFact = mapping
    ? `${titleCase(mapping.layoutStatus || "reference")} · ${titleCase(mapping.confidence || "unknown")} parcel confidence`
    : property.spatialStatus === "concept" ? "Editable concept · not georeferenced" : "Editable mapped workspace";
  const workingPlanFact = `${state.beds?.length || 0} beds · ${state.placements?.length || 0} plantings · ${state.structures?.length || 0} site features · ${state.vegetation?.length || 0} tree / vegetation observations`;
  const sourceLinkedFeatures = [...(state.beds || []), ...(state.structures || []), ...(state.vegetation || [])]
    .filter((feature) => featureSourceReferences(feature).length);
  const numberedSourceLandmarks = new Set(sourceLinkedFeatures
    .flatMap((feature) => featureSourceReferences(feature))
    .map((sourceReference) => Number(sourceReference.mapNumber))
    .filter(Number.isFinite));
  const featureProvenanceFact = numberedSourceLandmarks.size
    ? `${numberedSourceLandmarks.size} numbered visitor-map landmarks linked to ${sourceLinkedFeatures.length} editable feature${sourceLinkedFeatures.length === 1 ? "" : "s"}. Numbered-map positions are interpreted against aerial imagery, not treated as surveyed coordinates.`
    : sourceLinkedFeatures.length
    ? `${sourceLinkedFeatures.length} editable feature${sourceLinkedFeatures.length === 1 ? " has" : "s have"} structured source references.`
    : "No feature-level source references are attached to this working plan.";
  const accuracy = Number(calibration?.estimatedHorizontalAccuracyFeet);

  card.innerHTML = `
    <summary aria-label="Garden information and sources for ${escapeHtml(activeName)}">
      <span class="garden-information-summary-label">${escapeHtml(reference ? "Garden reference" : "Garden record")}</span>
      <span class="garden-information-summary-copy">
        <strong>${escapeHtml(activeName)}</strong>
        <small>${escapeHtml(location)} · ${escapeHtml(lineage)}</small>
      </span>
      <span class="garden-information-summary-action">Information &amp; sources</span>
    </summary>
    <div class="garden-information-body">
      <section class="garden-information-overview">
        <span>${escapeHtml(kind)}</span>
        <strong>${escapeHtml(planningFocus)}</strong>
        <p>${escapeHtml(summary)}</p>
      </section>
      <dl class="garden-information-facts">
        <div><dt>Mapped parcel</dt><dd>${escapeHtml(parcelFact)}</dd></div>
        <div><dt>Published campus</dt><dd>${escapeHtml(campusFact)}</dd></div>
        <div><dt>Layout record</dt><dd>${escapeHtml(layoutFact)}</dd></div>
        <div><dt>Working plan</dt><dd>${escapeHtml(workingPlanFact)}</dd></div>
      </dl>
      <section class="garden-information-calibration">
        <div class="garden-information-section-heading">
          <span>${escapeHtml(calibration ? "Plan alignment" : "Spatial record")}</span>
          ${calibration ? `<small>Revision ${escapeHtml(calibration.revision || 1)}${Number.isFinite(accuracy) ? ` · approximately ${escapeHtml(round(accuracy))} ft horizontal accuracy` : ""}</small>` : ""}
        </div>
        ${calibration ? `
          <strong>${escapeHtml(calibration.target || mapping?.method || "Garden reference alignment")}</strong>
          <p><b>Feature provenance:</b> ${escapeHtml(featureProvenanceFact)}</p>
          ${calibration.reference ? `<p><b>Plan or schematic:</b> ${escapeHtml(calibration.reference)}</p>` : ""}
          ${mapping?.method || calibration.note ? `
            <details class="garden-information-alignment-detail">
              <summary>Method and assumptions</summary>
              ${mapping?.method ? `<p>${escapeHtml(mapping.method)}</p>` : ""}
              ${calibration.note ? `<small>${escapeHtml(calibration.note)}</small>` : ""}
            </details>
          ` : ""}
        ` : `
          <strong>${escapeHtml(property.spatialStatus === "concept" ? "No geographic reference connected" : "Parcel-anchored editable plan")}</strong>
          <p>${escapeHtml(property.source || "This workspace contains project-owned garden geometry and annotations.")}</p>
          <p><b>Feature provenance:</b> ${escapeHtml(featureProvenanceFact)}</p>
        `}
      </section>
      <section class="garden-information-resources" aria-label="Garden reference resources">
        <div class="garden-information-section-heading">
          <span>Referenced resources</span>
          <small>${sourceRecords.length ? `${sourceRecords.length} local record${sourceRecords.length === 1 ? "" : "s"} · original links retained` : "No public source attached"}</small>
        </div>
        <div class="garden-information-resource-grid">
          <article class="garden-information-resource garden-information-resource-local-plan">
            <div class="garden-information-resource-heading">
              <span>Local spatial plan</span>
              <strong>Editable Map, 2D, and 3D interpretation</strong>
              <small>Project-owned geometry · available with this workspace</small>
            </div>
            <p>The garden plan remains renderable and editable independently of publisher websites, maps, and schematics.</p>
            <div class="garden-information-resource-links">
              <button class="local-reference-link" data-action="show-local-garden-plan" type="button">View current plan ↓</button>
            </div>
          </article>
          ${sourceRecords.map((source) => gardenInformationResourceMarkup(source, referenceAssets)).join("")}
        </div>
        ${sourceRecords.length ? "" : `<p class="garden-information-empty">This custom garden has no bundled public reference. Its parcel, features, beds, and annotations remain part of the saved spatial workspace.</p>`}
      </section>
    </div>
  `;
  card.querySelector('[data-action="show-local-garden-plan"]')?.addEventListener("click", () => {
    card.open = false;
    const target = state.viewPresentation === "map"
      ? refs.parcelSvg
      : state.viewPresentation === "3d" ? refs.threeHost : refs.planSvg;
    target?.scrollIntoView?.({behavior: "smooth", block: "start"});
  });
  if (options.autoOpen) card.open = true;
}

function inspectorEditGuardMarkup(state, featureType) {
  const layer = PLANNER_EDIT_LAYER_BY_FEATURE[featureType];
  const layerLabel = plannerEditLayerLabel(layer);
  const activeLayer = plannerEditLayerForTool(state.activeTool);
  const editable = plannerCanEditFeature(state, featureType);
  return `
    <div class="layer-edit-guard ${editable ? "is-editable" : "is-locked"}" data-role="layer-edit-guard">
      <span aria-hidden="true">${editable ? "✎" : "🔒"}</span>
      <span><strong>${editable ? `Editing ${escapeHtml(layerLabel)}` : `${escapeHtml(titleCase(layerLabel))} locked`}</strong>${editable ? "" : `<small>Currently ${escapeHtml(plannerEditLayerLabel(activeLayer))}</small>`}</span>
      ${editable ? "" : `<button data-action="edit-selected-layer" data-feature-type="${escapeHtml(featureType)}" type="button">Edit ${escapeHtml(layerLabel)}</button>`}
    </div>
  `;
}

function bindInspectorEditGuard(container, state, featureType, renderAll) {
  const editable = plannerCanEditFeature(state, featureType);
  if (!editable) {
    container.querySelectorAll("input, select, textarea, .danger-action").forEach((control) => {
      control.disabled = true;
    });
  }
  container.querySelector('[data-action="edit-selected-layer"]')?.addEventListener("click", () => {
    state.activeTool = plannerEditToolForFeature(state, featureType);
    beginExplicitEditing(state);
    if (state.activeTool !== "beds") {
      state.drawMode = null;
      state.draftBedPoints = [];
    }
    renderAll();
  });
}

function syncEditorFields(container, kind, record) {
  for (const input of container.querySelectorAll(`[data-${kind}-field]`)) {
    const value = record[input.dataset[`${kind}Field`]];
    if (input.type === "checkbox") input.checked = value !== false;
    else if (input.value !== String(value ?? "")) input.value = value ?? "";
  }
}

function vegetationProvenanceMarkup(vegetation) {
  const vegetationSourceReference = primaryFeatureSourceReference(vegetation);
  return `${(vegetationSourceReference || vegetation.geometryBasis || vegetation.surveyStatus || vegetation.taxonStatus) ? `
          <dl class="compact-provenance">
            ${vegetationSourceReference ? `<div><dt>Source reference</dt><dd>${escapeHtml(formatFeatureSourceReference(vegetationSourceReference))}${vegetationSourceReference.role ? `<br><small>${escapeHtml(vegetationSourceReference.role)}</small>` : ""}</dd></div>` : ""}
            ${vegetation.geometryBasis ? `<div><dt>Geometry basis</dt><dd>${escapeHtml(vegetation.geometryBasis)}</dd></div>` : ""}
            ${vegetation.surveyStatus ? `<div><dt>Survey status</dt><dd>${escapeHtml(titleCase(vegetation.surveyStatus))}</dd></div>` : ""}
            ${vegetation.taxonStatus ? `<div><dt>Taxon status</dt><dd>${escapeHtml(vegetation.taxonStatus)}</dd></div>` : ""}
            ${vegetation.geometryRepresentation ? `<div><dt>Stored geometry</dt><dd>${escapeHtml(titleCase(vegetation.geometryRepresentation))}${vegetation.kind === "tree" ? " center; crown is derived" : ""}</dd></div>` : ""}
            ${vegetation.crownMeasurementMethod ? `<div><dt>Crown method</dt><dd>${escapeHtml(vegetation.crownMeasurementMethod)} · ${escapeHtml(vegetation.crownConfidence || "unknown")} confidence</dd></div>` : ""}
            ${vegetation.heightEstimateMethod ? `<div><dt>Height method</dt><dd>${escapeHtml(vegetation.heightEstimateMethod)} · ${escapeHtml(vegetation.heightConfidence || "unknown")} confidence</dd></div>` : ""}
          </dl>
        ` : ""}`;
}

function renderInspector(refs, state, renderAll, {preserveEditor = null} = {}) {
  const bed = activeBed(state);
  const plant = selectedPlant(state);
  const placement = selectedPlacement(state);
  const structure = selectedStructure(state);
  const vegetation = selectedVegetation(state);
  const landmark = state.property?.landmark;
  const gardenReference = gardenReferenceById(state.activeParcelId) || state.property?.reference;
  const spatialReference = gardenSpatialReference(state.property);
  const spatialOrigin = spatialReference.origin.coordinates;

  refs.parcelEditor.innerHTML = `
    <div class="parcel-editor">
      <div class="form-grid">
        <label>
          <span>Garden</span>
          <select data-parcel-field="activeParcelId">
            ${(state.parcels || []).map((parcel) => `<option value="${escapeHtml(parcel.id)}" ${parcel.id === state.activeParcelId ? "selected" : ""}>${escapeHtml(parcel.name || "Garden")}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Garden name</span>
          <input data-parcel-field="activeParcelName" type="text" value="${escapeHtml(activeParcelWorkspace(state)?.name || state.property?.name || "Garden")}">
        </label>
      </div>
      <details class="advanced-disclosure">
        <summary>Connect another MassGIS parcel</summary>
        <form class="parcel-search-form" data-role="parcel-search-form">
          <div class="form-grid">
            <label><span>City/town</span><input name="city" type="text" autocomplete="address-level2"></label>
            <label><span>Street no.</span><input name="addrNum" type="text" inputmode="numeric" autocomplete="address-line1"></label>
            <label><span>Street name</span><input name="street" type="text" autocomplete="address-line1"></label>
            <label><span>Parcel ID</span><input name="parcelId" type="text"></label>
          </div>
          <button type="submit">Search parcels</button>
        </form>
        <div class="parcel-search-status">${escapeHtml(state.parcelSearchStatus || "")}</div>
        <div class="parcel-search-results">
          ${(state.parcelSearchResults || []).map((result, index) => `
            <button data-parcel-result="${index}" type="button">
              <span class="bed-option-main"><strong>${escapeHtml(result.label)}</strong><span>${escapeHtml(result.detail)}</span></span>
            </button>
          `).join("")}
        </div>
      </details>
      ${gardenResearch(state.activeParcelId).length ? `<details class="advanced-disclosure"><summary>Planting research &amp; sources</summary><label><input type="checkbox" data-action="illustrative-planting" ${state.illustrativePlanting !== false ? "checked" : ""}> Illustrative 3D planting</label><p>Plant masses are imagined within mapped borders and woodland; they are not measured specimens.</p><p>Area-level records; exact positions and present-day survival remain unverified.</p>${gardenResearch(state.activeParcelId).map(record => `<details><summary>${escapeHtml(record.area)} · ${escapeHtml(record.status)}</summary><p>${escapeHtml(record.summary)}</p>${record.plants.length ? `<p>${record.plants.map(escapeHtml).join(" · ")}</p>` : ""}<p><a href="${escapeHtml(record.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(record.source.title)}</a> · ${escapeHtml(record.source.publishedDate || "publication date unknown")}; reviewed ${escapeHtml(record.source.reviewedDate)}</p></details>`).join("")}<p><a href="https://veggie.farm/content/reference/public-garden-research">Research coverage and capture workflow ↗</a></p></details>` : ""}
      <details class="advanced-disclosure">
        <summary>Context and source details</summary>
        <label><span>Context buffer ft</span><input data-parcel-field="parcelBufferFeet" type="number" min="30" max="600" step="10" value="${round((state.parcelBufferInches || 1800) / 12)}"></label>
        <label><span>Canopy opacity</span><input data-parcel-field="vegetationOpacity" type="range" min="0.12" max="1" step="0.02" value="${state.vegetationOpacity}"></label>
        <dl>
          <div><dt>Spatial data</dt><dd>GeoJSON in WGS 84 (CRS84); local edits are anchored at ${spatialOrigin[1].toFixed(7)}, ${spatialOrigin[0].toFixed(7)} and included in the spatial export.</dd></div>
          <div><dt>Basemap</dt><dd>${escapeHtml(state.property?.imagery?.enabled === false ? "Not available until a parcel is connected" : `${activeBasemap(state)?.name || "MassGIS imagery"} · cached visible tiles`)}</dd></div>
          <div><dt>Sources</dt><dd>${escapeHtml(gardenReference
            ? (gardenReference.sources || []).map((source) => source.label).join("; ")
            : landmark ? `${landmark.mapEdition}; MassGIS parcel and 2025 aerial imagery.` : "MassGIS parcel, aerial, and CIR imagery.")}</dd></div>
          <div><dt>Confidence</dt><dd>${escapeHtml(landmark?.interpretation || "Canopy location is mapped from imagery; species labels are native placeholders until field checked.")}</dd></div>
        </dl>
        <button class="danger-action" data-action="remove-active-parcel" type="button" ${((state.parcels || []).length <= 1) ? "disabled" : ""}>Remove this garden</button>
      </details>
    </div>
  `;

  refs.parcelEditor.querySelectorAll("[data-parcel-field]").forEach((input) => {
    input.addEventListener("change", () => {
      updateParcelField(state, input);
      renderAll();
    });
  });

  refs.parcelEditor.querySelector('[data-role="parcel-search-form"]')?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.parcelSearchStatus = "Searching MassGIS parcels...";
    state.parcelSearchResults = [];
    renderAll();
    try {
      state.parcelSearchResults = await searchMassgisParcels({
        city: form.get("city"),
        addrNum: form.get("addrNum"),
        street: form.get("street"),
        parcelId: form.get("parcelId")
      });
      state.parcelSearchStatus = state.parcelSearchResults.length
        ? `${state.parcelSearchResults.length} parcel candidate${state.parcelSearchResults.length === 1 ? "" : "s"} found`
        : "No MassGIS parcel candidates found";
    } catch (error) {
      state.parcelSearchStatus = `MassGIS search failed: ${error.message}`;
      state.parcelSearchResults = [];
    }
    renderAll();
  });

  refs.parcelEditor.querySelector('[data-action="illustrative-planting"]')?.addEventListener("change", event => {state.illustrativePlanting = event.target.checked; renderAll();});

  refs.parcelEditor.querySelectorAll("[data-parcel-result]").forEach((button) => {
    button.addEventListener("click", () => {
      const result = state.parcelSearchResults?.[Number(button.dataset.parcelResult)];
      if (!result) return;
      addImportedParcelWorkspace(state, result);
      renderAll();
    });
  });

  refs.parcelEditor.querySelector('[data-action="remove-active-parcel"]')?.addEventListener("click", () => {
    const currentName = activeParcelWorkspace(state)?.name || "this garden";
    if (!window.confirm(`Remove ${currentName} from this browser?`)) return;
    removeActiveParcelWorkspace(state, {removeLayouts: true});
    renderAll();
  });

  if (preserveEditor === "bed" && bed) {
    // A change fires while focus moves to the next control. Keep these DOM
    // nodes alive so taps, tabbing, selection and open disclosures survive.
    refs.selectedBed.querySelector(".detail-title strong").textContent = bed.name;
    refs.selectedBed.querySelector('[data-role="bed-area"]').textContent = `${round(bed.width / 12)} x ${round(bed.height / 12)} ft | ${round(bed.width * bed.height / 144)} sq ft`;
    refs.selectedBed.querySelector(".range-field span").textContent = `Spacing density · ${Math.round((bed.crowding || 1) * 100)}%`;
    syncEditorFields(refs.selectedBed, "bed", bed);
  } else if (!bed) {
    refs.selectedBed.innerHTML = `<div class="empty-state">No bed selected</div>`;
  } else {
    const bedSourceReference = primaryFeatureSourceReference(bed);
    refs.selectedBed.innerHTML = `
      <div class="bed-editor">
        ${inspectorEditGuardMarkup(state, "bed")}
        <div class="detail-title">
          <span class="bed-dot"></span>
          <strong>${escapeHtml(bed.name)}</strong>
        </div>
        <label>
          <span>Name</span>
          <input data-bed-field="name" type="text" value="${escapeHtml(bed.name)}">
        </label>
        <button type="button" data-action="plan-inspected-bed">Plan this bed →</button>
        <label>
          <span>Zone</span>
          <input data-bed-field="zone" type="text" value="${escapeHtml(bed.zone || "Garden")}">
        </label>
        <div class="form-grid">
          <label><span>Width in</span><input data-bed-field="width" type="number" min="24" step="6" value="${round(bed.width)}"></label>
          <label><span>Depth in</span><input data-bed-field="height" type="number" min="18" step="6" value="${round(bed.height)}"></label>
        </div>
        <dl>
          <div><dt>Area</dt><dd data-role="bed-area">${round(bed.width / 12)} x ${round(bed.height / 12)} ft | ${round(bed.width * bed.height / 144)} sq ft</dd></div>
          ${bedSourceReference ? `<div><dt>Source reference</dt><dd>${escapeHtml(formatFeatureSourceReference(bedSourceReference))}${bedSourceReference.role ? `<br><small>${escapeHtml(bedSourceReference.role)}</small>` : ""}</dd></div>` : ""}
          ${bed.geometryBasis ? `<div><dt>Geometry basis</dt><dd>${escapeHtml(bed.geometryBasis)}</dd></div>` : ""}
          ${bed.surveyStatus ? `<div><dt>Survey status</dt><dd>${escapeHtml(titleCase(bed.surveyStatus))}</dd></div>` : ""}
        </dl>
        <details class="advanced-disclosure">
          <summary>Spacing and exact placement</summary>
          <div class="form-grid">
            <label><span>Root margin</span><input data-bed-field="safeMargin" type="number" min="0" step="1" value="${round(bed.safeMargin)}"></label>
            <label><span>Grid in</span><input data-bed-field="grid" type="number" min="3" step="1" value="${round(bed.grid)}"></label>
            <label><span>Center X in</span><input data-bed-field="x" type="number" step="1" value="${round(bed.x)}"></label>
            <label><span>Center Y in</span><input data-bed-field="y" type="number" step="1" value="${round(bed.y)}"></label>
          </div>
          <label><span>Rotation °</span><input data-bed-field="rotation" type="number" step="1" value="${round(bed.rotation || 0)}"></label>
          <label class="range-field"><span>Spacing density · ${Math.round((bed.crowding || 1) * 100)}%</span><input data-bed-field="crowding" type="range" min="0.72" max="1.35" step="0.01" value="${bed.crowding || 1}"></label>
          <label class="toggle-control inspector-toggle"><input data-bed-field="showSpacing" type="checkbox" ${bed.showSpacing !== false ? "checked" : ""}><span>Spacing rings</span></label>
        </details>
        <details class="advanced-disclosure">
          <summary>Notes and removal</summary>
          <label><span>Notes</span><textarea data-bed-field="notes" rows="3">${escapeHtml(bed.notes || "")}</textarea></label>
          <button class="danger-action" data-action="delete-bed" type="button">Remove this bed</button>
        </details>
      </div>
    `;

    bindInspectorEditGuard(refs.selectedBed, state, "bed", renderAll);
  const planBedButton=refs.selectedBed.querySelector('[data-action="plan-inspected-bed"]');
  if(planBedButton) planBedButton.onclick=()=>{openPlantingWorkspace(state, bed.id);renderAll();};

    refs.selectedBed.querySelectorAll("[data-bed-field]").forEach((input) => {
      input.addEventListener("change", () => {
        updateBedField(bed, input);
        state.bed = bedControlSnapshot(bed);
        renderAll({preserveEditor: "bed"});
      });
    });

    refs.selectedBed.querySelector('[data-action="delete-bed"]').addEventListener("click", () => {
      const count = placementsForBed(state, bed.id).length;
      if (!window.confirm(`Remove bed “${bed.name}”${count ? ` and its ${count} planting${count === 1 ? "" : "s"}` : ""} from this garden? Other beds will remain unchanged.`)) return;
      deleteBed(state, bed.id);
      state.inspectorOpen = false;
      renderAll();
    });
  }

  if (!structure) {
    refs.selectedStructure.innerHTML = `<div class="empty-state">No structure selected</div>`;
  } else {
    const sourceReferences = featureSourceReferences(structure);
    const sourceReference = sourceReferences[0] || null;
    refs.selectedStructure.innerHTML = `
      <div class="structure-editor">
        ${inspectorEditGuardMarkup(state, "structure")}
        <label>
          <span>Name</span>
          <input data-structure-field="name" type="text" value="${escapeHtml(structure.name)}">
        </label>
        <label>
          <span>Type</span>
          <select data-structure-field="type">
            ${[...new Set([structure.type, ...SITE_FEATURE_TYPES])].map((value) => `<option value="${value}" ${structure.type === value ? "selected" : ""}>${escapeHtml(siteFeatureDefinition(value).label)}</option>`).join("")}
          </select>
        </label>
        <dl class="compact-provenance">
          <div><dt>Source</dt><dd>${escapeHtml(structure.source || "Manual overlay")}</dd></div>
          <div><dt>Confidence</dt><dd>${escapeHtml(structure.confidence || "low")}</dd></div>
          ${sourceReference ? `<div><dt>Source reference</dt><dd>${escapeHtml(formatFeatureSourceReference(sourceReference))}${sourceReference.role ? `<br><small>${escapeHtml(sourceReference.role)}</small>` : ""}</dd></div>` : ""}
          ${structure.geometryBasis ? `<div><dt>Geometry basis</dt><dd>${escapeHtml(structure.geometryBasis)}</dd></div>` : ""}
          ${structure.surveyStatus ? `<div><dt>Survey status</dt><dd>${escapeHtml(titleCase(structure.surveyStatus))}</dd></div>` : ""}
          ${structure.boundaryPolicy ? `<div><dt>Boundary policy</dt><dd>${escapeHtml(titleCase(structure.boundaryPolicy))}</dd></div>` : ""}
        </dl>
        ${structureLocalGeometry(structure) ? `<div data-role="site-geometry-editor">
          <p>Refine path and area vertices against the aerial image. Changes are an interpretation, not a survey.</p>
          ${activeSiteGeometryDraft(state) ? `<p role="status">Preview only. Drag anchors to fit imagery. Select an anchor to add after it or remove it. Arrow keys move 1 ft; Shift moves 1 in. Connected junctions move together.</p>
          <p data-role="site-geometry-error" role="alert"></p>
          <div class="drawer-action-row"><button type="button" data-action="insert-site-anchor">Add anchor after selected</button><button type="button" data-action="remove-site-anchor">Remove selected anchor</button></div>
          <button type="button" data-action="apply-site-geometry">Apply geometry</button>
          <button type="button" data-action="cancel-site-geometry">Cancel geometry edit</button>` : `<button type="button" data-action="edit-site-geometry">Edit map vertices</button>`}
        </div>` : ""}
        <details class="advanced-disclosure">
          <summary>Dimensions and exact placement</summary>
          ${structureLocalGeometry(structure)?.type === "LineString" ? `<label><span>Path / corridor width ft (optional estimate)</span><input data-structure-field="corridorWidthFeet" type="number" min="0.1" max="1000" step="0.5" value="${Number(structure.corridorWidthFeet) > 0 ? structure.corridorWidthFeet : ""}"></label>` : ""}
          <div class="form-grid">
            <label><span>X in</span><input data-structure-field="x" type="number" step="1" value="${round(structure.x)}"></label>
            <label><span>Y in</span><input data-structure-field="y" type="number" step="1" value="${round(structure.y)}"></label>
            <label><span>Width in</span><input data-structure-field="width" type="number" min="12" step="1" value="${round(structure.width)}"></label>
            <label><span>Depth in</span><input data-structure-field="height" type="number" min="12" step="1" value="${round(structure.height)}"></label>
          </div>
          <label><span>Rotation °</span><input data-structure-field="rotation" type="number" step="1" value="${round(structure.rotation || 0)}"></label>
        </details>
        <details class="advanced-disclosure">
          <summary>Notes and removal</summary>
          <label><span>Notes</span><textarea data-structure-field="notes" rows="3">${escapeHtml(structure.notes || "")}</textarea></label>
          <button class="danger-action" data-action="delete-structure" type="button">Remove this structure</button>
        </details>
      </div>
    `;

    bindInspectorEditGuard(refs.selectedStructure, state, "structure", renderAll);
    refs.selectedStructure.querySelector('[data-action="edit-site-geometry"]')?.addEventListener("click", () => {
      if (!plannerCanEditFeature(state, "structure")) return;
      refs.referenceMapInspector?.cancelPick();
      siteGeometryDrafts.set(state, {
        parcelId: state.activeParcelId, featureId: structure.id,
        features: structuredCloneCompat(state.structures), selectedVertex: localSiteGeometryVertices(structure.localGeometry)[0]?.path
      });
      state.drawMode = null;
      state.viewPresentation = "map";
      renderAll();
      refs.parcelSvg.querySelector('[data-site-vertex]')?.focus();
    });
    for(const action of ['insert','remove'])refs.selectedStructure.querySelector(`[data-action="${action}-site-anchor"]`)?.addEventListener('click',()=>{
      const draft=activeSiteGeometryDraft(state);if(!draft)return;
      const result=changeSiteGeometryVertex(draft.features,draft.featureId,draft.selectedVertex||[],action);
      if(result.error){refs.selectedStructure.querySelector('[data-role="site-geometry-error"]').textContent=result.error;return;}
      draft.features=result.features;draft.selectedVertex=result.path;renderAll();
      const index=localSiteGeometryVertices(draft.features.find(f=>f.id===draft.featureId).localGeometry).findIndex(v=>JSON.stringify(v.path)===JSON.stringify(draft.selectedVertex));
      refs.parcelSvg.querySelector(`[data-site-vertex="${index}"]`)?.focus();
    });
    refs.selectedStructure.querySelector('[data-action="cancel-site-geometry"]')?.addEventListener("click", () => {
      siteGeometryDrafts.delete(state);
      renderAll();
      refs.selectedStructure.querySelector('[data-action="edit-site-geometry"]')?.focus();
    });
    refs.selectedStructure.querySelector('[data-action="apply-site-geometry"]')?.addEventListener("click", () => {
      const draft = activeSiteGeometryDraft(state);
      if (!draft || !plannerCanEditFeature(state, "structure")) return;
      const changed = draft.features.filter((feature) => {
        const original = state.structures.find((item) => item.id === feature.id);
        return original && JSON.stringify(original.localGeometry) !== JSON.stringify(feature.localGeometry);
      });
      // Validate the whole connected edit before changing any canonical record.
      for (const feature of changed) {
        const error = localSiteGeometryError(feature.localGeometry);
        if (error) {
          refs.selectedStructure.querySelector('[data-role="site-geometry-error"]').textContent = `${feature.name || "Feature"}: ${error} Adjust the preview or cancel.`;
          return;
        }
      }
      for (const feature of changed) {
        const original = state.structures.find((item) => item.id === feature.id);
        original.geometryEdit = {
          coordinateSpace: "garden-local-inches",
          previousGeometry: structuredCloneCompat(original.localGeometry),
          method: "User-adjusted map vertices; not independently surveyed"
        };
        original.localGeometry = structuredCloneCompat(feature.localGeometry);
        if(Array.isArray(feature.topologyNodeIds))original.topologyNodeIds=[...feature.topologyNodeIds];
        const bounds = boundsFromPoints(featureEnvelopePoints(original), 0);
        Object.assign(original, {x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2,
          width: Math.max(12, bounds.width), height: Math.max(12, bounds.height), rotation: 0,
          confidence: "low", surveyStatus: "unverified", geometryBasis: "User-adjusted aerial interpretation"});
      }
      siteGeometryDrafts.delete(state);
      renderAll();
      refs.selectedStructure.querySelector('[data-action="edit-site-geometry"]')?.focus();
    });
    if (activeSiteGeometryDraft(state)) {
      refs.selectedStructure.querySelectorAll('[data-structure-field], [data-action="delete-structure"]').forEach((input) => {input.disabled = true;});
    }

    refs.selectedStructure.querySelectorAll("[data-structure-field]").forEach((input) => {
      input.addEventListener("change", () => {
        updateStructureField(structure, input);
        renderAll();
      });
    });

    refs.selectedStructure.querySelector('[data-action="delete-structure"]').addEventListener("click", () => {
      deleteStructure(state, structure.id);
      state.inspectorOpen = false;
      renderAll();
    });
  }

  if (preserveEditor === "vegetation" && vegetation) {
    // Keep the edited controls alive while focus moves, as for bed editing.
    syncEditorFields(refs.selectedVegetation, "vegetation", vegetation);
    refs.selectedVegetation.querySelector('[data-role="vegetation-provenance"]').innerHTML = vegetationProvenanceMarkup(vegetation);
  } else if (!vegetation) {
    refs.selectedVegetation.innerHTML = `<div class="empty-state">No vegetation selected</div>`;
  } else {
    refs.selectedVegetation.innerHTML = `
      <div class="vegetation-editor">
        ${inspectorEditGuardMarkup(state, "vegetation")}
        <label>
          <span>Name</span>
          <input data-vegetation-field="name" type="text" value="${escapeHtml(vegetation.name)}">
        </label>
        <label>
          <span>${vegetation.kind === "tree" ? "Tree identity" : "Plant identity"}</span>
          <select data-vegetation-field="plantId">
            <option value="" ${vegetation.plantId ? "" : "selected"}>Unidentified — do not infer species</option>
            ${nativeTreePlants(state).map((item) => `<option value="${item.id}" ${item.id === vegetation.plantId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Feature kind</span>
          <select data-vegetation-field="kind">
            ${["tree", "canopy", "forest", "shrub"].map((value) => `<option value="${value}" ${vegetation.kind === value ? "selected" : ""}>${escapeHtml(titleCase(value))}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Class</span>
          <select data-vegetation-field="canopyClass">
            ${["unknown", "deciduous", "evergreen", "mixed", "shrub"].map((value) => `<option value="${value}" ${vegetation.canopyClass === value ? "selected" : ""}>${escapeHtml(titleCase(value))}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Confidence</span>
          <select data-vegetation-field="confidence">
            ${["high", "medium", "low"].map((value) => `<option ${vegetation.confidence === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </label>
        <div data-role="vegetation-provenance">${vegetationProvenanceMarkup(vegetation)}</div>
        <details class="advanced-disclosure">
          <summary>${vegetation.kind === "tree" ? "Tree center, crown, and height" : "Cover size and exact placement"}</summary>
          <div class="form-grid">
            <label><span>X in</span><input data-vegetation-field="x" type="number" step="1" value="${round(vegetation.x)}"></label>
            <label><span>Y in</span><input data-vegetation-field="y" type="number" step="1" value="${round(vegetation.y)}"></label>
            ${vegetation.kind === "tree" ? `
              <label><span>Crown E–W ft</span><input data-vegetation-field="crownWidthFeet" type="number" min="1" step="0.5" value="${Number.isFinite(Number(vegetation.crownWidthFeet)) ? round(vegetation.crownWidthFeet) : round(vegetation.width / 12)}"></label>
              <label><span>Crown N–S ft</span><input data-vegetation-field="crownDepthFeet" type="number" min="1" step="0.5" value="${Number.isFinite(Number(vegetation.crownDepthFeet)) ? round(vegetation.crownDepthFeet) : round(vegetation.height / 12)}"></label>
              <label><span>Estimated height ft</span><input data-vegetation-field="heightEstimateFeet" type="number" min="1" step="0.5" placeholder="Unknown" aria-label="Estimated height in feet; leave blank if unknown" value="${Number(vegetation.heightEstimateFeet) > 0 ? round(vegetation.heightEstimateFeet) : ""}"></label>
            ` : `
              <label><span>Width in</span><input data-vegetation-field="width" type="number" min="36" step="6" value="${round(vegetation.width)}"></label>
              <label><span>Depth in</span><input data-vegetation-field="height" type="number" min="36" step="6" value="${round(vegetation.height)}"></label>
            `}
          </div>
          <label><span>Rotation °</span><input data-vegetation-field="rotation" type="number" step="1" value="${round(vegetation.rotation || 0)}"></label>
        </details>
        <details class="advanced-disclosure">
          <summary>Notes and removal</summary>
          <label><span>Notes</span><textarea data-vegetation-field="notes" rows="3">${escapeHtml(vegetation.notes || "")}</textarea></label>
          <button class="danger-action" data-action="delete-vegetation" type="button">Remove this vegetation</button>
        </details>
      </div>
    `;

    bindInspectorEditGuard(refs.selectedVegetation, state, "vegetation", renderAll);

    refs.selectedVegetation.querySelectorAll("[data-vegetation-field]").forEach((input) => {
      input.addEventListener("change", () => {
        updateVegetationField(vegetation, input);
        // Changing kind replaces the tree/cover controls; other edits retain them.
        renderAll({preserveEditor: input.dataset.vegetationField === "kind" ? null : "vegetation"});
      });
    });

    refs.selectedVegetation.querySelector('[data-action="delete-vegetation"]').addEventListener("click", () => {
      deleteVegetation(state, vegetation.id);
      state.inspectorOpen = false;
      renderAll();
    });
  }

  refs.selectedPlant.innerHTML = plant ? `
    <div class="detail-stack">
      <div class="detail-title">
        <span class="plant-dot" style="--plant-color:${plant.leafColor || plant.color}"></span>
        <span><strong>${escapeHtml(plant.name)}</strong>${plant.scientificName ? `<em>${escapeHtml(plant.scientificName)}</em>` : ""}</span>
      </div>
      <dl>
        <div><dt>Spacing</dt><dd>${plant.spacing} in roots | ${plant.matureDiameter} in canopy</dd></div>
        <div><dt>Height</dt><dd>${plant.height} in mature</dd></div>
        <div><dt>Sun</dt><dd>${escapeHtml(plant.sun)}</dd></div>
        <div><dt>Soil</dt><dd>${escapeHtml(plant.soil)}</dd></div>
        <div><dt>Water</dt><dd>${escapeHtml(plant.waterStyle)} | ${escapeHtml(plant.waterCadence)}</dd></div>
        <div><dt>Drip</dt><dd>${escapeHtml(plant.emitter)}</dd></div>
        ${plant.group === "Flower" ? `
          <div><dt>Bloom</dt><dd>${escapeHtml(plant.bloomDetail || (plant.bloomSeasons || []).join(", "))}</dd></div>
          <div><dt>Color</dt><dd>${escapeHtml((plant.flowerColors || []).join(", "))}</dd></div>
          <div><dt>Moisture</dt><dd>${escapeHtml((plant.moisture || []).join(" to "))}</dd></div>
          <div><dt>Regional</dt><dd>${plant.nativeToNewEngland ? "Native to New England" : "Formal-garden species"}</dd></div>
          <div><dt>Naumkeag use</dt><dd>${escapeHtml(plant.naumkeagUse || "Condition-matching reference")}</dd></div>
        ` : ""}
      </dl>
      ${plant.group === "Flower" ? `
        <div class="flower-inspector-note">
          <strong>Planning interpretation</strong>
          <p>${escapeHtml(plant.interpretation || "Reference conditions, not a site inventory.")}</p>
          <small>${escapeHtml(plant.geometryBasis || "Verify mature dimensions for the selected cultivar.")}</small>
        </div>
        <div class="flower-inspector-sources">
          ${(plant.sourceIds || []).map((id) => flowerSourceById(id)).filter(Boolean).map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a>`).join("")}
        </div>
      ` : ""}
    </div>
  ` : `<div class="empty-state">No plant selected</div>`;

  if (preserveEditor === "placement" && placement) {
    const status = placementStatus(placement, state);
    const pill = refs.selectedPlacement.querySelector(".status-pill");
    pill.className = `status-pill ${status.ok ? "ok" : "warning"}`;
    pill.textContent = status.ok ? "Spacing ok" : "Needs adjustment";
    refs.selectedPlacement.querySelector(".status-notes").innerHTML = status.messages.map(message => `<span>${escapeHtml(message)}</span>`).join("") || `<span>${escapeHtml(plantById(state, placement.plantId)?.waterCadence || "")}</span>`;
    syncEditorFields(refs.selectedPlacement, "placement", placement);
  } else if (!placement) {
    refs.selectedPlacement.innerHTML = `<div class="empty-state">No placement selected</div>`;
  } else {
    refs.selectedPlacement.querySelector('.placement-editor').append(plannerSizeScenario({placement,canEdit:()=>plannerCanEditFeature(state,'placement'),onChange:()=>renderAll({preserveEditor:'placement'})}));
    const currentPlant = plantById(state, placement.plantId);
    const status = placementStatus(placement, state);
    refs.selectedPlacement.innerHTML = `
      <div class="placement-editor">
        ${inspectorEditGuardMarkup(state, "placement")}
        <div class="status-pill ${status.ok ? "ok" : "warning"}">${status.ok ? "Spacing ok" : "Needs adjustment"}</div>
        <label>
          <span>Plant</span>
          <select data-placement-field="plantId">
            <option value="" ${placement.plantId ? "" : "selected"}>Unidentified observation</option>
            ${state.plants.map((item) => `<option value="${item.id}" ${item.id === placement.plantId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Health</span>
          <select data-placement-field="health">
            ${["starting", "strong", "stressed", "sick", "harvested"].map((value) => `<option ${placement.health === value ? "selected" : ""}>${value}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Planned planting date</span>
          <input data-placement-field="planted" type="date" value="${escapeHtml(placement.planted || "")}">
        </label>
        <label><span>Planned last day in bed (optional)</span><input data-placement-field="plannedUntil" type="date" value="${escapeHtml(placement.plannedUntil || "")}"></label>
        <div class="status-notes">${status.messages.map((message) => `<span>${escapeHtml(message)}</span>`).join("") || `<span>${escapeHtml(currentPlant?.waterCadence || "")}</span>`}</div>
        <details class="advanced-disclosure">
          <summary>${placement.bedId ? "Exact placement" : "Absolute GIS position"}, notes, and removal</summary>
          <div class="form-grid">
            <label><span>X in</span><input data-placement-field="x" type="number" step="1" value="${round(placement.x)}"></label>
            <label><span>Y in</span><input data-placement-field="y" type="number" step="1" value="${round(placement.y)}"></label>
          </div>
          <label><span>Notes</span><textarea data-placement-field="notes" rows="3">${escapeHtml(placement.notes || "")}</textarea></label>
          <button class="danger-action" data-action="delete-placement" type="button">Remove this planting</button>
        </details>
      </div>
    `;

    bindInspectorEditGuard(refs.selectedPlacement, state, "placement", renderAll);

    refs.selectedPlacement.querySelectorAll("[data-placement-field]").forEach((input) => {
      input.addEventListener("change", () => {
        if (updatePlacementField(placement, input, state) === false) return;
        renderAll({preserveEditor: "placement"});
      });
    });

    refs.selectedPlacement.querySelector('[data-action="delete-placement"]').addEventListener("click", () => {
      deletePlacement(state, placement.id);
      state.inspectorOpen = false;
      renderAll();
    });
  }

  const issues = collectSpacingIssues(state);
  refs.spacingCheck.innerHTML = issues.length ? `
    <div class="issue-list">${issues.map((issue) => `<div>${escapeHtml(issue)}</div>`).join("")}</div>
  ` : `<div class="ok-block">All current roots fit the active spacing perimeter.</div>`;

  const zones = irrigationZones(state);
  refs.irrigationZones.innerHTML = zones.length ? `
    <div class="zone-list">
      ${zones.map((zone) => `
        <div class="zone-row">
          <strong>Zone ${escapeHtml(zone.zone)}</strong>
          <span>${zone.count} plants</span>
          <em>${escapeHtml(zone.styles.join(", "))}</em>
          <small>${escapeHtml(zone.emitters.join(" | "))}</small>
        </div>
      `).join("")}
    </div>
  ` : `<div class="empty-state">No irrigation demand yet</div>`;
}

function updatePlacementField(placement, input, state) {
  const field = input.dataset.placementField;
  if (field === "planted" || field === "plannedUntil") {
    const start=field === "planted" ? input.value : placement.planted;
    const end=field === "plannedUntil" ? input.value : placement.plannedUntil;
    input.setCustomValidity(start && end && end < start ? "The planned last day must be on or after planting." : "");
    if (!input.reportValidity()) return false;
  }
  if (field === "x" || field === "y") {
    const bed = bedForPlacement(state, placement);
    placement[field] = Number.parseFloat(input.value) || 0;
    if (bed) {
      placement.x = clamp(placement.x, 0, bed.width);
      placement.y = clamp(placement.y, 0, bed.height);
    } else {
      placement.absoluteLocalPoint = [placement.x, placement.y];
    }
  } else {
    placement[field] = input.value;
  }
}

function updateBedField(bed, input) {
  const field = input.dataset.bedField;
  if (field === "showSpacing") {
    bed.showSpacing = input.checked;
    return;
  }
  if (field === "width" || field === "height") {
    updateBedSize(bed, {[field]: Number.parseFloat(input.value)});
    return;
  }
  if (field === "x" || field === "y") {
    moveBedTo(bed, field === "x" ? Number.parseFloat(input.value) : bed.x, field === "y" ? Number.parseFloat(input.value) : bed.y);
    return;
  }
  if (field === "rotation") {
    rotateBedTo(bed, Number.parseFloat(input.value) || 0);
    return;
  }
  if (field === "safeMargin") {
    bed.safeMargin = clamp(Number.parseFloat(input.value) || 0, 0, bedSafeMarginMax(bed));
    return;
  }
  if (field === "grid") {
    bed.grid = Math.max(3, Number.parseFloat(input.value) || 6);
    return;
  }
  if (field === "crowding") {
    bed.crowding = clamp(Number.parseFloat(input.value) || 1, 0.72, 1.35);
    return;
  }
  bed[field] = input.value;
}

function updateStructureField(structure, input) {
  const field = input.dataset.structureField;
  if (field === "corridorWidthFeet") {
    const width = Number(input.value);
    if (Number.isFinite(width) && width > 0) structure.corridorWidthFeet = clamp(width, 0.1, 1000);
    else delete structure.corridorWidthFeet;
    return;
  }
  if (field === "x" || field === "y") {
    moveStructureTo(
      structure,
      field === "x" ? Number.parseFloat(input.value) : structure.x,
      field === "y" ? Number.parseFloat(input.value) : structure.y
    );
    return;
  }
  if (field === "width" || field === "height") {
    resizeStructureTo(
      structure,
      field === "width" ? Number.parseFloat(input.value) : structure.width,
      field === "height" ? Number.parseFloat(input.value) : structure.height
    );
    return;
  }
  if (field === "rotation") {
    rotateStructureTo(structure, Number.parseFloat(input.value) || 0);
    return;
  }
  structure[field] = input.value;
  if (field === "type" && (!structure.name || structure.name === "Structure")) {
    structure.name = siteFeatureDefinition(input.value).label;
  }
}

function updateParcelField(state, input) {
  const field = input.dataset.parcelField;
  if (field === "activeParcelId") {
    switchActiveParcelWorkspace(state, input.value);
    return;
  }
  if (field === "activeParcelName") {
    renameActiveParcelWorkspace(state, input.value);
    return;
  }
  if (field === "parcelBufferFeet") {
    state.parcelBufferInches = clamp((Number.parseFloat(input.value) || 150) * 12, 360, 7200);
    state.parcelViewport = parcelViewBounds(state);
    return;
  }
  if (field === "showVegetation") {
    state.showVegetation = input.checked;
    state.mapSettings.showVegetation = input.checked;
    return;
  }
  if (field === "vegetationOpacity") {
    state.vegetationOpacity = clamp(Number.parseFloat(input.value) || 0.62, 0.12, 1);
  }
}

function switchActiveParcelWorkspace(state, parcelId) {
  if (!parcelId || parcelId === state.activeParcelId) return;
  syncActiveParcelWorkspace(state);
  const workspace = (state.parcels || []).find((parcel) => parcel.id === parcelId);
  if (!workspace) return;
  applyParcelWorkspace(state, workspace);
  state.viewMode = "garden";
  resetInitialGardenView(state);
  if (isPublicDemo(workspace)) fitParcelViewport(state, mappedPlanBounds(state), 0.12);
  state.layoutName = `${workspace.name || "Garden"} · working`;
  state.parcelSearchStatus = "";
  state.parcelSearchResults = [];
}

function renameActiveParcelWorkspace(state, name) {
  const label = String(name || "").trim() || "Parcel";
  const workspace = activeParcelWorkspace(state);
  if (workspace) workspace.name = label;
  state.property.name = label;
  state.layoutName = `${label} · working`;
}

function removeActiveParcelWorkspace(state, options = {}) {
  if (!Array.isArray(state.parcels) || state.parcels.length <= 1) return;
  const removeId = state.activeParcelId;
  const next = state.parcels.find((parcel) => parcel.id !== removeId);
  state.parcels = state.parcels.filter((parcel) => parcel.id !== removeId);
  if (options.removeLayouts) {
    state.layouts = (state.layouts || []).filter((layout) => (layout.gardenId || layout.activeParcelId) !== removeId);
  }
  if (next) applyParcelWorkspace(state, next);
  state.layoutName = `${next?.name || "Garden"} · working`;
  state.parcelSearchStatus = "";
  state.parcelSearchResults = [];
}

function createBlankGardenProperty(name, id) {
  return sanitizePropertyContext({
    id,
    version: PROPERTY_CONTEXT.version,
    name,
    source: "User-created garden concept stored in this browser.",
    acreage: null,
    units: "inches",
    northDegrees: 0,
    aspect: "Editable garden concept",
    spatialStatus: "concept",
    reference: null,
    landmark: null,
    boundary: [[-900, -700], [900, -700], [900, 700], [-900, 700], [-900, -700]],
    parcel: {
      ...structuredCloneCompat(PROPERTY_CONTEXT.parcel),
      queried: "User-created concept canvas; connect a MassGIS parcel to georeference this garden",
      attributes: {}
    },
    imagery: {
      ...structuredCloneCompat(PROPERTY_CONTEXT.imagery),
      enabled: false,
      name: "Concept canvas",
      attribution: "User-created concept; no parcel imagery"
    },
    importSources: []
  }, {name});
}

function createBlankGardenWorkspace(state, name) {
  syncActiveParcelWorkspace(state);
  const id = uniqueGardenId(state, slugify(name) || "garden");
  const property = createBlankGardenProperty(name, id);
  const bed = normalizeBed({
    id: `${id}-starter-bed`,
    name: "Starter bed",
    zone: "New garden",
    x: 0,
    y: 0,
    width: 96,
    height: 48,
    rotation: 0,
    safeMargin: 6,
    grid: 6,
    crowding: 1,
    showSpacing: true,
    notes: "Move, resize, duplicate, or remove this starter bed."
  });
  const workspace = normalizeParcelWorkspace({
    id,
    name,
    property,
    activeBedId: bed.id,
    beds: [bed],
    structures: [],
    vegetation: [],
    placements: [],
    parcelBufferInches: 360,
    parcelViewport: null
  });
  state.parcels = [...(state.parcels || []), workspace];
  applyParcelWorkspace(state, workspace);
  state.layoutName = `${name} · working`;
  state.toolDrawerOpen = false;
  state.inspectorOpen = false;
}

function duplicateActiveGardenWorkspace(state, name) {
  syncActiveParcelWorkspace(state);
  const source = activeParcelWorkspace(state);
  if (!source) return;
  const id = uniqueGardenId(state, slugify(name) || "garden-copy");
  const copy = structuredCloneCompat(source);
  copy.id = id;
  copy.name = name;
  copy.property = {
    ...copy.property,
    id,
    name,
    source: `User-editable copy of ${source.name}.`,
    reference: copy.property?.reference
      ? {...copy.property.reference, status: "derived", derivedFrom: source.id}
      : null
  };
  const normalized = normalizeParcelWorkspace(copy);
  state.parcels = [...(state.parcels || []), normalized];
  applyParcelWorkspace(state, normalized);
  state.layoutName = `${name} · working`;
}

function restoreActiveReferenceGarden(state) {
  const replacement = defaultGardenWorkspaceById(state.activeParcelId);
  if (!replacement) return;
  state.parcels = (state.parcels || []).map((workspace) => workspace.id === state.activeParcelId
    ? structuredCloneCompat(replacement)
    : workspace);
  applyParcelWorkspace(state, replacement);
  state.layoutName = `${replacement.name} · reference starter`;
  state.inspectorOpen = false;
}

function uniqueGardenId(state, base) {
  const ids = new Set((state.parcels || []).map((workspace) => workspace.id));
  let candidate = base;
  let index = 2;
  while (ids.has(candidate)) candidate = `${base}-${index++}`;
  return candidate;
}

function addImportedParcelWorkspace(state, result) {
  syncActiveParcelWorkspace(state);
  const index = (state.parcels || []).length + 1;
  const property = propertyFromMassgisResult(result, index);
  const workspace = normalizeParcelWorkspace({
    id: property.id,
    name: property.name,
    property,
    activeBedId: DEFAULT_ACTIVE_BED_ID,
    beds: starterBedsForProperty(),
    structures: [],
    vegetation: [],
    placements: [],
    parcelBufferInches: state.parcelBufferInches || 1800,
    parcelViewport: null
  });
  state.parcels = [...(state.parcels || []), workspace];
  applyParcelWorkspace(state, workspace);
  state.parcelSearchResults = [];
  state.parcelSearchStatus = "Parcel added. Imported owner, address, and town fields were not stored.";
}

function starterBedsForProperty() {
  return [
    normalizeBed({
      ...DEFAULT_BEDS[0],
      id: "starter-bed",
      name: "Starter garden bed",
      zone: "New parcel",
      x: 0,
      y: 0,
      width: 96,
      height: 48,
      rotation: 0,
      notes: "Move, resize, rename, or remove this starter bed after importing the parcel."
    })
  ];
}

async function searchMassgisParcels(query = {}) {
  const where = massgisParcelWhereClause(query);
  if (!where) throw new Error("Enter a city/town with address or a parcel ID.");
  let lastError = null;
  for (const service of MASSGIS_PARCEL_SERVICES) {
    try {
      const url = new URL(`${service.replace(/\/$/, "")}/query`);
      url.searchParams.set("f", "json");
      url.searchParams.set("where", where);
      url.searchParams.set("outFields", MASSGIS_PARCEL_OUT_FIELDS.join(","));
      url.searchParams.set("returnGeometry", "true");
      url.searchParams.set("outSR", "4326");
      url.searchParams.set("resultRecordCount", "8");
      url.searchParams.set("orderByFields", "MAP_PAR_ID");
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "ArcGIS query error");
      const features = Array.isArray(data.features) ? data.features : [];
      return features
        .filter((feature) => parcelExteriorRings(normalizeParcelGeometry(feature.geometry))
          .some((ring) => ring.length >= 3))
        .map((feature, index) => massgisSearchResult(feature, service, index));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No MassGIS parcel service responded.");
}

function massgisParcelWhereClause(query = {}) {
  const city = normalizeSearchToken(query.city);
  const addrNum = normalizeSearchToken(query.addrNum);
  const street = normalizeStreetSearch(query.street);
  const parcelId = normalizeSearchToken(query.parcelId);
  const clauses = [];
  if (parcelId) {
    const token = escapeArcgisSql(parcelId);
    clauses.push(`(UPPER(MAP_PAR_ID) LIKE '%${token}%' OR UPPER(PROP_ID) LIKE '%${token}%' OR UPPER(LOC_ID) LIKE '%${token}%')`);
  }
  if (city) clauses.push(`UPPER(CITY) = '${escapeArcgisSql(city)}'`);
  if (addrNum) clauses.push(`ADDR_NUM = '${escapeArcgisSql(addrNum)}'`);
  if (street) clauses.push(`UPPER(FULL_STR) LIKE '%${escapeArcgisSql(street)}%'`);
  if (!parcelId && (!city || (!addrNum && !street))) return "";
  return clauses.join(" AND ");
}

function massgisSearchResult(feature, service, index) {
  const attributes = feature.attributes || {};
  const labelParts = [
    attributes.MAP_PAR_ID ? `Parcel ${attributes.MAP_PAR_ID}` : `Parcel candidate ${index + 1}`,
    attributes.LOT_SIZE ? `${round(attributes.LOT_SIZE)} ${attributes.LOT_UNITS || "acres"}` : ""
  ].filter(Boolean);
  const detailParts = [
    attributes.SITE_ADDR || "",
    attributes.CITY || "",
    attributes.FY ? `FY${attributes.FY}` : ""
  ].filter(Boolean);
  return {
    service,
    label: labelParts.join(" | "),
    detail: detailParts.join(" | "),
    attributes,
    geometry: normalizeParcelGeometry(feature.geometry)
  };
}

function propertyFromMassgisResult(result, index) {
  const geometry = normalizeParcelGeometry(result.geometry);
  const attributes = sanitizeParcelAttributes(result.attributes || {});
  return sanitizePropertyContext({
    id: `parcel-${Date.now().toString(36)}-${index}`,
    version: PROPERTY_CONTEXT.version,
    name: `Imported parcel ${index}`,
    source: "MassGIS Level 3 Property Tax Parcels, user-selected parcel geometry.",
    acreage: Number(attributes.LOT_SIZE) || null,
    units: "inches",
    northDegrees: 0,
    aspect: "Planting aspect pending",
    localOrigin: localOriginFromGeometry(geometry),
    parcel: {
      service: result.service || MASSGIS_PARCEL_SERVICE,
      queried: "User-selected MassGIS parcel; identifying assessor fields stripped after import",
      spatialReference: "EPSG:4326",
      attributes,
      geometry
    }
  }, {name: `Imported parcel ${index}`});
}

function normalizeSearchToken(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeStreetSearch(value) {
  return normalizeSearchToken(value)
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bCIRCLE\b/g, "CIR")
    .replace(/\bCOURT\b/g, "CT");
}

function escapeArcgisSql(value) {
  return String(value || "").replaceAll("'", "''");
}

function updateVegetationField(vegetation, input) {
  const field = input.dataset.vegetationField;
  if (["x", "y", "width", "height", "rotation"].includes(field)) {
    const min = field === "width" || field === "height" ? 36 : -Infinity;
    vegetation[field] = Math.max(min, Number.parseFloat(input.value) || 0);
    syncTreePointGeometry(vegetation);
    return;
  }
  if (field === "heightEstimateFeet") {
    updateTreeHeightEstimate(vegetation, input.value);
    return;
  }
  if (["crownWidthFeet", "crownDepthFeet"].includes(field)) {
    const value = Number.parseFloat(input.value);
    if (!Number.isFinite(value) || value <= 0) return;
    vegetation[field] = value;
    vegetation.crownMeasurementMethod = "User-entered crown axes; not independently measured";
    vegetation.crownConfidence = "low";
    if (field === "crownWidthFeet") {
      vegetation.width = value * 12;
      vegetation.crownRadiusEastWestFeet = value / 2;
    }
    if (field === "crownDepthFeet") {
      vegetation.height = value * 12;
      vegetation.crownRadiusNorthSouthFeet = value / 2;
    }
    if (Number.isFinite(Number(vegetation.crownWidthFeet)) && Number.isFinite(Number(vegetation.crownDepthFeet))) {
      vegetation.crownDiameterFeet = Math.sqrt(vegetation.crownWidthFeet * vegetation.crownDepthFeet);
    }
    syncTreePointGeometry(vegetation);
    return;
  }
  if (field === "plantId") {
    vegetation.plantId = input.value || null;
    return;
  }
  vegetation[field] = input.value;
  if (field === "kind" && input.value === "tree") syncTreePointGeometry(vegetation);
}

function moveWalkCamera(state, action, inches = 12) {
  const walk=state.walkCamera;if(!walk)return;
  if(action==='left'||action==='right'){setPlanningOrientation(state,planningBearing(state)+(action==='left'?-5:5),planningPitch(state));return;}
  const angle=planningBearing(state)*Math.PI/180,step=(action==='back'?-1:1)*clamp(Number(inches)||0,0,24),bounds=parcelViewBounds(state);
  walk.x=clamp(walk.x+Math.sin(angle)*step,bounds.x,bounds.x+bounds.width);
  walk.y=clamp(walk.y-Math.cos(angle)*step,bounds.y,bounds.y+bounds.height);
}

function createOrbitCamera(camera, canvas, state, onViewChange = () => {}) {
  const target = new THREE.Vector3(0, 0.25, 0);
  const orbit = {
    radius: 7.4,
    theta: 0,
    phi: Math.PI / 4,
    dragging: false,
    gesture: null
  };

  canvas.tabIndex=0;canvas.setAttribute('aria-label','Garden 3D view. In Walk mode, W/S or up/down steps, A/D or left/right turns. Drag to look. Escape returns overhead.');
  let lastKeyStep=0,lastWheel=performance.now();
  canvas.addEventListener('keydown',event=>{
    if(!state.walkCamera||event.altKey||event.ctrlKey||event.metaKey)return;
    const action={w:'forward',s:'back',a:'left',d:'right',ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right'}[event.key];
    if(event.key==='Escape'){state.walkCamera=null;setPlanningOrientation(state,planningBearing(state),60);event.preventDefault();onViewChange();}
    else if(action){event.preventDefault();event.stopImmediatePropagation();const now=performance.now();if(event.repeat&&now-lastKeyStep<120)return;lastKeyStep=now;moveWalkCamera(state,action,event.repeat?6:12);onViewChange();}
  });
  const pose = new THREE.Object3D();
  let initialized = false, lastTime = performance.now();
  const update = () => {
    const previousPosition = camera.position.clone(), previousRotation = camera.quaternion.clone();
    const now = performance.now(), alpha = 1 - Math.exp(-Math.min(64, now-lastTime) / 115);
    lastTime = now;
    const settle = () => {
      if (initialized && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !orbit.dragging) {
        pose.position.copy(camera.position); pose.quaternion.copy(camera.quaternion);
        camera.position.copy(previousPosition).lerp(pose.position, alpha);
        camera.quaternion.copy(previousRotation).slerp(pose.quaternion, alpha);
      }
      initialized = true;
    };
    if(state.walkCamera){
      const walk=state.walkCamera,unit=threeViewUnit(state),angle=planningBearing(state)*Math.PI/180,look=(walk.look||0)*Math.PI/180;
      camera.position.set(walk.x*unit,66*unit,walk.y*unit);
      camera.lookAt(camera.position.x+Math.sin(angle)*Math.cos(look),camera.position.y+Math.sin(look),camera.position.z-Math.cos(angle)*Math.cos(look));settle();return;
    }
    orbit.phi = clamp(orbit.phi, 0.08, 1.4);
    orbit.radius = clamp(orbit.radius, 0.08, 100000);
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      target.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
      target.y + orbit.radius * Math.cos(orbit.phi),
      target.z + orbit.radius * sinPhi * Math.cos(orbit.theta)
    );
    camera.lookAt(target);
    settle();
  };

  canvas.addEventListener("pointerdown", (event) => {
    const rotating = event.ctrlKey || event.button === 2;
    if (!rotating && event.button !== 0 && event.button !== 1) return;
    canvas.focus({preventScroll:true});
    orbit.dragging = true;
    orbit.gesture = {
      pointerId: event.pointerId,
      rotating,
      startX: event.clientX,
      startY: event.clientY,
      startBearing: normalizeViewBearing(planningBearing(state)),
      startLook: state.walkCamera?.look || 0,
      startPitch: normalizeViewPitch(planningPitch(state)),
      startViewport: {...planViewBounds(state)}
    };
    canvas.setPointerCapture?.(event.pointerId);
    if (rotating) event.preventDefault();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!orbit.dragging || !orbit.gesture || event.pointerId !== orbit.gesture.pointerId) return;
    const dx = event.clientX - orbit.gesture.startX;
    const dy = event.clientY - orbit.gesture.startY;
    if(state.walkCamera){
      setPlanningOrientation(state,orbit.gesture.startBearing+dx*.10,planningPitch(state));
      state.walkCamera.look=clamp(orbit.gesture.startLook-dy*.08,-60,60);
    } else if (orbit.gesture.rotating) {
      setPlanningOrientation(state,orbit.gesture.startBearing+dx*0.35,orbit.gesture.startPitch-dy*0.25);
    } else {
      panPlanningViewport(
        state,
        orbit.gesture.startViewport,
        dx,
        dy,
        canvas.getBoundingClientRect()
      );
    }
    event.preventDefault();
    onViewChange();
  });

  const stopDrag = (event) => {
    if (orbit.gesture && event?.pointerId !== undefined && event.pointerId !== orbit.gesture.pointerId) return;
    const pointerId = orbit.gesture?.pointerId ?? event?.pointerId;
    orbit.dragging = false;
    orbit.gesture = null;
    if (pointerId !== undefined && canvas.hasPointerCapture?.(pointerId)) canvas.releasePointerCapture?.(pointerId);
  };
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    const now=performance.now(),elapsed=Math.min(100,Math.max(0,now-lastWheel));lastWheel=now;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1);
    if(!delta)return;
    if(state.walkCamera)moveWalkCamera(state,delta<0?'forward':'back',Math.min(Math.abs(delta)*.03,36*elapsed/1000));
    else zoomPlanningViewport(state, Math.exp(clamp(delta,-100,100)*.001));
    onViewChange();
  }, {passive: false});
  canvas.addEventListener("dblclick", (event) => {
    event.preventDefault();
    zoomPlanningViewport(state, 0.72);
    onViewChange();
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  return {target, orbit, update, snap: () => {initialized = false;}, cancel: stopDrag};
}

function tagThreeFeature(object, type, id) {
  if (!object) return object;
  object.userData.featureRef = {type, id};
  return object;
}

function threeFeatureRef(object) {
  let current = object;
  while (current) {
    if (current.userData?.featureRef) return current.userData.featureRef;
    current = current.parent;
  }
  return null;
}

function threeFeatureEntity(state, ref) {
  if (!ref) return null;
  if (ref.type === "bed") return state.beds.find((item) => item.id === ref.id) || null;
  if (ref.type === "structure") return state.structures.find((item) => item.id === ref.id) || null;
  if (ref.type === "vegetation") return state.vegetation.find((item) => item.id === ref.id) || null;
  if (ref.type === "placement") return state.placements.find((item) => item.id === ref.id) || null;
  return null;
}

function threeRaycastFeature(three, event) {
  const rect = three.renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  three.pointer.set(
    (event.clientX - rect.left) / rect.width * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  three.raycaster.setFromCamera(three.pointer, three.camera);
  for (const intersection of three.raycaster.intersectObjects(three.group.children, true)) {
    const ref = threeFeatureRef(intersection.object);
    if (ref) return {ref, intersection};
  }
  return null;
}

function threeGroundPoint(three, event) {
  const rect = three.renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  three.pointer.set(
    (event.clientX - rect.left) / rect.width * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  three.raycaster.setFromCamera(three.pointer, three.camera);
  return three.raycaster.ray.intersectPlane(three.dragPlane, new THREE.Vector3());
}

function placementWorldPosition(state, placement) {
  if (!placement?.bedId && Array.isArray(placement?.absoluteLocalPoint)) {
    const [x, y] = placement.absoluteLocalPoint;
    return {x: Number(x) || 0, y: Number(y) || 0};
  }
  const bed = bedForPlacement(state, placement);
  if (!bed) return {x: 0, y: 0};
  if (state.viewMode === "bed") {
    return {x: placement.x - bed.width / 2, y: placement.y - bed.height / 2};
  }
  const angle = (bed.rotation || 0) * Math.PI / 180;
  const localX = placement.x - bed.width / 2;
  const localY = placement.y - bed.height / 2;
  return {
    x: bed.x + localX * Math.cos(angle) - localY * Math.sin(angle),
    y: bed.y + localX * Math.sin(angle) + localY * Math.cos(angle)
  };
}

function threeFeatureWorldPosition(state, ref, feature) {
  if (ref.type === "placement") return placementWorldPosition(state, feature);
  if (ref.type === "bed" && state.viewMode === "bed") return {x: 0, y: 0};
  return {x: Number(feature.x) || 0, y: Number(feature.y) || 0};
}

function applyThreeFeatureDrag(state, drag, point, unit) {
  const feature = threeFeatureEntity(state, drag.ref);
  if (!feature || !point) return;
  const dx = point.x / unit - drag.startGround.x;
  const dy = point.z / unit - drag.startGround.y;
  const worldX = drag.startWorld.x + dx;
  const worldY = drag.startWorld.y + dy;

  if (drag.ref.type === "placement") {
    const bed = bedForPlacement(state, feature);
    const local = state.viewMode === "bed"
      ? {x: worldX + bed.width / 2, y: worldY + bed.height / 2}
      : pointToBedLocal(worldX, worldY, bed);
    feature.x = clamp(local.x, 0, bed.width);
    feature.y = clamp(local.y, 0, bed.height);
    return;
  }

  if (drag.ref.type === "bed" && feature.polygon) {
    feature.polygon = drag.startPolygon.map(([x, y]) => [x + dx, y + dy]);
    const bounds = boundsFromPoints(feature.polygon, 0);
    feature.x = bounds.x + bounds.width / 2;
    feature.y = bounds.y + bounds.height / 2;
    return;
  }

  if (drag.ref.type === "structure") moveStructureTo(feature, worldX, worldY);
  else {
    feature.x = worldX;
    feature.y = worldY;
  }
}

function setupThreeFeatureInteractions(three, options = {}) {
  const canvas = three.renderer.domElement;
  const onStateChange = options.onStateChange || (() => {});
  const hoverCard = options.hoverCard;
  let drag = null;
  canvas.addEventListener("dragover", event => {
    if (three.state.viewMode === "bed" && event.dataTransfer.types.includes("application/x-veggie-plant")) event.preventDefault();
  });
  canvas.addEventListener("drop", event => {
    const state = three.state, id = event.dataTransfer.getData("application/x-veggie-plant");
    if (state.viewMode !== "bed" || !state.plants.some(plant => plant.id === id)) return;
    event.preventDefault();
    const point = threeGroundPoint(three,event), bed = activeBed(state), unit = threeViewUnit(state);
    if (!point || !bed) return;
    const x = point.x / unit + bed.width / 2, y = point.z / unit + bed.height / 2;
    if (!isInsideBed(x,y,bed)) return;
    addPlacement(state,id,x,y); onStateChange();
  });
  let bedClick = null;
  canvas.addEventListener("pointerdown", event => {
    bedClick = null;
    if (event.button !== 0 || event.ctrlKey || three.state.viewMode !== "garden" || plannerCanEditFeature(three.state, "bed")) return;
    const hit = threeRaycastFeature(three, event);
    const id=hit?.ref.type==="bed"?hit.ref.id:hit?.ref.type==="placement"?three.state.placements.find(p=>p.id===hit.ref.id)?.bedId:null;
    if(id)bedClick={id,x:event.clientX,y:event.clientY,pointer:event.pointerId};
  });
  canvas.addEventListener("pointermove",event=>{if(bedClick && Math.hypot(event.clientX-bedClick.x,event.clientY-bedClick.y)>5)bedClick=null;});
  canvas.addEventListener("pointerup", event => {
    const click = bedClick; bedClick = null;
    if (!click || click.pointer !== event.pointerId || Math.hypot(event.clientX-click.x,event.clientY-click.y)>5) return;
    openPlantingWorkspace(three.state, click.id);
    hideFeatureHover(hoverCard);
    onStateChange();
  });
  canvas.addEventListener("pointercancel", () => {bedClick = null;});

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.ctrlKey || three.state.walkCamera || three.state.activeTool === "select") return;
    const hit = threeRaycastFeature(three, event);
    if (!hit) return;
    const feature = threeFeatureEntity(three.state, hit.ref);
    if (!feature) return;
    selectGardenFeature(three.state, hit.ref.type, hit.ref.id);
    const featureEditable = plannerCanEditFeature(three.state, hit.ref.type);
    if (!featureEditable) {
      hideFeatureHover(hoverCard);
      onStateChange();
      return;
    }
    const point = threeGroundPoint(three, event);
    const movable = hit.ref.type === "placement" || three.state.viewMode === "garden";
    if (point && movable) {
      three.controls.cancel(event);
      const unit = threeViewUnit(three.state);
      const startWorld = threeFeatureWorldPosition(three.state, hit.ref, feature);
      drag = {
        ref: hit.ref,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startGround: {x: point.x / unit, y: point.z / unit},
        startWorld,
        startPolygon: Array.isArray(feature.polygon) ? feature.polygon.map((item) => [...item]) : null,
        moved: false
      };
      canvas.setPointerCapture?.(event.pointerId);
    } else {
      three.controls.cancel(event);
    }
    hideFeatureHover(hoverCard);
    event.preventDefault();
    onStateChange();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (drag && event.pointerId === drag.pointerId) {
      if (Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) >= 3) drag.moved = true;
      const point = threeGroundPoint(three, event);
      applyThreeFeatureDrag(three.state, drag, point, threeViewUnit(three.state));
      canvas.style.cursor = "grabbing";
      hideFeatureHover(hoverCard);
      event.preventDefault();
      onStateChange();
      return;
    }
    if (three.controls.orbit.dragging) {
      hideFeatureHover(hoverCard);
      return;
    }
    const hit = threeRaycastFeature(three, event);
    const feature = threeFeatureEntity(three.state, hit?.ref);
    canvas.style.cursor = hit && plannerCanEditFeature(three.state, hit.ref.type) ? "move" : hit ? "pointer" : "grab";
    if (hit && feature) showFeatureHover(hoverCard, three.state, hit.ref.type, feature, event);
    else hideFeatureHover(hoverCard);
  });

  const finish = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture?.(event.pointerId);
    drag = null;
    canvas.style.cursor = "grab";
    onStateChange();
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  canvas.addEventListener("pointerleave", () => {
    if (!drag) hideFeatureHover(hoverCard);
  });
  canvas.addEventListener("dblclick", (event) => {
    const hit = threeRaycastFeature(three, event);
    if (!hit) return;
    if (hit.ref.type === "placement") {
      if (!plannerCanEditFeature(three.state, "placement")) return;
      deletePlacement(three.state, hit.ref.id);
      hideFeatureHover(hoverCard);
      event.preventDefault();
      onStateChange();
      return;
    }
    if (hit.ref.type !== "bed") return;
    if (!plannerCanEditFeature(three.state, "placement")) return;
    const bed = threeFeatureEntity(three.state, hit.ref);
    const point = threeGroundPoint(three, event);
    if (!bed || !point) return;
    const unit = threeViewUnit(three.state);
    const local = three.state.viewMode === "bed"
      ? {x: point.x / unit + bed.width / 2, y: point.z / unit + bed.height / 2}
      : pointToBedLocal(point.x / unit, point.z / unit, bed);
    three.state.activeBedId = bed.id;
    if (!isInsideBed(local.x, local.y, bed)) return;
    addPlacement(three.state, three.state.selectedPlantId, local.x, local.y);
    selectGardenFeature(three.state, "placement", three.state.selectedPlacementId);
    hideFeatureHover(hoverCard);
    event.preventDefault();
    onStateChange();
  });
}

function createThreeScene(host, state, onViewChange = () => {}, options = {}) {
  const scene = new THREE.Scene();
  const syncThemeBackground = () => {
    const canvasColor = getComputedStyle(host).getPropertyValue("--canvas").trim() || "#edf3ef";
    scene.background = new THREE.Color(canvasColor);
  };
  syncThemeBackground();
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", syncThemeBackground);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.005, 1000);
  camera.position.set(2.9, 4.4, 5.6);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance"});
  } catch {
    host.innerHTML = `<div class="webgl-fallback">
      <div>
        <h3>3D preview is unavailable in this browser</h3>
        <p>Your garden is still editable. Use the 2D plan to arrange beds and plants, check spacing, and save your work.</p>
        <button type="button" data-action="fallback-2d">Continue planning in 2D</button>
      </div>
    </div>`;
    host.querySelector('[data-action="fallback-2d"]').addEventListener("click", () => {
      state.viewPresentation = "2d";
      options.onStateChange?.();
      host.closest(".garden-planner-app")?.querySelector('[data-presentation="2d"]')?.focus();
    });
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "three-canvas";
  host.append(renderer.domElement);

  const controls = createOrbitCamera(camera, renderer.domElement, state, onViewChange);
  controls.target.set(0, 0.25, 0);
  controls.update();

  const hemi = new THREE.HemisphereLight("#f6fff5", "#64715f", 1.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight("#fff4d6", 2.4);
  sun.position.set(3, 6, 4);
  sun.castShadow = true;
  scene.add(sun);

  const group = new THREE.Group();
  scene.add(group);

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(280, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    syncThreeCamera({camera, renderer, controls}, state);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();

  const three = {
    sun, hemi, getSolarPreview: options.getSolarPreview,
    scene,
    camera,
    renderer,
    controls,
    group,
    resizeObserver,
    host,
    modelAssets: options.modelAssets || {},
    modelCatalog: Array.isArray(options.modelCatalog) ? options.modelCatalog : [],
    modelLoader: {loadAsync: loadGardenGlb},
    modelTemplates: new Map(),
    modelLoads: new Map(),
    modelErrors: new Map(),
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    state
  };
  setupThreeFeatureInteractions(three, options);
  syncThreeScene(three, state);
  return three;
}

function syncThreeScene(three, state) {
  const nextBed = activeBed(state);
  const previousFrame = three.coordinateFrame;
  const nextFrame = {mode:state.viewMode, bed:nextBed ? {...nextBed} : null, parcel:state.activeParcelId};
  if (previousFrame && previousFrame.parcel === nextFrame.parcel && previousFrame.mode !== nextFrame.mode) {
    const bed = nextFrame.mode === "bed" ? nextFrame.bed : previousFrame.bed;
    if (bed) {
      const toBed = nextFrame.mode === "bed", scale = toBed ? .055/.022 : .022/.055;
      const angle = (bed.rotation || 0) * Math.PI / 180 * (toBed ? 1 : -1);
      const offset = new THREE.Vector3(bed.x*.022,0,bed.y*.022);
      if (toBed) three.camera.position.sub(offset);
      three.camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),angle).multiplyScalar(scale);
      three.camera.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle));
      if (!toBed) three.camera.position.add(offset);
    }
  }
  if (!previousFrame || previousFrame.parcel !== nextFrame.parcel) three.controls.snap();
  three.coordinateFrame = nextFrame;
  three.state = state;
  disposeGroup(three.group);
  three.group.clear();

  const unit = threeViewUnit(state);
  const bed = activeBed(state);
  // Walking needs nearby objects even after leaving the original aerial frame.
  const viewBounds = state.walkCamera && state.viewMode === "garden"
    ? {x:state.walkCamera.x-1440,y:state.walkCamera.y-1440,width:2880,height:2880}
    : state.viewMode === "garden" ? parcelViewportBounds(state) : planViewBounds(state);
  three.detailProfile = gardenViewProfileForElement(
    viewBounds,
    three.renderer.domElement,
    gardenInformationContext(state, viewBounds)
  );
  if(state.walkCamera)three.detailProfile={...three.detailProfile,id:"garden",threePlantMode:"model",plantMode:"botanical",showBedGrid:false};
  three.renderer.domElement.dataset.detailLevel = three.detailProfile.id;
  three.renderer.domElement.dataset.plantRenderMode = three.detailProfile.threePlantMode;
  three.viewMode = state.viewMode;
  three.activeBedId = bed.id;

  if (state.viewMode === "bed") {
    addBed3d(three, state, bed, visiblePlannedPlacements(activePlacements(state), state.previewDate), unit, true, true);
    syncThreeCamera(three, state);
    updateThreeModelStatus(three);
    return;
  }

  addPropertyGround3d(three.group, state, unit, {showBoundary: state.mapSettings.showParcel});
  if (state.mapSettings.showVegetation) addVegetationCover3d(three.group, state, unit, three.detailProfile, viewBounds);
  if (state.mapSettings.showStructures) addGardenStructures3d(three.group, state, unit, three.detailProfile, viewBounds);
  const renderedBeds = detailVisibleFeatures(mapVisibleBeds(state), viewBounds, three.detailProfile, bed.id);
  for (const item of renderedBeds) {
    addBed3d(
      three,
      state,
      item,
      state.mapSettings.showPlantings
        ? detailVisiblePlacements(state, placementsForBed(state, item.id), viewBounds, three.detailProfile)
        : [],
      unit,
      item.id === bed.id,
      false
    );
  }
  syncThreeCamera(three, state);
  updateThreeModelStatus(three);
  syncThreeSolar(three,state,unit);
}

function syncThreeSolar(three,state,unit){
  const preview=three.getSolarPreview?.(),canvas=three.renderer.domElement;
  const direction=solarSceneDirection(preview,state.viewMode==="bed"?(activeBed(state).rotation||0):0);
  const enabled=Boolean(preview);
  // Decorative models use generic heights. Their shadow maps must not be
  // mistaken for entered-height estimates while the solar preview is enabled.
  three.renderer.shadowMap.enabled=!enabled;three.sun.castShadow=!enabled;
  canvas.dataset.solarMode=!enabled?'illustrative':direction?'calculated':'unavailable';
  canvas.dataset.solarShadowPolygons='0';
  if(!enabled){
    const bounds=state.viewMode==="garden"?parcelViewportBounds(state):planViewBounds(state);
    const center=three.controls.target,span=Math.max(bounds.width,bounds.height)*unit;
    const distance=Math.max(10,span);
    three.sun.intensity=2.4;
    three.sun.target.position.copy(center);
    three.sun.position.set(center.x-distance*.5, distance, center.z+distance*.4);
    const shadow=three.sun.shadow;shadow.mapSize.set(1024,1024);
    Object.assign(shadow.camera,{left:-distance,right:distance,top:distance,bottom:-distance,near:.1,far:distance*5});
    shadow.camera.updateProjectionMatrix();shadow.bias=-0.0001;shadow.normalBias=.03;
    delete canvas.dataset.solarDirection;return;
  }
  if(!direction){three.sun.intensity=0;delete canvas.dataset.solarDirection;return;}
  const bounds=state.viewMode==="garden"?parcelViewportBounds(state):planViewBounds(state);
  const x=state.viewMode==="bed"?0:(bounds.x+bounds.width/2)*unit,z=state.viewMode==="bed"?0:(bounds.y+bounds.height/2)*unit;
  const distance=Math.max(10,Math.max(bounds.width,bounds.height)*unit);
  three.sun.target.position.set(x,0,z);three.sun.position.set(x+direction.x*distance,direction.y*distance,z+direction.z*distance);
  three.sun.intensity=direction.y>0?2.4:0;
  canvas.dataset.solarDirection=[direction.x,direction.y,direction.z].map(v=>v.toFixed(5)).join(',');
  const polygons=state.viewMode==="bed"?bedShadowPolygons(preview,activeBed(state)):solarScenePolygons(preview);
  for(const points of polygons){
    const shape=new THREE.Shape();shape.moveTo(points[0][0]*unit,-points[0][1]*unit);
    for(const [px,py]of points.slice(1))shape.lineTo(px*unit,-py*unit);shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:'#875be8',transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}));
    mesh.rotation.x=-Math.PI/2;mesh.position.y=state.viewMode==="bed"?.14:.022;mesh.renderOrder=10;mesh.name='solar-ground-shadow';
    // Visual context only: never intercept object selection or dragging.
    mesh.raycast=()=>{};three.group.add(mesh);
  }
  canvas.dataset.solarShadowPolygons=String(polygons.length);
}

function threeViewUnit(state) {
  return state.viewMode === "bed" ? 0.055 : 0.022;
}

function syncThreeCamera(three, state) {
  if (!three?.camera || !three?.controls) return;
  if(state.viewMode!=="garden")state.walkCamera=null;
  const unit = threeViewUnit(state);
  const bounds = state.viewMode === "garden" ? parcelViewportBounds(state) : planViewBounds(state);
  const centerX = state.viewMode === "garden" ? bounds.x + bounds.width / 2 : bounds.x + bounds.width / 2 - activeBed(state).width / 2;
  const centerY = state.viewMode === "garden" ? bounds.y + bounds.height / 2 : bounds.y + bounds.height / 2 - activeBed(state).height / 2;
  const aspect = Math.max(0.25, Number(three.camera.aspect) || 1);
  const span = Math.max(bounds.height * unit, bounds.width * unit / aspect);
  const fovRadians = THREE.MathUtils.degToRad(three.camera.fov || 45);
  const radius = span / Math.max(0.1, 2 * Math.tan(fovRadians / 2));
  const bearing = normalizeViewBearing(planningBearing(state));
  const pitch = normalizeViewPitch(planningPitch(state));

  three.controls.target.set(centerX * unit, 0.12, centerY * unit);
  // SVG rotates the ground by -bearing; the orbit must use the opposite sign.
  three.controls.orbit.theta = THREE.MathUtils.degToRad(-bearing);
  three.controls.orbit.phi = THREE.MathUtils.degToRad(Math.max(5, pitch));
  three.controls.orbit.radius = clamp(radius * 1.08, 0.08, 100000);
  three.camera.near = state.walkCamera ? unit : Math.max(0.01, three.controls.orbit.radius / 2000);
  three.camera.far = Math.max(100, three.controls.orbit.radius * 8, three.camera.position.distanceTo(three.controls.target) * 2);
  three.camera.updateProjectionMatrix();
  three.controls.update();


  const canvas = three.renderer?.domElement;
  if (canvas) {
    canvas.dataset.cameraMode = state.walkCamera ? 'walk' : 'orbit';
    canvas.dataset.walkPosition = state.walkCamera ? `${round(state.walkCamera.x)},${round(state.walkCamera.y)}` : '';
    canvas.dataset.viewCenter = `${round(centerX)},${round(centerY)}`;
    canvas.dataset.viewZoom = String(parcelZoomLevel(state));
    canvas.dataset.viewBearing = String(round(bearing));
    canvas.dataset.viewPitch = String(round(pitch));
  }
}


function addIllustrativePlanting3d(group, state, unit, viewport) {
  if (state.illustrativePlanting === false || !gardenResearch(state.activeParcelId).length) return;
  const obstacles = [...(state.beds || []), ...(state.structures || []).filter(s => /^(path|road|driveway|parking|house|building|greenhouse|water|pond)$/.test(s.type))];
  const samples = illustrativePlanting([...(state.vegetation || []), ...(state.structures || [])], obstacles, viewport);
  if (!samples.length) return;
  const crown = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({color: "#739152", roughness: 1}), samples.length);
  const trees=samples.filter(p=>p.form === "tree");
  const trunks=trees.length ? new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,6),new THREE.MeshStandardMaterial({color:"#695542",roughness:1}),trees.length) : null;
  const transform=new THREE.Object3D();
  samples.forEach((p,i)=>{transform.position.set(p.x*unit,p.height*.7*unit,p.y*unit);transform.scale.set(p.radius*unit,p.height*.3*unit,p.radius*unit);transform.updateMatrix();crown.setMatrixAt(i,transform.matrix);crown.setColorAt(i,new THREE.Color(p.form === "tree" ? (i%3 ? "#648b46" : "#3e7051") : (i%4 ? "#789656" : "#928095")));});
  trees.forEach((p,i)=>{transform.position.set(p.x*unit,p.height*.3*unit,p.y*unit);transform.scale.set(5*unit,p.height*.6*unit,5*unit);transform.updateMatrix();trunks.setMatrixAt(i,transform.matrix);});
  for(const mesh of [crown,trunks].filter(Boolean)){mesh.castShadow=true;mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.userData.geometryRole="illustrative-reconstruction";group.add(mesh);}
}

function addVegetationCover3d(group, state, unit, profile = null, viewport = parcelViewportBounds(state)) {
  addIllustrativePlanting3d(group, state, unit, viewport);
  const vegetationItems = detailVisibleFeatures(state.vegetation || [], viewport, profile, state.selectedVegetationId);
  for (const vegetation of vegetationItems) {
    if (state.illustrativePlanting !== false && gardenResearch(state.activeParcelId).length && /^(forest|woodland|canopy)$/.test(vegetation.kind) && vegetation.localGeometry?.type === "Polygon") continue;
    const canopy = vegetationCanopyEllipse(vegetation);
    const width = canopy.rx * 2 * unit;
    const height = canopy.ry * 2 * unit;
    const color = vegetation.canopyClass === "evergreen" ? "#2f6650" : vegetation.canopyClass === "deciduous" ? "#6f8a4c" : "#55775a";
    const selected = vegetation.id === state.selectedVegetationId;
    // Crown width comes from mapped geometry; unknown vertical dimensions are
    // illustrative only and never written back as measured tree heights.
    const rise = (Number(vegetation.heightEstimateFeet) > 0 ? Number(vegetation.heightEstimateFeet) : vegetation.kind === "shrub" ? 4 : 20) * 12 * unit;
    const crownHeight = rise * 0.65;
    const cover = new THREE.Mesh(
      vegetation.canopyClass === "evergreen" ? new THREE.ConeGeometry(1, 2, 16) : new THREE.SphereGeometry(1, 16, 10),
      new THREE.MeshStandardMaterial({color, roughness: 1,
        emissive: selected ? "#527d45" : "#000000", emissiveIntensity: selected ? .25 : 0})
    );
    cover.scale.set(Math.max(width,.1)/2, crownHeight/2, Math.max(height,.1)/2);
    cover.position.set(vegetation.x*unit, rise-crownHeight/2, vegetation.y*unit);
    cover.rotation.y = -(vegetation.rotation || 0)*Math.PI/180;
    cover.castShadow = true;cover.receiveShadow = true;
    cover.userData.geometryRole = vegetation.kind === "tree" ? "derived-crown" : "mapped-cover";
    cover.userData.heightBasis = Number(vegetation.heightEstimateFeet)>0 ? "entered-estimate" : "illustrative";
    tagThreeFeature(cover,"vegetation",vegetation.id);group.add(cover);
    if (vegetation.kind === "tree") {
      const trunkHeight = rise-crownHeight*.5;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.max(unit*2,width*.025),Math.max(unit*3,width*.035),trunkHeight,10),
        new THREE.MeshStandardMaterial({color:"#65513a",roughness:1})
      );
      trunk.position.set(vegetation.x*unit,trunkHeight/2,vegetation.y*unit);
      trunk.castShadow=true;trunk.userData.geometryRole="canonical-tree-center";
      tagThreeFeature(trunk,"vegetation",vegetation.id);group.add(trunk);
    }
  }
}

function addMappedPolygonSurface3d(group, structure, unit, materialOptions, elevation = 0.035, rise = 0) {
  const geometry = localGeometryInStructureFrame(structure);
  if (geometry?.type !== "Polygon" || !Array.isArray(geometry.coordinates?.[0])) return false;
  const outer = geometry.coordinates[0].filter((point) => Array.isArray(point) && point.length >= 2);
  if (outer.length < 3) return false;

  const shape = new THREE.Shape();
  outer.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x * unit, y * unit);
    else shape.lineTo(x * unit, y * unit);
  });
  shape.closePath();
  for (const holeRing of geometry.coordinates.slice(1)) {
    const points = holeRing.filter((point) => Array.isArray(point) && point.length >= 2);
    if (points.length < 3) continue;
    const hole = new THREE.Path();
    points.forEach(([x, y], index) => {
      if (index === 0) hole.moveTo(x * unit, y * unit);
      else hole.lineTo(x * unit, y * unit);
    });
    hole.closePath();
    shape.holes.push(hole);
  }

  const frame = new THREE.Group();
  frame.position.set(structure.x * unit, elevation, structure.y * unit);
  frame.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
  const surface = new THREE.Mesh(
    rise > 0 ? new THREE.ExtrudeGeometry(shape, {depth: rise, bevelEnabled: false, steps: 1}).translate(0, 0, -rise) : new THREE.ShapeGeometry(shape, 2),
    new THREE.MeshStandardMaterial({side: THREE.DoubleSide, roughness: 0.9, ...materialOptions})
  );
  surface.rotation.x = Math.PI / 2;
  surface.castShadow = rise > 0;surface.receiveShadow = true;
  tagThreeFeature(surface, "structure", structure.id);
  frame.add(surface);
  group.add(frame);
  return true;
}

function addMappedLine3d(group, structure, unit, color, selected = false, elevation = 0.045) {
  const geometry = localGeometryInStructureFrame(structure);
  if (geometry?.type !== "LineString" || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) return false;
  const points = geometry.coordinates.map(([x, y]) => new THREE.Vector3(x * unit, 0, y * unit));
  const frame = new THREE.Group();
  frame.position.set(structure.x * unit, elevation, structure.y * unit);
  frame.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({color: selected ? "#e4ad42" : color})
  );
  tagThreeFeature(line, "structure", structure.id);
  frame.add(line);
  group.add(frame);
  return true;
}

function addGardenStructures3d(group, state, unit, profile = null, viewport = parcelViewportBounds(state)) {
  const structures = [...detailVisibleFeatures(
    visibleSiteFeatures(state),
    viewport,
    profile,
    state.selectedStructureId
  )].sort((a, b) => structureLayerRank(a) - structureLayerRank(b));
  for (const structure of structures) {
    const definition = siteFeatureDefinition(structure);
    const x = structure.x * unit;
    const z = structure.y * unit;
    const width = structure.width * unit;
    const height = structure.height * unit;
    const selected = structure.id === state.selectedStructureId;
    const selectionMaterial = selected ? {emissive: "#d99a37", emissiveIntensity: 0.5} : {};

    if (definition.defaultGeometryKind === "Point") {
      const isPole = definition.category === "utilities";
      const isSpecimenTree = structure.type === "specimen-tree";
      const marker = new THREE.Mesh(
        isPole
          ? new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8)
          : isSpecimenTree
          ? new THREE.CylinderGeometry(0.045, 0.065, 0.34, 8)
          : new THREE.CylinderGeometry(0.11, 0.11, 0.09, 14),
        new THREE.MeshStandardMaterial({
          color: isPole ? "#665742" : isSpecimenTree ? "#5e4936" : definition.legend.fill || "#5c8ba0",
          roughness: 0.82,
          ...selectionMaterial
        })
      );
      marker.position.set(x, isPole ? 0.45 : isSpecimenTree ? 0.17 : 0.05, z);
      tagThreeFeature(marker, "structure", structure.id);
      group.add(marker);
      if (isSpecimenTree) {
        const treeHeight=(Number(structure.heightEstimateFeet)>0?Number(structure.heightEstimateFeet):20)*12*unit;
        const crownRadius=Math.max(width,height,120*unit)/2;
        marker.geometry.dispose();marker.geometry=new THREE.CylinderGeometry(treeHeight*.018,treeHeight*.025,treeHeight*.55,8);marker.position.y=treeHeight*.275;

        const crown = new THREE.Mesh(
          new THREE.SphereGeometry(crownRadius, 16, 10),
          new THREE.MeshStandardMaterial({color: definition.legend.fill || "#47704b", roughness: 0.9, ...selectionMaterial})
        );
        crown.scale.y = treeHeight*.32/crownRadius;
        crown.position.set(x,treeHeight*.68,z);
        tagThreeFeature(crown, "structure", structure.id);
        group.add(crown);
      }
      if (isPole) {
        const crossbar = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.035, 0.035),
          new THREE.MeshStandardMaterial({color: "#564936", roughness: 0.86})
        );
        crossbar.position.set(x, 0.78, z);
        crossbar.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
        tagThreeFeature(crossbar, "structure", structure.id);
        group.add(crossbar);
      }
    } else if (definition.defaultGeometryKind === "LineString" && definition.category === "utilities") {
      const vertical = structure.height >= structure.width;
      const half = Math.max(width, height) / 2;
      const points = vertical
        ? [new THREE.Vector3(0, 0.62, -half), new THREE.Vector3(0, 0.62, half)]
        : [new THREE.Vector3(-half, 0.62, 0), new THREE.Vector3(half, 0.62, 0)];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({color: definition.legend.stroke || "#5d6470"})
      );
      line.position.set(x, 0, z);
      line.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(line, "structure", structure.id);
      group.add(line);
    } else if (definition.defaultGeometryKind === "LineString" && definition.category === "barriers") {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(width, 0.035), structure.type.includes("wall") ? 0.34 : 0.18, Math.max(height, 0.035)),
        new THREE.MeshStandardMaterial({
          color: definition.legend.stroke || "#777269",
          transparent: true,
          opacity: selected ? 0.95 : 0.72,
          roughness: 0.9,
          ...selectionMaterial
        })
      );
      barrier.position.set(x, structure.type.includes("wall") ? 0.17 : 0.09, z);
      barrier.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(barrier, "structure", structure.id);
      group.add(barrier);
    } else if (addMappedLine3d(
      group,
      structure,
      unit,
      definition.legend.stroke || "#718064",
      selected,
      definition.category === "utilities" ? 0.62 : 0.045
    )) {
      // Explicit line geometry is preferable to a large rectangular envelope,
      // especially for the Forest Walk and other long estate circulation.
    } else if (definition.category === "buildings") {
      const rise = (Number(structure.heightEstimateFeet)>0 ? Number(structure.heightEstimateFeet) : 12)*12*unit;
      const material = {color:structure.type==="greenhouse"?"#91aaa0":"#9b8874",...selectionMaterial};
      if (addMappedPolygonSurface3d(group,structure,unit,material,.035,rise)) continue;
      const building = new THREE.Mesh(new THREE.BoxGeometry(width,rise,height),new THREE.MeshStandardMaterial({...material,roughness:.85}));
      building.position.set(x,rise/2,z);building.rotation.y=-(structure.rotation||0)*Math.PI/180;
      building.castShadow=true;building.receiveShadow=true;tagThreeFeature(building,"structure",structure.id);group.add(building);
    } else if (structure.type === "greenhouse") {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.05, height),
        new THREE.MeshStandardMaterial({color: "#d6e5dc", transparent: true, opacity: selected ? 0.52 : 0.26, roughness: 0.35, ...selectionMaterial})
      );
      base.position.set(x, 0.04, z);
      base.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(base, "structure", structure.id);
      group.add(base);

      const frame = rectLineLoop(width, height, "#6f8a82");
      frame.position.set(x, 0.32, z);
      frame.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(frame, "structure", structure.id);
      group.add(frame);

      const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.22, width * 0.22, height, 12, 1, true, 0, Math.PI),
        new THREE.MeshStandardMaterial({color: "#cfe4dc", transparent: true, opacity: selected ? 0.5 : 0.28, side: THREE.DoubleSide, ...selectionMaterial})
      );
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.set(x, 0.34, z);
      roof.rotation.y += -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(roof, "structure", structure.id);
      group.add(roof);
    } else if (definition.category === "circulation") {
      const surfaceColor = structure.type === "parking" ? "#777a73" : ["road", "driveway"].includes(structure.type) ? "#8c8d86" : "#b99a6f";
      if (addMappedPolygonSurface3d(group, structure, unit, {
        color: surfaceColor,
        transparent: true,
        opacity: selected ? 0.96 : structure.type === "parking" ? 0.55 : 0.82,
        ...selectionMaterial
      })) continue;
      const path = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.025, height),
        new THREE.MeshStandardMaterial({color: surfaceColor, roughness: 0.95, transparent: true, opacity: selected ? 0.96 : structure.type === "parking" ? 0.55 : 0.82, ...selectionMaterial})
      );
      path.position.set(x, 0.035, z);
      path.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(path, "structure", structure.id);
      group.add(path);
    } else if (definition.category === "water") {
      if (addMappedPolygonSurface3d(group, structure, unit, {
        color: definition.legend.fill || "#4d7f95",
        transparent: true,
        opacity: selected ? 0.8 : 0.58,
        ...selectionMaterial
      }, 0.04)) continue;
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.max(width, height) / 2, Math.max(width, height) / 2, 0.035, 24),
        new THREE.MeshStandardMaterial({color: "#4d7f95", roughness: 0.4, ...selectionMaterial})
      );
      water.position.set(x, 0.045, z);
      tagThreeFeature(water, "structure", structure.id);
      group.add(water);
    } else if (definition.category === "landscape") {
      if (addMappedPolygonSurface3d(group, structure, unit, {
        color: definition.legend.fill || "#577754",
        transparent: true,
        opacity: selected ? 0.56 : definition.legend.fillOpacity ?? 0.26,
        ...selectionMaterial
      }, 0.055)) continue;
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(width / 2, width / 2, 0.07, 28),
        new THREE.MeshStandardMaterial({color: definition.legend.fill || "#577754", transparent: true, opacity: selected ? 0.52 : definition.legend.fillOpacity ?? 0.26, roughness: 0.8, ...selectionMaterial})
      );
      canopy.scale.z = height / Math.max(width, 1);
      canopy.position.set(x, 0.08, z);
      canopy.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      tagThreeFeature(canopy, "structure", structure.id);
      group.add(canopy);
    } else {
      const materialColor = structure.type === "compost" ? "#66513f" : structure.type === "house" ? "#7f817a" : "#8a6b4c";
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, structure.type === "house" ? 0.38 : 0.1, height),
        new THREE.MeshStandardMaterial({color: materialColor, roughness: 0.9, ...selectionMaterial})
      );
      box.position.set(x, structure.type === "house" ? 0.18 : 0.02, z);
      box.rotation.y = -(structure.rotation || 0) * Math.PI / 180;
      box.receiveShadow = true;
      tagThreeFeature(box, "structure", structure.id);
      group.add(box);
    }
  }
}

function addPropertyGround3d(group, state, unit, options = {}) {
  // Estate views use the actual spatial parcel, not a synthetic hull around
  // garden objects. This keeps remote roads, woodland, and utilities in frame.
  const boundaries = state.viewMode === "garden"
    ? propertyBoundaryRings(state)
    : [hullAroundObjects([...state.beds, ...(state.structures || [])], 60)];
  const bounds = boundsFromPoints(flattenExteriorRings(boundaries), 0);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.width * unit, bounds.height * unit, 12, 12),
    new THREE.MeshStandardMaterial({color: "#dfe8dc", roughness: 0.95})
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((bounds.x + bounds.width / 2) * unit, -0.025, (bounds.y + bounds.height / 2) * unit);
  ground.receiveShadow = true;
  group.add(ground);

  if (options.showBoundary !== false) {
    for (const [index, boundary] of boundaries.entries()) {
      const points = boundary.map(([x, y]) => new THREE.Vector3(x * unit, 0.02, y * unit));
      if (!points.length) continue;
      if (!samePoint(boundary[0], boundary.at(-1))) points.push(points[0].clone());
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({color: "#5d6f62", transparent: true, opacity: 0.72})
      );
      line.name = `parcel-boundary-${index + 1}`;
      group.add(line);
    }
  }
}

function addBed3d(three, state, bed, placements, unit, active, centered) {
  const group = three.group;
  const bedGroup = new THREE.Group();
  tagThreeFeature(bedGroup, "bed", bed.id);
  bedGroup.position.set(centered ? 0 : bed.x * unit, 0, centered ? 0 : bed.y * unit);
  bedGroup.rotation.y = centered ? 0 : -(bed.rotation || 0) * Math.PI / 180;
  group.add(bedGroup);

  const bedWidth = bed.width * unit;
  const bedHeight = bed.height * unit;
  const bedGeometry = new THREE.BoxGeometry(bedWidth, active ? 0.13 : 0.09, bedHeight);
  const bedMaterial = new THREE.MeshStandardMaterial({color: active ? "#7b6048" : "#8a765d", roughness: 0.9});
  const bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
  bedMesh.position.y = -0.06;
  bedMesh.receiveShadow = true;
  bedGroup.add(bedMesh);

  const soilGeometry = new THREE.PlaneGeometry(bedWidth * 0.97, bedHeight * 0.94, 24, 12);
  const soilMaterial = new THREE.MeshStandardMaterial({color: active ? "#4c3e35" : "#5e5145", roughness: 1});
  const soil = new THREE.Mesh(soilGeometry, soilMaterial);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.01;
  soil.receiveShadow = true;
  bedGroup.add(soil);

  const detailProfile = three.detailProfile || {showBedGrid: true, threePlantMode: "model", inchesPerPixel: 1};
  if (detailProfile.showBedGrid && (active || state.viewMode === "bed")) {
    const grid = new THREE.GridHelper(Math.max(bedWidth, bedHeight), Math.max(4, Math.round(Math.max(bed.width, bed.height) / bed.grid)), "#a4b8a8", "#cdd8ce");
    grid.scale.x = bedWidth / Math.max(bedWidth, bedHeight);
    grid.scale.z = bedHeight / Math.max(bedWidth, bedHeight);
    grid.position.y = 0.025;
    bedGroup.add(grid);
  }

  const margin = bed.safeMargin * unit;
  if (margin > 0 && active) {
    const safeLine = rectLineLoop(Math.max(0.1, bedWidth - margin * 2), Math.max(0.1, bedHeight - margin * 2), "#e1ad46");
    safeLine.position.y = 0.045;
    bedGroup.add(safeLine);
  }

  for (const placement of placements) {
    const plant = plantById(state, placement.plantId);
    if (!plant) continue;
    const x = (placement.x - bed.width / 2) * unit;
    const z = (placement.y - bed.height / 2) * unit;
    const status = placementStatus(placement, state);

    if (detailProfile.showBedGrid && bed.showSpacing && active) {
      const ring = circleLineLoop(spacingRadius(plant, bed) * unit, status.ok ? "#87a98d" : "#c45f50");
      ring.position.set(x, 0.065, z);
      bedGroup.add(ring);
    }

    addPlant3d(
      bedGroup,
      plant,
      placement,
      x,
      z,
      unit,
      placement.id === state.selectedPlacementId,
      false,
      three,
      state.walkCamera && Math.hypot(placementParcelPosition(state,placement).x-state.walkCamera.x,placementParcelPosition(state,placement).y-state.walkCamera.y)>600 ? "point" : detailProfile.threePlantMode,
      plannedSize(placement,state.previewDate).scale
    );
  }
}

function fitProceduralPlantHeight(group, plant, unit) {
  group.updateWorldMatrix(true,true);
  const inverse=group.matrixWorld.clone().invert(),bounds=new THREE.Box3();
  group.traverse(object=>{
    if(!object.isMesh || !object.geometry)return;
    object.geometry.computeBoundingBox();
    bounds.union(object.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld)));
  });
  if(bounds.isEmpty())return;
  const size=bounds.getSize(new THREE.Vector3());
  const height=Math.max(1,Number(plant.height)||18)*unit;
  const width=Math.max(1,Number(plant.matureDiameter)||Number(plant.spacing)||18)*unit;
  group.scale.multiply(new THREE.Vector3(width/Math.max(size.x,size.z,.001),height/Math.max(size.y,.001),width/Math.max(size.x,size.z,.001)));
  group.position.y-=bounds.min.y*group.scale.y;
  group.userData.heightInches=height/unit;
}

function openBedSeasons(root,state,renderAll) {
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Bed seasons');
  dialog.style.cssText='width:min(960px,94vw);max-height:90svh;overflow:auto;background:var(--theme-background,#18231b);color:var(--theme-foreground,#eef2e8);padding:18px;border:1px solid #71846d';
  dialog.innerHTML=`<form method="dialog" style="float:right"><button aria-label="Close bed seasons">Close</button></form><h2>Bed seasons</h2><p>Save a design, record what you noticed, and compare the same bed across months or years.</p><label>Bed <select data-bed></select></label><form data-record><label>Month <input data-month type="month" required value="${todayIso().slice(0,7)}"></label><label>Observation or next step <textarea data-note maxlength="2000" rows="2" placeholder="What changed? What would you try next season?"></textarea></label><button>Save current bed snapshot</button></form><p data-status role="status">Snapshots preserve plans, not evidence that plants were grown. Notes are your own observations. Stored in this browser; export a backup for long-term records. Up to 48 saved versions are retained.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><label>Earlier snapshot <select data-before></select></label><label>Later snapshot <select data-after></select></label></div><div data-comparison style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px"></div><div data-difference></div><button type="button" data-plan>Continue planning this bed</button> <button type="button" data-export>Export garden backup</button>`;
  root.append(dialog);dialog.showModal();
  dialog.querySelector('[data-record]').style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px;align-items:end;margin:12px 0';
  for(const label of dialog.querySelectorAll('label'))label.style.cssText='display:flex;flex-direction:column;gap:4px;max-width:100%;min-width:0';
  for(const input of dialog.querySelectorAll('input,select,textarea'))input.style.cssText='box-sizing:border-box;max-width:100%;min-width:0;padding:8px;border:1px solid #71846d;border-radius:5px;background:inherit;color:inherit;font:inherit';
  const beds=dialog.querySelector('[data-bed]'),before=dialog.querySelector('[data-before]'),after=dialog.querySelector('[data-after]');
  beds.replaceChildren(...state.beds.map(b=>new Option(b.name,b.id)));beds.value=state.activeBedId;
  const eligible=()=>state.layouts.filter(l=>l.gardenId===state.activeParcelId&&l.bedSnapshot?.bedId===beds.value).sort((a,b)=>a.bedSnapshot.month.localeCompare(b.bedSnapshot.month)||String(a.savedAt).localeCompare(String(b.savedAt)));
  function draw(){
    const versions=eligible(),a=versions.find(l=>l.id===before.value),b=versions.find(l=>l.id===after.value),host=dialog.querySelector('[data-comparison]');host.replaceChildren();
    for(const [label,version] of [['Earlier',a],['Later',b]]){
      const section=document.createElement('section');host.append(section);
      if(!version){section.textContent='Save a snapshot to begin. Your current plan stays unchanged while comparing.';continue;}
      const bed=version.beds?.find(x=>x.id===beds.value),plants=(version.placements||[]).filter(p=>p.bedId===beds.value);
      const heading=document.createElement('h3');heading.textContent=`${label} · ${version.bedSnapshot.month} · ${plants.length} plantings`;section.append(heading);
      if(bed){
        const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${bed.width} ${bed.height}`);svg.style.cssText='width:100%;height:240px;background:#6b5436';svg.setAttribute('role','img');svg.setAttribute('aria-label',`${bed.name}, ${version.bedSnapshot.month} saved planting positions`);
        for(const p of plants.slice(0,3000)){const plant=plantById(state,p.plantId),circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',Math.max(1,(Number(plant?.matureDiameter)||6)/2));circle.setAttribute('fill',plant?.leafColor||'#77a46d');circle.setAttribute('stroke','#eef2e8');circle.setAttribute('stroke-width','.4');const title=document.createElementNS(ns,'title');title.textContent=plant?.name||p.plantId;circle.append(title);svg.append(circle);}section.append(svg);
        const dimensions=document.createElement('p');dimensions.textContent=`${bed.width} × ${bed.height} in · mature footprints`;section.append(dimensions);
      }
      const note=document.createElement('p');note.textContent=version.bedSnapshot.note||'No observation recorded.';section.append(note);
    }
    const diff=dialog.querySelector('[data-difference]');diff.replaceChildren();if(!a||!b)return;
    const counts=v=>{const m=new Map();for(const p of v.placements||[])if(p.bedId===beds.value)m.set(p.plantId,(m.get(p.plantId)||0)+1);return m;},ac=counts(a),bc=counts(b);
    const table=document.createElement('table');table.style.width='100%';table.innerHTML='<caption>Plant selection changes · follow a plant name to learn more</caption><thead><tr><th>Plant</th><th>Earlier</th><th>Later</th><th>Change</th></tr></thead>';const body=document.createElement('tbody');table.append(body);
    for(const id of new Set([...ac.keys(),...bc.keys()])){const plant=plantById(state,id),row=document.createElement('tr'),name=document.createElement('td'),link=document.createElement('a');link.textContent=plant?.name||id;link.href=plantLearningUrl(plant?.name||id);link.target='_blank';link.rel='noopener';name.append(link);row.append(name);for(const n of [ac.get(id)||0,bc.get(id)||0,(bc.get(id)||0)-(ac.get(id)||0)]){const td=document.createElement('td');td.textContent=String(n);row.append(td);}body.append(row);}diff.append(table);
  }
  function refresh(){const versions=eligible();for(const select of [before,after])select.replaceChildren(...versions.map(v=>new Option(`${v.bedSnapshot.month} · ${new Date(v.savedAt).toLocaleString()}`,v.id)));if(versions.length){before.value=versions[Math.max(0,versions.length-2)].id;after.value=versions.at(-1).id;}draw();}
  beds.onchange=refresh;before.onchange=draw;after.onchange=draw;
  dialog.querySelector('[data-record]').onsubmit=event=>{event.preventDefault();const month=dialog.querySelector('[data-month]').value;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return;const bed=state.beds.find(b=>b.id===beds.value);if(!bed)return;saveNamedLayout(state,`${month} · ${bed.name} · ${crypto.randomUUID()}`);state.layouts[0].bedSnapshot={bedId:bed.id,month,plantCount:placementsForBed(state,bed.id).length,note:dialog.querySelector('[data-note]').value.trim().slice(0,2000)};renderAll();refresh();dialog.querySelector('[data-note]').value='';dialog.querySelector('[data-status]').textContent=`Saved ${month} for ${bed.name}. Compare below. Export a backup; only the latest 48 saved versions are retained.`;};
  dialog.querySelector('[data-plan]').onclick=()=>{openPlantingWorkspace(state,beds.value);dialog.close();renderAll();};
  dialog.querySelector('[data-export]').onclick=()=>{const button=root.querySelector('[data-action="export"]');if(button)button.click();};
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});refresh();
}
function plantLearningUrl(name) {
  const base=globalThis.location?.hostname==='studio.veggie.farm'?'https://veggie.farm':'';
  return `${base}/content/reference/plant-database?search=${encodeURIComponent(name)}`;
}

function openPlantGallery(root,state,getThree,renderAll) {
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label','3D plant library');
  dialog.style.cssText='width:min(680px,92vw);max-height:90svh;overflow:auto;padding:16px;background:#18231b;color:#eef2e8;border:1px solid #70866d';
  dialog.innerHTML=`<form method="dialog" style="float:right"><button aria-label="Close plant library">Close</button></form><h2>3D plant library</h2><label>Find a plant <input type="search" data-search placeholder="Name or variety"></label><label>Plant <select data-plant style="width:100%"></select></label><div data-preview style="height:300px;max-height:42svh"></div><p data-dimensions></p><a data-learn target="_blank" rel="noopener">Learn about this plant ↗</a><label>Illustrative size <input data-size type="range" min="5" max="100" value="100"> <output>100%</output></label><p>6 ft human reference. Mature dimensions use catalog records where available. Smaller sizes are illustrative stages, not a growth forecast.</p><button type="button" data-use>Use in selected bed</button><p data-message></p>`;
  root.append(dialog);dialog.showModal();
  const select=dialog.querySelector('[data-plant]'),preview=dialog.querySelector('[data-preview]'),slider=dialog.querySelector('[data-size]');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{preview.textContent='3D preview unavailable in this browser.';}
  const scene=new THREE.Scene();scene.background=new THREE.Color('#27372c');
  scene.add(new THREE.HemisphereLight(0xffffff,0x536345,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(5,10,6);scene.add(light);
  const camera=new THREE.PerspectiveCamera(40,1,.01,2000);let objects=new THREE.Group();scene.add(objects);
  if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio,2));preview.append(renderer.domElement);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';}
  const draw=()=>{
    const plant=state.plants.find(p=>p.id===select.value);if(!plant)return;
    disposeGroup(objects);scene.remove(objects);objects=new THREE.Group();scene.add(objects);
    const unit=1/12,scale=Number(slider.value)/100;
    const plantRoot=new THREE.Group();objects.add(plantRoot);
    addPlant3d(plantRoot,plant,{rotation:0},0,0,unit,false,false,getThree());plantRoot.scale.setScalar(scale);
    const height=(Number(plant.height)||18)/12,width=(Number(plant.matureDiameter)||Number(plant.spacing)||18)/12;
    const human=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,5,12),new THREE.MeshStandardMaterial({color:'#e0bb83'}));human.position.set(width*scale/2+2,2.5,0);objects.add(human);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8),human.material.clone());head.position.set(human.position.x,5.5,0);objects.add(head);
    const extent=Math.max(6,height*scale,width*scale+4);camera.position.set(extent*.85,extent*.65,extent*1.8);camera.lookAt(0,Math.max(3,height*scale/2),0);
    dialog.querySelector('[data-dimensions]').textContent=`${plant.name}: mature height ${Number(plant.height)?`${plant.height} in`:'unknown (18 in preview)'}, spread ${Number(plant.matureDiameter)?`${plant.matureDiameter} in`:'estimated from spacing'}. ${Math.round(scale*100)}% displayed. Representative plant form.`;
    dialog.querySelector('[data-learn]').href=plantLearningUrl(plant.name);
    dialog.querySelector('output').value=`${Math.round(scale*100)}%`;
    if(renderer){const w=preview.clientWidth,h=preview.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}
  };
  const filter=()=>{const q=dialog.querySelector('[data-search]').value.toLowerCase(),old=select.value||state.selectedPlantId;select.replaceChildren(...state.plants.filter(p=>p.name.toLowerCase().includes(q)).map(p=>new Option(p.name,p.id)));if([...select.options].some(o=>o.value===old))select.value=old;draw();};
  dialog.querySelector('[data-search]').addEventListener('input',filter);select.addEventListener('change',draw);slider.addEventListener('input',draw);
  dialog.querySelector('[data-use]').addEventListener('click',()=>{if(!openPlantingWorkspace(state)){dialog.querySelector('[data-message]').textContent='Select or create a bed first.';return;}state.selectedPlantId=select.value;dialog.close();renderAll();});
  const resize=new ResizeObserver(draw);resize.observe(preview);
  dialog.addEventListener('close',()=>{resize.disconnect();disposeGroup(objects);renderer?.dispose();dialog.remove();},{once:true});filter();
}

function addPlant3d(group, plant, placement, x, z, unit, selected = false, ghost = false, three = null, renderMode = "model", sizeScale = 1) {
  const visual = plant.visual || normalizePlant(plant).visual;
  const stemHeight = stemHeightForPlant(plant, unit);
  const plantGroup = new THREE.Group();
  if (placement?.id) tagThreeFeature(plantGroup, "placement", placement.id);
  plantGroup.position.set(x, 0, z);
  group.add(plantGroup);

  if (!ghost && ["point", "swatch"].includes(renderMode)) {
    const resolution = Math.max(0.1, Number(three?.detailProfile?.inchesPerPixel) || 1);
    const symbolRadius = Math.max(
      0.025,
      resolution * unit * (renderMode === "point" ? 2.8 : 4.4)
    );
    const symbol = renderMode === "point"
      ? new THREE.Mesh(
          new THREE.SphereGeometry(symbolRadius, 8, 6),
          new THREE.MeshStandardMaterial({color: plant.leafColor || plant.color || "#58895d", roughness: 0.74})
        )
      : new THREE.Mesh(
          new THREE.CylinderGeometry(symbolRadius, symbolRadius, Math.max(0.018, symbolRadius * 0.18), 16),
          new THREE.MeshStandardMaterial({color: plant.leafColor || plant.color || "#58895d", roughness: 0.82})
        );
    symbol.position.y = renderMode === "point" ? symbolRadius : symbolRadius * 0.12;
    plantGroup.add(symbol);
    plantGroup.userData.renderMode = `lod-${renderMode}`;
    if (selected) {
      const highlight = circleLineLoop(symbolRadius * 1.65, "#f1c65a");
      highlight.position.y = symbolRadius * 0.22;
      plantGroup.add(highlight);
    }
    return;
  }

  if(!ghost)plantGroup.scale.setScalar(sizeScale);
  const model = ghost ? null : gardenModelForPlant(three, plant);
  if (model) {
    plantGroup.rotation.y = Number(placement.rotation) || 0;
    addGardenModel3d(plantGroup, model, plant, unit);
    plantGroup.userData.modelId = model.id;
    plantGroup.userData.renderMode = "catalog-model";
    if (selected) {
      const highlight = circleLineLoop((plant.spacing || plant.matureDiameter) * unit / 2, "#f1c65a");
      highlight.position.y = 0.13;
      plantGroup.add(highlight);
    }
    return;
  }

  plantGroup.userData.renderMode = "procedural";

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(ghost ? 0.012 : 0.018, ghost ? 0.018 : 0.027, stemHeight, 8),
    new THREE.MeshStandardMaterial({color: ghost ? "#8ea898" : "#41654d", transparent: ghost, opacity: ghost ? 0.4 : 1, roughness: 0.72})
  );
  stem.position.y = stemHeight / 2;
  stem.castShadow = !ghost;
  plantGroup.add(stem);

  const leaves = leafInstances(plant, placement);
  for (const [index, leaf] of leaves.entries()) {
    if (ghost && index > 10) continue;
    const mesh = leafMesh(leaf, ghost);
    const layerY = leafHeight(visual, stemHeight, leaf.zLayer, unit);
    mesh.position.set(leaf.x * unit, layerY, leaf.y * unit);
    mesh.rotation.set(-Math.PI / 2 + leafTilt(visual, index), 0, -leaf.rotation + Math.PI / 2);
    mesh.castShadow = !ghost;
    mesh.receiveShadow = !ghost;
    plantGroup.add(mesh);

    if (!ghost && index % 3 !== 0) {
      const line = petioleLine(leaf.x * unit * 0.18, layerY - 0.03, leaf.y * unit * 0.18, leaf.x * unit * 0.82, layerY - 0.01, leaf.y * unit * 0.82);
      plantGroup.add(line);
    }
  }

  if (visual.fruitColor && !ghost) {
    for (let i = 0; i < Math.min(7, Math.round(leaves.length / 6)); i += 1) {
      const angle = i * goldenRatio() * Math.PI * 2 + plant.seed;
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry((visual.habit === "shrub" ? 0.055 : 0.07) * unit * 12, 10, 8),
        new THREE.MeshStandardMaterial({color: visual.fruitColor, roughness: 0.55})
      );
      fruit.position.set(Math.cos(angle) * plant.matureDiameter * unit * 0.18, stemHeight * (0.62 + i * 0.035), Math.sin(angle) * plant.matureDiameter * unit * 0.16);
      fruit.castShadow = true;
      plantGroup.add(fruit);
    }
  }

  if (visual.flowerColor && !ghost) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 6),
      new THREE.MeshStandardMaterial({color: visual.flowerColor, roughness: 0.65})
    );
    flower.position.set(plant.matureDiameter * unit * 0.26, stemHeight * 0.9, -plant.matureDiameter * unit * 0.1);
    flower.castShadow = true;
    plantGroup.add(flower);
  }

  fitProceduralPlantHeight(plantGroup,plant,unit);
  if (selected || ghost) {
    const highlight = circleLineLoop((plant.spacing || plant.matureDiameter) * unit / 2, selected ? "#f1c65a" : "#7fae8a");
    highlight.position.y = selected ? 0.13 : 0.095;
    plantGroup.add(highlight);
  }
}

function gardenModelForPlant(three, plant) {
  if (!three?.modelCatalog?.length) return null;
  const feature = three.modelCatalog.find((item) => modelAppliesToPlant(item, plant));
  if (!feature) return null;
  const modelId = feature.id;
  if (three.modelTemplates.has(modelId)) {
    const template = three.modelTemplates.get(modelId);
    return template ? {id: modelId, template} : null;
  }
  if (!three.modelLoads.has(modelId)) {
    const url = three.modelAssets[modelId];
    if (!url) {
      three.modelTemplates.set(modelId, null);
      three.modelErrors.set(modelId, "No bundled asset URL");
      return null;
    }
    const load = three.modelLoader.loadAsync(url)
      .then((gltf) => {
        const template = gltf.scene || gltf.scenes?.[0];
        if (!template) throw new Error("GLB contains no scene");
        template.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = true;
          object.receiveShadow = true;
        });
        three.modelTemplates.set(modelId, template);
        three.modelErrors.delete(modelId);
        if (three.state) syncThreeScene(three, three.state);
      })
      .catch((error) => {
        three.modelTemplates.set(modelId, null);
        three.modelErrors.set(modelId, error?.message || "Model load failed");
        updateThreeModelStatus(three);
      });
    three.modelLoads.set(modelId, load);
  }
  return null;
}

function addGardenModel3d(group, model, plant, unit) {
  const instance = cloneGardenModel(model.template);
  const sourceBounds = new THREE.Box3().setFromObject(instance);
  const sourceSize = sourceBounds.getSize(new THREE.Vector3());
  const targetHeight = (Number(plant.height)>0?Number(plant.height):18) * unit;
  const targetWidth = (Number(plant.matureDiameter)>0?Number(plant.matureDiameter):Number(plant.spacing)>0?Number(plant.spacing):18) * unit;
  const sourceHeight = Math.max(0.0001, sourceSize.y);
  const sourceWidth = Math.max(0.0001, sourceSize.x, sourceSize.z);
  instance.scale.multiply(new THREE.Vector3(targetWidth/sourceWidth,targetHeight/sourceHeight,targetWidth/sourceWidth));
  group.userData.heightInches=targetHeight/unit;group.userData.widthInches=targetWidth/unit;

  const scaledBounds = new THREE.Box3().setFromObject(instance);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  instance.position.set(-center.x, 0.025 - scaledBounds.min.y, -center.z);
  group.add(instance);
}

function cloneGardenModel(template) {
  const instance = template.clone(true);
  instance.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry = object.geometry?.clone();
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material?.clone();
    object.castShadow = true;
    object.receiveShadow = true;
  });
  return instance;
}

function updateThreeModelStatus(three) {
  const canvas = three?.renderer?.domElement;
  if (!canvas) return;
  const loaded = [...three.modelTemplates.values()].filter(Boolean).length;
  canvas.dataset.catalogModelsLoaded = String(loaded);
  canvas.dataset.catalogModelsLoading = String([...three.modelLoads.keys()].filter((id) => !three.modelTemplates.has(id)).length);
  canvas.dataset.catalogModelErrors = String(three.modelErrors.size);
}

async function loadGardenGlb(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load garden model: HTTP ${response.status}`);
  const {json, binary} = parseGardenGlb(await response.arrayBuffer());
  const materials = await Promise.all((json.materials || []).map((material) => gardenGlbMaterial(material, json, binary, url)));
  const meshes = (json.meshes || []).map((mesh) => gardenGlbMesh(mesh, json, binary, materials));
  const nodes = (json.nodes || []).map((node) => gardenGlbNode(node, meshes));

  for (const [index, node] of (json.nodes || []).entries()) {
    for (const child of node.children || []) nodes[index].add(nodes[child]);
  }

  const sceneDefinition = (json.scenes || [])[json.scene || 0] || {nodes: nodes.map((_, index) => index)};
  const scene = new THREE.Group();
  scene.name = sceneDefinition.name || "Garden GLB";
  for (const root of sceneDefinition.nodes || []) scene.add(nodes[root]);
  return {scene};
}

function parseGardenGlb(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error("Garden model is not binary glTF");
  if (view.getUint32(4, true) !== 2) throw new Error("Garden model must use glTF 2.0");

  let json = null;
  let binary = null;
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (type === 0x4e4f534a) {
      const text = new TextDecoder().decode(new Uint8Array(buffer, start, length)).replace(/\0+$/u, "");
      json = JSON.parse(text);
    } else if (type === 0x004e4942) {
      binary = buffer.slice(start, start + length);
    }
    offset = start + length;
  }
  if (!json || !binary) throw new Error("Garden GLB is missing its JSON or binary chunk");
  return {json, binary};
}

function gardenGlbMesh(definition, json, binary, materials) {
  const group = new THREE.Group();
  group.name = definition.name || "Garden model mesh";
  for (const primitive of definition.primitives || []) {
    if ((primitive.mode ?? 4) !== 4) throw new Error("Garden model contains an unsupported primitive mode");
    const geometry = new THREE.BufferGeometry();
    for (const [semantic, accessorIndex] of Object.entries(primitive.attributes || {})) {
      const name = {POSITION: "position", NORMAL: "normal", TEXCOORD_0: "uv", COLOR_0: "color"}[semantic];
      if (name) geometry.setAttribute(name, gardenGlbAccessor(json, binary, accessorIndex));
    }
    if (primitive.indices !== undefined) geometry.setIndex(gardenGlbAccessor(json, binary, primitive.indices));
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const material = materials[primitive.material] || new THREE.MeshStandardMaterial({color: "#64845f", roughness: 0.86});
    if (geometry.getAttribute("color")) material.vertexColors = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

function gardenGlbAccessor(json, binary, accessorIndex) {
  const accessor = json.accessors?.[accessorIndex];
  const bufferView = json.bufferViews?.[accessor?.bufferView];
  if (!accessor || !bufferView || accessor.sparse) throw new Error("Garden model contains an unsupported accessor");
  const component = gardenGlbComponent(accessor.componentType);
  const itemSize = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16}[accessor.type];
  if (!component || !itemSize) throw new Error("Garden model contains an unsupported component type");

  const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  const packedStride = component.bytes * itemSize;
  const stride = bufferView.byteStride || packedStride;
  let array;
  if (stride === packedStride && byteOffset % component.bytes === 0) {
    array = new component.Array(binary, byteOffset, accessor.count * itemSize).slice();
  } else {
    array = new component.Array(accessor.count * itemSize);
    const view = new DataView(binary);
    for (let item = 0; item < accessor.count; item += 1) {
      for (let value = 0; value < itemSize; value += 1) {
        array[item * itemSize + value] = view[component.reader](byteOffset + item * stride + value * component.bytes, true);
      }
    }
  }
  return new THREE.BufferAttribute(array, itemSize, accessor.normalized === true);
}

function gardenGlbComponent(type) {
  return {
    5120: {Array: Int8Array, bytes: 1, reader: "getInt8"},
    5121: {Array: Uint8Array, bytes: 1, reader: "getUint8"},
    5122: {Array: Int16Array, bytes: 2, reader: "getInt16"},
    5123: {Array: Uint16Array, bytes: 2, reader: "getUint16"},
    5125: {Array: Uint32Array, bytes: 4, reader: "getUint32"},
    5126: {Array: Float32Array, bytes: 4, reader: "getFloat32"}
  }[type];
}

async function gardenGlbMaterial(definition, json, binary, modelUrl) {
  const pbr = definition.pbrMetallicRoughness || {};
  const factor = pbr.baseColorFactor || [1, 1, 1, 1];
  const options = {
    color: new THREE.Color(factor[0], factor[1], factor[2]),
    opacity: factor[3],
    roughness: pbr.roughnessFactor ?? 0.86,
    metalness: pbr.metallicFactor ?? 0,
    transparent: definition.alphaMode === "BLEND" || factor[3] < 1,
    alphaTest: definition.alphaMode === "MASK" ? definition.alphaCutoff ?? 0.5 : 0,
    side: definition.doubleSided ? THREE.DoubleSide : THREE.FrontSide
  };
  if (pbr.baseColorTexture?.index !== undefined) {
    options.map = await gardenGlbTexture(pbr.baseColorTexture.index, json, binary, modelUrl);
    options.map.colorSpace = THREE.SRGBColorSpace;
    options.map.flipY = false;
  }
  const material = new THREE.MeshStandardMaterial(options);
  material.name = definition.name || "Garden model material";
  return material;
}

async function gardenGlbTexture(textureIndex, json, binary, modelUrl) {
  const textureDefinition = json.textures?.[textureIndex];
  const image = json.images?.[textureDefinition?.source];
  if (!image) throw new Error("Garden model texture is missing its image");
  if (image.uri) return new THREE.TextureLoader().loadAsync(new URL(image.uri, modelUrl).href);

  const bufferView = json.bufferViews?.[image.bufferView];
  if (!bufferView) throw new Error("Garden model image is missing its buffer view");
  const bytes = new Uint8Array(binary, bufferView.byteOffset || 0, bufferView.byteLength);
  const objectUrl = URL.createObjectURL(new Blob([bytes], {type: image.mimeType || "image/png"}));
  try {
    return await new THREE.TextureLoader().loadAsync(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function gardenGlbNode(definition, meshes) {
  const node = new THREE.Group();
  node.name = definition.name || "Garden model node";
  if (definition.mesh !== undefined && meshes[definition.mesh]) node.add(meshes[definition.mesh].clone());
  if (definition.matrix) {
    node.matrix.fromArray(definition.matrix);
    node.matrixAutoUpdate = false;
  } else {
    if (definition.translation) node.position.fromArray(definition.translation);
    if (definition.rotation) node.quaternion.fromArray(definition.rotation);
    if (definition.scale) node.scale.fromArray(definition.scale);
  }
  return node;
}

function leafMesh(leaf, ghost) {
  const shape = new THREE.Shape();
  const points = leafShapePoints(leaf.type, leaf.length * 0.055, leaf.width * 0.055, leaf.seed);
  points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point[0], point[1]);
    else shape.lineTo(point[0], point[1]);
  });
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, 2);
  const color = new THREE.Color(leaf.color);
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: ghost,
      opacity: ghost ? 0.34 : leaf.opacity,
      roughness: 0.78,
      metalness: 0.01,
      emissive: color.clone().multiplyScalar(0.035)
    })
  );
}

function leafShapePoints(type, length, width, seed) {
  const path = leafPath2d(type, length, width, seed);
  const pairs = [...path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)];
  return pairs.map((match) => [Number(match[1]), Number(match[2])]);
}

function stemHeightForPlant(plant, unit) {
  const profile = plant.visual?.heightProfile || "mounded";
  const factor = profile === "upright" ? 0.48 : profile === "woody" ? 0.5 : profile === "tuft" ? 0.34 : profile === "low" ? 0.16 : 0.28;
  return clamp(plant.height * unit * factor, 0.12, 2.8);
}

function leafHeight(visual, stemHeight, layer, unit) {
  if (visual.heightProfile === "low") return 0.1 + layer * 0.025;
  if (visual.heightProfile === "tuft") return 0.08 + layer * 0.06;
  if (visual.heightProfile === "woody") return stemHeight * (0.36 + layer * 0.1);
  if (visual.heightProfile === "upright") return stemHeight * (0.42 + layer * 0.11);
  return stemHeight * 0.28 + layer * unit * 1.2;
}

function leafTilt(visual, index) {
  if (visual.heightProfile === "upright") return 0.18 + (index % 3) * 0.07;
  if (visual.heightProfile === "low") return 0.05;
  if (visual.heightProfile === "tuft") return 0.32 + (index % 2) * 0.18;
  return 0.12 + (index % 4) * 0.045;
}

function petioleLine(x1, y1, z1, x2, y2, z2) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)]),
    new THREE.LineBasicMaterial({color: "#31533b", transparent: true, opacity: 0.42})
  );
}

function disposeGroup(group) {
  group.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
  });
}

function rectLineLoop(width, height, color) {
  const points = [
    new THREE.Vector3(-width / 2, 0, -height / 2),
    new THREE.Vector3(width / 2, 0, -height / 2),
    new THREE.Vector3(width / 2, 0, height / 2),
    new THREE.Vector3(-width / 2, 0, height / 2),
    new THREE.Vector3(-width / 2, 0, -height / 2)
  ];
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({color, linewidth: 2})
  );
}

function circleLineLoop(radius, color) {
  const points = [];
  for (let i = 0; i <= 96; i += 1) {
    const angle = i / 96 * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({color, transparent: true, opacity: 0.78})
  );
}

function plantCanopyMesh(plant, placement, unit) {
  const points = organicOutlinePoints(0, 0, plant.matureDiameter * unit / 2, plant.matureDiameter * unit * 0.42, plant.seed + placement.id.length, 48);
  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point[0], point[1]);
    else shape.lineTo(point[0], point[1]);
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.04, plant.height * unit * 0.045),
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2
  });
  geometry.rotateX(-Math.PI / 2);

  const color = new THREE.Color(plant.leafColor || plant.color || "#5b8f5c");
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.02,
    emissive: color.clone().multiplyScalar(0.08)
  });
  return new THREE.Mesh(geometry, material);
}

function fillBedWithSelectedPlant(state, positions) {
  const plant = selectedPlant(state);
  const bed = activeBed(state);
  const reservedIds = new Set();
  const placements = positions.map(({x, y}) => ({
    id: uniquePlacementId(state, reservedIds),
    bedId: bed.id,
    plantId: plant.id,
    x,
    y,
    planted: todayIso(),
    health: "starting",
    notes: "",
    rotation: ((x + y) % 17) * 0.08
  }));

  state.placements = [
    ...state.placements.filter((placement) => placement.bedId !== bed.id),
    ...placements
  ];
  state.selectedPlacementId = placements[0]?.id || null;
}

function addPlacementAtBestOpenPoint(state) {
  const plant = selectedPlant(state);
  if (!plant) return;
  const best = bestOpenPoint(state, plant);
  addPlacement(state, plant.id, best.x, best.y);
}

function bestOpenPoint(state, plant) {
  const bed = activeBed(state);
  const spacing = Math.max(plant.spacing * bed.crowding, 4);
  const margin = bed.safeMargin + spacing / 2;
  const candidates = [];

  for (let y = margin; y <= bed.height - margin; y += Math.max(3, bed.grid)) {
    for (let x = margin; x <= bed.width - margin; x += Math.max(3, bed.grid)) {
      const nearest = nearestPlacementDistance(state, x, y, plant);
      candidates.push({x, y, nearest});
    }
  }

  candidates.sort((a, b) => b.nearest - a.nearest);
  const best = candidates[0] || {x: bed.width / 2, y: bed.height / 2};
  return {...best, rotation: (best.x + best.y + plant.seed) * 0.03};
}

function addPlacement(state, plantId, x, y) {
  const bed = activeBed(state);
  const placement = {
    id: uniquePlacementId(state),
    bedId: bed.id,
    plantId,
    x: clamp(x, 0, bed.width),
    y: clamp(y, 0, bed.height),
    planted: todayIso(),
    health: "starting",
    notes: "",
    rotation: Math.random() * Math.PI
  };
  state.placements.push(placement);
  state.selectedPlacementId = placement.id;
}

function finishDraftBedPolygon(state) {
  const points = dedupeConsecutivePoints(state.draftBedPoints || []);
  if (points.length < 3) return false;
  const bounds = boundsFromPoints(points, 0);
  const index = state.beds.length + 1;
  const bed = normalizeBed({
    id: uniqueBedId(state),
    name: `Garden area ${index}`,
    zone: "Drawn bed",
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    width: Math.max(24, bounds.width),
    height: Math.max(18, bounds.height),
    rotation: 0,
    safeMargin: 6,
    grid: 12,
    crowding: 1,
    showSpacing: true,
    polygon: points,
    notes: "Drawn from the parcel map polygon tool."
  });
  state.beds.push(bed);
  state.activeBedId = bed.id;
  state.selectedPlacementId = null;
  state.drawMode = null;
  state.draftBedPoints = [];
  return true;
}

function addStructure(state) {
  const bed = activeBed(state);
  const structure = normalizeStructure({
    id: uniqueStructureId(state),
    name: `Structure ${state.structures.length + 1}`,
    type: "structure",
    x: bed.x + Math.max(96, bed.width * 0.9),
    y: bed.y,
    width: 96,
    height: 48,
    rotation: 0,
    notes: "User-added map feature. Adjust position, size, type, and notes from the inspector."
  });
  state.structures.push(structure);
  state.selectedStructureId = structure.id;
  state.selectedPlacementId = null;
}

function addPlannedPlanting(state,form,point){
  const presets={tree:['Deciduous tree','tree','deciduous',240,240,20],evergreen:['Evergreen tree','tree','evergreen',180,180,20],shrub:['Shrub','shrub','shrub',72,72,4],hedge:['Hedge mass','shrub','shrub',144,36,6],canopy:['Canopy area','canopy','mixed',360,240,20]};
  const [name,kind,canopyClass,width,height,rise]=presets[form]||presets.tree;
  const item={id:uniqueVegetationId(state),name,kind,canopyClass,x:point.x,y:point.y,width,height,heightEstimateFeet:rise,confidence:'low',plantId:null,source:'User-planned structural planting',notes:'Illustrative form and dimensions, not a measured observation. Choose species and adjust sizes in the inspector.'};
  if(kind==='tree')Object.assign(item,{geometryRepresentation:'point',localGeometry:{type:'Point',coordinates:[point.x,point.y]},crownWidthFeet:width/12,crownDepthFeet:height/12});
  const planted=normalizeVegetation([item])[0];state.vegetation.push(planted);state.selectedVegetationId=planted.id;state.selectedStructureId=null;state.selectedPlacementId=null;
}

function addVegetation(state, observedPoint = null) {
  const bed = activeBed(state);
  const vegetation = normalizeVegetation([{
    id: uniqueVegetationId(state),
    plantId: null,
    name: `Planned tree ${state.vegetation.length + 1}`,
    kind: "tree",
    observationType: "planned-tree",
    geometryRepresentation: "point",
    identificationStatus: "planned tree; taxon unidentified",
    taxonStatus: "unidentified",
    canopyClass: "unknown",
    x: bed.x,
    y: bed.y + Math.max(240, bed.height * 2),
    crownWidthFeet: 20,
    crownDepthFeet: 20,
    crownDiameterFeet: 20,
    crownRadiusEastWestFeet: 10,
    crownRadiusNorthSouthFeet: 10,
    heightEstimateFeet: 20,
    width: 240,
    height: 240,
    rotation: 0,
    confidence: "low",
    source: "User-planned tree point",
    localGeometry: {type: "Point", coordinates: [bed.x, bed.y + Math.max(240, bed.height * 2)]},
    notes: "User-added tree center. Crown and height are editable planning estimates; choose a species only when one is intended."
  }])[0];
  if (observedPoint) {
    Object.assign(vegetation, {
      x: observedPoint.x, y: observedPoint.y,
      localGeometry: {type: "Point", coordinates: [observedPoint.x, observedPoint.y]},
      absoluteLocalPoint: [observedPoint.x, observedPoint.y],
      name: `Unidentified tree ${state.vegetation.length + 1}`,
      observationType: "imagery-interpreted-tree",
      identificationStatus: "unidentified; imagery interpretation only",
      source: "User-interpreted point on aerial map",
      crownMeasurementMethod: "Initial 20 ft planning placeholder; not measured",
      crownConfidence: "low",
      heightEstimateMethod: "Not measured",
      heightConfidence: "unknown",
      notes: "Center marked by user from map inspection. Presence and crown extent need verification; species and height are unknown."
    });
    delete vegetation.heightEstimateFeet;
  }
  state.vegetation.push(vegetation);
  state.selectedVegetationId = vegetation.id;
  state.selectedStructureId = null;
  state.selectedPlacementId = null;
}

function dedupeConsecutivePoints(points) {
  const deduped = [];
  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) continue;
    const next = [Number(point[0]) || 0, Number(point[1]) || 0];
    const prev = deduped[deduped.length - 1];
    if (prev && Math.hypot(prev[0] - next[0], prev[1] - next[1]) < 8) continue;
    deduped.push(next);
  }
  if (deduped.length > 2 && Math.hypot(deduped[0][0] - deduped.at(-1)[0], deduped[0][1] - deduped.at(-1)[1]) < 8) {
    deduped.pop();
  }
  return deduped;
}

function deleteSelectedPlacement(state) {
  return deletePlacement(state, state.selectedPlacementId);
}

function deleteSelectedStructure(state) {
  return deleteStructure(state, state.selectedStructureId);
}

function deleteSelectedVegetation(state) {
  return deleteVegetation(state, state.selectedVegetationId);
}

function deleteBed(state, bedId) {
  if (!bedId) return false;
  const before = state.beds.length;
  state.beds = state.beds.filter((item) => item.id !== bedId);
  state.placements = state.placements.filter((placement) => placement.bedId !== bedId);
  if (state.activeBedId === bedId) state.activeBedId = state.beds[0]?.id || DEFAULT_ACTIVE_BED_ID;
  if (!state.placements.some((placement) => placement.id === state.selectedPlacementId)) state.selectedPlacementId = null;
  syncSelectedPlacementToActiveBed(state);
  return state.beds.length !== before;
}

function deleteStructure(state, structureId) {
  if (!structureId) return false;
  const before = state.structures.length;
  state.structures = state.structures.filter((item) => item.id !== structureId);
  if (state.selectedStructureId === structureId) state.selectedStructureId = null;
  return state.structures.length !== before;
}

function deleteVegetation(state, vegetationId) {
  if (!vegetationId) return false;
  const before = state.vegetation.length;
  state.vegetation = state.vegetation.filter((item) => item.id !== vegetationId);
  if (state.selectedVegetationId === vegetationId) state.selectedVegetationId = null;
  return state.vegetation.length !== before;
}

function deletePlacement(state, placementId) {
  if (!placementId) return false;
  const placement = state.placements.find((item) => item.id === placementId);
  if (!placement) return false;
  state.placements = state.placements.filter((item) => item.id !== placementId);
  state.activeBedId = placement.bedId || state.activeBedId;
  if (state.selectedPlacementId === placementId) state.selectedPlacementId = null;
  syncSelectedPlacementToActiveBed(state);
  return true;
}

function saveNamedLayout(state, name) {
  syncActiveParcelWorkspace(state);
  const gardenId = state.activeParcelId;
  const id = `${gardenId}:${slugify(name) || `layout-${Date.now().toString(36)}`}`;
  const workspace = structuredCloneCompat(activeParcelWorkspace(state));
  const snapshot = {
    id,
    name,
    gardenId,
    savedAt: new Date().toISOString(),
    viewMode: state.viewMode,
    viewPresentation: state.viewPresentation,
    basemapId: state.basemapId,
    activeParcelId: gardenId,
    workspace,
    property: structuredCloneCompat(state.property),
    activeBedId: state.activeBedId,
    bedCameras: structuredCloneCompat(state.bedCameras || {}),
    beds: structuredCloneCompat(state.beds),
    bed: structuredCloneCompat(state.bed),
    placements: structuredCloneCompat(state.placements),
    structures: structuredCloneCompat(state.structures || []),
    vegetation: structuredCloneCompat(state.vegetation || []),
    selectedStructureId: state.selectedStructureId,
    selectedVegetationId: state.selectedVegetationId,
    parcelBufferInches: state.parcelBufferInches,
    parcelViewport: structuredCloneCompat(state.parcelViewport),
    viewBearing: state.viewBearing,
    viewPitch: state.viewPitch,
    showVegetation: state.showVegetation,
    vegetationOpacity: state.vegetationOpacity,
    mapSettings: structuredCloneCompat(state.mapSettings)
  };
  state.layouts = [
    snapshot,
    ...(state.layouts || []).filter((layout) => layout.id !== id)
  ].slice(0, 48);
  state.layoutName = name;
}

function loadNamedLayout(state, id) {
  if (!id || id === "__current__") return;
  const layout = (state.layouts || []).find((item) => item.id === id);
  if (!layout) return;
  syncActiveParcelWorkspace(state);
  const gardenId = layout.gardenId || layout.activeParcelId || state.activeParcelId;
  const legacyWorkspace = (layout.parcels || []).find((workspace) => workspace.id === gardenId);
  const workspace = layout.workspace || legacyWorkspace || {
    id: gardenId,
    name: layout.property?.name || activeParcelWorkspace(state)?.name || "Garden",
    property: layout.property || state.property,
    activeBedId: layout.activeBedId,
    bedCameras: layout.bedCameras || {},
    beds: layout.beds,
    structures: layout.structures,
    vegetation: layout.vegetation,
    placements: layout.placements,
    selectedStructureId: layout.selectedStructureId,
    selectedVegetationId: layout.selectedVegetationId,
    selectedPlacementId: layout.selectedPlacementId,
    parcelBufferInches: layout.parcelBufferInches,
    parcelViewport: layout.parcelViewport,
    viewBearing: layout.viewBearing,
    viewPitch: layout.viewPitch
  };
  const normalizedWorkspace = normalizeParcelWorkspace(workspace);
  const existingIndex = (state.parcels || []).findIndex((garden) => garden.id === normalizedWorkspace.id);
  if (existingIndex >= 0) state.parcels[existingIndex] = normalizedWorkspace;
  else state.parcels = [...(state.parcels || []), normalizedWorkspace];
  applyParcelWorkspace(state, normalizedWorkspace);
  state.viewMode = normalizeViewMode(layout.viewMode || state.viewMode);
  state.viewPresentation = normalizeViewPresentation(layout.viewPresentation || state.viewPresentation);
  state.basemapId = normalizeBasemapId(state, layout.basemapId || state.basemapId);
  state.layoutName = layout.name;
  state.showVegetation = layout.showVegetation !== false;
  state.vegetationOpacity = layout.vegetationOpacity ?? state.vegetationOpacity;
  state.mapSettings = normalizeMapSettings(layout.mapSettings, layout.showVegetation);
  state.viewBearing = normalizeViewBearing(layout.viewBearing ?? state.viewBearing);
  state.viewPitch = normalizeViewPitch(layout.viewPitch ?? state.viewPitch);
  normalizeStateShape(state);
  syncSelectedPlacementToActiveBed(state);
}

function deleteNamedLayout(state, id) {
  if (!id || id === "__current__") return;
  state.layouts = (state.layouts || []).filter((layout) => layout.id !== id);
  state.layoutName = `${activeParcelWorkspace(state)?.name || "Garden"} · working`;
}

function nearestPlacementDistance(state, x, y, plant) {
  const bed = activeBed(state);
  let nearest = Infinity;
  for (const other of placementsForBed(state, bed.id)) {
    const otherPlant = plantById(state, other.plantId);
    if (!otherPlant) continue;
    const required = (plant.spacing + otherPlant.spacing) * bed.crowding / 2;
    const distance = Math.hypot(x - other.x, y - other.y) - required;
    nearest = Math.min(nearest, distance);
  }
  return Number.isFinite(nearest) ? nearest : 999;
}

function placementStatus(placement, state) {
  const plant = plantById(state, placement.plantId);
  if (!plant) return {ok: false, messages: ["Missing plant data"]};
  const bed = bedForPlacement(state, placement);
  if (!bed) return {ok: false, messages: ["Observation is not associated with a bed"]};

  const messages = [];
  const margin = bed.safeMargin;
  if (placement.x < margin || placement.y < margin || placement.x > bed.width - margin || placement.y > bed.height - margin) {
    messages.push("root outside safe perimeter");
  }

  for (const other of placementsForBed(state, bed.id)) {
    if (other.id === placement.id) continue;
    const otherPlant = plantById(state, other.plantId);
    if (!otherPlant) continue;
    const required = (plant.spacing + otherPlant.spacing) * bed.crowding / 2;
    const distance = Math.hypot(placement.x - other.x, placement.y - other.y);
    if (distance < required) {
      messages.push(`${plant.name} and ${otherPlant.name} roots need ${round(required - distance)} in more space`);
    }
    const canopyRequired = (plant.matureDiameter + otherPlant.matureDiameter) * 0.36;
    if (distance < canopyRequired) {
      messages.push(`${plant.name} and ${otherPlant.name} canopies are close enough to affect light and airflow`);
    }
  }

  return {ok: messages.length === 0, messages};
}

function collectSpacingIssues(state) {
  const bed = activeBed(state);
  const placements = activePlacements(state);
  const issues = new Set();
  for (const placement of placements) {
    const plant = plantById(state, placement.plantId);
    if (!plant) continue;
    const margin = bed.safeMargin;
    if (placement.x < margin || placement.y < margin || placement.x > bed.width - margin || placement.y > bed.height - margin) {
      issues.add(`${plant.name} root is outside the safe perimeter`);
    }
  }

  for (let i = 0; i < placements.length; i += 1) {
    const a = placements[i];
    const plantA = plantById(state, a.plantId);
    if (!plantA) continue;
    for (let j = i + 1; j < placements.length; j += 1) {
      const b = placements[j];
      const plantB = plantById(state, b.plantId);
      if (!plantB) continue;
      const required = (plantA.spacing + plantB.spacing) * bed.crowding / 2;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < required) {
        issues.add(`${plantA.name} and ${plantB.name} need ${round(required - distance)} in more root spacing`);
      }
      const canopyRequired = (plantA.matureDiameter + plantB.matureDiameter) * 0.36;
      if (distance < canopyRequired) {
        issues.add(`${plantA.name} and ${plantB.name} canopies may limit airflow or lower-leaf light`);
      }
    }
  }
  return [...issues];
}

function irrigationZones(state) {
  const zones = new Map();
  for (const placement of state.placements) {
    const plant = plantById(state, placement.plantId);
    if (!plant) continue;
    const key = plant.zone || "A";
    if (!zones.has(key)) zones.set(key, {zone: key, count: 0, styles: new Set(), emitters: new Set()});
    const zone = zones.get(key);
    zone.count += 1;
    zone.styles.add(plant.waterStyle);
    zone.emitters.add(plant.emitter);
  }
  return [...zones.values()].map((zone) => ({
    ...zone,
    styles: [...zone.styles],
    emitters: [...zone.emitters]
  })).sort((a, b) => a.zone.localeCompare(b.zone));
}

function clampPlacements(state) {
  state.viewMode = normalizeViewMode(state.viewMode);
  state.viewPresentation = normalizeViewPresentation(state.viewPresentation);
  state.activeTool = normalizeActiveTool(state.activeTool);
  state.inspectorMode = normalizeInspectorMode(state.inspectorMode);
  state.inspectorTab = normalizeInspectorTab(state.inspectorTab);
  state.basemapId = normalizeBasemapId(state, state.basemapId);
  if (state.property?.imagery) state.property.imagery.activeBasemapId = state.basemapId;
  if (!Array.isArray(state.layouts)) state.layouts = [];
  if (!Array.isArray(state.beds)) state.beds = normalizeBeds(state.beds, state.bed);
  for (const bed of state.beds) {
    Object.assign(bed, normalizeBed(bed));
  }
  if (!state.beds.some((bed) => bed.id === state.activeBedId)) state.activeBedId = state.beds[0]?.id || DEFAULT_ACTIVE_BED_ID;
  if (!Array.isArray(state.structures)) state.structures = [];
  for (const structure of state.structures) {
    Object.assign(structure, normalizeStructure(structure));
  }
  if (!state.structures.some((structure) => structure.id === state.selectedStructureId)) state.selectedStructureId = null;
  if (!Array.isArray(state.vegetation)) state.vegetation = structuredCloneCompat(DEFAULT_VEGETATION);
  for (const vegetation of state.vegetation) {
    Object.assign(vegetation, normalizeVegetation([vegetation])[0]);
  }
  if (!state.vegetation.some((vegetation) => vegetation.id === state.selectedVegetationId)) state.selectedVegetationId = null;
  state.parcelBufferInches = clamp(Number(state.parcelBufferInches) || 1800, 360, 7200);
  state.parcelViewport = normalizeParcelViewport(state, state.parcelViewport);
  state.viewBearing = normalizeViewBearing(state.viewBearing);
  state.viewPitch = normalizeViewPitch(state.viewPitch);
  state.mapSettings = normalizeMapSettings(state.mapSettings, state.showVegetation);
  state.showVegetation = state.mapSettings.showVegetation;
  state.vegetationOpacity = clamp(Number(state.vegetationOpacity) || 0.62, 0.12, 1);
  if (!Array.isArray(state.placements)) state.placements = [];
  for (const placement of state.placements) {
    const bed = bedForPlacement(state, placement);
    if (!bed) {
      // Bedless source observations are absolute GIS points. Do not clamp them
      // into whichever bed happens to be active in the interface.
      if (Array.isArray(placement.absoluteLocalPoint)) {
        placement.x = Number(placement.absoluteLocalPoint[0]) || 0;
        placement.y = Number(placement.absoluteLocalPoint[1]) || 0;
      }
      continue;
    }
    placement.x = clamp(Number(placement.x) || 0, 0, bed.width);
    placement.y = clamp(Number(placement.y) || 0, 0, bed.height);
  }
  state.bed = bedControlSnapshot(activeBed(state));
}

function selectedPlant(state) {
  return plantById(state, state.selectedPlantId) || state.plants[0];
}

function selectedPlacement(state) {
  return state.placements.find((placement) => placement.id === state.selectedPlacementId) || null;
}

function selectedStructure(state) {
  return state.structures.find((structure) => structure.id === state.selectedStructureId) || null;
}

function selectedVegetation(state) {
  return state.vegetation.find((vegetation) => vegetation.id === state.selectedVegetationId) || null;
}

function activeBed(state) {
  return state.beds.find((bed) => bed.id === state.activeBedId) || state.beds[0] || normalizeBed(DEFAULT_BEDS[0]);
}

function activePlacements(state) {
  return placementsForBed(state, activeBed(state).id);
}

function placementsForBed(state, bedId) {
  return state.placements.filter((placement) => placement.bedId === bedId
    || (!placement.bedId && !Array.isArray(placement.absoluteLocalPoint) && state.activeBedId === bedId));
}

function bedForPlacement(state, placement) {
  const explicit = state.beds.find((bed) => bed.id === placement?.bedId);
  if (explicit) return explicit;
  return Array.isArray(placement?.absoluteLocalPoint) ? null : activeBed(state);
}

function syncSelectedPlacementToActiveBed(state) {
  const selected = selectedPlacement(state);
  if (selected?.bedId === activeBed(state).id) return;
  state.selectedPlacementId = activePlacements(state)[0]?.id || null;
  state.bed = bedControlSnapshot(activeBed(state));
}

function plantById(state, id) {
  return state.plants.find((plant) => plant.id === id) || null;
}

function nativeTreePlants(state) {
  return state.plants.filter((plant) => plant.group === "Native Tree");
}

function spacingRadius(plant, bed) {
  return plant ? plant.spacing * bed.crowding / 2 : 0;
}

function plantFootprintPath(plant, placement) {
  if (!plant) return "";
  const rx = Math.max(2, plant.matureDiameter / 2);
  const ry = Math.max(2, plant.matureDiameter * 0.42);
  const points = organicOutlinePoints(0, 0, rx, ry, plant.seed + placement.id.length, 48);
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function leafInstances(plant, placement) {
  const visual = plant.visual || normalizePlant(plant).visual;
  const count = Math.max(8, Math.round(visual.leafCount * visual.density));
  const canopyRadius = plant.matureDiameter / 2;
  const leaves = [];
  const seed = (Number.isFinite(plant.seed) ? plant.seed : hashString(plant.id || plant.name || "plant")) + hashString(placement.id || "") * 0.017;

  for (let index = 0; index < count; index += 1) {
    const turn = index / count;
    const jitter = Math.sin(seed * 0.7 + index * 2.31) * 0.22;
    const angle = turn * Math.PI * 2 * goldenRatio() + jitter + (placement.rotation || 0);
    const layer = index % Math.max(1, visual.layers);
    const radialBase = visual.habit === "rosette" ? 0.18 + 0.68 * (index / Math.max(1, count - 1)) : 0.18 + 0.62 * pseudoRandom(seed, index);
    const radial = clamp(radialBase, 0.06, 0.92) * canopyRadius;
    const pairedOffset = visual.habit === "paired" ? (index % 2 ? 0.18 : -0.18) : 0;
    const x = Math.cos(angle + pairedOffset) * radial * (visual.habit === "trailing" ? 1.12 : 0.92);
    const y = Math.sin(angle + pairedOffset) * radial * (visual.habit === "vine" ? 0.76 : 0.9);
    const leafScale = 0.78 + pseudoRandom(seed + 17, index) * 0.52;
    const layerScale = 1 - layer * 0.045;

    leaves.push({
      x,
      y,
      zLayer: layer,
      rotation: angle + (visual.habit === "rosette" ? 0 : Math.sin(index + seed) * 0.42),
      length: visual.leafLength * leafScale * layerScale,
      width: visual.leafWidth * (0.82 + pseudoRandom(seed + 31, index) * 0.36),
      type: visual.leafShape,
      color: varyColor(plant.leafColor || plant.color || "#5b8f5c", index, seed),
      opacity: clamp(0.68 + visual.density * 0.1, 0.7, 0.94),
      seed: seed + index * 0.37
    });
  }

  return leaves;
}

function leafPath2d(type, length, width, seed = 0) {
  if (type === "filament") return filamentLeafPath(length, width, seed);
  if (type === "round") return roundLeafPath(length, width, seed);
  if (type === "lobed") return lobedLeafPath(length, width, seed);
  if (type === "compound") return compoundLeafPath(length, width, seed);
  if (type === "spoon") return spoonLeafPath(length, width, seed);
  return ovalLeafPath(length, width, seed);
}

function ovalLeafPath(length, width, seed) {
  const points = [];
  const steps = 22;
  for (let i = 0; i < steps; i += 1) {
    const a = i / steps * Math.PI * 2;
    const taper = 0.72 + 0.28 * Math.sin(a);
    const wobble = 1 + Math.sin(a * 5 + seed) * 0.045;
    points.push([Math.cos(a) * width * taper * wobble, Math.sin(a) * length * 0.52 * wobble]);
  }
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function spoonLeafPath(length, width, seed) {
  const points = [];
  const steps = 28;
  for (let i = 0; i < steps; i += 1) {
    const a = i / steps * Math.PI * 2;
    const topBias = Math.sin(a) > 0 ? 1.25 : 0.56;
    const wobble = 1 + Math.sin(a * 4 + seed) * 0.05;
    points.push([Math.cos(a) * width * topBias * wobble, Math.sin(a) * length * 0.48 * wobble + length * 0.12]);
  }
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function lobedLeafPath(length, width, seed) {
  const points = [];
  const steps = 34;
  for (let i = 0; i < steps; i += 1) {
    const a = i / steps * Math.PI * 2;
    const lobe = 1 + Math.sin(a * 7 + seed) * 0.18 + Math.sin(a * 3 - seed) * 0.08;
    points.push([Math.cos(a) * width * lobe, Math.sin(a) * length * 0.52 * lobe]);
  }
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function compoundLeafPath(length, width, seed) {
  const points = [];
  const steps = 36;
  for (let i = 0; i < steps; i += 1) {
    const a = i / steps * Math.PI * 2;
    const serration = 1 + Math.sin(a * 11 + seed) * 0.1;
    const leaflet = 0.72 + Math.abs(Math.sin(a * 3)) * 0.45;
    points.push([Math.cos(a) * width * leaflet * serration, Math.sin(a) * length * 0.58 * serration]);
  }
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function roundLeafPath(length, width, seed) {
  const points = organicOutlinePoints(0, 0, width * 0.9, length * 0.48, seed, 24);
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function filamentLeafPath(length, width, seed) {
  const x1 = -width * (0.5 + Math.sin(seed) * 0.2);
  const x2 = width * (0.45 + Math.cos(seed) * 0.2);
  return `M ${round(x1)},${round(length * 0.48)} C ${round(-width * 1.2)},${round(length * 0.1)} ${round(width * 1.2)},${round(-length * 0.12)} ${round(x2)},${round(-length * 0.52)}`;
}

function bedOutlinePath(width, height) {
  const points = [];
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push([width * t, wiggle(t, 1) * 1.6]);
  }
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    points.push([width + wiggle(t, 2) * 1.3, height * t]);
  }
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    points.push([width * (1 - t), height + wiggle(t, 3) * 1.6]);
  }
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    points.push([wiggle(t, 4) * 1.3, height * (1 - t)]);
  }
  return `M ${points.map(([x, y]) => `${round(x)},${round(y)}`).join(" L ")} Z`;
}

function organicOutlinePoints(cx, cy, rx, ry, seed, count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const angle = i / count * Math.PI * 2;
    const n = 1
      + Math.sin(angle * 3 + seed * 0.13) * 0.12
      + Math.sin(angle * 7 + seed * 0.31) * 0.08
      + Math.cos(angle * 11 + seed * 0.19) * 0.055;
    points.push([cx + Math.cos(angle) * rx * n, cy + Math.sin(angle) * ry * n]);
  }
  return points;
}

function wiggle(t, seed) {
  return Math.sin(t * Math.PI * 7 + seed) * 0.55 + Math.sin(t * Math.PI * 17 + seed * 0.7) * 0.32;
}

function structureLayerRank(structure) {
  const definition = siteFeatureDefinition(structure);
  if (definition.category === "landscape" && definition.defaultGeometryKind !== "Point") return -2;
  if (definition.category === "water" && definition.defaultGeometryKind !== "Point") return -1;
  if (structure.type === "parking") return 0;
  if (["road", "driveway"].includes(structure.type)) return 1;
  if (["path", "trail", "stairs"].includes(structure.type)) return 2;
  if (definition.defaultGeometryKind === "Point") return 4;
  return 3;
}

function structureLabel(structure) {
  if (structure.name) return structure.name;
  if (structure.type === "greenhouse") return "greenhouse";
  if (structure.type === "compost") return "compost";
  if (structure.type === "path") return "path";
  if (structure.type === "road") return "road";
  if (structure.type === "parking") return "parking";
  if (structure.type === "water") return "water";
  if (structure.type === "orchard") return "orchard";
  if (structure.type === "house") return "house";
  return "structure";
}

function vegetationFill(vegetation, state) {
  const plant = plantById(state, vegetation.plantId);
  if (plant?.leafColor) return plant.leafColor;
  if (vegetation.canopyClass === "evergreen") return "#2f6650";
  if (vegetation.canopyClass === "deciduous") return "#6f8a4c";
  return "#55775a";
}

function goldenRatio() {
  return 0.618033988749895;
}

function pseudoRandom(seed, index) {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function varyColor(color, index, seed) {
  const base = d3.color(color) || d3.color("#5b8f5c");
  const shift = (pseudoRandom(seed, index) - 0.5) * 0.7;
  return shift > 0 ? base.brighter(shift).formatHex() : base.darker(Math.abs(shift)).formatHex();
}

function plantInitials(plant) {
  if (!plant?.name) return "?";
  const parts = plant.name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function isInsideBed(x, y, bed) {
  return x >= 0 && y >= 0 && x <= bed.width && y <= bed.height;
}

function numberFromForm(form, name, fallback) {
  return Number.parseFloat(form.get(name)) || fallback;
}

function uniquePlantId(state, base) {
  let id = base || "plant";
  let index = 2;
  const ids = new Set(state.plants.map((plant) => plant.id));
  while (ids.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function uniquePlacementId(state, reservedIds) {
  let id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  while (reservedIds?.has(id) || state.placements.some((placement) => placement.id === id)) {
    id = `p${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  }
  reservedIds?.add(id);
  return id;
}

function uniqueBedId(state) {
  let id = `bed-${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  while (state.beds.some((bed) => bed.id === id)) {
    id = `bed-${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  }
  return id;
}

function uniqueStructureId(state) {
  let id = `structure-${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  while (state.structures.some((structure) => structure.id === id)) {
    id = `structure-${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  }
  return id;
}

function uniqueVegetationId(state) {
  let id = `veg-${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  while (state.vegetation.some((vegetation) => vegetation.id === id)) {
    id = `veg-${Date.now().toString(36)}${Math.floor(Math.random() * 999).toString(36)}`;
  }
  return id;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "plant";
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function crowdingLabel(value) {
  if (value < 0.88) return "tight";
  if (value > 1.16) return "loose";
  return "balanced";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function visibleGridStep(width, height, grid, maxLines = 120) {
  const base = Math.max(3, Number(grid) || 6);
  const largestSide = Math.max(Number(width) || 0, Number(height) || 0);
  if (!Number.isFinite(largestSide) || largestSide <= 0) return base;
  return Math.max(base, Math.ceil(largestSide / maxLines / base) * base);
}

function localUnitsForScreenPixels(svg, pixels) {
  const candidate = typeof svg.node === "function" ? svg.node() : svg;
  // Renderers commonly receive a transformed world <g>. Screen-stable symbols
  // must use its owning SVG viewport, not the content bounding box of that group.
  const node = candidate?.ownerSVGElement || candidate;
  const viewBox = node?.viewBox?.baseVal;
  const rect = node?.getBoundingClientRect?.();
  if (!viewBox?.width || !viewBox?.height || !rect?.width || !rect?.height) return pixels;
  return pixels * Math.max(viewBox.width / rect.width, viewBox.height / rect.height);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function structuredCloneCompat(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .garden-planner-app {
      --bg: #f4f7f4;
      --panel: #ffffff;
      --panel-soft: #fbfdfb;
      --panel-muted: #f3f6f2;
      --panel-hover: #f7fbf6;
      --panel-selected: #eef6ed;
      --toolbar: #f8fbf7;
      --canvas: #edf3ef;
      --canvas-deep: #dfe6dc;
      --line: #d7dfd5;
      --line-strong: #a8b8a5;
      --text: #17231b;
      --muted: #607066;
      --green: #2e6545;
      --blue: #315d79;
      --amber: #b87c2b;
      --rose: #af5148;
      --soil: #594538;
      --accent-fill: #2e6545;
      --accent-border: #6f9977;
      --on-accent: #ffffff;
      --disabled: #89958c;
      --success-bg: #f3faf2;
      --success-line: #adc9b3;
      --danger: #8f342d;
      --danger-bg: #fff5f3;
      --danger-line: #e0b1ac;
      --shadow-soft: rgba(28, 48, 35, 0.18);
      --shadow-strong: rgba(28, 48, 35, 0.24);
      color-scheme: light;
      color: var(--text);
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      width: 100%;
      max-width: var(--max-wide, 1120px);
      margin: 0 auto;
    }

    @media (prefers-color-scheme: dark) {
      .garden-planner-app {
        --bg: #141a15;
        --panel: #1d251e;
        --panel-soft: #182019;
        --panel-muted: #222b23;
        --panel-hover: #273229;
        --panel-selected: #2b3a2d;
        --toolbar: #202921;
        --canvas: #202923;
        --canvas-deep: #29332d;
        --line: #354338;
        --line-strong: #596a5c;
        --text: #edf4ed;
        --muted: #a8b6aa;
        --green: #9bc6a3;
        --blue: #92bad3;
        --amber: #dfad63;
        --rose: #e29188;
        --soil: #c0a58b;
        --accent-fill: #3b744f;
        --accent-border: #789b7f;
        --on-accent: #f7fff8;
        --disabled: #748078;
        --success-bg: #203227;
        --success-line: #486a51;
        --danger: #f0a098;
        --danger-bg: #34211f;
        --danger-line: #744943;
        --shadow-soft: rgba(0, 0, 0, 0.42);
        --shadow-strong: rgba(0, 0, 0, 0.56);
        color-scheme: dark;
      }
    }

    .garden-planner-app * {
      box-sizing: border-box;
    }

    .garden-shell {
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-height: 78vh;
      overflow: hidden;
    }

    .garden-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 16px 18px;
      background: linear-gradient(90deg, var(--toolbar), var(--panel-muted));
      border-bottom: 1px solid var(--line);
    }

    .garden-topbar h1 {
      margin: 0;
      color: var(--text);
      font-size: 1.35rem;
      letter-spacing: 0;
    }

    .garden-subtitle {
      color: var(--muted);
      font-size: 0.88rem;
      margin-top: 2px;
    }

    .garden-metrics {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .garden-metrics span,
    .section-count,
    .status-pill,
    .ok-block,
    .issue-list div,
    .status-notes span {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      color: var(--muted);
    }

    .garden-metrics span {
      padding: 6px 9px;
      min-width: 82px;
      text-align: center;
    }

    .garden-metrics strong {
      color: var(--green);
    }

    .garden-layout {
      display: grid;
      grid-template-columns: minmax(240px, 285px) minmax(520px, 1fr) minmax(260px, 330px);
      min-height: calc(78vh - 72px);
    }

    .garden-sidebar,
    .garden-inspector {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      background: var(--panel-soft);
      min-width: 0;
    }

    .garden-sidebar {
      border-right: 1px solid var(--line);
    }

    .garden-inspector {
      border-left: 1px solid var(--line);
    }

    .garden-workspace {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .planner-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-heading,
    .view-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 760;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .section-count {
      min-width: 28px;
      padding: 1px 7px;
      text-align: center;
      letter-spacing: 0;
    }

    .search-input,
    .flower-filter-grid select,
    .plant-form input,
    .plant-form select,
    .bed-editor input,
    .bed-editor select,
    .bed-editor textarea,
    .placement-editor input,
    .placement-editor select,
    .placement-editor textarea,
    .structure-editor input,
    .structure-editor select,
    .structure-editor textarea,
    .vegetation-editor input,
    .vegetation-editor select,
    .vegetation-editor textarea,
    .parcel-editor input,
    .parcel-editor select,
    .parcel-editor textarea {
      width: 100%;
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 6px 8px;
    }

    .plant-list {
      display: grid;
      gap: 7px;
      max-height: 34vh;
      overflow: auto;
      padding-right: 2px;
    }

    .flower-tool-panel {
      gap: 9px;
    }

    .flower-context {
      display: grid;
      gap: 3px;
      padding: 10px;
      border: 1px solid var(--accent-border);
      border-radius: 8px;
      background: var(--panel-selected);
    }

    .flower-context > span {
      color: var(--green);
      font-size: 0.65rem;
      font-weight: 780;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .flower-context > strong {
      font-size: 0.85rem;
    }

    .flower-context p,
    .flower-sources p,
    .flower-inspector-note p {
      margin: 0;
      color: var(--muted);
      font-size: 0.73rem;
      line-height: 1.45;
    }

    .flower-filter-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .flower-filter-grid .search-input {
      grid-column: 1 / -1;
    }

    .flower-filter-grid select {
      min-width: 0;
      padding-inline: 5px;
      font-size: 0.7rem;
    }

    .flower-list {
      display: grid;
      grid-auto-rows: max-content;
      align-content: start;
      gap: 7px;
    }

    .flower-option {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      align-items: start;
      gap: 8px;
      width: 100%;
      min-height: 92px;
      height: auto;
      flex: 0 0 auto;
      padding: 8px;
      text-align: left;
      white-space: normal;
      background: var(--panel);
    }

    .flower-option[aria-pressed="true"] {
      border-color: var(--green);
      background: var(--panel-selected);
      box-shadow: inset 3px 0 0 var(--green);
    }

    .flower-swatch {
      width: 19px;
      height: 19px;
      margin-top: 1px;
      border: 2px solid color-mix(in srgb, var(--flower-color) 60%, var(--panel));
      border-radius: 50% 50% 46% 54%;
      background: radial-gradient(circle at 55% 45%, var(--flower-color) 0 32%, color-mix(in srgb, var(--flower-color) 75%, white) 34% 58%, transparent 60%);
    }

    .flower-option-main {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .flower-option-main > strong {
      font-size: 0.82rem;
    }

    .flower-option-main > em {
      overflow: hidden;
      color: var(--muted);
      font-family: Georgia, serif;
      font-size: 0.7rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .flower-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-top: 2px;
    }

    .flower-tags small,
    .flower-room {
      padding: 2px 5px;
      border-radius: 999px;
      background: var(--panel-muted);
      color: var(--muted);
      font-size: 0.61rem;
      font-style: normal;
      line-height: 1.25;
    }

    .flower-room {
      color: var(--green);
    }

    .flower-evidence {
      color: var(--muted);
      font-size: 0.64rem;
    }

    .flower-source-list,
    .flower-inspector-sources {
      display: grid;
      gap: 5px;
    }

    .flower-source-list a,
    .flower-inspector-sources a {
      display: grid;
      gap: 1px;
      padding: 6px;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--green);
      background: var(--panel-soft);
      font-size: 0.68rem;
      text-decoration: none;
    }

    .flower-source-list a span {
      color: var(--muted);
      font-size: 0.61rem;
    }

    .flower-inspector-note {
      display: grid;
      gap: 4px;
      padding: 9px;
      border: 1px solid var(--accent-border);
      border-radius: 8px;
      background: var(--panel-selected);
    }

    .flower-inspector-note small {
      color: var(--muted);
      font-size: 0.66rem;
    }

    .detail-title > span:last-child {
      display: grid;
      gap: 1px;
    }

    .detail-title em {
      color: var(--muted);
      font-family: Georgia, serif;
      font-size: 0.72rem;
    }

    .property-card {
      display: grid;
      gap: 3px;
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }

    .property-card strong {
      font-size: 0.9rem;
    }

    .property-card span,
    .property-card small {
      color: var(--muted);
      font-size: 0.78rem;
    }

    .garden-information-card {
      flex: 0 0 auto;
      min-width: 0;
      border-top: 1px solid var(--line);
      background: color-mix(in srgb, var(--panel-soft) 90%, var(--panel-selected));
    }

    .garden-information-card > summary {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      min-height: 45px;
      padding: 7px 12px;
      color: var(--text);
      cursor: pointer;
      list-style: none;
    }

    .garden-information-card > summary::-webkit-details-marker {
      display: none;
    }

    .garden-information-card > summary:focus-visible {
      outline: 2px solid var(--accent-border);
      outline-offset: -2px;
    }

    .garden-information-summary-label,
    .garden-information-overview > span,
    .garden-information-section-heading > span,
    .garden-information-resource-heading > span {
      color: var(--green);
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .garden-information-summary-label {
      padding: 4px 6px;
      border: 1px solid var(--accent-border);
      border-radius: 999px;
      background: var(--panel-selected);
      white-space: nowrap;
    }

    .garden-information-summary-copy {
      display: grid;
      min-width: 0;
      line-height: 1.25;
    }

    .garden-information-summary-copy strong,
    .garden-information-summary-copy small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .garden-information-summary-copy strong {
      font-size: 0.82rem;
    }

    .garden-information-summary-copy small,
    .garden-information-summary-action {
      color: var(--muted);
      font-size: 0.67rem;
    }

    .garden-information-summary-action {
      font-weight: 760;
      white-space: nowrap;
    }

    .garden-information-summary-action::after {
      content: " +";
      color: var(--green);
    }

    .garden-information-card[open] .garden-information-summary-action::after {
      content: " −";
    }

    .garden-information-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(240px, 0.9fr) minmax(0, 1.15fr);
      gap: 12px;
      padding: 12px;
      border-top: 1px solid var(--line);
      background: var(--panel);
    }

    .garden-information-overview,
    .garden-information-calibration,
    .garden-information-resources {
      min-width: 0;
    }

    .garden-information-overview {
      display: grid;
      align-content: start;
      gap: 4px;
    }

    .garden-information-overview > strong {
      font: 700 1rem/1.25 Georgia, serif;
    }

    .garden-information-overview p,
    .garden-information-calibration p,
    .garden-information-resource p,
    .garden-information-empty {
      margin: 0;
      color: var(--muted);
      font-size: 0.74rem;
      line-height: 1.45;
    }

    .garden-information-facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0;
      margin: 0;
      border: 1px solid var(--line);
      border-radius: 7px;
      overflow: hidden;
      background: var(--panel-soft);
    }

    .garden-information-facts div {
      display: grid;
      align-content: start;
      gap: 2px;
      min-width: 0;
      padding: 7px;
      border: 0;
      border-right: 1px solid var(--line);
      border-bottom: 1px solid var(--line);
    }

    .garden-information-facts div:nth-child(2n) {
      border-right: 0;
    }

    .garden-information-facts div:nth-last-child(-n + 2) {
      border-bottom: 0;
    }

    .garden-information-facts dt {
      color: var(--muted);
      font-size: 0.58rem;
    }

    .garden-information-facts dd {
      font-size: 0.7rem;
      line-height: 1.35;
    }

    .garden-information-calibration,
    .garden-information-resources {
      display: grid;
      gap: 6px;
    }

    .garden-information-calibration {
      align-content: start;
    }

    .garden-information-resources {
      grid-column: 1 / -1;
      padding-top: 10px;
      border-top: 1px solid var(--line);
    }

    .garden-information-calibration > strong {
      font-size: 0.78rem;
    }

    .garden-information-calibration > small {
      color: var(--muted);
      font-size: 0.66rem;
      line-height: 1.45;
    }

    .garden-information-alignment-detail {
      margin-top: 2px;
    }

    .garden-information-alignment-detail summary {
      color: var(--green);
      font-size: 0.67rem;
      font-weight: 740;
      cursor: pointer;
    }

    .garden-information-alignment-detail p,
    .garden-information-alignment-detail small {
      display: block;
      margin-top: 5px;
    }

    .garden-information-section-heading {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }

    .garden-information-section-heading > small {
      color: var(--muted);
      font-size: 0.64rem;
      text-align: right;
    }

    .garden-information-resource-grid {
      display: grid;
      grid-auto-columns: minmax(225px, 285px);
      grid-auto-flow: column;
      gap: 7px;
      padding: 1px 1px 7px;
      overflow-x: auto;
      overscroll-behavior-inline: contain;
      scroll-snap-type: inline proximity;
    }

    .garden-information-resource {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 5px;
      min-width: 0;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-soft);
      scroll-snap-align: start;
    }

    .garden-information-resource-heading {
      display: grid;
      gap: 1px;
      min-width: 0;
    }

    .garden-information-resource-heading strong {
      overflow: hidden;
      font-size: 0.73rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .garden-information-resource-heading small {
      color: var(--muted);
      font-size: 0.61rem;
    }

    .garden-information-resource p {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .garden-information-resource-links {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .garden-information-resource-links a,
    .garden-information-resource-links button,
    .local-reference-unavailable {
      padding: 3px 6px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--green);
      background: var(--panel);
      font-size: 0.61rem;
      font-weight: 740;
      font-family: inherit;
      line-height: 1.25;
      text-decoration: none;
    }

    .garden-information-resource-links .local-reference-link {
      border-color: var(--accent-border);
      background: var(--panel-selected);
      cursor: pointer;
    }

    .garden-information-resource-links a:hover,
    .garden-information-resource-links button:hover {
      border-color: var(--green);
    }

    .garden-information-resource-plan .garden-information-resource-heading > span {
      color: var(--amber);
    }

    .garden-information-resource-dataset .garden-information-resource-heading > span {
      color: var(--blue);
    }

    .garden-information-resource-local-plan {
      border-color: var(--accent-border);
      background: var(--panel-selected);
    }

    .garden-planner-app.tool-drawer-open.inspector-open .garden-information-body {
      grid-template-columns: minmax(0, 1fr);
    }

    @media (max-width: 720px) {
      .garden-information-card > summary {
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .garden-information-summary-label {
        display: none;
      }

      .garden-information-summary-action {
        font-size: 0.61rem;
      }

      .garden-information-body {
        grid-template-columns: minmax(0, 1fr);
      }

      .garden-information-facts {
        grid-template-columns: minmax(0, 1fr);
      }

      .garden-information-facts div,
      .garden-information-facts div:nth-child(2n),
      .garden-information-facts div:nth-last-child(-n + 2) {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .garden-information-facts div:last-child {
        border-bottom: 0;
      }

      .garden-information-section-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 2px;
      }

      .garden-information-section-heading > small {
        text-align: left;
      }

      .garden-information-resource-grid {
        grid-auto-columns: minmax(210px, 84vw);
      }
    }

    .local-reference-unavailable {
      color: var(--disabled);
    }

    .bed-list,
    .structure-list,
    .vegetation-list {
      display: grid;
      gap: 7px;
    }

    .plant-option,
    .bed-option,
    .structure-option,
    .vegetation-option {
      display: grid;
      grid-template-columns: 26px 1fr;
      gap: 9px;
      align-items: center;
      width: 100%;
      min-height: 54px;
      text-align: left;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      color: var(--text);
      padding: 8px;
      cursor: pointer;
    }

    .plant-option[aria-pressed="true"],
    .bed-option[aria-pressed="true"],
    .structure-option[aria-pressed="true"],
    .vegetation-option[aria-pressed="true"] {
      border-color: var(--accent-border);
      box-shadow: inset 0 0 0 1px var(--accent-border);
      background: var(--panel-selected);
    }

    .plant-swatch,
    .bed-swatch,
    .structure-swatch,
    .vegetation-swatch,
    .plant-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--plant-color);
      border: 2px solid var(--panel);
      box-shadow: 0 0 0 1px var(--line-strong);
    }

    .bed-swatch,
    .structure-swatch,
    .vegetation-swatch,
    .bed-dot {
      border-radius: 4px;
      background: #8a6b4c;
    }

    .structure-swatch {
      background: var(--feature-swatch, #8a6b4c);
    }

    .vegetation-swatch {
      border-radius: 50%;
      background: #55775a;
    }

    .vegetation-swatch-evergreen {
      background: #2f6650;
    }

    .vegetation-swatch-deciduous {
      background: #6f8a4c;
    }

    .structure-swatch-greenhouse {
      background: #9fbfb5;
    }

    .structure-swatch-path {
      background: #b99a6f;
    }

    .structure-swatch-road {
      background: #858780;
    }

    .structure-swatch-parking {
      background: repeating-linear-gradient(90deg, #777a73 0 4px, #d8ddd6 4px 5px);
    }

    .structure-swatch-water {
      border-radius: 50%;
      background: #4d7f95;
    }

    .structure-swatch-orchard {
      border-radius: 50%;
      background: #577754;
    }

    .bed-dot {
      width: 20px;
      height: 20px;
      border: 2px solid var(--panel);
      box-shadow: 0 0 0 1px var(--line-strong);
    }

    .plant-option-main,
    .bed-option-main {
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .plant-option-main strong,
    .bed-option-main strong,
    .detail-title strong {
      font-size: 0.92rem;
      color: var(--text);
    }

    .plant-option-main span,
    .bed-option-main span,
    .empty-state,
    .zone-row small {
      color: var(--muted);
      font-size: 0.8rem;
    }

    .plant-form,
    .bed-editor,
    .placement-editor,
    .structure-editor,
    .vegetation-editor,
    .parcel-editor,
    .detail-stack {
      display: grid;
      gap: 9px;
    }

    .plant-form label,
    .bed-editor label,
    .placement-editor label,
    .structure-editor label,
    .vegetation-editor label,
    .parcel-editor label {
      display: grid;
      gap: 4px;
      min-width: 84px;
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 650;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .parcel-search-form,
    .parcel-search-results {
      display: grid;
      gap: 8px;
    }

    .spatial-collection-editor,
    .spatial-collection-editor [data-collection="editor"]:not([hidden]) {
      display: grid;
      gap: 12px;
      min-width: 0;
    }

    .spatial-collection-editor h3,
    .spatial-collection-editor p {
      margin: 0;
    }

    .spatial-collection-editor label,
    .reference-registration label {
      display: grid;
      gap: 6px;
      min-width: 0;
      font-size: 0.84rem;
      color: var(--muted);
    }

    .reference-registration label { margin: 12px 0; }

    .spatial-collection-editor input,
    .spatial-collection-editor select,
    .spatial-collection-editor textarea,
    .reference-registration input:not([type="checkbox"]),
    .reference-registration select {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      min-height: 36px;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      padding: 7px 9px;
      font: inherit;
      color: var(--text);
      background: var(--panel);
    }

    .parcel-search-status {
      color: var(--muted);
      font-size: 0.78rem;
      min-height: 1rem;
    }

    .parcel-search-results button {
      display: block;
      width: 100%;
      text-align: left;
    }

    .editor-subheading {
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 780;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-top: 2px;
    }

    button {
      min-height: 34px;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      background: var(--panel);
      color: var(--text);
      font: inherit;
      font-weight: 680;
      padding: 7px 10px;
      cursor: pointer;
    }

    button:hover {
      border-color: var(--accent-border);
      background: var(--panel-hover);
    }

    button:disabled {
      color: var(--disabled);
      border-color: var(--line);
      background: var(--panel-muted);
      cursor: not-allowed;
    }

    .toggle-control {
      display: flex !important;
      flex-direction: row;
      align-items: center;
      gap: 8px !important;
      min-height: 34px;
      padding: 6px 8px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel);
    }

    .toggle-control input {
      width: auto;
      min-height: auto;
    }

    .inspector-toggle {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 680;
    }

    .garden-views {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      height: clamp(560px, 68vh, 760px);
      min-height: 560px;
      flex: 0 0 auto;
      min-width: 0;
    }

    .planner-view {
      position: relative;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--canvas);
    }

    .two-d-view {
      border-right: 1px solid var(--line);
    }

    .parcel-map-view {
      height: clamp(360px, 38vh, 520px);
      min-height: 360px;
      border-bottom: 1px solid var(--line);
    }

    .view-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      min-height: 38px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--line);
      background: var(--toolbar);
    }

    .view-heading > span:first-child {
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 820;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .view-heading > span:nth-child(2) {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 680;
    }

    .map-settings {
      position: relative;
      z-index: 8;
      margin-left: auto;
      letter-spacing: 0;
      text-transform: none;
    }

    .map-settings summary {
      display: flex;
      align-items: center;
      gap: 7px;
      min-height: 28px;
      padding: 4px 8px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      background: var(--panel);
      color: var(--text);
      font-size: 0.74rem;
      font-weight: 760;
      cursor: pointer;
      list-style: none;
    }

    .map-settings summary::-webkit-details-marker {
      display: none;
    }

    .map-settings summary::before {
      content: "▦";
      color: var(--green);
      font-size: 0.88rem;
    }

    .map-settings[open] summary {
      border-color: var(--accent-border);
      background: var(--panel-selected);
    }

    .map-settings summary small {
      color: var(--muted);
      font-size: 0.66rem;
      font-weight: 680;
    }

    .map-settings-panel {
      position: absolute;
      top: calc(100% + 7px);
      right: 0;
      width: min(290px, calc(100vw - 36px));
      display: grid;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--line-strong);
      border-radius: 9px;
      background: var(--panel);
      box-shadow: 0 14px 32px var(--shadow-soft);
    }

    .map-settings-panel fieldset {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .map-settings-panel legend,
    .map-settings-beds > span {
      display: block;
      grid-column: 1 / -1;
      margin-bottom: 2px;
      color: var(--muted);
      font-size: 0.67rem;
      font-weight: 780;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .map-settings-panel fieldset label {
      display: flex;
      align-items: center;
      gap: 7px;
      min-height: 30px;
      padding: 5px 7px;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--text);
      font-size: 0.72rem;
      font-weight: 650;
      cursor: pointer;
    }

    .map-settings-panel input {
      margin: 0;
      accent-color: var(--green);
    }

    .map-settings-beds {
      display: grid;
      gap: 5px;
    }

    .map-settings-beds select {
      width: 100%;
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 6px 8px;
    }

    .view-navigation {
      position: absolute;
      z-index: 7;
      top: 48px;
      right: 10px;
      display: grid;
      width: 34px;
      overflow: visible;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      background: var(--panel);
      box-shadow: 0 5px 18px var(--shadow-soft);
    }

    .view-navigation button {
      display: grid;
      place-items: center;
      width: 32px;
      min-width: 32px;
      height: 32px;
      min-height: 32px;
      padding: 0;
      border: 0;
      border-bottom: 1px solid var(--line);
      border-radius: 0;
      background: transparent;
      color: var(--text);
      font-size: 1rem;
      line-height: 1;
    }

    .view-navigation button:first-child {
      border-radius: 6px 6px 0 0;
    }

    .view-navigation button:last-of-type {
      border-bottom: 0;
      border-radius: 0 0 6px 6px;
      font-size: 0.9rem;
      font-weight: 820;
    }

    .view-navigation button:hover,
    .view-navigation button:focus-visible {
      background: var(--panel-selected);
      color: var(--green);
    }

    .view-compass {
      display: block;
      transform-origin: center;
      transition: transform 90ms linear;
    }

    .view-navigation small {
      position: absolute;
      top: 0;
      right: calc(100% + 7px);
      min-width: max-content;
      padding: 5px 7px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      color: var(--muted);
      font-size: 0.64rem;
      font-weight: 720;
      pointer-events: none;
    }

    .map-scale {
      position: absolute;
      z-index: 7;
      left: 12px;
      bottom: 10px;
      display: flex;
      align-items: flex-end;
      gap: 7px;
      padding: 4px 7px;
      border-radius: 6px;
      background: color-mix(in srgb, var(--panel) 84%, transparent);
      color: var(--text);
      font-size: 0.64rem;
      font-weight: 760;
      pointer-events: none;
    }

    .map-scale i {
      display: block;
      height: 8px;
      border: 1px solid var(--text);
      border-top: 0;
    }

    .map-legend {
      position: absolute;
      z-index: 8;
      right: 10px;
      bottom: 10px;
      color: var(--text);
      font-size: 0.68rem;
    }

    .map-legend summary {
      width: max-content;
      margin-left: auto;
      padding: 5px 8px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      background: color-mix(in srgb, var(--panel) 92%, transparent);
      font-weight: 760;
      cursor: pointer;
      list-style: none;
    }

    .map-legend summary::-webkit-details-marker {
      display: none;
    }

    .map-legend summary::before {
      content: "◫ ";
      color: var(--green);
    }

    .map-legend-grid {
      position: absolute;
      right: 0;
      bottom: calc(100% + 7px);
      width: min(310px, calc(100vw - 80px));
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 10px;
      padding: 10px;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: 0 10px 28px var(--shadow-soft);
    }

    .map-legend-item {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }

    .map-legend-item > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .legend-swatch {
      position: relative;
      flex: 0 0 22px;
      width: 22px;
      height: 12px;
      border: 1px solid var(--legend-stroke, #687169);
      background: color-mix(in srgb, var(--legend-fill, transparent) calc(var(--legend-fill-opacity, 1) * 100%), transparent);
    }

    .legend-swatch-line {
      height: 0;
      border: 0;
      border-top: 2px solid var(--legend-stroke, #687169);
      background: none;
    }

    .legend-swatch-symbol {
      flex-basis: 12px;
      width: 10px;
      height: 10px;
      margin-inline: 5px;
      border-radius: 50%;
    }

    .view-gesture-hint {
      position: absolute;
      z-index: 6;
      left: 50%;
      bottom: 10px;
      translate: -50% 0;
      padding: 5px 8px;
      border: 1px solid color-mix(in srgb, var(--line-strong) 72%, transparent);
      border-radius: 999px;
      background: color-mix(in srgb, var(--panel) 84%, transparent);
      color: var(--muted);
      font-size: 0.64rem;
      font-weight: 700;
      white-space: nowrap;
      pointer-events: none;
    }

    .feature-hover-card {
      position: fixed;
      z-index: 1000;
      display: grid;
      gap: 3px;
      max-width: min(320px, calc(100vw - 16px));
      padding: 9px 11px;
      border: 1px solid var(--line-strong);
      border-radius: 9px;
      background: color-mix(in srgb, var(--panel) 96%, transparent);
      color: var(--ink);
      box-shadow: 0 12px 34px rgba(10, 24, 16, 0.24);
      pointer-events: none;
    }

    .feature-hover-card[hidden] {
      display: none;
    }

    .feature-hover-card > span {
      color: var(--accent);
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .feature-hover-card > strong {
      font-size: 0.82rem;
      line-height: 1.25;
    }

    .feature-hover-card > small {
      color: var(--muted);
      font-size: 0.7rem;
      line-height: 1.4;
    }

    .feature-hover-card b {
      color: var(--line-strong);
      font-weight: 800;
    }

    .bed-drawing-controls:not([hidden]) {
      position: absolute;
      z-index: 5;
      left: 0.5rem;
      right: 3rem;
      bottom: 2.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem;
      background: var(--panel);
      color: var(--text);
      border: 1px solid var(--line);
      border-radius: 0.5rem;
    }
    .bed-drawing-controls span {grid-column: 1 / -1; font-size: 0.8rem;}
    .bed-drawing-controls button {min-height: 44px;}

    .plan-svg,
    .parcel-svg {
      display: block;
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      background:
        radial-gradient(circle at 18% 20%, rgba(65, 101, 77, 0.1), transparent 28%),
        linear-gradient(135deg, var(--panel-muted), var(--canvas));
      touch-action: none;
      cursor: grab;
    }

    .plan-svg:active,
    .parcel-svg:active,
    .three-canvas:active {
      cursor: grabbing;
    }

    .parcel-svg {
      background: var(--canvas-deep);
    }

    .grid-layer line {
      stroke: #c6d4c6;
      stroke-width: 0.18;
      vector-effect: non-scaling-stroke;
    }

    .bed-outline {
      fill: rgba(82, 62, 49, 0.16);
      stroke: var(--soil);
      stroke-width: 1.6;
      vector-effect: non-scaling-stroke;
    }

    .property-bed .bed-selection-backdrop {
      fill: rgba(248, 251, 247, 0.16);
      stroke: rgba(226, 137, 38, 0.24);
      stroke-width: 0.75;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
      filter: blur(1.6px);
    }

    .property-bed.active .bed-selection-backdrop {
      fill: rgba(248, 251, 247, 0.2);
      stroke: rgba(226, 137, 38, 0.34);
    }

    .property-bed .property-bed-outline {
      fill: rgba(82, 62, 49, 0.045);
      stroke: rgba(72, 58, 41, 0.7);
      stroke-width: 0.85;
    }

    .plot-boundary {
      fill: rgba(238, 241, 232, 0.78);
      stroke: #8ea28f;
      stroke-width: 1.2;
      stroke-dasharray: 5 4;
      vector-effect: non-scaling-stroke;
    }

    .parcel-imagery image {
      opacity: 0.94;
      image-rendering: auto;
    }

    .parcel-boundary {
      fill: rgba(240, 246, 238, 0.1);
      stroke: #f5f0d2;
      stroke-width: 3.2;
      vector-effect: non-scaling-stroke;
      paint-order: stroke;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4));
    }

    .parcel-attribution {
      fill: rgba(248, 251, 247, 0.9);
      font-size: 20px;
      font-weight: 720;
      paint-order: stroke;
      stroke: rgba(28, 36, 31, 0.72);
      stroke-width: 4;
      pointer-events: none;
    }

    .plot-label,
    .structure text,
    .vegetation-node text {
      fill: #53645a;
      font-size: 4px;
      font-weight: 820;
      letter-spacing: 0.02em;
      text-anchor: middle;
      text-transform: uppercase;
      pointer-events: none;
    }

    .vegetation-node {
      cursor: move;
    }

    .vegetation-node ellipse {
      fill-opacity: 0.36;
      stroke: rgba(26, 54, 34, 0.76);
      stroke-width: 1.4;
      stroke-dasharray: 6 4;
      vector-effect: non-scaling-stroke;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.28));
    }

    .vegetation-kind-tree ellipse {
      fill-opacity: 0.3;
      stroke-dasharray: 4 3;
    }

    .tree-center-marker {
      fill: #fff7dc;
      stroke: #183c27;
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }

    .vegetation-kind-forest ellipse {
      fill-opacity: 0.24;
      stroke-width: 1.1;
      stroke-dasharray: 11 7;
    }

    .vegetation-evergreen ellipse {
      fill-opacity: 0.48;
      stroke: rgba(16, 58, 41, 0.9);
      stroke-dasharray: none;
    }

    .vegetation-node.selected ellipse {
      stroke: #f1c65a;
      stroke-width: 2.6;
      stroke-dasharray: none;
    }

    .vegetation-node.selected .tree-center-marker {
      fill: #f1c65a;
      stroke: #17251c;
      stroke-width: 2;
    }

    .vegetation-node text {
      fill: #f8fbf7;
      font-size: 22px;
      text-transform: none;
      paint-order: stroke;
      stroke: rgba(24, 38, 29, 0.62);
      stroke-width: 5;
    }

    .plot-label {
      text-anchor: start;
      font-size: 5px;
    }

    .structure rect,
    .structure circle,
    .structure ellipse {
      fill: var(--feature-fill, rgba(128, 112, 94, 0.28));
      fill-opacity: var(--feature-fill-opacity, 0.3);
      stroke: var(--feature-stroke, #6b7567);
      stroke-width: 1;
      stroke-dasharray: var(--feature-dash, none);
      vector-effect: non-scaling-stroke;
    }

    .site-point-symbol {
      fill: var(--feature-fill, #f4f1df);
      stroke: var(--feature-stroke, #4d554f);
      stroke-width: 1.6;
      vector-effect: non-scaling-stroke;
    }

    .site-area-symbol {
      fill: var(--feature-fill, rgba(128, 112, 94, 0.28));
      fill-opacity: var(--feature-fill-opacity, 0.3);
      stroke: var(--feature-stroke, #6b7567);
      stroke-width: 1.2;
      stroke-dasharray: var(--feature-dash, none);
      vector-effect: non-scaling-stroke;
    }

    .site-point-mark,
    .site-line-symbol {
      fill: none;
      stroke: var(--feature-stroke, #4d554f);
      stroke-width: 1.7;
      stroke-dasharray: var(--feature-dash, none);
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }

    .site-line-hit {
      fill: none;
      stroke: transparent;
      stroke-width: 24;
      vector-effect: non-scaling-stroke;
      pointer-events: stroke;
    }

    .structure {
      cursor: move;
    }

    .structure.selected rect,
    .structure.selected circle,
    .structure.selected ellipse,
    .structure.selected .site-area-symbol,
    .structure.selected .site-line-symbol,
    .structure.selected .site-point-mark {
      stroke: #f1c65a;
      stroke-width: 2.2;
    }

    .structure-structure rect {
      fill: rgba(128, 112, 94, 0.28);
      stroke: #786f64;
    }

    .structure-house rect {
      fill: rgba(127, 129, 122, 0.36);
      stroke: #676960;
    }

    .structure-bed rect {
      fill: rgba(133, 102, 73, 0.22);
    }

    .structure-greenhouse rect {
      fill: rgba(174, 207, 199, 0.3);
      stroke: #668c84;
    }

    .structure-compost rect {
      fill: rgba(102, 81, 63, 0.32);
    }

    .structure-path rect {
      fill: rgba(185, 154, 111, 0.36);
      stroke: #a98354;
    }

    .structure-road rect {
      fill: rgba(116, 119, 113, 0.34);
      stroke: #666b66;
      stroke-dasharray: 8 3;
    }

    .structure-parking rect {
      fill: rgba(103, 108, 102, 0.24);
      stroke: #656a65;
      stroke-dasharray: 12 5;
    }

    .structure-parking text,
    .structure-road text,
    .structure-path text {
      fill: #f7fbf5;
      font-size: 18px;
      text-transform: none;
      paint-order: stroke;
      stroke: rgba(48, 53, 49, 0.64);
      stroke-width: 4;
    }

    .structure-water circle {
      fill: rgba(77, 127, 149, 0.42);
      stroke: #3d7188;
    }

    .structure-orchard ellipse {
      fill: rgba(87, 119, 84, 0.22);
      stroke: #587857;
      stroke-dasharray: 4 3;
    }

    .property-bed {
      cursor: move;
    }

    .bed-move-target {
      fill: none;
      stroke: transparent;
      stroke-width: 28;
      pointer-events: stroke;
      vector-effect: non-scaling-stroke;
      cursor: move;
    }

    .bed-move-handle {
      fill: rgba(248, 251, 247, 0.2);
      stroke: rgba(226, 137, 38, 0.32);
      stroke-width: 0.9;
      vector-effect: non-scaling-stroke;
      cursor: move;
      filter: blur(0.3px);
    }

    .property-bed:not(.active) .bed-move-handle {
      opacity: 0.18;
    }

    .property-bed:hover .bed-move-handle,
    .property-bed.active .bed-move-handle {
      opacity: 0.5;
    }

    .property-bed.active .bed-outline {
      stroke: rgba(31, 61, 40, 0.86);
      stroke-width: 1.2;
    }

    .draft-bed-polygon {
      fill: rgba(241, 198, 90, 0.18);
      stroke: #f1c65a;
      stroke-width: 2.2;
      stroke-dasharray: 8 6;
      vector-effect: non-scaling-stroke;
    }

    .draft-bed-point {
      fill: #f8fbf7;
      stroke: #b87c2b;
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }

    .draft-bed-label {
      fill: #fff8d9;
      font-size: 26px;
      font-weight: 800;
      paint-order: stroke;
      stroke: rgba(38, 44, 34, 0.72);
      stroke-width: 5;
      pointer-events: none;
    }

    .bed-label {
      fill: #4f5f55;
      font-size: 5px;
      font-weight: 820;
      letter-spacing: 0;
      text-anchor: middle;
      pointer-events: none;
      paint-order: stroke;
      stroke: rgba(248, 251, 247, 0.8);
      stroke-width: 1.4;
    }

    .north-arrow line,
    .north-arrow path {
      stroke: #4f6255;
      fill: #4f6255;
      stroke-width: 1.4;
      vector-effect: non-scaling-stroke;
    }

    .north-arrow text {
      fill: #4f6255;
      font-size: 7px;
      font-weight: 840;
      text-anchor: middle;
    }

    .spacing-ring {
      fill: rgba(75, 126, 95, 0.06);
      stroke: rgba(53, 115, 78, 0.72);
      stroke-width: 1.1;
      stroke-dasharray: 2.5 2.5;
      vector-effect: non-scaling-stroke;
    }

    .spacing-ring.warning {
      fill: rgba(175, 81, 72, 0.08);
      stroke: rgba(175, 81, 72, 0.86);
    }

    .plant-node {
      cursor: grab;
      filter: url(#plant-shadow);
    }

    .plant-node:active {
      cursor: grabbing;
    }

    .plant-canopy-halo {
      stroke: rgba(30, 55, 38, 0.75);
      stroke-width: 0.85;
      vector-effect: non-scaling-stroke;
      fill-opacity: 0.2;
    }

    .plant-lod-symbol {
      stroke: rgba(24, 55, 35, 0.9);
      stroke-width: 1.1;
      vector-effect: non-scaling-stroke;
      paint-order: stroke;
    }

    .plant-lod-point {
      fill-opacity: 0.94;
    }

    .plant-lod-swatch {
      fill-opacity: 0.8;
      stroke-width: 1.5;
    }

    .plant-node.selected .plant-lod-symbol {
      stroke: #f1c65a;
      stroke-width: 2.5;
    }

    .plant-node.warning .plant-canopy-halo {
      stroke: var(--rose);
      stroke-width: 1.35;
    }

    .plant-node.selected .plant-canopy-halo {
      stroke: #193923;
      stroke-width: 1.45;
    }

    .leaf-shape {
      stroke: rgba(27, 50, 35, 0.74);
      stroke-width: 0.45;
      vector-effect: non-scaling-stroke;
    }

    .leaf-filament {
      fill: none;
      stroke-width: 1.1;
      stroke-linecap: round;
    }

    .leaf-vein {
      stroke: rgba(238, 247, 231, 0.52);
      stroke-width: 0.32;
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }

    .root-dot {
      fill: #fbf7e9;
      stroke: #1b2f20;
      stroke-width: 0.8;
      vector-effect: non-scaling-stroke;
    }

    .plant-token {
      fill: #f9fff5;
      stroke: rgba(0, 0, 0, 0.2);
      stroke-width: 0.12;
      paint-order: stroke;
      font-size: 4px;
      font-weight: 800;
      opacity: 0.62;
      pointer-events: none;
      text-anchor: middle;
      user-select: none;
    }

    .three-host {
      position: relative;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      background: var(--canvas);
    }

    .webgl-fallback {
      display: grid;
      place-items: center;
      min-height: 100%;
      color: var(--muted);
      background: repeating-linear-gradient(135deg, var(--canvas), var(--canvas) 12px, var(--panel-muted) 12px, var(--panel-muted) 24px);
      font-weight: 760;
    }

    .webgl-fallback > div {
      max-width: 34rem;
      padding: 1.5rem;
      text-align: center;
    }
    .webgl-fallback p { font-weight: 400; }
    .webgl-fallback button { margin-top: 0.75rem; }

    .three-canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
      cursor: grab;
    }

    dl {
      display: grid;
      gap: 7px;
      margin: 0;
    }

    dl div {
      display: grid;
      gap: 2px;
      padding-bottom: 7px;
      border-bottom: 1px solid var(--line);
    }

    dt {
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 760;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    dd {
      margin: 0;
      color: var(--text);
      font-size: 0.86rem;
    }

    .detail-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-pill,
    .ok-block,
    .issue-list div,
    .status-notes span {
      display: block;
      padding: 7px 8px;
      font-size: 0.82rem;
    }

    .status-pill {
      width: max-content;
      font-weight: 800;
      color: var(--green);
      border-color: var(--success-line);
      background: var(--success-bg);
    }

    .status-pill.warning,
    .issue-list div {
      color: var(--danger);
      border-color: var(--danger-line);
      background: var(--danger-bg);
    }

    .status-notes {
      display: grid;
      gap: 6px;
    }

    .issue-list,
    .zone-list {
      display: grid;
      gap: 7px;
    }

    .ok-block {
      color: var(--green);
      border-color: var(--success-line);
      background: var(--success-bg);
    }

    .zone-row {
      display: grid;
      gap: 2px;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }

    .zone-row strong {
      color: var(--blue);
    }

    .zone-row em {
      color: var(--text);
      font-style: normal;
      font-size: 0.83rem;
    }

    .garden-topbar {
      min-height: 56px;
      padding: 10px 14px;
    }

    .garden-topbar h1 {
      font-size: 1.08rem;
    }

    .garden-subtitle {
      overflow: hidden;
      max-width: 84ch;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .garden-layout {
      position: relative;
      display: flex;
      grid-template-columns: none;
      min-height: calc(78vh - 56px);
    }

    .garden-tool-rail {
      position: relative;
      z-index: 18;
      flex: 0 0 58px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 8px 6px;
      border-right: 1px solid var(--line);
      background: var(--panel-soft);
    }

    .garden-tool-rail button {
      display: grid;
      place-items: center;
      gap: 1px;
      min-width: 44px;
      min-height: 48px;
      padding: 4px 2px;
      border-color: transparent;
      background: transparent;
    }

    .garden-tool-rail button > span {
      color: var(--green);
      font-size: 1.22rem;
      line-height: 1;
    }

    .garden-tool-rail button small {
      color: var(--muted);
      font-size: 0.61rem;
      font-weight: 720;
      line-height: 1;
    }

    .garden-tool-rail button[aria-pressed="true"] {
      border-color: var(--accent-border);
      background: var(--panel-selected);
    }

    .garden-sidebar,
    .garden-inspector {
      display: none;
      flex: 0 0 292px;
      gap: 0;
      max-height: calc(100vh - 108px);
      padding: 0;
      overflow: hidden;
      background: var(--panel-soft);
    }

    .garden-planner-app.tool-drawer-open .garden-sidebar,
    .garden-planner-app.inspector-open .garden-inspector {
      display: flex;
    }

    .garden-sidebar {
      border-right: 1px solid var(--line);
    }

    .garden-inspector {
      flex-basis: 316px;
      border-left: 1px solid var(--line);
    }

    .drawer-heading {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 52px;
      padding: 9px 11px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-muted);
    }

    .drawer-heading > div {
      display: grid;
      gap: 1px;
    }

    .drawer-heading span {
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 760;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .drawer-heading strong {
      font-size: 0.92rem;
    }

    .drawer-heading button {
      min-width: 34px;
      padding: 3px;
      font-size: 1.15rem;
    }

    .tool-panel,
    .inspector-panel {
      min-height: 0;
      padding: 12px;
      overflow: auto;
    }

    .tool-panel[hidden],
    .inspector-panel[hidden] {
      display: none !important;
    }

    .bed-list,
    .plant-list,
    .flower-list,
    .structure-list,
    .vegetation-list {
      min-height: 0;
      max-height: min(48vh, 520px);
      overflow: auto;
      padding-right: 2px;
    }

    .drawer-action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .drawer-action-row button {
      flex: 1 1 112px;
    }

    .advanced-disclosure,
    .nested-disclosure {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }

    .advanced-disclosure > summary,
    .nested-disclosure > summary {
      padding: 8px 9px;
      color: var(--green);
      font-size: 0.78rem;
      font-weight: 760;
      cursor: pointer;
    }

    .advanced-disclosure[open] > summary,
    .nested-disclosure[open] > summary {
      border-bottom: 1px solid var(--line);
    }

    .advanced-disclosure > :not(summary),
    .nested-disclosure > :not(summary) {
      margin: 9px;
    }

    .range-field input {
      padding: 0;
    }

    .danger-action {
      color: var(--danger);
      border-color: var(--danger-line);
      background: var(--danger-bg);
    }

    .inspector-tabs {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 7px 10px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }

    .inspector-tabs button {
      min-height: 30px;
      padding: 4px 7px;
      border-color: transparent;
      color: var(--muted);
      background: transparent;
      font-size: 0.75rem;
    }

    .inspector-tabs button[aria-selected="true"] {
      border-color: var(--accent-border);
      color: var(--green);
      background: var(--panel-selected);
    }

    .garden-workspace {
      flex: 1 1 auto;
      min-width: 0;
      container-type: inline-size;
    }

    .planner-commandbar {
      position: relative;
      z-index: 12;
      flex: 0 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 7px;
      min-height: 49px;
      padding: 7px 9px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      overflow: visible;
    }

    .garden-switcher {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 720;
    }

    .garden-switcher select {
      width: clamp(155px, 18vw, 210px);
      min-height: 31px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 4px 6px;
    }

    .view-tray {
      display: flex;
      gap: 0;
      padding: 2px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel-muted);
    }

    .view-tray button {
      min-height: 29px;
      padding: 4px 9px;
      border-color: transparent;
      background: transparent;
      color: var(--muted);
      font-size: 0.75rem;
    }

    .view-tray button[aria-pressed="true"] {
      border-color: var(--accent-border);
      color: var(--green);
      background: var(--panel);
      box-shadow: 0 1px 3px var(--shadow-soft);
    }

    .edit-mode-status {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 29px;
      padding: 4px 8px;
      border: 1px solid var(--accent-border);
      border-radius: 999px;
      background: var(--panel-selected);
      color: var(--green);
      font-size: 0.68rem;
      white-space: nowrap;
    }

    .edit-mode-status[data-edit-layer="locked"] {
      border-color: var(--line);
      background: var(--panel-muted);
      color: var(--muted);
    }

    .layer-edit-guard {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 7px;
      padding: 7px 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel-muted);
      color: var(--muted);
      font-size: 0.72rem;
    }

    .layer-edit-guard > span:nth-child(2) {
      display: grid;
      min-width: 0;
    }

    .layer-edit-guard strong {
      color: var(--ink);
    }

    .layer-edit-guard small {
      color: var(--muted);
      font-size: 0.64rem;
    }

    .layer-edit-guard button {
      min-height: 27px;
      padding: 3px 7px;
      color: var(--green);
      font-size: 0.68rem;
    }

    .layer-edit-guard.is-editable {
      grid-template-columns: auto minmax(0, 1fr);
      border-color: var(--accent-border);
      background: var(--panel-selected);
    }

    .property-bed,
    .structure,
    .vegetation-node,
    .plant-node {
      cursor: pointer;
    }

    .property-bed.layer-editable,
    .structure.layer-editable,
    .vegetation-node.layer-editable,
    .plant-node.layer-editable {
      cursor: move;
    }

    .focus-control {
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 720;
    }

    .focus-control select {
      width: 104px;
      min-height: 31px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 4px 6px;
    }

    .active-bed-command {
      display: flex;
      align-items: baseline;
      gap: 5px;
      min-width: 0;
      max-width: 190px;
      min-height: 31px;
      padding: 4px 8px;
    }

    .active-bed-command span {
      color: var(--muted);
      font-size: 0.66rem;
    }

    .active-bed-command strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.75rem;
    }

    .save-command {
      min-height: 31px;
      margin-left: auto;
      padding: 4px 11px;
      color: var(--on-accent);
      border-color: var(--accent-fill);
      background: var(--accent-fill);
    }

    .project-menu {
      position: relative;
    }

    .project-menu > summary {
      display: grid;
      place-items: center;
      width: 36px;
      min-height: 31px;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      background: var(--panel);
      cursor: pointer;
      list-style: none;
    }

    .project-menu > summary::-webkit-details-marker {
      display: none;
    }

    .project-menu-panel {
      position: absolute;
      top: calc(100% + 7px);
      right: 0;
      z-index: 22;
      width: min(310px, calc(100vw - 28px));
      max-height: min(520px, calc(100svh - 96px));
      display: grid;
      gap: 7px;
      padding: 10px;
      overflow: auto;
      border: 1px solid var(--line-strong);
      border-radius: 9px;
      background: var(--panel);
      box-shadow: 0 14px 32px var(--shadow-soft);
    }

    @container (max-width: 700px) {
      .project-menu-panel {
        right: auto;
        left: 0;
      }
    }

    .project-menu-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 760;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .project-menu-heading strong {
      color: var(--green);
      letter-spacing: 0;
      text-transform: none;
    }

    .project-action-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px;
    }

    .project-action-grid:has(button:nth-child(2):last-child) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .project-action-grid button {
      min-width: 0;
      padding-inline: 6px;
      font-size: 0.75rem;
    }

    .project-menu-divider {
      height: 1px;
      margin: 2px 0;
      background: var(--line);
    }

    .project-menu-backup {
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel-muted);
    }

    .project-menu-backup summary {
      padding: 7px 8px;
      color: var(--muted);
      cursor: pointer;
      font-size: 0.69rem;
      font-weight: 720;
    }

    .project-menu-backup button {
      width: calc(100% - 12px);
      margin: 0 6px 6px;
    }

    .spatial-import-status {
      display: grid;
      gap: 3px;
      padding: 7px 8px;
      border: 1px solid var(--accent-border);
      border-radius: 7px;
      background: var(--panel-selected);
      color: var(--muted);
      font-size: 0.66rem;
      line-height: 1.35;
    }

    .spatial-import-status[hidden] {
      display: none;
    }

    .spatial-import-status strong {
      color: var(--ink);
      overflow-wrap: anywhere;
    }

    .spatial-import-status small {
      color: var(--green);
      font-size: 0.62rem;
      font-weight: 700;
    }

    .spatial-import-status[data-severity="warning"] {
      border-color: color-mix(in srgb, #d3a13f 65%, var(--line));
    }

    .spatial-import-status[data-severity="error"] {
      border-color: color-mix(in srgb, #c45f50 72%, var(--line));
      background: color-mix(in srgb, #c45f50 9%, var(--panel));
    }

    .spatial-import-status ul {
      display: grid;
      gap: 2px;
      max-height: 90px;
      margin: 3px 0 0;
      padding: 5px 0 0 17px;
      overflow: auto;
      border-top: 1px solid var(--line);
    }

    .spatial-import-status li b {
      color: var(--ink);
      font-size: 0.6rem;
    }

    .project-menu-panel label,
    .map-settings-basemap {
      display: grid;
      gap: 4px;
      color: var(--muted);
      font-size: 0.69rem;
      font-weight: 720;
    }

    .project-menu-panel select,
    .map-settings-basemap select {
      width: 100%;
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--panel);
      color: var(--text);
      font: inherit;
      padding: 6px 8px;
    }

    .map-settings-opacity {
      align-items: stretch !important;
      flex-direction: column;
      gap: 5px !important;
    }

    .map-settings-opacity input[type="range"] {
      width: 100%;
      accent-color: var(--green);
    }

    .reference-overlay-layer {
      mix-blend-mode: normal;
    }

    .source-evidence-layer {
      isolation: isolate;
    }

    .source-evidence-feature {
      color: #d764a8;
      cursor: help;
      opacity: 0.86;
      pointer-events: visiblePainted;
    }

    .source-evidence-area {
      fill: color-mix(in srgb, #d764a8 19%, transparent);
      stroke: #e285bd;
      stroke-width: 1.4px;
      stroke-dasharray: 7 4;
    }

    .source-evidence-line {
      fill: none;
      stroke: #6bd4df;
      stroke-width: 2px;
      stroke-dasharray: 9 4 2 4;
    }

    .source-evidence-point {
      fill: color-mix(in srgb, #f2a94a 72%, var(--panel));
      stroke: #8f3d78;
      stroke-width: 1.5px;
      stroke-dasharray: 2 1.5;
    }

    .source-evidence-staged.source-evidence-area {
      fill: color-mix(in srgb, #f2a94a 17%, transparent);
      stroke: #f2a94a;
      stroke-dasharray: 4 3;
    }

    .source-evidence-staged.source-evidence-line {
      stroke: #f2a94a;
      stroke-dasharray: 6 3;
    }

    .source-evidence-staged.source-evidence-point,
    .source-evidence-staged .source-evidence-point {
      fill: color-mix(in srgb, #f2a94a 68%, var(--panel));
      stroke: #7c5320;
      stroke-dasharray: none;
    }

    .map-settings-panel label small {
      color: var(--muted);
      font-size: 0.62rem;
      font-weight: 650;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .garden-statusbar {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 14px;
      min-height: 30px;
      padding: 5px 10px;
      border-top: 1px solid var(--line);
      background: var(--toolbar);
      color: var(--muted);
      font-size: 0.69rem;
    }

    .garden-statusbar span {
      white-space: nowrap;
    }

    .garden-statusbar strong {
      color: var(--green);
    }

    .garden-planner-app[data-view-presentation="map"] .garden-views,
    .garden-planner-app[data-view-presentation="2d"] .parcel-map-view,
    .garden-planner-app[data-view-presentation="3d"] .parcel-map-view,
    .garden-planner-app[data-view-presentation="split"] .parcel-map-view {
      display: none;
    }

    .garden-planner-app[data-view-presentation="map"] .parcel-map-view {
      height: clamp(540px, 70vh, 820px);
      min-height: 540px;
    }

    .garden-planner-app[data-view-presentation="2d"] .garden-views,
    .garden-planner-app[data-view-presentation="3d"] .garden-views,
    .garden-planner-app[data-view-presentation="split"] .garden-views {
      height: clamp(540px, 70vh, 820px);
      min-height: 540px;
    }

    .garden-planner-app[data-view-presentation="2d"] .garden-views,
    .garden-planner-app[data-view-presentation="3d"] .garden-views {
      grid-template-columns: minmax(0, 1fr);
    }

    .garden-planner-app[data-view-presentation="2d"] .three-d-view,
    .garden-planner-app[data-view-presentation="3d"] .two-d-view {
      display: none;
    }

    .garden-planner-app[data-view-presentation="2d"] .two-d-view {
      border-right: 0;
    }

    @media (max-width: 1250px) {
      .garden-sidebar,
      .garden-inspector {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 26;
        width: min(310px, calc(100% - 58px));
        max-height: none;
        box-shadow: 0 14px 34px var(--shadow-soft);
      }

      .garden-sidebar {
        left: 58px;
      }

      .garden-inspector {
        right: 0;
      }
    }

    @media (max-width: 920px) {
      .garden-planner-app {
        width: 100%;
        margin: 0 auto;
        padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px));
      }

      .garden-shell {
        min-height: min(78vh, 760px);
      }

      .garden-topbar {
        min-height: 48px;
        padding: 8px 10px;
      }

      .garden-topbar h1 {
        font-size: 0.98rem;
      }

      .garden-subtitle {
        font-size: 0.72rem;
      }

      .garden-layout {
        display: flex;
        min-height: min(72vh, 700px);
      }

      .garden-tool-rail {
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 40;
        width: 100%;
        min-height: calc(58px + env(safe-area-inset-bottom, 0px));
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 1px;
        padding: 4px 4px env(safe-area-inset-bottom, 0px);
        border: 0;
        border-top: 1px solid var(--line-strong);
        background: color-mix(in srgb, var(--panel) 97%, transparent);
        box-shadow: 0 -8px 24px var(--shadow-soft);
      }

      .garden-tool-rail button {
        min-width: 0;
        min-height: 50px;
      }

      .garden-tool-rail [data-tool="select"] {
        display: none;
      }

      .garden-tool-rail button > span {
        font-size: 1.08rem;
      }

      .garden-tool-rail button small {
        font-size: 0.55rem;
      }

      .garden-sidebar,
      .garden-inspector {
        position: fixed;
        top: auto;
        right: 6px;
        bottom: calc(58px + env(safe-area-inset-bottom, 0px));
        left: 6px;
        z-index: 38;
        width: auto;
        max-height: min(72svh, 640px);
        border: 1px solid var(--line-strong);
        border-radius: 14px 14px 0 0;
        box-shadow: 0 -12px 34px var(--shadow-strong);
      }

      .garden-planner-app.inspector-open .garden-sidebar {
        display: none;
      }

      .tool-panel,
      .inspector-panel {
        overscroll-behavior: contain;
      }

      .bed-list,
      .plant-list,
      .flower-list,
      .structure-list,
      .vegetation-list {
        max-height: 40svh;
      }

      .planner-commandbar {
        gap: 5px;
        padding: 6px;
        overflow: visible;
      }

      .view-tray {
        flex: 0 0 auto;
      }

      .view-tray button {
        padding-inline: 7px;
      }

      .focus-control span,
      .garden-switcher span,
      .active-bed-command span {
        display: none;
      }

      .focus-control select {
        width: 92px;
      }

      .garden-switcher select {
        width: 170px;
      }

      .active-bed-command {
        max-width: 118px;
      }

      .save-command {
        margin-left: 0;
      }

      .garden-planner-app[data-view-presentation="map"] .parcel-map-view,
      .garden-planner-app[data-view-presentation="2d"] .garden-views,
      .garden-planner-app[data-view-presentation="3d"] .garden-views,
      .garden-planner-app[data-view-presentation="split"] .garden-views {
        height: min(64svh, 620px);
        min-height: 440px;
      }

      .garden-planner-app[data-view-presentation="split"] .garden-views {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: repeat(2, minmax(360px, 1fr));
        height: min(128svh, 1120px);
      }

      .garden-statusbar {
        gap: 9px;
        overflow-x: auto;
      }
    }

    @media (max-width: 920px) {
      .garden-tool-rail {grid-template-columns: repeat(7, minmax(0, 1fr));}
      .garden-tool-rail [data-tool="select"] {display: grid;}
      .garden-sidebar, .garden-inspector {max-height: min(48svh, 480px);}
      .drawer-heading {min-height: 44px; padding: 4px 8px;}
      .drawer-heading button {min-width: 44px; min-height: 44px;}
      .view-navigation {
        position: relative; inset: auto; flex: 0 0 auto;
        display: flex; flex-wrap: wrap; width: auto; margin: 0;
        border-radius: 0; box-shadow: none; z-index: 7;
      }
      .view-navigation button {width: 44px; min-width: 44px; height: 44px; min-height: 44px; border: 0; font-size: .85rem;}
      .view-navigation small {position: static; min-width: 0; align-self: center; border: 0; font-size: .6rem;}
      .view-gesture-hint {display: none;}
      .view-heading {flex-wrap: wrap; gap: 4px; height: auto; min-height: 32px;}
      .view-heading > span {min-width: 0; overflow-wrap: anywhere;}
      .view-heading > span:nth-child(2) {display: none;}
      .map-settings-panel {max-width: calc(100vw - 32px); max-height: 45svh; overflow: auto;}
      .map-legend summary {min-height: 44px; box-sizing: border-box; display: flex; align-items: center;}
    }
    .view-navigation button[aria-pressed="true"] {background: var(--panel-selected); color: var(--green);}

    .garden-planner-app > .planner-quick-start:first-child {
      padding: 6px 10px; margin: 0 0 6px; gap: 8px; flex-wrap: wrap;
    }
    .garden-planner-app > .planner-quick-start:first-child p {font-size: .8rem; margin: 0;}
    .garden-planner-app > .planner-quick-start:first-child button {min-height: 44px;}
    .studio-preview-options > summary {padding: 6px 12px; cursor: pointer; font-size: .8rem;}
    .garden-planner-app .planning-scope {padding: 4px 8px !important; gap: 4px !important;}
    .garden-planner-app .planning-scope button {min-height: 36px; padding: 4px 8px;}
    .garden-planner-app .planner-storage-notice {font-size: .8rem;}
    @media (max-width: 920px) {
      .garden-planner-app > .planner-quick-start:first-child > div {flex: 1; min-width: 0;}
      .garden-planner-app > .planner-quick-start:first-child strong {font-size: .9rem;}
      .garden-planner-app > .planner-quick-start:first-child p {display: none;}
      .garden-planner-app .garden-topbar {display: none;}
      .garden-planner-app .planning-scope {display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr));}
      .garden-planner-app .planning-scope button {min-width: 0; min-height: 44px; white-space: normal; font-size: .75rem;}
      .studio-preview-options > summary {min-height: 44px; box-sizing: border-box; display: flex; align-items: center;}
      .studio-preview-options > summary::before {content: "▸"; margin-right: 6px;}
      .studio-preview-options[open] > summary::before {content: "▾";}
    }

    [data-role="camera-angle"] {min-height: 36px; padding: 4px 8px; font: inherit; color: var(--text); background: var(--panel); border: 1px solid var(--line); border-radius: 4px;}
    @media (max-width: 920px) {[data-role="camera-angle"] {min-height:44px;}}
    .view-navigation {display:flex;align-items:center;width:auto;gap:2px;padding:3px;border-radius:8px;}
    .view-navigation > button {width:36px;min-width:36px;height:36px;min-height:36px;border-radius:5px !important;font-size:.9rem !important;font-weight:600;}
    .view-navigation > button[data-view-nav="pan"] {width:auto;min-width:52px;padding:0 10px;font-size:.78rem !important;}
    .view-navigation > .camera-panel {margin:0;padding:0;border:0;background:none;}
    .view-navigation > .camera-panel > summary {display:flex;align-items:center;gap:7px;list-style:none;height:36px;min-height:36px;margin:0;padding:0 10px;border-left:1px solid var(--line);font:600 .78rem/1 system-ui;color:var(--text);}
    .view-navigation > .camera-panel > summary::-webkit-details-marker {display:none;}
    .view-navigation > .camera-panel > summary::after {content:"⌄";font-size:1rem;}
    .view-navigation > .camera-panel[open] > summary::after {content:"⌃";}
    @media(max-width:920px){.view-navigation > button,.view-navigation > .camera-panel > summary{height:44px;min-height:44px;}.view-navigation > button{min-width:44px;}}

    .view-navigation > button {border:0;}
    .camera-panel > summary {padding:8px; cursor:pointer; font-size:.8rem; min-height:32px; box-sizing:border-box;}
    .camera-panel-body {position:absolute;right:0;top:calc(100% + 4px);width:min(260px,calc(100vw - 40px));max-height:55svh;overflow:auto;padding:10px;box-sizing:border-box;border:1px solid var(--line-strong);border-radius:6px;background:var(--panel);box-shadow:0 6px 18px var(--shadow-soft);display:grid;gap:6px;}
    .view-navigation .camera-panel-body button {width:100%;height:auto;min-height:36px;font-size:.8rem;padding:5px;}
    .view-navigation .camera-panel-body small {position:static;min-width:0;border:0;white-space:normal;}
    .camera-panel-body label {display:grid;gap:4px;font-size:.8rem;}
    .camera-panel-body input {width:100%;min-height:32px;}
    .camera-panel-body p {font-size:.72rem;line-height:1.4;margin:0;}
    .structure-list,.vegetation-list {display:block !important;}
    .feature-list-row {display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:4px;border-bottom:1px solid var(--line);}
    .feature-list-row .structure-option,.feature-list-row .vegetation-option {height:auto;min-height:44px;max-height:none;margin:0;padding:6px;border:0;border-radius:0;box-shadow:none;overflow:visible;}
    .feature-list-row .bed-option-main {min-width:0;}
    .feature-list-row .bed-option-main strong {font-size:.82rem;line-height:1.3;white-space:normal;overflow-wrap:anywhere;}
    .feature-list-row .bed-option-main>span {font-size:.7rem;line-height:1.2;white-space:normal;}
    .feature-list-row>button:last-child {min-height:44px;padding:4px;font-size:.72rem;}
    .walk-buttons:not([hidden]) {position:absolute;z-index:7;left:50%;bottom:44px;transform:translateX(-50%);display:flex;gap:4px;padding:4px;max-width:calc(100% - 16px);box-sizing:border-box;border:1px solid var(--line-strong);border-radius:8px;background:var(--panel);box-shadow:0 3px 12px var(--shadow-soft);}
    .walk-buttons button {min-width:44px;min-height:44px;padding:6px 9px;font:600 .8rem/1.2 system-ui;white-space:nowrap;touch-action:manipulation;}
    @media(max-width:920px){.walk-buttons:not([hidden]){bottom:12px;}.walk-buttons button{padding:6px;}}
    .planting-palette {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:10px;}
    .planting-palette button {min-height:54px;white-space:normal;font-size:.85rem;}
    .planting-palette button span {display:block;font-size:1.4rem;}
    @media (max-width:920px){.camera-panel>summary{min-height:44px;display:flex;align-items:center;}.view-navigation .camera-panel-body button,.camera-panel-body input{min-height:44px;}}
    @media (max-width: 560px) {
      .garden-subtitle,
      .active-bed-command,
      .focus-control {
        display: none;
      }

      .edit-mode-status strong {
        display: none;
      }

      .planner-commandbar {
        justify-content: space-between;
      }

      .save-command {
        margin-left: auto;
      }

      .map-settings summary span {
        display: none;
      }

      .map-settings summary small {
        font-size: 0.62rem;
      }
    }
  `;
  document.head.append(style);
}
