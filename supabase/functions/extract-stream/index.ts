const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash';
}

interface ExtractionResult {
  success: boolean;
  sources?: StreamSource[];
  error?: string;
  provider?: string;
}

// Helper: Extract HLS streams from HTML
const extractHlsFromHtml = (html: string): string[] => {
  const urls: string[] = [];
  const patterns = [
    /["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']/gi,
    /file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /source:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /src:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /hls:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /playbackUrl["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /streamUrl["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /video_url["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /manifestUrl["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
  ];
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&').replace(/["']/g, '');
      if (url.includes('.m3u8') && !url.includes('preview') && !url.includes('demo') && !url.includes('sample') && !urls.includes(url)) {
        urls.push(url);
      }
    }
  }
  return urls;
};

// Helper: Extract MP4 streams from HTML
const extractMp4FromHtml = (html: string): string[] => {
  const urls: string[] = [];
  const patterns = [
    /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)["']/gi,
    /file:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /source:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /src:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /video_url["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
  ];
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&').replace(/["']/g, '');
      if (url.includes('.mp4') && !url.includes('sample') && !url.includes('trailer') && !url.includes('preview') && !urls.includes(url)) {
        urls.push(url);
      }
    }
  }
  return urls;
};

// Fast extraction - direct fetch only (no Firecrawl overhead)
const fastExtract = async (url: string, referer: string): Promise<StreamSource[]> => {
  const sources: StreamSource[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s hard timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': referer,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const html = await response.text();
      for (const u of extractHlsFromHtml(html)) sources.push({ url: u, quality: 'HD', type: 'hls' });
      for (const u of extractMp4FromHtml(html)) sources.push({ url: u, quality: 'HD', type: 'mp4' });
    }
  } catch { /* timeout or network error */ }
  return sources;
};

// Firecrawl extraction - slower but handles JS-rendered pages
const firecrawlExtract = async (url: string, apiKey: string, waitMs = 8000): Promise<StreamSource[]> => {
  const sources: StreamSource[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s max
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['rawHtml'],
        waitFor: waitMs,
        timeout: 20000,
        actions: [
          { type: 'click', selector: '.play-btn, .plyr__play-large, [data-plyr="play"], .jw-icon-playback, .vjs-big-play-button', ignoreIfNotFound: true },
          { type: 'wait', milliseconds: 3000 }
        ]
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      const html = data.data?.rawHtml || '';
      for (const u of extractHlsFromHtml(html)) sources.push({ url: u, quality: 'HD', type: 'hls' });
      for (const u of extractMp4FromHtml(html)) sources.push({ url: u, quality: 'HD', type: 'mp4' });
    }
  } catch { /* timeout or API error */ }
  return sources;
};

