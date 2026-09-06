import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Crown,
  KeyRound,
  Package,
  Coins,
  Check,
  ShoppingCart,
  Sparkles,
  Star,
  ShieldCheck,
  MessageCircle,
  X,
} from 'lucide-react';
import { useRouter } from '../hooks/useRouter';

type Category = 'ranks' | 'keys' | 'crates' | 'golds';

interface StoreItem {
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  popular?: boolean;
  features: string[];
}

/* =========================================================
   DISCORD
========================================================= */

const DISCORD_LINK = 'https://discord.gg/3NbC8xj2B';

/* =========================================================
   STORE ITEMS
========================================================= */

const storeData: Record<Category, StoreItem[]> = {
  /* =======================================================
     RANKS
  ======================================================= */

  ranks: [
    {
      name: 'Diamond',
      price: 199,
      description: 'A powerful premium rank for dedicated players.',
      icon: <Crown className="w-7 h-7" />,
      features: [
        'Diamond rank prefix',
        'Exclusive cosmetics',
        'Special chat color',
      ],
    },

    {
      name: 'Master',
      price: 299,
      description: 'Step above the ordinary player experience.',
      icon: <Crown className="w-7 h-7" />,
      features: [
        'Master rank prefix',
        'Exclusive commands',
        'Premium cosmetics',
      ],
    },

    {
      name: 'VIP',
      price: 99,
      description: 'A perfect starting premium rank.',
      icon: <Star className="w-7 h-7" />,
      popular: true,
      badge: 'POPULAR',
      features: [
        'VIP rank prefix',
        'VIP cosmetics',
        'Special chat features',
      ],
    },

    {
      name: 'VIP+',
      price: 149,
      description: 'Everything you love about VIP, upgraded.',
      icon: <Star className="w-7 h-7" />,
      features: [
        'VIP+ rank prefix',
        'Extra cosmetics',
        'Additional commands',
      ],
    },

    {
      name: 'PVP',
      price: 249,
      description: 'Built for players who love combat.',
      icon: <Sparkles className="w-7 h-7" />,
      features: [
        'PVP rank prefix',
        'Combat cosmetics',
        'PVP perks',
      ],
    },

    {
      name: 'PVP+',
      price: 349,
      description: 'An upgraded experience for PVP players.',
      icon: <Sparkles className="w-7 h-7" />,
      features: [
        'PVP+ rank prefix',
        'Advanced PVP perks',
        'Exclusive effects',
      ],
    },

    {
      name: 'Ultimate Master',
      price: 499,
      description: 'For players who want an elite experience.',
      icon: <Crown className="w-7 h-7" />,
      badge: 'ELITE',
      features: [
        'Ultimate Master prefix',
        'Elite cosmetics',
        'Premium commands',
      ],
    },

    {
      name: 'Grand Master',
      price: 699,
      description: 'The ultimate rank for Butterfly Network.',
      icon: <Crown className="w-7 h-7" />,
      badge: 'ULTIMATE',
      features: [
        'Grand Master prefix',
        'Exclusive cosmetics',
        'Maximum rank perks',
      ],
    },
  ],

  /* =======================================================
     KEYS
  ======================================================= */

  keys: [
    {
      name: 'Common Key',
      price: 29,
      description: 'Open a common reward crate.',
      icon: <KeyRound className="w-7 h-7" />,
      features: [
        '1 Common Key',
        'Random rewards',
      ],
    },

    {
      name: 'Rare Key',
      price: 49,
      description: 'A key with better reward possibilities.',
      icon: <KeyRound className="w-7 h-7" />,
      features: [
        '1 Rare Key',
        'Rare rewards',
      ],
    },

    {
      name: 'Epic Key',
      price: 79,
      description: 'Unlock the Epic reward pool.',
      icon: <KeyRound className="w-7 h-7" />,
      popular: true,
      badge: 'POPULAR',
      features: [
        '1 Epic Key',
        'Epic rewards',
      ],
    },

    {
      name: 'Legendary Key',
      price: 129,
      description: 'A powerful key for legendary rewards.',
      icon: <KeyRound className="w-7 h-7" />,
      badge: 'RARE',
      features: [
        '1 Legendary Key',
        'Legendary rewards',
      ],
    },

    {
      name: 'Mythic Key',
      price: 179,
      description: 'Unlock the Mythic reward pool.',
      icon: <KeyRound className="w-7 h-7" />,
      features: [
        '1 Mythic Key',
        'Mythic rewards',
      ],
    },

    {
      name: 'Ultimate Key',
      price: 249,
      description: 'One of the most powerful keys available.',
      icon: <KeyRound className="w-7 h-7" />,
      badge: 'ULTIMATE',
      features: [
        '1 Ultimate Key',
        'Ultimate rewards',
      ],
    },
  ],

  /* =======================================================
     CRATES
  ======================================================= */

  crates: [
    {
      name: 'Common Crate',
      price: 39,
      description: 'A basic crate filled with useful rewards.',
      icon: <Package className="w-7 h-7" />,
      features: [
        '1 Common Crate',
        'Random rewards',
      ],
    },

    {
      name: 'Rare Crate',
      price: 69,
      description: 'Better rewards with higher rarity.',
      icon: <Package className="w-7 h-7" />,
      features: [
        '1 Rare Crate',
        'Rare reward pool',
      ],
    },

    {
      name: 'Epic Crate',
      price: 99,
      description: 'A crate packed with epic possibilities.',
      icon: <Package className="w-7 h-7" />,
      popular: true,
      badge: 'POPULAR',
      features: [
        '1 Epic Crate',
        'Epic reward pool',
      ],
    },

    {
      name: 'Legendary Crate',
      price: 159,
      description: 'High-tier rewards await inside.',
      icon: <Package className="w-7 h-7" />,
      features: [
        '1 Legendary Crate',
        'Legendary rewards',
      ],
    },

    {
      name: 'Mythic Crate',
      price: 199,
      description: 'A crate for players seeking something special.',
      icon: <Package className="w-7 h-7" />,
      badge: 'MYTHIC',
      features: [
        '1 Mythic Crate',
        'Mythic rewards',
      ],
    },

    {
      name: 'Ultimate Crate',
      price: 299,
      description: 'Premium rewards with ultimate rarity.',
      icon: <Package className="w-7 h-7" />,
      badge: 'ULTIMATE',
      features: [
        '1 Ultimate Crate',
        'Ultimate rewards',
      ],
    },

    {
      name: 'Grand Crate',
      price: 399,
      description: 'The highest level crate experience.',
      icon: <Package className="w-7 h-7" />,
      badge: 'GRAND',
      features: [
        '1 Grand Crate',
        'Grand reward pool',
      ],
    },
  ],

  /* =======================================================
     GOLDS
  ======================================================= */

  golds: [
    {
      name: '500 Gold',
      price: 49,
      description: 'A small boost to your in-game balance.',
      icon: <Coins className="w-7 h-7" />,
      features: [
        '500 Gold',
        'Instant delivery',
      ],
    },

    {
      name: '1,000 Gold',
      price: 89,
      description: 'More gold for your adventures.',
      icon: <Coins className="w-7 h-7" />,
      features: [
        '1,000 Gold',
        'Instant delivery',
      ],
    },

    {
      name: '2,500 Gold',
      price: 199,
      description: 'A bigger gold package for active players.',
      icon: <Coins className="w-7 h-7" />,
      popular: true,
      badge: 'POPULAR',
      features: [
        '2,500 Gold',
        'Instant delivery',
      ],
    },

    {
      name: '5,000 Gold',
      price: 349,
      description: 'A large package for serious players.',
      icon: <Coins className="w-7 h-7" />,
      features: [
        '5,000 Gold',
        'Instant delivery',
      ],
    },

    {
      name: '10,000 Gold',
      price: 599,
      description: 'The ultimate gold package.',
      icon: <Coins className="w-7 h-7" />,
      badge: 'BEST VALUE',
      features: [
        '10,000 Gold',
        'Instant delivery',
      ],
    },
  ],
};

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  {
    id: 'ranks' as Category,
    name: 'Ranks',
    icon: <Crown className="w-5 h-5" />,
  },

  {
    id: 'keys' as Category,
    name: 'Keys',
    icon: <KeyRound className="w-5 h-5" />,
  },

  {
    id: 'crates' as Category,
    name: 'Crates',
    icon: <Package className="w-5 h-5" />,
  },

  {
    id: 'golds' as Category,
    name: 'Gold',
    icon: <Coins className="w-5 h-5" />,
  },
];

