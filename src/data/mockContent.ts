import { ContentItem } from '@/types/content';

// Mock data for development - will be replaced with TMDB API
export const MOCK_MOVIES: ContentItem[] = [
  {
    id: 1,
    title: "Night of the Living Dead",
    overview: "A group of characters barricade themselves in an old farmhouse to remain safe from a horde of flesh-eating ghouls.",
    posterPath: "https://image.tmdb.org/t/p/w500/hLFEdJ9VD28R8rnRGIZ6ePBNSrG.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/k0HQZBNOfbZVOJNy4cL2yLv7EhN.jpg",
    releaseDate: "1968-10-01",
    rating: 7.5,
    voteCount: 2340,
    genreIds: [27, 53],
    mediaType: 'movie'
  },
  {
    id: 2,
    title: "Nosferatu",
    overview: "Vampire Count Orlok expresses interest in a new residence and real estate agent Hutter's wife.",
    posterPath: "https://image.tmdb.org/t/p/w500/bHcG3DXWwzTxOmTswKceyNvYCBr.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/4uJ8FkGLNe3v2tnFaV89bMW0VZO.jpg",
    releaseDate: "1922-02-16",
    rating: 7.9,
    voteCount: 3210,
    genreIds: [27, 14],
    mediaType: 'movie'
  },
  {
    id: 3,
    title: "The Cabinet of Dr. Caligari",
    overview: "Hypnotist Dr. Caligari uses a somnambulist to commit murders.",
    posterPath: "https://image.tmdb.org/t/p/w500/eLMmQ3XKQE1OKIBD9hNwOOSx7NU.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/ljqT9lJNxE3oH3OM0o0qGbNyuIx.jpg",
    releaseDate: "1920-02-26",
    rating: 8.0,
    voteCount: 1870,
    genreIds: [27, 18, 53],
    mediaType: 'movie'
  },
  {
    id: 4,
    title: "His Girl Friday",
    overview: "A newspaper editor uses every trick in the book to keep his ex-wife from remarrying.",
    posterPath: "https://image.tmdb.org/t/p/w500/lANJuA9Hp6ERfEZrxMOmfZqPYNt.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/kNNBNVzB1k0DSMN8yvOWWXjNsqC.jpg",
    releaseDate: "1940-01-11",
    rating: 7.9,
    voteCount: 890,
    genreIds: [35, 10749],
    mediaType: 'movie'
  },
  {
    id: 5,
    title: "A Trip to the Moon",
    overview: "A group of astronomers go on an expedition to the Moon.",
    posterPath: "https://image.tmdb.org/t/p/w500/ueN6dWSxBsNl1xdMqzGMturpRZq.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/vN8fT8DyHKPXqEhLpYP7JfPMaAG.jpg",
    releaseDate: "1902-09-01",
    rating: 8.0,
    voteCount: 4320,
    genreIds: [878, 12],
    mediaType: 'movie'
  },
  {
    id: 6,
    title: "Metropolis",
    overview: "In a futuristic city sharply divided between the working class and the city planners, the son of the city's mastermind falls in love with a working class prophet.",
    posterPath: "https://image.tmdb.org/t/p/w500/hUK9rewffKGqtXynH5SW3v9hzcu.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/vwjKUgq49weGcMnQdR7o7mXZGdU.jpg",
    releaseDate: "1927-01-10",
    rating: 8.3,
    voteCount: 3450,
    genreIds: [878, 18],
    mediaType: 'movie'
  },
  {
    id: 7,
    title: "The General",
    overview: "When Union spies steal an engineer's beloved locomotive, he pursues it single-handedly.",
    posterPath: "https://image.tmdb.org/t/p/w500/lBGRrk7E5GlB8RjbcF8h7VaK8F1.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/vqT3dQOqk9f5aMf4Wk6f8kFwUvA.jpg",
    releaseDate: "1926-12-31",
    rating: 8.2,
    voteCount: 2100,
    genreIds: [35, 28, 10752],
    mediaType: 'movie'
  },
  {
    id: 8,
    title: "Sherlock Jr.",
    overview: "A film projectionist longs to be a detective, and puts his meagre skills to work when he is framed by a rival for stealing his girlfriend's father's pocketwatch.",
    posterPath: "https://image.tmdb.org/t/p/w500/pFwxlGV3hE1OTfvxmMQ9hZEMdgd.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/uJF7JnmAIjBdCCaAEQxXX3toFv4.jpg",
    releaseDate: "1924-04-21",
    rating: 8.2,
    voteCount: 1560,
    genreIds: [35, 10749],
    mediaType: 'movie'
  }
];

export const GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

export const getFeaturedContent = (): ContentItem => {
  return MOCK_MOVIES[5]; // Metropolis as featured
};

export const getTrendingContent = (): ContentItem[] => {
  return MOCK_MOVIES.slice(0, 6);
};

export const getClassicHorror = (): ContentItem[] => {
  return MOCK_MOVIES.filter(m => m.genreIds.includes(27));
};

export const getClassicComedy = (): ContentItem[] => {
  return MOCK_MOVIES.filter(m => m.genreIds.includes(35));
};

export const getSciFiFantasy = (): ContentItem[] => {
  return MOCK_MOVIES.filter(m => m.genreIds.includes(878) || m.genreIds.includes(14));
};
