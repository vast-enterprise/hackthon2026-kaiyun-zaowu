# 八字解局 + 吉祥物生成优化设计方案

> 日期: 2026-02-12
> 状态: 已确认
> 范围: System Prompt 重构 + RAG 知识库 + Tripo Prompt 工程

---

## 1. 背景与问题

### 1.1 八字解局问题

当前 `app/api/chat/route.ts` 中的 system prompt 存在以下问题：

- **数据利用率低**: `calculateBazi` 返回约 23 个核心数据点（四柱、藏干、十神、纳音、神煞、大运、刑冲合害），但 system prompt 的解读指引只覆盖了约 40%
- **喜用神完全靠 AI 猜**: 计算引擎不返回喜用神，AI 需自行从五行分布推断，准确性无法保证
- **无日主强弱量化**: 没有数值评分，AI 只能凭"感觉"判断
- **解读千篇一律**: 缺少结构化的分析框架，不同命盘的解读雷同
- **未引用经典**: AI 解读没有古籍依据支撑

### 1.2 吉祥物生成问题

当前 `lib/tripo.ts` 和 `generateMascot` 工具存在以下问题：

- **Tripo API 66% 参数未使用**: `negative_prompt`、`texture_quality`、`face_limit` 均未传递
- **prompt 构建粗糙**: 只是 `prompt + style` 字符串拼接，无结构化模板
- **五行→吉祥物映射单一**: 每种五行只对应 1-2 种瑞兽，选择有限
- **风格化能力未开发**: Tripo 支持 `stylize_model`（乐高/体素风格）完全未使用

---

## 2. 设计方案

### 2.1 总体架构

```
用户输入生辰
    ↓
analyzeBazi 排盘计算 → BaziResult
    ↓
┌─────────────────────────────────────┐
│  RAG 检索层（新增）                    │
│  ├─ 第1层：精确查表                    │
│  │   日主+月令 → 《穷通宝鉴》调候用神   │
│  ├─ 第2层：向量检索                    │
│  │   格局特征 → 《子平真诠》格局规则     │
│  │   神煞名称 → 神煞释义库              │
│  └─ 第3层：向量检索                    │
│      命盘相似度 → 经典命例库             │
└─────────────────────────────────────┘
    ↓
经典知识片段注入 AI 上下文
    ↓
AI 按《千里命稿》八步流程解读 + 引用经典
    ↓
推荐吉祥物方案（丰富的五行→瑞兽+材质映射）
    ↓
generateMascot（结构化 prompt 模板 + negative_prompt + 高清纹理）
    ↓
Tripo API 生成 3D 模型
```

---

## 3. 八字解局优化

### 3.1 System Prompt 重构

#### 3.1.1 基于《千里命稿》的解读流程骨架

重写 `systemPrompt` 中"八字解读"部分，将当前的自由发挥式指引替换为结构化的分析流程：

```
拿到 analyzeBazi 返回的命盘数据后，按以下步骤分析：

第一步：判断日主强弱
- 看月令（fourPillars.month.diZhi.wuXing）是否生扶日主
- 看 fiveElements 中与日主同五行（帮身）和生日主五行（印星）的总数
- 看四柱藏干（cangGan）中是否有日主根气
- 简化判断：同类+生我 ≥ 4 为偏强，≤ 2 为偏弱，3 为中和需看月令

第二步：确定用神（三种取法，来自《滴天髓》）
- 扶抑用神：日主偏弱→印比为喜用；日主偏强→食伤财官为喜用
- 调候用神：参考系统注入的《穷通宝鉴》调候建议（最重要）
- 通关用神：两方对峙时取中间五行调和

第三步：解读神煞（gods 字段）
- 吉神（天乙贵人、文昌、驿马等）说明其带来的正面影响
- 凶煞（羊刃、亡神、劫煞等）说明需要注意的方面
- 结合柱位解读（年柱论祖上/少年，月柱论父母/青年，日柱论自身/中年，时柱论子女/晚年）

第四步：解读刑冲合害（relations 字段）
- 地支相合说明人际关系、合化趋势
- 地支相冲说明变动、冲突
- 地支相刑说明挫折、考验

第五步：解读大运走势（decadeFortunes 字段）
- 找出最有利的大运段（大运五行为喜用神时）
- 指出当前大运的整体运势走向
- 点出需要特别注意的转折点

第六步：结合用户关心的方向，给出具体解读
```

#### 3.1.2 数据字段使用指引（新增）

在 prompt 中明确告诉 AI 每个返回字段的用法：

