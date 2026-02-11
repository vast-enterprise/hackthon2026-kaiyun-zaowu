# 前端组件补全 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补全前端缺失组件（BaguaCard、ModelPreview、消息重新生成、IndexedDB 持久化、侧边栏），使产品主流程完整可用。

**Architecture:** 扩展现有 tool-call 渲染层，在 ChatMessage 中根据 tool name 分发渲染 BaguaCard / ModelPreview。新建 IndexedDB 持久化层和侧边栏组件，将主题切换从 ChatInput 迁移到侧边栏。

**Tech Stack:** React 19, Next.js 16, Tailwind v4 (oklch), Zustand 5, idb 8, Vitest 4, lucide-react

**Design Doc:** `docs/plans/2026-02-11-frontend-components-design.md`

**Theme Spec:** `docs/theme-spec.md`

---

## Task 1: BaguaCard — 五行色工具函数

**Files:**
- Create: `lib/bazi/colors.ts`
- Create: `lib/bazi/__tests__/colors.test.ts`

**Step 1: Write the failing test**

```ts
// lib/bazi/__tests__/colors.test.ts
import { describe, expect, it } from 'vitest'
import { getWuXingColor } from '../colors'

describe('getWuXingColor', () => {
  it('returns green for 木', () => {
    expect(getWuXingColor('木')).toBe('oklch(0.55 0.15 155)')
  })

  it('returns red for 火', () => {
    expect(getWuXingColor('火')).toBe('oklch(0.55 0.18 25)')
  })

  it('returns yellow for 土', () => {
    expect(getWuXingColor('土')).toBe('oklch(0.6 0.14 85)')
  })

  it('returns gold for 金', () => {
    expect(getWuXingColor('金')).toBe('oklch(0.7 0.1 60)')
  })

  it('returns blue for 水', () => {
    expect(getWuXingColor('水')).toBe('oklch(0.5 0.14 240)')
  })

  it('returns muted-foreground for unknown', () => {
    expect(getWuXingColor('?')).toBe('oklch(0.65 0 0)')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/bazi/__tests__/colors.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
// lib/bazi/colors.ts
const WU_XING_COLORS: Record<string, string> = {
  木: 'oklch(0.55 0.15 155)',
  火: 'oklch(0.55 0.18 25)',
  土: 'oklch(0.6 0.14 85)',
  金: 'oklch(0.7 0.1 60)',
  水: 'oklch(0.5 0.14 240)',
}

const FALLBACK = 'oklch(0.65 0 0)'

export function getWuXingColor(wuXing: string): string {
  return WU_XING_COLORS[wuXing] ?? FALLBACK
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/bazi/__tests__/colors.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/bazi/colors.ts lib/bazi/__tests__/colors.test.ts
git commit -m "feat(bazi): add five elements color mapping"
```

---

## Task 2: BaguaCard — 精简层组件

**Files:**
- Create: `components/chat/bagua-card.tsx`

**Context:**
- Data shape: `{ success: true, data: BaziResult }` where `BaziResult` is from `lib/bazi/types.ts`
- `BaziResult.fourPillars` has `year`, `month`, `day`, `hour` each with `tianGan.name`, `tianGan.wuXing`, `diZhi.name`, `diZhi.wuXing`
- `BaziResult.fiveElements` has `wood`, `fire`, `earth`, `metal`, `water` (numbers)
- `BaziResult.dayMaster` is the day stem e.g. "壬水"
- `BaziResult.zodiac` e.g. "龙"
- `BaziResult.bazi` e.g. "壬辰 甲午 丙寅 庚子"

**Step 1: Create the BaguaCard component**

