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
```

读取 `agent.yaml`，检测项目类型，解析通用和项目类型依赖，并执行或输出安装计划。

当前版本重点是依赖解析；第三方实际安装器仍在完善中。

## 同步 Runtime

```bash
aca sync
```

当前版本暂时复用 `install` 的依赖计划逻辑。完整 Runtime 同步由后续 Adapter 实现。

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

检查当前项目和 `.aca` 基础配置是否有效，并在发现问题时返回非零退出码。

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

例如：

```bash
aca spec create add-login
```

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

## CLI 设计原则

1. CLI 只负责参数解析、输出和命令编排。
2. 核心逻辑放在 `packages/core`。
3. 配置解析放在 `packages/config`。
4. CLI 输出保持简洁、明确，并使用中文。
5. 错误使用非零退出码表达失败。
6. 不通过 CLI 隐式修改用户未授权的项目文件。
