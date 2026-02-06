const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Enhanced NetMirr extractor using Firecrawl
const extractFromNetMirr = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season?: number,
  episode?: number,
  firecrawlKey?: string
): Promise<StreamSource[]> => {
  const pageUrl = mediaType === 'tv' && season && episode
    ? `https://netmirr.net/tv/${tmdbId}/${season}/${episode}/`
    : `https://netmirr.net/movie/${tmdbId}/`;

  console.log('[NetMirr] Extracting from:', pageUrl);
  
  const sources: StreamSource[] = [];
  
  // Method 1: Use Firecrawl for JavaScript rendering (preferred)
  if (firecrawlKey) {
    try {
      console.log('[NetMirr] Using Firecrawl for JS rendering...');
      
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: pageUrl,
          formats: ['rawHtml'],
          waitFor: 15000, // Wait 15s for video player to fully load
          timeout: 60000, // 60s timeout
          actions: [
            // Click play button if exists
            { type: 'click', selector: '.play-btn, .plyr__play-large, [data-plyr="play"], .jw-icon-playback, .vjs-big-play-button', ignoreIfNotFound: true },
            { type: 'wait', milliseconds: 5000 }
          ]
        }),
      });
      
      if (fcResponse.ok) {
        const data = await fcResponse.json();
        const html = data.data?.rawHtml || '';
        console.log('[NetMirr] Got HTML length:', html.length);
        
        // Extract HLS streams from the rendered HTML
        const hlsUrls = extractHlsFromHtml(html);
        for (const url of hlsUrls) {
          sources.push({ url, quality: 'HD', type: 'hls' });
        }
        
        // Extract MP4 streams
        const mp4Urls = extractMp4FromHtml(html);
        for (const url of mp4Urls) {
          sources.push({ url, quality: 'HD', type: 'mp4' });
        }
        
        if (sources.length > 0) {
          console.log(`[NetMirr] Firecrawl found ${sources.length} streams`);
          return sources;
        }
      } else {
        console.log('[NetMirr] Firecrawl request failed:', fcResponse.status);
      }
    } catch (e) {
      console.log('[NetMirr] Firecrawl error:', e);
    }
  }
  
  // Method 2: Direct fetch fallback (for non-JS rendered content)
  try {
    console.log('[NetMirr] Trying direct fetch...');
    
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://netmirr.net/',
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      console.log('[NetMirr] Direct fetch got HTML length:', html.length);
      
      const hlsUrls = extractHlsFromHtml(html);
      for (const url of hlsUrls) {
        if (!sources.find(s => s.url === url)) {
          sources.push({ url, quality: 'HD', type: 'hls' });
        }
      }
      
      const mp4Urls = extractMp4FromHtml(html);
      for (const url of mp4Urls) {
        if (!sources.find(s => s.url === url)) {
          sources.push({ url, quality: 'HD', type: 'mp4' });
        }
      }
    }
  } catch (e) {
    console.log('[NetMirr] Direct fetch failed:', e);
  }
  
  console.log(`[NetMirr] Total extracted: ${sources.length} streams`);
  return sources;
};

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
      const url = (match[1] || match[0])
        .replace(/\\/g, '')
        .replace(/&amp;/g, '&')
        .replace(/["']/g, '');
      
      if (url.includes('.m3u8') && 
          !url.includes('preview') && 
          !url.includes('demo') && 
          !url.includes('sample') &&
          !urls.includes(url)) {
        console.log('[Extract] Found HLS:', url.substring(0, 100) + '...');
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
      const url = (match[1] || match[0])
        .replace(/\\/g, '')
        .replace(/&amp;/g, '&')
        .replace(/["']/g, '');
      
      if (url.includes('.mp4') && 
          !url.includes('sample') && 
          !url.includes('trailer') && 
          !url.includes('preview') &&
          !urls.includes(url)) {
        console.log('[Extract] Found MP4:', url.substring(0, 100) + '...');
        urls.push(url);
      }
    }
  }
  
  return urls;
};

// Generic embed extractor
const extractFromEmbed = async (
  embedUrl: string,
  firecrawlKey?: string
): Promise<StreamSource[]> => {
  console.log('[Embed] Extracting from:', embedUrl);
  
  const sources: StreamSource[] = [];
  
  // Try Firecrawl first for JS-rendered embeds
  if (firecrawlKey) {
    try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: embedUrl,
          formats: ['rawHtml'],
          waitFor: 10000,
          timeout: 45000,
        }),
      });
      
      if (fcResponse.ok) {
        const data = await fcResponse.json();
        const html = data.data?.rawHtml || '';
        
        const hlsUrls = extractHlsFromHtml(html);
        for (const url of hlsUrls) {
          sources.push({ url, quality: 'HD', type: 'hls' });
        }
        
        const mp4Urls = extractMp4FromHtml(html);
        for (const url of mp4Urls) {
          sources.push({ url, quality: 'HD', type: 'mp4' });
        }
        
        if (sources.length > 0) {
          console.log(`[Embed] Firecrawl found ${sources.length} streams`);
          return sources;
        }
      }
    } catch (e) {
      console.log('[Embed] Firecrawl failed:', e);
    }
  }
  
  // Direct fetch fallback
  try {
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(embedUrl).origin,
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      
      const hlsUrls = extractHlsFromHtml(html);
      for (const url of hlsUrls) {
        if (!sources.find(s => s.url === url)) {
          sources.push({ url, quality: 'HD', type: 'hls' });
        }
      }
      
      const mp4Urls = extractMp4FromHtml(html);
      for (const url of mp4Urls) {
        if (!sources.find(s => s.url === url)) {
          sources.push({ url, quality: 'HD', type: 'mp4' });
        }
      }
    }
  } catch (e) {
    console.log('[Embed] Direct fetch failed:', e);
  }
  
  return sources;
};

