import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  release_date: string | null;
  added_at: string;
}

export const useWatchlist = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as WatchlistItem[];
    },
    enabled: !!user,
  });
};

export const useIsInWatchlist = (tmdbId: number, mediaType: 'movie' | 'tv') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['watchlist', 'check', tmdbId, mediaType, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
};

interface AddToWatchlistParams {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: string | null;
}

export const useAddToWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: AddToWatchlistParams) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase.from('watchlist').insert({
        user_id: user.id,
        tmdb_id: params.tmdbId,
        media_type: params.mediaType,
        title: params.title,
        poster_path: params.posterPath,
        vote_average: params.voteAverage,
        release_date: params.releaseDate,
      });

      if (error) throw error;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: 'Added to My List',
        description: `${params.title} has been added to your watchlist.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRemoveFromWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tmdbId, mediaType }: { tmdbId: number; mediaType: 'movie' | 'tv' }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast({
        title: 'Removed from My List',
        description: 'Item has been removed from your watchlist.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
