import type { TaskType } from '../workflows/types.js';
import type { ProjectType } from '@ai-coding-agent/config';

export interface WorkspaceScope {
  allowedPaths: string[];
  protectedPaths: string[];
  source: 'auto' | 'explicit';
}

export interface WorkspaceScopeInput {
  taskType: TaskType;
  projectType?: ProjectType;
  explicitAllowedPaths?: string[];
  explicitProtectedPaths?: string[];
}

const DEFAULT_PROTECTED_PATHS = ['.git/**', '.github/workflows/**', '.claude/approval.json'];
const COMMON_PROJECT_FILES = ['package.json', 'pnpm-lock.yaml', 'npm-shrinkwrap.json', 'yarn.lock'];

export function resolveWorkspaceScope(input: WorkspaceScopeInput): WorkspaceScope {
  const protectedPaths = [...new Set([...DEFAULT_PROTECTED_PATHS, ...(input.explicitProtectedPaths ?? [])])].sort();
  if (input.explicitAllowedPaths?.length) {
    return { allowedPaths: [...new Set(input.explicitAllowedPaths)].sort(), protectedPaths, source: 'explicit' };
  }

  let allowedPaths: string[];
  switch (input.taskType) {
    case 'docs':
      allowedPaths = ['README.md', 'docs/**'];
      break;
    case 'config':
      allowedPaths = [...COMMON_PROJECT_FILES, 'config/**', '*.config.*', '.*rc', '.*rc.*'];
      break;
    case 'feature':
    case 'bugfix':
    case 'refactor':
      allowedPaths = ['src/**', 'tests/**', 'test/**', ...COMMON_PROJECT_FILES];
      break;
    case 'unknown':
    default:
      allowedPaths = ['src/**', 'tests/**', 'test/**', ...COMMON_PROJECT_FILES];
      break;
  }

  if (input.projectType === 'react' || input.projectType === 'vue' || input.projectType === 'react-native') {
    allowedPaths.push('app/**', 'components/**', 'pages/**');
  }

  return { allowedPaths: [...new Set(allowedPaths)].sort(), protectedPaths, source: 'auto' };
}
