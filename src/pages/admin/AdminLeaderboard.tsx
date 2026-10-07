import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  Heart,
  Image as ImageIcon,
  Layers3,
  Loader2,
  MoveDown,
  MoveUp,
  Package,
  Pickaxe,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  Trash2,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';

type LeaderboardStatus = 'active' | 'disabled' | 'archived';

interface SeasonRow {
  id: string;
  season_number: number;
  name: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  cover_image_url: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface StatSourceRow {
  id: string;
  stat_key: string;
  display_name: string;
  description: string;
  source_type: 'player_stat' | 'minecraft_statistic';
  default_display_format:
    | 'number'
    | 'currency'
    | 'hearts'
    | 'hours'
    | 'decimal'
    | 'text';
  supports_delta: boolean;
  supports_current: boolean;
  default_sort_direction: 'asc' | 'desc';
}

interface CategoryRow {
  category_id: string;
  display_name: string;
  subtitle: string;
  stat_key: string;
  description: string;
  icon_name: string;
  icon_url: string;
  image_url: string;
  source_type: 'player_stat' | 'minecraft_statistic';
  ranking_mode: 'current' | 'delta';
  display_format:
    | 'number'
    | 'currency'
    | 'hearts'
    | 'hours'
    | 'decimal'
    | 'text';
  prefix: string;
  suffix: string;
  decimal_places: number;
  sort_direction: 'asc' | 'desc';
  display_limit: number;
  show_podium: boolean;
  show_search: boolean;
  show_avatar: boolean;
  show_badge: boolean;
  show_guild: boolean;
  show_score: boolean;
  show_rank: boolean;
  featured_on_home: boolean;
  is_system: boolean;
  is_archived: boolean;
  accent_key: string;
  admin_notes: string;
  sort_order: number;
  is_active: boolean;
}

interface LeaderboardRow {
  minecraft_uuid: string;
  username: string;
  score: number;
  display_score: string;
  badge: string;
  guild: string;
  avatar_url: string;
}

interface CategoryForm {
  category_id: string;
  display_name: string;
  subtitle: string;
  stat_key: string;
  description: string;
  icon_name: string;
  icon_url: string;
  image_url: string;
  source_type: 'player_stat' | 'minecraft_statistic';
  ranking_mode: 'current' | 'delta';
  display_format:
    | 'number'
    | 'currency'
    | 'hearts'
    | 'hours'
    | 'decimal'
    | 'text';
  prefix: string;
  suffix: string;
  decimal_places: number;
  sort_direction: 'asc' | 'desc';
  display_limit: number;
  show_podium: boolean;
  show_search: boolean;
  show_avatar: boolean;
  show_badge: boolean;
  show_guild: boolean;
  show_score: boolean;
  show_rank: boolean;
  featured_on_home: boolean;
  accent_key: string;
  admin_notes: string;
  sort_order: number;
  is_active: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  heart: Heart,
  flame: Flame,
  swords: Swords,
  skull: Skull,
  shield: Shield,
  target: Target,
  crosshair: Target,
  pickaxe: Pickaxe,
  blocks: Layers3,
  hammer: Zap,
  package: Package,
  plane: Sparkles,
  footprints: Zap,
  clock: Clock3,
  users: Users,
};

const ACCENTS = [
  'purple',
  'red',
  'blue',
  'cyan',
  'sky',
  'emerald',
  'amber',
  'orange',
  'indigo',
  'violet',
  'rose',
  'fuchsia',
  'slate',
];

const DISPLAY_FORMATS = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'hearts', label: 'Hearts' },
  { value: 'hours', label: 'Hours' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'text', label: 'Text / Custom' },
] as const;

const SOURCE_TYPES = [
  {
    value: 'player_stat',
    label: 'Player Minecraft Stat',
    description: 'Uses player_minecraft_stats.',
  },
  {
    value: 'minecraft_statistic',
    label: 'Minecraft Statistic',
    description: 'Uses player_statistics.',
  },
] as const;

const makeEmptyForm = (nextOrder: number): CategoryForm => ({
  category_id: '',
  display_name: '',
  subtitle: '',
  stat_key: '',
  description: '',
  icon_name: 'trophy',
  icon_url: '',
  image_url: '',
  source_type: 'player_stat',
  ranking_mode: 'delta',
  display_format: 'number',
  prefix: '',
  suffix: '',
  decimal_places: 0,
  sort_direction: 'desc',
  display_limit: 30,
  show_podium: true,
  show_search: true,
  show_avatar: true,
  show_badge: true,
  show_guild: true,
  show_score: true,
  show_rank: true,
  featured_on_home: false,
  accent_key: 'purple',
  admin_notes: '',
  sort_order: nextOrder,
  is_active: false,
});

