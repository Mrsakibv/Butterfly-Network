import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UpdatePasswordPage: React.FC = () => {
  const { navigate } = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdatePassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setMessage('');

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  /*
   * Floating particles around the logo
   */
  const particles = [
    { x: -125, y: -70, size: 3, delay: 0 },
    { x: 125, y: -55, size: 2, delay: 0.8 },
    { x: -145, y: 30, size: 2, delay: 1.5 },
    { x: 145, y: 40, size: 3, delay: 2.1 },
    { x: -85, y: 95, size: 2, delay: 2.7 },
    { x: 95, y: 90, size: 3, delay: 1.1 },
    { x: -55, y: -115, size: 2, delay: 3 },
    { x: 70, y: -105, size: 2, delay: 1.8 },
    { x: -165, y: -10, size: 2, delay: 2.4 },
    { x: 165, y: -5, size: 2, delay: 0.5 },
    { x: -110, y: -115, size: 3, delay: 3.2 },
    { x: 110, y: -105, size: 2, delay: 2.2 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030305] text-white flex items-center justify-center px-4 py-16">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0">

        {/* Main purple atmosphere */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.18, 0.32, 0.18],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-[25%] -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-purple-700/20 blur-[150px]"
        />

        {/* Secondary indigo atmosphere */}
        <motion.div
          animate={{
            x: [-80, 80, -80],
            y: [40, -30, 40],
            opacity: [0.08, 0.2, 0.08],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-[15%] bottom-[-250px] w-[550px] h-[550px] rounded-full bg-indigo-700/20 blur-[150px]"
        />

        {/* Top atmosphere */}
        <motion.div
          animate={{
            x: [50, -50, 50],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute right-[5%] top-[-250px] w-[450px] h-[450px] rounded-full bg-violet-600/20 blur-[130px]"
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }}
        />

      </div>

      {/* =========================================================
          BACK BUTTON
      ========================================================= */}

      <motion.button
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </motion.button>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <div className="relative z-10 w-full max-w-md">

        {/* =======================================================
            LOGO ANIMATION AREA
        ======================================================= */}

        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative mx-auto mb-8 w-[250px] h-[230px] flex items-center justify-center"
        >

          {/* Large background glow */}
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
            className="absolute w-[190px] h-[190px] rounded-full bg-purple-600/20 blur-[55px]"
          />

          {/* ===================================================
              OUTER ROTATING RING
          =================================================== */}

          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[215px] h-[215px] rounded-full border border-purple-500/20"
          >
            {/* ring light */}
            <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-16 h-[3px] rounded-full bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.9)]" />

            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full bg-violet-400/60 blur-[1px]" />
          </motion.div>

          {/* ===================================================
              SECOND RING
          =================================================== */}

          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[175px] h-[175px] rounded-full border border-violet-400/20 border-dashed"
          >
            <div className="absolute top-1/2 -right-[3px] -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)]" />

            <div className="absolute top-1/2 -left-[3px] -translate-y-1/2 w-[4px] h-[4px] rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,1)]" />
          </motion.div>

          {/* ===================================================
              INNER RING
          =================================================== */}

          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.04, 1],
            }}
            transition={{
              rotate: {
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            className="absolute w-[145px] h-[145px] rounded-full border border-purple-400/10"
          />

          {/* ===================================================
              FLOATING PARTICLES
          =================================================== */}

          {particles.map((particle, index) => (
            <motion.span
              key={index}
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
              }}
              animate={{
                x: [
                  particle.x,
                  particle.x + (index % 2 === 0 ? 12 : -12),
                  particle.x,
                ],
                y: [
                  particle.y,
                  particle.y - 15,
                  particle.y,
                ],
                opacity: [0.15, 1, 0.15],
                scale: [0.7, 1.25, 0.7],
              }}
              transition={{
                duration: 3.5 + (index % 4),
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full bg-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.9)]"
              style={{
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}

          {/* ===================================================
              ORBITING PARTICLE
          =================================================== */}

          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[230px] h-[230px] rounded-full"
          >
            <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_18px_rgba(216,180,254,1)]" />
          </motion.div>

          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[205px] h-[205px] rounded-full"
          >
            <div className="absolute bottom-3 left-1/2 w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_14px_rgba(165,180,252,1)]" />
          </motion.div>

          {/* ===================================================
              ACTUAL LOGO
          =================================================== */}

          <motion.div
            animate={{
              y: [-7, 7, -7],
              rotate: [-1, 1, -1],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10"
          >

            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 10px rgba(139,92,246,0.35))',
                  'drop-shadow(0 0 28px rgba(139,92,246,0.75))',
                  'drop-shadow(0 0 10px rgba(139,92,246,0.35))',
                ],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <img
                src="/logo.png"
                alt="Butterfly Network"
                className="w-[155px] h-[155px] object-contain"
              />
            </motion.div>

          </motion.div>

        </motion.div>

        {/* =======================================================
            PASSWORD CARD
        ======================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 35,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            delay: 0.25,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="rounded-3xl border border-purple-500/20 bg-[#0b0b0f]/85 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
        >

          <AnimatePresence mode="wait">

            {!success ? (

              <motion.div
                key="password-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                }}
              >

                {/* Header */}
                <div className="text-center mb-8">

                  <div className="inline-flex items-center justify-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />

                    <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                      Account Security
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Create New Password
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Choose a strong new password for your
                    Butterfly Network account.
                  </p>

                </div>

                {/* Error */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -10,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        height: 'auto',
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                        height: 0,
                      }}
                      className="mb-5 overflow-hidden"
                    >
                      <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{message}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={handleUpdatePassword}
                  className="space-y-5"
                >

                  {/* New password */}
                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>

                    <div className="relative">

                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="Enter new password"
                        disabled={loading}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 pr-12 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* Confirm password */}
                  <div>

                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm Password
                    </label>

                    <div className="relative">

                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                      <input
                        type={
                          showConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        placeholder="Confirm new password"
                        disabled={loading}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 pr-12 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* Password strength */}
                  <div className="space-y-2">

                    <div className="flex gap-1">

                      {[1, 2, 3, 4].map((item) => {
                        const strength =
                          password.length >= 12
                            ? 4
                            : password.length >= 9
                            ? 3
                            : password.length >= 6
                            ? 2
                            : password.length > 0
                            ? 1
                            : 0;

                        return (
                          <motion.div
                            key={item}
                            animate={{
                              opacity:
                                item <= strength
                                  ? 1
                                  : 0.15,
                            }}
                            className="h-1 flex-1 rounded-full bg-purple-500"
                          />
                        );
                      })}

                    </div>

                    <p className="text-[11px] text-slate-600">
                      Use at least 6 characters. A longer password
                      is recommended.
                    </p>

                  </div>

                  {/* Update button */}
                  <motion.button
                    whileHover={{
                      scale: loading ? 1 : 1.01,
                    }}
                    whileTap={{
                      scale: loading ? 1 : 0.98,
                    }}
                    type="submit"
                    disabled={loading}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-950/40 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {/* Light sweep */}
                    {!loading && (
                      <motion.div
                        animate={{
                          x: ['-130%', '130%'],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          repeatDelay: 1.8,
                          ease: 'linear',
                        }}
                        className="absolute inset-y-0 w-20 bg-white/15 skew-x-12 blur-sm"
                      />
                    )}

                    <span className="relative z-10 flex items-center justify-center gap-2">

                      {loading ? (
                        <>
                          <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Update Password
                        </>
                      )}

                    </span>

                  </motion.button>

                </form>

                <p className="mt-6 text-center text-[11px] text-slate-600">
                  Your password is securely handled by Supabase.
                </p>

              </motion.div>

            ) : (

              /* =================================================
                 SUCCESS SCREEN
              ================================================= */

              <motion.div
                key="success"
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="text-center py-4"
              >

                {/* Success icon */}
                <motion.div
                  initial={{
                    scale: 0,
                    rotate: -30,
                  }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 12,
                  }}
                  className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.15)]"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-bold">
                  Password Updated!
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Your Butterfly Network password has been
                  successfully updated.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/')}
                  className="mt-7 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-950/40 hover:from-purple-500 hover:to-indigo-500 transition-all"
                >
                  Return to Butterfly Network
                </motion.button>

              </motion.div>

            )}

          </AnimatePresence>

        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-[11px] text-slate-700"
        >
          Butterfly Network • Minecraft Server Network
        </motion.p>

      </div>

    </div>
  );
};