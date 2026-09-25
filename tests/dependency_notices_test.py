"""Offline notice collection and stale embedded-text regression checks."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DependencyNoticeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'scripts').mkdir()
        (self.root / 'docs/licenses').mkdir(parents=True)
        shutil.copyfile(ROOT / 'scripts/build-dependency-notices.mjs', self.root / 'scripts/build-dependency-notices.mjs')
        shutil.copyfile(ROOT / 'docs/licenses/npm-notice-excerpts.json', self.root / 'docs/licenses/npm-notice-excerpts.json')
        shutil.copyfile(ROOT / 'docs/licenses/npm-upstream-notices.json', self.root / 'docs/licenses/npm-upstream-notices.json')
        shutil.copytree(ROOT / 'docs/licenses/upstream', self.root / 'docs/licenses/upstream')
        packages = {}
        for name in ['is-module', 'isarray', 'markdown-it-anchor']:
            source = ROOT / 'node_modules' / name
            target = self.root / 'node_modules' / name
            target.mkdir(parents=True)
            metadata = json.loads((source / 'package.json').read_text())
            for filename in ['package.json', 'README.md', 'UNLICENSE']:
                if (source / filename).exists():
                    shutil.copyfile(source / filename, target / filename)
            packages[f'node_modules/{name}'] = {'version': metadata['version'], 'license': metadata['license'], 'dev': True}
        (self.root / 'package-lock.json').write_text(json.dumps({'packages': packages}))

    def collect(self):
        return subprocess.run(['node', 'scripts/build-dependency-notices.mjs', '--build-tools'], cwd=self.root, capture_output=True, text=True)

    def test_full_notices_are_collected(self):
        result = self.collect()
        self.assertEqual(result.returncode, 0, result.stderr)
        inventory = json.loads((self.root / 'docs/licenses/build-tool-npm-notices.json').read_text())
        self.assertEqual(inventory['missingTexts'], [])
        self.assertEqual(len(inventory['packages']), 3)
        for package in inventory['packages']:
            self.assertEqual(len(package['texts']), 1)
        text = (self.root / 'docs/licenses/build-tool-npm-notices.md').read_text()
        self.assertIn('2014 segmentio', text)
        self.assertIn('2013 Julian Gruber', text)
        self.assertIn('This is free and unencumbered software', text)

    def test_community_profile_never_requires_account_service(self):
        (self.root / 'community-release.json').write_text(json.dumps({'profile': 'community'}))
        result = subprocess.run(['node', 'scripts/build-dependency-notices.mjs'], cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads((self.root / 'docs/licenses/runtime-npm-notices.json').read_text())
        self.assertEqual([lock['scope'] for lock in data['locks']], ['.'])
        self.assertNotIn('account-service npm locks', data['scope'])

    def test_strict_completeness_rejects_unlicensed_fixture(self):
        (self.root / 'node_modules/markdown-it-anchor/UNLICENSE').unlink()
        self.assertEqual(self.collect().returncode, 0)
        result = subprocess.run(['node', 'scripts/build-dependency-notices.mjs', '--build-tools', '--check', '--require-complete'], cwd=self.root, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('notices are incomplete', result.stderr)

    def add_saxes(self):
        target = self.root / 'node_modules/saxes'
        target.mkdir()
        shutil.copyfile(ROOT / 'node_modules/saxes/package.json', target / 'package.json')
        lock_path = self.root / 'package-lock.json'
        lock = json.loads(lock_path.read_text())
        locked = json.loads((ROOT / 'package-lock.json').read_text())['packages']['node_modules/saxes']
        lock['packages']['node_modules/saxes'] = locked
        lock_path.write_text(json.dumps(lock))

    def test_exact_upstream_evidence(self):
        self.add_saxes()
        result = self.collect()
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads((self.root / 'docs/licenses/build-tool-npm-notices.json').read_text())
        record = next(p for p in data['packages'] if p['name'] == 'saxes')
        self.assertEqual(record['texts'][0]['gitHead'], '211fa0ebec9b628affc09219199639887174bfc3')
        notice = self.root / 'docs/licenses/upstream/saxes/6.0.0/LICENSE'
        notice.write_text('Changed notice')
        result = self.collect()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Upstream notice text changed', result.stderr)

    def test_upstream_package_mismatch(self):
        self.add_saxes()
        path = self.root / 'package-lock.json'
        lock = json.loads(path.read_text())
        lock['packages']['node_modules/saxes']['integrity'] = 'different-archive'
        path.write_text(json.dumps(lock))
        result = self.collect()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Upstream notice package evidence changed', result.stderr)

    def test_readme_drift_is_rejected(self):
        path = self.root / 'node_modules/isarray/README.md'
        path.write_text(path.read_text() + '\nChanged upstream\n')
        result = self.collect()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Reviewed notice excerpt changed', result.stderr)
        self.assertFalse((self.root / 'docs/licenses/build-tool-npm-notices.json').exists())

    def test_license_link_is_not_full_license(self):
        path = self.root / 'node_modules/markdown-it-anchor/UNLICENSE'
        path.unlink()
        result = self.collect()
        self.assertEqual(result.returncode, 0, result.stderr)
        inventory = json.loads((self.root / 'docs/licenses/build-tool-npm-notices.json').read_text())
        self.assertEqual([p['name'] for p in inventory['missingTexts']], ['markdown-it-anchor'])


if __name__ == '__main__':
    unittest.main()