const normalizeCategory = (value: Partial<CategoryRow>): CategoryRow => ({
  category_id: value.category_id ?? '',
  display_name: value.display_name ?? '',
  subtitle: value.subtitle ?? '',
  stat_key: value.stat_key ?? '',
  description: value.description ?? '',
  icon_name: value.icon_name ?? 'trophy',
  icon_url: value.icon_url ?? '',
  image_url: value.image_url ?? '',
  source_type:
    value.source_type === 'minecraft_statistic'
      ? 'minecraft_statistic'
      : 'player_stat',
  ranking_mode: value.ranking_mode === 'current' ? 'current' : 'delta',
  display_format: [
    'number',
    'currency',
    'hearts',
    'hours',
    'decimal',
    'text',
  ].includes(value.display_format ?? '')
    ? (value.display_format as CategoryRow['display_format'])
    : 'number',
  prefix: value.prefix ?? '',
  suffix: value.suffix ?? '',
  decimal_places: Number(value.decimal_places ?? 0),
  sort_direction: value.sort_direction === 'asc' ? 'asc' : 'desc',
  display_limit: Number(value.display_limit ?? 30),
  show_podium: value.show_podium ?? true,
  show_search: value.show_search ?? true,
  show_avatar: value.show_avatar ?? true,
  show_badge: value.show_badge ?? true,
  show_guild: value.show_guild ?? true,
  show_score: value.show_score ?? true,
  show_rank: value.show_rank ?? true,
  featured_on_home: value.featured_on_home ?? false,
  is_system: value.is_system ?? false,
  is_archived: value.is_archived ?? false,
  accent_key: value.accent_key ?? 'purple',
  admin_notes: value.admin_notes ?? '',
  sort_order: Number(value.sort_order ?? 1),
  is_active: value.is_active ?? false,
});

