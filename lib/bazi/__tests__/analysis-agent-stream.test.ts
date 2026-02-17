import { describe, expect, it } from 'vitest'

describe('runAnalysisStream', () => {
  it('should be exported as a function', async () => {
    const { runAnalysisStream } = await import('../analysis-agent')
    expect(typeof runAnalysisStream).toBe('function')
  })
})
