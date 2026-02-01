import { useState, useRef, useCallback } from 'react';
import { Share2, Download, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShareStoryCard } from './ShareStoryCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ShareStoryDialogProps {
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  year: string | number;
  mediaType: 'movie' | 'tv';
  genres?: { id: number; name: string }[];
  trigger?: React.ReactNode;
  tmdbId?: number;
}

export const ShareStoryDialog = ({
  title,
  posterUrl,
  backdropUrl,
  rating,
  year,
  mediaType,
  genres,
  trigger,
  tmdbId,
}: ShareStoryDialogProps) => {
  // Build shareable URL for the content
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    if (tmdbId) {
      return `${baseUrl}/${mediaType}/${tmdbId}`;
    }
    return baseUrl;
  };
  const [opinion, setOpinion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1,
      });
      return dataUrl;
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate story image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `wellplayer-${title.replace(/\s+/g, '-').toLowerCase()}-story.png`;
    link.href = dataUrl;
    link.click();
    
    toast.success('Story downloaded! Share it on your socials 🎬');
  };

  const handleCopyToClipboard = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy. Try downloading instead.');
    }
  };

  const handleNativeShare = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const shareUrl = getShareUrl();
    const shareText = opinion 
      ? `${opinion}\n\nWatch "${title}" on Wellplayer 🎬\n${shareUrl}`
      : `Check out "${title}" on Wellplayer! 🎬\n${shareUrl}`;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'wellplayer-story.png', { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${title} on Wellplayer`,
          text: shareText,
          url: shareUrl,
          files: [file],
        });
      } else {
        // Fallback to download with URL copy
        handleDownload();
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Image downloaded & link copied!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        handleDownload();
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="lg" className="gap-2">
            <Share2 className="h-5 w-5" />
            Share Story
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-card border-border p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 md:p-6 pb-0">
          <DialogTitle className="text-lg md:text-xl font-semibold">Create Shareable Story</DialogTitle>
        </DialogHeader>

        <div className="p-4 md:p-6 flex flex-col md:grid md:grid-cols-[360px_1fr] gap-4 md:gap-6">
          {/* Preview - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex justify-center">
            <div className="transform scale-[0.85] origin-top">
              <ShareStoryCard
                ref={cardRef}
                title={title}
                posterUrl={posterUrl}
                backdropUrl={backdropUrl}
                rating={rating}
                year={year}
                mediaType={mediaType}
                opinion={opinion}
                genres={genres}
              />
            </div>
          </div>

          {/* Mobile Preview - Smaller */}
          <div className="flex md:hidden justify-center">
            <div className="transform scale-[0.5] origin-top -mb-40">
              <ShareStoryCard
                ref={cardRef}
                title={title}
                posterUrl={posterUrl}
                backdropUrl={backdropUrl}
                rating={rating}
                year={year}
                mediaType={mediaType}
                opinion={opinion}
                genres={genres}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Thoughts
                </label>
                <Textarea
                  placeholder="Add your opinion..."
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  maxLength={150}
                  className="resize-none h-20 md:h-32 bg-secondary border-border text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {opinion.length}/150
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border hidden md:block">
                <h4 className="font-medium text-sm mb-1">📱 Share to</h4>
                <p className="text-xs text-muted-foreground">
                  Instagram Story, Facebook Story, WhatsApp Status, Twitter/X, or save for later!
                </p>
              </div>
            </div>

            {/* Action Buttons - Always visible */}
            <div className="flex flex-col gap-2 md:gap-3">
              <Button
                size="default"
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="gap-2 w-full"
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                Share Story
              </Button>

              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <Button
                  variant="secondary"
                  size="default"
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  size="default"
                  onClick={handleCopyToClipboard}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="h-4 w-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
