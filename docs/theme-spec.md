# 主题系统说明

> 日期：2026-02-11
> 状态：当前实现记录

## 概述

项目采用 **手动 class-based 暗色模式**，不依赖 `next-themes` 等第三方库。通过在 `<html>` 元素上切换 `.dark` class 来驱动主题变化，所有颜色通过 CSS 自定义属性（oklch 色彩空间）定义。

## 技术架构

| 项目 | 选择 |
|------|------|
| Tailwind 版本 | v4（无 tailwind.config，配置全在 CSS 中） |
| 暗色模式策略 | class-based（`.dark` on `<html>`） |
| 色彩空间 | oklch（感知均匀，现代浏览器原生支持） |
| 主色调 hue | 155（青瓷绿） |
| 持久化 | `localStorage` key `'theme'` |
| 系统偏好回退 | `prefers-color-scheme: dark` |
| 第三方主题库 | 无 |

## 切换机制

### 实现位置

主题切换逻辑位于 `components/chat/chat-input.tsx`，是组件内部 `useState` + `useEffect`。

### 初始化优先级

```
1. localStorage.getItem('theme') === 'dark'  →  暗色
2. localStorage 无值 && matchMedia('(prefers-color-scheme: dark)')  →  暗色
3. 其他  →  亮色
```

### 切换方式

```ts
document.documentElement.classList.toggle('dark', isDark)
localStorage.setItem('theme', isDark ? 'dark' : 'light')
```

### UI 控件

输入栏左侧 ghost 按钮，暗色显示 `Sun` 图标，亮色显示 `Moon` 图标（lucide-react）。

## Tailwind v4 配置

### dark variant 定义

```css
/* globals.css */
@custom-variant dark (&:is(.dark *));
```

Tailwind 的 `dark:` 前缀匹配 `.dark` class 的所有后代元素。

### 主题桥接

