# 项目开发指南

## 1. 环境

项目使用 pnpm monorepo。

安装依赖：

```bash
pnpm install
```

## 2. 构建与验证

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

开发修改至少应运行与变更风险匹配的验证命令。

## 3. 修改核心配置

如果修改 `AgentConfig` 或相关配置字段，应检查：

```text
packages/config
  ↓
packages/core
  ↓
packages/cli
  ↓
templates/project/.aca
  ↓
tests
  ↓
docs
```

## 4. 修改 CLI

CLI 入口位于：

```text
packages/cli/src/
```

复杂业务逻辑应进入 `packages/core`，不要不断堆积在 CLI 入口。

## 5. 修改项目模板

模板位于：

```text
templates/project/.aca/
```

模板是用户执行 `aca init` 后实际得到的配置，因此修改模板需要同步检查：

- README
- `AGENTS.md`
- 对应 `docs/*.md`
- 配置解析
- 测试

## 6. 文档规则

项目文档统一使用 Markdown 和中文。

以下内容保持英文：

- 代码
- 命令
- 配置字段
- API 名称
- npm 包名
- Skill / MCP / Runtime 名称

文档应该解释设计意图，而不是只罗列代码。

## 7. 新增抽象的规则

新增模块、Manager、Registry、Engine、Service 前先回答：

1. 当前真实需求是什么？
2. 是否已有模块可以承担？
3. 是否可以通过配置解决？
4. 是否会增加长期维护成本？

如果只是为了未来可能出现的需求，不要提前增加抽象。

## 8. 提交前检查

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

并检查：

- 文档是否同步
- 模板是否同步
- 是否产生不必要的 API 变化
- 是否加入了不必要的抽象
- 是否存在未验证的结论

## 9. 版本与兼容性

`.aca` 配置属于项目公共契约。配置结构发生破坏性变化时必须明确版本策略，并同步更新文档和模板。
