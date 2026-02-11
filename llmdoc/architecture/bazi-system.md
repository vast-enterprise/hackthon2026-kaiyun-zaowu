# 八字命理系统架构

## 1. 身份

- **定义：** 基于 `tyme4ts` 和 `cantian-tymext` 的八字排盘计算引擎，集成 AI 工具调用与可视化渲染。
- **职责：** 接收用户生辰信息，计算四柱、五行、神煞、大运等命盘数据，通过 BaguaCard 组件可视化展示。

## 2. 核心组件

- `lib/bazi/index.ts` (`calculateBazi`, `buildPillarDetail`, `buildDecadeFortunes`): 主计算入口，编排公历转换、四柱排盘、五行统计、神煞计算、大运推演的完整流程。
- `lib/bazi/types.ts` (`BaziInput`, `BaziResult`, `Pillar`, `FourPillars`, `FiveElements`, `DecadeFortune`, `TianGan`, `DiZhi`, `CangGan`): 完整类型系统，定义输入输出及中间数据结构。
- `lib/bazi/five-elements.ts` (`countFiveElements`, `WUXING_MAP`): 五行统计，遍历四柱天干地支计数木火土金水。
- `lib/bazi/colors.ts` (`getWuXingColor`, `WU_XING_COLORS`): 五行 OKLCH 颜色映射，供 UI 渲染使用。
- `app/api/chat/route.ts` (`analyzeBazi` tool, L12-39): AI SDK 工具定义，Zod schema 校验输入，调用 `calculateBazi` 返回结果。
- `components/chat/bagua-card.tsx` (`BaguaCard`, `PillarColumn`, `FiveElementsBar`): 命盘可视化卡片，展示四柱、五行分布、藏干、纳音、神煞、大运。
- `components/chat/chat-message.tsx` (L42-43 tool routing): 消息路由，`tool-analyzeBazi` + `output-available` 状态时渲染 BaguaCard。

## 3. 执行流程（LLM 检索图谱）

### 3.1 外部库职责

- **tyme4ts（MIT）：** 提供 `SolarTime`、`LunarHour`、`EightChar`、`ChildLimit`、`DecadeFortune` 等类。负责公历/农历转换、干支历推算、天干地支属性（五行/阴阳）、十神计算、纳音、大运排列。
- **cantian-tymext（闭源）：** 提供 `getShen`（神煞计算）和 `calculateRelation`（刑冲合害关系计算）。以八字字符串为输入，返回神煞数组和关系对象。

### 3.2 完整数据流

- **1. 用户输入：** 用户在聊天中提供出生年月日时 + 性别。
- **2. AI 工具调用：** DeepSeek 模型识别意图，调用 `analyzeBazi` 工具。`app/api/chat/route.ts:12-39` 定义工具 schema 和 execute。
- **3. 排盘计算：** `lib/bazi/index.ts:18-88` (`calculateBazi`) 执行以下步骤：
  - (a) `SolarTime.fromYmdHms()` 构造公历时间对象（L22）
  - (b) `solarTime.getLunarHour()` 转农历时辰（L23）
  - (c) `lunarHour.getEightChar()` 获取八字对象（L24）
  - (d) 提取四柱 SixtyCycle 并通过 `buildPillarDetail()` 构建详细数据（L27-40）
  - (e) `getShen(baziStr, gender)` 计算神煞（L44-50），异常时返回空数组
  - (f) `calculateRelation()` 计算刑冲合害（L54-64），异常时返回空对象
  - (g) `buildDecadeFortunes()` 通过 `ChildLimit` 推算 10 步大运（L68, L122-148）
  - (h) `countFiveElements()` 统计五行分布（L71）
- **4. 结果返回：** 工具返回 `{ success: true, data: BaziResult }`，通过 AI SDK 流式传输到前端。
- **5. UI 渲染：** `chat-message.tsx` 路由到 `BaguaCard`，组件从 `data` prop 渲染四柱列、五行条形图、摘要信息。展开模式显示藏干、纳音、神煞、大运。

### 3.3 `buildPillarDetail` 内部逻辑

- `lib/bazi/index.ts:90-120`: 从 `SixtyCycle` 提取天干（`getHeavenStem`）和地支（`getEarthBranch`）。
- 天干：名称、五行（`getElement`）、阴阳（`getYinYang`）、十神（`getTenStar`，日柱除外）。
- 地支：名称、五行、阴阳、藏干数组（`getHideHeavenStems`，每个藏干附带十神）。
- 纳音：`pillar.getSound().getName()`。

## 4. 设计要点

- **早子时算法：** `LunarHour.provider = new LunarSect2EightCharProvider()` 配置"早子时算当日"，为八字排盘中最常用的算法选择。
- **容错设计：** `getShen` 和 `calculateRelation` 均包裹在 try-catch 中，闭源库异常不会阻断主流程。
- **纯函数计算：** `calculateBazi` 为纯同步函数，无副作用，便于测试和复用。
- **颜色系统：** 使用 OKLCH 色彩空间确保五行颜色在浅色/深色主题下均有良好可读性。