```
## 数据字段使用指引

- dayMaster: 日主天干,命盘核心,一切分析围绕此展开
- fourPillars.*.tianGan.shiShen: 十神关系,直接反映六亲和社会关系
- fourPillars.*.diZhi.cangGan: 藏干,地支的暗含力量,判断日主是否有根的关键
- fourPillars.*.naYin: 纳音五行,补充判断依据,可用于性格和命运特质描述
- fiveElements: 五行分布统计,判断偏枯和平衡的量化依据
- gods: 神煞数组,每组[柱位, 神煞名称],用于细节论断
- relations: 刑冲合害关系,反映命盘内部的动态互动
- decadeFortunes: 大运数组,每步含干支和起止年龄,用于论时运
```

### 3.2 Few-Shot 命例

在 system prompt 中嵌入 2-3 个标准命盘解读范例，展示完整的"数据→推理→结论"链条。

命例选取原则：
- 覆盖不同日主强弱类型（一个偏强、一个偏弱）
- 展示调候用神的应用
- 展示引用经典的方式（如"《穷通宝鉴》指出甲木春生宜取庚金..."）

命例格式：
```
【命例】某男，1985年3月15日巳时
日主：甲木，月令：卯月（当令），五行统计：木4火1土1金1水1
→ 判断：日主偏强（木当令+帮扶多）
→ 用神：取庚金制木为用（扶抑），《穷通宝鉴》甲木春生取庚金劈甲引丁
→ 总论：你这盘日主偏强有力，属于做事有魄力但容易刚愎自用的人...
→ 吉祥物推荐：喜金→貔貅，金属磨砂质感...
```

### 3.3 RAG 知识库

#### 第 1 层：《穷通宝鉴》调候用神表（精确查表）

- **数据格式**: TypeScript/JSON，10天干 × 12月令 = 120 条规则
- **存储位置**: `lib/bazi/tiaohou-table.ts`（新文件）
- **每条规则结构**:
  ```typescript
  interface TiaohouRule {
    dayMaster: string    // 日主天干，如 "甲"
    monthBranch: string  // 月令地支，如 "寅"
    season: string       // 季节，如 "初春"
    primaryUse: string   // 首选用神，如 "庚金"
    secondaryUse: string // 次选用神，如 "丁火"
    summary: string      // 核心论述（原文白话）
    source: string       // 出处标注
  }
  ```
- **检索方式**: 排盘后直接用 `dayMaster + monthBranch` 精确匹配
- **注入方式**: 将匹配到的调候建议作为额外上下文拼接到 system prompt 末尾

#### 第 2 层：格局规则 + 神煞释义（向量检索）

- **数据来源**: 《子平真诠》格局论（八格成败条件）+ 常见 50+ 种神煞释义
- **存储方式**: 文本分块后 embedding 存入向量数据库
- **向量数据库选型**: 建议使用轻量级方案（如 Vercel AI SDK 自带的 embedding 工具 + 本地 JSON 存储，或 Supabase pgvector）
- **检索触发**: 排盘后，根据命盘中出现的神煞名称和格局特征检索相关规则

#### 第 3 层：经典命例库（向量检索）

- **数据来源**: 《滴天髓征义》《千里命稿》中的经典命例
- **存储方式**: 每个命例包含命盘数据 + 原文解读 + 白话翻译
- **检索触发**: 根据当前命盘的日主强弱类型 + 格局类型，检索相似命例作为参考
- **注入方式**: 选取最相似的 1-2 个命例注入上下文

---

## 4. 吉祥物生成优化

### 4.1 Prompt 模板化

在 system prompt 中为 AI 提供 Tripo 友好的结构化 prompt 模板：

```
调用 generateMascot 时，prompt 必须遵循以下结构（英文）：
"A [style] figurine of [creature], [key pose/action],
[1-2 material descriptors], [1-2 color descriptors],
desktop collectible, smooth LOD transitions"

核心原则：
- 简洁优先：模型对简短精确描述理解最好，长文本不会增强细节
- 单一主体：一次只生成一个物体，不要描述场景或背景
- 材质优先于光源：描述材质比描述光照更有效
- 重要信息前置：AI 对 prompt 开头的权重更高
- 不超过 2 种颜色：多颜色描述会导致结果混乱
```

### 4.2 Tripo API 参数增强

修改 `lib/tripo.ts` 中的 `createTask` 方法：

```typescript
// 当前实现
{
  type: 'text_to_model',
  prompt,
  model_version: 'v2.5-20250123',
}

// 优化后
{
  type: 'text_to_model',
  prompt,
  negative_prompt: negativePrompt ?? 'blurry, low quality, multiple heads, floating parts, disconnected geometry, extra limbs, deformed',
  model_version: 'v2.5-20250123',
  texture_quality: 'high',
}
```

### 4.3 generateMascot 工具 Schema 扩展

扩展 `generateMascot` 的 Zod schema，让 AI 可以传递更细粒度的控制：

