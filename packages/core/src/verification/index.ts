import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import type { ProjectType } from '@ai-coding-agent/config';
import type { TaskLevel } from '../workflows/types.js';

const execFileAsync = promisify(execFile);

export interface VerificationCommand {
  id: 'lint' | 'test' | 'typecheck' | 'build';
  command: string;
  args: string[];
  required: boolean;
  reason: string;
}

export interface VerificationPlan {
  taskLevel: TaskLevel;
  projectType: ProjectType;
  packageManager: 'pnpm' | 'yarn' | 'npm' | 'bun' | 'unknown';
  commands: VerificationCommand[];
  manualGates: string[];
}

export interface VerificationResult {
  id: VerificationCommand['id'];
  passed: boolean;
  skipped: boolean;
  output: string;
  error?: string;
}

interface PackageJson {
  scripts?: Record<string, string>;
}

export function createVerificationPlan(options: {
  cwd: string;
  taskLevel: TaskLevel;
  projectType: ProjectType;
  packageManager: VerificationPlan['packageManager'];
}): VerificationPlan {
  const scripts = readScripts(options.cwd);
  const ids: VerificationCommand['id'][] = options.taskLevel === 'S'
    ? ['lint']
    : ['lint', 'test', 'typecheck'];
  if (options.taskLevel === 'L' || options.taskLevel === 'CRITICAL') ids.push('build');

  const commands = ids
    .filter((id) => Boolean(scripts[id]))
    .map((id) => ({
      id,
      ...toCommand(options.packageManager, id),
      required: true,
      reason: reasonFor(id, options.taskLevel),
    }));

  const missing = ids.filter((id) => !scripts[id]);
  const manualGates: string[] = [];
  if (options.taskLevel === 'L' || options.taskLevel === 'CRITICAL') manualGates.push('完成影响范围与回滚方案审查');
  if (options.taskLevel === 'CRITICAL') manualGates.push('完成安全审查');
  if (missing.length) manualGates.push(`项目未提供脚本: ${missing.join(', ')}`);

  return {
    taskLevel: options.taskLevel,
    projectType: options.projectType,
    packageManager: options.packageManager,
    commands,
    manualGates,
  };
}

export async function runVerification(plan: VerificationPlan, cwd: string, execute = true): Promise<VerificationResult[]> {
  if (!execute) {
    return plan.commands.map((command) => ({ id: command.id, passed: false, skipped: true, output: `${command.command} ${command.args.join(' ')}` }));
  }

  const results: VerificationResult[] = [];
  for (const command of plan.commands) {
    try {
      const result = await execFileAsync(command.command, command.args, { cwd, maxBuffer: 10 * 1024 * 1024 });
      results.push({ id: command.id, passed: true, skipped: false, output: `${result.stdout}${result.stderr}`.trim() });
    } catch (error) {
      const value = error as { stdout?: string; stderr?: string; message?: string };
      results.push({
        id: command.id,
        passed: false,
        skipped: false,
        output: `${value.stdout ?? ''}${value.stderr ?? ''}`.trim(),
        error: value.message ?? String(error),
      });
      break;
    }
  }
  return results;
}

function readScripts(cwd: string): Record<string, string> {
  try {
    const packageJson = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8')) as PackageJson;
    return packageJson.scripts ?? {};
  } catch {
    return {};
  }
}

function toCommand(packageManager: VerificationPlan['packageManager'], id: VerificationCommand['id']): Pick<VerificationCommand, 'command' | 'args'> {
  const commands: Record<VerificationPlan['packageManager'], { command: string; args: string[] }> = {
    pnpm: { command: 'pnpm', args: ['run', id] },
    yarn: { command: 'yarn', args: [id] },
    npm: { command: 'npm', args: ['run', id] },
    bun: { command: 'bun', args: ['run', id] },
    unknown: { command: 'pnpm', args: ['run', id] },
  };
  return commands[packageManager];
}

function reasonFor(id: VerificationCommand['id'], level: TaskLevel): string {
  if (id === 'lint') return level === 'S' ? '低风险任务的最小验证。' : '检查代码质量与静态规则。';
  if (id === 'test') return '验证行为与回归风险。';
  if (id === 'typecheck') return '验证类型契约。';
  return '高影响任务必须验证生产构建。';
}
