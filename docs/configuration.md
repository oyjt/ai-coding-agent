# 配置说明

## 1. 配置目录

用户项目运行 `aca init` 后会得到：

```text
.aca/
├── agent.yaml
├── permissions.yaml
├── workflows/
├── rules/
├── skills/
└── specs/
```

## 2. agent.yaml

最小配置：

```yaml
version: 1

project:
  type: auto

dependencies:
  common:
    skills: []
    mcp: []
    cli: []

workflow:
  default: feature

runtime:
  default: claude
```

### project

`project.type` 表示项目类型。默认使用 `auto` 自动检测。

当前支持：

- `vue`
- `react`
- `react-native`
- `expo`
- `nuxt`
- `node`
- `unknown`
- `auto`

### dependencies

分为 `common` 和项目类型依赖。

```yaml
dependencies:
  common:
    skills:
      - grill-me
    mcp:
      - context7
    cli:
      - gh

  react-native:
    skills:
      - react-native-best-practices
```

解析时先取得 `common`，再合并当前项目类型依赖。

### workflow

```yaml
workflow:
  default: feature
```

指定默认工作流。具体工作流定义位于 `.aca/workflows/`。

### runtime

```yaml
runtime:
  default: claude
```

指定默认 Runtime。该字段只选择 Runtime，不应改变 `.aca` 的通用配置模型。

## 3. permissions.yaml

权限配置描述 Runtime 应允许和禁止的操作。

例如 Claude：

```yaml
allow:
  - Bash
  - Edit
  - Read
  - Write
  - Skill
  - Task

deny:
  - Bash(rm -rf:*)
  - Bash(curl | bash:*)
  - Bash(DROP:*)
  - Bash(TRUNCATE:*)
  - Write(.env*)
```

具体权限格式由 Runtime Adapter 负责转换。不要在核心配置中写入 Claude 专属的复杂语义。

## 4. 配置合并

项目依赖采用：

```text
common dependencies
        +
project type dependencies
        ↓
resolved dependencies
```

例如 React Native：

```text
common
├── grill-me
├── context7
└── gh

+

react-native
└── react-native-best-practices
```

最终得到统一安装计划。

## 5. 第三方依赖声明原则

`.aca` 声明第三方能力名称，不负责保存第三方实现。

例如：

```yaml
mcp:
  - context7
  - codegraph
```

而不是把 MCP Server 源码复制到 `.aca/`。

## 6. 配置修改规则

修改配置模型时需要同时检查：

1. `packages/config`
2. `packages/core`
3. `packages/cli`
4. `templates/project/.aca`
5. 测试
6. 对应文档

配置字段属于公共契约，不能只修改某一个 Runtime 的实现。
