import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tmdbApi, TMDBMovie, TMDBTVShow, TMDBPaginatedResponse } from '@/lib/api/tmdb';
import { useEffect } from 'react';

// Shared query options for better caching
const STALE_TIME_SHORT = 1000 * 60 * 5; // 5 minutes
const STALE_TIME_LONG = 1000 * 60 * 30; // 30 minutes
const GC_TIME = 1000 * 60 * 60; // 1 hour garbage collection

export const useTrending = (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') => {
  return useQuery({
    queryKey: ['trending', mediaType, timeWindow],
    queryFn: async () => {
      const response = await tmdbApi.getTrending(mediaType, timeWindow);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>;
    },
    staleTime: STALE_TIME_SHORT,
    gcTime: GC_TIME,
  });
};

export const usePopularMovies = (page = 1) => {
  return useQuery({
    queryKey: ['movies', 'popular', page],
    queryFn: async () => {
      const response = await tmdbApi.getPopularMovies(page);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBMovie>;
    },
    staleTime: STALE_TIME_SHORT,
    gcTime: GC_TIME,
  });
};

export const useTopRatedMovies = (page = 1) => {
  return useQuery({
    queryKey: ['movies', 'top_rated', page],
    queryFn: async () => {
      const response = await tmdbApi.getTopRatedMovies(page);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBMovie>;
    },
    staleTime: STALE_TIME_LONG,
    gcTime: GC_TIME,
  });
};

export const useMovieDetails = (id: number) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const response = await tmdbApi.getMovieDetails(id);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBMovie;
    },
    enabled: !!id,
    staleTime: STALE_TIME_LONG,
    gcTime: GC_TIME,
    // Use cached data from list queries if available
    initialData: () => {
      const queries = queryClient.getQueriesData<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>>({ queryKey: ['movies'] });
      for (const [, data] of queries) {
        const movie = data?.results?.find((m) => m.id === id && 'title' in m);
        if (movie) return movie as TMDBMovie;
      }
      return undefined;
    },
  });
};

export const usePopularTVShows = (page = 1) => {
  return useQuery({
    queryKey: ['tv', 'popular', page],
    queryFn: async () => {
      const response = await tmdbApi.getPopularTVShows(page);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBTVShow>;
    },
    staleTime: STALE_TIME_SHORT,
    gcTime: GC_TIME,
  });
};

// Indian/Bollywood Movies
export const useBollywoodMovies = (page = 1) => {
  return useQuery({
    queryKey: ['movies', 'bollywood', page],
    queryFn: async () => {
      const response = await tmdbApi.getBollywoodMovies(page);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBMovie>;
    },
    staleTime: STALE_TIME_SHORT,
    gcTime: GC_TIME,
  });
};

// Korean Dramas
export const useKoreanDramas = (page = 1) => {
  return useQuery({
    queryKey: ['tv', 'korean', page],
    queryFn: async () => {
      const response = await tmdbApi.getKoreanDramas(page);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBTVShow>;
    },
    staleTime: STALE_TIME_SHORT,
    gcTime: GC_TIME,
  });
};

export const useTVShowDetails = (id: number) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['tv', id],
    queryFn: async () => {
      const response = await tmdbApi.getTVShowDetails(id);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBTVShow;
    },
    enabled: !!id,
    staleTime: STALE_TIME_LONG,
    gcTime: GC_TIME,
    // Use cached data from list queries if available
    initialData: () => {
      const queries = queryClient.getQueriesData<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>>({ queryKey: ['tv'] });
      for (const [, data] of queries) {
        const show = data?.results?.find((m) => m.id === id && 'name' in m);
        if (show) return show as TMDBTVShow;
      }
      return undefined;
    },
  });
};

// Season episodes
export const useSeasonDetails = (tvId: number, seasonNumber: number) => {
  return useQuery({
    queryKey: ['tv', tvId, 'season', seasonNumber],
    queryFn: async () => {
      const response = await tmdbApi.getSeasonDetails(tvId, seasonNumber);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!tvId && !!seasonNumber,
    staleTime: STALE_TIME_LONG,
    gcTime: GC_TIME,
  });
};

export const useSearchMulti = (query: string, page = 1) => {
  return useQuery({
    queryKey: ['search', query, page],
    queryFn: async () => {
      const response = await tmdbApi.searchMulti(query, page);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>;
    },
    enabled: query.length >= 2,
    staleTime: STALE_TIME_SHORT,
    gcTime: GC_TIME,
  });
};

export const useMovieGenres = () => {
  return useQuery({
    queryKey: ['genres', 'movie'],
    queryFn: async () => {
      const response = await tmdbApi.getMovieGenres();
      if (!response.success) throw new Error(response.error);
      return response.data?.genres ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - genres rarely change
    gcTime: 1000 * 60 * 60 * 24,
  });
};

export const useTVGenres = () => {
  return useQuery({
    queryKey: ['genres', 'tv'],
    queryFn: async () => {
      const response = await tmdbApi.getTVGenres();
      if (!response.success) throw new Error(response.error);
      return response.data?.genres ?? [];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
  });
};

// Prefetch hook for better UX
export const usePrefetchContent = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Prefetch popular content on app load
    queryClient.prefetchQuery({
      queryKey: ['trending', 'all', 'week'],
      queryFn: async () => {
        const response = await tmdbApi.getTrending('all', 'week');
        if (!response.success) throw new Error(response.error);
        return response.data;
      },
      staleTime: STALE_TIME_SHORT,
    });
    
    queryClient.prefetchQuery({
      queryKey: ['genres', 'movie'],
      queryFn: async () => {
        const response = await tmdbApi.getMovieGenres();
        if (!response.success) throw new Error(response.error);
        return response.data?.genres ?? [];
      },
      staleTime: 1000 * 60 * 60 * 24,
    });
  }, [queryClient]);
};
