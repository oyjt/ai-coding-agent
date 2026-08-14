import assert from 'node:assert/strict';
import test from 'node:test';
import { findDependencyInstallSpec, installDependency } from './index.js';

test('catalog provides explicit install recipes for supported dependencies', () => {
  assert.equal(findDependencyInstallSpec('mcp', 'context7')?.command, 'claude');
  assert.equal(findDependencyInstallSpec('skills', 'superpowers')?.command, 'claude');
  assert.equal(findDependencyInstallSpec('skills', 'gstack')?.command, 'git');
});

test('installDependency defaults to dry-run and never executes external commands', async () => {
  const result = await installDependency('mcp', 'context7', process.cwd());
  assert.equal(result.installed, false);
  assert.match(result.detail, /claude mcp add/);
});

test('installDependency reports unknown dependencies without executing anything', async () => {
  const result = await installDependency('skills', 'not-in-catalog', process.cwd());
  assert.equal(result.installed, false);
  assert.match(result.detail, /暂无内置安装器/);
});
