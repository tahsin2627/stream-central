import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Button } from '@/components/ui/button';
import { useTVShowDetails } from '@/hooks/useTMDB';
import { tmdbApi } from '@/lib/api/tmdb';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TVShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  
  const { data: show, isLoading, error } = useTVShowDetails(Number(id));

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

  if (error || !show) {
    return (
      <Layout>
        <div className="pt-32 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error?.message || "We couldn't find the show you're looking for."}
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const backdropUrl = tmdbApi.getBackdropUrl(show.backdrop_path);
  const posterUrl = tmdbApi.getPosterUrl(show.poster_path);
  const releaseYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A';
  const seasons = show.number_of_seasons || 1;

  return (
    <Layout>
      {/* Video Player */}
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
          <VideoPlayer 
            tmdbId={show.id} 
            mediaType="tv" 
            season={selectedSeason}
            episode={selectedEpisode}
          />
        </motion.div>
      )}

      {/* Backdrop Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={show.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 z-10 text-foreground hover:bg-secondary/50"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <div className="relative h-full container mx-auto px-4 flex items-end pb-12">
          <div className="flex gap-8 items-end">
            {posterUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block flex-shrink-0"
              >
                <img
                  src={posterUrl}
                  alt={show.name}
                  className="w-48 lg:w-64 rounded-lg shadow-2xl"
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 max-w-2xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                {show.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                  <span className="text-foreground font-medium">{show.vote_average.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {releaseYear}
                </span>
                <span>{seasons} Season{seasons > 1 ? 's' : ''}</span>
                {show.status && <span className="capitalize">{show.status}</span>}
              </div>

              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {show.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 text-xs rounded-full bg-secondary text-muted-foreground"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Season/Episode Selector */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Season:</span>
                  <Select 
                    value={String(selectedSeason)} 
                    onValueChange={(v) => setSelectedSeason(Number(v))}
                  >
                    <SelectTrigger className="w-24 bg-secondary border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: seasons }, (_, i) => i + 1).map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Episode:</span>
                  <Select 
                    value={String(selectedEpisode)} 
                    onValueChange={(v) => setSelectedEpisode(Number(v))}
                  >
                    <SelectTrigger className="w-24 bg-secondary border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((e) => (
                        <SelectItem key={e} value={String(e)}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 px-8" onClick={() => setIsPlaying(true)}>
                  <Play className="h-5 w-5" fill="currentColor" />
                  Play S{selectedSeason} E{selectedEpisode}
                </Button>
                <Button size="lg" variant="secondary" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add to List
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-4xl">
          {show.overview || 'No overview available.'}
        </p>
      </section>
    </Layout>
  );
};

export default TVShowDetail;
