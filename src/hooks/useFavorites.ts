import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteItem {
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

export const useFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as FavoriteItem[];
    },
    enabled: !!user,
  });
};

export const useIsFavorite = (tmdbId: number, mediaType: 'movie' | 'tv') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', 'check', tmdbId, mediaType, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('favorites')
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

interface AddToFavoritesParams {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: string | null;
}

export const useAddToFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: AddToFavoritesParams) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase.from('favorites').insert({
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
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: 'Added to Favorites',
        description: `${params.title} has been added to your favorites.`,
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

export const useRemoveFromFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tmdbId, mediaType }: { tmdbId: number; mediaType: 'movie' | 'tv' }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: 'Removed from Favorites',
        description: 'Item has been removed from your favorites.',
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
