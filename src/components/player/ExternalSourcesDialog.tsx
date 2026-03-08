import { useState } from 'react';
import { Globe, Loader2, ExternalLink, Film, Languages, HardDrive, Sparkles, Database, Link2, Play } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScrapedSources, ScrapedResult } from '@/hooks/useScrapedSources';
import { cn } from '@/lib/utils';

interface ExternalSourcesDialogProps {
  title: string;
  mediaType: 'movie' | 'tv';
  year?: string;
  tmdbId?: number;
  season?: number;
  episode?: number;
  onPlayInApp?: (embedUrl: string, sourceName: string) => void;
}

const QualityBadge = ({ quality }: { quality: string }) => {
  const getColor = () => {
    switch (quality.toLowerCase()) {
      case '4k':
      case '2160p':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case '1080p':
      case 'bluray':
      case 'hd':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case '720p':
      case 'hdrip':
      case 'web':
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

const getSourceIcon = (sourceName: string) => {
  const name = sourceName.toLowerCase();
  if (name.includes('tamil')) return '🎬';
  if (name.includes('sky') || name.includes('hd')) return '🌟';
  if (name.includes('bolly')) return '🎭';
  if (name.includes('fz')) return '📥';
  if (name.includes('wood')) return '🌲';
  return '🔗';
};

const SourceCard = ({ 
  result, 
  onOpen,
  onPlayInApp,
  canPlayInApp,
}: { 
  result: ScrapedResult; 
  onOpen: () => void;
  onPlayInApp?: () => void;
  canPlayInApp: boolean;
}) => {
  return (
    <div 
      className="w-full p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getSourceIcon(result.sourceName)}</span>
            <span className="font-medium text-sm text-primary">
              {result.sourceName}
            </span>
            {result.isTmdbSource && (
              <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Database className="h-2.5 w-2.5 mr-1" />
                ID Match
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground truncate mb-2">
            {result.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
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
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {canPlayInApp && onPlayInApp && (
              <Button 
                size="sm" 
                onClick={onPlayInApp}
                className="h-7 px-3 gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Play className="h-3 w-3" />
                Play in WellPlayer
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpen}
              className="h-7 px-3 gap-1.5"
            >
              <ExternalLink className="h-3 w-3" />
              Open in Tab
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExternalSourcesDialog = ({ 
  title, 
  mediaType, 
  year, 
  tmdbId,
  season,
  episode,
  onPlayInApp,
}: ExternalSourcesDialogProps) => {
  const [open, setOpen] = useState(false);
  const searchQuery = year ? `${title} ${year}` : title;
  
  const { data: sources, isLoading, error, refetch } = useScrapedSources(
    searchQuery,
    mediaType,
    open, // Only fetch when dialog is open
    tmdbId,
    season,
    episode
  );

  const tmdbSources = sources?.filter(s => s.isTmdbSource) || [];
  const scrapedSources = sources?.filter(s => !s.isTmdbSource) || [];

  const handleOpen = (result: ScrapedResult) => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  const handlePlayInApp = (result: ScrapedResult) => {
    if (onPlayInApp && result.canEmbed && result.embedUrl) {
      onPlayInApp(result.embedUrl, result.sourceName);
      setOpen(false); // Close dialog after selecting
    }
  };

  // Sources that can be embedded in-app
  const canEmbedSource = (result: ScrapedResult) => {
    return result.canEmbed && !!result.embedUrl && !!onPlayInApp;
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
            {mediaType === 'tv' && season && episode && (
              <Badge variant="outline">S{season} E{episode}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Searching external sources...</p>
            <p className="text-xs mt-1">Checking streaming & regional sources</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-destructive mb-3">Failed to search sources</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : sources && sources.length > 0 ? (
          <Tabs defaultValue="tmdb" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tmdb" className="gap-2">
                <Database className="h-3.5 w-3.5" />
                Streaming ({tmdbSources.length})
              </TabsTrigger>
              <TabsTrigger value="scraped" className="gap-2">
                <Link2 className="h-3.5 w-3.5" />
                Regional ({scrapedSources.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tmdb">
              <ScrollArea className="max-h-[40vh] pr-4">
                {tmdbSources.length > 0 ? (
                  <div className="space-y-3 py-2">
                    {tmdbSources.map((result, index) => (
                      <SourceCard 
                        key={`${result.source}-${index}`} 
                        result={result} 
                        onOpen={() => handleOpen(result)}
                        onPlayInApp={() => handlePlayInApp(result)}
                        canPlayInApp={canEmbedSource(result)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Database className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm">No streaming sources found</p>
                    <p className="text-xs mt-1">Check regional sources tab</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="scraped">
              <ScrollArea className="max-h-[40vh] pr-4">
                {scrapedSources.length > 0 ? (
                  <div className="space-y-3 py-2">
                    {scrapedSources.map((result, index) => (
                      <SourceCard 
                        key={`${result.source}-${index}`} 
                        result={result}
                        onOpen={() => handleOpen(result)}
                        onPlayInApp={undefined}
                        canPlayInApp={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Link2 className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm">No regional sources found</p>
                    <p className="text-xs mt-1">Check TMDB sources tab</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No external sources found</p>
            <p className="text-xs mt-1">Try the built-in servers above</p>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground mt-2">
          <p className="font-medium mb-1">💡 About External Sources</p>
          <p>
            Click any source to open it. TMDB sources use reliable ID-based lookups, 
            while Regional sources are search-based and may vary in accuracy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
