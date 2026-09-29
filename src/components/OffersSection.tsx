import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  Timer,
  ExternalLink,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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

/* ============================================================
   COUNTDOWN
============================================================ */

function useCountdown(endDate: string | null): TimeLeft {
  const calc = (): TimeLeft => {
    if (!endDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
      };
    }

    const diff = new Date(endDate).getTime() - Date.now();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true,
      };
    }

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

    const id = setInterval(() => {
      setTimeLeft(calc());
    }, 1000);

    return () => clearInterval(id);
  }, [endDate]);

  return timeLeft;
}

/* ============================================================
   THEME
============================================================ */

const bgStyles: Record<
  string,
  {
    border: string;
    glow: string;
    accent: string;
    button: string;
    badge: string;
  }
> = {
  purple: {
    border: 'border-purple-500/30',
    glow: 'bg-purple-600/30',
    accent: 'text-purple-300',
    button:
      'from-purple-500 via-fuchsia-500 to-purple-600 hover:shadow-purple-500/40',
    badge:
      'border-purple-400/30 bg-purple-500/15 text-purple-200',
  },

  blue: {
    border: 'border-cyan-500/30',
    glow: 'bg-cyan-500/25',
    accent: 'text-cyan-300',
    button:
      'from-cyan-400 via-blue-500 to-indigo-600 hover:shadow-cyan-500/40',
    badge:
      'border-cyan-400/30 bg-cyan-500/15 text-cyan-200',
  },

  green: {
    border: 'border-emerald-500/30',
    glow: 'bg-emerald-500/25',
    accent: 'text-emerald-300',
    button:
      'from-emerald-400 via-green-500 to-teal-600 hover:shadow-emerald-500/40',
    badge:
      'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  },

  red: {
    border: 'border-red-500/30',
    glow: 'bg-red-500/25',
    accent: 'text-red-300',
    button:
      'from-red-400 via-rose-500 to-red-600 hover:shadow-red-500/40',
    badge:
      'border-red-400/30 bg-red-500/15 text-red-200',
  },

  gold: {
    border: 'border-yellow-500/30',
    glow: 'bg-yellow-500/25',
    accent: 'text-yellow-300',
    button:
      'from-yellow-300 via-amber-500 to-orange-500 hover:shadow-yellow-500/40',
    badge:
      'border-yellow-400/30 bg-yellow-500/15 text-yellow-200',
  },

  dark: {
    border: 'border-slate-500/30',
    glow: 'bg-slate-500/20',
    accent: 'text-slate-300',
    button:
      'from-slate-300 via-slate-400 to-slate-600 hover:shadow-slate-400/30',
    badge:
      'border-slate-400/30 bg-slate-500/15 text-slate-200',
  },
};

/* ============================================================
   COUNTDOWN BOX
============================================================ */

function CountdownBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex min-w-[48px] flex-col items-center sm:min-w-[54px]">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 px-2.5 py-2 backdrop-blur-md sm:px-3 sm:py-2.5">
        <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

        <span className="relative text-lg font-black tabular-nums text-white sm:text-2xl">
          {String(value).padStart(2, '0')}
        </span>
      </div>

      <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.15em] text-slate-500 sm:text-[9px]">
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   OFFER CARD
============================================================ */

