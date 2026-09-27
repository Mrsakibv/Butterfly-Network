import React, { useEffect, useState } from 'react';
import {
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  X,
  Megaphone,
  Timer,
  ExternalLink,
  Zap,
  Edit2,
  Calendar,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Palette,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminActivity';

export interface OfferItem {
  id?: string;
  page_key: string;
  item_type: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_url: string; // Used as button_url
  sort_order: number;
  is_visible: boolean;
  extra: {
    badge_text?: string;
    badge_color?: 'purple' | 'red' | 'green' | 'blue' | 'yellow' | 'orange';
    bg_style?: 'purple' | 'blue' | 'green' | 'red' | 'gold' | 'dark';
    button_text?: string;
    button_url?: string;
    timer_enabled?: boolean;
    timer_end_date?: string;
    [key: string]: any;
  };
}

const emptyOffer = (): OfferItem => ({
  page_key: 'offers',
  item_type: 'offer',
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  link_url: '',
  sort_order: 0,
  is_visible: true,
  extra: {
    badge_text: '',
    badge_color: 'purple',
    bg_style: 'purple',
    button_text: '',
    button_url: '',
    timer_enabled: false,
    timer_end_date: '',
  },
});

const BG_OPTIONS: { id: 'purple' | 'blue' | 'green' | 'red' | 'gold' | 'dark'; label: string; class: string; border: string; glow: string; text: string }[] = [
  { id: 'purple', label: 'Purple Glow', class: 'from-purple-900/40 to-violet-900/40', border: 'border-purple-500/40', glow: 'bg-purple-500/20', text: 'text-purple-300' },
  { id: 'blue',   label: 'Cyan Blue',   class: 'from-blue-900/40 to-cyan-900/40',     border: 'border-blue-500/40',   glow: 'bg-blue-500/20',   text: 'text-blue-300'   },
  { id: 'green',  label: 'Emerald',     class: 'from-emerald-900/40 to-teal-900/40',  border: 'border-emerald-500/40',glow: 'bg-emerald-500/20',text: 'text-emerald-300'},
  { id: 'red',    label: 'Crimson Red', class: 'from-red-900/40 to-rose-900/40',     border: 'border-red-500/40',    glow: 'bg-red-500/20',    text: 'text-red-300'    },
  { id: 'gold',   label: 'Golden Amber',class: 'from-yellow-900/40 to-amber-900/40',  border: 'border-yellow-500/40', glow: 'bg-yellow-500/20', text: 'text-yellow-300' },
  { id: 'dark',   label: 'Dark Slate',  class: 'from-slate-900/60 to-slate-800/40',   border: 'border-slate-500/40',  glow: 'bg-slate-500/20',  text: 'text-slate-300'  },
];

const BADGE_COLORS: { id: 'purple' | 'red' | 'green' | 'blue' | 'yellow' | 'orange'; label: string; pill: string }[] = [
  { id: 'purple', label: 'Purple', pill: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { id: 'red',    label: 'Red',    pill: 'bg-red-500/20 text-red-300 border-red-500/40' },
  { id: 'green',  label: 'Green',  pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'blue',   label: 'Blue',   pill: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: 'yellow', label: 'Yellow', pill: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { id: 'orange', label: 'Orange', pill: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
];

export const AdminOffers: React.FC = () => {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<OfferItem>(emptyOffer());
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadOffers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_page_items')
        .select('*')
        .eq('page_key', 'offers')
        .order('sort_order', { ascending: true });

      if (error) {
        showToast(`Failed to load offers: ${error.message}`, 'error');
      } else {
        setOffers((data ?? []) as OfferItem[]);
      }
    } catch (err) {
      console.error('Offers loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const startCreate = () => {
    setForm({
      ...emptyOffer(),
      sort_order: offers.length,
    });
    setEditingId('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEdit = (offer: OfferItem) => {
    setForm({
      ...offer,
      extra: {
        badge_text: offer.extra?.badge_text || '',
        badge_color: offer.extra?.badge_color || 'purple',
        bg_style: offer.extra?.bg_style || 'purple',
        button_text: offer.extra?.button_text || '',
        button_url: offer.link_url || offer.extra?.button_url || '',
        timer_enabled: Boolean(offer.extra?.timer_enabled),
        timer_end_date: offer.extra?.timer_end_date || '',
      },
    });
    setEditingId(offer.id || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyOffer());
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast('Offer Title is required!', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        page_key: 'offers',
        item_type: 'offer',
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        link_url: form.extra.button_url?.trim() || form.link_url.trim(),
        sort_order: Number(form.sort_order) || 0,
        is_visible: form.is_visible,
        extra: {
          badge_text: form.extra.badge_text?.trim() || '',
          badge_color: form.extra.badge_color || 'purple',
          bg_style: form.extra.bg_style || 'purple',
          button_text: form.extra.button_text?.trim() || '',
          button_url: form.extra.button_url?.trim() || form.link_url.trim() || '',
          timer_enabled: Boolean(form.extra.timer_enabled),
          timer_end_date: form.extra.timer_end_date || '',
        },
        updated_at: new Date().toISOString(),
      };

      let result;
      if (editingId && editingId !== 'new') {
        result = await supabase
          .from('site_page_items')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('site_page_items')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        showToast(`Save failed: ${result.error.message}`, 'error');
      } else {
        showToast(editingId === 'new' ? 'New offer created successfully!' : 'Offer updated successfully!', 'success');
        await logAdminActivity({
          action: editingId === 'new' ? 'created' : 'updated',
          section: 'Special Offers',
          itemName: payload.title,
          details: payload,
        });
        cancelEdit();
        loadOffers();
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offer: OfferItem) => {
    if (!offer.id) return;
    if (!window.confirm(`Are you sure you want to delete the offer "${offer.title}"?`)) return;

    try {
      const { error } = await supabase.from('site_page_items').delete().eq('id', offer.id);
      if (error) {
        showToast(`Delete failed: ${error.message}`, 'error');
      } else {
        showToast('Offer deleted.', 'info');
        await logAdminActivity({
          action: 'deleted',
          section: 'Special Offers',
          itemName: offer.title,
          details: { id: offer.id },
        });
        if (editingId === offer.id) cancelEdit();
        loadOffers();
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleToggleVisibility = async (offer: OfferItem) => {
    if (!offer.id) return;
    const nextVal = !offer.is_visible;
    try {
      const { error } = await supabase
        .from('site_page_items')
        .update({ is_visible: nextVal, updated_at: new Date().toISOString() })
        .eq('id', offer.id);

      if (error) {
        showToast(`Could not update visibility: ${error.message}`, 'error');
      } else {
        setOffers((prev) =>
          prev.map((item) => (item.id === offer.id ? { ...item, is_visible: nextVal } : item))
        );
        showToast(nextVal ? 'Offer is now live on the homepage.' : 'Offer hidden from homepage.', 'info');
        await logAdminActivity({
          action: 'visibility_changed',
          section: 'Special Offers',
          itemName: offer.title,
          details: { visible: nextVal },
        });
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'error');
      return;
    }

    setSaving(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `offers/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from('site-content').upload(filePath, file, { upsert: false });

    if (!error) {
      const { data } = supabase.storage.from('site-content').getPublicUrl(filePath);
      setForm((curr) => ({ ...curr, image_url: data.publicUrl }));
      showToast('Image uploaded successfully!', 'success');
    } else {
      // Fallback to local DataURL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        setForm((curr) => ({ ...curr, image_url: dataUrl }));
        showToast('Image loaded locally (Storage bucket unavailable).', 'info');
      };
      reader.readAsDataURL(file);
    }
    setSaving(false);
  };

  const selectedBg = BG_OPTIONS.find((b) => b.id === (form.extra.bg_style || 'purple')) || BG_OPTIONS[0];
  const selectedBadgeColor = BADGE_COLORS.find((b) => b.id === (form.extra.badge_color || 'purple')) || BADGE_COLORS[0];

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold shadow-lg transition-all ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : message.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-purple-500/30 bg-purple-500/10 text-purple-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          ) : (
            <Sparkles className="h-5 w-5 shrink-0 text-purple-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Special Offers & Announcements</h3>
            <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 border border-purple-500/30">
              {offers.length} {offers.length === 1 ? 'Offer' : 'Offers'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Create promotional banners, countdown sales, and special announcements for the homepage.
          </p>
        </div>

        {!editingId && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add New Offer
          </button>
        )}
      </div>

      {/* ADD / EDIT FORM */}
      {editingId && (
        <div className="rounded-3xl border border-purple-500/30 bg-[#0d0f1a] p-6 sm:p-8 shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">
                  {editingId === 'new' ? 'Create New Offer' : `Edit Offer: ${form.title}`}
                </h4>
                <p className="text-xs text-slate-400">Configure appearance, countdown timer, CTA buttons and images</p>
              </div>
            </div>
            <button
              onClick={cancelEdit}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Eye className="h-3.5 w-3.5 text-purple-400" />
              <span>Live Homepage Preview</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
              <div className={`relative overflow-hidden rounded-2xl border ${selectedBg.border} bg-gradient-to-br ${selectedBg.class} p-6`}>
                <div className={`pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full ${selectedBg.glow} blur-[60px]`} />

                <div className={`relative z-10 ${form.image_url ? 'grid lg:grid-cols-2 gap-6 items-center' : 'text-center'}`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {form.extra.badge_text && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${selectedBadgeColor.pill}`}>
                          <Zap className="w-3 h-3" />
                          {form.extra.badge_text}
                        </span>
                      )}
                      {form.subtitle && (
                        <span className={`text-xs font-semibold uppercase tracking-widest ${selectedBg.text}`}>
                          {form.subtitle}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-black text-white leading-tight mb-2">
                      {form.title || 'Offer Title Here'}
                    </h3>

                    {form.description && (
                      <p className="text-xs text-slate-300 leading-relaxed mb-4 max-w-md">
                        {form.description}
                      </p>
                    )}

                    {form.extra.timer_enabled && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                        <Timer className={`h-4 w-4 ${selectedBg.text}`} />
                        <span>Timer: {form.extra.timer_end_date ? new Date(form.extra.timer_end_date).toLocaleString() : 'Date not set'}</span>
                      </div>
                    )}

                    {form.extra.button_text && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-black text-black shadow-md">
                          {form.extra.button_text}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>

                  {form.image_url && (
                    <div className="relative h-40 overflow-hidden rounded-xl border border-white/10">
                      <img src={form.image_url} alt="Offer banner" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FORM FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Offer Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., 50% Off Everything - Summer Sale!"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Subtitle / Tagline (Optional)
              </label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g., LIMITED TIME EXCLUSIVE"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Display Sort Order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Description / Body Text
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the offer details, perks, discounts, or announcement information..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y"
              />
            </div>

            {/* Background Theme Selector */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-purple-400" />
                <span>Card Background Style Theme</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {BG_OPTIONS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setForm({ ...form, extra: { ...form.extra, bg_style: bg.id } })}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      form.extra.bg_style === bg.id
                        ? `${bg.border} bg-white/10 ring-2 ring-purple-400 shadow-lg scale-105`
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                    }`}
                  >
                    <div className={`h-6 w-full rounded-lg bg-gradient-to-r ${bg.class} mb-1.5 border ${bg.border}`} />
                    <span className="text-[11px] font-semibold text-slate-300">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Settings */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Badge Text (e.g. HOT, 50% OFF, NEW)
              </label>
              <input
                type="text"
                value={form.extra.badge_text || ''}
                onChange={(e) => setForm({ ...form, extra: { ...form.extra, badge_text: e.target.value } })}
                placeholder="e.g., HOT or 50% OFF"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Badge Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BADGE_COLORS.map((bc) => (
                  <button
                    key={bc.id}
                    type="button"
                    onClick={() => setForm({ ...form, extra: { ...form.extra, badge_color: bc.id } })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      form.extra.badge_color === bc.id
                        ? `${bc.pill} ring-2 ring-purple-400`
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                    }`}
                  >
                    {bc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Settings */}
            <div className="space-y-4 md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-purple-400" />
                  <div>
                    <span className="text-sm font-bold text-white">Live Countdown Timer</span>
                    <p className="text-xs text-slate-400">Show an animated countdown timer (Days, Hours, Minutes, Seconds)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.extra.timer_enabled)}
                    onChange={(e) => setForm({ ...form, extra: { ...form.extra, timer_enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {form.extra.timer_enabled && (
                <div className="pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Timer End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      form.extra.timer_end_date
                        ? new Date(form.extra.timer_end_date).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value ? new Date(e.target.value).toISOString() : '';
                      setForm({ ...form, extra: { ...form.extra, timer_end_date: val } });
                    }}
                    className="w-full sm:w-80 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* CTA Button Settings */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Button Label (Optional)
              </label>
              <input
                type="text"
                value={form.extra.button_text || ''}
                onChange={(e) => setForm({ ...form, extra: { ...form.extra, button_text: e.target.value } })}
                placeholder="e.g., Get Discount, View Store"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Button URL / Target Link
              </label>
              <input
                type="text"
                value={form.extra.button_url || form.link_url || ''}
                onChange={(e) => setForm({ ...form, link_url: e.target.value, extra: { ...form.extra, button_url: e.target.value } })}
                placeholder="e.g., /pricing or https://discord.gg/..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Banner Image */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Banner Image URL (Optional)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 hover:bg-purple-500/20 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-2 md:col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <span className="text-sm font-bold text-white">Active Status (Visible on Homepage)</span>
                <p className="text-xs text-slate-400">If enabled, this offer card will appear in the Offers section of the homepage.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_visible: !form.is_visible })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  form.is_visible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                }`}
              >
                {form.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {form.is_visible ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Offer'}</span>
            </button>
          </div>
        </div>
      )}

      {/* OFFERS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-400/20 text-purple-300">
              <Megaphone className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-white">No Offers Created Yet</h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Click the "Add New Offer" button above to create your first announcement or sale banner.
            </p>
            <button
              onClick={startCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add First Offer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {offers.map((offer, index) => {
              const bg = BG_OPTIONS.find((b) => b.id === (offer.extra?.bg_style || 'purple')) || BG_OPTIONS[0];
              const bc = BADGE_COLORS.find((b) => b.id === (offer.extra?.badge_color || 'purple')) || BADGE_COLORS[0];
              const hasTimer = Boolean(offer.extra?.timer_enabled);

              return (
                <div
                  key={offer.id || index}
                  className={`group relative overflow-hidden rounded-2xl border transition-all ${
                    offer.is_visible ? 'border-white/10 bg-[#0d0f1a] hover:border-purple-500/40' : 'border-white/5 bg-[#090a12]/60 opacity-60'
                  }`}
                >
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left preview info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Image Thumbnail */}
                      <div className="h-16 w-24 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                        {offer.image_url ? (
                          <img src={offer.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${bg.class}`}>
                            <Megaphone className="h-6 w-6 text-white/50" />
                          </div>
                        )}
                      </div>

                      {/* Content details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase border ${
                              offer.is_visible
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-700/40 text-slate-400 border-slate-600'
                            }`}
                          >
                            {offer.is_visible ? 'Active' : 'Hidden'}
                          </span>

                          {offer.extra?.badge_text && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${bc.pill}`}>
                              <Zap className="w-2.5 h-2.5" />
                              {offer.extra.badge_text}
                            </span>
                          )}

                          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-white/5">
                            Theme: {bg.label}
                          </span>

                          {hasTimer && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <Timer className="w-3 h-3" />
                              Countdown
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-white truncate">{offer.title}</h4>

                        {offer.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{offer.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(offer)}
                        title={offer.is_visible ? 'Hide Offer' : 'Show Offer'}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          offer.is_visible
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {offer.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(offer)}
                        title="Edit Offer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(offer)}
                        title="Delete Offer"
                        className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
