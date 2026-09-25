import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {kmlTextFromKmz, kmlToFeatureCollection, parseXmlLite, readKmzEntries} from "../src/lib/spatial/kmlToGeoJson.js";

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>Import fixture</name>
    <Style id="normal"><IconStyle><color>ff00aa00</color><scale>0.7</scale><Icon><href>circle.png</href></Icon></IconStyle></Style>
    <StyleMap id="mapped"><Pair><key>normal</key><styleUrl>#normal</styleUrl></Pair></StyleMap>
    <Folder><name>Evidence</name>
      <Placemark><name>Bed </name><visibility>0</visibility><styleUrl>#mapped</styleUrl>
        <Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>
          -73.1,42.1,0 -73.0,42.1,0 -73.0,42.2,0 -73.1,42.1,0
        </coordinates></LinearRing></outerBoundaryIs></Polygon>
      </Placemark>
      <Placemark><name>plant</name><LookAt><gx:TimeSpan><begin>2008-06-19T02:58:55Z</begin><end>2008-10-13T12:00:56Z</end></gx:TimeSpan><longitude>-73.05</longitude><latitude>42.15</latitude></LookAt><Point><gx:drawOrder>1</gx:drawOrder><coordinates>-73.05,42.15,0</coordinates></Point></Placemark>
      <Placemark><name>Mixed</name><MultiGeometry><Point><coordinates>-73.04,42.14</coordinates></Point><LineString><coordinates>-73.04,42.14 -73.03,42.15</coordinates></LineString></MultiGeometry></Placemark>
      <GroundOverlay><name>Map reference</name><Icon><href>files/map.png</href><viewBoundScale>0.75</viewBoundScale></Icon><LatLonBox><north>42.16</north><south>42.14</south><east>-73.04</east><west>-73.06</west><rotation>-30</rotation></LatLonBox></GroundOverlay>
    </Folder>
  </Document>
</kml>`;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function storedZip(name, content) {
  const nameBytes = Buffer.from(name);
  const data = Buffer.from(content);
  const crc = crc32(data);
  const local = Buffer.alloc(30 + nameBytes.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  nameBytes.copy(local, 30);
  const central = Buffer.alloc(46 + nameBytes.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  nameBytes.copy(central, 46);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length + data.length, 16);
  return Buffer.concat([local, data, central, eocd]);
}

test("KML import preserves source values, styles, view time, and CRS84 geometry", () => {
  const collection = kmlToFeatureCollection(SAMPLE_KML, {id: "fixture", fileName: "fixture.kml", assets: [{entryName: "files/map.png", sha256: "fixture-hash"}]});
  assert.equal(collection.type, "FeatureCollection");
  assert.equal(collection.properties.spatialReference.id, "urn:ogc:def:crs:OGC::CRS84");
  assert.deepEqual(collection.bbox, [-73.1, 42.1, -73, 42.2]);
  assert.equal(collection.features.length, 4);

  const bed = collection.features[0];
  assert.equal(bed.id, "fixture:bed:001");
  assert.equal(bed.properties.name, "Bed");
  assert.equal(bed.properties.source.nameRaw, "Bed ");
  assert.equal(bed.properties.source.visibility, false);
  assert.equal(bed.properties.source.folderPath[0], "Evidence");
  assert.equal(bed.properties.source.resolvedStyle.styleId, "normal");
  assert.equal(bed.properties.source.resolvedStyle.style.icon.color.hex, "#00aa00");
  assert.equal(bed.properties.source.geometryOptions.tessellate, true);

  const plant = collection.features[1];
  assert.deepEqual(plant.geometry.coordinates, [-73.05, 42.15, 0]);
  assert.equal(plant.properties.source.geometryOptions.drawOrder, 1);
  assert.deepEqual(plant.properties.source.lookAt.time, {
    type: "TimeSpan",
    begin: "2008-06-19T02:58:55Z",
    end: "2008-10-13T12:00:56Z"
  });
  assert.equal(plant.properties.source.lookAt.heading, undefined);
  assert.equal(collection.features[2].geometry.type, "GeometryCollection");
  const overlay = collection.features[3];
  assert.equal(overlay.id, "fixture:map-reference:004");
  assert.equal(overlay.properties.objectType, "raster-overlay");
  assert.equal(overlay.properties.source.latLonBox.rotation, -30);
  assert.equal(overlay.properties.source.geometryMethod, "kml-latlonbox-local-tangent-rotation");
  assert.equal(overlay.properties.source.asset.sha256, "fixture-hash");
  assert.notDeepEqual(overlay.geometry.coordinates[0][0], [-73.06, 42.14]);
});

test("minimal XML reader ignores declarations and external entities", () => {
  const tree = parseXmlLite(`<?xml version="1.0"?><!DOCTYPE kml [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><kml><name>&xxe;</name></kml>`);
  assert.equal(tree.children[0].localName, "kml");
  assert.equal(tree.children[0].children[0].text, "&xxe;");
});

test("dependency-free KMZ reader verifies and extracts a stored doc.kml", () => {
  const archive = storedZip("doc.kml", SAMPLE_KML);
  const entries = readKmzEntries(archive);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].metadata.compressionMethod, "stored");
  assert.equal(entries[0].metadata.modified.valid, false);
  const extracted = kmlTextFromKmz(archive);
  assert.equal(extracted.xml, SAMPLE_KML);
  assert.equal(kmlToFeatureCollection(extracted.xml, {id: "from-kmz"}).features.length, 4);
});

