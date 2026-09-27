// A read-only tour of real application modules. See docs/building/README.md.
// Run with Node; no credentials, network, media downloads or generated files.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {getCropEvidence, formatEvidenceRange} from '../../src/lib/evidence/horticulturalEvidence.js';
import {plantVisualSpec} from '../../src/lib/plants/plantVisualSpec.js';
import {plantVisualGeometry} from '../../src/lib/plants/plantVisualGeometry.js';
import {parsePlannerBackup} from '../../src/lib/garden/plannerBackup.js';

export function explainGarden(evidence, backupText) {
  const garden = parsePlannerBackup(backupText);
  // Keep source assertions separate from synthetic geometry. This is not a join
  // that turns a crop-level spacing fact into a cultivar's height or crown size.
  const facts = getCropEvidence(evidence, 'tomatoes').map(record => ({
    id: record.id, trait: record.trait, value: formatEvidenceRange(record),
    unit: record.unit, method: record.method, sourceId: record.sourceId,
    sourceUrl: record.sourceUrl, retrievedAt: record.retrievedAt,
    geographicScope: record.geographicScope, reviewStatus: record.reviewStatus
  }));
  const plant = garden.plants.find(record => record.id === 'demo-tomato');
  if (!plant) throw Error('This tutorial needs the synthetic demo-tomato record.');
  // An explicit visual choice, not species recognition or a new measured fact.
  const spec = plantVisualSpec({...plant,
    visual: {archetype: 'upright-fruiting'},
    dimensionBasis: 'Synthetic tutorial dimensions; not Extension measurements'
  });
  if (!spec) throw Error('The synthetic plant needs valid visual dimensions.');
  const parts = plantVisualGeometry(spec, 'tutorial-tomato');
  const restored = parsePlannerBackup(JSON.stringify(garden));
  return {
    evidence: facts,
    illustration: {
      basis: spec.dimensionBasis, widthIn: spec.widthIn, heightIn: spec.heightIn,
      spacingIn: spec.spacingIn, archetype: spec.id,
      organCount: parts.length,
      consumers: ['src/lib/plants/plantVisual2d.js', 'src/lib/plants/plantVisual3d.js'],
      note: 'Both renderers use these organ descriptors; no renderer runs in this CLI.'
    },
    backup: {gardenId: restored.activeParcelId, beds: restored.beds.length,
      placements: restored.placements.length,
      note: 'In-memory serialization/validation only; browser persistence is a separate check.'}
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = JSON.parse(await fs.readFile(new URL('../../src/data/horticultural-evidence.json', import.meta.url), 'utf8'));
  const backup = await fs.readFile(new URL('../../data/demo/community-garden.json', import.meta.url), 'utf8');
  console.log(JSON.stringify(explainGarden(evidence, backup), null, 2));
}
