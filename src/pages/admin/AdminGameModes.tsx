import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { Info, Plus, Trash2, Save, X } from 'lucide-react';

interface GameModeRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string;
  badge: string;
  accent_color: string;
  icon_name: string;
  icon_url: string;
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
  icon_url: '',
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

const FieldLabel: React.FC<{ label: string; help: string }> = ({ label, help }) => (
  <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
    <span>{label}</span>
    <span className="group relative inline-flex cursor-help">
      <Info className="h-3.5 w-3.5 text-slate-500 hover:text-purple-300" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-purple-500/30 bg-[#111118] px-3 py-2 text-left text-[11px] leading-relaxed text-slate-200 shadow-xl group-hover:block">
        {help}
      </span>
    </span>
  </div>
);

const optimizeIconFile = async (file: File): Promise<File> => {
  const image = await createImageBitmap(file);
  const maxSize = 512;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');

  if (!context) return file;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  image.close();

  return blob ? new File([blob], 'game-mode-icon.webp', { type: 'image/webp' }) : file;
};

export const AdminGameModes: React.FC = () => {
  const [modes, setModes] = useState<GameModeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Omit<GameModeRow, 'id'>>(emptyForm);
  const [message, setMessage] = useState('');
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconPreviewUrl, setIconPreviewUrl] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

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
      setForm({
        ...rest,
        features: rest.features || [],
        how_to_play: rest.how_to_play || [],
        highlights: rest.highlights || [],
        tags: rest.tags || [],
      });
      setIconPreviewUrl(mode.icon_url || '');
      setEditingId(id);
    } else {
      setForm(emptyForm);
      setIconPreviewUrl('');
      setEditingId('new');
    }
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIconPreviewUrl('');
  };

  const toListField = (value: string) => value.split('\n').map((v) => v.trim()).filter(Boolean);

  const handleIconUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('Please choose an image smaller than 2 MB.');
      return;
    }

    setUploadingIcon(true);
    setUploadStatus('Optimizing image...');
    const optimizedFile = await optimizeIconFile(file).catch(() => file);
    setUploadStatus('Uploading icon...');
    const localPreviewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('Could not preview image.'));
      reader.readAsDataURL(optimizedFile);
    }).catch(() => '');

    if (localPreviewUrl) {
      setIconPreviewUrl(localPreviewUrl);
    }

    const extension = optimizedFile.name.split('.').pop() || 'webp';
    const filePath = `game-modes/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('game-mode-icons').upload(filePath, optimizedFile, {
      upsert: false,
      contentType: optimizedFile.type,
    });

    if (!error) {
      const { data } = supabase.storage.from('game-mode-icons').getPublicUrl(filePath);
      setForm((current) => ({
        ...current,
        icon_url: data.publicUrl,
        icon_name: data.publicUrl,
      }));
      setIconPreviewUrl(data.publicUrl);
      setUploadStatus('Icon uploaded successfully. Click Save to apply it.');
      setMessage('Icon uploaded. Save the game mode to apply it.');
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        setForm((current) => ({
          ...current,
          icon_url: dataUrl,
          icon_name: dataUrl,
        }));
        setIconPreviewUrl(dataUrl);
        setUploadStatus('Storage upload unavailable. Local image is ready to save.');
        setMessage('Storage upload unavailable. Image attached locally; save the game mode to apply it.');
        setUploadingIcon(false);
      };
      reader.onerror = () => {
        setUploadStatus('Icon upload failed.');
        setMessage(`Icon upload error: ${error.message}`);
        setUploadingIcon(false);
      };
      reader.readAsDataURL(file);
      return;
    }
    setUploadingIcon(false);
  };

  const handleSave = async () => {
    if (!form.slug.trim() || !form.name.trim()) {
      setMessage('Slug and Name are required.');
      return;
    }

    const payload = {
      ...form,
      icon_url: form.icon_url || iconPreviewUrl,
      icon_name: form.icon_url || iconPreviewUrl || form.icon_name,
    };

    if (editingId === 'new') {
      const { error } = await supabase.from('game_modes').insert(payload);
      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }
      setMessage('Game mode added.');
    } else if (editingId) {
      const { error } = await supabase.from('game_modes').update(payload).eq('id', editingId);
      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }
      setMessage('Game mode updated.');
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
    <AdminLayout active="gamemodes" permission="gamemodes">
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
              <FieldLabel label="Slug" help="The unique URL name for this game mode, for example: skywars." />
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <FieldLabel label="Name" help="The game mode title visitors will see on cards and detail pages." />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label="Short Description" help="A brief summary shown on the game mode card." />
              <input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label="Long Description" help="The full description shown on the game mode detail page." />
              <textarea value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <FieldLabel label="Badge" help="A small label such as Popular, Competitive, or New." />
              <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <FieldLabel label="Icon Name" help="The Lucide icon name used when no custom image is provided." />
              <input value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <FieldLabel label="Custom Icon" help="Upload a PNG, JPG, WEBP, or SVG image to use as the game mode icon." />
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">URL Recommended</span>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={uploadingIcon}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleIconUpload(file);
                }}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              <input
                value={form.icon_url}
                onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                placeholder="Paste a public image URL (recommended)"
                className="mt-2 w-full rounded-xl border border-emerald-400/30 bg-black/40 px-4 py-2 text-xs outline-none focus:border-emerald-400"
              />
              <p className="mt-1 text-xs text-emerald-300/80">If upload takes time, use an image URL. It is faster and lightweight.</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Free hosting: <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">ImgBB</a>, <a href="https://postimages.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">Postimages</a>, or <a href="https://myimgs.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">MyImgs</a>. Upload, copy the direct image URL, and paste it above.
              </p>
              {(iconPreviewUrl || form.icon_url) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                  <img src={iconPreviewUrl || form.icon_url} alt="Icon preview" className="h-8 w-8 rounded-lg object-contain" />
                  <span className="truncate">Custom icon ready to save</span>
                </div>
              )}
              {uploadStatus && <p className="mt-2 text-xs text-sky-300">{uploadStatus}</p>}
            </div>
            <div>
              <FieldLabel label="Accent Color" help="The Tailwind gradient class used for this mode's visual accent." />
              <input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <FieldLabel label="Player Count Text" help="The player count or status text displayed on the game card." />
              <input value={form.player_count_estimate} onChange={(e) => setForm({ ...form, player_count_estimate: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <FieldLabel label="Status" help="Shows whether this mode is Online, Beta, or under Maintenance." />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500">
                <option value="Online">Online</option>
                <option value="Beta">Beta</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <FieldLabel label="Recommended Version" help="The Minecraft versions recommended for this game mode." />
              <input value={form.recommended_version} onChange={(e) => setForm({ ...form, recommended_version: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div>
              <FieldLabel label="Sort Order" help="Controls the order in which active game modes appear on the site." />
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel label="Features" help="Add the main gameplay features. Each row becomes one feature on the detail page." />
                <button type="button" onClick={() => setForm({ ...form, features: [...form.features, ''] })} className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300 hover:bg-purple-500/10">
                  <Plus className="h-3.5 w-3.5" /> Add Feature
                </button>
              </div>
              <div className="space-y-2">
                {form.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input value={feature} onChange={(e) => { const features = [...form.features]; features[index] = e.target.value; setForm({ ...form, features }); }} placeholder="Feature description" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
                    <button type="button" onClick={() => setForm({ ...form, features: form.features.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" aria-label="Remove feature"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel label="How To Play" help="Add step-by-step instructions. Each row becomes one step on the detail page." />
                <button type="button" onClick={() => setForm({ ...form, how_to_play: [...form.how_to_play, ''] })} className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300 hover:bg-purple-500/10">
                  <Plus className="h-3.5 w-3.5" /> Add Step
                </button>
              </div>
              <div className="space-y-2">
                {form.how_to_play.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input value={step} onChange={(e) => { const howToPlay = [...form.how_to_play]; howToPlay[index] = e.target.value; setForm({ ...form, how_to_play: howToPlay }); }} placeholder={`Step ${index + 1}`} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
                    <button type="button" onClick={() => setForm({ ...form, how_to_play: form.how_to_play.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" aria-label="Remove step"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel label="Exclusive Highlights" help="Add special highlights with a separate title and description." />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, highlights: [...form.highlights, { title: '', desc: '' }] })}
                  className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300 hover:bg-purple-500/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Highlight
                </button>
              </div>
              <div className="space-y-3">
                {form.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        value={highlight.title}
                        onChange={(e) => {
                          const highlights = [...form.highlights];
                          highlights[index] = { ...highlights[index], title: e.target.value };
                          setForm({ ...form, highlights });
                        }}
                        placeholder="Highlight title"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-purple-500"
                      />
                      <input
                        value={highlight.desc}
                        onChange={(e) => {
                          const highlights = [...form.highlights];
                          highlights[index] = { ...highlights[index], desc: e.target.value };
                          setForm({ ...form, highlights });
                        }}
                        placeholder="Highlight description"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, highlights: form.highlights.filter((_, itemIndex) => itemIndex !== index) })}
                      className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                      aria-label="Remove highlight"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel label="Game Sections / Tags" help="Each tag automatically creates a filter section on the Games page." />
                <button type="button" onClick={() => setForm({ ...form, tags: [...form.tags, ''] })} className="flex items-center gap-1 rounded-lg border border-purple-500/30 px-2.5 py-1 text-xs text-purple-300 hover:bg-purple-500/10">
                  <Plus className="h-3.5 w-3.5" /> Add Section
                </button>
              </div>
              <div className="space-y-2">
                {form.tags.map((tag, index) => (
                  <div key={index} className="flex gap-2">
                    <input value={tag} onChange={(e) => { const tags = [...form.tags]; tags[index] = e.target.value; setForm({ ...form, tags }); }} placeholder="Example: PvP, Economy, SMP" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-purple-500" />
                    <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" aria-label="Remove section tag"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
              <FieldLabel label="Active" help="When enabled, this game mode is visible on the public website." />
            </div>
          </div>

          <button onClick={handleSave} disabled={uploadingIcon} className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-semibold disabled:cursor-wait disabled:opacity-50">
            <Save className="h-4 w-4" />
            {uploadingIcon ? 'Uploading icon...' : 'Save'}
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