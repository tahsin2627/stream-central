import { useState } from 'react';
import { Globe, Loader2, ExternalLink, Film, Languages, HardDrive, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScrapedSources, ScrapedResult } from '@/hooks/useScrapedSources';
import { cn } from '@/lib/utils';

interface ExternalSourcesDialogProps {
  title: string;
  mediaType: 'movie' | 'tv';
  year?: string;
}

const QualityBadge = ({ quality }: { quality: string }) => {
  const getColor = () => {
    switch (quality.toLowerCase()) {
      case '4k':
      case '2160p':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case '1080p':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case '720p':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cam':
      case 'hdcam':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <Badge variant="outline" className={cn('text-xs', getColor())}>
      {quality}
    </Badge>
  );
};

const SourceCard = ({ result, onSelect }: { result: ScrapedResult; onSelect: () => void }) => {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-primary">
              {result.sourceName}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm text-foreground truncate mb-2">
            {result.title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {result.quality && <QualityBadge quality={result.quality} />}
            {result.language && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Languages className="h-3 w-3" />
                {result.language}
              </Badge>
            )}
            {result.size && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {result.size}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export const ExternalSourcesDialog = ({ title, mediaType, year }: ExternalSourcesDialogProps) => {
  const [open, setOpen] = useState(false);
  const searchQuery = year ? `${title} ${year}` : title;
  
  const { data: sources, isLoading, error, refetch } = useScrapedSources(
    searchQuery,
    mediaType,
    open // Only fetch when dialog is open
  );

  const handleSelectSource = (result: ScrapedResult) => {
    // Open the source URL in a new tab
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 text-white"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Find Sources</span>
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            External Sources
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            <span className="truncate">{title}</span>
            {year && <Badge variant="outline">{year}</Badge>}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Searching external sources...</p>
              <p className="text-xs mt-1">This may take a moment</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive mb-3">Failed to search sources</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : sources && sources.length > 0 ? (
            <div className="space-y-3">
              {sources.map((result, index) => (
                <SourceCard 
                  key={`${result.source}-${index}`} 
                  result={result} 
                  onSelect={() => handleSelectSource(result)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Globe className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No external sources found</p>
              <p className="text-xs mt-1">Try the built-in servers above</p>
            </div>
          )}
        </ScrollArea>

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground mt-2">
          <p className="font-medium mb-1">⚠️ Disclaimer</p>
          <p>
            External sources are scraped from the web and may contain ads or unreliable links. 
            Use at your own discretion.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
