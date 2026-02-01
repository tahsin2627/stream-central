import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ContentCarousel } from '@/components/content/ContentCarousel';
import { MovieCard } from '@/components/content/MovieCard';
import { usePopularTVShows, useTVGenres } from '@/hooks/useTMDB';
import { useQuery } from '@tanstack/react-query';
import { tmdbApi, TMDBTVShow } from '@/lib/api/tmdb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TVShows = () => {
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const { data: popular, isLoading: popularLoading } = usePopularTVShows();
  const { data: genres } = useTVGenres();

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['tv', 'top_rated'],
    queryFn: async () => {
      const response = await tmdbApi.getTopRatedTVShows();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  const { data: genreShows, isLoading: genreLoading } = useQuery({
    queryKey: ['tv', 'genre', selectedGenre],
    queryFn: async () => {
      if (!selectedGenre) return null;
      const response = await tmdbApi.getTVShowsByGenre(selectedGenre);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!selectedGenre,
  });

  return (
    <Layout>
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">TV Shows</h1>
          
          {/* Genre Filter */}
          {genres && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Button
                variant={selectedGenre === null ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedGenre(null)}
                className="rounded-full"
              >
                All
              </Button>
              {genres.map((genre) => (
                <Button
                  key={genre.id}
                  variant={selectedGenre === genre.id ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedGenre(genre.id)}
                  className="rounded-full"
                >
                  {genre.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {selectedGenre && genreShows ? (
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-semibold mb-4">
              {genres?.find(g => g.id === selectedGenre)?.name} TV Shows
            </h2>
            {genreLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {genreShows.results.map((show, index) => (
                  <MovieCard key={show.id} item={show} index={index} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <ContentCarousel
              title="Popular TV Shows"
              items={(popular?.results || []) as TMDBTVShow[]}
              size="large"
              isLoading={popularLoading}
            />
            <ContentCarousel
              title="Top Rated"
              items={(topRated?.results || []) as TMDBTVShow[]}
              isLoading={topRatedLoading}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default TVShows;
