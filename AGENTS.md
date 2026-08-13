# AI Coding Agent 开发指南

## 项目定位

`ai-coding-agent` 是一个项目级 AI Coding Agent 配置与开发工作流工具。

核心目标是让项目通过 `.aca/` 描述 Agent 的配置、权限、规则、工作流、Skill、MCP、CLI 依赖和任务 Spec，并通过 `aca` CLI 管理这些配置。

项目保持轻量，不试图成为完整的 Agent Server、复杂的 Policy Engine 或集中式 Capability Registry。

## 开始工作前

1. 阅读本文件。
2. 根据任务类型阅读 `docs/` 中对应文档，不要求一次读取全部文档。
3. 阅读相关源码、模板和测试。
4. 确认实际可用的验证命令。
5. 对 L / CRITICAL 任务，先确认 Spec 和实现边界。

## 核心架构

```text
packages/config  → 配置模型与解析
packages/core    → 项目检测与核心逻辑
packages/cli     → aca CLI

用户项目
  ↓
.aca/
  ├── agent.yaml
  ├── permissions.yaml
  ├── workflows/
  ├── rules/
  ├── skills/
  └── specs/
```

`.aca` 是 Runtime 无关的项目配置层。Claude、Codex、Gemini 等 Runtime 应通过 Adapter/同步层消费 `.aca`，不能让核心配置绑定某个 Runtime。

## 目录职责

- `packages/config`：配置类型、默认值和配置解析。
- `packages/core`：项目类型检测、依赖解析等核心能力。
- `packages/cli`：用户命令入口，不应承载复杂业务逻辑。
- `templates/project/.aca`：通过 `aca init` 写入用户项目的默认模板。
- `docs/`：本项目设计、使用和开发文档。

## `.aca` 职责边界

```text
agent.yaml          → Agent 项目配置
permissions.yaml    → Agent 权限
rules/              → 应遵守什么规范
workflows/          → 应如何完成任务
skills/             → 项目自有 Skill
specs/              → 当前任务要实现什么
```

Spec、Plan、Code、Verification 的边界：

```text
Spec          → 要实现什么
Plan          → 怎么实现
Code          → 实际实现
Verification  → 是否真的实现
```

## 第三方依赖原则

第三方 Skill、MCP、CLI 不直接复制到用户项目仓库的 `.aca` 中。`.aca` 只声明项目需要什么，安装和同步机制负责解决实际安装位置及 Runtime 配置。

通用依赖与项目类型依赖通过 `common + project-specific` 合并。例如 Expo 项目可以继承通用依赖和 React Native 依赖。

## 工作流

标准开发流程：

```text
需求评审
  ↓
设计
  ↓
规划
  ↓
实现
  ↓
代码审查
  ↓
验证
  ↓
经验沉淀
```

当前模板参考 `grill-me`、`office-hours`、`brainstorming`、`writing-plans`、`autoplan`、`test-driven-development`、`requesting-code-review`、`systematic-debugging`、`verification-before-completion` 和 `learn` 等能力。

不要把第三方 Skill 的实现复制进本仓库，除非它明确属于本项目自有能力。

## 任务分级

- **S**：文案、注释、低风险配置、单点小改；不要求 Spec。
- **M**：普通功能、Bug 修复；Spec 可选，默认验证 lint、test、typecheck。
- **L**：跨模块、架构变更、数据模型、高影响重构；必须先创建 Spec 和 Plan，并执行 lint、test、typecheck、build。
- **CRITICAL**：认证、权限、资金、生产配置、删除、迁移、高风险外部集成；必须 Spec、Plan、回滚方案和安全审查，并执行全量验证。

M 级涉及路由、`nuxt.config.ts`、`server/**`、环境变量、插件或构建配置时，需要额外执行 build。

## 修改原则

1. 先理解，再修改。
2. 只做用户请求可追溯的最小修改。
3. 不为了未来可能需求提前增加抽象。
4. 不重复实现第三方工具已有能力。
5. 修改配置模型时同步检查 CLI、模板、测试和文档。
6. 修改模板 `.aca` 时同步检查 README 和相关设计文档。
7. 不要为了形式增加 Registry、Service、Manager 等抽象层；只有真实需求出现时再引入。

## 验证原则

必须运行真实命令，不得根据代码推断验证结果。

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

根据任务等级选择适用命令。声称完成前必须执行适用的验证流程。

最终说明：

- 修改了什么
- 实际运行了什么命令
- 每个命令的结果
- 哪些内容没有验证
- 如果失败，说明原因

## 当前实现状态

### 已实现

- pnpm monorepo 基础结构
- `@ai-coding-agent/config`
- `@ai-coding-agent/core`
- `@ai-coding-agent/cli`
- `.aca` 项目模板
- 项目类型检测
- 配置依赖解析
- `aca init`
- `aca status`
- `aca doctor`
- Spec 模板
- S / M / L / CRITICAL 任务分级
- 基础 CI 配置

### 部分实现

- `aca install`：目前主要完成依赖解析/安装计划，第三方实际安装器仍待完善。
- `aca sync`：命令入口已规划，Runtime 同步能力待完善。
- Runtime Adapter：尚未完整实现。

### 后续方向

优先完善：

1. `aca spec create/list/show`
2. Skill / MCP / CLI 安装机制
3. Claude Runtime Adapter
4. `aca sync`
5. 其他 Runtime Adapter

## 文档导航

| 任务 | 文档 |
| --- | --- |
| 理解整体架构 | `docs/architecture.md` |
| 修改 `.aca/agent.yaml` | `docs/configuration.md` |
| 修改 Workflow | `docs/workflows.md` |
| 修改 Spec | `docs/specs.md` |
| 修改 Skill | `docs/skills.md` |
| 修改 MCP | `docs/mcp.md` |
| 修改 Runtime | `docs/runtimes.md` |
| 修改 CLI | `docs/cli.md` |
| 开发本项目 | `docs/development.md` |

## 文档维护

项目文档使用 Markdown，默认使用中文。代码、命令、配置字段和 API 标识保持英文。

设计发生变化时，优先更新对应 `docs/*.md` 和本文件，避免让代码成为唯一设计来源。
