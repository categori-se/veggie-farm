import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_BEDS,
  DEFAULT_VEGETATION,
  PROPERTY_CONTEXT,
  PROPERTY_PARCELS,
  PROPERTY_STRUCTURES
} from "../src/data/propertyContext.js";
import {
  BBG_VISITOR_MAP_LANDMARKS,
  BBG_VISITOR_MAP_SOURCE_ID
} from "../src/data/berkshireBotanicalVisitorMap.js";
import {BERKSHIRE_GARDEN_REFERENCES} from "../src/data/gardenCatalog.js";

function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const crosses = (yi > y) !== (yj > y)
      && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  if (geometry?.type === "Polygon") return pointInPolygon(point, geometry.coordinates[0]);
  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon[0]));
  }
  return false;
}

function rotatedRectangleRing({x, y, width, height, rotation = 0}) {
  const radians = rotation * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const corners = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2]
  ].map(([offsetX, offsetY]) => [
    x + offsetX * cosine - offsetY * sine,
    y + offsetX * sine + offsetY * cosine
  ]);
  return [...corners, corners[0]];
}

function crossProduct(start, end, point) {
  return (end[0] - start[0]) * (point[1] - start[1])
    - (end[1] - start[1]) * (point[0] - start[0]);
}

function pointOnSegment(start, end, point) {
  const epsilon = 1e-9;
  return Math.abs(crossProduct(start, end, point)) <= epsilon
    && point[0] >= Math.min(start[0], end[0]) - epsilon
    && point[0] <= Math.max(start[0], end[0]) + epsilon
    && point[1] >= Math.min(start[1], end[1]) - epsilon
    && point[1] <= Math.max(start[1], end[1]) + epsilon;
}

