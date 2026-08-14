import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { listWorkflows, loadWorkflow } from './loader.js';

async function withWorkflow(source: string, callback: (cwd: string) => Promise<void>): Promise<void> {
  const cwd = await mkdtemp(join(tmpdir(), 'aca-workflow-'));
  try {
    await mkdir(join(cwd, '.aca', 'workflows'), { recursive: true });
    await writeFile(join(cwd, '.aca', 'workflows', 'feature.yaml'), source, 'utf8');
    await callback(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

test('loadWorkflow normalizes a single skill step', async () => {
  await withWorkflow(
    'name: feature\ntask_level: M\nsteps:\n  - id: verify\n    skill: verification-before-completion\n',
    async (cwd) => {
      const workflow = loadWorkflow('feature', cwd);
      assert.deepEqual(workflow.steps[0], {
        id: 'verify',
        skill: 'verification-before-completion',
        skills: ['verification-before-completion'],
        required: true,
      });
    },
  );
});

test('listWorkflows returns sorted workflow names', async () => {
  await withWorkflow('name: feature\ntask_level: M\nsteps:\n  - id: verify\n    skills: [verify]\n', async (cwd) => {
    await writeFile(join(cwd, '.aca', 'workflows', 'critical.yaml'), 'name: critical\ntask_level: CRITICAL\nsteps:\n  - id: verify\n    skills: [verify]\n', 'utf8');
    assert.deepEqual(listWorkflows(cwd), ['critical', 'feature']);
  });
});
