import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  progress_seconds: number;
  duration_seconds: number | null;
  season: number | null;
  episode: number | null;
  last_watched_at: string;
  created_at: string;
}

export interface UpdateWatchProgressParams {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  progressSeconds: number;
  durationSeconds?: number | null;
  season?: number;
  episode?: number;
}

export const useWatchHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchHistory, isLoading, error } = useQuery({
    queryKey: ['watchHistory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as WatchHistoryItem[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (params: UpdateWatchProgressParams) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('watch_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('tmdb_id', params.tmdbId)
        .eq('media_type', params.mediaType)
        .eq('season', params.season ?? 0)
        .eq('episode', params.episode ?? 0)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('watch_history')
          .update({
            progress_seconds: params.progressSeconds,
            duration_seconds: params.durationSeconds,
            last_watched_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watch_history')
          .insert({
            user_id: user.id,
            tmdb_id: params.tmdbId,
            media_type: params.mediaType,
            title: params.title,
            poster_path: params.posterPath,
            backdrop_path: params.backdropPath,
            progress_seconds: params.progressSeconds,
            duration_seconds: params.durationSeconds,
            season: params.season ?? 0,
            episode: params.episode ?? 0,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    },
  });

  const removeFromHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    },
  });

  // Get items that are partially watched (not finished)
  const continueWatching = watchHistory?.filter(item => {
    if (!item.duration_seconds) return true;
    const percentWatched = (item.progress_seconds / item.duration_seconds) * 100;
    return percentWatched < 90 && percentWatched > 2;
  }) ?? [];

  return {
    watchHistory,
    continueWatching,
    isLoading,
    error,
    updateProgress: updateProgressMutation.mutate,
    removeFromHistory: removeFromHistoryMutation.mutate,
  };
};
