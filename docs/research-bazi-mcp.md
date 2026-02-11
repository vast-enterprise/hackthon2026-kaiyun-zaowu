# cantian-ai/bazi-mcp 深度调研报告

> 调研目的：评估 bazi-mcp 能否替代自研八字计算模块，为「八字吉祥物 3D 生成应用」的 `calculate_bazi` tool 提供底层支撑。

---

## 1. 仓库概况

| 维度 | 详情 |
|------|------|
| 仓库 | `cantian-ai/bazi-mcp` |
| Stars | 251 |
| Forks | 90 |
| 语言 | TypeScript |
| License | ISC（宽松开源） |
| 默认分支 | **`dev`**（非 main） |
| npm 包名 | `bazi-mcp` (v0.1.0) |
| 最后提交 | 2025-10-11（4个月前） |
| 维护者 | wangtianlin (cantian-ai) |
| 前置要求 | **Node.js 22+** |

**活跃度评估**：中等。最后一次实质性代码变更在 2025-09-02（迁移到 TypeScript + cantian-tymext），之后只有一次清理 commit。有 3 个 open issues 未处理，PR 合并速度一般。

---

## 2. 架构与源码分析

### 2.1 目录结构

```
src/
├── mcp.ts          # MCP tool 定义（3 个 tools）
├── index.ts        # 核心业务逻辑入口
├── stdio.ts        # Stdio 传输层（npx 启动）
├── httpServer.ts   # Streamable HTTP 传输层（Express）
├── smithery.ts     # Smithery 部署适配
└── lib/
    ├── bazi.ts           # 八字排盘核心逻辑
    ├── date.ts           # 日期处理（ISO→SolarTime、时区转换）
    └── chineseCalendar.ts # 黄历信息
```

### 2.2 提供的 3 个 MCP Tools

#### Tool 1: `getBaziDetail`
- **输入**：公历时间(ISO) 或 农历时间、性别、早晚子时配置
- **输出**：完整八字排盘 JSON，包含：
  - 八字四柱（年柱/月柱/日柱/时柱），每柱含天干、地支、五行、阴阳、十神、藏干、纳音、旬空、星运、自坐
  - 胎元、胎息、命宫、身宫
  - 神煞（四柱各自的神煞列表）
  - 大运（10 步大运，含起运年龄、年份、天干十神、地支十神）
  - 刑冲合会（四柱之间的天干/地支关系）

#### Tool 2: `getSolarTimes`
- **输入**：八字字符串（如 "戊寅 己未 己卯 辛未"）
- **输出**：1700年至今所有匹配此八字的公历时间列表
- **用途**：反向查询，验证八字对应的实际出生日期

#### Tool 3: `getChineseCalendar`
- **输入**：公历时间(ISO)，可选，默认今天
- **输出**：黄历信息（农历、干支、生肖、纳音、节气、二十八宿、宜忌、方位等）

### 2.3 传输层

| 传输方式 | 启动命令 | 适用场景 |
|----------|----------|----------|
| Stdio | `npx bazi-mcp` | Claude Desktop / 本地 MCP client |
| Streamable HTTP | `npm start` → `POST /mcp` | 远程服务 / Web 应用集成 |

**注意**：HTTP 传输使用的是 MCP SDK 的 `StreamableHTTPServerTransport`，每个请求创建新的 transport 实例，无 session 持久化（`sessionIdGenerator: undefined`）。

---

## 3. 核心依赖分析

### 3.1 `tyme4ts` (v1.3.4+，实际最新 v1.4.2)

| 维度 | 详情 |
|------|------|
| 作者 | 6tail |
| Stars | 379 |
| License | **MIT** |
| 最后更新 | 5 天前（活跃维护中） |
| 无依赖 | 零外部依赖 |

**核心能力**：
- 公历 ↔ 农历转换
- 天干地支推算（SixtyCycle、HeavenStem、EarthBranch）
- 八字排盘（EightChar）
- 十神计算（getTenStar）
- 地势/长生十二神（getTerrain）
- 藏干（HideHeavenStem）
- 大运排算（DecadeFortune、ChildLimit）
- 节气、纳音、旬空
- 支持两种八字 Provider：DefaultEightCharProvider（早子时明天）和 LunarSect2EightCharProvider（早子时当天）

**评估**：这是一个成熟、高质量的日历/命理基础库，TypeScript 原生，是 Lunar.js 的升级版。bazi-mcp 的排盘能力完全依赖此库。

### 3.2 `cantian-tymext` (v0.0.21+，实际最新 v0.0.25)

| 维度 | 详情 |
|------|------|
| 维护者 | wangtianlin（同 bazi-mcp 作者） |
| License | **Proprietary（闭源）** |
| GitHub | **无公开仓库** |
| 依赖 | dayjs, tyme4ts |
| 版本 | 25 个版本，最新 3 个月前 |

