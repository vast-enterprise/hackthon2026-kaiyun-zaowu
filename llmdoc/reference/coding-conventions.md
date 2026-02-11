# 编码规范参考

本文档提供项目编码规范的高层摘要与配置源指引。

## 1. 核心摘要

本项目使用 **Next.js (App Router) + React 19 + TypeScript strict** 技术栈，以 **pnpm** 管理依赖，采用 **@antfu/eslint-config** 统一代码风格，UI 层基于 **shadcn/ui (new-york 风格)** 和 **Tailwind CSS v4**，色彩体系使用 **OKLCH** 格式的 CSS 变量。

## 2. ESLint 配置

- 预设：`@antfu/eslint-config`，启用 `react: true`、`typescript: true`、`nextjs: true`
- 自定义规则：关闭 `node/prefer-global/process`
- 风格要点：无分号、单引号、2 空格缩进（antfu 默认）

**配置源：** `eslint.config.mjs`

## 3. TypeScript

- **严格模式**：`strict: true`
- 目标：ES2017，模块解析：`bundler`
- **路径别名**：`@/*` 映射到项目根目录 `"./*"`
- 启用 `incremental` 编译、`isolatedModules`

**配置源：** `tsconfig.json`

## 4. 包管理器

- 使用 **pnpm**（项目含 `pnpm-lock.yaml`）
- `.npmrc` 配置：`trust-policy=any`

**配置源：** `.npmrc`、`pnpm-lock.yaml`

## 5. shadcn/ui 规范

- 风格：**new-york**
- 启用 RSC（`rsc: true`）
- 图标库：**lucide**
- UI 组件使用 `data-slot` 属性标识语义角色
- 组件声明为普通 `function`（非 `export default`），文件末尾统一 `export { ... }`
- 路径别名：`@/components/ui`、`@/lib/utils`、`@/hooks`
- 样式合并工具：`cn()` 函数（`lib/utils.ts`，基于 `clsx` + `tailwind-merge`）

**配置源：** `components.json`

## 6. CSS / 样式约定

- **Tailwind CSS v4**：通过 `@tailwindcss/postcss` 插件集成
- 入口：`app/globals.css`，使用 `@import "tailwindcss"` + `@import "tw-animate-css"`
- 暗色模式：`@custom-variant dark (&:is(.dark *))`
- **色彩格式**：全部使用 OKLCH（如 `oklch(0.5 0.12 155)`）
- 设计令牌通过 CSS 变量定义（`--primary`、`--background` 等），`@theme inline` 桥接到 Tailwind
- 圆角基准：`--radius: 0.625rem`，派生 `sm/md/lg/xl` 等级

**配置源：** `app/globals.css`、`postcss.config.mjs`

## 7. 组件编写模式

- 客户端组件顶部标注 `'use client'`，未标注则为 RSC
- 状态管理：`zustand`（`stores/` 目录），`create<T>()` 泛型模式
- 组件使用函数声明 + props 解构，优先使用 `interface` 定义 props 类型
- 类型导入使用 `import type { ... }` 语法

**代码参考：**
- `components/chat/index.tsx` — 客户端组件典型写法
- `components/ui/resizable.tsx` — shadcn/ui 组件典型写法（`data-slot`、`cn()`、命名导出）
- `stores/chat-store.ts` — zustand store 典型写法
