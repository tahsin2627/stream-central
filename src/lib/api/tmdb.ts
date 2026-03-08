import { supabase } from '@/integrations/supabase/client';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  status?: string;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
}

export interface TMDBResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

async function tmdbRequest<T>(endpoint: string, params?: Record<string, unknown>): Promise<TMDBResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke('tmdb', {
      body: { endpoint, params },
    });

    if (error) {
      console.error('TMDB request error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('TMDB request failed:', err);
    return { success: false, error: 'Failed to fetch from TMDB' };
  }
}

export const tmdbApi = {
  // Image URLs
  getPosterUrl: (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
  },

  getBackdropUrl: (path: string | null, size: 'w780' | 'w1280' | 'original' = 'original') => {
    return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
  },

  // Trending
  getTrending: (mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>>(`/trending/${mediaType}/${timeWindow}`);
  },

  // Movies
  getPopularMovies: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', { page });
  },

  getTopRatedMovies: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', { page });
  },

  getNowPlayingMovies: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', { page });
  },

  getUpcomingMovies: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', { page });
  },

  getMovieDetails: (id: number) => {
    return tmdbRequest<TMDBMovie>(`/movie/${id}`);
  },

  getMoviesByGenre: (genreId: number, page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_genres: genreId, 
      page,
      sort_by: 'popularity.desc'
    });
  },

  // TV Shows
  getPopularTVShows: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/tv/popular', { page });
  },

  getTopRatedTVShows: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/tv/top_rated', { page });
  },

  getTVShowDetails: (id: number) => {
    return tmdbRequest<TMDBTVShow>(`/tv/${id}`);
  },

  // Get season details with episodes
  getSeasonDetails: (tvId: number, seasonNumber: number) => {
    return tmdbRequest<{
      id: number;
      name: string;
      overview: string;
      episodes: Array<{
        id: number;
        name: string;
        overview: string;
        episode_number: number;
        still_path: string | null;
        air_date: string;
        runtime: number | null;
      }>;
    }>(`/tv/${tvId}/season/${seasonNumber}`);
  },

  getTVShowsByGenre: (genreId: number, page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', { 
      with_genres: genreId, 
      page,
      sort_by: 'popularity.desc'
    });
  },

  // Indian/Bollywood Movies - strictly recent (last 18 months)
  getBollywoodMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'hi',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': eighteenMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 5,
    });
  },

  // Tamil Movies - recent releases
  getTamilMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'ta',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': eighteenMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 3,
    });
  },

  // Telugu Movies - recent releases
  getTeluguMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'te',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': eighteenMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 3,
    });
  },

  // Hollywood - recent English movies
  getHollywoodMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'en',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': sixMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 20,
    });
  },

  // Korean Dramas - recent
  getKoreanDramas: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', { 
      with_original_language: 'ko',
      page,
      sort_by: 'first_air_date.desc',
      'first_air_date.gte': oneYearAgo,
      'first_air_date.lte': today,
      'vote_count.gte': 3,
    });
  },

  // Bengali/Bangla Movies - recent (lower threshold for regional)
  getBengaliMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const twoYearsAgo = new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'bn',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': twoYearsAgo,
      'primary_release_date.lte': today,
    });
  },

  // Bengali/Bangla TV Shows & Web Series - recent
  getBengaliTVShows: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const twoYearsAgo = new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', { 
      with_original_language: 'bn',
      page,
      sort_by: 'first_air_date.desc',
      'first_air_date.gte': twoYearsAgo,
      'first_air_date.lte': today,
    });
  },

  // Bengali/Bangla Web Series (Hoichoi, Chorki, iScreen, BongoBD style)
  // Uses popularity sort to surface OTT-style web series content
  getBengaliWebSeries: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const fiveYearsAgo = new Date(Date.now() - 60 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', { 
      with_original_language: 'bn',
      page,
      sort_by: 'popularity.desc',
      'first_air_date.gte': fiveYearsAgo,
      'first_air_date.lte': today,
    });
  },

  // Kolkata/Bengali Popular (all time popular Bengali content)
  getBengaliPopular: (page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'bn',
      page,
      sort_by: 'popularity.desc',
      'vote_count.gte': 3,
    });
  },

  // Hindi Web Series (latest OTT content)
  getHindiWebSeries: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const twoYearsAgo = new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', { 
      with_original_language: 'hi',
      page,
      sort_by: 'first_air_date.desc',
      'first_air_date.gte': twoYearsAgo,
      'first_air_date.lte': today,
      'vote_count.gte': 3,
    });
  },

  // Malayalam Movies - recent
  getMalayalamMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'ml',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': eighteenMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 3,
    });
  },

  // Kannada Movies - recent
  getKannadaMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const eighteenMonthsAgo = new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      with_original_language: 'kn',
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': eighteenMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 3,
    });
  },

  // Latest Movies - strictly recent (last 3 months)
  getLatestMovies: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', { 
      page,
      sort_by: 'primary_release_date.desc',
      'primary_release_date.gte': threeMonthsAgo,
      'primary_release_date.lte': today,
      'vote_count.gte': 10,
    });
  },

  // Latest TV Shows - strictly recent (last 3 months)
  getLatestTVShows: (page = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/discover/tv', { 
      page,
      sort_by: 'first_air_date.desc',
      'first_air_date.gte': threeMonthsAgo,
      'first_air_date.lte': today,
      'vote_count.gte': 5,
    });
  },

  // Search
  searchMulti: (query: string, page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie | TMDBTVShow>>('/search/multi', { query, page });
  },

  searchMovies: (query: string, page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', { query, page });
  },

  searchTVShows: (query: string, page = 1) => {
    return tmdbRequest<TMDBPaginatedResponse<TMDBTVShow>>('/search/tv', { query, page });
  },

  // Genres
  getMovieGenres: () => {
    return tmdbRequest<{ genres: { id: number; name: string }[] }>('/genre/movie/list');
  },

  getTVGenres: () => {
    return tmdbRequest<{ genres: { id: number; name: string }[] }>('/genre/tv/list');
  },
};
