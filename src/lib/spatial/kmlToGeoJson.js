const KML_CRS = "urn:ogc:def:crs:OGC::CRS84";
const XML_ENTITIES = Object.freeze({amp: "&", apos: "'", gt: ">", lt: "<", quot: '"'});

function decodeXml(value = "") {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const radix = entity[1]?.toLowerCase() === "x" ? 16 : 10;
      const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
      const point = Number.parseInt(digits, radix);
      return Number.isFinite(point) ? String.fromCodePoint(point) : match;
    }
    return XML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function parseAttributes(source = "") {
  const attributes = {};
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = pattern.exec(source))) attributes[match[1]] = decodeXml(match[2] ?? match[3] ?? "");
  return attributes;
}

/**
 * Deliberately small, non-validating XML reader for KML import. It never resolves
 * DTDs or external entities, which keeps a user-supplied KMZ from becoming an
 * XML external-entity request surface. KML elements not understood by the
 * geometry adapter remain harmless nodes and are ignored.
 */
export function parseXmlLite(xml) {
  const root = {name: "#document", localName: "#document", attributes: {}, children: [], text: ""};
  const stack = [root];
  const tokenPattern = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<[^>]+>|[^<]+/gi;
  for (const token of String(xml).replace(/^\uFEFF/, "").match(tokenPattern) ?? []) {
    if (token.startsWith("<!--") || token.startsWith("<?") || /^<!DOCTYPE/i.test(token)) continue;
    if (token.startsWith("<![CDATA[")) {
      stack.at(-1).text += token.slice(9, -3);
      continue;
    }
    if (token.startsWith("</")) {
      const closingName = token.slice(2, -1).trim();
      if (stack.length === 1 || stack.at(-1).name !== closingName) {
        throw new Error(`Malformed XML: unexpected closing tag </${closingName}>`);
      }
      stack.pop();
      continue;
    }
    if (token.startsWith("<")) {
      const selfClosing = /\/\s*>$/.test(token);
      const body = token.slice(1, selfClosing ? token.lastIndexOf("/") : -1).trim();
      const nameMatch = body.match(/^([^\s/>]+)/);
      if (!nameMatch) continue;
      const name = nameMatch[1];
      const node = {
        name,
        localName: name.includes(":") ? name.slice(name.indexOf(":") + 1) : name,
        attributes: parseAttributes(body.slice(name.length)),
        children: [],
        text: ""
      };
      stack.at(-1).children.push(node);
      if (!selfClosing) stack.push(node);
      continue;
    }
    stack.at(-1).text += decodeXml(token);
  }
  if (stack.length !== 1) throw new Error(`Malformed XML: unclosed <${stack.at(-1).name}> element`);
  return root;
}

function child(node, localName) {
  return node?.children?.find((candidate) => candidate.localName === localName) ?? null;
}

function children(node, localName) {
  return (node?.children ?? []).filter((candidate) => candidate.localName === localName);
}

function descendants(node, localName, result = []) {
  for (const candidate of node?.children ?? []) {
    if (candidate.localName === localName) result.push(candidate);
    descendants(candidate, localName, result);
  }
  return result;
}

function text(node, {trim = true} = {}) {
  if (!node) return null;
  const value = node.text ?? "";
  return trim ? value.trim() : value;
}

function numberValue(node) {
  const raw = text(node);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function booleanValue(node, fallback = null) {
  if (!node) return fallback;
  const value = text(node)?.toLowerCase();
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

function compactObject(value) {
  if (Array.isArray(value)) return value.map(compactObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      // GeoJSON explicitly permits Feature.geometry = null. Other null source
      // metadata is omitted to keep the evidence bundle compact.
      .filter(([key, item]) => (key === "geometry" || item !== null) && item !== undefined && item !== "")
      .map(([key, item]) => [key, compactObject(item)])
  );
}

function coordinateTuple(value, delimiter = ",") {
  const parts = value.trim().split(delimiter).map(Number);
  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`Invalid KML coordinate tuple: ${value}`);
  }
  return parts.length >= 3 ? parts.slice(0, 3) : parts.slice(0, 2);
}

function coordinates(node) {
  const value = text(child(node, "coordinates"));
  if (!value) return [];
  return value.split(/\s+/).filter(Boolean).map((tuple) => coordinateTuple(tuple));
}