```typescript
const generateMascot = tool({
  description: '根据描述生成 3D 吉祥物模型,返回 taskId 用于异步轮询',
  inputSchema: z.object({
    prompt: z.string().describe('遵循模板的结构化英文描述'),
    negativePrompt: z.string().optional().describe('不希望出现的特征,英文'),
    style: z.string().optional().describe('风格偏好,如 cute、majestic、chibi'),
  }),
  // ...
})
```

### 4.4 五行→吉祥物映射增强

扩展 system prompt 中的映射表，提供更丰富的瑞兽选项 + Tripo 友好的材质描述：

```
喜水：
  瑞兽: 玄武、锦鲤、水龙、海马、墨龙
  色调: 深蓝、墨黑、靛蓝
  材质: 玉石质感(jade-like translucent)、冰晶通透(ice crystal)、深海珊瑚(deep sea coral)

喜木：
  瑞兽: 青龙、麒麟、灵鹿、凤蝶、瑞鹤
  色调: 翠绿、青碧、新叶绿
  材质: 木雕质感(carved wood)、翡翠玉(emerald jade)、竹编(woven bamboo)

喜火：
  瑞兽: 朱雀、凤凰、九尾狐、火麒麟、赤龙
  色调: 朱红、金橙、丹霞红
  材质: 陶瓷釉面(glazed ceramic)、琉璃(glass enamel)、红珊瑚(red coral)

喜金：
  瑞兽: 白虎、貔貅、鲲鹏、银龙、玄鹤
  色调: 银白、黄金、铂金
  材质: 金属磨砂(brushed metal)、黄金抛光(polished gold)、银器(silver craft)

喜土：
  瑞兽: 黄龙、饕餮、独角兽、石狮、土地公
  色调: 土黄、琥珀、赭石
  材质: 陶土质感(terracotta)、砂岩(sandstone)、琥珀(amber resin)
```

---

## 5. 实施计划

### 阶段 1：Prompt 优化（立即见效）

| 工作项 | 影响文件 | 说明 |
|--------|---------|------|
| 重写 system prompt 解读指引 | `app/api/chat/route.ts` | 基于《千里命稿》八步流程 + 《滴天髓》三种用神取法 |
| 嵌入 2-3 个 Few-Shot 命例 | `app/api/chat/route.ts` | 展示完整"数据→推理→结论"链条 |
| 扩展五行→吉祥物映射 | `app/api/chat/route.ts` | 更丰富的瑞兽+材质选项 |
| 吉祥物 prompt 模板化 | `app/api/chat/route.ts` | 给 AI Tripo 友好的结构化模板 |

### 阶段 2：Tripo 参数增强

| 工作项 | 影响文件 | 说明 |
|--------|---------|------|
| createTask 加入 negative_prompt + texture_quality | `lib/tripo.ts` | 提升生成质量 |
| 扩展 generateMascot 工具 schema | `app/api/chat/route.ts` | 暴露 negativePrompt 参数 |

### 阶段 3：RAG 第1层（调候表）

| 工作项 | 影响文件 | 说明 |
|--------|---------|------|
| 构建《穷通宝鉴》调候用神表 | `lib/bazi/tiaohou-table.ts`（新） | 120 条调候规则 |
| 实现精确查表 + 上下文注入逻辑 | `app/api/chat/route.ts` | 排盘后自动查表注入 |

### 阶段 4：RAG 第2-3层（向量检索）

| 工作项 | 影响文件 | 说明 |
|--------|---------|------|
| 选型向量数据库 | 待定 | Supabase pgvector 或本地 JSON |
| 构建格局规则 + 神煞释义知识库 | `lib/rag/`（新目录） | embedding + 存储 |
| 构建经典命例库 | `lib/rag/`（新目录） | 命例 embedding + 相似度检索 |
| 实现检索 + 注入管线 | `app/api/chat/route.ts` | 排盘后自动检索相关知识 |

---

## 6. 参考资料

- [Tripo 官方 Prompt 工程指南](https://www.tripo3d.ai/blog/text-to-3d-prompt-engineering)
- [Tripo 用户指南 (I): Prompt 技巧](https://www.tripo3d.ai/blog/tripo-user-guide-i-tips-and-tricks-for-effective-prompting)
- [Tripo 用户指南 (II): 更多 Prompt 尝试](https://www.tripo3d.ai/blog/tripo-user-guide-ii-other-prompts-worth-trying)
- [Fatetell: AI 命理产品的 RAG 实践](https://www.aitop100.cn/infomation/details/20060.html)
- [DeepSeek 算命的优与缺 - 知乎](https://zhuanlan.zhihu.com/p/22089054467)
- [BaZi-Based Character Simulation Benchmark (arXiv)](https://arxiv.org/html/2510.23337v1)
- [大模型微调"算命大师"实践](https://blog.csdn.net/Lilith_0828/article/details/147473892)
- [命理学十大经典古籍 - 知乎](https://zhuanlan.zhihu.com/p/1930593681741713727)
