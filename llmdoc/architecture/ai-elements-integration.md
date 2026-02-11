# Vercel AI Elements 集成架构

## 1. Identity

- **What it is:** `components/ai-elements/` 是基于 Vercel AI Elements 模式的**项目本地组件层**，不是 npm 包安装的组件。类似 shadcn/ui 的"复制到项目中定制"模式。
- **Purpose:** 将 AI SDK (`ai` + `@ai-sdk/react`) 提供的类型原语和 hook 转化为可视化的聊天 UI 组件。

## 2. 第三方库依赖关系

### 2.1 AI SDK 提供的原语（来自 `ai` 和 `@ai-sdk/react`）

| 原语 | 来源 | 用途 |
|------|------|------|
| `useChat` hook | `@ai-sdk/react` | 聊天状态管理、消息流、transport |
| `UIMessage` 类型 | `ai` | 消息数据结构（含 `parts` 数组） |
| `ChatStatus` 类型 | `ai` | 聊天状态：`submitted` / `streaming` / `ready` / `error` |
| `ToolUIPart` / `DynamicToolUIPart` | `ai` | 工具调用 part 的类型定义 |
| `FileUIPart` / `SourceDocumentUIPart` | `ai` | 附件和引用源 part 类型 |
| `DefaultChatTransport` | `@ai-sdk/react` | 自定义请求体（注入 pendingTaskId） |

### 2.2 其他关键第三方库

| 库 | 使用位置 | 作用 |
|---|---------|------|
| `streamdown` + `@streamdown/{cjk,code,math,mermaid}` | Message, Reasoning | 流式 Markdown 渲染，支持 CJK 排版、代码、公式、流程图 |
| `shiki` | CodeBlock | 异步语法高亮（github-light/dark 双主题） |
| `use-stick-to-bottom` | Conversation | 对话自动滚动到底部 |
| `motion/react` | Shimmer | 文本加载闪烁动画 |
| `@radix-ui/react-use-controllable-state` | Reasoning | 受控/非受控状态模式 |

## 3. 项目封装层（7 个组件）

### 3.1 组件清单

| 组件 | 文件 | 封装内容 |
|------|------|---------|
| **Conversation** | `components/ai-elements/conversation.tsx` | 基于 `use-stick-to-bottom` 封装对话容器，含 ScrollButton、EmptyState、Download 子组件 |
| **Message** | `components/ai-elements/message.tsx` | 消息展示系统，含 MessageResponse（Streamdown 渲染）、MessageBranch（分支导航）、MessageToolbar |
| **PromptInput** | `components/ai-elements/prompt-input.tsx` | 复合输入系统（~1340行），含附件管理、文件拖放、Provider 模式、Command 面板集成 |
| **Reasoning** | `components/ai-elements/reasoning.tsx` | 推理过程面板，基于 Collapsible，自动折叠/展开 + 时长计算 |
| **Tool** | `components/ai-elements/tool.tsx` | 工具调用展示，含 7 种状态徽章、参数/结果 JSON 展示 |
| **CodeBlock** | `components/ai-elements/code-block.tsx` | Shiki 异步高亮代码块，含 highlighter/token 缓存、复制按钮、语言选择器 |
| **Shimmer** | `components/ai-elements/shimmer.tsx` | Motion 驱动的文本闪烁加载效果 |

### 3.2 关键定制点

- **Reasoning 自动折叠：** 流式传输时自动展开，结束 1 秒后自动折叠（`AUTO_CLOSE_DELAY = 1000`），通过 `hasAutoClosed` 保证只触发一次。见 `reasoning.tsx:109-123`。
- **MessageResponse memo 优化：** 使用自定义比较函数 `prevProps.children === nextProps.children` 避免 Streamdown 重渲染。见 `message.tsx:338`。
- **CodeBlock 异步高亮：** 先显示原始文本（`createRawTokens`），Shiki 高亮完成后订阅回调更新。highlighter 和 token 均有模块级缓存。见 `code-block.tsx:124-237`。
- **PromptInput Provider 模式：** 支持 `PromptInputProvider` 提升状态到外部，也支持自管理模式（无 Provider 时组件内部管理状态）。见 `prompt-input.tsx:171-289`。
- **Tool 状态映射：** 7 种 AI SDK 工具状态到 UI 徽章的映射（`statusLabels` + `statusIcons`）。见 `tool.tsx:48-66`。

## 4. 集成数据流

```
useChat (hook)
  → UIMessage[] (含 parts 数组)
    → ChatMessage (路由器, chat-message.tsx)
      → part.type 分发:
        ├─ "text"      → MessageResponse (Streamdown 渲染)
        ├─ "reasoning"  → Reasoning (可折叠面板)
        ├─ "tool-analyzeBazi" (output-available)  → BaguaCard (业务组件)
        ├─ "tool-generateMascot" (output-available) → ModelPreview (业务组件)
        └─ "tool-*" (其他状态) → Tool (通用工具展示)

ChatStatus (from useChat)
  → PromptInputSubmit (控制按钮图标: 发送/加载/停止/错误)
  → Shimmer (streaming 时显示加载动画)
```

## 5. 与 shadcn/ui 的关系

AI Elements 组件**重度依赖**项目的 shadcn/ui 基础组件：
- `Collapsible` → Reasoning, Tool
- `Button` → Conversation (ScrollButton), Message (Actions), CodeBlock (Copy)
- `Badge` → Tool (状态徽章)
- `InputGroup` → PromptInput (输入容器)
- `Select` → PromptInput (模型选择), CodeBlock (语言选择)
- `Command` → PromptInput (命令面板)
- `DropdownMenu` → PromptInput (附件菜单)
- `HoverCard` → PromptInput
- `Tooltip` → Message (操作提示)
