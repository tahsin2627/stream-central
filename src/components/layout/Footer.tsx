import { Link } from 'react-router-dom';
import { Film, Tv, Heart, Search } from 'lucide-react';
import wellplayerLogo from '@/assets/wellplayer-logo.png';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={wellplayerLogo} alt="Wellplayer" className="h-8 w-8 rounded-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Wellplayer
              </span>
            </Link>
            <p className="text-muted-foreground mt-2 text-sm italic">
              it's Really A Wellplayer
            </p>
          </div>

          {/* Browse */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Browse</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/movies" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
                  <Film className="h-4 w-4" />
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/tv-shows" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
                  <Tv className="h-4 w-4" />
                  TV Shows
                </Link>
              </li>
              <li>
                <Link to="/genres" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  Genres
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/my-list" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4" />
                  My List
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>🎬 Multiple streaming sources</li>
              <li>🔍 AI-powered search</li>
              <li>📱 Watch anywhere</li>
              <li>💾 Save to watchlist</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} Wellplayer. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Content sourced from multiple providers. We do not host any files.
          </p>
        </div>
      </div>
    </footer>
  );
};
