import React, { useEffect, useState } from 'react';
import { Calendar, User, ArrowRight, BookOpen, ExternalLink, HelpCircle, Link as LinkIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePageItems, CmsPageItem } from '../hooks/usePageItems';
import { useRouter } from '../hooks/useRouter';

export const BlogPage: React.FC = () => {
  const blogItems = usePageItems('blog');
  const [selectedPost, setSelectedPost] = useState<CmsPageItem | null>(null);
  const { navigate } = useRouter();

  useEffect(() => {
    document.title = 'Blog & News | Butterfly network';
  }, []);

  // Parse extra fields safely
  const parseJson = (str: string) => {
    try {
      return JSON.parse(str || '[]');
    } catch {
      return [];
    }
  };

  const getFeatures = (str: string) => {
    return (str || '').split('\n').filter(Boolean);
  };

  const renderSections = (sections: any[]) => {
    return sections.map((section, idx) => (
      <div key={idx} className="mb-10">
        {section.title && (
          <h3 className="mb-4 text-2xl font-bold text-white">{section.title}</h3>
        )}
        
        {section.type === 'text' && (
          <p className="text-lg leading-relaxed text-slate-300 whitespace-pre-line">
            {section.content}
          </p>
        )}

        {section.type === 'image' && section.imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img 
              src={section.imageUrl} 
              alt={section.title || ""} 
              className="w-full h-auto object-contain bg-black/20"
            />
          </div>
        )}

        {section.type === 'points' && (
          <div className="space-y-3">
            {section.content.split('\n').filter(Boolean).map((point: string, pIdx: number) => (
              <div key={pIdx} className="flex items-start gap-3">
                <div className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="text-lg text-slate-300">{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  if (selectedPost) {
    const qnaList = parseJson(selectedPost.extra?.qna);
    const sectionsList = parseJson(selectedPost.extra?.sections);

    return (
      <div className="pt-28 pb-20">
        <div className="mx-auto max-w-4xl px-4">
          {/* Back Button */}
          <button
            onClick={() => setSelectedPost(null)}
            className="mb-8 flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </button>

          {/* Full Cover Image (Auto height for Vertical/Horizontal) */}
          {selectedPost.image_url && (
            <div className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] flex justify-center">
              <img
                src={selectedPost.image_url}
                alt={selectedPost.title}
                className="max-w-full h-auto max-h-[800px] object-contain"
              />
            </div>
          )}

          {/* Header Info (Only Name and Rank) */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-1">Written by</p>
              <div className="flex items-center gap-3">
                {selectedPost.extra?.authorImageUrl && (
                  <img
                    src={selectedPost.extra.authorImageUrl}
                    alt={selectedPost.extra.author}
                    className="h-12 w-12 rounded-full object-cover border border-white/10"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">{selectedPost.extra?.author || 'Anonymous'}</span>
                  {selectedPost.extra?.authorRank && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        color: selectedPost.extra?.authorRankColor || '#a855f7',
                        backgroundColor: `${selectedPost.extra?.authorRankColor || '#a855f7'}15`,
                        borderWidth: 1,
                        borderColor: `${selectedPost.extra?.authorRankColor || '#a855f7'}30`,
                      }}
                    >
                      {selectedPost.extra.authorRank}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-4 py-2 rounded-full">
              <Calendar className="h-4 w-4 text-purple-400" />
              {selectedPost.subtitle || 'Published recently'}
            </div>
          </div>

          {/* Main Title */}
          <h1 className="mb-10 font-heading text-4xl font-black text-white sm:text-5xl lg:text-6xl leading-[1.1]">
            {selectedPost.title}
          </h1>

          {/* Intro Description */}
          <div className="prose prose-invert mb-12 max-w-none text-xl leading-relaxed text-slate-300 whitespace-pre-line italic opacity-80">
            {selectedPost.description}
          </div>

          {/* QnA Section (After Intro) */}
          {qnaList.length > 0 && (
            <div className="mb-12 space-y-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-purple-400" /> Questions & Answers
              </h3>
              <div className="space-y-4">
                {qnaList.map((qna: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]">
                    <p className="font-bold text-lg text-white">Q: {qna.q}</p>
                    <p className="mt-3 text-slate-400 leading-relaxed">A: {qna.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Content Sections (Point to Point, Images, etc) */}
          <div className="mb-12">
            {renderSections(sectionsList)}
          </div>

          {/* Final Back Button */}
          <div className="flex justify-center border-t border-white/10 pt-12">
            <button
              onClick={() => {
                setSelectedPost(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-all hover:border-purple-500/50"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Blog Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <section className="relative py-12">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto mb-16 max-w-3xl space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
              <BookOpen className="h-3.5 w-3.5 text-purple-400" /> News & Updates
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Latest Network News
            </h1>

            <p className="text-base text-slate-400 sm:text-lg">
              Stay updated with the latest news, announcements, and guides from Butterfly network.
            </p>
          </div>

          {/* Posts Grid */}
          {blogItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-slate-400">
              No blog posts published yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogItems.map((post, index) => {
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-purple-500/40 hover:bg-white/[0.05] cursor-pointer"
                    onClick={() => {
                      setSelectedPost(post);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {/* Image */}
                    {post.image_url ? (
                      <div className="relative h-48 w-full overflow-hidden bg-black/40">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-purple-950/20 text-purple-400">
                        <BookOpen className="h-12 w-12 opacity-40" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-6">
                      {/* Meta */}
                      <div className="mb-3 flex items-center gap-4 text-xs text-purple-300">
                        {post.extra?.author && (
                          <span className="flex items-center gap-1">
                            {post.extra.author}
                            {post.extra?.authorRank && (
                              <span
                                className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  color: post.extra?.authorRankColor || '#a855f7',
                                  backgroundColor: `${post.extra?.authorRankColor || '#a855f7'}15`,
                                  borderWidth: 1,
                                  borderColor: `${post.extra?.authorRankColor || '#a855f7'}30`,
                                }}
                              >
                                {post.extra.authorRank}
                              </span>
                            )}
                          </span>
                        )}
                        {post.subtitle && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {post.subtitle}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="mb-2 text-xl font-bold text-white hover:text-purple-300 line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Info / Excerpt */}
                      <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-400">
                        {post.description}
                      </p>

                      {/* Actions */}
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300"
                        >
                          Read Full Post <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
