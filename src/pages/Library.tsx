import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { MovieCard } from '@/components/content/MovieCard';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Library as LibraryIcon, Heart, List, Layers } from 'lucide-react';
import { TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'watchlist' | 'favorites';

const toCard = (item: any) => ({
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
});

const Library = () => {
  const [tab, setTab] = useState<Tab>('all');
  const { user, isLoading: authLoading } = useAuth();
  const { data: watchlist, isLoading: wlLoading } = useWatchlist();
  const { data: favorites, isLoading: favLoading } = useFavorites();

  const isLoading = wlLoading || favLoading;

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
            <LibraryIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Sign in to access your library</h1>
            <p className="text-muted-foreground mb-8">
              Create an account to save movies and shows to your watchlist and favorites.
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

  const wlItems = watchlist?.map(toCard) || [];
  const favItems = favorites?.map(toCard) || [];

  // Merge and deduplicate for "all" tab
  const allMap = new Map<string, any>();
  wlItems.forEach(i => allMap.set(`${i.media_type}-${i.id}`, { ...i, _source: 'watchlist' }));
  favItems.forEach(i => {
    const key = `${i.media_type}-${i.id}`;
    if (allMap.has(key)) {
      allMap.get(key)._source = 'both';
    } else {
      allMap.set(key, { ...i, _source: 'favorites' });
    }
  });
  const allItems = Array.from(allMap.values());

  const items = tab === 'all' ? allItems : tab === 'watchlist' ? wlItems : favItems;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <Layers className="h-4 w-4" />, count: allItems.length },
    { id: 'watchlist', label: 'Watchlist', icon: <List className="h-4 w-4" />, count: wlItems.length },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="h-4 w-4" />, count: favItems.length },
  ];

  return (
    <Layout>
      <div className="pt-24 pb-16 container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">My Library</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {t.icon}
              {t.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                tab === t.id ? 'bg-primary-foreground/20' : 'bg-muted'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item, index) => (
              <MovieCard key={`${item.media_type}-${item.id}`} item={item as TMDBMovie | TMDBTVShow} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <LibraryIcon className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              {tab === 'all' ? 'Your library is empty' : tab === 'watchlist' ? 'Your watchlist is empty' : 'No favorites yet'}
            </h2>
            <p className="text-muted-foreground mb-8">
              Browse movies and shows to start building your collection.
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

export default Library;
