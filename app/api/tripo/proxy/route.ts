export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response('Missing url parameter', { status: 400 })
  }

  try {
    const upstream = await fetch(url)

    if (!upstream.ok) {
      return new Response('Failed to fetch upstream resource', { status: upstream.status })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'model/gltf-binary',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  catch {
    return new Response('Proxy error', { status: 502 })
  }
}
