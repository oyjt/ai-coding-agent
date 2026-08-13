# 工作流设计

## 1. 工作流目标

Workflow 定义 Agent **如何完成任务**。它不负责描述具体需求，也不替代 Plan。

```text
Spec       → 要实现什么
Workflow   → 按什么流程完成
Plan       → 具体怎么实现
```

## 2. 标准流程

```text
需求评审
  ↓
设计
  ↓
任务规划
  ↓
实现
  ↓
代码审查
  ↓
验证
  ↓
经验沉淀
```

## 3. 推荐能力映射

| 阶段 | 推荐能力 |
| --- | --- |
| 需求评审 | `grill-me` / `office-hours` |
| 设计 | `brainstorming` |
| 计划 | `writing-plans` / `autoplan` |
| TDD | `test-driven-development` |
| 前端开发 | 项目类型对应 Skill |
| UI | `ui-ux-pro-max` |
| 文档查询 | `context7` |
| 代码理解 | `codegraph` |
| Code Review | `requesting-code-review` |
| Bug | `systematic-debugging` |
| 完成验证 | `verification-before-completion` |
| 经验沉淀 | `learn` |

如果仓库存在 `.codegraph/`，代码理解阶段优先使用 codegraph。

## 4. feature

适用于普通新功能：

```text
grill-me
  ↓
writing-plans
  ↓
test-driven-development
  ↓
project skills
  ↓
requesting-code-review
  ↓
verification-before-completion
  ↓
learn
```

## 5. bugfix

Bug 修复优先定位问题，再修改：

```text
grill-me
  ↓
codegraph
  ↓
systematic-debugging
  ↓
test-driven-development
  ↓
requesting-code-review
  ↓
verification-before-completion
  ↓
learn
```

## 6. UI

```text
grill-me
  ↓
brainstorming
  ↓
ui-ux-pro-max
  ↓
project skills
  ↓
requesting-code-review
  ↓
verification-before-completion
  ↓
learn
```

## 7. CRITICAL

高风险任务必须增加需求评审、完整规划、安全审查和全量验证：

```text
grill-me
  ↓
office-hours
  ↓
brainstorming
  ↓
autoplan
  ↓
writing-plans
  ↓
test-driven-development
  ↓
requesting-code-review
  ↓
security-review
  ↓
verification-before-completion
  ↓
learn
```

## 8. 验证门控

Workflow 不得以“代码已经写完”作为完成条件。

必须根据任务等级执行真实验证：

| 等级 | 默认验证 |
| --- | --- |
| S | 相关命令 |
| M | lint + test + typecheck |
| L | lint + test + typecheck + build |
| CRITICAL | 全量验证 + 安全审查 |

M 级涉及路由、Nuxt 配置、server、环境变量、插件或构建配置时增加 build。

## 9. 工作流设计原则

1. 工作流应组合已有能力，不重复实现 Skill。
2. Workflow 文件保持声明式，不写复杂业务逻辑。
3. 高风险任务增加门控，不通过降低要求“加速”。
4. 每个 Workflow 都必须有明确的完成验证阶段。
