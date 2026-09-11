import { supabase } from './supabase';
import { GAME_MODES } from '../data/gameModes';
import { GameMode } from '../types';

const toArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);

export const normalizeGameMode = (mode: any): GameMode => ({
  id: mode.id,
  slug: mode.slug,
  name: mode.name,
  shortDescription: mode.shortDescription ?? mode.short_description ?? '',
  longDescription: mode.longDescription ?? mode.long_description ?? '',
  badge: mode.badge ?? '',
  accentColor: mode.accentColor ?? mode.accent_color ?? 'from-purple-500 to-indigo-600',
  iconName: mode.iconName || mode.icon_name || 'Gamepad2',
  iconUrl:
    mode.icon_url ||
    mode.iconUrl ||
    (typeof mode.icon_name === 'string' && mode.icon_name.startsWith('http') ? mode.icon_name : ''),
  playerCountEstimate: mode.playerCountEstimate ?? mode.player_count_estimate ?? 'Online',
  status: mode.status === 'Beta' || mode.status === 'Maintenance' ? mode.status : 'Online',
  features: toArray(mode.features),
  howToPlay: toArray(mode.howToPlay ?? mode.how_to_play),
  highlights: Array.isArray(mode.highlights) ? mode.highlights : [],
  tags: toArray(mode.tags),
  recommendedVersion: mode.recommendedVersion ?? mode.recommended_version ?? '',
});

export const fetchGameModes = async (): Promise<GameMode[]> => {
  const { data, error } = await supabase
    .from('game_modes')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load game modes from Supabase:', error.message);
    return GAME_MODES;
  }

  if (!data || data.length === 0) {
    return GAME_MODES;
  }

  return data.map(normalizeGameMode);
};

export const fetchGameModeBySlug = async (slug: string): Promise<GameMode> => {
  const { data, error } = await supabase
    .from('game_modes')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!error && data) {
    return normalizeGameMode(data);
  }

  return GAME_MODES.find((mode) => mode.slug.toLowerCase() === slug.toLowerCase()) || GAME_MODES[0];
};
