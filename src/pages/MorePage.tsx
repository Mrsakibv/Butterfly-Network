import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowUpRight, Compass, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';

interface MorePageLink {
  label: string;
  href: string;
}

const FALLBACK_LINKS: MorePageLink[] = [
  { label: 'Games', href: '/games' },
  { label: 'Blog', href: '/blog' },
  { label: 'Memories', href: '/memories' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Terms', href: '/terms' },
  { label: 'Rules', href: '/rules' },
  { label: 'Contact', href: '/contact' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Commands', href: '/commands' },
  { label: 'Vote', href: '/vote' },
  { label: 'Players Online', href: '/players' },
];

export const MorePage: React.FC = () => {
  const { navigate } = useRouter();
  const [links, setLinks] = useState<MorePageLink[]>(FALLBACK_LINKS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'More | Butterfly Network';

    let cancelled = false;
    const loadMorePages = async () => {
      const { data, error } = await supabase
        .from('site_pages')
        .select('menu_label, route, menu_group, sort_order, is_visible')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('More pages load failed:', error);
        setLoadError(`Could not load the latest More menu pages: ${error.message}`);
        setLinks(FALLBACK_LINKS);
        setLoading(false);
        return;
      }

      const mainLinks = (data ?? [])
        .filter((item) => item.menu_group === 'main' && item.route)
        .map((item) => ({
          label: item.menu_label || 'Page',
          href: item.route,
        }));

      const moreLinks = (data ?? [])
        .filter((item) => item.menu_group === 'more' && item.route)
        .map((item) => ({
          label: item.menu_label || 'Page',
          href: item.route,
        }));

      if (!moreLinks.some((item) => item.href === '/games')) {
        moreLinks.push({ label: 'Games', href: '/games' });
      }

      if (!moreLinks.some((item) => item.href === '/blog')) {
        moreLinks.push({ label: 'Blog', href: '/blog' });
      }

      if (!moreLinks.some((item) => item.href === '/memories')) {
        moreLinks.push({ label: 'Memories', href: '/memories' });
      }

      const hasFaq = [...mainLinks, ...moreLinks].some(
        (item) => item.href === '/faq' || item.label.toLowerCase() === 'faq'
      );
      if (!hasFaq) {
        moreLinks.unshift({ label: 'FAQ', href: '/faq' });
      }

      const uniqueLinks = moreLinks.filter(
        (item, index, items) =>
          item.href !== '/more' &&
          items.findIndex((candidate) => candidate.href === item.href) === index
      );

      setLinks(uniqueLinks);
      setLoading(false);
    };

    void loadMorePages();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen px-4 pb-20 pt-32 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-200">
            <Compass className="h-4 w-4" />
            Butterfly Network
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Explore More
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Find games, community pages, server information, and other features in one place.
          </p>
        </header>

        {loadError && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{loadError} Showing the default page list.</span>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
            Loading pages…
          </div>
        ) : (
          <nav aria-label="More pages" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  if (link.href.startsWith('/')) {
                    event.preventDefault();
                    navigate(link.href);
                  }
                }}
                className="group flex min-h-28 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-purple-400/30 hover:bg-purple-500/[0.06]"
              >
                <span className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-200">
                    <Compass className="h-5 w-5" />
                  </span>
                  <span className="text-base font-bold text-white">{link.label}</span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:text-purple-200" />
              </a>
            ))}
          </nav>
        )}
      </div>
    </main>
  );
};

export default MorePage;
