// components/chat/index.tsx
'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatSession } from '@/hooks/use-chat-session'
import { ChatEmpty } from './chat-empty'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'

export function Chat() {
  const {
    messages,
    sendMessage,
    regenerate,
    status,
    currentSession,
    loadSession,
    newSession,
  } = useChatSession()
  const scrollRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text: string) => {
    sendMessage({ text })
  }

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
                  onRegenerate={message.role === 'assistant' ? regenerate : undefined}
                />
              ))}
        </ScrollArea>
        <div className="border-t border-border p-4">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </div>
    ),
  }
}
