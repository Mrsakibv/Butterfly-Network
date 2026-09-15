import React, { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { HomeSlider } from '../components/HomeSlider';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowToJoinSection } from '../components/HowToJoinSection';
import { ServerInfoSection } from '../components/ServerInfoSection';
import { CommunityCTA } from '../components/CommunityCTA';
import { FinalCTA } from '../components/FinalCTA';
import { SERVER_CONFIG } from '../config/server';

interface HomePageProps {
  onOpenPlayModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenPlayModal }) => {
  useEffect(() => {
    document.title = 'Butterfly network | Minecraft Server Network';
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Hero Section */}
      <Hero onOpenPlayModal={onOpenPlayModal} />

      {/* 2. Custom Home Content Slider */}
      <HomeSlider />

      {/* 3. Why Butterfly network Features */}
      <FeaturesSection />

      {/* 4. How To Join (3 Steps) */}
      <HowToJoinSection />

      {/* 5. Server Information Table & Specs */}
      <ServerInfoSection />

      {/* 6. Community CTA */}
      <CommunityCTA onOpenPlayModal={onOpenPlayModal} />

      {/* 7. Final CTA */}
      <FinalCTA onOpenPlayModal={onOpenPlayModal} />
    </div>
  );
};
