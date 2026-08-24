/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter } from './hooks/useRouter';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';
import { ParticleBackground } from './components/ParticleBackground';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { JoinModal } from './components/JoinModal';
import { supabase } from './lib/supabase';

// Pages
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { PricingPage } from './pages/PricingPage';
import { FaqPage } from './pages/FaqPage';
import { RulesPage } from './pages/RulesPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';

import { motion, AnimatePresence } from 'motion/react';


/* =========================================================
   PREMIUM LOADING SCREEN
========================================================= */

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let currentProgress = 0;

    const interval = setInterval(() => {
      const increment = Math.random() * 7 + 3;
      currentProgress += increment;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        setTimeout(() => {
          setFadeOut(true);

          setTimeout(() => {
            onComplete();
          }, 650);
        }, 250);
      }

      setProgress(Math.floor(currentProgress));
    }, 120);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-[#030305] text-white transition-all duration-700 ${
        fadeOut
          ? 'pointer-events-none opacity-0'
          : 'opacity-100'
      }`}
    >

      {/* Background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at 50% 42%,
              rgba(124, 58, 237, 0.20),
              transparent 30%
            ),
            radial-gradient(
              circle at 15% 85%,
              rgba(56, 189, 248, 0.08),
              transparent 25%
            ),
            radial-gradient(
              circle at 85% 15%,
              rgba(139, 92, 246, 0.08),
              transparent 25%
            ),
            #030305
          `,
        }}
      />

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage:
            'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)',
        }}
      />

      {/* Purple ambient glow */}
      <div
        className="absolute left-[10%] top-[10%] h-[420px] w-[420px] rounded-full bg-purple-600/10 blur-[120px]"
        style={{
          animation: 'butterflyGlowOne 7s ease-in-out infinite',
        }}
      />

      {/* Blue ambient glow */}
      <div
        className="absolute bottom-[5%] right-[10%] h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-[120px]"
        style={{
          animation: 'butterflyGlowTwo 8s ease-in-out infinite',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-[2px] w-[2px] rounded-full bg-purple-300/70 shadow-[0_0_8px_rgba(139,92,246,0.8)]"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 53) % 100}%`,
              animation: `butterflyParticle ${
                3 + (index % 5)
              }s linear infinite`,
              animationDelay: `${(index % 7) * 0.45}s`,
            }}
          />
        ))}
      </div>

      {/* Main loading content */}
      <div className="relative z-10 flex w-[90%] max-w-[520px] flex-col items-center text-center">

        {/* Logo */}
        <div className="relative mb-7 flex h-[190px] w-[190px] items-center justify-center">

          {/* Outer rotating ring */}
          <div
            className="absolute h-[185px] w-[185px] rounded-full border border-purple-500/20 border-b-sky-400/70"
            style={{
              animation:
                'butterflyRotateReverse 10s linear infinite',
            }}
          />

          {/* Inner rotating ring */}
          <div
            className="absolute h-[155px] w-[155px] rounded-full border border-purple-400/25 border-t-sky-400/80"
            style={{
              animation:
                'butterflyRotate 7s linear infinite',
            }}
          />

          {/* Logo glow */}
          <div
            className="absolute h-[115px] w-[115px] rounded-full bg-purple-600/30 blur-[35px]"
            style={{
              animation:
                'butterflyLogoPulse 2.4s ease-in-out infinite',
            }}
          />

          {/* Logo */}
          <img
            src="/logo.png"
            alt="Butterfly Network"
            className="relative z-10 h-[125px] w-[125px] object-contain"
            style={{
              filter:
                'drop-shadow(0 0 15px rgba(139,92,246,0.9)) drop-shadow(0 0 40px rgba(56,189,248,0.35))',
              animation:
                'butterflyLogoFloat 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Network name */}
        <div className="mb-3 flex items-center gap-2 font-[Outfit,sans-serif] text-[30px] font-extrabold tracking-[5px] max-[600px]:text-[23px] max-[600px]:tracking-[3px]">

          <span
            style={{
              background:
                'linear-gradient(90deg, #ffffff, #d8b4fe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            BUTTERFLY
          </span>

          <span
            style={{
              background:
                'linear-gradient(90deg, #a78bfa, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            NETWORK
          </span>

        </div>

        {/* Status */}
        <div className="mb-7 flex items-center gap-2 font-mono text-[10px] tracking-[2px] text-white/45">

          <span
            className="h-[7px] w-[7px] rounded-full bg-green-400 shadow-[0_0_8px_#22c55e,0_0_18px_rgba(34,197,94,0.5)]"
            style={{
              animation:
                'butterflyStatusPulse 1.2s ease-in-out infinite',
            }}
          />

          CONNECTING TO BUTTERFLY NETWORK

        </div>

        {/* Progress bar */}
        <div className="w-full max-w-[420px]">

          <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.07] shadow-inner">

            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                background:
                  'linear-gradient(90deg, #7c3aed, #8b5cf6, #38bdf8)',
                boxShadow:
                  '0 0 12px rgba(139,92,246,0.8), 0 0 25px rgba(56,189,248,0.3)',
              }}
            />

          </div>

          {/* Progress information */}
          <div className="mt-2 flex justify-between font-mono text-[9px] tracking-[1.5px] text-white/30">
            <span>INITIALIZING SERVER</span>
            <span>{progress}%</span>
          </div>

        </div>

        {/* Loading tip */}
        <div className="mt-6 flex items-center gap-2 text-[11px] text-white/30">

          <span
            className="text-purple-400"
            style={{
              animation:
                'butterflyTipSpin 3s linear infinite',
            }}
          >
            ✦
          </span>

          Prepare for an unforgettable adventure

        </div>

      </div>

      {/* Bottom information */}
      <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap font-mono text-[9px] tracking-[2px] text-white/25 max-[600px]:bottom-5 max-[600px]:gap-2 max-[600px]:text-[7px] max-[600px]:tracking-[1px]">

        <span>JAVA</span>

        <i className="h-[3px] w-[3px] rounded-full bg-purple-400/70" />

        <span>BEDROCK</span>

      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes butterflyLogoFloat {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes butterflyLogoPulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.15);
            opacity: 0.6;
          }
        }

        @keyframes butterflyRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes butterflyRotateReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes butterflyStatusPulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes butterflyParticle {
          0% {
            transform: translateY(30px) scale(0.5);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          80% {
            opacity: 0.5;
          }

          100% {
            transform: translateY(-120px) scale(1);
            opacity: 0;
          }
        }

        @keyframes butterflyGlowOne {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(80px, 60px);
          }
        }

        @keyframes butterflyGlowTwo {
          0%, 100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(-70px, -50px);
          }
        }

        @keyframes butterflyTipSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </div>
  );
}


