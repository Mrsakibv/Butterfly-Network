import React, { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { logAdminActivity } from '../../lib/adminActivity';
import {
  Award,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface ActivityType {
  activity_key: string;
  display_name: string;
  description: string;
  group_key: string;
  icon_name: string;
  icon_url: string;
  source_stat_key: string;
  is_enabled: boolean;
  show_on_profile: boolean;
  is_system: boolean;
  sort_order: number;
}

interface CustomAchievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string;
  rarity: string;
  reward_text: string;
  is_enabled: boolean;
  sort_order: number;
}

interface PlayerRow {
  minecraft_uuid: string;
  minecraft_username: string;
}

interface SeasonRow {
  id: string;
  season_number: number;
  name: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
}

interface AwardRow {
  id: string;
  achievement_id: string;
  season_id: string;
  minecraft_uuid: string;
  minecraft_username: string;
  awarded_at: string;
}

const SOURCE_OPTIONS = [
  ['', 'No automatic stat source'],
  ['kills', 'Player Kills'],
  ['deaths', 'Deaths'],
  ['hearts', 'Hearts'],
  ['money', 'Money'],
  ['playtime_seconds', 'Playtime'],
  ['blocks_broken', 'Blocks Broken'],
  ['blocks_placed', 'Blocks Placed'],
  ['items_crafted', 'Items Crafted'],
  ['items_used', 'Items Used'],
  ['mobs_killed', 'Mobs Killed'],
  ['players_killed', 'Players Killed'],
  ['distance_walked', 'Distance Walked'],
  ['distance_run', 'Distance Run'],
  ['distance_flown', 'Distance Flown'],
  ['damage_dealt', 'Damage Dealt'],
  ['damage_taken', 'Damage Taken'],
  ['jumps', 'Jumps'],
] as const;

const GROUP_OPTIONS = [
  ['combat', 'Combat'],
  ['progress', 'Progress'],
  ['minecraft', 'Minecraft'],
  ['movement', 'Movement'],
  ['achievements', 'Achievements'],
  ['teams', 'Teams'],
  ['awards', 'Awards'],
  ['custom', 'Custom'],
] as const;

const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
];

const emptyActivityForm = {
  activity_key: '',
  display_name: '',
  description: '',
  group_key: 'custom',
  icon_name: 'sparkles',
  icon_url: '',
  source_stat_key: '',
  is_enabled: true,
  show_on_profile: true,
  sort_order: '300',
};

