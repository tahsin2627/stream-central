const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StreamResult {
  source: string;
  sourceName: string;
  streamUrl: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash';
  confidence: number;
  requiresProxy?: boolean;
}

interface AIEngineResponse {
  success: boolean;
  streams?: StreamResult[];
  error?: string;
  searchedSources?: string[];
}

// Source URLs - using TMDB IDs for direct access
const SOURCES = {
  cineby: {
    name: 'Source 1',
    getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://www.cineby.gd/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://www.cineby.gd/movie/${tmdbId}`;
    },
  },
  movielinkbd: {
    name: 'Source 2',
    searchUrl: 'https://mlink99d.movielinkbd.li',
  },
  rtally: {
    name: 'Source 3',
    getUrl: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => {
      if (mediaType === 'tv' && season && episode) {
        return `https://www.rtally.xyz/watch/tv/${tmdbId}?s=${season}&e=${episode}`;
      }
      return `https://www.rtally.xyz/watch/movie/${tmdbId}`;
    },
  },
};

// Extract stream URLs from page content using regex patterns
const extractStreamUrls = (html: string): { url: string; type: 'hls' | 'mp4' | 'dash' }[] => {
  const streams: { url: string; type: 'hls' | 'mp4' | 'dash' }[] = [];
  
  // HLS streams
  const hlsPatterns = [
    /https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/gi,
    /"file":\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/gi,
    /'file':\s*'(https?:\/\/[^']+\.m3u8[^']*)'/gi,
    /source:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /src:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /data-src=["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /hls:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /playlist:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
    /videoUrl:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi,
  ];
  
  for (const pattern of hlsPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&');
      if (!streams.find(s => s.url === url) && !url.includes('preview') && !url.includes('demo')) {
        streams.push({ url, type: 'hls' });
      }
    }
  }
  
  // MP4 streams
  const mp4Patterns = [
    /https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi,
    /"file":\s*"(https?:\/\/[^"]+\.mp4[^"]*)"/gi,
    /source:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /src:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
    /videoUrl:\s*["'](https?:\/\/[^"']+\.mp4[^"']*)["']/gi,
  ];
  
  for (const pattern of mp4Patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&');
      if (!streams.find(s => s.url === url) && 
          !url.includes('sample') && 
          !url.includes('trailer') &&
          !url.includes('preview') &&
          !url.includes('demo')) {
        streams.push({ url, type: 'mp4' });
      }
    }
  }
  
  // Look for embedded player sources in JSON/script blocks
  const jsonPatterns = [
    /"(?:file|src|source|url|video|stream|hls|playlist)":\s*"(https?:\/\/[^"]+(?:\.m3u8|\.mp4)[^"]*)"/gi,
    /\{[^}]*"url":\s*"(https?:\/\/[^"]+(?:\.m3u8|\.mp4)[^"]*)"/gi,
    /sources:\s*\[\s*\{[^}]*"src":\s*"(https?:\/\/[^"]+)"/gi,
    /jwplayer\([^)]*\)\.setup\(\s*\{[^}]*"file":\s*"(https?:\/\/[^"]+)"/gi,
    /player\.src\(\s*\{[^}]*src:\s*["'](https?:\/\/[^"']+)/gi,
  ];
  
  for (const pattern of jsonPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = (match[1] || match[0]).replace(/\\/g, '').replace(/&amp;/g, '&');
      if (url.match(/\.(m3u8|mp4)/i)) {
        const type = url.includes('.m3u8') ? 'hls' : 'mp4';
        if (!streams.find(s => s.url === url)) {
          streams.push({ url, type });
        }
      }
    }
  }
  
  return streams;
};

// Use AI to analyze page content and find the best stream
const analyzeWithAI = async (
  pageContent: string,
  title: string,
  apiKey: string
): Promise<{ streamUrl: string | null; confidence: number; analysis: string }> => {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert stream URL extractor. Your job is to analyze web page content and find direct video stream URLs.

Look for:
1. HLS streams (.m3u8) - highest priority
2. MP4 streams (.mp4) - second priority
3. Video player configurations with source URLs
4. Embedded iframe sources that might contain video URLs
5. JavaScript variables containing video URLs
6. API endpoints that serve video content

Ignore:
- Trailers, samples, demos, previews
- Ad URLs (contains 'ad', 'tracking', 'analytics')
- Thumbnail/image URLs
- CSS/JS asset URLs

Return the most likely main content stream URL. If you find encoded/encrypted URLs, try to decode them.`
          },
          {
            role: 'user',
            content: `Extract the main video stream URL for "${title}" from this page:\n\n${pageContent.substring(0, 20000)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_stream',
              description: 'Extract the video stream URL',
              parameters: {
                type: 'object',
                properties: {
                  streamUrl: { type: 'string', description: 'Direct video URL (.m3u8 or .mp4)' },
                  confidence: { type: 'number', description: '0.0 to 1.0' },
                  analysis: { type: 'string', description: 'How URL was found' }
                },
                required: ['streamUrl', 'confidence', 'analysis']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_stream' } }
      }),
    });

    if (!response.ok) {
      console.error('AI analysis failed:', response.status);
      return { streamUrl: null, confidence: 0, analysis: 'AI request failed' };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return {
        streamUrl: args.streamUrl || null,
        confidence: args.confidence || 0,
        analysis: args.analysis || ''
      };
    }

    return { streamUrl: null, confidence: 0, analysis: 'No tool response' };
  } catch (error) {
    console.error('AI analysis error:', error);
    return { streamUrl: null, confidence: 0, analysis: 'AI error' };
  }
};