function geometryOptions(node) {
  return compactObject({
    altitudeMode: text(child(node, "altitudeMode")),
    extrude: booleanValue(child(node, "extrude")),
    tessellate: booleanValue(child(node, "tessellate")),
    drawOrder: numberValue(child(node, "drawOrder"))
  });
}

function rotatedLatLonBox(node) {
  const north = numberValue(child(node, "north"));
  const south = numberValue(child(node, "south"));
  const east = numberValue(child(node, "east"));
  const west = numberValue(child(node, "west"));
  const rotation = numberValue(child(node, "rotation")) ?? 0;
  if (![north, south, east, west].every(Number.isFinite)) return null;
  const center = [(east + west) / 2, (north + south) / 2];
  // KML rotates a LatLonBox about its center. Do the small-area rotation in a
  // local tangent plane so longitude degrees are not treated as equal to
  // latitude degrees at Massachusetts' latitude. The untouched source box is
  // retained beside the derived footprint for audit/reprojection.
  const longitudeScale = Math.cos(center[1] * Math.PI / 180);
  const angle = rotation * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const corners = [[west, south], [east, south], [east, north], [west, north]];
  const ring = corners.map(([longitude, latitude]) => {
    const x = (longitude - center[0]) * longitudeScale;
    const y = latitude - center[1];
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    return [center[0] + rotatedX / longitudeScale, center[1] + rotatedY];
  });
  ring.push([...ring[0]]);
  return {
    geometry: {type: "Polygon", coordinates: [ring]},
    box: {north, south, east, west, rotation},
    geometryMethod: rotation === 0 ? "kml-latlonbox" : "kml-latlonbox-local-tangent-rotation"
  };
}

function groundOverlayGeometry(node) {
  const quad = child(node, "LatLonQuad");
  if (quad) {
    const ring = coordinates(quad).map(([longitude, latitude]) => [longitude, latitude]);
    if (ring.length >= 4) {
      ring.push([...ring[0]]);
      return {geometry: {type: "Polygon", coordinates: [ring]}, quad: ring.slice(0, -1), geometryMethod: "gx-latlonquad"};
    }
  }
  return rotatedLatLonBox(child(node, "LatLonBox"));
}

function parseGeometry(node) {
  if (node.localName === "Point") {
    const point = coordinates(node)[0];
    return {geometry: point ? {type: "Point", coordinates: point} : null, options: compactObject({...geometryOptions(node), declaredGeometryType: "Point", empty: !point})};
  }
  if (node.localName === "LineString" || node.localName === "LinearRing") {
    const line = coordinates(node);
    return {geometry: line.length ? {type: "LineString", coordinates: line} : null, options: compactObject({...geometryOptions(node), declaredGeometryType: node.localName, empty: !line.length})};
  }
  if (node.localName === "Polygon") {
    const rings = [];
    const outer = child(child(node, "outerBoundaryIs"), "LinearRing");
    if (outer) rings.push(coordinates(outer));
    for (const boundary of children(node, "innerBoundaryIs")) {
      const ring = child(boundary, "LinearRing");
      if (ring) rings.push(coordinates(ring));
    }
    const empty = !rings[0]?.length;
    return {geometry: empty ? null : {type: "Polygon", coordinates: rings}, options: compactObject({...geometryOptions(node), declaredGeometryType: "Polygon", empty})};
  }
  if (node.localName === "Track") {
    const trackCoordinates = children(node, "coord").map((item) => coordinateTuple(text(item), " "));
    return {
      geometry: trackCoordinates.length ? {type: "LineString", coordinates: trackCoordinates} : null,
      options: compactObject({...geometryOptions(node), declaredGeometryType: "gx:Track", empty: !trackCoordinates.length, when: children(node, "when").map((item) => text(item))})
    };
  }
  if (node.localName === "MultiGeometry") {
    const parts = node.children.filter((candidate) => GEOMETRY_NAMES.has(candidate.localName)).map(parseGeometry);
    const validParts = parts.filter((part) => part.geometry);
    const types = new Set(validParts.map((part) => part.geometry.type));
    const partOptions = parts.map((part) => part.options);
    if (!validParts.length) return {geometry: null, options: {declaredGeometryType: "MultiGeometry", empty: true, parts: partOptions}};
    if (types.size === 1 && validParts.length === parts.length) {
      const type = validParts[0].geometry.type;
      const multiType = {Point: "MultiPoint", LineString: "MultiLineString", Polygon: "MultiPolygon"}[type];
      if (multiType) return {geometry: {type: multiType, coordinates: validParts.map((part) => part.geometry.coordinates)}, options: {declaredGeometryType: "MultiGeometry", parts: partOptions}};
    }
    return {geometry: {type: "GeometryCollection", geometries: validParts.map((part) => part.geometry)}, options: {declaredGeometryType: "MultiGeometry", emptyParts: parts.length - validParts.length, parts: partOptions}};
  }
  throw new Error(`Unsupported KML geometry <${node.name}>`);
}

