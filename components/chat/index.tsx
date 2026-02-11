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
