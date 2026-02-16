# RAG 经典文献知识库 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 给分析 Agent 添加 `queryClassics` 工具，让它在分析过程中可以主动查阅经典命理著作（穷通宝鉴、子平真诠、滴天髓、渊海子平、三命通会）。

**Architecture:** 离线脚本将经典原文分块并通过智谱 Embedding-3 向量化，存入 `data/classics/chunks.json`。运行时分析 Agent 调用 `queryClassics` 工具，实时编码查询文本，在内存中做 cosine similarity 匹配（~710 向量，毫秒级），返回 top 3 相关段落。

**数据来源：** GitHub 仓库 `s-theo/xx.theojs.cn`（`content/命/`），全部 Markdown 格式，23 个文件共 ~1.7MB。

**Tech Stack:** TypeScript, Vitest, 智谱 Embedding-3 REST API, Vercel AI SDK `generateText` with tools

**Design doc:** `docs/plans/2026-02-16-rag-classics-design.md`

---

### Task 1: ClassicChunk 类型 + cosineSimilarity 工具函数

**Files:**
- Create: `lib/bazi/classics.ts`
- Create: `lib/bazi/__tests__/classics.test.ts`

**Step 1: Write the failing tests**

Create `lib/bazi/__tests__/classics.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { cosineSimilarity } from '../classics'

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v = [1, 2, 3]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
  })

  it('should return 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })

  it('should return -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5)
  })

  it('should handle high-dimensional vectors', () => {
    const a = Array.from({ length: 1024 }, (_, i) => Math.sin(i))
    const b = Array.from({ length: 1024 }, (_, i) => Math.cos(i))
    const result = cosineSimilarity(a, b)
    expect(result).toBeGreaterThanOrEqual(-1)
    expect(result).toBeLessThanOrEqual(1)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run lib/bazi/__tests__/classics.test.ts`
Expected: FAIL — `cosineSimilarity` not found

**Step 3: Write minimal implementation**

Create `lib/bazi/classics.ts`:

