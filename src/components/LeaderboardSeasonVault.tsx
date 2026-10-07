import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  LockKeyhole,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { Season } from '../services/leaderboard';

interface Props {
  seasons: Season[];
  selectedSeasonId: string;
  onSelect: (seasonId: string) => void;
  disabled?: boolean;
}

const dateLabel = (value: string | null) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const LeaderboardSeasonVault: React.FC<Props> = ({
  seasons,
  selectedSeasonId,
  onSelect,
  disabled = false,
}) => {
  const selected = seasons.find(
    (season) => season.id === selectedSeasonId
  ) ?? seasons[0] ?? null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/15 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_30%),rgba(8,8,13,0.96)] p-4 shadow-2xl shadow-black/30 sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">
            <Trophy className="h-3.5 w-3.5" />
            Season Vault
          </div>

          <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Explore every season
          </h3>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
            Live rankings and preserved historical seasons stay visually separate, so archived results remain easy to trust.
          </p>
        </div>

        {selected && (
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl lg:min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-purple-400/20 bg-purple-500/10 text-xs font-black text-white">
                {selected.cover_image_url ? (
                  <img
                    src={selected.cover_image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <span className="relative z-10">S{selected.season_number}</span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
                    Selected season
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {selected.status === 'active' ? 'LIVE' : 'HISTORY'}
                  </span>
                </div>

                <p className="mt-1 truncate text-sm font-bold text-white">
                  {selected.name}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600">
                  <CalendarDays className="h-3 w-3" />
                  {dateLabel(selected.starts_at)}
                  <span>→</span>
                  {dateLabel(selected.ends_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2.5">
          {seasons.map((season) => {
            const active = season.id === selectedSeasonId;
            const live = season.status === 'active';

            return (
              <button
                key={season.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(season.id)}
                className={`group relative min-w-[180px] overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? 'border-purple-400/45 bg-purple-500/[0.10] shadow-[0_0_30px_rgba(139,92,246,0.16)]'
                    : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] via-transparent to-sky-500/[0.04] opacity-0 transition group-hover:opacity-100" />

                <div className="relative flex items-start gap-3">
                  <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-xs font-black ${
                    active
                      ? 'border-purple-400/30 bg-purple-500/15 text-purple-100'
                      : 'border-white/10 bg-black/25 text-slate-300'
                  }`}>
                    {season.cover_image_url ? (
                      <img
                        src={season.cover_image_url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-45"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="relative z-10">S{season.season_number}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                        {season.name}
                      </p>
                      {active && <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-purple-400" />}
                    </div>

                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      live
                        ? 'border-emerald-400/15 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.04] text-slate-500'
                    }`}>
                      {live ? (
                        <Sparkles className="h-2.5 w-2.5" />
                      ) : (
                        <LockKeyhole className="h-2.5 w-2.5" />
                      )}
                      {live ? 'Live' : 'Saved'}
                    </span>

                    <p className="mt-2 truncate text-[10px] text-slate-600">
                      {season.description || 'Season leaderboard archive'}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:text-purple-300" />
                </div>

                <div className="relative mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    {live ? (
                      <Clock3 className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {live ? 'Current rankings' : 'Historical record'}
                  </span>

                  {active && (
                    <Crown className="h-3.5 w-3.5 text-purple-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
