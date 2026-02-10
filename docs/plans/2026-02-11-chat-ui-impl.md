# 聊天界面实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现可交互演示的聊天界面 MVP，使用假数据和流式 mock API

**Architecture:** 基于 Vercel AI Elements 构建聊天 UI，Zustand 管理状态，idb 持久化聊天记录。后端使用 mock 流式响应模拟真实 AI 对话。

**Tech Stack:** Next.js 16, AI Elements, Zustand, idb, Tailwind CSS, shadcn/ui

---

## Task 1: 安装依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 AI SDK 和 AI Elements**

```bash
pnpm add @ai-sdk/react ai
```

**Step 2: 安装 Zustand**

```bash
pnpm add zustand
```

**Step 3: 安装 idb**

```bash
pnpm add idb
```

**Step 4: 安装 AI Elements 组件**

```bash
npx ai-elements@latest add message conversation prompt-input reasoning loader
```

**Step 5: 验证安装**

```bash
pnpm lint
```
Expected: 无错误

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: add ai-sdk, zustand, idb dependencies and ai-elements components"
```

---

## Task 2: 更新主题色彩

**Files:**
- Modify: `app/globals.css`

**Step 1: 更新深色主题变量**

在 `app/globals.css` 的 `.dark` 块中，替换为青瓷绿主题：

```css
.dark {
  --background: oklch(0.12 0 0);
  --foreground: oklch(0.96 0 0);
  --card: oklch(0.16 0 0);
  --card-foreground: oklch(0.96 0 0);
  --popover: oklch(0.18 0 0);
  --popover-foreground: oklch(0.96 0 0);
  --primary: oklch(0.72 0.1 155);
  --primary-foreground: oklch(0.15 0 0);
  --secondary: oklch(0.22 0 0);
  --secondary-foreground: oklch(0.96 0 0);
  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.65 0 0);
  --accent: oklch(0.72 0.1 155 / 15%);
  --accent-foreground: oklch(0.8 0.08 155);
  --destructive: oklch(0.65 0.2 25);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.72 0.1 155);
  --chart-1: oklch(0.72 0.1 155);
  --chart-2: oklch(0.65 0.15 180);
  --chart-3: oklch(0.60 0.12 200);
  --chart-4: oklch(0.55 0.10 220);
  --chart-5: oklch(0.50 0.08 240);
  --sidebar: oklch(0.14 0 0);
  --sidebar-foreground: oklch(0.96 0 0);
  --sidebar-primary: oklch(0.72 0.1 155);
  --sidebar-primary-foreground: oklch(0.15 0 0);
  --sidebar-accent: oklch(0.22 0 0);
  --sidebar-accent-foreground: oklch(0.96 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.72 0.1 155);
}
```

**Step 2: 添加标题字体变量**

在 `:root` 块中添加：

```css
:root {
  /* 现有变量... */
  --font-display: 'Noto Serif SC', serif;
}
```

**Step 3: 强制深色模式（临时）**

在 `app/layout.tsx` 的 `<html>` 标签添加 `className="dark"`。

**Step 4: 验证**

```bash
pnpm dev
```

打开浏览器确认深色主题生效。

**Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: update dark theme with celadon green accent"
```

---

## Task 3: 创建 Zustand Store

**Files:**
- Create: `stores/chat-store.ts`

**Step 1: 创建 store 目录和文件**

```ts
// stores/chat-store.ts
import { create } from 'zustand'

export type Phase = 'chat' | 'split'

interface ChatState {
  phase: Phase
  modelUrl: string | null
  setPhase: (phase: Phase) => void
  setModelUrl: (url: string) => void
  reset: () => void
}

export const useChatStore = create<ChatState>(set => ({
  phase: 'chat',
  modelUrl: null,
  setPhase: phase => set({ phase }),
  setModelUrl: url => set({ modelUrl: url, phase: 'split' }),
  reset: () => set({ phase: 'chat', modelUrl: null }),
}))
```

**Step 2: 验证类型**

```bash
pnpm lint
```

Expected: 无错误

**Step 3: Commit**

```bash
git add stores/chat-store.ts
git commit -m "feat: add zustand chat store for phase and model state"
```

---

## Task 4: 创建 Mock 流式 API

**Files:**
- Modify: `app/api/chat/route.ts`

**Step 1: 实现 mock 流式响应**

