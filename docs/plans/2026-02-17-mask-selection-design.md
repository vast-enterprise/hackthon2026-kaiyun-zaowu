# 面具选择功能设计

## 概述

为对话 Agent 新增「面具」（角色预设）功能，允许用户在 5 个预设角色中切换，改变 AI 的对话风格和语气。面具只影响对话 Agent 的 system prompt 中「你是谁」段落，不影响分析 Agent 的行为。

## 面具角色列表

| ID | 名称 | 图标 | 风格 |
|----|------|------|------|
| `default` | 命理助手 | 🎯 | 现代、清晰、友好，专业但平易近人 |
| `blunt` | 毒舌大师 | 🗡️ | 铁口直断，犀利直白，不说废话 |
| `warm` | 知心姐姐 | 🌸 | 温暖治愈，正面引导，语气亲切 |
| `rational` | 理性派 | 🧠 | 冷静分析，少用玄学用语，逻辑驱动 |
| `chameleon` | 千面师 | 🎭 | 根据命盘推断用户性格，自动适配语言风格 |

## 数据模型

### Mask 类型（`lib/masks.ts`）

```typescript
interface Mask {
  id: string           // 唯一标识
  name: string         // 显示名称
  description: string  // 一句话描述
  icon: string         // emoji 图标
  promptOverride: string // 替换 systemPrompt 中「你是谁」段落的内容
}

const MASKS: Mask[] = [...]  // 静态常量数组
```

### prompt 替换策略

当前 `systemPrompt` 结构：
```
## 你是谁           ← 面具只替换这一段
## 怎么做事         ← 保持不变
## 八字解读         ← 保持不变
## 吉祥物设计       ← 保持不变
## 工具使用         ← 保持不变
```

实现方式：将 systemPrompt 拆分为 `identityPrompt`（面具提供）和 `behaviorPrompt`（固定不变），运行时拼接。

## 状态管理与持久化

### Zustand store 变更（`stores/chat-store.ts`）

新增字段：
- `maskId: string`（默认 `'default'`）
- `setMaskId: (id: string) => void`

注意：`reset()` 不重置 maskId，因为它是用户的主动偏好。

### Session 持久化

`Session` 对象新增 `maskId?: string` 字段。IndexedDB 无需升级 DB_VERSION（新字段可选，旧数据兼容）。

### Transport 传递

`DefaultChatTransport` 的 `body()` 新增 `maskId`：

```typescript
body: () => ({
  pendingTaskId: useChatStore.getState().pendingTaskId ?? undefined,
  analysisNote: useChatStore.getState().analysisNote ?? undefined,
  maskId: useChatStore.getState().maskId,
})
```

### 服务端处理（`app/api/chat/route.ts`）

```typescript
const { messages, pendingTaskId, analysisNote, maskId } = await req.json()
const mask = getMaskById(maskId ?? 'default')
const system = mask.promptOverride + behaviorPrompt + analysisContext + pendingContext + timeContext
```

## UI 设计

### 1. 输入框旁面具切换按钮

位置：`PromptInputFooter` 左侧（替换当前空 `<div />`）

组件：`components/chat/mask-selector.tsx`

交互：
- 显示当前面具的 emoji 图标按钮
- 点击弹出 Popover，展示面具列表（图标 + 名称 + 描述）
- 当前面具高亮显示
- 点击即切换，即时生效

### 2. 新会话空状态引导

位置：替换 `ConversationEmptyState`

展示：卡片网格，每张卡片包含：
- emoji 图标（大号）
- 面具名称
- 一句话描述

交互：
- 点击卡片选择面具（高亮）
- 默认预选「命理助手」
- 选中后在输入框输入即开始对话

## 涉及文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `lib/masks.ts` | **新建** | 面具定义、类型、辅助函数 |
| `stores/chat-store.ts` | 修改 | 新增 maskId / setMaskId |
| `hooks/use-chat-session.ts` | 修改 | Transport body 新增 maskId、Session 保存/恢复 maskId |
| `app/api/chat/route.ts` | 修改 | 解构 maskId、拆分 systemPrompt、拼装 |
| `components/chat/mask-selector.tsx` | **新建** | Popover 面具选择器 |
| `components/chat/index.tsx` | 修改 | 空状态引导 + 接入 MaskSelector |
| `lib/persistence/chat-db.ts` | 修改 | Session 类型新增 maskId 字段 |
