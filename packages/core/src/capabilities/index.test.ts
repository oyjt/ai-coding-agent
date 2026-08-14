import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCapabilities } from './index.js';
import type { ResolvedWorkflow } from '../workflows/types.js';

const workflow = {
  name: 'feature',
  taskLevel: 'M',
  steps: [
    { id: 'design', name: '设计', required: true, skills: ['brainstorming', 'project-skills'] },
    { id: 'optional', name: '可选', required: false, skills: ['unused'] },
  ],
} as unknown as ResolvedWorkflow;

test('resolves workflow and project capabilities without duplicates', () => {
  const result = resolveCapabilities(workflow, {
    skills: ['vue-best-practices', 'brainstorming'],
    mcp: ['context7'],
    cli: ['gh'],
  });

  assert.deepEqual(result, [
    { kind: 'skills', name: 'brainstorming', source: 'workflow', required: true },
    { kind: 'skills', name: 'vue-best-practices', source: 'project', required: true },
    { kind: 'mcp', name: 'context7', source: 'project', required: true },
    { kind: 'cli', name: 'gh', source: 'project', required: true },
  ]);
});
