import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Timer, ExternalLink, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  bg_style: string;
  timer_enabled: boolean;
  timer_end_date: string | null;
  is_active: boolean;
  sort_order: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function useCountdown(endDate: string | null): TimeLeft {
  const calc = (): TimeLeft => {
    if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false };
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc);

  useEffect(() => {
    if (!endDate) return;
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return timeLeft;
}

const bgStyles: Record<string, { card: string; glow: string; accent: string }> = {
  purple: { card: 'from-purple-900/40 to-violet-900/40 border-purple-500/30', glow: 'bg-purple-600/20', accent: 'text-purple-300' },
  blue:   { card: 'from-blue-900/40 to-cyan-900/40 border-blue-500/30',       glow: 'bg-blue-600/20',   accent: 'text-blue-300'   },
  green:  { card: 'from-emerald-900/40 to-teal-900/40 border-emerald-500/30', glow: 'bg-emerald-600/20',accent: 'text-emerald-300'},
  red:    { card: 'from-red-900/40 to-rose-900/40 border-red-500/30',         glow: 'bg-red-600/20',    accent: 'text-red-300'    },
  gold:   { card: 'from-yellow-900/40 to-amber-900/40 border-yellow-500/30',  glow: 'bg-yellow-600/20', accent: 'text-yellow-300' },
  dark:   { card: 'from-slate-900/60 to-slate-800/40 border-slate-500/30',    glow: 'bg-slate-600/20',  accent: 'text-slate-300'  },
};

const badgeColors: Record<string, string> = {
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  red:    'bg-red-500/20 text-red-300 border-red-500/40',
  green:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  blue:   'bg-blue-500/20 text-blue-300 border-blue-500/40',
  yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
};

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 min-w-[52px] text-center">
        <span className="text-2xl font-black text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">{label}</span>
    </div>
  );
}

function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const style = bgStyles[offer.bg_style] ?? bgStyles.purple;
  const timeLeft = useCountdown(offer.timer_enabled ? offer.timer_end_date : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${style.card} backdrop-blur-sm`}
    >
      {/* Background glow */}
      <div className={`pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full ${style.glow} blur-[80px]`} />

      <div className={`relative z-10 ${offer.image_url ? 'grid lg:grid-cols-2 gap-0' : ''}`}>
        {/* Text side */}
        <div className={`p-6 sm:p-8 lg:p-10 flex flex-col justify-center ${!offer.image_url ? 'items-center text-center' : ''}`}>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {offer.badge_text && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border ${badgeColors[offer.badge_color ?? 'purple'] ?? badgeColors.purple}`}>
                <Zap className="w-3 h-3" />
                {offer.badge_text}
              </span>
            )}
            {offer.subtitle && (
              <span className={`text-xs font-semibold uppercase tracking-widest ${style.accent}`}>
                {offer.subtitle}
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
            {offer.title}
          </h3>

          {offer.description && (
            <p className="text-sm sm:text-base text-slate-300 leading-7 mb-6 max-w-xl">
              {offer.description}
            </p>
          )}

          {/* Countdown Timer */}
          {offer.timer_enabled && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <Timer className={`w-4 h-4 ${style.accent}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${style.accent}`}>
                  {timeLeft.expired ? 'Offer Ended' : 'Ends In'}
                </span>
              </div>
              {timeLeft.expired ? (
                <span className="text-sm font-bold text-red-400">This offer has expired</span>
              ) : (
                <div className="flex items-end gap-2">
                  <CountdownBox value={timeLeft.days} label="Days" />
                  <span className="text-2xl font-black text-white mb-3">:</span>
                  <CountdownBox value={timeLeft.hours} label="Hours" />
                  <span className="text-2xl font-black text-white mb-3">:</span>
                  <CountdownBox value={timeLeft.minutes} label="Mins" />
                  <span className="text-2xl font-black text-white mb-3">:</span>
                  <CountdownBox value={timeLeft.seconds} label="Secs" />
                </div>
              )}
            </div>
          )}

          {/* CTA Button */}
          {offer.button_text && offer.button_url && (
            <a
              href={offer.button_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition-all hover:scale-[1.03] hover:shadow-lg shadow-md"
            >
              {offer.button_text}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Image side */}
        {offer.image_url && (
          <div className="relative min-h-[240px] lg:min-h-0 overflow-hidden">
            <img
              src={offer.image_url}
              alt={offer.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 lg:from-black/40 to-transparent" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const OffersSection: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Fetch from site_page_items (primary store)
        const { data: pageItems, error: pageError } = await supabase
          .from('site_page_items')
          .select('*')
          .eq('page_key', 'offers')
          .eq('is_visible', true)
          .order('sort_order', { ascending: true });

        if (!pageError && pageItems && pageItems.length > 0) {
          const mapped: Offer[] = pageItems.map((item) => ({
            id: item.id,
            title: item.title || '',
            subtitle: item.subtitle || '',
            description: item.description || '',
            image_url: item.image_url || null,
            button_text: item.extra?.button_text || item.extra?.buttonText || null,
            button_url: item.link_url || item.extra?.button_url || null,
            badge_text: item.extra?.badge_text || item.extra?.badgeText || item.extra?.badge || null,
            badge_color: item.extra?.badge_color || item.extra?.badgeColor || 'purple',
            bg_style: item.extra?.bg_style || item.extra?.bgStyle || 'purple',
            timer_enabled: item.extra?.timer_enabled === true || item.extra?.timer_enabled === 'true',
            timer_end_date: item.extra?.timer_end_date || item.extra?.timerEndDate || null,
            is_active: item.is_visible,
            sort_order: item.sort_order || 0,
          }));
          setOffers(mapped);
          return;
        }

        // 2. Fallback to offers table if exists
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setOffers(data);
        } else {
          setOffers([]);
        }
      } catch (err) {
        console.error('OffersSection load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || offers.length === 0) return null;

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Offers & Announcements</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Special Offers
          </h2>
        </motion.div>

        {/* Offer cards */}
        <div className="space-y-6">
          {offers.map((offer, i) => (
            <OfferCard key={offer.id} offer={offer} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
