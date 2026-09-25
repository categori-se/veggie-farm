// Offline provenance map, not certification of bundled dependency completeness.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root = new URL('../', import.meta.url);
const args = process.argv.slice(2);
if (args.some(arg => !['--check','--require-complete'].includes(arg)) || (args.includes('--require-complete')&&!args.includes('--check'))) throw Error('Usage: node scripts/build-browser-notice-map.mjs [--check [--require-complete]]');
const sha = body => createHash('sha256').update(body).digest('hex');
const inputs = [];
async function read(relative) {
  const body = await readFile(new URL(relative, root));
  inputs.push({path: relative, sha256: sha(body)});
  return JSON.parse(body);
}
const browser = await read('browser-dependencies.json');
const notices = [];
for (const path of ['docs/licenses/runtime-npm-notices.json', 'docs/licenses/build-tool-npm-notices.json']) {
  const inventory = await read(path);
  for (const record of inventory.packages) notices.push({...record, inventory: path});
}
const supplementalPath = 'docs/licenses/browser-package-notices.json';
const supplemental = await read(supplementalPath);
for (const record of supplemental.packages) {
  const metadataBytes = await readFile(new URL(record.metadataPath, root));
  if (sha(metadataBytes) !== record.metadataSha256) throw Error('Supplemental metadata changed');
  const metadata = JSON.parse(metadataBytes);
  if (metadata.name !== record.name || metadata.version !== record.version || metadata.license !== record.license) throw Error('Supplemental package identity mismatch');
  for (const text of record.texts) {
    if (sha(await readFile(new URL(text.path, root))) !== text.sha256) throw Error('Supplemental notice changed');
  }
  notices.push({...record, inventory: supplementalPath});
}
const bundleEvidence = await read('docs/licenses/browser-bundle-evidence.json');
for (const bundle of bundleEvidence.bundles) {
  for (const source of bundle.sourceModules) {
    if (sha(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Reviewed bundle source changed; re-review composition');
  }
}
const evidenceFor = (name, version) => notices.filter(record => record.name === name && record.version === version && record.texts.length).map(record => ({
  inventory: record.inventory, scope: record.scope, packagePath: record.path,
  sources: record.sources, license: record.license, resolved: record.resolved, integrity: record.integrity, texts: record.texts
}));
const files = browser.files.map(file => {
  // Scoped names have one extra path component; @version ends the package name.
  const match = /^_npm\/((?:@[^/]+\/)?[^/@]+)@([^/]+)\//.exec(file.path);
  if (!match) {
    const bundle = bundleEvidence.bundles.find(record => record.path === file.path && record.sha256 === file.sha256);
    if (bundle && bundle.packages.every(pkg => evidenceFor(pkg.name, pkg.version).length)) return {...file,
      status: 'exact-byte-bundle-text-found', compositionEvidence: 'docs/licenses/browser-bundle-evidence.json',
      evidence: bundle.packages.flatMap(pkg => evidenceFor(pkg.name, pkg.version))};
    return {...file, status: 'unresolved-generated-bundle', reason: 'Framework bundle composition and embedded third-party notices require separate review'};
  }
  const [, name, version] = match;
  const evidence = evidenceFor(name, version);
  return {...file, name, version, status: evidence.length ? 'exact-version-package-text-found' : 'unresolved-package-text', evidence,
    ...(!evidence.length ? {installedVersions: [...new Set(notices.filter(record => record.name === name).map(record => record.version))]} : {})};
});
const report = {version: 1, scope: 'Map shipped browser file hashes to exact-name/version npm notice records. A match does not prove transformed code identity, absence of bundled third parties, or redistribution clearance.',
  inputs, files, summary: {files: files.length, matched: files.filter(file => ['exact-version-package-text-found','exact-byte-bundle-text-found'].includes(file.status)).length,
    unresolved: files.filter(file => !['exact-version-package-text-found','exact-byte-bundle-text-found'].includes(file.status)).length}};
const rows = files.map(file => `| \`${file.path}\` | ${file.status} | ${file.evidence?.map(item => item.inventory.split('/').at(-1)).join(', ') || 'Review required'} |`).join('\n');
const markdown = `# Browser module notice evidence\n\nGenerated offline by \`node scripts/build-browser-notice-map.mjs\`.\n\n${report.scope}\n\n${report.summary.matched} of ${report.summary.files} file records have package text evidence (including exact-byte reviewed bundles); ${report.summary.unresolved} remain unresolved.\nThe JSON map pins the source inventories and links package archive integrity and\nverbatim text digests. Read those texts in the runtime/build-tool notice documents.\nFiles under \`_observablehq/\` are bundles; do not assign the framework license to\nall embedded code. A different installed version is not a substitute for the\nshipped version. Conditional/dynamic dependencies outside the browser file\ninventory are not covered.\n\n| Browser file | Evidence status | Notice inventory |\n| --- | --- | --- |\n${rows}\n`;
for (const [path, text] of [['docs/licenses/browser-notice-map.json', JSON.stringify(report, null, 2) + '\n'], ['docs/licenses/browser-notice-map.md', markdown]]) {
  if (args.includes('--check')) {
    if (await readFile(new URL(path, root), 'utf8') !== text) throw Error(`Stale browser notice map: ${path}`);
  } else await writeFile(new URL(path, root), text);
}
console.log(JSON.stringify({...report.summary, noticeEvidenceComplete: report.summary.unresolved === 0, redistributionClearance: false, networkCalls: 0}));

if (args.includes("--require-complete") && report.summary.unresolved) process.exitCode = 1;
