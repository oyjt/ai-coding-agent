import assert from 'node:assert/strict';
import test from 'node:test';
import { findDependencyInstallSpec, installDependency } from './index.js';

test('catalog provides explicit install recipes for supported dependencies', () => {
  assert.equal(findDependencyInstallSpec('mcp', 'context7')?.commands[0]?.command, 'claude');
  assert.equal(findDependencyInstallSpec('skills', 'superpowers')?.commands[0]?.command, 'claude');
  assert.equal(findDependencyInstallSpec('skills', 'gstack')?.commands[0]?.command, 'git');
  assert.equal(findDependencyInstallSpec('skills', 'gstack')?.commands[1]?.args, undefined);
  assert.deepEqual(findDependencyInstallSpec('skills', 'gstack')?.commands[1]?.args, ['setup', '--host', 'claude', '--no-prefix']);
});

test('installDependency defaults to dry-run and never executes external commands', async () => {
  const result = await installDependency('mcp', 'context7', process.cwd());
  assert.equal(result.installed, false);
  assert.match(result.detail, /claude mcp add/);
  assert.equal(result.commands.length, 1);
});

test('gstack dry-run exposes clone and setup steps', async () => {
  const result = await installDependency('skills', 'gstack', process.cwd());
  assert.equal(result.installed, false);
  assert.equal(result.commands.length, 2);
  assert.match(result.detail, /git clone/);
  assert.match(result.detail, /setup --host claude --no-prefix/);
});

test('installDependency reports unknown dependencies without executing anything', async () => {
  const result = await installDependency('skills', 'not-in-catalog', process.cwd());
  assert.equal(result.installed, false);
  assert.match(result.detail, /暂无内置安装器/);
});