const emptyAchievementForm = {
  slug: '',
  title: '',
  description: '',
  icon_url: '',
  rarity: 'Common',
  reward_text: '',
  is_enabled: true,
  sort_order: '100',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

export const AdminAchievements: React.FC = () => {
  const [tab, setTab] = useState<'activities' | 'achievements'>(
    'activities'
  );

  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [achievements, setAchievements] = useState<CustomAchievement[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [awards, setAwards] = useState<AwardRow[]>([]);

  const [activitySearch, setActivitySearch] = useState('');
  const [achievementSearch, setAchievementSearch] = useState('');

  const [activityForm, setActivityForm] = useState(emptyActivityForm);
  const [achievementForm, setAchievementForm] = useState(emptyAchievementForm);

  const [editingActivityKey, setEditingActivityKey] = useState<string | null>(null);
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(null);

  const [awardForm, setAwardForm] = useState({
    achievementId: '',
    playerUuid: '',
    seasonId: '',
    notes: '',
  });

  const [playerSearch, setPlayerSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredActivities = useMemo(() => {
    const needle = activitySearch.trim().toLowerCase();
    if (!needle) return activities;

    return activities.filter((item) =>
      `${item.activity_key} ${item.display_name} ${item.group_key} ${item.source_stat_key}`
        .toLowerCase()
        .includes(needle)
    );
  }, [activities, activitySearch]);

  const filteredAchievements = useMemo(() => {
    const needle = achievementSearch.trim().toLowerCase();
    if (!needle) return achievements;

    return achievements.filter((item) =>
      `${item.slug} ${item.title} ${item.rarity} ${item.description}`
        .toLowerCase()
        .includes(needle)
    );
  }, [achievements, achievementSearch]);

  const loadAll = async () => {
    setLoading(true);
    setError('');

    const [activityResult, achievementResult, playerResult, seasonResult, awardResult] =
      await Promise.all([
        supabase
          .from('profile_activity_types')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('profile_custom_achievements')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('player_minecraft_stats')
          .select('minecraft_uuid, minecraft_username')
          .eq('server_id', 'main')
          .order('minecraft_username', { ascending: true })
          .limit(1000),
        supabase
          .from('seasons')
          .select('id, season_number, name, status')
          .order('season_number', { ascending: false }),
        supabase
          .from('profile_custom_achievement_awards')
          .select(
            'id, achievement_id, season_id, minecraft_uuid, minecraft_username, awarded_at'
          )
          .order('awarded_at', { ascending: false })
          .limit(50),
      ]);

    if (activityResult.error) {
      setError(activityResult.error.message);
    } else {
      setActivities((activityResult.data || []) as ActivityType[]);
    }

    if (achievementResult.error) {
      setError((current) => current || achievementResult.error!.message);
    } else {
      setAchievements(
        (achievementResult.data || []) as CustomAchievement[]
      );
    }

    if (!playerResult.error) {
      setPlayers((playerResult.data || []) as PlayerRow[]);
    }

    if (!seasonResult.error) {
      setSeasons((seasonResult.data || []) as SeasonRow[]);
    }

    if (!awardResult.error) {
      setAwards((awardResult.data || []) as AwardRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const resetActivityForm = () => {
    setEditingActivityKey(null);
    setActivityForm(emptyActivityForm);
  };

  const resetAchievementForm = () => {
    setEditingAchievementId(null);
    setAchievementForm(emptyAchievementForm);
  };

  const editActivity = (item: ActivityType) => {
    setEditingActivityKey(item.activity_key);
    setActivityForm({
      activity_key: item.activity_key,
      display_name: item.display_name,
      description: item.description,
      group_key: item.group_key,
      icon_name: item.icon_name,
      icon_url: item.icon_url,
      source_stat_key: item.source_stat_key,
      is_enabled: item.is_enabled,
      show_on_profile: item.show_on_profile,
      sort_order: String(item.sort_order),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editAchievement = (item: CustomAchievement) => {
    setEditingAchievementId(item.id);
    setAchievementForm({
      slug: item.slug,
      title: item.title,
      description: item.description,
      icon_url: item.icon_url,
      rarity: item.rarity,
      reward_text: item.reward_text,
      is_enabled: item.is_enabled,
      sort_order: String(item.sort_order),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveActivity = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      activity_key: editingActivityKey || slugify(activityForm.activity_key),
      display_name: activityForm.display_name.trim(),
      description: activityForm.description.trim(),
      group_key: activityForm.group_key,
      icon_name: activityForm.icon_name.trim() || 'sparkles',
      icon_url: activityForm.icon_url.trim(),
      source_stat_key: activityForm.source_stat_key,
      is_enabled: activityForm.is_enabled,
      show_on_profile: activityForm.show_on_profile,
      sort_order: Number(activityForm.sort_order) || 300,
    };

    if (!payload.activity_key || !payload.display_name) {
      setError('Activity key and display name are required.');
      setSaving(false);
      return;
    }

    if (editingActivityKey) {
      const { error: updateError } = await supabase
        .from('profile_activity_types')
        .update({
          display_name: payload.display_name,
          description: payload.description,
          group_key: payload.group_key,
          icon_name: payload.icon_name,
          icon_url: payload.icon_url,
          source_stat_key: payload.source_stat_key,
          is_enabled: payload.is_enabled,
          show_on_profile: payload.show_on_profile,
          sort_order: payload.sort_order,
        })
        .eq('activity_key', editingActivityKey);

      if (updateError) {
        setError(updateError.message);
      } else {
        await logAdminActivity({
          action: 'updated',
          section: 'profile_activities',
          itemName: payload.display_name,
          details: {
            activity_key: editingActivityKey,
          },
        });
        setMessage('Profile activity updated.');
        resetActivityForm();
        await loadAll();
      }
    } else {
      const { error: insertError } = await supabase
        .from('profile_activity_types')
        .insert({
          ...payload,
          is_system: false,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        await logAdminActivity({
          action: 'created',
          section: 'profile_activities',
          itemName: payload.display_name,
          details: {
            activity_key: payload.activity_key,
          },
        });
        setMessage('Custom profile activity created.');
        resetActivityForm();
        await loadAll();
      }
    }

    setSaving(false);
  };

  const toggleActivity = async (
    item: ActivityType,
    field: 'is_enabled' | 'show_on_profile'
  ) => {
    const next = !item[field];

    const { error: updateError } = await supabase
      .from('profile_activity_types')
      .update({ [field]: next })
      .eq('activity_key', item.activity_key);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await logAdminActivity({
      action: 'visibility_changed',
      section: 'profile_activities',
      itemName: item.display_name,
      details: {
        activity_key: item.activity_key,
        field,
        value: next,
      },
    });

    setActivities((current) =>
      current.map((activity) =>
        activity.activity_key === item.activity_key
          ? { ...activity, [field]: next }
          : activity
      )
    );
  };

  const deleteActivity = async (item: ActivityType) => {
    if (item.is_system) {
      setError('System activity categories cannot be deleted. Disable them instead.');
      return;
    }

    const confirmed = window.confirm(
      `Delete custom activity "${item.display_name}"?`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('profile_activity_types')
      .delete()
      .eq('activity_key', item.activity_key);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await logAdminActivity({
      action: 'deleted',
      section: 'profile_activities',
      itemName: item.display_name,
      details: {
        activity_key: item.activity_key,
      },
    });

    setMessage('Custom activity deleted.');
    await loadAll();
  };

  const saveAchievement = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      setError('You must be logged in as staff.');
      setSaving(false);
      return;
    }

    const payload = {
      slug:
        slugify(achievementForm.slug) ||
        slugify(achievementForm.title),
      title: achievementForm.title.trim(),
      description: achievementForm.description.trim(),
      icon_url: achievementForm.icon_url.trim(),
      rarity: achievementForm.rarity,
      reward_text: achievementForm.reward_text.trim(),
      is_enabled: achievementForm.is_enabled,
      sort_order: Number(achievementForm.sort_order) || 100,
    };

    if (!payload.slug || !payload.title) {
      setError('Achievement title and slug are required.');
      setSaving(false);
      return;
    }

    if (editingAchievementId) {
      const { error: updateError } = await supabase
        .from('profile_custom_achievements')
        .update(payload)
        .eq('id', editingAchievementId);

      if (updateError) {
        setError(updateError.message);
      } else {
        await logAdminActivity({
          action: 'updated',
          section: 'profile_achievements',
          itemName: payload.title,
          details: {
            achievement_id: editingAchievementId,
          },
        });
        setMessage('Custom achievement updated.');
        resetAchievementForm();
        await loadAll();
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('profile_custom_achievements')
        .insert({
          ...payload,
          created_by: userId,
        })
        .select('id')
        .maybeSingle();

      if (insertError) {
        setError(insertError.message);
      } else {
        await logAdminActivity({
          action: 'created',
          section: 'profile_achievements',
          itemName: payload.title,
          details: {
            achievement_id: data?.id,
          },
        });
        setMessage('Custom achievement created.');
        resetAchievementForm();
        await loadAll();
      }
    }

    setSaving(false);
  };

  const toggleAchievement = async (
    item: CustomAchievement
  ) => {
    const next = !item.is_enabled;

    const { error: updateError } = await supabase
      .from('profile_custom_achievements')
      .update({ is_enabled: next })
      .eq('id', item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await logAdminActivity({
      action: 'visibility_changed',
      section: 'profile_achievements',
      itemName: item.title,
      details: {
        achievement_id: item.id,
        value: next,
      },
    });

    setAchievements((current) =>
      current.map((achievement) =>
        achievement.id === item.id
          ? { ...achievement, is_enabled: next }
          : achievement
      )
    );
  };

  const awardAchievement = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    const player = players.find(
      (item) => item.minecraft_uuid === awardForm.playerUuid
    );

    if (!userId || !player || !awardForm.achievementId || !awardForm.seasonId) {
      setError('Player, achievement and season are required.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('profile_custom_achievement_awards')
      .insert({
        achievement_id: awardForm.achievementId,
        season_id: awardForm.seasonId,
        minecraft_uuid: player.minecraft_uuid,
        minecraft_username: player.minecraft_username,
        awarded_by: userId,
        notes: awardForm.notes.trim(),
      });

    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'This player already has this achievement for the selected season.'
          : insertError.message
      );
    } else {
      await logAdminActivity({
        action: 'created',
        section: 'profile_achievement_awards',
        itemName: `${player.minecraft_username} · ${selectedAwardAchievement?.title || 'Achievement'}`,
        details: {
          achievement_id: awardForm.achievementId,
          season_id: awardForm.seasonId,
          minecraft_uuid: player.minecraft_uuid,
        },
      });

      setMessage(`Achievement awarded to ${player.minecraft_username}.`);
      setAwardForm({
        achievementId: '',
        playerUuid: '',
        seasonId: '',
        notes: '',
      });
      await loadAll();
    }

    setSaving(false);
  };

  const revokeAward = async (award: AwardRow) => {
    const confirmed = window.confirm(
      `Remove this achievement award from ${award.minecraft_username}?`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('profile_custom_achievement_awards')
      .delete()
      .eq('id', award.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await logAdminActivity({
      action: 'deleted',
      section: 'profile_achievement_awards',
      itemName: award.minecraft_username,
      details: {
        award_id: award.id,
        minecraft_uuid: award.minecraft_uuid,
      },
    });

    setMessage('Achievement award removed.');
    await loadAll();
  };

  const selectedAwardAchievement = achievements.find(
    (item) => item.id === awardForm.achievementId
  );

  const selectedAwardSeason = seasons.find(
    (item) => item.id === awardForm.seasonId
  );

  const selectedAwardPlayer = players.find(
    (item) => item.minecraft_uuid === awardForm.playerUuid
  );

  const playerMatches = playerSearch.trim()
    ? players.filter((player) =>
        `${player.minecraft_username} ${player.minecraft_uuid}`
          .toLowerCase()
          .includes(playerSearch.trim().toLowerCase())
      )
    : players;

  return (
    <AdminLayout
      active="achievements"
      permission="achievements"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
              <Sparkles className="h-3.5 w-3.5" />
              Player Profile Control
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Activities & Achievements
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Control what players see in their profile activity timeline and create seasonal custom achievements without touching the leaderboard system.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {(message || error) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-400/15 bg-red-400/5 text-red-200'
                : 'border-emerald-400/15 bg-emerald-400/5 text-emerald-200'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
              Activity Types
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {activities.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
              Visible Activities
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {
                activities.filter(
                  (item) =>
                    item.is_enabled &&
                    item.show_on_profile
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
              Custom Achievements
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {achievements.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
              Award Records
            </p>
            <p className="mt-2 text-2xl font-extrabold text-white">
              {awards.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          <button
            type="button"
            onClick={() => setTab('activities')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === 'activities'
                ? 'bg-purple-600/20 text-purple-200'
                : 'text-slate-500 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            Activity Categories
          </button>

          <button
            type="button"
            onClick={() => setTab('achievements')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === 'achievements'
                ? 'bg-amber-500/10 text-amber-200'
                : 'text-slate-500 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <Award className="h-4 w-4" />
            Custom Achievements
          </button>
        </div>

        {tab === 'activities' ? (
          <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="border-b border-white/10 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                  {editingActivityKey ? 'Edit Activity' : 'Create Activity'}
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-white">
                  {editingActivityKey
                    ? 'Update profile activity'
                    : 'Add profile activity'}
                </h2>
              </div>

              <div className="space-y-4 p-5">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Activity Key
                  </span>
                  <input
                    value={activityForm.activity_key}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        activity_key: event.target.value,
                      }))
                    }
                    disabled={Boolean(editingActivityKey)}
                    placeholder="e.g. boss_kills"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/30 disabled:opacity-50"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Display Name
                  </span>
                  <input
                    value={activityForm.display_name}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        display_name: event.target.value,
                      }))
                    }
                    placeholder="Boss Kills"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Description
                  </span>
                  <textarea
                    rows={3}
                    value={activityForm.description}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="What this activity represents"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/30"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Group
                    </span>
                    <select
                      value={activityForm.group_key}
                      onChange={(event) =>
                        setActivityForm((current) => ({
                          ...current,
                          group_key: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none"
                    >
                      {GROUP_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Source Stat
                    </span>
                    <select
                      value={activityForm.source_stat_key}
                      onChange={(event) =>
                        setActivityForm((current) => ({
                          ...current,
                          source_stat_key: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none"
                    >
                      {SOURCE_OPTIONS.map(([value, label]) => (
                        <option key={value || 'none'} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Icon Name
                    </span>
                    <input
                      value={activityForm.icon_name}
                      onChange={(event) =>
                        setActivityForm((current) => ({
                          ...current,
                          icon_name: event.target.value,
                        }))
                      }
                      placeholder="sparkles"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-400/30"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Sort Order
                    </span>
                    <input
                      type="number"
                      value={activityForm.sort_order}
                      onChange={(event) =>
                        setActivityForm((current) => ({
                          ...current,
                          sort_order: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-400/30"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Icon URL (optional)
                  </span>
                  <input
                    value={activityForm.icon_url}
                    onChange={(event) =>
                      setActivityForm((current) => ({
                        ...current,
                        icon_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-400/30"
                  />
                </label>

                <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                    <span>
                      <span className="block text-sm font-bold text-white">
                        Activity Enabled
                      </span>
                      <span className="block text-[10px] text-slate-600">
                        Allow this activity type to produce profile items.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activityForm.is_enabled}
                      onChange={(event) =>
                        setActivityForm((current) => ({
                          ...current,
                          is_enabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-purple-500"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                    <span>
                      <span className="block text-sm font-bold text-white">
                        Show on Profile
                      </span>
                      <span className="block text-[10px] text-slate-600">
                        Display this activity in the public timeline.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={activityForm.show_on_profile}
                      onChange={(event) =>
                        setActivityForm((current) => ({
                          ...current,
                          show_on_profile: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-purple-500"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  {editingActivityKey && (
                    <button
                      type="button"
                      onClick={resetActivityForm}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-300"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void saveActivity()}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {editingActivityKey ? (
                      <Edit3 className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {editingActivityKey ? 'Save Changes' : 'Create Activity'}
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                      Profile Feed Registry
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold text-white">
                      Activity Categories
                    </h2>
                  </div>

                  <div className="relative sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                    <input
                      value={activitySearch}
                      onChange={(event) =>
                        setActivitySearch(event.target.value)
                      }
                      placeholder="Search activities..."
                      className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-purple-400/30"
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="p-12 text-center text-sm text-slate-500">
                    Loading activities...
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="p-12 text-center text-sm text-slate-500">
                    No activity types found.
                  </div>
                ) : (
                  filteredActivities.map((item) => (
                    <div
                      key={item.activity_key}
                      className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/10 text-purple-300">
                          {item.icon_url ? (
                            <img
                              src={item.icon_url}
                              alt=""
                              className="h-5 w-5 rounded object-contain"
                            />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-extrabold text-white">
                              {item.display_name}
                            </p>

                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-mono text-[9px] text-slate-600">
                              {item.activity_key}
                            </span>

                            {item.is_system && (
                              <span className="rounded-full border border-sky-400/15 bg-sky-400/5 px-2 py-0.5 text-[9px] font-bold text-sky-300">
                                SYSTEM
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {item.description ||
                              'No description configured.'}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider">
                            <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 text-slate-500">
                              {item.group_key}
                            </span>
                            {item.source_stat_key && (
                              <span className="rounded-full border border-purple-400/10 bg-purple-400/5 px-2 py-1 text-purple-300">
                                source: {item.source_stat_key}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            void toggleActivity(item, 'is_enabled')
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                            item.is_enabled
                              ? 'border-emerald-400/15 bg-emerald-400/5 text-emerald-300'
                              : 'border-red-400/15 bg-red-400/5 text-red-300'
                          }`}
                        >
                          {item.is_enabled ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          {item.is_enabled ? 'Enabled' : 'Disabled'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleActivity(item, 'show_on_profile')
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                            item.show_on_profile
                              ? 'border-purple-400/15 bg-purple-400/5 text-purple-300'
                              : 'border-slate-400/10 bg-white/[0.03] text-slate-500'
                          }`}
                        >
                          {item.show_on_profile ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          {item.show_on_profile ? 'Profile ON' : 'Profile OFF'}
                        </button>

                        <button
                          type="button"
                          onClick={() => editActivity(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/[0.06]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        {!item.is_system && (
                          <button
                            type="button"
                            onClick={() => void deleteActivity(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
              <section className="rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-xl">
                <div className="border-b border-white/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">
                    {editingAchievementId
                      ? 'Edit Achievement'
                      : 'Create Achievement'}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-white">
                    {editingAchievementId
                      ? 'Update custom achievement'
                      : 'Create custom achievement'}
                  </h2>
                </div>

                <div className="space-y-4 p-5">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Achievement Title
                    </span>
                    <input
                      value={achievementForm.title}
                      onChange={(event) =>
                        setAchievementForm((current) => ({
                          ...current,
                          title: event.target.value,
                          slug:
                            current.slug || slugify(event.target.value),
                        }))
                      }
                      placeholder="Dragon Slayer"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Slug
                    </span>
                    <input
                      value={achievementForm.slug}
                      onChange={(event) =>
                        setAchievementForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                      placeholder="dragon-slayer"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400/30"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Description
                    </span>
                    <textarea
                      rows={3}
                      value={achievementForm.description}
                      onChange={(event) =>
                        setAchievementForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Defeat the Ender Dragon during a season."
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Rarity
                      </span>
                      <select
                        value={achievementForm.rarity}
                        onChange={(event) =>
                          setAchievementForm((current) => ({
                            ...current,
                            rarity: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none"
                      >
                        {RARITIES.map((rarity) => (
                          <option key={rarity} value={rarity}>
                            {rarity}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Sort Order
                      </span>
                      <input
                        type="number"
                        value={achievementForm.sort_order}
                        onChange={(event) =>
                          setAchievementForm((current) => ({
                            ...current,
                            sort_order: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400/30"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Reward Text
                    </span>
                    <input
                      value={achievementForm.reward_text}
                      onChange={(event) =>
                        setAchievementForm((current) => ({
                          ...current,
                          reward_text: event.target.value,
                        }))
                      }
                      placeholder="500 XP · Legendary badge"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Icon URL
                    </span>
                    <input
                      value={achievementForm.icon_url}
                      onChange={(event) =>
                        setAchievementForm((current) => ({
                          ...current,
                          icon_url: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/30"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Achievement Enabled
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        Disabled definitions stay in historical award records.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={achievementForm.is_enabled}
                      onChange={(event) =>
                        setAchievementForm((current) => ({
                          ...current,
                          is_enabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-amber-500"
                    />
                  </label>

                  <div className="flex gap-2">
                    {editingAchievementId && (
                      <button
                        type="button"
                        onClick={resetAchievementForm}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-slate-300"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void saveAchievement()}
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                    >
                      {editingAchievementId ? (
                        <Edit3 className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingAchievementId
                        ? 'Save Changes'
                        : 'Create Achievement'}
                    </button>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20">
                <div className="border-b border-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">
                        Achievement Registry
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-white">
                        Custom Achievements
                      </h2>
                    </div>

                    <div className="relative sm:w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                      <input
                        value={achievementSearch}
                        onChange={(event) =>
                          setAchievementSearch(event.target.value)
                        }
                        placeholder="Search achievements..."
                        className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-400/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {filteredAchievements.length === 0 ? (
                    <div className="p-12 text-center text-sm text-slate-500">
                      No custom achievements found.
                    </div>
                  ) : (
                    filteredAchievements.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-400/15 bg-amber-400/5">
                            {item.icon_url ? (
                              <img
                                src={item.icon_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Award className="h-5 w-5 text-amber-300" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-extrabold text-white">
                                {item.title}
                              </p>
                              <span className="rounded-full border border-amber-400/10 bg-amber-400/5 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                                {item.rarity}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {item.description || 'No description.'}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                              <span>{item.slug}</span>
                              {item.reward_text && (
                                <span className="text-emerald-300">
                                  {item.reward_text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              void toggleAchievement(item)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                              item.is_enabled
                                ? 'border-emerald-400/15 bg-emerald-400/5 text-emerald-300'
                                : 'border-red-400/15 bg-red-400/5 text-red-300'
                            }`}
                          >
                            {item.is_enabled ? (
                              <Eye className="h-3.5 w-3.5" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                            {item.is_enabled ? 'Enabled' : 'Disabled'}
                          </button>

                          <button
                            type="button"
                            onClick={() => editAchievement(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
              <section className="rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20">
                <div className="border-b border-white/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80">
                    Manual Awarding
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-white">
                    Give Achievement to Player
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    Awards are attached to a specific Minecraft player and season.
                  </p>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Achievement
                    </span>
                    <select
                      value={awardForm.achievementId}
                      onChange={(event) =>
                        setAwardForm((current) => ({
                          ...current,
                          achievementId: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="">Select achievement</option>
                      {achievements
                        .filter((item) => item.is_enabled)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title} · {item.rarity}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Season
                    </span>
                    <select
                      value={awardForm.seasonId}
                      onChange={(event) =>
                        setAwardForm((current) => ({
                          ...current,
                          seasonId: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="">Select season</option>
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          S{season.season_number} · {season.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="md:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Player Search
                      </span>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                        <input
                          value={playerSearch}
                          onChange={(event) =>
                            setPlayerSearch(event.target.value)
                          }
                          placeholder="Search Minecraft username..."
                          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-purple-400/30"
                        />
                      </div>
                    </label>

                    <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
                      {playerMatches.slice(0, 30).map((player) => {
                        const selected =
                          player.minecraft_uuid ===
                          awardForm.playerUuid;

                        return (
                          <button
                            key={player.minecraft_uuid}
                            type="button"
                            onClick={() =>
                              setAwardForm((current) => ({
                                ...current,
                                playerUuid:
                                  player.minecraft_uuid,
                              }))
                            }
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                              selected
                                ? 'bg-purple-500/10 text-purple-200'
                                : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5" />
                              {player.minecraft_username}
                            </span>
                            {selected && (
                              <Check className="h-4 w-4 text-purple-300" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-slate-500">
                      Selected player:{' '}
                      <span className="font-bold text-white">
                        {selectedAwardPlayer?.minecraft_username ||
                          'None'}
                      </span>
                    </div>
                  </div>

                  <label className="block md:col-span-2">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Internal Note (optional)
                    </span>
                    <textarea
                      rows={2}
                      value={awardForm.notes}
                      onChange={(event) =>
                        setAwardForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Why this player received the award"
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none focus:border-purple-400/30"
                    />
                  </label>

                  <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-purple-400/10 bg-purple-400/[0.03] p-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {selectedAwardAchievement?.title ||
                          'No achievement selected'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-600">
                        {selectedAwardSeason
                          ? `S${selectedAwardSeason.season_number} · ${selectedAwardSeason.name}`
                          : 'No season selected'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void awardAchievement()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                      Award
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80">
                        History
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold text-white">
                        Recent Awards
                      </h2>
                    </div>
                    <Shield className="h-5 w-5 text-emerald-300" />
                  </div>
                </div>

                <div className="max-h-[520px] space-y-2 overflow-y-auto p-4">
                  {awards.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-600">
                      No custom achievement awards yet.
                    </div>
                  ) : (
                    awards.map((award) => {
                      const achievement = achievements.find(
                        (item) => item.id === award.achievement_id
                      );

                      const season = seasons.find(
                        (item) => item.id === award.season_id
                      );

                      return (
                        <div
                          key={award.id}
                          className="rounded-2xl border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/5 text-amber-300">
                              <Trophy className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">
                                {achievement?.title || 'Custom Achievement'}
                              </p>
                              <p className="mt-1 text-xs text-purple-200">
                                {award.minecraft_username}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-600">
                                {season
                                  ? `S${season.season_number} · ${season.name}`
                                  : 'Unknown season'}
                                {' · '}
                                {formatDate(award.awarded_at)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => void revokeAward(award)}
                              className="rounded-lg border border-red-400/10 bg-red-400/5 p-2 text-red-300 hover:bg-red-400/10"
                              title="Remove award"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
