import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/content/HeroSection';
import { ContentCarousel } from '@/components/content/ContentCarousel';
import { ContinueWatchingCarousel } from '@/components/content/ContinueWatchingCarousel';
import { useTrending, usePopularMovies, useTopRatedMovies, usePopularTVShows } from '@/hooks/useTMDB';
import { TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const { data: trending, isLoading: trendingLoading } = useTrending('all', 'week');
  const { data: popularMovies, isLoading: moviesLoading } = usePopularMovies();
  const { data: topRatedMovies, isLoading: topRatedLoading } = useTopRatedMovies();
  const { data: popularTV, isLoading: tvLoading } = usePopularTVShows();

  // Get a random featured item from trending
  const featuredIndex = trending?.results?.length ? Math.floor(Math.random() * Math.min(5, trending.results.length)) : 0;
  const featured = trending?.results?.[featuredIndex] as (TMDBMovie | TMDBTVShow) | undefined;

  return (
    <Layout>
      <HeroSection featured={featured || null} isLoading={trendingLoading} />
      
      <div className="relative -mt-32 z-10 pb-16">
        {/* Continue Watching - Only show when logged in */}
        {user && <ContinueWatchingCarousel />}

        <ContentCarousel 
          title="Trending This Week" 
          items={(trending?.results || []) as (TMDBMovie | TMDBTVShow)[]} 
          size="large"
          isLoading={trendingLoading}
        />
        <ContentCarousel 
          title="Popular Movies" 
          items={(popularMovies?.results || []) as TMDBMovie[]}
          isLoading={moviesLoading}
        />
        <ContentCarousel 
          title="Top Rated Movies" 
          items={(topRatedMovies?.results || []) as TMDBMovie[]}
          isLoading={topRatedLoading}
        />
        <ContentCarousel 
          title="Popular TV Shows" 
          items={(popularTV?.results || []) as TMDBTVShow[]}
          isLoading={tvLoading}
        />
      </div>
    </Layout>
  );
};

export default Index;