function OfferCard({
  offer,
}: {
  offer: Offer;
}) {
  const style =
    bgStyles[offer.bg_style] ?? bgStyles.purple;

  const timeLeft = useCountdown(
    offer.timer_enabled ? offer.timer_end_date : null
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 35, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -35, scale: 0.98 }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
      }}
      className={`group relative overflow-hidden rounded-[28px] border ${style.border} bg-[#050914] shadow-2xl`}
    >
      {/* ==================================================
          AMBIENT BACKGROUND
      ================================================== */}

      <div
        className={`pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full ${style.glow} blur-[120px]`}
      />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[120px]" />

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      {/* Top glowing line */}
      <div className="absolute left-[8%] right-[8%] top-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80" />

      <div
        className={`relative z-10 ${
          offer.image_url
            ? 'grid lg:grid-cols-[1.02fr_0.98fr]'
            : ''
        }`}
      >
        {/* ==================================================
            CONTENT
        ================================================== */}

        <div className="relative flex min-h-[430px] flex-col justify-center p-6 sm:p-9 lg:p-12">
          {/* Network label */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">
                Butterfly Network
              </span>
            </div>
          </div>

          {/* Badge */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {offer.badge_text && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur-md ${style.badge}`}
              >
                <Zap className="h-3 w-3" />
                {offer.badge_text}
              </span>
            )}

            {offer.subtitle && (
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] ${style.accent}`}
              >
                {offer.subtitle}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-[48px]">
            {offer.title}
          </h3>

          {/* Accent */}
          <div className="mt-5 flex items-center gap-2">
            <div className="h-1 w-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" />
            <div className="h-1 w-2 rounded-full bg-white/40" />
            <div className="h-1 w-2 rounded-full bg-white/20" />
          </div>

          {/* Description */}
          {offer.description && (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {offer.description}
            </p>
          )}

          {/* Features */}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Sparkles
                className={`h-4 w-4 ${style.accent}`}
              />
              New Features
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Zap
                className={`h-4 w-4 ${style.accent}`}
              />
              Special Rewards
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Megaphone
                className={`h-4 w-4 ${style.accent}`}
              />
              Live Update
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            {/* Button */}
            {offer.button_text && offer.button_url && (
              <a
                href={offer.button_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group/button inline-flex w-fit items-center gap-3 rounded-2xl bg-gradient-to-r ${style.button} px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl`}
              >
                <span>{offer.button_text}</span>

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-0.5" />
                </span>
              </a>
            )}

            {/* Countdown */}
            {offer.timer_enabled && (
              <div className="w-fit rounded-2xl border border-white/10 bg-black/25 p-3.5 backdrop-blur-xl">
                <div className="mb-2 flex items-center gap-1.5">
                  <Timer
                    className={`h-3.5 w-3.5 ${style.accent}`}
                  />

                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.18em] ${style.accent}`}
                  >
                    {timeLeft.expired
                      ? 'Offer Ended'
                      : 'Event Ends In'}
                  </span>
                </div>

                {timeLeft.expired ? (
                  <span className="text-sm font-bold text-red-400">
                    This offer has expired
                  </span>
                ) : (
                  <div className="flex items-end gap-1 sm:gap-1.5">
                    <CountdownBox
                      value={timeLeft.days}
                      label="Days"
                    />

                    <span className="mb-4 text-lg font-black text-white/40">
                      :
                    </span>

                    <CountdownBox
                      value={timeLeft.hours}
                      label="Hours"
                    />

                    <span className="mb-4 text-lg font-black text-white/40">
                      :
                    </span>

                    <CountdownBox
                      value={timeLeft.minutes}
                      label="Mins"
                    />

                    <span className="mb-4 text-lg font-black text-white/40">
                      :
                    </span>

                    <CountdownBox
                      value={timeLeft.seconds}
                      label="Secs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            IMAGE
        ================================================== */}

        {offer.image_url && (
          <div className="relative min-h-[300px] overflow-hidden lg:min-h-[500px]">
            <img
              src={offer.image_url}
              alt={offer.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
            />

            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050914] via-[#050914]/30 to-transparent lg:from-[#050914] lg:via-[#050914]/10 lg:to-transparent" />

            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050914] to-transparent lg:hidden" />

            {/* Purple overlay */}
            <div className="pointer-events-none absolute inset-0 bg-purple-700/10 mix-blend-screen" />

            {/* Frame */}
            <div className="absolute inset-5 rounded-[22px] border border-white/10" />

            {/* Floating light */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute right-8 top-8 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,.9)]"
            />

            {/* Live label */}
            <div className="absolute bottom-8 right-8 hidden rounded-xl border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-xl sm:block">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />

                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
                  Live Event
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom highlight */}
      <div className="absolute bottom-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
    </motion.div>
  );
}

/* ============================================================
   OFFERS SECTION
   DATABASE LOGIC SAME
   AUTOMATIC SLIDER ADDED
============================================================ */

export const OffersSection: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
     SLIDER STATE
  ========================================================== */

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  /* ==========================================================
     LOAD DATABASE
  ========================================================== */

  useEffect(() => {
    const load = async () => {
      try {
        /* ====================================================
           1. PRIMARY SOURCE
           site_page_items
        ==================================================== */

        const { data: pageItems, error: pageError } =
          await supabase
            .from('site_page_items')
            .select('*')
            .eq('page_key', 'offers')
            .eq('is_visible', true)
            .order('sort_order', {
              ascending: true,
            });

        if (
          !pageError &&
          pageItems &&
          pageItems.length > 0
        ) {
          const mapped: Offer[] = pageItems.map((item) => ({
            id: item.id,
            title: item.title || '',
            subtitle: item.subtitle || '',
            description: item.description || '',
            image_url: item.image_url || null,

            button_text:
              item.extra?.button_text ||
              item.extra?.buttonText ||
              null,

            button_url:
              item.link_url ||
              item.extra?.button_url ||
              null,

            badge_text:
              item.extra?.badge_text ||
              item.extra?.badgeText ||
              item.extra?.badge ||
              null,

            badge_color:
              item.extra?.badge_color ||
              item.extra?.badgeColor ||
              'purple',

            bg_style:
              item.extra?.bg_style ||
              item.extra?.bgStyle ||
              'purple',

            timer_enabled:
              item.extra?.timer_enabled === true ||
              item.extra?.timer_enabled === 'true',

            timer_end_date:
              item.extra?.timer_end_date ||
              item.extra?.timerEndDate ||
              null,

            is_active: item.is_visible,

            sort_order: item.sort_order || 0,
          }));

          setOffers(mapped);
          setActiveIndex(0);

          return;
        }

        /* ====================================================
           2. FALLBACK
           offers table
        ==================================================== */

        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', {
            ascending: true,
          });

        if (!error && data && data.length > 0) {
          setOffers(data);
          setActiveIndex(0);
        } else {
          setOffers([]);
        }
      } catch (err) {
        console.error(
          'OffersSection load error:',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ==========================================================
     AUTOMATIC SLIDE
     5 SECONDS
  ========================================================== */

  useEffect(() => {
    if (offers.length <= 1 || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex((current) =>
        current >= offers.length - 1
          ? 0
          : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [offers.length, isPaused]);

  /* ==========================================================
     PREVIOUS
  ========================================================== */

  const goPrevious = () => {
    setActiveIndex((current) =>
      current <= 0
        ? offers.length - 1
        : current - 1
    );
  };

  /* ==========================================================
     NEXT
  ========================================================== */

  const goNext = () => {
    setActiveIndex((current) =>
      current >= offers.length - 1
        ? 0
        : current + 1
    );
  };

  /* ==========================================================
     LOADING / EMPTY
  ========================================================== */

  if (loading || offers.length === 0) {
    return null;
  }

  const activeOffer = offers[activeIndex];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      {/* ====================================================
          BACKGROUND
      ==================================================== */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute bottom-20 right-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
          }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
            <Megaphone className="h-3.5 w-3.5" />

            Offers & Announcements
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Latest{' '}
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Updates
            </span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Discover the latest events, special offers
            and important updates from Butterfly Network.
          </p>
        </motion.div>

        {/* ==================================================
            SLIDER
        ================================================== */}

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* LEFT ARROW */}

          {offers.length > 1 && (
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous announcement"
              className="absolute left-2 top-1/2 z-30 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white shadow-xl backdrop-blur-xl transition-all hover:scale-110 hover:bg-purple-600/70 sm:flex lg:-left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* RIGHT ARROW */}

          {offers.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next announcement"
              className="absolute right-2 top-1/2 z-30 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white shadow-xl backdrop-blur-xl transition-all hover:scale-110 hover:bg-purple-600/70 sm:flex lg:-right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* ACTIVE CARD */}

          <AnimatePresence mode="wait">
            <OfferCard
              key={activeOffer.id}
              offer={activeOffer}
            />
          </AnimatePresence>

          {/* ==================================================
              MOBILE ARROWS
          ================================================== */}

          {offers.length > 1 && (
            <div className="mt-4 flex justify-center gap-3 sm:hidden">
              <button
                type="button"
                onClick={goPrevious}
                aria-label="Previous announcement"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition hover:bg-purple-500/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={goNext}
                aria-label="Next announcement"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition hover:bg-purple-500/30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ==================================================
              DOTS
          ================================================== */}

          {offers.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {offers.map((offer, index) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to announcement ${index + 1}`}
                  className="group p-1"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ${
                      activeIndex === index
                        ? 'w-8 bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(168,85,247,.6)]'
                        : 'w-2 bg-white/20 group-hover:bg-white/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* ==================================================
              SLIDER STATUS
          ================================================== */}

          {offers.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPaused
                    ? 'bg-yellow-400'
                    : 'animate-pulse bg-emerald-400'
                }`}
              />

              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                {isPaused
                  ? 'Slider Paused'
                  : 'Auto Playing'}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};