```tsx
// components/chat/bagua-card.tsx
'use client'

import type { BaziResult, Pillar } from '@/lib/bazi/types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { getWuXingColor } from '@/lib/bazi/colors'
import { cn } from '@/lib/utils'

interface BaguaCardProps {
  data: BaziResult
}

const WU_XING_LABELS: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
}

function PillarColumn({ pillar, label, isMain }: { pillar: Pillar, label: string, isMain?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center gap-1', isMain && 'relative')}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div
        className={cn(
          'flex flex-col items-center rounded-lg border px-3 py-2 min-w-[3.5rem]',
          isMain ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
        )}
      >
        <span
          className="text-lg font-bold"
          style={{ color: getWuXingColor(pillar.tianGan.wuXing) }}
        >
          {pillar.tianGan.name}
        </span>
        <span
          className="text-lg"
          style={{ color: getWuXingColor(pillar.diZhi.wuXing) }}
        >
          {pillar.diZhi.name}
        </span>
      </div>
      {pillar.tianGan.shiShen && (
        <span className="text-[10px] text-muted-foreground">{pillar.tianGan.shiShen}</span>
      )}
    </div>
  )
}

function FiveElementsBar({ elements }: { elements: BaziResult['fiveElements'] }) {
  const entries = Object.entries(elements) as [keyof typeof WU_XING_LABELS, number][]
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div className="space-y-1.5">
      {entries.map(([key, count]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span
            className="w-4 text-center font-medium"
            style={{ color: getWuXingColor(WU_XING_LABELS[key]) }}
          >
            {WU_XING_LABELS[key]}
          </span>
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: getWuXingColor(WU_XING_LABELS[key]),
              }}
            />
          </div>
          <span className="w-4 text-right text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  )
}

export function BaguaCard({ data }: BaguaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const pillars: { pillar: Pillar, label: string, isMain?: boolean }[] = [
    { pillar: data.fourPillars.year, label: '年柱' },
    { pillar: data.fourPillars.month, label: '月柱' },
    { pillar: data.fourPillars.day, label: '日柱', isMain: true },
    { pillar: data.fourPillars.hour, label: '时柱' },
  ]

  return (
    <div className="mb-3 rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold font-[var(--font-display)]">八字命盘</h3>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? '收起' : '展开详情'}
          {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
      </div>

      {/* Four Pillars */}
      <div className="mb-4 flex justify-center gap-3">
        {pillars.map(p => (
          <PillarColumn key={p.label} {...p} />
        ))}
      </div>

      {/* Five Elements Bar */}
      <div className="mb-3">
        <FiveElementsBar elements={data.fiveElements} />
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">
        日主 {data.dayMaster} · 属{data.zodiac} · {data.bazi}
      </p>

      {/* Expanded Details */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          expanded ? 'mt-4 max-h-[800px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="space-y-3 border-t border-border pt-3">
          {/* Hidden Stems */}
          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">藏干</h4>
            <div className="space-y-0.5 text-xs">
              {(['year', 'month', 'day', 'hour'] as const).map(key => (
                <div key={key} className="flex gap-2">
                  <span className="w-8 text-muted-foreground">
                    {{ year: '年', month: '月', day: '日', hour: '时' }[key]}:
                  </span>
                  <span>
                    {data.fourPillars[key].diZhi.cangGan
                      .map(cg => `${cg.name}(${cg.shiShen})`)
                      .join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Na Yin */}
          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">纳音</h4>
            <p className="text-xs">
              {(['year', 'month', 'day', 'hour'] as const)
                .map(key => `${{ year: '年', month: '月', day: '日', hour: '时' }[key]}: ${data.fourPillars[key].naYin}`)
                .join('  ')}
            </p>
          </div>

          {/* Gods */}
          {data.gods && data.gods.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">神煞</h4>
              <p className="text-xs">
                {data.gods.flat().join(' · ')}
              </p>
            </div>
          )}

          {/* Decade Fortunes */}
          {data.decadeFortunes && data.decadeFortunes.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                大运（{data.decadeFortunes.length}步）
              </h4>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {data.decadeFortunes.map(df => (
                  <span key={df.ganZhi}>
                    {df.ganZhi}({df.startAge}-{df.endAge})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/chat/bagua-card.tsx
git commit -m "feat(chat): add BaguaCard component with expandable details"
```

