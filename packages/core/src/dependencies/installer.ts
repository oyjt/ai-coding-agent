import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { findDependencyInstallSpec } from './catalog.js';
import type { DependencyKind } from '@ai-coding-agent/config';

const execFileAsync = promisify(execFile);

export interface DependencyInstallResult {
  kind: DependencyKind;
  name: string;
  installed: boolean;
  detail: string;
}

export async function installDependency(
  kind: DependencyKind,
  name: string,
  cwd: string,
  options: { execute?: boolean } = {},
): Promise<DependencyInstallResult> {
  const spec = findDependencyInstallSpec(kind, name);
  if (!spec) {
    return { kind, name, installed: false, detail: '暂无内置安装器，请手动安装或添加安装源。' };
  }

  if (!options.execute) {
    return {
      kind,
      name,
      installed: false,
      detail: `可执行: ${formatCommand(spec.command, spec.args)}`,
    };
  }

  try {
    await execFileAsync(spec.command, spec.args, { cwd, stdio: 'inherit' });
    return { kind, name, installed: true, detail: spec.detail };
  } catch (error) {
    return {
      kind,
      name,
      installed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args].map((part) => (/^[\w./:@%+=,-]+$/.test(part) ? part : JSON.stringify(part))).join(' ');
}
