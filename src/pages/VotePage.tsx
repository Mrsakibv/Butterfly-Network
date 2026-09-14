import React, { useEffect, useState } from 'react';
import { Vote, Gift, Sparkles, ArrowUpRight, X, ExternalLink, Crown, Coins, ShieldCheck, Star, Zap, Trophy, KeyRound, Package, Gem, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePageItems } from '../hooks/usePageItems';

export const VotePage: React.FC = () => {
  const pageItems = usePageItems('vote');
  const [showRewards, setShowRewards] = useState(false);

  const normalizeExternalUrl = (value: string) => {
    const url = value.trim();
    if (!url || url === '#') return '#';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  useEffect(() => {
    document.title = 'Vote | Butterfly network';
  }, []);

  const defaultRewards = [
    'Daily vote bonus crates',
    'Exclusive cosmetic rewards',
    'Boosted community support',
    'Priority claim access during major events',
  ];
  const voteSettings = pageItems.find((item) => item.item_type === 'vote_settings');
  const instructionSettings = pageItems.find((item) => item.item_type === 'vote_instructions');
  const popupSettings = pageItems.find((item) => item.item_type === 'vote_popup');
  const popupFeatures = (popupSettings?.extra?.features || '').split('\n').filter(Boolean);
  const instructionTitle = instructionSettings?.title || 'Instructions';
  const popupTitle = popupSettings?.title || 'View Rewards';
  const instructionIcon = instructionSettings?.extra?.rewardsIcon || 'gift';
  const RewardsIcon = instructionIcon === 'gift' ? Gift : instructionIcon === 'crown' ? Crown : instructionIcon === 'coins' ? Coins : instructionIcon === 'gem' ? Gem : instructionIcon === 'medal' ? Medal : instructionIcon === 'package' ? Package : Sparkles;
  const featureItems = (() => {
    try {
      const parsed = JSON.parse(instructionSettings?.extra?.featureItems || '[]') as { text: string; icon: string }[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // Fall back to the legacy newline format below.
    }
    return (instructionSettings?.extra?.features || '').split('\n').filter(Boolean).length > 0
      ? (instructionSettings?.extra?.features || '').split('\n').filter(Boolean).map((text) => ({ text, icon: 'sparkles' }))
      : defaultRewards.map((text) => ({ text, icon: 'sparkles' }));
  })();
  const popupFeatureItems = (() => {
    try {
      const parsed = JSON.parse(popupSettings?.extra?.featureItems || '[]') as { text: string; icon: string }[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* Legacy popup feature format. */ }
    return (popupFeatures.length > 0 ? popupFeatures : defaultRewards).map((text) => ({ text, icon: 'sparkles' }));
  })();
  const featureIcon = (icon: string) => {
    const Icon = icon === 'gift' ? Gift : icon === 'crown' ? Crown : icon === 'coins' ? Coins : icon === 'shield' ? ShieldCheck : icon === 'star' ? Star : icon === 'zap' ? Zap : icon === 'trophy' ? Trophy : icon === 'key' ? KeyRound : Sparkles;
    return <Icon className="h-4 w-4 text-purple-300" />;
  };
  const voteLink = normalizeExternalUrl(voteSettings?.link_url || '');

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
                {instructionSettings?.extra?.rewardsIconUrl ? <img src={instructionSettings.extra.rewardsIconUrl} alt="" className="h-7 w-7 rounded object-cover" /> : <RewardsIcon className="h-5 w-5" />}
              </div>
              <div className="text-sm uppercase tracking-[0.12em] text-slate-400">{instructionTitle}</div>
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                {featureItems.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-2">
                    {featureIcon(feature.icon)}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={voteLink} target={voteLink === '#' ? undefined : '_blank'} rel={voteLink === '#' ? undefined : 'noreferrer'} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/40 transition-all hover:brightness-110">
              Vote Now
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <button onClick={() => setShowRewards(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-500/40 hover:text-white">
              View Rewards
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showRewards && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRewards(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative z-10 my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-purple-500/30 bg-[#09090e] shadow-2xl shadow-purple-950/60">
              <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-violet-400 to-sky-400" />
              <div className="flex items-start justify-between gap-4 border-b border-white/5 p-6 pb-4"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300"><RewardsIcon className="h-3.5 w-3.5" /> {popupTitle}</div><h2 className="font-heading text-2xl font-extrabold text-white">{popupTitle}</h2></div><button onClick={() => setShowRewards(false)} aria-label="Close rewards" className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div>
              <div className="space-y-5 p-6">
                {popupSettings?.image_url && <img src={popupSettings.image_url} alt={popupTitle} className="h-48 w-full rounded-xl border border-white/10 object-cover" />}
                {popupSettings?.description && <p className="text-sm leading-relaxed text-slate-300">{popupSettings.description}</p>}
                <ul className="space-y-2">{popupFeatureItems.map((feature) => <li key={feature.text} className="flex items-start gap-2 text-sm text-slate-200">{featureIcon(feature.icon)}{feature.text}</li>)}</ul>
                {voteLink !== '#' && <a href={voteLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:brightness-110">Vote Now <ExternalLink className="h-4 w-4" /></a>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
