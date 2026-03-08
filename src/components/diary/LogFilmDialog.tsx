import { useState } from 'react';
import { Heart, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useFilmDiary } from '@/hooks/useFilmDiary';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogFilmDialogProps {
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath?: string | null;
  trigger?: React.ReactNode;
}

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="transition-transform hover:scale-110"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star === value ? 0 : star)}
        >
          <svg width={28} height={28} viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={(hover || value) >= star ? '#00e054' : 'none'}
              stroke={(hover || value) >= star ? '#00e054' : 'hsl(var(--muted-foreground) / 0.3)'}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-muted-foreground ml-2 font-medium">{value}.0</span>
      )}
    </div>
  );
};

export const LogFilmDialog = ({ tmdbId, mediaType, title, posterPath, trigger }: LogFilmDialogProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [liked, setLiked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addEntry } = useFilmDiary();

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      await addEntry.mutateAsync({
        tmdb_id: tmdbId,
        media_type: mediaType,
        title,
        poster_path: posterPath,
        rating: rating > 0 ? rating : null,
        review: review.trim() || null,
        watched_date: watchedDate,
        liked,
      });
      setOpen(false);
      setRating(0);
      setReview('');
      setLiked(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="default" className="gap-2">
            <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Log</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Log "{title}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Watched on</label>
            <Input
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Like */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className="transition-transform hover:scale-110"
            >
              <Heart
                className={cn('h-7 w-7 transition-colors', liked ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground')}
              />
            </button>
            <span className="text-sm text-muted-foreground">{liked ? 'Liked' : 'Like this film?'}</span>
          </div>

          {/* Review */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Review (optional)</label>
            <Textarea
              placeholder="Write your thoughts..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : 'Save to Diary'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