```ts
// app/api/chat/route.ts
import type { NextRequest } from 'next/server'

const MOCK_RESPONSES = [
  {
    thinking: '让我分析一下您的出生日期...\n\n根据八字理论，我需要将公历日期转换为农历，然后计算天干地支...',
    text: '根据您提供的信息，我来为您分析八字：\n\n**您的八字排盘**\n- 年柱：甲子\n- 月柱：丙寅\n- 日柱：戊辰\n- 时柱：壬午\n\n**五行分析**\n您的八字中木、火较旺，土为日主，整体格局偏向「食神生财」。\n\n您希望我为您生成一个什么样的吉祥物呢？可以告诉我您的偏好，比如：\n- 动物类（龙、凤、麒麟等）\n- 植物类（莲花、竹子等）\n- 抽象类（祥云、如意等）',
  },
  {
    thinking: '用户想要一个龙形吉祥物，结合他的八字特点，我来设计一个适合的造型...',
    text: '好的！基于您的八字特点，我为您设计了一个**祥龙献瑞**吉祥物：\n\n🐉 **设计理念**\n- 龙身环绕祥云，象征腾飞\n- 龙爪握宝珠，寓意财运亨通\n- 底座为莲花，取「和谐」之意\n\n正在为您生成 3D 模型，请稍候...',
    toolCall: {
      name: 'generate_3d_model',
      status: 'calling',
    },
  },
  {
    text: '✨ **3D 模型生成完成！**\n\n您的专属吉祥物已经准备好了，可以在右侧查看和旋转模型。\n\n如果满意，可以点击「下单打印」将它变成实物！',
    toolCall: {
      name: 'generate_3d_model',
      status: 'complete',
      result: 'https://example.com/model.glb',
    },
    modelReady: true,
  },
]

let responseIndex = 0

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const isFirstMessage = messages.length <= 1

  // 根据对话轮次选择响应
  const mockResponse = MOCK_RESPONSES[Math.min(responseIndex, MOCK_RESPONSES.length - 1)]
  responseIndex = isFirstMessage ? 0 : responseIndex + 1

  // 创建流式响应
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // 发送思考过程
      if (mockResponse.thinking) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'reasoning',
          content: mockResponse.thinking,
        })}\n\n`))
        await delay(500)
      }

      // 发送工具调用状态
      if (mockResponse.toolCall?.status === 'calling') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'tool-call',
          name: mockResponse.toolCall.name,
          status: 'calling',
        })}\n\n`))
        await delay(300)
      }

      // 流式发送文本
      const chars = mockResponse.text.split('')
      for (const char of chars) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'text-delta',
          content: char,
        })}\n\n`))
        await delay(20)
      }

      // 发送工具调用完成
      if (mockResponse.toolCall?.status === 'complete') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'tool-call',
          name: mockResponse.toolCall.name,
          status: 'complete',
          result: mockResponse.toolCall.result,
        })}\n\n`))
      }

      // 发送模型就绪信号
      if (mockResponse.modelReady) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'model-ready',
          url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        })}\n\n`))
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add mock streaming chat API with reasoning and tool calls"
```

---

## Task 5: 创建聊天 Hook

**Files:**
- Create: `hooks/use-mock-chat.ts`

**Step 1: 创建自定义聊天 hook**

```ts
// hooks/use-mock-chat.ts
'use client'

import { useCallback, useState } from 'react'
import { useChatStore } from '@/stores/chat-store'

export interface MessagePart {
  type: 'text' | 'reasoning' | 'tool-call'
  content?: string
  name?: string
  status?: 'calling' | 'complete' | 'error'
  result?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  parts: MessagePart[]
  createdAt: Date
}

export function useMockChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const setModelUrl = useChatStore(state => state.setModelUrl)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      parts: [{ type: 'text', content }],
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      parts: [],
      createdAt: new Date(),
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let textContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)

            setMessages(prev => {
              const updated = [...prev]
              const lastMsg = updated[updated.length - 1]
              if (lastMsg.role !== 'assistant') return prev

              if (parsed.type === 'text-delta') {
                textContent += parsed.content
                lastMsg.content = textContent
                const textPartIndex = lastMsg.parts.findIndex(p => p.type === 'text')
                if (textPartIndex >= 0) {
                  lastMsg.parts[textPartIndex].content = textContent
                } else {
                  lastMsg.parts.push({ type: 'text', content: textContent })
                }
              } else if (parsed.type === 'reasoning') {
                lastMsg.parts = [
                  { type: 'reasoning', content: parsed.content },
                  ...lastMsg.parts.filter(p => p.type !== 'reasoning'),
                ]
              } else if (parsed.type === 'tool-call') {
                const existingIndex = lastMsg.parts.findIndex(
                  p => p.type === 'tool-call' && p.name === parsed.name
                )
                const toolPart: MessagePart = {
                  type: 'tool-call',
                  name: parsed.name,
                  status: parsed.status,
                  result: parsed.result,
                }
                if (existingIndex >= 0) {
                  lastMsg.parts[existingIndex] = toolPart
                } else {
                  lastMsg.parts.push(toolPart)
                }
              } else if (parsed.type === 'model-ready') {
                setModelUrl(parsed.url)
              }

              return updated
            })
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, setModelUrl])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  const reload = useCallback(() => {
    // TODO: implement regenerate
  }, [])

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    reload,
  }
}
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: Commit**