function segmentsIntersect(a, b, c, d) {
  const abC = crossProduct(a, b, c);
  const abD = crossProduct(a, b, d);
  const cdA = crossProduct(c, d, a);
  const cdB = crossProduct(c, d, b);
  const crosses = ((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
    && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
  return crosses
    || pointOnSegment(a, b, c)
    || pointOnSegment(a, b, d)
    || pointOnSegment(c, d, a)
    || pointOnSegment(c, d, b);
}

function lineStringIntersectsRing(line, ring) {
  for (let lineIndex = 1; lineIndex < line.length; lineIndex += 1) {
    const start = line[lineIndex - 1];
    const end = line[lineIndex];
    if (pointInPolygon(start, ring) || pointInPolygon(end, ring)) return true;
    for (let ringIndex = 1; ringIndex < ring.length; ringIndex += 1) {
      if (segmentsIntersect(start, end, ring[ringIndex - 1], ring[ringIndex])) return true;
    }
  }
  return false;
}

function assertClosedRing(ring, label) {
  assert.ok(Array.isArray(ring) && ring.length >= 4, `${label} should contain at least four positions`);
  assert.deepEqual(ring[0], ring.at(-1), `${label} should be closed`);
  for (const position of ring) {
    assert.equal(position.length, 2, `${label} positions should be two-dimensional`);
    assert.ok(position.every(Number.isFinite), `${label} positions should be finite`);
  }
}

function assertPolygonGeometry(geometry, label) {
  assert.equal(geometry?.type, "Polygon", `${label} should be a Polygon`);
  assert.ok(geometry.coordinates.length >= 1, `${label} should have an exterior ring`);
  geometry.coordinates.forEach((ring, index) => assertClosedRing(ring, `${label} ring ${index}`));
}

function assertLocalGeometry(geometry, label) {
  if (geometry.type === "Point") {
    assert.equal(geometry.coordinates.length, 2, `${label} should be a two-dimensional point`);
    assert.ok(geometry.coordinates.every(Number.isFinite), `${label} should use finite point coordinates`);
    return;
  }
  if (geometry.type === "LineString") {
    assert.ok(geometry.coordinates.length >= 2, `${label} should contain at least two positions`);
    assert.ok(geometry.coordinates.flat().every(Number.isFinite), `${label} should use finite line coordinates`);
    return;
  }
  if (geometry.type === "Polygon") {
    assertPolygonGeometry(geometry, label);
    return;
  }
  assert.fail(`${label} uses unsupported local geometry ${geometry.type}`);
}

test("the bundled studio parcel is the public Berkshire Botanical Garden reference", () => {
  assert.equal(PROPERTY_CONTEXT.id, "berkshire-botanical-garden");
  assert.equal(PROPERTY_CONTEXT.name, "Berkshire Botanical Garden");
  assert.equal(PROPERTY_CONTEXT.acreage, 23.86);
  assert.equal(PROPERTY_CONTEXT.version, 7);
  assert.equal(PROPERTY_CONTEXT.landmark.campusAcreage, 24);
  assert.equal(PROPERTY_CONTEXT.landmark.sourceCoverage.numberedLandmarks, 33);
  assert.equal(PROPERTY_CONTEXT.landmark.sourceCoverage.mappedLandmarks, 33);
  assert.match(PROPERTY_CONTEXT.landmark.gardenMap, /berkshirebotanical\.org/);
  assert.equal(PROPERTY_CONTEXT.parcel.attributes.MAP_PAR_ID, "215_1");
  assert.equal(PROPERTY_CONTEXT.parcel.geometry.type, "MultiPolygon");
});

test("the bundled BBG campus preserves four assessor polygons without filling their gaps", () => {
  assert.equal(PROPERTY_PARCELS.length, 4);
  assert.deepEqual(new Set(PROPERTY_PARCELS.map((parcel) => parcel.id)), new Set(["215_1", "215_29", "215_31", "215_32"]));
  assert.equal(new Set(PROPERTY_PARCELS.map((parcel) => parcel.id)).size, PROPERTY_PARCELS.length);
  assert.ok(Math.abs(PROPERTY_PARCELS.reduce((total, parcel) => total + parcel.acreage, 0) - 23.86) < 1e-9);
  assert.deepEqual(PROPERTY_CONTEXT.parcel.members, PROPERTY_PARCELS);
  assert.deepEqual(PROPERTY_CONTEXT.parcel.attributes.MAP_PAR_IDS, PROPERTY_PARCELS.map((parcel) => parcel.id));
  assert.equal(PROPERTY_CONTEXT.parcel.geometry.coordinates.length, PROPERTY_PARCELS.length);

  PROPERTY_PARCELS.forEach((parcel, index) => {
    assertPolygonGeometry(parcel.geometry, `parcel ${parcel.id}`);
    assert.deepEqual(PROPERTY_CONTEXT.parcel.geometry.coordinates[index], parcel.geometry.coordinates);
  });
});

test("the bundled public parcel omits owner and street-address attributes", () => {
  const keys = Object.keys(PROPERTY_CONTEXT.parcel.attributes);
  assert.ok(keys.length > 0);
  assert.equal(keys.some((key) => /OWNER|OWN_|SITE_ADDR|ADDR_NUM|FULL_STR|CITY|LOCATION/i.test(key)), false);
});

test("the implementation preserves regularized edible and teaching grids separately from the planning study", () => {
  assert.equal(DEFAULT_BEDS.length, 48);
  assert.equal(new Set(DEFAULT_BEDS.map((bed) => bed.id)).size, DEFAULT_BEDS.length);

  const gridEstimates = DEFAULT_BEDS.filter((bed) => bed.featureStatus === "aerial-grid-estimate");
  const edible = gridEstimates.filter((bed) => bed.sectionId === "bbg-edible-gardens-section");
  const childrens = gridEstimates.filter((bed) => bed.sectionId === "bbg-childrens-vegetable-garden-section");
  const planned = DEFAULT_BEDS.filter((bed) => bed.featureStatus === "planned-study");

  assert.equal(gridEstimates.length, 47);
  assert.equal(edible.length, 35);
  assert.equal(childrens.length, 12);
  assert.deepEqual(planned.map(({id}) => id), ["bbg-discovery-food-flowers"]);

  const structuresById = new Map(PROPERTY_STRUCTURES.map((feature) => [feature.id, feature]));
  const subplots = PROPERTY_STRUCTURES.filter((feature) => feature.type === "garden-subplot");
  assert.deepEqual(
    new Set(subplots.map(({id}) => id)),
    new Set(["bbg-edible-north-subplot", "bbg-edible-south-subplot", "bbg-childrens-main-grid"])
  );

  const gridCellIds = new Set();
  for (const bed of gridEstimates) {
    assert.equal(bed.parentId, bed.subplotId, `${bed.id} should be parented by its derived subplot`);
    const parent = structuresById.get(bed.parentId);
    assert.equal(parent?.type, "garden-subplot", `${bed.id} should reference an existing subplot`);
    assert.equal(parent?.parentId, bed.sectionId, `${bed.id}'s subplot should reference its named section`);
    assert.equal(pointInGeometry([bed.x, bed.y], parent.localGeometry), true, `${bed.id}'s center should fall within its derived subplot`);
    assert.match(bed.gridCellId, /^bbg-grid-estimate-(edible|child)-r\d{2}-c\d{2}$/);
    assert.equal(gridCellIds.has(bed.gridCellId), false, `${bed.gridCellId} should be unique`);
    gridCellIds.add(bed.gridCellId);
    assert.equal(bed.observedFootprintId ?? null, null, `${bed.id} must not claim an independently observed footprint`);
    assert.ok(Number.isInteger(bed.row) && bed.row >= 1);
    assert.ok(Number.isInteger(bed.column) && bed.column >= 1);
    assert.equal(bed.cropTaxon, null, `${bed.id} should not claim an aerial-observed crop taxon`);
    assert.match(bed.identificationStatus, /boundary unverified/i);
    assert.match(bed.geometryBasis, /regular-grid interpolation from six raster center controls/i);
    if (bed.plantingAssignment) {
      assert.equal(bed.plantingAssignment, "planning-proposal");
      assert.match(bed.taxonStatus, /planning-proposal; not an observed crop/i);
    } else {
      assert.match(bed.taxonStatus, /unassigned; no crop observation/i);
    }
  }

  const controls = gridEstimates.filter((bed) => bed.centerControlId);
  assert.deepEqual(
    new Set(controls.map(({centerControlId}) => centerControlId)),
    new Set([
      "edible-grid-northwest-cell",
      "edible-grid-northeast-cell",
      "edible-grid-southwest-cell",
      "edible-grid-southeast-cell",
      "childrens-grid-northwest-bed",
      "childrens-grid-southeast-bed"
    ])
  );
  assert.ok(controls.every((bed) => bed.snappedToFeatureId === bed.gridCellId));
  assert.ok(gridEstimates.every((bed) => bed.snappedToFeatureId == null || bed.snappedToFeatureId === bed.gridCellId));

  const discovery = planned[0];
  assert.equal(discovery.parentId, "bbg-childrens-discovery-garden");
  assert.equal(discovery.sectionId, discovery.parentId);
  assert.equal(discovery.observedFootprintId, undefined);
  assert.equal(discovery.plantingAssignment, "planning-proposal");
  assert.match(discovery.taxonStatus, /planning-proposal/i);

  for (const bed of DEFAULT_BEDS) {
    assert.equal(pointInPolygon([bed.x, bed.y], PROPERTY_CONTEXT.boundary), true, `${bed.id} should be inside the selected parcel`);
    assert.ok(bed.width >= 48);
    assert.ok(bed.height >= 48);
  }
});

test("BBG source geometry remains honest about points, lines, areas, and infrastructure", () => {
  const byId = new Map(PROPERTY_STRUCTURES.map((feature) => [feature.id, feature]));
  const expectedGeometry = new Map([
    ["bbg-de-gersdorff-perennial-border", "LineString"],
    ["bbg-frelinghuysen-shade-border", "LineString"],
    ["bbg-daylily-walk", "LineString"],
    ["bbg-woodland-garden", "Point"],
    ["bbg-pond-garden", "Point"],
    ["bbg-lucys-garden", "Polygon"],
    ["bbg-lucys-garden-gazebo", "Point"],
    ["bbg-center-house", "Polygon"]
  ]);

  for (const [id, geometryType] of expectedGeometry) {
    const feature = byId.get(id);
    assert.ok(feature, `${id} should remain in the site-feature inventory`);
    assert.equal(feature.localGeometry?.type, geometryType, `${id} should use ${geometryType} geometry`);
  }

  for (const feature of PROPERTY_STRUCTURES.filter(({collection}) => collection === "infrastructure")) {
    if (["path", "road", "trail"].includes(feature.type)) {
      assert.equal(feature.localGeometry?.type, "LineString", `${feature.id} infrastructure should be a centerline`);
    }
  }

  for (const id of ["bbg-woodland-garden", "bbg-pond-garden"]) {
    const feature = byId.get(id);
    assert.equal(feature.confidence, "low");
    assert.equal(feature.geometryBasis, "schematic-locator");
  }
});

test("BBG circulation networks share exact topology nodes instead of disconnected path fragments", () => {
  const networkFeatures = PROPERTY_STRUCTURES.filter((feature) => feature.networkId);
  assert.ok(networkFeatures.length >= 12);

  const observations = new Map();
  for (const feature of networkFeatures) {
    assert.equal(feature.collection, "infrastructure");
    assert.equal(feature.localGeometry?.type, "LineString");
    assert.equal(feature.topologyNodeIds.length, feature.localGeometry.coordinates.length, `${feature.id} should identify every vertex`);

    feature.topologyNodeIds.forEach((nodeId, index) => {
      const key = `${feature.networkId}:${nodeId}`;
      const coordinate = feature.localGeometry.coordinates[index];
      const prior = observations.get(key) || [];
      prior.forEach(({coordinate: existing}) => {
        assert.deepEqual(coordinate, existing, `${key} should resolve to one exact shared coordinate`);
      });
      prior.push({featureId: feature.id, coordinate});
      observations.set(key, prior);
    });
  }

  for (const key of [
    "bbg-vehicle-circulation:V4",
    "bbg-pedestrian-circulation:P5",
    "bbg-pedestrian-circulation:P13",
    "bbg-north-pedestrian-circulation:N1",
    "bbg-north-pedestrian-circulation:N13",
    "bbg-meadow-trails:M2"
  ]) {
    assert.ok(observations.get(key)?.length >= 2, `${key} should join multiple infrastructure segments`);
  }

  const connector = PROPERTY_STRUCTURES.find(({id}) => id === "bbg-north-entry-connector");
  assert.equal(connector.boundaryPolicy, "allow-external-connector");
});

test("BBG circulation centerlines do not cut through the Children's regularized bed grid", () => {
  const childrensBeds = DEFAULT_BEDS.filter((bed) => (
    bed.featureStatus === "aerial-grid-estimate"
    && bed.sectionId === "bbg-childrens-vegetable-garden-section"
  ));
  const circulation = PROPERTY_STRUCTURES.filter((feature) => (
    feature.collection === "infrastructure"
    && feature.localGeometry?.type === "LineString"
  ));

  assert.equal(childrensBeds.length, 12);
  assert.ok(circulation.length >= 12);
  for (const path of circulation) {
    for (const bed of childrensBeds) {
      assert.equal(
        lineStringIntersectsRing(path.localGeometry.coordinates, rotatedRectangleRing(bed)),
        false,
        `${path.id} should route around rather than through ${bed.id}`
      );
    }
  }
});

test("Center House and Lucy's Garden retain registered north-campus anchors and subfeatures", () => {
  const byId = new Map(PROPERTY_STRUCTURES.map((feature) => [feature.id, feature]));
  const centerHouse = byId.get("bbg-center-house");
  const lucysGarden = byId.get("bbg-lucys-garden");
  const lucysGazebo = byId.get("bbg-lucys-garden-gazebo");

  assert.deepEqual([centerHouse.x, centerHouse.y], [315, -7909]);
  assert.equal(centerHouse.sourceMapNumber, 33);
  assert.equal(centerHouse.geometryBasis, "aerial-traced irregular roof polygon");
  assert.deepEqual(centerHouse.imageryTileOrigin, [310676, 388063]);
  assert.equal(centerHouse.imageryZoom, 20);

  assert.deepEqual([lucysGarden.x, lucysGarden.y], [5039, -7431]);
  assert.equal(lucysGarden.sourceMapNumber, 26);
  assert.equal(lucysGarden.geometryBasis, "aerial-traced concentric garden-room footprint");
  assert.deepEqual(lucysGazebo.localGeometry, {type: "Point", coordinates: [5039, -7431]});
  assert.equal(lucysGazebo.sourceMapNumber, 26);
});

test("BBG features preserve the complete numbered visitor-map inventory as structured provenance", () => {
  assert.deepEqual(BBG_VISITOR_MAP_LANDMARKS.map(({number}) => number), Array.from({length: 33}, (_, index) => index + 1));
  assert.equal(new Set(BBG_VISITOR_MAP_LANDMARKS.map(({name}) => name)).size, 33);

  const features = [...DEFAULT_BEDS, ...PROPERTY_STRUCTURES, ...DEFAULT_VEGETATION];
  const references = features.flatMap((feature) => feature.sourceReferences || [])
    .filter((reference) => reference.sourceId === BBG_VISITOR_MAP_SOURCE_ID);
  const representedNumbers = new Set(references.map(({mapNumber}) => mapNumber));

  assert.deepEqual(representedNumbers, new Set(Array.from({length: 33}, (_, index) => index + 1)));
  for (const landmark of BBG_VISITOR_MAP_LANDMARKS) {
    const matching = references.filter((reference) => reference.mapNumber === landmark.number);
    assert.ok(matching.length >= 1, `visitor-map landmark ${landmark.number} should have a spatial representation`);
    assert.ok(matching.every((reference) => reference.label === landmark.name));
    assert.ok(matching.every((reference) => reference.locator === `numbered landmark ${landmark.number}`));
    assert.ok(matching.every((reference) => reference.role && reference.confidence));
  }
});

test("BBG editable features have unique IDs and valid local geometry", () => {
  const features = [...DEFAULT_BEDS, ...PROPERTY_STRUCTURES, ...DEFAULT_VEGETATION];
  const ids = features.map(({id}) => id);
  assert.equal(new Set(ids).size, ids.length);

  for (const feature of features) {
    assert.ok(Number.isFinite(feature.x) && Number.isFinite(feature.y), `${feature.id} should have a finite center`);
    if (feature.localGeometry) {
      assertLocalGeometry(feature.localGeometry, feature.id);
    } else {
      assert.ok(Number.isFinite(feature.width) && feature.width > 0, `${feature.id} should have a positive width`);
      assert.ok(Number.isFinite(feature.height) && feature.height > 0, `${feature.id} should have a positive height`);
    }
  }
});

test("mapped context features carry interpretation provenance", () => {
  assert.ok(PROPERTY_STRUCTURES.length >= 13);
  assert.ok(PROPERTY_STRUCTURES.every((structure) => structure.notes?.trim()));
  assert.ok(PROPERTY_STRUCTURES.every((structure) => structure.geometryBasis));
  assert.ok(PROPERTY_STRUCTURES.every((structure) => structure.surveyStatus === "not-surveyed"));
  assert.ok(PROPERTY_STRUCTURES.some((structure) => structure.type === "parking"));
  assert.ok(PROPERTY_STRUCTURES.some((structure) => structure.type === "road"));
  assert.ok(PROPERTY_STRUCTURES.filter((structure) => structure.type === "path").length >= 3);
  assert.ok(PROPERTY_STRUCTURES.every((structure) => structure.source && structure.confidence));
  assert.equal(DEFAULT_VEGETATION.length, 5, "the initial tree inventory is intentionally conservative");
  assert.equal(PROPERTY_STRUCTURES.some((feature) => feature.id === "bbg-tree-of-forty-fruit"), false);
  assert.equal(DEFAULT_VEGETATION.some((feature) => feature.id === "bbg-tree-of-forty-fruit"), true);
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.kind === "tree"));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.geometryRepresentation === "point"));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.localGeometry?.type === "Point"));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.plantId == null));
  assert.ok(DEFAULT_VEGETATION.every((feature) => /unidentified/i.test(feature.taxonStatus)));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.crownWidthFeet > 0 && feature.crownDepthFeet > 0));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.heightEstimateFeet > 0 && feature.heightConfidence));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.sourcePixel?.length === 2));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.digitizationRasterId === "massgis-2025-south-campus-wide-z20"));
  assert.ok(DEFAULT_VEGETATION.every((feature) => feature.source && feature.confidence));
  assert.match(PROPERTY_CONTEXT.landmark.interpretation, /not surveyed/i);

  const sourceIndexed = [...PROPERTY_STRUCTURES, ...DEFAULT_VEGETATION]
    .filter((feature) => feature.sourceReferences?.length);
  for (const feature of sourceIndexed) {
    assert.ok(feature.geometryBasis, `${feature.id} should describe its geometry basis`);
    assert.equal(feature.surveyStatus, "not-surveyed", `${feature.id} should not imply survey accuracy`);
    assert.ok(["inside-campus", "clip-to-campus", "reference-locator"].includes(feature.boundaryPolicy), `${feature.id} should state its campus-boundary policy`);
  }
});

