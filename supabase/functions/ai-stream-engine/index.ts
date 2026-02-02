const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StreamResult {
  source: string;
  sourceName: string;
  streamUrl: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash' | 'embed';
  confidence: number;
  embedUrl?: string;
}

interface AIEngineResponse {
  success: boolean;
  streams?: StreamResult[];
  error?: string;
}

// Embed providers that work reliably with TMDB IDs
const EMBED_PROVIDERS = {
  // TOP PRIORITY - Cineby (Best for Hindi/Regional content)
  cineby: {
    name: 'Cineby',
    priority: 1,
    getEmbed: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://www.cineby.gd/tv/${tmdbId}/${season}/${episode}?play=true`;
      }
      return `https://www.cineby.gd/movie/${tmdbId}?play=true`;
    },
  },
  vidsrc: {
    name: 'VidSrc',
    priority: 2,
    getEmbed: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
    },
  },
  vidsrcPro: {
    name: 'VidSrc Pro',
    priority: 3,
    getEmbed: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidsrc.pro/embed/movie/${tmdbId}`;
    },
  },
  superEmbed: {
    name: 'SuperEmbed',
    priority: 4,
    getEmbed: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    },
  },
  embedSu: {
    name: 'EmbedSu',
    priority: 5,
    getEmbed: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.su/embed/movie/${tmdbId}`;
    },
  },
  autoembed: {
    name: 'AutoEmbed',
    priority: 6,
    getEmbed: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
    },
  },
};

// Try to extract direct stream URL from embed page
const extractStreamFromEmbed = async (
  embedUrl: string,
  providerName: string,
  firecrawlKey: string
): Promise<StreamResult | null> => {
  try {
    console.log(`[AI Engine] Checking embed: ${embedUrl}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: embedUrl,
        formats: ['rawHtml'],
        waitFor: 8000, // Wait longer for player to load
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.log(`[AI Engine] Firecrawl failed for ${providerName}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.rawHtml || '';
    
    // Look for HLS streams
    const hlsPatterns = [
      /["'](https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)["']/gi,
      /file:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
      /source:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
      /src:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
      /hls:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    ];

    for (const pattern of hlsPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(html)) !== null) {
        const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&').replace(/["']/g, '');
        if (url.includes('.m3u8') && !url.includes('preview') && !url.includes('demo')) {
          console.log(`[AI Engine] Found HLS stream from ${providerName}`);
          return {
            source: providerName.toLowerCase(),
            sourceName: '🎬 AI Engine',
            streamUrl: url,
            quality: 'HD',
            type: 'hls',
            confidence: 0.9,
            embedUrl,
          };
        }
      }
    }

    // Look for MP4 streams
    const mp4Patterns = [
      /["'](https?:\/\/[^"'\s]+\.mp4[^"'\s]*)["']/gi,
      /file:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
      /source:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    ];

    for (const pattern of mp4Patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(html)) !== null) {
        const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&').replace(/["']/g, '');
        if (url.includes('.mp4') && !url.includes('sample') && !url.includes('trailer')) {
          console.log(`[AI Engine] Found MP4 stream from ${providerName}`);
          return {
            source: providerName.toLowerCase(),
            sourceName: '🎬 AI Engine',
            streamUrl: url,
            quality: 'HD',
            type: 'mp4',
            confidence: 0.85,
            embedUrl,
          };
        }
      }
    }

    // No direct stream found, but embed itself might work
    console.log(`[AI Engine] No direct stream from ${providerName}, returning embed URL`);
    return {
      source: providerName.toLowerCase(),
      sourceName: '🎬 AI Engine',
      streamUrl: embedUrl,
      quality: 'HD',
      type: 'embed',
      confidence: 0.7,
      embedUrl,
    };
  } catch (error) {
    console.error(`[AI Engine] Error extracting from ${providerName}:`, error);
    return null;
  }
};

// Verify embed URL is accessible
const verifyEmbed = async (embedUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(embedUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return response.ok || response.status === 200 || response.status === 302;
  } catch {
    return false;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, year, tmdbId, mediaType, season, episode } = await req.json();

    if (!title || !tmdbId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and TMDB ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    console.log(`[AI Engine] Searching for "${title}" (TMDB: ${tmdbId}, Type: ${mediaType})`);

    const streams: StreamResult[] = [];

    // Generate embed URLs for all providers
    const embedUrls = Object.entries(EMBED_PROVIDERS).map(([key, provider]) => ({
      key,
      name: provider.name,
      url: provider.getEmbed(tmdbId, mediaType, season, episode),
    }));

    // Quick verification - check which embeds are accessible
    const verificationResults = await Promise.all(
      embedUrls.map(async (embed) => ({
        ...embed,
        accessible: await verifyEmbed(embed.url),
      }))
    );

    const accessibleEmbeds = verificationResults.filter(e => e.accessible);
    console.log(`[AI Engine] ${accessibleEmbeds.length}/${embedUrls.length} embeds accessible`);

    // If we have Firecrawl, try to extract direct streams from top embeds
    if (firecrawlKey && accessibleEmbeds.length > 0) {
      // Only try first 2 to avoid timeouts
      const topEmbeds = accessibleEmbeds.slice(0, 2);
      
      const extractionResults = await Promise.all(
        topEmbeds.map(embed => 
          extractStreamFromEmbed(embed.url, embed.name, firecrawlKey)
        )
      );

      for (const result of extractionResults) {
        if (result) {
          streams.push(result);
        }
      }
    }

    // Add remaining embeds as fallback options
    for (const embed of accessibleEmbeds) {
      // Don't add duplicates
      if (!streams.find(s => s.embedUrl === embed.url)) {
        streams.push({
          source: embed.key,
          sourceName: '🎬 AI Engine',
          streamUrl: embed.url,
          quality: 'HD',
          type: 'embed',
          confidence: 0.6,
          embedUrl: embed.url,
        });
      }
    }

    // Sort by confidence
    streams.sort((a, b) => b.confidence - a.confidence);

    // Take top 5
    const topStreams = streams.slice(0, 5);

    console.log(`[AI Engine] Found ${topStreams.length} streams/embeds`);

    const response: AIEngineResponse = {
      success: topStreams.length > 0,
      streams: topStreams.length > 0 ? topStreams : undefined,
      error: topStreams.length === 0 ? 'No sources available for this content' : undefined,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AI Engine] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Search failed - please try again' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
