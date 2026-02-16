/**
 * scripts/parse-classics.ts
 *
 * 将 data/classics/raw/ 下的 Markdown 原始文件解析为结构化 JSON，
 * 输出到 data/classics/sources/ 下的 5 个文件。
 *
 * 用法: npx tsx scripts/parse-classics.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── 类型 ───────────────────────────────────────────────

interface SourceEntry {
  id: string
  source: string
  chapter: string
  content: string
  keywords: string[]
}

// ─── 常量 ───────────────────────────────────────────────

const RAW_DIR = resolve(process.cwd(), 'data/classics/raw')
const OUT_DIR = resolve(process.cwd(), 'data/classics/sources')

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const SHISHEN = [
  '正官',
  '偏官',
  '七杀',
  '正印',
  '偏印',
  '枭神',
  '倒食',
  '正财',
  '偏财',
  '食神',
  '伤官',
  '比肩',
  '劫财',
]
const WUXING = ['木', '火', '土', '金', '水']
const SHENSHA = [
  '天乙贵人',
  '太极贵',
  '文昌',
  '学堂',
  '词馆',
  '驿马',
  '桃花',
  '华盖',
  '羊刃',
  '阳刃',
  '日刃',
  '亡神',
  '劫煞',
  '天德',
  '月德',
  '天月德',
  '空亡',
  '孤辰',
  '寡宿',
  '天罗',
  '地网',
  '魁罡',
  '日贵',
  '日德',
  '金舆',
  '禄',
  '贵人',
  '三奇',
  '元辰',
  '灾煞',
  '六厄',
  '勾绞',
  '拱禄',
  '拱贵',
  '飞天禄马',
  '六阴朝阳',
  '六乙鼠贵',
]
const GEJU = [
  '正官格',
  '偏官格',
  '正印格',
  '偏印格',
  '正财格',
  '偏财格',
  '食神格',
  '伤官格',
  '建禄格',
  '月刃格',
  '从格',
  '化格',
  '专旺格',
  '从强格',
  '从弱格',
  '从财格',
  '从杀格',
  '从儿格',
  '伤官配印',
  '伤官见官',
  '杀印相生',
  '食神制杀',
  '财官双美',
  '官杀混杂',
  '伤官生财',
]
const NAYIN = [
  '海中金',
  '炉中火',
  '大林木',
  '路旁土',
  '剑锋金',
  '山头火',
  '涧下水',
  '城头土',
  '白蜡金',
  '杨柳木',
  '泉中水',
  '屋上土',
  '霹雳火',
  '松柏木',
  '长流水',
  '砂中金',
  '山下火',
  '平地木',
  '壁上土',
  '金箔金',
  '覆灯火',
  '天河水',
  '大驿土',
  '钗钏金',
  '桑柘木',
  '大溪水',
  '砂中土',
  '天上火',
  '石榴木',
  '大海水',
]

// 天干拼音映射
const TIANGAN_PY: Record<string, string> = {
  甲: 'jia',
  乙: 'yi',
  丙: 'bing',
  丁: 'ding',
  戊: 'wu',
  己: 'ji',
  庚: 'geng',
  辛: 'xin',
  壬: 'ren',
  癸: 'gui',
}

// 地支拼音映射
const DIZHI_PY: Record<string, string> = {
  子: 'zi',
  丑: 'chou',
  寅: 'yin',
  卯: 'mao',
  辰: 'chen',
  巳: 'si',
  午: 'wu',
  未: 'wei',
  申: 'shen',
  酉: 'you',
  戌: 'xu',
  亥: 'hai',
}

// 月名 → 地支
const MONTH_DIZHI: Record<string, string> = {
  正月: '寅',
  二月: '卯',
  三月: '辰',
  四月: '巳',
  五月: '午',
  六月: '未',
  七月: '申',
  八月: '酉',
  九月: '戌',
  十月: '亥',
  十一月: '子',
  十二月: '丑',
}

// 季节拼音
const SEASON_PY: Record<string, string> = {
  三春: 'chun',
  三夏: 'xia',
  三秋: 'qiu',
  三冬: 'dong',
}

// 智谱 Embedding-3 上限 3072 tokens/条目，中文约 1.3-1.5 tokens/字
// 取保守值 2000 字，确保所有条目不超限
const MAX_CHUNK_CHARS = 2000

// ─── 工具函数 ───────────────────────────────────────────

function readRaw(filename: string): string {
  return readFileSync(resolve(RAW_DIR, filename), 'utf-8')
}

/** 按 ## 标题拆分 Markdown，返回 { title, body }[] */
function splitByH2(content: string): { title: string, body: string }[] {
  const sections: { title: string, body: string }[] = []
  const lines = content.split('\n')
  let currentTitle = ''
  let currentBody: string[] = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({
          title: currentTitle,
          body: currentBody.join('\n').trim(),
        })
      }
      currentTitle = line.replace(/^## /, '').trim()
      currentBody = []
    }
    else {
      currentBody.push(line)
    }
  }
  if (currentTitle || currentBody.length > 0) {
    sections.push({
      title: currentTitle,
      body: currentBody.join('\n').trim(),
    })
  }
  return sections
}

