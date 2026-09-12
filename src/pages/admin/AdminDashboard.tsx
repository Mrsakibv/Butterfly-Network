import React, { useEffect, useState } from 'react';
import { Activity, CalendarDays, CheckCircle2, Eye, FileText, FileSignature, Gamepad2, Image, Mail, Scale, Settings, ShieldCheck, Terminal, Vote } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ActivityEntry {
  id: string;
  actor_name: string;
  actor_role: string;
  action: 'created' | 'updated' | 'deleted' | 'visibility_changed' | 'role_changed';
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
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const actionLabel = (action: ActivityEntry['action']) => ({
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  visibility_changed: 'Visibility changed',
  role_changed: 'Role changed',
}[action]);

const actionStyle = (action: ActivityEntry['action']) => action === 'deleted'
  ? 'text-red-300 bg-red-400/10 border-red-400/20'
  : action === 'created'
    ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20'
    : 'text-sky-300 bg-sky-400/10 border-sky-400/20';

const detailText = (value: unknown) => {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

export const AdminDashboard: React.FC = () => {
  const { email, role } = useAuth();
  const [history, setHistory] = useState<ActivityEntry[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEntry | null>(null);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      const [activityResult, modesResult, pagesResult, itemsResult, rolesResult, settingsResult] = await Promise.all([
        supabase.from('admin_activity_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('game_modes').select('name, is_active'),
        supabase.from('site_pages').select('title, is_visible'),
        supabase.from('site_page_items').select('page_key, is_visible'),
        supabase.from('custom_roles').select('name'),
        supabase.from('site_settings').select('site_name').eq('id', true).maybeSingle(),
      ]);

      if (activityResult.error) {
        setHistoryError('Run supabase-admin-activity-log.sql once to enable full history.');
      } else {
        const entries = (activityResult.data ?? []) as ActivityEntry[];
        setHistory(entries);
      }

      const modes = modesResult.data ?? [];
      const pages = pagesResult.data ?? [];
      const items = itemsResult.data ?? [];
      const roles = rolesResult.data ?? [];
      setSections([
        { label: 'Site Settings', description: 'Brand, server, social and homepage settings', value: settingsResult.data?.site_name || 'Configured', detail: '1 settings record', icon: Settings, accent: 'text-purple-300' },
        { label: 'Game Modes', description: 'All game modes and their active status', value: String(modes.filter((mode) => mode.is_active).length), detail: `${modes.length} total modes`, icon: Gamepad2, accent: 'text-cyan-300' },
        { label: 'Pages', description: 'Menu pages, order and visibility', value: String(pages.filter((page) => page.is_visible).length), detail: `${pages.length} total pages`, icon: FileText, accent: 'text-sky-300' },
        { label: 'Rules Content', description: 'Rules items and moderation information', value: String(items.filter((item) => item.page_key === 'rules').length), detail: 'content items', icon: Scale, accent: 'text-amber-300' },
        { label: 'Terms Content', description: 'Terms and policy sections', value: String(items.filter((item) => item.page_key === 'terms').length), detail: 'content items', icon: FileSignature, accent: 'text-orange-300' },
        { label: 'Contact Content', description: 'Contact channels and support links', value: String(items.filter((item) => item.page_key === 'contact').length), detail: 'contact items', icon: Mail, accent: 'text-emerald-300' },
        { label: 'Events Content', description: 'Events, dates and announcements', value: String(items.filter((item) => item.page_key === 'events').length), detail: 'event items', icon: CalendarDays, accent: 'text-rose-300' },
        { label: 'Gallery Content', description: 'Gallery images and captions', value: String(items.filter((item) => item.page_key === 'gallery').length), detail: 'gallery items', icon: Image, accent: 'text-pink-300' },
        { label: 'Commands Content', description: 'Server commands and explanations', value: String(items.filter((item) => item.page_key === 'commands').length), detail: 'command items', icon: Terminal, accent: 'text-lime-300' },
        { label: 'Vote Content', description: 'Voting rewards and external links', value: String(items.filter((item) => item.page_key === 'vote').length), detail: 'vote items', icon: Vote, accent: 'text-violet-300' },
        { label: 'Manage Roles', description: 'Custom roles and site access control', value: String(roles.length), detail: 'custom roles', icon: ShieldCheck, accent: 'text-yellow-300' },
      ]);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  return (
    <AdminLayout active="dashboard" permission="dashboard">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold">Welcome back</h2>
        <p className="text-slate-400">Logged in as {email} ({role})</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,0.85fr)]">
        <aside className="order-2 h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Activity History</h3>
              <p className="mt-1 text-xs text-slate-500">Every admin change in one place</p>
            </div>
            <Activity className="h-5 w-5 text-purple-300" />
          </div>

          {historyError ? (
            <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-200">{historyError}</p>
          ) : history.length === 0 ? (
            <p className="rounded-xl border border-white/10 p-3 text-sm text-slate-500">No activity recorded yet.</p>
          ) : (
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedActivity((current) => current?.id === entry.id ? null : entry)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedActivity?.id === entry.id ? 'border-purple-400/40 bg-purple-400/10' : 'border-white/10 bg-black/10 hover:bg-white/5'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">{entry.item_name || entry.section}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${actionStyle(entry.action)}`}>{actionLabel(entry.action)}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-400">{entry.actor_name} · {entry.actor_role} · {entry.section}</p>
                  {selectedActivity?.id === entry.id && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
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
              <h3 className="text-lg font-semibold">Admin Sections</h3>
              <p className="mt-1 text-sm text-slate-500">Separate live details for everything managed from this panel.</p>
            </div>
            <Eye className="h-5 w-5 text-slate-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className={`font-semibold ${section.accent}`}>{section.label}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">{section.description}</p>
                    </div>
                    <Icon className={`h-5 w-5 shrink-0 ${section.accent}`} />
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{loading ? '...' : section.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{section.detail}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
