# AI Coding Agent

项目级 AI Coding Agent 配置与开发工作流工具。

项目定位是保持简单：使用项目内的 `.aca/` 描述 Agent 需要遵循的规则、工作流、Skill、MCP、CLI 和任务规格，再由 `aca` CLI 负责初始化、同步和检查。

## 核心概念

```text
.aca/
├── agent.yaml          # Agent 主配置
├── permissions.yaml    # Runtime 权限
├── workflows/          # 开发工作流
├── rules/              # 项目开发规则
├── skills/             # 项目自有 Skill
└── specs/              # 任务规格与验收契约
```

| 配置 | 作用 |
| --- | --- |
| `agent.yaml` | 定义项目类型、依赖和默认 Runtime |
| `permissions.yaml` | 定义 Agent 可使用和禁止使用的能力 |
| `workflows/` | 定义 Agent 如何完成不同类型的任务 |
| `rules/` | 定义编码、验证和交付规范 |
| `skills/` | 放置项目自有 Skill |
| `specs/` | 描述具体任务要实现什么，以及如何验收 |

## 任务分级

| 级别 | 典型场景 | Spec | 验证 |
| --- | --- | --- | --- |
| S | 文案、注释、低风险配置、单点小改 | 不需要 | 相关命令 |
| M | 普通功能、Bug 修复 | 可选 | lint + test + typecheck |
| L | 跨模块、架构变更、高影响重构 | 必须 | lint + test + typecheck + build |
| CRITICAL | 认证、权限、资金、生产配置、删除、迁移、高风险外部集成 | 必须 | 全量验证 + 安全审查 |

M 级任务如果涉及路由、`nuxt.config.ts`、`server/**`、环境变量、插件或构建配置，应额外执行 `build`。

## 标准开发流程

```text
需求评审       → grill-me / office-hours
设计阶段       → brainstorming + writing-plans
任务规划       → autoplan
开发新功能     → test-driven-development
前端开发       → 项目对应 Skill
UI 开发        → ui-ux-pro-max
查询文档       → context7
理解/定位代码  → codegraph（存在 .codegraph/ 时优先）
代码审查       → requesting-code-review
遇到 Bug       → systematic-debugging
验证完成       → verification-before-completion
会话结束       → learn
```

L / CRITICAL 任务在执行前必须先建立 Spec。Spec 是需求契约，不是实现计划：

```text
Spec
  ↓
Plan
  ↓
Code
  ↓
Review
  ↓
Verification
  ↓
验收
```

## 快速开始

```bash
aca init
aca status
aca doctor
aca install
```

`aca init` 会在当前项目创建 `.aca/`，不会覆盖已有配置。

## 项目类型

CLI 会根据项目依赖自动识别常见项目类型：

- Vue
- Nuxt
- React
- React Native
- Expo
- Node

通用依赖与项目类型依赖可以在 `agent.yaml` 中分别声明。

## 开发

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

## 设计原则

1. **项目优先**：配置放在项目内，随代码一起版本管理。
2. **简单优先**：不引入复杂的 Registry、Policy Engine 或 Agent Server。
3. **Runtime 无关**：`.aca` 描述项目需求，不绑定 Claude、Codex 或 Gemini 的配置格式。
4. **第三方可安装**：第三方 Skill、MCP、CLI 不直接复制进项目仓库，由安装/同步机制管理。
5. **真实验证**：Agent 只能报告实际执行过的验证结果。
