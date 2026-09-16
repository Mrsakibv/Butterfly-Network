import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Eye, EyeOff, Upload, X, Crown, KeyRound, Coins, Sparkles, Package } from 'lucide-react';
import { AdminLayout, AdminSectionKey } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminActivity';

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
  faq: [
    { key: 'category', label: 'Category', extra: true, options: ['General', 'Connection', 'Game Modes', 'Support'] },
    { key: 'title', label: 'Question' },
    { key: 'description', label: 'Answer', type: 'textarea' },
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
  ],
    store: [
    { key: 'price', label: 'Price (BDT)', extra: true },
    { key: 'badge', label: 'Badge, optional', extra: true },
    { key: 'title', label: 'Product Name' },
    { key: 'description', label: 'Product Description', type: 'textarea' },
    { key: 'features', label: 'Features, one per line', type: 'textarea', extra: true },
  ],
        home: [
    { key: 'subtitle', label: 'Top Left Subtitle (Small uppercase)' },
    { key: 'title', label: 'Top Left Name (Title)' },
    { key: 'description', label: 'Introduction Text', type: 'textarea' },
    { key: 'displayName', label: 'Display Name (Bottom Left)', extra: true },
    { key: 'nameIconUrl', label: 'Logo Icon (Beside bottom name) URL', extra: true },
    { key: 'rank', label: 'Current Rank (Below bottom name)', extra: true },
        { key: 'largeImageUrl', label: 'Large Character Image URL', extra: true },
    { key: 'socialLinks', label: 'Social Links (JSON Format)', extra: true },
  ],
    blog: [
      { key: 'author', label: 'Author Name', extra: true },
      { key: 'authorRank', label: 'Author Rank (e.g. Founder)', extra: true },
      { key: 'authorRankColor', label: 'Author Rank Color Code (e.g. #a855f7)', extra: true },
      { key: 'authorImageUrl', label: 'Author Profile Image URL', extra: true },
      { key: 'title', label: 'Blog Title' },
      { key: 'subtitle', label: 'Publish Date (e.g. October 24, 2023)' },
      { key: 'image_url', label: 'Main Cover Image URL' },
      { key: 'description', label: 'Intro Description', type: 'textarea' },
      { key: 'qna', label: 'QnA Section', extra: true },
      { key: 'sections', label: 'Additional Content (Images & Topics)', extra: true },
    ],
};

const CategoryIcon: React.FC<{ icon: string; iconUrl?: string }> = ({ icon, iconUrl }) => {
  if (iconUrl) {
    return <img src={iconUrl} alt="" className="h-4 w-4 rounded object-cover" />;
  }
  const Icon = icon === 'crown' ? Crown : icon === 'key' ? KeyRound : icon === 'coins' ? Coins : icon === 'sparkles' ? Sparkles : Package;
  return <Icon className="h-4 w-4 text-purple-300" />;
};