---

## Task 3: BaguaCard — 接入 ChatMessage 渲染

**Files:**
- Modify: `components/chat/chat-message.tsx:38-58`

**Step 1: Update ChatMessage to render BaguaCard for analyzeBazi tool**

In `components/chat/chat-message.tsx`, add the import at the top (after existing imports):

```ts
import { BaguaCard } from './bagua-card'
```

Replace the tool-call rendering block (lines 48-56):

```tsx
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
```

With:

```tsx
          if (part.type === 'tool-call' && part.name && part.status) {
            // Render BaguaCard for completed analyzeBazi
            if (part.name === 'analyzeBazi' && part.status === 'complete' && part.result) {
              try {
                const parsed = JSON.parse(part.result)
                if (parsed.success && parsed.data) {
                  return <BaguaCard key={`tool-${index}`} data={parsed.data} />
                }
              }
              catch { /* fall through to ToolStatus */ }
            }
            return (
              <ToolStatus
                key={`tool-${index}`}
                name={part.name}
                status={part.status}
                result={part.result}
              />
            )
          }
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Manual test**

Run: `pnpm dev`
Open http://localhost:3000, send a birth date message (e.g. "我是 1990 年 6 月 15 日 14 点出生的男性").
Expected: After `analyzeBazi` tool completes, a BaguaCard renders with four pillars, five elements bar, and expandable details.

**Step 4: Commit**

```bash
git add components/chat/chat-message.tsx
git commit -m "feat(chat): render BaguaCard for analyzeBazi tool results"
```

---

## Task 4: ModelPreview — 后端补充 renderedImage

**Files:**
- Modify: `app/api/chat/route.ts:55-58`

**Step 1: Add renderedImage to generateMascot return**

In `app/api/chat/route.ts`, replace lines 55-58:

```ts
      return {
        success: true,
        modelUrl: result.output?.model,
        taskId,
      }
```

With:

```ts
      return {
        success: true,
        modelUrl: result.output?.model,
        renderedImage: result.output?.rendered_image,
        taskId,
      }
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(api): return renderedImage from generateMascot tool"
```

---

## Task 5: ModelPreview — 组件创建

**Files:**
- Create: `components/chat/model-preview.tsx`

**Step 1: Create the ModelPreview component**

```tsx
// components/chat/model-preview.tsx
'use client'