**核心能力**（从 .d.ts 反推）：
- `calculateRelation()`：计算四柱之间的刑冲合会关系（天干冲/合、地支冲/合/害/破/刑/半合/三合等）
- `getShen()` / `getShenByZhu()`：计算神煞（年柱/月柱/日柱/时柱的神煞列表）
- `getShenFromDayun()`：计算大运/流年神煞
- `getGanColor()`：天干对应颜色
- `getWuxingRelation()`：五行生克关系
- `getHuangli()` / `getNow()`：黄历信息（比 chineseCalendar.ts 功能更全）

**风险评估**：
- **闭源**：核心神煞和刑冲合会逻辑在闭源包中，无法审计算法正确性
- **单一维护者**：如果作者停止维护，无法 fork 修复
- **但是**：对于你的项目来说，神煞和刑冲合会是 Agent 解读用的辅助信息，即使不完全准确也不影响核心流程

---

## 4. 已知问题与坑点

### 4.1 已修复的 Bug

#### Issue #5: `getBaziDetail` 返回空结果
- **原因**：十神获取方法有缺陷，PR #4 修复（删除 129 行旧代码，迁移到 cantian-tymext）
- **状态**：已修复
- **影响**：历史版本存在此问题，确保使用最新 npm 版本

### 4.2 未修复的问题

#### Issue #8: Stdio 启动时 `console.log` 污染 stdout（严重）
- **问题**：`stdio.ts` 中的 `console.log('Bazi MCP server is running on stdio.')` 会输出到 stdout，与 MCP JSON-RPC 协议冲突
- **影响**：Spring AI 等 MCP client 解析 JSON 失败
- **解决方案**：注释掉该 `console.log`，或改用 `console.error`
- **当前状态**：**未修复**，npm 最新版仍有此问题
- **对你的影响**：如果通过 stdio 方式调用，需要自行 fork 修复。如果通过 HTTP 方式调用则无影响

#### Issue #9: SDK 升级 + mcp-trace（Open PR）
- 外部贡献者提交，尚未合并
- 说明维护者对 PR 的响应不太及时

### 4.3 潜在坑点

| 坑点 | 说明 | 严重程度 |
|------|------|---------|
| **Node.js 22+ 强制要求** | tsconfig 继承 @tsconfig/node22，使用 ESM + top-level await | 高 |
| **默认分支是 dev** | clone 后默认不在 main 分支 | 低 |
| **npm 包体积 34.2MB** | 包含 dist + node_modules（不影响使用，但不规范） | 低 |
| **HTTP transport 无 session** | 每个请求创建新 transport，适合无状态调用 | 中 |
| **时区硬编码 +08:00** | `date.ts` 中 `toZonedTime(date, '+08:00')` 硬编码为东八区 | 中 |
| **无测试用例** | 仓库内无任何测试代码 | 高 |
| **MCP SDK 版本** | 使用 `^1.10.2`，Streamable HTTP 是较新特性 | 中 |
| **不提供喜用神** | 输出中无五行统计和喜用神判断 | **关键** |

---

## 5. 与设计方案的适配性分析

### 5.1 你需要的 vs bazi-mcp 提供的

| 设计方案需求 | bazi-mcp 是否支持 | 说明 |
|-------------|------------------|------|
| 输入出生日期和时辰 | ✅ | 支持公历 ISO 和农历两种输入 |
| 计算八字 | ✅ | 返回四柱完整信息 |
| 五行分析 | ⚠️ 部分 | 返回每个天干/地支的五行属性，但**不做五行统计和旺衰分析** |
| 喜用神判断 | ❌ | **不提供**。需要自行实现或由 Agent (LLM) 推理 |
| 支持 DeepSeek function calling | ❌ 不直接 | bazi-mcp 是 MCP 协议，不是 OpenAI function calling 格式 |
| 服务端调用（API Route 内） | ⚠️ 需改造 | 不能直接 import 核心函数，需绕过 MCP 层 |

### 5.2 关键差距

1. **喜用神缺失**：你的设计方案要求 Agent 能解读"五行分析"和"喜用神"来设计吉祥物。bazi-mcp 只提供原始排盘数据，喜用神需要额外逻辑。不过 LLM（DeepSeek）可能能从原始数据中推理出喜用神——但准确度存疑。

2. **MCP vs Function Calling**：bazi-mcp 封装为 MCP 协议的 server，而你的架构是 DeepSeek + function calling。两者协议不同，无法直接对接。

