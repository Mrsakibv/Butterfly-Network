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
} from 'lucide-react';

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  created_at: string | null;
}

export const ProfilePage: React.FC = () => {
  const { navigate } = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordBox, setShowPasswordBox] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage('');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/login');
        return;
      }
      setEmail(user.email ?? '');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, bio, created_at')
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
      setBio(data.bio ?? '');
      setLoading(false);
    };
    loadProfile();
  }, [navigate]);

  const getMaskedEmail = (value: string) => {
    const atIndex = value.indexOf('@');
    if (atIndex <= 0) return value;
    const localPart = value.slice(0, atIndex);
    const domain = value.slice(atIndex);
    return localPart.length <= 2 ? `${localPart[0] ?? ''}****${domain}` : `${localPart.slice(0, 2)}****${domain}`;
  };

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
      .update({ full_name: cleanFullName, username: cleanUsername, bio: bio.trim() || null })
      .eq('id', profile.id)
      .select().single();
    if (error) {
      setMessage(error.code === '23505' ? 'This username is already taken.' : error.message);
      setSaving(false);
      return;
    }
    setProfile(data);
    setMessage('Profile updated successfully.');
    setSaving(false);
  };

  const handleVerifyPassword = async () => {
    if (!currentPassword) {
      setMessage('Please enter your current password.');
      return;
    }
    setVerifyingPassword(true);
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setMessage('Could not verify your account.');
      setVerifyingPassword(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
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
    const { data: { user } } = await supabase.auth.getUser();
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: currentPassword });
    if (verifyError) {
      setMessage('Current password is incorrect.');
      setChangingPassword(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
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

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Email address is not available.');
      return;
    }
    setMessage('');
    setIsResettingPassword(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে ইমেইল চেক করুন।');
    }
    setIsResettingPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-24">
      <div className="w-full max-w-2xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
            <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/40">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
              <p className="mt-1 text-slate-400">Manage your Butterfly Network profile</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3 text-sm text-purple-200">
              {message}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">@</span>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} maxLength={30} className="w-full rounded-xl bg-black/40 border border-white/10 pl-9 pr-4 py-3 text-white outline-none focus:border-purple-500" />
              </div>
            </div>

            {/* Bio Field Added Here */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Tell us a little about yourself..." 
                maxLength={150}
                rows={3}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500 resize-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="rounded-xl bg-black/40 border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                  <span className="text-slate-200 truncate">{showEmail ? email : getMaskedEmail(email)}</span>
                </div>
                <button type="button" onClick={() => { if (showEmail) setShowEmail(false); else { setShowPasswordBox(true); setShowChangePassword(false); setMessage(''); } }} className="shrink-0 text-purple-400 hover:text-purple-300">
                  {showEmail ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="button" onClick={handleSaveProfile} disabled={saving} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold transition-all disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {showPasswordBox && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-start gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-semibold text-white">Verify your password</h2>
                  <p className="mt-1 text-xs text-slate-500">Enter your current password to reveal your full email.</p>
                </div>
              </div>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500" />
              <button type="button" onClick={handleVerifyPassword} disabled={verifyingPassword} className="mt-3 w-full rounded-xl bg-purple-600 py-3 font-semibold transition-colors disabled:opacity-50">
                {verifyingPassword ? 'Verifying...' : 'Verify & Show Email'}
              </button>
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                disabled={isResettingPassword}
                className="mt-3 w-full text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
              >
                {isResettingPassword ? 'Sending link...' : 'Forgot password?'}
              </button>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="font-semibold text-white">Account Security</h2>
                <p className="text-xs text-slate-500">Manage your password</p>
              </div>
            </div>

            {!showChangePassword ? (
              <button type="button" onClick={() => { setShowChangePassword(true); setShowPasswordBox(false); setMessage(''); setCurrentPassword(''); }} className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold transition-colors">
                <Lock className="w-4 h-4" /> Change Password
              </button>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500" />
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Confirm new password" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500" />
                <button type="button" onClick={handleChangePassword} disabled={changingPassword} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold transition-all disabled:opacity-50">
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button type="button" onClick={() => setShowChangePassword(false)} className="w-full text-sm text-slate-400 hover:text-white">Cancel</button>
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  disabled={isResettingPassword}
                  className="w-full text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50"
                >
                  {isResettingPassword ? 'Sending link...' : 'Forgot password?'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};