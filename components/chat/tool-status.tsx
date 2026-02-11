// components/chat/tool-status.tsx
'use client'

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolStatusProps {
  name: string
  state: string
}

const TOOL_LABELS: Record<string, string> = {
  analyzeBazi: '分析八字',
  generateMascot: '生成 3D 模型',
}

export function ToolStatus({ name, state }: ToolStatusProps) {
  const label = TOOL_LABELS[name] || name
  const isLoading = state !== 'output-available' && state !== 'output-error'
  const isError = state === 'output-error'
  const isDone = state === 'output-available'

  return (
    <div
      className={cn(
        'mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        isLoading && 'border-primary/50 bg-primary/5',
        isDone && 'border-green-500/50 bg-green-500/5',
        isError && 'border-destructive/50 bg-destructive/5',
      )}
    >
      {isLoading && (
        <Loader2 className="size-4 animate-spin text-primary" />
      )}
      {isDone && (
        <CheckCircle className="size-4 text-green-500" />
      )}
      {isError && (
        <AlertCircle className="size-4 text-destructive" />
      )}
      <span>
        {isLoading && `正在${label}...`}
        {isDone && `${label}完成`}
        {isError && `${label}失败`}
      </span>
    </div>
  )
}