test("the studio catalog includes several sourced Berkshire garden starters", () => {
  assert.equal(BERKSHIRE_GARDEN_REFERENCES.length, 4);
  assert.equal(new Set(BERKSHIRE_GARDEN_REFERENCES.map((garden) => garden.id)).size, 4);
  assert.ok(BERKSHIRE_GARDEN_REFERENCES.every((garden) => garden.status === "mapped"));
  for (const garden of BERKSHIRE_GARDEN_REFERENCES) {
    assert.equal(garden.county, "Berkshire County");
    assert.ok(garden.name && garden.town && garden.planningFocus && garden.summary);
    assert.ok(["Polygon", "MultiPolygon"].includes(garden.geometry.type));
    assert.equal(garden.mapping.parcelStatus, "matched");
    assert.ok(garden.mapping.parcelId && garden.mapping.parcelFiscalYear);
    assert.equal(garden.mapping.layoutAnchor.type, "Point");
    assert.equal(garden.mapping.layoutAnchor.role, "editable-layout-origin");
    assert.equal(garden.mapping.layoutAnchor.coordinates.length, 2);
    if (!garden.siteReconstructionRevision) assert.equal(pointInGeometry(garden.mapping.layoutAnchor.coordinates, garden.geometry), true, `${garden.id} layout anchor should be inside its mapped parcel`);
    assert.equal(garden.bbox.length, 4);
    assert.ok(garden.sources.length >= 1);
    assert.ok(garden.sources.every((source) => /^https:\/\//.test(source.url)));
  }
  assert.equal(BERKSHIRE_GARDEN_REFERENCES.find((garden) => garden.id === PROPERTY_CONTEXT.id).mapping.layoutStatus, "aerial-interpreted");
  assert.equal(BERKSHIRE_GARDEN_REFERENCES.filter((garden) => garden.mapping.layoutStatus === "aerial-traced-site").length, 3);
});

test("BBG's interpreted beds record the multi-vintage aerial calibration and parcel-wide imagery policy", () => {
  const bbg = BERKSHIRE_GARDEN_REFERENCES.find((garden) => garden.id === PROPERTY_CONTEXT.id);
  assert.equal(bbg.parcelAcreage, 23.86);
  assert.equal(bbg.geometry.type, "MultiPolygon");
  assert.deepEqual(new Set(bbg.mapping.parcelIds), new Set(PROPERTY_PARCELS.map((parcel) => parcel.id)));
  assert.equal(bbg.mapping.layoutCalibration.revision, 3);
  assert.equal(bbg.mapping.layoutCalibration.status, "aerial-calibrated");
  assert.match(bbg.mapping.layoutCalibration.target, /Full 33-landmark campus/i);
  assert.match(bbg.mapping.layoutCalibration.note, /surveyed/i);
  assert.ok(bbg.sources.some((source) => source.id === "source:massgis-aerial-2025"));
  assert.equal(PROPERTY_CONTEXT.imagery.coverage, "parcel-and-viewport");
  assert.equal(PROPERTY_CONTEXT.imagery.tilePadding, 1);
  assert.ok(PROPERTY_CONTEXT.imagery.maxTileCount >= 192);
});

test("reconstructed sites retain historical frames while replacing schematic planting layouts", () => {
  for (const [id, revision] of [["naumkeag-garden-rooms", 6], ["the-mount-kitchen-garden", 3], ["ashintully-terrace-garden", 4]]) {
    const garden = BERKSHIRE_GARDEN_REFERENCES.find(g => g.id === id);
    assert.equal(garden.mapping.layoutCalibration.revision, revision);
    assert.equal(garden.mapping.layoutCalibration.status, "site-reconstructed");
    assert.deepEqual(garden.starterLayout.beds, []);
    assert.ok(garden.starterLayout.viewport.width > 0);
    assert.match(garden.mapping.layoutAnchor.method, /Historical/);
    assert.equal(garden.mapping.layoutCalibration.estimatedHorizontalAccuracyFeet, undefined);
  }
  const ashintully = BERKSHIRE_GARDEN_REFERENCES.find(g => g.id === "ashintully-terrace-garden");
  assert.equal(ashintully.mapping.parcelId, "409_6_0+409_6_1+409_7_0+409_8_0");
  assert.ok(pointInGeometry([-73.1769068, 42.2152668], ashintully.geometry), "publisher entrance lies in corrected campus");
  assert.equal(pointInGeometry(ashintully.mapping.layoutAnchor.coordinates, ashintully.geometry), false, "old coordinate frame is not a garden location");
});
