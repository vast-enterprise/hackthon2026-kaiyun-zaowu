# Git 规范参考

本文档提供项目 Git 工作流与提交消息规范的摘要。

## 1. 核心摘要

项目采用 **Conventional Commits** 规范，提交消息格式为 `type(scope): description`。主分支为 `main`，开发采用短生命周期 feature 分支直接合并到 main 的模式。

## 2. 分支策略

- **主分支**: `main` — 唯一长期分支，所有功能最终合并至此
- **Feature 分支**: 按需创建，完成后合并到 `main` 并删除
- **远程**: 仅 `origin/main`

## 3. 提交消息格式

```
type(scope): 简短描述
```

**常见 type:**

| Type       | 用途               |
|------------|--------------------|
| `feat`     | 新功能             |
| `fix`      | 缺陷修复           |
| `refactor` | 重构（不改变行为） |
| `chore`    | 构建/工具/依赖维护 |
| `docs`     | 文档变更           |

**常见 scope:**

| Scope         | 对应模块                   |
|---------------|----------------------------|
| `ui`          | 通用 UI 组件               |
| `chat`        | 聊天系统组件               |
| `api`         | API 路由 (`app/api/`)      |
| `hook`/`hooks`| React Hooks                |
| `store`       | Zustand 状态管理           |
| `persistence` | IndexedDB 持久化层         |
| `sidebar`     | 侧边栏组件                 |
| `bazi`        | 八字分析模块               |

## 4. 注意事项

- 提交描述以**英文**为主，少数使用中文
- scope 可省略（如 `docs: add migration plan`）
- 描述使用小写开头、祈使语气（如 `add`、`fix`、`remove`）
