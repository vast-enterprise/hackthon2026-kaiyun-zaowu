const _DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!
const _DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

export async function* chatStream(_messages: Array<{ role: string, content: string }>) {
  // TODO: 实现 DeepSeek 流式调用 + tool calling
  throw new Error('Not implemented')
}
