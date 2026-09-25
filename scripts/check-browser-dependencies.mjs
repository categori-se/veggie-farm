import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {browserDependencyInventory, compareBrowserDependencies} from './lib/browser-dependencies.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
let root = resolve(repo, 'dist'), manifest = resolve(repo, 'browser-dependencies.json'), write = false;
try {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--write') write = true;
    else if (['--root', '--manifest'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) {
      if (args[i] === '--root') root = resolve(args[++i]);
      else manifest = resolve(args[++i]);
    } else throw Error('Usage: node scripts/check-browser-dependencies.mjs [--root dist] [--manifest browser-dependencies.json] [--write]');
  }
  const actual = await browserDependencyInventory(root);
  if (write) {
    await writeFile(manifest, JSON.stringify(actual, null, 2) + '\n');
    console.log(`Recorded ${actual.files.length} browser runtime files. Review the manifest diff and dependency rights before accepting an update.`);
  } else {
    const differences = compareBrowserDependencies(JSON.parse(await readFile(manifest, 'utf8')), actual);
    if (differences.length) {
      throw Error(`Browser runtime differs from the reviewed inventory:\n${differences.join('\n')}\nDo not deploy this build as a previously approved release. See CONTRIBUTING.md for dependency review; this check never updates the inventory automatically.`);
    }
    console.log(`Browser dependency check passed: ${actual.files.length} exact file hashes. This is a drift check, not a license or reproducible-build certification.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
