import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DiaryEntry {
  id: string;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  rating: number | null;
  review: string | null;
  watched_date: string;
  liked: boolean;
  created_at: string;
  updated_at: string;
}

export const useFilmDiary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['film-diary', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('film_diary')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_date', { ascending: false });
      if (error) throw error;
      return data as DiaryEntry[];
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: {
      tmdb_id: number;
      media_type: string;
      title: string;
      poster_path?: string | null;
      rating?: number | null;
      review?: string | null;
      watched_date?: string;
      liked?: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase.from('film_diary').insert({
        user_id: user.id,
        tmdb_id: entry.tmdb_id,
        media_type: entry.media_type,
        title: entry.title,
        poster_path: entry.poster_path,
        rating: entry.rating,
        review: entry.review,
        watched_date: entry.watched_date || new Date().toISOString().split('T')[0],
        liked: entry.liked || false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-diary'] });
      toast({ title: 'Logged!', description: 'Added to your film diary.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('film_diary').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['film-diary'] });
      toast({ title: 'Removed from diary' });
    },
  });

  return { entries, isLoading, addEntry, deleteEntry };
};
