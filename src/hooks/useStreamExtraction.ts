import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StreamSource {
  url: string;
  quality: string;
  type: 'hls' | 'mp4' | 'dash' | 'embed';
}

interface ExtractionResult {
  success: boolean;
  sources?: StreamSource[];
  error?: string;
  provider?: string;
}

export const useStreamExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [provider, setProvider] = useState<string | null>(null);

  const extractStreams = useCallback(async (params: {
    embedUrl?: string;
    tmdbId?: number;
    mediaType?: 'movie' | 'tv';
    season?: number;
    episode?: number;
  }): Promise<ExtractionResult> => {
    setIsExtracting(true);
    setError(null);
    setSources([]);
    setProvider(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('extract-stream', {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      const result = data as ExtractionResult;

      if (!result.success) {
        setError(result.error || 'Extraction failed');
        return result;
      }

      setSources(result.sources || []);
      setProvider(result.provider || null);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract streams';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const clearSources = useCallback(() => {
    setSources([]);
    setError(null);
    setProvider(null);
  }, []);

  return {
    extractStreams,
    clearSources,
    isExtracting,
    error,
    sources,
    provider,
  };
};
