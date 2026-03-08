import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Star, Calendar, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { WatchlistButton } from '@/components/content/WatchlistButton';
import { ShareStoryDialog } from '@/components/share/ShareStoryDialog';
import { Button } from '@/components/ui/button';
import { useTVShowDetails, useSeasonDetails } from '@/hooks/useTMDB';
import { tmdbApi } from '@/lib/api/tmdb';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EpisodeList } from '@/components/player/EpisodeList';

const TVShowDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  
  const { data: show, isLoading, error } = useTVShowDetails(Number(id));
  const { data: seasonData, isLoading: seasonLoading } = useSeasonDetails(
    Number(id),
    selectedSeason
  );

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

  // Parse episodes from season data
  const episodes = seasonData?.episodes?.map((ep: any) => ({
    number: ep.episode_number,
    name: ep.name,
    overview: ep.overview,
    stillPath: ep.still_path,
    runtime: ep.runtime,
  })) || [];

  const handleSeasonChange = (value: string) => {
    setSelectedSeason(Number(value));
    setSelectedEpisode(1);
  };

  return (
    <Layout>
      {/* Backdrop Hero */}
      <section className="relative min-h-[90vh] sm:h-[70vh] sm:min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          {backdropUrl ? (
            <img src={backdropUrl} alt={show.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent md:via-background/30" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 z-10 text-foreground hover:bg-secondary/50"
        >
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <div className="relative h-full container mx-auto px-4 flex items-end pb-6 md:pb-12">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-end w-full">
            {posterUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0 mx-auto md:mx-0">
                <img src={posterUrl} alt={show.name} className="w-32 sm:w-40 md:w-48 lg:w-64 rounded-lg shadow-2xl" />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 max-w-2xl text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 tracking-tight">{show.name}</h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" fill="currentColor" />
                  <span className="text-foreground font-medium">{show.vote_average.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                  {releaseYear}
                </span>
                <span>{seasons} Season{seasons > 1 ? 's' : ''}</span>
                {show.status && <span className="capitalize hidden sm:inline">{show.status}</span>}
              </div>

              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4 md:mb-6">
                  {show.genres.map((genre) => (
                    <span key={genre.id} className="px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs rounded-full bg-secondary text-muted-foreground">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Season/Episode Selector */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground">Season:</span>
                  <Select value={String(selectedSeason)} onValueChange={handleSeasonChange}>
                    <SelectTrigger className="w-16 md:w-24 h-8 md:h-10 text-xs md:text-sm bg-secondary border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: seasons }, (_, i) => i + 1).map((s) => (
                        <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground">Episode:</span>
                  <Select value={String(selectedEpisode)} onValueChange={(v) => setSelectedEpisode(Number(v))}>
                    <SelectTrigger className="w-16 md:w-24 h-8 md:h-10 text-xs md:text-sm bg-secondary border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(episodes.length > 0 ? episodes : Array.from({ length: 10 }, (_, i) => ({ number: i + 1 }))).map((ep: any) => (
                        <SelectItem key={ep.number} value={String(ep.number)}>{ep.number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                <Button size="default" className="gap-2 px-4 md:px-8 flex-1 sm:flex-none" onClick={() => navigate(`/watch/tv/${show.id}?s=${selectedSeason}&e=${selectedEpisode}`)}>
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  <span className="text-xs md:text-sm">S{selectedSeason} E{selectedEpisode}</span>
                </Button>
                <WatchlistButton tmdbId={show.id} mediaType="tv" title={show.name} posterPath={show.poster_path} voteAverage={show.vote_average} releaseDate={show.first_air_date} size="default" />
                <ShareStoryDialog
                  title={show.name} posterUrl={posterUrl} backdropUrl={backdropUrl} rating={show.vote_average} year={releaseYear} mediaType="tv" genres={show.genres} tmdbId={show.id}
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
          {show.overview || 'No overview available.'}
        </p>
      </section>

      {/* Episodes Section */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-semibold">
            Season {selectedSeason} Episodes
            {seasonLoading && <span className="text-sm text-muted-foreground ml-2">(loading...)</span>}
          </h2>
          <Select value={String(selectedSeason)} onValueChange={handleSeasonChange}>
            <SelectTrigger className="w-32 h-9 text-sm bg-secondary border-none">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: seasons }, (_, i) => i + 1).map((s) => (
                <SelectItem key={s} value={String(s)}>Season {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {episodes.length > 0 ? (
          <div className="max-w-4xl">
            <EpisodeList
              episodes={episodes}
              currentEpisode={selectedEpisode}
              onEpisodeSelect={(ep) => {
                setSelectedEpisode(ep);
                navigate(`/watch/tv/${show.id}?s=${selectedSeason}&e=${ep}`);
              }}
            />
          </div>
        ) : seasonLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full max-w-4xl rounded-lg" />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No episodes found for this season.</p>
        )}
      </section>
    </Layout>
  );
};

export default TVShowDetail;
