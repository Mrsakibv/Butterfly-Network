import React, {
  useEffect,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'motion/react';

import {
  Award,
  CheckCircle,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';

import {
  assignBadge,
  getAllUsersWithBadges,
  removeBadge,
} from '../../services/social';

import {
  getBadgeByType,
  getAllBadges,
  loadBadges,
  subscribeToBadgeChanges,
  updateBadge,
} from '../../types/badges';

import type {
  Badge,
  BadgeType,
} from '../../types/badges';

import { TikBadge } from '../../components/social/TikBadge';

import { useToast } from '../../hooks/useToast';


type User = {
  id: string;
  username: string;
  badge: BadgeType | null;
  minecraft_username: string | null;
};


export const BadgeManagement: React.FC =
  () => {
    const { showToast } =
      useToast();

    const [badges, setBadges] =
      useState<Badge[]>(
        getAllBadges()
      );

    const [users, setUsers] =
      useState<User[]>([]);

    const [loading, setLoading] =
      useState(true);

    const [editing, setEditing] =
      useState<Badge | null>(null);

    const [savingBadge, setSavingBadge] =
      useState(false);

    const [selectedUser, setSelectedUser] =
      useState<User | null>(null);

    const [savingUser, setSavingUser] =
      useState(false);


    /*
    |--------------------------------------------------------------------------
    | Load badges + users
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
      const unsubscribe =
        subscribeToBadgeChanges(
          () => {
            setBadges(
              getAllBadges()
            );
          }
        );

      const init = async () => {
        setLoading(true);

        const [
          badgeResult,
          userResult,
        ] = await Promise.all([
          loadBadges(true),
          getAllUsersWithBadges(),
        ]);

        setBadges(
          getAllBadges()
        );

        if (
          userResult.error
        ) {
          showToast(
            'Failed to load users',
            'error'
          );
        } else {
          setUsers(
            (userResult.data ||
              []) as User[]
          );
        }

        if (!badgeResult) {
          showToast(
            'Failed to load badges',
            'error'
          );
        }

        setLoading(false);
      };

      init();

      return () => {
        unsubscribe();
      };
    }, []);


    /*
    |--------------------------------------------------------------------------
    | Refresh
    |--------------------------------------------------------------------------
    */

    const refresh = async () => {
      await loadBadges(true);

      setBadges(
        getAllBadges()
      );

      showToast(
        'Badge settings refreshed',
        'success'
      );
    };


    /*
    |--------------------------------------------------------------------------
    | Save badge
    |--------------------------------------------------------------------------
    */

    const saveBadge = async () => {
      if (!editing) {
        return;
      }

      if (
        !editing.name.trim() ||
        !editing.tier.trim() ||
        !editing.rarity.trim() ||
        !editing.gifUrl.trim()
      ) {
        showToast(
          'Name, tier, rarity and GIF path are required',
          'error'
        );

        return;
      }

      if (
        editing.value < 1 ||
        editing.value > 6
      ) {
        showToast(
          'Value must be between 1 and 6',
          'error'
        );

        return;
      }

      setSavingBadge(true);

      const { error } =
        await updateBadge(
          editing
        );

      setSavingBadge(false);

      if (error) {
        showToast(
          error.message ||
            'Failed to save badge',
          'error'
        );

        return;
      }

      setBadges(
        getAllBadges()
      );

      setEditing(null);

      showToast(
        'Badge updated successfully',
        'success'
      );
    };


    /*
    |--------------------------------------------------------------------------
    | Assign / remove user badge
    |--------------------------------------------------------------------------
    */

    const assign = async (
      type: BadgeType | null
    ) => {
      if (!selectedUser) {
        return;
      }

      setSavingUser(true);

      const result = type
        ? await assignBadge(
            selectedUser.id,
            type
          )
        : await removeBadge(
            selectedUser.id
          );

      setSavingUser(false);

      if (result.error) {
        showToast(
          type
            ? 'Failed to assign badge'
            : 'Failed to remove badge',
          'error'
        );

        return;
      }

      setUsers(
        (list) =>
          list.map((user) =>
            user.id ===
            selectedUser.id
              ? {
                  ...user,
                  badge: type,
                }
              : user
          )
      );

      setSelectedUser(null);

      showToast(
        type
          ? 'Badge assigned successfully'
          : 'Badge removed successfully',
        'success'
      );
    };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      );
    }


    return (
      <div className="space-y-8">

        {/* =========================================================
            HEADER
        ========================================================== */}

        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <Award className="w-6 h-6 text-purple-400" />

            <div>
              <h2 className="text-xl font-bold text-white">
                Badge Management
              </h2>

              <p className="text-sm text-slate-400">
                Edit badge details and assign badges to users.
              </p>
            </div>

          </div>

          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />

            Refresh
          </button>

        </div>


        {/* =========================================================
            BADGE DETAILS
        ========================================================== */}

        <section>

          <h3 className="text-lg font-bold text-white mb-1">
            Badge Details
          </h3>

          <p className="text-xs text-slate-500 mb-4">
            Changes are saved in Supabase and used across the website.
          </p>


          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {badges.map(
              (badge) => (

                <div
                  key={badge.type}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >

                  {editing?.type ===
                  badge.type ? (

                    /* =================================================
                       EDIT MODE
                    ================================================== */

                    <div className="space-y-4">

                      <div className="flex justify-between items-center">

                        <div className="flex items-center gap-3">

                          <TikBadge
                            badgeType={
                              badge.type
                            }
                            size="md"
                            clickable={false}
                          />

                          <span className="font-bold text-white">
                            Edit {badge.name}
                          </span>

                        </div>

                        <button
                          onClick={() =>
                            setEditing(null)
                          }
                          disabled={
                            savingBadge
                          }
                        >
                          <X className="w-5 h-5 text-slate-400" />
                        </button>

                      </div>


                      {/* Name / Tier / Rarity / Value */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                        {(
                          [
                            'name',
                            'tier',
                            'rarity',
                            'value',
                          ] as const
                        ).map(
                          (key) => (

                            <label
                              key={key}
                              className="text-xs text-slate-400 capitalize"
                            >
                              {key}

                              <input
                                type={
                                  key ===
                                  'value'
                                    ? 'number'
                                    : 'text'
                                }
                                min={
                                  key ===
                                  'value'
                                    ? 1
                                    : undefined
                                }
                                max={
                                  key ===
                                  'value'
                                    ? 6
                                    : undefined
                                }
                                value={
                                  editing[
                                    key
                                  ]
                                }
                                onChange={(
                                  e
                                ) =>
                                  setEditing({
                                    ...editing,

                                    [key]:
                                      key ===
                                      'value'
                                        ? Number(
                                            e
                                              .target
                                              .value
                                          )
                                        : e
                                            .target
                                            .value,
                                  } as Badge)
                                }
                                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                              />

                            </label>

                          )
                        )}

                      </div>


                      {/* Description */}

                      <label className="block text-xs text-slate-400">

                        Description

                        <textarea
                          value={
                            editing.description
                          }
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              description:
                                e.target.value,
                            })
                          }
                          rows={2}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                        />

                      </label>


                      {/* GIF */}

                      <label className="block text-xs text-slate-400">

                        GIF Path / URL

                        <input
                          value={
                            editing.gifUrl
                          }
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              gifUrl:
                                e.target.value,
                            })
                          }
                          placeholder="/badges/your-badge.gif"
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
                        />

                        <span className="block mt-1 text-[10px] text-slate-600">
                          Example: /badges/my-badge.gif
                        </span>

                      </label>


                      {/* Colors */}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                        {(
                          [
                            'primary',
                            'secondary',
                            'glow',
                          ] as const
                        ).map(
                          (key) => (

                            <label
                              key={key}
                              className="text-xs text-slate-400 capitalize"
                            >

                              {key} color

                              <input
                                value={
                                  editing
                                    .color[
                                    key
                                  ]
                                }
                                onChange={(e) =>
                                  setEditing({
                                    ...editing,

                                    color: {
                                      ...editing.color,

                                      [key]:
                                        e
                                          .target
                                          .value,
                                    },
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                              />

                            </label>

                          )
                        )}

                      </div>


                      {/* Animation */}

                      <div className="flex flex-wrap gap-4">

                        {(
                          [
                            'particles',
                            'glow',
                            'pulse',
                          ] as const
                        ).map(
                          (key) => (

                            <label
                              key={key}
                              className="flex items-center gap-2 text-sm text-slate-300"
                            >

                              <input
                                type="checkbox"
                                checked={
                                  editing
                                    .animation[
                                    key
                                  ]
                                }
                                onChange={(e) =>
                                  setEditing({
                                    ...editing,

                                    animation: {
                                      ...editing.animation,

                                      [key]:
                                        e.target
                                          .checked,
                                    },
                                  })
                                }
                                className="accent-purple-500"
                              />

                              {key}

                            </label>

                          )
                        )}

                      </div>


                      {/* Buttons */}

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            setEditing(null)
                          }
                          className="px-4 py-2 rounded-lg bg-white/5 text-slate-300"
                        >
                          Cancel
                        </button>

                        <button
                          onClick={
                            saveBadge
                          }
                          disabled={
                            savingBadge
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-50"
                        >

                          {savingBadge ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}

                          Save Changes

                        </button>

                      </div>

                    </div>

                  ) : (

                    /* =================================================
                       VIEW MODE
                    ================================================== */

                    <div className="flex items-center gap-4">

                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center border"
                        style={{
                          borderColor:
                            `${badge.color.primary}40`,
                          background:
                            `${badge.color.primary}10`,
                        }}
                      >

                        <TikBadge
                          badgeType={
                            badge.type
                          }
                          size="lg"
                          clickable={false}
                        />

                      </div>


                      <div className="min-w-0 flex-1">

                        <h4 className="font-bold text-white truncate">
                          {badge.name}
                        </h4>

                        <p className="text-xs text-slate-400 mt-1">
                          {badge.tier}
                          {' · '}
                          {badge.rarity}
                          {' · Value '}
                          {badge.value}
                        </p>

                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {badge.description}
                        </p>

                        <p className="text-[10px] text-slate-600 mt-2 truncate">
                          GIF: {badge.gifUrl}
                        </p>

                      </div>


                      <button
                        onClick={() =>
                          setEditing(
                            JSON.parse(
                              JSON.stringify(
                                badge
                              )
                            )
                          )
                        }
                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/15 text-purple-300 text-xs font-semibold"
                      >

                        <Pencil className="w-3.5 h-3.5" />

                        Edit

                      </button>

                    </div>

                  )}

                </div>

              )
            )}

          </div>

        </section>


        {/* =========================================================
            USER ASSIGNMENT
        ========================================================== */}

        <section>

          <h3 className="text-lg font-bold text-white mb-1">
            User Badge Assignment
          </h3>

          <p className="text-xs text-slate-500 mb-4">
            Assign or remove badges from users.
          </p>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {users.map(
              (user) => {

                const badge =
                  getBadgeByType(
                    user.badge
                  );

                const avatar =
                  user.minecraft_username
                    ? `https://mc-heads.net/avatar/${encodeURIComponent(
                        user.minecraft_username
                      )}/64`
                    : '';


                return (

                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/20"
                  >

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-12 h-12 rounded-full overflow-hidden border border-purple-400/40 shrink-0">

                        {avatar ? (

                          <img
                            src={avatar}
                            alt={user.username}
                            className="w-full h-full object-cover"
                            style={{
                              imageRendering:
                                'pixelated',
                            }}
                          />

                        ) : (

                          <div className="w-full h-full bg-purple-700 flex items-center justify-center text-white font-bold">
                            {user.username[0]?.toUpperCase()}
                          </div>

                        )}

                      </div>


                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-white truncate">
                          {user.username}
                        </p>

                        {badge ? (

                          <div className="flex items-center gap-2 mt-1">

                            <TikBadge
                              badgeType={
                                user.badge
                              }
                              size="sm"
                              clickable={false}
                            />

                            <span className="text-xs text-slate-400">
                              {badge.name}
                            </span>

                          </div>

                        ) : (

                          <p className="text-xs text-slate-500 mt-1">
                            No badge
                          </p>

                        )}

                      </div>

                    </div>


                    <button
                      onClick={() =>
                        setSelectedUser(
                          user
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 text-xs font-semibold"
                    >
                      {user.badge
                        ? 'Change'
                        : 'Assign'}
                    </button>

                  </div>

                );
              }
            )}

          </div>

        </section>


        {/* =========================================================
            ASSIGN BADGE MODAL
        ========================================================== */}

        <AnimatePresence>

          {selectedUser && (

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
              onClick={() =>
                !savingUser &&
                setSelectedUser(null)
              }
            >

              <motion.div
                initial={{
                  scale: 0.9,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  scale: 0.9,
                  opacity: 0,
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="relative w-full max-w-2xl rounded-2xl border border-purple-500/20 bg-[#100b1b] p-6 shadow-2xl"
              >

                <button
                  onClick={() =>
                    !savingUser &&
                    setSelectedUser(
                      null
                    )
                  }
                  className="absolute top-4 right-4"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>


                <h3 className="text-xl font-bold text-white">
                  Assign Badge to{' '}
                  {selectedUser.username}
                </h3>

                <p className="text-sm text-slate-400 mb-6">
                  Select a badge.
                </p>


                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                  {badges.map(
                    (badge) => (

                      <button
                        key={badge.type}
                        disabled={
                          savingUser
                        }
                        onClick={() =>
                          assign(
                            badge.type
                          )
                        }
                        className="relative flex flex-col items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-500/10 disabled:opacity-50"
                      >

                        {selectedUser.badge ===
                          badge.type && (
                          <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-green-400" />
                        )}

                        <TikBadge
                          badgeType={
                            badge.type
                          }
                          size="lg"
                          clickable={false}
                        />

                        <span className="text-xs font-semibold text-white">
                          {badge.name}
                        </span>

                      </button>

                    )
                  )}

                </div>


                {selectedUser.badge && (

                  <button
                    disabled={
                      savingUser
                    }
                    onClick={() =>
                      assign(null)
                    }
                    className="w-full mt-5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold"
                  >
                    {savingUser
                      ? 'Saving...'
                      : 'Remove Badge'}
                  </button>

                )}


                {savingUser && (

                  <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">

                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />

                  </div>

                )}

              </motion.div>

            </motion.div>

          )}

        </AnimatePresence>

      </div>
    );
  };