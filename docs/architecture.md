# 架构设计

## 1. 项目目标

`ai-coding-agent` 用于为代码仓库提供项目级 AI Coding Agent 配置和标准开发工作流。

它解决的问题不是重新实现一个 AI 模型或 Agent Runtime，而是把项目需要的：

- Agent 配置
- 权限
- Rules
- Workflow
- Skill
- MCP
- CLI
- Spec

组织成可版本管理、可复用、可同步的项目配置。

## 2. 总体架构

```text
                         ai-coding-agent
                                │
             ┌──────────────────┼──────────────────┐
             ↓                  ↓                  ↓
           config              core               cli
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ↓
                         用户项目 `.aca/`
                                │
        ┌────────────┬──────────┼──────────┬────────────┐
        ↓            ↓          ↓          ↓            ↓
     Config       Rules     Workflow    Skills       Specs
                                │
                                ↓
                              MCP
                                │
                                ↓
                            Runtime
```

## 3. Monorepo

```text
packages/config
```

负责配置模型和解析，不负责 CLI 行为。

```text
packages/core
```

负责项目检测、依赖解析等与 Runtime 无关的核心能力。

```text
packages/cli
```

负责命令行入口和用户交互。复杂业务应放到 `core`，避免 CLI 变成巨型模块。

```text
packages/
├── config/
├── core/
└── cli/
```

## 4. `.aca` 配置层

```text
.aca/
├── agent.yaml
├── permissions.yaml
├── workflows/
├── rules/
├── skills/
└── specs/
```

职责严格区分：

| 配置 | 回答的问题 |
| --- | --- |
| `agent.yaml` | 项目需要什么配置和依赖？ |
| `permissions.yaml` | Agent 能做什么、不能做什么？ |
| `rules/` | Agent 应遵守什么规范？ |
| `workflows/` | Agent 应如何完成任务？ |
| `skills/` | 项目有哪些自有能力？ |
| `specs/` | 当前任务具体要实现什么？ |

## 5. Runtime 无关

`.aca` 是 Runtime 无关的配置层。

```text
                         .aca
                           │
              Runtime-independent config
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
          Claude          Codex        Gemini
             │             │             │
          Adapter        Adapter       Adapter
```

Claude、Codex、Gemini 等 Runtime 的配置格式不能反向污染 `.aca` 核心模型。

## 6. 第三方能力

第三方 Skill、MCP、CLI 不直接复制到项目仓库。

```text
agent.yaml
    ↓
声明项目需要什么
    ↓
aca install / aca sync
    ↓
安装或配置第三方能力
```

这样项目仓库只保存需求，不保存第三方工具本身。

## 7. 项目类型依赖

依赖由通用依赖和项目类型依赖组成：

```text
common
  +
project-specific
  ↓
resolved dependencies
```

例如：

```text
Expo
  ↓
common + react-native + expo
```

项目类型检测应保持轻量，优先根据现有项目配置判断，不建立复杂的 Project Framework Registry。

## 8. Workflow、Spec、Plan 的边界

```text
Spec
 ↓
要实现什么

Plan
 ↓
怎么实现

Code
 ↓
实际实现

Verification
 ↓
是否真的实现
```

Workflow 是 Agent 完成任务的流程，不等于 Spec 或 Plan。

## 9. 任务等级

| 等级 | Spec | Plan | 典型验证 |
| --- | --- | --- | --- |
| S | 不需要 | 不需要 | 相关命令 |
| M | 可选 | 推荐 | lint + test + typecheck |
| L | 必须 | 必须 | lint + test + typecheck + build |
| CRITICAL | 必须 | 必须 | 全量验证 + 安全审查 |

## 10. 有意避免的设计

当前项目明确不引入：

- Agent Server
- 集中式 Capability Registry
- 复杂 Policy Engine
- 独立 Workflow Engine 服务
- 复杂插件市场
- 强制的 ADR 系统

只有在实际需求证明必要时再引入这些抽象。

## 11. 核心设计原则

1. **简单优先**：能用配置解决的问题不要增加服务。
2. **职责单一**：Config、Core、CLI、Runtime Adapter 各自保持边界。
3. **Runtime 无关**：项目配置不绑定具体 AI 工具。
4. **项目优先**：`.aca` 随项目代码版本管理。
5. **第三方复用**：优先使用成熟 Skill、MCP、CLI，不重复实现。
6. **真实验证**：所有完成状态必须有实际验证证据。