3. **集成方式选择**：
   - **方案 A**：直接 import `tyme4ts` + `cantian-tymext`，绕过 MCP 层，在你的 API Route 中直接调用
   - **方案 B**：运行 bazi-mcp 的 HTTP server，通过 HTTP 请求调用
   - **方案 C**：fork bazi-mcp，只提取核心计算逻辑

---

## 6. 集成方案建议

### 推荐：方案 A — 直接使用底层依赖

**不使用 bazi-mcp 本身**，而是直接使用它的两个核心依赖：

```typescript
// package.json 中添加
"tyme4ts": "^1.4.2",        // MIT，开源，活跃维护
"cantian-tymext": "^0.0.25"  // 闭源，但功能不可替代
```

**理由**：
- bazi-mcp 的核心价值全在 `tyme4ts` 和 `cantian-tymext` 两个 npm 包中
- `src/lib/bazi.ts` 只有 ~100 行代码，是对这两个库的组装调用
- 你的项目不需要 MCP 协议层，需要的是直接在 API Route 中调用计算函数
- 可以参考 bazi-mcp 的 `buildBazi()` 函数结构，但需要补充五行统计和喜用神逻辑

### 核心代码参考

```typescript
// lib/bazi/index.ts — 参考 bazi-mcp 的 src/lib/bazi.ts
import { LunarHour, SolarTime, EightChar, Gender, ChildLimit, LunarSect2EightCharProvider } from 'tyme4ts';
import { calculateRelation, getShen } from 'cantian-tymext';

// 1. 公历 → SolarTime → LunarHour
const solarTime = SolarTime.fromYmdHms(year, month, day, hour, minute, 0);
const lunarHour = solarTime.getLunarHour();

// 2. 获取八字
LunarHour.provider = new LunarSect2EightCharProvider(); // 早子时当天
const eightChar = lunarHour.getEightChar();

// 3. 十神、藏干等
const me = eightChar.getDay().getHeavenStem(); // 日主
me.getTenStar(eightChar.getYear().getHeavenStem()); // 年干十神

// 4. 神煞 (来自 cantian-tymext)
const gods = getShen(eightChar.toString(), gender);

// 5. 刑冲合会 (来自 cantian-tymext)
const relations = calculateRelation({...});

// 6. 大运
const childLimit = ChildLimit.fromSolarTime(solarTime, gender);
const decadeFortune = childLimit.getStartDecadeFortune();

// 7. 🔴 喜用神 — 需要自行实现，bazi-mcp 不提供
//    方案1: 自行实现五行旺衰分析算法
//    方案2: 在 system prompt 中指导 DeepSeek 从原始数据推理
```

### 关于喜用神的处理建议

喜用神是命理学中主观性较强的判断，不同流派算法不同。建议：

1. **先依赖 LLM 推理**：将完整排盘数据（含五行分布）传给 DeepSeek，在 system prompt 中要求它基于"身强身弱"原则判断喜用神。对于吉祥物设计这个场景，LLM 的命理推理精度已经足够。
2. **后续可补充算法**：如果 LLM 推理不准，再考虑实现规则化的喜用神算法。

---

## 7. 时区处理注意事项

bazi-mcp 的 `date.ts` 将所有输入时间强制转换为 **UTC+8（北京时间）**：

```typescript
const zonedDate = toZonedTime(date, '+08:00')
```

这在命理学上是正确的——八字排盘基于北京时间（也有"真太阳时"流派，但 bazi-mcp 不支持）。

你的前端需要确保用户输入的时间附带时区信息（ISO 格式如 `2000-05-15T12:00:00+08:00`），或者在 UI 上明确标注"请输入北京时间"。

---

## 8. 风险总结

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| `cantian-tymext` 闭源 + 停更 | 中 | 核心排盘依赖 tyme4ts（MIT），cantian-tymext 只负责神煞/刑冲合会，可后续替换 |
| 无喜用神输出 | 高 | LLM 推理 + 后续自研补充 |
| Node.js 22+ 要求 | 低 | Vercel 已支持 Node 22 |
| 无测试用例 | 中 | 对比已知排盘工具（如 cantian.ai 网站）做回归验证 |
| npm 包非最新代码 | 低 | 直接 npm install 使用即可，dev 分支仅有小幅改动 |

---

## 9. 结论

**bazi-mcp 本身不适合直接集成**（MCP 协议层不匹配），但其底层依赖 **`tyme4ts` + `cantian-tymext`** 可以直接作为你项目的八字计算引擎。

- `tyme4ts`：提供 90% 的排盘能力，MIT 开源，活跃维护，放心使用
- `cantian-tymext`：补充神煞和刑冲合会，闭源但风险可控
- 喜用神需要额外处理（LLM 推理 or 自研算法）
- bazi-mcp 的 `src/lib/bazi.ts` (~100行) 是很好的参考代码，可以直接复用其数据组装逻辑
