import type { AgentPlan } from './types.js';
import {
  createCapabilityContext,
  getCapabilityReadiness,
  installMissingCapabilities,
  inspectCapabilities,
  type CapabilityContext,
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
  capabilityContext: CapabilityContext;
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

  const capabilityContext = createCapabilityContext(statuses);
  const blockers = capabilityContext.blockers;

  return {
    plan,
    readiness,
    capabilityContext,
    installation,
    ready: readiness.ready,
    blockers,
  };
}
