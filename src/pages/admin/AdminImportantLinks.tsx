import React, { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminActivity';
import { AdminLayout } from './AdminLayout';

interface LinkGroup {
  id: string;
  title: string;
  subtitle: string;
}

interface ImportantLink {
  id: string;
  group_id: string;
  title: string;
  description: string;
  url: string;
}

interface LinkFeature {
  id: string;
  link_id: string;
  title: string;
  description: string;
  created_at: string;
}

const emptyGroupForm = { title: '', subtitle: '' };
const emptyLinkForm = { title: '', description: '', url: '' };
const emptyFeatureForm = { title: '', description: '' };

export const AdminImportantLinks: React.FC = () => {
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [links, setLinks] = useState<ImportantLink[]>([]);
  const [features, setFeatures] = useState<LinkFeature[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  const [groupFormVisible, setGroupFormVisible] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);

  const [linkFormVisible, setLinkFormVisible] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState(emptyLinkForm);

  const [featureFormVisible, setFeatureFormVisible] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [featureForm, setFeatureForm] = useState(emptyFeatureForm);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');

    const [groupsResult, linksResult, featuresResult] = await Promise.all([
      supabase
        .from('admin_important_link_groups')
        .select('id, title, subtitle')
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_important_links')
        .select('id, group_id, title, description, url')
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_important_link_features')
        .select('id, link_id, title, description, created_at')
        .order('created_at', { ascending: true }),
    ]);

    if (groupsResult.error || linksResult.error || featuresResult.error) {
      setLoadError(
        [
          groupsResult.error?.message,
          linksResult.error?.message,
          featuresResult.error?.message,
        ]
          .filter(Boolean)
          .join(' · ')
      );
    } else {
      setGroups(groupsResult.data ?? []);
      setLinks(linksResult.data ?? []);
      setFeatures(featuresResult.data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const groupLinks = links.filter((link) => link.group_id === selectedGroupId);
  const selectedLink = groupLinks.find((link) => link.id === selectedLinkId) ?? null;
  const selectedLinkFeatures = features.filter((feature) => feature.link_id === selectedLinkId);

  const resetGroupForm = () => {
    setGroupForm(emptyGroupForm);
    setEditingGroupId(null);
    setGroupFormVisible(false);
  };

  const resetLinkForm = () => {
    setLinkForm(emptyLinkForm);
    setEditingLinkId(null);
    setLinkFormVisible(false);
  };

  const resetFeatureForm = () => {
    setFeatureForm(emptyFeatureForm);
    setEditingFeatureId(null);
    setFeatureFormVisible(false);
  };

  const handleSaveGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = groupForm.title.trim();
    const subtitle = groupForm.subtitle.trim();
    if (!title) {
      setMessage('Please enter a group title.');
      return;
    }

    setSaving(true);
    setMessage('');
    const payload = { title, subtitle, updated_at: new Date().toISOString() };
    const result = editingGroupId
      ? await supabase
          .from('admin_important_link_groups')
          .update(payload)
          .eq('id', editingGroupId)
      : await supabase
          .from('admin_important_link_groups')
          .insert(payload)
          .select('id')
          .single();
    setSaving(false);

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }

    const groupId = editingGroupId || result.data.id;
    await logAdminActivity({
      action: editingGroupId ? 'updated' : 'created',
      section: 'Important Link Groups',
      itemName: title,
      details: payload,
    });
    setMessage(editingGroupId ? 'Group updated.' : 'Group added.');
    resetGroupForm();
    if (groupId) setSelectedGroupId(groupId);
    await loadData();
  };

  const handleDeleteGroup = async (group: LinkGroup) => {
    const count = links.filter((link) => link.group_id === group.id).length;
    const confirmText = count
      ? `Delete "${group.title}" and its ${count} link${count === 1 ? '' : 's'}?`
      : `Delete "${group.title}"?`;
    if (!window.confirm(confirmText)) return;

    const { error } = await supabase
      .from('admin_important_link_groups')
      .delete()
      .eq('id', group.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    await logAdminActivity({
      action: 'deleted',
      section: 'Important Link Groups',
      itemName: group.title,
      details: { subtitle: group.subtitle, links: count },
    });
    setMessage('Group deleted.');
    if (selectedGroupId === group.id) setSelectedGroupId(null);
    if (editingGroupId === group.id) resetGroupForm();
    await loadData();
  };

  const handleSaveLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroupId) return;

    const title = linkForm.title.trim();
    const description = linkForm.description.trim();
    const url = linkForm.url.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      setMessage('Please enter a valid link.');
      return;
    }

    if (!title) {
      setMessage('Please enter a link title.');
      return;
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      setMessage('Links must start with http:// or https://.');
      return;
    }

    setSaving(true);
    setMessage('');
    const payload = {
      group_id: selectedGroupId,
      title,
      description,
      url: parsedUrl.toString(),
      updated_at: new Date().toISOString(),
    };
    const result = editingLinkId
      ? await supabase
          .from('admin_important_links')
          .update(payload)
          .eq('id', editingLinkId)
      : await supabase.from('admin_important_links').insert(payload);
    setSaving(false);

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }

    await logAdminActivity({
      action: editingLinkId ? 'updated' : 'created',
      section: 'Important Links',
      itemName: title,
      details: payload,
    });
    setMessage(editingLinkId ? 'Link updated.' : 'Link added.');
    resetLinkForm();
    await loadData();
  };

  const handleDeleteLink = async (link: ImportantLink) => {
    if (!window.confirm(`Delete "${link.title}"?`)) return;

    const { error } = await supabase
      .from('admin_important_links')
      .delete()
      .eq('id', link.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    await logAdminActivity({
      action: 'deleted',
      section: 'Important Links',
      itemName: link.title,
      details: { group: selectedGroup?.title, url: link.url },
    });
    setMessage('Link deleted.');
    if (editingLinkId === link.id) resetLinkForm();
    if (selectedLinkId === link.id) {
      setSelectedLinkId(null);
      resetFeatureForm();
    }
    await loadData();
  };

  const handleSaveFeature = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedLinkId) return;

    const title = featureForm.title.trim();
    const description = featureForm.description.trim();
    if (!title) {
      setMessage('Please enter a feature title.');
      return;
    }

    setSaving(true);
    setMessage('');
    const payload = {
      link_id: selectedLinkId,
      title,
      description,
      updated_at: new Date().toISOString(),
    };
    const result = editingFeatureId
      ? await supabase
          .from('admin_important_link_features')
          .update(payload)
          .eq('id', editingFeatureId)
      : await supabase.from('admin_important_link_features').insert(payload);
    setSaving(false);

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
      return;
    }

    await logAdminActivity({
      action: editingFeatureId ? 'updated' : 'created',
      section: 'Important Link Features',
      itemName: title,
      details: { link: selectedLink?.title, description },
    });
    setMessage(editingFeatureId ? 'Feature updated.' : 'Feature added.');
    resetFeatureForm();
    await loadData();
  };

  const handleDeleteFeature = async (feature: LinkFeature) => {
    if (!window.confirm(`Delete feature "${feature.title}"?`)) return;

    const { error } = await supabase
      .from('admin_important_link_features')
      .delete()
      .eq('id', feature.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    await logAdminActivity({
      action: 'deleted',
      section: 'Important Link Features',
      itemName: feature.title,
      details: { link: selectedLink?.title, description: feature.description },
    });
    setMessage('Feature deleted.');
    if (editingFeatureId === feature.id) resetFeatureForm();
    await loadData();
  };

  const startEditingGroup = (group: LinkGroup) => {
    setEditingGroupId(group.id);
    setGroupForm({ title: group.title, subtitle: group.subtitle });
    setGroupFormVisible(true);
    setMessage('');
  };

  const startEditingLink = (link: ImportantLink) => {
    setEditingLinkId(link.id);
    setLinkForm({
      title: link.title,
      description: link.description,
      url: link.url,
    });
    setLinkFormVisible(true);
    setMessage('');
  };

  const startEditingFeature = (feature: LinkFeature) => {
    setEditingFeatureId(feature.id);
    setFeatureForm({ title: feature.title, description: feature.description });
    setFeatureFormVisible(true);
    setMessage('');
  };

  const messageBlock = message && (
    <p
      role="status"
      className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200"
    >
      {message}
    </p>
  );

  return (
    <AdminLayout active="importantlinks" permission="importantlinks">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Important Links</h2>
          <p className="mt-1 text-sm text-slate-400">
            Organize server resources into groups and keep multiple links in each.
          </p>
        </div>
        {selectedGroup ? (
          <button
            type="button"
            onClick={() => {
              setSelectedGroupId(null);
              setSelectedLinkId(null);
              resetGroupForm();
              resetLinkForm();
              resetFeatureForm();
              setMessage('');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            All groups
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              resetGroupForm();
              setGroupFormVisible(true);
              setMessage('');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            Add group
          </button>
        )}
      </div>

      {messageBlock}
      {loadError && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          Important links could not be loaded: {loadError}. Run
          {' '}supabase-admin-important-links.sql in Supabase SQL Editor to set up storage.
        </p>
      )}

      {!selectedGroup && groupFormVisible && (
        <form
          onSubmit={handleSaveGroup}
          className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{editingGroupId ? 'Edit group' : 'New link group'}</h3>
            <button
              type="button"
              onClick={resetGroupForm}
              aria-label="Cancel group editing"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              required
              maxLength={100}
              value={groupForm.title}
              onChange={(event) => setGroupForm({ ...groupForm, title: event.target.value })}
              placeholder="Group title"
              aria-label="Group title"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
            />
            <input
              maxLength={240}
              value={groupForm.subtitle}
              onChange={(event) => setGroupForm({ ...groupForm, subtitle: event.target.value })}
              placeholder="Subtitle / short description"
              aria-label="Group subtitle"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingGroupId ? 'Save group' : 'Create group'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-8 text-sm text-slate-500">Loading important links...</p>
      ) : selectedGroup ? (
        <section>
          <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/[0.08] to-white/[0.02] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
                  <FolderOpen className="h-4 w-4" />
                  Link group
                </p>
                <h3 className="text-xl font-bold text-white">{selectedGroup.title}</h3>
                {selectedGroup.subtitle && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    {selectedGroup.subtitle}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditingGroup(selectedGroup)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Edit group
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteGroup(selectedGroup)}
                  aria-label={`Delete ${selectedGroup.title}`}
                  className="rounded-xl border border-red-500/20 px-3 py-2 text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {groupFormVisible && (
            <form
              onSubmit={handleSaveGroup}
              className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Edit group information</h3>
                <button
                  type="button"
                  onClick={resetGroupForm}
                  aria-label="Cancel group editing"
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  maxLength={100}
                  value={groupForm.title}
                  onChange={(event) => setGroupForm({ ...groupForm, title: event.target.value })}
                  placeholder="Group title"
                  aria-label="Group title"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
                <input
                  maxLength={240}
                  value={groupForm.subtitle}
                  onChange={(event) => setGroupForm({ ...groupForm, subtitle: event.target.value })}
                  placeholder="Subtitle / short description"
                  aria-label="Group subtitle"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save group'}
                </button>
              </div>
            </form>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Links</h3>
              <p className="mt-1 text-xs text-slate-500">
                {groupLinks.length} link{groupLinks.length === 1 ? '' : 's'} in this group
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetLinkForm();
                setSelectedLinkId(null);
                setLinkFormVisible(true);
                setMessage('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
            >
              <Plus className="h-4 w-4" />
              Add link
            </button>
          </div>

          {linkFormVisible && (
            <form
              onSubmit={handleSaveLink}
              className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold">{editingLinkId ? 'Edit link' : 'Add a link'}</h4>
                <button
                  type="button"
                  onClick={resetLinkForm}
                  aria-label="Cancel link editing"
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  required
                  maxLength={100}
                  value={linkForm.title}
                  onChange={(event) => setLinkForm({ ...linkForm, title: event.target.value })}
                  placeholder="Link title"
                  aria-label="Link title"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
                <input
                  maxLength={240}
                  value={linkForm.description}
                  onChange={(event) => setLinkForm({ ...linkForm, description: event.target.value })}
                  placeholder="Subtitle / feature description"
                  aria-label="Link subtitle"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
                <input
                  required
                  type="url"
                  maxLength={2048}
                  value={linkForm.url}
                  onChange={(event) => setLinkForm({ ...linkForm, url: event.target.value })}
                  placeholder="https://..."
                  aria-label="Link URL"
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingLinkId ? 'Save changes' : 'Save link'}
                </button>
              </div>
            </form>
          )}

          <AnimatePresence mode="wait">
            {selectedLink ? (
              <motion.section
                key={`detail-${selectedLink.id}`}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.985 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="overflow-hidden rounded-3xl border border-purple-300/15 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.16),transparent_48%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLinkId(null);
                    resetLinkForm();
                    resetFeatureForm();
                    setMessage('');
                  }}
                  className="mb-7 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300 transition hover:border-purple-300/30 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to links
                </button>

                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-3xl">
                    <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-purple-200">
                      <Link2 className="h-3.5 w-3.5" />
                      {selectedGroup.title} · Feature
                    </p>
                    <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      {selectedLink.title}
                    </h3>
                    {selectedLink.description && (
                      <p className="mt-4 max-w-2xl whitespace-pre-wrap text-base leading-7 text-slate-300">
                        {selectedLink.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingLink(selectedLink)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-purple-300/30 hover:bg-purple-300/10"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit / Update
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLink(selectedLink)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-400/15"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-200">
                        Features
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedLinkFeatures.length} feature{selectedLinkFeatures.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetFeatureForm();
                        setFeatureFormVisible(true);
                        setMessage('');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-purple-300/20 bg-purple-300/[0.08] px-3.5 py-2 text-sm font-semibold text-purple-100 transition hover:border-purple-300/40 hover:bg-purple-300/[0.14]"
                    >
                      <Plus className="h-4 w-4" />
                      Add feature
                    </button>
                  </div>

                  {featureFormVisible && (
                    <form
                      onSubmit={handleSaveFeature}
                      className="mb-4 rounded-2xl border border-purple-300/15 bg-[#080910]/70 p-4 sm:p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-white">
                            {editingFeatureId ? 'Edit feature' : 'New feature'}
                          </h5>
                          <p className="mt-1 text-xs text-slate-500">
                            Add a feature row to this link's details.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetFeatureForm}
                          aria-label="Cancel feature editing"
                          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          required
                          maxLength={100}
                          value={featureForm.title}
                          onChange={(event) =>
                            setFeatureForm({ ...featureForm, title: event.target.value })
                          }
                          placeholder="Feature title"
                          aria-label="Feature title"
                          className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
                        />
                        <input
                          maxLength={500}
                          value={featureForm.description}
                          onChange={(event) =>
                            setFeatureForm({ ...featureForm, description: event.target.value })
                          }
                          placeholder="Feature subtitle / details (optional)"
                          aria-label="Feature description"
                          className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : editingFeatureId ? 'Update feature' : 'Save feature'}
                        </button>
                      </div>
                    </form>
                  )}

                  {selectedLinkFeatures.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-500">
                      No features added yet. Add features to describe this link.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence initial={false}>
                        {selectedLinkFeatures.map((feature, index) => (
                          <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, x: -12, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 12, height: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(index * 0.035, 0.2) }}
                            className="flex items-center gap-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 transition-colors hover:border-purple-300/20 hover:bg-purple-300/[0.035] sm:gap-4 sm:p-4"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200">
                              <Sparkles className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <h5 className="truncate text-sm font-semibold text-slate-100">
                                {feature.title}
                              </h5>
                              {feature.description && (
                                <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-400">
                                  {feature.description}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1 border-l border-white/10 pl-2">
                              <button
                                type="button"
                                onClick={() => startEditingFeature(feature)}
                                aria-label={`Edit feature ${feature.title}`}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteFeature(feature)}
                                aria-label={`Delete feature ${feature.title}`}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="mt-9 border-t border-white/10 pt-7">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Link destination
                  </p>
                  <div className="flex flex-col gap-3 rounded-2xl border border-sky-300/15 bg-[#07090f]/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                        <ExternalLink className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Saved URL</p>
                        <p className="truncate text-sm text-slate-200" title={selectedLink.url}>
                          {selectedLink.url}
                        </p>
                      </div>
                    </div>
                    <a
                      href={selectedLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:-translate-y-0.5 hover:shadow-sky-500/20"
                    >
                      Open link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </motion.section>
            ) : groupLinks.length === 0 ? (
              <motion.p
                key="empty-links"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500"
              >
                No links in this group yet. Add one to get started.
              </motion.p>
            ) : (
              <motion.div
                key="link-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {groupLinks.map((link, index) => (
                  <motion.article
                    key={link.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: Math.min(index * 0.045, 0.3) }}
                    whileHover={{ x: 4 }}
                    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(100deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-3 shadow-lg shadow-black/10 transition-colors hover:border-purple-300/25 hover:bg-purple-300/[0.04] sm:gap-4 sm:p-4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedLinkId(link.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-300/15 bg-purple-300/[0.08] text-purple-200 transition group-hover:bg-purple-300/15">
                        <Link2 className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-white" title={link.title}>
                          {link.title}
                        </span>
                        {link.description && (
                          <span className="mt-1 block truncate text-sm text-slate-400">
                            {link.description}
                          </span>
                        )}
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-sky-300 sm:inline-flex">
                        Details
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1 border-l border-white/10 pl-2 sm:gap-2 sm:pl-3">
                      <button
                        type="button"
                        onClick={() => startEditingLink(link)}
                        aria-label={`Edit ${link.title}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteLink(link)}
                        aria-label={`Delete ${link.title}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ) : groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-500">
          No link groups yet. Create a group to organize important server links.
        </p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {groups.map((group) => {
            const count = links.filter((link) => link.group_id === group.id).length;
            return (
              <motion.article
                key={group.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-5 shadow-lg shadow-black/10 transition-colors hover:border-purple-400/30"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    resetGroupForm();
                    setMessage('');
                  }}
                  className="w-full text-left"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                      {count} link{count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="truncate text-lg font-semibold text-white">{group.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">
                    {group.subtitle || 'No subtitle added.'}
                  </p>
                </button>
                <div className="mt-4 flex justify-end gap-2 border-t border-white/5 pt-3">
                  <button
                    type="button"
                    onClick={() => startEditingGroup(group)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteGroup(group)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </AdminLayout>
  );
};
