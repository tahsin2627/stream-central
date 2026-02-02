import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/content/HeroSection';
import { ContentCarousel } from '@/components/content/ContentCarousel';
import { ContinueWatchingCarousel } from '@/components/content/ContinueWatchingCarousel';
import { 
  useTrending, 
  useLatestMovies,
  useLatestTVShows,
  useHollywoodMovies,
  useBollywoodMovies, 
  useTamilMovies,
  useTeluguMovies,
  useKoreanDramas, 
  useBengaliMovies, 
  useBengaliTVShows,
  usePopularMovies,
  usePopularTVShows,
} from '@/hooks/useTMDB';
import { TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const { data: trending, isLoading: trendingLoading } = useTrending('all', 'week');
  
  // Latest content - newest first
  const { data: latestMovies, isLoading: latestMoviesLoading } = useLatestMovies();
  const { data: latestTV, isLoading: latestTVLoading } = useLatestTVShows();
  
  // Regional content - newest first
  const { data: hollywood, isLoading: hollywoodLoading } = useHollywoodMovies();
  const { data: bollywood, isLoading: bollywoodLoading } = useBollywoodMovies();
  const { data: tamil, isLoading: tamilLoading } = useTamilMovies();
  const { data: telugu, isLoading: teluguLoading } = useTeluguMovies();
  const { data: kdramas, isLoading: kdramasLoading } = useKoreanDramas();
  const { data: bengali, isLoading: bengaliLoading } = useBengaliMovies();
  const { data: bengaliTV, isLoading: bengaliTVLoading } = useBengaliTVShows();
  
  // Popular content (legacy - for variety)
  const { data: popularMovies, isLoading: popularMoviesLoading } = usePopularMovies();
  const { data: popularTV, isLoading: popularTVLoading } = usePopularTVShows();

  // Get a random featured item from trending
  const featuredIndex = trending?.results?.length ? Math.floor(Math.random() * Math.min(5, trending.results.length)) : 0;
  const featured = trending?.results?.[featuredIndex] as (TMDBMovie | TMDBTVShow) | undefined;

  return (
    <Layout>
      <HeroSection featured={featured || null} isLoading={trendingLoading} />
      
      <div className="relative -mt-16 sm:-mt-24 md:-mt-32 z-10 pb-16">
        {/* Continue Watching - Only show when logged in */}
        {user && <ContinueWatchingCarousel />}

        {/* Trending - Most popular right now */}
        <ContentCarousel 
          title="🔥 Trending This Week" 
          items={(trending?.results || []) as (TMDBMovie | TMDBTVShow)[]} 
          size="large"
          isLoading={trendingLoading}
        />

        {/* Latest Movies - Newest releases first */}
        <ContentCarousel 
          title="🆕 Latest Movies" 
          items={(latestMovies?.results || []) as TMDBMovie[]}
          isLoading={latestMoviesLoading}
        />

        {/* Latest TV Shows - Newest first */}
        <ContentCarousel 
          title="📺 Latest TV Shows" 
          items={(latestTV?.results || []) as TMDBTVShow[]}
          isLoading={latestTVLoading}
        />

        {/* Hollywood - Latest English movies */}
        <ContentCarousel 
          title="🎬 Hollywood Latest" 
          items={(hollywood?.results || []) as TMDBMovie[]}
          isLoading={hollywoodLoading}
        />

        {/* Bollywood - Latest Hindi movies */}
        <ContentCarousel 
          title="🇮🇳 Bollywood Latest" 
          items={(bollywood?.results || []) as TMDBMovie[]}
          isLoading={bollywoodLoading}
        />

        {/* South Indian - Tamil */}
        <ContentCarousel 
          title="🎭 Tamil Cinema" 
          items={(tamil?.results || []) as TMDBMovie[]}
          isLoading={tamilLoading}
        />

        {/* South Indian - Telugu */}
        <ContentCarousel 
          title="🌟 Telugu Cinema" 
          items={(telugu?.results || []) as TMDBMovie[]}
          isLoading={teluguLoading}
        />

        {/* Korean Dramas */}
        <ContentCarousel 
          title="🇰🇷 Korean Dramas" 
          items={(kdramas?.results || []) as TMDBTVShow[]}
          isLoading={kdramasLoading}
        />

        {/* Bengali Cinema */}
        <ContentCarousel 
          title="🎥 Bengali Cinema" 
          items={(bengali?.results || []) as TMDBMovie[]}
          isLoading={bengaliLoading}
        />

        {/* Bengali TV Shows */}
        <ContentCarousel 
          title="📺 Bengali TV Shows" 
          items={(bengaliTV?.results || []) as TMDBTVShow[]}
          isLoading={bengaliTVLoading}
        />

        {/* Popular Movies - For variety */}
        <ContentCarousel 
          title="⭐ Popular Movies" 
          items={(popularMovies?.results || []) as TMDBMovie[]}
          isLoading={popularMoviesLoading}
        />

        {/* Popular TV Shows - For variety */}
        <ContentCarousel 
          title="📺 Popular TV Shows" 
          items={(popularTV?.results || []) as TMDBTVShow[]}
          isLoading={popularTVLoading}
        />
      </div>
    </Layout>
  );
};

export default Index;
