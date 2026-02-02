import { useState } from 'react';
import { Settings, Globe, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useServerPreference, LanguagePreference } from '@/hooks/useServerPreference';

const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string; description: string; icon: string }[] = [
  { value: 'default', label: 'Default', description: 'English / Original audio', icon: '🌐' },
  { value: 'hindi', label: 'Hindi', description: 'Hindi dubbed content', icon: '🇮🇳' },
  { value: 'asian', label: 'Asian', description: 'K-Drama, Anime, Asian content', icon: '🇯🇵' },
  { value: 'dubbed', label: 'Multi-Dub', description: 'Various dubbed versions', icon: '🌏' },
];

export const ServerSettingsDialog = () => {
  const { languagePreference, setLanguagePreference, autoFallback, setAutoFallback } = useServerPreference();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Player Settings
          </DialogTitle>
          <DialogDescription>
            Configure your preferred language and playback settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Preference */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4" />
              Language Preference
            </Label>
            <RadioGroup
              value={languagePreference}
              onValueChange={(value) => setLanguagePreference(value as LanguagePreference)}
              className="grid grid-cols-2 gap-2"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={`
                    flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${languagePreference === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-border/80 hover:bg-muted/50'
                    }
                  `}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">{option.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{option.description}</p>
                  </div>
                  {languagePreference === option.value && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Auto Fallback */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <Label htmlFor="auto-fallback" className="text-sm font-medium cursor-pointer">
                  Auto-Switch on Failure
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically try next server if current one fails (10s timeout)
                </p>
              </div>
            </div>
            <Switch
              id="auto-fallback"
              checked={autoFallback}
              onCheckedChange={setAutoFallback}
            />
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">💡 Tip</p>
            <p>
              Your preferences are saved automatically. The player will remember your 
              settings and preferred server for next time.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