const GEOMETRY_NAMES = new Set(["Point", "LineString", "Polygon", "MultiGeometry", "Track"]);

function parseHotSpot(node) {
  if (!node) return null;
  const {x, y, xunits, yunits} = node.attributes;
  return compactObject({x: Number.isFinite(Number(x)) ? Number(x) : x, y: Number.isFinite(Number(y)) ? Number(y) : y, xunits, yunits});
}

function kmlColor(value) {
  if (!value || !/^[\da-f]{8}$/i.test(value)) return value ? {raw: value} : null;
  const alpha = Number.parseInt(value.slice(0, 2), 16);
  const blue = Number.parseInt(value.slice(2, 4), 16);
  const green = Number.parseInt(value.slice(4, 6), 16);
  const red = Number.parseInt(value.slice(6, 8), 16);
  return {raw: value, rgba: `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`, hex: `#${value.slice(6, 8)}${value.slice(4, 6)}${value.slice(2, 4)}`.toLowerCase(), alpha};
}

function parseColorStyle(node) {
  if (!node) return null;
  return compactObject({color: kmlColor(text(child(node, "color"))), colorMode: text(child(node, "colorMode"))});
}

function parseStyle(node) {
  if (!node) return null;
  const iconStyle = child(node, "IconStyle");
  const labelStyle = child(node, "LabelStyle");
  const lineStyle = child(node, "LineStyle");
  const polyStyle = child(node, "PolyStyle");
  const balloonStyle = child(node, "BalloonStyle");
  const listStyle = child(node, "ListStyle");
  return compactObject({
    id: node.attributes.id,
    icon: iconStyle && {
      ...parseColorStyle(iconStyle),
      scale: numberValue(child(iconStyle, "scale")),
      heading: numberValue(child(iconStyle, "heading")),
      href: text(child(child(iconStyle, "Icon"), "href")),
      hotSpot: parseHotSpot(child(iconStyle, "hotSpot"))
    },
    label: labelStyle && {...parseColorStyle(labelStyle), scale: numberValue(child(labelStyle, "scale"))},
    line: lineStyle && {...parseColorStyle(lineStyle), width: numberValue(child(lineStyle, "width"))},
    polygon: polyStyle && {...parseColorStyle(polyStyle), fill: booleanValue(child(polyStyle, "fill")), outline: booleanValue(child(polyStyle, "outline"))},
    balloon: balloonStyle && {backgroundColor: kmlColor(text(child(balloonStyle, "bgColor"))), textColor: kmlColor(text(child(balloonStyle, "textColor"))), text: text(child(balloonStyle, "text"), {trim: false}), displayMode: text(child(balloonStyle, "displayMode"))},
    list: listStyle && {listItemType: text(child(listStyle, "listItemType")), backgroundColor: kmlColor(text(child(listStyle, "bgColor")))}
  });
}

function parseStyleMap(node) {
  return compactObject({
    id: node.attributes.id,
    pairs: Object.fromEntries(children(node, "Pair").map((pair) => [text(child(pair, "key")), text(child(pair, "styleUrl"))]))
  });
}

function resolveStyle(styleUrl, styles, styleMaps) {
  if (!styleUrl?.startsWith("#")) return null;
  const id = styleUrl.slice(1);
  if (styles[id]) return {styleId: id, style: styles[id]};
  const map = styleMaps[id];
  const normal = map?.pairs?.normal;
  const resolvedId = normal?.startsWith("#") ? normal.slice(1) : null;
  return compactObject({styleMapId: id, styleMap: map, styleId: resolvedId, style: resolvedId ? styles[resolvedId] : null});
}

