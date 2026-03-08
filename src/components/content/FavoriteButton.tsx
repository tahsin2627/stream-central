import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsFavorite, useAddToFavorites, useRemoveFromFavorites } from '@/hooks/useFavorites';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
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

export const FavoriteButton = ({
  tmdbId,
  mediaType,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  size = 'default',
  variant = 'secondary',
  className,
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isFavorite, isLoading: checkLoading } = useIsFavorite(tmdbId, mediaType);
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isFavorite) {
      removeFromFavorites.mutate({ tmdbId, mediaType });
    } else {
      addToFavorites.mutate({
        tmdbId,
        mediaType,
        title,
        posterPath,
        voteAverage,
        releaseDate,
      });
    }
  };

  const isLoading = checkLoading || addToFavorites.isPending || removeFromFavorites.isPending;

  if (size === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
          isFavorite 
            ? 'bg-destructive text-destructive-foreground' 
            : 'bg-secondary/80 text-foreground hover:bg-secondary',
          className
        )}
      >
        <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
      </button>
    );
  }

  return (
    <Button
      variant={isFavorite ? 'destructive' : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn('gap-2', className)}
    >
      <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
      {isFavorite ? 'Favorited' : 'Favorite'}
    </Button>
  );
};
