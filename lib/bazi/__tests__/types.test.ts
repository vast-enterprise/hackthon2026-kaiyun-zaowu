import type { AnalysisEntry, AnalysisNote, BaziResult } from '../types'
import { describe, expect, it } from 'vitest'

describe('analysisNote types', () => {
  it('should allow creating a valid AnalysisEntry', () => {
    const entry: AnalysisEntry = {
      question: null,
      content: '日主甲木生于寅月...',
      references: ['《子平真诠》格局篇'],
      createdAt: Date.now(),
    }
    expect(entry.question).toBeNull()
    expect(entry.references).toHaveLength(1)
  })

  it('should allow creating a valid AnalysisNote', () => {
    const note: AnalysisNote = {
      sessionId: 'test-session',
      rawData: {} as BaziResult,
      analyses: [],
      updatedAt: Date.now(),
    }
    expect(note.analyses).toHaveLength(0)
  })
})

import type { AnalysisProgress, AnalysisEvent, ClassicQueryResult } from '../types'

describe('analysis streaming types', () => {
  it('should allow creating a valid ClassicQueryResult', () => {
    const result: ClassicQueryResult = {
      query: '甲木寅月',
      source: '穷通宝鉴',
      chapter: '甲木寅月',
      content: '甲木寅月，初春尚有余寒...',
      score: 0.85,
    }
    expect(result.score).toBeGreaterThan(0)
  })

  it('should allow creating AnalysisProgress in each phase', () => {
    const started: AnalysisProgress = { phase: 'started' }
    expect(started.phase).toBe('started')

    const analyzing: AnalysisProgress = {
      phase: 'analyzing',
      partialText: '日主甲木...',
      classicQueries: [],
    }
    expect(analyzing.partialText).toBeDefined()

    const querying: AnalysisProgress = {
      phase: 'querying',
      query: '甲木寅月',
      source: '穷通宝鉴',
      partialText: '日主甲木...',
      classicQueries: [],
    }
    expect(querying.query).toBe('甲木寅月')
  })

  it('should allow creating AnalysisEvent variants', () => {
    const textDelta: AnalysisEvent = { type: 'text-delta', textDelta: '日主' }
    expect(textDelta.type).toBe('text-delta')

    const toolCall: AnalysisEvent = { type: 'tool-call', query: '甲木寅月', source: '穷通宝鉴' }
    expect(toolCall.type).toBe('tool-call')
  })
})