```typescript
// lib/bazi/classics.ts

export interface ClassicChunk {
  id: string            // 唯一 ID，如 "qiongtong-jia-yin"
  content: string       // 原文段落（含白话注释）
  source: string        // 书名：穷通宝鉴 / 子平真诠 / 滴天髓 / 渊海子平 / 三命通会
  chapter: string       // 章节名
  keywords: string[]    // 人工标注关键词，如 ["甲木", "寅月", "调候"]
  embedding: number[]   // 智谱 Embedding-3 向量
}

export type SourceKey = 'qiongtong' | 'ziping' | 'ditian' | 'yuanhai' | 'sanming'

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run lib/bazi/__tests__/classics.test.ts`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add lib/bazi/classics.ts lib/bazi/__tests__/classics.test.ts
git commit -m "feat(classics): add ClassicChunk type and cosineSimilarity function"
```

---

### Task 2: 示例源数据文件

**Files:**
- Create: `data/classics/sources/qiongtong.json`
- Create: `data/classics/sources/yuanhai.json`

创建示例 source 文件，每部经典包含 2-3 条条目。这既是数据格式示例，也是后续测试的 fixture。实际的经典全文采集从 GitHub 仓库 `s-theo/xx.theojs.cn` 的 Markdown 文件中整理。

**Step 1: Create directory and sample data**

```bash
mkdir -p data/classics/sources
```

Create `data/classics/sources/qiongtong.json`:

```json
[
  {
    "id": "qiongtong-jia-yin",
    "source": "穷通宝鉴",
    "chapter": "甲木·寅月",
    "content": "甲木生于寅月，阳气初生，木势渐旺。初春犹带寒意，须丙火暖局为先。若见庚金修剪，反成栋梁之材。用神取丙火调候为急，庚金为辅。\n\n【白话】甲木在寅月（农历正月）出生，此时春天刚开始，木气逐渐旺盛。但初春还很冷，最需要丙火来暖和命局。如果有庚金来修剪，木反而能成大材。首选丙火调候为用神，庚金为辅助。",
    "keywords": ["甲木", "寅月", "丙火", "庚金", "调候", "初春"]
  },
  {
    "id": "qiongtong-jia-mao",
    "source": "穷通宝鉴",
    "chapter": "甲木·卯月",
    "content": "甲木生于卯月，正当木旺之时，阳和日暖。仲春无寒，不必调候。专取庚金为用，使甲木成器。若无庚金，虽巧无用。次取丁火泄秀，制庚辅甲。\n\n【白话】甲木在卯月（农历二月）出生，正是木气最旺的时候，天气已经暖和了。不需要调候，直接用庚金来雕琢甲木。如果没有庚金，命主虽然聪明但难有成就。其次用丁火来泄秀，也可以制约庚金、帮助甲木。",
    "keywords": ["甲木", "卯月", "庚金", "丁火", "仲春", "木旺"]
  },
  {
    "id": "qiongtong-yi-yin",
    "source": "穷通宝鉴",
    "chapter": "乙木·寅月",
    "content": "乙木生于寅月，阳回大地，万物萌芽。乙木虽柔，得寅月禄旺之气。取丙火暖局为先，癸水滋润为佐。若见阳光雨露齐备，自然花繁叶茂。\n\n【白话】乙木在寅月出生，阳气回暖，万物开始发芽。乙木虽然柔弱，但在寅月得到旺气的支持。首先需要丙火暖和命局，其次需要癸水来滋润。如果阳光和雨水都齐全，自然枝繁叶茂，命运亨通。",
    "keywords": ["乙木", "寅月", "丙火", "癸水", "调候", "初春"]
  }
]
```

Create `data/classics/sources/yuanhai.json`:

```json
[
  {
    "id": "yuanhai-tixiang-jia",
    "source": "渊海子平",
    "chapter": "干支体象·甲",
    "content": "甲木天干作首排，原无枝叶与根荄；欲存天地千年久，直向沙泥万丈埋。断就栋梁金得用，化成灰炭火为灾；蠢然块物无机事，一任春秋自往来。\n\n【释义】甲木为十天干之首，如参天大树，无枝无叶无根（纯阳之木）。要想千年不朽，须深埋土中。能被金雕琢成栋梁，遇火则化为灰烬。",
    "keywords": ["甲木", "天干", "体象", "庚金", "丙火"]
  },
  {
    "id": "yuanhai-shishen-shangguan",
    "source": "渊海子平",
    "chapter": "十神·论伤官",
    "content": "伤官者，其验如神。伤官务要伤尽；伤之不尽，官来乘旺，其祸不可胜言。伤官见官，为祸百端。倘月令在伤官之位，及四柱配合、作事皆在伤官之处；又行身旺乡，真贵人也。伤官主人多才艺、傲物气高，常以天下之人不如己。\n\n诗诀：伤官伤尽最为奇，尤恐伤多返不宜；此格局中千变化，推寻须要用心机。",
    "keywords": ["伤官", "伤官见官", "十神", "格局", "身旺"]
  }
]
```

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('data/classics/sources/qiongtong.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

Run: `node -e "JSON.parse(require('fs').readFileSync('data/classics/sources/yuanhai.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add data/classics/sources/qiongtong.json data/classics/sources/yuanhai.json
git commit -m "data(classics): add sample qiongtong and yuanhai source entries"
```

---

### Task 3: Embedding 客户端

**Files:**
- Create: `lib/bazi/embedding.ts`
- Create: `lib/bazi/__tests__/embedding.test.ts`

**Step 1: Write the failing tests**

Create `lib/bazi/__tests__/embedding.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { embedBatch, embedText } from '../embedding'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

describe('embedText', () => {
  it('should call ZhiPu API and return embedding vector', async () => {
    const fakeEmbedding = [0.1, 0.2, 0.3]
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: fakeEmbedding }] }),
    })

    const result = await embedText('甲木寅月调候')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://open.bigmodel.cn/api/paas/v4/embeddings')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.model).toBe('embedding-3')
    expect(body.input).toBe('甲木寅月调候')
    expect(result).toEqual(fakeEmbedding)
  })

  it('should throw on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Unauthorized' } }),
    })

    await expect(embedText('test')).rejects.toThrow()
  })
})

describe('embedBatch', () => {
  it('should send array of texts and return array of embeddings', async () => {
    const fakeEmbeddings = [[0.1, 0.2], [0.3, 0.4]]
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: fakeEmbeddings.map(e => ({ embedding: e })),
      }),
    })

    const result = await embedBatch(['text1', 'text2'])

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.input).toEqual(['text1', 'text2'])
    expect(result).toEqual(fakeEmbeddings)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run lib/bazi/__tests__/embedding.test.ts`
Expected: FAIL — module `../embedding` not found

**Step 3: Write minimal implementation**

Create `lib/bazi/embedding.ts`:

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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ZhiPu Embedding API error: ${res.status} ${(err as Record<string, Record<string, string>>).error?.message ?? ''}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ZhiPu Embedding API error: ${res.status} ${(err as Record<string, Record<string, string>>).error?.message ?? ''}`)
  }

  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run lib/bazi/__tests__/embedding.test.ts`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add lib/bazi/embedding.ts lib/bazi/__tests__/embedding.test.ts
git commit -m "feat(classics): add ZhiPu Embedding-3 client"
```

