import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/content/HeroSection';
import { ContentCarousel } from '@/components/content/ContentCarousel';
import {
  getFeaturedContent,
  getTrendingContent,
  getClassicHorror,
  getClassicComedy,
  getSciFiFantasy,
} from '@/data/mockContent';

const Index = () => {
  const featured = getFeaturedContent();
  const trending = getTrendingContent();
  const horror = getClassicHorror();
  const comedy = getClassicComedy();
  const scifi = getSciFiFantasy();

  return (
    <Layout>
      <HeroSection featured={featured} />
      
      <div className="relative -mt-32 z-10 pb-16">
        <ContentCarousel title="Trending Now" items={trending} size="large" />
        <ContentCarousel title="Classic Horror" items={horror} />
        <ContentCarousel title="Comedy Classics" items={comedy} />
        <ContentCarousel title="Sci-Fi & Fantasy" items={scifi} />
      </div>
    </Layout>
  );
};

export default Index;
