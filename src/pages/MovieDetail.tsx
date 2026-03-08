import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Clock, Calendar, Share2, BookOpen } from 'lucide-react';
import { LetterboxdLink } from '@/components/content/LetterboxdLink';
import { LetterboxdRating } from '@/components/content/LetterboxdRating';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { WatchlistButton } from '@/components/content/WatchlistButton';
import { FavoriteButton } from '@/components/content/FavoriteButton';
import { ShareStoryDialog } from '@/components/share/ShareStoryDialog';
import { LogFilmDialog } from '@/components/diary/LogFilmDialog';
import { Button } from '@/components/ui/button';
import { useMovieDetails } from '@/hooks/useTMDB';
import { tmdbApi } from '@/lib/api/tmdb';
import { Skeleton } from '@/components/ui/skeleton';

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
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
          <p className="text-muted-foreground mb-8">We couldn't find the movie you're looking for.</p>
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

      {/* Backdrop Hero - Improved mobile layout */}
      <section className="relative min-h-[85vh] sm:h-[70vh] sm:min-h-[500px] overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent md:via-background/30" />
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 z-10 text-foreground hover:bg-secondary/50"
        >
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex items-end pb-6 md:pb-12">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-end w-full">
            {/* Poster - visible on mobile too */}
            {posterUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 mx-auto md:mx-0"
              >
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-32 sm:w-40 md:w-48 lg:w-64 rounded-lg shadow-2xl"
                />
              </motion.div>
            )}

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 max-w-2xl text-center md:text-left"
            >
              {movie.tagline && (
                <p className="text-muted-foreground italic text-sm md:text-base mb-2">{movie.tagline}</p>
              )}
              
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 tracking-tight">
                {movie.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/90">
                  <Star className="h-3 w-3 md:h-4 md:w-4 text-black" fill="currentColor" />
                  <span className="text-black font-bold">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-black/70 font-medium text-[10px] md:text-xs">IMDb</span>
                </span>
                <span className="hidden sm:inline text-muted-foreground">({movie.vote_count.toLocaleString()} votes)</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  {releaseYear}
                </span>
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    {runtime}
                  </span>
              )}

              {/* Letterboxd Rating */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4 md:mb-6">
                <LetterboxdRating rating={movie.vote_average} size="md" />
                <LetterboxdLink title={movie.title} year={releaseYear} />
              </div>
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4 md:mb-6">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs rounded-full bg-secondary text-muted-foreground"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                <Button size="default" className="gap-2 px-6 md:px-8 flex-1 sm:flex-none" onClick={() => navigate(`/watch/movie/${movie.id}`)}>
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  Play
                </Button>
                <WatchlistButton
                  tmdbId={movie.id}
                  mediaType="movie"
                  title={movie.title}
                  posterPath={movie.poster_path}
                  voteAverage={movie.vote_average}
                  releaseDate={movie.release_date}
                  size="default"
                />
                <LogFilmDialog tmdbId={movie.id} mediaType="movie" title={movie.title} posterPath={movie.poster_path} />
                <ShareStoryDialog
                  title={movie.title}
                  posterUrl={posterUrl}
                  backdropUrl={backdropUrl}
                  rating={movie.vote_average}
                  year={releaseYear}
                  mediaType="movie"
                  genres={movie.genres}
                  tmdbId={movie.id}
                  trigger={
                    <Button variant="secondary" size="default" className="gap-2">
                      <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  }
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Overview</h2>
        <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-4xl">
          {movie.overview || 'No overview available.'}
        </p>
      </section>
    </Layout>
  );
};

export default MovieDetail;
