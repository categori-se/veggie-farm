import {NOTEBOOK_STORAGE} from '../../data/runtime-capabilities.js';
import {measurementDate} from './soilReading.js';
import {notebookStorage, markNotebookChanged} from "../account/notebookStorage.js";
import {loadRecords} from "./gardenRecords.js";
export const GARDEN_PROFILE_KEY = "veggie.farm:garden-profile:v1";
export const GARDEN_JOURNAL_KEY = "veggie.farm:garden-journal:v1";
export const GARDEN_SCHEMA_VERSION = "1.0.0";

export const OBSERVATION_TYPES = [
  "seeded",
  "germinated",
  "transplanted",
  "flowered",
  "fruit_set",
  "harvested",
  "bolted",
  "frost_damage",
  "heat_damage",
  "pest_seen",
  "disease_seen",
  "watering",
  "rain",
  "soil_test",
  "note"
];

function cleanText(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function numberOrNull(value, min, max) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
}

function monthDay(value, fallback) {
  const match = String(value ?? "").match(/^(?:\d{4}-)?(\d{2})-(\d{2})$/);
  if (!match) return fallback;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(2000, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return fallback;
  return `${match[1]}-${match[2]}`;
}

function storageOrNull(storage) {
  if (storage) return storage;
  try {
    return notebookStorage();
  } catch {
    return null;
  }
}

function read(storage, key, fallback) {
  try {
    const value = storageOrNull(storage)?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage, key, value) {
  const target = storageOrNull(storage);
  if (!target) return false;
  try {
    target.setItem(key, JSON.stringify(value));
    if (!storage) markNotebookChanged();
    globalThis.dispatchEvent?.(new Event("garden-records-changed"));
    return true;
  } catch {
    return false;
  }
}

export function normalizeGardenProfile(input = {}) {
  const texture = cleanText(input.soilTexture ?? input.soil?.userOverride?.texture, 60) || null;
  const drainage = cleanText(input.drainage ?? input.soil?.userOverride?.drainage, 30) || null;
  return {
    schemaVersion: GARDEN_SCHEMA_VERSION,
    gardenName: cleanText(input.gardenName, 80) || "My garden",
    locationLabel: cleanText(input.locationLabel, 100),
    hardinessZone: cleanText(input.hardinessZone, 4),
    climate: {
      lastFrostMonthDay: monthDay(input.lastFrostDate ?? input.climate?.lastFrostMonthDay, "05-10"),
      firstFrostMonthDay: monthDay(input.firstFrostDate ?? input.climate?.firstFrostMonthDay, "10-15"),
      source: "user"
    },
    soil: {
      mapped: null,
      userOverride: {texture, drainage},
      effective: {texture, drainage},
      source: texture || drainage ? "user_override" : "unknown"
    },
    soilTemperatureF: numberOrNull(input.soilTemperatureF, 20, 110),
    soilTemperatureMeasuredOn: numberOrNull(input.soilTemperatureF, 20, 110) === null ? null : measurementDate(input.soilTemperatureMeasuredOn),
    sunHours: numberOrNull(input.sunHours, 0, 14),
    bedCount: numberOrNull(input.bedCount, 0, 200),
    irrigation: cleanText(input.irrigation, 80),
    microclimateNotes: cleanText(input.microclimateNotes, 1000),
    privacy: {
      storage: NOTEBOOK_STORAGE === "local" ? "browser_local" : "private_account",
      browserDraft: true,
      exactLocationStored: false
    },
    updatedAt: cleanText(input.updatedAt, 40) || new Date().toISOString()
  };
}

export function profileDatesForYear(profile, year) {
  const normalized = normalizeGardenProfile(profile);
  const validYear = Number.isInteger(Number(year)) ? Number(year) : new Date().getFullYear();
  return {
    lastFrostDate: `${validYear}-${normalized.climate.lastFrostMonthDay}`,
    firstFrostDate: `${validYear}-${normalized.climate.firstFrostMonthDay}`
  };
}

export function loadGardenProfile(storage) {
  const value = read(storage, GARDEN_PROFILE_KEY, null);
  return value ? normalizeGardenProfile(value) : null;
}

export function saveGardenProfile(profile, storage) {
  const normalized = normalizeGardenProfile({...profile, updatedAt: new Date().toISOString()});
  return {profile: normalized, saved: write(storage, GARDEN_PROFILE_KEY, normalized)};
}

export function normalizeGardenObservation(input = {}, options = {}) {
  const type = cleanText(input.type, 40);
  if (!OBSERVATION_TYPES.includes(type)) throw new TypeError(`Unsupported observation type: ${type}`);
  const date = cleanText(input.date, 10);
  const parsedDate = new Date(`${date}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new TypeError(`Invalid observation date: ${date}`);
  }
  const createdAt = options.createdAt ?? new Date().toISOString();
  const id = options.id ?? globalThis.crypto?.randomUUID?.() ?? `observation:${Date.now()}`;
  return {
    schemaVersion: GARDEN_SCHEMA_VERSION,
    id,
    type,
    date,
    bed: cleanText(input.bed, 80),
    crop: cleanText(input.crop, 100),
    plantingId: cleanText(input.plantingId, 160),
    interpretation: cleanText(input.interpretation, 2000),
    action: cleanText(input.action, 2000),
    variety: cleanText(input.variety, 100),
    notes: cleanText(input.notes, 2000),
    createdAt,
    provenance: {kind: "user_observation"}
  };
}

export function loadGardenJournal(storage) {
  const rows = read(storage, GARDEN_JOURNAL_KEY, []);
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && OBSERVATION_TYPES.includes(row.type))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function addGardenObservation(input, storage, options = {}) {
  const observation = normalizeGardenObservation(input, options);
  const observations = [observation, ...loadGardenJournal(storage)];
  return {observation, observations, saved: write(storage, GARDEN_JOURNAL_KEY, observations)};
}

export function createGardenExport(storage) {
  return {
    schemaVersion: GARDEN_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: loadGardenProfile(storage),
    records: loadRecords(storage),
    observations: loadGardenJournal(storage)
  };
}
