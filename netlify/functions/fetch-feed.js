exports.handler = async function (event) {
  const slug = (event.queryStringParameters?.slug || '').toLowerCase().trim();

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'invalid_slug' }),
    };
  }

  const feedUrl = `https://${slug}.substack.com/feed`;

  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(8000),
    });

    const xml = await res.text();

    // Return debug info alongside status so we can diagnose
    if (!res.ok) {
      return {
        statusCode: 200, // return 200 so client sees the debug info
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'upstream_error',
          upstreamStatus: res.status,
          preview: xml.slice(0, 500),
        }),
      };
    }

    if (!xml.includes('<rss') && !xml.includes('<feed')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'not_rss',
          preview: xml.slice(0, 500),
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
      body: xml,
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'fetch_failed', message: e.message }),
    };
  }
};
