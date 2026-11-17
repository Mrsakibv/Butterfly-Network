import React, { useEffect } from 'react';
import { LeaderboardSection } from '../components/LeaderboardSection';
import { FinalCTA } from '../components/FinalCTA';

interface LeaderboardPageProps {
  onOpenPlayModal: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onOpenPlayModal }) => {
  useEffect(() => {
    document.title = 'Leaderboards | Butterfly Network';
  }, []);

  return (
    <div className="pt-24 pb-20">
      <LeaderboardSection />
      <FinalCTA onOpenPlayModal={onOpenPlayModal} />
    </div>
  );
};
