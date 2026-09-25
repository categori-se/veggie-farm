import {bbgVisitorMapReference} from "./berkshireBotanicalVisitorMap.js";
import {BBG_REFERENCE_OVERLAYS} from "./berkshireBotanicalSpatialEvidence.js";

export const MASSGIS_PARCEL_SERVICE = "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/L3Parcels_feature_service/FeatureServer/0";
export const FALLBACK_MASSGIS_PARCEL_SERVICE = "https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/L3_TAXPAR_POLY_ASSESS_gdb/FeatureServer/0";

// The visitor map covers a 24-acre, two-sided campus, while the original demo
// stored only assessor parcel 215_1 (8.2 acres). These four public MassGIS FY2026
// records total 23.86 acres and follow the visible campus footprint around the
// mapped landmarks. They are kept as separate Polygon members and exposed as a
// standards-based MultiPolygon; gaps and road rights-of-way are not filled with
// an invented campus hull.
export const PROPERTY_PARCELS = [
  {
    id: "215_1",
    acreage: 8.2,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.335160897613775, 42.298633208103013],
        [-73.334813582520212, 42.299697894282836],
        [-73.337022724893416, 42.300926786392253],
        [-73.337155678799689, 42.300755675435916],
        [-73.33715537341061, 42.300485853071812],
        [-73.336992674812294, 42.29914508607478],
        [-73.336966617200758, 42.299012497255958],
        [-73.336935426319641, 42.298881021315459],
        [-73.336899149298205, 42.298750856912832],
        [-73.336857840950884, 42.298622200725902],
        [-73.335160897613775, 42.298633208103013]
      ]]
    }
  },
  {
    id: "215_29",
    acreage: 4.8,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.336144992235347, 42.302995605954003],
        [-73.337146620673821, 42.303025736619119],
        [-73.3372446131944, 42.302372808477784],
        [-73.337834827922947, 42.302123261094373],
        [-73.338182772372988, 42.301819722095445],
        [-73.337213247169203, 42.301285456509667],
        [-73.337209362727165, 42.301310522054401],
        [-73.337201669863603, 42.301334692082811],
        [-73.337190351594643, 42.301357391580837],
        [-73.337175677186153, 42.301378080518901],
        [-73.337157995747816, 42.301396266699392],
        [-73.337137727927683, 42.301411517466263],
        [-73.337115355904814, 42.301423469998035],
        [-73.337012389852916, 42.30147494108062],
        [-73.336268722152028, 42.301462791273508],
        [-73.336284593999054, 42.30156003634275],
        [-73.336248637974109, 42.301929795561584],
        [-73.336144992235347, 42.302995605954003]
      ]]
    }
  },
  {
    id: "215_31",
    acreage: 5.46,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.334804488702687, 42.301393473286254],
        [-73.335447011243858, 42.301525512784387],
        [-73.335452689119776, 42.30152411724935],
        [-73.335715091514828, 42.30145825041987],
        [-73.336268722152028, 42.301462791273508],
        [-73.337012389852916, 42.30147494108062],
        [-73.337115355904814, 42.301423469998035],
        [-73.337137727927683, 42.301411517466263],
        [-73.337157995747816, 42.301396266699392],
        [-73.337175677186153, 42.301378080518901],
        [-73.337190351594643, 42.301357391580837],
        [-73.337201669863603, 42.301334692082811],
        [-73.337209362727165, 42.301310522054401],
        [-73.337213247169203, 42.301285456509667],
        [-73.33485086648318, 42.299983573531996],
        [-73.334728966189303, 42.299964156108672],
        [-73.334347327133784, 42.301180574934442],
        [-73.334804488702687, 42.301393473286254]
      ]]
    }
  },
  {
    id: "215_32",
    acreage: 5.4,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-73.335975196308681, 42.302935469291882],
        [-73.336144992235347, 42.302995605954003],
        [-73.336248637974109, 42.301929795561584],
        [-73.335675431965655, 42.301924342654779],
        [-73.335495339016958, 42.301852105068775],
        [-73.335538455092831, 42.301610495114573],
        [-73.335451546905119, 42.301529615029629],
        [-73.335447011243858, 42.301525512784387],
        [-73.335068746989606, 42.301520485703939],
        [-73.334804488702687, 42.301393473286254],
        [-73.334347327133784, 42.301180574934442],
        [-73.334195701549106, 42.301663847341331],
        [-73.334191495238969, 42.302528935393362],
        [-73.335975196308681, 42.302935469291882]
      ]]
    }
  }
];

const BBG_CAMPUS_GEOMETRY = {
  type: "MultiPolygon",
  coordinates: PROPERTY_PARCELS.map((parcel) => parcel.geometry.coordinates)
};

export const PROPERTY_CONTEXT = {
  id: "berkshire-botanical-garden",
  version: 7,
  name: "Berkshire Botanical Garden",
  source: "MassGIS Level 3 Property Tax Parcels; Berkshire Botanical Garden visitor map; MassGIS 2025 aerial imagery.",
  acreage: 23.86,
  units: "inches",
  northDegrees: 0,
  aspect: "public demonstration-garden campus with visible beds, visitor parking, internal walks, buildings, and mixed woodland edges",
  // This is the geographic anchor for every local x/y value below. It is not
  // the parcel centroid: it was retained from the calibrated south-campus plan.
  // Changing it without rebasing every feature will translate the whole garden.
  // The matching, reviewable observations live in
  // data/spatial/calibrations/berkshire-botanical-garden.json.
  localOrigin: {
    lon: -73.33659599658195,
    lat: 42.29949110795708
  },
  // Convenience hull for legacy bounds checks only. Rendering and export use
  // the exact four-member MultiPolygon below, never this gap-filling hull.
  boundary: [
    [-5151, -10183],
    [-1788, -15458],
    [1464, -15326],
    [7806, -13285],
    [7793, -9502],
    [6061, -2069],
    [5787, -904],
    [4659, 3752],
    [-850, 3800],
    [-5151, -10183]
  ],
  landmark: {
    name: "Berkshire Botanical Garden",
    kind: "public botanical garden",
    campusAcreage: 24,
    parcelAcreage: 23.86,
    website: "https://www.berkshirebotanical.org/our-gardens",
    gardenMap: "https://www.berkshirebotanical.org/sites/default/files/2026-03/2024%20BBG%20Map%20Self%20Guided%20Tour%20Kiosk.pdf",
    mapEdition: "2024 self-guided visitor map",
    interpretation: "The 33 numbered garden areas and landmarks are source-indexed from the official visitor map. Their editable points, polygons, beds, structures, circulation, and vegetation are independent aerial interpretations, not surveyed features.",
    referenceMapPresentation: {
      northFromPageUpDegrees: -33,
      suggestedComparisonBearingDegrees: 33,
      appliesTo: "display only",
      note: "The illustrated visitor map is intentionally rotated. Use a roughly +30° to +33° browser-map bearing for side-by-side comparison, but never rotate stored CRS84 or local GIS geometry to match the page."
    },
    sourceCoverage: {
      numberedLandmarks: 33,
      mappedLandmarks: 33,
      mapEdition: 2024,
      geometryBasis: "visitor-map semantics with MassGIS aerial interpretation"
    }
  },
  parcel: {
    service: MASSGIS_PARCEL_SERVICE,
    queried: "Four public MassGIS parcel polygons matching the published 24-acre garden campus",
    spatialReference: "EPSG:4326",
    attributes: {
      MAP_PAR_ID: "215_1",
      PROP_ID: "215_1",
      MAP_PAR_IDS: PROPERTY_PARCELS.map((parcel) => parcel.id),
      LOT_SIZE: 23.86,
      LOT_UNITS: "Acres",
      FY: 2026,
      Shape__Area: 95828.32630804001
    },
    members: PROPERTY_PARCELS,
    geometry: BBG_CAMPUS_GEOMETRY
  },
  imagery: {
    enabled: true,
    // Parcel coverage is independent of the current zoom. A rotated viewport is
    // unioned with the complete parcel, then padded by one XYZ tile. The shared
    // implementation is src/lib/spatial/gisAlignment.js; keep this bounded so a
    // large or malformed parcel cannot trigger an unbounded browser download.
    coverage: "parcel-and-viewport",
    tilePadding: 1,
    maxTileCount: 384,
    activeBasemapId: "massgis-2025",
    name: "MassGIS 2025 Aerial",
    tileUrl: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile/{z}/{y}/{x}",
    zoom: 20,
    attribution: "Imagery: MassGIS 2025 aerial imagery",
    basemaps: [
      {
        id: "massgis-2025",
        name: "MassGIS 2025 Aerial",
        tileUrl: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer/tile/{z}/{y}/{x}",
        zoom: 20,
        minZoom: 7,
        maxZoom: 20,
        attribution: "MassGIS 2025 aerial imagery"
      },
      {
        id: "massgis-2025-cir",
        name: "MassGIS 2025 CIR vegetation",
        tileUrl: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025_CIR/MapServer/tile/{z}/{y}/{x}",
        zoom: 19,
        minZoom: 7,
        maxZoom: 19,
        attribution: "MassGIS 2025 color-infrared imagery"
      },
      {
        id: "massgis-2021",
        name: "MassGIS 2021 Aerial",
        tileUrl: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/orthos2021/MapServer/tile/{z}/{y}/{x}",
        zoom: 20,
        minZoom: 7,
        maxZoom: 20,
        attribution: "MassGIS 2021 aerial imagery"
      },
      {
        id: "massgis-2019",
        name: "MassGIS 2019 Aerial",
        tileUrl: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/USGS_Orthos_2019/MapServer/tile/{z}/{y}/{x}",
        zoom: 20,
        minZoom: 7,
        maxZoom: 20,
        attribution: "MassGIS 2019 USGS ortho imagery"
      },
      {
        id: "esri-world",
        name: "Esri World Imagery",
        tileUrl: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        zoom: 19,
        minZoom: 0,
        maxZoom: 19,
        attribution: "Esri World Imagery"
      },
      {
        id: "massgis-topo-parcels",
        name: "MassGIS Topo + Parcels",
        tileUrl: "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGISBasemap_Topo_Detailed_L3/MapServer/tile/{z}/{y}/{x}",
        zoom: 19,
        minZoom: 7,
        maxZoom: 19,
        attribution: "MassGIS basemap with property tax parcels"
      }
    ]
  },
  referenceOverlays: BBG_REFERENCE_OVERLAYS,
  notes: [
    "The mapped campus is a four-parcel MassGIS FY2026 MultiPolygon totaling 23.86 acres, closely matching the institution's reported 24 acres.",
    "MassGIS parcel geometry is converted into a local inch plane centered on the parcel.",
    "The official visitor map's complete 1–33 landmark index is retained as source metadata; its artwork is schematic and is not used as surveyed geometry.",
    "All bed, structure, and vegetation shapes are editable planning interpretations rather than survey data."
  ],
  importSources: [
    {
      name: "MassGIS Level 3 Property Tax Parcels",
      service: "https://www.mass.gov/info-details/massgis-data-property-tax-parcels",
      status: "selected public parcel and live user parcel search"
    },
    {
      name: "Berkshire Botanical Garden 2024 self-guided visitor map",
      service: "https://www.berkshirebotanical.org/sites/default/files/2026-03/2024%20BBG%20Map%20Self%20Guided%20Tour%20Kiosk.pdf",
      status: "named landmark and garden-area reference"
    },
    {
      name: "Berkshire Botanical Garden garden guide",
      service: "https://www.berkshirebotanical.org/our-gardens",
      status: "program, acreage, climate, and edible-garden reference"
    },
    {
      name: "MassGIS 2025 aerial imagery and color-infrared tiles",
      service: "https://www.mass.gov/info-details/massgis-data-2025-aerial-imagery",
      status: "natural-color and CIR context for approximate feature alignment"
    },
    {
      name: "MassGIS 2016 Land Cover/Land Use and tree canopy",
      service: "https://www.mass.gov/info-details/massgis-data-2016-land-coverland-use",
      status: "available statewide as a vegetation classification cross-check"
    },
    {
      name: "MassGIS lidar terrain data",
      service: "https://www.mass.gov/info-details/massgis-data-layers",
      status: "available statewide for deriving canopy height from DSM minus DTM"
    }
  ]
};

