# AI Coding Agent

项目级 AI Coding Agent 配置与开发工作流工具。

项目定位保持简单：使用项目内的 `.aca/` 描述 Agent 需要遵循的规则、工作流、Skill、MCP、CLI 和任务规格，再由 `aca` CLI 负责初始化、检查、安装、同步和准备 Runtime。

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
| `agent.yaml` | 定义项目类型、通用依赖、项目类型依赖和默认 Runtime |
| `permissions.yaml` | 定义 Agent 可使用和禁止使用的 Runtime 能力 |
| `workflows/` | 定义 Agent 如何完成不同等级的任务 |
| `rules/` | 定义编码、验证和交付规范 |
| `skills/` | 放置项目自有 Skill；第三方 Skill 不复制进仓库 |
| `specs/` | 描述具体任务要实现什么，以及如何验收 |

## 项目类型与依赖

`aca` 会根据项目 `package.json` 自动识别常见类型：

- Expo
- React Native
- Nuxt
- Vue
- React
- Node

`agent.yaml` 可以把依赖分为 `common` 和项目类型组。Expo 会自动继承 `react-native` 组，再叠加 `expo` 组；重复的 Skill、MCP 和 CLI 名称会自动去重。

默认模板中的通用开发依赖包括：

```text
Skills: grill-me / superpowers / gstack
MCP:    context7 / codegraph
CLI:    gh
```

项目类型再叠加对应 Skill，例如 Vue、React、React Native。

```yaml
version: 1

project:
  type: auto

dependencies:
  common:
    skills:
      - grill-me
      - superpowers
      - gstack
    mcp:
      - context7
      - codegraph
    cli:
      - gh

  vue:
    skills:
      - vue-best-practices
      - vueuse-functions
```

### 依赖安装模型

仓库只声明需要什么，不把第三方 Skill、MCP、CLI 复制进项目。安装器只允许执行内置 Catalog 中明确声明的命令，不接受配置文件中的任意 shell 命令。

```bash
# 只检查并显示可执行命令，不修改环境
aca install

# 明确确认后才执行内置安装命令
aca install --execute
```

当前内置安装器：

- `context7`：通过 Claude Code 项目级 MCP 配置安装。
- `superpowers`：通过 Claude Code 官方 Plugin Marketplace 安装。
- `gstack`：克隆到项目 `.claude/skills/gstack` 后执行官方 Claude setup。gstack 官方当前更推荐 team mode；项目本地安装主要用于 ACA 的项目级依赖模型。

`gh`、`codegraph` 等没有内置安装器时，`aca install` 只报告缺失，不执行未知安装命令；可由开发环境或项目规范自行安装。

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

## CLI

```bash
aca init
aca status
aca doctor
aca install
aca install --execute
aca sync
aca workflow list
aca workflow show feature
aca task check "新增 OAuth 登录功能"
aca task plan "新增 OAuth 登录功能"
aca task prepare "新增 OAuth 登录功能"
aca spec create oauth-login
aca spec list
aca spec show oauth-login
```

`aca init` 会在当前项目创建 `.aca/`，不会覆盖已有配置。

`aca task check` 会自动完成：

```text
任务描述
  ↓
任务类型
  ↓
S / M / L / CRITICAL
  ↓
Workflow
  ↓
Required Skills
  ↓
Verification Gates
```

`aca task plan` 在此基础上生成完整 Agent Plan，包含项目依赖、Skills、MCP、CLI、Workflow 和验证门禁。

`aca task prepare` 会把 Agent Plan 交给当前 Runtime Adapter。Claude Runtime 会生成 `.claude/agent-plan.json`，供后续 Agent 会话消费。

## 开发

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI 使用 `pnpm install --frozen-lockfile`，并依次执行 lint、typecheck、test、build。

## 设计原则

1. **项目优先**：配置放在项目内，随代码一起版本管理。
2. **简单优先**：不引入复杂的 Registry、Policy Engine 或 Agent Server。
3. **Runtime 无关**：`.aca` 描述项目需求，不绑定 Claude、Codex 或 Gemini 的配置格式。
4. **第三方依赖声明与项目配置分离**：仓库只声明需要什么，不把第三方 Skill、MCP、CLI 的实现复制进项目。
5. **安装命令白名单化**：只有内置 Catalog 中明确声明的安装步骤可以被 `--execute` 执行。
6. **规则优先**：任务分级首先使用确定性规则，避免模型误判高风险任务。
7. **真实验证**：Agent 只能报告实际执行过的验证结果。
