import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { SERVER_CONFIG } from '../config/server';
import { useRouter } from '../hooks/useRouter';
import { Menu, X, Disc as DiscordIcon, Play, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onOpenPlayModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPlayModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { path, navigate } = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Games', href: '/games' },
    { label: 'Features', href: '/#features' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'FAQ', href: '/faq' },
  ];

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (href.startsWith('/#')) {
      if (path !== '/') {
        navigate('/');
        setTimeout(() => {
          const target = document.querySelector(href.replace('/', ''));
          target?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const target = document.querySelector(href.replace('/', ''));
        target?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    navigate(href);
  };

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    if (href.startsWith('/#')) return false;
    return path.startsWith(href);
  };

  return (
    <>
      <header
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-purple-500/15 py-3 shadow-lg shadow-black/40'
            : 'bg-transparent py-5 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="/"
            onClick={(e) => handleNavClick('/', e)}
            className="focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl"
            aria-label="Butterfly Network Home"
          >
            <Logo size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-white/[0.04] border border-white/[0.07] backdrop-blur-md px-3">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(link.href, e)}
                  className={`relative px-4 py-2 text-sm font-medium transition-all rounded-full ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/60 to-violet-600/60 rounded-full border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={SERVER_CONFIG.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400/60 rounded-xl transition-all shadow-sm active:scale-95"
              aria-label="Join Butterfly Network Discord"
            >
              <DiscordIcon className="w-4 h-4 text-purple-400" />
              <span>Discord</span>
            </a>

            <button
              onClick={onOpenPlayModal}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 rounded-xl transition-all shadow-lg shadow-purple-950/50 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Now</span>
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenPlayModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm"
              aria-label="Play Now"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Play</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[65px] z-30 md:hidden bg-[#050505]/98 backdrop-blur-2xl border-b border-purple-500/20 shadow-2xl p-6 space-y-5"
          >
            <nav className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(link.href, e)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      active
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </a>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={SERVER_CONFIG.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-purple-950/60 border border-purple-500/40 text-purple-200"
              >
                <DiscordIcon className="w-4 h-4 text-purple-400" />
                <span>Join Discord</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPlayModal();
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
