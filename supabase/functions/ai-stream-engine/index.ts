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

// Cineby uses TMDB IDs - can directly construct URLs
const getCinebyUrl = (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number): string => {
  if (mediaType === 'tv' && season && episode) {
    return `https://www.cineby.gd/tv/${tmdbId}/${season}/${episode}`;
  }
  return `https://www.cineby.gd/movie/${tmdbId}`;
};

// Extract stream URLs from page content using regex patterns
const extractStreamUrls = (html: string): { url: string; type: 'hls' | 'mp4' | 'dash' }[] => {
  const streams: { url: string; type: 'hls' | 'mp4' | 'dash' }[] = [];
  
  // HLS streams
  const hlsPattern = /https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/gi;
  const hlsMatches = html.match(hlsPattern) || [];
  hlsMatches.forEach(url => {
    const cleanUrl = url.replace(/\\/g, '').replace(/&amp;/g, '&');
    if (!streams.find(s => s.url === cleanUrl)) {
      streams.push({ url: cleanUrl, type: 'hls' });
    }
  });
  
  // MP4 streams
  const mp4Pattern = /https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi;
  const mp4Matches = html.match(mp4Pattern) || [];
  mp4Matches.forEach(url => {
    const cleanUrl = url.replace(/\\/g, '').replace(/&amp;/g, '&');
    if (!streams.find(s => s.url === cleanUrl) && !cleanUrl.includes('sample') && !cleanUrl.includes('trailer')) {
      streams.push({ url: cleanUrl, type: 'mp4' });
    }
  });
  
  // Look for embedded player sources in JSON
  const sourcePattern = /"(?:file|src|source|url)":\s*"(https?:\/\/[^"]+(?:\.m3u8|\.mp4)[^"]*)"/gi;
  let match;
  while ((match = sourcePattern.exec(html)) !== null) {
    const url = match[1].replace(/\\/g, '').replace(/&amp;/g, '&');
    const type = url.includes('.m3u8') ? 'hls' : 'mp4';
    if (!streams.find(s => s.url === url)) {
      streams.push({ url, type });
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
            content: `You are a stream URL extractor. Analyze the provided web page content and find direct video stream URLs (m3u8, mp4).
            
Rules:
- Look for patterns like "file:", "source:", "src:" followed by video URLs
- Prefer m3u8 (HLS) streams over mp4
- Ignore trailer URLs, sample videos, and ad URLs
- Return ONLY the most likely main content stream URL
- If you find encoded/encrypted URLs, try to decode them

Respond with JSON: { "streamUrl": "url_here_or_null", "confidence": 0.0-1.0, "analysis": "brief explanation" }`
          },
          {
            role: 'user',
            content: `Find the main video stream URL for "${title}" from this page content:\n\n${pageContent.substring(0, 15000)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_stream',
              description: 'Extract the video stream URL from page analysis',
              parameters: {
                type: 'object',
                properties: {
                  streamUrl: { type: 'string', description: 'The direct video stream URL (m3u8 or mp4), or null if not found' },
                  confidence: { type: 'number', description: 'Confidence score from 0.0 to 1.0' },
                  analysis: { type: 'string', description: 'Brief explanation of how the URL was found' }
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
          formats: ['html', 'markdown'],
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
        pageContent: bestMatch.html || bestMatch.markdown || null
      };
    }

    return { pageUrl: null, pageContent: null };
  } catch (error) {
    console.error('MovieLinkBD search error:', error);
    return { pageUrl: null, pageContent: null };
  }
};

// Fetch and extract from Cineby
const fetchCineby = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  season: number | undefined,
  episode: number | undefined,
  firecrawlKey: string
): Promise<{ pageContent: string | null; playerUrl: string | null }> => {
  try {
    const pageUrl = getCinebyUrl(tmdbId, mediaType, season, episode);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${pageUrl}?play=true`,
        formats: ['html'],
        waitFor: 3000, // Wait for player to load
      }),
    });

    if (!response.ok) {
      console.error('Cineby fetch failed:', response.status);
      return { pageContent: null, playerUrl: null };
    }

    const data = await response.json();
    return {
      pageContent: data.data?.html || null,
      playerUrl: pageUrl
    };
  } catch (error) {
    console.error('Cineby fetch error:', error);
    return { pageContent: null, playerUrl: null };
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
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`AI Stream Engine: Searching for "${title}" (${tmdbId})`);

    const streams: StreamResult[] = [];
    const searchedSources: string[] = [];

    // 1. Try Cineby first (uses TMDB IDs - most reliable)
    console.log('Fetching from Cineby...');
    searchedSources.push('Cineby');
    
    const cinebyResult = await fetchCineby(tmdbId, mediaType, season, episode, firecrawlKey);
    
    if (cinebyResult.pageContent) {
      // First try regex extraction
      const regexStreams = extractStreamUrls(cinebyResult.pageContent);
      
      if (regexStreams.length > 0) {
        regexStreams.forEach((stream, i) => {
          streams.push({
            source: 'cineby',
            sourceName: '🎬 Cineby',
            streamUrl: stream.url,
            quality: i === 0 ? 'HD' : 'SD',
            type: stream.type,
            confidence: 0.8,
          });
        });
      } else {
        // Use AI for deeper analysis
        const aiResult = await analyzeWithAI(cinebyResult.pageContent, title, lovableApiKey);
        
        if (aiResult.streamUrl && aiResult.confidence > 0.5) {
          const type = aiResult.streamUrl.includes('.m3u8') ? 'hls' : 
                       aiResult.streamUrl.includes('.mp4') ? 'mp4' : 'hls';
          streams.push({
            source: 'cineby',
            sourceName: '🎬 Cineby (AI)',
            streamUrl: aiResult.streamUrl,
            quality: 'HD',
            type,
            confidence: aiResult.confidence,
          });
        }
      }
    }

    // 2. Search MovieLinkBD
    console.log('Searching MovieLinkBD...');
    searchedSources.push('MovieLinkBD');
    
    const movieLinkResult = await searchMovieLinkBD(title, year, firecrawlKey);
    
    if (movieLinkResult.pageContent) {
      // Try regex extraction first
      const regexStreams = extractStreamUrls(movieLinkResult.pageContent);
      
      if (regexStreams.length > 0) {
        regexStreams.slice(0, 2).forEach((stream, i) => {
          streams.push({
            source: 'movielinkbd',
            sourceName: '🇧🇩 MovieLinkBD',
            streamUrl: stream.url,
            quality: i === 0 ? '1080p' : '720p',
            type: stream.type,
            confidence: 0.7,
          });
        });
      } else {
        // Use AI for analysis
        const aiResult = await analyzeWithAI(movieLinkResult.pageContent, title, lovableApiKey);
        
        if (aiResult.streamUrl && aiResult.confidence > 0.5) {
          const type = aiResult.streamUrl.includes('.m3u8') ? 'hls' : 
                       aiResult.streamUrl.includes('.mp4') ? 'mp4' : 'hls';
          streams.push({
            source: 'movielinkbd',
            sourceName: '🇧🇩 MovieLinkBD (AI)',
            streamUrl: aiResult.streamUrl,
            quality: 'HD',
            type,
            confidence: aiResult.confidence,
          });
        }
      }
    }

    // Sort by confidence
    streams.sort((a, b) => b.confidence - a.confidence);

    console.log(`AI Engine found ${streams.length} streams from ${searchedSources.join(', ')}`);

    const response: AIEngineResponse = {
      success: streams.length > 0,
      streams: streams.length > 0 ? streams : undefined,
      error: streams.length === 0 ? 'No streams found from external sources' : undefined,
      searchedSources,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI Stream Engine error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Engine failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
