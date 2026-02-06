import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScrapedStream {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash';
  provider: string;
}

interface ScraperResult {
  success: boolean;
  sources?: ScrapedStream[];
  error?: string;
  fromCache?: boolean;
}

export const useWellplayerScraper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<ScrapedStream[]>([]);
  const [fromCache, setFromCache] = useState(false);

  const scrapeStreams = useCallback(async (params: {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    season?: number;
    episode?: number;
    forceRefresh?: boolean;
  }): Promise<ScraperResult> => {
    setIsLoading(true);
    setError(null);
    setSources([]);
    setFromCache(false);

    try {
      console.log('[WellplayerScraper] Starting scrape for:', params);
      
      const { data, error: fnError } = await supabase.functions.invoke('wellplayer-scraper', {
        body: params,
      });

      if (fnError) {
        console.error('[WellplayerScraper] Function error:', fnError);
        throw new Error(fnError.message);
      }

      const result = data as ScraperResult;

      if (!result.success) {
        setError(result.error || 'Scraper failed');
        return result;
      }

      setSources(result.sources || []);
      setFromCache(result.fromCache || false);
      
      console.log(`[WellplayerScraper] Found ${result.sources?.length || 0} streams (cached: ${result.fromCache})`);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scrape streams';
      console.error('[WellplayerScraper] Error:', message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSources = useCallback(() => {
    setSources([]);
    setError(null);
    setFromCache(false);
  }, []);

  return {
    scrapeStreams,
    clearSources,
    isLoading,
    error,
    sources,
    fromCache,
  };
};
