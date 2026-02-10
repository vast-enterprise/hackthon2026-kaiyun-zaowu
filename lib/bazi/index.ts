export interface BaziResult {
  eightCharacters: string // 八字
  fiveElements: string // 五行
  favorableElement: string // 喜用神
  analysis: string // 分析描述
}

export function calculateBazi(_year: number, _month: number, _day: number, _hour: number): BaziResult {
  // TODO: 实现八字计算
  throw new Error('Not implemented')
}
