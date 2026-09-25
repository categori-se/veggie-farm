/**
 * Canonical index for the numbered landmarks on Berkshire Botanical Garden's
 * 2024 self-guided visitor map. The published artwork is a schematic, not a
 * georeferenced survey, so the index preserves its semantics and numbered
 * locators separately from the editable aerial interpretation.
 *
 * Spatial features cite this index through `sourceReferences`. Keeping the
 * numbered inventory in one place makes omissions, duplicate numbers, and
 * mislabeled features testable without treating the artwork as exact geometry.
 */

export const BBG_VISITOR_MAP_SOURCE_ID = "source:bbg-visitor-map";

const LANDMARK_NAMES = [
  "Barbara Euston Visitor Center and Shop",
  "The Tree of Forty Fruit",
  "Carol Tatkon Entry Garden",
  "Ash-on-the-Rock",
  "Children's Discovery Garden",
  "Rain Garden",
  "Fitzpatrick Conservatory",
  "Edible Gardens",
  "Native Border",
  "Education Center",
  "Mother Earth Lodge",
  "Children's Vegetable Garden",
  "Forest Walk",
  "The Williams Family Amphitheater",
  "Lexan Greenhouse",
  "Passive Solar Greenhouse",
  "Center House Entry Garden",
  "Vista Garden",
  "de Gersdorff Perennial Border",
  "Frelinghuysen Shade Border",
  "Daylily Walk",
  "Arboretum/Pinetum",
  "Foster Rock Garden",
  "Woodland Garden",
  "Pond Garden",
  "Lucy's Garden",
  "Rose Garden",
  "New Wave Garden",
  "Herb Garden",
  "The Wildflower Meadow",
  "Herb Production Garden",
  "Procter Mixed Border Garden",
  "Center House"
];

export const BBG_VISITOR_MAP_LANDMARKS = Object.freeze(LANDMARK_NAMES.map((name, index) => Object.freeze({
  number: index + 1,
  name,
  campus: index < 16 ? "south" : "north",
  locator: `numbered landmark ${index + 1}`
})));

export function bbgVisitorMapLandmark(number) {
  return BBG_VISITOR_MAP_LANDMARKS.find((landmark) => landmark.number === Number(number)) || null;
}

/**
 * Attach source semantics to an aerial-interpreted feature. `role` describes
 * what the editable geometry represents; it does not raise the schematic map's
 * positional accuracy. Callers should use low/medium confidence unless a
 * footprint was also checked against an orthophoto.
 */
export function bbgVisitorMapReference(number, role, confidence = "medium") {
  const landmark = bbgVisitorMapLandmark(number);
  if (!landmark) throw new RangeError(`Unknown BBG visitor-map landmark ${number}`);
  return {
    sourceId: BBG_VISITOR_MAP_SOURCE_ID,
    locator: landmark.locator,
    mapNumber: landmark.number,
    label: landmark.name,
    role,
    confidence
  };
}
