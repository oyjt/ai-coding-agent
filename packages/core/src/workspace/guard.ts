import type { WorkspaceChange, WorkspaceGuardOptions, WorkspaceGuardResult, WorkspaceSnapshot } from './types.js';

const DEFAULT_PROTECTED_PATHS = ['.git/', '.github/workflows/', '.claude/approval.json'];

function matchesPath(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const normalized = pattern.replace(/\\/g, '/').replace(/\/$/, '');
    return path === normalized || path.startsWith(`${normalized}/`) || (normalized.endsWith('**') && path.startsWith(normalized.slice(0, -2)));
  });
}

export function guardWorkspaceChanges(before: WorkspaceSnapshot, after: WorkspaceSnapshot, options: WorkspaceGuardOptions = {}): WorkspaceGuardResult {
  const protectedPaths = [...DEFAULT_PROTECTED_PATHS, ...(options.protectedPaths ?? [])];
  const beforePaths = new Set([...before.modified, ...before.untracked]);
  const changes = new Map<string, WorkspaceChange>();
  const currentPaths = new Set([...after.modified, ...after.untracked]);

  for (const path of [...after.modified, ...after.untracked]) {
    if (beforePaths.has(path)) continue;
    const status = matchesPath(path, protectedPaths) ? 'blocked' : matchesPath(path, options.allowedPaths ?? []) ? 'allowed' : 'unexpected';
    changes.set(path, { path, kind: after.untracked.includes(path) ? 'added' : 'modified', status, ...(status === 'blocked' ? { reason: 'protected path' } : status === 'unexpected' ? { reason: 'outside allowed paths' } : {}) });
  }

  for (const path of before.modified) {
    if (!currentPaths.has(path)) changes.set(path, { path, kind: 'deleted', status: 'unexpected', reason: 'tracked change disappeared from workspace' });
  }

  const result = [...changes.values()].sort((a, b) => a.path.localeCompare(b.path));
  return {
    status: result.some((change) => change.status === 'blocked') ? 'blocked' : result.some((change) => change.status === 'unexpected') ? 'unexpected' : 'allowed',
    changes: result,
    unexpected: result.filter((change) => change.status === 'unexpected').map((change) => change.path),
    blocked: result.filter((change) => change.status === 'blocked').map((change) => change.path),
  };
}
