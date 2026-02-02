const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const streamUrl = url.searchParams.get('url');
    const referer = url.searchParams.get('referer');
    
    if (!streamUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proxying stream: ${streamUrl.substring(0, 100)}...`);

    const streamOrigin = new URL(streamUrl).origin;
    
    // Build headers - try multiple referer strategies
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity', // Don't compress for streaming
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    // Use custom referer if provided, otherwise use stream origin
    if (referer) {
      headers['Referer'] = referer;
      headers['Origin'] = new URL(referer).origin;
    } else {
      headers['Referer'] = streamOrigin + '/';
      headers['Origin'] = streamOrigin;
    }

    // Forward range header for seeking support
    const rangeHeader = req.headers.get('Range');
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    // First attempt with standard headers
    let response = await fetch(streamUrl, { method: 'GET', headers });

    // If 401/403, retry without Origin/Referer (some CDNs block cross-origin)
    if (response.status === 401 || response.status === 403) {
      console.log('Auth failed, retrying without referrer...');
      const minimalHeaders: HeadersInit = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      };
      if (rangeHeader) {
        minimalHeaders['Range'] = rangeHeader;
      }
      response = await fetch(streamUrl, { method: 'GET', headers: minimalHeaders });
    }

    // If still failing, try with no headers at all
    if (response.status === 401 || response.status === 403) {
      console.log('Retry failed, trying bare request...');
      response = await fetch(streamUrl);
    }

    if (!response.ok && response.status !== 206) {
      console.error(`Stream fetch failed: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          error: `Stream unavailable: ${response.status}`,
          hint: response.status === 401 ? 'Stream requires authentication' : 'Stream not accessible'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get content type from response
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const contentLength = response.headers.get('Content-Length');
    const contentRange = response.headers.get('Content-Range');

    // Build response headers
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange;
    }

    // Stream the response body
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to proxy stream' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
