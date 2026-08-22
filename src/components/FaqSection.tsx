import React, { useState } from 'react';
import { FAQ_DATA } from '../data/faq';
import { ChevronDown, HelpCircle, Search, Sparkles, MessageCircleQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVER_CONFIG } from '../config/server';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('how-to-join');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Connection', 'Game Modes', 'Support', 'General'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-heading tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Everything you need to know about joining, playing, versions, and our community.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-10">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frequently asked questions..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl glass-panel border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/60 transition-colors shadow-inner"
              aria-label="Search FAQ"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3" role="region" aria-label="Frequently Asked Questions Accordion">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl glass-panel border border-white/[0.08] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    id={`faq-question-${faq.id}`}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 text-slate-100 hover:text-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400/50 rounded-2xl"
                  >
                    <span className="font-heading font-bold text-base sm:text-lg">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-purple-600/30 text-purple-200' : 'text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        role="region"
                        aria-labelledby={`faq-question-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-5 sm:px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm glass-panel rounded-2xl border">
              No questions found matching your criteria. Feel free to ask directly in our Discord!
            </div>
          )}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-heading font-bold text-white text-base">Still have a question?</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Our staff team and active community are ready to assist you in real time.
            </p>
          </div>
          <a
            href={SERVER_CONFIG.discordUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-purple-600 hover:bg-purple-500 transition-all shrink-0"
          >
            Ask in #support-tickets
          </a>
        </div>
      </div>
    </section>
  );
};
