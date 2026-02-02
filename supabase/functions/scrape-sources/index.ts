const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// External sources to search
const SOURCES = [
  {
    id: 'fzmovies',
    name: 'FZMovies',
    searchUrl: 'https://fzmovies.net/csearch.php?searchname=',
    baseUrl: 'https://fzmovies.net',
  },
  {
    id: '123movies',
    name: '123Movies',
    searchUrl: 'https://ww2.123moviesfree.net/search/',
    baseUrl: 'https://ww2.123moviesfree.net',
  },
  {
    id: 'hdstream4u',
    name: 'HDStream4U',
    searchUrl: 'https://hdstream4u.com/?s=',
    baseUrl: 'https://hdstream4u.com',
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
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mediaType } = await req.json();

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

    console.log('Searching for:', query, 'Type:', mediaType);

    // Search across multiple sources using Firecrawl's search endpoint
    const searchQuery = `${query} ${mediaType === 'tv' ? 'series' : 'movie'} watch online`;
    
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

    if (!response.ok) {
      console.error('Firecrawl search error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process and extract relevant results
    const results: ScrapedResult[] = [];
    
    if (searchData.data && Array.isArray(searchData.data)) {
      for (const item of searchData.data) {
        // Try to determine the source
        const url = item.url || '';
        let sourceName = 'External';
        let sourceId = 'external';
        
        // Match against known sources
        for (const source of SOURCES) {
          if (url.includes(source.baseUrl.replace('https://', '').replace('www.', ''))) {
            sourceName = source.name;
            sourceId = source.id;
            break;
          }
        }

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
        });
      }
    }

    console.log(`Found ${results.length} results`);

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
