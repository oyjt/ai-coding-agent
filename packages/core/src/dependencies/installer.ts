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
  commands: string[];
}

export async function installDependency(
  kind: DependencyKind,
  name: string,
  cwd: string,
  options: { execute?: boolean } = {},
): Promise<DependencyInstallResult> {
  const spec = findDependencyInstallSpec(kind, name);
  if (!spec) {
    return { kind, name, installed: false, detail: '暂无内置安装器，请手动安装或添加安装源。', commands: [] };
  }

  const commands = spec.commands.map((item) => formatCommand(item.command, item.args));
  if (!options.execute) {
    return { kind, name, installed: false, detail: `可执行:\n${commands.map((command) => `  ${command}`).join('\n')}`, commands };
  }

  for (const item of spec.commands) {
    try {
      await execFileAsync(item.command, item.args, {
        cwd: item.cwd ? `${cwd}/${item.cwd}` : cwd,
      });
    } catch (error) {
      return {
        kind,
        name,
        installed: false,
        detail: error instanceof Error ? error.message : String(error),
        commands,
      };
    }
  }

  return { kind, name, installed: true, detail: spec.detail, commands };
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args]
    .map((part) => (/^[\w./:@%+=,-]+$/.test(part) ? part : JSON.stringify(part)))
    .join(' ');
}
