import React from 'react';
import { Logo } from './Logo';
import { SERVER_CONFIG } from '../config/server';
import { useRouter } from '../hooks/useRouter';
import { CopyIpButton } from './CopyIpButton';
import { Disc as DiscordIcon, Youtube, Twitter, Video, ShieldAlert, Heart, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (href.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const el = document.querySelector(href.replace('/', ''));
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    navigate(href);
  };

  return (
    <footer id="main-footer" className="relative border-t border-white/[0.08] bg-[#050505] pt-16 pb-12 overflow-hidden text-slate-400">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/[0.06]">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <a
              href="/"
              onClick={(e) => handleLinkClick('/', e)}
              className="inline-block focus:outline-none"
              aria-label="Butterfly Network Home"
            >
              <Logo size="lg" />
            </a>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Butterfly Network is a premier Minecraft multiplayer experience delivering custom Skyblock, fast-paced BedWars, SMP Survival, and hardcore Lifesteal with zero latency.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Join our Discord Server"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-purple-600/30 border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <img
  src="/discord.svg"
  alt="Discord"
  className="w-5 h-5"
/>
              </a>
              <a
                href={SERVER_CONFIG.facebookUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on Facebook"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-blue-600/30 border border-white/10 hover:border-blue-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={SERVER_CONFIG.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on TikTok"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-pink-600/30 border border-white/10 hover:border-pink-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <img
  src="/tiktok.svg"
  alt="TikTok"
  className="w-5 h-5"
/>
              </a>
              <a
                href={SERVER_CONFIG.twitterUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on X (Twitter)"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-sky-600/30 border border-white/10 hover:border-sky-500/50 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <img
  src="/X.svg"
  alt="X"
  className="w-5 h-5"
/>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="/" onClick={(e) => handleLinkClick('/', e)} className="hover:text-purple-300 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/games" onClick={(e) => handleLinkClick('/games', e)} className="hover:text-purple-300 transition-colors">
                  Games & Modes
                </a>
              </li>
              <li>
                <a href="/#features" onClick={(e) => handleLinkClick('/#features', e)} className="hover:text-purple-300 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/leaderboard" onClick={(e) => handleLinkClick('/leaderboard', e)} className="hover:text-purple-300 transition-colors">
                  Leaderboards
                </a>
              </li>
              <li>
                <a href="/faq" onClick={(e) => handleLinkClick('/faq', e)} className="hover:text-purple-300 transition-colors">
                  FAQ & Help
                </a>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Community</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={SERVER_CONFIG.discordUrl} target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors flex items-center gap-1.5">
                  <span>Discord Server</span>
                </a>
              </li>
              <li>
                <a href={SERVER_CONFIG.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">
                  Facebook 
                </a>
              </li>
              <li>
                <a href={SERVER_CONFIG.tiktokUrl} target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">
                  TikTok 
                </a>
              </li>
              <li>
                <a href={SERVER_CONFIG.twitterUrl} target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">
                  X (Twitter) 
                </a>
              </li>
              <li>
                <a href="/rules" onClick={(e) => handleLinkClick('/rules', e)} className="hover:text-purple-300 transition-colors">
                  Server Rules
                </a>
              </li>
            </ul>
          </div>

          {/* Server Connection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Server Info</h3>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Java:</span>
                <span className="font-mono font-semibold text-white">{SERVER_CONFIG.javaIp}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Bedrock:</span>
                <span className="font-mono font-semibold text-white">{SERVER_CONFIG.bedrockIp}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Port:</span>
                <span className="font-mono text-purple-300">{SERVER_CONFIG.bedrockPort}</span>
              </div>
              <div className="pt-2">
                <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy Server IP" variant="compact" className="w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>&copy; {SERVER_CONFIG.copyrightYear} {SERVER_CONFIG.serverName}. All rights reserved.</span>
            <span className="hidden sm:inline">&bull;</span>
            <div className="flex items-center gap-4">
              <a href="/rules" onClick={(e) => handleLinkClick('/rules', e)} className="hover:text-slate-400 transition-colors">Rules</a>
              <a href="/terms" onClick={(e) => handleLinkClick('/terms', e)} className="hover:text-slate-400 transition-colors">Terms</a>
              <a href="/privacy" onClick={(e) => handleLinkClick('/privacy', e)} className="hover:text-slate-400 transition-colors">Privacy</a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-center text-slate-500 max-w-md text-[11px] leading-tight">
            <ShieldAlert className="w-4 h-4 shrink-0 text-slate-600" />
            <span>This is a test Minecraft server Website and this server created By Sakib.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
