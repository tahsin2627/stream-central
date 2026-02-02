const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Embeddable streaming sources that work with TMDB IDs or can be scraped
const EMBED_SOURCES = [
  {
    id: 'autoembed-v2',
    name: 'AutoEmbed V2',
    baseUrl: 'https://watch-v2.autoembed.cc',
    getMovieUrl: (tmdbId: number) => `https://watch-v2.autoembed.cc/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://watch-v2.autoembed.cc/tv/${tmdbId}/${season}/${episode}`,
    embedPattern: /embed|player/i,
  },
  {
    id: 'vidsrc-nl',
    name: 'VidSrc NL',
    baseUrl: 'https://vidsrc.nl',
    getMovieUrl: (tmdbId: number) => `https://vidsrc.nl/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://vidsrc.nl/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    baseUrl: 'https://embed.su',
    getMovieUrl: (tmdbId: number) => `https://embed.su/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrc-cc',
    name: 'VidSrc CC',
    baseUrl: 'https://vidsrc.cc',
    getMovieUrl: (tmdbId: number) => `https://vidsrc.cc/v3/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}`,
  },
];

// Download sites for scraping (returns links, not embeds)
const DOWNLOAD_SITES = [
  'fzmovies.net',
  'hdhub4u',
  '123moviesfree',
  'hdstream4u',
  'gomovies',
  'fmovies',
];

interface ScrapedResult {
  source: string;
  sourceName: string;
  title: string;
  url: string;
  embedUrl?: string; // Direct embeddable URL if available
  quality?: string;
  size?: string;
  language?: string;
  isEmbeddable: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mediaType, tmdbId, season, episode } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for:', query, 'Type:', mediaType, 'TMDB:', tmdbId);

    const results: ScrapedResult[] = [];

    // 1. First, add known embed sources that work with TMDB IDs
    if (tmdbId) {
      for (const source of EMBED_SOURCES) {
        const embedUrl = mediaType === 'tv' && season && episode
          ? source.getTvUrl(tmdbId, season, episode)
          : source.getMovieUrl(tmdbId);

        results.push({
          source: source.id,
          sourceName: source.name,
          title: query,
          url: embedUrl,
          embedUrl: embedUrl,
          quality: 'Auto',
          language: 'Multi',
          isEmbeddable: true,
        });
      }
    }

    // 2. Search for additional sources using Firecrawl
    const siteQueries = DOWNLOAD_SITES.map(site => `site:${site}`).join(' OR ');
    const searchQuery = `${query} ${mediaType === 'tv' ? 'series' : 'movie'} (${siteQueries}) download stream`;
    
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
          scrapeOptions: {
            formats: ['markdown', 'links'],
          },
        }),
      });

      const searchData = await response.json();

      if (response.ok && searchData.data && Array.isArray(searchData.data)) {
        for (const item of searchData.data) {
          const url = item.url || '';
          
          // Skip irrelevant URLs
          if (!url || url.includes('youtube.com') || url.includes('imdb.com') || 
              url.includes('bilibili.com') || url.includes('wikipedia.org')) {
            continue;
          }

          // Try to determine source name from URL
          let sourceName = 'External';
          let sourceId = 'external';
          
          if (url.includes('fzmovies')) {
            sourceName = 'FZMovies';
            sourceId = 'fzmovies';
          } else if (url.includes('hdhub4u')) {
            sourceName = 'HDHub4U';
            sourceId = 'hdhub4u';
          } else if (url.includes('123movie')) {
            sourceName = '123Movies';
            sourceId = '123movies';
          } else if (url.includes('hdstream4u')) {
            sourceName = 'HDStream4U';
            sourceId = 'hdstream4u';
          } else if (url.includes('gomovies')) {
            sourceName = 'GoMovies';
            sourceId = 'gomovies';
          } else if (url.includes('fmovies')) {
            sourceName = 'FMovies';
            sourceId = 'fmovies';
          }

          // Only add if it's from a known streaming/download site
          if (sourceId === 'external') continue;

          // Extract quality hints from title/content
          const content = (item.markdown || item.title || '').toLowerCase();
          let quality = 'Unknown';
          if (content.includes('1080p') || content.includes('1080')) quality = '1080p';
          else if (content.includes('720p') || content.includes('720')) quality = '720p';
          else if (content.includes('480p') || content.includes('480')) quality = '480p';
          else if (content.includes('4k') || content.includes('2160')) quality = '4K';
          else if (content.includes('cam') || content.includes('hdcam')) quality = 'CAM';

          // Extract language hints
          let language = 'English';
          if (content.includes('hindi')) language = 'Hindi';
          else if (content.includes('bengali') || content.includes('bangla')) language = 'Bengali';
          else if (content.includes('tamil')) language = 'Tamil';
          else if (content.includes('telugu')) language = 'Telugu';
          else if (content.includes('korean')) language = 'Korean';
          else if (content.includes('dual audio')) language = 'Dual Audio';

          // Extract size if mentioned
          let size: string | undefined;
          const sizeMatch = content.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
          if (sizeMatch) {
            size = `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}`;
          }

          results.push({
            source: sourceId,
            sourceName,
            title: item.title || query,
            url,
            quality,
            size,
            language,
            isEmbeddable: false, // These are download/external links
          });
        }
      }
    } catch (searchError) {
      console.error('Firecrawl search error:', searchError);
      // Continue with embed sources even if search fails
    }

    console.log(`Found ${results.length} results (${results.filter(r => r.isEmbeddable).length} embeddable)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        query,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});