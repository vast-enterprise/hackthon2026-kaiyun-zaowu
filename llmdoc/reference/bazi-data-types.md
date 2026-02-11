# 八字数据类型参考

## 1. 核心概要

八字类型系统定义于 `lib/bazi/types.ts`，以 `BaziInput` 为输入、`BaziResult` 为输出，中间通过 `Pillar`、`TianGan`、`DiZhi`、`CangGan`、`FiveElements`、`DecadeFortune` 等接口描述命盘的各层数据结构。

## 2. 真相来源

- **类型定义：** `lib/bazi/types.ts` - 所有接口的完整定义（BaziInput, BaziResult, Pillar, FourPillars, TianGan, DiZhi, CangGan, FiveElements, DecadeFortune）。
- **核心计算：** `lib/bazi/index.ts` (`calculateBazi`) - 类型的实际生产者，展示各字段的赋值逻辑。
- **五行统计：** `lib/bazi/five-elements.ts` (`countFiveElements`) - FiveElements 的计算实现。
- **颜色映射：** `lib/bazi/colors.ts` (`WU_XING_COLORS`, `getWuXingColor`) - 五行到 OKLCH 颜色的映射表。
- **工具 Schema：** `app/api/chat/route.ts:14-19` - analyzeBazi 工具的 Zod 输入校验 schema，定义了 AI 调用时的参数约束。
- **UI 消费者：** `components/chat/bagua-card.tsx` (`BaguaCard`) - BaziResult 的主要渲染组件。
- **架构文档：** `/architecture/bazi-system.md` - 八字系统的完整架构和执行流程。

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
```

## 4. 关键约束

- `BaziInput.gender`: `0 | 1`（0 = 女, 1 = 男），默认值 1，影响大运顺逆和神煞计算。
- `BaziInput.minute`: 可选，默认 0，`tyme4ts` 需要但八字计算主要取决于时辰。
- `TianGan.shiShen`: 日柱天干（日主）无十神，该字段为 `undefined`。
- `gods` 和 `relations`: 来自闭源库 `cantian-tymext`，计算失败时分别为空数组和空对象。
