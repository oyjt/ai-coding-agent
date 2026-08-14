import type { AgentPlan } from './types.js';
import {
  getCapabilityReadiness,
  installMissingCapabilities,
  inspectCapabilities,
  type CapabilityInstallReport,
  type CapabilityReadiness,
} from '../capabilities/index.js';

export interface AgentPreparationOptions {
  cwd: string;
  install?: boolean;
}

export interface AgentPreparationResult {
  plan: AgentPlan;
  readiness: CapabilityReadiness;
  installation?: CapabilityInstallReport;
  ready: boolean;
  blockers: string[];
}

/**
 * Prepare an AgentPlan for execution by checking required capabilities and,
 * when explicitly requested, installing missing capabilities from the catalog.
 * Installation is opt-in so preparing a task never executes external commands
 * implicitly.
 */
export async function prepareAgent(
  plan: AgentPlan,
  options: AgentPreparationOptions,
): Promise<AgentPreparationResult> {
  let statuses = await inspectCapabilities(plan.capabilities, options.cwd);
  let readiness = getCapabilityReadiness(statuses);
  let installation: CapabilityInstallReport | undefined;

  if (!readiness.ready && options.install && readiness.missing.length > 0) {
    installation = await installMissingCapabilities(plan.capabilities, options.cwd, { execute: true });
    statuses = installation.statuses;
    readiness = getCapabilityReadiness(statuses);
  }

  const blockers = readiness.blockers.map(
    (item) => `${item.kind}:${item.name} — ${item.detail ?? '未就绪'}`,
  );

  return {
    plan,
    readiness,
    installation,
    ready: readiness.ready,
    blockers,
  };
}