// All providers with their URLs
const getProviderUrls = (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => [
  {
    name: 'NetMirr',
    url: mediaType === 'tv' && season && episode
      ? `https://netmirr.net/tv/${tmdbId}/${season}/${episode}/`
      : `https://netmirr.net/movie/${tmdbId}/`,
    referer: 'https://netmirr.net/',
    needsJs: true, // Needs Firecrawl for JS rendering
  },
  {
    name: 'MoviesAPI',
    url: mediaType === 'tv' && season && episode
      ? `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`
      : `https://moviesapi.club/movie/${tmdbId}`,
    referer: 'https://moviesapi.club/',
    needsJs: false,
  },
  {
    name: 'VidSrc.me',
    url: mediaType === 'tv' && season && episode
      ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
      : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
    referer: 'https://vidsrc.me/',
    needsJs: false,
  },
  {
    name: 'MultiEmbed',
    url: mediaType === 'tv' && season && episode
      ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`
      : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    referer: 'https://multiembed.mov/',
    needsJs: false,
  },
  {
    name: 'AutoEmbed',
    url: mediaType === 'tv' && season && episode
      ? `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
      : `https://player.autoembed.cc/embed/movie/${tmdbId}`,
    referer: 'https://player.autoembed.cc/',
    needsJs: false,
  },
];

// Check stream_cache for cached results
const checkCache = async (tmdbId: number, mediaType: string, season?: number, episode?: number): Promise<StreamSource[] | null> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    let url = `${supabaseUrl}/rest/v1/stream_cache?tmdb_id=eq.${tmdbId}&media_type=eq.${mediaType}&is_working=eq.true&expires_at=gt.${new Date().toISOString()}&select=stream_url,quality,stream_type`;
    if (season) url += `&season=eq.${season}`;
    if (episode) url += `&episode=eq.${episode}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return data.map((d: any) => ({
          url: d.stream_url,
          quality: d.quality || 'HD',
          type: d.stream_type as 'hls' | 'mp4',
        }));
      }
    }
  } catch (e) {
    console.log('[Cache] Check failed:', e);
  }
  return null;
};

// Save to stream_cache
const saveToCache = async (tmdbId: number, mediaType: string, sources: StreamSource[], provider: string, season?: number, episode?: number) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
    
    const rows = sources.map(s => ({
      tmdb_id: tmdbId,
      media_type: mediaType,
      stream_url: s.url,
      stream_type: s.type,
      quality: s.quality,
      provider,
      is_working: true,
      expires_at: expiresAt,
      season: season || null,
      episode: episode || null,
    }));
    
    await fetch(`${supabaseUrl}/rest/v1/stream_cache`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(rows),
    });
  } catch (e) {
    console.log('[Cache] Save failed:', e);
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { embedUrl, tmdbId, mediaType, season, episode } = await req.json();

    if (!embedUrl && !tmdbId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either embedUrl or tmdbId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const startTime = Date.now();
    console.log(`[Extract] Start - Firecrawl: ${!!firecrawlKey}, TMDB: ${tmdbId}, Type: ${mediaType}`);

    // FAST PATH: Check cache first
    if (tmdbId) {
      const cached = await checkCache(tmdbId, mediaType, season, episode);
      if (cached && cached.length > 0) {
        console.log(`[Extract] Cache HIT: ${cached.length} streams in ${Date.now() - startTime}ms`);
        return new Response(
          JSON.stringify({ success: true, sources: cached, provider: 'cache' } as ExtractionResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let sources: StreamSource[] = [];
    let provider = 'unknown';

    if (embedUrl) {
      // Single embed URL extraction
      const [fastResult, fcResult] = await Promise.allSettled([
        fastExtract(embedUrl, new URL(embedUrl).origin),
        firecrawlKey ? firecrawlExtract(embedUrl, firecrawlKey, 8000) : Promise.resolve([]),
      ]);
      
      sources = [
        ...(fastResult.status === 'fulfilled' ? fastResult.value : []),
        ...(fcResult.status === 'fulfilled' ? fcResult.value : []),
      ];
      // Deduplicate
      sources = [...new Map(sources.map(s => [s.url, s])).values()];
      provider = new URL(embedUrl).hostname;
    } else {
      // PARALLEL extraction from all providers at once
      const providers = getProviderUrls(tmdbId, mediaType, season, episode);
      
      // Phase 1: Fast extract from ALL providers in parallel (< 8s)
      console.log(`[Extract] Phase 1: Fast parallel extraction from ${providers.length} providers...`);
      const fastResults = await Promise.allSettled(
        providers.map(p => fastExtract(p.url, p.referer))
      );
      
      for (let i = 0; i < fastResults.length; i++) {
        const result = fastResults[i];
        if (result.status === 'fulfilled' && result.value.length > 0) {
          sources = result.value;
          provider = providers[i].name.toLowerCase();
          console.log(`[Extract] Phase 1 HIT: ${providers[i].name} - ${sources.length} streams in ${Date.now() - startTime}ms`);
          break;
        }
      }
      
      // Phase 2: Only if Phase 1 failed, try Firecrawl on JS-rendered providers
      if (sources.length === 0 && firecrawlKey) {
        console.log('[Extract] Phase 2: Firecrawl extraction for JS-rendered providers...');
        const jsProviders = providers.filter(p => p.needsJs);
        
        const fcResults = await Promise.allSettled(
          jsProviders.map(p => firecrawlExtract(p.url, firecrawlKey, 8000))
        );
        
        for (let i = 0; i < fcResults.length; i++) {
          const result = fcResults[i];
          if (result.status === 'fulfilled' && result.value.length > 0) {
            sources = result.value;
            provider = jsProviders[i].name.toLowerCase();
            console.log(`[Extract] Phase 2 HIT: ${jsProviders[i].name} - ${sources.length} streams in ${Date.now() - startTime}ms`);
            break;
          }
        }
      }
    }

    console.log(`[Extract] Total time: ${Date.now() - startTime}ms, Found: ${sources.length} streams`);

    // Cache successful results
    if (sources.length > 0 && tmdbId) {
      // Fire-and-forget cache save
      saveToCache(tmdbId, mediaType, sources, provider, season, episode).catch(() => {});
    }

    if (sources.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No streams found. Try switching servers or use Find Sources.', provider }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sources, provider } as ExtractionResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Extract] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Extraction failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
