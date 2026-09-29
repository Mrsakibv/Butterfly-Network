
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock,
  FileText,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ApplicationPost {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export const ApplyPage: React.FC = () => {
  const [posts, setPosts] = useState<ApplicationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('application_posts')
        .select(
          'id, title, slug, short_description, description, icon, image_url, is_active, sort_order'
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Application posts error:', error);
        setError(
          'Unable to load available applications. Please try again later.'
        );
        setPosts([]);
      } else {
        setPosts(data ?? []);
      }

      setLoading(false);
    };

    loadPosts();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050610] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-600/15 blur-[130px]" />
        <div className="absolute right-0 top-[45%] h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050610_85%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-200">
            <BriefcaseBusiness className="h-4 w-4" />
            Join Butterfly Network
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Become Part of
            <span className="mt-2 block bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
              Our Community
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Interested in joining our team? Explore the available
            positions below, read their requirements, and apply for
            a role that matches your interests and skills.
          </p>
        </motion.section>

        {/* Instructions */}
        <section className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <FileText className="mb-4 h-6 w-6 text-purple-300" />
            <h2 className="font-bold">1. Explore Positions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Read the available positions and their descriptions
              before applying.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <ShieldCheck className="mb-4 h-6 w-6 text-cyan-300" />
            <h2 className="font-bold">2. Check Requirements</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Make sure you understand the responsibilities and
              requirements of your chosen position.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Clock className="mb-4 h-6 w-6 text-fuchsia-300" />
            <h2 className="font-bold">3. Submit an Application</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Complete the application form with accurate
              information when you are ready.
            </p>
          </div>
        </section>

        {/* Available positions */}
        <section className="mt-20">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
              Opportunities
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Available Positions
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Browse the currently available application posts.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-slate-300">
              <LoaderCircle className="h-5 w-5 animate-spin text-purple-300" />
              Loading available positions...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-500" />
              <h3 className="mt-5 text-xl font-bold">
                No Open Positions Right Now
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
                There are currently no active applications. Please
                check back later for new opportunities.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d1a]/80 transition duration-300 hover:-translate-y-1 hover:border-purple-400/35 hover:shadow-[0_15px_50px_rgba(139,92,246,0.09)]"
                >
                  {post.image_url ? (
                    <div className="h-44 overflow-hidden bg-white/5">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center border-b border-white/5 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10">
                      <BriefcaseBusiness className="h-9 w-9 text-purple-300/80" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Open
                      </span>
                      <span className="text-xs text-slate-500">
                        Application Available
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold">
                      {post.title}
                    </h3>

                    <p className="mt-3 flex-1 whitespace-pre-line text-sm leading-7 text-slate-400">
                      {post.short_description ||
                        post.description ||
                        'Read more about this position and its responsibilities.'}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        window.location.assign(
                          `/apply/form?post=${encodeURIComponent(post.slug)}`
                        )
                      }
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:from-purple-500 hover:to-indigo-500"
                    >
                      Apply Now
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* Footer note */}
        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-slate-500">
            Please provide accurate information when submitting
            your application.
          </p>
        </div>
      </div>
    </main>
  );
};

export default ApplyPage;
