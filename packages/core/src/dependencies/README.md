# Dependency Adapter

依赖解析和检查的最小适配层。

- `types.ts`：依赖检查与 Adapter 契约。
- `adapters.ts`：Skill、MCP、CLI 的项目级检查器。
- `index.ts`：生成安装计划并执行依赖检查。

当前阶段只负责**检查和生成计划**，不自动安装第三方依赖。