const BED_DEFAULTS = {
  safeMargin: 6,
  grid: 6,
  crowding: 1,
  showSpacing: true
};

// These starter coordinates are direct orthophoto interpretations, not a fit to
// the schematic visitor-map artwork. Persistent walks and repeated planting-grid
// divisions across three imagery vintages were preferred over seasonal crop
// edges. If they are revised, update the calibration manifest, API calibration
// revision, migration logic, and tests together; see docs/gis-alignment-workflow.md.
const LEGACY_STUDY_BEDS = [
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-west-1",
    name: "Edible West 1 · tomatoes",
    zone: "Edible Gardens · west plot",
    x: 2180,
    y: -2550,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Approximate 10 × 10 ft planting cell registered to the northwest cell visible in the Edible Gardens grid on the 2019, 2021, and 2025 MassGIS orthophotos; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-west-2",
    name: "Edible West 2 · herbs",
    zone: "Edible Gardens · west plot",
    x: 2095,
    y: -2440,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Companion-herb study cell registered to the next visible southwest cell of the western Edible Gardens grid; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-west-3",
    name: "Edible West 3 · greens",
    zone: "Edible Gardens · west plot",
    x: 2010,
    y: -2330,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Succession-greens study cell registered to the third visible southwest cell of the western Edible Gardens grid; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-east-1",
    name: "Edible East 1 · roots",
    zone: "Edible Gardens · east plot",
    x: 2425,
    y: -2290,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Direct-sown root study cell registered to the northeast side of the visible Edible Gardens grid; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-east-2",
    name: "Edible East 2 · brassicas",
    zone: "Edible Gardens · east plot",
    x: 2340,
    y: -2180,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Cool-season study cell registered to the next visible southwest cell on the eastern side of the Edible Gardens grid; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-east-3",
    name: "Edible East 3 · beans",
    zone: "Edible Gardens · east plot",
    x: 2255,
    y: -2070,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Trellised-legume study cell registered to the third visible southwest cell on the eastern Edible Gardens grid; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-edible-east-4",
    name: "Edible East 4 · pollinators",
    zone: "Edible Gardens · east plot",
    x: 2170,
    y: -1960,
    width: 120,
    height: 120,
    rotation: 27,
    notes: "Edible-flower and pollinator study cell registered to the fourth visible southwest cell on the eastern Edible Gardens grid; not a surveyed bed edge."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-childrens-1",
    name: "Children's Garden A",
    zone: "Children's Vegetable Garden",
    x: 3830,
    y: -150,
    width: 96,
    height: 48,
    rotation: 20,
    notes: "Small teaching bed shifted and rotated into the northwest portion of the bed grid visible beside Mother Earth Lodge on the 2025 aerial; not surveyed."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-childrens-2",
    name: "Children's Garden B",
    zone: "Children's Vegetable Garden",
    x: 4005,
    y: -60,
    width: 96,
    height: 48,
    rotation: 20,
    notes: "Small teaching bed shifted and rotated into the northeast portion of the bed grid visible beside Mother Earth Lodge on the 2025 aerial; not surveyed."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-childrens-3",
    name: "Children's Garden C",
    zone: "Children's Vegetable Garden",
    x: 3785,
    y: 70,
    width: 96,
    height: 48,
    rotation: 20,
    notes: "Small teaching bed shifted and rotated into the southwest portion of the bed grid visible beside Mother Earth Lodge on the 2025 aerial; not surveyed."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-childrens-4",
    name: "Children's Garden D",
    zone: "Children's Vegetable Garden",
    x: 3960,
    y: 155,
    width: 96,
    height: 48,
    rotation: 20,
    notes: "Small teaching bed shifted and rotated into the southeast portion of the bed grid visible beside Mother Earth Lodge on the 2025 aerial; not surveyed."
  },
  {
    ...BED_DEFAULTS,
    id: "bbg-discovery-food-flowers",
    name: "Discovery food + flowers",
    zone: "Children's Discovery Garden",
    // This is a proposal, not an observed footprint, but its geometry must
    // still respect the named parent section. The prior demo center was east
    // of the independently traced Children's Discovery Garden polygon.
    x: 1050,
    y: -2500,
    width: 240,
    height: 96,
    rotation: -6,
    notes: "Representative food-and-flower study bed placed wholly inside the approximate Children's Discovery Garden section; this remains a planning proposal, not an existing-bed survey."
  }
].map((bed) => {
  const mapNumber = bed.zone === "Children's Vegetable Garden"
    ? 12
    : bed.zone === "Children's Discovery Garden" ? 5 : 8;
  return {
    ...bed,
    featureStatus: "planned-study",
    geometryBasis: "aerial-interpreted",
    surveyStatus: "not-surveyed",
    sourceReferences: [bbgVisitorMapReference(mapNumber, "representative editable bed within the named garden area", "medium")]
  };
});