export const AdminLeaderboard: React.FC = () => {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [statSources, setStatSources] = useState<StatSourceRow[]>([]);
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);

  const [seasonId, setSeasonId] = useState('');
  const [categoryId, setCategoryId] = useState('hearts');

  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | LeaderboardStatus
  >('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryRow | null>(null);

  const [form, setForm] = useState<CategoryForm>(makeEmptyForm(1));

  const clearFeedback = () => {
    setMessage('');
    setError('');
  };

  const activeSeason = useMemo(
    () => seasons.find((season) => season.id === seasonId) ?? null,
    [seasons, seasonId]
  );

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.category_id === categoryId) ??
      null,
    [categories, categoryId]
  );

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) => {
      const status: LeaderboardStatus = category.is_archived
        ? 'archived'
        : category.is_active
          ? 'active'
          : 'disabled';

      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return (
        category.category_id.toLowerCase().includes(query) ||
        category.display_name.toLowerCase().includes(query) ||
        category.stat_key.toLowerCase().includes(query) ||
        category.subtitle.toLowerCase().includes(query)
      );
    });
  }, [categories, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter(
        (category) => category.is_active && !category.is_archived
      ).length,
      disabled: categories.filter(
        (category) => !category.is_active && !category.is_archived
      ).length,
      archived: categories.filter((category) => category.is_archived).length,
      system: categories.filter((category) => category.is_system).length,
      custom: categories.filter((category) => !category.is_system).length,
    }),
    [categories]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    clearFeedback();

    const [seasonResult, categoryResult, sourceResult] = await Promise.all([
      supabase
        .from('seasons')
        .select(
          'id, season_number, name, status, cover_image_url, starts_at, ends_at'
        )
        .order('season_number', { ascending: false }),

      supabase
        .from('leaderboard_categories')
        .select(
          `
          category_id,
          display_name,
          subtitle,
          stat_key,
          description,
          icon_name,
          icon_url,
          image_url,
          source_type,
          ranking_mode,
          display_format,
          prefix,
          suffix,
          decimal_places,
          sort_direction,
          display_limit,
          show_podium,
          show_search,
          show_avatar,
          show_badge,
          show_guild,
          show_score,
          show_rank,
          featured_on_home,
          is_system,
          is_archived,
          accent_key,
          admin_notes,
          sort_order,
          is_active
          `
        )
        .order('sort_order', { ascending: true }),

      supabase
        .from('leaderboard_stat_sources')
        .select(
          'id, stat_key, display_name, description, source_type, default_display_format, supports_delta, supports_current, default_sort_direction'
        )
        .order('display_name', { ascending: true }),
    ]);

    if (seasonResult.error) {
      setError(seasonResult.error.message);
    } else {
      const nextSeasons = (seasonResult.data ?? []) as SeasonRow[];

      setSeasons(nextSeasons);

      if (!seasonId) {
        const preferred =
          nextSeasons.find((season) => season.status === 'active') ??
          nextSeasons[0];

        if (preferred) {
          setSeasonId(preferred.id);
        }
      }
    }

    if (categoryResult.error) {
      setError(
        (current) => current || categoryResult.error?.message || 'Failed to load categories.'
      );
    } else {
      const nextCategories = (categoryResult.data ?? []).map((item) =>
        normalizeCategory(item as Partial<CategoryRow>)
      );

      setCategories(nextCategories);

      if (
        nextCategories.length > 0 &&
        !nextCategories.some((category) => category.category_id === categoryId)
      ) {
        const firstVisible =
          nextCategories.find(
            (category) => category.is_active && !category.is_archived
          ) ?? nextCategories[0];

        setCategoryId(firstVisible.category_id);
      }
    }

    if (sourceResult.error) {
      setError(
        (current) =>
          current ||
          sourceResult.error?.message ||
          'Failed to load statistic sources.'
      );
    } else {
      setStatSources((sourceResult.data ?? []) as StatSourceRow[]);
    }

    setLoading(false);
  }, [categoryId, seasonId]);

  const loadEntries = useCallback(async () => {
    if (!seasonId || !categoryId) {
      setEntries([]);
      return;
    }

    setLoadingEntries(true);

    const direction =
      selectedCategory?.sort_direction === 'asc' ? 'asc' : 'desc';

    const limit = Math.min(
      Math.max(selectedCategory?.display_limit ?? 30, 1),
      30
    );

    const { data, error: entriesError } = await supabase
      .from('season_leaderboard_entries')
      .select(
        'minecraft_uuid, username, score, display_score, badge, guild, avatar_url'
      )
      .eq('season_id', seasonId)
      .eq('category', categoryId)
      .order('score', { ascending: direction === 'asc' })
      .limit(limit);

    if (entriesError) {
      setError(entriesError.message);
      setEntries([]);
    } else {
      setEntries((data ?? []) as LeaderboardRow[]);
    }

    setLoadingEntries(false);
  }, [categoryId, seasonId, selectedCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const refresh = async () => {
    clearFeedback();
    await loadData();
    await loadEntries();
    setMessage('Leaderboard manager data refreshed.');
  };

  const openCreate = () => {
    clearFeedback();

    const highestOrder =
      categories.reduce(
        (highest, category) => Math.max(highest, category.sort_order),
        0
      ) + 1;

    setEditingCategory(null);
    setForm(makeEmptyForm(highestOrder));
    setEditorOpen(true);
  };

  const openEdit = (category: CategoryRow) => {
    clearFeedback();

    setEditingCategory(category);

    setForm({
      category_id: category.category_id,
      display_name: category.display_name,
      subtitle: category.subtitle,
      stat_key: category.stat_key,
      description: category.description,
      icon_name: category.icon_name,
      icon_url: category.icon_url,
      image_url: category.image_url,
      source_type: category.source_type,
      ranking_mode: category.ranking_mode,
      display_format: category.display_format,
      prefix: category.prefix,
      suffix: category.suffix,
      decimal_places: category.decimal_places,
      sort_direction: category.sort_direction,
      display_limit: category.display_limit,
      show_podium: category.show_podium,
      show_search: category.show_search,
      show_avatar: category.show_avatar,
      show_badge: category.show_badge,
      show_guild: category.show_guild,
      show_score: category.show_score,
      show_rank: category.show_rank,
      featured_on_home: category.featured_on_home,
      accent_key: category.accent_key,
      admin_notes: category.admin_notes,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });

    setEditorOpen(true);
  };

  const generateIdFromName = () => {
    const value = form.display_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

    setForm((current) => ({
      ...current,
      category_id: value,
    }));
  };

  const onSourceChange = (statKey: string) => {
    const source = statSources.find((item) => item.stat_key === statKey);

    setForm((current) => ({
      ...current,
      stat_key: statKey,
      source_type: source?.source_type ?? current.source_type,
      display_format:
        source?.default_display_format ?? current.display_format,
      sort_direction:
        source?.default_sort_direction ?? current.sort_direction,
      ranking_mode:
        source?.supports_delta && !source?.supports_current
          ? 'delta'
          : current.ranking_mode,
    }));
  };

  const saveCategory = async () => {
    clearFeedback();

    const categoryIdValue = form.category_id.trim().toLowerCase();
    const displayNameValue = form.display_name.trim();
    const statKeyValue = form.stat_key.trim();

    if (!categoryIdValue) {
      setError('Category ID is required.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(categoryIdValue)) {
      setError(
        'Category ID can contain only lowercase letters, numbers and underscores.'
      );
      return;
    }

    if (!displayNameValue) {
      setError('Display name is required.');
      return;
    }

    if (!statKeyValue) {
      setError('Stat source is required.');
      return;
    }

    if (form.display_limit < 1 || form.display_limit > 30) {
      setError('Display limit must be between 1 and 30.');
      return;
    }

    if (form.decimal_places < 0 || form.decimal_places > 4) {
      setError('Decimal places must be between 0 and 4.');
      return;
    }

    if (!editingCategory) {
      const exists = categories.some(
        (category) => category.category_id === categoryIdValue
      );

      if (exists) {
        setError('That category ID already exists.');
        return;
      }
    }

    setSaving(true);

    const payload = {
      category_id: categoryIdValue,
      display_name: displayNameValue,
      subtitle: form.subtitle.trim(),
      stat_key: statKeyValue,
      description: form.description.trim(),
      icon_name: form.icon_name.trim() || 'trophy',
      icon_url: form.icon_url.trim(),
      image_url: form.image_url.trim(),
      source_type: form.source_type,
      ranking_mode: form.ranking_mode,
      display_format: form.display_format,
      prefix: form.prefix,
      suffix: form.suffix,
      decimal_places: Math.min(Math.max(form.decimal_places, 0), 4),
      sort_direction: form.sort_direction,
      display_limit: Math.min(Math.max(form.display_limit, 1), 30),
      show_podium: form.show_podium,
      show_search: form.show_search,
      show_avatar: form.show_avatar,
      show_badge: form.show_badge,
      show_guild: form.show_guild,
      show_score: form.show_score,
      show_rank: form.show_rank,
      featured_on_home: form.featured_on_home,
      accent_key: form.accent_key,
      admin_notes: form.admin_notes.trim(),
      sort_order: Math.max(form.sort_order, 1),
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (editingCategory) {
      result = await supabase
        .from('leaderboard_categories')
        .update(payload)
        .eq('category_id', editingCategory.category_id);
    } else {
      result = await supabase.from('leaderboard_categories').insert({
        ...payload,
        is_system: false,
        is_archived: false,
      });
    }

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setEditorOpen(false);

    await loadData();

    setCategoryId(categoryIdValue);

    setMessage(
      editingCategory
        ? 'Leaderboard category updated successfully.'
        : 'Leaderboard category created successfully.'
    );
  };

  const toggleCategory = async (category: CategoryRow) => {
    clearFeedback();
    setSaving(true);

    const result = await supabase
      .from('leaderboard_categories')
      .update({
        is_active: !category.is_active,
        featured_on_home: !category.is_active
          ? category.featured_on_home
          : false,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', category.category_id);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    await loadData();

    setMessage(
      category.is_active
        ? `${category.display_name} has been disabled.`
        : `${category.display_name} has been enabled.`
    );
  };

  const restoreCategory = async (category: CategoryRow) => {
    clearFeedback();
    setSaving(true);

    const { error: rpcError } = await supabase.rpc(
      'restore_leaderboard',
      {
        p_category_id: category.category_id,
      }
    );

    setSaving(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    await loadData();

    setMessage(`${category.display_name} has been restored.`);
  };

  const deleteOrArchiveCategory = async (category: CategoryRow) => {
    clearFeedback();

    const confirmed = window.confirm(
      category.is_system
        ? `"${category.display_name}" is a system leaderboard.\n\nIt cannot be permanently deleted. Continue to disable it?`
        : `"${category.display_name}" will be deleted if it has no history, otherwise it will be archived.\n\nContinue?`
    );

    if (!confirmed) return;

    setSaving(true);

    const { data, error: rpcError } = await supabase.rpc(
      'delete_or_archive_leaderboard',
      {
        p_category_id: category.category_id,
      }
    );

    setSaving(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    await loadData();

    setMessage(
      data === 'disabled'
        ? `${category.display_name} was disabled because it is a system leaderboard.`
        : data === 'archived'
          ? `${category.display_name} was archived to protect historical data.`
          : `${category.display_name} was permanently deleted.`
    );
  };

  const moveCategory = async (
    category: CategoryRow,
    direction: 'up' | 'down'
  ) => {
    clearFeedback();

    const ordered = [...categories].sort(
      (a, b) => a.sort_order - b.sort_order
    );

    const currentIndex = ordered.findIndex(
      (item) => item.category_id === category.category_id
    );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }

    const target = ordered[targetIndex];

    setSaving(true);

    const temporaryOrder = -Math.max(category.sort_order, 1);

    const first = await supabase
      .from('leaderboard_categories')
      .update({
        sort_order: temporaryOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', category.category_id);

    if (first.error) {
      setSaving(false);
      setError(first.error.message);
      return;
    }

    const second = await supabase
      .from('leaderboard_categories')
      .update({
        sort_order: category.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', target.category_id);

    if (second.error) {
      setSaving(false);
      setError(second.error.message);
      await loadData();
      return;
    }

    const third = await supabase
      .from('leaderboard_categories')
      .update({
        sort_order: target.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', category.category_id);

    setSaving(false);

    if (third.error) {
      setError(third.error.message);
      await loadData();
      return;
    }

    await loadData();

    setMessage(
      `${category.display_name} moved ${
        direction === 'up' ? 'up' : 'down'
      }.`
    );
  };

  const setSelectedCategory = (category: CategoryRow) => {
    setCategoryId(category.category_id);
  };

  const formatDate = (value: string | null) => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown';
    }

    return date.toLocaleString();
  };

  const statusFor = (category: CategoryRow): LeaderboardStatus => {
    if (category.is_archived) return 'archived';
    if (category.is_active) return 'active';
    return 'disabled';
  };

  const statusClasses = (status: LeaderboardStatus) => {
    if (status === 'active') {
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    }

    if (status === 'archived') {
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    }

    return 'border-slate-500/20 bg-slate-500/10 text-slate-400';
  };

  const iconForCategory = (category: CategoryRow) => {
    if (category.icon_url) {
      return (
        <img
          src={category.icon_url}
          alt=""
          className="h-6 w-6 rounded-lg object-contain"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    const Icon = ICON_MAP[category.icon_name] ?? Trophy;

    return <Icon className="h-5 w-5" />;
  };

  const previewIcon = useMemo(() => {
    if (form.icon_url.trim()) {
      return (
        <img
          src={form.icon_url}
          alt=""
          className="h-10 w-10 rounded-xl object-contain"
        />
      );
    }

    const Icon = ICON_MAP[form.icon_name] ?? Trophy;

    return <Icon className="h-6 w-6 text-white" />;
  }, [form.icon_name, form.icon_url]);

  return (
    <AdminLayout active="leaderboard" permission="leaderboard">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              <Trophy className="h-3.5 w-3.5" />
              Leaderboard Manager
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Leaderboard Control Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Create, customize, reorder and control every leaderboard without
              changing source code.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading || saving ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Leaderboard
            </button>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-500/20 bg-red-500/10 text-red-200'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {error ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}

            <span className="min-w-0 flex-1">{error || message}</span>

            <button
              type="button"
              onClick={clearFeedback}
              className="rounded-lg p-1 transition hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: 'Total',
              value: stats.total,
              icon: Database,
              text: 'text-white',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: Check,
              text: 'text-emerald-300',
            },
            {
              label: 'Disabled',
              value: stats.disabled,
              icon: EyeOff,
              text: 'text-slate-300',
            },
            {
              label: 'Archived',
              value: stats.archived,
              icon: RotateCcw,
              text: 'text-amber-300',
            },
            {
              label: 'System',
              value: stats.system,
              icon: Shield,
              text: 'text-purple-300',
            },
            {
              label: 'Custom',
              value: stats.custom,
              icon: Sparkles,
              text: 'text-sky-300',
            },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {card.label}
                  </span>

                  <Icon className={`h-5 w-5 ${card.text}`} />
                </div>

                <p className={`mt-3 text-3xl font-extrabold ${card.text}`}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="border-b border-white/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search leaderboard..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500/60"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as 'all' | LeaderboardStatus
                    )
                  }
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/60"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="max-h-[760px] overflow-y-auto">
              {loading ? (
                <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading categories...
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-8 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-slate-700" />

                  <p className="mt-3 font-semibold text-slate-300">
                    No leaderboard found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Try another search or create a new leaderboard.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {filteredCategories.map((category, index) => {
                    const status = statusFor(category);
                    const isSelected =
                      category.category_id === categoryId;

                    return (
                      <div
                        key={category.category_id}
                        className={`group p-4 transition ${
                          isSelected
                            ? 'bg-purple-500/[0.08]'
                            : 'hover:bg-white/[0.025]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                                isSelected
                                  ? 'border-purple-500/30 bg-purple-500/15 text-purple-300'
                                  : 'border-white/10 bg-white/[0.03] text-slate-300'
                              }`}
                            >
                              {iconForCategory(category)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-sm font-bold text-white">
                                  {category.display_name}
                                </h3>

                                {category.is_system && (
                                  <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-300">
                                    System
                                  </span>
                                )}

                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusClasses(
                                    status
                                  )}`}
                                >
                                  {status}
                                </span>
                              </div>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {category.stat_key}
                              </p>

                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                                {category.subtitle ||
                                  category.description ||
                                  'No subtitle configured.'}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                #{category.sort_order}
                              </span>
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void moveCategory(category, 'up')}
                              disabled={
                                saving || index === 0
                              }
                              className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              title="Move up"
                            >
                              <MoveUp className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void moveCategory(category, 'down')
                              }
                              disabled={
                                saving ||
                                index === filteredCategories.length - 1
                              }
                              className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              title="Move down"
                            >
                              <MoveDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {!category.is_archived && (
                              <button
                                type="button"
                                onClick={() => openEdit(category)}
                                disabled={saving}
                                className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {category.is_archived ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void restoreCategory(category)
                                }
                                disabled={saving}
                                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40"
                                title="Restore"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  void toggleCategory(category)
                                }
                                disabled={saving}
                                className={`rounded-lg border p-2 transition disabled:opacity-40 ${
                                  category.is_active
                                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                }`}
                                title={
                                  category.is_active
                                    ? 'Disable'
                                    : 'Enable'
                                }
                              >
                                {category.is_active ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                void deleteOrArchiveCategory(category)
                              }
                              disabled={saving}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 disabled:opacity-40"
                              title={
                                category.is_system
                                  ? 'Disable system leaderboard'
                                  : 'Delete / Archive'
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Season Preview
                  </span>

                  <select
                    value={seasonId}
                    onChange={(event) => setSeasonId(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                  >
                    {seasons.length === 0 ? (
                      <option value="">No seasons</option>
                    ) : (
                      seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name} · {season.status}
                        </option>
                      ))
                    )}
                  </select>

                  {activeSeason && (
                    <span className="mt-2 block text-xs text-slate-500">
                      {formatDate(activeSeason.starts_at)} →{' '}
                      {formatDate(activeSeason.ends_at)}
                    </span>
                  )}
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Category Preview
                  </span>

                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories</option>
                    ) : (
                      categories.map((category) => (
                        <option
                          key={category.category_id}
                          value={category.category_id}
                        >
                          {category.display_name}
                          {category.is_archived
                            ? ' · archived'
                            : !category.is_active
                              ? ' · disabled'
                              : ''}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              </div>
            </div>

            {selectedCategory && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {selectedCategory.image_url && (
                  <div className="h-40 overflow-hidden border-b border-white/10 bg-black">
                    <img
                      src={selectedCategory.image_url}
                      alt=""
                      className="h-full w-full object-cover opacity-80"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-purple-300">
                        {selectedCategory.icon_url ? (
                          <img
                            src={selectedCategory.icon_url}
                            alt=""
                            className="h-9 w-9 rounded-xl object-contain"
                          />
                        ) : (
                          (() => {
                            const Icon =
                              ICON_MAP[selectedCategory.icon_name] ?? Trophy;

                            return <Icon className="h-7 w-7" />;
                          })()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-extrabold text-white">
                            {selectedCategory.display_name}
                          </h2>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusClasses(
                              statusFor(selectedCategory)
                            )}`}
                          >
                            {statusFor(selectedCategory)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {selectedCategory.stat_key} ·{' '}
                          {selectedCategory.ranking_mode} ·{' '}
                          {selectedCategory.sort_direction}
                        </p>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                          {selectedCategory.subtitle ||
                            selectedCategory.description ||
                            'No description configured.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(selectedCategory)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void toggleCategory(selectedCategory)
                        }
                        disabled={saving || selectedCategory.is_archived}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-40"
                      >
                        {selectedCategory.is_active ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Enable
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['Top', selectedCategory.display_limit],
                      ['Format', selectedCategory.display_format],
                      ['Mode', selectedCategory.ranking_mode],
                      ['Order', selectedCategory.sort_order],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {label}
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold text-white">
                    Leaderboard Preview
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {activeSeason?.name ?? 'No season'} ·{' '}
                    {selectedCategory?.display_name ?? categoryId}
                  </p>
                </div>

                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Server Data
                </span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {loadingEntries ? (
                  <div className="flex min-h-[250px] items-center justify-center text-sm text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading entries...
                  </div>
                ) : entries.length === 0 ? (
                  <div className="p-10 text-center">
                    <Trophy className="mx-auto h-10 w-10 text-slate-700" />

                    <p className="mt-3 font-semibold text-slate-300">
                      No synced entries
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      This category may not have Minecraft bridge data yet.
                    </p>
                  </div>
                ) : (
                  entries.map((entry, index) => (
                    <div
                      key={`${entry.minecraft_uuid}-${entry.username}`}
                      className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-4"
                    >
                      <div className="text-center">
                        <span className="text-sm font-extrabold text-slate-500">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={
                            entry.avatar_url ||
                            `https://mc-heads.net/avatar/${encodeURIComponent(
                              entry.username
                            )}/48`
                          }
                          alt={entry.username}
                          className="h-10 w-10 rounded-xl border border-white/10 bg-black/40 object-cover"
                        />

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {entry.username}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {entry.guild ? `[${entry.guild}] ` : ''}
                            {entry.badge || 'Player'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-sm font-bold text-purple-300">
                        {entry.display_score || entry.score}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {editorOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
            <div className="mx-auto my-6 max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b12] shadow-2xl shadow-black/50">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b0b12]/95 px-5 py-4 backdrop-blur">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-400">
                    {editingCategory
                      ? 'Edit Leaderboard'
                      : 'Create Leaderboard'}
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-white">
                    {editingCategory
                      ? editingCategory.display_name
                      : 'New Custom Leaderboard'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white">
                        Basic Information
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Identity and public-facing content.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Category ID
                        </span>

                        <div className="flex gap-2">
                          <input
                            value={form.category_id}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                category_id: event.target.value
                                  .toLowerCase()
                                  .replace(/\s+/g, '_'),
                              }))
                            }
                            disabled={Boolean(editingCategory)}
                            placeholder="example: mobs_killed"
                            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                          />

                          {!editingCategory && (
                            <button
                              type="button"
                              onClick={generateIdFromName}
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Display Name
                        </span>

                        <input
                          value={form.display_name}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              display_name: event.target.value,
                            }))
                          }
                          placeholder="Mobs Killed"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Subtitle
                        </span>

                        <input
                          value={form.subtitle}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              subtitle: event.target.value,
                            }))
                          }
                          placeholder="Players with the highest seasonal mob kills."
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Description
                        </span>

                        <textarea
                          value={form.description}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Explain what this leaderboard measures."
                          className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white">
                        Visual Identity
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Use either a Lucide icon name, an icon image URL, or a
                        banner image URL.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Icon Name
                        </span>

                        <input
                          value={form.icon_name}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              icon_name: event.target.value,
                            }))
                          }
                          placeholder="trophy"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Icon Image URL
                        </span>

                        <input
                          type="url"
                          value={form.icon_url}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              icon_url: event.target.value,
                            }))
                          }
                          placeholder="https://example.com/icon.png"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Banner / Image URL
                        </span>

                        <input
                          type="url"
                          value={form.image_url}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              image_url: event.target.value,
                            }))
                          }
                          placeholder="https://example.com/banner.jpg"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Accent
                        </span>

                        <select
                          value={form.accent_key}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              accent_key: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        >
                          {ACCENTS.map((accent) => (
                            <option key={accent} value={accent}>
                              {accent}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Icon Preview
                        </p>

                        <div className="mt-3 flex h-16 items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-purple-500/10">
                            {previewIcon}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {form.display_name || 'Leaderboard'}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {form.icon_url || form.icon_name || 'trophy'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white">
                        Data Source
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Choose where the ranking score comes from.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Source Type
                        </span>

                        <select
                          value={form.source_type}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              source_type:
                                event.target.value as CategoryForm['source_type'],
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        >
                          {SOURCE_TYPES.map((source) => (
                            <option key={source.value} value={source.value}>
                              {source.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Stat Source
                        </span>

                        <select
                          value={form.stat_key}
                          onChange={(event) =>
                            onSourceChange(event.target.value)
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        >
                          <option value="">Select stat...</option>

                          {statSources
                            .filter(
                              (source) =>
                                source.source_type === form.source_type
                            )
                            .map((source) => (
                              <option
                                key={source.stat_key}
                                value={source.stat_key}
                              >
                                {source.display_name} · {source.stat_key}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Ranking Mode
                        </span>

                        <select
                          value={form.ranking_mode}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              ranking_mode:
                                event.target.value as CategoryForm['ranking_mode'],
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        >
                          <option
                            value="current"
                            disabled={
                              statSources.find(
                                (source) =>
                                  source.stat_key === form.stat_key
                              )?.supports_current === false
                            }
                          >
                            Current Value
                          </option>

                          <option
                            value="delta"
                            disabled={
                              statSources.find(
                                (source) =>
                                  source.stat_key === form.stat_key
                              )?.supports_delta === false
                            }
                          >
                            Season Delta
                          </option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Sort Direction
                        </span>

                        <select
                          value={form.sort_direction}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              sort_direction:
                                event.target.value as CategoryForm['sort_direction'],
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        >
                          <option value="desc">
                            Descending · Highest First
                          </option>
                          <option value="asc">
                            Ascending · Lowest First
                          </option>
                        </select>
                      </label>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white">
                        Display & Formatting
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Control exactly how scores appear.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Display Format
                        </span>

                        <select
                          value={form.display_format}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              display_format:
                                event.target.value as CategoryForm['display_format'],
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        >
                          {DISPLAY_FORMATS.map((format) => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Prefix
                        </span>

                        <input
                          value={form.prefix}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              prefix: event.target.value,
                            }))
                          }
                          placeholder="$"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Suffix
                        </span>

                        <input
                          value={form.suffix}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              suffix: event.target.value,
                            }))
                          }
                          placeholder=" pts"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Decimal Places
                        </span>

                        <input
                          type="number"
                          min={0}
                          max={4}
                          value={form.decimal_places}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              decimal_places: Number(event.target.value),
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Top Limit
                        </span>

                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={form.display_limit}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              display_limit: Number(event.target.value),
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Sort Order
                        </span>

                        <input
                          type="number"
                          min={1}
                          value={form.sort_order}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              sort_order: Number(event.target.value),
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500"
                        />
                      </label>

                      <label className="block sm:col-span-2">
                        <span className="mb-2 block text-xs font-semibold text-slate-400">
                          Admin Notes
                        </span>

                        <input
                          value={form.admin_notes}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              admin_notes: event.target.value,
                            }))
                          }
                          placeholder="Internal admin notes..."
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-purple-500"
                        />
                      </label>
                    </div>
                  </section>

                  <section>
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-white">
                        Visibility & UI Controls
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Fine-tune what the frontend should show.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ['show_podium', 'Show Podium'],
                        ['show_search', 'Show Search'],
                        ['show_avatar', 'Show Avatar'],
                        ['show_badge', 'Show Badge'],
                        ['show_guild', 'Show Guild'],
                        ['show_score', 'Show Score'],
                        ['show_rank', 'Show Rank'],
                        ['featured_on_home', 'Featured on Home'],
                        ['is_active', 'Leaderboard Enabled'],
                      ].map(([key, label]) => {
                        const checked =
                          form[key as keyof CategoryForm] as boolean;

                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                [key]: !checked,
                              }))
                            }
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                              checked
                                ? 'border-purple-500/30 bg-purple-500/10'
                                : 'border-white/10 bg-white/[0.025]'
                            }`}
                          >
                            <span className="text-xs font-semibold text-slate-300">
                              {label}
                            </span>

                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                checked
                                  ? 'border-purple-400 bg-purple-500 text-white'
                                  : 'border-white/15 bg-black/20 text-transparent'
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Live Configuration
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          ID
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-white">
                          {form.category_id || 'not-set'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Source
                        </p>

                        <p className="mt-1 break-all font-mono text-xs text-white">
                          {form.stat_key || 'not-set'}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {form.source_type}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Ranking
                        </p>

                        <p className="mt-1 text-xs font-bold text-white">
                          {form.ranking_mode} · {form.sort_direction}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">
                          Display
                        </p>

                        <p className="mt-1 text-xs font-bold text-white">
                          {form.prefix}
                          123
                          {form.suffix}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {form.display_format} · top {form.display_limit}
                        </p>
                      </div>
                    </div>
                  </div>

                  {form.image_url && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <div className="border-b border-white/10 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          Banner Preview
                        </p>
                      </div>

                      <img
                        src={form.image_url}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
                    <div className="flex items-start gap-3">
                      <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />

                      <div>
                        <p className="text-xs font-bold text-purple-200">
                          Image URL Support
                        </p>

                        <p className="mt-1 text-xs leading-5 text-purple-200/60">
                          Add a direct HTTPS image URL for the leaderboard icon
                          or banner. The frontend can use the custom image
                          instead of the fallback Lucide icon.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                      <div>
                        <p className="text-xs font-bold text-amber-200">
                          System Protection
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-100/50">
                          System leaderboards cannot be permanently deleted.
                          Delete actions safely disable them instead.
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-white/10 bg-[#0b0b12]/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void saveCategory()}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {editingCategory ? 'Save Changes' : 'Create Leaderboard'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};