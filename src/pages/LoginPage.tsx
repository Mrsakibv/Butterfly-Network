import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    // =========================
    // SIGN UP
    // =========================
    if (isSignUp) {
      const cleanFullName = fullName.trim();
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      // Check password match
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        setLoading(false);
        return;
      }

      // Check full name
      if (cleanFullName.length < 2) {
        setMessage('Please enter your full name.');
        setLoading(false);
        return;
      }

      // Check username
      if (cleanUsername.length < 3) {
        setMessage('Username must be at least 3 characters.');
        setLoading(false);
        return;
      }

      // Username format
      if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
        setMessage(
          'Username can only contain lowercase letters, numbers, and underscores.'
        );
        setLoading(false);
        return;
      }

      // Create Supabase Auth account
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            username: cleanUsername,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      // If Supabase returned a logged-in session,
      // create the profile immediately.
      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: cleanFullName,
            username: cleanUsername,
          });

        if (profileError) {
          // Username already exists
          if (profileError.code === '23505') {
            setMessage(
              'This username is already taken. Please choose another username.'
            );
          } else {
            setMessage(profileError.message);
          }

          setLoading(false);
          return;
        }

        setMessage('Account created successfully!');

        setIsSignUp(false);

        setFullName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Email confirmation is probably enabled in Supabase.
        setMessage(
          'Account created! Please check your email to confirm your account.'
        );

        setPassword('');
        setConfirmPassword('');
      }
    }

    // =========================
    // LOGIN
    // =========================
    else {
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage('Login successful!');

      setPassword('');
      setConfirmPassword('');

      navigate('/');
    }

    setLoading(false);
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setMessage('');

    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Auth Card */}
        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">

            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/40">
              {isSignUp ? (
                <UserPlus className="w-7 h-7" />
              ) : (
                <LogIn className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-3xl font-bold">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>

            <p className="mt-2 text-slate-400">
              {isSignUp
                ? 'Create your Butterfly Network account'
                : 'Log in to your Butterfly Network account'}
            </p>

          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            {/* Username */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="username"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  3–30 characters: letters, numbers, and underscores
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Confirm Password */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            {/* Message */}
            {message && (
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3 text-sm text-purple-200">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Log In'}
            </button>

          </form>

          {/* Switch Login / Sign Up */}
          <div className="mt-6 text-center text-sm text-slate-400">

            {isSignUp
              ? 'Already have an account?'
              : "Don't have an account?"}

            <button
              type="button"
              onClick={handleModeSwitch}
              className="ml-2 text-purple-400 hover:text-purple-300 font-semibold"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};