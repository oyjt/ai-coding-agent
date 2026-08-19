import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { WorkspaceSnapshot } from './types.js';

const execFileAsync = promisify(execFile);

export async function snapshotWorkspace(cwd: string): Promise<WorkspaceSnapshot> {
  const { stdout } = await execFileAsync('git', ['status', '--porcelain=v1', '-uall'], { cwd, encoding: 'utf8' });
  const modified: string[] = [];
  const untracked: string[] = [];
  const deleted: string[] = [];
  const tracked: string[] = [];

  for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
    const status = line.slice(0, 2);
    const path = line.slice(3).trim();
    if (!path) continue;
    if (status === '??') {
      untracked.push(path);
      continue;
    }
    tracked.push(path);
    if (status.includes('D')) deleted.push(path);
    else modified.push(path);
  }

  return {
    tracked: [...new Set(tracked)].sort(),
    modified: [...new Set(modified)].sort(),
    untracked: [...new Set(untracked)].sort(),
    deleted: [...new Set(deleted)].sort(),
    capturedAt: new Date().toISOString(),
  };
}
