# Runtime 设计

## 1. 目标

`.aca` 是 Runtime 无关的项目 Agent 配置。Runtime Adapter 负责把通用配置转换成具体 AI Coding Agent 能理解的格式。

当前重点 Runtime：

- Claude
- Codex
- Gemini

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
```

## 3. Runtime Adapter 职责

Adapter 负责：

- 权限配置转换
- Skill 配置同步
- MCP 配置同步
- Runtime 特有配置生成
- 环境检查

Adapter 不负责：

- 定义任务 Spec
- 修改通用 Workflow 模型
- 定义项目类型
- 保存第三方工具实现

## 4. Claude Adapter

当前已实现 Claude Runtime Adapter。

项目通过：

```text
.aca/permissions.yaml
```

定义 Runtime 无关的权限模型：

```yaml
permissions:
  allow:
    - Bash
    - Read
    - Write
  deny:
    - 'Bash(rm -rf:*)'
    - 'Write(.env*)'
```

执行：

```bash
aca sync
```

会生成或更新：

```text
.claude/settings.json
```

已有 `settings.json` 的其他顶层字段会保留，ACA 只更新 `permissions`。

## 5. 默认权限

`aca init` 会创建默认权限模板。默认允许常见 Agent 工具，并禁止高风险命令和 `.env` 写入。

默认配置集中在 `@ai-coding-agent/config`，Runtime Adapter 不重复维护默认值。

## 6. Runtime 无关原则

不要出现：

```text
if claude then 修改 AgentConfig 模型
```

应该是：

```text
AgentConfig
    ↓
Runtime Adapter
    ↓
Claude / Codex / Gemini 配置
```

## 7. 同步

```bash
aca sync
```

逻辑：

```text
读取 .aca
  ↓
读取 Runtime
  ↓
读取通用权限
  ↓
选择 Adapter
  ↓
生成/更新 Runtime 配置
```

同步应该尽可能可重复执行，并避免覆盖用户明确管理的非 ACA 配置。

## 8. 当前边界

当前 `aca sync` 只同步 Runtime 配置，第三方 Skill / MCP / CLI 仍由 `aca install` 检查，不自动安装。
