import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminActivity';
import {
  Plus,
  Save,
  X,
  CalendarRange,
  Image as ImageIcon,
  CheckCircle2,
  Archive,
  Trash2,
} from 'lucide-react';

interface Season {
  id: string;
  season_number: number;
  name: string;
  slug: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  description: string;
  cover_image_url: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at?: string;
  updated_at?: string;
}

const emptyForm = {
  season_number: '',
  name: '',
  slug: '',
  status: 'upcoming' as Season['status'],
  description: '',
  cover_image_url: '',
  starts_at: '',
  ends_at: '',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toLocalDateTime = (value: string | null) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
};

export const AdminSeasons: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSeasons = async () => {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('seasons')
      .select(
        'id, season_number, name, slug, status, description, cover_image_url, starts_at, ends_at, created_at, updated_at'
      )
      .order('season_number', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    setSeasons((data ?? []) as Season[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadSeasons();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage('');
    setError('');
  };

  const editSeason = (season: Season) => {
    setEditingId(season.id);

    setForm({
      season_number: String(season.season_number),
      name: season.name,
      slug: season.slug,
      status: season.status,
      description: season.description,
      cover_image_url: season.cover_image_url,
      starts_at: toLocalDateTime(season.starts_at),
      ends_at: toLocalDateTime(season.ends_at),
    });

    setMessage('');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const saveSeason = async () => {
    const seasonNumber = Number(form.season_number);
    const name = form.name.trim();
    const slug = slugify(form.slug || form.name);

    if (!Number.isInteger(seasonNumber) || seasonNumber < 1) {
      setError('Season number must be a positive whole number.');
      return;
    }

    if (!name) {
      setError('Season name is required.');
      return;
    }

    if (!slug) {
      setError('Season slug is required.');
      return;
    }

    if (form.status === 'active') {
      const anotherActiveSeason = seasons.find(
        (season) =>
          season.status === 'active' &&
          season.id !== editingId
      );

      if (anotherActiveSeason) {
        setError(
          `${anotherActiveSeason.name} is already active. Complete or archive it before activating this season.`
        );
        return;
      }
    }

    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      server_id: 'main',
      season_number: seasonNumber,
      name,
      slug,
      status: form.status,
      description: form.description.trim(),
      cover_image_url: form.cover_image_url.trim(),
      starts_at: form.starts_at
        ? new Date(form.starts_at).toISOString()
        : null,
      ends_at: form.ends_at
        ? new Date(form.ends_at).toISOString()
        : null,
    };

    const result = editingId
      ? await supabase
          .from('seasons')
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from('seasons')
          .insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    await logAdminActivity({
      action: editingId ? 'updated' : 'created',
      section: 'seasons',
      itemName: payload.name,
      details: {
        season_number: payload.season_number,
        status: payload.status,
        slug: payload.slug,
      },
    });

    const successMessage = editingId
      ? 'Season updated successfully.'
      : 'Season created successfully.';

    resetForm();
    setMessage(successMessage);

    await loadSeasons();

    setSaving(false);
  };

  const updateStatus = async (
    season: Season,
    status: Season['status']
  ) => {
    setError('');
    setMessage('');

    if (status === 'active') {
      const anotherActiveSeason = seasons.find(
        (item) =>
          item.status === 'active' &&
          item.id !== season.id
      );

      if (anotherActiveSeason) {
        setError(
          `${anotherActiveSeason.name} is already active. Complete or archive it first.`
        );
        return;
      }
    }

    setSaving(true);

    const { error: statusError } = await supabase
      .from('seasons')
      .update({
        status,
      })
      .eq('id', season.id);

    if (statusError) {
      setError(statusError.message);
      setSaving(false);
      return;
    }

    await logAdminActivity({
      action: 'updated',
      section: 'seasons',
      itemName: season.name,
      details: {
        from: season.status,
        to: status,
      },
    });

    setMessage(`${season.name} is now ${status}.`);

    await loadSeasons();

    setSaving(false);
  };

  const deleteSeason = async (season: Season) => {
    setError('');
    setMessage('');

    if (season.status === 'active') {
      setError(
        'Active season cannot be deleted. Complete or archive it first.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${season.name}" permanently?\n\n` +
        `This will also delete linked leaderboard, memories, images, awards and team-result records for this season.\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    const { error: deleteError } = await supabase
      .from('seasons')
      .delete()
      .eq('id', season.id);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    await logAdminActivity({
      action: 'deleted',
      section: 'seasons',
      itemName: season.name,
      details: {
        season_number: season.season_number,
        status: season.status,
        slug: season.slug,
      },
    });

    if (editingId === season.id) {
      resetForm();
    }

    setMessage(`${season.name} was deleted successfully.`);

    await loadSeasons();

    setSaving(false);
  };

  const statusClass = (status: Season['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-300';

      case 'completed':
        return 'bg-blue-500/10 text-blue-300';

      case 'archived':
        return 'bg-slate-500/10 text-slate-300';

      default:
        return 'bg-amber-500/10 text-amber-300';
    }
  };

  return (
    <AdminLayout
      active="seasons"
      permission="seasons"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              <CalendarRange className="h-3.5 w-3.5" />
              Season Management
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Seasons
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Create, manage and permanently preserve your Minecraft season history.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Season
          </button>
        </div>

        {/* Message */}
        {(message || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-500/20 bg-red-500/10 text-red-200'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {error || message}
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">

          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                {editingId ? 'Edit Season' : 'Create Season'}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Cover images support remote Image URLs.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Season number */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                Season Number
              </span>

              <input
                type="number"
                min="1"
                value={form.season_number}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    season_number: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                placeholder="1"
              />
            </label>

            {/* Name */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                Season Name
              </span>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                    slug: editingId
                      ? prev.slug
                      : slugify(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                placeholder="Season 1"
              />
            </label>

            {/* Slug */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                Slug
              </span>

              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    slug: slugify(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                placeholder="season-1"
              />
            </label>

            {/* Status */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                Status
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as Season['status'],
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            {/* Cover image URL */}
            <label className="block md:col-span-2">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <ImageIcon className="h-4 w-4" />
                Cover Image URL
              </span>

              <input
                type="url"
                value={form.cover_image_url}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    cover_image_url: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                placeholder="https://cdn.example.com/season-1.jpg"
              />
            </label>

            {/* Preview */}
            {form.cover_image_url.trim() && (
              <div className="md:col-span-2 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <img
                  src={form.cover_image_url.trim()}
                  alt="Season cover preview"
                  className="h-56 w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Description */}
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                Description
              </span>

              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
                placeholder="Season story, highlights and special notes..."
              />
            </label>

            {/* Start */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                Start Date & Time
              </span>

              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    starts_at: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
              />
            </label>

            {/* End */}
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-400">
                End Date & Time
              </span>

              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ends_at: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={() => void saveSeason()}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />

              {saving
                ? 'Saving...'
                : editingId
                ? 'Save Changes'
                : 'Create Season'}
            </button>
          </div>
        </div>

        {/* Season list */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-heading font-bold text-white">
              Season Archive
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading seasons...
            </div>
          ) : seasons.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No seasons created yet.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">

              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* Info */}
                  <div className="flex min-w-0 items-center gap-4">

                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">

                      {season.cover_image_url ? (
                        <img
                          src={season.cover_image_url}
                          alt={season.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-600">
                          No image
                        </div>
                      )}

                    </div>

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="truncate font-bold text-white">
                          {season.name}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(
                            season.status
                          )}`}
                        >
                          {season.status}
                        </span>

                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Season #{season.season_number} · {season.slug}
                      </p>

                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() => editSeason(season)}
                      disabled={saving}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteSeason(season)}
                      disabled={
                        saving ||
                        season.status === 'active'
                      }
                      title={
                        season.status === 'active'
                          ? 'Complete or archive the active season before deleting it.'
                          : 'Delete season permanently'
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>

                    {season.status !== 'active' && (
                      <button
                        type="button"
                        onClick={() =>
                          void updateStatus(
                            season,
                            'active'
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Set Active
                      </button>
                    )}

                    {season.status === 'active' && (
                      <button
                        type="button"
                        onClick={() =>
                          void updateStatus(
                            season,
                            'completed'
                          )
                        }
                        disabled={saving}
                        className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}

                    {season.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          void updateStatus(
                            season,
                            'archived'
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-500/20 bg-slate-500/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-500/20 disabled:opacity-50"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </button>
                    )}

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};