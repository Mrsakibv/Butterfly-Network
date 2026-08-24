import React, { useEffect } from 'react';
import { SERVER_CONFIG } from '../config/server';
import { FileText, ShieldAlert } from 'lucide-react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of Service | Butterfly Network';
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white font-heading">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: January 2026</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 sm:p-10 border space-y-8 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white font-heading">1. Acceptance of Terms</h2>
            <p>
              By accessing, connecting to, or playing on {SERVER_CONFIG.serverName} (accessible via {SERVER_CONFIG.javaIp}), you signify your agreement to these Terms of Service and our Server Rules. If you do not agree, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white font-heading">2. Virtual Goods & Store Purchases</h2>
            <p>
              All purchases made through any official store are strictly virtual licenses for in-game cosmetics, vanity perks, and convenience items. Purchases are final and non-refundable. Chargebacks will result in an immediate and irreversible permanent ban across the entire network.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white font-heading">3. Account Safety & Responsibility</h2>
            <p>
              You are solely responsible for the actions performed on your Minecraft account. Sharing accounts or compromised passwords does not pardon punishments applied for rule violations.
            </p>
          </section>

          
        </div>
      </div>
    </div>
  );
};
