import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {trefleAssertions} from '../src/lib/plants/trefleAssertions.js';

// Offline import of an authorized export. No credentials or API response enter src/data.
// A new output directory preserves each import independently; existing archives are not overwritten.
const [speciesFile, factsFile, plantId, retrievedAt, output] = process.argv.slice(2);
if (!output) throw new Error('Usage: node scripts/import-trefle-assertions.mjs species.json facts.json plant-id retrieved-at new-output-directory');
const files = [speciesFile, factsFile].map(file => fs.readFileSync(file));
const parsed = files.map(bytes => JSON.parse(bytes));
const result = trefleAssertions(...parsed, {plantId, retrievedAt});
// Refuse token-bearing exports instead of silently altering the archived evidence.
if (files.some(bytes => /[?&](?:token|api_key|access_token)=|"(?:token|access_token|api_key)"\s*:/i.test(bytes.toString()))) throw new Error('Remove credentials from the export before importing');
const destination = path.resolve(output);
const relative = path.relative(path.resolve('data/raw/trefle'), destination);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output must be a new directory below data/raw/trefle');
fs.mkdirSync(path.dirname(destination), {recursive: true});
fs.mkdirSync(destination);
const manifest = {provider: 'trefle', retrievedAt, importedAt: new Date().toISOString(), plantId, publicUse: 'held_pending_assertion_and_license_review', files: []};
for (const [index, name] of ['species.json', 'facts.json'].entries()) {
  fs.writeFileSync(path.join(destination, name), files[index], {flag: 'wx'});
  manifest.files.push({file: name, sha256: crypto.createHash('sha256').update(files[index]).digest('hex')});
}
const assertionsBytes = JSON.stringify(result, null, 2) + '\n';
fs.writeFileSync(path.join(destination, 'assertions.json'), assertionsBytes, {flag: 'wx'});
manifest.files.push({file: 'assertions.json', sha256: crypto.createHash('sha256').update(assertionsBytes).digest('hex')});
fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {flag: 'wx'});
console.log(`Archived ${result.assertions.length} unreviewed assertions; none published.`);