// Backup embed providers for stream extraction
const BACKUP_PROVIDERS = [
  {
    name: 'VidSrc.xyz',
    getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}-${episode}`;
      }
      return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    },
  },
  {
    name: 'EmbedSu',
    getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
  {
    name: 'VidSrc.pro',
    getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/movie/${tmdbId}`;
    },
  },
];

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
    console.log('[Extract] Starting extraction, Firecrawl key present:', !!firecrawlKey);
    console.log('[Extract] Request:', embedUrl ? `Embed: ${embedUrl}` : `TMDB: ${tmdbId}, Type: ${mediaType}`);

    let sources: StreamSource[] = [];
    let provider = 'unknown';

    if (embedUrl) {
      // Extract from provided embed URL
      sources = await extractFromEmbed(embedUrl, firecrawlKey);
      provider = new URL(embedUrl).hostname;
    } else {
      // PRIORITY 1: NetMirr (best for dubbed content)
      console.log('[Extract] Priority 1: Trying NetMirr...');
      sources = await extractFromNetMirr(tmdbId, mediaType, season, episode, firecrawlKey);
      
      if (sources.length > 0) {
        provider = 'netmirr.net';
        console.log(`[Extract] NetMirr success: ${sources.length} streams`);
      } else {
        // PRIORITY 2: Try backup providers
        console.log('[Extract] NetMirr failed, trying backup providers...');
        
        for (const backupProvider of BACKUP_PROVIDERS) {
          const url = backupProvider.getUrl(tmdbId, mediaType, season, episode);
          console.log(`[Extract] Trying ${backupProvider.name}...`);
          
          const result = await extractFromEmbed(url, firecrawlKey);
          
          if (result.length > 0) {
            sources = result;
            provider = backupProvider.name.toLowerCase();
            console.log(`[Extract] ${backupProvider.name} success: ${result.length} streams`);
            break;
          }
        }
      }
    }

    if (sources.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No streams found. Try switching servers or use Find Sources.',
          provider,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ExtractionResult = {
      success: true,
      sources,
      provider,
    };

    console.log(`[Extract] Success: ${sources.length} streams from ${provider}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Extract] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Extraction failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