/* =========================================================
   PARTICLES
========================================================= */

const particles = [
  { x: '8%', y: '18%', delay: 0 },
  { x: '18%', y: '35%', delay: 1.2 },
  { x: '82%', y: '20%', delay: 0.8 },
  { x: '92%', y: '42%', delay: 2 },
  { x: '12%', y: '72%', delay: 2.5 },
  { x: '88%', y: '75%', delay: 1.6 },
  { x: '48%', y: '12%', delay: 0.5 },
  { x: '55%', y: '85%', delay: 2.2 },
];

/* =========================================================
   PRICING PAGE
========================================================= */

export const PricingPage: React.FC = () => {
  const { navigate } = useRouter();

  const [activeCategory, setActiveCategory] =
    useState<Category>('ranks');

  const [selectedItem, setSelectedItem] =
    useState<StoreItem | null>(null);

  const items = storeData[activeCategory];

  const categoryTitle: Record<Category, string> = {
    ranks: 'Premium Ranks',
    keys: 'Mystery Keys',
    crates: 'Reward Crates',
    golds: 'Gold Packages',
  };

  const categoryDescription: Record<Category, string> = {
    ranks:
      'Upgrade your identity and unlock exclusive server perks.',

    keys:
      'Unlock powerful keys and discover exciting rewards.',

    crates:
      'Open special crates and discover what awaits inside.',

    golds:
      'Get Gold and use it throughout the Butterfly Network.',
  };

  /* =======================================================
     PURCHASE
  ======================================================= */

  const handlePurchase = (item: StoreItem) => {
    setSelectedItem(item);
  };

  const confirmPurchase = () => {
    window.open(
      DISCORD_LINK,
      '_blank',
      'noopener,noreferrer'
    );

    setSelectedItem(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030305] text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0">

        {/* Main purple glow */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-[5%] h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[160px]"
        />

        {/* Left glow */}
        <motion.div
          animate={{
            x: [-60, 60, -60],
            y: [30, -30, 30],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-[-250px] top-[40%] h-[550px] w-[550px] rounded-full bg-indigo-700/20 blur-[160px]"
        />

        {/* Right glow */}
        <motion.div
          animate={{
            x: [50, -50, 50],
            opacity: [0.07, 0.18, 0.07],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute right-[-250px] top-[30%] h-[550px] w-[550px] rounded-full bg-violet-700/20 blur-[160px]"
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }}
        />

        {/* Particles */}
        {particles.map((particle, index) => (
          <motion.span
            key={index}
            animate={{
              y: ['0px', '-20px', '0px'],
              opacity: [0.15, 0.9, 0.15],
              scale: [0.7, 1.3, 0.7],
            }}
            transition={{
              duration: 3.5 + index * 0.3,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute h-1 w-1 rounded-full bg-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.9)]"
            style={{
              left: particle.x,
              top: particle.y,
            }}
          />
        ))}
      </div>

      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      <motion.button
        initial={{
          opacity: 0,
          x: -15,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        onClick={() => navigate('/')}
        className="fixed left-6 top-6 z-50 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />

        Back to Home
      </motion.button>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">

        {/* ===================================================
            LOGO
        =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: -25,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mb-4 flex justify-center"
        >
          <div className="relative flex h-[170px] w-[170px] items-center justify-center">

            {/* Logo glow */}
            <motion.div
              animate={{
                scale: [0.85, 1.08, 0.85],
                opacity: [0.25, 0.45, 0.25],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute h-[145px] w-[145px] rounded-full bg-purple-600/20 blur-[45px]"
            />

            {/* Outer ring */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute h-[155px] w-[155px] rounded-full border border-purple-500/20"
            >
              <div className="absolute left-1/2 top-[-2px] h-[3px] w-12 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.9)]" />
            </motion.div>

            {/* Inner ring */}
            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.04, 1],
              }}
              transition={{
                rotate: {
                  duration: 12,
                  repeat: Infinity,
                  ease: 'linear',
                },
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="absolute h-[130px] w-[130px] rounded-full border border-violet-400/20 border-dashed"
            />

            {/* Logo */}
            <motion.img
              src="/logo.png"
              alt="Butterfly Network"
              animate={{
                y: [-5, 5, -5],
                rotate: [-1, 1, -1],
                filter: [
                  'drop-shadow(0 0 10px rgba(139,92,246,0.35))',
                  'drop-shadow(0 0 28px rgba(139,92,246,0.75))',
                  'drop-shadow(0 0 10px rgba(139,92,246,0.35))',
                ],
              }}
              transition={{
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                rotate: {
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                filter: {
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="relative z-10 h-[115px] w-[115px] object-contain"
            />
          </div>
        </motion.div>

        {/* ===================================================
            HEADER
        =================================================== */}

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
            duration: 0.7,
            delay: 0.15,
          }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-purple-400" />

            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
              Butterfly Network Store
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Upgrade Your
            <span className="block bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Experience
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Choose your rank, keys, crates or Gold and take your
            Butterfly Network experience to the next level.
          </p>
        </motion.div>

        {/* ===================================================
            CATEGORY TABS
        =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.3,
          }}
          className="mx-auto mb-12 flex max-w-3xl flex-wrap justify-center gap-3"
        >
          {categories.map((category) => {
            const active =
              activeCategory === category.id;

            return (
              <motion.button
                key={category.id}
                whileHover={{
                  scale: 1.04,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                onClick={() =>
                  setActiveCategory(category.id)
                }
                className={`relative flex items-center gap-2 overflow-hidden rounded-xl border px-5 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'border-purple-400/40 bg-purple-600/20 text-white shadow-[0_0_25px_rgba(139,92,246,0.15)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-white'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10"
                  />
                )}

                <span className="relative z-10">
                  {category.icon}
                </span>

                <span className="relative z-10">
                  {category.name}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ===================================================
            CATEGORY TITLE
        =================================================== */}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold sm:text-3xl">
              {categoryTitle[activeCategory]}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {categoryDescription[activeCategory]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ===================================================
            PRODUCT GRID
        =================================================== */}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                }}
                whileHover={{
                  y: -8,
                }}
                className="group relative"
              >

                {/* Popular glow */}
                {item.popular && (
                  <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-purple-500/40 via-violet-500/30 to-indigo-500/40 opacity-60 blur-sm" />
                )}

                <div
                  className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-[#0a0a0e]/90 p-6 backdrop-blur-xl transition-all duration-300 ${
                    item.popular
                      ? 'border-purple-500/30'
                      : 'border-white/10 hover:border-purple-500/25'
                  }`}
                >

                  {/* Hover glow */}
                  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute right-4 top-4">
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[9px] font-bold tracking-wider text-purple-300">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <motion.div
                    whileHover={{
                      rotate: 5,
                      scale: 1.08,
                    }}
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600/20 to-indigo-600/10 text-purple-300 shadow-[0_0_25px_rgba(139,92,246,0.08)]"
                  >
                    {item.icon}
                  </motion.div>

                  {/* Name */}
                  <h3 className="text-xl font-bold tracking-tight">
                    {item.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>

                  {/* Price */}
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-sm font-medium text-purple-400">
                      ৳
                    </span>

                    <span className="text-3xl font-black tracking-tight">
                      {item.price}
                    </span>

                    <span className="mb-1 text-xs text-slate-600">
                      BDT
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="my-5 h-px bg-white/5" />

                  {/* Features */}
                  <div className="flex-1 space-y-3">
                    {item.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-slate-400"
                      >
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                          <Check className="h-2.5 w-2.5 text-purple-400" />
                        </div>

                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Purchase button */}
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    onClick={() =>
                      handlePurchase(item)
                    }
                    className="relative mt-6 w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-950/30 transition-all hover:shadow-purple-900/40"
                  >

                    {/* Light sweep */}
                    <motion.div
                      animate={{
                        x: ['-130%', '130%'],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: 'linear',
                      }}
                      className="absolute inset-y-0 w-16 bg-white/15 blur-sm skew-x-12"
                    />

                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <ShoppingCart className="h-4 w-4" />

                      Purchase via Discord
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ===================================================
            DISCORD NOTICE
        =================================================== */}

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
          className="mx-auto mt-14 max-w-3xl rounded-2xl border border-purple-500/15 bg-purple-500/[0.04] p-5 text-center"
        >
          <div className="mb-2 flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-400" />

            <span className="font-semibold">
              Purchase through Discord
            </span>
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Select an item and connect with our Discord
            team to complete your purchase.
          </p>
        </motion.div>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <p className="mt-10 text-center text-[11px] text-slate-700">
          Butterfly Network • Minecraft Server Network
        </p>
      </main>

      {/* =====================================================
          PURCHASE MODAL
      ===================================================== */}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          >

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 20,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/20 bg-[#0b0b0f] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >

              {/* Modal glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-purple-600/20 blur-[70px]" />

              {/* Close */}
              <button
                onClick={() =>
                  setSelectedItem(null)
                }
                className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                {selectedItem.icon}
              </div>

              <div className="relative">
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-purple-400">
                  Purchase Request
                </div>

                <h2 className="text-2xl font-bold">
                  {selectedItem.name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You are about to purchase this item
                  through the Butterfly Network Discord.
                </p>

                {/* Product summary */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Product
                    </span>

                    <span className="font-semibold text-white">
                      {selectedItem.name}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-sm text-slate-500">
                      Price
                    </span>

                    <span className="text-lg font-bold text-purple-400">
                      ৳{selectedItem.price} BDT
                    </span>
                  </div>
                </div>

                {/* Discord button */}
                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={confirmPurchase}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-950/30"
                >
                  <span className="flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5" />

                    Continue to Discord
                  </span>
                </motion.button>

                {/* Cancel */}
                <button
                  onClick={() =>
                    setSelectedItem(null)
                  }
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>

                <p className="mt-4 text-center text-[10px] leading-5 text-slate-600">
                  Payment and delivery will be handled
                  through the Butterfly Network Discord.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};