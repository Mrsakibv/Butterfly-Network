import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const UpdatePasswordPage: React.FC = () => {
  const { navigate } = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // পেজ লোড হওয়ার সময়ই URL থেকে recovery code এক্সচেঞ্জ করে নেওয়া
  useEffect(() => {
    const handlePasswordRecovery = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage('Invalid or expired reset link. Please request a new one.');
        }
      }
    };

    handlePasswordRecovery();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setIsSuccess(true);
      setMessage('Your password has been updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        
        {!isSuccess && (
          <button
            onClick={() => navigate('/login')}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        )}

        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/40">
              {isSuccess ? (
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              ) : (
                <KeyRound className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-3xl font-bold">
              {isSuccess ? 'Success!' : 'Update Password'}
            </h1>
            <p className="mt-2 text-slate-400">
              {isSuccess 
                ? 'Redirecting you to login page...' 
                : 'Enter your new password below'}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {message && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          ) : (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-6 text-center text-green-400">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};