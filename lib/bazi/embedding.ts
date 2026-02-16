// lib/bazi/embedding.ts
import { createHmac } from 'node:crypto'

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4'

/** 生成智谱 API 的 JWT 令牌（HS256 签名，有效期 30 分钟） */
function generateToken(apiKey: string): string {
  const [id, secret] = apiKey.split('.')
  if (!id || !secret) throw new Error('Invalid ZHIPU_API_KEY format, expected {id}.{secret}')

  const header = { alg: 'HS256', sign_type: 'SIGN' }
  const now = Date.now()
  const payload = { api_key: id, exp: now + 1800000, timestamp: now }

  const b64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url')

  const headerB64 = b64url(header)
  const payloadB64 = b64url(payload)
  const signature = createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url')

  return `${headerB64}.${payloadB64}.${signature}`
}

function getAuthHeader(): string {
  const apiKey = process.env.ZHIPU_API_KEY
  if (!apiKey) throw new Error('ZHIPU_API_KEY environment variable is not set')
  return `Bearer ${generateToken(apiKey)}`
}

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(`${ZHIPU_API_BASE}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify({
      model: 'embedding-3',
      input: text,
      dimensions: 1024,
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
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify({
      model: 'embedding-3',
      input: texts,
      dimensions: 1024,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ZhiPu Embedding API error: ${res.status} ${(err as Record<string, Record<string, string>>).error?.message ?? ''}`)
  }

  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}
