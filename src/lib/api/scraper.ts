import { supabase } from '@/integrations/supabase/client';

export interface ScrapedResult {
  source: string;
  sourceName: string;
  title: string;
  url: string;
  quality?: string;
  size?: string;
  language?: string;
}

export interface ScrapeResponse {
  success: boolean;
  data?: ScrapedResult[];
  error?: string;
  query?: string;
}

export const scraperApi = {
  /**
   * Search external sources for streaming links
   */
  async searchSources(query: string, mediaType: 'movie' | 'tv'): Promise<ScrapeResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-sources', {
        body: { query, mediaType },
      });

      if (error) {
        console.error('Scraper error:', error);
        return { success: false, error: error.message };
      }

      return data as ScrapeResponse;
    } catch (err) {
      console.error('Scraper exception:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to search sources' 
      };
    }
  },
};
