-- Create custom_streams table for user-added streaming links
CREATE TABLE public.custom_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  season INTEGER,
  episode INTEGER,
  stream_url TEXT NOT NULL,
  stream_name TEXT DEFAULT 'My Server',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tmdb_id, media_type, season, episode)
);

-- Enable Row Level Security
ALTER TABLE public.custom_streams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own custom streams" 
ON public.custom_streams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own custom streams" 
ON public.custom_streams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom streams" 
ON public.custom_streams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom streams" 
ON public.custom_streams 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_streams_updated_at
BEFORE UPDATE ON public.custom_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();