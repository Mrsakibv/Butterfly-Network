export interface ServerFeature {
  id: string;
  title: string;
  description: string;
  iconName: string;
  accent: string;
}

export const SERVER_FEATURES: ServerFeature[] = [
  {
    id: 'performance',
    title: 'High Performance',
    description: 'Enterprise-grade Ryzen 9 7950X3D nodes and custom patched Paper/Purpur software guarantee a consistent 20.0 TPS even during peak hour events.',
    iconName: 'Cpu',
    accent: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30'
  },
  {
    id: 'latency',
    title: 'Low Latency',
    description: 'Strategically located low-ping data centers with premium Tier-1 transit routes and 2Tbps+ Anycast DDoS mitigation for uninterrupted gameplay.',
    iconName: 'Zap',
    accent: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30'
  },
  {
    id: 'community',
    title: 'Active Community',
    description: 'Thousands of passionate Minecraft players on our 24/7 Discord server, sharing designs, forming guilds, trading, and forging long-lasting friendships.',
    iconName: 'Users',
    accent: 'from-indigo-500/20 to-violet-500/10 border-indigo-500/30'
  },
  {
    id: 'fairplay',
    title: 'Fair Gameplay',
    description: 'Strict non-pay-to-win design philosophy. Store purchases are purely cosmetics, quality of life, and vanity items, ensuring a level playing field for all.',
    iconName: 'Scale',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30'
  },
  {
    id: 'anticheat',
    title: 'Anti-Cheat',
    description: 'State-of-the-art machine-learning heuristics combined with GrimAC server-side simulation to stop unfair advantages, fly, killaura, and speed hacks.',
    iconName: 'ShieldCheck',
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/30'
  },
  {
    id: 'events',
    title: 'Regular Events',
    description: 'Weekly tournaments, seasonal boss raids, hide & seek contests, and custom holiday celebrations with real cash prizes, ranks, and exclusive trophies.',
    iconName: 'Sparkles',
    accent: 'from-pink-500/20 to-rose-500/10 border-pink-500/30'
  },
  {
    id: 'customfeatures',
    title: 'Custom Features',
    description: 'Proprietary custom-coded plugins, unique sound design, custom textured GUIs, custom enchants, and bespoke mechanics not found on any other network.',
    iconName: 'Flame',
    accent: 'from-violet-500/20 to-purple-500/10 border-violet-500/30'
  },
  {
    id: 'staff',
    title: 'Friendly Staff',
    description: 'A round-the-clock international moderation team dedicated to maintaining a welcoming, toxic-free environment and rapid support ticket resolutions.',
    iconName: 'HeartHandshake',
    accent: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30'
  }
];