// Revision 3 replaces the sparse twelve-bed visual demo with the physical bed
// grids that can actually be resolved in the 2019, 2021, and 2025 orthophotos.
// The visitor map supplies the section names (#8 and #12), while the coordinates
// below come from the registered north-up z20 aerial raster. Eleven old study
// IDs are retained so saved plant placements survive; their crop labels remain
// proposals and must not be read as an inventory of BBG's current plantings.
const EDIBLE_OBSERVED_CENTERS = [
  [[2001, -2621], [2100, -2584], [2198, -2547], [2296, -2509], [2395, -2472]],
  [[1914, -2547], [2012, -2510], [2110, -2473], [2209, -2436], [2307, -2398]],
  [[1826, -2474], [1924, -2436], [2023, -2399], [2121, -2362], [2219, -2324]],
  [[1738, -2400], [1837, -2363], [1935, -2325], [2033, -2288], [2132, -2251]],
  [[1650, -2326], [1749, -2289], [1847, -2252], [1946, -2214], [2044, -2177]],
  [[1563, -2252], [1661, -2215], [1760, -2178], [1858, -2141], [1956, -2103]],
  [[1475, -2179], [1573, -2141], [1672, -2104], [1770, -2067], [1869, -2029]]
];

const CHILDRENS_OBSERVED_CENTERS = [
  [[3668, -198], [3744, -167], [3819, -135]],
  [[3638, -98], [3713, -66], [3789, -34]],
  [[3608, 3], [3683, 35], [3758, 67]],
  [[3577, 104], [3653, 136], [3728, 168]]
];

const EDIBLE_STUDY_ASSIGNMENTS = new Map([
  ["1:3", "bbg-edible-west-1"],
  ["2:3", "bbg-edible-west-2"],
  ["3:3", "bbg-edible-west-3"],
  ["1:5", "bbg-edible-east-1"],
  ["2:5", "bbg-edible-east-2"],
  ["3:5", "bbg-edible-east-3"],
  ["4:5", "bbg-edible-east-4"]
]);

const CHILDRENS_STUDY_ASSIGNMENTS = new Map([
  ["1:1", "bbg-childrens-1"],
  ["1:3", "bbg-childrens-2"],
  ["4:1", "bbg-childrens-3"],
  ["4:3", "bbg-childrens-4"]
]);

const LEGACY_STUDY_BY_ID = new Map(LEGACY_STUDY_BEDS.map((bed) => [bed.id, bed]));

const BED_CENTER_CONTROL_ID_BY_LOCAL_POINT = new Map([
  ["2198,-2547", "edible-grid-northwest-cell"],
  ["2023,-2399", "edible-grid-southwest-cell"],
  ["2395,-2472", "edible-grid-northeast-cell"],
  ["2132,-2251", "edible-grid-southeast-cell"],
  ["3668,-198", "childrens-grid-northwest-bed"],
  ["3728,168", "childrens-grid-southeast-bed"]
]);

function observedGridBed({campus, row, column, center, studyId}) {
  const edible = campus === "edible";
  const mapNumber = edible ? 8 : 12;
  const parentId = edible ? "bbg-edible-gardens-section" : "bbg-childrens-vegetable-garden-section";
  const label = edible ? "Edible Gardens" : "Children's Vegetable Garden";
  const idPrefix = edible ? "bbg-edible-grid" : "bbg-childrens-grid";
  const subplotId = edible
    ? row <= 3 ? "bbg-edible-north-subplot" : "bbg-edible-south-subplot"
    : "bbg-childrens-main-grid";
  const gridCellId = edible
    ? `bbg-grid-estimate-edible-r${String(row).padStart(2, "0")}-c${String(column).padStart(2, "0")}`
    : `bbg-grid-estimate-child-r${String(row).padStart(2, "0")}-c${String(column).padStart(2, "0")}`;
  const centerControlId = BED_CENTER_CONTROL_ID_BY_LOCAL_POINT.get(center.join(",")) || null;
  const study = LEGACY_STUDY_BY_ID.get(studyId);
  return {
    ...BED_DEFAULTS,
    id: study?.id || `${idPrefix}-r${row}-c${column}`,
    name: study?.name || `${label} · row ${row}, bed ${column}`,
    zone: `${label} · regularized grid estimate`,
    // A grid cell belongs to a derived subplot, while sectionId retains the
    // independently named visitor-map garden. The subplot boundary is a
    // regularized grouping aid, not an observed physical enclosure.
    parentId: subplotId,
    sectionId: parentId,
    subplotId,
    gridCellId,
    centerControlId,
    snappedToFeatureId: study ? gridCellId : null,
    collection: "beds",
    row,
    column,
    x: center[0],
    y: center[1],
    width: edible ? 60 : 72,
    height: edible ? 60 : 48,
    rotation: edible ? 21 : 23,
    cropTaxon: null,
    plantingAssignment: study ? "planning-proposal" : null,
    taxonStatus: study ? "planning-proposal; not an observed crop" : "unassigned; no crop observation",
    featureStatus: "aerial-grid-estimate",
    identificationStatus: "regularized grid cell; polygon boundary unverified",
    geometryBasis: "regular-grid interpolation from six raster center controls; generalized dimensions and rotation",
    surveyStatus: "not-surveyed",
    confidence: centerControlId ? "medium" : "low",
    boundaryConfidence: "low",
    digitizationRasterId: "massgis-2025-south-campus-wide-z20",
    imageryId: "massgis-2025",
    imageryZoom: 20,
    imageryTileOrigin: [310677, 388066],
    sourceReferences: [bbgVisitorMapReference(mapNumber, "regularized bed-grid cell within the named garden area", centerControlId ? "medium" : "low")],
    notes: `${study ? "Planning assignment on an " : "Unassigned "}aerial-visible grid cell estimate. ${centerControlId ? `Its center is tied to raster control ${centerControlId}; ` : "Its center is interpolated from the six retained grid controls; "}dimensions, rotation, and every polygon edge remain generalized and unverified.`
  };
}

const OBSERVED_GRID_BEDS = [
  ...EDIBLE_OBSERVED_CENTERS.flatMap((centers, rowIndex) => centers.map((center, columnIndex) => {
    const key = `${rowIndex + 1}:${columnIndex + 1}`;
    return observedGridBed({
      campus: "edible",
      row: rowIndex + 1,
      column: columnIndex + 1,
      center,
      studyId: EDIBLE_STUDY_ASSIGNMENTS.get(key)
    });
  })),
  ...CHILDRENS_OBSERVED_CENTERS.flatMap((centers, rowIndex) => centers.map((center, columnIndex) => {
    const key = `${rowIndex + 1}:${columnIndex + 1}`;
    return observedGridBed({
      campus: "children",
      row: rowIndex + 1,
      column: columnIndex + 1,
      center,
      studyId: CHILDRENS_STUDY_ASSIGNMENTS.get(key)
    });
  }))
];

const DISCOVERY_STUDY_BED = LEGACY_STUDY_BY_ID.get("bbg-discovery-food-flowers");

export const DEFAULT_BEDS = [
  ...OBSERVED_GRID_BEDS,
  {
    ...DISCOVERY_STUDY_BED,
    collection: "beds",
    zone: "Children's Discovery Garden · planning study",
    parentId: "bbg-childrens-discovery-garden",
    sectionId: "bbg-childrens-discovery-garden",
    cropTaxon: null,
    plantingAssignment: "planning-proposal",
    taxonStatus: "planning-proposal; not an observed crop",
    featureStatus: "planned-study",
    geometryBasis: "schematic planning bed within an aerial-interpreted garden section",
    confidence: "low",
    sourceReferences: [bbgVisitorMapReference(5, "representative editable planning bed within the named garden area", "low")],
    notes: "Representative food-and-flower study bed; this is a planning proposal rather than an observed existing-bed footprint."
  }
];

function closeLocalRing(points) {
  const ring = points.map(([x, y]) => [x, y]);
  const first = ring[0];
  const last = ring.at(-1);
  if (first && (first[0] !== last?.[0] || first[1] !== last?.[1])) ring.push([...first]);
  return ring;
}

function bbgGardenArea(number, id, name, x, y, width, height, points, options = {}) {
  const confidence = options.confidence || "low";
  const type = options.type || "garden-section";
  return {
    id,
    name: `${name} · map ${number}`,
    type,
    x,
    y,
    width,
    height,
    rotation: options.rotation || 0,
    confidence,
    collection: options.collection || "gardenSections",
    sourceMapNumber: number,
    digitizationRasterId: options.digitizationRasterId
      || (number >= 17 ? "massgis-2025-north-campus-z20" : "massgis-2025-south-campus-wide-z20"),
    imageryId: options.imageryId || "massgis-2025",
    imageryZoom: options.imageryZoom ?? 20,
    imageryTileOrigin: options.imageryTileOrigin || (number >= 17 ? [310676, 388063] : [310677, 388066]),
    source: "Berkshire Botanical Garden 2024 visitor map with MassGIS 2025 aerial interpretation",
    geometryBasis: options.geometryBasis || "schematic-located and aerial-checked",
    surveyStatus: "not-surveyed",
    boundaryPolicy: options.boundaryPolicy || "inside-campus",
    sourceReferences: [bbgVisitorMapReference(number, options.role || "named garden-area polygon", confidence)],
    localGeometry: {
      type: "Polygon",
      coordinates: [closeLocalRing(points)]
    },
    notes: options.notes || `Approximate editable ${name} area interpreted from the numbered visitor-map relationship and visible aerial context; not a surveyed planting boundary.`
  };
}

