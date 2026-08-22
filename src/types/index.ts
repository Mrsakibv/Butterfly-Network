export type ServerStatusState = 'LOADING' | 'ONLINE' | 'OFFLINE' | 'ERROR' | 'DEMO';

export interface ServerStatusData {
  state: ServerStatusState;
  online: boolean;
  playersOnline: number;
  playersMax: number;
  version: string;
  ping: number;
  motd?: string;
  icon?: string;
  error?: string | null;
  lastUpdated: number;
  isDemo: boolean;
}

export interface GameMode {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  badge: string;
  accentColor: string;
  iconName: string;
  playerCountEstimate: string;
  status: 'Online' | 'Beta' | 'Maintenance';
  features: string[];
  howToPlay: string[];
  highlights: { title: string; desc: string }[];
  tags: string[];
  recommendedVersion: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string;
  score: string;
  rawValue: number;
  badge?: string;
  guild?: string;
}

export type LeaderboardCategory = 'playtime' | 'money' | 'kills' | 'wins';

export interface FaqItem {
  id: string;
  category: 'General' | 'Connection' | 'Game Modes' | 'Support';
  question: string;
  answer: string;
}

export interface RuleCategory {
  title: string;
  description: string;
  rules: {
    ruleNumber: string;
    title: string;
    description: string;
    punishment: string;
  }[];
}

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}
