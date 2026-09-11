import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface GameModeRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  badge: string;
  accent_color: string;
  icon_name: string;
  player_count_estimate: string;
  status: string;
  features: string[];
  how_to_play: string[];
  highlights: { title: string; desc: string }[];
  tags: string[];
  recommended_version: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: Omit<GameModeRow, 'id'> = {
  slug: '',
  name: '',
  short_description: '',
  long_description: '',
  badge: '',
  accent_color: 'from-purple-500 to-indigo-600',
  icon_name: 'Gamepad2',
  player_count_estimate: '',
  status: 'Online',
  features: [],
  how_to_play: [],
  highlights: [],
  tags: [],
  recommended_version: '',
  sort_order: 0,
  is_active: true,
};

export const AdminGameModes: React.FC = () => {
  const [modes, setModes] = useState<GameModeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Omit<GameModeRow, 'id'>>(emptyForm);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_modes')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) setModes(data as GameModeRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (mode?: GameModeRow) => {
    if (mode) {
      const { id, ...rest } = mode;
      setForm(rest);
      setEditingId(id);
    } else {
      setForm(emptyForm);
      setEditingId('new');
    }
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const toListField = (value: string) => value.split('\n').map((v) => v.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      setMessage('Slug and Name are required.');
      return;
    }

    if (editingId === 'new') {
      const { error } = await supabase.from('game_modes').insert(form);
      setMessage(error ? `Error: ${error.message}` : 'Game mode added.');
    } else if (editingId) {
      const { error } = await supabase.from('game_modes').update(form).eq('id', editingId);
      setMessage(error ? `Error: ${error.message}` : 'Game mode updated.');
    }

    cancelEdit();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this game mode?')) return;
    const { error } = await supabase.from('game_modes').delete().eq('id', id);
    if (error) setMessage(`Error: ${error.message}`);
    load();
  };

  return (
    <AdminLayout active="gamemodes">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Game Modes</h2>
        <button
          onClick={() => startEdit()}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
        >
          <Plus className="h-4 w-4" />
          Add Game Mode
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          {message}
        </div>
      )}

      {editingId && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editingId === 'new' ? 'New Game Mode' : 'Edit Game Mode'}</h3>
            <button onClick={cancelEdit}>
              <X className="h-5 w-5 text-slate-400 hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Slug (url e use hobe)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Short Description</label>
              <input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Long Description</label>
              <textarea value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Badge</label>
              <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Icon Name (lucide-react)</label>
              <input value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Accent Color (tailwind gradient)</label>
              <input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Player Count Text</label>
              <input value={form.player_count_estimate} onChange={(e) => setForm({ ...form, player_count_estimate: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500">
                <option value="Online">Online</option>
                <option value="Beta">Beta</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Recommended Version</label>
              <input value={form.recommended_version} onChange={(e) => setForm({ ...form, recommended_version: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Features (each line = 1 item)</label>
              <textarea value={form.features.join('\n')} onChange={(e) => setForm({ ...form, features: toListField(e.target.value) })} rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">How To Play (each line = 1 step)</label>
              <textarea value={form.how_to_play.join('\n')} onChange={(e) => setForm({ ...form, how_to_play: toListField(e.target.value) })} rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-500">Tags (comma diye separate)</label>
              <input value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
              <label className="text-sm text-slate-400">Active (site e dekhabe)</label>
            </div>
          </div>

          <button onClick={handleSave} className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold">
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {modes.map((mode) => (
            <div key={mode.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div>
                <p className="font-semibold">{mode.name}</p>
                <p className="text-xs text-slate-500">/{mode.slug} · {mode.status} · {mode.is_active ? 'Active' : 'Hidden'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(mode)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Edit</button>
                <button onClick={() => handleDelete(mode.id)} className="rounded-lg border border-red-500/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};