/** 清理内容：合并多余空行 */
function cleanContent(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 从内容和章节标题中提取关键词 */
function extractKeywords(content: string, chapter: string): string[] {
  const kws = new Set<string>()
  const text = `${chapter} ${content}`

  for (const tg of TIANGAN) {
    if (text.includes(tg))
      kws.add(tg)
  }
  for (const dz of DIZHI) {
    if (text.includes(dz))
      kws.add(dz)
  }
  for (const wx of WUXING) {
    if (text.includes(wx))
      kws.add(wx)
  }
  for (const ss of SHISHEN) {
    if (text.includes(ss))
      kws.add(ss)
  }
  for (const sh of SHENSHA) {
    if (text.includes(sh))
      kws.add(sh)
  }
  for (const gj of GEJU) {
    if (text.includes(gj))
      kws.add(gj)
  }
  for (const ny of NAYIN) {
    if (text.includes(ny))
      kws.add(ny)
  }

  return [...kws]
}

/** 生成零填充编号 */
function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/** 将超长文本按段落/句子边界分段，确保每段不超过 maxChars */
function splitLongContent(content: string, maxChars = MAX_CHUNK_CHARS): string[] {
  if (content.length <= maxChars) return [content]

  // 第一轮：按段落边界（\n\n）分段
  const paragraphs = content.split(/\n\n+/)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length === 0) {
      current = para
    }
    else if (current.length + 2 + para.length <= maxChars) {
      current += '\n\n' + para
    }
    else {
      if (current.length > 0) chunks.push(current)
      current = para
    }
  }
  if (current.length > 0) chunks.push(current)

  // 第二轮：对仍然超长的块按句子边界再拆
  const result: string[] = []
  for (const chunk of chunks) {
    if (chunk.length <= maxChars) {
      result.push(chunk)
      continue
    }
    // 按中文句号、感叹号、问号、分号、换行拆分，保留分隔符
    const sentences = chunk.split(/(?<=[。！？；\n])/)
    let buf = ''
    for (const sent of sentences) {
      if (buf.length === 0) {
        buf = sent
      }
      else if (buf.length + sent.length <= maxChars) {
        buf += sent
      }
      else {
        if (buf.length > 0) result.push(buf.trim())
        buf = sent
      }
    }
    if (buf.length > 0) result.push(buf.trim())
  }

  return result.filter(s => s.length > 0)
}

/** 对超长条目自动分段，生成带后缀 ID 的子条目 */
function splitEntries(entries: SourceEntry[]): SourceEntry[] {
  const result: SourceEntry[] = []

  for (const entry of entries) {
    const parts = splitLongContent(entry.content)
    if (parts.length === 1) {
      result.push(entry)
    }
    else {
      for (let i = 0; i < parts.length; i++) {
        result.push({
          id: `${entry.id}-p${pad(i + 1)}`,
          source: entry.source,
          chapter: `${entry.chapter}（${i + 1}/${parts.length}）`,
          content: parts[i],
          keywords: extractKeywords(parts[i], entry.chapter),
        })
      }
    }
  }

  return result
}

// ─── 穷通宝鉴 解析器 ─────────────────────────────────────

