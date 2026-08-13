# AI Coding Agent Rules

## Working style

1. Explore first: read only the necessary documentation and inspect relevant code.
2. Plan before changing code: state assumptions, scope, impact, contracts, risks, and rollback considerations.
3. Execute the smallest traceable change that satisfies the request.
4. Verify with real commands. Never invent test or build results.
5. Before claiming completion, run the applicable verification workflow and report evidence.

## Completion rule

Do not claim a task is complete when required verification has failed or has not been run.

## Task levels

- **S**: copy, comments, low-risk configuration, or isolated small changes.
- **M**: normal feature or bugfix, usually 2–5 files.
- **L**: cross-module changes, architecture changes, data models, or high-impact refactors.
- **CRITICAL**: authentication, authorization, money, production configuration, destructive operations, migrations, or high-risk external integrations.

## Evidence

Final reports should distinguish completed work, commands actually run, their results, and anything not verified.