/* =========================================================
   MAIN APP CONTENT
========================================================= */

function AppContent() {
  const { path, gameSlug, navigate } = useRouter();
  const [playModalOpen, setPlayModalOpen] = useState(false);

  // Password recovery event tracking
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleOpenPlayModal = () => setPlayModalOpen(true);
  const handleClosePlayModal = () => setPlayModalOpen(false);

  // Route selector
  const renderCurrentPage = () => {
    if (path === '/' || path === '') {
      return (
        <HomePage
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path === '/games') {
      return (
        <GamesPage
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path.startsWith('/games/') && gameSlug) {
      return (
        <GameDetailPage
          slug={gameSlug}
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path === '/login') {
      return <LoginPage />;
    }

    if (path === '/update-password') {
      return <UpdatePasswordPage />;
    }

    if (path === '/profile') {
      return <ProfilePage />;
    }

    if (path === '/leaderboard') {
      return (
        <LeaderboardPage
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path === '/how-to-play') {
      return (
        <HowToPlayPage
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path === '/pricing') {
      return (
        <PricingPage
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path === '/faq') {
      return (
        <FaqPage
          onOpenPlayModal={handleOpenPlayModal}
        />
      );
    }

    if (path === '/rules') {
      return <RulesPage />;
    }

    if (path === '/terms') {
      return <TermsPage />;
    }

    if (path === '/privacy') {
      return <PrivacyPage />;
    }

    // 404 Fallback
    return (
      <div className="mx-auto max-w-xl space-y-6 px-4 pb-24 pt-36 text-center">

        <h1 className="font-heading text-6xl font-extrabold text-purple-400">
          404
        </h1>

        <h2 className="text-2xl font-bold text-white">
          Page Not Found
        </h2>

        <p className="text-sm text-slate-400">
          The quadrant of the server network you requested does not
          exist or has been warped.
        </p>

        <button
          onClick={() => navigate('/')}
          className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
        >
          Return to Hub (Home)
        </button>

      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050505] text-[#e5e7eb] selection:bg-purple-600/30 selection:text-purple-100">

      {/* Dynamic Floating Particles */}
      <ParticleBackground />

      {/* Sticky Main Navigation */}
      <Navbar
        onOpenPlayModal={handleOpenPlayModal}
      />

      {/* Main Content View with route transition */}
      <main className="z-10 flex-1">

        <AnimatePresence mode="wait">

          <motion.div
            key={path}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderCurrentPage()}
          </motion.div>

        </AnimatePresence>

      </main>

      {/* Footer */}
      <Footer />

      {/* Play Now Modal */}
      <JoinModal
        isOpen={playModalOpen}
        onClose={handleClosePlayModal}
      />

      {/* Global Toast Notification System */}
      <ToastContainer />

    </div>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  const [isLoading, setIsLoading] = useState(true);

  return (
    <ToastProvider>

      <RouterProvider>

        <AppContent />

        {isLoading && (
          <LoadingScreen
            onComplete={() => setIsLoading(false)}
          />
        )}

      </RouterProvider>

    </ToastProvider>
  );
}