// Fetch page with Firecrawl (handles JavaScript rendering)
const fetchPage = async (
  url: string,
  firecrawlKey: string,
  waitTime: number = 5000
): Promise<string | null> => {
  try {
    console.log(`Fetching: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'rawHtml'],
        waitFor: waitTime,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.error(`Fetch failed for ${url}:`, response.status);
      return null;
    }

    const data = await response.json();
    // Return rawHtml for better extraction, fallback to html
    return data.data?.rawHtml || data.data?.html || null;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    return null;
  }
};

// Search MovieLinkBD for content
const searchMovieLinkBD = async (
  title: string,
  year: string | undefined,
  firecrawlKey: string
): Promise<{ pageUrl: string | null; pageContent: string | null }> => {
  try {
    const searchQuery = year ? `${title} ${year}` : title;
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${searchQuery} site:movielinkbd.li`,
        limit: 3,
        scrapeOptions: {
          formats: ['html', 'rawHtml'],
          waitFor: 5000,
        },
      }),
    });

    if (!response.ok) {
      console.error('MovieLinkBD search failed:', response.status);
      return { pageUrl: null, pageContent: null };
    }

    const data = await response.json();
    const results = data.data || [];
    
    if (results.length > 0) {
      const bestMatch = results[0];
      return {
        pageUrl: bestMatch.url || null,
        pageContent: bestMatch.rawHtml || bestMatch.html || bestMatch.markdown || null
      };
    }

    return { pageUrl: null, pageContent: null };
  } catch (error) {
    console.error('MovieLinkBD search error:', error);
    return { pageUrl: null, pageContent: null };
  }
};

// Process a source and extract streams
const processSource = async (
  sourceName: string,
  pageContent: string | null,
  title: string,
  apiKey: string
): Promise<StreamResult[]> => {
  const results: StreamResult[] = [];
  
  if (!pageContent) return results;

  // First try regex extraction
  const regexStreams = extractStreamUrls(pageContent);
  
  if (regexStreams.length > 0) {
    console.log(`Found ${regexStreams.length} streams via regex from ${sourceName}`);
    regexStreams.slice(0, 3).forEach((stream, i) => {
      results.push({
        source: sourceName,
        sourceName: `🎬 AI Engine`,
        streamUrl: stream.url,
        quality: i === 0 ? 'HD' : i === 1 ? '720p' : 'SD',
        type: stream.type,
        confidence: 0.8 - (i * 0.1),
      });
    });
  } else {
    // Use AI for deeper analysis
    console.log(`Using AI analysis for ${sourceName}`);
    const aiResult = await analyzeWithAI(pageContent, title, apiKey);
    
    if (aiResult.streamUrl && aiResult.confidence > 0.4) {
      const type = aiResult.streamUrl.includes('.m3u8') ? 'hls' : 
                   aiResult.streamUrl.includes('.mp4') ? 'mp4' : 'hls';
      results.push({
        source: sourceName,
        sourceName: '🧠 AI Engine',
        streamUrl: aiResult.streamUrl,
        quality: 'HD',
        type,
        confidence: aiResult.confidence,
      });
    }
  }
  
  return results;
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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Web scraper not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`AI Engine: Searching for "${title}" (TMDB: ${tmdbId})`);

    const streams: StreamResult[] = [];
    const searchedSources: string[] = [];

    // Fetch from all sources in parallel for speed
    const [cinebyContent, movieLinkResult, rtallyContent] = await Promise.all([
      // 1. Cineby (TMDB ID based - most reliable)
      (async () => {
        searchedSources.push('Source 1');
        const url = SOURCES.cineby.getUrl(tmdbId, mediaType, season, episode);
        return await fetchPage(`${url}?play=true`, firecrawlKey, 5000);
      })(),
      
      // 2. MovieLinkBD (search based)
      (async () => {
        searchedSources.push('Source 2');
        return await searchMovieLinkBD(title, year, firecrawlKey);
      })(),
      
      // 3. RTally (TMDB ID based)
      (async () => {
        searchedSources.push('Source 3');
        const url = SOURCES.rtally.getUrl(tmdbId, mediaType, season, episode);
        return await fetchPage(url, firecrawlKey, 5000);
      })(),
    ]);

    // Process all sources in parallel
    const [cinebyStreams, movieLinkStreams, rtallyStreams] = await Promise.all([
      processSource('cineby', cinebyContent, title, lovableApiKey),
      processSource('movielinkbd', movieLinkResult.pageContent, title, lovableApiKey),
      processSource('rtally', rtallyContent, title, lovableApiKey),
    ]);

    streams.push(...cinebyStreams, ...movieLinkStreams, ...rtallyStreams);

    // Sort by confidence
    streams.sort((a, b) => b.confidence - a.confidence);

    // Deduplicate by URL
    const uniqueStreams = streams.filter((stream, index, self) => 
      index === self.findIndex(s => s.streamUrl === stream.streamUrl)
    );

    console.log(`AI Engine found ${uniqueStreams.length} unique streams`);

    const response: AIEngineResponse = {
      success: uniqueStreams.length > 0,
      streams: uniqueStreams.length > 0 ? uniqueStreams : undefined,
      error: uniqueStreams.length === 0 ? 'Still searching...' : undefined,
      searchedSources,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI Engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Engine is processing...' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});