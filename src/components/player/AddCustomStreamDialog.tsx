import { useState } from 'react';
import { Plus, Link, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomStreams } from '@/hooks/useCustomStreams';
import { useAuth } from '@/contexts/AuthContext';

interface AddCustomStreamDialogProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title?: string;
}

export const AddCustomStreamDialog = ({ 
  tmdbId, 
  mediaType, 
  season, 
  episode,
  title 
}: AddCustomStreamDialogProps) => {
  const { user } = useAuth();
  const { addStream, hasCustomStream, getCustomStream, deleteStream, isAdding, isDeleting } = useCustomStreams();
  const [open, setOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamName, setStreamName] = useState('My Server');

  const existingStream = getCustomStream(tmdbId, mediaType, season, episode);
  const hasExisting = !!existingStream;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streamUrl.trim()) return;

    addStream({
      tmdb_id: tmdbId,
      media_type: mediaType,
      season,
      episode,
      stream_url: streamUrl.trim(),
      stream_name: streamName.trim() || 'My Server',
    }, {
      onSuccess: () => {
        setOpen(false);
        setStreamUrl('');
      }
    });
  };

  const handleDelete = () => {
    if (existingStream) {
      deleteStream(existingStream.id, {
        onSuccess: () => setOpen(false)
      });
    }
  };

  // Populate form with existing data when opening
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && existingStream) {
      setStreamUrl(existingStream.stream_url);
      setStreamName(existingStream.stream_name);
    } else if (!isOpen) {
      setStreamUrl('');
      setStreamName('My Server');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={`gap-2 ${hasExisting ? 'bg-primary/20 border-primary/50' : 'bg-black/60 backdrop-blur-sm border border-white/10'} hover:bg-black/80 text-white`}
        >
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">{hasExisting ? 'My Server ✓' : 'Add Stream'}</span>
          <span className="sm:hidden">{hasExisting ? '✓' : <Plus className="h-3 w-3" />}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {hasExisting ? 'Edit Custom Stream' : 'Add Custom Stream'}
          </DialogTitle>
          <DialogDescription>
            {title && <span className="font-medium text-foreground">{title}</span>}
            {mediaType === 'tv' && season && episode && (
              <span className="text-muted-foreground"> • S{season} E{episode}</span>
            )}
            <br />
            Add your own streaming link for this content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="stream-url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Stream URL
            </Label>
            <Input
              id="stream-url"
              type="url"
              placeholder="https://example.com/stream/video.mp4"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Paste the direct video URL or embed link
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stream-name">Server Name (optional)</Label>
            <Input
              id="stream-name"
              type="text"
              placeholder="My Server"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isAdding || !streamUrl.trim()}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                hasExisting ? 'Update Stream' : 'Save Stream'
              )}
            </Button>
            
            {hasExisting && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
              </Button>
            )}
          </div>
        </form>

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Tip</p>
          <p>
            Your custom streams are synced to your account and will appear as "My Server" 
            in the server selector. Great for adding content not available on other servers!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
