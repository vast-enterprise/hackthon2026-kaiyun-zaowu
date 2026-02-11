// components/chat/chat-input.tsx
'use client'

import { Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  onSend: (text: string) => void
  isLoading?: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!value.trim() || isLoading) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={value}
        onChange={e => setValue(e.target.value)}
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
