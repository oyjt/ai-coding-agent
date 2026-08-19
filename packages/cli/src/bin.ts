#!/usr/bin/env node

import {
  DEFAULT_AGENT_DIR,
  DEFAULT_CONFIG_FILE,
  DEFAULT_PERMISSIONS,
  loadAgentConfig,
  loadPermissions,
  normalizePermissions,
} from '@ai-coding-agent/config';
import {
  createAgentPlan,
  getRuntimeAdapter,
  hasValidAgentApproval,
  inspectProject,
  prepareAgent,
  readAgentTaskStatus,
  runAgent,
  writeAgentApproval,
} from '@ai-coding-agent/core';
import { join } from 'node:path';

const args = process.argv.slice(2);

function parseMaxAttempts(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new Error('--max-attempts must be an integer between 1 and 10');
  }
  return value;
}

function hasFlag(name: string): boolean {
  return args.includes(name);
}

async function createTaskContext(description: string, install: boolean) {
  const cwd = process.cwd();
  const project = inspectProject(cwd);
  if (!project.hasAgentConfig) {
    throw new Error(`${DEFAULT_AGENT_DIR}/${DEFAULT_CONFIG_FILE} not found. Run "aca init" first.`);
  }

  const config = loadAgentConfig(cwd);
  const plan = createAgentPlan(description, {
    projectType: project.type,
    config,
    cwd,
  });
  const runtimeName = config.runtime?.default ?? 'claude';
  const runtime = getRuntimeAdapter(runtimeName);
  if (!runtime) throw new Error(`Unsupported runtime: ${runtimeName}`);
  const preparation = await prepareAgent(plan, { cwd, install });
  const permissions = normalizePermissions(loadPermissions(cwd) ?? DEFAULT_PERMISSIONS);

  return { cwd, plan, runtime, runtimeName, preparation, permissions };
}

