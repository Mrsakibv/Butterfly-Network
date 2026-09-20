import { supabase } from '../lib/supabase';

export type BadgeType =
  | 'blue'
  | 'red'
  | 'golden'
  | 'diamond'
  | 'cosmic'
  | 'crown';

export interface Badge {
  type: BadgeType;

  name: string;
  tier: string;
  value: number;
  rarity: string;
  description: string;

  gifUrl: string;

  color: {
    primary: string;
    secondary: string;
    glow: string;
  };

  animation: {
    particles: boolean;
    glow: boolean;
    pulse: boolean;
  };
}


/*
|--------------------------------------------------------------------------
| Default fallback badges
|--------------------------------------------------------------------------
|
| এগুলো fallback হিসেবে থাকবে।
| Supabase থেকে data না এলে website এগুলো ব্যবহার করবে।
|
*/

const DEFAULT_BADGES: Record<BadgeType, Badge> = {
  blue: {
    type: 'blue',
    name: 'TikBadge Blue',
    tier: 'Basic',
    value: 1,
    rarity: 'Common',
    description: 'New verified users',
    gifUrl: '/badges/badges%20(7).gif',

    color: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      glow: 'rgba(59, 130, 246, 0.5)',
    },

    animation: {
      particles: true,
      glow: true,
      pulse: false,
    },
  },

  red: {
    type: 'red',
    name: 'TikBadge Red',
    tier: 'Rising',
    value: 2,
    rarity: 'Uncommon',
    description: 'Growing creators',
    gifUrl: '/badges/badges%20(6).gif',

    color: {
      primary: '#EF4444',
      secondary: '#F87171',
      glow: 'rgba(239, 68, 68, 0.5)',
    },

    animation: {
      particles: true,
      glow: true,
      pulse: false,
    },
  },

  golden: {
    type: 'golden',
    name: 'TikBadge Golden',
    tier: 'Elite',
    value: 3,
    rarity: 'Rare',
    description: 'Established users',
    gifUrl: '/badges/badges%20(2).gif',

    color: {
      primary: '#F59E0B',
      secondary: '#FBBF24',
      glow: 'rgba(245, 158, 11, 0.6)',
    },

    animation: {
      particles: true,
      glow: true,
      pulse: true,
    },
  },

  diamond: {
    type: 'diamond',
    name: 'TikBadge Diamond',
    tier: 'Legendary',
    value: 4,
    rarity: 'Very Rare',
    description: 'Top tier users',
    gifUrl: '/badges/badges%20(1).gif',

    color: {
      primary: '#A855F7',
      secondary: '#C084FC',
      glow: 'rgba(168, 85, 247, 0.7)',
    },

    animation: {
      particles: true,
      glow: true,
      pulse: true,
    },
  },

  cosmic: {
    type: 'cosmic',
    name: 'TikBadge Cosmic',
    tier: 'Cosmic',
    value: 5,
    rarity: 'Ultra Rare',
    description: 'Special achievers',
    gifUrl: '/badges/badges%20(3).gif',

    color: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      glow: 'rgba(139, 92, 246, 0.8)',
    },

    animation: {
      particles: true,
      glow: true,
      pulse: true,
    },
  },

  crown: {
    type: 'crown',
    name: 'TikBadge Crown',
    tier: 'Supreme',
    value: 6,
    rarity: 'Legendary',
    description: 'Highest of all - owners/founders',
    gifUrl: '/badges/badges%20(5).gif',

    color: {
      primary: '#FBBF24',
      secondary: '#FCD34D',
      glow: 'rgba(251, 191, 36, 0.9)',
    },

    animation: {
      particles: true,
      glow: true,
      pulse: true,
    },
  },
};


/*
|--------------------------------------------------------------------------
| Runtime badge cache
|--------------------------------------------------------------------------
*/

export const BADGES: Record<BadgeType, Badge> = {
  ...DEFAULT_BADGES,
};

const listeners = new Set<() => void>();

let loaded = false;

let loadingPromise:
  | Promise<Record<BadgeType, Badge>>
  | null = null;


/*
|--------------------------------------------------------------------------
| Subscribe to changes
|--------------------------------------------------------------------------
*/

export const subscribeToBadgeChanges = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};


const notifyBadgeChanges = () => {
  listeners.forEach((listener) => listener());
};


/*
|--------------------------------------------------------------------------
| Convert Supabase row → Badge
|--------------------------------------------------------------------------
*/

const rowToBadge = (row: any): Badge => ({
  type: row.type as BadgeType,

  name: row.name,
  tier: row.tier,
  value: Number(row.value),
  rarity: row.rarity,
  description: row.description,

  gifUrl: row.gif_url,

  color: {
    primary: row.primary_color,
    secondary: row.secondary_color,
    glow: row.glow_color,
  },

  animation: {
    particles: Boolean(row.particles),
    glow: Boolean(row.glow),
    pulse: Boolean(row.pulse),
  },
});


/*
|--------------------------------------------------------------------------
| Load badges from Supabase
|--------------------------------------------------------------------------
*/

export const loadBadges = async (
  force = false
): Promise<Record<BadgeType, Badge>> => {
  if (loadingPromise) {
    return loadingPromise;
  }

  if (loaded && !force) {
    return BADGES;
  }

  loadingPromise = (async () => {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('value', {
        ascending: true,
      });

    if (error) {
      console.error(
        'Failed to load badge settings:',
        error
      );

      return BADGES;
    }

    for (const row of data ?? []) {
      if (row.type in DEFAULT_BADGES) {
        BADGES[row.type as BadgeType] =
          rowToBadge(row);
      }
    }

    loaded = true;

    notifyBadgeChanges();

    return BADGES;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
};


/*
|--------------------------------------------------------------------------
| Update badge
|--------------------------------------------------------------------------
*/

export const updateBadge = async (
  badge: Badge
) => {
  const { data, error } = await supabase
    .from('badges')
    .update({
      name: badge.name.trim(),
      tier: badge.tier.trim(),
      value: badge.value,
      rarity: badge.rarity.trim(),
      description: badge.description.trim(),

      gif_url: badge.gifUrl.trim(),

      primary_color:
        badge.color.primary.trim(),

      secondary_color:
        badge.color.secondary.trim(),

      glow_color:
        badge.color.glow.trim(),

      particles:
        badge.animation.particles,

      glow:
        badge.animation.glow,

      pulse:
        badge.animation.pulse,

      updated_at:
        new Date().toISOString(),
    })
    .eq('type', badge.type)
    .select('*')
    .single();

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const updated =
    rowToBadge(data);

  BADGES[badge.type] = updated;

  loaded = true;

  notifyBadgeChanges();

  return {
    data: updated,
    error: null,
  };
};


/*
|--------------------------------------------------------------------------
| Get one badge
|--------------------------------------------------------------------------
*/

export const getBadgeByType = (
  type: BadgeType | null | undefined
): Badge | null => {
  if (!type) {
    return null;
  }

  return BADGES[type] || null;
};


/*
|--------------------------------------------------------------------------
| Get all badges
|--------------------------------------------------------------------------
*/

export const getAllBadges = (): Badge[] =>
  Object.values(BADGES).sort(
    (a, b) => a.value - b.value
  );


/*
|--------------------------------------------------------------------------
| Get defaults
|--------------------------------------------------------------------------
*/

export const getDefaultBadges = (): Badge[] =>
  Object.values(DEFAULT_BADGES).sort(
    (a, b) => a.value - b.value
  );