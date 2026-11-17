import React, { useEffect, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  FileSignature,
  Gamepad2,
  Image,
  Mail,
  Scale,
  Settings,
  ShieldCheck,
  Terminal,
  Vote,
  RefreshCw,
  CircleHelp,
  ShoppingBag,
  MessageSquare,
  LayoutDashboard,
} from 'lucide-react';

import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ActivityEntry {
  id: string;
  actor_name: string;
  actor_role: string;
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'visibility_changed'
    | 'role_changed';
  section: string;
  item_name: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface SectionSummary {
  label: string;
  description: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  accent: string;
  items?: string[];
}

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const actionLabel = (action: ActivityEntry['action']) => ({
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  visibility_changed: 'Visibility changed',
  role_changed: 'Role changed',
}[action]);

const actionStyle = (action: ActivityEntry['action']) =>
  action === 'deleted'
    ? 'text-red-300 bg-red-400/10 border-red-400/20'
    : action === 'created'
      ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20'
      : 'text-sky-300 bg-sky-400/10 border-sky-400/20';

const detailText = (value: unknown) => {
  if (value === null || value === undefined) return 'None';

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

export const AdminDashboard: React.FC = () => {
  const { email, role } = useAuth();

  const [history, setHistory] = useState<ActivityEntry[]>([]);
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityEntry | null>(null);

  const [sections, setSections] = useState<SectionSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let requestInProgress = false;

    const loadDashboard = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      setLoading(true);

      try {
        const [
          activityResult,
          modesResult,
          pagesResult,
          itemsResult,
          rolesResult,
          settingsResult,
          postsResult,
        ] = await Promise.all([
          supabase
            .from('admin_activity_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),

          supabase
            .from('game_modes')
            .select('name, is_active'),

          supabase
            .from('site_pages')
            .select('title, route, is_visible')
            .order('created_at', { ascending: false }),

          supabase
            .from('site_page_items')
            .select('page_key, is_visible'),

          supabase
            .from('custom_roles')
            .select('name'),

          supabase
            .from('site_settings')
            .select('site_name')
            .eq('id', true)
            .maybeSingle(),

          supabase
            .from('posts')
            .select('id'),
        ]);

        if (cancelled) return;

        if (activityResult.error) {
          setHistoryError(
            'Run supabase-admin-activity-log.sql once to enable full history.'
          );
        } else {
          const entries = (activityResult.data ?? []) as ActivityEntry[];
          setHistory(entries);
          setHistoryError('');
        }

        const modes = modesResult.data ?? [];
        const pages = pagesResult.data ?? [];
        const items = itemsResult.data ?? [];
        const roles = rolesResult.data ?? [];
        const posts = postsResult.data ?? [];
        const queryErrors = [
          { label: 'Game modes', error: modesResult.error },
          { label: 'Pages', error: pagesResult.error },
          { label: 'Page content', error: itemsResult.error },
          { label: 'Roles', error: rolesResult.error },
          { label: 'Site settings', error: settingsResult.error },
          { label: 'Social posts', error: postsResult.error },
        ]
          .filter((result) => result.error)
          .map((result) => `${result.label}: ${result.error?.message}`);
        setDashboardError(
          queryErrors.length
            ? `Some dashboard details could not be loaded. ${queryErrors.join(' · ')}`
            : ''
        );

      setSections([
        {
          label: 'Site Settings',
          description:
            'Brand, server, social and homepage settings',
          value:
            settingsResult.data?.site_name ||
            (settingsResult.error ? 'Unavailable' : 'Configured'),
          detail: settingsResult.error
            ? settingsResult.error.message
            : '1 settings record',
          icon: Settings,
          accent: 'text-purple-300',
        },

        {
          label: 'Game Modes',
          description:
            'All game modes and their active status',
          value: modesResult.error ? 'Unavailable' : String(modes.length),
          detail: modesResult.error
            ? modesResult.error.message
            : `${modes.filter((mode) => mode.is_active).length} active modes`,
          icon: Gamepad2,
          accent: 'text-cyan-300',
          items: modes.map((mode) => mode.name),
        },

        {
          label: 'Pages',
          description:
            'Menu pages, order and visibility',
          value: pagesResult.error ? 'Unavailable' : String(pages.length),
          detail: pagesResult.error
            ? pagesResult.error.message
            : `${pages.filter((page) => page.is_visible).length} visible · ${pages.filter((page) => !page.is_visible).length} hidden`,
          icon: FileText,
          accent: 'text-sky-300',
          items: pages.map((page) => `${page.title} · ${page.route}`),
        },

        {
          label: 'Rules Content',
          description:
            'Rules items and moderation information',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'rules'
            ).length
          ),
          detail: 'content items',
          icon: Scale,
          accent: 'text-amber-300',
        },

        {
          label: 'Terms Content',
          description:
            'Terms and policy sections',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'terms'
            ).length
          ),
          detail: 'content items',
          icon: FileSignature,
          accent: 'text-orange-300',
        },

        {
          label: 'Contact Content',
          description:
            'Contact channels and support links',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'contact'
            ).length
          ),
          detail: 'contact items',
          icon: Mail,
          accent: 'text-emerald-300',
        },

        {
          label: 'Events Content',
          description:
            'Events, dates and announcements',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'events'
            ).length
          ),
          detail: 'event items',
          icon: CalendarDays,
          accent: 'text-rose-300',
        },

        {
          label: 'Gallery Content',
          description:
            'Gallery images and captions',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'gallery'
            ).length
          ),
          detail: 'gallery items',
          icon: Image,
          accent: 'text-pink-300',
        },

        {
          label: 'Commands Content',
          description:
            'Server commands and explanations',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'commands'
            ).length
          ),
          detail: 'command items',
          icon: Terminal,
          accent: 'text-lime-300',
        },

        {
          label: 'Vote Content',
          description:
            'Voting rewards and external links',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'vote'
            ).length
          ),
          detail: 'vote items',
          icon: Vote,
          accent: 'text-violet-300',
        },

        {
          label: 'Home Content',
          description:
            'Homepage sections and features',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'home'
            ).length
          ),
          detail: 'home items',
          icon: LayoutDashboard,
          accent: 'text-indigo-300',
        },

        {
          label: 'FAQ Content',
          description:
            'Frequently asked questions',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'faq'
            ).length
          ),
          detail: 'faq items',
          icon: CircleHelp,
          accent: 'text-blue-300',
        },

        {
          label: 'Blog Content',
          description:
            'Blog posts and articles',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'blog'
            ).length
          ),
          detail: 'blog items',
          icon: FileText,
          accent: 'text-teal-300',
        },

        {
          label: 'Minecraft Store',
          description:
            'Store items and packages',
          value: itemsResult.error ? 'Unavailable' : String(
            items.filter(
              (item) => item.page_key === 'store'
            ).length
          ),
          detail: 'store items',
          icon: ShoppingBag,
          accent: 'text-green-300',
        },

        {
          label: 'Social Management',
          description:
            'Community posts and interactions',
          value: postsResult.error ? 'Unavailable' : String(posts.length),
          detail: 'total posts',
          icon: MessageSquare,
          accent: 'text-fuchsia-300',
        },

        {
          label: 'Manage Roles',
          description:
            'Custom roles and site access control',
          value: rolesResult.error ? 'Unavailable' : String(roles.length),
          detail: 'custom roles',
          icon: ShieldCheck,
          accent: 'text-yellow-300',
        },
      ]);

      } catch (error) {
        if (cancelled) return;
        console.error('Admin dashboard load failed:', error);
        setDashboardError(
          `Dashboard could not be refreshed: ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        requestInProgress = false;
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();
    const refreshInterval = window.setInterval(() => void loadDashboard(), 30_000);
    window.addEventListener('focus', loadDashboard);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', loadDashboard);
    };
  }, [refreshKey]);

  return (
    <AdminLayout
      active="dashboard"
      permission="dashboard"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-2xl font-bold">Welcome back</h2>
          <p className="text-slate-400">Logged in as {email} ({role})</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh details
        </button>
      </div>

      {dashboardError && (
        <div role="alert" className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-100">
          {dashboardError}
        </div>
      )}

      {/* =====================================================
          EXISTING DASHBOARD
      ====================================================== */}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">

        <aside className="order-2 h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-6">

          <div className="mb-4 flex items-center justify-between gap-3">

            <div>
              <h3 className="font-semibold">
                Activity History
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Every admin change in one place
              </p>
            </div>

            <Activity className="h-5 w-5 text-purple-300" />

          </div>

          {historyError ? (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-200">
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <p className="rounded-xl border border-white/10 p-3 text-sm text-slate-500">
              No activity recorded yet.
            </p>
          ) : (
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">

              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() =>
                    setSelectedActivity((current) =>
                      current?.id === entry.id
                        ? null
                        : entry
                    )
                  }
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedActivity?.id === entry.id
                      ? 'border-purple-400/40 bg-purple-400/10'
                      : 'border-white/10 bg-black/10 hover:bg-white/5'
                  }`}
                >

                  <div className="flex items-start justify-between gap-2">

                    <span className="truncate text-sm font-medium text-slate-200">
                      {entry.item_name || entry.section}
                    </span>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${actionStyle(
                        entry.action
                      )}`}
                    >
                      {actionLabel(entry.action)}
                    </span>

                  </div>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {entry.actor_name} · {entry.actor_role} ·{' '}
                    {entry.section}
                  </p>

                  {selectedActivity?.id === entry.id && (
                    <div className="mt-3 border-t border-white/10 pt-3">

                      <p className="text-xs text-slate-500">
                        {formatDateTime(entry.created_at)}
                      </p>

                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-2 text-[11px] leading-relaxed text-slate-300">
                        {detailText(entry.details)}
                      </pre>

                    </div>
                  )}

                </button>
              ))}

            </div>
          )}

        </aside>

        <section className="order-1">

          <div className="mb-4 flex items-center justify-between gap-3">

            <div>
              <h3 className="text-lg font-semibold">
                Admin Sections
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Separate live details for everything managed from this panel.
              </p>
            </div>

            <Eye className="h-5 w-5 text-slate-500" />

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">

            {sections.map((section) => {

              const Icon = section.icon;

              return (
                <div
                  key={section.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h4
                        className={`font-semibold ${section.accent}`}
                      >
                        {section.label}
                      </h4>

                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {section.description}
                      </p>

                    </div>

                    <Icon
                      className={`h-5 w-5 shrink-0 ${section.accent}`}
                    />

                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">

                    <div>

                      <p className="text-2xl font-bold text-white">
                        {loading ? '...' : section.value}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {section.detail}
                      </p>

                    </div>

                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />

                  </div>

                  {section.items && section.items.length > 0 && (
                    <ul className="mt-4 max-h-32 space-y-1.5 overflow-y-auto border-t border-white/5 pt-3">
                      {section.items.map((item, index) => (
                        <li
                          key={`${section.label}-${index}`}
                          className="truncate text-xs text-slate-400"
                          title={item}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                </div>
              );
            })}

          </div>

        </section>

      </div>
    </AdminLayout>
  );
};