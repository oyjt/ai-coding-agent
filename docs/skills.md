# Skill 管理

## 1. Skill 的定位

Skill 是 Agent 可调用的专项能力。`ai-coding-agent` 负责声明、选择和组合 Skill，不重复实现成熟第三方 Skill。

## 2. 项目自有 Skill 与第三方 Skill

项目模板中的：

```text
.aca/skills/
```

用于项目自有 Skill。

第三方 Skill 只在 `agent.yaml` 中声明，由安装/同步机制处理。

例如：

```yaml
dependencies:
  common:
    skills:
      - grill-me
```

## 3. 按项目类型选择

Skill 分为通用和项目类型相关能力：

```text
common
  +
project-specific
```

例如：

```text
Vue
  → common + vue

React
  → common + react

React Native
  → common + react-native

Expo
  → common + react-native + expo（后续支持）
```

## 4. 推荐能力

当前设计参考：

- `grill-me`：需求澄清与质询
- `brainstorming`：方案探索
- `writing-plans`：实现计划
- `test-driven-development`：TDD
- `requesting-code-review`：代码审查
- `systematic-debugging`：系统化排错
- `verification-before-completion`：完成前验证
- `learn`：经验沉淀
- `vue-best-practices`：Vue 项目能力
- `vueuse-functions`：VueUse 能力
- `ui-ux-pro-max`：UI/UX 能力

这些名称是依赖声明，不代表本仓库包含这些第三方实现。

## 5. Skill 与 Workflow

Workflow 负责组合 Skill：

```text
Workflow
   ↓
选择当前阶段需要的 Skill
   ↓
Skill 执行专项工作
   ↓
Workflow 进入下一阶段
```

不要在 Workflow 中重新描述 Skill 的详细规则。

## 6. Skill 选择原则

1. 优先使用已有 Skill。
2. 项目类型相关 Skill 不污染其他项目类型。
3. 通用 Skill 放在 common。
4. 第三方 Skill 不复制进项目仓库。
5. 只有稳定且项目确实需要的重复能力才考虑成为项目自有 Skill。
