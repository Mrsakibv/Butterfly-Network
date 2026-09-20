import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getBadgeByType,
  loadBadges,
  subscribeToBadgeChanges,
} from '../../types/badges';
import type { BadgeType } from '../../types/badges';
import { X, Sparkles } from 'lucide-react';

interface TikBadgeProps {
  badgeType: BadgeType | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  clickable?: boolean;
}

export const TikBadge: React.FC<TikBadgeProps> = ({
  badgeType,
  size = 'md',
  showLabel = false,
  clickable = true,
}) => {
  const [, setVersion] = useState(0);
  const [showModal, setShowModal] =
    useState(false);

  useEffect(() => {
    loadBadges();

    const unsubscribe =
      subscribeToBadgeChanges(() => {
        setVersion((value) => value + 1);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const badge =
    getBadgeByType(badgeType);

  if (!badge) {
    return null;
  }

  const sizeMap = {
    sm: {
      wrapper: 'w-5 h-5',
      image: 'w-5 h-5',
      text: 'text-[9px]',
    },

    md: {
      wrapper: 'w-6 h-6',
      image: 'w-6 h-6',
      text: 'text-[10px]',
    },

    lg: {
      wrapper: 'w-9 h-9',
      image: 'w-9 h-9',
      text: 'text-xs',
    },
  };

  const sizes =
    sizeMap[size];

  const handleClick = () => {
    if (clickable) {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Badge */}
      <motion.div
        onClick={handleClick}
        className={`inline-flex items-center gap-1 ${
          clickable
            ? 'cursor-pointer'
            : ''
        }`}
        whileHover={
          clickable
            ? { scale: 1.08 }
            : {}
        }
        whileTap={
          clickable
            ? { scale: 0.92 }
            : {}
        }
      >
        <motion.div
          className={`relative ${sizes.wrapper} flex-shrink-0 flex items-center justify-center`}
          animate={
            badge.animation.pulse
              ? {
                  rotate: [
                    0,
                    -3,
                    3,
                    -3,
                    0,
                  ],
                }
              : {}
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Glow */}
          {badge.animation.glow && (
            <motion.div
              className="absolute inset-0 rounded-full blur-md pointer-events-none"
              style={{
                background:
                  `radial-gradient(circle, ${badge.color.glow}, transparent 70%)`,
              }}
              animate={{
                scale: [
                  1,
                  1.35,
                  1,
                ],
                opacity: [
                  0.4,
                  0.75,
                  0.4,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Custom GIF */}
          <img
            src={badge.gifUrl}
            alt={`${badge.name} verified badge`}
            className={`relative z-10 ${sizes.image} object-contain select-none`}
            draggable={false}
          />

          {/* Particles */}
          {badge.animation.particles &&
            [0, 1, 2, 3].map(
              (i) => (
                <motion.div
                  key={i}
                  className="absolute pointer-events-none z-20"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [
                      0,
                      Math.cos(
                        (i * Math.PI) / 2
                      ) * 14,
                    ],
                    y: [
                      0,
                      Math.sin(
                        (i * Math.PI) / 2
                      ) * 14,
                    ],
                    opacity: [
                      0,
                      0.9,
                      0,
                    ],
                    scale: [
                      0.5,
                      1.2,
                      0,
                    ],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                >
                  <Sparkles
                    className="w-2 h-2"
                    style={{
                      color:
                        badge.color
                          .secondary,
                    }}
                    fill={
                      badge.color
                        .secondary
                    }
                  />
                </motion.div>
              )
            )}
        </motion.div>

        {/* Label */}
        {showLabel && (
          <span
            className={`font-bold tracking-wider ${sizes.text}`}
            style={{
              color:
                badge.color.primary,
            }}
          >
            {badge.name}
          </span>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() =>
              setShowModal(false)
            }
          >
            <motion.div
              initial={{
                scale: 0.9,
                opacity: 0,
                y: 20,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              exit={{
                scale: 0.9,
                opacity: 0,
                y: 20,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="relative w-full max-w-md rounded-3xl border p-8 shadow-2xl"
              style={{
                background:
                  `linear-gradient(135deg, ${badge.color.primary}15, ${badge.color.secondary}10, #000000)`,

                borderColor:
                  `${badge.color.primary}40`,

                boxShadow:
                  `0 0 60px ${badge.color.glow}, 0 20px 50px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Close */}
              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large GIF */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="relative w-32 h-32 flex items-center justify-center"
                  animate={{
                    rotate: [
                      0,
                      -5,
                      5,
                      -5,
                      0,
                    ],
                    scale: [
                      1,
                      1.05,
                      1,
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
                    style={{
                      background:
                        `radial-gradient(circle, ${badge.color.primary}, transparent)`,
                      opacity: 0.6,
                    }}
                  />

                  <img
                    src={badge.gifUrl}
                    alt={`${badge.name} verified badge`}
                    className="relative z-10 w-28 h-28 object-contain select-none"
                    draggable={false}
                  />
                </motion.div>
              </div>

              {/* Information */}
              <div className="text-center space-y-4">
                <h3
                  className="text-2xl font-bold"
                  style={{
                    background:
                      `linear-gradient(135deg, ${badge.color.primary}, ${badge.color.secondary})`,

                    WebkitBackgroundClip:
                      'text',

                    WebkitTextFillColor:
                      'transparent',
                  }}
                >
                  {badge.name}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between px-4 py-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">
                      Tier
                    </span>

                    <span className="font-semibold text-white">
                      {badge.tier}
                    </span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">
                      Value
                    </span>

                    <span
                      className="font-semibold"
                      style={{
                        color:
                          badge.color
                            .primary,
                      }}
                    >
                      {'⭐'.repeat(
                        Math.max(
                          0,
                          Math.min(
                            10,
                            badge.value
                          )
                        )
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">
                      Position
                    </span>

                    <span className="font-semibold text-white">
                      #{badge.value} of 6
                    </span>
                  </div>

                  <div className="flex justify-between px-4 py-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-slate-400">
                      Rarity
                    </span>

                    <span className="font-semibold text-white">
                      {badge.rarity}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 text-sm italic px-4">
                  "{badge.description}"
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};