function bbgGardenPoint(number, id, name, type, x, y, options = {}) {
  const confidence = options.confidence || "medium";
  return {
    id,
    name: `${name} · map ${number}`,
    type,
    x,
    y,
    width: options.width || 180,
    height: options.height || 180,
    rotation: 0,
    confidence,
    collection: options.collection || "gardenSections",
    sourceMapNumber: number,
    digitizationRasterId: options.geometryBasis === "schematic-locator"
      ? null
      : options.digitizationRasterId
        || (number >= 17 ? "massgis-2025-north-campus-z20" : "massgis-2025-south-campus-wide-z20"),
    imageryId: options.geometryBasis === "schematic-locator" ? null : options.imageryId || "massgis-2025",
    imageryZoom: options.geometryBasis === "schematic-locator" ? null : options.imageryZoom ?? 20,
    imageryTileOrigin: options.geometryBasis === "schematic-locator"
      ? null
      : options.imageryTileOrigin || (number >= 17 ? [310676, 388063] : [310677, 388066]),
    source: "Berkshire Botanical Garden 2024 visitor map with MassGIS 2025 aerial interpretation",
    geometryBasis: options.geometryBasis || "aerial-observed point",
    surveyStatus: "not-surveyed",
    boundaryPolicy: options.boundaryPolicy
      || (options.geometryBasis === "schematic-locator" ? "reference-locator" : "inside-campus"),
    sourceReferences: [bbgVisitorMapReference(number, options.role || "named landmark point", confidence)],
    localGeometry: {type: "Point", coordinates: [x, y]},
    notes: options.notes || `Approximate point for ${name}, checked against the visitor map and 2025 orthophoto; not a surveyed trunk or monument position.`
  };
}

function bbgGardenLine(number, id, name, points, options = {}) {
  const confidence = options.confidence || "medium";
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    id,
    name: `${name} · map ${number}`,
    type: options.type || "planted-border",
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    rotation: 0,
    confidence,
    collection: options.collection || "gardenSections",
    sourceMapNumber: number,
    digitizationRasterId: options.digitizationRasterId
      || (number >= 17 ? "massgis-2025-north-campus-z20" : "massgis-2025-south-campus-wide-z20"),
    source: "Berkshire Botanical Garden 2024 visitor map with MassGIS 2025 aerial interpretation",
    geometryBasis: options.geometryBasis || "aerial-interpreted planted corridor centerline",
    surveyStatus: "not-surveyed",
    boundaryPolicy: options.boundaryPolicy || "inside-campus",
    corridorWidthFeet: options.corridorWidthFeet || null,
    imageryId: options.imageryId || "massgis-2025",
    imageryZoom: options.imageryZoom ?? 20,
    imageryTileOrigin: options.imageryTileOrigin || (number >= 17 ? [310676, 388063] : [310677, 388066]),
    sourceReferences: [bbgVisitorMapReference(number, options.role || "named linear garden corridor", confidence)],
    localGeometry: {type: "LineString", coordinates: points.map(([x, y]) => [x, y])},
    notes: options.notes || `Approximate ${name} corridor interpreted from its visitor-map identity and an aerial-visible planted band; not a surveyed centerline or width.`
  };
}

