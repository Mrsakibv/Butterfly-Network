import React, { useEffect } from 'react';
import { SERVER_RULES } from '../data/rules';
import { SERVER_CONFIG } from '../config/server';
import { Shield, AlertTriangle, CheckCircle, Scale, MessageSquare, ExternalLink } from 'lucide-react';

export const RulesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Server Rules | Butterfly Network';
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Official Network Policy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            Butterfly Network Rules & Guidelines
          </h1>

          <p className="text-slate-300 text-base sm:text-lg">
            By connecting to {SERVER_CONFIG.serverName}, you agree to abide by the following community standards. Ignorance of the rules is not an excuse.
          </p>
        </div>

        {/* Rule Categories */}
        <div className="space-y-8">
          {SERVER_RULES.map((category, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-6 sm:p-8 border space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white font-heading">{category.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{category.description}</p>
              </div>

              <div className="grid gap-4">
                {category.rules.map((rule) => (
                  <div
                    key={rule.ruleNumber}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                          {rule.ruleNumber}
                        </span>
                        <h3 className="font-bold text-white text-base">{rule.title}</h3>
                      </div>

                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        Penalty: {rule.punishment}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Report / Appeals Footer */}
        <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-white text-base font-heading">Need to Appeal a Punishment or Report a Player?</h3>
            <p className="text-xs text-slate-400">
              Submit proof and ticket details directly through our official Discord server.
            </p>
          </div>

          <a
            href={SERVER_CONFIG.discordUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-purple-600 hover:bg-purple-500 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Ticket on Discord</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  );
};
