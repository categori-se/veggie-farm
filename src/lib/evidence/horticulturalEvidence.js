// Builder walkthrough: docs/building/README.md. Readers group and format
// attributed assertions; they do not resolve conflicting sources or approve them.
function asRecords(dataset) {
  if (Array.isArray(dataset)) return dataset;
  return Array.isArray(dataset?.evidence) ? dataset.evidence : [];
}

export function evidenceByCrop(dataset) {
  const index = new Map();
  for (const record of asRecords(dataset)) {
    const rows = index.get(record.cropSlug) ?? [];
    rows.push(record);
    index.set(record.cropSlug, rows);
  }
  return index;
}

export function getCropEvidence(dataset, cropSlug) {
  return asRecords(dataset).filter((record) => record.cropSlug === cropSlug);
}

function choose(records, trait) {
  return records.filter((record) => record.trait === trait);
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value).replace(/^0\./, ".");
}

export function formatEvidenceRange(record) {
  if (!record?.value) return null;
  if (record.unit === "source_text") return record.value.text ?? null;
  const {min, max} = record.value;
  if (min == null && max == null) return record.value.text ?? null;
  const range = min === max || max == null ? formatNumber(min) : `${formatNumber(min)}–${formatNumber(max)}`;
  if (record.unit === "inch") return `${range} in`;
  if (record.unit === "week") return `${range} weeks`;
  return range;
}

export function summarizeCropEvidence(records) {
  const plantingWindows = choose(records, "planting_window").map((record) => ({
    id: record.id,
    method: record.method,
    startMonthDay: record.value.startMonthDay,
    endMonthDay: record.value.endMonthDay,
    scope: record.geographicScope?.referenceLocation ?? null
  }));
  const forms = [...new Set(records.map((record) => record.form).filter(Boolean))];
  const first = (trait) => choose(records, trait)[0] ?? null;
  const plantSpacing = first("plant_spacing");
  const plantingDepth = first("planting_depth");
  const indoorLead = first("sow_indoors_lead");
  const recordsByForm = new Map();
  for (const record of records) {
    if (["sow_indoors_lead", "germination_duration", "transplant_window"].includes(record.trait)) continue;
    const key = record.form ?? "general";
    const group = recordsByForm.get(key) ?? [];
    group.push(record);
    recordsByForm.set(key, group);
  }
  const formDetails = [...recordsByForm].map(([form, group]) => {
    const formFirst = (trait) => group.find((record) => record.trait === trait) ?? null;
    const spacing = formFirst("plant_spacing");
    const depth = formFirst("planting_depth");
    return {
      form,
      plantSpacing: spacing ? formatEvidenceRange(spacing) : null,
      plantSpacingNote: spacing?.value?.note ?? null,
      rowSpacing: formFirst("row_spacing") ? formatEvidenceRange(formFirst("row_spacing")) : null,
      plantingDepth: depth ? formatEvidenceRange(depth) : null,
      averageYield: formFirst("average_yield")?.value?.text ?? null
    };
  });
  return {
    sourceIds: [...new Set(records.map((record) => record.sourceId))],
    evidenceIds: records.map((record) => record.id),
    scope: records[0]?.geographicScope?.referenceLocation ?? null,
    forms,
    formDetails,
    plantingWindows,
    plantSpacing: plantSpacing ? formatEvidenceRange(plantSpacing) : null,
    plantSpacingNote: plantSpacing?.value?.note ?? null,
    rowSpacing: first("row_spacing") ? formatEvidenceRange(first("row_spacing")) : null,
    plantingDepth: plantingDepth ? formatEvidenceRange(plantingDepth) : null,
    averageYield: first("average_yield")?.value?.text ?? null,
    indoorStartLead: indoorLead ? formatEvidenceRange(indoorLead) : null,
    transplantWindow: first("transplant_window")?.value?.text ?? null
  };
}