function parseQiongtong(): SourceEntry[] {
  const md = readRaw('穷通宝鉴.md')
  const sections = splitByH2(md)
  const entries: SourceEntry[] = []

  for (const sec of sections) {
    if (sec.title.includes('五行总论')) {
      entries.push({
        id: 'qiongtong-wuxing-zonglun',
        source: '穷通宝鉴',
        chapter: '五行总论',
        content: cleanContent(sec.body),
        keywords: extractKeywords(sec.body, sec.title),
      })
      continue
    }

    // 匹配 "论甲木" / "论乙木" / ...
    const stemMatch = sec.title.match(/论([甲乙丙丁戊己庚辛壬癸])([木火土金水])/)
    if (!stemMatch)
      continue

    const stem = stemMatch[1]
    const element = stemMatch[2]
    const stemPy = TIANGAN_PY[stem]
    const body = sec.body

    // 月份名列表
    const monthNames = [
      '正月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ]

    // 分离喜用提要
    const tiyaoMatch = body.match(new RegExp(`${stem}(?:木|火|土|金|水)喜用提要`))
    let mainBody = body
    let tiyaoContent = ''
    if (tiyaoMatch && tiyaoMatch.index !== undefined) {
      tiyaoContent = body.slice(tiyaoMatch.index).trim()
      mainBody = body.slice(0, tiyaoMatch.index).trim()
    }

    // 查找月份和季节分割点
    type SplitPoint = { kind: 'month', month: string, index: number }
      | { kind: 'season', season: string, index: number }

    const points: SplitPoint[] = []

    for (const mName of monthNames) {
      // "三春甲木正月甲木" 或 "正月甲木"
      const p1 = new RegExp(
        `(?:三春|三夏|三秋|三冬)?${stem}(?:木|火|土|金|水)?${mName}${stem}(?:木|火|土|金|水)`,
      )
      const m1 = mainBody.match(p1)
      if (m1 && m1.index !== undefined) {
        points.push({ kind: 'month', month: mName, index: m1.index })
        continue
      }
      const p2 = new RegExp(`${mName}${stem}(?:木|火|土|金|水)`)
      const m2 = mainBody.match(p2)
      if (m2 && m2.index !== undefined) {
        points.push({ kind: 'month', month: mName, index: m2.index })
      }
    }

    for (const season of ['三春', '三夏', '三秋', '三冬']) {
      const p = new RegExp(`${season}${stem}(?:木|火|土|金|水)总论`)
      const m = mainBody.match(p)
      if (m && m.index !== undefined) {
        points.push({ kind: 'season', season, index: m.index })
      }
    }

    points.sort((a, b) => a.index - b.index)

    if (points.length === 0) {
      entries.push({
        id: `qiongtong-${stemPy}-zonglun`,
        source: '穷通宝鉴',
        chapter: `论${stem}${element}`,
        content: cleanContent(mainBody),
        keywords: extractKeywords(mainBody, sec.title),
      })
    }
    else {
      // 天干总论
      const generalContent = mainBody.slice(0, points[0].index).trim()
      if (generalContent.length > 50) {
        entries.push({
          id: `qiongtong-${stemPy}-zonglun`,
          source: '穷通宝鉴',
          chapter: `论${stem}${element}·总论`,
          content: cleanContent(generalContent),
          keywords: extractKeywords(generalContent, `论${stem}${element}`),
        })
      }

      // 各分割段
      for (let i = 0; i < points.length; i++) {
        const pt = points[i]
        const nextIdx = i + 1 < points.length ? points[i + 1].index : mainBody.length
        const chunk = mainBody.slice(pt.index, nextIdx).trim()
        if (chunk.length < 20)
          continue

        if (pt.kind === 'season') {
          const sPy = SEASON_PY[pt.season] || 'unknown'
          entries.push({
            id: `qiongtong-${stemPy}-${sPy}-zonglun`,
            source: '穷通宝鉴',
            chapter: `${stem}${element}·${pt.season}总论`,
            content: cleanContent(chunk),
            keywords: extractKeywords(chunk, `${stem}${element} ${pt.season}`),
          })
        }
        else {
          const dz = MONTH_DIZHI[pt.month]
          const dzPy = DIZHI_PY[dz]
          entries.push({
            id: `qiongtong-${stemPy}-${dzPy}`,
            source: '穷通宝鉴',
            chapter: `${stem}${element}·${pt.month}（${dz}月）`,
            content: cleanContent(chunk),
            keywords: extractKeywords(chunk, `${stem}${element} ${pt.month} ${dz}月`),
          })
        }
      }
    }

    // 喜用提要
    if (tiyaoContent.length > 20) {
      entries.push({
        id: `qiongtong-${stemPy}-tiyao`,
        source: '穷通宝鉴',
        chapter: `${stem}${element}·喜用提要`,
        content: cleanContent(tiyaoContent),
        keywords: extractKeywords(tiyaoContent, `${stem}${element} 喜用提要`),
      })
    }
  }

  return entries
}

// ─── 子平真诠 解析器 ──────────────────────────────────────

function parseZiping(): SourceEntry[] {
  const upper = readRaw('子平真诠-上.md')
  const lower = readRaw('子平真诠-下.md')
  const entries: SourceEntry[] = []

  for (const md of [upper, lower]) {
    const sections = splitByH2(md)
    for (const sec of sections) {
      const chMatch = sec.title.match(/第\s*(\d+)\s*章\s*(.+)/)
      if (!chMatch)
        continue

      const chNum = chMatch[1].padStart(2, '0')
      const chName = chMatch[2].trim()

      entries.push({
        id: `ziping-ch${chNum}`,
        source: '子平真诠',
        chapter: `第${chNum}章·${chName}`,
        content: cleanContent(sec.body),
        keywords: extractKeywords(sec.body, chName),
      })
    }
  }

  return entries
}

// ─── 滴天髓 解析器 ────────────────────────────────────────

function parseDitian(): SourceEntry[] {
  const entries: SourceEntry[] = []

  // 1. 原文精简版
  const original = readRaw('滴天髓.md')
  const origSections = splitByH2(original)
  for (const sec of origSections) {
    if (!sec.title)
      continue
    const prefix = sec.title === '通神论' ? 'ts' : sec.title === '六亲论' ? 'lq' : ''
    if (prefix) {
      entries.push({
        id: `ditian-${prefix}-00`,
        source: '滴天髓',
        chapter: `${sec.title}·原文`,
        content: cleanContent(sec.body),
        keywords: extractKeywords(sec.body, sec.title),
      })
    }
  }

  // 2. 通神论阐微
  const tongShen = readRaw('滴天髓阐微-通神论.md')
  const tsSections = splitByH2(tongShen)
  let tsIdx = 0
  for (const sec of tsSections) {
    if (!sec.title || sec.body.length < 10)
      continue
    tsIdx++
    entries.push({
      id: `ditian-ts-${pad(tsIdx)}`,
      source: '滴天髓',
      chapter: `通神论·${sec.title}`,
      content: cleanContent(sec.body),
      keywords: extractKeywords(sec.body, sec.title),
    })
  }

  // 3. 六亲论阐微
  const liuQin = readRaw('滴天髓阐微-六亲论.md')
  const lqSections = splitByH2(liuQin)
  let lqIdx = 0
  for (const sec of lqSections) {
    if (!sec.title || sec.body.length < 10)
      continue
    lqIdx++
    entries.push({
      id: `ditian-lq-${pad(lqIdx)}`,
      source: '滴天髓',
      chapter: `六亲论·${sec.title}`,
      content: cleanContent(sec.body),
      keywords: extractKeywords(sec.body, sec.title),
    })
  }

  return entries
}

// ─── 渊海子平 解析器 ──────────────────────────────────────

function parseYuanhai(): SourceEntry[] {
  const entries: SourceEntry[] = []

  const files: { file: string, catSlug: string, catName: string }[] = [
    { file: '渊海子平.md', catSlug: 'zong', catName: '总篇' },
    { file: '渊海子平-基础篇.md', catSlug: 'jichu', catName: '基础' },
    { file: '渊海子平-十神篇.md', catSlug: 'shishen', catName: '十神' },
    { file: '渊海子平-格局篇.md', catSlug: 'geju', catName: '格局' },
    { file: '渊海子平-赋论.md', catSlug: 'fulun', catName: '赋论' },
    { file: '渊海子平-六亲篇.md', catSlug: 'liuqin', catName: '六亲' },
    { file: '渊海子平-女命篇.md', catSlug: 'nvming', catName: '女命' },
    { file: '渊海子平-神煞篇.md', catSlug: 'shensha', catName: '神煞' },
  ]

  for (const { file, catSlug, catName } of files) {
    const md = readRaw(file)
    const sections = splitByH2(md)
    let idx = 0

    for (const sec of sections) {
      if (!sec.title || sec.body.length < 10)
        continue
      idx++

      const cleanTitle = sec.title.replace(/[《》]/g, '').trim()

      entries.push({
        id: `yuanhai-${catSlug}-${pad(idx)}`,
        source: '渊海子平',
        chapter: `${catName}·${cleanTitle}`,
        content: cleanContent(sec.body),
        keywords: extractKeywords(sec.body, cleanTitle),
      })
    }
  }

  return entries
}

// ─── 三命通会 解析器 ──────────────────────────────────────

function parseSanming(): SourceEntry[] {
  const entries: SourceEntry[] = []

  const volumes: { file: string, vNum: string, vName: string }[] = [
    { file: '三命通会-卷一.md', vNum: 'v01', vName: '卷一' },
    { file: '三命通会-卷二.md', vNum: 'v02', vName: '卷二' },
    { file: '三命通会-卷三.md', vNum: 'v03', vName: '卷三' },
    { file: '三命通会-卷四.md', vNum: 'v04', vName: '卷四' },
    { file: '三命通会-卷五.md', vNum: 'v05', vName: '卷五' },
    { file: '三命通会-卷六.md', vNum: 'v06', vName: '卷六' },
    { file: '三命通会-卷七.md', vNum: 'v07', vName: '卷七' },
    { file: '三命通会-卷八.md', vNum: 'v08', vName: '卷八' },
    { file: '三命通会-卷九.md', vNum: 'v09', vName: '卷九' },
    { file: '三命通会-卷十.md', vNum: 'v10', vName: '卷十' },
  ]

  for (const { file, vNum, vName } of volumes) {
    const md = readRaw(file)
    const sections = splitByH2(md)
    let idx = 0

    for (const sec of sections) {
      if (!sec.title || sec.body.length < 10)
        continue
      // 跳过卷首序言
      if (sec.title.includes('分十二卷') || sec.title.includes('不署撰人'))
        continue
      idx++

      const cleanTitle = sec.title
        .replace(/《三命通会》\s*卷\s*[一二三四五六七八九十]+\s*[·.]?\s*/, '')
        .trim()

      entries.push({
        id: `sanming-${vNum}-${pad(idx, 3)}`,
        source: '三命通会',
        chapter: `${vName}·${cleanTitle}`,
        content: cleanContent(sec.body),
        keywords: extractKeywords(sec.body, cleanTitle),
      })
    }
  }

  return entries
}

// ─── 主函数 ──────────────────────────────────────────────

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const parsers: { name: string, file: string, parser: () => SourceEntry[] }[] = [
    { name: '穷通宝鉴', file: 'qiongtong.json', parser: parseQiongtong },
    { name: '子平真诠', file: 'ziping.json', parser: parseZiping },
    { name: '滴天髓', file: 'ditian.json', parser: parseDitian },
    { name: '渊海子平', file: 'yuanhai.json', parser: parseYuanhai },
    { name: '三命通会', file: 'sanming.json', parser: parseSanming },
  ]

  let totalChunks = 0

  for (const { name, file, parser } of parsers) {
    console.log(`\n解析 ${name}...`)
    const raw = parser()
    const entries = splitEntries(raw)
    const splitCount = entries.length - raw.length
    console.log(`  → ${raw.length} 条${splitCount > 0 ? `（分段后 ${entries.length} 条）` : ''}`)

    // 检查 ID 唯一性
    const ids = new Set<string>()
    for (const e of entries) {
      if (ids.has(e.id)) {
        console.warn(`  ⚠ 重复 ID: ${e.id}`)
      }
      ids.add(e.id)
    }

    // 检查 ID 是否纯 ASCII
    const nonAsciiIds = entries.filter(e => /[^\x20-\x7E]/.test(e.id))
    if (nonAsciiIds.length > 0) {
      console.warn(`  ⚠ ${nonAsciiIds.length} 个 ID 含非 ASCII: ${nonAsciiIds[0].id}`)
    }

    // 输出统计
    const avgLen = Math.round(
      entries.reduce((s, e) => s + e.content.length, 0) / entries.length,
    )
    const overLimit = entries.filter(e => e.content.length > MAX_CHUNK_CHARS)
    console.log(`  → 平均长度: ${avgLen} 字`)
    if (overLimit.length > 0) {
      console.warn(`  ⚠ ${overLimit.length} 条超过 ${MAX_CHUNK_CHARS} 字上限`)
    }
    console.log(`  → ID 样例: ${entries.slice(0, 3).map(e => e.id).join(', ')}`)

    const outPath = resolve(OUT_DIR, file)
    writeFileSync(outPath, JSON.stringify(entries, null, 2), 'utf-8')
    console.log(`  → 写入 ${outPath}`)

    totalChunks += entries.length
  }

  console.log(`\n完成！共 ${totalChunks} 条。`)
}

main()
