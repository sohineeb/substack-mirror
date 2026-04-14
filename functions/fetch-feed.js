export async function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get('slug') || '').toLowerCase().trim();

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'invalid_slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const feedUrl = `https://${slug}.substack.com/feed`;

  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    const xml = await res.text();

    if (!res.ok) {
      return new Response(JSON.stringify({
        error: 'upstream_error',
        upstreamStatus: res.status,
        preview: xml.slice(0, 300),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!xml.includes('<rss') && !xml.includes('<feed')) {
      return new Response(JSON.stringify({
        error: 'not_rss',
        preview: xml.slice(0, 300),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'fetch_failed', message: e.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
