import { GameMode } from '../types';

export const GAME_MODES: GameMode[] = [
  {
    id: 'skyblock',
    slug: 'skyblock',
    name: 'Skyblock',
    shortDescription: 'Build your island, expand your empire and compete with other players.',
    longDescription: 'Start with a humble floating island in the endless void. Gather resources, establish automated farms, unlock custom minions, and master unique player-driven economies. Form cooperative islands with friends or dominate the global island top rankings.',
    badge: 'Popular',
    accentColor: 'from-purple-500 to-indigo-600',
    iconName: 'Crown',
    playerCountEstimate: '180+ Playing',
    status: 'Online',
    features: [
      'Custom Minions & Auto-Harvesters',
      'Player-driven Auction House & Bazaar',
      'Island Upgrades & Custom Biomes',
      'Dynamic Skill Progression & Talismans',
      'Dungeon Boss Encounters'
    ],
    howToPlay: [
      'Type /is create to generate your personal starter island.',
      'Complete beginner quests using /quests to earn starter coins and blocks.',
      'Expand your island borders and recruit friends with /is invite.',
      'Sell surplus crops, ores, and mob drops at the /shop or player markets.'
    ],
    highlights: [
      { title: 'Over 50+ Custom Enchants', desc: 'Forge weapons and gear with unique passive and active combat abilities.' },
      { title: 'Global Island Top Rewards', desc: 'Compete weekly for valuable cosmetic vouchers and in-game crowns.' },
      { title: 'Community Island Visits', desc: 'Showcase your architectural masterpieces with public /is warp portals.' }
    ],
    tags: ['Economy', 'PvE', 'Co-op', 'Progression'],
    recommendedVersion: '1.20.x - 1.21.x'
  },
  {
    id: 'bedwars',
    slug: 'bedwars',
    name: 'BedWars',
    shortDescription: 'Protect your bed, destroy enemy teams and become the last team standing.',
    longDescription: 'Fast-paced tactical multiplayer combat. Protect your home bed while bridging across islands to gather iron, gold, diamonds, and emeralds. Upgrade your team forge, purchase traps, and obliterate opponent defenses before sudden death strikes.',
    badge: 'Competitive',
    accentColor: 'from-rose-500 to-amber-600',
    iconName: 'BedDouble',
    playerCountEstimate: '140+ Playing',
    status: 'Online',
    features: [
      'Solo, Doubles, 3v3v3v3, and 4v4v4v4 Queues',
      'Custom Kill Effects & Final Kill Celebrations',
      'Anti-Knockback Optimized Arena Physics',
      'Ranked Matchmaking & Competitive Seasons',
      'Dynamic Cosmetic Shop with Victory Dances'
    ],
    howToPlay: [
      'Join any queue from the NPC in the BedWars lobby.',
      'Collect iron and gold from your island generator to buy blocks and weapons.',
      'Fortify your bed with wool, wood, endstone, and obsidian.',
      'Rush center islands for diamonds and emeralds to wipe out enemy beds.'
    ],
    highlights: [
      { title: '0ms Responsive Hits', desc: 'Custom network tick optimization engineered for pure hit registration.' },
      { title: 'Over 30 Custom Maps', desc: 'Carefully balanced arenas ranging from fast rush maps to strategic forts.' },
      { title: 'Cosmetic Unlocks', desc: 'Level up your star prestige to show off animated shopkeeper skins.' }
    ],
    tags: ['PvP', 'Team', 'Fast-Paced', 'Competitive'],
    recommendedVersion: '1.8.9 or 1.20+'
  },
  {
    id: 'skywars',
    slug: 'skywars',
    name: 'SkyWars',
    shortDescription: 'Loot, fight and survive above the void.',
    longDescription: 'High-octane aerial arena combat. Spawn on your personal sky island, raid randomized chests for gear, project yourself across islands with ender pearls, and out-duel your rivals before the doom dragon awakens.',
    badge: 'Fast PvP',
    accentColor: 'from-cyan-500 to-blue-600',
    iconName: 'Swords',
    playerCountEstimate: '95+ Playing',
    status: 'Online',
    features: [
      'Normal, Insane, and Mega Mode Modifiers',
      'Custom Kits: Knight, Pyro, Cannoneer & Scout',
      'Special Events: Dragon Doom, Low Gravity, Chest Refill',
      'Soul Well Lottery for rare cages & perks',
      'Instant Match Re-Queueing System'
    ],
    howToPlay: [
      'Select your favorite starting kit in the pre-game lobby.',
      'Loot chests rapidly when the countdown hits zero.',
      'Bridge swiftly to the middle island for legendary high-tier equipment.',
      'Eliminate remaining players to claim victory and prestige coins.'
    ],
    highlights: [
      { title: 'Instant Queue Flow', desc: 'No waiting in lobbies—jump straight into the next match instantly.' },
      { title: 'Unique Projectile Trails', desc: 'Customize your arrows and snowballs with vibrant particle effects.' },
      { title: 'Monthly Ranked Ladders', desc: 'Climb the division leaderboard for exclusive seasonal name tags.' }
    ],
    tags: ['Solo', 'PvP', 'Action', 'Kits'],
    recommendedVersion: '1.8.9 or 1.20+'
  },
  {
    id: 'survival',
    slug: 'survival',
    name: 'Survival',
    shortDescription: 'Explore, build, trade and create your own adventure.',
    longDescription: 'A modern, enhanced SMP experience. Explore a vast custom-generated world with lush biomes, player lands protection, player-driven trading shops, dynamic jobs, and custom quests—all while preserving the pure spirit of vanilla exploration.',
    badge: 'Enhanced SMP',
    accentColor: 'from-emerald-500 to-teal-600',
    iconName: 'Compass',
    playerCountEstimate: '110+ Playing',
    status: 'Online',
    features: [
      'Grief-Free Land Claiming System',
      'Player Towns, Guilds & Community Nations',
      'Dynamic Jobs System (Miner, Hunter, Builder, Brewer)',
      'Custom Dungeons & Elite World Bosses',
      'Toggleable PvP Areas & Safe Spawn Hub'
    ],
    howToPlay: [
      'Use /rtp to randomly teleport into the wild survival frontier.',
      'Claim your territory using a golden shovel or /claim.',
      'Choose a profession with /jobs join to earn steady income.',
      'Build your dream settlement and trade items with /ah and player warps.'
    ],
    highlights: [
      { title: 'Economy That Never Inflates', desc: 'Balanced sinks and tax structures to ensure a vibrant trading floor.' },
      { title: 'Cross-Version Support', desc: 'Build with the newest blocks while enjoying lag-free tick rates.' },
      { title: 'Community Events', desc: 'Participate in weekly build contests, fishing tournaments, and boss raids.' }
    ],
    tags: ['SMP', 'Building', 'Economy', 'Chill'],
    recommendedVersion: '1.20.x - 1.21.x'
  },
  {
    id: 'lifesteal',
    slug: 'lifesteal',
    name: 'Lifesteal',
    shortDescription: 'Fight for survival where every battle can change your fate.',
    longDescription: 'The ultimate high-stakes survival challenge. Eliminating another player steals one of their permanent maximum hearts. Lose all your hearts and face a temporary server banishment. Craft revival beacons, forge custom heart amulets, and trust no one.',
    badge: 'Hardcore PvP',
    accentColor: 'from-red-500 to-rose-700',
    iconName: 'HeartCrack',
    playerCountEstimate: '160+ Playing',
    status: 'Online',
    features: [
      'Heart Steal on Player Elimination (Max 20 Hearts)',
      'Heart Crafting & Sacrificial Shrines',
      'Revival Beacons for Banished Allies',
      'Custom Anti-Combat Logging & Fair Combat Tags',
      'Hidden Base Radar & Raid Explosives'
    ],
    howToPlay: [
      'Equip yourself quickly—you start with the standard 10 hearts.',
      'Every player you kill grants +1 permanent heart to your health pool.',
      'If you lose all hearts (0 HP max), you are eliminated for 24 hours.',
      'Craft Heart Crystals to restore vitality or trade them on the black market.'
    ],
    highlights: [
      { title: 'High Adrenaline Combat', desc: 'Every strike matters with real stakes and hearts on the line.' },
      { title: 'Bounty Hunting System', desc: 'Place hit-contracts on apex juggernauts to claim heart bounties.' },
      { title: 'Seasonal World Resets', desc: 'Fair periodic resets ensuring new contenders always have a fighting chance.' }
    ],
    tags: ['Hardcore', 'PvP', 'Survival', 'High Stakes'],
    recommendedVersion: '1.20.x - 1.21.x'
  },
  {
    id: 'headsteal',
    slug: 'headsteal',
    name: 'HeadSteal',
    shortDescription: 'Collect powerful trophies from your enemies and dominate the battlefield.',
    longDescription: 'An exclusive combat mode where vanquishing opponents decapitates their player head as a wearable, enchanted relic. Each severed head retains unique tiered elemental buffs—speed, resistance, or fury strikes. Hoard enemy heads to unlock forbidden warlord vaults.',
    badge: 'Exclusive',
    accentColor: 'from-violet-500 to-fuchsia-700',
    iconName: 'Skull',
    playerCountEstimate: '75+ Playing',
    status: 'Online',
    features: [
      'Guaranteed Player Head Drops on Death',
      'Wearable Trophy Heads with Passive Stat Boosts',
      'Head Forge: Merge duplicate heads to upgrade rarity',
      'Warlord Vaults unlocked only via head sacrifice',
      'Active Head Bounty Board with rare item rewards'
    ],
    howToPlay: [
      'Enter the HeadSteal arenas and scout for target players.',
      'Defeat opponents in combat to claim their physical player head.',
      'Wear their head as a helmet for stat buffs or deposit in /headforge.',
      'Sacrifice heads at the Altar of Dominance for legendary relic weaponry.'
    ],
    highlights: [
      { title: 'Unique Head Tiering', desc: 'Common, Rare, Epic, Legendary, and Mythic heads with distinct glowing auras.' },
      { title: 'Trophy Hall Showcase', desc: 'Display your most prized scalps in your personal player museum.' },
      { title: 'Head Bounty Multipliers', desc: 'Hunting top-ranked players yields 3x head essence and bonus crate keys.' }
    ],
    tags: ['Action', 'PvP', 'Trophies', 'Custom RPG'],
    recommendedVersion: '1.20.x - 1.21.x'
  }
];
