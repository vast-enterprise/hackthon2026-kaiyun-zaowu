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
