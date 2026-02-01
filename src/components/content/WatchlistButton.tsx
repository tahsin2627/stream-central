import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsInWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from '@/hooks/useWatchlist';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate: string | null;
  size?: 'default' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'ghost';
  className?: string;
}

export const WatchlistButton = ({
  tmdbId,
  mediaType,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  size = 'default',
  variant = 'secondary',
  className,
}: WatchlistButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isInWatchlist, isLoading: checkLoading } = useIsInWatchlist(tmdbId, mediaType);
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isInWatchlist) {
      removeFromWatchlist.mutate({ tmdbId, mediaType });
    } else {
      addToWatchlist.mutate({
        tmdbId,
        mediaType,
        title,
        posterPath,
        voteAverage,
        releaseDate,
      });
    }
  };

  const isLoading = checkLoading || addToWatchlist.isPending || removeFromWatchlist.isPending;

  if (size === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
          isInWatchlist 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary/80 text-foreground hover:bg-secondary',
          className
        )}
      >
        {isInWatchlist ? (
          <Check className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant={isInWatchlist ? 'default' : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      {isInWatchlist ? (
        <>
          <Check className="h-5 w-5" />
          In My List
        </>
      ) : (
        <>
          <Plus className="h-5 w-5" />
          Add to List
        </>
      )}
    </Button>
  );
};
