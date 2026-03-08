import { Layout } from '@/components/layout/Layout';
import { useFilmDiary } from '@/hooks/useFilmDiary';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Star, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tmdbApi } from '@/lib/api/tmdb';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Diary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { entries, isLoading, deleteEntry } = useFilmDiary();

  if (!user) {
    return (
      <Layout>
        <div className="pt-32 container mx-auto px-4 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Film Diary</h1>
          <p className="text-muted-foreground mb-6">Sign in to start logging films you've watched.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  // Group entries by month
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.watched_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = { label, entries: [] };
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { label: string; entries: typeof entries }>);

  const months = Object.keys(grouped).sort().reverse();

  return (
    <Layout>
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-6 w-6 text-[#00e054]" />
          <h1 className="text-2xl md:text-3xl font-bold">Film Diary</h1>
          <span className="text-sm text-muted-foreground ml-auto">{entries.length} films logged</span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No entries yet.</p>
            <p className="text-muted-foreground text-sm mt-1">Log a film from any movie or show page.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {months.map((month) => {
              const group = grouped[month];
              return (
                <div key={month}>
                  <h2 className="text-lg font-semibold text-muted-foreground mb-3 border-b border-border pb-2">
                    {group.label}
                  </h2>
                  <div className="space-y-2">
                    {group.entries.map((entry, i) => {
                      const posterUrl = tmdbApi.getPosterUrl(entry.poster_path);
                      const date = new Date(entry.watched_date);
                      const dayStr = date.toLocaleDateString('en-US', { day: 'numeric', weekday: 'short' });
                      
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 md:gap-4 p-3 rounded-xl bg-card hover:bg-accent/50 transition-colors group"
                        >
                          {/* Date */}
                          <div className="w-12 text-center flex-shrink-0">
                            <span className="text-xs text-muted-foreground block">{dayStr}</span>
                          </div>

                          {/* Poster */}
                          <Link to={`/${entry.media_type}/${entry.tmdb_id}`} className="flex-shrink-0">
                            {posterUrl ? (
                              <img src={posterUrl} alt={entry.title} className="w-10 h-14 md:w-12 md:h-[72px] rounded object-cover" />
                            ) : (
                              <div className="w-10 h-14 md:w-12 md:h-[72px] rounded bg-secondary" />
                            )}
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link to={`/${entry.media_type}/${entry.tmdb_id}`} className="font-medium text-sm md:text-base line-clamp-1 hover:underline">
                              {entry.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {entry.rating && (
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, s) => (
                                    <svg key={s} width={12} height={12} viewBox="0 0 24 24">
                                      <path
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                        fill={s < entry.rating ? '#00e054' : 'none'}
                                        stroke={s < entry.rating ? '#00e054' : 'hsl(0 0% 50% / 0.25)'}
                                        strokeWidth="1.5"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  ))}
                                </div>
                              )}
                              {entry.liked && <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />}
                            </div>
                            {entry.review && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.review}</p>
                            )}
                          </div>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEntry.mutate(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Diary;
