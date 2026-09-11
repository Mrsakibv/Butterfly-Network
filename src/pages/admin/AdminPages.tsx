import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { Plus, Save, Trash2, Eye, EyeOff, ArrowUpDown } from 'lucide-react';

interface SitePage {
  id?: string;
  slug: string;
  title: string;
  menu_label: string;
  route: string;
  menu_group: 'main' | 'more';
  sort_order: number;
  is_visible: boolean;
  page_type: 'content' | 'external';
  content: string;
  meta_title: string;
  meta_description: string;
  created_at?: string;
  updated_at?: string;
}

const emptyForm: SitePage = {
  slug: '',
  title: '',
  menu_label: '',
  route: '',
  menu_group: 'more',
  sort_order: 999,
  is_visible: true,
  page_type: 'content',
  content: '',
  meta_title: '',
  meta_description: '',
};

export const AdminPages: React.FC = () => {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SitePage>(emptyForm);
  const editorRef = useRef<HTMLDivElement>(null);

  const loadPages = async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase
      .from('site_pages')
      .select('*')
      .order('menu_group', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      setLoadError(error.message);
    } else if (data) {
      setPages(data as SitePage[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPages();
  }, []);

  const mainPages = useMemo(
    () => pages.filter((page) => page.menu_group === 'main'),
    [pages]
  );

  const morePages = useMemo(
    () => pages.filter((page) => page.menu_group === 'more'),
    [pages]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (page: SitePage) => {
    setEditingId(page.id ?? null);
    setForm({ ...page });
    setMessage(`Editing ${page.title}`);
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.route.trim()) {
      setMessage('Title, slug, and route are required.');
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      ...form,
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      menu_label: form.menu_label.trim() || form.title.trim(),
      route: form.route.trim(),
      updated_at: new Date().toISOString(),
    };

    let result;

    if (editingId) {
      result = await supabase.from('site_pages').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('site_pages').insert(payload);
    }

    setSaving(false);

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }

    setMessage(editingId ? 'Page updated successfully.' : 'Page added successfully.');
    resetForm();
    loadPages();
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;

    const confirmed = window.confirm('Delete this page from the site menu?');
    if (!confirmed) return;

    const { error } = await supabase.from('site_pages').delete().eq('id', id);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setMessage('Page deleted.');
    resetForm();
    loadPages();
  };

  const handleToggleVisibility = async (page: SitePage) => {
    if (!page.id) return;

    const nextVisibility = !page.is_visible;
    const { error } = await supabase
      .from('site_pages')
      .update({ is_visible: nextVisibility, updated_at: new Date().toISOString() })
      .eq('id', page.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setPages((currentPages) =>
      currentPages.map((currentPage) =>
        currentPage.id === page.id
          ? { ...currentPage, is_visible: nextVisibility }
          : currentPage
      )
    );
    setMessage(nextVisibility ? 'Page is now visible in the menu.' : 'Page is now hidden from the menu.');
  };

  return (
    <AdminLayout active="pages" permission="settings">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Manage Pages</h2>
          <p className="text-sm text-slate-400">Edit menu items, visibility, and page order.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setForm({ ...emptyForm, menu_group: 'more' });
          }}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
        >
          <Plus className="h-4 w-4" />
          Add Page
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          {message}
        </div>
      )}

      {loadError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Pages could not be loaded: {loadError}
        </div>
      )}

      <div ref={editorRef} className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ArrowUpDown className="h-4 w-4 text-purple-300" />
          {editingId ? 'Edit Page' : 'New Page'}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Menu Label</label>
            <input
              value={form.menu_label}
              onChange={(e) => setForm({ ...form, menu_label: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Route</label>
            <input
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Menu Group</label>
            <select
              value={form.menu_group}
              onChange={(e) => setForm({ ...form, menu_group: e.target.value as 'main' | 'more' })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            >
              <option value="main">Main</option>
              <option value="more">More</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 999 })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Page Type</label>
            <select
              value={form.page_type}
              onChange={(e) => setForm({ ...form, page_type: e.target.value as 'content' | 'external' })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            >
              <option value="content">Content Page</option>
              <option value="external">External Link</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
              className="h-4 w-4"
            />
            <label className="text-sm text-slate-300">Visible in menu</label>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Meta Title</label>
            <input
              value={form.meta_title}
              onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Meta Description</label>
            <textarea
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Page Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-semibold disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Page'}
          </button>

          {(editingId || Object.values(form).some((value) => typeof value === 'string' ? value.trim() : value !== emptyForm[Object.keys(emptyForm).find((key) => emptyForm[key as keyof SitePage] === value) as keyof SitePage])) && (
            <button
              onClick={resetForm}
              className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="mb-4 text-lg font-semibold">Main Menu</h3>
          {mainPages.length === 0 ? (
            <p className="text-sm text-slate-400">No main menu pages yet.</p>
          ) : (
            <div className="space-y-3">
              {mainPages.map((page) => (
                <div key={page.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div>
                    <p className="font-medium">{page.menu_label || page.title}</p>
                    <p className="text-xs text-slate-500">{page.route}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(page)}
                      title={page.is_visible ? 'Hide from menu' : 'Show in menu'}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                    >
                      {page.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleEdit(page)} className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5">Edit</button>
                    <button onClick={() => handleDelete(page.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="mb-4 text-lg font-semibold">More Menu</h3>
          {morePages.length === 0 ? (
            <p className="text-sm text-slate-400">No more menu pages yet.</p>
          ) : (
            <div className="space-y-3">
              {morePages.map((page) => (
                <div key={page.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div>
                    <p className="font-medium">{page.menu_label || page.title}</p>
                    <p className="text-xs text-slate-500">{page.route}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(page)}
                      title={page.is_visible ? 'Hide from menu' : 'Show in menu'}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                    >
                      {page.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleEdit(page)} className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/5">Edit</button>
                    <button onClick={() => handleDelete(page.id)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && <p className="mt-6 text-slate-400">Loading pages...</p>}
    </AdminLayout>
  );
};
