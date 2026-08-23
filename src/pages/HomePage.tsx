import React, { useEffect } from 'react';
import { Hero } from '../components/Hero';
import { GameModesSection } from '../components/GameModesSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowToJoinSection } from '../components/HowToJoinSection';
import { ServerInfoSection } from '../components/ServerInfoSection';
import { LeaderboardSection } from '../components/LeaderboardSection';
import { CommunityCTA } from '../components/CommunityCTA';
import { FaqSection } from '../components/FaqSection';
import { FinalCTA } from '../components/FinalCTA';
import { SERVER_CONFIG } from '../config/server';

interface HomePageProps {
  onOpenPlayModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenPlayModal }) => {
  useEffect(() => {
    document.title = 'Butterfly Network | Minecraft Server Network';
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Hero Section */}
      <Hero onOpenPlayModal={onOpenPlayModal} />

      {/* 2. Featured Game Modes */}
      <GameModesSection onOpenPlayModal={onOpenPlayModal} />

      {/* 3. Why Butterfly Network Features */}
      <FeaturesSection />

      {/* 4. How To Join (3 Steps) */}
      <HowToJoinSection />

      {/* 5. Server Information Table & Specs */}
      <ServerInfoSection />

      {/* 6. Player Leaderboard */}
      <LeaderboardSection />

      {/* 7. Community CTA */}
      <CommunityCTA onOpenPlayModal={onOpenPlayModal} />

      {/* 8. FAQ Accordion */}
      <FaqSection />

      {/* 9. Final CTA */}
      <FinalCTA onOpenPlayModal={onOpenPlayModal} />
    </div>
  );
};
