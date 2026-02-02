import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIStream {
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
  streams?: AIStream[];
  error?: string;
  searchedSources?: string[];
}

interface UseAIStreamEngineOptions {
  title: string;
  year?: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  enabled?: boolean;
  autoSearch?: boolean;
}

export const useAIStreamEngine = (options: UseAIStreamEngineOptions) => {
  const { title, year, tmdbId, mediaType, season, episode, enabled = true, autoSearch = true } = options;
  
  const [isSearching, setIsSearching] = useState(false);
  const [streams, setStreams] = useState<AIStream[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchedSources, setSearchedSources] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchedRef = useRef(false);
  const lastSearchKey = useRef<string>('');

  const searchKey = `${tmdbId}-${mediaType}-${season || ''}-${episode || ''}`;

  const searchStreams = useCallback(async () => {
    if (!enabled || !title || !tmdbId) return;
    
    setIsSearching(true);
    setError(null);
    setStreams([]);

    try {
      console.log(`[AI Engine] Searching for "${title}" (TMDB: ${tmdbId})`);
      
      const { data, error: fnError } = await supabase.functions.invoke('ai-stream-engine', {
        body: { 
          title, 
          year, 
          tmdbId, 
          mediaType, 
          season, 
          episode 
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      const response = data as AIEngineResponse;

      if (!response.success) {
        // Don't show error message - just indicate still searching
        setError(null);
        setSearchedSources([]);
      } else {
        setStreams(response.streams || []);
        setSearchedSources([]); // Hide source names for privacy
        console.log(`[AI Engine] Found ${response.streams?.length || 0} streams`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI engine failed';
      console.error('[AI Engine] Error:', message);
      setError(message);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, [enabled, title, year, tmdbId, mediaType, season, episode]);

  // Auto-search when content changes
  useEffect(() => {
    if (!autoSearch || !enabled || searchedRef.current || lastSearchKey.current === searchKey) {
      return;
    }

    // Delay to avoid spamming during rapid content changes
    const timeoutId = setTimeout(() => {
      if (title && tmdbId && !searchedRef.current) {
        searchedRef.current = true;
        lastSearchKey.current = searchKey;
        searchStreams();
      }
    }, 2000); // Wait 2 seconds before searching

    return () => clearTimeout(timeoutId);
  }, [autoSearch, enabled, title, tmdbId, searchKey, searchStreams]);

  // Reset when content changes significantly
  useEffect(() => {
    if (lastSearchKey.current && lastSearchKey.current !== searchKey) {
      searchedRef.current = false;
      setStreams([]);
      setError(null);
      setHasSearched(false);
    }
  }, [searchKey]);

  const getBestStream = useCallback((): AIStream | null => {
    if (streams.length === 0) return null;
    // Return highest confidence stream
    return streams.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }, [streams]);

  const clearStreams = useCallback(() => {
    setStreams([]);
    setError(null);
    setSearchedSources([]);
    setHasSearched(false);
    searchedRef.current = false;
  }, []);

  return {
    isSearching,
    streams,
    error,
    searchedSources,
    hasSearched,
    searchStreams,
    getBestStream,
    clearStreams,
  };
};