---

### Task 4: Chunks 加载器 + 搜索函数

**Files:**
- Modify: `lib/bazi/classics.ts` (追加 `loadChunks` + `searchClassics`)
- Modify: `lib/bazi/__tests__/classics.test.ts` (追加搜索相关测试)

**Context:** `searchClassics` 是给 `queryClassics` 工具调用的核心函数。它从 `chunks.json` 加载向量数据（带模块级缓存），按 source 过滤，用 cosine similarity 排序，返回 top 3。

**Step 1: Write the failing tests**

追加到 `lib/bazi/__tests__/classics.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClassicChunk } from '../classics'
import { cosineSimilarity, searchClassics } from '../classics'

// ... (keep existing cosineSimilarity tests) ...

describe('searchClassics', () => {
  // Mock the embedding module
  vi.mock('../embedding', () => ({
    embedText: vi.fn().mockResolvedValue([1, 0, 0]),
  }))

  // Mock chunks data loaded via fs
  const mockChunks: ClassicChunk[] = [
    {
      id: 'qiongtong-jia-yin',
      content: '甲木生于寅月，阳气初生',
      source: '穷通宝鉴',
      chapter: '甲木·寅月',
      keywords: ['甲木', '寅月'],
      embedding: [1, 0, 0],     // identical to query → score ~1
    },
    {
      id: 'ziping-ch1',
      content: '论用神',
      source: '子平真诠',
      chapter: '第一章',
      keywords: ['用神'],
      embedding: [0, 1, 0],     // orthogonal → score ~0
    },
    {
      id: 'ditian-ch1',
      content: '天道',
      source: '滴天髓',
      chapter: '通神论',
      keywords: ['天道'],
      embedding: [0.9, 0.1, 0], // close to query → high score
    },
  ]

  // Mock fs.readFileSync to return our mock chunks
  vi.mock('node:fs', () => ({
    readFileSync: vi.fn().mockReturnValue(JSON.stringify(mockChunks)),
    existsSync: vi.fn().mockReturnValue(true),
  }))

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return top results sorted by similarity', async () => {
    const results = await searchClassics('甲木寅月', 'all')
    expect(results).toHaveLength(3)
    expect(results[0].id).toBe('qiongtong-jia-yin')  // score ~1
    expect(results[1].id).toBe('ditian-ch1')          // score ~0.99
    expect(results[0].score).toBeGreaterThan(results[1].score)
  })

  it('should filter by source when specified', async () => {
    const results = await searchClassics('test', 'qiongtong')
    expect(results.every(r => r.source === '穷通宝鉴')).toBe(true)
  })

  it('should not include embedding in results', async () => {
    const results = await searchClassics('test', 'all')
    for (const r of results) {
      expect(r).not.toHaveProperty('embedding')
    }
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run lib/bazi/__tests__/classics.test.ts`
Expected: FAIL — `searchClassics` not exported

**Step 3: Write minimal implementation**

追加到 `lib/bazi/classics.ts`：

```typescript
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { embedText } from './embedding'

// ... (keep existing ClassicChunk, SourceKey, cosineSimilarity) ...

const SOURCE_MAP: Record<SourceKey, string> = {
  qiongtong: '穷通宝鉴',
  ziping: '子平真诠',
  ditian: '滴天髓',
  yuanhai: '渊海子平',
  sanming: '三命通会',
}

let chunksCache: ClassicChunk[] | null = null

export function loadChunks(): ClassicChunk[] {
  if (chunksCache) return chunksCache
  const filePath = resolve(process.cwd(), 'data/classics/chunks.json')
  if (!existsSync(filePath)) return []
  chunksCache = JSON.parse(readFileSync(filePath, 'utf-8'))
  return chunksCache!
}

export interface SearchResult {
  id: string
  content: string
  source: string
  chapter: string
  score: number
}

export async function searchClassics(
  query: string,
  source: SourceKey | 'all',
  topK = 3,
): Promise<SearchResult[]> {
  const queryEmbedding = await embedText(query)
  const chunks = loadChunks()
  const candidates = source === 'all'
    ? chunks
    : chunks.filter(c => c.source === SOURCE_MAP[source])

  return candidates
    .map(c => ({
      id: c.id,
      content: c.content,
      source: c.source,
      chapter: c.chapter,
      score: cosineSimilarity(queryEmbedding, c.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run lib/bazi/__tests__/classics.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add lib/bazi/classics.ts lib/bazi/__tests__/classics.test.ts
git commit -m "feat(classics): add chunks loader and searchClassics function"
```