function parseTimePrimitive(node) {
  const stamp = child(node, "TimeStamp");
  if (stamp) return {type: "TimeStamp", when: text(child(stamp, "when"))};
  const span = child(node, "TimeSpan");
  if (span) return compactObject({type: "TimeSpan", begin: text(child(span, "begin")), end: text(child(span, "end"))});
  return null;
}

function parseLookAt(node) {
  const lookAt = child(node, "LookAt");
  if (!lookAt) return null;
  return compactObject({
    longitude: numberValue(child(lookAt, "longitude")), latitude: numberValue(child(lookAt, "latitude")),
    altitude: numberValue(child(lookAt, "altitude")), heading: numberValue(child(lookAt, "heading")),
    tilt: numberValue(child(lookAt, "tilt")), range: numberValue(child(lookAt, "range")),
    altitudeMode: text(child(lookAt, "altitudeMode")), time: parseTimePrimitive(lookAt)
  });
}

function parseExtendedData(node) {
  const extended = child(node, "ExtendedData");
  if (!extended) return null;
  const values = {};
  for (const data of children(extended, "Data")) {
    values[data.attributes.name] = compactObject({value: text(child(data, "value"), {trim: false}), displayName: text(child(data, "displayName"), {trim: false})});
  }
  for (const schemaData of children(extended, "SchemaData")) {
    for (const item of children(schemaData, "SimpleData")) values[item.attributes.name] = {value: text(item, {trim: false}), schemaUrl: schemaData.attributes.schemaUrl};
  }
  return values;
}

function inferObjectType(name, geometryType) {
  const normalized = name.trim().toLowerCase();
  if (/^bed(?:\s+\d+)?$/.test(normalized)) return "bed";
  if (normalized === "plant") return "plant";
  if (normalized === "tree") return "tree";
  if (normalized === "greenhouse") return "greenhouse";
  if (normalized === "house") return "building";
  if (normalized === "parking lot") return "parking";
  if (normalized === "driveway") return "driveway";
  if (/^garden(?:\s+\d+)?$/.test(normalized)) return "garden-area";
  return geometryType === "Point" ? "unclassified-point" : geometryType === "LineString" ? "unclassified-line" : "unclassified-area";
}

function slug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unnamed";
}

function allCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === "GeometryCollection") return geometry.geometries.flatMap(allCoordinates);
  const flattened = [];
  const visit = (value) => {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") flattened.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
  };
  visit(geometry.coordinates);
  return flattened;
}

function collectionBbox(features) {
  const tuples = features.flatMap((feature) => allCoordinates(feature.geometry));
  if (!tuples.length) return null;
  const longitudes = tuples.map((tuple) => tuple[0]);
  const latitudes = tuples.map((tuple) => tuple[1]);
  return [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)];
}

function documentLinks(node) {
  return descendants(node, "link").map((link) => compactObject(link.attributes));
}

function makePlacemarkFeature(placemark, context) {
  const geometryNode = placemark.children.find((candidate) => GEOMETRY_NAMES.has(candidate.localName));
  if (!geometryNode) return null;
  const parsed = parseGeometry(geometryNode);
  const rawName = text(child(placemark, "name"), {trim: false}) ?? "";
  const name = rawName.trim();
  const descriptionRaw = text(child(placemark, "description"), {trim: false});
  const styleUrl = text(child(placemark, "styleUrl"));
  const inlineStyle = parseStyle(child(placemark, "Style"));
  const inferredObjectType = inferObjectType(name, parsed.geometry?.type ?? parsed.options?.declaredGeometryType);
  const placemarkIndex = context.index + 1;
  return {
    type: "Feature",
    id: placemark.attributes.id || `${context.sourceId}:${slug(name || parsed.geometry.type)}:${String(placemarkIndex).padStart(3, "0")}`,
    geometry: parsed.geometry,
    properties: compactObject({
      name,
      objectType: inferredObjectType,
      classification: {method: "source-name-pattern-v1", confidence: "tentative", sourceName: rawName},
      source: {
        sourceId: context.sourceId,
        placemarkIndex,
        placemarkId: placemark.attributes.id,
        folderPath: context.folderPath,
        nameRaw: rawName !== name ? rawName : null,
        descriptionRaw,
        styleUrl,
        resolvedStyle: inlineStyle ? {inline: inlineStyle} : resolveStyle(styleUrl, context.styles, context.styleMaps),
        visibility: booleanValue(child(placemark, "visibility"), true),
        open: booleanValue(child(placemark, "open"), false),
        time: parseTimePrimitive(placemark),
        lookAt: parseLookAt(placemark),
        extendedData: parseExtendedData(placemark),
        geometryOptions: parsed.options
      }
    })
  };
}

