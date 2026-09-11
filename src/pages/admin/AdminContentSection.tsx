import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Eye, EyeOff, Upload, X } from 'lucide-react';
import { AdminLayout, AdminSectionKey } from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface PageItem {
  id?: string;
  page_key: string;
  item_type: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_url: string;
  extra: Record<string, string>;
  sort_order: number;
  is_visible: boolean;
}

interface FieldConfig {
  key: 'title' | 'subtitle' | 'description' | 'image_url' | 'link_url' | string;
  label: string;
  type?: 'input' | 'textarea';
  extra?: boolean;
  options?: string[];
}

const fieldMap: Record<string, FieldConfig[]> = {
  rules: [
    { key: 'category', label: 'Category', extra: true },
    { key: 'ruleNumber', label: 'Rule Number', extra: true },
    { key: 'title', label: 'Rule Title' },
    { key: 'description', label: 'Rule Description', type: 'textarea' },
    { key: 'punishment', label: 'Punishment', extra: true },
  ],
  terms: [
    { key: 'sectionNumber', label: 'Section Number', extra: true },
    { key: 'title', label: 'Section Title' },
    { key: 'description', label: 'Section Content', type: 'textarea' },
  ],
  contact: [
    { key: 'icon', label: 'Icon', extra: true, options: ['discord', 'mail', 'location', 'globe', 'support', 'link', 'users'] },
    { key: 'image_url', label: 'Custom Icon Image URL' },
    { key: 'title', label: 'Contact Title' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'subtitle', label: 'Button / Contact Text' },
    { key: 'link_url', label: 'Custom Link URL or Email' },
  ],
  events: [
    { key: 'title', label: 'Event Title' },
    { key: 'subtitle', label: 'Date or Schedule' },
    { key: 'description', label: 'Event Description', type: 'textarea' },
    { key: 'image_url', label: 'Image URL' },
  ],
  gallery: [
    { key: 'title', label: 'Image Title' },
    { key: 'description', label: 'Caption', type: 'textarea' },
    { key: 'image_url', label: 'Image URL' },
  ],
  commands: [
    { key: 'title', label: 'Command, e.g. /spawn' },
    { key: 'description', label: 'Command Description', type: 'textarea' },
  ],
  vote: [
    { key: 'title', label: 'Reward or Vote Site Title' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'link_url', label: 'Vote Link URL' },
  ],
};

const emptyItem = (pageKey: string): PageItem => ({
  page_key: pageKey,
  item_type: pageKey,
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  link_url: '',
  extra: pageKey === 'contact' ? { icon: 'discord' } : {},
  sort_order: 999,
  is_visible: true,
});

interface AdminContentSectionProps {
  pageKey: Exclude<AdminSectionKey, 'dashboard' | 'settings' | 'gamemodes' | 'pages' | 'users'>;
  title: string;
  description: string;
}

