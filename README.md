# ai-coding-agent

Project-level AI coding agent configuration and workflow toolkit.

- CLI: `aca`
- Project configuration: `.aca/`
- Package manager: pnpm

## Architecture

The first version intentionally keeps the project small:

```text
.aca/
├── agent.yaml          # project Agent configuration
├── permissions.yaml    # tool permissions
├── workflows/          # feature / bugfix / UI / critical workflows
├── rules/              # project coding rules
├── skills/             # project-owned skills only
└── tasks/              # complex task records
```

Third-party skills, MCP servers, and CLIs are declared in `agent.yaml`; they are not copied into the repository.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

## CLI

From a workspace checkout:

```bash
pnpm --filter @ai-coding-agent/cli build
node packages/cli/dist/index.js init
node packages/cli/dist/index.js status
node packages/cli/dist/index.js doctor
node packages/cli/dist/index.js install
```

The current `install` command resolves the dependency plan but does not mutate external tool installations yet. Runtime-specific installers will be added after the project configuration format is stabilized.

## Design principles

1. Configuration over framework.
2. Reuse third-party skills instead of reimplementing them.
3. Keep `.aca/` project-owned and reviewable.
4. Task level controls workflow and verification depth.
5. Never claim verification without actual command evidence.
