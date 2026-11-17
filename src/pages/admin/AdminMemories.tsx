import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { isExternalMediaUrl } from '../../lib/seasonMemories';
import { SeasonMemoryMedia } from '../../components/SeasonMemoryMedia';

type SectionType = 'gallery' | 'teams' | 'custom';
type ItemType = 'image' | 'video' | 'team' | 'text';

interface Season {
  id: string;
  season_number: number;
  name: string;
  status: string;
}

interface MemorySection {
  id: string;
  season_id: string;
  title: string;
  description: string;
  section_type: SectionType;
  sort_order: number;
  is_visible: boolean;
}

interface MemoryItem {
  id: string;
  section_id: string;
  title: string;
  description: string;
  item_type: ItemType;
  media_url: string;
  sort_order: number;
  is_visible: boolean;
}

const emptySection = {
  title: '',
  description: '',
  section_type: 'gallery' as SectionType,
  sort_order: '0',
  is_visible: true,
};

const emptyItem = {
  title: '',
  description: '',
  item_type: 'image' as ItemType,
  media_url: '',
  sort_order: '0',
  is_visible: true,
};

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-400/50';

export const AdminMemories: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [sections, setSections] = useState<MemorySection[]>([]);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sectionForm, setSectionForm] = useState(emptySection);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [sectionEditorOpen, setSectionEditorOpen] = useState(false);
  const [itemEditorOpen, setItemEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [seasonResult, sectionResult, itemResult] = await Promise.all([
        supabase
          .from('seasons')
          .select('id, season_number, name, status')
          .order('season_number', { ascending: false }),
        supabase
          .from('season_memory_sections')
          .select('id, season_id, title, description, section_type, sort_order, is_visible')
          .order('sort_order', { ascending: true }),
        supabase
          .from('season_memory_items')
          .select('id, section_id, title, description, item_type, media_url, sort_order, is_visible')
          .order('sort_order', { ascending: true }),
      ]);

      const loadError = seasonResult.error || sectionResult.error || itemResult.error;
      if (loadError) {
        console.error('Season memories load failed:', loadError);
        setError(
          `Memories could not be loaded: ${loadError.message}. Check that supabase-season-memories.sql has been run and the Memories permission is enabled.`
        );
        return;
      }

      const seasonRows = (seasonResult.data ?? []) as Season[];
      setSeasons(seasonRows);
      setSections((sectionResult.data ?? []) as MemorySection[]);
      setItems((itemResult.data ?? []) as MemoryItem[]);
      if (!selectedSeasonId && seasonRows.length > 0) {
        setSelectedSeasonId(seasonRows[0].id);
      }
    } catch (loadError) {
      console.error('Season memories load failed:', loadError);
      setError(
        `Memories could not be loaded: ${loadError instanceof Error ? loadError.message : String(loadError)}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null;
  const seasonSections = useMemo(
    () => sections.filter((section) => section.season_id === selectedSeasonId),
    [sections, selectedSeasonId]
  );
  const selectedSection =
    seasonSections.find((section) => section.id === selectedSectionId) ?? null;
  const sectionItems = useMemo(
    () => items.filter((item) => item.section_id === selectedSectionId),
    [items, selectedSectionId]
  );

  useEffect(() => {
    if (!seasonSections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(seasonSections[0]?.id ?? '');
      setItemEditorOpen(false);
      setEditingItemId(null);
    }
  }, [seasonSections, selectedSectionId]);

  const saveSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSeasonId) {
      setError('Create or select a season in Admin → Seasons first.');
      return;
    }

    const title = sectionForm.title.trim();
    const sortOrder = Number(sectionForm.sort_order);
    if (!title) {
      setError('Section title is required.');
      return;
    }
    if (!Number.isInteger(sortOrder)) {
      setError('Section order must be a whole number.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      season_id: selectedSeasonId,
      title,
      description: sectionForm.description.trim(),
      section_type: sectionForm.section_type,
      sort_order: sortOrder,
      is_visible: sectionForm.is_visible,
    };
    const result = editingSectionId
      ? await supabase
          .from('season_memory_sections')
          .update(payload)
          .eq('id', editingSectionId)
      : await supabase.from('season_memory_sections').insert(payload);

    if (result.error) {
      console.error('Season memory section save failed:', result.error);
      setError(`Section could not be saved: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setNotice(editingSectionId ? 'Section updated.' : 'Section added.');
    setSectionForm(emptySection);
    setEditingSectionId(null);
    setSectionEditorOpen(false);
    await loadData();
    setSaving(false);
  };

  const editSection = (section: MemorySection) => {
    setSelectedSectionId(section.id);
    setEditingSectionId(section.id);
    setSectionForm({
      title: section.title,
      description: section.description,
      section_type: section.section_type,
      sort_order: String(section.sort_order),
      is_visible: section.is_visible,
    });
    setSectionEditorOpen(true);
    setError('');
  };

  const deleteSection = async (section: MemorySection) => {
    if (!window.confirm(`Delete "${section.title}" and all its entries?`)) return;

    const { error: deleteError } = await supabase
      .from('season_memory_sections')
      .delete()
      .eq('id', section.id);

    if (deleteError) {
      console.error('Season memory section delete failed:', deleteError);
      setError(`Section could not be deleted: ${deleteError.message}`);
      return;
    }

    setNotice('Section and its entries deleted.');
    await loadData();
  };

  const saveItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSection) {
      setError('Select a section before adding an entry.');
      return;
    }

    const title = itemForm.title.trim();
    const mediaUrl = itemForm.media_url.trim();
    const sortOrder = Number(itemForm.sort_order);

    if (
      (itemForm.item_type === 'team' || itemForm.item_type === 'text') &&
      !title
    ) {
      setError('A title is required for team and text entries.');
      return;
    }
    if (
      (itemForm.item_type === 'image' || itemForm.item_type === 'video') &&
      !isExternalMediaUrl(mediaUrl)
    ) {
      setError('Enter a valid http(s) URL for the image or video.');
      return;
    }
    if (itemForm.item_type === 'team' && mediaUrl && !isExternalMediaUrl(mediaUrl)) {
      setError('Team logo URL must be a valid http(s) URL.');
      return;
    }
    if (!Number.isInteger(sortOrder)) {
      setError('Entry order must be a whole number.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      section_id: selectedSection.id,
      title,
      description: itemForm.description.trim(),
      item_type: itemForm.item_type,
      media_url: mediaUrl,
      sort_order: sortOrder,
      is_visible: itemForm.is_visible,
    };
    const result = editingItemId
      ? await supabase
          .from('season_memory_items')
          .update(payload)
          .eq('id', editingItemId)
      : await supabase.from('season_memory_items').insert(payload);

    if (result.error) {
      console.error('Season memory entry save failed:', result.error);
      setError(`Entry could not be saved: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setNotice(editingItemId ? 'Entry updated.' : 'Entry added.');
    setItemForm(emptyItem);
    setEditingItemId(null);
    setItemEditorOpen(false);
    await loadData();
    setSaving(false);
  };

  const editItem = (item: MemoryItem) => {
    setEditingItemId(item.id);
    setItemForm({
      title: item.title,
      description: item.description,
      item_type: item.item_type,
      media_url: item.media_url,
      sort_order: String(item.sort_order),
      is_visible: item.is_visible,
    });
    setItemEditorOpen(true);
    setError('');
  };

  const deleteItem = async (item: MemoryItem) => {
    if (!window.confirm(`Delete "${item.title || item.item_type}"?`)) return;

    const { error: deleteError } = await supabase
      .from('season_memory_items')
      .delete()
      .eq('id', item.id);

    if (deleteError) {
      console.error('Season memory entry delete failed:', deleteError);
      setError(`Entry could not be deleted: ${deleteError.message}`);
      return;
    }

    setNotice('Entry deleted.');
    await loadData();
  };

  const availableItemTypes: ItemType[] =
    selectedSection?.section_type === 'gallery'
      ? ['image', 'video']
      : selectedSection?.section_type === 'teams'
        ? ['team']
        : ['image', 'video', 'team', 'text'];

  return (
    <AdminLayout active="memories" permission="memories">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              Season Archive
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">Memories</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Build season galleries, highlight top teams, and add sections using external media links.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh
          </button>
        </header>

        {(error || notice) && (
          <div
            role={error ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              error
                ? 'border-red-400/20 bg-red-400/[0.06] text-red-200'
                : 'border-green-400/20 bg-green-400/[0.06] text-green-200'
            }`}
          >
            {error ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : null}
            <span>{error || notice}</span>
          </div>
        )}

        {loading && seasons.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
            Loading memories…
          </div>
        ) : seasons.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="font-bold text-white">No seasons found</h2>
            <p className="mt-2 text-sm text-slate-400">
              Create seasons in Admin → Seasons before adding memories.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <label htmlFor="memory-season" className="mb-2 block text-sm font-semibold text-slate-300">
                Select season
              </label>
              <select
                id="memory-season"
                value={selectedSeasonId}
                onChange={(event) => {
                  setSelectedSeasonId(event.target.value);
                  setSectionEditorOpen(false);
                  setItemEditorOpen(false);
                  setEditingSectionId(null);
                  setEditingItemId(null);
                }}
                className={`${inputClass} max-w-xl`}
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id} className="bg-slate-900">
                    S{season.season_number} · {season.name} · {season.status}
                  </option>
                ))}
              </select>
              {selectedSeason && (
                <p className="mt-2 text-xs text-slate-500">
                  Season details and cover images are managed in Admin → Seasons.
                </p>
              )}
            </section>

            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-white">Sections</h2>
                    <p className="mt-1 text-xs text-slate-500">Order controls how they appear publicly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSectionForm({ ...emptySection, sort_order: String(seasonSections.length * 10) });
                      setEditingSectionId(null);
                      setSectionEditorOpen(true);
                      setError('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {seasonSections.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                    No sections yet. Add a Gallery, Top Teams, or Custom section.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {seasonSections.map((section) => (
                      <div
                        key={section.id}
                        className={`rounded-xl border p-3 ${
                          selectedSectionId === section.id
                            ? 'border-purple-400/30 bg-purple-500/[0.08]'
                            : 'border-white/10 bg-black/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSectionId(section.id);
                            setItemEditorOpen(false);
                            setEditingItemId(null);
                          }}
                          className="w-full text-left"
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-white">{section.title}</span>
                            <span className={`text-[10px] font-bold uppercase ${section.is_visible ? 'text-green-300' : 'text-slate-500'}`}>
                              {section.is_visible ? 'Visible' : 'Hidden'}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs capitalize text-slate-500">
                            {section.section_type} · order {section.sort_order}
                          </span>
                        </button>
                        <div className="mt-3 flex gap-2 border-t border-white/5 pt-2">
                          <button
                            type="button"
                            onClick={() => editSection(section)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSection(section)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {sectionEditorOpen && (
                  <form onSubmit={saveSection} className="space-y-3 rounded-xl border border-purple-400/20 bg-purple-500/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white">
                        {editingSectionId ? 'Edit section' : 'New section'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setSectionEditorOpen(false);
                          setEditingSectionId(null);
                        }}
                        aria-label="Close section form"
                        className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      value={sectionForm.title}
                      onChange={(event) => setSectionForm({ ...sectionForm, title: event.target.value })}
                      placeholder="Section title, e.g. Top Teams"
                      maxLength={100}
                      className={inputClass}
                    />
                    <textarea
                      value={sectionForm.description}
                      onChange={(event) => setSectionForm({ ...sectionForm, description: event.target.value })}
                      placeholder="Short description (optional)"
                      rows={2}
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={sectionForm.section_type}
                        onChange={(event) => setSectionForm({ ...sectionForm, section_type: event.target.value as SectionType })}
                        className={inputClass}
                      >
                        <option value="gallery" className="bg-slate-900">Gallery</option>
                        <option value="teams" className="bg-slate-900">Top Teams</option>
                        <option value="custom" className="bg-slate-900">Custom</option>
                      </select>
                      <input
                        type="number"
                        step="1"
                        value={sectionForm.sort_order}
                        onChange={(event) => setSectionForm({ ...sectionForm, sort_order: event.target.value })}
                        aria-label="Section order"
                        className={inputClass}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={sectionForm.is_visible}
                        onChange={(event) => setSectionForm({ ...sectionForm, is_visible: event.target.checked })}
                      />
                      Visible on public Memories page
                    </label>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save section
                    </button>
                  </form>
                )}
              </section>

              <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {selectedSection ? (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                          {selectedSeason ? `S${selectedSeason.season_number} · ${selectedSeason.name}` : 'Season'}
                        </p>
                        <h2 className="mt-1 text-xl font-black text-white">{selectedSection.title}</h2>
                        {selectedSection.description && (
                          <p className="mt-1 text-sm text-slate-400">{selectedSection.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultType = selectedSection.section_type === 'teams'
                            ? 'team'
                            : 'image';
                          setItemForm({ ...emptyItem, item_type: defaultType, sort_order: String(sectionItems.length * 10) });
                          setEditingItemId(null);
                          setItemEditorOpen(true);
                          setError('');
                        }}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500"
                      >
                        <Plus className="h-4 w-4" />
                        Add entry
                      </button>
                    </div>

                    {itemEditorOpen && (
                      <form onSubmit={saveItem} className="space-y-4 rounded-xl border border-purple-400/20 bg-purple-500/[0.04] p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white">{editingItemId ? 'Edit entry' : 'New entry'}</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setItemEditorOpen(false);
                              setEditingItemId(null);
                            }}
                            aria-label="Close entry form"
                            className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {availableItemTypes.length > 1 && (
                          <label className="block space-y-2 text-xs font-semibold text-slate-300">
                            Entry type
                            <select
                              value={itemForm.item_type}
                              onChange={(event) => setItemForm({ ...itemForm, item_type: event.target.value as ItemType })}
                              className={inputClass}
                            >
                              {availableItemTypes.map((type) => (
                                <option key={type} value={type} className="bg-slate-900">
                                  {type === 'team' ? 'Team' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <input
                          value={itemForm.title}
                          onChange={(event) => setItemForm({ ...itemForm, title: event.target.value })}
                          placeholder={itemForm.item_type === 'team' ? 'Team name' : 'Title (optional for media)'}
                          maxLength={120}
                          className={inputClass}
                        />
                        <textarea
                          value={itemForm.description}
                          onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })}
                          placeholder={itemForm.item_type === 'team' ? 'Members, placement, or achievement' : 'Description or caption (optional)'}
                          rows={3}
                          className={inputClass}
                        />
                        {(itemForm.item_type === 'image' || itemForm.item_type === 'video' || itemForm.item_type === 'team') && (
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-slate-300">
                              {itemForm.item_type === 'team' ? 'Team logo URL (optional)' : `${itemForm.item_type === 'image' ? 'Image' : 'Video'} URL`}
                            </label>
                            <input
                              type="url"
                              value={itemForm.media_url}
                              onChange={(event) => setItemForm({ ...itemForm, media_url: event.target.value })}
                              placeholder={
                                itemForm.item_type === 'video'
                                  ? 'https://youtu.be/... or direct .mp4 URL'
                                  : 'https://...'
                              }
                              className={inputClass}
                            />
                            <p className="mt-1 text-xs text-slate-500">
                              External link only. Files are not uploaded to Supabase Storage.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={itemForm.is_visible}
                              onChange={(event) => setItemForm({ ...itemForm, is_visible: event.target.checked })}
                            />
                            Public
                          </label>
                          <input
                            type="number"
                            step="1"
                            value={itemForm.sort_order}
                            onChange={(event) => setItemForm({ ...itemForm, sort_order: event.target.value })}
                            aria-label="Entry order"
                            className={inputClass}
                          />
                        </div>
                        {(itemForm.item_type === 'image' || itemForm.item_type === 'video') && isExternalMediaUrl(itemForm.media_url) && (
                          <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/30">
                            <SeasonMemoryMedia
                              type={itemForm.item_type}
                              url={itemForm.media_url}
                              title={itemForm.title}
                            />
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save entry
                        </button>
                      </form>
                    )}

                    {sectionItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                        No entries in this section yet.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {sectionItems.map((item) => (
                          <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/15">
                            {(item.item_type === 'image' || item.item_type === 'team') && item.media_url && (
                              <div className="aspect-video bg-black/30">
                                <img src={item.media_url} alt={item.title || 'Memory'} loading="lazy" className="h-full w-full object-cover" />
                              </div>
                            )}
                            {item.item_type === 'video' && (
                              <a
                                href={item.media_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex aspect-video items-center justify-center gap-2 bg-black/40 text-sm font-semibold text-purple-200 hover:bg-black/60"
                              >
                                <Video className="h-5 w-5" />
                                Open video link
                              </a>
                            )}
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-bold text-white">{item.title || (item.item_type === 'video' ? 'Video' : 'Image')}</h3>
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {item.item_type} · order {item.sort_order} · {item.is_visible ? 'public' : 'hidden'}
                                  </p>
                                </div>
                                {item.item_type === 'image' ? (
                                  <ImageIcon className="h-4 w-4 shrink-0 text-purple-300" />
                                ) : null}
                              </div>
                              {item.description && (
                                <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-400">{item.description}</p>
                              )}
                              {item.media_url && item.item_type !== 'image' && item.item_type !== 'team' && (
                                <a href={item.media_url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-purple-300 underline">
                                  {item.media_url}
                                </a>
                              )}
                              <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
                                <button
                                  type="button"
                                  onClick={() => editItem(item)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteItem(item)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 text-center">
                    <ArrowUp className="h-6 w-6 text-purple-300" />
                    <h2 className="mt-3 font-bold text-white">Choose or create a section</h2>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add galleries, top team highlights, or custom season memories.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMemories;
