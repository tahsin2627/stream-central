-- Create a table to cache scraped stream URLs
CREATE TABLE public.stream_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  season INTEGER,
  episode INTEGER,
  provider TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_type TEXT NOT NULL DEFAULT 'hls' CHECK (stream_type IN ('hls', 'mp4', 'dash')),
  quality TEXT DEFAULT 'HD',
  is_working BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(tmdb_id, media_type, season, episode, provider, stream_url)
);

-- Enable RLS
ALTER TABLE public.stream_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can read cached streams)
CREATE POLICY "Anyone can read stream cache"
ON public.stream_cache
FOR SELECT
USING (true);

-- Only backend can insert/update (via service role)
CREATE POLICY "Service role can manage stream cache"
ON public.stream_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create index for fast lookups (without time predicate)
CREATE INDEX idx_stream_cache_lookup 
ON public.stream_cache (tmdb_id, media_type, season, episode, is_working);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_cache;