import { Box, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat-store'

interface ModelPreviewProps {
  status: 'calling' | 'complete' | 'error'
  result?: string
}

export function ModelPreview({ status, result }: ModelPreviewProps) {
  const setModelUrl = useChatStore(state => state.setModelUrl)

  if (status === 'calling') {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/5 px-3 py-4">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-sm">正在生成 3D 模型...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm">
        <span>3D 模型生成失败</span>
      </div>
    )
  }

  // status === 'complete'
  let modelUrl: string | undefined
  let renderedImage: string | undefined

  if (result) {
    try {
      const parsed = JSON.parse(result)
      if (parsed.success) {
        modelUrl = parsed.modelUrl
        renderedImage = parsed.renderedImage
      }
    }
    catch { /* ignore */ }
  }

  if (!modelUrl) return null

  return (
    <div className="mb-3 rounded-lg border border-border bg-card p-3">
      {/* Thumbnail area */}
      <div className="mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
        {renderedImage
          ? (
              <img
                src={renderedImage}
                alt="3D 模型预览"
                className="h-full w-full object-cover"
              />
            )
          : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Box className="size-8" />
                <span className="text-xs">3D 模型已生成</span>
              </div>
            )}
      </div>

      {/* Action button */}
      <div className="flex justify-center">
        <Button size="sm" onClick={() => setModelUrl(modelUrl!)}>
          查看 3D 模型
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/chat/model-preview.tsx
git commit -m "feat(chat): add ModelPreview component with thumbnail and action button"
```

---

## Task 6: ModelPreview — 接入 ChatMessage 渲染

**Files:**
- Modify: `components/chat/chat-message.tsx`

**Step 1: Add import and rendering logic**

Add import at top:

```ts
import { ModelPreview } from './model-preview'
```

In the tool-call rendering block, add a check for `generateMascot` **before** the existing `analyzeBazi` check:

```tsx
          if (part.type === 'tool-call' && part.name && part.status) {
            // Render BaguaCard for completed analyzeBazi
            if (part.name === 'analyzeBazi' && part.status === 'complete' && part.result) {
              try {
                const parsed = JSON.parse(part.result)
                if (parsed.success && parsed.data) {
                  return <BaguaCard key={`tool-${index}`} data={parsed.data} />
                }
              }
              catch { /* fall through to ToolStatus */ }
            }
            // Render ModelPreview for generateMascot
            if (part.name === 'generateMascot') {
              return (
                <ModelPreview
                  key={`tool-${index}`}
                  status={part.status}
                  result={part.result}
                />
              )
            }
            return (
              <ToolStatus
                key={`tool-${index}`}
                name={part.name}
                status={part.status}
                result={part.result}
              />
            )
          }
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/chat/chat-message.tsx
git commit -m "feat(chat): render ModelPreview for generateMascot tool results"
```

---

## Task 7: 消息重新生成

**Files:**
- Modify: `hooks/use-mock-chat.ts:160-162`

**Step 1: Implement the reload function**

In `hooks/use-mock-chat.ts`, replace the `reload` stub (lines 160-162):

```ts
  const reload = useCallback(() => {
    // TODO: implement regenerate
  }, [])
```

With:

```ts
  const reload = useCallback(() => {
    if (isLoading) return
    const lastUserIndex = messages.findLastIndex(m => m.role === 'user')
    if (lastUserIndex === -1) return
    const lastUserContent = messages[lastUserIndex].content
    setMessages(prev => prev.slice(0, lastUserIndex + 1))
    // sendMessage reads from messages state, so we need to pass content directly
    // Use setTimeout to let state update before sending
    setTimeout(() => sendMessage(lastUserContent), 0)
  }, [isLoading, messages, sendMessage])
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Manual test**

Run: `pnpm dev`
Send a message, wait for response, click the refresh icon on the assistant message.
Expected: Last assistant message is removed, same user message is re-sent, new streaming response appears.

**Step 4: Commit**

```bash
git add hooks/use-mock-chat.ts
git commit -m "feat(chat): implement message regeneration"
```

---

## Task 8: IndexedDB 持久化层

**Files:**
- Create: `lib/persistence/chat-db.ts`
- Create: `lib/persistence/__tests__/chat-db.test.ts`

**Step 1: Write the failing test**

```ts
// lib/persistence/__tests__/chat-db.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock idb in test environment (jsdom has no real IndexedDB)
// We test the interface contract, not the IndexedDB internals
import type { Session } from '../chat-db'

describe('chat-db types', () => {
  it('Session shape is correct', () => {
    const session: Session = {
      id: 'test-id',
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    expect(session.id).toBe('test-id')
    expect(session.title).toBe('新对话')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/persistence/__tests__/chat-db.test.ts`
Expected: FAIL — module not found

**Step 3: Write the persistence layer**

```ts
// lib/persistence/chat-db.ts
import type { Message } from '@/hooks/use-mock-chat'
import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'

export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface SessionMessages {
  sessionId: string
  messages: Message[]
}

interface ChatDB extends DBSchema {
  sessions: {
    key: string
    value: Session
    indexes: { 'by-updated': number }
  }
  messages: {
    key: string
    value: SessionMessages
  }
}

const DB_NAME = 'tripo-bagua'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' })
        sessionStore.createIndex('by-updated', 'updatedAt')
        db.createObjectStore('messages', { keyPath: 'sessionId' })
      },
    })
  }
  return dbPromise
}

export async function listSessions(): Promise<Session[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('sessions', 'by-updated')
  return all.reverse() // newest first
}

export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  const db = await getDB()
  const record = await db.get('messages', sessionId)
  return record?.messages ?? []
}

export async function saveSession(session: Session, messages: Message[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['sessions', 'messages'], 'readwrite')
  await tx.objectStore('sessions').put(session)
  await tx.objectStore('messages').put({ sessionId: session.id, messages })
  await tx.done
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['sessions', 'messages'], 'readwrite')
  await tx.objectStore('sessions').delete(sessionId)
  await tx.objectStore('messages').delete(sessionId)
  await tx.done
}

export async function getLatestSession(): Promise<Session | undefined> {
  const sessions = await listSessions()
  return sessions[0]
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/persistence/__tests__/chat-db.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/persistence/chat-db.ts lib/persistence/__tests__/chat-db.test.ts
git commit -m "feat(persistence): add IndexedDB chat persistence layer"
```

---

## Task 9: Zustand store 扩展

**Files:**
- Modify: `stores/chat-store.ts`

**Step 1: Add session and sidebar state**

Replace entire `stores/chat-store.ts`:

```ts
import { create } from 'zustand'

export type Phase = 'chat' | 'split'

interface ChatState {
  phase: Phase
  modelUrl: string | null
  currentSessionId: string | null
  sidebarOpen: boolean
  setPhase: (phase: Phase) => void
  setModelUrl: (url: string) => void
  setCurrentSessionId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  reset: () => void
}

export const useChatStore = create<ChatState>(set => ({
  phase: 'chat',
  modelUrl: null,
  currentSessionId: null,
  sidebarOpen: true,
  setPhase: phase => set({ phase }),
  setModelUrl: url => set({ modelUrl: url, phase: 'split' }),
  setCurrentSessionId: id => set({ currentSessionId: id }),
  setSidebarOpen: open => set({ sidebarOpen: open }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  reset: () => set({ phase: 'chat', modelUrl: null }),
}))
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add stores/chat-store.ts
git commit -m "feat(store): add session and sidebar state to chat store"
```

---

## Task 10: Hook 集成持久化

**Files:**
- Modify: `hooks/use-mock-chat.ts`

**Step 1: Integrate persistence into useMockChat**

Replace entire `hooks/use-mock-chat.ts`. Key changes:
- Add `useEffect` to load session on mount
- Add `useEffect` to debounce-save messages on change
- Expose `loadSession`, `newSession`, `currentSession` for sidebar
- Keep all existing SSE streaming logic intact

```ts
// hooks/use-mock-chat.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/stores/chat-store'
import type { Session } from '@/lib/persistence/chat-db'

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

function createSession(title = '新对话'): Session {
  const now = Date.now()
  return { id: crypto.randomUUID(), title, createdAt: now, updatedAt: now }
}

export function useMockChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const setModelUrl = useChatStore(state => state.setModelUrl)
  const setCurrentSessionId = useChatStore(state => state.setCurrentSessionId)
  const resetStore = useChatStore(state => state.reset)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Load latest session on mount
  useEffect(() => {
    async function init() {
      const { getLatestSession, getSessionMessages } = await import('@/lib/persistence/chat-db')
      const latest = await getLatestSession()
      if (latest) {
        setCurrentSession(latest)
        setCurrentSessionId(latest.id)
        const msgs = await getSessionMessages(latest.id)
        // Restore Date objects (serialized as strings in IndexedDB)
        setMessages(msgs.map(m => ({ ...m, createdAt: new Date(m.createdAt) })))
      } else {
        const session = createSession()
        setCurrentSession(session)
        setCurrentSessionId(session.id)
      }
    }
    init()
  }, [setCurrentSessionId])

  // Debounce save messages to IndexedDB
  useEffect(() => {
    if (!currentSession) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const { saveSession } = await import('@/lib/persistence/chat-db')
      const title = messages.find(m => m.role === 'user')?.content.slice(0, 20) || '新对话'
      const updated = { ...currentSession, title, updatedAt: Date.now() }
      await saveSession(updated, messages)
      setCurrentSession(updated)
    }, 300)
    return () => clearTimeout(saveTimerRef.current)
  }, [messages, currentSession])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading)
      return

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
      if (!reader)
        return

      const decoder = new TextDecoder()
      let textContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: '))
            continue
          const data = line.slice(6)
          if (data === '[DONE]')
            continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'model-ready') {
              setTimeout(() => setModelUrl(parsed.url), 0)
              continue
            }

            if (parsed.type === 'text-delta') {
              textContent += parsed.content
            }

            setMessages((prev) => {
              const updated = [...prev]
              const lastMsg = updated[updated.length - 1]
              if (lastMsg.role !== 'assistant')
                return prev

              if (parsed.type === 'text-delta') {
                lastMsg.content = textContent
                const textPartIndex = lastMsg.parts.findIndex(p => p.type === 'text')
                if (textPartIndex >= 0) {
                  lastMsg.parts[textPartIndex].content = textContent
                }
                else {
                  lastMsg.parts.push({ type: 'text', content: textContent })
                }
              }
              else if (parsed.type === 'reasoning') {
                lastMsg.parts = [
                  { type: 'reasoning', content: parsed.content },
                  ...lastMsg.parts.filter(p => p.type !== 'reasoning'),
                ]
              }
              else if (parsed.type === 'tool-call') {
                const existingIndex = lastMsg.parts.findIndex(
                  p => p.type === 'tool-call' && p.name === parsed.name,
                )
                const toolPart: MessagePart = {
                  type: 'tool-call',
                  name: parsed.name,
                  status: parsed.status,
                  result: parsed.result,
                }
                if (existingIndex >= 0) {
                  lastMsg.parts[existingIndex] = toolPart
                }
                else {
                  lastMsg.parts.push(toolPart)
                }
              }

              return updated
            })
          }
          catch {
            // ignore parse errors
          }
        }
      }
    }
    catch (error) {
      console.error('Chat error:', error)
    }
    finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, setModelUrl])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    sendMessage(input)
  }, [input, sendMessage])

  const reload = useCallback(() => {
    if (isLoading) return
    const lastUserIndex = messages.findLastIndex(m => m.role === 'user')
    if (lastUserIndex === -1) return
    const lastUserContent = messages[lastUserIndex].content
    setMessages(prev => prev.slice(0, lastUserIndex + 1))
    setTimeout(() => sendMessage(lastUserContent), 0)
  }, [isLoading, messages, sendMessage])

  const loadSession = useCallback(async (sessionId: string) => {
    const { getSessionMessages, listSessions } = await import('@/lib/persistence/chat-db')
    const sessions = await listSessions()
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    setCurrentSession(session)
    setCurrentSessionId(session.id)
    resetStore()
    const msgs = await getSessionMessages(sessionId)
    setMessages(msgs.map(m => ({ ...m, createdAt: new Date(m.createdAt) })))
  }, [setCurrentSessionId, resetStore])

  const newSession = useCallback(() => {
    const session = createSession()
    setCurrentSession(session)
    setCurrentSessionId(session.id)
    setMessages([])
    setInput('')
    resetStore()
  }, [setCurrentSessionId, resetStore])

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSubmit,
    reload,
    currentSession,
    loadSession,
    newSession,
  }
}
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Manual test**

Run: `pnpm dev`
1. Send a message → refresh page → messages should restore
2. Send another message → refresh → all messages present
Expected: Messages persist across page reloads.

**Step 4: Commit**

```bash
git add hooks/use-mock-chat.ts
git commit -m "feat(chat): integrate IndexedDB persistence into chat hook"
```

---

## Task 11: ThemeToggle 独立组件

**Files:**
- Create: `components/sidebar/theme-toggle.tsx`

**Step 1: Create the ThemeToggle component**

Extract theme logic from `ChatInput` into a standalone component:

```tsx
// components/sidebar/theme-toggle.tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={toggleTheme}
      className="w-full justify-start gap-2"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="text-xs">{isDark ? '浅色模式' : '深色模式'}</span>
    </Button>
  )
}
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/sidebar/theme-toggle.tsx
git commit -m "feat(sidebar): extract ThemeToggle into standalone component"
```

---

## Task 12: 侧边栏 — SessionItem 组件

**Files:**
- Create: `components/sidebar/session-item.tsx`

**Step 1: Create the SessionItem component**

```tsx
// components/sidebar/session-item.tsx
'use client'

