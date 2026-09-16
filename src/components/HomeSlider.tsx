import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { usePageItems } from '../hooks/usePageItems';

export const HomeSlider: React.FC = () => {
  const items = usePageItems('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const visibleItems = items.filter(item => item.is_visible);

  useEffect(() => {
    if (visibleItems.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!showFullDesc) {
        setCurrentIndex((prev) => (prev + 1) % visibleItems.length);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [visibleItems.length, showFullDesc]);

  useEffect(() => {
    setShowFullDesc(false);
    // Check for overflow after state update
    setTimeout(() => {
      if (descRef.current) {
        setIsOverflowing(descRef.current.scrollHeight > descRef.current.clientHeight);
      }
    }, 100);
  }, [currentIndex]);

  if (visibleItems.length === 0) return null;

  const currentItem = visibleItems[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleItems.length);
  };

  const socialLinks = (() => {
    try {
      return JSON.parse(currentItem.extra?.socialLinks || '[]');
    } catch {
      return [];
    }
  })();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-[#08080a] shadow-2xl min-h-auto h-auto flex flex-col">
          
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-14"
            >
              {/* Left Column (Content) - 7 cols */}
              <div className="lg:col-span-7 flex flex-col h-full">
                {/* Top Section: Title & Subtitle */}
                <div className="mb-8">
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-purple-400 font-black tracking-[0.2em] uppercase text-xs mb-3"
                  >
                    {currentItem.subtitle}
                  </motion.p>
                  <motion.h2 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-heading tracking-tight"
                  >
                    {currentItem.title}
                  </motion.h2>
                </div>

                {/* Middle Section: Introduction (Scrollable if boro) */}
                <div className="flex-1 min-h-0 relative mb-8">
                  <div 
                    ref={descRef}
                    className={`text-slate-400 text-lg leading-relaxed whitespace-pre-line transition-all duration-300 ${
                      !showFullDesc ? 'max-h-[220px] overflow-hidden' : 'max-h-[500px] overflow-y-auto custom-scrollbar'
                    }`}
                  >
                    {currentItem.description}
                  </div>
                  
                  {isOverflowing && !showFullDesc && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#08080a] to-transparent" />
                  )}
                  
                  {isOverflowing && (
                    <button 
                      onClick={() => setShowFullDesc(!showFullDesc)}
                      className="mt-4 text-purple-400 font-bold text-sm hover:text-purple-300 transition-colors"
                    >
                      {showFullDesc ? 'Show Less' : 'Show More...'}
                    </button>
                  )}
                </div>

                {/* Bottom Section: Name + Logo + Rank */}
                <div className="mt-auto pt-8 border-t border-white/5 flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-xl" />
                    {currentItem.extra?.nameIconUrl ? (
                      <img 
                        src={currentItem.extra.nameIconUrl} 
                        alt="" 
                        className="relative w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-xl"
                      />
                    ) : (
                      <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-wide">
                      {currentItem.extra?.displayName || currentItem.title}
                    </h3>
                    <p className="text-purple-400 text-sm font-bold uppercase tracking-widest">
                      {currentItem.extra?.rank || 'MEMBER'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column (Image & Socials) - 5 cols */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center lg:items-end">
                <div className="relative w-full max-w-[280px] sm:max-w-[450px] mx-auto">
                  {/* Character Image */}
                  <div className="relative w-full aspect-[3/4] flex items-center justify-center">
                    <div className="absolute inset-0 bg-purple-600/10 blur-[80px] rounded-full" />
                    {currentItem.extra?.largeImageUrl ? (
                      <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 20 }}
                        src={currentItem.extra.largeImageUrl}
                        alt=""
                        className="relative z-10 w-full h-full object-contain drop-shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <div className="w-64 h-96 bg-white/5 rounded-3xl border border-dashed border-white/10 flex items-center justify-center text-slate-500">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Social Icons (Centered under image) */}
                  {socialLinks.length > 0 && (
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md max-w-fit mx-auto lg:mx-0 lg:ml-auto">
                      {socialLinks.map((link: any, idx: number) => (
                        <a 
                          key={idx}
                          href={link.link}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative"
                        >
                          <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                          <img 
                            src={link.iconUrl} 
                            alt="" 
                            className="relative w-8 h-8 rounded-lg object-cover border border-white/10 grayscale group-hover:grayscale-0 transition-all group-hover:scale-110 active:scale-95"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Controls */}
          {visibleItems.length > 1 && (
            <div className="relative mb-6 mx-auto flex items-center gap-6 z-30 px-6 py-2.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-xl w-fit">
              <button 
                onClick={handlePrev}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2.5">
                {visibleItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-10 bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]' : 'w-2 bg-white/10 hover:bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </section>
  );
};
