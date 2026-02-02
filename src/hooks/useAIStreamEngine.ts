import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Get the proxy URL for streams that need CORS bypass
const getProxiedUrl = (streamUrl: string): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return streamUrl;
  
  // Encode the stream URL and proxy through our edge function
  const encodedUrl = encodeURIComponent(streamUrl);
  return `${supabaseUrl}/functions/v1/stream-proxy?url=${encodedUrl}`;
};

export interface AIStream {
  source: string;
  sourceName: string;
  streamUrl: string;
  proxiedUrl: string; // CORS-bypassed URL
  quality: string;
  type: 'hls' | 'mp4' | 'dash' | 'embed';
  confidence: number;
  requiresProxy?: boolean;
  embedUrl?: string;
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
        // Add proxied URLs to non-embed streams
        const streamsWithProxy = (response.streams || []).map((stream: any) => ({
          ...stream,
          // Only proxy HLS/MP4 streams, not embeds
          proxiedUrl: stream.type !== 'embed' ? getProxiedUrl(stream.streamUrl) : stream.streamUrl,
        }));
        setStreams(streamsWithProxy);
        setSearchedSources([]);
        console.log(`[AI Engine] Found ${streamsWithProxy.length} streams/embeds`);
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
