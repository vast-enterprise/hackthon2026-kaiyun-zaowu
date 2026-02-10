import type { NextRequest } from 'next/server'

export async function POST(_req: NextRequest) {
  // TODO: DeepSeek 流式对话 + tool calling
  return new Response('Not implemented', { status: 501 })
}