`@theme inline` 块将 CSS 自定义属性映射为 Tailwind 颜色 token，使 `bg-primary`、`text-foreground` 等 class 自动响应主题切换：

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... 完整映射见 globals.css */
}
```

## 色彩 Token

### 设计原则

- **亮色模式**：背景/文字/边框带微弱 hue 155 色调（chroma 0.005~0.02），整体偏暖绿
- **暗色模式**：背景/文字/边框为纯中性色（chroma 0），primary 提亮到 L=0.72
- **点缀色**：统一 hue 155，亮色 L=0.5 / 暗色 L=0.72
- **破坏色**：hue 25（红色调），亮色 L=0.55 / 暗色 L=0.65

### 核心 Token 对照表

| Token | 亮色 | 暗色 | 用途 |
|-------|------|------|------|
| `--background` | `oklch(0.98 0.005 155)` | `oklch(0.12 0 0)` | 页面背景 |
| `--foreground` | `oklch(0.2 0.02 155)` | `oklch(0.96 0 0)` | 主文字 |
| `--card` | `oklch(1 0 0)` | `oklch(0.16 0 0)` | 卡片背景 |
| `--card-foreground` | `oklch(0.2 0.02 155)` | `oklch(0.96 0 0)` | 卡片文字 |
| `--popover` | `oklch(1 0 0)` | `oklch(0.18 0 0)` | 弹层背景 |
| `--popover-foreground` | `oklch(0.2 0.02 155)` | `oklch(0.96 0 0)` | 弹层文字 |
| `--primary` | `oklch(0.5 0.12 155)` | `oklch(0.72 0.1 155)` | 主色/按钮/链接 |
| `--primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.15 0 0)` | 主色上文字 |
| `--secondary` | `oklch(0.94 0.01 155)` | `oklch(0.22 0 0)` | 次级背景 |
| `--secondary-foreground` | `oklch(0.3 0.05 155)` | `oklch(0.96 0 0)` | 次级文字 |
| `--muted` | `oklch(0.94 0.01 155)` | `oklch(0.22 0 0)` | 弱化背景 |
| `--muted-foreground` | `oklch(0.45 0.03 155)` | `oklch(0.65 0 0)` | 弱化文字 |
| `--accent` | `oklch(0.5 0.12 155 / 10%)` | `oklch(0.72 0.1 155 / 15%)` | 强调背景（半透明） |
| `--accent-foreground` | `oklch(0.4 0.1 155)` | `oklch(0.8 0.08 155)` | 强调文字 |
| `--destructive` | `oklch(0.55 0.22 25)` | `oklch(0.65 0.2 25)` | 错误/危险 |
| `--border` | `oklch(0.88 0.02 155)` | `oklch(1 0 0 / 10%)` | 边框 |
| `--input` | `oklch(0.92 0.01 155)` | `oklch(1 0 0 / 15%)` | 输入框边框/背景 |
| `--ring` | `oklch(0.5 0.12 155)` | `oklch(0.72 0.1 155)` | 焦点环 |

### 图表色板

| Token | 亮色 | 暗色 | Hue |
|-------|------|------|-----|
| `--chart-1` | `oklch(0.5 0.12 155)` | `oklch(0.72 0.1 155)` | 155 绿 |
| `--chart-2` | `oklch(0.55 0.15 180)` | `oklch(0.65 0.15 180)` | 180 青 |
| `--chart-3` | `oklch(0.5 0.12 200)` | `oklch(0.60 0.12 200)` | 200 蓝绿 |
| `--chart-4` | `oklch(0.55 0.1 220)` | `oklch(0.55 0.10 220)` | 220 蓝 |
| `--chart-5` | `oklch(0.5 0.08 240)` | `oklch(0.50 0.08 240)` | 240 靛蓝 |

### 侧栏 Token（预留）

| Token | 亮色 | 暗色 |
|-------|------|------|
| `--sidebar` | `oklch(0.96 0.008 155)` | `oklch(0.14 0 0)` |
| `--sidebar-foreground` | `oklch(0.2 0.02 155)` | `oklch(0.96 0 0)` |
| `--sidebar-primary` | `oklch(0.5 0.12 155)` | `oklch(0.72 0.1 155)` |
| `--sidebar-primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.15 0 0)` |
| `--sidebar-accent` | `oklch(0.92 0.015 155)` | `oklch(0.22 0 0)` |
| `--sidebar-accent-foreground` | `oklch(0.3 0.05 155)` | `oklch(0.96 0 0)` |
| `--sidebar-border` | `oklch(0.88 0.02 155)` | `oklch(1 0 0 / 10%)` |
| `--sidebar-ring` | `oklch(0.5 0.12 155)` | `oklch(0.72 0.1 155)` |

## 圆角系统

基础值 `--radius: 0.625rem`（10px），Tailwind 自动衍生：

| Token | 计算值 |
|-------|--------|
| `--radius-sm` | `calc(var(--radius) - 4px)` → 6px |
| `--radius-md` | `calc(var(--radius) - 2px)` → 8px |
| `--radius-lg` | `var(--radius)` → 10px |
| `--radius-xl` | `calc(var(--radius) + 4px)` → 14px |
| `--radius-2xl` | `calc(var(--radius) + 8px)` → 18px |
| `--radius-3xl` | `calc(var(--radius) + 12px)` → 22px |
| `--radius-4xl` | `calc(var(--radius) + 16px)` → 26px |

## 字体

| 变量 | 值 | 用途 |
|------|------|------|
| `--font-sans` | `var(--font-geist-sans)` | 正文（Tailwind 默认 sans） |
| `--font-mono` | `var(--font-geist-mono)` | 代码 |
| `--font-display` | `'Noto Serif SC', serif` | 标题/展示（自定义变量，需手动引用） |

> 注意：`layout.tsx` 实际加载的是 `Inter` 字体。`--font-geist-sans` / `--font-geist-mono` 目前未在 layout 中显式加载，依赖 Tailwind 或其他途径注入。

## 基础层样式

```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }
}
```

所有元素默认使用 `--border` 色边框和 `--ring` 色焦点轮廓（50% 透明度）。

## 组件中的主题适配方式

### 方式一：CSS 变量自动切换（推荐，多数组件）

直接使用语义 class 如 `bg-card`、`text-foreground`、`border-border`，主题切换时 CSS 变量自动更新，无需额外代码。

```tsx
// 示例：chat-message.tsx
<div className="bg-card text-foreground rounded-2xl px-4 py-3">
```

### 方式二：`dark:` 前缀覆盖（少数 shadcn/ui 组件）

当 CSS 变量不够精细时，使用 Tailwind `dark:` 前缀：

```tsx
// 示例：button.tsx
className="dark:bg-input/30 dark:hover:bg-input/50"
```

目前仅 `button.tsx`、`input.tsx`、`textarea.tsx`、`select.tsx` 使用了 `dark:` 前缀。

## 已知问题

### FOUC（主题闪烁）

当 `localStorage` 存储了 `'dark'` 时，页面首次加载会先以亮色渲染（因 `<html>` 上没有默认 `dark` class），待 `ChatInput` 的 `useEffect` 运行后才切换到暗色，产生一次从亮到暗的闪烁。

**解决方向**：在 `layout.tsx` 的 `<html>` 上添加 `suppressHydrationWarning`，并注入阻塞式 `<script>` 在水合前读取 localStorage 设置 class。

## 新组件开发指南

1. **颜色**：使用语义 token（`bg-background`、`text-primary`、`border-border`），不要硬编码颜色值
2. **暗色适配**：优先依赖 CSS 变量自动切换；仅在需要更精细控制时使用 `dark:` 前缀
3. **五行配色**：BaguaCard 等命理组件需要五行颜色时，建议基于以下 hue 扩展自定义 token：
   - 木 Wood → hue 155（绿） — 与 primary 同色系
   - 火 Fire → hue 25（红） — 与 destructive 同色系
   - 土 Earth → hue 85（黄）
   - 金 Metal → hue 60（金）或无 chroma（白/灰）
   - 水 Water → hue 240（蓝/黑）
4. **圆角**：使用 `rounded-lg`（10px）作为默认卡片圆角
5. **字体**：标题可用 `font-[var(--font-display)]` 引用衬线中文字体

## 文件索引

| 文件 | 内容 |
|------|------|
| `app/globals.css` | 全部主题变量定义、Tailwind 配置、基础层样式 |
| `components/chat/chat-input.tsx` | 主题切换逻辑（useState + localStorage + DOM classList） |
| `app/layout.tsx` | 根布局，字体加载 |
