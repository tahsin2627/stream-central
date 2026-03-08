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
  useBengaliWebSeries,
  useBengaliPopular,
  useHindiWebSeries,
  useMalayalamMovies,
  useKannadaMovies,
  usePopularMovies,
  usePopularTVShows,
} from '@/hooks/useTMDB';
import { TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const { data: trending, isLoading: trendingLoading } = useTrending('all', 'week');
  
  const { data: latestMovies, isLoading: latestMoviesLoading } = useLatestMovies();
  const { data: latestTV, isLoading: latestTVLoading } = useLatestTVShows();
  
  const { data: hollywood, isLoading: hollywoodLoading } = useHollywoodMovies();
  const { data: bollywood, isLoading: bollywoodLoading } = useBollywoodMovies();
  const { data: tamil, isLoading: tamilLoading } = useTamilMovies();
  const { data: telugu, isLoading: teluguLoading } = useTeluguMovies();
  const { data: kdramas, isLoading: kdramasLoading } = useKoreanDramas();
  const { data: bengali, isLoading: bengaliLoading } = useBengaliMovies();
  const { data: bengaliTV, isLoading: bengaliTVLoading } = useBengaliTVShows();
  const { data: bengaliWeb, isLoading: bengaliWebLoading } = useBengaliWebSeries();
  const { data: bengaliPopular, isLoading: bengaliPopularLoading } = useBengaliPopular();
  const { data: hindiWeb, isLoading: hindiWebLoading } = useHindiWebSeries();
  const { data: malayalam, isLoading: malayalamLoading } = useMalayalamMovies();
  const { data: kannada, isLoading: kannadaLoading } = useKannadaMovies();
  
  const { data: popularMovies, isLoading: popularMoviesLoading } = usePopularMovies();
  const { data: popularTV, isLoading: popularTVLoading } = usePopularTVShows();

  const featuredIndex = trending?.results?.length ? Math.floor(Math.random() * Math.min(5, trending.results.length)) : 0;
  const featured = trending?.results?.[featuredIndex] as (TMDBMovie | TMDBTVShow) | undefined;

  return (
    <Layout>
      <HeroSection featured={featured || null} isLoading={trendingLoading} />
      
      <div className="relative -mt-16 sm:-mt-24 md:-mt-32 z-10 pb-16">
        {user && <ContinueWatchingCarousel />}

        <ContentCarousel title="🔥 Trending This Week" items={(trending?.results || []) as (TMDBMovie | TMDBTVShow)[]} size="large" isLoading={trendingLoading} />
        <ContentCarousel title="🆕 Latest Movies" items={(latestMovies?.results || []) as TMDBMovie[]} isLoading={latestMoviesLoading} />
        <ContentCarousel title="📺 Latest TV Shows" items={(latestTV?.results || []) as TMDBTVShow[]} isLoading={latestTVLoading} />
        <ContentCarousel title="🎬 Hollywood Latest" items={(hollywood?.results || []) as TMDBMovie[]} isLoading={hollywoodLoading} />
        <ContentCarousel title="🇮🇳 Bollywood Latest" items={(bollywood?.results || []) as TMDBMovie[]} isLoading={bollywoodLoading} />
        <ContentCarousel title="📱 Hindi Web Series" items={(hindiWeb?.results || []) as TMDBTVShow[]} isLoading={hindiWebLoading} />
        <ContentCarousel title="🎭 Tamil Cinema" items={(tamil?.results || []) as TMDBMovie[]} isLoading={tamilLoading} />
        <ContentCarousel title="🌟 Telugu Cinema" items={(telugu?.results || []) as TMDBMovie[]} isLoading={teluguLoading} />
        <ContentCarousel title="🎥 Malayalam Cinema" items={(malayalam?.results || []) as TMDBMovie[]} isLoading={malayalamLoading} />
        <ContentCarousel title="🏛️ Kannada Cinema" items={(kannada?.results || []) as TMDBMovie[]} isLoading={kannadaLoading} />
        <ContentCarousel title="🇰🇷 Korean Dramas" items={(kdramas?.results || []) as TMDBTVShow[]} isLoading={kdramasLoading} />
        <ContentCarousel title="🇧🇩 Bangla New Releases" items={(bengali?.results || []) as TMDBMovie[]} isLoading={bengaliLoading} />
        <ContentCarousel title="🎬 Bangla Web Series" items={(bengaliWeb?.results || []) as TMDBTVShow[]} isLoading={bengaliWebLoading} />
        <ContentCarousel title="📺 Bangla TV Shows" items={(bengaliTV?.results || []) as TMDBTVShow[]} isLoading={bengaliTVLoading} />
        <ContentCarousel title="⭐ Bangla Popular" items={(bengaliPopular?.results || []) as TMDBMovie[]} isLoading={bengaliPopularLoading} />
        <ContentCarousel title="🎬 Popular Movies" items={(popularMovies?.results || []) as TMDBMovie[]} isLoading={popularMoviesLoading} />
        <ContentCarousel title="📺 Popular TV Shows" items={(popularTV?.results || []) as TMDBTVShow[]} isLoading={popularTVLoading} />
      </div>
    </Layout>
  );
};

export default Index;