function makeGroundOverlayFeature(overlay, context) {
  const parsed = groundOverlayGeometry(overlay);
  if (!parsed?.geometry) return null;
  const rawName = text(child(overlay, "name"), {trim: false}) ?? "";
  const name = rawName.trim();
  const icon = child(overlay, "Icon");
  const href = text(child(icon, "href"));
  const asset = context.assets.find((candidate) => candidate.entryName === href) ?? null;
  const overlayIndex = context.index + 1;
  return {
    type: "Feature",
    id: overlay.attributes.id || `${context.sourceId}:${slug(name || "ground-overlay")}:${String(overlayIndex).padStart(3, "0")}`,
    geometry: parsed.geometry,
    properties: compactObject({
      name,
      objectType: "raster-overlay",
      classification: {method: "kml-element-name", confidence: "source-explicit", sourceElement: "GroundOverlay"},
      source: {
        sourceId: context.sourceId,
        overlayIndex,
        overlayId: overlay.attributes.id,
        folderPath: context.folderPath,
        nameRaw: rawName !== name ? rawName : null,
        descriptionRaw: text(child(overlay, "description"), {trim: false}),
        visibility: booleanValue(child(overlay, "visibility"), true),
        open: booleanValue(child(overlay, "open"), false),
        time: parseTimePrimitive(overlay),
        color: kmlColor(text(child(overlay, "color"))),
        drawOrder: numberValue(child(overlay, "drawOrder")),
        altitude: numberValue(child(overlay, "altitude")),
        altitudeMode: text(child(overlay, "altitudeMode")),
        geometryMethod: parsed.geometryMethod,
        latLonBox: parsed.box,
        latLonQuad: parsed.quad,
        icon: {
          href,
          viewBoundScale: numberValue(child(icon, "viewBoundScale")),
          refreshMode: text(child(icon, "refreshMode")),
          refreshInterval: numberValue(child(icon, "refreshInterval")),
          viewRefreshMode: text(child(icon, "viewRefreshMode")),
          viewRefreshTime: numberValue(child(icon, "viewRefreshTime"))
        },
        asset
      }
    })
  };
}

function walkContainer(node, context, features) {
  const rawContainerName = text(child(node, "name"), {trim: false});
  const folderPath = node.localName === "Folder" && rawContainerName != null
    ? [...context.folderPath, rawContainerName.trim()]
    : context.folderPath;
  for (const candidate of node.children ?? []) {
    if (candidate.localName === "Placemark") {
      const feature = makePlacemarkFeature(candidate, {...context, folderPath, index: features.length});
      if (feature) features.push(feature);
    } else if (candidate.localName === "GroundOverlay") {
      const feature = makeGroundOverlayFeature(candidate, {...context, folderPath, index: features.length});
      if (feature) features.push(feature);
    } else if (candidate.localName === "Folder" || candidate.localName === "Document") {
      walkContainer(candidate, {...context, folderPath}, features);
    }
  }
}

