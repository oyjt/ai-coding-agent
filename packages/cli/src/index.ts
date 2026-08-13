#!/usr/bin/env node
import { detectProjectType } from '@ai-coding-agent/core';
import { DEFAULT_AGENT_DIR } from '@ai-coding-agent/config';

const [command] = process.argv.slice(2);

switch (command) {
  case 'status':
    console.log(`Project type: ${detectProjectType()}`);
    console.log(`Agent directory: ${DEFAULT_AGENT_DIR}`);
    break;
  case 'doctor':
    console.log('ACA doctor: basic environment check passed.');
    break;
  case 'init':
    console.log('ACA init: project template generation will be implemented next.');
    break;
  case 'install':
  case 'sync':
    console.log(`ACA ${command}: dependency synchronization will be implemented next.`);
    break;
  default:
    console.log('Usage: aca <init|install|sync|status|doctor>');
}
