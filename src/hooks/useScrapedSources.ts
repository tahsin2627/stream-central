import { useQuery } from '@tanstack/react-query';
import { scraperApi, ScrapedResult } from '@/lib/api/scraper';

export const useScrapedSources = (
  query: string | undefined,
  mediaType: 'movie' | 'tv',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['scraped-sources', query, mediaType],
    queryFn: async () => {
      if (!query) return [];
      
      const response = await scraperApi.searchSources(query, mediaType);
      
      if (!response.success) {
        console.warn('Scraping failed:', response.error);
        return [];
      }
      
      return response.data || [];
    },
    enabled: enabled && !!query && query.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1, // Only retry once
  });
};

export type { ScrapedResult };
