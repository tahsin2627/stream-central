const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash';
  provider: string;
}

interface ScraperResult {
  success: boolean;
  sources?: StreamSource[];
  error?: string;
  fromCache?: boolean;
}

// Provider configurations - these use TMDB IDs for reliable matching
const PROVIDERS = [
  {
    name: 'netmirr',
    priority: 1,
    getPageUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://netmirr.net/tv/${tmdbId}/${season}/${episode}/`;
      }
      return `https://netmirr.net/movie/${tmdbId}/`;
    },
  },
  {
    name: 'moviesapi',
    priority: 2,
    getPageUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`;
      }
      return `https://moviesapi.club/movie/${tmdbId}`;
    },
  },
  {
    name: 'vidsrc.xyz',
    priority: 3,
    getPageUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    },
  },
  {
    name: 'embedsu',
    priority: 4,
    getPageUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
  {
    name: 'autoembed',
    priority: 5,
    getPageUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
    },
  },
];

// Extract HLS/MP4 URLs from HTML
const extractStreamsFromHtml = (html: string): { url: string; type: 'hls' | 'mp4' }[] => {
  const streams: { url: string; type: 'hls' | 'mp4' }[] = [];
  const seen = new Set<string>();
  
  // HLS patterns
  const hlsPatterns = [
    /["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']/gi,
    /file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /source:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /src:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /hls:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /playbackUrl["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /streamUrl["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /video_url["']?\s*[:=]\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
  ];
  
  // MP4 patterns
  const mp4Patterns = [
    /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)["']/gi,
    /file:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /source:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /src:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
  ];
  
  // Extract HLS
  for (const pattern of hlsPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0])
        .replace(/\\/g, '')
        .replace(/&amp;/g, '&')
        .replace(/["']/g, '');
      
      if (url.includes('.m3u8') && !seen.has(url) &&
          !url.includes('preview') && !url.includes('demo') && !url.includes('sample')) {
        seen.add(url);
        streams.push({ url, type: 'hls' });
      }
    }
  }
  
  // Extract MP4
  for (const pattern of mp4Patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0])
        .replace(/\\/g, '')
        .replace(/&amp;/g, '&')
        .replace(/["']/g, '');
      
      if (url.includes('.mp4') && !seen.has(url) &&
          !url.includes('trailer') && !url.includes('sample') && !url.includes('preview')) {
        seen.add(url);
        streams.push({ url, type: 'mp4' });
      }
    }
  }
  
  return streams;
};

// Scrape a provider using Firecrawl for JS rendering
const scrapeProvider = async (
  provider: typeof PROVIDERS[0],
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season: number | undefined,
  episode: number | undefined,
  firecrawlKey: string
): Promise<StreamSource[]> => {
  const pageUrl = provider.getPageUrl(tmdbId, mediaType, season, episode);
  console.log(`[${provider.name}] Scraping: ${pageUrl}`);
  
  try {
    // Use Firecrawl for JavaScript rendering
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pageUrl,
        formats: ['rawHtml'],
        waitFor: 12000, // Wait for video player to load
        timeout: 45000,
        actions: [
          // Try clicking play button if exists
          { type: 'click', selector: '.play-btn, .plyr__play-large, [data-plyr="play"], .jw-icon-playback, .vjs-big-play-button, button[aria-label*="play"]', ignoreIfNotFound: true },
          { type: 'wait', milliseconds: 3000 }
        ]
      }),
    });
    
    if (!response.ok) {
      console.log(`[${provider.name}] Firecrawl request failed: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const html = data.data?.rawHtml || '';
    
    if (!html || html.length < 1000) {
      console.log(`[${provider.name}] Got empty or minimal HTML`);
      return [];
    }
    
    console.log(`[${provider.name}] Got HTML length: ${html.length}`);
    
    const extractedStreams = extractStreamsFromHtml(html);
    
    const sources: StreamSource[] = extractedStreams.map(stream => ({
      url: stream.url,
      quality: 'HD',
      type: stream.type,
      provider: provider.name,
    }));
    
    console.log(`[${provider.name}] Extracted ${sources.length} streams`);
    return sources;
    
  } catch (error) {
    console.error(`[${provider.name}] Error:`, error);
    return [];
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tmdbId, mediaType, season, episode, forceRefresh } = await req.json();

    if (!tmdbId || !mediaType) {
      return new Response(
        JSON.stringify({ success: false, error: 'tmdbId and mediaType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraper not configured. Please connect Firecrawl.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for cache operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedStreams } = await supabase
        .from('stream_cache')
        .select('*')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .eq('is_working', true)
        .gt('expires_at', new Date().toISOString());

      // Filter by season/episode if TV show
      let filteredCache = cachedStreams || [];
      if (mediaType === 'tv' && season && episode) {
        filteredCache = filteredCache.filter(
          (s: any) => s.season === season && s.episode === episode
        );
      }

      if (filteredCache.length > 0) {
        console.log(`[Cache] Found ${filteredCache.length} cached streams`);
        const sources: StreamSource[] = filteredCache.map((s: any) => ({
          url: s.stream_url,
          quality: s.quality || 'HD',
          type: s.stream_type as 'hls' | 'mp4' | 'dash',
          provider: s.provider,
        }));
        
        return new Response(
          JSON.stringify({ success: true, sources, fromCache: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`[Scraper] Starting fresh scrape for TMDB ${tmdbId} (${mediaType})`);

    // Try each provider in priority order
    let allSources: StreamSource[] = [];
    
    for (const provider of PROVIDERS) {
      if (allSources.length >= 3) break; // Stop after finding enough sources
      
      const sources = await scrapeProvider(
        provider, 
        tmdbId, 
        mediaType, 
        season, 
        episode, 
        firecrawlKey
      );
      
      if (sources.length > 0) {
        allSources = [...allSources, ...sources];
        
        // Cache the successful streams
        for (const source of sources) {
          try {
            await supabase.from('stream_cache').upsert({
              tmdb_id: tmdbId,
              media_type: mediaType,
              season: season || null,
              episode: episode || null,
              provider: source.provider,
              stream_url: source.url,
              stream_type: source.type,
              quality: source.quality,
              is_working: true,
              last_verified_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            }, {
              onConflict: 'tmdb_id,media_type,season,episode,provider,stream_url'
            });
          } catch (cacheError) {
            console.error('[Cache] Error caching stream:', cacheError);
          }
        }
      }
    }

    if (allSources.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No streams found. Try using Find Sources for external links.',
          sources: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove duplicates by URL
    const uniqueSources = allSources.filter(
      (source, index, self) => index === self.findIndex(s => s.url === source.url)
    );

    console.log(`[Scraper] Total unique streams found: ${uniqueSources.length}`);

    return new Response(
      JSON.stringify({ success: true, sources: uniqueSources, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Scraper] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Scraper failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