import type { Session } from '@/lib/persistence/chat-db'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SessionItemProps {
  session: Session
  isActive: boolean
  collapsed: boolean
  onClick: () => void
  onDelete: () => void
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function SessionItem({ session, isActive, collapsed, onClick, onDelete }: SessionItemProps) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex size-8 items-center justify-center rounded-md text-xs',
          isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50',
        )}
        title={session.title}
      >
        {session.title.charAt(0)}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'group flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5',
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50',
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{session.title}</p>
        <p className="text-[10px] text-muted-foreground">{formatDate(session.updatedAt)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  )
}
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/sidebar/session-item.tsx
git commit -m "feat(sidebar): add SessionItem component"
```

---

## Task 13: 侧边栏 — 主组件

**Files:**
- Create: `components/sidebar/index.tsx`

**Step 1: Create the Sidebar component**

```tsx
// components/sidebar/index.tsx
'use client'

import type { Session } from '@/lib/persistence/chat-db'
import { Menu, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat-store'
import { SessionItem } from './session-item'
import { ThemeToggle } from './theme-toggle'

interface SidebarProps {
  currentSessionId: string | null
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
}

export function Sidebar({ currentSessionId, onSelectSession, onNewSession }: SidebarProps) {
  const { sidebarOpen, toggleSidebar, phase } = useChatStore()
  const [sessions, setSessions] = useState<Session[]>([])

  // Auto-collapse in split mode
  const collapsed = !sidebarOpen || phase === 'split'

  const loadSessions = useCallback(async () => {
    const { listSessions } = await import('@/lib/persistence/chat-db')
    const list = await listSessions()
    setSessions(list)
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions, currentSessionId])

  const handleDelete = useCallback(async (sessionId: string) => {
    const { deleteSession } = await import('@/lib/persistence/chat-db')
    await deleteSession(sessionId)
    await loadSessions()
    if (sessionId === currentSessionId) {
      onNewSession()
    }
  }, [currentSessionId, loadSessions, onNewSession])

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-12' : 'w-60',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-2 border-b border-sidebar-border p-2', collapsed && 'justify-center')}>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={toggleSidebar}>
          <Menu className="size-4" />
        </Button>
        {!collapsed && (
          <span className="truncate text-sm font-semibold font-[var(--font-display)]">Tripo Bagua</span>
        )}
      </div>

      {/* New chat button */}
      <div className={cn('p-2', collapsed && 'flex justify-center')}>
        {collapsed
          ? (
              <Button variant="ghost" size="icon" className="size-8" onClick={onNewSession} title="新对话">
                <Plus className="size-4" />
              </Button>
            )
          : (
              <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onNewSession}>
                <Plus className="size-4" />
                新对话
              </Button>
            )}
      </div>

      {/* Session list */}
      <div className={cn('flex-1 overflow-y-auto p-2', collapsed && 'flex flex-col items-center gap-1')}>
        {sessions.map(session => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={session.id === currentSessionId}
            collapsed={collapsed}
            onClick={() => onSelectSession(session.id)}
            onDelete={() => handleDelete(session.id)}
          />
        ))}
      </div>

      {/* Footer: theme toggle */}
      <div className={cn('border-t border-sidebar-border p-2', collapsed && 'flex justify-center')}>
        {collapsed
          ? (
              <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                document.documentElement.classList.toggle('dark')
                const isDark = document.documentElement.classList.contains('dark')
                localStorage.setItem('theme', isDark ? 'dark' : 'light')
              }}>
                <span className="text-xs">🌓</span>
              </Button>
            )
          : <ThemeToggle />}
      </div>
    </div>
  )
}
```

**Step 2: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add components/sidebar/index.tsx
git commit -m "feat(sidebar): add Sidebar component with session list and theme toggle"
```

