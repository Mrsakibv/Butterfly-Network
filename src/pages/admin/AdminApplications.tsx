import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import {
  Briefcase,
  ClipboardList,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Save,
  Search,
} from 'lucide-react';

type Tab = 'posts' | 'builder' | 'applications';

type ApplicationPost = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type FormField = {
  id: string;
  post_id: string;
  field_key: string;
  field_label: string;
  field_type: string;
  placeholder: string | null;
  description: string | null;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
};

type Application = {
  id: string;
  user_id: string | null;
  post_id: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  admin_note: string | null;
};

type ApplicationAnswer = {
  id: string;
  application_id: string;
  field_id: string;
  answer: any;
};

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL / Link' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
];

const EMPTY_POST = {
  title: '',
  slug: '',
  short_description: '',
  description: '',
  icon: '',
  image_url: '',
  is_active: true,
  sort_order: 0,
};

const EMPTY_FIELD = {
  field_key: '',
  field_label: '',
  field_type: 'text',
  placeholder: '',
  description: '',
  options: [] as string[],
  is_required: true,
  is_active: true,
  sort_order: 0,
};

export const AdminApplications: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const [posts, setPosts] = useState<ApplicationPost[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState<string>('');

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const [editingPost, setEditingPost] = useState<ApplicationPost | null>(null);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const [postForm, setPostForm] = useState(EMPTY_POST);
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD);

  const [savingPost, setSavingPost] = useState(false);
  const [savingField, setSavingField] = useState(false);

  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [deletingField, setDeletingField] = useState<string | null>(null);

  const [expandedApplication, setExpandedApplication] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, ApplicationAnswer[]>>({});
  const [loadingAnswers, setLoadingAnswers] = useState<string | null>(null);

  const [updatingApplication, setUpdatingApplication] = useState<string | null>(null);
  const [applicationNotes, setApplicationNotes] = useState<Record<string, string>>({});

  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<
    'all' | Application['status']
  >('all');

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedPostId) {
      loadFields(selectedPostId);
    } else {
      setFields([]);
    }
  }, [selectedPostId]);

  const loadPosts = async () => {
    setLoadingPosts(true);

    try {
      const { data, error } = await supabase
        .from('application_posts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Application posts loading error:', error);
        showToast(`Failed to load posts: ${error.message}`, 'error');
        return;
      }

      const loadedPosts = (data || []) as ApplicationPost[];

      setPosts(loadedPosts);

      if (!selectedPostId && loadedPosts.length > 0) {
        setSelectedPostId(loadedPosts[0].id);
      }
    } catch (error: any) {
      console.error(error);
      showToast('Failed to load application posts', 'error');
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadFields = async (postId: string) => {
    setLoadingFields(true);

    try {
      const { data, error } = await supabase
        .from('application_form_fields')
        .select('*')
        .eq('post_id', postId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Application fields loading error:', error);
        showToast(`Failed to load fields: ${error.message}`, 'error');
        return;
      }

      const normalized = (data || []).map((field: any) => ({
        ...field,
        options: Array.isArray(field.options) ? field.options : [],
      }));

      setFields(normalized);
    } catch (error) {
      console.error(error);
      showToast('Failed to load form fields', 'error');
    } finally {
      setLoadingFields(false);
    }
  };

  const loadApplications = async () => {
    setLoadingApplications(true);

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Applications loading error:', error);
        showToast(`Failed to load applications: ${error.message}`, 'error');
        return;
      }

      setApplications((data || []) as Application[]);
    } catch (error) {
      console.error(error);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoadingApplications(false);
    }
  };

  const openCreatePost = () => {
    setEditingPost(null);

    setPostForm({
      ...EMPTY_POST,
      sort_order: posts.length,
    });

    setPostModalOpen(true);
  };

  const openEditPost = (post: ApplicationPost) => {
    setEditingPost(post);

    setPostForm({
      title: post.title,
      slug: post.slug,
      short_description: post.short_description || '',
      description: post.description || '',
      icon: post.icon || '',
      image_url: post.image_url || '',
      is_active: post.is_active,
      sort_order: post.sort_order,
    });

    setPostModalOpen(true);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const savePost = async () => {
    if (!postForm.title.trim()) {
      showToast('Post title is required', 'error');
      return;
    }

    if (!postForm.slug.trim()) {
      showToast('Post slug is required', 'error');
      return;
    }

    setSavingPost(true);

    try {
      const payload = {
        title: postForm.title.trim(),
        slug: generateSlug(postForm.slug),
        short_description: postForm.short_description.trim() || null,
        description: postForm.description.trim() || null,
        icon: postForm.icon.trim() || null,
        image_url: postForm.image_url.trim() || null,
        is_active: postForm.is_active,
        sort_order: Number(postForm.sort_order) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editingPost) {
        const { data, error } = await supabase
          .from('application_posts')
          .update(payload)
          .eq('id', editingPost.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setPosts(prev =>
          prev.map(post =>
            post.id === editingPost.id ? (data as ApplicationPost) : post
          )
        );

        showToast('Application post updated successfully', 'success');
      } else {
        const { data, error } = await supabase
          .from('application_posts')
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setPosts(prev =>
          [...prev, data as ApplicationPost].sort(
            (a, b) => a.sort_order - b.sort_order
          )
        );

        if (!selectedPostId) {
          setSelectedPostId(data.id);
        }

        showToast('Application post created successfully', 'success');
      }

      setPostModalOpen(false);
    } catch (error: any) {
      console.error('Post save error:', error);
      showToast(
        error?.message || 'Failed to save application post',
        'error'
      );
    } finally {
      setSavingPost(false);
    }
  };

  const deleteApplicationPost = async (postId: string) => {
    if (
      !confirm(
        'Delete this application post? Its form fields and related applications will also be deleted.'
      )
    ) {
      return;
    }

    setDeletingPost(postId);

    try {
      const { error } = await supabase
        .from('application_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      setPosts(prev => prev.filter(post => post.id !== postId));

      if (selectedPostId === postId) {
        const remaining = posts.filter(post => post.id !== postId);
        setSelectedPostId(remaining[0]?.id || '');
      }

      showToast('Application post deleted successfully', 'success');
    } catch (error: any) {
      console.error('Post delete error:', error);
      showToast(
        error?.message || 'Failed to delete application post',
        'error'
      );
    } finally {
      setDeletingPost(null);
    }
  };

  const togglePost = async (post: ApplicationPost) => {
    try {
      const { error } = await supabase
        .from('application_posts')
        .update({
          is_active: !post.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) {
        throw error;
      }

      setPosts(prev =>
        prev.map(item =>
          item.id === post.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );

      showToast(
        !post.is_active ? 'Post activated' : 'Post deactivated',
        'success'
      );
    } catch (error: any) {
      console.error('Post toggle error:', error);
      showToast(
        error?.message || 'Failed to update post',
        'error'
      );
    }
  };

  const openCreateField = () => {
    if (!selectedPostId) {
      showToast('Select an application post first', 'error');
      return;
    }

    setEditingField(null);

    setFieldForm({
      ...EMPTY_FIELD,
      sort_order: fields.length,
    });

    setFieldModalOpen(true);
  };

  const openEditField = (field: FormField) => {
    setEditingField(field);

    setFieldForm({
      field_key: field.field_key,
      field_label: field.field_label,
      field_type: field.field_type,
      placeholder: field.placeholder || '',
      description: field.description || '',
      options: [...field.options],
      is_required: field.is_required,
      is_active: field.is_active,
      sort_order: field.sort_order,
    });

    setFieldModalOpen(true);
  };

  const saveField = async () => {
    if (!selectedPostId) {
      showToast('Select a post first', 'error');
      return;
    }

    if (!fieldForm.field_key.trim()) {
      showToast('Field key is required', 'error');
      return;
    }

    if (!fieldForm.field_label.trim()) {
      showToast('Field label is required', 'error');
      return;
    }

    if (
      ['select', 'radio', 'checkbox'].includes(fieldForm.field_type) &&
      fieldForm.options.filter(option => option.trim()).length === 0
    ) {
      showToast('Add at least one option for this field type', 'error');
      return;
    }

    setSavingField(true);

    try {
      const payload = {
        post_id: selectedPostId,
        field_key: fieldForm.field_key
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]+/g, '_'),
        field_label: fieldForm.field_label.trim(),
        field_type: fieldForm.field_type,
        placeholder: fieldForm.placeholder.trim() || null,
        description: fieldForm.description.trim() || null,
        options: fieldForm.options
          .map(option => option.trim())
          .filter(Boolean),
        is_required: fieldForm.is_required,
        is_active: fieldForm.is_active,
        sort_order: Number(fieldForm.sort_order) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editingField) {
        const { data, error } = await supabase
          .from('application_form_fields')
          .update(payload)
          .eq('id', editingField.id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setFields(prev =>
          prev
            .map(field => ({
              ...(data as FormField),
              options: Array.isArray((data as any).options)
                ? (data as any).options
                : [],
            }))
            .sort((a, b) => a.sort_order - b.sort_order)
        );

        showToast('Form field updated successfully', 'success');
      } else {
        const { data, error } = await supabase
          .from('application_form_fields')
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const newField = {
          ...(data as FormField),
          options: Array.isArray((data as any).options)
            ? (data as any).options
            : [],
        };

        setFields(prev =>
          [...prev, newField].sort(
            (a, b) => a.sort_order - b.sort_order
          )
        );

        showToast('Form field created successfully', 'success');
      }

      setFieldModalOpen(false);
    } catch (error: any) {
      console.error('Field save error:', error);
      showToast(
        error?.message || 'Failed to save form field',
        'error'
      );
    } finally {
      setSavingField(false);
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!confirm('Delete this form field?')) {
      return;
    }

    setDeletingField(fieldId);

    try {
      const { error } = await supabase
        .from('application_form_fields')
        .delete()
        .eq('id', fieldId);

      if (error) {
        throw error;
      }

      setFields(prev => prev.filter(field => field.id !== fieldId));

      showToast('Form field deleted successfully', 'success');
    } catch (error: any) {
      console.error('Field delete error:', error);
      showToast(
        error?.message || 'Failed to delete form field',
        'error'
      );
    } finally {
      setDeletingField(null);
    }
  };

  const toggleField = async (field: FormField) => {
    try {
      const { error } = await supabase
        .from('application_form_fields')
        .update({
          is_active: !field.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', field.id);

      if (error) {
        throw error;
      }

      setFields(prev =>
        prev.map(item =>
          item.id === field.id
            ? { ...item, is_active: !item.is_active }
            : item
        )
      );

      showToast(
        !field.is_active ? 'Field activated' : 'Field deactivated',
        'success'
      );
    } catch (error: any) {
      console.error('Field toggle error:', error);
      showToast(
        error?.message || 'Failed to update field',
        'error'
      );
    }
  };

  const moveField = async (
    field: FormField,
    direction: 'up' | 'down'
  ) => {
    const index = fields.findIndex(item => item.id === field.id);

    if (index === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= fields.length) {
      return;
    }

    const target = fields[targetIndex];

    try {
      const firstUpdate = await supabase
        .from('application_form_fields')
        .update({
          sort_order: target.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', field.id);

      if (firstUpdate.error) {
        throw firstUpdate.error;
      }

      const secondUpdate = await supabase
        .from('application_form_fields')
        .update({
          sort_order: field.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id);

      if (secondUpdate.error) {
        throw secondUpdate.error;
      }

      await loadFields(selectedPostId);
    } catch (error: any) {
      console.error('Field reorder error:', error);
      showToast(
        error?.message || 'Failed to reorder fields',
        'error'
      );
    }
  };

  const loadApplicationAnswers = async (applicationId: string) => {
    if (answers[applicationId]) {
      setExpandedApplication(
        expandedApplication === applicationId ? null : applicationId
      );
      return;
    }

    setExpandedApplication(applicationId);
    setLoadingAnswers(applicationId);

    try {
      const { data, error } = await supabase
        .from('application_answers')
        .select('*')
        .eq('application_id', applicationId);

      if (error) {
        throw error;
      }

      setAnswers(prev => ({
        ...prev,
        [applicationId]: (data || []) as ApplicationAnswer[],
      }));
    } catch (error: any) {
      console.error('Answers loading error:', error);
      showToast(
        error?.message || 'Failed to load application answers',
        'error'
      );
    } finally {
      setLoadingAnswers(null);
    }
  };

  const updateApplication = async (
    application: Application,
    status: Application['status']
  ) => {
    setUpdatingApplication(application.id);

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          admin_note:
            applicationNotes[application.id] ??
            application.admin_note ??
            null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) {
        throw error;
      }

      setApplications(prev =>
        prev.map(item =>
          item.id === application.id
            ? {
                ...item,
                status,
                admin_note:
                  applicationNotes[application.id] ??
                  application.admin_note ??
                  null,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      showToast(`Application marked as ${status}`, 'success');
    } catch (error: any) {
      console.error('Application update error:', error);
      showToast(
        error?.message || 'Failed to update application',
        'error'
      );
    } finally {
      setUpdatingApplication(null);
    }
  };

  const saveApplicationNote = async (application: Application) => {
    setUpdatingApplication(application.id);

    try {
      const note = applicationNotes[application.id] ?? '';

      const { error } = await supabase
        .from('applications')
        .update({
          admin_note: note.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      if (error) {
        throw error;
      }

      setApplications(prev =>
        prev.map(item =>
          item.id === application.id
            ? {
                ...item,
                admin_note: note.trim() || null,
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );

      showToast('Admin note saved', 'success');
    } catch (error: any) {
      console.error('Note save error:', error);
      showToast(
        error?.message || 'Failed to save admin note',
        'error'
      );
    } finally {
      setUpdatingApplication(null);
    }
  };

  const getPostTitle = (postId: string) => {
    return posts.find(post => post.id === postId)?.title || 'Unknown Post';
  };

  const getField = (fieldId: string) => {
    return fields.find(field => field.id === fieldId);
  };

  const selectedPost = posts.find(post => post.id === selectedPostId);

  const filteredApplications = useMemo(() => {
    return applications.filter(application => {
      const matchesStatus =
        applicationStatusFilter === 'all' ||
        application.status === applicationStatusFilter;

      const postTitle = getPostTitle(application.post_id).toLowerCase();

      const search = applicationSearch.toLowerCase().trim();

      const matchesSearch =
        !search ||
        postTitle.includes(search) ||
        application.id.toLowerCase().includes(search) ||
        (application.user_id || '').toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [
    applications,
    applicationStatusFilter,
    applicationSearch,
    posts,
  ]);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const renderStatusBadge = (status: Application['status']) => {
    const styles: Record<Application['status'], string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      reviewing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <AdminLayout active="applications">
      <div className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Applications Management
            </h1>

            <p className="mt-1 text-slate-400">
              Manage application posts, dynamic forms, and submitted applications.
            </p>
          </div>

          {activeTab === 'posts' && (
            <button
              onClick={openCreatePost}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </button>
          )}

          {activeTab === 'builder' && (
            <button
              onClick={openCreateField}
              disabled={!selectedPostId}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-5 overflow-x-auto border-b border-white/10">
          <button
            onClick={() => setActiveTab('posts')}
            className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'posts'
                ? 'text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Posts

            {activeTab === 'posts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'builder'
                ? 'text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            Form Builder

            {activeTab === 'builder' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`relative flex shrink-0 items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'applications'
                ? 'text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Applications

            {statusCounts.pending > 0 && (
              <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
                {statusCounts.pending}
              </span>
            )}

            {activeTab === 'applications' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
            )}
          </button>
        </div>
      </div>

      {/* =========================================================
          POSTS TAB
      ========================================================= */}

      {activeTab === 'posts' && (
        <>
          {loadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-violet-950/20 p-10 text-center">
              <Briefcase className="mx-auto mb-4 h-10 w-10 text-purple-400" />

              <h2 className="text-lg font-semibold text-white">
                No Application Posts
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Create your first application post. After creating it,
                you can build its dynamic application form.
              </p>

              <button
                onClick={openCreatePost}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500"
              >
                <Plus className="h-4 w-4" />
                Create First Post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-violet-950/20 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
                        <Briefcase className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {post.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              post.is_active
                                ? 'border-green-500/20 bg-green-500/10 text-green-400'
                                : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                            }`}
                          >
                            {post.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-purple-400">
                          /{post.slug}
                        </p>

                        {post.short_description && (
                          <p className="mt-2 max-w-3xl text-sm text-slate-400">
                            {post.short_description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>
                            Sort order: {post.sort_order}
                          </span>

                          <span>
                            Created:{' '}
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setActiveTab('builder');
                        }}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Form
                      </button>

                      <button
                        onClick={() => togglePost(post)}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                      >
                        {post.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-400" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}

                        {post.is_active ? 'Active' : 'Inactive'}
                      </button>

                      <button
                        onClick={() => openEditPost(post)}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        onClick={() => deleteApplicationPost(post.id)}
                        disabled={deletingPost === post.id}
                        className="flex items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deletingPost === post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}

                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          FORM BUILDER TAB
      ========================================================= */}

      {activeTab === 'builder' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-violet-950/20 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  Application Post
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Select the post whose application form you want to manage.
                </p>
              </div>

              <select
                value={selectedPostId}
                onChange={event => setSelectedPostId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 lg:w-[360px]"
              >
                <option value="" className="bg-black">
                  Select a post
                </option>

                {posts.map(post => (
                  <option
                    key={post.id}
                    value={post.id}
                    className="bg-black"
                  >
                    {post.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedPostId ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
              <FileText className="mx-auto mb-4 h-9 w-9 text-slate-500" />

              <p className="text-sm text-slate-400">
                Select an application post to manage its form.
              </p>
            </div>
          ) : loadingFields ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {selectedPost?.title || 'Application Form'}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {fields.length === 0 ? (
                <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-violet-950/20 p-10 text-center">
                  <FileText className="mx-auto mb-4 h-9 w-9 text-purple-400" />

                  <h3 className="font-semibold text-white">
                    No form fields yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Add the first field to start building this application form.
                  </p>

                  <button
                    onClick={openCreateField}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Field
                  </button>
                </div>
              ) : (
                fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-purple-500/20"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-1 text-slate-600">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {field.field_label}
                            </h3>

                            <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-300">
                              {field.field_type}
                            </span>

                            {field.is_required && (
                              <span className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                                Required
                              </span>
                            )}

                            {!field.is_active && (
                              <span className="rounded-md border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            key: {field.field_key} · order: {field.sort_order}
                          </p>

                          {field.description && (
                            <p className="mt-2 text-sm text-slate-400">
                              {field.description}
                            </p>
                          )}

                          {field.options.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {field.options.map((option, optionIndex) => (
                                <span
                                  key={`${field.id}-${optionIndex}`}
                                  className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-400"
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          onClick={() => moveField(field, 'up')}
                          disabled={index === 0}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => moveField(field, 'down')}
                          disabled={index === fields.length - 1}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => toggleField(field)}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white"
                          title="Toggle active"
                        >
                          {field.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-400" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => openEditField(field)}
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteField(field.id)}
                          disabled={deletingField === field.id}
                          className="rounded-lg border border-red-500/10 bg-red-500/5 p-2 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingField === field.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          APPLICATIONS TAB
      ========================================================= */}

      {activeTab === 'applications' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {(
              [
                ['all', 'All'],
                ['pending', 'Pending'],
                ['reviewing', 'Reviewing'],
                ['approved', 'Approved'],
                ['rejected', 'Rejected'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() =>
                  setApplicationStatusFilter(
                    value as 'all' | Application['status']
                  )
                }
                className={`rounded-xl border p-3 text-left transition-colors ${
                  applicationStatusFilter === value
                    ? 'border-purple-500/40 bg-purple-500/10'
                    : 'border-white/10 bg-black/20 hover:border-purple-500/20'
                }`}
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {statusCounts[value]}
                </p>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={applicationSearch}
                onChange={event => setApplicationSearch(event.target.value)}
                placeholder="Search by post or user ID..."
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
              />
            </div>

            <button
              onClick={loadApplications}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Loader2
                className={`h-4 w-4 ${
                  loadingApplications ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>
          </div>

          {loadingApplications ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
              <ClipboardList className="mx-auto mb-4 h-9 w-9 text-slate-600" />

              <p className="text-sm text-slate-400">
                No applications found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map(application => {
                const isExpanded =
                  expandedApplication === application.id;

                const applicationAnswers =
                  answers[application.id] || [];

                return (
                  <div
                    key={application.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                  >
                    <button
                      onClick={() =>
                        loadApplicationAnswers(application.id)
                      }
                      className="w-full p-5 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {getPostTitle(application.post_id)}
                            </h3>

                            {renderStatusBadge(application.status)}
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            User ID: {application.user_id || 'Guest'}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            Submitted:{' '}
                            {new Date(
                              application.submitted_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {loadingAnswers === application.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                          ) : isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-500" />
                          ) : (
                            <Eye className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-white/10 p-5">
                        <div className="space-y-4">
                          <div>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400">
                              Applicant Answers
                            </p>

                            {applicationAnswers.length === 0 ? (
                              <p className="text-sm text-slate-500">
                                No answers found.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {applicationAnswers.map(answer => {
                                  const field = getField(answer.field_id);

                                  return (
                                    <div
                                      key={answer.id}
                                      className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                                    >
                                      <p className="text-xs font-semibold text-slate-400">
                                        {field?.field_label ||
                                          'Unknown field'}
                                      </p>

                                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white">
                                        {Array.isArray(answer.answer)
                                          ? answer.answer.join(', ')
                                          : typeof answer.answer ===
                                              'object' &&
                                            answer.answer !== null
                                          ? JSON.stringify(
                                              answer.answer
                                            )
                                          : String(
                                              answer.answer ??
                                                'No answer'
                                            )}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/10 pt-5">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400">
                              Application Status
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {(
                                [
                                  'pending',
                                  'reviewing',
                                  'approved',
                                  'rejected',
                                ] as Application['status'][]
                              ).map(status => (
                                <button
                                  key={status}
                                  onClick={() =>
                                    updateApplication(
                                      application,
                                      status
                                    )
                                  }
                                  disabled={
                                    updatingApplication ===
                                      application.id ||
                                    application.status === status
                                  }
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                    application.status === status
                                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  {updatingApplication ===
                                  application.id ? (
                                    <Loader2 className="inline-block h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    status
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold text-slate-400">
                              Admin Note
                            </label>

                            <textarea
                              value={
                                applicationNotes[
                                  application.id
                                ] ??
                                application.admin_note ??
                                ''
                              }
                              onChange={event =>
                                setApplicationNotes(prev => ({
                                  ...prev,
                                  [application.id]:
                                    event.target.value,
                                }))
                              }
                              rows={4}
                              placeholder="Write an internal note about this application..."
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                            />

                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() =>
                                  saveApplicationNote(application)
                                }
                                disabled={
                                  updatingApplication ===
                                  application.id
                                }
                                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                              >
                                {updatingApplication ===
                                application.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                Save Note
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          POST MODAL
      ========================================================= */}

      {postModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-500/20 bg-[#09090b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingPost
                    ? 'Edit Application Post'
                    : 'Create Application Post'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure the information shown on the Apply page.
                </p>
              </div>

              <button
                onClick={() => setPostModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Title *
                </label>

                <input
                  value={postForm.title}
                  onChange={event =>
                    setPostForm(prev => ({
                      ...prev,
                      title: event.target.value,
                      slug:
                        editingPost || prev.slug
                          ? prev.slug
                          : generateSlug(event.target.value),
                    }))
                  }
                  placeholder="e.g. Minecraft Moderator"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Slug *
                </label>

                <input
                  value={postForm.slug}
                  onChange={event =>
                    setPostForm(prev => ({
                      ...prev,
                      slug: generateSlug(event.target.value),
                    }))
                  }
                  placeholder="minecraft-moderator"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Short Description
                </label>

                <input
                  value={postForm.short_description}
                  onChange={event =>
                    setPostForm(prev => ({
                      ...prev,
                      short_description: event.target.value,
                    }))
                  }
                  placeholder="Short description shown on the Apply page"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Full Description
                </label>

                <textarea
                  value={postForm.description}
                  onChange={event =>
                    setPostForm(prev => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={6}
                  placeholder="Detailed information and instructions for applicants..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">
                    Icon
                  </label>

                  <input
                    value={postForm.icon}
                    onChange={event =>
                      setPostForm(prev => ({
                        ...prev,
                        icon: event.target.value,
                      }))
                    }
                    placeholder="e.g. shield"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">
                    Image URL
                  </label>

                  <input
                    value={postForm.image_url}
                    onChange={event =>
                      setPostForm(prev => ({
                        ...prev,
                        image_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    value={postForm.sort_order}
                    onChange={event =>
                      setPostForm(prev => ({
                        ...prev,
                        sort_order: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={postForm.is_active}
                    onChange={event =>
                      setPostForm(prev => ({
                        ...prev,
                        is_active: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-purple-500/30 bg-black/30 text-purple-600 focus:ring-purple-500"
                  />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Active
                    </p>

                    <p className="text-xs text-slate-500">
                      Show this post publicly
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button
                onClick={() => setPostModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={savePost}
                disabled={savingPost}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {savingPost ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {editingPost ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          FIELD MODAL
      ========================================================= */}

      {fieldModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-500/20 bg-[#09090b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingField
                    ? 'Edit Form Field'
                    : 'Add Form Field'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure what information applicants must provide.
                </p>
              </div>

              <button
                onClick={() => setFieldModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">
                    Field Key *
                  </label>

                  <input
                    value={fieldForm.field_key}
                    onChange={event =>
                      setFieldForm(prev => ({
                        ...prev,
                        field_key: event.target.value,
                      }))
                    }
                    placeholder="minecraft_username"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                  />

                  <p className="mt-1 text-[10px] text-slate-600">
                    Use a unique key such as minecraft_username.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">
                    Field Label *
                  </label>

                  <input
                    value={fieldForm.field_label}
                    onChange={event =>
                      setFieldForm(prev => ({
                        ...prev,
                        field_label: event.target.value,
                      }))
                    }
                    placeholder="Minecraft Username"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Field Type *
                </label>

                <select
                  value={fieldForm.field_type}
                  onChange={event =>
                    setFieldForm(prev => ({
                      ...prev,
                      field_type: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40"
                >
                  {FIELD_TYPES.map(type => (
                    <option
                      key={type.value}
                      value={type.value}
                      className="bg-black"
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Placeholder
                </label>

                <input
                  value={fieldForm.placeholder}
                  onChange={event =>
                    setFieldForm(prev => ({
                      ...prev,
                      placeholder: event.target.value,
                    }))
                  }
                  placeholder="Enter your Minecraft username..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-400">
                  Description / Help Text
                </label>

                <textarea
                  value={fieldForm.description}
                  onChange={event =>
                    setFieldForm(prev => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Explain what the applicant should enter..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                />
              </div>

              {['select', 'radio', 'checkbox'].includes(
                fieldForm.field_type
              ) && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">
                      Options
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setFieldForm(prev => ({
                          ...prev,
                          options: [...prev.options, ''],
                        }))
                      }
                      className="text-xs font-semibold text-purple-400 hover:text-purple-300"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {fieldForm.options.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-600">
                        No options added.
                      </div>
                    ) : (
                      fieldForm.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <span className="w-5 text-center text-xs text-slate-600">
                            {index + 1}
                          </span>

                          <input
                            value={option}
                            onChange={event =>
                              setFieldForm(prev => ({
                                ...prev,
                                options: prev.options.map(
                                  (item, itemIndex) =>
                                    itemIndex === index
                                      ? event.target.value
                                      : item
                                ),
                              }))
                            }
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/40"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setFieldForm(prev => ({
                                ...prev,
                                options: prev.options.filter(
                                  (_, itemIndex) =>
                                    itemIndex !== index
                                ),
                              }))
                            }
                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    value={fieldForm.sort_order}
                    onChange={event =>
                      setFieldForm(prev => ({
                        ...prev,
                        sort_order: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={fieldForm.is_required}
                      onChange={event =>
                        setFieldForm(prev => ({
                          ...prev,
                          is_required: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-purple-500/30 bg-black/30 text-purple-600 focus:ring-purple-500"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Required
                      </p>

                      <p className="text-xs text-slate-500">
                        Applicant must answer this field
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={fieldForm.is_active}
                      onChange={event =>
                        setFieldForm(prev => ({
                          ...prev,
                          is_active: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-purple-500/30 bg-black/30 text-purple-600 focus:ring-purple-500"
                    />

                    <div>
                      <p className="text-sm font-semibold text-white">
                        Active
                      </p>

                      <p className="text-xs text-slate-500">
                        Show this field to applicants
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-5">
              <button
                onClick={() => setFieldModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={saveField}
                disabled={savingField}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {savingField ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {editingField ? 'Save Changes' : 'Add Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};