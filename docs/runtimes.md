# Runtime 设计

## 1. 目标

`.aca` 是 Runtime 无关的项目 Agent 配置。Runtime Adapter 负责把通用配置转换成具体 AI Coding Agent 能理解的格式。

当前重点 Runtime：

- Claude
- Codex
- Gemini

未来可以增加其他 Runtime，但不应改变 `.aca` 核心模型。

## 2. 分层

```text
                    .aca
                     │
             通用配置模型
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
     Claude        Codex        Gemini
     Adapter       Adapter       Adapter
        ↓            ↓            ↓
   Runtime 配置   Runtime 配置  Runtime 配置
```

## 3. Runtime Adapter 职责

Adapter 负责：

- 权限配置转换
- Skill 配置同步
- MCP 配置同步
- Runtime 特有配置生成
- 环境检查

Adapter 不负责：

- 定义项目任务 Spec
- 修改通用 Workflow 模型
- 定义项目类型
- 保存第三方工具实现

## 4. Claude

Claude 是第一个优先实现的 Runtime。

项目权限配置例如：

```yaml
allow:
  - Bash
  - Edit
  - Read
  - Write

deny:
  - Bash(rm -rf:*)
  - Write(.env*)
```

Adapter 将其转换为 Claude 对应的权限配置。

## 5. Runtime 无关原则

不要出现：

```text
if claude then 修改 AgentConfig 模型
```

应该是：

```text
AgentConfig
    ↓
ClaudeAdapter
    ↓
Claude 配置
```

## 6. 同步

目标命令：

```bash
aca sync
```

逻辑：

```text
读取 .aca
  ↓
解析配置
  ↓
检测 Runtime
  ↓
选择 Adapter
  ↓
生成/更新 Runtime 配置
```

同步应该尽可能可重复执行，并避免覆盖用户明确管理的非 ACA 配置。
