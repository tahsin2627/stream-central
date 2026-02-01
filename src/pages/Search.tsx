import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { MovieCard } from '@/components/content/MovieCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchMulti } from '@/hooks/useTMDB';
import { supabase } from '@/integrations/supabase/client';
import { TMDBMovie, TMDBTVShow } from '@/lib/api/tmdb';
import { useDebounce } from '@/hooks/useDebounce';

interface AISuggestion {
  query: string;
  type: 'movie' | 'tv';
  reason: string;
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useSearchMulti(debouncedQuery);

  // Get AI suggestions for complex queries
  const getAiSuggestions = useCallback(async (q: string) => {
    if (q.length < 5) return;
    
    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query: q },
      });

      if (!error && data?.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error('AI search error:', e);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
      // Only get AI suggestions for longer, more complex queries
      if (debouncedQuery.length >= 8 && debouncedQuery.includes(' ')) {
        getAiSuggestions(debouncedQuery);
      } else {
        setAiSuggestions([]);
      }
    } else {
      setSearchParams({});
      setAiSuggestions([]);
    }
  }, [debouncedQuery, setSearchParams, getAiSuggestions]);

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    setQuery(suggestion.query);
  };

  const clearSearch = () => {
    setQuery('');
    setAiSuggestions([]);
  };

  return (
    <Layout>
      <div className="pt-24 pb-16 container mx-auto px-4">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Search</h1>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search movies, shows, actors, or describe what you want..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg bg-secondary border-none rounded-full"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* AI Suggestions */}
          <AnimatePresence>
            {(isAiLoading || aiSuggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>AI Suggestions</span>
                  {isAiLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-sm transition-colors text-left"
                    >
                      <span className="font-medium">{suggestion.query}</span>
                      <span className="text-muted-foreground ml-2">({suggestion.type})</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : searchResults?.results && searchResults.results.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-6">
              Found {searchResults.total_results.toLocaleString()} results
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.results
                .filter((item): item is TMDBMovie | TMDBTVShow => 
                  ('title' in item || 'name' in item) && item.poster_path !== null
                )
                .map((item, index) => (
                  <MovieCard key={item.id} item={item} index={index} />
                ))}
            </div>
          </div>
        ) : debouncedQuery ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No results found for "{debouncedQuery}"</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search or describe what you're looking for
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Start typing to search</p>
            <p className="text-sm text-muted-foreground mt-2">
              You can search for titles, actors, or describe what you want to watch
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
