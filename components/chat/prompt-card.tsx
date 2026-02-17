'use client'

import { CheckIcon, ChevronDownIcon, CopyIcon, PaletteIcon, RotateCcwIcon, SendIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface PromptCardProps {
  prompt: string
  negativePrompt?: string | null
  title?: string
  disabled?: boolean
  onRegenerate?: (prompt: string, negativePrompt?: string) => void
}

export function PromptCard({
  prompt: initialPrompt,
  negativePrompt: initialNegative,
  title = '吉祥物生成提示词',
  disabled,
  onRegenerate,
}: PromptCardProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [negativePrompt, setNegativePrompt] = useState(initialNegative ?? '')
  const [copied, setCopied] = useState(false)

  const isModified = prompt !== initialPrompt || negativePrompt !== (initialNegative ?? '')

  const handleCopy = useCallback(() => {
    const text = negativePrompt
      ? `prompt: ${prompt}\nnegativePrompt: ${negativePrompt}`
      : prompt
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [prompt, negativePrompt])

  const handleReset = useCallback(() => {
    setPrompt(initialPrompt)
    setNegativePrompt(initialNegative ?? '')
  }, [initialPrompt, initialNegative])

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(prompt, negativePrompt || undefined)
  }, [prompt, negativePrompt, onRegenerate])

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="not-prose mb-4 w-full rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3">
        <div className="flex items-center gap-2">
          <PaletteIcon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <ChevronDownIcon className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 border-t px-4 py-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Prompt</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={disabled}
            rows={3}
            className="w-full resize-none rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Negative Prompt</label>
          <textarea
            value={negativePrompt}
            onChange={e => setNegativePrompt(e.target.value)}
            disabled={disabled}
            rows={1}
            placeholder="ugly, low quality, blurry..."
            className="w-full resize-none rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button size="sm" variant="default" disabled={disabled} onClick={handleRegenerate}>
              <SendIcon className="mr-1 size-3" />
              重新生成
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <CheckIcon className="mr-1 size-3" /> : <CopyIcon className="mr-1 size-3" />}
            {copied ? '已复制' : '复制'}
          </Button>
          {isModified && (
            <Button size="sm" variant="ghost" onClick={handleReset}>
              <RotateCcwIcon className="mr-1 size-3" />
              重置
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