/** Convert KML 2.2 vector placemarks to an RFC 7946 GeoJSON FeatureCollection. */
export function kmlToFeatureCollection(xml, source = {}) {
  const tree = parseXmlLite(xml);
  const kml = descendants(tree, "kml")[0] ?? tree;
  const document = descendants(kml, "Document")[0] ?? kml;
  const styles = Object.fromEntries(descendants(document, "Style").filter((node) => node.attributes.id).map((node) => [node.attributes.id, parseStyle(node)]));
  const styleMaps = Object.fromEntries(descendants(document, "StyleMap").filter((node) => node.attributes.id).map((node) => [node.attributes.id, parseStyleMap(node)]));
  const sourceId = source.id || "kml-import";
  const features = [];
  walkContainer(document, {sourceId, folderPath: [], styles, styleMaps, assets: source.assets ?? []}, features);
  const documentNameRaw = text(child(document, "name"), {trim: false});
  return compactObject({
    type: "FeatureCollection",
    bbox: collectionBbox(features),
    properties: {
      name: documentNameRaw?.trim() || source.title || source.fileName || sourceId,
      source: {...source, id: sourceId},
      spatialReference: {
        id: KML_CRS,
        coordinates: "longitude, latitude, optional altitude in metres",
        note: "KML 2.2 coordinates are geographic WGS 84; GeoJSON uses longitude-latitude order."
      },
      kml: compactObject({documentNameRaw: documentNameRaw !== documentNameRaw?.trim() ? documentNameRaw : null, styles, styleMaps, atomLinks: documentLinks(document)})
    },
    features
  });
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEndOfCentralDirectory(buffer) {
  const earliest = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= earliest; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error("Invalid KMZ/ZIP: end-of-central-directory record not found");
}

function dosTimestamp(date, time) {
  const day = date & 0x1f;
  const month = (date >> 5) & 0x0f;
  const year = 1980 + ((date >> 9) & 0x7f);
  const second = (time & 0x1f) * 2;
  const minute = (time >> 5) & 0x3f;
  const hour = (time >> 11) & 0x1f;
  const valid = month >= 1 && month <= 12 && day >= 1 && day <= 31 && hour <= 23 && minute <= 59 && second <= 59;
  return {dosDate: date, dosTime: time, valid, iso: valid ? new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString() : null};
}

/** Read KMZ entries in-memory. Supports the standard stored and deflated ZIP methods. */
export function readKmzEntries(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const disk = buffer.readUInt16LE(eocd + 4);
  const directoryDisk = buffer.readUInt16LE(eocd + 6);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  const directoryOffset = buffer.readUInt32LE(eocd + 16);
  if (disk !== 0 || directoryDisk !== 0) throw new Error("Multi-disk KMZ/ZIP archives are not supported");
  const entries = [];
  let offset = directoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error(`Invalid KMZ/ZIP central-directory entry ${index + 1}`);
    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const modifiedTime = buffer.readUInt16LE(offset + 12);
    const modifiedDate = buffer.readUInt16LE(offset + 14);
    const expectedCrc32 = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) throw new Error("ZIP64 KMZ archives are not supported");
    if (flags & 0x0001) throw new Error("Encrypted KMZ/ZIP entries are not supported");
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error(`Invalid local header for KMZ entry ${name}`);
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    // Keep the KML/XML parser browser-importable. Node exposes built-ins lazily
    // for the command-line KMZ importer; browser callers can stage plain KML
    // without bundling `node:zlib` (or any third-party package).
    const inflateRawSync = globalThis.process?.getBuiltinModule?.("node:zlib")?.inflateRawSync;
    const data = compressionMethod === 0
      ? Buffer.from(compressed)
      : compressionMethod === 8 && inflateRawSync
      ? inflateRawSync(compressed)
      : null;
    if (compressionMethod === 8 && !inflateRawSync) {
      throw new Error(`Deflated KMZ entry ${name} requires a Node.js zlib runtime; extract doc.kml before browser staging`);
    }
    if (!data) throw new Error(`Unsupported KMZ compression method ${compressionMethod} for ${name}`);
    if (data.length !== uncompressedSize) throw new Error(`Uncompressed-size mismatch for KMZ entry ${name}`);
    const actualCrc32 = crc32(data);
    if (actualCrc32 !== expectedCrc32) throw new Error(`CRC-32 mismatch for KMZ entry ${name}`);
    entries.push({
      name,
      data,
      metadata: {
        name,
        compressionMethod: compressionMethod === 0 ? "stored" : "deflate",
        compressedSize,
        uncompressedSize,
        crc32: expectedCrc32.toString(16).padStart(8, "0"),
        modified: dosTimestamp(modifiedDate, modifiedTime)
      }
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

export function kmlTextFromKmz(buffer) {
  const entries = readKmzEntries(buffer);
  const entry = entries.find((candidate) => candidate.name.toLowerCase() === "doc.kml")
    ?? entries.find((candidate) => candidate.name.toLowerCase().endsWith(".kml"));
  if (!entry) throw new Error("KMZ archive contains no KML document");
  return {xml: entry.data.toString("utf8"), entry: entry.metadata, entries: entries.map((candidate) => candidate.metadata), files: entries};
}
