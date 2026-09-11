import React, { useState } from 'react';
import {
  BedDouble,
  Castle,
  Compass,
  Crown,
  Crosshair,
  Flame,
  Gamepad2,
  Gem,
  HeartCrack,
  Pickaxe,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Waves,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const GAME_MODE_ICONS: Record<string, LucideIcon> = {
  BedDouble,
  Castle,
  Compass,
  Crown,
  Crosshair,
  Flame,
  Gamepad2,
  Gem,
  HeartCrack,
  Pickaxe,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Waves,
  Zap,
};

interface GameModeIconProps {
  name?: string;
  url?: string;
  className?: string;
}

export const GameModeIcon: React.FC<GameModeIconProps> = ({ name, url, className }) => {
  const imageUrl = url?.trim();
  const [imageFailed, setImageFailed] = useState(false);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${className ?? ''} object-contain`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  const Icon = GAME_MODE_ICONS[name || ''] || Gamepad2;
  return <Icon className={className} />;
};