---

## Task 14: 页面布局重构 + ChatInput 清理

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/chat/index.tsx`
- Modify: `components/chat/chat-input.tsx`

**Step 1: Clean up ChatInput — remove theme toggle**

Replace entire `components/chat/chat-input.tsx`:

```tsx
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

**Step 2: Update Chat component to expose session methods**

Replace entire `components/chat/index.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMockChat } from '@/hooks/use-mock-chat'
import { ChatEmpty } from './chat-empty'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'

export function Chat() {
  const { messages, input, setInput, isLoading, handleSubmit, reload, currentSession, loadSession, newSession } = useMockChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return {
    currentSession,
    loadSession,
    newSession,
    ui: (
      <div className="flex h-full flex-col overflow-hidden">
        <ScrollArea ref={scrollRef} className="min-h-0 flex-1 p-4">
          {messages.length === 0
            ? <ChatEmpty />
            : messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isLoading && index === messages.length - 1}
                  onRegenerate={message.role === 'assistant' ? reload : undefined}
                />
              ))}
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
    ),
  }
}
```

**Step 3: Update page.tsx with sidebar + new Chat API**

Replace entire `app/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Chat } from '@/components/chat'
import { ModelViewer } from '@/components/model-viewer'
import { OrderModal } from '@/components/order-modal'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat-store'

export default function Home() {
  const { phase, modelUrl } = useChatStore()
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const { currentSession, loadSession, newSession, ui: chatUI } = Chat()

  return (
    <main className="flex h-screen">
      <Sidebar
        currentSessionId={currentSession?.id ?? null}
        onSelectSession={loadSession}
        onNewSession={newSession}
      />

      <div
        className={cn(
          'h-full min-w-0 flex-1 overflow-hidden transition-all duration-400 ease-out',
          phase === 'split' && 'border-r border-border',
        )}
      >
        {chatUI}
      </div>

      {phase === 'split' && modelUrl && (
        <div className="relative h-full w-[40%] overflow-hidden">
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

**Step 4: Verify lint passes**

Run: `pnpm lint`
Expected: No new errors. Fix any issues that arise.

**Step 5: Manual test**

Run: `pnpm dev`
1. Sidebar visible on the left with "Tripo Bagua" title
2. Theme toggle in sidebar footer works
3. "新对话" button creates empty session
4. Send messages → they persist → refresh → restored
5. Multiple sessions in sidebar list
6. Click different sessions to switch
7. Delete a session
Expected: All interactions work. Split mode collapses sidebar to icon bar.

**Step 6: Commit**

```bash
git add app/page.tsx components/chat/index.tsx components/chat/chat-input.tsx
git commit -m "feat: add sidebar with session management, migrate theme toggle"
```

---

## Task 15: Build 验证

**Step 1: Run full lint**

Run: `pnpm lint`
Expected: PASS

**Step 2: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass

**Step 3: Run production build**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 4: Fix any issues found**

If lint/test/build fail, fix issues and re-run until all pass.

**Step 5: Final commit (if fixes needed)**

```bash
git add -A
git commit -m "fix: resolve build issues from frontend component integration"
```