// The source map supplies names and schematic relationships. South-campus
// locations were checked at higher aerial resolution; north-campus garden-room
// polygons remain deliberately low-confidence until their edges are field- or
// plan-verified. In particular, named collections are areas—not invented
// species-level plant observations.
const BBG_NUMBERED_SITE_FEATURES = [
  bbgGardenPoint(2, "bbg-tree-of-forty-fruit", "The Tree of Forty Fruit", "specimen-tree", 807, -4507, {
    confidence: "medium",
    role: "named specimen-tree point"
  }),
  bbgGardenArea(3, "bbg-carol-tatkon-entry-garden", "Carol Tatkon Entry Garden · west", -170, -3950, 650, 850, [
    [-464, -4251], [141, -4230], [176, -3718], [-94, -3492], [-399, -3605], [-508, -3926]
  ], {confidence: "medium", role: "aerial-visible planted-area part with visitor-map semantic identity"}),
  bbgGardenArea(3, "bbg-carol-tatkon-entry-garden-north", "Carol Tatkon Entry Garden · north", -150, -4660, 700, 850, [
    [-490, -4989], [-20, -5076], [189, -4906], [180, -4338], [-72, -4251], [-377, -4425]
  ], {confidence: "low", role: "aerial-visible planted-area part with visitor-map semantic identity"}),
  bbgGardenArea(3, "bbg-carol-tatkon-entry-garden-east", "Carol Tatkon Entry Garden · east", 610, -3500, 520, 650, [
    [372, -3700], [664, -3796], [860, -3562], [759, -3284], [498, -3202], [363, -3401]
  ], {confidence: "medium", role: "aerial-visible planted-area part with visitor-map semantic identity"}),
  bbgGardenPoint(4, "bbg-ash-on-the-rock", "Ash-on-the-Rock", "garden-landmark", 929, -3210, {
    confidence: "low",
    role: "named plant-and-rock landmark point"
  }),
  bbgGardenArea(5, "bbg-childrens-discovery-garden", "Children's Discovery Garden", 1020, -2690, 1200, 1260, [
    [646, -3319], [1299, -3232], [1604, -2863], [1452, -2321], [929, -2061], [450, -2364], [407, -2928]
  ], {confidence: "medium"}),
  bbgGardenArea(6, "bbg-rain-garden", "Rain Garden", 1140, -3730, 1050, 1020, [
    [646, -4208], [1169, -4251], [1582, -3991], [1648, -3492], [1321, -3232], [886, -3319], [646, -3709]
  ], {confidence: "low", role: "seasonally ambiguous planted-surface outline with visitor-map semantic identity"}),
  bbgGardenArea(8, "bbg-edible-gardens-section", "Edible Gardens", 1935, -2325, 1120, 760, [
    [1996, -2677], [2488, -2490], [1874, -1974], [1382, -2160]
  ], {
    confidence: "medium",
    geometryBasis: "aerial-visible planting-grid envelope with regularized cell estimates",
    role: "named garden section containing thirty-five regularized bed-grid cells"
  }),
  bbgGardenArea(9, "bbg-native-border", "Native Border", 2860, -1660, 915, 1128, [
    [2409, -2104], [2671, -2213], [3324, -1497], [3259, -1171], [3019, -1085], [2584, -1627]
  ], {
    confidence: "low",
    geometryBasis: "aerial-visible planted band with visitor-map semantic identity",
    role: "named native-border planted-area polygon",
    notes: "Approximate planted-band geometry only; no illustrated or aerial plant is encoded as a species observation."
  }),
  bbgGardenArea(12, "bbg-childrens-vegetable-garden-section", "Children's Vegetable Garden", 3698, -16, 520, 520, [
    [3646, -265], [3872, -169], [3750, 234], [3524, 139]
  ], {
    confidence: "medium",
    geometryBasis: "2025 aerial-visible teaching-grid envelope with regularized cell estimates",
    role: "named teaching-garden section containing twelve regularized bed-grid cells"
  }),
  {
    id: "bbg-forest-walk",
    name: "Forest Walk · map 13",
    type: "trail",
    x: 1800,
    y: 700,
    width: 1700,
    height: 2100,
    rotation: 0,
    confidence: "medium",
    collection: "infrastructure",
    sourceMapNumber: 13,
    imageryId: "massgis-2025",
    imageryZoom: 20,
    imageryTileOrigin: [310677, 388066],
    source: "Berkshire Botanical Garden 2024 visitor map with MassGIS 2025 aerial interpretation",
    geometryBasis: "aerial-interpreted centerline",
    networkId: "bbg-pedestrian-circulation",
    topologyNodeIds: ["P19", "F1", "F2", "F3", "F4", "F5", "P22"],
    surveyStatus: "not-surveyed",
    boundaryPolicy: "clip-to-campus",
    sourceReferences: [bbgVisitorMapReference(13, "named walk centerline", "medium")],
    localGeometry: {type: "LineString", coordinates: [[3694, 499], [3193, 932], [2540, 1626], [1626, 2147], [711, 1887], [145, 1063], [102, -499]]},
    notes: "Low-confidence Forest Walk centerline: leaf-off imagery supports portions while the visitor map supplies the route identity and topology; not a surveyed trail alignment or width."
  },
  bbgGardenArea(14, "bbg-williams-family-amphitheater", "The Williams Family Amphitheater", 113, -466, 620, 720, [
    [-159, -282], [-138, -608], [-7, -824], [211, -759], [385, -499], [320, -239], [80, -109]
  ], {
    type: "amphitheater",
    confidence: "high",
    geometryBasis: "aerial-observed bench and clearing footprint",
    role: "named built-landscape footprint"
  }),
  bbgGardenArea(17, "bbg-center-house-entry-garden", "Center House Entry Garden", 185, -6846, 1306, 1214, [
    [-229, -7345], [337, -7431], [772, -7171], [903, -6694], [642, -6217], [400, -6350], [-150, -6650], [-403, -6998]
  ], {
    confidence: "high",
    geometryBasis: "aerial-traced fountain garden room",
    role: "named fountain-entry garden polygon"
  }),
  bbgGardenPoint(17, "bbg-center-house-fountain", "Center House Entry Garden fountain", "garden-landmark", 185, -6846, {
    confidence: "high",
    role: "aerial-visible fountain point",
    notes: "Aerial-visible fountain/fire-feature center identified by the visitor-map description; an approximate point, not a surveyed monument."
  }),
  bbgGardenArea(18, "bbg-vista-garden", "Vista Garden", 2166, -6737, 2047, 1063, [
    [1164, -6824], [1382, -7128], [1948, -7280], [2601, -7236], [3036, -6998], [3211, -6651], [2949, -6347], [2340, -6217], [1687, -6304], [1208, -6520]
  ], {
    confidence: "high",
    geometryBasis: "aerial-traced visible oval garden room"
  }),
  bbgGardenLine(19, "bbg-de-gersdorff-perennial-border", "de Gersdorff Perennial Border", [
    [2209, -7562], [2862, -7518], [3515, -7431], [4168, -7171]
  ], {confidence: "low", corridorWidthFeet: "12–18"}),
  bbgGardenLine(20, "bbg-frelinghuysen-shade-border", "Frelinghuysen Shade Border", [
    [2383, -7041], [3254, -7041], [4212, -6824], [4430, -6434]
  ], {confidence: "low", corridorWidthFeet: "12–20"}),
  bbgGardenLine(21, "bbg-daylily-walk", "Daylily Walk", [
    [1774, -6087], [2645, -6000], [3733, -5870], [4822, -5696], [5910, -5523], [6868, -5479]
  ], {
    confidence: "medium",
    boundaryPolicy: "clip-to-campus",
    corridorWidthFeet: "10–16",
    geometryBasis: "aerial-visible linear planted corridor",
    notes: "Aerial-visible Daylily Walk planted corridor; stored as a line with an approximate width rather than a generic rectangular garden polygon."
  }),
  bbgGardenArea(22, "bbg-arboretum-pinetum", "Arboretum/Pinetum", 5500, -6000, 2600, 1822, [
    [4517, -6694], [5431, -6911], [6000, -6600], [6500, -6100], [6200, -5300], [5692, -5089], [4778, -5523], [4386, -6130]
  ], {
    type: "arboretum",
    confidence: "low",
    geometryBasis: "aerial-interpreted diffuse tree-collection management area",
    role: "named tree-collection management area",
    notes: "Diffuse, approximate Arboretum/Pinetum management area; the aerial does not support a crisp bed edge or species-level inventory."
  }),
  bbgGardenArea(23, "bbg-foster-rock-garden", "Foster Rock Garden", 6345, -6694, 1306, 1258, [
    [5910, -7258], [6520, -7345], [7042, -7041], [6950, -6477], [6781, -6087], [6084, -6173], [5736, -6651]
  ], {
    type: "rock-garden",
    confidence: "medium",
    geometryBasis: "aerial-traced rock and outcrop garden footprint"
  }),
  bbgGardenPoint(24, "bbg-woodland-garden", "Woodland Garden", "garden-landmark", 4800, -12300, {
    confidence: "low",
    geometryBasis: "schematic-locator",
    role: "named garden locator without a defensible visible edge",
    notes: "Visitor-map locator only. Available leaf-off imagery shows canopy but not a stable Woodland Garden boundary, so no polygon is asserted."
  }),
  bbgGardenPoint(25, "bbg-pond-garden", "Pond Garden", "garden-landmark", 6300, -13820, {
    confidence: "low",
    geometryBasis: "schematic-locator",
    role: "named pond-garden locator without a defensible visible water edge",
    notes: "Visitor-map locator only. The probable pond is outside or obscured in the registered z20 review raster, so no water polygon is asserted."
  }),
  bbgGardenArea(26, "bbg-lucys-garden", "Lucy's Garden", 5039, -7431, 2220, 1909, [
    [4081, -8082], [4647, -8386], [5344, -8342], [5866, -7952], [6084, -7388], [5866, -6824], [5300, -6477], [4604, -6607], [4081, -6998], [3864, -7562]
  ], {
    confidence: "high",
    geometryBasis: "aerial-traced concentric garden-room footprint"
  }),
  bbgGardenPoint(26, "bbg-lucys-garden-gazebo", "Lucy's Garden gazebo", "garden-landmark", 5039, -7431, {
    confidence: "high",
    role: "aerial-visible central gazebo point"
  }),
  bbgGardenArea(27, "bbg-rose-garden", "Rose Garden", 2209, -8212, 958, 911, [
    [1774, -8603], [2209, -8580], [2558, -8429], [2601, -7952], [2296, -7692], [1861, -7822], [1643, -8169]
  ], {confidence: "medium", geometryBasis: "aerial-traced mill-wheel and planted-section footprint"}),
  bbgGardenArea(28, "bbg-new-wave-garden", "New Wave Garden", 1709, -8082, 1045, 975, [
    [1251, -8580], [1774, -8580], [2035, -8342], [1948, -7865], [1600, -7605], [1164, -7778], [990, -8212]
  ], {confidence: "low", geometryBasis: "aerial-interpreted planted mass constrained by adjacent rooms"}),
  bbgGardenArea(29, "bbg-herb-garden", "Herb Garden", 1121, -7952, 1089, 1084, [
    [598, -8472], [1077, -8559], [1469, -8256], [1600, -7735], [1338, -7475], [816, -7605], [511, -7995]
  ], {confidence: "medium", geometryBasis: "aerial-traced terraced garden footprint"}),
  bbgGardenArea(30, "bbg-wildflower-meadow", "The Wildflower Meadow", -1650, -12100, 4600, 5500, [
    [-1550, -14800], [650, -14650], [650, -12700], [300, -10900], [-600, -9600], [-2200, -9300], [-3950, -10450], [-3350, -11650], [-1750, -12900]
  ], {
    type: "meadow",
    confidence: "medium",
    geometryBasis: "parcel-constrained aerial-interpreted meadow management boundary",
    role: "named 2.5-acre meadow management area",
    notes: "Approximate parcel-contained Wildflower Meadow management polygon; its 2.4995-acre planar area reconciles with the visitor-map description without inventing plant points."
  }),
  bbgGardenArea(31, "bbg-herb-production-garden", "Herb Production Garden", -700, -9000, 2264, 868, [
    [-1666, -9297], [-621, -9427], [337, -9297], [468, -8819], [-185, -8559], [-1274, -8559], [-1796, -8906]
  ], {
    confidence: "low",
    geometryBasis: "schematic identity with rough parcel-contained aerial management area",
    notes: "Low-confidence behind-house production area; current imagery does not support individual crop-row or bed boundaries."
  }),
  bbgGardenArea(32, "bbg-procter-mixed-border", "Procter Mixed Border Garden", -882, -8169, 2025, 1388, [
    [-1666, -8689], [-839, -8863], [-185, -8559], [-185, -7909], [-708, -7475], [-1405, -7605], [-1840, -8039]
  ], {confidence: "medium", geometryBasis: "aerial-traced crescent border footprint"}),
  {
    id: "bbg-center-house",
    name: "Center House · map 33",
    type: "house",
    x: 315,
    y: -7909,
    width: 1436,
    height: 976,
    rotation: 0,
    confidence: "high",
    source: "Berkshire Botanical Garden 2024 visitor map with MassGIS 2025 aerial interpretation",
    collection: "infrastructure",
    sourceMapNumber: 33,
    imageryId: "massgis-2025",
    imageryZoom: 20,
    imageryTileOrigin: [310676, 388063],
    geometryBasis: "aerial-traced irregular roof polygon",
    surveyStatus: "not-surveyed",
    boundaryPolicy: "inside-campus",
    sourceReferences: [bbgVisitorMapReference(33, "named building footprint", "high")],
    localGeometry: {type: "Polygon", coordinates: [[
      [-425, -8472], [620, -8472], [620, -8082], [772, -8082], [772, -7692],
      [293, -7692], [293, -7496], [-664, -7496], [-664, -8017], [-425, -8017], [-425, -8472]
    ]]},
    notes: "Approximate irregular Center House roof polygon traced from the registered north-campus z20 aerial; distinct from the Visitor Center and not a measured building survey."
  }
];