async function approveTask(description: string): Promise<void> {
  const task = description.trim();
  if (!task) {
    console.error('用法: aca task approve <任务描述>');
    process.exitCode = 1;
    return;
  }

  try {
    const { cwd, plan, preparation } = await createTaskContext(task, false);
    if (plan.classification.level !== 'CRITICAL') {
      console.error('ACA task approve');
      console.error(`  Level:  ${plan.classification.level}`);
      console.error('  Status: approval artifact is only required for CRITICAL tasks.');
      process.exitCode = 1;
      return;
    }
    if (!preparation.ready) {
      console.error('ACA task approve');
      console.error('  Ready: no');
      for (const blocker of preparation.blockers) console.error(`  ! ${blocker}`);
      process.exitCode = 1;
      return;
    }

    const file = await writeAgentApproval(cwd, plan);
    console.log('ACA task approve');
    console.log(`  Task:     ${plan.description}`);
    console.log('  Level:    CRITICAL');
    console.log('  Approved: yes');
    console.log(`  Evidence: ${file}`);
  } catch (error) {
    console.error(`ACA: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

async function runTask(description: string): Promise<void> {
  const install = hasFlag('--install');
  const dryRun = hasFlag('--dry-run');
  const confirmed = hasFlag('--confirm');
  const maxAttemptsIndex = args.indexOf('--max-attempts');
  const maxAttempts = parseMaxAttempts(maxAttemptsIndex >= 0 ? args[maxAttemptsIndex + 1] : undefined);
  const task = description
    .replace(/(^|\s)--install(?=\s|$)/g, ' ')
    .replace(/(^|\s)--dry-run(?=\s|$)/g, ' ')
    .replace(/(^|\s)--confirm(?=\s|$)/g, ' ')
    .replace(/(^|\s)--max-attempts\s+\d+(?=\s|$)/g, ' ')
    .trim();

  if (!task) {
    console.error('用法: aca task run <任务描述> [--install] [--dry-run] [--confirm] [--max-attempts <1-10>]');
    process.exitCode = 1;
    return;
  }

  try {
    const { cwd, plan, runtime, runtimeName, preparation, permissions } = await createTaskContext(task, install);

    if (dryRun) {
      console.log('ACA task dry-run');
      console.log(`  Task:         ${plan.description}`);
      console.log(`  Level:        ${plan.classification.level}`);
      console.log(`  Type:         ${plan.classification.type}`);
      console.log(`  Workflow:     ${plan.workflow.name}`);
      console.log(`  Runtime:      ${runtimeName}`);
      console.log(`  Ready:        ${preparation.ready ? 'yes' : 'no'}`);
      console.log(`  Approval:     ${plan.approval.status}`);
      console.log(`  Confirmed:    ${confirmed ? 'yes' : 'no'}`);
      console.log(`  Max attempts: ${maxAttempts ?? 3}`);
      console.log(`  Skills:       ${plan.skills.length}`);
      console.log(`  MCP:          ${plan.dependencies.mcp?.length ?? 0}`);
      console.log(`  CLI:          ${plan.dependencies.cli?.length ?? 0}`);
      if (plan.classification.level === 'CRITICAL') console.log('  Approval:     use `aca task approve <task>` before execution');
      if (preparation.blockers.length) {
        console.log('  Blockers:');
        for (const blocker of preparation.blockers) console.log(`    - ${blocker}`);
      }
      return;
    }

    if (plan.classification.level === 'CRITICAL') {
      const approved = await hasValidAgentApproval(cwd, plan);
      if (!approved) {
        console.error('ACA task run');
        console.error('  Approval: required');
        console.error('  Status:   blocked');
        console.error('Run `aca task approve <task>` after reviewing the task plan.');
        process.exitCode = 1;
        return;
      }
    } else if (plan.approval.required && !confirmed) {
      console.error('ACA task run');
      console.error(`  Approval: required (${plan.classification.level})`);
      console.error('  Status:   blocked');
      console.error('Re-run with --confirm after reviewing the task plan.');
      process.exitCode = 1;
      return;
    }

    if (!preparation.ready) {
      console.error('ACA task run');
      console.error('  Ready:    no');
      for (const blocker of preparation.blockers) console.error(`  ! ${blocker}`);
      process.exitCode = 1;
      return;
    }

    await runtime.sync({ cwd, permissions, plan, capabilities: preparation.capabilityContext });
    const result = await runAgent(plan, { cwd, plan, runtime, permissions, preparation, maxAttempts, confirmed });

    console.log('ACA task run');
    console.log(`  Task:         ${plan.description}`);
    console.log(`  Level:        ${plan.classification.level}`);
    console.log(`  Workflow:     ${plan.workflow.name}`);
    console.log(`  Runtime:      ${runtimeName}`);
    console.log(`  Approval:     ${plan.classification.level === 'CRITICAL' || plan.approval.required ? 'confirmed' : 'not_required'}`);
    console.log(`  Attempts:     ${result.attempts}`);
    console.log(`  Status:       ${result.status}`);
    console.log(`  Execution:    ${result.execution.passed ? 'passed' : 'failed'}`);
    if (result.verification) console.log(`  Verification: ${result.verification.canComplete ? 'passed' : 'failed'}`);
    console.log(`  Completed:    ${result.completed ? 'yes' : 'no'}`);
    console.log(`  Evidence:     ${join(cwd, '.claude', 'execution.json')}`);

    if (!result.completed) process.exitCode = 1;
  } catch (error) {
    console.error(`ACA: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

async function showTaskStatus(): Promise<void> {
  const cwd = process.cwd();
  const status = await readAgentTaskStatus(cwd);
  console.log('ACA task status');
  if (!status.found || !status.result) {
    console.log('  Status:       not-found');
    console.log('  Evidence:     .claude/execution.json');
    return;
  }

  const { result } = status;
  console.log(`  Attempts:     ${result.attempts}`);
  console.log(`  Status:       ${result.status}`);
  console.log(`  Execution:    ${result.execution.passed ? 'passed' : 'failed'}`);
  if (result.verification) console.log(`  Verification: ${result.verification.canComplete ? 'passed' : 'failed'}`);
  console.log(`  Completed:    ${result.completed ? 'yes' : 'no'}`);
  console.log(`  Evidence:     ${join(cwd, '.claude', 'execution.json')}`);
  if (result.verification?.blockers.length) {
    console.log('  Blockers:');
    for (const blocker of result.verification.blockers) console.log(`    - ${blocker}`);
  }
}

async function main(): Promise<void> {
  if (args[0] === 'task' && args[1] === 'run') {
    await runTask(args.slice(2).join(' '));
    return;
  }
  if (args[0] === 'task' && args[1] === 'approve') {
    await approveTask(args.slice(2).join(' '));
    return;
  }
  if (args[0] === 'task' && args[1] === 'status') {
    await showTaskStatus();
    return;
  }

  await import('./index.js');
}

await main();
