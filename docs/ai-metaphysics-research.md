# AI 玄学术数智能体前沿进展调研报告

> 调研时间：2026-02-11
> 调研范围：八字、紫微斗数、易经/六爻/奇门遁甲/梅花易数、塔罗、占星/星盘、风水、面相/手相、生命预测模型
> 涵盖维度：产品、技术架构、学术论文、市场数据、伦理挑战

---

## 目录

- [一、市场全景](#一市场全景)
- [二、全品类产品矩阵](#二全品类产品矩阵)
  - [A. 八字（四柱命理）](#a-八字四柱命理)
  - [B. 紫微斗数](#b-紫微斗数)
  - [C. 易经 / 六爻 / 奇门遁甲 / 梅花易数](#c-易经--六爻--奇门遁甲--梅花易数)
  - [D. 塔罗](#d-塔罗)
  - [E. 占星 / 星盘](#e-占星--星盘)
  - [F. 风水](#f-风水)
  - [G. 面相 / 手相](#g-面相--手相)
- [三、核心技术架构演进](#三核心技术架构演进)
- [四、学术论文全景](#四学术论文全景)
  - [论文总表](#论文总表)
  - [重点论文深度解读](#重点论文深度解读)
- [五、关键挑战与争议](#五关键挑战与争议)
- [六、参考方向建议](#六参考方向建议)
- [七、参考来源](#七参考来源)

---

## 一、市场全景

### 1.1 全球市场规模

- 2024 年全球精神产品与服务市场规模已突破 **1801.8 亿美元**，预计 2032 年达 **2490.3 亿美元**
- 2025 年中国 AI 算命市场规模预计突破 **1200 亿元人民币**（艾媒咨询）
- 占星应用市场以 **23.52%** 年复合增长率增长，62.83% 的用户将其作为人生决策参考工具
- 2023 年全球身心能量疗愈市场规模 785.8 亿美元，预计 2030 年以 26.2% 复合增长率增长
- 2023 年塔罗牌市场规模 12.92 亿美元，预计 2030 年达 15.89 亿美元
- 印度占星应用市场预计从 2024 年 1.63 亿美元激增至 2030 年 **17.97 亿美元**

### 1.2 用户画像

- 核心需求群体集中在 **18-35 岁年轻女性**
- 国内该群体中近 50% 对玄学"感兴趣"或"非常感兴趣"，30% 有过命理咨询经历
- 仅国内对玄学感兴趣的 18-35 岁年轻女性就超过 **1.5 亿人**
- 某头部平台注册用户突破 8000 万，单日占卜服务超 200 万次

### 1.3 区域市场差异

| 区域 | 偏好特征 |
|------|----------|
| 北美 | 偏爱自我探索与心灵成长类内容 |
| 东南亚 | 文化亲近性高，对风水、择吉等实用功能接受度高 |
| 印度 | 婆罗门占星体系，市场爆发式增长 |
| 日韩 | AI 手相/面相接受度高（HelloBot 月入 $45 万） |
| 欧洲 | 监管严格，需"娱乐用途"过滤，德国禁用"命运""注定"等词汇 |

### 1.4 行业变现模式

头部平台已形成完整生态：

```
免费日运测算 → 付费解锁详细报告 → 购买开光物品 → 预约线下占星师
```

变现矩阵：广告(35%) + 内购(45%) + 电商(20%)

---

## 二、全品类产品矩阵

### A. 八字（四柱命理）

八字是中国传统命理中最复杂的体系，组合约 52 万种（含性别超 100 万种），本质是结构化的符号推演系统。DeepSeek R1 等推理模型的出现是关键转折点。

#### 代表产品

**1. FateTell — 首个产品化的 AI 八字命理平台**

- 官网：fatetell.com
- 定位：以八字为切入点，面向海外 C 端市场
- 技术栈：
  - 多模型集成：底层同时使用 DeepSeek、GPT、Claude、Gemini
  - RAG + Fine-tuning：将命理古籍和真人大师案例沉淀为知识库
  - Multi-Agent 架构：排盘 Agent、推理 Agent、解读 Agent 各司其职
  - 知识图谱 + 自研专家算法：覆盖五行生克、十神关系等确定性规则
- 评测体系：聘请公开客单价 3 万元/小时的命理师共建测评集
- 商业数据：订阅收入占 70%，5 人团队，单次命书 $39.9
- 产品形态：「命之书」（2 万字人生概览）+ 「运之书」（年月日运势）+ 右侧对话 Agent

**2. Cantian AI（参天AI）— 首个八字 MCP Server**

- GitHub：[cantian-ai/bazi-mcp](https://github.com/cantian-ai/bazi-mcp)（251 stars / 90 forks）
- 核心创新：用 MCP（Model Context Protocol）解决 LLM 排盘"幻觉"问题
- 架构：MCP Host（Claude Desktop 等客户端）↔ MCP Server（确定性排盘引擎）↔ LLM（语义解读）
- 将确定性计算（干支排盘、节气换算）与概率推理（大模型语义分析）分离
- 安装：`npx -y @smithery/cli install @cantian-ai/bazi-mcp --client claude`
- 需要 Node.js 22+

**3. Shenshu AI（神数AI）**

- 官网：[shen-shu.com](https://www.shen-shu.com/en/bazi-reading)
- 免费生成八字命盘 + AI 解读报告（无需注册）
- 提供合婚分析、大运流年预测、AI 命理师对话
- 支持 DeepSeek / ChatGPT / Claude / Gemini 多模型对比
- 加密传输 + 安全存储，免费模式不保存数据

**4. 其他八字产品**

| 产品 | 特点 |
|------|------|
| [OpenBazi](https://www.openbazi.com/) | AI 八字解读，界面简洁 |
| [BaziAI](https://www.bazi-ai.com) | DeepSeek R1 驱动，免费 3 次/天 + Premium |
| [Master Tsai AI Model](https://www.mastertsai.com/) | 教 ChatGPT/Copilot/Gemini 精确排盘的 Prompt 模型 |
| [华易网 AI 八字](https://m.k366.com/aibazi/) | "墨墨"AI 助手，免费智能排盘 |

### B. 紫微斗数

紫微斗数推理步骤相对八字简单，但星曜组合更为丰富。

| 产品 | 特点 |
|------|------|
| [py-iztro](https://www.v2ex.com/t/1118056) | Python 开源排盘库，基于 iztro JS 库移植，可接入 LLM 构建智能助手 |
| [紫微AI](https://blog.csdn.net/weixin_48708052/article/details/154943156) | 7000+ 条高质量内容库，结构化解释工具，面向普通用户 |
| [华易网 AI 紫微](https://m.k366.com/ziwei/aizw.htm) | 传统排盘 + AI 全维度解读融合 |

### C. 易经 / 六爻 / 奇门遁甲 / 梅花易数

达观数据王文广指出：梅花易数"显然是一个表示学习，它将日常场景学习成向量（卦名），然后通过八卦六爻五行模型预测"——可被视为一种早期的 AI 模型。

| 产品 | 覆盖范围 |
|------|----------|
| [灵爻妙解](https://lingyaomiaojie.com) | 六爻、六壬、奇门、太乙一站式平台，定位"易学大模型"，主张"拒绝迷信，以算法模拟古法" |
| [FortuneTellerGPT](https://zhuanlan.zhihu.com/p/1943856985448642122) | 紫微斗数 + 占星 + 易经 + 塔罗全覆盖，严格学术理论解盘 |
| DeepSeek 玄学方法论 | [知乎系统化教程](https://zhuanlan.zhihu.com/p/24914002567)，涵盖卦象占卜需要的时间/方位记录规范 |
| 开源排盘项目 | Python 实现的易经筮法、大六壬、奇门遁甲、太乙神数；JS 实现的在线排盘 |

### D. 塔罗

| 产品 | 特点 |
|------|------|
| [TarotQA](https://skywork.ai/skypage/en/TarotQA-Unveiled-A-Deep-Dive-into-the-Future-of-Free-AI-Tarot/1976527455369490432) | 免费 Web 端，支持多风格 AI 读牌者，NLP + LLM 驱动 |
| [Lens AI](https://www.lens-ai.net/) | 原子逻辑微调 LLM，从微信小程序扩展到 iOS/Android |
| Tarotoo | 免费 + 高级功能 $60/年，OpenAI API 后端 |
| Labyrinthos | 游戏化学习导向，适合想学习传统塔罗系统的用户 |
| [AI Tarot GPT](https://chatgpt.com/g/g-QWdNkyBrd-ai-tarot) | ChatGPT GPTs 塔罗专用 |

开发者实践：78 张塔罗牌映射为自然语言 prompt，每张牌标注正位关键词、逆位关键词、原型和主题（基于 Waite/Crowley 传统 + 荣格原型心理学）。

### E. 占星 / 星盘

| 产品 | 数据 |
|------|------|
| **Co-Star**（美国） | 全球累计下载 2374 万次，NASA 星历数据 + 极简美学 + 社交分享 |
| **Astrotalk**（印度） | 婆罗门占星体系，延伸面相手相服务，印度 iOS 生活类 Top 3 |
| **Moonly**（美国） | 东西方占星 + 塔罗融合，850 万用户，营收 $1200 万+ |
| **Nebula** | 星盘 + 塔罗 + 通灵 + 手相全覆盖，订阅制为主 + 单次付费 |

技术突破：传统占星师 20 分钟完成的星盘解读，AI 仅需 **0.3 秒**。实现数据融合（NASA 星历数据库）、机器学习（婚姻数据训练合盘模型）和可视化突破（三维动态星盘）。

### F. 风水

| 产品 | 功能 |
|------|------|
| [AI Feng Shui](https://www.aifengshui.app/blog/ai-fengshui-tools) | AI 空间分析与个性化风水建议 |
| [Lumen Feng](https://www.lumenfeng.com/) | AI 风水卧室布局规划：床位、能量场、睡眠方向分析 |
| [Feng Shui AI GPT](https://chatgpt.com/g/g-U6CP7j8iw-feng-shui-ai) | ChatGPT GPTs 风水专用 |
| Cantian AI（风水模块） | 结合八字数据提供综合风水建议 |

### G. 面相 / 手相

| 产品 | 技术 |
|------|------|
| **HelloBot**（韩国） | 20 万手掌图像训练，AI 掌纹分析准确率 79%，月收入 $45 万 |
| 百度文小言 | 看图测 MBTI、面相占卜、手相占卜功能模块 |
| 字节豆包 | "塔罗占卜师"智能体日均 120 万次交互，平均使用时长 8 分钟 |

未来方向：AI 算命将整合面部特征、掌纹、声纹分析和行为数据，实现多模态综合分析。

---

## 三、核心技术架构演进

### 架构 1：Prompt Engineering（入门级）

```
用户输入 → 排盘网站生成命盘 → 手动粘贴到 LLM → AI 解读
```

- **代表**：Master Tsai AI Model、各类 CSDN/知乎教程
- **优点**：成本低、快速验证
- **局限**：排盘与解读断裂，无法自动化，依赖用户手动操作

### 架构 2：MCP / Tool-use（工具增强型）

```
用户输入 → LLM 自动调用 MCP Server → 确定性排盘引擎返回结构化数据 → LLM 语义解读
```

- **代表**：Cantian AI bazi-mcp
- **核心思想**：将确定性计算（干支历法、节气换算）与概率推理（大模型语义分析）分离
- **优势**：排盘精准、LLM 专注推理、可扩展、开源生态
- **适用场景**：集成到 Claude Desktop / LobeChat 等 MCP 兼容客户端

### 架构 3：RAG + Fine-tuning + Multi-Agent（专业级）

```
用户输入 → 排盘 Agent → 格局分析 Agent（RAG 检索古籍）→ 流年推演 Agent → 解读生成 Agent → 对话 Agent
```

- **代表**：FateTell、MirrorAI
- **RAG 数据源**：《穷通宝典》《三命通会》《滴天髓》《渊海子平》等命理经典 + 真人命理师案例
- **评测体系**：专业命理师（客单价 3 万/小时）参与数据标注和质量评估
- **优势**：深度推理、千人千面、可商业化
- **挑战**：工作流复杂，生成速度慢，成本较高

### 架构 4：微调专用模型（私有化部署）

```
开源小模型（如 DeepSeek-R1-Distill-Qwen-7B）+ 命理标注数据集 → 微调 → 专属命理模型
```

- **代表**：百度飞桨教程、CSDN 微调实战
- **数据集格式**：messages 形式，设定系统角色为"精通八字/紫微/风水/易经的大师"
- **优势**：推理成本低、可私有部署、数据隐私可控
- **挑战**：需要高质量标注数据，泛化能力有限

### 架构 5：多模态融合（前沿方向）

```
用户输入（生辰 + 面部照片 + 手掌照片 + 环境照片）
  → CV 模型（面相分析 / 手相分析 / 风水环境分析）
  + 排盘引擎（八字/紫微/六爻等）
  + LLM（语义整合与解读）
  → 综合分析报告
```

- **代表**：HelloBot（手相 CV）、百度文小言（面相）
- **关键技术**：掌纹检测（U-Net）、面部特征提取、空间布局分析
- **趋势**：未来 AI 算命将从单一数据源走向多模态综合分析

### 架构对比总结

| 架构 | 排盘精度 | 推理深度 | 开发成本 | 部署难度 | 适合阶段 |
|------|----------|----------|----------|----------|----------|
| Prompt Engineering | 低 | 低 | 极低 | 极低 | 验证想法 |
| MCP / Tool-use | 高 | 中 | 低 | 低 | MVP 产品 |
| RAG + Multi-Agent | 高 | 高 | 高 | 中 | 商业化产品 |
| 微调专用模型 | 中 | 中-高 | 中 | 中 | 私有化部署 |
| 多模态融合 | 高 | 高 | 极高 | 高 | 下一代产品 |

---

## 四、学术论文全景

### 论文总表

| # | 论文标题 | 来源 | 年份 | 领域 | 核心贡献 |
|---|---------|------|------|------|----------|
| 1 | Using Sequences of Life-events to Predict Human Lives (life2vec) | Nature Computational Science | 2024.1 | 生命预测 | Transformer 建模人生事件序列，预测死亡率/人格，超越 SOTA |
| 2 | BaZi-Based Character Simulation Benchmark | arXiv:2510.23337 / WordPlay 2025 | 2025.10 | 八字+LLM | 首个八字-LLM 系统与评测基准，比 DeepSeek-v3/GPT-5-mini 准确率提升 30-63% |
| 3 | Super-intelligence or Superstition? | arXiv:2408.06602 / MIT Media Lab | 2024.8 | 心理学/HCI | 238 人实验：AI 预测信任度与占星信任度正相关，揭示"理性迷信"现象 |
| 4 | From Oracle to Model Science | SSRN | 2025 | 理论框架 | 将东方占卜重构为时空建模系统，连接系统科学与复杂性理论 |
| 5 | AI Fortune-telling: Imitation of Traditional Fortune-telling and Big Data Analysis | ResearchGate | 2025.3 | 综述 | AI 算命现象综述，讨论 life2vec 等模型与传统术数的关系 |
| 6 | Palmistry using Machine Learning | arXiv:2509.02248 | 2025.9 | 手相+CV | CV + DL 自动检测掌纹线、手丘，关联性格预测 |
| 7 | The Return of Pseudosciences in AI | arXiv:2411.18656 | 2024.11 | 伦理/批判 | 批判性审视 AI 如何复兴面相学等伪科学，提出伦理警示 |
| 8 | LLMs as Cultural Archives: Cultural Commonsense Knowledge Graph | arXiv:2601.17971 | 2025.1 | 文化AI | 构建文化常识知识图谱(CCKG)框架，为文化 AI 推理奠基 |
| 9 | life2vec 后续：变长事件生成模型 | arXiv:2506.01874 | 2025.6 | 生命预测 | 扩展 life2vec，支持事件发生时间和持续时间的自主生成 |
| 10 | Efficient Palm-Line Segmentation with U-Net Context Fusion Module | arXiv:2102.12127 | 2021 | 手相+CV | 深度学习掌纹线检测算法，手相 AI 的基础工作 |
| 11 | NādīML: Aligning Ancient Nādī Astrology with Machine Learning | TechRxiv | 2025 | 印度占星 | 将古印度 Nādī 棕榈叶占星术与 ML 技术对齐 |

### 重点论文深度解读

#### 论文 1：life2vec — 用 Transformer 预测人类生命轨迹

**发表**：Nature Computational Science, 2024 年 1 月

**作者**：Germans Savcisens, Tina Eliassi-Rad, Lars Kai Hansen, Laust Hvas Mortensen, Lau Lilleholt, Anna Rogers, Ingo Zettler, Sune Lehmann（丹麦技术大学等）

**核心方法**：
- 利用丹麦全民数据集，将人的一生（健康、教育、职业、收入、地址、工作时间等事件）编码为 token 序列
- 事件以天为粒度记录，用类似自然语言处理的方式建模人生事件序列
- 训练 Transformer 模型在单一向量空间中创建人生事件嵌入

**关键发现**：
- 嵌入空间具有高度结构化特征，模型可预测从早逝到人格特质的多种结果
- 处于领导岗位或高收入者存活概率更高，男性、技工或有精神诊断者死亡风险更高
- 预测准确率远超传统方法

**重要澄清**：
- 作者强调这不是"死亡预测器"，而是测试年轻群体 4 年内死亡率
- 病毒式传播中存在大量误读（如声称可预测具体死亡时间）
- 数据集和模型包含敏感信息，安全存储于丹麦统计局，不公开访问

**开源**：
- 基础实现：[carlomarxdk/life2vec-light](https://github.com/SocialComplexityLab/life2vec)
- 类距离加权交叉熵损失：carlomarxdk/cdw-cross-entropy-loss

**与玄学的关系**：life2vec 本质上是用数据驱动的方式做了传统命理一直在做的事——从人生早期信息预测未来走向。区别在于 life2vec 使用真实社会数据而非生辰八字。

---

#### 论文 2：BaZi-Based Character Simulation Benchmark

**发表**：arXiv:2510.23337, WordPlay Workshop 2025

**作者**：Siyuan Zheng, Pai Liu, Xi Chen, Jizheng Dong, Sihan Jia（MirrorAI Fund 资助）

**核心贡献**：
1. 首次将八字重新解释为"条件特征生成模型"——将时间离散化为符号属性，关联人格特质和时间动态，无需形而上学主张
2. 首个八字人物推理 QA 数据集：真实人生经历分类为财运、健康、亲缘、事业、感情
3. 首个八字-LLM 融合系统：符号推理 + 大语言模型

**系统架构**（四层）：
1. 输入层：生日、性别、出生地
2. 八字规则分析层
3. 八字推理层
4. 场景化解读层

**实验结果**：
- 比 DeepSeek-v3、GPT-5-mini 准确率提升 **30.3%–62.6%**
- 使用错误八字信息时，准确率下降 20%–45%（反向验证八字信息的有效性）
- 使用第 15 届全球命理师锦标赛（2024 年，香港少年风水师协会主办）真题做评测

**意义**：这是将传统中国命理学与现代 AI 结合的最严谨的学术尝试，为后续研究建立了基准。

---

#### 论文 3：Super-intelligence or Superstition?（MIT Media Lab）

**发表**：arXiv:2408.06602, 2024 年 8 月

**作者**：Eunhae Lee, Pat Pataranutaporn, Judith Amores, Pattie Maes（MIT Media Lab）

**研究问题**："对 AI 预测的信任是否只是另一种形式的迷信？"

**实验设计**：238 名参与者，对比 AI 预测、占星预测和人格心理学预测的信任度

**关键发现**：
- AI 预测信任度与占星/人格心理学预测信任度**正相关**
- 超自然信仰和对 AI 的正面态度显著增加了对 AI 预测的感知有效性、可靠性、有用性和个性化程度
- 尽责性与所有来源的预测信任度**负相关**
- 认知风格（分析型 vs 直觉型）对虚构 AI 预测的信任度**无显著影响**
- AI 正在成为一种"新型神谕"——人类学家 Christophe Lazaro 指出算法正扮演"人工占卜"的角色

**开源**：[mitmedialab/ai-superstition](https://github.com/mitmedialab/ai-superstition)

---

#### 论文 4：From Oracle to Model Science

**发表**：SSRN, 2025

**核心论点**：
- 东方占卜系统（中国占星、风水、易经）长期被视为迷信，但实际编码了一套精密的**时空建模系统**
- 综合系统科学、复杂性理论、时间认知和未来学方法，重构占卜实践的结构逻辑
- 占卜是"等待形式化的潜在预测范式"，隐含地处理了基于意识的系统的原型概念

---

#### 论文 6：Palmistry using Machine Learning

**发表**：arXiv:2509.02248, 2025 年 9 月

**方法**：
- 利用计算机视觉和深度学习自动检测和分析掌纹线、手丘等特征
- 从高分辨率手掌图像中提取生命线、头脑线、命运线、感情线
- 训练 ML 模型将手掌特征与性格洞察和预测结果关联

**意义**：将主观的传统手相术转化为可量化、可重复的机器学习问题。

---

#### 论文 7：The Return of Pseudosciences in AI

**发表**：arXiv:2411.18656, 2024 年 11 月

**核心警示**：
- 面相学、种族理论等伪科学正在通过 AI "改头换面"并获得合法性
- ML 设计者忘记了"相关不等于因果"的基本原则
- 仅减少训练数据偏差不够，需要重新思考核心模型、改进质量评估指标、保持人类监督
- 所有"面相 AI"（从面部特征推断性格/犯罪倾向/种族）都具有歧视性风险

---

#### 论文 8：LLMs as Cultural Archives

**发表**：arXiv:2601.17971, 2025 年 1 月

**核心贡献**：
- 引入文化常识知识图谱（CCKG）框架
- 评估 LLM 在需要文化背景推理的任务上的表现
- 使用 CCKG 路径作为上下文示例，显著提升了文化相关性
- 为构建"东方玄学知识图谱"提供了方法论参考

---

## 五、关键挑战与争议

### 5.1 技术挑战

| 挑战 | 详细说明 |
|------|----------|
| **排盘精度** | LLM 无法可靠完成干支历法转换、节气判断等确定性计算。DeepSeek 虽推理能力强，但排盘数据经常出错 |
| **推理深度** | 当前 LLM 水平约等于"初级命理师"，对特殊命格（如从格、化格）处理不足 |
| **一致性** | 同一命盘多次解读可能出现矛盾结论 |
| **评测标准** | 缺乏业界公认的术数 AI 评测基准，难以客观比较不同系统 |
| **训练数据质量** | 互联网上命理内容噪声大、不一致，需要专业标注 |

### 5.2 伦理风险

| 风险 | 案例/说明 |
|------|----------|
| **预言绑架** | 有高校学生因 AI 断言"2026 年前不宜恋爱"而刻意回避社交活动，最终陷入抑郁 |
| **伪科学复兴** | 学术界（arXiv:2411.18656）担忧 AI 正在为面相学等伪科学提供"科学合法性" |
| **商业偏见** | 训练数据中促销文本普遍存在，模型倾向推荐购买水晶、珠宝等消费品 |
| **隐私风险** | 生辰八字等个人信息可能被滥用 |
| **文化误读** | AI 对术语和概念的理解可能偏离传统含义 |

### 5.3 商业挑战

| 挑战 | 说明 |
|------|------|
| **出海文化壁垒** | 干支五行术语体系复杂，海外用户认知基础薄弱，信任建立门槛高 |
| **监管合规** | 欧盟 AI 法要求"娱乐用途"过滤；德国禁用"命运""注定"等确定性词汇 |
| **付费转化** | 仅 12% 的用户认为 AI 算命真正影响决策，更多人视为娱乐 |
| **竞争壁垒** | Prompt Engineering 门槛低，产品同质化严重 |

---

## 六、参考方向建议

### 方向 1：MCP + Multi-Agent 全术数平台

整合八字、紫微、六爻、奇门等多种术数排盘引擎为 MCP Server，上层用 Multi-Agent 协同完成排盘→分析→解读→对话全链路。

- 技术参考：Cantian AI bazi-mcp 架构
- 差异化：全品类覆盖，一站式玄学服务
- 可行性：高（开源组件成熟）

### 方向 2：多模态玄学 AI

结合 CV（面相/手相/风水环境分析）+ 排盘引擎 + LLM，提供"照片 + 生辰"一站式综合分析。

- 市场验证：HelloBot 手相方向月入 $45 万
- 技术参考：arXiv:2509.02248 掌纹 ML、U-Net 掌纹分割
- 差异化：多模态数据融合

### 方向 3：life2vec 式"命运语言模型"

借鉴 life2vec 论文思路，将术数规则（五行生克、十神关系、大运流年）形式化为 token 序列，训练专用 Transformer。

- 学术价值：最高，可发表论文
- 技术参考：Nature Computational Science life2vec、arXiv:2510.23337 BaZi Benchmark
- 挑战：需要大规模标注数据集

### 方向 4：文化知识图谱 + RAG

构建"东方玄学知识图谱"（覆盖八字、紫微、易经、风水等体系的概念、规则、关系），结合 RAG 增强 LLM 推理。

- 技术参考：arXiv:2601.17971 LLMs as Cultural Archives 的 CCKG 框架
- 差异化：知识体系完整性，可减少 LLM 幻觉
- 衍生价值：知识图谱本身可作为学术贡献

### 方向 5：出海赛道

全球精神消费 1800 亿美元，市场空间巨大。

- 切入点：合婚/感情（高付费意愿）、年度运势（高时效性）
- 区域选择：东南亚（文化亲近）、印度（市场爆发）、北美（心灵成长需求）
- 挑战：本地化、合规
- 参考：FateTell 海外 C 端模式

### 方向 6：评测基准建设

目前缺乏公认的术数 AI 评测标准。

- 参考：arXiv:2510.23337 BaZi Benchmark 思路
- 扩展品类：紫微斗数、六爻、占星等
- 评测维度：排盘准确率、推理一致性、专家评分、用户满意度
- 学术价值：可建立该领域标准

---

## 七、参考来源

### 学术论文

1. Savcisens et al. "Using Sequences of Life-events to Predict Human Lives." *Nature Computational Science* 4, no. 1 (2024): 43–56. [Nature](https://www.nature.com/articles/s43588-023-00573-5) | [arXiv:2306.03009](https://arxiv.org/abs/2306.03009) | [GitHub](https://github.com/SocialComplexityLab/life2vec)
2. Zheng et al. "BaZi-Based Character Simulation Benchmark: Evaluating AI on Temporal and Persona Reasoning." [arXiv:2510.23337](https://arxiv.org/abs/2510.23337) (2025)
3. Lee et al. "Super-intelligence or Superstition?" [arXiv:2408.06602](https://arxiv.org/abs/2408.06602) (2024) | [GitHub](https://github.com/mitmedialab/ai-superstition)
4. Yi Jing. "From Oracle to Model Science: Reframing Eastern Divination Through Spatiotemporal Systems." [SSRN](https://papers.ssrn.com/sol3/Delivery.cfm/7717adb6-ae07-40ff-8180-407be74f8ebd-MECA.pdf?abstractid=5378826&mirid=1) (2025)
5. Duan et al. "AI Fortune-telling: The Imitation of Traditional Fortune-telling and Big Data Analysis." [ResearchGate](https://www.researchgate.net/publication/389940080_AI_Fortune-telling_The_Imitation_of_Traditional_Fortune-telling_and_Big_Data_Analysis) (2025)
6. "Palmistry using Machine Learning." [arXiv:2509.02248](https://arxiv.org/html/2509.02248v1) (2025)
7. "The Return of Pseudosciences in Artificial Intelligence." [arXiv:2411.18656](https://arxiv.org/html/2411.18656v1) (2024)
8. "LLMs as Cultural Archives: Cultural Commonsense Knowledge Graph Extraction." [arXiv:2601.17971](https://arxiv.org/html/2601.17971) (2025)
9. "life2vec 后续：变长事件生成模型." [arXiv:2506.01874](https://arxiv.org/pdf/2506.01874) (2025)
10. "Efficient Palm-Line Segmentation with U-Net Context Fusion Module." [arXiv:2102.12127](https://arxiv.org/abs/2102.12127) (2021)

### 产品与开源项目

11. Cantian AI bazi-mcp: [GitHub](https://github.com/cantian-ai/bazi-mcp) | [官网](https://www.cantian.ai/en)
12. Shenshu AI: [官网](https://www.shen-shu.com/en/bazi-reading)
13. OpenBazi: [官网](https://www.openbazi.com/)
14. BaziAI: [官网](https://www.bazi-ai.com)
15. Master Tsai AI Model: [官网](https://www.mastertsai.com/)
16. py-iztro: [V2EX](https://www.v2ex.com/t/1118056)
17. 灵爻妙解: [官网](https://lingyaomiaojie.com)
18. TarotQA: [Skywork](https://skywork.ai/skypage/en/TarotQA-Unveiled-A-Deep-Dive-into-the-Future-of-Free-AI-Tarot/1976527455369490432)
19. Lens AI: [官网](https://www.lens-ai.net/)
20. AI Feng Shui: [官网](https://www.aifengshui.app/blog/ai-fengshui-tools)
21. Lumen Feng: [官网](https://www.lumenfeng.com/)

### 行业报道与市场数据

22. [36氪·对话 FateTell 创始人西元](https://news.qq.com/rain/a/20250617A08F8O00)
23. [AITOP100·AI 算命崛起](https://www.aitop100.cn/infomation/details/20060.html)
24. [KR-Asia·FateTell startup](https://kr-asia.com/think-ai-cant-tell-your-fortune-this-startup-tapping-eastern-metaphysics-says-otherwise)
25. [远瞻慧库·玄学出海报告](https://www.baogaobox.com/insights/250823000018312.html)
26. [人人都是产品经理·AI 加持下的 Z 世代](https://www.woshipm.com/ai/6277159.html)
27. [1800 亿 AI+玄学市场](https://m.thepaper.cn/newsDetail_forward_32044641)
28. [SCMP·Young Chinese turning to AI fortune-telling](https://www.scmp.com/lifestyle/chinese-culture/article/3317206/how-young-chinese-are-turning-ai-tell-their-fortune-amid-fear-future)
29. [文学城·2026 年还有谁在沉迷 AI 算命](https://www.wenxuecity.com/news/2026/01/15/126491725.html)
30. [Skywork·BaZi MCP 技术解析](https://skywork.ai/skypage/en/bazi-ai-engineer-code/1981206600771096576)
31. [MCP Goes Viral, AI Fortune-Telling to Be Revolutionized](https://astrodir.com/blog/mcp-goes-viral-ai-fortune-telling-industry-to-be-revolutionized)
32. [知乎·DeepSeek 玄学预测方法论](https://zhuanlan.zhihu.com/p/24914002567)
33. [知乎·生辰八字本质竟是数学公式](https://zhuanlan.zhihu.com/p/28044494041)
34. [达观数据·人工智能就是八卦](https://www.datagrand.com/blog/ai-5.html)
