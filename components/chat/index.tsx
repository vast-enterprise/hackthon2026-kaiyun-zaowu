'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMockChat } from '@/hooks/use-mock-chat'
import { ChatEmpty } from './chat-empty'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'

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
        {messages.length === 0
          ? (
              <ChatEmpty />
            )
          : (
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
