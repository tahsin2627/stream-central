const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// External streaming sites with TMDB ID support - these open in new tab (blocked iframe embedding)
const EXTERNAL_TMDB_SOURCES = [
  {
    id: 'autoembed-v2',
    name: 'AutoEmbed V2',
    getMovieUrl: (tmdbId: number) => `https://watch-v2.autoembed.cc/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://watch-v2.autoembed.cc/tv/${tmdbId}/${season}/${episode}`,
    quality: 'HD',
    language: 'Multi',
  },
  {
    id: 'vidsrc-nl',
    name: 'VidSrc NL',
    getMovieUrl: (tmdbId: number) => `https://vidsrc.nl/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://vidsrc.nl/embed/tv/${tmdbId}/${season}/${episode}`,
    quality: 'HD',
    language: 'Multi',
  },
  {
    id: 'embedsu',
    name: 'Embed.su',
    getMovieUrl: (tmdbId: number) => `https://embed.su/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
    quality: 'HD',
    language: 'Multi',
  },
  {
    id: 'vidsrc-cc',
    name: 'VidSrc CC',
    getMovieUrl: (tmdbId: number) => `https://vidsrc.cc/v3/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}`,
    quality: 'HD',
    language: 'Multi',
  },
  {
    id: '2embed',
    name: '2Embed',
    getMovieUrl: (tmdbId: number) => `https://www.2embed.cc/embed/${tmdbId}`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
    quality: 'HD',
    language: 'Multi',
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    getMovieUrl: (tmdbId: number) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTvUrl: (tmdbId: number, season: number, episode: number) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
    quality: 'HD',
    language: 'Multi',
  },
];

// Regional/Download sites for scraping (returns links to watch pages)
const REGIONAL_SITES = [
  {
    domain: '1tamilblasters',
    name: 'TamilBlasters',
    searchDomains: ['1tamilblasters.auction', '1tamilblasters.business'],
    languages: ['Tamil', 'Telugu', 'Malayalam', 'Hindi'],
    type: 'streaming',
  },
  {
    domain: 'skymovieshd',
    name: 'SkyMoviesHD',
    searchDomains: ['skymovieshd.mba', 'skymovieshd.skin'],
    languages: ['Hindi', 'Bengali', 'Dual Audio'],
    type: 'download',
  },
  {
    domain: 'fzmovies',
    name: 'FZMovies',
    searchDomains: ['fzmovies.net'],
    languages: ['English', 'Hindi'],
    type: 'download',
  },
  {
    domain: 'hdhub4u',
    name: 'HDHub4U',
    searchDomains: ['hdhub4u'],
    languages: ['Hindi', 'Dual Audio'],
    type: 'download',
  },
  {
    domain: 'bolly4u',
    name: 'Bolly4U',
    searchDomains: ['bolly4u'],
    languages: ['Hindi', 'Bollywood'],
    type: 'download',
  },
  {
    domain: 'movieswood',
    name: 'MoviesWood',
    searchDomains: ['movieswood'],
    languages: ['Telugu', 'Tamil', 'Hindi'],
    type: 'download',
  },
];

interface ScrapedResult {
  source: string;
  sourceName: string;
  title: string;
  url: string;
  quality?: string;
  size?: string;
  language?: string;
  // All sources open in new tab - iframe embedding is blocked by most providers
  opensInNewTab: boolean;
  isTmdbSource: boolean; // True if uses TMDB ID (reliable), false if scraped (may not match)
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

    // 1. Add known TMDB-based sources (open in new tab - iframe embedding blocked by providers)
    if (tmdbId) {
      for (const source of EXTERNAL_TMDB_SOURCES) {
        const sourceUrl = mediaType === 'tv' && season && episode
          ? source.getTvUrl(tmdbId, season, episode)
          : source.getMovieUrl(tmdbId);

        results.push({
          source: source.id,
          sourceName: source.name,
          title: query,
          url: sourceUrl,
          quality: source.quality,
          language: source.language,
          opensInNewTab: true,
          isTmdbSource: true,
        });
      }
    }

    // 2. Search for additional sources using Firecrawl on regional sites
    const siteQueries = REGIONAL_SITES.flatMap(s => s.searchDomains).map(domain => `site:${domain}`).join(' OR ');
    const searchQuery = `${query} ${mediaType === 'tv' ? 'series' : 'movie'} (${siteQueries})`;
    
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 15,
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
              url.includes('bilibili.com') || url.includes('wikipedia.org') ||
              url.includes('facebook.com') || url.includes('twitter.com')) {
            continue;
          }

          // Find matching regional site
          let matchedSite: typeof REGIONAL_SITES[0] | undefined;
          for (const site of REGIONAL_SITES) {
            if (site.searchDomains.some(domain => url.includes(domain)) || url.includes(site.domain)) {
              matchedSite = site;
              break;
            }
          }

          // Only add if it's from a known site
          if (!matchedSite) continue;

          // Extract quality hints from title/content
          const content = (item.markdown || item.title || '').toLowerCase();
          let quality = 'HD';
          if (content.includes('1080p') || content.includes('1080')) quality = '1080p';
          else if (content.includes('720p') || content.includes('720')) quality = '720p';
          else if (content.includes('480p') || content.includes('480')) quality = '480p';
          else if (content.includes('4k') || content.includes('2160')) quality = '4K';
          else if (content.includes('cam') || content.includes('hdcam') || content.includes('predvd')) quality = 'CAM';
          else if (content.includes('bluray') || content.includes('blu-ray')) quality = 'BluRay';
          else if (content.includes('webrip') || content.includes('web-rip')) quality = 'WEB';
          else if (content.includes('hdrip') || content.includes('hd rip')) quality = 'HDRip';

          // Extract language hints
          let language = matchedSite.languages[0] || 'Multi';
          if (content.includes('hindi') || content.includes('hin')) language = 'Hindi';
          else if (content.includes('bengali') || content.includes('bangla')) language = 'Bengali';
          else if (content.includes('tamil') || content.includes('tam')) language = 'Tamil';
          else if (content.includes('telugu') || content.includes('tel')) language = 'Telugu';
          else if (content.includes('malayalam') || content.includes('mal')) language = 'Malayalam';
          else if (content.includes('kannada') || content.includes('kan')) language = 'Kannada';
          else if (content.includes('korean') || content.includes('kor')) language = 'Korean';
          else if (content.includes('dual audio') || content.includes('dual-audio')) language = 'Dual Audio';
          else if (content.includes('multi') || content.includes('[tam + tel')) language = 'Multi';

          // Extract size if mentioned
          let size: string | undefined;
          const sizeMatch = content.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
          if (sizeMatch) {
            size = `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}`;
          }

          results.push({
            source: matchedSite.domain,
            sourceName: matchedSite.name,
            title: item.title || query,
            url,
            quality,
            size,
            language,
            opensInNewTab: true, // Will use in-app browser which can fallback to new tab
            isTmdbSource: false, // Scraped results may not match exactly
          });
        }
      }
    } catch (searchError) {
      console.error('Firecrawl search error:', searchError);
      // Continue with embed sources even if search fails
    }

    console.log(`Found ${results.length} results (${results.filter(r => r.isTmdbSource).length} TMDB-based)`);

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