const emptyItem = (pageKey: string): PageItem => ({
  page_key: pageKey,
  item_type: pageKey,
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  link_url: '',
  extra: pageKey === 'contact'
    ? { icon: 'discord' }
    : pageKey === 'faq'
      ? { category: 'General' }
            : pageKey === 'store'
        ? { category: 'ranks', price: '', badge: '', features: '' }
                : pageKey === 'blog'
                  ? { author: '', authorRank: '', authorRankColor: '', authorImageUrl: '', qna: '[]', sections: '[]' }
                : pageKey === 'vote'
          ? { features: '' }
        : {},
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
  const [voteSettings, setVoteSettings] = useState<PageItem>(() => ({ ...emptyItem('vote'), item_type: 'vote_settings', title: 'Vote Settings', extra: { rewardsTitle: 'Rewards', rewardsIcon: 'gift', rewardsIconUrl: '', features: '' } }));
  const [voteInstructions, setVoteInstructions] = useState<PageItem>(() => ({ ...emptyItem('vote'), item_type: 'vote_instructions', title: 'Rewards', extra: { rewardsIcon: 'gift', rewardsIconUrl: '', features: '' } }));
  const [votePopup, setVotePopup] = useState<PageItem>(() => ({ ...emptyItem('vote'), item_type: 'vote_popup', title: 'View Rewards', extra: { features: '' } }));
  const [form, setForm] = useState<PageItem>(() => emptyItem(pageKey));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newFeatureIcon, setNewFeatureIcon] = useState('sparkles');
  const [newQna, setNewQna] = useState({ q: '', a: '' });
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [newSection, setNewSection] = useState({ type: 'text', title: '', content: '', imageUrl: '' });
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<{ id: string; label: string; icon: string; iconUrl: string } | null>(null);
  const [storeCategories, setStoreCategories] = useState<{ id: string; label: string; icon: string; iconUrl?: string }[]>([
    { id: 'ranks', label: 'Ranks', icon: 'crown' },
    { id: 'keys', label: 'Keys', icon: 'key' },
    { id: 'coins', label: 'Coins', icon: 'coins' },
    { id: 'wings', label: 'Wings', icon: 'sparkles' },
  ]);

    const [socialDraft, setSocialDraft] = useState({ iconUrl: '', link: '' });

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
      const loadedItems = (data ?? []) as PageItem[];
      if (pageKey === 'vote') {
        const settingsItem = loadedItems.find((item) => item.item_type === 'vote_settings');
        const instructionItem = loadedItems.find((item) => item.item_type === 'vote_instructions');
        const popupItem = loadedItems.find((item) => item.item_type === 'vote_popup');
        if (settingsItem) setVoteSettings(settingsItem);
        if (instructionItem) setVoteInstructions(instructionItem);
        if (popupItem) setVotePopup(popupItem);
      }
      const productItems = loadedItems.filter((item) => item.extra?.categoryOnly !== 'true');
      setItems(productItems.filter((item) => item.item_type !== 'vote_settings'));
      if (pageKey === 'store') {
        setStoreCategories((current) => {
          const custom = loadedItems
            .map((item) => ({
              id: item.extra?.category || '',
              label: item.extra?.categoryLabel || item.extra?.category || '',
              icon: item.extra?.categoryIcon || 'package',
              iconUrl: item.extra?.categoryIconUrl || '',
            }))
            .filter((category) => category.id && !current.some((entry) => entry.id === category.id));
          return [...current, ...custom];
        });
      }
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
    setNewFeature('');
    setNewFeatureIcon('sparkles');
  };

  const getVoteFeatures = (source = voteInstructions) => {
    try {
      const parsed = JSON.parse(source.extra.featureItems || '[]');
      if (Array.isArray(parsed)) return parsed as { text: string; icon: string }[];
    } catch {
      // Legacy newline features are handled below.
    }
    return (source.extra.features || '').split('\n').filter(Boolean).map((text) => ({ text, icon: 'sparkles' }));
  };

  const setVoteFeatures = (features: { text: string; icon: string }[]) => {
    setVoteInstructions((current) => ({ ...current, extra: { ...current.extra, featureItems: JSON.stringify(features), features: features.map((feature) => feature.text).join('\n') } }));
  };

  const addPopupFeature = () => {
    const text = newFeature.trim();
    if (!text) return;
    const features = [...getVoteFeatures(votePopup), { text, icon: newFeatureIcon }];
    setVotePopup((current) => ({ ...current, extra: { ...current.extra, featureItems: JSON.stringify(features), features: features.map((feature) => feature.text).join('\n') } }));
    setNewFeature('');
  };

  const addStoreCategory = async () => {
    const label = window.prompt('Category name');
    if (!label?.trim()) return;
    const categoryLabel = label.trim();
    const id = categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!id || storeCategories.some((category) => category.id === id)) {
      setMessage('That category already exists or the name is invalid.');
      return;
    }
    const icon = window.prompt('Icon: crown, key, coins, sparkles, or package', 'package')?.trim().toLowerCase() || 'package';
    const selectedIcon = ['crown', 'key', 'coins', 'sparkles', 'package'].includes(icon) ? icon : 'package';
    const iconUrl = window.prompt('Custom icon URL (optional)', '')?.trim() || '';
    const { error } = await supabase.from('site_page_items').insert({
      page_key: 'store',
      item_type: 'store_category',
      title: categoryLabel,
      description: '',
      extra: { category: id, categoryLabel, categoryIcon: selectedIcon, categoryIconUrl: iconUrl, categoryOnly: 'true' },
      sort_order: 999,
      is_visible: true,
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }
    setStoreCategories((current) => [...current, { id, label: categoryLabel, icon: selectedIcon, iconUrl }]);
    setEditingId(null);
    setForm({ ...emptyItem(pageKey), extra: { ...emptyItem(pageKey).extra, category: id, categoryLabel, categoryIcon: selectedIcon, categoryIconUrl: iconUrl } });
    setCategoryDraft({ id, label: categoryLabel, icon: selectedIcon, iconUrl });
    setShowCategoryPanel(true);
    setMessage(`Category created. Add the first item in ${categoryLabel}.`);
  };

  const editStoreCategory = (category: { id: string; label: string; icon: string; iconUrl?: string }) => {
    setCategoryDraft({ id: category.id, label: category.label, icon: category.icon, iconUrl: category.iconUrl || '' });
  };

  const saveStoreCategory = async () => {
    if (!categoryDraft?.label.trim()) return;
    setSaving(true);
    const { data: storeRows } = await supabase.from('site_page_items').select('*').eq('page_key', 'store');
    const matchingItems = ((storeRows ?? []) as PageItem[]).filter((item) => item.extra?.category === categoryDraft.id);
    const updatedExtra = (item: PageItem) => ({
      ...item.extra,
      categoryLabel: categoryDraft.label.trim(),
      categoryIcon: categoryDraft.icon,
      categoryIconUrl: categoryDraft.iconUrl.trim(),
    });
    const results = await Promise.all(matchingItems.filter((item) => item.id).map((item) => supabase.from('site_page_items').update({ extra: updatedExtra(item), updated_at: new Date().toISOString() }).eq('id', item.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setMessage(`Error: ${failed.error.message}`);
      setSaving(false);
      return;
    }
    setStoreCategories((current) => current.map((category) => category.id === categoryDraft.id ? { ...category, label: categoryDraft.label.trim(), icon: categoryDraft.icon, iconUrl: categoryDraft.iconUrl.trim() } : category));
    setItems((current) => current.map((item) => item.extra?.category === categoryDraft.id ? { ...item, extra: updatedExtra(item) } : item));
    if (form.extra.category === categoryDraft.id) {
      setForm((current) => ({ ...current, extra: updatedExtra(current) }));
    }
    setCategoryDraft(null);
    setSaving(false);
    setMessage('Category updated successfully.');
  };

  const deleteStoreCategory = async (category: { id: string; label: string }) => {
    const { data: storeRows } = await supabase.from('site_page_items').select('id, extra').eq('page_key', 'store');
    const matchingItems = ((storeRows ?? []) as PageItem[]).filter((item) => item.extra?.category === category.id);
    const confirmation = window.confirm(`Delete ${category.label} and its ${matchingItems.length} product(s)?`);
    if (!confirmation) return;
    setSaving(true);
    const results = await Promise.all(matchingItems.filter((item) => item.id).map((item) => supabase.from('site_page_items').delete().eq('id', item.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setMessage(`Error: ${failed.error.message}`);
      setSaving(false);
      return;
    }
    setItems((current) => current.filter((item) => item.extra?.category !== category.id));
    setStoreCategories((current) => current.filter((entry) => entry.id !== category.id));
    if (form.extra.category === category.id) resetForm();
    setCategoryDraft(null);
    setSaving(false);
    setMessage('Category deleted.');
  };

  const getSocialLinks = () => {
    try {
      return JSON.parse(form.extra.socialLinks || '[]');
    } catch {
      return [];
    }
  };

    const addSocialLink = () => {
    if (!socialDraft.iconUrl.trim() || !socialDraft.link.trim()) return;
    
    // Auto-add https:// if missing
    let finalLink = socialDraft.link.trim();
    if (!/^https?:\/\//i.test(finalLink)) {
      finalLink = `https://${finalLink}`;
    }

    const links = [...getSocialLinks(), { ...socialDraft, link: finalLink }];
    setForm((current) => ({ ...current, extra: { ...current.extra, socialLinks: JSON.stringify(links) } }));
    setSocialDraft({ iconUrl: '', link: '' });
  };

    const removeSocialLink = (index: number) => {
    const links = getSocialLinks().filter((_: any, i: number) => i !== index);
    setForm((current) => ({ ...current, extra: { ...current.extra, socialLinks: JSON.stringify(links) } }));
  };

  const getBlogQna = () => {
    try {
      return JSON.parse(form.extra.qna || '[]');
    } catch {
      return [];
    }
  };

  const addBlogQna = () => {
    if (!newQna.q.trim() || !newQna.a.trim()) return;
    const qna = [...getBlogQna(), { ...newQna }];
    setForm((current) => ({ ...current, extra: { ...current.extra, qna: JSON.stringify(qna) } }));
    setNewQna({ q: '', a: '' });
  };

  const removeBlogQna = (index: number) => {
    const qna = getBlogQna().filter((_: any, i: number) => i !== index);
    setForm((current) => ({ ...current, extra: { ...current.extra, qna: JSON.stringify(qna) } }));
  };

  const getBlogLinks = () => {
    try {
      return JSON.parse(form.extra.links || '[]');
    } catch {
      return [];
    }
  };

  const addBlogLink = () => {
    if (!newLink.url.trim()) return;
    const links = [...getBlogLinks(), { ...newLink }];
    setForm((current) => ({ ...current, extra: { ...current.extra, links: JSON.stringify(links) } }));
    setNewLink({ label: '', url: '' });
  };

    const removeBlogLink = (index: number) => {
    const links = getBlogLinks().filter((_: any, i: number) => i !== index);
    setForm((current) => ({ ...current, extra: { ...current.extra, links: JSON.stringify(links) } }));
  };

  const getBlogSections = () => {
    try {
      return JSON.parse(form.extra.sections || '[]');
    } catch {
      return [];
    }
  };

  const addBlogSection = () => {
    if (newSection.type === 'text' && !newSection.content.trim()) return;
    if (newSection.type === 'image' && !newSection.imageUrl.trim()) return;
    if (newSection.type === 'points' && !newSection.content.trim()) return;

    const sections = [...getBlogSections(), { ...newSection }];
    setForm((current) => ({ ...current, extra: { ...current.extra, sections: JSON.stringify(sections) } }));
    setNewSection({ type: 'text', title: '', content: '', imageUrl: '' });
  };

  const removeBlogSection = (index: number) => {
    const sections = getBlogSections().filter((_: any, i: number) => i !== index);
    setForm((current) => ({ ...current, extra: { ...current.extra, sections: JSON.stringify(sections) } }));
  };

  const addFeature = () => {
    const feature = newFeature.trim();
    if (!feature) return;
    const features = form.extra.features ? `${form.extra.features}\n${feature}` : feature;
    setForm((current) => ({ ...current, extra: { ...current.extra, features } }));
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    const features = form.extra.features.split('\n').filter(Boolean).filter((_, featureIndex) => featureIndex !== index).join('\n');
    setForm((current) => ({ ...current, extra: { ...current.extra, features } }));
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
      extra: pageKey === 'store' ? { ...form.extra, categoryLabel: storeCategories.find((category) => category.id === form.extra.category)?.label || form.extra.category, categoryIconUrl: form.extra.categoryIconUrl || '' } : form.extra,
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

    await logAdminActivity({
      action: editingId ? 'updated' : 'created',
      section: `${pageKey[0].toUpperCase()}${pageKey.slice(1)} Content`,
      itemName: payload.title || pageKey,
      details: payload,
    });
    setMessage(editingId ? 'Item updated successfully.' : 'Item added successfully.');
    resetForm();
    loadItems();
  };

  const saveVoteSettings = async () => {
    const payload = {
      page_key: 'vote',
      item_type: 'vote_settings',
      title: 'Vote Settings',
      description: '',
      image_url: '',
      link_url: voteSettings.link_url.trim(),
      extra: {},
      sort_order: 0,
      is_visible: true,
      updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const result = voteSettings.id
      ? await supabase.from('site_page_items').update(payload).eq('id', voteSettings.id)
      : await supabase.from('site_page_items').insert(payload).select().single();
    setSaving(false);
    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }
    if (!voteSettings.id && result.data) setVoteSettings(result.data as PageItem);
    await logAdminActivity({ action: voteSettings.id ? 'updated' : 'created', section: 'Vote Settings', itemName: 'Vote Settings', details: payload });
    setMessage('Vote settings saved successfully.');
  };

  const saveVoteInstructions = async () => {
    const payload = {
      page_key: 'vote',
      item_type: 'vote_instructions',
      title: voteInstructions.title.trim() || 'Rewards',
      description: voteInstructions.description.trim(),
      image_url: voteInstructions.image_url.trim(),
      link_url: '',
      extra: voteInstructions.extra,
      sort_order: 1,
      is_visible: true,
      updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const result = voteInstructions.id
      ? await supabase.from('site_page_items').update(payload).eq('id', voteInstructions.id)
      : await supabase.from('site_page_items').insert(payload).select().single();
    setSaving(false);
    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }
    if (!voteInstructions.id && result.data) setVoteInstructions(result.data as PageItem);
    await logAdminActivity({ action: voteInstructions.id ? 'updated' : 'created', section: 'Vote Instructions', itemName: payload.title, details: payload });
    setMessage('Vote instructions saved successfully.');
  };

  const saveVotePopup = async () => {
    const features = getVoteFeatures(votePopup);
    const payload = {
      page_key: 'vote', item_type: 'vote_popup', title: votePopup.title.trim() || 'View Rewards',
      description: votePopup.description.trim(), image_url: votePopup.image_url.trim(), link_url: '',
      extra: { ...votePopup.extra, featureItems: JSON.stringify(features), features: features.map((feature) => feature.text).join('\n') },
      sort_order: 2, is_visible: true, updated_at: new Date().toISOString(),
    };
    setSaving(true);
    const result = votePopup.id ? await supabase.from('site_page_items').update(payload).eq('id', votePopup.id) : await supabase.from('site_page_items').insert(payload).select().single();
    setSaving(false);
    if (result.error) { setMessage(`Error: ${result.error.message}`); return; }
    if (!votePopup.id && result.data) setVotePopup(result.data as PageItem);
    await logAdminActivity({ action: votePopup.id ? 'updated' : 'created', section: 'View Rewards Popup', itemName: payload.title, details: payload });
    setMessage('View Rewards popup saved successfully.');
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm('Remove this item?')) return;
    const { data: item } = await supabase.from('site_page_items').select('title, page_key, description, is_visible').eq('id', id).maybeSingle();
    const { error } = await supabase.from('site_page_items').delete().eq('id', id);
    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }
    await logAdminActivity({
      action: 'deleted',
      section: `${pageKey[0].toUpperCase()}${pageKey.slice(1)} Content`,
      itemName: item?.title || id,
      details: item || { id },
    });
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
    await logAdminActivity({
      action: 'visibility_changed',
      section: `${pageKey[0].toUpperCase()}${pageKey.slice(1)} Content`,
      itemName: item.title || item.id,
      details: { visible: nextValue },
    });
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
    <AdminLayout active={pageKey}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="flex gap-2">
          {pageKey === 'store' && <button onClick={() => setShowCategoryPanel((current) => !current)} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"><Package className="h-4 w-4" /> View Categories</button>}
          <button onClick={resetForm} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500">
          <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {message && <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">{message}</div>}

      {pageKey === 'store' && showCategoryPanel && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h3 className="text-lg font-semibold">Store Categories</h3><p className="text-sm text-slate-500">Manage category names, icons, and custom image URLs.</p></div>
            <button onClick={addStoreCategory} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"><Plus className="h-4 w-4" /> Add Category</button>
          </div>
          <div className="space-y-3">
            {storeCategories.map((category) => (
              <div key={category.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5"><CategoryIcon icon={category.icon} iconUrl={category.iconUrl} /></div><div><p className="font-semibold text-white">{category.label}</p><p className="text-xs text-slate-500">{category.id}</p></div></div>
                <div className="flex gap-2"><button onClick={() => editStoreCategory(category)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">Edit Category</button><button onClick={() => deleteStoreCategory(category)} disabled={saving} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50" title="Delete category"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            ))}
          </div>
          {categoryDraft && (
            <div className="mt-5 rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
              <h4 className="mb-3 font-semibold">Edit Category</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={categoryDraft.label} onChange={(event) => setCategoryDraft((current) => current ? { ...current, label: event.target.value } : current)} placeholder="Category name" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" />
                <select value={categoryDraft.icon} onChange={(event) => setCategoryDraft((current) => current ? { ...current, icon: event.target.value } : current)} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"><option value="crown">Crown</option><option value="key">Key</option><option value="coins">Coins</option><option value="sparkles">Sparkles</option><option value="package">Package</option></select>
                <input value={categoryDraft.iconUrl} onChange={(event) => setCategoryDraft((current) => current ? { ...current, iconUrl: event.target.value } : current)} placeholder="Custom icon image URL" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500 md:col-span-2" />
                <p className="text-xs leading-relaxed text-slate-500 md:col-span-2">Use a direct public PNG, JPG, WEBP, or SVG image URL. You can upload images at <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">ImgBB</a>, <a href="https://postimages.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">Postimages</a>, or <a href="https://myimgs.org" target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">MyImgs</a>. Leave empty to use the selected default icon.</p>
              </div>
              <div className="mt-3 flex items-center gap-2"><CategoryIcon icon={categoryDraft.icon} iconUrl={categoryDraft.iconUrl} /><span className="text-xs text-slate-500">Preview</span></div>
              <div className="mt-4 flex gap-2"><button onClick={saveStoreCategory} disabled={saving} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save Category'}</button><button onClick={() => setCategoryDraft(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">Cancel</button></div>
            </div>
          )}
        </div>
      )}

      {pageKey === 'vote' && (
        <>
        <div className="mb-8 rounded-2xl border border-purple-400/20 bg-purple-500/5 p-6">
          <h3 className="mb-1 text-lg font-semibold">Vote Button Settings</h3>
          <p className="mb-4 text-sm text-slate-500">Set only the external link used by the Vote Now button.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><label className="mb-1 block text-xs text-slate-500">Main Vote Now URL</label><input value={voteSettings.link_url} onChange={(event) => setVoteSettings((current) => ({ ...current, link_url: event.target.value }))} placeholder="https://your-vote-site.example" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" /></div>
          </div>
          <button onClick={saveVoteSettings} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-semibold disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Vote URL'}</button>
        </div>
        <div className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-500/5 p-6">
          <h3 className="mb-1 text-lg font-semibold">Vote Instructions</h3>
          <p className="mb-4 text-sm text-slate-500">This separate box controls only the Rewards panel and View Rewards popup.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="mb-1 block text-xs text-slate-500">Instructions Box Title</label><input value={voteInstructions.title || 'Rewards'} onChange={(event) => setVoteInstructions((current) => ({ ...current, title: event.target.value }))} placeholder="Rewards" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Instructions Box Icon</label><select value={voteInstructions.extra.rewardsIcon || 'gift'} onChange={(event) => setVoteInstructions((current) => ({ ...current, extra: { ...current.extra, rewardsIcon: event.target.value } }))} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"><option value="gift">Gift</option><option value="sparkles">Sparkles</option><option value="crown">Crown</option><option value="coins">Coins</option><option value="gem">Gem</option><option value="medal">Medal</option><option value="package">Package</option></select></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs text-slate-500">Custom Instructions Icon URL (optional)</label><input value={voteInstructions.extra.rewardsIconUrl || ''} onChange={(event) => setVoteInstructions((current) => ({ ...current, extra: { ...current.extra, rewardsIconUrl: event.target.value } }))} placeholder="https://example.com/icon.png" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" /><p className="mt-1 text-xs text-slate-500">Use a direct public PNG, JPG, WEBP, or SVG URL. Leave empty to use the selected Lucide icon. Feature icons use Lucide icons only.</p></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs text-slate-500">Popup Reward Features</label><div className="space-y-2"><div className="max-h-36 space-y-2 overflow-y-auto pr-1">{getVoteFeatures().map((feature, index) => <div key={`${feature.text}-${index}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300"><select value={feature.icon} onChange={(event) => { const features = getVoteFeatures(); features[index] = { ...features[index], icon: event.target.value }; setVoteFeatures(features); }} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs"><option value="sparkles">Sparkles</option><option value="gift">Gift</option><option value="crown">Crown</option><option value="coins">Coins</option><option value="shield">Shield</option><option value="star">Star</option><option value="zap">Zap</option><option value="trophy">Trophy</option><option value="key">Key</option></select><input value={feature.text} onChange={(event) => { const features = getVoteFeatures(); features[index] = { ...features[index], text: event.target.value }; setVoteFeatures(features); }} className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none" /><button type="button" onClick={() => setVoteFeatures(getVoteFeatures().filter((_, featureIndex) => featureIndex !== index))} className="text-red-300 hover:text-red-200"><X className="h-4 w-4" /></button></div>)}</div><div className="flex gap-2"><select value={newFeatureIcon} onChange={(event) => setNewFeatureIcon(event.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-2 text-xs"><option value="sparkles">Sparkles</option><option value="gift">Gift</option><option value="crown">Crown</option><option value="coins">Coins</option><option value="shield">Shield</option><option value="star">Star</option><option value="zap">Zap</option><option value="trophy">Trophy</option><option value="key">Key</option></select><input value={newFeature} onChange={(event) => setNewFeature(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); const text = newFeature.trim(); if (text) { setVoteFeatures([...getVoteFeatures(), { text, icon: newFeatureIcon }]); setNewFeature(''); } } }} placeholder="Add reward feature" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" /><button type="button" onClick={() => { const text = newFeature.trim(); if (text) { setVoteFeatures([...getVoteFeatures(), { text, icon: newFeatureIcon }]); setNewFeature(''); } }} className="inline-flex items-center gap-1 rounded-xl border border-purple-400/40 px-3 py-2 text-sm text-purple-200"><Plus className="h-4 w-4" /> Add</button></div></div></div>
          </div>
          <button onClick={saveVoteInstructions} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-semibold disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Instructions'}</button>
        </div>
        <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-500/5 p-6">
          <h3 className="mb-1 text-lg font-semibold">View Rewards Popup</h3>
          <p className="mb-4 text-sm text-slate-500">This popup content is completely separate from the main instruction box.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="mb-1 block text-xs text-slate-500">Popup Title</label><input value={votePopup.title} onChange={(event) => setVotePopup((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-sky-400" /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Popup Image URL</label><input value={votePopup.image_url} onChange={(event) => setVotePopup((current) => ({ ...current, image_url: event.target.value }))} placeholder="https://example.com/rewards.png" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-sky-400" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs text-slate-500">Popup Description</label><textarea value={votePopup.description} onChange={(event) => setVotePopup((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-sky-400" /></div>
            <div className="md:col-span-2"><label className="mb-1 block text-xs text-slate-500">Popup Features</label><div className="max-h-36 space-y-2 overflow-y-auto pr-1">{getVoteFeatures(votePopup).map((feature, index) => <div key={`${feature.text}-${index}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><select value={feature.icon} onChange={(event) => { const features = getVoteFeatures(votePopup); features[index] = { ...features[index], icon: event.target.value }; setVotePopup((current) => ({ ...current, extra: { ...current.extra, featureItems: JSON.stringify(features), features: features.map((entry) => entry.text).join('\n') } })); }} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs"><option value="sparkles">Sparkles</option><option value="gift">Gift</option><option value="crown">Crown</option><option value="coins">Coins</option><option value="shield">Shield</option><option value="star">Star</option><option value="zap">Zap</option><option value="trophy">Trophy</option><option value="key">Key</option></select><input value={feature.text} onChange={(event) => { const features = getVoteFeatures(votePopup); features[index] = { ...features[index], text: event.target.value }; setVotePopup((current) => ({ ...current, extra: { ...current.extra, featureItems: JSON.stringify(features), features: features.map((entry) => entry.text).join('\n') } })); }} className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none" /><button type="button" onClick={() => { const features = getVoteFeatures(votePopup).filter((_, featureIndex) => featureIndex !== index); setVotePopup((current) => ({ ...current, extra: { ...current.extra, featureItems: JSON.stringify(features), features: features.map((entry) => entry.text).join('\n') } })); }} className="text-red-300"><X className="h-4 w-4" /></button></div>)}</div><div className="mt-2 flex gap-2"><select value={newFeatureIcon} onChange={(event) => setNewFeatureIcon(event.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-2 text-xs"><option value="sparkles">Sparkles</option><option value="gift">Gift</option><option value="crown">Crown</option><option value="coins">Coins</option><option value="shield">Shield</option><option value="star">Star</option><option value="zap">Zap</option><option value="trophy">Trophy</option><option value="key">Key</option></select><input value={newFeature} onChange={(event) => setNewFeature(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPopupFeature(); } }} placeholder="Add popup feature" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-sky-400" /><button type="button" onClick={addPopupFeature} className="rounded-xl border border-sky-400/40 px-3 py-2 text-sm text-sky-200">Add</button></div><p className="mt-2 text-xs text-slate-500">Add or edit popup features and choose a Lucide icon for each one. No image URL is used for feature icons.</p></div>
          </div>
          <button onClick={saveVotePopup} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 font-semibold disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Popup'}</button>
        </div>
        </>
      )}

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold">{editingId ? 'Edit Item' : 'New Item'}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pageKey === 'store' && (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Store Category</label>
              <select value={form.extra.category || ''} onChange={(event) => { const category = storeCategories.find((entry) => entry.id === event.target.value); setForm((current) => ({ ...current, extra: { ...current.extra, category: event.target.value, categoryLabel: category?.label || '', categoryIcon: category?.icon || 'package', categoryIconUrl: category?.iconUrl || '' } })); }} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500">
                {storeCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><CategoryIcon icon={storeCategories.find((category) => category.id === form.extra.category)?.icon || 'package'} iconUrl={storeCategories.find((category) => category.id === form.extra.category)?.iconUrl} /> This item uses its category icon.</div>
            </div>
          )}
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
              ) : field.key === 'socialLinks' && pageKey === 'home' ? (
                <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="flex flex-wrap gap-3">
                                          {getSocialLinks().map((link: any, index: number) => (
                      <div key={index} className="group relative flex items-center gap-2 rounded-lg bg-white/5 p-2 pr-8">
                        <img src={link.iconUrl} alt="" className="h-5 w-5 rounded object-cover" />
                        <a 
                          href={link.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="max-w-[100px] truncate text-xs text-sky-400 hover:underline"
                        >
                          {link.link}
                        </a>
                        <button type="button" onClick={() => removeSocialLink(index)} className="absolute right-1 top-1 hidden text-red-400 group-hover:block"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input value={socialDraft.iconUrl} onChange={(e) => setSocialDraft({ ...socialDraft, iconUrl: e.target.value })} placeholder="Icon Image URL" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-purple-500" />
                    <input value={socialDraft.link} onChange={(e) => setSocialDraft({ ...socialDraft, link: e.target.value })} placeholder="Link URL" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-purple-500" />
                  </div>
                  <button type="button" onClick={addSocialLink} className="w-full rounded-lg bg-white/5 py-2 text-xs font-semibold hover:bg-white/10">+ Add Social Link</button>
                  <p className="text-[10px] text-slate-500 italic text-center">Manage social links as image icons with custom URLs.</p>
                </div>
              ) : field.key === 'qna' && pageKey === 'blog' ? (
                <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="space-y-3">
                    {getBlogQna().map((qna: any, index: number) => (
                      <div key={index} className="relative rounded-lg bg-white/5 p-3 pr-10 text-xs">
                        <p className="font-bold text-purple-300">Q: {qna.q}</p>
                        <p className="mt-1 text-slate-400">A: {qna.a}</p>
                        <button type="button" onClick={() => removeBlogQna(index)} className="absolute right-2 top-2 text-red-400 hover:text-red-300">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <input value={newQna.q} onChange={(e) => setNewQna({ ...newQna, q: e.target.value })} placeholder="Question" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-purple-500" />
                    <textarea value={newQna.a} onChange={(e) => setNewQna({ ...newQna, a: e.target.value })} placeholder="Answer" rows={2} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-purple-500" />
                    <button type="button" onClick={addBlogQna} className="w-full rounded-lg bg-purple-600/20 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/30">
                      + Add QnA Pair
                    </button>
                  </div>
                </div>
              ) : field.key === 'sections' && pageKey === 'blog' ? (
                <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="space-y-4">
                    {getBlogSections().map((section: any, index: number) => (
                      <div key={index} className="relative rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                            {section.type}
                          </span>
                          {section.title && <span className="text-xs font-bold text-white">{section.title}</span>}
                        </div>
                        {section.imageUrl && <img src={section.imageUrl} alt="" className="mb-2 h-20 w-full rounded object-cover" />}
                        {section.content && <p className="text-[10px] text-slate-400 line-clamp-2">{section.content}</p>}
                        <button type="button" onClick={() => removeBlogSection(index)} className="absolute right-2 top-2 text-red-400 hover:text-red-300">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3 rounded-lg border border-white/10 bg-black/40 p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {(['text', 'image', 'points'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewSection({ ...newSection, type })}
                          className={`rounded-lg py-2 text-xs font-bold transition-all ${
                            newSection.type === type ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {newSection.type !== 'image' && (
                      <input
                        value={newSection.title}
                        onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                        placeholder="Section Title (Optional)"
                        className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs outline-none focus:border-purple-500"
                      />
                    )}

                    {newSection.type === 'image' ? (
                      <input
                        value={newSection.imageUrl}
                        onChange={(e) => setNewSection({ ...newSection, imageUrl: e.target.value })}
                        placeholder="Image URL"
                        className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs outline-none focus:border-purple-500"
                      />
                    ) : (
                      <textarea
                        value={newSection.content}
                        onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                        placeholder={newSection.type === 'points' ? "Points (one per line)" : "Content text..."}
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs outline-none focus:border-purple-500"
                      />
                    )}

                    <button type="button" onClick={addBlogSection} className="w-full rounded-lg bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-500">
                      + Add to Content Flow
                    </button>
                  </div>
                </div>
              ) : field.key === 'links' && pageKey === 'blog' ? (
                <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="flex flex-wrap gap-2">
                    {getBlogLinks().map((link: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
                        <span className="text-purple-300">{link.label || 'Link'}</span>
                        <span className="text-slate-500">|</span>
                        <span className="max-w-[100px] truncate text-slate-400">{link.url}</span>
                        <button type="button" onClick={() => removeBlogLink(index)} className="ml-1 text-red-400 hover:text-red-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} placeholder="Label (e.g. Discord)" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-purple-500" />
                    <input value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} placeholder="URL" className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-purple-500" />
                  </div>
                  <button type="button" onClick={addBlogLink} className="w-full rounded-lg bg-purple-600/20 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-600/30">
                    + Add Link
                  </button>
                </div>
                            ) : field.key === 'features' && (pageKey === 'store' || pageKey === 'vote' || pageKey === 'blog') ? (
                <div className="space-y-2">
                  <div className="max-h-36 space-y-2 overflow-y-auto pr-1">{getField(field).split('\n').filter(Boolean).map((feature: string, index: number) => <div key={`${feature}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300"><span>{feature}</span><button type="button" onClick={() => removeFeature(index)} className="text-red-300 hover:text-red-200" title="Remove feature"><X className="h-4 w-4" /></button></div>)}</div>
                  <div className="flex gap-2"><input value={newFeature} onChange={(event) => setNewFeature(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addFeature(); } }} placeholder="Add a feature" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500" /><button type="button" onClick={addFeature} className="inline-flex items-center gap-1 rounded-xl border border-purple-400/40 px-3 py-2 text-sm text-purple-200 hover:bg-purple-500/10"><Plus className="h-4 w-4" /> Add</button></div>
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
              <button onClick={() => { setEditingId(item.id ?? null); setForm(item); setNewFeature(''); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};
