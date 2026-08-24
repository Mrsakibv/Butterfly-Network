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
import { FaqPage } from './pages/FaqPage';
import { RulesPage } from './pages/RulesPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';

import { motion, AnimatePresence } from 'motion/react';

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

  const handleOpenPlayModal = () => {
    setPlayModalOpen(true);
  };

  const handleClosePlayModal = () => {
    setPlayModalOpen(false);
  };

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

    // Password Reset Page
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
      <div className="pt-36 pb-24 text-center max-w-xl mx-auto px-4 space-y-6">
        <h1 className="text-6xl font-extrabold text-purple-400 font-heading">
          404
        </h1>

        <h2 className="text-2xl font-bold text-white">
          Page Not Found
        </h2>

        <p className="text-sm text-slate-400">
          The quadrant of the server network you requested does not exist
          or has been warped.
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm text-white transition-colors"
        >
          Return to Hub (Home)
        </button>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#050505] text-[#e5e7eb] selection:bg-purple-600/30 selection:text-purple-100">

      {/* Dynamic Floating Particles */}
      <ParticleBackground />

      {/* Sticky Main Navigation */}
      <Navbar onOpenPlayModal={handleOpenPlayModal} />

      {/* Main Content */}
      <main className="flex-1 z-10">
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

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </ToastProvider>
  );
}