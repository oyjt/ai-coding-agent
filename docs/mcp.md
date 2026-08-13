# MCP 管理

## 1. MCP 的定位

MCP 为 Agent 提供外部工具和上下文能力，例如文档查询、代码图谱等。

`.aca` 只描述项目需要哪些 MCP，不保存 MCP Server 本身。

## 2. 配置

例如：

```yaml
dependencies:
  common:
    mcp:
      - context7
      - codegraph
```

## 3. 典型用途

### context7

用于查询第三方库和框架的官方或结构化文档，避免仅依赖模型已有知识。

### codegraph

用于理解仓库结构、调用关系和代码定位。

如果仓库存在：

```text
.codegraph/
```

代码理解阶段优先使用 codegraph。

## 4. MCP 与 Skill 的区别

```text
Skill
  → Agent 的专项工作方法

MCP
  → Agent 可访问的外部工具/数据能力
```

两者可以协同：

```text
Skill
  ↓
决定如何完成工作
  ↓
MCP
  ↓
提供需要的数据或工具
```

## 5. 安装原则

第三方 MCP 不直接复制到用户项目的 `.aca/`。

```text
agent.yaml
    ↓
声明 MCP
    ↓
aca install / aca sync
    ↓
Runtime Adapter
    ↓
实际 MCP 配置
```

具体安装方式属于 MCP/Runtime Adapter 实现，不应写死在核心配置模型中。
