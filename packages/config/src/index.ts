export type ProjectType = 'auto' | 'vue' | 'react' | 'react-native' | 'expo' | 'nuxt' | 'node' | 'unknown';

export interface DependencyGroup {
  skills?: string[];
  mcp?: string[];
  cli?: string[];
}

export interface AgentConfig {
  version: number;
  project?: { type?: ProjectType };
  dependencies?: {
    common?: DependencyGroup;
    vue?: DependencyGroup;
    react?: DependencyGroup;
    'react-native'?: DependencyGroup;
    expo?: DependencyGroup;
    nuxt?: DependencyGroup;
    node?: DependencyGroup;
  };
  workflow?: { default?: string };
  runtime?: { default?: string };
}

export const DEFAULT_AGENT_DIR = '.aca';
export const DEFAULT_CONFIG_FILE = 'agent.yaml';
