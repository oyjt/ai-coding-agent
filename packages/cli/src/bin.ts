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
  inspectProject,
  prepareAgent,
  runAgent,
} from '@ai-coding-agent/core';
import { join } from 'node:path';

const args = process.argv.slice(2);

async function runTask(description: string): Promise<void> {
  const cwd = process.cwd();
  const install = args.includes('--install');
  const task = description.replace(/(^|\s)--install(?=\s|$)/g, ' ').trim();

  if (!task) {
    console.error('用法: aca task run <任务描述> [--install]');
    process.exitCode = 1;
    return;
  }

  const project = inspectProject(cwd);
  if (!project.hasAgentConfig) {
    console.error(`ACA: ${DEFAULT_AGENT_DIR}/${DEFAULT_CONFIG_FILE} not found. Run "aca init" first.`);
    process.exitCode = 1;
    return;
  }

  try {
    const config = loadAgentConfig(cwd);
    const plan = createAgentPlan(task, {
      projectType: project.type,
      config,
      cwd,
    });
    const runtimeName = config.runtime?.default ?? 'claude';
    const runtime = getRuntimeAdapter(runtimeName);
    if (!runtime) throw new Error(`Unsupported runtime: ${runtimeName}`);

    const preparation = await prepareAgent(plan, { cwd, install });
    const permissions = normalizePermissions(loadPermissions(cwd) ?? DEFAULT_PERMISSIONS);

    if (!preparation.ready) {
      console.error('ACA task run');
      console.error('  Ready:    no');
      for (const blocker of preparation.blockers) console.error(`  ! ${blocker}`);
      process.exitCode = 1;
      return;
    }

    await runtime.sync({
      cwd,
      permissions,
      plan,
      capabilities: preparation.capabilityContext,
    });

    const result = await runAgent(plan, {
      cwd,
      plan,
      runtime,
      permissions,
      preparation,
    });

    console.log('ACA task run');
    console.log(`  Task:         ${plan.description}`);
    console.log(`  Level:        ${plan.classification.level}`);
    console.log(`  Workflow:     ${plan.workflow.name}`);
    console.log(`  Runtime:      ${runtimeName}`);
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

async function main(): Promise<void> {
  if (args[0] === 'task' && args[1] === 'run') {
    await runTask(args.slice(2).join(' '));
    return;
  }

  await import('./index.js');
}

await main();
