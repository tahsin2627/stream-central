import { useQuery } from '@tanstack/react-query';
import { tmdbApi, TMDBMovie, TMDBTVShow, TMDBPaginatedResponse } from '@/lib/api/tmdb';

export const useTrending = (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') => {
  return useQuery({
    queryKey: ['trending', mediaType, timeWindow],
    queryFn: async () => {
      const response = await tmdbApi.getTrending(mediaType, timeWindow);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 5,
  });
};

export const useMovieDetails = (id: number) => {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const response = await tmdbApi.getMovieDetails(id);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBMovie;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 5,
  });
};

export const useTVShowDetails = (id: number) => {
  return useQuery({
    queryKey: ['tv', id],
    queryFn: async () => {
      const response = await tmdbApi.getTVShowDetails(id);
      if (!response.success) throw new Error(response.error);
      return response.data as TMDBTVShow;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
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
    staleTime: 1000 * 60 * 2,
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
    staleTime: 1000 * 60 * 60, // 1 hour
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
    staleTime: 1000 * 60 * 60,
  });
};
