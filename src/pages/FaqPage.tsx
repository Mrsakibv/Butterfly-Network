import React, { useEffect } from 'react';
import { FaqSection } from '../components/FaqSection';
import { CommunityCTA } from '../components/CommunityCTA';

interface FaqPageProps {
  onOpenPlayModal: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onOpenPlayModal }) => {
  useEffect(() => {
    document.title = 'FAQ & Help | Butterfly Network';
  }, []);

  return (
    <div className="pt-24 pb-20">
      <FaqSection />
      <CommunityCTA onOpenPlayModal={onOpenPlayModal} />
    </div>
  );
};
