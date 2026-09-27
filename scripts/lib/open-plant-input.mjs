import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openPlantRecord} from '../../src/lib/plants/openPlantData.js';
export async function readOpenPlants() {
  const manifest=JSON.parse(await fs.readFile('data/reference/openfarm/manifest.json','utf8'));
  // Paths are fixed by code, not supplied by an input document.
  const raw=await fs.readFile('data/reference/openfarm/crops.json');
  const license=await fs.readFile('docs/licenses/data/OpenFarm-CC0.txt');
  const hash=body=>createHash('sha256').update(body).digest('hex');
  if(hash(raw)!==manifest.sha256||hash(license)!==manifest.licenseSha256)throw Error('Open plant snapshot or license evidence changed; review the manifest');
  const rows=JSON.parse(raw);
  if(rows.length!==manifest.records)throw Error('Open plant snapshot count changed');
  const plants=rows.map(row=>openPlantRecord(row,manifest));
  if(new Set(plants.map(p=>p.id)).size!==plants.length)throw Error('Duplicate open plant identity');
  return {plants,manifest};
}
