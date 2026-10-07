import React, { useMemo } from 'react';
import {
  Award,
  CalendarDays,
  ChevronDown,
  Clock3,
  Crown,
  Gamepad2,
  Gem,
  Heart,
  Medal,
  Pickaxe,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

export interface ProfileActivityType {
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

export interface ProfileActivityItem {
  id: string;
  activityKey: string;
  groupKey: string;
  title: string;
  description: string;
  seasonId: string | null;
  seasonNumber: number | null;
  seasonName: string | null;
  iconUrl: string;
  iconName: string;
  occurredAt: string | null;
  accent: string;
}

interface ProfileActivityTimelineProps {
  activities: ProfileActivityItem[];
  activityTypes: ProfileActivityType[];
  loading: boolean;
  seasonOptions: Array<{
    id: string;
    seasonNumber: number;
    name: string;
  }>;
  selectedGroup: string;
  selectedSeasonId: string;
  onGroupChange: (value: string) => void;
  onSeasonChange: (value: string) => void;
}

const ICONS: Record<string, React.ElementType> = {
  award: Award,
  'calendar-days': CalendarDays,
  clock: Clock3,
  crown: Crown,
  gem: Gem,
  heart: Heart,
  medal: Medal,
  pickaxe: Pickaxe,
  'scroll-text': ScrollText,
  shield: Shield,
  sparkles: Sparkles,
  swords: Swords,
  target: Target,
  trophy: Trophy,
  'user-plus': UserPlus,
  users: Users,
  zap: Zap,
  gamepad: Gamepad2,
};

const accentMap: Record<string, string> = {
  combat: 'from-red-500/15 to-orange-500/5 border-red-400/15 text-red-200',
  progress: 'from-purple-500/15 to-violet-500/5 border-purple-400/15 text-purple-200',
  minecraft: 'from-emerald-500/15 to-green-500/5 border-emerald-400/15 text-emerald-200',
  movement: 'from-sky-500/15 to-cyan-500/5 border-sky-400/15 text-sky-200',
  achievements: 'from-amber-500/15 to-yellow-500/5 border-amber-400/15 text-amber-200',
  teams: 'from-blue-500/15 to-indigo-500/5 border-blue-400/15 text-blue-200',
  awards: 'from-fuchsia-500/15 to-pink-500/5 border-fuchsia-400/15 text-fuchsia-200',
  custom: 'from-purple-500/15 to-cyan-500/5 border-purple-400/15 text-purple-200',
  advancements: 'from-amber-500/15 to-yellow-500/5 border-amber-400/15 text-amber-200',
};

const formatRelativeDate = (value: string | null) => {
  if (!value) return 'Season record';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Season record';

  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 0) {
    return date.toLocaleDateString();
  }

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const iconFor = (item: ProfileActivityItem) => {
  const Icon = ICONS[item.iconName] ?? Sparkles;
  return Icon;
};

export const ProfileActivityTimeline: React.FC<
  ProfileActivityTimelineProps
> = ({
  activities,
  activityTypes,
  loading,
  seasonOptions,
  selectedGroup,
  selectedSeasonId,
  onGroupChange,
  onSeasonChange,
}) => {
  const groups = useMemo(() => {
    const order = ['all', 'advancements'];
    const available = new Set(
      activityTypes.map((type) => type.group_key)
    );

    return order.filter(
      (group) => group === 'all' || available.has(group)
    );
  }, [activityTypes]);

  const visibleActivities = useMemo(() => {
    return activities.filter((activity) => {
      const groupMatch =
        selectedGroup === 'all' ||
        activity.groupKey === selectedGroup;

      const seasonMatch =
        selectedSeasonId === 'all' ||
        activity.seasonId === selectedSeasonId;

      return groupMatch && seasonMatch;
    });
  }, [activities, selectedGroup, selectedSeasonId]);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-purple-400/80">
              Player Timeline
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-extrabold text-white">
                  Activity
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Only verified Minecraft server advancements completed during your seasons.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <span className="sr-only">Filter activity by type</span>
              <select
                value={selectedGroup}
                onChange={(event) => onGroupChange(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 pr-9 text-xs font-semibold text-slate-300 outline-none focus:border-purple-400/30 sm:w-[165px]"
              >
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group === 'all'
                      ? 'All Advancements'
                      : 'Server Advancements'}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            </label>

            <label className="relative">
              <span className="sr-only">Filter activity by season</span>
              <select
                value={selectedSeasonId}
                onChange={(event) => onSeasonChange(event.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 pr-9 text-xs font-semibold text-slate-300 outline-none focus:border-purple-400/30 sm:w-[185px]"
              >
                <option value="all">All Seasons</option>
                {seasonOptions.map((season) => (
                  <option key={season.id} value={season.id}>
                    S{season.seasonNumber} · {season.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            </label>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400/20 border-t-purple-400" />
          </div>
        ) : visibleActivities.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-black/20 px-6 py-12 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-slate-700" />
            <p className="mt-3 text-sm font-bold text-slate-400">
              No activity matches this filter.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Complete a server advancement to see it here.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-4 left-[22px] top-4 w-px bg-gradient-to-b from-purple-400/30 via-white/10 to-transparent" />

            <div className="space-y-3">
              {visibleActivities.map((activity) => {
                const Icon = iconFor(activity);
                const accent =
                  accentMap[activity.accent] ??
                  accentMap.custom;

                return (
                  <article
                    key={activity.id}
                    className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.04] ${accent}`}
                  >
                    <div className="flex gap-4">
                      <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/50 shadow-lg">
                        {activity.iconUrl ? (
                          <img
                            src={activity.iconUrl}
                            alt=""
                            className="h-6 w-6 rounded object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-sm font-extrabold text-white">
                              {activity.title}
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {activity.description}
                            </p>
                          </div>

                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                            {formatRelativeDate(activity.occurredAt)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-slate-400">
                            {activity.seasonNumber != null ? (
                              <>
                                <Trophy className="h-3 w-3" />
                                S{activity.seasonNumber}
                              </>
                            ) : (
                              'Minecraft'
                            )}
                          </span>

                          {activity.seasonName && (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-slate-500">
                              {activity.seasonName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