const BBG_EXISTING_SITE_FEATURES = [
  {
    id: "bbg-passive-solar-greenhouse",
    name: "Passive Solar Greenhouse · map 16",
    type: "greenhouse",
    x: -462,
    y: -5062,
    width: 650,
    height: 180,
    rotation: 0,
    confidence: "high",
    source: "MassGIS 2025 aerial screenshot calibration",
    geometryBasis: "aerial-traced roof polygon",
    localGeometry: {type: "Polygon", coordinates: [[[-786, -5141], [-138, -5141], [-146, -4984], [-773, -4984], [-786, -5141]]]},
    notes: "Approximate polygon traced around the long greenhouse roof visible at the north end of the parking area; not a measured building survey."
  },
  {
    id: "bbg-visitor-center",
    name: "Barbara Euston Visitor Center and Shop · map 1",
    type: "house",
    x: 389,
    y: -3939,
    width: 500,
    height: 900,
    rotation: 6,
    confidence: "high",
    source: "MassGIS 2025 aerial screenshot calibration",
    geometryBasis: "aerial-traced irregular roof polygon",
    localGeometry: {type: "Polygon", coordinates: [[
      [211, -4325], [459, -4316], [494, -4204], [598, -4195], [590, -3575],
      [372, -3553], [337, -3696], [180, -3718], [189, -4100], [250, -4126], [211, -4325]
    ]]},
    notes: "Approximate irregular Visitor Center roof polygon traced from the 2025 aerial; distinct from Center House, map 33, and not a measured footprint."
  },
  {
    id: "bbg-fitzpatrick-conservatory",
    name: "Fitzpatrick Conservatory · map 7",
    type: "greenhouse",
    x: 2279,
    y: -3429,
    width: 720,
    height: 330,
    rotation: 10,
    confidence: "high",
    source: "MassGIS 2025 aerial screenshot calibration",
    geometryBasis: "aerial-traced combined roof polygon",
    localGeometry: {type: "Polygon", coordinates: [[
      [1909, -3774], [2257, -3666], [2692, -3427], [2540, -3084],
      [2235, -3202], [2140, -3319], [1865, -3440], [1909, -3774]
    ]]},
    notes: "Named by the official visitor map; approximate combined conservatory roof traced from the 2025 aerial."
  },
  {
    id: "bbg-lexan-greenhouse",
    name: "Lexan Greenhouse · map 15",
    type: "greenhouse",
    x: 1084,
    y: -1783,
    width: 930,
    height: 370,
    rotation: 12,
    confidence: "high",
    source: "MassGIS 2025 aerial screenshot calibration",
    geometryBasis: "aerial-traced roof polygon",
    localGeometry: {type: "Polygon", coordinates: [[
      [864, -2082], [1465, -1787], [1256, -1484], [703, -1796], [864, -2082]
    ]]},
    notes: "Named by the official visitor map; approximate roof polygon traced from the visible Lexan Greenhouse edges."
  },
  {
    id: "bbg-education-center",
    name: "Education Center · map 10",
    type: "house",
    x: 2628,
    y: -889,
    width: 1180,
    height: 760,
    rotation: 35,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    geometryBasis: "aerial-traced irregular roof polygon",
    localGeometry: {type: "Polygon", coordinates: [[
      [2148, -1453], [2932, -1171], [3128, -933], [3324, -846], [3259, -521],
      [2932, -326], [2649, -434], [2497, -326], [1931, -629], [2039, -955], [2148, -1453]
    ]]},
    notes: "Approximate irregular Education Center roof complex traced from the 2025 aerial; not a measured footprint."
  },
  {
    id: "bbg-mother-earth-lodge",
    name: "Mother Earth Lodge · map 11",
    type: "house",
    x: 3106,
    y: 141,
    width: 720,
    height: 520,
    rotation: 20,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    geometryBasis: "2025 aerial-traced roof polygon",
    localGeometry: {type: "Polygon", coordinates: [[
      [2540, -195], [2954, -326], [3607, -22], [3672, 282], [3411, 542],
      [2975, 607], [2584, 390], [2540, -195]
    ]]},
    notes: "Approximate 2025 roof polygon beside the Children's Vegetable Garden; the current form is not as clearly visible in 2019/2021 imagery and is not surveyed."
  },
  {
    id: "bbg-main-parking",
    name: "Main visitor parking",
    type: "parking",
    x: -610,
    y: -3960,
    width: 1320,
    height: 2050,
    rotation: -2,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-surface",
    geometryBasis: "2025 aerial-traced parking-surface polygon",
    localGeometry: {
      type: "Polygon",
      coordinates: [[
        [-1248, -5314], [-812, -5314], [-812, -4794], [-595, -4360],
        [-290, -3796], [59, -3492], [211, -2690], [-181, -2581],
        [-377, -2690], [-660, -2625], [-812, -3015], [-1030, -3145],
        [-1161, -3709], [-1248, -4577], [-1248, -5314]
      ]]
    },
    notes: "Approximate paved and gravel parking surface traced from the 2025 aerial; vehicles and shadows make portions of the edge uncertain."
  },
  {
    id: "bbg-parking-entry-drive",
    name: "Parking entry drive",
    type: "road",
    x: -750,
    y: -4400,
    width: 230,
    height: 1420,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected vehicle centerline",
    networkId: "bbg-vehicle-circulation",
    topologyNodeIds: ["V0", "V1", "V2", "V3", "V4", "V5", "V6"],
    localGeometry: {
      type: "LineString",
      coordinates: [[-1531, -5965], [-1226, -5531], [-1161, -4707], [-1074, -3839], [-834, -3384], [-333, -3362], [15, -3275]]
    },
    notes: "Connected vehicle approach centerline; endpoints are shared exactly with the parking loop rather than stored as isolated rotated rectangles."
  },
  {
    id: "bbg-parking-aisle",
    name: "Parking circulation loop",
    type: "road",
    x: -360,
    y: -3050,
    width: 250,
    height: 1460,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected vehicle centerline",
    networkId: "bbg-vehicle-circulation",
    topologyNodeIds: ["V4", "V5", "V6", "V7", "V8", "V9", "V4"],
    localGeometry: {
      type: "LineString",
      coordinates: [[-834, -3384], [-333, -3362], [15, -3275], [124, -2863], [-333, -2711], [-725, -2798], [-834, -3384]]
    },
    notes: "Connected parking circulation loop; V4 and V6 are shared with the entry spine."
  },
  {
    id: "bbg-main-garden-walk",
    name: "Visitor-area pedestrian link",
    type: "path",
    x: 530,
    y: -3300,
    width: 110,
    height: 1510,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-pedestrian-circulation",
    topologyNodeIds: ["V6", "P1", "P2", "P3", "P4", "P5"],
    localGeometry: {
      type: "LineString",
      coordinates: [[15, -3275], [189, -3622], [341, -3839], [537, -3644], [929, -3210], [1060, -2603]]
    },
    notes: "Connected visitor-area pedestrian link; V6 is the exact shared vehicle/pedestrian junction and P5 joins the garden walks."
  },
  {
    id: "bbg-edible-walk-west",
    name: "South-campus pedestrian spine",
    type: "path",
    x: 2200,
    y: -1500,
    width: 92,
    height: 830,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-pedestrian-circulation",
    topologyNodeIds: ["P5", "P6", "P11", "P12", "P13", "P14", "P15", "P16", "P17", "P19"],
    localGeometry: {
      type: "LineString",
      coordinates: [[1060, -2603], [1452, -2560], [1386, -2126], [1060, -1800], [1495, -1453], [2148, -1193], [2671, -889], [3193, -542], [3346, -152], [3694, 499]]
    },
    notes: "Continuous south-campus spine from the edible grid through the education and children's areas; junction coordinates are shared with its branches."
  },
  {
    id: "bbg-edible-cross-walk",
    name: "Lawn and edible-garden loop",
    type: "path",
    x: 1650,
    y: -3000,
    width: 92,
    height: 950,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-pedestrian-circulation",
    topologyNodeIds: ["P5", "P7", "P8", "P9", "P10", "P6", "P5"],
    localGeometry: {
      type: "LineString",
      coordinates: [[1060, -2603], [1365, -3384], [1909, -3514], [2192, -3037], [1800, -2690], [1452, -2560], [1060, -2603]]
    },
    notes: "Closed pedestrian loop around the lawn and edible-garden area; P5 and P6 are shared with the campus spine."
  },
  {
    id: "bbg-discovery-garden-walk",
    name: "Amphitheater branch walk",
    type: "path",
    x: 850,
    y: -850,
    width: 88,
    height: 900,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-pedestrian-circulation",
    topologyNodeIds: ["P13", "P20", "P21", "P22"],
    localGeometry: {
      type: "LineString",
      coordinates: [[1495, -1453], [1887, -846], [711, -759], [102, -499]]
    },
    notes: "Branch from the shared campus spine to the Williams Family Amphitheater; stored as a continuous centerline."
  },
  {
    id: "bbg-parking-north-aisle",
    name: "North parking and gravel aisle",
    type: "road",
    x: -930,
    y: -4400,
    width: 220,
    height: 1800,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected vehicle centerline",
    networkId: "bbg-vehicle-circulation",
    topologyNodeIds: ["V4", "V10", "V11", "V12"],
    localGeometry: {type: "LineString", coordinates: [[-834, -3384], [-899, -4013], [-899, -4707], [-943, -5141]]},
    notes: "North/gravel parking aisle joined to the vehicle network at V4; approximate and not a surveyed road centerline."
  },
  {
    id: "bbg-childrens-garden-walk",
    name: "Children's garden branch walk",
    type: "path",
    x: 3650,
    y: 50,
    width: 88,
    height: 700,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial screenshot calibration",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-pedestrian-circulation",
    topologyNodeIds: ["P17", "P18", "P24", "P23"],
    // Route the maintained centerline around the regularized teaching-bed
    // grid. The former three-vertex approximation cut through three estimated
    // bed cells and confused infrastructure editing with bed editing.
    localGeometry: {type: "LineString", coordinates: [[3346, -152], [3480, 250], [3900, 270], [3977, -22]]},
    notes: "Branch from the shared south-campus spine around the west and south edges of the Children's Vegetable Garden grid; approximate, aerial-checked, and not surveyed."
  },
  {
    id: "bbg-north-entry-connector",
    name: "North-campus road crossing connector",
    type: "path",
    x: 555,
    y: -6076,
    width: 90,
    height: 542,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced access connector",
    surveyStatus: "not-surveyed",
    boundaryPolicy: "allow-external-connector",
    networkId: "bbg-north-pedestrian-circulation",
    topologyNodeIds: ["N0", "N1"],
    localGeometry: {type: "LineString", coordinates: [[511, -5805], [598, -6347]]},
    notes: "Road/right-of-way connector into the north campus; explicitly allowed to cross outside the selected assessor MultiPolygon and not treated as BBG-owned parcel infrastructure."
  },
  {
    id: "bbg-north-entry-spine",
    name: "North-campus entry spine",
    type: "path",
    x: 390,
    y: -6955,
    width: 100,
    height: 1215,
    rotation: 0,
    confidence: "high",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-north-pedestrian-circulation",
    topologyNodeIds: ["N1", "N2", "N3"],
    localGeometry: {type: "LineString", coordinates: [[598, -6347], [185, -6846], [424, -7562]]},
    notes: "Parcel-contained entry spine through the fountain garden; N1 is shared with the separately classified road connector."
  },
  {
    id: "bbg-north-east-main-walk",
    name: "North-campus east garden walk",
    type: "path",
    x: 3730,
    y: -5850,
    width: 100,
    height: 1000,
    rotation: 0,
    confidence: "high",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-north-pedestrian-circulation",
    topologyNodeIds: ["N1", "N4", "N5", "N6", "N7", "N8", "N9"],
    localGeometry: {type: "LineString", coordinates: [[598, -6347], [1338, -6217], [2209, -6130], [3211, -5957], [4212, -5783], [5431, -5566], [6563, -5349]]},
    notes: "Continuous aerial-visible east/main garden walk; shared endpoint N1 joins the entry network."
  },
  {
    id: "bbg-north-upper-garden-arc",
    name: "North-campus upper garden arc",
    type: "path",
    x: 2775,
    y: -8200,
    width: 100,
    height: 1000,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-north-pedestrian-circulation",
    topologyNodeIds: ["N10", "N11", "N12", "N13", "N14", "N15"],
    localGeometry: {type: "LineString", coordinates: [[729, -7778], [1556, -8082], [2470, -8472], [3472, -8646], [4256, -8342], [4822, -7909]]},
    notes: "Continuous upper garden arc resolved in the north-campus aerial; approximately traced, not surveyed."
  },
  {
    id: "bbg-lucys-garden-approach",
    name: "Lucy's Garden approach",
    type: "path",
    x: 4250,
    y: -8050,
    width: 100,
    height: 1215,
    rotation: 0,
    confidence: "high",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced connected pedestrian centerline",
    networkId: "bbg-north-pedestrian-circulation",
    topologyNodeIds: ["N13", "N16", "N17", "N18"],
    localGeometry: {type: "LineString", coordinates: [[3472, -8646], [4168, -8472], [4734, -8082], [5039, -7431]]},
    notes: "Aerial-visible approach to Lucy's Garden; N13 is shared exactly with the upper garden arc."
  },
  {
    id: "bbg-wildflower-meadow-main-trail",
    name: "Wildflower Meadow main trail",
    type: "trail",
    x: -1544,
    y: -12200,
    width: 90,
    height: 5206,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced meadow trail centerline",
    networkId: "bbg-meadow-trails",
    topologyNodeIds: ["M0", "M1", "M2", "M3"],
    localGeometry: {type: "LineString", coordinates: [[-412, -9600], [-934, -11335], [-1805, -13070], [-2676, -14806]]},
    notes: "Aerial-visible main Wildflower Meadow trail, clipped conceptually to the parcel-contained meadow management area."
  },
  {
    id: "bbg-wildflower-meadow-branch-trail",
    name: "Wildflower Meadow branch trail",
    type: "trail",
    x: -716,
    y: -14070,
    width: 90,
    height: 1996,
    rotation: 0,
    confidence: "medium",
    source: "MassGIS 2025 aerial imagery",
    collection: "infrastructure",
    featureStatus: "aerial-observed-centerline",
    geometryBasis: "2025 aerial-traced meadow trail centerline",
    networkId: "bbg-meadow-trails",
    topologyNodeIds: ["M2", "M4", "M5"],
    localGeometry: {type: "LineString", coordinates: [[-1805, -13070], [-499, -14372], [372, -15066]]},
    notes: "Aerial-visible Y branch; M2 is shared exactly with the main meadow trail."
  }
];

