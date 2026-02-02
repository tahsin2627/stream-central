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

// Provider extractors
const extractors: Record<string, (url: string) => Promise<StreamSource[]>> = {
  // VidSrc.to - Uses API endpoint
  'vidsrc.to': async (embedUrl: string): Promise<StreamSource[]> => {
    try {
      // Extract the source ID from embed URL
      const match = embedUrl.match(/embed\/(tv|movie)\/(\d+)/);
      if (!match) throw new Error('Invalid URL format');
      
      const [, mediaType, id] = match;
      const seasonEpisode = embedUrl.match(/(\d+)\/(\d+)$/);
      
      let apiUrl = `https://vidsrc.to/ajax/embed/${mediaType}/${id}`;
      if (seasonEpisode) {
        apiUrl += `/${seasonEpisode[1]}/${seasonEpisode[2]}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://vidsrc.to/',
        },
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      if (data.result?.sources) {
        return data.result.sources.map((s: any) => ({
          url: s.file || s.url,
          quality: s.label || 'Auto',
          type: s.file?.includes('.m3u8') ? 'hls' : 'mp4',
        }));
      }
      
      throw new Error('No sources found');
    } catch (error) {
      console.error('VidSrc.to extraction failed:', error);
      return [];
    }
  },

  // VidSrc.cc - Scrape for sources
  'vidsrc.cc': async (embedUrl: string): Promise<StreamSource[]> => {
    try {
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://vidsrc.cc/',
        },
      });
      
      const html = await response.text();
      
      // Look for HLS sources in the page
      const hlsMatches = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || [];
      const mp4Matches = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g) || [];
      
      const sources: StreamSource[] = [];
      
      hlsMatches.forEach((url, i) => {
        sources.push({ url: url.replace(/\\/g, ''), quality: `Source ${i + 1}`, type: 'hls' });
      });
      
      mp4Matches.forEach((url, i) => {
        sources.push({ url: url.replace(/\\/g, ''), quality: `MP4 ${i + 1}`, type: 'mp4' });
      });
      
      return sources;
    } catch (error) {
      console.error('VidSrc.cc extraction failed:', error);
      return [];
    }
  },

  // SuperEmbed - Look for stream sources
  'superembed.stream': async (embedUrl: string): Promise<StreamSource[]> => {
    try {
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const html = await response.text();
      
      // SuperEmbed often has sources in JSON or inline scripts
      const sourceMatch = html.match(/sources\s*[:=]\s*\[(.*?)\]/s);
      if (sourceMatch) {
        try {
          const sourcesJson = `[${sourceMatch[1]}]`.replace(/'/g, '"');
          const parsed = JSON.parse(sourcesJson);
          return parsed.map((s: any) => ({
            url: s.file || s.src || s,
            quality: s.label || 'Auto',
            type: (s.file || s.src || s)?.includes('.m3u8') ? 'hls' : 'mp4',
          }));
        } catch {
          // Continue with regex fallback
        }
      }
      
      const hlsMatches = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || [];
      return hlsMatches.map((url, i) => ({
        url: url.replace(/\\/g, ''),
        quality: `Source ${i + 1}`,
        type: 'hls' as const,
      }));
    } catch (error) {
      console.error('SuperEmbed extraction failed:', error);
      return [];
    }
  },

  // Embed.su - Common Desi provider
  'embed.su': async (embedUrl: string): Promise<StreamSource[]> => {
    try {
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://embed.su/',
        },
      });
      
      const html = await response.text();
      
      // Look for stream URLs in various formats
      const hlsMatches = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || [];
      const mp4Matches = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g) || [];
      
      const sources: StreamSource[] = [];
      
      hlsMatches.forEach((url, i) => {
        sources.push({ url: url.replace(/\\/g, ''), quality: `HLS ${i + 1}`, type: 'hls' });
      });
      
      mp4Matches.forEach((url, i) => {
        sources.push({ url: url.replace(/\\/g, ''), quality: `MP4 ${i + 1}`, type: 'mp4' });
      });
      
      return sources;
    } catch (error) {
      console.error('Embed.su extraction failed:', error);
      return [];
    }
  },

  // Generic fallback extractor
  'generic': async (embedUrl: string): Promise<StreamSource[]> => {
    try {
      const response = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const html = await response.text();
      
      const sources: StreamSource[] = [];
      
      // Find all m3u8 URLs
      const hlsMatches = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/g) || [];
      hlsMatches.forEach((url, i) => {
        const cleanUrl = url.replace(/\\/g, '').replace(/&amp;/g, '&');
        if (!sources.find(s => s.url === cleanUrl)) {
          sources.push({ url: cleanUrl, quality: `Stream ${i + 1}`, type: 'hls' });
        }
      });
      
      // Find all mp4 URLs
      const mp4Matches = html.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/g) || [];
      mp4Matches.forEach((url, i) => {
        const cleanUrl = url.replace(/\\/g, '').replace(/&amp;/g, '&');
        if (!sources.find(s => s.url === cleanUrl)) {
          sources.push({ url: cleanUrl, quality: `Video ${i + 1}`, type: 'mp4' });
        }
      });
      
      return sources;
    } catch (error) {
      console.error('Generic extraction failed:', error);
      return [];
    }
  },
};

// Determine which extractor to use based on URL
const getExtractor = (url: string): ((url: string) => Promise<StreamSource[]>) => {
  const domain = new URL(url).hostname.replace('www.', '');
  
  for (const [key, extractor] of Object.entries(extractors)) {
    if (domain.includes(key)) {
      return extractor;
    }
  }
  
  return extractors.generic;
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

    console.log('Extracting streams from:', embedUrl || `TMDB: ${tmdbId}`);

    let sources: StreamSource[] = [];
    let provider = 'unknown';

    if (embedUrl) {
      // Extract from provided embed URL
      const extractor = getExtractor(embedUrl);
      sources = await extractor(embedUrl);
      provider = new URL(embedUrl).hostname;
    } else {
      // Try multiple providers for TMDB ID
      const providers = [
        { name: 'vidsrc.to', url: `https://vidsrc.to/embed/${mediaType}/${tmdbId}${season ? `/${season}/${episode}` : ''}` },
        { name: 'vidsrc.cc', url: `https://vidsrc.cc/v2/embed/${mediaType}/${tmdbId}${season ? `/${season}/${episode}` : ''}` },
        { name: 'superembed.stream', url: `https://www.superembed.stream/embed/${tmdbId}${season ? `/${season}/${episode}` : ''}` },
        { name: 'embed.su', url: `https://embed.su/embed/${mediaType}/${tmdbId}${season ? `/${season}/${episode}` : ''}` },
      ];

      for (const p of providers) {
        console.log(`Trying provider: ${p.name}`);
        const extractor = extractors[p.name] || extractors.generic;
        const result = await extractor(p.url);
        
        if (result.length > 0) {
          sources = result;
          provider = p.name;
          console.log(`Found ${result.length} sources from ${p.name}`);
          break;
        }
      }
    }

    if (sources.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No streams found. Provider may require direct embed.',
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

    console.log(`Extraction successful: ${sources.length} sources from ${provider}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stream extraction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Extraction failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
