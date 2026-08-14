import type { DependencyKind } from '@ai-coding-agent/config';

export type CapabilitySource = 'workflow' | 'project' | 'runtime';

export interface CapabilityRequirement {
  kind: DependencyKind;
  name: string;
  source: CapabilitySource;
  required: boolean;
}

export interface CapabilityStatus extends CapabilityRequirement {
  installed: boolean;
  available: boolean;
  detail?: string;
}
