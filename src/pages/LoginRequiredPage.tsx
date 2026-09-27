import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, User, ArrowRight, Info } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';

export const LoginRequiredPage: React.FC = () => {
  const { navigate } = useRouter();

  const handleLoginRedirect = () => {
    // Get the original product page from URL params or referrer
    const urlParams = new URLSearchParams(window.location.search);
    const returnPath = urlParams.get('return') || '/pricing';

    // Store the return path (not the login-required page itself)
    sessionStorage.setItem('redirectAfterLogin', returnPath);
    navigate('/login');
  };

  const handleBackToStore = () => {
    navigate('/pricing');
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Ambient glow background */}
      <div className="pointer-events-none fixed left-1/2 top-20 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[180px]" />

      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
        >
          {/* Header Section */}
          <div className="relative border-b border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-violet-500/10 p-8 text-center sm:p-12">
            {/* Decorative elements */}
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full border border-purple-500/20 bg-purple-500/5 blur-xl" />
            <div className="absolute bottom-8 right-8 h-24 w-24 rounded-full border border-violet-500/20 bg-violet-500/5 blur-xl" />

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-500/20 to-violet-500/20 shadow-[0_0_60px_rgba(168,85,247,0.3)]"
            >
              <ShieldAlert className="h-10 w-10 text-purple-300" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative z-10 text-3xl font-black text-white sm:text-4xl"
            >
              Login Required
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative z-10 mt-3 text-sm text-slate-400"
            >
              You need to be logged in to make a purchase
            </motion.p>
          </div>

          {/* Content Section */}
          <div className="space-y-6 p-6 sm:p-8">
            {/* Main message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10">
                  <Info className="h-5 w-5 text-purple-300" />
                </div>

                <div className="flex-1">
                  <h2 className="font-bold text-white">
                    Authentication Required
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    To purchase items from our store, you must have an account and be logged in.
                    This ensures secure transactions and allows us to deliver your purchase directly
                    to your Minecraft account.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Features list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Why do I need to log in?
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                  <div>
                    <div className="font-semibold text-white">Secure Transactions</div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Your purchases are protected and tracked under your account for security.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <User className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                  <div>
                    <div className="font-semibold text-white">Order History</div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      View and manage all your purchases in one place through your profile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
                  <div>
                    <div className="font-semibold text-white">Instant Delivery</div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Products are delivered directly to your linked Minecraft account after verification.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="space-y-3 pt-4"
            >
              <button
                onClick={handleLoginRedirect}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-4 text-sm font-black text-white shadow-[0_15px_45px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(124,58,237,0.4)]"
              >
                <Lock className="h-5 w-5" />
                Log In to Continue
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleBackToStore}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-bold text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                Back to Store
              </button>
            </motion.div>

            {/* Help text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="rounded-xl border border-white/5 bg-black/20 p-4 text-center"
            >
              <p className="text-xs leading-5 text-slate-500">
                Don't have an account?{' '}
                <button
                  onClick={handleLoginRedirect}
                  className="font-semibold text-purple-400 underline decoration-purple-400/30 underline-offset-2 transition-colors hover:text-purple-300 hover:decoration-purple-300/50"
                >
                  Sign up now
                </button>
                {' '}to get started with purchasing.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
