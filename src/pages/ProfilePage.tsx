/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Gamepad2,
  RefreshCw,
} from 'lucide-react';

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  minecraft_username: string | null;
  bio: string | null;
  created_at: string | null;
}

export const ProfilePage: React.FC = () => {
  const { navigate } = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [bio, setBio] = useState('');

  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingMinecraft, setSavingMinecraft] = useState(false);

  const [message, setMessage] = useState('');

  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [minecraftHeadUrl, setMinecraftHeadUrl] = useState<string | null>(
    null
  );

  /*
   * Minecraft username validation
   *
   * Minecraft Java usernames:
   * - 3 to 16 characters
   * - Letters, numbers and underscore
   */
  const isValidMinecraftUsername = (value: string) => {
    return /^[A-Za-z0-9_]{3,16}$/.test(value);
  };

  /*
   * Generate Minecraft head URL
   *
   * mc-heads.net provides the player's current skin head
   * based on Minecraft username.
   */
  const getMinecraftHeadUrl = (value: string) => {
    if (!value) return null;

    return `https://mc-heads.net/avatar/${encodeURIComponent(
      value
    )}/128`;
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate('/login');
        return;
      }

      setEmail(user.email ?? '');

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, username, minecraft_username, bio, created_at'
        )
        .eq('id', user.id)
        .single();

      if (error) {
        setMessage('Could not load your profile.');
        setLoading(false);
        return;
      }

      setProfile(data);

      setFullName(data.full_name ?? '');
      setUsername(data.username ?? '');
      setMinecraftUsername(data.minecraft_username ?? '');
      setBio(data.bio ?? '');

      if (data.minecraft_username) {
        setMinecraftHeadUrl(
          getMinecraftHeadUrl(data.minecraft_username)
        );
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const getMaskedEmail = (value: string) => {
    const atIndex = value.indexOf('@');

    if (atIndex <= 0) return value;

    const localPart = value.slice(0, atIndex);
    const domain = value.slice(atIndex);

    return localPart.length <= 2
      ? `${localPart[0] ?? ''}****${domain}`
      : `${localPart.slice(0, 2)}****${domain}`;
  };

  /*
   * Save normal website profile
   */
  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setMessage('');

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (cleanFullName.length < 2) {
      setMessage('Full name must be at least 2 characters.');
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: cleanFullName,
        username: cleanUsername,
        bio: bio.trim() || null,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      setMessage(
        error.code === '23505'
          ? 'This username is already taken.'
          : error.message
      );

      setSaving(false);
      return;
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            ...data,
          }
        : data
    );

    setMessage('Profile updated successfully.');
    setSaving(false);
  };

  /*
   * Save Minecraft username
   */
  const handleSaveMinecraftUsername = async () => {
    if (!profile) return;

    setMessage('');

    const cleanMinecraftUsername = minecraftUsername.trim();

    /*
     * Empty username means user wants to remove
     * their Minecraft username.
     */
    if (cleanMinecraftUsername.length === 0) {
      setSavingMinecraft(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          minecraft_username: null,
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        setSavingMinecraft(false);
        return;
      }

      setProfile(data);
      setMinecraftUsername('');
      setMinecraftHeadUrl(null);

      setMessage('Minecraft username removed successfully.');
      setSavingMinecraft(false);
      return;
    }

    /*
     * Validate username before saving
     */
    if (!isValidMinecraftUsername(cleanMinecraftUsername)) {
      setMessage(
        'Minecraft username must be 3-16 characters and can only contain letters, numbers, and underscores.'
      );
      return;
    }

    setSavingMinecraft(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        minecraft_username: cleanMinecraftUsername,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      setMessage(
        error.code === '23505'
          ? 'This Minecraft username is already linked to another account.'
          : error.message
      );

      setSavingMinecraft(false);
      return;
    }

    setProfile(data);

    setMinecraftUsername(
      data.minecraft_username ?? cleanMinecraftUsername
    );

    setMinecraftHeadUrl(
      getMinecraftHeadUrl(
        data.minecraft_username ?? cleanMinecraftUsername
      )
    );

    setMessage('Minecraft username saved successfully.');
    setSavingMinecraft(false);
  };

  /*
   * Remove Minecraft username
   */
  const handleRemoveMinecraftUsername = async () => {
    if (!profile) return;

    setSavingMinecraft(true);
    setMessage('');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        minecraft_username: null,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      setSavingMinecraft(false);
      return;
    }

    setProfile(data);
    setMinecraftUsername('');
    setMinecraftHeadUrl(null);

    setMessage('Minecraft username removed.');
    setSavingMinecraft(false);
  };

  /*
   * Verify password to reveal email
   */
  const handleVerifyPassword = async () => {
    if (!currentPassword) {
      setMessage('Please enter your current password.');
      return;
    }

    setVerifyingPassword(true);
    setMessage('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setMessage('Could not verify your account.');
      setVerifyingPassword(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (error) {
      setMessage('Incorrect password.');
      setVerifyingPassword(false);
      return;
    }

    setShowEmail(true);
    setShowPasswordBox(false);
    setCurrentPassword('');
    setMessage('Email revealed successfully.');
    setVerifyingPassword(false);
  };

  /*
   * Change password
   */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    setMessage('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: verifyError } =
      await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

    if (verifyError) {
      setMessage('Current password is incorrect.');
      setChangingPassword(false);
      return;
    }

    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updateError) {
      setMessage(updateError.message);
    } else {
      setMessage('Password updated successfully.');

      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }

    setChangingPassword(false);
  };

  /*
   * Forgot password
   */
  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Email address is not available.');
      return;
    }

    setMessage('');
    setIsResettingPassword(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে ইমেইল চেক করুন।'
      );
    }

    setIsResettingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />

          <p className="text-slate-400">
            Loading profile...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-24 text-white">

      <div className="mx-auto w-full max-w-2xl">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Home
        </button>

        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">

            {/* Minecraft head */}
            <div className="relative h-20 w-20 shrink-0">

              {minecraftHeadUrl ? (
                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-purple-500/30 bg-black/50 shadow-lg shadow-purple-950/40">

                  <img
                    src={minecraftHeadUrl}
                    alt={
                      minecraftUsername
                        ? `${minecraftUsername} Minecraft head`
                        : 'Minecraft head'
                    }
                    className="h-full w-full object-cover pixelated"
                    onError={() => {
                      setMinecraftHeadUrl(null);
                    }}
                  />

                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">

                  <User className="h-10 w-10 text-white" />

                </div>
              )}

            </div>

            <div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                My Profile
              </h1>

              <p className="mt-1 text-slate-400">
                Manage your Butterfly Network profile
              </p>

            </div>

          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200">
              {message}
            </div>
          )}

          <div className="space-y-5">

            {/* Full Name */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
              />

            </div>

            {/* Website Username */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Website Username
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  @
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase()
                    )
                  }
                  maxLength={30}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-9 pr-4 text-white outline-none focus:border-purple-500"
                />

              </div>

              <p className="mt-2 text-xs text-slate-500">
                This is your Butterfly Network account username.
              </p>

            </div>

            {/* =================================================
                MINECRAFT USERNAME
            ================================================= */}
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5">

              <div className="mb-4 flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <Gamepad2 className="h-5 w-5 text-purple-400" />
                </div>

                <div>

                  <h2 className="font-semibold text-white">
                    Minecraft Account
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Link your Minecraft username to show your
                    Minecraft head on your profile.
                  </p>

                </div>

              </div>

              {/* Minecraft head preview */}
              {minecraftHeadUrl && minecraftUsername && (
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-white/10 bg-black/30 p-4">

                  <div className="h-16 w-16 overflow-hidden rounded-xl border border-purple-500/20 bg-black">

                    <img
                      src={minecraftHeadUrl}
                      alt={`${minecraftUsername} Minecraft head`}
                      className="h-full w-full object-cover"
                      onError={() => {
                        setMinecraftHeadUrl(null);
                        setMessage(
                          'Could not load the Minecraft head for this username.'
                        );
                      }}
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="text-xs text-slate-500">
                      Minecraft Username
                    </p>

                    <p className="mt-1 truncate font-semibold text-white">
                      {minecraftUsername}
                    </p>

                    <p className="mt-1 text-xs text-green-400">
                      Minecraft account linked
                    </p>

                  </div>

                </div>
              )}

              {/* Input */}
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Minecraft Username
              </label>

              <input
                type="text"
                value={minecraftUsername}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/[^A-Za-z0-9_]/g, '')
                    .slice(0, 16);

                  setMinecraftUsername(value);

                  if (value.length >= 3) {
                    setMinecraftHeadUrl(
                      getMinecraftHeadUrl(value)
                    );
                  } else {
                    setMinecraftHeadUrl(null);
                  }
                }}
                placeholder="Enter your Minecraft username"
                maxLength={16}
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-purple-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                3-16 characters. Letters, numbers and underscores only.
              </p>

              {/* Buttons */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={handleSaveMinecraftUsername}
                  disabled={savingMinecraft}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold transition-all hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {savingMinecraft ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="h-4 w-4" />
                      Save Minecraft Username
                    </>
                  )}

                </button>

                {minecraftUsername && (
                  <button
                    type="button"
                    onClick={handleRemoveMinecraftUsername}
                    disabled={savingMinecraft}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}

              </div>

            </div>

            {/* Bio */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Bio
              </label>

              <textarea
                value={bio}
                onChange={(e) =>
                  setBio(e.target.value)
                }
                placeholder="Tell us a little about yourself..."
                maxLength={150}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
              />

              <p className="mt-1 text-right text-xs text-slate-600">
                {bio.length}/150
              </p>

            </div>

            {/* Email */}
            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">

                <div className="flex min-w-0 items-center gap-3">

                  <Mail className="h-5 w-5 shrink-0 text-purple-400" />

                  <span className="truncate text-slate-200">
                    {showEmail
                      ? email
                      : getMaskedEmail(email)}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (showEmail) {
                      setShowEmail(false);
                    } else {
                      setShowPasswordBox(true);
                      setShowChangePassword(false);
                      setMessage('');
                    }
                  }}
                  className="shrink-0 text-purple-400 hover:text-purple-300"
                >
                  {showEmail ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

            {/* Save normal profile */}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />

              {saving
                ? 'Saving...'
                : 'Save Profile Changes'}
            </button>

          </div>

          {/* Email verification */}
          {showPasswordBox && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">

              <div className="mb-4 flex items-start gap-3">

                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />

                <div>

                  <h2 className="font-semibold text-white">
                    Verify your password
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter your current password to reveal
                    your full email.
                  </p>

                </div>

              </div>

              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="Current password"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
              />

              <button
                type="button"
                onClick={handleVerifyPassword}
                disabled={verifyingPassword}
                className="mt-3 w-full rounded-xl bg-purple-600 py-3 font-semibold transition-colors disabled:opacity-50"
              >
                {verifyingPassword
                  ? 'Verifying...'
                  : 'Verify & Show Email'}
              </button>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="mt-3 w-full text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
              >
                {isResettingPassword
                  ? 'Sending link...'
                  : 'Forgot password?'}
              </button>

            </div>
          )}

          {/* Account Security */}
          <div className="mt-8 border-t border-white/10 pt-8">

            <div className="mb-4 flex items-center gap-3">

              <KeyRound className="h-5 w-5 text-purple-400" />

              <div>

                <h2 className="font-semibold text-white">
                  Account Security
                </h2>

                <p className="text-xs text-slate-500">
                  Manage your password
                </p>

              </div>

            </div>

            {!showChangePassword ? (
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(true);
                  setShowPasswordBox(false);
                  setMessage('');
                  setCurrentPassword('');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold transition-colors"
              >
                <Lock className="h-4 w-4" />

                Change Password
              </button>
            ) : (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5">

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  placeholder="Current password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
                />

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="New password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
                />

                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) =>
                    setConfirmNewPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold transition-all disabled:opacity-50"
                >
                  {changingPassword
                    ? 'Updating...'
                    : 'Update Password'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowChangePassword(false)
                  }
                  className="w-full text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResettingPassword}
                  className="w-full text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
                >
                  {isResettingPassword
                    ? 'Sending link...'
                    : 'Forgot password?'}
                </button>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};