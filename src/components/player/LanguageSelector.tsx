import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useServerPreference, LanguagePreference, getDefaultServerForLanguage } from '@/hooks/useServerPreference';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string; icon: string }[] = [
  { value: 'hindi', label: 'Hindi', icon: '🇮🇳' },
  { value: 'bengali', label: 'Bengali', icon: '🇧🇩' },
  { value: 'asian', label: 'Asian', icon: '🇯🇵' },
  { value: 'dubbed', label: 'Multi-Dub', icon: '🌏' },
  { value: 'default', label: 'English', icon: '🌐' },
];

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector = ({ compact = false, className }: LanguageSelectorProps) => {
  const { languagePreference, setLanguagePreference } = useServerPreference();
  
  const currentLang = LANGUAGE_OPTIONS.find(o => o.value === languagePreference) || LANGUAGE_OPTIONS[0];

  const handleLanguageChange = (lang: LanguagePreference) => {
    setLanguagePreference(lang);
    const newServer = getDefaultServerForLanguage(lang);
    const langOption = LANGUAGE_OPTIONS.find(o => o.value === lang);
    toast.success(`${langOption?.icon} ${langOption?.label} selected`, {
      description: `Server: ${newServer.flag} ${newServer.name}`,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="secondary" 
          size={compact ? "icon" : "sm"} 
          className={cn(
            "gap-1.5 h-8 sm:h-9",
            compact ? "w-8 sm:w-9" : "px-2 sm:px-3",
            className
          )}
        >
          <span className="text-sm sm:text-base">{currentLang.icon}</span>
          {!compact && (
            <span className="text-xs sm:text-sm hidden sm:inline">{currentLang.label}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-popover">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleLanguageChange(option.value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer text-sm",
              languagePreference === option.value && "bg-primary/10 text-primary"
            )}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
