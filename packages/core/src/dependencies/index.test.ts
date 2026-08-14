import assert from 'node:assert/strict';
import test from 'node:test';
import { createDependencyPlan } from './index.js';

test('createDependencyPlan preserves resolved dependency groups', () => {
  assert.deepEqual(
    createDependencyPlan({
      projectType: 'react',
      skills: ['grill-me', 'react-best-practices'],
      mcp: ['context7'],
      cli: ['gh'],
    }),
    {
      projectType: 'react',
      skills: ['grill-me', 'react-best-practices'],
      mcp: ['context7'],
      cli: ['gh'],
    },
  );
});