---

### Task 5: queryClassics 工具接入分析 Agent

**Files:**
- Modify: `lib/bazi/analysis-agent.ts:1-84` (添加 queryClassics 工具到 generateText)
- Modify: `lib/bazi/__tests__/analysis-agent.test.ts` (可选：验证 prompt 中提及经典查阅)

**Context:** `queryClassics` 作为 `generateText` 的 tool 加入分析 Agent。分析 Agent 在推理过程中自主决定是否查阅经典、查什么内容、查哪本书。需要设置 `maxSteps` 允许多轮工具调用。

**Step 1: 修改 analysis-agent.ts**

在文件顶部添加 import：

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import { searchClassics } from './classics'
import type { SourceKey } from './classics'
```

在 `runAnalysis` 函数中修改 `generateText` 调用，添加 `tools` 和 `maxSteps`：

```typescript
export async function runAnalysis({ rawData, previousNote, question }: AnalyzeParams): Promise<AnalysisEntry> {
  const userContent = buildUserPrompt({ rawData, previousNote, question })

  const queryClassicsTool = tool({
    description: '查阅命理经典著作（穷通宝鉴、子平真诠、滴天髓、渊海子平、三命通会），可查术语释义、调候用法、格局论述、纳音、神煞、干支关系、命例分析等',
    parameters: z.object({
      query: z.string().describe('查询内容，如"伤官配印"、"甲木寅月用神"、"身弱财旺"、"天乙贵人"、"甲子海中金"'),
      source: z.enum(['all', 'ziping', 'ditian', 'qiongtong', 'yuanhai', 'sanming'])
        .optional()
        .default('all')
        .describe('指定经典：ziping=子平真诠, ditian=滴天髓, qiongtong=穷通宝鉴, yuanhai=渊海子平, sanming=三命通会, all=全部'),
    }),
    execute: async ({ query, source }) => {
      const results = await searchClassics(query, source as SourceKey | 'all')
      return results.map(r => ({
        content: r.content,
        source: r.source,
        chapter: r.chapter,
        score: r.score,
      }))
    },
  })

  const { text } = await generateText({
    model: deepseek('deepseek-chat'),
    system: ANALYSIS_SYSTEM_PROMPT,
    prompt: userContent,
    tools: { queryClassics: queryClassicsTool },
    maxSteps: 5,
  })

  return {
    question,
    content: text,
    references: extractReferences(text),
    createdAt: Date.now(),
  }
}
```

**Step 2: 更新 ANALYSIS_SYSTEM_PROMPT**

在现有 prompt 末尾追加工具说明：

```typescript
const ANALYSIS_SYSTEM_PROMPT = `你是一位命理分析引擎。你的任务是基于排盘数据,产出专业的八字命理分析。

规则:
- 所有结论必须有命盘数据作为依据,指出具体是哪柱、哪个十神、哪组关系
- 不需要考虑表达风格,不需要说人话,专注于分析的准确性和完整性
- 如果对某个判断不确定,明确标注不确定程度,而非给出模糊的万金油结论
- 分析中遇到特殊格局(从格、化格、专旺格等)时,须特别标注
- 输出格式为 Markdown

工具:
- queryClassics：查阅穷通宝鉴、子平真诠、滴天髓、渊海子平、三命通会等经典。需要查阅调候用法、格局论述、纳音论述、神煞论述、干支关系时主动调用。引用经典原文时标注出处（如《穷通宝鉴·甲木寅月》、《三命通会·论纳音取象》）。`
```

**Step 3: Run existing tests + build check**

Run: `pnpm vitest run lib/bazi/__tests__/analysis-agent.test.ts`
Expected: All existing tests still PASS（`buildUserPrompt` 和 `extractReferences` 不受影响）

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add lib/bazi/analysis-agent.ts
git commit -m "feat(classics): integrate queryClassics tool into analysis agent"
```

---

### Task 6: 离线 Embedding 脚本

**Files:**
- Create: `scripts/build-embeddings.ts`

