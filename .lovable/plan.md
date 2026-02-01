
# StreamVault - Free Streaming Web App

A minimalist, elegant streaming platform for royalty-free and public domain movies and TV shows.

## Phase 1: Foundation & Core UI

### Landing Page
- Clean, dark-themed hero section with featured content
- Horizontal scrolling carousels for different categories
- Prominent search bar in the navigation
- Responsive design optimized for mobile, tablet, and desktop

### Navigation
- Minimalist top navigation bar
- Categories: Movies, TV Shows, Genres, My List
- User profile menu with login/logout

## Phase 2: Content Discovery

### Browse & Search
- Grid layout for movie/TV show cards with hover effects
- Advanced search with filters (genre, year, rating)
- Category pages with sorting options
- Individual movie/show detail pages with:
  - Large backdrop image
  - Title, year, rating, description
  - Genre tags
  - Play button
  - Add to watchlist button

### Content Integration
- TMDB API integration for metadata (posters, descriptions, ratings)
- Curated list of public domain content from Archive.org
- Match TMDB metadata with available public domain streams

## Phase 3: Video Player

### Playback Experience
- Clean, full-screen video player
- Standard controls (play/pause, seek, volume, fullscreen)
- Progress tracking (resume where you left off)
- Quality selection when multiple sources available
- Minimalist overlay that fades when not interacting

## Phase 4: User Features

### Authentication
- Email/password signup and login via Supabase Auth
- Google OAuth option
- Password reset functionality

### Watchlist & Favorites
- Save movies/shows to personal watchlist
- Mark content as favorites
- Continue watching section on homepage
- Watch history tracking

### User Profile
- Profile settings page
- Avatar upload
- Viewing history
- Manage watchlist

## Phase 5: Database & Backend

### Supabase Integration
- User profiles table
- Watchlist/favorites storage
- Watch history with timestamps
- Content catalog caching

### Edge Functions
- TMDB API proxy (to protect API key)
- Content availability checker
- User activity tracking

## Design Aesthetic

### Visual Style (Apple TV+ Inspired)
- Dark background with subtle gradients
- Large, high-quality imagery
- Generous whitespace
- Smooth animations and transitions
- Minimal UI chrome that lets content shine

### Typography
- Clean sans-serif fonts
- Clear hierarchy with size and weight
- Excellent readability on all devices

## Technical Architecture

- React with TypeScript for the frontend
- Tailwind CSS for styling
- External Supabase for database, auth, and edge functions
- TMDB API for movie metadata
- HTML5 video player for playback
- Responsive design for all devices
