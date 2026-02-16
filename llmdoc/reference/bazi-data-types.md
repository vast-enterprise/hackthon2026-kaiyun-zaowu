# 八字数据类型参考

## 1. 核心概要

八字类型系统定义于 `lib/bazi/types.ts`，以 `BaziInput` 为输入、`BaziResult` 为输出，中间通过 `Pillar`、`TianGan`、`DiZhi` 等接口描述命盘数据。阶段 1 新增 `AnalysisEntry` 和 `AnalysisNote` 类型，构成双 Agent 架构的共享记忆层。

## 2. 真相来源

- **类型定义：** `lib/bazi/types.ts` - 所有接口的完整定义（BaziInput, BaziResult, Pillar, FourPillars, TianGan, DiZhi, CangGan, FiveElements, DecadeFortune, AnalysisEntry, AnalysisNote）。
- **核心计算：** `lib/bazi/index.ts` (`calculateBazi`) - BaziResult 的实际生产者。
- **分析 Agent：** `lib/bazi/analysis-agent.ts` (`runAnalysis`) - AnalysisEntry 的实际生产者。
- **五行统计：** `lib/bazi/five-elements.ts` (`countFiveElements`) - FiveElements 的计算实现。
- **颜色映射：** `lib/bazi/colors.ts` (`WU_XING_COLORS`, `getWuXingColor`) - 五行到 OKLCH 颜色的映射表。
- **工具 Schema：** `app/api/chat/route.ts:109-176` - analyzeBazi 和 deepAnalysis 工具定义。
- **持久化：** `lib/persistence/chat-db.ts` (`saveAnalysisNote`, `getAnalysisNote`) - AnalysisNote 的 IndexedDB 读写。
- **UI 消费者：** `components/chat/bagua-card.tsx` (`BaguaCard`) - BaziResult 的主要渲染组件。
- **架构文档：** `/llmdoc/architecture/bazi-system.md` - 八字系统的完整架构和执行流程。

## 3. 类型层级关系

```
BaziInput (输入)
  -> calculateBazi()
    -> BaziResult (输出)
         |- fourPillars: FourPillars
         |    |- year/month/day/hour: Pillar
         |         |- tianGan: TianGan (name, wuXing, yinYang, shiShen?)
         |         |- diZhi: DiZhi (name, wuXing, yinYang, cangGan[])
         |         |    |- cangGan[]: CangGan (name, shiShen)
         |         |- naYin: string
         |- fiveElements: FiveElements (wood, fire, earth, metal, water)
         |- gods: string[][] (神煞, 来自 cantian-tymext)
         |- decadeFortunes: DecadeFortune[] (ganZhi, startYear, endYear, startAge, endAge)
         |- relations: Record<string, unknown> (刑冲合害, 来自 cantian-tymext)
         |- solar/lunar/bazi/zodiac/dayMaster: string (基础信息)

AnalysisNote (共享记忆层)
  |- sessionId: string (关联会话)
  |- rawData: BaziResult (排盘原始数据)
  |- analyses: AnalysisEntry[] (增量分析条目)
  |    |- question: string | null (null = 首次综合分析)
  |    |- content: string (Markdown 分析结论)
  |    |- references: string[] (引用经典, 如《子平真诠》)
  |    |- createdAt: number
  |- updatedAt: number
```

## 4. 关键约束

- `BaziInput.gender`: `0 | 1`（0 = 女, 1 = 男），默认值 1，影响大运顺逆和神煞计算。
- `BaziInput.minute`: 可选，默认 0，`tyme4ts` 需要但八字计算主要取决于时辰。
- `TianGan.shiShen`: 日柱天干（日主）无十神，该字段为 `undefined`。
- `gods` 和 `relations`: 来自闭源库 `cantian-tymext`，计算失败时分别为空数组和空对象。
- `AnalysisEntry.question`: `null` 表示首次综合分析，非 null 表示针对特定问题的补充分析。
- `AnalysisNote.analyses`: 追加式数组，每次分析追加新条目，分析 Agent 可看到所有历史条目。
