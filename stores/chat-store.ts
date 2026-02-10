import { create } from 'zustand'

export type Phase = 'chat' | 'split'

interface ChatState {
  phase: Phase
  modelUrl: string | null
  setPhase: (phase: Phase) => void
  setModelUrl: (url: string) => void
  reset: () => void
}

export const useChatStore = create<ChatState>(set => ({
  phase: 'chat',
  modelUrl: null,
  setPhase: phase => set({ phase }),
  setModelUrl: url => set({ modelUrl: url, phase: 'split' }),
  reset: () => set({ phase: 'chat', modelUrl: null }),
}))
