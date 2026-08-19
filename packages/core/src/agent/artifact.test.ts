import { strict as assert } from 'node:assert';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { writeAgentExecutionEvidence } from './artifact.js';

test('writeAgentExecutionEvidence writes execution.json', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'acai-execution-'));
  const result = {
    execution: {
      runtime: 'test',
      startedAt: '2026-08-17T00:00:00.000Z',
      completedAt: '2026-08-17T00:00:01.000Z',
      exitCode: 0,
      passed: true,
      output: 'done',
    },
    verification: undefined,
    completed: true,
    attempts: 1,
    status: 'passed' as const,
  };

  const file = await writeAgentExecutionEvidence(cwd, result);
  const content = JSON.parse(await readFile(file, 'utf8'));

  assert.equal(content.completed, true);
  assert.equal(content.execution.exitCode, 0);
  assert.equal(content.attempts, 1);
  assert.equal(content.status, 'passed');
});
