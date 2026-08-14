import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ProjectType } from '@ai-coding-agent/config';
import type { TaskLevel } from '../workflows/types.js';

const execFileAsync = promisify(execFile);
type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun' | 'unknown';

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
  packageManager: PackageManager;
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

export interface VerificationEvidence {
  startedAt: string;
  completedAt: string;
  results: VerificationResult[];
  passed: boolean;
  canComplete: boolean;
  blockers: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
}

export function createVerificationPlan(options: { cwd: string; taskLevel: TaskLevel; projectType: ProjectType }): VerificationPlan {
  const scripts = readScripts(options.cwd);
  const packageManager = detectPackageManager(options.cwd);
  const ids: VerificationCommand['id'][] = options.taskLevel === 'S' ? ['lint'] : ['lint', 'test', 'typecheck'];
  if (options.taskLevel === 'L' || options.taskLevel === 'CRITICAL') ids.push('build');
  const commands = ids.filter((id) => Boolean(scripts[id])).map((id) => ({ id, ...toCommand(packageManager, id), required: true, reason: reasonFor(id, options.taskLevel) }));
  const missing = ids.filter((id) => !scripts[id]);
  const manualGates: string[] = [];
  if (options.taskLevel === 'L' || options.taskLevel === 'CRITICAL') manualGates.push('完成影响范围与回滚方案审查');
  if (options.taskLevel === 'CRITICAL') manualGates.push('完成安全审查');
  if (missing.length) manualGates.push(`项目未提供脚本: ${missing.join(', ')}`);
  return { taskLevel: options.taskLevel, projectType: options.projectType, packageManager, commands, manualGates };
}

export async function runVerification(plan: VerificationPlan, cwd: string, execute = true): Promise<VerificationResult[]> {
  if (!execute) return plan.commands.map((command) => ({ id: command.id, passed: false, skipped: true, output: `${command.command} ${command.args.join(' ')}` }));
  const results: VerificationResult[] = [];
  for (const command of plan.commands) {
    try {
      const result = await execFileAsync(command.command, command.args, { cwd, maxBuffer: 10 * 1024 * 1024 });
      results.push({ id: command.id, passed: true, skipped: false, output: `${result.stdout}${result.stderr}`.trim() });
    } catch (error) {
      const value = error as { stdout?: string; stderr?: string; message?: string };
      results.push({ id: command.id, passed: false, skipped: false, output: `${value.stdout ?? ''}${value.stderr ?? ''}`.trim(), error: value.message ?? String(error) });
      break;
    }
  }
  return results;
}

export function createVerificationEvidence(plan: VerificationPlan, results: VerificationResult[], startedAt: string, completedAt: string): VerificationEvidence {
  const required = new Set(plan.commands.filter((command) => command.required).map((command) => command.id));
  const passedIds = new Set(results.filter((result) => result.passed).map((result) => result.id));
  const blockers = plan.manualGates.slice();
  for (const id of required) {
    const result = results.find((item) => item.id === id);
    if (!result) blockers.push(`验证未执行: ${id}`);
    else if (!result.passed) blockers.push(`验证失败: ${id}`);
  }
  const passed = required.size === passedIds.size && blockers.length === 0;
  return { startedAt, completedAt, results, passed, canComplete: passed, blockers };
}

export async function verify(plan: VerificationPlan, cwd: string, execute = true): Promise<VerificationEvidence> {
  const startedAt = new Date().toISOString();
  const results = await runVerification(plan, cwd, execute);
  const completedAt = new Date().toISOString();
  return createVerificationEvidence(plan, results, startedAt, completedAt);
}

function readScripts(cwd: string): Record<string, string> {
  try {
    const packageJson = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as PackageJson;
    return packageJson.scripts ?? {};
  } catch {
    return {};
  }
}

function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm';
  return 'unknown';
}

function toCommand(packageManager: PackageManager, id: VerificationCommand['id']): Pick<VerificationCommand, 'command' | 'args'> {
  const commands: Record<PackageManager, { command: string; args: string[] }> = {
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
