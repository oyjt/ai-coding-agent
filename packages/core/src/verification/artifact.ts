import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { VerificationEvidence } from './index.js';

export const VERIFICATION_FILE = '.claude/verification.json';

export function writeVerificationEvidence(cwd: string, evidence: VerificationEvidence): string {
  const directory = join(cwd, '.claude');
  mkdirSync(directory, { recursive: true });
  const target = join(directory, 'verification.json');
  writeFileSync(target, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return VERIFICATION_FILE;
}
