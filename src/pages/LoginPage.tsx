import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import { LogIn, UserPlus, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]); // ইউজারনেম সাজেশনের জন্য

  // ইউজারনেম ফাঁকা আছে কিনা চেক করা
  const checkUsernameTaken = async (uname: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', uname)
      .maybeSingle();
    return !!data;
  };

  // ডুপ্লিকেট হলে ২-৩টি ইউনিক সাজেশন তৈরি করা
  const getUsernameSuggestions = async (baseName: string) => {
    const clean = baseName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const candidates = [
      `${clean}${Math.floor(100 + Math.random() * 900)}`,
      `${clean}_${Math.floor(10 + Math.random() * 90)}`,
      `the_${clean}`,
      `${clean}_official`,
    ];

    const available: string[] = [];
    for (const cand of candidates) {
      const isTaken = await checkUsernameTaken(cand);
      if (!isTaken) available.push(cand);
      if (available.length >= 3) break;
    }
    return available;
  };

  // পাসওয়ার্ড রিসেট ইমেইল পাঠানোর ফাংশন
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuggestions([]);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) return handleResetPassword(e);

    setLoading(true);
    setMessage('');
    setSuggestions([]);

    // SIGN UP LOGIC
    if (isSignUp) {
      const cleanFullName = fullName.trim();
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        setLoading(false);
        return;
      }

      // ১. সাইন-আপ করার আগেই ইউজারনেম চেক করা
      const isTaken = await checkUsernameTaken(cleanUsername);
      if (isTaken) {
        const availableSuggestions = await getUsernameSuggestions(cleanUsername);
        setSuggestions(availableSuggestions);
        setMessage('This username is already taken. Try one of the suggestions below:');
        setLoading(false);
        return;
      }

      // ২. ইউজারনেম খালি থাকলে সাইন-আপ প্রসেস শুরু
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

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: cleanFullName,
            username: cleanUsername,
          });

        if (profileError && profileError.code === '23505') {
          const availableSuggestions = await getUsernameSuggestions(cleanUsername);
          setSuggestions(availableSuggestions);
          setMessage('This username is already taken.');
          setLoading(false);
          return;
        }

        setMessage('Account created successfully!');
        setIsSignUp(false);
      } else {
        setMessage('Account created! Please check your email to confirm.');
      }
    }
    // LOGIN LOGIC
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
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.04] backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/40">
              {isForgotPassword ? <KeyRound className="w-7 h-7" /> : isSignUp ? <UserPlus className="w-7 h-7" /> : <LogIn className="w-7 h-7" />}
            </div>

            <h1 className="text-3xl font-bold">
              {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="mt-2 text-slate-400">
              {isForgotPassword 
                ? 'Enter your email to get a reset link' 
                : isSignUp ? 'Create your Butterfly Network account' : 'Log in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && !isForgotPassword && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text" value={username} onChange={(e) => { setUsername(e.target.value); setSuggestions([]); }}
                    placeholder="Choose a username" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  {!isSignUp && (
                    <button 
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setMessage(''); setSuggestions([]); }}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500"
                />
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" required className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-purple-500"
                />
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3 text-sm text-purple-200 space-y-2">
                <p>{message}</p>
                {/* ইউজারনেম সাজেশন বাটনসমূহ */}
                {suggestions.length > 0 && (
                  <div className="pt-2 border-t border-purple-500/20">
                    <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Suggested usernames:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setUsername(sug);
                            setSuggestions([]);
                            setMessage('');
                          }}
                          className="text-xs bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 border border-purple-500/30 rounded-lg px-2.5 py-1 transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isForgotPassword ? (
              <button onClick={() => setIsForgotPassword(false)} className="text-purple-400 hover:text-purple-300 font-semibold">
                Back to Login
              </button>
            ) : (
              <>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setSuggestions([]); }}
                  className="ml-2 text-purple-400 hover:text-purple-300 font-semibold"
                >
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};