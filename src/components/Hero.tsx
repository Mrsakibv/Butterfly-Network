import React, { useEffect, useMemo, useState } from 'react';
import {
  SERVER_CONFIG,
  DEFAULT_HERO_SETTINGS,
  getMergedHeroSettings,
} from '../config/server';
import { supabase } from '../lib/supabase';
import { ServerStatusWidget } from './ServerStatusWidget';
import {
  Play,
  ExternalLink,
  Shield,
  Swords,
  Layers,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onOpenPlayModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenPlayModal,
}) => {
  const [heroSettings, setHeroSettings] = useState(
    DEFAULT_HERO_SETTINGS
  );

  const [descriptionExpanded, setDescriptionExpanded] =
    useState(false);

  /* ============================================================
     DATABASE CONNECTION
     UNCHANGED
  ============================================================ */

  useEffect(() => {
    const loadHeroSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', true)
        .single();

      if (!error && data) {
        const merged = getMergedHeroSettings({
          kicker: data.hero_kicker,
          kickerVersion: data.hero_kicker_version,
          titlePrefix: data.hero_title_prefix,
          titleMain: data.hero_title_main,
          subtitle: data.hero_subtitle,
          description: data.hero_description,
          backgroundImage:
            data.hero_background_image_url,
        });

        setHeroSettings(merged);
      }
    };

    loadHeroSettings();
  }, []);

  /* ============================================================
     BACKGROUND
  ============================================================ */

  const heroBackground = useMemo(() => {
    if (!heroSettings.backgroundImage) {
      return undefined;
    }

    return {
      backgroundImage: `url(${heroSettings.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
    } as React.CSSProperties;
  }, [heroSettings.backgroundImage]);

  /* ============================================================
     DESCRIPTION
  ============================================================ */

  const words = heroSettings.description.split(' ');

  const descriptionPreview = words
    .slice(0, 12)
    .join(' ');

  const shouldShowMore = words.length > 12;

  return (
    <section
      id="hero"
      className="relative min-h-[780px] overflow-hidden bg-[#03050d] pt-24 sm:min-h-[820px] lg:min-h-[900px]"
      style={heroBackground}
    >
      {/* ========================================================
          BACKGROUND OVERLAY
      ======================================================== */}

      <div className="pointer-events-none absolute inset-0">
        {/* Main dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#03050d]/95 via-[#050817]/75 to-[#050817]/20" />

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#03050d] via-[#03050d]/70 to-transparent" />

        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#02030a]/70 to-transparent" />

        {/* Purple atmosphere */}
        <div className="absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[130px]" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,.38)_100%)]" />
      </div>

      {/* ========================================================
          SUBTLE FLOATING LIGHTS
      ======================================================== */}

      <motion.div
        animate={{
          opacity: [0.25, 0.7, 0.25],
          scale: [0.9, 1.15, 0.9],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute right-[20%] top-[24%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_25px_8px_rgba(34,211,238,.35)]"
      />

      <motion.div
        animate={{
          y: [0, -10, 0],
          opacity: [0.2, 0.55, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute right-[9%] top-[42%] h-1.5 w-1.5 rounded-full bg-purple-300 shadow-[0_0_25px_8px_rgba(168,85,247,.35)]"
      />

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <div className="relative z-10 mx-auto flex min-h-[780px] max-w-7xl items-center px-4 pb-20 pt-16 sm:px-6 lg:min-h-[900px] lg:px-8">
        <div className="w-full">

          {/* ====================================================
              KICKER
          ==================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.55,
            }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-[#080b18]/65 px-4 py-2 shadow-[0_0_25px_rgba(139,92,246,.08)] backdrop-blur-xl"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-400">
              <Sparkles className="h-3 w-3 text-white" />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/90 sm:text-xs">
              {heroSettings.kicker}
            </span>

            <span className="text-purple-400">
              •
            </span>

            <span className="text-[10px] font-bold text-purple-300 sm:text-xs">
              {heroSettings.kickerVersion}
            </span>
          </motion.div>

          {/* ====================================================
              HERO CONTENT
              NO RIGHT SIDE BLOCK
          ==================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.1,
            }}
            className="max-w-3xl"
          >
            {/* ==================================================
                TITLE
            ================================================== */}

            <h1 className="text-[50px] font-black leading-[0.94] tracking-[-0.045em] text-white sm:text-[68px] lg:text-[82px] xl:text-[92px]">
              {heroSettings.titlePrefix}

              <span className="mt-1 block bg-gradient-to-r from-white via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                {heroSettings.titleMain}
              </span>
            </h1>

            {/* ==================================================
                SUBTITLE
            ================================================== */}

            <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-white/90 sm:text-2xl">
              {heroSettings.subtitle}
            </p>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <div className="mt-5 max-w-2xl">
              <p className="text-sm leading-7 text-slate-300 sm:text-base">
                {descriptionExpanded
                  ? heroSettings.description
                  : descriptionPreview}

                {shouldShowMore &&
                  !descriptionExpanded &&
                  '...'}

                {shouldShowMore && (
                  <button
                    type="button"
                    onClick={() =>
                      setDescriptionExpanded(
                        !descriptionExpanded
                      )
                    }
                    className="ml-2 inline-flex items-center gap-1 font-bold text-purple-300 transition hover:text-cyan-300"
                  >
                    {descriptionExpanded
                      ? 'Show Less'
                      : 'Show More'}

                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        descriptionExpanded
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>
                )}
              </p>
            </div>

            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div className="mt-8 flex flex-wrap items-center gap-3">

              {/* PLAY NOW */}

              <button
                type="button"
                onClick={onOpenPlayModal}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-400 px-6 py-3.5 text-sm font-black text-white shadow-[0_0_35px_rgba(139,92,246,.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(139,92,246,.5)] sm:px-7 sm:py-4 sm:text-base"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <Play className="h-3.5 w-3.5 fill-white" />
                </span>

                <span className="relative">
                  Play Now
                </span>

                <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              {/* DISCORD */}

              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3.5 text-sm font-bold text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:bg-purple-500/10 sm:px-6 sm:py-4"
              >
                <img
                  src="/discord.svg"
                  alt="Discord"
                  className="h-5 w-5 object-contain transition-transform duration-300 group-hover:scale-110"
                />

                <span>
                  Join Discord
                </span>

                <ExternalLink className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:translate-x-0.5" />
              </a>

              {/* EXPLORE MODES */}

              <button
                type="button"
                onClick={() =>
                  window.location.assign('/games')
                }
                className="group inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-slate-300 transition hover:text-white"
              >
                <span>
                  Explore Modes
                </span>

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* ==================================================
                HIGHLIGHTS
            ================================================== */}

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4 border-t border-white/10 pt-6">

              {/* ANTI CHEAT */}

              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10">
                  <Shield
                    className="h-4 w-4 text-purple-300"
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Custom Anti-Cheat
                </span>
              </div>

              {/* GAME MODES */}

              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                  <Swords
                    className="h-4 w-4 text-cyan-300"
                    strokeWidth={2}
                  />
                </span>

                <span>
                  3 Unique Game Modes
                </span>
              </div>

              {/* CROSSPLAY */}

              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                  <Layers
                    className="h-4 w-4 text-fuchsia-300"
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Java &amp; Bedrock Crossplay
                </span>
              </div>
            </div>
          </motion.div>

          {/* ====================================================
              SERVER STATUS
              UNCHANGED
          ==================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              delay: 0.35,
            }}
            className="mt-10 max-w-5xl lg:mt-14"
          >
            <ServerStatusWidget />
          </motion.div>
        </div>
      </div>

      {/* ========================================================
          SCROLL INDICATOR
      ======================================================== */}

      <motion.div
        animate={{
          y: [0, 8, 0],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
          Scroll Down
        </span>

        <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 p-1">
          <span className="h-1.5 w-1 rounded-full bg-purple-300" />
        </div>
      </motion.div>
    </section>
  );
};