```bash
git add hooks/use-mock-chat.ts
git commit -m "feat: add useMockChat hook for streaming chat with parts"
```

---

## Task 6: 创建聊天消息组件

**Files:**
- Create: `components/chat/chat-message.tsx`
- Create: `components/chat/reasoning-block.tsx`
- Create: `components/chat/tool-status.tsx`

**Step 1: 创建思考折叠组件**

```tsx
// components/chat/reasoning-block.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReasoningBlockProps {
  content: string
  isStreaming?: boolean
}

export function ReasoningBlock({ content, isStreaming = false }: ReasoningBlockProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming)

  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Brain className="size-4" />
        <span>{isStreaming ? '思考中...' : '思考过程'}</span>
        {isExpanded ? (
          <ChevronDown className="ml-auto size-4" />
        ) : (
          <ChevronRight className="ml-auto size-4" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="border-t border-border px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: 创建工具状态组件**

```tsx
// components/chat/tool-status.tsx
'use client'

import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolStatusProps {
  name: string
  status: 'calling' | 'complete' | 'error'
  result?: string
}

const TOOL_LABELS: Record<string, string> = {
  generate_3d_model: '生成 3D 模型',
  analyze_bazi: '分析八字',
}

export function ToolStatus({ name, status, result }: ToolStatusProps) {
  const label = TOOL_LABELS[name] || name

  return (
    <div
      className={cn(
        'mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        status === 'calling' && 'border-primary/50 bg-primary/5',
        status === 'complete' && 'border-green-500/50 bg-green-500/5',
        status === 'error' && 'border-destructive/50 bg-destructive/5'
      )}
    >
      {status === 'calling' && (
        <Loader2 className="size-4 animate-spin text-primary" />
      )}
      {status === 'complete' && (
        <CheckCircle className="size-4 text-green-500" />
      )}
      {status === 'error' && (
        <AlertCircle className="size-4 text-destructive" />
      )}
      <span>
        {status === 'calling' && `正在${label}...`}
        {status === 'complete' && `${label}完成`}
        {status === 'error' && `${label}失败`}
      </span>
      {result && status === 'complete' && (
        <span className="ml-auto text-xs text-muted-foreground">
          查看结果 →
        </span>
      )}
    </div>
  )
}
```

**Step 3: 创建消息组件**

```tsx
// components/chat/chat-message.tsx
'use client'

import { Copy, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ReasoningBlock } from './reasoning-block'
import { ToolStatus } from './tool-status'
import type { Message } from '@/hooks/use-mock-chat'

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
  onRegenerate?: () => void
}

export function ChatMessage({ message, isStreaming, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
  }

  return (
    <div
      className={cn(
        'group mb-4',
        isUser && 'flex justify-end'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        )}
      >
        {!isUser && message.parts.map((part, index) => {
          if (part.type === 'reasoning' && part.content) {
            return (
              <ReasoningBlock
                key={`reasoning-${index}`}
                content={part.content}
                isStreaming={isStreaming}
              />
            )
          }
          if (part.type === 'tool-call' && part.name && part.status) {
            return (
              <ToolStatus
                key={`tool-${index}`}
                name={part.name}
                status={part.status}
                result={part.result}
              />
            )
          }
          return null
        })}

        <div className="whitespace-pre-wrap">{message.content}</div>

        {!isUser && message.content && !isStreaming && (
          <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={handleCopy}
            >
              <Copy className="size-3.5" />
            </Button>
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={onRegenerate}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 4: 验证**

```bash
pnpm lint
```

**Step 5: Commit**

```bash
git add components/chat/
git commit -m "feat: add chat message components with reasoning and tool status"
```

---

## Task 7: 创建聊天输入组件

**Files:**
- Create: `components/chat/chat-input.tsx`

**Step 1: 创建输入组件**

```tsx
// components/chat/chat-input.tsx
'use client'

import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e?: React.FormEvent) => void
  isLoading?: boolean
}

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入您的出生日期，开始八字分析..."
        className="min-h-[44px] max-h-32 resize-none"
        rows={1}
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || isLoading}
        className="shrink-0"
      >
        <Send className="size-4" />
      </Button>
    </form>
  )
}
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: Commit**

```bash
git add components/chat/chat-input.tsx
git commit -m "feat: add chat input component"
```

---

## Task 8: 创建聊天空状态组件

**Files:**
- Create: `components/chat/chat-empty.tsx`

**Step 1: 创建空状态组件**

```tsx
// components/chat/chat-empty.tsx
'use client'

import { Sparkles } from 'lucide-react'

export function ChatEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      <Sparkles className="mb-4 size-12 text-primary/50" />
      <p className="text-lg">开始对话，输入你的出生日期</p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/chat/chat-empty.tsx
git commit -m "feat: add chat empty state component"
```

---

## Task 9: 重构聊天主组件

**Files:**
- Modify: `components/chat/index.tsx`

**Step 1: 重构 Chat 组件**

```tsx
// components/chat/index.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useMockChat } from '@/hooks/use-mock-chat'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatEmpty } from './chat-empty'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatProps {
  onModelReady?: (modelUrl: string) => void
}

export function Chat({ onModelReady: _onModelReady }: ChatProps) {
  const { messages, input, setInput, isLoading, handleSubmit, reload } = useMockChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <ChatEmpty />
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={isLoading && index === messages.length - 1}
              onRegenerate={message.role === 'assistant' ? reload : undefined}
            />
          ))
        )}
      </ScrollArea>
      <div className="border-t border-border p-4">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: Commit**

