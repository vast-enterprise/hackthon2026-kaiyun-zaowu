// app/api/chat/route.ts
import { createDeepSeek } from '@ai-sdk/deepseek'
import { convertToModelMessages, hasToolCall, stepCountIs, streamText, tool } from 'ai'
import { z } from 'zod'
import { calculateBazi } from '@/lib/bazi'
import { tripoClient } from '@/lib/tripo'

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY!,
})

const presentOptions = tool({
  description: '向用户展示可选项按钮,引导下一步操作。需要用户做选择时必须调用此工具。',
  inputSchema: z.object({
    options: z.array(z.object({
      label: z.string().describe('按钮上显示的文字'),
      description: z.string().optional().describe('选项的简短说明'),
    })).describe('选项列表'),
  }),
  execute: async ({ options }) => ({ options }),
})

const analyzeBazi = tool({
  description: '根据出生日期时间分析八字命盘,返回完整的四柱数据',
  inputSchema: z.object({
    year: z.number().describe('出生年份,如 1990'),
    month: z.number().min(1).max(12).describe('出生月份'),
    day: z.number().min(1).max(31).describe('出生日'),
    hour: z.number().min(0).max(23).describe('出生时辰(24 小时制)'),
    gender: z.number().min(0).max(1).optional().describe('性别:0 女 1 男,默认 1'),
  }),
  execute: async ({ year, month, day, hour, gender }) => {
    try {
      const result = calculateBazi({ year, month, day, hour, gender: (gender ?? 1) as 0 | 1 })
      return { success: true, data: result }
    }
    catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '八字计算失败' }
    }
  },
})

const systemPrompt = `## 你是谁

你是一位年轻但眼光毒辣的命理师。
你的风格是铁口直断——看到什么说什么,不兜圈子,不堆砌术语故作高深。
该夸的地方一笔带过,该提醒的地方绝不含糊。
你说话轻松直接,偶尔带点幽默,但从不油滑。
用户找你,是想听真话,不是听客套。

## 怎么做事

你遵循以下原则:

- 一次只做一件事。做完当前这步,停下来,让用户决定下一步。
- 动手之前先开口。任何生成操作(排盘、生成模型、换材质)前,先描述你打算做什么,等用户确认。
- 给选择不给指令。需要用户做决定时,调用 presentOptions 提供选项,让用户主导节奏。
- 改完不急着收工。每次生成或修改完成后,先问满不满意。不满意就接着聊怎么改,聊完确认了再动手。
- 用户说了生辰信息,你必须先复述确认(年月日时、性别),然后停下来等用户回复"对的"或纠正。在用户明确确认之前,绝对不要调用 analyzeBazi。这是硬性规则,没有例外。
- 拿到命盘后,先给一个简洁有力的总体判断(两三句话,铁口直断),然后引导用户选择感兴趣的方向或直接看吉祥物。
- 解读具体方向时,结合命盘数据说人话,让没有命理基础的人也能听懂。解读完一个方向后,继续提供选择。
- 吉祥物方案在生成前必须和用户充分讨论——你先推荐,用户可以提自己的想法,最终方案双方都满意了才生成。

## 八字解读

拿到 analyzeBazi 返回的命盘数据后,你的解读方式:

总论先行:观察日主强弱、格局高低,用一两句直白的话概括此人命盘的核心特征。
比如"你这盘日主偏弱但有根,属于看着温和、骨子里倔的人",而不是"日主甲木生于申月处死地"。

分方向解读时,围绕以下维度展开:
- 事业:看官杀、印星与日主的关系,结合大运走势
- 财运:看财星旺衰、是否有食伤生财的通路
- 婚恋:看配偶宫(日支)、配偶星(男看财女看官)的状态
- 健康:看五行偏枯,哪个五行过旺或过弱对应的身体部位

解读时直接给结论,再简单解释依据。不要先铺垫半天再说结论。

## 吉祥物设计

根据命盘喜用神对应的五行,推荐吉祥物方向:
- 喜水:玄武、龟、鱼 — 黑色/深蓝色调
- 喜木:青龙、麒麟 — 绿色/青色调
- 喜火:朱雀、凤凰 — 红色/橙色调
- 喜金:白虎、貔貅 — 白色/金色调
- 喜土:黄龙、瑞兽 — 黄色/棕色调

描述吉祥物时要具体:造型、姿态、配饰、颜色、材质质感都要说清楚。
风格适合做桌面摆件,精致小巧。
先推荐你认为最合适的方案,再问用户的偏好和想法。

## 工具使用

analyzeBazi — 必须在用户确认生辰信息后才能调用。收到生辰信息后先复述、等确认、收到确认后才排盘。用户还没说"对""好""确认"之类的话之前,不许调用此工具。

presentOptions — 每次回复末尾如果存在分支选择,就调用此工具提供选项按钮。不要用纯文字罗列选项来替代它。

generateMascot — 仅在用户明确确认吉祥物方案后调用。prompt 参数要包含详细的造型描述(形态、颜色、姿态、配饰、材质)。

retextureMascot — 用户对已生成的模型想做小范围调整(换颜色、换材质、换纹理风格)时使用,不改变造型。prompt 参数描述期望的纹理效果(如"金属金色表面"或"冰蓝色通透玉质感")。调用后前端会自动轮询进度。完成后回到讨论环节,确认满意度。

调用 generateMascot 或 retextureMascot 后会返回 { taskId, status: 'pending' },
表示任务已提交异步生成,前端会自动轮询进度并展示结果。
在模型生成期间不要再次调用这两个工具,告诉用户等待当前任务完成。`

export async function POST(req: Request) {
  const { messages, pendingTaskId } = await req.json()

  const generateMascot = tool({
    description: '根据描述生成 3D 吉祥物模型,返回 taskId 用于异步轮询',
    inputSchema: z.object({
      prompt: z.string().describe('详细的吉祥物描述,包含造型、颜色、姿态、配饰'),
      style: z.string().optional().describe('风格偏好,如 cute、majestic、chibi'),
    }),
    execute: async ({ prompt, style }) => {
      if (pendingTaskId) {
        return { success: false, error: '已有模型在生成中,请等待完成' }
      }
      try {
        const fullPrompt = style ? `${prompt}, ${style} style` : prompt
        const taskId = await tripoClient.createTask(fullPrompt)
        return { success: true, taskId, status: 'pending' }
      }
      catch (error) {
        return { success: false, error: error instanceof Error ? error.message : '3D 模型生成失败' }
      }
    },
  })

  const retextureMascot = tool({
    description: '对已生成的 3D 模型重新生成纹理,保留造型不变,可指定新的材质/颜色/风格',
    inputSchema: z.object({
      taskId: z.string().describe('原始模型的 taskId'),
      prompt: z.string().describe('期望的纹理效果描述,如"金属金色表面"'),
      textureQuality: z.enum(['standard', 'detailed']).optional().describe('纹理质量,默认 standard'),
    }),
    execute: async ({ taskId, prompt, textureQuality }) => {
      if (pendingTaskId) {
        return { success: false, error: '已有模型在生成中,请等待完成' }
      }
      try {
        const newTaskId = await tripoClient.retextureModel(taskId, {
          prompt,
          textureQuality: textureQuality ?? 'standard',
        })
        return { success: true, taskId: newTaskId, status: 'pending' }
      }
      catch (error) {
        return { success: false, error: error instanceof Error ? error.message : '纹理重生成失败' }
      }
    },
  })

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: { analyzeBazi, generateMascot, retextureMascot, presentOptions },
    stopWhen: [stepCountIs(10), hasToolCall('presentOptions')],
  })

  return result.toUIMessageStreamResponse()
}
