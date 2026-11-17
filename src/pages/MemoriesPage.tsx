import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SeasonMemoryMedia } from '../components/SeasonMemoryMedia';

interface Season {
  id: string;
  season_number: number;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  cover_image_url: string | null;
}

interface MemorySection {
  id: string;
  season_id: string;
  title: string;
  description: string;
  section_type: 'gallery' | 'teams' | 'custom';
  sort_order: number;
}

interface MemoryItem {
  id: string;
  section_id: string;
  title: string;
  description: string;
  item_type: 'image' | 'video' | 'team' | 'text';
  media_url: string;
  sort_order: number;
}

export const MemoriesPage: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [sections, setSections] = useState<MemorySection[]>([]);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [error, setError] = useState('');
  const seasonRequestId = useRef(0);

  useEffect(() => {
    document.title = 'Season Memories | Butterfly Network';

    let cancelled = false;
    const loadSeasons = async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('seasons')
          .select('id, season_number, name, slug, status, description, cover_image_url')
          .in('status', ['active', 'completed', 'archived'])
          .order('season_number', { ascending: false });

        if (cancelled) return;
        if (loadError) {
          console.error('Season memories season load failed:', loadError);
          setError(`Seasons could not be loaded: ${loadError.message}`);
        } else {
          setSeasons((data ?? []) as Season[]);
        }
      } catch (loadError) {
        if (cancelled) return;
        console.error('Season memories season load failed:', loadError);
        setError(
          `Seasons could not be loaded: ${loadError instanceof Error ? loadError.message : String(loadError)}`
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSeasons();
    return () => {
      cancelled = true;
    };
  }, []);

  const itemsBySection = useMemo(() => {
    const grouped = new Map<string, MemoryItem[]>();
    for (const item of items) {
      const current = grouped.get(item.section_id) ?? [];
      current.push(item);
      grouped.set(item.section_id, current);
    }
    return grouped;
  }, [items]);

  const openSeason = async (season: Season) => {
    const requestId = ++seasonRequestId.current;
    setSelectedSeason(season);
    setSections([]);
    setItems([]);
    setError('');
    setLoadingSeason(true);

    try {
      const { data: sectionData, error: sectionError } = await supabase
        .from('season_memory_sections')
        .select('id, season_id, title, description, section_type, sort_order')
        .eq('season_id', season.id)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (requestId !== seasonRequestId.current) return;
      if (sectionError) {
        console.error('Season memories section load failed:', sectionError);
        setError(`Season memories could not be loaded: ${sectionError.message}`);
        return;
      }

      const sectionRows = (sectionData ?? []) as MemorySection[];
      setSections(sectionRows);
      if (sectionRows.length > 0) {
        const { data: itemData, error: itemError } = await supabase
          .from('season_memory_items')
          .select('id, section_id, title, description, item_type, media_url, sort_order')
          .in('section_id', sectionRows.map((section) => section.id))
          .eq('is_visible', true)
          .order('sort_order', { ascending: true });

        if (requestId !== seasonRequestId.current) return;
        if (itemError) {
          console.error('Season memories entry load failed:', itemError);
          setError(`Season entries could not be loaded: ${itemError.message}`);
        } else {
          setItems((itemData ?? []) as MemoryItem[]);
        }
      }
    } catch (loadError) {
      if (requestId !== seasonRequestId.current) return;
      console.error('Season memories load failed:', loadError);
      setError(
        `Season memories could not be loaded: ${loadError instanceof Error ? loadError.message : String(loadError)}`
      );
    } finally {
      if (requestId === seasonRequestId.current) setLoadingSeason(false);
    }
  };

  return (
    <main className="min-h-screen px-4 pb-20 pt-32 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-purple-200">
            <Sparkles className="h-4 w-4" />
            Butterfly Network Archive
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Season Memories
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Revisit the teams, moments, and highlights that shaped every season.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selectedSeason ? (
          <section>
            <button
              type="button"
              onClick={() => {
                seasonRequestId.current += 1;
                setSelectedSeason(null);
                setSections([]);
                setItems([]);
                setError('');
              }}
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All Seasons
            </button>

            <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="relative min-h-56 overflow-hidden bg-gradient-to-br from-purple-950/60 via-slate-950 to-sky-950/40 sm:min-h-72">
                {selectedSeason.cover_image_url && (
                  <img
                    src={selectedSeason.cover_image_url}
                    alt={`${selectedSeason.name} cover`}
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                <div className="relative flex min-h-56 flex-col justify-end p-6 sm:min-h-72 sm:p-10">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-200">
                    Season {selectedSeason.season_number} · {selectedSeason.status}
                  </span>
                  <h2 className="mt-2 text-3xl font-black sm:text-5xl">{selectedSeason.name}</h2>
                  {selectedSeason.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200/80">
                      {selectedSeason.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {loadingSeason ? (
              <div className="flex min-h-40 items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
                Loading season memories…
              </div>
            ) : sections.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <h3 className="font-bold text-white">Memories coming soon</h3>
                <p className="mt-2 text-sm text-slate-400">
                  This season does not have any published sections yet.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {sections.map((section) => {
                  const sectionItems = itemsBySection.get(section.id) ?? [];
                  return (
                    <section key={section.id}>
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">
                            {section.section_type === 'teams' ? 'Season Standouts' : section.section_type}
                          </p>
                          <h3 className="mt-1 text-2xl font-black">{section.title}</h3>
                          {section.description && (
                            <p className="mt-1 max-w-2xl text-sm text-slate-400">{section.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {sectionItems.length} {sectionItems.length === 1 ? 'memory' : 'memories'}
                        </span>
                      </div>

                      {sectionItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
                          More memories for this section will be added soon.
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {sectionItems.map((item, index) => (
                            <article
                              key={item.id}
                              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                            >
                              {(item.item_type === 'image' || item.item_type === 'video') && (
                                <div className="aspect-video bg-black/30">
                                  <SeasonMemoryMedia
                                    type={item.item_type}
                                    url={item.media_url}
                                    title={item.title}
                                  />
                                </div>
                              )}
                              {item.item_type === 'team' && item.media_url && (
                                <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-purple-950/30 to-slate-950 p-6">
                                  <img
                                    src={item.media_url}
                                    alt={`${item.title} logo`}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="p-5">
                                {item.item_type === 'team' && (
                                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-200">
                                    Top Team · #{index + 1}
                                  </p>
                                )}
                                {item.title && <h4 className="text-lg font-bold text-white">{item.title}</h4>}
                                {item.description && (
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                    {item.description}
                                  </p>
                                )}
                                {item.item_type === 'text' && !item.title && !item.description && (
                                  <p className="text-sm text-slate-500">No details have been added.</p>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        ) : loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
            Loading seasons…
          </div>
        ) : seasons.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="font-bold text-white">No published seasons yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              Season memories will appear here when the archive is ready.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {seasons.map((season) => (
              <button
                type="button"
                key={season.id}
                onClick={() => void openSeason(season)}
                className="group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/60 via-slate-950 to-sky-950/40 text-left transition hover:-translate-y-1 hover:border-purple-300/30"
              >
                {season.cover_image_url && (
                  <img
                    src={season.cover_image_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-60"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative p-6">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-purple-200">
                    Season {season.season_number} · {season.status}
                  </span>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-black text-white">{season.name}</h2>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition group-hover:border-purple-300/40 group-hover:bg-purple-500/20">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                  {season.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-300/80">
                      {season.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MemoriesPage;
