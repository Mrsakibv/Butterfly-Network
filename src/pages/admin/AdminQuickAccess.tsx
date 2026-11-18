import React, { useMemo, useState } from 'react';
import { ArrowUpRight, LayoutGrid, Search, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from '../../hooks/useRouter';
import { AdminLayout, ADMIN_NAV_ITEMS } from './AdminLayout';

export const AdminQuickAccess: React.FC = () => {
  const { can } = useAuth();
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ADMIN_NAV_ITEMS
      .filter((item) => item.key !== 'quickaccess' && can(item.permission))
      .filter((item) => !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery));
  }, [can, query]);

  return (
    <AdminLayout active="quickaccess" permission="dashboard">
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-purple-300/15 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.2),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200">
              <Sparkles className="h-3.5 w-3.5" />
              Admin shortcuts
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Quick Access
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              All the admin sections you can access, together in one place.
              Pick a section to jump straight to it.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <LayoutGrid className="h-5 w-5 text-purple-300" />
            <span className="text-2xl font-bold text-white">{sections.length}</span>
            <span className="text-xs leading-4 text-slate-500">available<br />sections</span>
          </div>
        </div>

        <label className="relative mt-7 block max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search admin sections..."
            aria-label="Search admin sections"
            className="w-full rounded-xl border border-white/10 bg-black/35 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:bg-black/50"
          />
        </label>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
          <Search className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">No sections match your search.</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.045 } },
          }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.button
                key={section.key}
                type="button"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(section.path)}
                className="group flex min-h-32 items-center gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] p-5 text-left shadow-lg shadow-black/10 transition-colors hover:border-purple-300/25 hover:bg-purple-300/[0.035] focus:outline-none focus:ring-2 focus:ring-purple-400/50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-300/15 bg-purple-300/[0.08] text-purple-200 transition group-hover:border-purple-300/30 group-hover:bg-purple-300/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-100">
                    {section.label}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Open section
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-purple-200" />
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AdminLayout>
  );
};
