import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useMovieGenres, useTVGenres } from '@/hooks/useTMDB';
import { Skeleton } from '@/components/ui/skeleton';
import { Film, Tv } from 'lucide-react';

const Genres = () => {
  const { data: movieGenres, isLoading: movieLoading } = useMovieGenres();
  const { data: tvGenres, isLoading: tvLoading } = useTVGenres();

  return (
    <Layout>
      <div className="pt-24 pb-16 container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-12">Genres</h1>

        {/* Movie Genres */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Film className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Movie Genres</h2>
          </div>
          
          {movieLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movieGenres?.map((genre) => (
                <Link
                  key={genre.id}
                  to={`/movies?genre=${genre.id}`}
                  className="p-6 rounded-lg bg-secondary hover:bg-accent transition-colors text-center"
                >
                  <span className="font-medium">{genre.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* TV Genres */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Tv className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">TV Show Genres</h2>
          </div>
          
          {tvLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvGenres?.map((genre) => (
                <Link
                  key={genre.id}
                  to={`/tv-shows?genre=${genre.id}`}
                  className="p-6 rounded-lg bg-secondary hover:bg-accent transition-colors text-center"
                >
                  <span className="font-medium">{genre.name}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Genres;
