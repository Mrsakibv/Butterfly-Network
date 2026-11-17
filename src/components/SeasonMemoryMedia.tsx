import React from 'react';
import { getVideoEmbedUrl } from '../lib/seasonMemories';

interface SeasonMemoryMediaProps {
  type: 'image' | 'video';
  url: string;
  title: string;
}

export const SeasonMemoryMedia: React.FC<SeasonMemoryMediaProps> = ({
  type,
  url,
  title,
}) => {
  if (!url) return null;

  if (type === 'image') {
    return (
      <img
        src={url}
        alt={title || 'Season memory'}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
    );
  }

  const embedUrl = getVideoEmbedUrl(url);
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title || 'Season memory video'}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }

  return (
    <video
      src={url}
      title={title || 'Season memory video'}
      controls
      preload="metadata"
      className="h-full w-full object-cover"
    />
  );
};
