# 如何添加和开发 UI 组件

面向项目开发者的 UI 组件开发指南，涵盖 shadcn/ui 组件添加、主题适配和文件组织规范。

1. **添加 shadcn/ui 标准组件:** 运行 `npx shadcn@latest add <component-name>`。组件会按 `components.json` 配置生成到 `components/ui/` 目录，自动使用 new-york 风格和 CSS 变量模式。生成后务必检查组件是否已添加 `data-slot` 属性（当前所有组件均已统一添加）。

2. **使用主题色彩 Token:** 始终使用语义化 Tailwind class 引用颜色（如 `bg-background`、`text-primary`、`border-border`），不要硬编码颜色值。所有语义 token 定义在 `app/globals.css:49-117`，通过 `@theme inline` 桥接为 Tailwind token（`app/globals.css:6-47`）。完整 token 对照表见 `docs/theme-spec.md:79-100`。

3. **适配深色模式:** 优先依赖 CSS 变量自动切换（多数场景已足够）。仅在需要更精细控制时使用 `dark:` 前缀覆盖。目前仅 `button.tsx`、`input.tsx`、`textarea.tsx`、`select.tsx` 使用了 `dark:` 前缀，参考 `docs/theme-spec.md:162-181`。

4. **使用样式变体(CVA)模式:** 需要多变体的组件应使用 `class-variance-authority`（CVA）定义变体。参考 `components/ui/button.tsx:7-38`（`buttonVariants`）中 6 种 variant + 7 种 size 的实现。所有 className 合并使用 `cn()` 工具函数（`lib/utils.ts`）。

5. **遵循组件设计模式:**
   - **简单组件:** 单函数导出 + `data-slot` 属性 + `cn()` className 合并，参考 `components/ui/separator.tsx`。
   - **复合组件:** 拆分为多个子组件独立导出（如 Dialog = Dialog + DialogTrigger + DialogContent + DialogHeader + ...），参考 `components/ui/dialog.tsx`。
   - **多态组件:** 使用 Radix `Slot` 实现 `asChild` 模式，允许自定义渲染元素，参考 `components/ui/button.tsx:41-62`。

6. **文件组织规范:**
   - `components/ui/`: 仅放置无业务逻辑的基础 UI 组件（可跨项目复用）。
   - `components/<feature>/`: 包含业务逻辑的功能组件（如 `sidebar/`、`chat/`、`order-modal/`），每个目录包含 `index.tsx` 作为入口。
   - `components/ai-elements/`: AI 聊天专用组件，与 Vercel AI SDK 类型耦合。
   - 组件文件名使用 kebab-case（如 `button-group.tsx`、`hover-card.tsx`）。

7. **移动端响应式适配:** 项目使用单一断点 768px（Tailwind `md:`）区分手机端和平板/桌面端。关键开发规范：
   - **JS 检测:** 使用 `useMobile()` hook（`hooks/use-mobile.ts`）获取 `isMobile` 布尔值，用于条件渲染不同布局（如 `app/page.tsx:35` 的三元判断）。
   - **CSS 前缀:** 使用 `md:` 前缀为平板/桌面端覆盖样式。移动端样式写在前（默认），桌面端样式用 `md:` 前缀覆盖。示例：`p-2 md:p-4`（`components/chat/index.tsx:62`）、`gap-2 md:gap-3`（`components/chat/bagua-card.tsx:108`）。
   - **安全区域:** 对紧贴屏幕顶部/底部的元素添加 `safe-area-top` / `safe-area-bottom` 类（定义在 `app/globals.css:132-140`），支持 iOS 刘海屏和底部横条。
   - **侧边栏:** 手机端通过 `useChatStore().setSidebarOpen` 控制侧边栏抽屉的显隐，`Sidebar` 组件已内置双模式切换逻辑（`components/sidebar/index.tsx`）。
   - **覆盖层模式:** 手机端不使用 ResizablePanel 分栏，改用 fixed 全屏覆盖层（参考 `app/page.tsx:62-79` 的 3D 模型覆盖层实现）。

8. **验证:** 运行 `pnpm dev` 启动开发服务器，在浏览器中检查组件在浅色和深色模式下的表现。使用浏览器 DevTools 搜索 `data-slot` 属性确认组件标识正确。使用 DevTools 设备模拟模式验证移动端布局（建议测试 375px / 768px / 1024px 三个宽度）。
