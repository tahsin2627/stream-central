import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { MovieCard } from '@/components/content/MovieCard';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Film, Plus } from 'lucide-react';
import { tmdbApi, TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';

const MyList = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: watchlist, isLoading } = useWatchlist();

  if (authLoading) {
    return (
      <Layout>
        <div className="pt-24 container mx-auto px-4">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="pt-24 pb-16 container mx-auto px-4">
          <div className="max-w-md mx-auto text-center py-16">
            <Film className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Sign in to access your list</h1>
            <p className="text-muted-foreground mb-8">
              Create an account to save movies and shows to your personal watchlist.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Convert watchlist items to TMDB format for MovieCard
  const items = watchlist?.map(item => ({
    id: item.tmdb_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: null,
    release_date: item.release_date || '',
    first_air_date: item.release_date || '',
    vote_average: item.vote_average || 0,
    vote_count: 0,
    genre_ids: [],
    overview: '',
    original_language: 'en',
    popularity: 0,
    media_type: item.media_type,
  })) as (TMDBMovie | TMDBTVShow)[] || [];

  return (
    <Layout>
      <div className="pt-24 pb-16 container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">My List</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, index) => (
              <MovieCard key={item.id} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Plus className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Your list is empty</h2>
            <p className="text-muted-foreground mb-8">
              Browse movies and shows to add them to your watchlist.
            </p>
            <Button asChild>
              <Link to="/">Browse Content</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyList;
