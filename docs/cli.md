# CLI 使用说明

CLI 命令为 `aca`。

## 初始化

```bash
aca init
```

在当前项目创建 `.aca/` 模板。如果 `.aca/` 已存在，不应无条件覆盖用户配置。

## 安装依赖

```bash
aca install
aca install --execute
```

读取 `agent.yaml`，检测项目类型，解析通用和项目类型依赖。默认只检查和生成安装计划；只有显式使用 `--execute` 才执行 Dependency Catalog 中声明的安装方案。

## 同步 Runtime

```bash
aca sync
```

根据项目 Runtime 配置生成对应 Runtime 配置。

## 查看状态

```bash
aca status
```

显示：

- 项目类型
- 包管理器
- `.aca` 配置状态
- 默认 Workflow
- 默认 Runtime
- 已解析的 Skill
- 已解析的 MCP
- 已解析的 CLI

## 环境检查

```bash
aca doctor
```

检查当前项目、`.aca` 基础配置、Runtime、权限和依赖状态，并在发现问题时返回非零退出码。

## 任务

### 检查

```bash
aca task check "新增 OAuth 登录功能"
```

完成任务分类、任务等级、Workflow、Required Skills 和 Verification Gates 检查。

### 规划

```bash
aca task plan "新增 OAuth 登录功能"
```

生成完整 Agent Plan，但不执行 Agent。

### 准备

```bash
aca task prepare "新增 OAuth 登录功能"
aca task prepare "新增 OAuth 登录功能" --install
```

准备 Runtime 上下文。默认只检查 Capability；`--install` 才允许执行 Dependency Catalog 中已声明的安装方案。

### 验证

```bash
aca task verify "新增 OAuth 登录功能"
```

根据任务等级执行真实验证并生成 `.claude/verification.json`。

### 执行

```bash
aca task run "新增 OAuth 登录功能"
```

执行完整 Agent Loop：

```text
Task
  ↓
Classification
  ↓
Agent Plan
  ↓
Capability Preparation
  ↓
Runtime Sync
  ↓
Agent Execution
  ↓
Verification
  ↓
Execution Evidence
```

只有 Agent 执行成功并且真实验证满足 `canComplete`，命令才返回成功；否则返回非零退出码。

缺失依赖时默认不会执行安装命令：

```bash
aca task run "新增 OAuth 登录功能" --install
```

可以显式允许使用 Dependency Catalog 中声明的安装方案。

## Spec

### 创建

```bash
aca spec create <name>
```

创建：

```text
.aca/specs/<name>.md
```

内容基于项目模板 `SPEC.md`。名称只允许字母、数字、`.`、`_`、`-`，并且不会覆盖已有 Spec。

### 列出

```bash
aca spec list
```

列出 `.aca/specs/` 中已经创建的 Spec，不显示模板 `SPEC.md`。

### 查看

```bash
aca spec show <name>
```

输出指定 Spec 内容。

## Agent 执行证据

`aca task run` 完成后，Runtime 工作目录中的 `.claude/` 可能包含：

```text
.claude/
├── agent-plan.json
├── capabilities.json
├── agent-context.md
├── verification.json
└── execution.json
```

其中：

- `agent-plan.json`：任务计划。
- `capabilities.json`：实际可用能力。
- `agent-context.md`：Agent 执行上下文。
- `verification.json`：真实验证结果。
- `execution.json`：Agent 执行结果及完成状态。

Agent 自己报告成功不能替代真实验证。

## CLI 设计原则

1. CLI 只负责参数解析、输出和命令编排。
2. 核心逻辑放在 `packages/core`。
3. 配置解析放在 `packages/config`。
4. CLI 输出保持简洁、明确，并使用中文。
5. 错误使用非零退出码表达失败。
6. 不通过 CLI 隐式修改用户未授权的项目文件。
7. 外部安装只允许使用 Dependency Catalog 中声明的方案。
