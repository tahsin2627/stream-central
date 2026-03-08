import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePrefetchContent } from "@/hooks/useTMDB";
import { SplashScreen } from "@/components/SplashScreen";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { DonationBanner } from "@/components/DonationBanner";
import Index from "./pages/Index";
import MovieDetail from "./pages/MovieDetail";
import TVShowDetail from "./pages/TVShowDetail";
import Diary from "./pages/Diary";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import Genres from "./pages/Genres";
import MyList from "./pages/MyList";
import Favorites from "./pages/Favorites";
import Library from "./pages/Library";
import WatchPage from "./pages/WatchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Prefetch wrapper component
const PrefetchWrapper = ({ children }: { children: React.ReactNode }) => {
  usePrefetchContent();
  return <>{children}</>;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit per session
    const hasShown = sessionStorage.getItem('wellplayer_splash_shown');
    return !hasShown;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('wellplayer_splash_shown', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <Toaster />
          <Sonner />
          <PWAInstallPrompt />
          <DonationBanner />
          <BrowserRouter>
            <PrefetchWrapper>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/tv/:id" element={<TVShowDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/search" element={<Search />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/tv-shows" element={<TVShows />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/my-list" element={<MyList />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/library" element={<Library />} />
                <Route path="/watch/:type/:id" element={<WatchPage />} />
                <Route path="/diary" element={<Diary />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PrefetchWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