const BBG_VISITOR_MAP_NUMBER_BY_FEATURE_ID = new Map([
  ["bbg-visitor-center", 1],
  ["bbg-fitzpatrick-conservatory", 7],
  ["bbg-education-center", 10],
  ["bbg-mother-earth-lodge", 11],
  ["bbg-lexan-greenhouse", 15],
  ["bbg-passive-solar-greenhouse", 16]
]);

// These three polygons are hierarchy/grouping aids derived from the regularized
// bed-center grids. They make section -> subplot -> bed relationships explicit
// without claiming that a hedge, curb, or independently observed plot boundary
// exists at these edges. Replace them when a surveyed or individually traced
// plot boundary becomes available.
const BBG_DERIVED_GRID_SUBPLOTS = [
  {
    ...bbgGardenArea(8, "bbg-edible-north-subplot", "Edible Gardens north grid grouping", 2110, -2472, 650, 390, [
      [1975, -2650], [2435, -2478], [2225, -2290], [1785, -2455]
    ], {
      type: "garden-subplot",
      collection: "gardenSubplots",
      confidence: "low",
      geometryBasis: "derived envelope of regularized bed-grid centers; boundary unverified",
      role: "derived grouping for northern regularized bed-grid cells",
      notes: "Derived north-grid grouping used for hierarchy and selection. It is not an observed or surveyed plot boundary."
    }),
    parentId: "bbg-edible-gardens-section",
    sectionId: "bbg-edible-gardens-section",
    featureStatus: "derived-grid-grouping"
  },
  {
    ...bbgGardenArea(8, "bbg-edible-south-subplot", "Edible Gardens south grid grouping", 1810, -2215, 660, 470, [
      [1710, -2435], [2165, -2265], [1890, -1995], [1440, -2165]
    ], {
      type: "garden-subplot",
      collection: "gardenSubplots",
      confidence: "low",
      geometryBasis: "derived envelope of regularized bed-grid centers; boundary unverified",
      role: "derived grouping for southern regularized bed-grid cells",
      notes: "Derived south-grid grouping used for hierarchy and selection. It is not an observed or surveyed plot boundary."
    }),
    parentId: "bbg-edible-gardens-section",
    sectionId: "bbg-edible-gardens-section",
    featureStatus: "derived-grid-grouping"
  },
  {
    ...bbgGardenArea(12, "bbg-childrens-main-grid", "Children's Vegetable Garden grid grouping", 3700, -15, 390, 500, [
      [3640, -240], [3860, -145], [3755, 205], [3540, 110]
    ], {
      type: "garden-subplot",
      collection: "gardenSubplots",
      confidence: "low",
      geometryBasis: "derived envelope of regularized bed-grid centers; boundary unverified",
      role: "derived grouping for regularized teaching-bed cells",
      notes: "Derived teaching-grid grouping used for hierarchy and selection. It is not an observed or surveyed plot boundary."
    }),
    parentId: "bbg-childrens-vegetable-garden-section",
    sectionId: "bbg-childrens-vegetable-garden-section",
    featureStatus: "derived-grid-grouping"
  }
];

