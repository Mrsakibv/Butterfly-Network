export interface PricingItem {
  id: string;
  name: string;
  iconName: string;
  description: string;
  price: number;
  features: string[];
}

/**
 * Individual feature pricing for the Butterfly Network template.
 * Update prices/descriptions here — the Pricing page reads directly from this file.
 */
export const PRICING_ITEMS: PricingItem[] = [
  {
    id: 'single-page',
    name: 'Single Page Setup',
    iconName: 'FileCode2',
    description: 'A clean, ready-to-deploy single landing page with your branding, server IP and basic sections.',
    price: 25,
    features: [
      'One fully responsive landing page',
      'Your logo, colors & server info',
      'Mobile & desktop optimized',
      'Basic SEO setup'
    ]
  },
  {
    id: 'server-status',
    name: 'Server Status Widget',
    iconName: 'Activity',
    description: 'Live server status widget showing online/offline state, player count and ping in real time.',
    price: 20,
    features: [
      'Live online/offline detection',
      'Real-time player count',
      'Java & Bedrock support',
      'Auto-refresh every few seconds'
    ]
  },
  {
    id: 'animations',
    name: 'Premium Animations',
    iconName: 'Sparkles',
    description: 'Smooth page transitions, particle backgrounds, hover effects and loading screen animations.',
    price: 30,
    features: [
      'Animated loading screen',
      'Particle background effects',
      'Page transition animations',
      'Interactive hover & scroll effects'
    ]
  },
  {
    id: 'login-system',
    name: 'Login System',
    iconName: 'LogIn',
    description: 'Full authentication system so players can register, log in and manage their account securely.',
    price: 40,
    features: [
      'Email/password authentication',
      'Secure session handling',
      'Password reset flow',
      'Profile page integration'
    ]
  },
  {
    id: 'login-popup',
    name: 'Login Popup',
    iconName: 'PanelTopOpen',
    description: 'A polished modal popup for quick login/join actions without leaving the current page.',
    price: 15,
    features: [
      'Modal-based login/join flow',
      'Animated open & close transitions',
      'Works from any page',
      'Mobile-friendly design'
    ]
  },
  {
    id: 'database',
    name: 'Database Management',
    iconName: 'Database',
    description: 'Backend database setup and management so player profiles, stats and data are stored reliably.',
    price: 45,
    features: [
      'Database schema setup',
      'Player profile storage',
      'Secure data access rules',
      'Easy to extend for new features'
    ]
  },
  {
    id: 'leaderboard',
    name: 'Realtime Leaderboard',
    iconName: 'Trophy',
    description: 'A live-updating leaderboard section that ranks players by stats, kills, wins or custom scores.',
    price: 35,
    features: [
      'Realtime score updates',
      'Top player rankings',
      'Custom ranking categories',
      'Animated rank changes'
    ]
  }
];

/**
 * Full package price for the entire website with all features included.
 * This is intentionally priced lower than the sum of individual items.
 */
export const FULL_PACKAGE = {
  name: 'Full Website Setup',
  description: 'The complete Butterfly Network template — every feature above, fully integrated, tested and ready to deploy.',
  price: 180,
  features: [
    'All individual features included',
    'Full multi-page website (Home, Games, Leaderboard, FAQ, Rules & more)',
    'Login system + database + realtime leaderboard fully connected',
    'All animations & particle effects',
    'Source code handover',
    'Setup guidance included'
  ]
};
