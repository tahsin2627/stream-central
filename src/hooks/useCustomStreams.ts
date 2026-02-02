import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomStream {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
  stream_url: string;
  stream_name: string;
  created_at: string;
  updated_at: string;
}

export interface AddCustomStreamParams {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  stream_url: string;
  stream_name?: string;
}

export const useCustomStreams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch ALL custom streams (publicly accessible)
  const { data: customStreams = [], isLoading } = useQuery({
    queryKey: ['custom-streams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_streams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomStream[];
    },
  });

  // Get custom stream for specific content
  const getCustomStream = (
    tmdbId: number, 
    mediaType: 'movie' | 'tv', 
    season?: number, 
    episode?: number
  ): CustomStream | undefined => {
    return customStreams.find(s => 
      s.tmdb_id === tmdbId && 
      s.media_type === mediaType &&
      (mediaType === 'movie' || (s.season === season && s.episode === episode))
    );
  };

  // Check if custom stream exists for content
  const hasCustomStream = (
    tmdbId: number, 
    mediaType: 'movie' | 'tv', 
    season?: number, 
    episode?: number
  ): boolean => {
    return !!getCustomStream(tmdbId, mediaType, season, episode);
  };

  // Add custom stream
  const addStreamMutation = useMutation({
    mutationFn: async (params: AddCustomStreamParams) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('custom_streams')
        .upsert({
          user_id: user.id,
          tmdb_id: params.tmdb_id,
          media_type: params.media_type,
          season: params.season || null,
          episode: params.episode || null,
          stream_url: params.stream_url,
          stream_name: params.stream_name || 'My Server',
        }, {
          onConflict: 'user_id,tmdb_id,media_type,season,episode'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-streams'] });
      toast.success('Custom stream saved!');
    },
    onError: (error) => {
      toast.error('Failed to save custom stream: ' + error.message);
    },
  });

  // Delete custom stream
  const deleteStreamMutation = useMutation({
    mutationFn: async (streamId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('custom_streams')
        .delete()
        .eq('id', streamId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-streams'] });
      toast.success('Custom stream removed');
    },
    onError: (error) => {
      toast.error('Failed to remove stream: ' + error.message);
    },
  });

  return {
    customStreams,
    isLoading,
    getCustomStream,
    hasCustomStream,
    addStream: addStreamMutation.mutate,
    deleteStream: deleteStreamMutation.mutate,
    isAdding: addStreamMutation.isPending,
    isDeleting: deleteStreamMutation.isPending,
    isAdmin: !!user, // Only logged-in users can manage streams
  };
};
