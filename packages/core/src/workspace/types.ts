export type WorkspaceChangeKind = 'added' | 'modified' | 'deleted' | 'renamed';
export type WorkspaceGuardStatus = 'allowed' | 'unexpected' | 'blocked';

export interface WorkspaceSnapshot {
  tracked: string[];
  modified: string[];
  untracked: string[];
  deleted: string[];
  capturedAt: string;
}

export interface WorkspaceChange {
  path: string;
  kind: WorkspaceChangeKind;
  status: WorkspaceGuardStatus;
  reason?: string;
}

export interface WorkspaceGuardOptions {
  allowedPaths?: string[];
  protectedPaths?: string[];
}

export interface WorkspaceGuardResult {
  status: WorkspaceGuardStatus;
  changes: WorkspaceChange[];
  unexpected: string[];
  blocked: string[];
}
