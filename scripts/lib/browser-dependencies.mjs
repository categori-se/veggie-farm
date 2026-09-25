import {createHash} from 'node:crypto';
import {lstat, readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';

// Observable's browser modules are resolved outside npm's installation lock.
// Inventory the emitted bytes, including rewritten transitive imports.
export async function browserDependencyInventory(root) {
  const files = [];
  async function visit(relative) {
    const path = join(root, relative);
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw Error(`Runtime dependency must not be a symlink: ${relative}`);
    if (stat.isDirectory()) {
      for (const name of (await readdir(path)).sort()) await visit(`${relative}/${name}`);
    } else if (stat.isFile()) {
      const body = await readFile(path);
      files.push({path: relative, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex')});
    } else throw Error(`Unsupported runtime dependency: ${relative}`);
  }
  for (const directory of ['_npm', '_observablehq']) {
    const before = files.length;
    await visit(directory);
    if (files.length === before) throw Error(`Empty runtime directory: ${directory}`);
  }
  return {version: 1, files};
}

export function compareBrowserDependencies(expected, actual) {
  if (expected.version !== 1 || !Array.isArray(expected.files) || !expected.files.length) throw Error('Invalid browser dependency inventory');
  const previous = new Map();
  for (const file of expected.files) {
    if (!/^_(npm|observablehq)\//.test(file.path) || file.path.split('/').some(p => !p || p === '..' || p === '.')
      || !Number.isSafeInteger(file.bytes) || file.bytes < 0 || !/^[a-f0-9]{64}$/.test(file.sha256) || previous.has(file.path)) {
      throw Error('Invalid or duplicate browser dependency record');
    }
    previous.set(file.path, file);
  }
  const differences = [];
  for (const file of actual.files) {
    const old = previous.get(file.path);
    if (!old) differences.push(`added ${file.path}`);
    else if (old.bytes !== file.bytes || old.sha256 !== file.sha256) differences.push(`changed ${file.path}`);
    previous.delete(file.path);
  }
  for (const path of previous.keys()) differences.push(`removed ${path}`);
  return differences.sort();
}
