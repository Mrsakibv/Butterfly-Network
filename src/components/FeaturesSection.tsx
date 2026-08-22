import React from 'react';
import { SERVER_FEATURES } from '../data/features';
import { 
  Cpu, 
  Zap, 
  Users, 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  Flame, 
  HeartHandshake 
} from 'lucide-react';
import { motion } from 'motion/react';

export const FeaturesSection: React.FC = () => {
  const getIcon = (name: string) => {
    const props = { className: 'w-6 h-6' };
    switch (name) {
      case 'Cpu': return <Cpu {...props} className="text-purple-400" />;
      case 'Zap': return <Zap {...props} className="text-cyan-400" />;
      case 'Users': return <Users {...props} className="text-indigo-400" />;
      case 'Scale': return <Scale {...props} className="text-emerald-400" />;
      case 'ShieldCheck': return <ShieldCheck {...props} className="text-amber-400" />;
      case 'Sparkles': return <Sparkles {...props} className="text-pink-400" />;
      case 'Flame': return <Flame {...props} className="text-violet-400" />;
      case 'HeartHandshake': return <HeartHandshake {...props} className="text-sky-400" />;
      default: return <Sparkles {...props} className="text-purple-400" />;
    }
  };

  return (
    <section id="features" className="py-20 relative bg-black/20">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Engineered for Excellence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
            Why Butterfly Network?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            We built Butterfly Network from the ground up to eliminate lag, prevent cheating, and provide a welcoming, balanced home for all Minecraft enthusiasts.
          </p>
        </div>

        {/* 8 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVER_FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="glass-panel-interactive rounded-2xl p-6 border flex flex-col justify-start gap-4 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                {getIcon(feature.iconName)}
              </div>

              {/* Title & Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-heading tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
