# Tripo Bagua - 文档索引

AI 驱动的八字命理分析与 3D 吉祥物生成 Web 应用（Next.js 16 + DeepSeek + Tripo API + React Three Fiber）。

---

## Overview

| 文档 | 说明 |
|------|------|
| `overview/project-overview.md` | 项目总览：技术栈、核心业务流程、目录结构、当前开发状态 |

## Architecture

| 文档 | 说明 |
|------|------|
| `architecture/bazi-system.md` | 八字命理计算引擎架构：tyme4ts/cantian-tymext 排盘流程、AI 工具调用、BaguaCard 渲染管线 |
| `architecture/chat-system.md` | 聊天系统架构：Vercel AI SDK 三层架构、消息发送/渲染流程、工具调用、防重复提交、IndexedDB 持久化 |
| `architecture/3d-model-system.md` | 3D 模型生成与查看架构：Tripo 异步任务管线、前端轮询、代理路由、分屏 ModelViewer 渲染 |
| `architecture/ui-component-system.md` | UI 组件体系架构：shadcn/ui 分层组件、OKLCH 主题系统、页面布局流 |
| `architecture/ai-elements-integration.md` | Vercel AI Elements 集成：第三方库原语、7 个本地封装组件、Streamdown/Shiki/Motion 集成、数据流 |

## Guides

| 文档 | 说明 |
|------|------|
| `guides/how-bazi-analysis-works.md` | 八字分析端到端流程与扩展方法 |
| `guides/how-chat-works.md` | 聊天系统操作指南：会话管理、添加新 AI 工具、消息持久化、3D 生成触发 |
| `guides/how-3d-generation-works.md` | 3D 模型生成流程、参数修改与 Tripo API 调试方法 |
| `guides/how-to-add-ui-components.md` | UI 组件开发指南：shadcn/ui 添加、主题适配、CVA 变体、文件组织 |

## Reference

| 文档 | 说明 |
|------|------|
| `reference/coding-conventions.md` | 编码规范：ESLint/TypeScript/pnpm/shadcn/CSS/组件编写模式 |
| `reference/git-conventions.md` | Git 规范：Conventional Commits 格式、分支策略、scope 对照表 |
| `reference/bazi-data-types.md` | 八字数据类型：BaziInput/BaziResult 类型层级、字段约束、源文件索引 |
