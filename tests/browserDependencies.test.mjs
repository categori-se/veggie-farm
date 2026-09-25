import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, readFile, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {browserDependencyInventory, compareBrowserDependencies} from '../scripts/lib/browser-dependencies.mjs';
const command = fileURLToPath(new URL('../scripts/check-browser-dependencies.mjs', import.meta.url));
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'veggie-browser-runtime-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(join(root, '_npm/library@1.0.0'), {recursive: true});
  await mkdir(join(root, '_observablehq'));
  await writeFile(join(root, '_npm/library@1.0.0/module.js'), 'export const x=1;');
  await writeFile(join(root, '_observablehq/runtime.js'), 'export {};');
  return root;
}
test('runtime drift detects same-size byte changes, added versions and removed modules', async t => {
  const root = await fixture(t), before = await browserDependencyInventory(root);
  assert.deepEqual(compareBrowserDependencies(before, await browserDependencyInventory(root)), []);
  await writeFile(join(root, '_npm/library@1.0.0/module.js'), 'export const x=2;');
  await mkdir(join(root, '_npm/library@2.0.0'));
  await writeFile(join(root, '_npm/library@2.0.0/module.js'), 'export {};');
  await rm(join(root, '_observablehq/runtime.js'));
  await writeFile(join(root, '_observablehq/new-runtime.js'), 'export {};');
  assert.deepEqual(compareBrowserDependencies(before, await browserDependencyInventory(root)), [
    'added _npm/library@2.0.0/module.js', 'added _observablehq/new-runtime.js',
    'changed _npm/library@1.0.0/module.js', 'removed _observablehq/runtime.js'
  ]);
});
test('CLI rejects drift without rewriting the inventory and ignores app-only changes', async t => {
  const root = await fixture(t), manifest = join(root, 'inventory.json');
  const args = [command, '--root', root, '--manifest', manifest];
  execFileSync(process.execPath, [...args, '--write']);
  const before = await readFile(manifest, 'utf8');
  await writeFile(join(root, 'studio.html'), 'Application output is outside this check');
  assert.equal(spawnSync(process.execPath, args).status, 0);
  await writeFile(join(root, '_npm/library@1.0.0/module.js'), 'export const x=2;');
  const failed = spawnSync(process.execPath, args, {encoding: 'utf8'});
  assert.equal(failed.status, 1);assert.match(failed.stderr, /changed _npm/);
  assert.equal(await readFile(manifest, 'utf8'), before);
});
test('incomplete runtime output, symlinks and malformed inventories fail closed', async t => {
  const root = await fixture(t), inventory = await browserDependencyInventory(root);
  assert.throws(() => compareBrowserDependencies({version: 1, files: [...inventory.files, inventory.files[0]]}, inventory), /duplicate/);
  assert.throws(() => compareBrowserDependencies({version: 1, files: []}, inventory), /Invalid/);
  await symlink(join(root, '_observablehq/runtime.js'), join(root, '_npm/link.js'));
  await assert.rejects(browserDependencyInventory(root), /symlink/);
  await rm(join(root, '_npm/link.js'));
  await rm(join(root, '_observablehq/runtime.js'));
  await assert.rejects(browserDependencyInventory(root), /Empty runtime/);
  await rm(join(root, '_observablehq'), {recursive: true});
  await assert.rejects(browserDependencyInventory(root), /ENOENT/);
});
