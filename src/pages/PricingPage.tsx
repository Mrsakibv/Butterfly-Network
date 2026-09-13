import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Coins, Crown, KeyRound, Package, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { SERVER_CONFIG } from '../config/server';

const storeItems = [
  {
    id: 'rank-member',
    title: 'Member Rank',
    description: 'Join as a Member and enjoy exclusive benefits',
    category: 'ranks',
    categoryLabel: 'Ranks',
    price: '99',
    features: ['Access to member commands', 'Custom prefix', 'Priority support'],
  },
  {
    id: 'rank-vip',
    title: 'VIP Rank',
    description: 'Premium VIP experience with extended features',
    category: 'ranks',
    categoryLabel: 'Ranks',
    price: '299',
    features: ['All Member benefits', 'Double rewards', 'VIP chat color', 'Custom item name'],
  },
  {
    id: 'rank-elite',
    title: 'Elite Rank',
    description: 'The ultimate rank for true enthusiasts',
    category: 'ranks',
    categoryLabel: 'Ranks',
    price: '599',
    features: ['All VIP benefits', 'Exclusive commands', 'Custom armor', 'Priority queue'],
    badge: 'Most Popular',
  },
  {
    id: 'keys-common',
    title: 'Common Key',
    description: 'Unlock common loot chests',
    category: 'keys',
    categoryLabel: 'Keys',
    price: '49',
    features: ['1x Common Key', 'Random common rewards'],
  },
  {
    id: 'keys-rare',
    title: 'Rare Key',
    description: 'Unlock rare and valuable items',
    category: 'keys',
    categoryLabel: 'Keys',
    price: '149',
    features: ['1x Rare Key', 'Better rewards', 'Guaranteed rare item'],
  },
  {
    id: 'keys-legendary',
    title: 'Legendary Key',
    description: 'The rarest loot awaits',
    category: 'keys',
    categoryLabel: 'Keys',
    price: '499',
    features: ['1x Legendary Key', 'Epic rewards', 'Guaranteed legendary item'],
  },
  {
    id: 'coins-starter',
    title: 'Starter Coins',
    description: 'Get 10,000 coins to start',
    category: 'coins',
    categoryLabel: 'Coins',
    price: '79',
    features: ['10,000 coins', 'Use in player shops'],
  },
  {
    id: 'coins-bundle',
    title: 'Coin Bundle',
    description: 'Get 50,000 coins at a discount',
    category: 'coins',
    categoryLabel: 'Coins',
    price: '349',
    features: ['50,000 coins', 'Save 15% vs individual'],
  },
  {
    id: 'coins-mega',
    title: 'Mega Coins',
    description: 'Maximum coins for ultimate players',
    category: 'coins',
    categoryLabel: 'Coins',
    price: '999',
    features: ['250,000 coins', 'Huge savings', 'Exclusive access'],
  },
  {
    id: 'wings-basic',
    title: 'Basic Wings',
    description: 'Show off with stylish wings',
    category: 'wings',
    categoryLabel: 'Wings',
    price: '129',
    features: ['1x Wing cosmetic', 'Permanent ownership'],
  },
  {
    id: 'wings-premium',
    title: 'Premium Wings',
    description: 'Exclusive wing design for elite players',
    category: 'wings',
    categoryLabel: 'Wings',
    price: '249',
    features: ['1x Premium Wing', 'Rare design', 'Status symbol'],
  },
  {
    id: 'wings-mythic',
    title: 'Mythic Wings',
    description: 'The most legendary wings in the game',
    category: 'wings',
    categoryLabel: 'Wings',
    price: '649',
    features: ['1x Mythic Wing', 'Unique appearance', 'Particle effects'],
    badge: 'Exclusive',
  },
];

const defaultCategories = [
  { id: 'ranks', label: 'Ranks', icon: Crown, iconName: 'crown' },
  { id: 'keys', label: 'Keys', icon: KeyRound, iconName: 'key' },
  { id: 'coins', label: 'Coins', icon: Coins, iconName: 'coins' },
  { id: 'wings', label: 'Wings', icon: Sparkles, iconName: 'sparkles' },
];

interface PricingPageProps {
  onOpenPlayModal: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = () => {
  const [activeCategory, setActiveCategory] = useState('ranks');

  useEffect(() => {
    document.title = 'Minecraft Store | Butterfly Network';
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Map(
        storeItems.map((item) => [
          item.category,
          {
            id: item.category,
            label: item.categoryLabel,
            icon: defaultCategories.find((c) => c.id === item.category)?.icon || Package,
          },
        ])
      ).values()
    );
    return uniqueCategories.length > 0 ? uniqueCategories : defaultCategories;
  }, []);

  const visibleItems = useMemo(
    () => storeItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  useEffect(() => {
    if (!categories.some((category) => category.id === activeCategory)) {
      setActiveCategory(categories[0]?.id || 'ranks');
    }
  }, [activeCategory, categories]);

  return (
    <div className="pt-24 pb-20">
      <section className="relative py-12">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
              <Package className="h-3.5 w-3.5 text-purple-400" /> Minecraft Store
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Power up your adventure</h1>
            <p className="text-base text-slate-400 sm:text-lg">Choose ranks, keys, coins, and wings for your Butterfly Network experience.</p>
          </div>
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  activeCategory === id
                    ? 'border-purple-400/50 bg-purple-500/20 text-white'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-400">
              No products are available in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="relative flex h-[390px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-purple-400/40"
                >
                  {item.badge && (
                    <span className="absolute right-4 top-4 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                      {item.badge}
                    </span>
                  )}
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <Package className="h-5 w-5 text-purple-300" />
                  </div>
                  <h2 className="text-lg font-bold text-white">{item.title}</h2>
                  <p className="mt-1 min-h-12 text-sm leading-relaxed text-slate-400">{item.description}</p>
                  <div className="mt-4 text-2xl font-extrabold text-white">৳{item.price}</div>
                  {item.features.length > 0 && (
                    <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={SERVER_CONFIG.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#5865F2]/40 bg-[#5865F2]/15 px-4 py-3 text-sm font-semibold text-white hover:bg-[#5865F2]/30"
                  >
                    Join Discord to Buy <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
