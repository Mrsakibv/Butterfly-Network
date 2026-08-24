import React, { useState } from 'react';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from './CopyIpButton';
import { useRouter } from '../hooks/useRouter';
import { Monitor, Smartphone, Check, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const HowToJoinSection: React.FC = () => {
  const [platform, setPlatform] = useState<'java' | 'bedrock'>('java');
  const { navigate } = useRouter();

  return (
    <section id="how-to-join" className="py-20 relative overflow-hidden">
      {/* Glow orb */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Get Connected In Seconds</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
            How to Join Butterfly Network
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Follow three simple steps to dive right into the action. Supporting both Java and Bedrock cross-play.
          </p>

          {/* Platform toggle */}
          <div className="inline-flex p-1 bg-white/[0.04] border border-white/10 rounded-xl mt-4">
            <button
              onClick={() => setPlatform('java')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                platform === 'java'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Java Edition (PC / Mac)</span>
            </button>
            <button
              onClick={() => setPlatform('bedrock')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                platform === 'bedrock'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Bedrock Edition (Mobile/Console)</span>
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* STEP 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-panel rounded-2xl p-6 border relative flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-heading font-extrabold text-purple-300 text-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                STEP 1: Open Minecraft
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {platform === 'java'
                  ? 'Launch your favorite Minecraft Java Client (Vanilla, Lunar, Badlion, Prism, or Feather). Any version 1.8.9 through 1.21.x works seamlessly.'
                  : 'Open Minecraft on your smartphone, tablet, Windows 10/11 edition, or console.'}
              </p>
            </div>
            <div className="pt-6 border-t border-white/[0.06] flex items-center gap-2 text-xs text-purple-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Ready in standard launcher</span>
            </div>
          </motion.div>

          {/* STEP 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-panel rounded-2xl p-6 border relative flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center font-heading font-extrabold text-violet-300 text-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                STEP 2: Add a new server
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {platform === 'java'
                  ? 'Navigate to Multiplayer, select "Add Server", and name it "Butterfly Network". Enter the server address below.'
                  : 'Click "Play", switch to the "Servers" tab, scroll down and choose "Add Server".'}
              </p>
            </div>
            <div className="pt-6 border-t border-white/[0.06] space-y-2">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-purple-200 flex justify-between items-center">
                <span>{platform === 'java' ? SERVER_CONFIG.javaIp : SERVER_CONFIG.bedrockIp}</span>
                <span className="text-[11px] text-slate-500">Port: {SERVER_CONFIG.bedrockPort}</span>
              </div>
            </div>
          </motion.div>

          {/* STEP 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="glass-panel rounded-2xl p-6 border border-purple-500/40 relative flex flex-col justify-between shadow-xl shadow-purple-950/40"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center font-heading font-extrabold text-sky-300 text-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                STEP 3: Join Butterfly Network
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Click "Done", select Butterfly Network from your server list, and hit "Join Server". Welcome to your next adventure!
              </p>
            </div>

            <div className="pt-6 border-t border-white/[0.06]">
              <CopyIpButton
                ip={platform === 'java' ? SERVER_CONFIG.javaIp : SERVER_CONFIG.bedrockIp}
                label={platform === 'java' ? 'Copy Java IP' : 'Copy Bedrock IP'}
                variant="primary"
                className="w-full py-2.5 text-sm"
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-purple-400 shrink-0" />
            <span>Having connection issues or console port questions?</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/how-to-play')}
              className="text-purple-300 hover:text-purple-200 font-semibold inline-flex items-center gap-1"
            >
              <span>Full Interactive Guide</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={SERVER_CONFIG.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white underline underline-offset-4"
            >
              Ask on Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
