// components/chat/index.tsx
'use client'

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { useChatSession } from '@/hooks/use-chat-session'
import { MASKS } from '@/lib/masks'
import { useChatStore } from '@/stores/chat-store'
import { cn } from '@/lib/utils'
import { ChatMessage } from './chat-message'

function MaskGuide() {
  const maskId = useChatStore(state => state.maskId)
  const setMaskId = useChatStore(state => state.setMaskId)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">选择一位命理师</h2>
        <p className="mt-1 text-sm text-muted-foreground">不同风格，不同体验</p>
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
        {MASKS.map(mask => (
          <button
            key={mask.id}
            type="button"
            onClick={() => setMaskId(mask.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors',
              maskId === mask.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <span className="text-2xl">{mask.icon}</span>
            <span className="text-sm font-medium">{mask.name}</span>
            <span className="text-xs text-muted-foreground leading-tight">{mask.description}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">选好后在下方输入框开始对话</p>
    </div>
  )
}

export function Chat() {
  const {
    messages,
    sendMessage,
    regenerate,
    status,
    stop,
    currentSession,
    loadSession,
    newSession,
  } = useChatSession()

  const isLoading = status === 'submitted' || status === 'streaming'

  return {
    currentSession,
    loadSession,
    newSession,
    ui: (
      <div className="flex h-full flex-col overflow-hidden">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            {messages.length === 0
              ? <MaskGuide />
              : messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLast={index === messages.length - 1}
                    isStreaming={isLoading}
                    onRegenerate={message.role === 'assistant' ? regenerate : undefined}
                    onSendMessage={text => sendMessage({ text })}
                  />
                ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border p-2 safe-area-bottom md:p-4">
          <PromptInput
            onSubmit={({ text }) => {
              if (text.trim()) {
                sendMessage({ text })
              }
            }}
          >
            <PromptInputTextarea
              placeholder="输入您的出生日期，开始八字分析..."
              disabled={isLoading}
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    ),
  }
}
