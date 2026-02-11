# Tripo Async Architecture Design

## Goal

Make `generateMascot` tool non-blocking: return immediately with a taskId, let the frontend poll for completion independently. Prevent duplicate generation with soft + hard guards.

## Architecture

```
Chat flow (non-blocking):
  AI calls generateMascot → tool creates Tripo task → returns { taskId, status: 'pending' } instantly
  AI continues talking (explains mascot design rationale)

Polling flow (independent):
  ModelPreview mounts with taskId
    → sets pendingTaskId lock in Zustand store
    → polls GET /api/tripo/task/[id] every 3s
    → shows progress bar (0% → 100%)
    → on success: setModelUrl → auto-opens split view, clears lock
    → on failure: shows error, clears lock

Duplicate prevention:
  Soft: system prompt instructs AI not to call generateMascot while one is pending
  Hard: frontend sends pendingTaskId in request body, tool rejects if present
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `stores/chat-store.ts` | Modify | Add `pendingTaskId` + `setPendingTaskId` |
| `app/api/chat/route.ts` | Modify | `generateMascot` returns taskId instantly; reads `pendingTaskId` to reject duplicates; updated system prompt |
| `app/api/tripo/task/[id]/route.ts` | Rewrite | GET proxy to query Tripo task status (hides API key) |
| `components/chat/model-preview.tsx` | Rewrite | Receives `taskId`, polls internally, shows progress, triggers split view on completion |
| `components/chat/chat-message.tsx` | Modify | `generateMascot` branch: render ModelPreview if taskId present, else ToolStatus |
| `hooks/use-chat-session.ts` | Modify | Transport body sends `pendingTaskId`; remove old modelUrl detection effect |

## Detailed Design

### 1. Zustand Store — `stores/chat-store.ts`

Add two fields:

```typescript
interface ChatState {
  // ...existing fields
  pendingTaskId: string | null
  setPendingTaskId: (id: string | null) => void
}

// In create():
pendingTaskId: null,
setPendingTaskId: id => set({ pendingTaskId: id }),
// Update reset():
reset: () => set({ phase: 'chat', modelUrl: null, pendingTaskId: null }),
```

### 2. Backend — `app/api/chat/route.ts`

**generateMascot tool — non-blocking:**

```typescript
const generateMascot = tool({
  description: 'Generate 3D mascot model based on description. Returns a taskId for async generation.',
  inputSchema: z.object({
    prompt: z.string().describe('Detailed mascot description'),
    style: z.string().optional().describe('Style preference'),
  }),
  execute: async ({ prompt, style }) => {
    // Hard guard: reject if generation already in progress
    if (pendingTaskId) {
      return { success: false, error: '已有模型在生成中，请等待完成' }
    }
    try {
      const fullPrompt = style ? `${prompt}, ${style} style` : prompt
      const taskId = await tripoClient.createTask(fullPrompt)
      return { success: true, taskId, status: 'pending' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '3D model generation failed',
      }
    }
  },
})
```

**Request body — read pendingTaskId:**

```typescript
export async function POST(req: Request) {
  const { messages, pendingTaskId } = await req.json()
  // pendingTaskId is captured in closure for generateMascot tool
  // ...rest unchanged
}
```

**System prompt addition:**

```
调用 generateMascot 后会返回 { taskId, status: 'pending' }，
表示 3D 模型已提交异步生成，前端会自动轮询进度并展示结果。
在模型生成期间不要再次调用 generateMascot，告诉用户等待当前模型完成。
继续向用户解释吉祥物的设计理念和寓意。
```

### 3. Tripo Task Proxy — `app/api/tripo/task/[id]/route.ts`

```typescript
import { tripoClient } from '@/lib/tripo'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const task = await tripoClient.getTask(id)
    return Response.json(task)
  } catch (error) {
    return Response.json(
      { status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### 4. ModelPreview — `components/chat/model-preview.tsx`

Complete rewrite. Receives `taskId` prop, manages its own polling lifecycle:

```typescript
interface ModelPreviewProps {
  taskId: string
}

function ModelPreview({ taskId }: ModelPreviewProps) {
  const [task, setTask] = useState<TripoTask | null>(null)
  const setModelUrl = useChatStore(s => s.setModelUrl)
  const setPendingTaskId = useChatStore(s => s.setPendingTaskId)

  useEffect(() => {
    let cancelled = false
    setPendingTaskId(taskId)

    const poll = async () => {
      try {
        const res = await fetch(`/api/tripo/task/${taskId}`)
        if (cancelled) return
        const data = await res.json()
        setTask(data)

        if (data.status === 'success') {
          setPendingTaskId(null)
          if (data.output?.model) setModelUrl(data.output.model)
        }
        if (data.status === 'failed') {
          setPendingTaskId(null)
        }
      } catch {
        if (!cancelled) setPendingTaskId(null)
      }
    }

    poll() // immediate first poll
    const interval = setInterval(() => {
      if (!cancelled) poll()
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(interval)
      setPendingTaskId(null)
    }
  }, [taskId, setModelUrl, setPendingTaskId])

  // Render states:
  // null / queued / running → progress bar with task.progress
  // success → rendered image + "查看 3D 模型" button
  // failed → error message
}
```

### 5. chat-message.tsx — generateMascot Branch

```typescript
if (toolName === 'generateMascot') {
  if (state === 'output-available' && output?.taskId) {
    return <ModelPreview key={`tool-${index}`} taskId={output.taskId as string} />
  }
  return <ToolStatus key={`tool-${index}`} name={toolName} state={state} />
}
```

### 6. use-chat-session.ts — Transport + Cleanup

**Transport sends pendingTaskId:**

```typescript
const transport = new DefaultChatTransport({
  api: '/api/chat',
  body: () => ({
    pendingTaskId: useChatStore.getState().pendingTaskId ?? undefined,
  }),
})
```

**Remove old modelUrl detection effect** — the `useEffect` that scanned tool outputs for modelUrl is no longer needed. ModelPreview handles this internally.

## State Transitions

```
                    ┌─────────────┐
                    │ No task     │
                    │ pending=null│
                    └──────┬──────┘
                           │ AI calls generateMascot
                           ▼
                    ┌─────────────┐
                    │ Pending     │
                    │ pending=id  │◄── ModelPreview mounts
                    └──────┬──────┘
                           │ polling /api/tripo/task/[id]
                    ┌──────┴──────┐
                    ▼             ▼
             ┌────────────┐ ┌──────────┐
             │ Success    │ │ Failed   │
             │ pending=null│ │ pending=null│
             │ modelUrl=✓ │ │ error UI │
             └────────────┘ └──────────┘
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User sends message while generating | `pendingTaskId` sent in body → tool rejects |
| User switches session while generating | ModelPreview unmounts → cleanup clears pendingTaskId |
| User refreshes page mid-generation | Tool output has taskId → ModelPreview remounts → resumes polling |
| Tripo task takes > 120s | Polling continues (no timeout in ModelPreview, Tripo will eventually return success/failed) |
| Network error during poll | Single poll fails silently, next interval retries |
