import React, { useEffect } from 'react';
import { FaqSection } from '../components/FaqSection';
import { CommunityCTA } from '../components/CommunityCTA';
import { usePageItems } from '../hooks/usePageItems';

interface FaqPageProps {
  onOpenPlayModal: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onOpenPlayModal }) => {
  const faqItems = usePageItems('faq');

  useEffect(() => {
    document.title = 'FAQ & Help | Butterfly Network';
  }, []);

  return (
    <div className="pt-24 pb-20">
      <FaqSection faqItems={faqItems} />
      <CommunityCTA onOpenPlayModal={onOpenPlayModal} />
    </div>
  );
};