```bash
git add components/chat/index.tsx
git commit -m "feat: refactor Chat component with message list and input"
```

---

## Task 10: 更新主页面使用 Zustand

**Files:**
- Modify: `app/page.tsx`

**Step 1: 重构页面使用 store**

```tsx
// app/page.tsx
'use client'

import { Chat } from '@/components/chat'
import { ModelViewer } from '@/components/model-viewer'
import { OrderModal } from '@/components/order-modal'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat-store'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function Home() {
  const { phase, modelUrl } = useChatStore()
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  return (
    <main className="flex h-screen">
      <div
        className={cn(
          'transition-all duration-400 ease-out',
          phase === 'chat' ? 'w-full' : 'w-[40%] border-r border-border'
        )}
      >
        <Chat />
      </div>

      {phase === 'split' && modelUrl && (
        <div className="relative w-[60%]">
          <ModelViewer modelUrl={modelUrl} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button size="lg" onClick={() => setOrderModalOpen(true)}>
              下单打印
            </Button>
          </div>
        </div>
      )}

      <OrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        modelUrl={modelUrl || ''}
      />
    </main>
  )
}
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update Home page to use Zustand store for phase management"
```

---

## Task 11: 更新 ModelViewer 占位组件

**Files:**
- Modify: `components/model-viewer/index.tsx`

**Step 1: 添加基础 3D 查看器**

```tsx
// components/model-viewer/index.tsx
'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei'

interface ModelViewerProps {
  modelUrl: string
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export function ModelViewer({ modelUrl }: ModelViewerProps) {
  return (
    <div className="h-full w-full bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Suspense fallback={null}>
          <Center>
            <Model url={modelUrl} />
          </Center>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
    </div>
  )
}
```

**Step 2: 验证**

```bash
pnpm lint
```

**Step 3: Commit**

```bash
git add components/model-viewer/index.tsx
git commit -m "feat: implement ModelViewer with react-three-fiber"
```

---

## Task 12: 端到端测试

**Step 1: 启动开发服务器**

```bash
pnpm dev
```

**Step 2: 手动测试流程**

1. 打开 `http://localhost:3000`
2. 确认深色主题 + 青瓷绿点缀生效
3. 看到空状态提示
4. 输入 "我是 1990 年 2 月 15 日出生的" 并发送
5. 确认看到思考过程折叠块
6. 确认文字流式显示
7. 再次输入 "我想要一个龙形吉祥物"
8. 确认看到工具调用状态
9. 输入任意内容触发第三轮
10. 确认布局切换到分屏
11. 确认 3D 模型显示

**Step 3: Commit 最终状态**

```bash
git add -A
git commit -m "feat: complete chat UI MVP with mock streaming API"
```

---

## 完成标准

- [ ] 深色主题 + 青瓷绿点缀正确显示
- [ ] 空状态显示提示文字
- [ ] 消息流式输出（逐字显示）
- [ ] 思考过程折叠/展开正常
- [ ] 工具调用状态显示正常
- [ ] 消息复制按钮工作
- [ ] 布局从全屏切换到分屏
- [ ] 3D 模型正确加载和显示
- [ ] 可旋转查看模型
