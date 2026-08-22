import { RuleCategory } from '../types';

export const SERVER_RULES: RuleCategory[] = [
  {
    title: 'General & Community Guidelines',
    description: 'We strive to provide a positive, welcoming environment for players of all backgrounds and skill levels.',
    rules: [
      {
        ruleNumber: '1.1',
        title: 'Respect & Harassment',
        description: 'Toxicity, excessive hate speech, discrimination, slurs, cyberbullying, or targeted harassment of any player or staff member will not be tolerated.',
        punishment: 'Mute (1-7 days) or Temporary Ban depending on severity.'
      },
      {
        ruleNumber: '1.2',
        title: 'No Advertising or Self-Promotion',
        description: 'Promoting unauthorized external Minecraft servers, Discord server invites, phishing links, or personal social media handles in public chat or private messages is strictly forbidden.',
        punishment: 'Permanent IP Mute / Permanent Server Ban.'
      },
      {
        ruleNumber: '1.3',
        title: 'Appropriate Usernames & Skins',
        description: 'Inappropriate, offensive, sexually explicit, or politically extremist usernames, capes, or skins are banned across the network.',
        punishment: 'Kick with mandatory name/skin change or Temporary Ban.'
      }
    ]
  },
  {
    title: 'Client Modifications & Unfair Advantages',
    description: 'Butterfly Network is committed to 100% fair gameplay. All competitive advantages must come from skill alone.',
    rules: [
      {
        ruleNumber: '2.1',
        title: 'Hacked Clients & Illegal Cheats',
        description: 'Using any modified client or cheat injector (Killaura, Fly, Speed, Reach, X-Ray, Baritone, Auto-Clicker, Macro, etc.) is strictly prohibited.',
        punishment: 'Permanent Network Ban & Account Blacklist.'
      },
      {
        ruleNumber: '2.2',
        title: 'Allowed Modifications',
        description: 'Client-side performance and aesthetic mods such as Optifine, Sodium, Iris Shaders, Lunar Client, Badlion Client, Feather Client, CPS counters, and Armor HUDs are fully allowed.',
        punishment: 'No penalty.'
      },
      {
        ruleNumber: '2.3',
        title: 'Hardware Macros & Butterfly Clicking Limits',
        description: 'Left-click auto-clickers and hardware mouse macros that simulate clicks over 20 CPS are blocked by anti-cheat filters.',
        punishment: 'Kick followed by Temporary Ban.'
      }
    ]
  },
  {
    title: 'Gameplay, Exploits & Bug Abuse',
    description: 'Respect game mode integrity, map boundaries, and server stability.',
    rules: [
      {
        ruleNumber: '3.1',
        title: 'Bug & Duplication Exploitation',
        description: 'Abusing item duplication glitches, crash exploits, boundary phasing, or economic exploits is punishable. Exploits must be reported immediately to staff.',
        punishment: 'Permanent Ban & Full Economy Wipe.'
      },
      {
        ruleNumber: '3.2',
        title: 'Cross-Teaming in Solo Game Modes',
        description: 'Teaming with enemy players in Solo SkyWars, Solo BedWars, or collaborating to farm stats/kills without actual combat is forbidden.',
        punishment: 'Stat Wipe & 3-day Temporary Ban.'
      },
      {
        ruleNumber: '3.3',
        title: 'Combat Logging & Glitching',
        description: 'Disconnecting or using pearls/ender-chests to evade active PvP combat tags in Lifesteal or SMP is handled by combat logger NPCs and punishable if abused.',
        punishment: 'Automated death drop & Combat penalty.'
      }
    ]
  }
];
