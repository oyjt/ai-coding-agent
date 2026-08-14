import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { detectPackageManager, detectProjectType, inspectProject } from './index.js';

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type ProjectCallback = (cwd: string) => Promise<void>;

async function withProject(packageJson: PackageJson, callback: ProjectCallback): Promise<void> {
  const cwd = await mkdtemp(join(tmpdir(), 'aca-project-'));
  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify(packageJson), 'utf8');
    await callback(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

test('detectProjectType identifies Expo before React Native and React', async () => {
  await withProject({ dependencies: { expo: '^55.0.0', 'react-native': '^0.84.1', react: '^19.0.0' } }, async (cwd) => {
    assert.equal(detectProjectType(cwd), 'expo');
  });
});

test('detectProjectType identifies Nuxt, Vue, React Native and React', async () => {
  await withProject({ dependencies: { nuxt: '^4.0.0', vue: '^3.0.0' } }, async (cwd) => {
    assert.equal(detectProjectType(cwd), 'nuxt');
  });

  await withProject({ dependencies: { vue: '^3.0.0' } }, async (cwd) => {
    assert.equal(detectProjectType(cwd), 'vue');
  });

  await withProject({ dependencies: { 'react-native': '^0.84.1', react: '^19.0.0' } }, async (cwd) => {
    assert.equal(detectProjectType(cwd), 'react-native');
  });

  await withProject({ dependencies: { react: '^19.0.0' } }, async (cwd) => {
    assert.equal(detectProjectType(cwd), 'react');
  });
});

test('detectPackageManager prefers the matching lockfile', async () => {
  await withProject({ dependencies: { react: '^19.0.0' } }, async (cwd) => {
    await writeFile(join(cwd, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    assert.equal(detectPackageManager(cwd), 'pnpm');
  });
});

test('inspectProject reports detected type, package manager and ACA config', async () => {
  await withProject({ dependencies: { vue: '^3.0.0' } }, async (cwd) => {
    await writeFile(join(cwd, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    assert.deepEqual(inspectProject(cwd), {
      type: 'vue',
      packageManager: 'pnpm',
      hasAgentConfig: false,
    });
  });
});