**Context:** 读取 `data/classics/sources/*.json`（5 个文件：qiongtong / ziping / ditian / yuanhai / sanming），合并所有条目，批量调智谱 Embedding-3 生成向量，写入 `data/classics/chunks.json`。每批 10 条，批次间间隔 1 秒避免限流。预计 ~710 块，~71 批，耗时约 2 分钟。

**Step 1: Write the script**

Create `scripts/build-embeddings.ts`:

```typescript
// scripts/build-embeddings.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { embedBatch } from '../lib/bazi/embedding'

interface SourceEntry {
  id: string
  source: string
  chapter: string
  content: string
  keywords: string[]
}

interface ChunkWithEmbedding extends SourceEntry {
  embedding: number[]
}

const BATCH_SIZE = 10
const BATCH_DELAY_MS = 1000

async function main() {
  const sourcesDir = resolve(process.cwd(), 'data/classics/sources')
  const files = readdirSync(sourcesDir).filter(f => f.endsWith('.json'))

  console.log(`Found ${files.length} source files`)

  const allEntries: SourceEntry[] = []
  for (const file of files) {
    const entries: SourceEntry[] = JSON.parse(readFileSync(resolve(sourcesDir, file), 'utf-8'))
    console.log(`  ${file}: ${entries.length} entries`)
    allEntries.push(...entries)
  }

  console.log(`Total: ${allEntries.length} entries to embed`)

  const chunks: ChunkWithEmbedding[] = []

  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE)
    const texts = batch.map(e => e.content)
    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allEntries.length / BATCH_SIZE)}...`)

    const embeddings = await embedBatch(texts)

    for (let j = 0; j < batch.length; j++) {
      chunks.push({ ...batch[j], embedding: embeddings[j] })
    }

    // Rate limit: wait between batches
    if (i + BATCH_SIZE < allEntries.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  const outPath = resolve(process.cwd(), 'data/classics/chunks.json')
  writeFileSync(outPath, JSON.stringify(chunks, null, 2), 'utf-8')
  console.log(`Done! Wrote ${chunks.length} chunks to ${outPath}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Verify script can be invoked** (dry run without API key will fail at embedding, but should parse sources OK)

Run: `npx tsx scripts/build-embeddings.ts 2>&1 | head -5`
Expected: Shows "Found 2 source files" and "qiongtong.json: 3 entries" then fails at API call (no ZHIPU_API_KEY)

**Step 4: Commit**

```bash
git add scripts/build-embeddings.ts
git commit -m "feat(classics): add offline embedding build script"
```

---

### Task 7: 环境变量 + .gitignore + 构建验证

**Files:**
- Modify: `.env.example` (追加 ZHIPU_API_KEY)
- Modify: `.gitignore` (确保 `data/classics/chunks.json` 被忽略，source 文件不忽略)

**Step 1: 更新 .env.example**

追加：

```
# 智谱 Embedding
ZHIPU_API_KEY=
```

**Step 2: 更新 .gitignore**

追加：

```
# Classics embedding data (generated, large)
data/classics/chunks.json
```

**Step 3: Run full build**

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 4: Run all tests**

Run: `pnpm vitest run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add .env.example .gitignore
git commit -m "chore: add ZHIPU_API_KEY to env example, gitignore chunks.json"
```

---

## 后续手动任务（不在本计划内）

以下任务需要人工介入，不属于代码实施范畴：

1. **注册智谱 API Key**：前往 open.bigmodel.cn 注册并获取 API Key，写入 `.env`
2. **整理经典全文**：从 GitHub 仓库 `s-theo/xx.theojs.cn`（`content/命/`）下载 Markdown 文件，整理为 sources JSON 格式：
   - `qiongtong.json` — 穷通宝鉴（`穷通宝鉴.md`，106KB，~120 块）
   - `ziping.json` — 子平真诠评注（`子平真诠(上).md` + `(下).md`，267KB，~60 块）
   - `ditian.json` — 滴天髓阐微（`滴天髓.md` + `阐微(通神论).md` + `阐微(六亲论).md`，392KB，~150 块）
   - `yuanhai.json` — 渊海子平（主文件 + 6 个分类文件，189KB，~80 块）
   - `sanming.json` — 三命通会（卷一~卷十，734KB，~300 块）
3. **运行 embedding 脚本**：配置好 API Key + 完成文本整理后，运行 `npx tsx scripts/build-embeddings.ts` 生成 `chunks.json`
4. **端到端测试**：使用实际命盘数据测试分析 Agent 是否正确调用 `queryClassics` 并引用经典
