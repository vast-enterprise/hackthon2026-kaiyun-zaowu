# RAG 经典文献知识库设计

> 日期: 2026-02-16
> 状态: 已确认（2026-02-16 更新：扩展至五部典籍）
> 前置文档: [2026-02-13-bazi-analysis-architecture-redesign.md](./2026-02-13-bazi-analysis-architecture-redesign.md)
> 范围: 阶段 2 — queryClassics 工具 + 经典文本采集 + 向量检索

---

## 1. 目标

给分析 Agent 添加 `queryClassics` 工具，让它在分析过程中可以主动查阅经典命理著作，获取术语释义、调候用法、格局论述、纳音论述、神煞论述、干支关系、命例分析等内容作为论据。

**核心原则：** AI 自己决定查什么、查哪本，不做被动注入。

---

## 2. 总体架构

### 2.1 离线流水线（一次性）

```
经典文本采集（GitHub 公版古籍 Markdown 仓库）
    ↓
按章节/条目自然分块 + 标注 keywords
    ↓
调智谱 Embedding-3 生成向量
    ↓
写入 data/classics/chunks.json
```

### 2.2 运行时（每次 queryClassics 调用）

```
query 文本
    ↓
调智谱 Embedding-3 实时编码
    ↓
内存中 cosine similarity 匹配（~710 向量，毫秒级）
    ↓
返回 top 3 相关段落（含出处）
```

---

## 3. 数据结构

### 3.1 文件组织

```
data/
  classics/
    chunks.json          # 所有文本块 + 向量（运行时加载）
    sources/             # 原始结构化文本（仅供离线脚本使用）
      qiongtong.json     # 穷通宝鉴
      ziping.json        # 子平真诠评注
      ditian.json        # 滴天髓阐微
      yuanhai.json       # 渊海子平
      sanming.json       # 三命通会

scripts/
  build-embeddings.ts    # 离线脚本：读 sources → 分块 → 调智谱 embedding → 写 chunks.json
```

### 3.2 ClassicChunk 类型

```typescript
interface ClassicChunk {
  id: string            // 唯一 ID，如 "qiongtong-jia-yin"
  content: string       // 原文段落（含白话注释/评注）
  source: string        // 书名：穷通宝鉴 / 子平真诠 / 滴天髓 / 渊海子平 / 三命通会
  chapter: string       // 章节名
  keywords: string[]    // 人工标注关键词，如 ["甲木", "寅月", "调候"]
  embedding: number[]   // 智谱 Embedding-3 向量
}
```

### 3.3 Sources JSON 格式

每部经典的原始文本整理为 JSON 数组，不含 embedding 字段：

```json
[
  {
    "id": "qiongtong-jia-yin",
    "source": "穷通宝鉴",
    "chapter": "甲木·寅月",
    "content": "甲木生于寅月，阳气初生...(原文+白话注释)",
    "keywords": ["甲木", "寅月", "丙火", "调候"]
  }
]
```

### 3.4 分块策略

按经典自身结构自然分块，不做固定长度切分：

| 经典 | 分块粒度 | 预估块数 | 涵盖内容 |
|------|---------|---------|---------|
| 穷通宝鉴 | 每天干 × 每月令 = 1 条目 + 五行总论 | ~120 块 | 调候用神 |
| 子平真诠评注 | 每章 1 块（章长则按节拆），含徐乐吾评注 | ~60 块 | 格局论命、十神取运 |
| 滴天髓阐微 | 每章 1 块（含任铁樵注 + 命例），通神论 + 六亲论 | ~150 块 | 干支论、衰旺、格局、体用、命例 |
| 渊海子平 | 按篇分块（基础/十神/格局/赋论/六亲/女命/神煞） | ~80 块 | 干支体象、十神论、纳音、神煞 |
| 三命通会 | 按卷内章节分块，卷一~卷十 | ~300 块 | 五行论、纳音论、神煞论、格局论、干支关系、日时断命 |
| **合计** | | **~710 块** | |

> 710块 × 1024维 × 4字节 ≈ 2.8MB 内存，cosine similarity 仍为毫秒级。

---

## 4. queryClassics 工具

### 4.1 Tool Schema

```typescript
const queryClassics = tool({
  description: '查阅命理经典著作（穷通宝鉴、子平真诠、滴天髓、渊海子平、三命通会），可查术语释义、调候用法、格局论述、纳音、神煞、干支关系、命例分析等',
  inputSchema: z.object({
    query: z.string().describe('查询内容，如"伤官配印"、"甲木寅月用神"、"身弱财旺"、"天乙贵人"、"甲子海中金"'),
    source: z.enum(['all', 'ziping', 'ditian', 'qiongtong', 'yuanhai', 'sanming'])
      .optional()
      .default('all')
      .describe('指定经典：ziping=子平真诠, ditian=滴天髓, qiongtong=穷通宝鉴, yuanhai=渊海子平, sanming=三命通会, all=全部'),
  }),
  execute: async ({ query, source }) => {
    const queryEmbedding = await embedText(query)
    const chunks = await loadChunks()
    const candidates = source === 'all'
      ? chunks
      : chunks.filter(c => c.sourceKey === source)

    const results = candidates
      .map(c => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    return results.map(r => ({
      content: r.content,
      source: r.source,
      chapter: r.chapter,
      score: r.score,
    }))
  },
})
```

### 4.2 实现细节

