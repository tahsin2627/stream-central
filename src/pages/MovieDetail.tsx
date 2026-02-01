import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Clock, Calendar, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { WatchlistButton } from '@/components/content/WatchlistButton';
import { ShareStoryDialog } from '@/components/share/ShareStoryDialog';
import { Button } from '@/components/ui/button';
import { useMovieDetails } from '@/hooks/useTMDB';
import { tmdbApi } from '@/lib/api/tmdb';
import { Skeleton } from '@/components/ui/skeleton';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { data: movie, isLoading, error } = useMovieDetails(Number(id));

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-16">
          <Skeleton className="w-full h-[70vh]" />
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-8" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !movie) {
    return (
      <Layout>
        <div className="pt-32 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error?.message || "We couldn't find the movie you're looking for."}
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const backdropUrl = tmdbApi.getBackdropUrl(movie.backdrop_path);
  const posterUrl = tmdbApi.getPosterUrl(movie.poster_path);
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;

  return (
    <Layout>
      {/* Video Player (Full Screen when playing) */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(false)}
            className="absolute top-4 left-4 z-10 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <VideoPlayer tmdbId={movie.id} mediaType="movie" />
        </motion.div>
      )}

      {/* Backdrop Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 z-10 text-foreground hover:bg-secondary/50"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex items-end pb-12">
          <div className="flex gap-8 items-end">
            {/* Poster */}
            {posterUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block flex-shrink-0"
              >
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-48 lg:w-64 rounded-lg shadow-2xl"
                />
              </motion.div>
            )}

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 max-w-2xl"
            >
              {movie.tagline && (
                <p className="text-muted-foreground italic mb-2">{movie.tagline}</p>
              )}
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                {movie.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                  <span className="text-foreground font-medium">{movie.vote_average.toFixed(1)}</span>
                  <span>({movie.vote_count.toLocaleString()} votes)</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {releaseYear}
                </span>
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {runtime}
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 text-xs rounded-full bg-secondary text-muted-foreground"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 px-8" onClick={() => setIsPlaying(true)}>
                  <Play className="h-5 w-5" fill="currentColor" />
                  Play
                </Button>
                <WatchlistButton
                  tmdbId={movie.id}
                  mediaType="movie"
                  title={movie.title}
                  posterPath={movie.poster_path}
                  voteAverage={movie.vote_average}
                  releaseDate={movie.release_date}
                  size="lg"
                />
                <ShareStoryDialog
                  title={movie.title}
                  posterUrl={posterUrl}
                  backdropUrl={backdropUrl}
                  rating={movie.vote_average}
                  year={releaseYear}
                  mediaType="movie"
                  genres={movie.genres}
                  trigger={
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Share2 className="h-5 w-5" />
                      Share
                    </Button>
                  }
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-4xl">
          {movie.overview || 'No overview available.'}
        </p>
      </section>
    </Layout>
  );
};

export default MovieDetail;
