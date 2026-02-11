# 八字分析工作流程指南

从用户输入到命盘渲染的完整流程说明，以及如何修改或扩展八字计算逻辑。

## 端到端工作流程

1. **用户输入生辰：** 用户在聊天输入框中以自然语言提供出生日期时间和性别（如"我是1990年5月15日上午10点出生的男性"）。

2. **AI 识别并调用工具：** DeepSeek 模型根据 system prompt 识别八字分析意图，生成 `analyzeBazi` 工具调用，参数由 Zod schema 校验。参考 `app/api/chat/route.ts:12-39`。

3. **服务端排盘计算：** `analyzeBazi.execute` 调用 `calculateBazi(input)`，在服务端同步完成全部计算（四柱、五行、神煞、大运、刑冲合害）。参考 `lib/bazi/index.ts:18-88`。

4. **流式返回结果：** 工具返回 `{ success: true, data: BaziResult }`，通过 `streamText` -> `toUIMessageStreamResponse()` 流式传输到前端。

5. **前端消息路由：** `ChatMessage` 组件检测到 `part.type === 'tool-analyzeBazi'` 且 `state === 'output-available'`，提取 `output.data` 传入 `BaguaCard`。参考 `components/chat/chat-message.tsx`。

6. **BaguaCard 渲染命盘：** 展示四柱列（天干地支 + 五行着色）、五行分布条形图、日主/生肖/八字摘要。展开模式额外显示藏干、纳音、神煞、大运。参考 `components/chat/bagua-card.tsx`。

## 如何扩展八字计算

1. **新增计算字段：** 在 `lib/bazi/types.ts` 的 `BaziResult` 接口添加新字段，然后在 `lib/bazi/index.ts` 的 `calculateBazi` 函数中补充计算逻辑，最后在 `BaguaCard` 展开区域添加对应渲染。

2. **修改五行统计规则：** 当前 `countFiveElements`（`lib/bazi/five-elements.ts`）仅统计天干和地支本气。如需纳入藏干，修改该函数遍历 `pillar.diZhi.cangGan` 数组。

3. **调整颜色方案：** 修改 `lib/bazi/colors.ts` 中 `WU_XING_COLORS` 的 OKLCH 值。

4. **更换排盘算法：** 修改 `lib/bazi/index.ts:16` 的 `LunarHour.provider` 赋值。`tyme4ts` 提供多种 `EightCharProvider` 实现。

5. **验证修改：** 在 `calculateBazi` 函数上编写单元测试，使用已知的八字样本验证输出。BaguaCard 渲染可通过 Storybook 或直接在聊天中输入测试日期验证。