// Keep source-map areas, buildings, and circulation in the editable site-feature
// collection. The Tree of Forty Fruit is intentionally excluded here and
// modeled below as a geographic tree-center observation. A specimen tree is not
// infrastructure, and representing it twice would make one visible crown appear
// as two selectable canonical features.
export const PROPERTY_STRUCTURES = [
  ...BBG_EXISTING_SITE_FEATURES,
  ...BBG_DERIVED_GRID_SUBPLOTS,
  ...BBG_NUMBERED_SITE_FEATURES.filter((feature) => feature.id !== "bbg-tree-of-forty-fruit")
].map((feature) => {
  const mapNumber = BBG_VISITOR_MAP_NUMBER_BY_FEATURE_ID.get(feature.id);
  return {
    ...feature,
    collection: feature.collection || "infrastructure",
    featureStatus: feature.featureStatus || (mapNumber ? "observed-reference" : "context-overlay"),
    geometryBasis: feature.geometryBasis || "aerial-interpreted",
    surveyStatus: feature.surveyStatus || "not-surveyed",
    boundaryPolicy: feature.boundaryPolicy || "clip-to-campus",
    digitizationRasterId: feature.geometryBasis === "schematic-locator"
      ? null
      : feature.digitizationRasterId
        || (feature.y <= -6000 ? "massgis-2025-north-campus-z20" : "massgis-2025-south-campus-wide-z20"),
    imageryId: feature.geometryBasis === "schematic-locator" ? null : feature.imageryId || "massgis-2025",
    imageryZoom: feature.geometryBasis === "schematic-locator" ? null : feature.imageryZoom ?? 20,
    imageryTileOrigin: feature.geometryBasis === "schematic-locator"
      ? null
      : feature.imageryTileOrigin
        || (feature.y <= -6000 ? [310676, 388063] : [310677, 388066]),
    sourceReferences: feature.sourceReferences || (mapNumber
      ? [bbgVisitorMapReference(mapNumber, "named built-feature footprint", feature.confidence)]
      : [])
  };
});

const BBG_TREE_RASTER = Object.freeze({
  id: "massgis-2025-south-campus-wide-z20",
  imageryId: "massgis-2025",
  zoom: 20,
  tileOrigin: [310677, 388066]
});

function bbgMatureTreeObservation({
  id,
  name,
  x,
  y,
  sourcePixel,
  crownWidthFeet,
  crownDepthFeet,
  heightEstimateFeet,
  heightEstimateRangeFeet,
  canopyClass,
  confidence = "medium",
  heightConfidence = "low",
  sourceReferences = [],
  notes
}) {
  return {
    id,
    name,
    kind: "tree",
    observationType: "mature-tree",
    geometryRepresentation: "point",
    collection: "vegetation",
    plantId: null,
    identificationStatus: "tree observed; taxon unidentified",
    taxonStatus: "unidentified; no species inferred from aerial imagery",
    canopyClass,
    x,
    y,
    // Width/depth are derived render controls only. The canonical geometry is
    // the center Point below; these values can be replaced by field-measured
    // crown radii without editing the geographic tree location.
    width: crownWidthFeet * 12,
    height: crownDepthFeet * 12,
    crownWidthFeet,
    crownDepthFeet,
    crownRadiusEastWestFeet: crownWidthFeet / 2,
    crownRadiusNorthSouthFeet: crownDepthFeet / 2,
    crownDiameterFeet: Math.sqrt(crownWidthFeet * crownDepthFeet),
    crownMeasurementMethod: "crown-axis estimate from registered 2025 MassGIS natural-color orthophoto",
    crownConfidence: confidence,
    heightEstimateFeet,
    heightEstimateRangeFeet,
    heightEstimateMethod: "coarse structural class estimated from the leaf-off crown and shadow; field or lidar measurement required",
    heightConfidence,
    rotation: 0,
    confidence,
    source: "MassGIS 2025 aerial imagery",
    featureStatus: "aerial-observed-tree-center",
    geometryBasis: "orthophoto-observed tree/crown center Point; canopy and shadow are derived display geometry",
    surveyStatus: "not-surveyed",
    boundaryPolicy: "inside-campus",
    digitizationRasterId: BBG_TREE_RASTER.id,
    imageryId: BBG_TREE_RASTER.imageryId,
    imageryZoom: BBG_TREE_RASTER.zoom,
    imageryTileOrigin: [...BBG_TREE_RASTER.tileOrigin],
    sourcePixel,
    localGeometry: {type: "Point", coordinates: [x, y]},
    sourceReferences: [
      {
        sourceId: "source:massgis-aerial-2025",
        locator: `${BBG_TREE_RASTER.id} pixel [${sourcePixel.join(", ")}]`,
        role: "tree center and crown-axis observation",
        confidence
      },
      ...sourceReferences
    ],
    provenance: {
      sourceId: "massgis-aerial-2025",
      sourceFeatureId: id,
      geometryMethod: "tree center digitized as a Point on the registered north-up orthophoto",
      measurementMethod: "crown axes measured from visible 2025 crown/branch envelope; height is a coarse shadow-supported estimate",
      sourcePixel,
      digitizationRasterId: BBG_TREE_RASTER.id,
      confidence,
      heightConfidence,
      surveyStatus: "not-surveyed"
    },
    notes
  };
}

// This is deliberately a conservative initial inventory of individually
// legible crowns in open garden space. Dense woodland is contextual land cover,
// not a collection of invented tree ellipses or species. Add another tree only
// after recording a reproducible raster pixel (or field/GNSS point), crown-axis
// measurements, source vintage, and confidence.
export const DEFAULT_VEGETATION = [
  bbgMatureTreeObservation({
    id: "bbg-tree-of-forty-fruit",
    name: "The Tree of Forty Fruit · map 2",
    x: 799,
    y: -4599,
    sourcePixel: [870, 645],
    crownWidthFeet: 18,
    crownDepthFeet: 18,
    heightEstimateFeet: 18,
    heightEstimateRangeFeet: [12, 26],
    canopyClass: "deciduous",
    confidence: "medium",
    sourceReferences: [bbgVisitorMapReference(2, "named specimen-tree identity; geometry independently observed on the orthophoto", "medium")],
    notes: "Official-map identity with an independently digitized 2025 orthophoto center. Crown and height are estimates, not a species assertion or field measurement."
  }),
  bbgMatureTreeObservation({
    id: "bbg-tree-east-lawn-evergreen-01",
    name: "East lawn mature tree observation 1",
    x: 3237,
    y: -2118,
    sourcePixel: [1430, 1217],
    crownWidthFeet: 27,
    crownDepthFeet: 24,
    heightEstimateFeet: 28,
    heightEstimateRangeFeet: [20, 38],
    canopyClass: "evergreen",
    confidence: "high",
    notes: "Isolated foliage-bearing crown centered directly from the leaf-off 2025 orthophoto; taxon remains unidentified."
  }),
  bbgMatureTreeObservation({
    id: "bbg-tree-east-lawn-deciduous-01",
    name: "East lawn mature tree observation 2",
    x: 4134,
    y: -1823,
    sourcePixel: [1636, 1285],
    crownWidthFeet: 64,
    crownDepthFeet: 52,
    heightEstimateFeet: 55,
    heightEstimateRangeFeet: [40, 72],
    canopyClass: "deciduous",
    confidence: "high",
    notes: "Large isolated leaf-off crown and trunk-shadow origin are legible in the registered 2025 orthophoto; taxon remains unidentified."
  }),
  bbgMatureTreeObservation({
    id: "bbg-tree-education-northwest-01",
    name: "Education Center northwest mature tree",
    x: 2475,
    y: -1649,
    sourcePixel: [1255, 1325],
    crownWidthFeet: 56,
    crownDepthFeet: 52,
    heightEstimateFeet: 50,
    heightEstimateRangeFeet: [36, 66],
    canopyClass: "deciduous",
    confidence: "high",
    notes: "Open-grown leaf-off crown northwest of the Education Center, digitized independently of the indicative KML marks."
  }),
  bbgMatureTreeObservation({
    id: "bbg-tree-education-east-01",
    name: "Education Center east ornamental tree",
    x: 3071,
    y: -868,
    sourcePixel: [1392, 1505],
    crownWidthFeet: 28,
    crownDepthFeet: 26,
    heightEstimateFeet: 22,
    heightEstimateRangeFeet: [15, 32],
    canopyClass: "deciduous",
    confidence: "high",
    notes: "Distinct light-toned crown immediately east of the Education Center in the 2025 image. Flower color and taxon are intentionally not inferred."
  })
];
