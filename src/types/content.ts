export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  original_language: string;
  popularity: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  original_language: string;
  popularity: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ContentItem {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  rating: number;
  voteCount: number;
  genreIds: number[];
  mediaType: 'movie' | 'tv';
}

export interface Category {
  id: string;
  title: string;
  items: ContentItem[];
}
