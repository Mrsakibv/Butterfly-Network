import React, { useEffect } from 'react';
import { PRICING_ITEMS, FULL_PACKAGE } from '../data/pricing';
import { CommunityCTA } from '../components/CommunityCTA';
import {
  Tag,
  CheckCircle2,
  FileCode2,
  Activity,
  Sparkles,
  LogIn,
  PanelTopOpen,
  Database,
  Trophy,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

interface PricingPageProps {
  onOpenPlayModal: () => void;
}

const ICONS: Record<string, React.ElementType> = {
  FileCode2,
  Activity,
  Sparkles,
  LogIn,
  PanelTopOpen,
  Database,
  Trophy,
};

export const PricingPage: React.FC<PricingPageProps> = ({ onOpenPlayModal }) => {
  useEffect(() => {
    document.title = 'Pricing | Butterfly Network';
  }, []);

  const totalIndividualPrice = PRICING_ITEMS.reduce((sum, item) => sum + item.price, 0);
  const savings = totalIndividualPrice - FULL_PACKAGE.price;

  return (
    <div className="pt-24 pb-20">
      <section className="relative py-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Template Pricing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
              Pick a Feature, or Get It All
            </h1>
            <p className="text-slate-400 text-base sm:text-lg">
              This website template is available piece by piece, or as one complete package.
              Choose exactly what your server needs.
            </p>
          </div>

          {/* Individual Feature Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {PRICING_ITEMS.map((item, index) => {
              const Icon = ICONS[item.iconName] ?? Sparkles;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="relative rounded-2xl glass-panel border border-white/10 p-6 flex flex-col hover:border-purple-400/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-white">
                        ৳{item.price}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1.5">{item.name}</h3>
                  <p className="text-sm text-slate-400 mb-4 leading-relaxed">{item.description}</p>

                  <ul className="space-y-2 mt-auto">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Full Package Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-purple-400/40 shadow-2xl shadow-purple-950/40"
          >
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(56,189,248,0.10))',
              }}
            />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-400 to-sky-400" />

            <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-xs font-semibold text-purple-200 mb-4">
                  <Crown className="w-3.5 h-3.5 text-purple-300" />
                  <span>Best Value</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mb-3">
                  {FULL_PACKAGE.name}
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  {FULL_PACKAGE.description}
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FULL_PACKAGE.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-purple-300 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-black/30 border border-white/10 p-8 text-center">
                <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                  One-time price
                </div>
                <div className="flex items-end justify-center gap-2 mb-1">
                  <span className="text-5xl font-extrabold text-white">৳{FULL_PACKAGE.price}</span>
                </div>
                {savings > 0 && (
                  <div className="text-sm text-emerald-400 font-semibold mb-6">
                    Save ৳{savings} vs buying separately
                  </div>
                )}

                <button
                  onClick={onOpenPlayModal}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-lg shadow-purple-950/50 transition-all active:scale-95"
                >
                  <span>Get the Full Package</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CommunityCTA onOpenPlayModal={onOpenPlayModal} />
    </div>
  );
};