- **`loadChunks()`**：首次调用从 `data/classics/chunks.json` 读入内存，后续从模块级缓存返回
- **`embedText()`**：调智谱 REST API（`POST https://open.bigmodel.cn/api/paas/v4/embeddings`，模型 `embedding-3`）
- **`cosineSimilarity()`**：纯数学函数，点积 / 范数乘积
- **结果格式**：只返回 content、source、chapter、score，不返回 embedding 向量

### 4.3 SourceKey 类型

```typescript
export type SourceKey = 'qiongtong' | 'ziping' | 'ditian' | 'yuanhai' | 'sanming'

export const SOURCE_MAP: Record<SourceKey, string> = {
  qiongtong: '穷通宝鉴',
  ziping: '子平真诠',
  ditian: '滴天髓',
  yuanhai: '渊海子平',
  sanming: '三命通会',
}
```

### 4.4 接入分析 Agent

在 `lib/bazi/analysis-agent.ts` 的 `runAnalysis` 函数中，将 `queryClassics` 加入 `generateText` 的 tools 参数。分析 Agent 在推理过程中按需调用，自行决定查什么、查哪本。

---

## 5. 智谱 Embedding API

### 5.1 调用方式

直接调 REST API，不引入 Python SDK：

```typescript
// lib/bazi/embedding.ts
const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4'

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${ZHIPU_API_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'embedding-3',
      input: text,
    }),
  })
  const data = await res.json()
  return data.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // 批量版本，用于离线脚本
  const res = await fetch(`${ZHIPU_API_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'embedding-3',
      input: texts,
    }),
  })
  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}
```

### 5.2 环境变量

`.env` 新增：

```
ZHIPU_API_KEY=your_zhipu_api_key_here
```

---

## 6. 离线脚本

### 6.1 功能

`scripts/build-embeddings.ts`：

1. 读取 `data/classics/sources/*.json`（5 个文件）
2. 合并所有 chunks 为数组
3. 批量调智谱 Embedding-3（每批 10 条，批次间间隔 1 秒避免限流）
4. 为每个 chunk 附加 embedding 字段
5. 写入 `data/classics/chunks.json`

### 6.2 运行方式

```bash
npx tsx scripts/build-embeddings.ts
```

只需运行一次。新增经典文本后重跑即可。预计 710 块，每批 10 条，~71 批，耗时约 2 分钟。

---

## 7. 经典文本采集

### 7.1 来源

五部经典均为公版古籍，源自 GitHub 仓库 `s-theo/xx.theojs.cn`（`content/命/` 目录），全部为 Markdown 格式，无需 PDF 提取。

### 7.2 源文件清单

| 典籍 | 仓库路径 | 文件数 | 总大小 |
|------|---------|-------|-------|
| 穷通宝鉴 | `content/命/穷通宝鉴.md` | 1 | 106KB |
| 子平真诠评注 | `content/命/子平推命/子平真诠(上).md` + `(下).md` | 2 | 267KB |
| 滴天髓阐微 | `content/命/滴天髓/滴天髓.md` + `阐微(通神论).md` + `阐微(六亲论).md` | 3 | 392KB |
| 渊海子平 | `content/命/子平推命/渊海子平*.md`（主文件 + 6 分类文件） | 7 | 189KB |
| 三命通会 | `content/命/三命通会/三命通会(卷一~卷十).md` | 10 | 734KB |
| **合计** | | **23 个文件** | **~1.7MB** |

> 注：三命通会仓库中有卷一~卷十，缺卷十一、十二。子平真诠为徐乐吾评注版（原文 + 评注一体）。

### 7.3 各典籍涵盖的分析维度

| 分析维度 | 穷通宝鉴 | 子平真诠 | 滴天髓 | 渊海子平 | 三命通会 |
|---------|---------|---------|-------|---------|---------|
| 调候用神 | ★★★ | | | | |
| 格局论命 | | ★★★ | ★★ | ★★ | ★★ |
| 十神应用 | | ★★★ | ★★ | ★★★ | ★★ |
| 干支特性 | | | ★★★ | ★★★ | ★★ |
| 衰旺判断 | | ★★ | ★★★ | | ★ |
| 纳音论述 | | | | ★ | ★★★ |
| 神煞论述 | | | | ★★ | ★★★ |
| 实战命例 | ★ | ★★ | ★★★ | ★ | ★★ |
| 行运推断 | | ★★★ | ★★ | ★★ | ★ |
| 六亲论断 | | ★ | ★★★ | ★★★ | ★ |

### 7.4 分块规范

- 按经典自身结构自然分块，不做固定长度切分
- 每条 chunk 包含原文 + 注释/评注（如有）
- keywords 人工标注，至少包含涉及的天干、地支、十神、神煞、纳音等
- id 命名：`{书名缩写}-{章节标识}`
  - 穷通宝鉴：`qiongtong-jia-yin`（天干-月支）
  - 子平真诠：`ziping-ch01`（章号）
  - 滴天髓：`ditian-ts-tiandao`（ts=通神/lq=六亲 + 章名）
  - 渊海子平：`yuanhai-shishen-shangguan`（篇-节）
  - 三命通会：`sanming-v01-wuxing`（卷号-章名）

---

## 8. 实施依赖

- **前置**：智谱 API Key（需注册 open.bigmodel.cn）
- **前置**：从 GitHub 仓库下载 Markdown 文件并整理为 sources JSON
- **运行时依赖**：智谱 Embedding API（每次 queryClassics 调用需编码 query）
- **无新 npm 依赖**：直接用 fetch 调 REST API
