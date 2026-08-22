import React, { useEffect } from 'react';
import { SERVER_CONFIG } from '../config/server';
import { Shield, Lock } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Butterfly Network';
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Data Protection</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white font-heading">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: January 2026</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 sm:p-10 border space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white font-heading">1. Information We Collect</h2>
            <p>
              When you connect to {SERVER_CONFIG.serverName}, our systems log standard network connection metadata including your Minecraft UUID, in-game username, IP address, connection timestamps, and chat messages for moderation, anti-cheat diagnostics, and server security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white font-heading">2. How We Use Information</h2>
            <p>
              Logged data is strictly utilized to authenticate player logins, prevent DDoS attacks, maintain fair gameplay against banned cheaters, and compute player statistics (such as leaderboards and playtime). We never sell or share player data with third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white font-heading">3. Security & Retention</h2>
            <p>
              We implement industry-standard encryption and access controls on all internal server databases. Data logs are automatically rotated and purged periodically according to our retention protocols.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
