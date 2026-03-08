import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LetterboxdLinkProps {
  title: string;
  year?: string | number;
  size?: 'default' | 'sm' | 'icon';
}

// Construct a Letterboxd search URL from title
const getLetterboxdUrl = (title: string) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '+');
  return `https://letterboxd.com/search/${slug}/`;
};

export const LetterboxdLink = ({ title, size = 'sm' }: LetterboxdLinkProps) => {
  return (
    <Button
      variant="outline"
      size={size}
      className="gap-2 border-[#00e054]/30 text-[#00e054] hover:bg-[#00e054]/10 hover:text-[#00e054] hover:border-[#00e054]/50"
      asChild
    >
      <a href={getLetterboxdUrl(title)} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 500 500" className="h-4 w-4" fill="currentColor">
          <circle cx="250" cy="250" r="240" fill="none" stroke="currentColor" strokeWidth="20"/>
          <circle cx="170" cy="250" r="80" fill="#ff8000" opacity="0.8"/>
          <circle cx="250" cy="250" r="80" fill="#00e054" opacity="0.8"/>
          <circle cx="330" cy="250" r="80" fill="#40bcf4" opacity="0.8"/>
        </svg>
        <span className="hidden sm:inline">Letterboxd</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    </Button>
  );
};
