import assert from 'node:assert/strict';
import test from 'node:test';
import { getRequiredSkills } from './resolver.js';

test('getRequiredSkills expands project-skills placeholder', () => {
  assert.deepEqual(
    getRequiredSkills(
      {
        name: 'feature',
        taskLevel: 'M',
        steps: [
          { id: 'project', skills: ['project-skills'], required: true },
          { id: 'optional', skills: ['learn'], required: false },
          { id: 'verify', skills: ['verification-before-completion'], required: true },
        ],
      },
      ['vue-best-practices', 'vueuse-functions'],
    ),
    ['vue-best-practices', 'vueuse-functions', 'verification-before-completion'],
  );
});
