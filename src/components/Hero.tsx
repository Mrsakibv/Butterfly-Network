import React, { useEffect, useMemo, useState } from 'react';
import { SERVER_CONFIG, DEFAULT_HERO_SETTINGS, getMergedHeroSettings } from '../config/server';
import { supabase } from '../lib/supabase';
import { ServerStatusWidget } from './ServerStatusWidget';
import { Play, Disc as DiscordIcon, ExternalLink, Shield, Swords, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onOpenPlayModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenPlayModal }) => {
  const [heroSettings, setHeroSettings] = useState(DEFAULT_HERO_SETTINGS);

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
          backgroundImage: data.hero_background_image_url,
        });

        setHeroSettings(merged);
      }
    };

    loadHeroSettings();
  }, []);

  const heroBackground = useMemo(() => {
    if (!heroSettings.backgroundImage) return undefined;
    return { backgroundImage: `url(${heroSettings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } as React.CSSProperties;
  }, [heroSettings.backgroundImage]);

  return (
    <section
      id="hero"
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden pt-28 pb-10 radial-gradient-hero"
      style={heroBackground}
    >
      <div className="hero-copy-backdrop" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hero-shell">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="hero-copy"
          >
            <div className="hero-kicker-wrap">
              <span className="hero-kicker-icon">✦</span>
              <p className="hero-kicker">{heroSettings.kicker}</p>
              <span className="hero-kicker-separator">•</span>
              <span className="hero-kicker-version">{heroSettings.kickerVersion}</span>
            </div>

            <h1 className="hero-title">
              {heroSettings.titlePrefix}
              <span>{heroSettings.titleMain}</span>
            </h1>

            <p className="hero-subtitle">{heroSettings.subtitle}</p>

            <p className="hero-description">
              {heroSettings.description}
            </p>

            <div className="hero-actions">
              <button
                onClick={onOpenPlayModal}
                className="hero-button hero-button-primary"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Play Now</span>
              </button>

              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="hero-button hero-button-secondary"
              >
                <DiscordIcon className="h-5 w-5 text-purple-300" />
                <span>Join Discord</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>

              <button
                onClick={() => window.location.assign('/games')}
                className="hero-link-button"
              >
                <span>Explore Modes</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="hero-highlights">
              <div className="hero-highlight-item">
                <Shield className="hero-highlight-icon" size={16} strokeWidth={2.2} />
                <span>Custom Anti-Cheat</span>
              </div>
              <div className="hero-highlight-item">
                <Swords className="hero-highlight-icon" size={16} strokeWidth={2.2} />
                <span>6 Unique Game Modes</span>
              </div>
              <div className="hero-highlight-item">
                <Layers className="hero-highlight-icon" size={16} strokeWidth={2.2} />
                <span>Java &amp; Bedrock Crossplay</span>
              </div>
            </div>
          </motion.div>

        </div>

        <div className="mt-6">
          <ServerStatusWidget />
        </div>
      </div>
    </section>
  );
};