export const AdminContentSection: React.FC<AdminContentSectionProps> = ({ pageKey, title, description }) => {
  const [items, setItems] = useState<PageItem[]>([]);
  const [form, setForm] = useState<PageItem>(() => emptyItem(pageKey));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fields = useMemo(() => fieldMap[pageKey] ?? fieldMap.terms, [pageKey]);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_page_items')
      .select('*')
      .eq('page_key', pageKey)
      .order('sort_order', { ascending: true });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setItems((data ?? []) as PageItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    setForm(emptyItem(pageKey));
    setEditingId(null);
    loadItems();
  }, [pageKey]);

  const resetForm = () => {
    setForm(emptyItem(pageKey));
    setEditingId(null);
  };

  const setField = (field: FieldConfig, value: string) => {
    if (field.extra) {
      setForm((current) => ({ ...current, extra: { ...current.extra, [field.key]: value } }));
    } else {
      setForm((current) => ({ ...current, [field.key]: value }));
    }
  };

  const getField = (field: FieldConfig) => field.extra ? form.extra[field.key] ?? '' : String(form[field.key as keyof PageItem] ?? '');

  const handleSave = async () => {
    if (!form.title.trim() && pageKey !== 'rules') {
      setMessage('A title is required.');
      return;
    }

    setSaving(true);
    const payload = {
      page_key: pageKey,
      item_type: pageKey,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim(),
      extra: form.extra,
      sort_order: form.sort_order,
      is_visible: form.is_visible,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from('site_page_items').update(payload).eq('id', editingId)
      : await supabase.from('site_page_items').insert(payload);

    setSaving(false);
    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? 'Item updated successfully.' : 'Item added successfully.');
    resetForm();
    loadItems();
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm('Remove this item?')) return;
    const { error } = await supabase.from('site_page_items').delete().eq('id', id);
    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }
    setMessage('Item removed.');
    loadItems();
  };

  const handleToggle = async (item: PageItem) => {
    if (!item.id) return;
    const nextValue = !item.is_visible;
    const { error } = await supabase
      .from('site_page_items')
      .update({ is_visible: nextValue, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_visible: nextValue } : entry));
  };

  const handleImageUpload = async (file: File) => {
    setSaving(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `${pageKey}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('site-content').upload(filePath, file, { upsert: false });

    if (error) {
      setMessage(`Image upload error: ${error.message}`);
      setSaving(false);
      return;
    }

    const { data } = supabase.storage.from('site-content').getPublicUrl(filePath);
    setForm((current) => ({ ...current, image_url: data.publicUrl }));
    setMessage('Image uploaded. Save the item to keep it.');
    setSaving(false);
  };

  return (
    <AdminLayout active={pageKey} permission="settings">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <button onClick={resetForm} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {message && <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">{message}</div>}

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Item' : 'New Item'}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="mb-1 block text-xs text-slate-500">{field.label}</label>
              {field.key === 'image_url' && pageKey === 'contact' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">Image URL</span>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Recommended</span>
                  </div>
                  <input value={getField(field)} onChange={(event) => setField(field, event.target.value)} placeholder="https://..." className="w-full rounded-xl border border-emerald-400/30 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400" />
                  <p className="text-xs text-emerald-300/80">If upload takes time, use an image URL. It is faster and lightweight.</p>
                  <p className="text-xs leading-relaxed text-slate-500">
                    Free hosting: <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">ImgBB</a>, <a href="https://postimages.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">Postimages</a>, or <a href="https://myimgs.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">MyImgs</a>. Upload image, copy the direct image URL, then paste it here.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                      <Upload className="h-4 w-4" /> Upload image
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleImageUpload(file); event.currentTarget.value = ''; }} />
                    </label>
                    {form.image_url && <button type="button" onClick={() => setForm((current) => ({ ...current, image_url: '' }))} className="inline-flex items-center gap-1 text-sm text-red-300 hover:text-red-200"><X className="h-4 w-4" /> Remove image</button>}
                  </div>
                  {form.image_url && <img src={form.image_url} alt="Custom icon preview" className="h-16 w-16 rounded-xl border border-white/10 object-cover" />}
                </div>
              ) : field.options ? (
                <select value={getField(field)} onChange={(event) => setField(field, event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500">
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea value={getField(field)} onChange={(event) => setField(field, event.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" />
              ) : (
                <input value={getField(field)} onChange={(event) => setField(field, event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" />
              )}
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-slate-500">Sort Order</label>
            <input type="number" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) || 999 })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" />
          </div>
          <label className="flex items-center gap-2 pt-7 text-sm text-slate-300">
            <input type="checkbox" checked={form.is_visible} onChange={(event) => setForm({ ...form, is_visible: event.target.checked })} className="h-4 w-4" />
            Visible on website
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-semibold disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Item'}
          </button>
          {editingId && <button onClick={resetForm} className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:bg-white/5">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Loading items...</p>}
        {!loading && items.length === 0 && <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">No items yet. Add the first one above.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-white">{item.title || item.extra?.ruleNumber || 'Untitled item'}</p>
              <p className="truncate text-sm text-slate-400">{item.subtitle || item.description || item.image_url || 'No description'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => handleToggle(item)} title={item.is_visible ? 'Hide item' : 'Show item'} className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                {item.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => { setEditingId(item.id ?? null); setForm(item); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};
