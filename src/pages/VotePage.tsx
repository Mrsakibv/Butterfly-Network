import React, { useEffect } from 'react';
import { Vote, Gift, Sparkles, ArrowUpRight } from 'lucide-react';
import { usePageItems } from '../hooks/usePageItems';

export const VotePage: React.FC = () => {
  const pageItems = usePageItems('vote');

  useEffect(() => {
    document.title = 'Vote | Butterfly Network';
  }, []);

  const defaultRewards = [
    'Daily vote bonus crates',
    'Exclusive cosmetic rewards',
    'Boosted community support',
    'Priority claim access during major events',
  ];
  const rewards = pageItems.length > 0 ? pageItems.map((item) => item.title || item.description) : defaultRewards;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-transparent to-sky-500/10 p-8 sm:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <Vote className="h-3.5 w-3.5 text-purple-400" />
            Vote for Butterfly
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Support the server and claim rewards
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                Voting helps the community grow, unlocks better server reach, and gives you a chance to earn crates, cosmetics, and exclusive in-game rewards.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d1321]/80 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
                <Gift className="h-5 w-5" />
              </div>
              <div className="text-sm uppercase tracking-[0.12em] text-slate-400">Rewards</div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                {rewards.map((reward) => (
                  <div key={reward} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-300" />
                    <span>{reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/40 transition-all hover:brightness-110">
              Vote Now
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-500/40 hover:text-white">
              Read rewards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
