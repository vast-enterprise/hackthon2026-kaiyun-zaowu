import type { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  // TODO: 查询 Tripo 任务状态
  return new Response('Not implemented', { status: 501 })
}
