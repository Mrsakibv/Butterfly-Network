import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import {
  LogIn,
  UserPlus,
  ArrowLeft,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AtSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const particles = [
    { x: -125, y: -70, size: 3, delay: 0 },
    { x: 125, y: -55, size: 2, delay: 0.8 },
    { x: -145, y: 30, size: 2, delay: 1.5 },
    { x: 145, y: 40, size: 3, delay: 2.1 },
    { x: -85, y: 95, size: 2, delay: 2.7 },
    { x: 95, y: 90, size: 3, delay: 1.1 },
    { x: -55, y: -115, size: 2, delay: 3 },
    { x: 70, y: -105, size: 2, delay: 1.8 },
    { x: -165, y: -10, size: 2, delay: 2.4 },
    { x: 165, y: -5, size: 2, delay: 0.5 },
    { x: -110, y: -115, size: 3, delay: 3.2 },
    { x: 110, y: -105, size: 2, delay: 2.2 },
  ];

  const checkUsernameTaken = async (uname: string) => {
    if (!uname) return false;

    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', uname)
      .maybeSingle();

    return !!data;
  };

  const getUsernameSuggestions = async (baseName: string) => {
    const clean = baseName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    if (!clean) return [];

    const candidates = [
      `${clean}${Math.floor(100 + Math.random() * 900)}`,
      `${clean}_${Math.floor(10 + Math.random() * 90)}`,
      `the_${clean}`,
      `${clean}_official`,
    ];

    const available: string[] = [];

    for (const cand of candidates) {
      const isTaken = await checkUsernameTaken(cand);

      if (!isTaken) {
        available.push(cand);
      }

      if (available.length >= 3) break;
    }

    return available;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setMessage('');
    setSuggestions([]);
    setSuccess(false);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/update-password`,
      }
    );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      'Password reset link has been sent to your email address.'
    );

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForgotPassword) {
      return handleResetPassword(e);
    }

    setLoading(true);
    setMessage('');
    setSuggestions([]);
    setSuccess(false);

    // ==========================================
    // SIGN UP
    // ==========================================

    if (isSignUp) {
      const cleanFullName = fullName.trim();
      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanFullName) {
        setMessage('Please enter your full name.');
        setLoading(false);
        return;
      }

      if (!cleanUsername) {
        setMessage('Please choose a username.');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setMessage('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        setLoading(false);
        return;
      }

      // Check username
      const isTaken = await checkUsernameTaken(cleanUsername);

      if (isTaken) {
        const availableSuggestions =
          await getUsernameSuggestions(cleanUsername);

        setSuggestions(availableSuggestions);
        setMessage(
          'This username is already taken. Try one of the suggestions below.'
        );

        setLoading(false);
        return;
      }

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

        if (profileError) {
          if (profileError.code === '23505') {
            const availableSuggestions =
              await getUsernameSuggestions(cleanUsername);

            setSuggestions(availableSuggestions);
            setMessage('This username is already taken.');
            setLoading(false);
            return;
          }

          setMessage(profileError.message);
          setLoading(false);
          return;
        }

        setSuccess(true);
        setMessage('Your account has been created successfully.');

        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setSuccess(true);
        setMessage(
          'Account created! Please check your email to confirm your account.'
        );
      }
    }

    // ==========================================
    // LOGIN
    // ==========================================

    else {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        setMessage('Please enter your email address.');
        setLoading(false);
        return;
      }

      if (!password) {
        setMessage('Please enter your password.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setMessage('Login successful!');

      setTimeout(() => {
        navigate('/');
      }, 700);
    }

    setLoading(false);
  };

  const passwordStrength =
    password.length >= 12
      ? 4
      : password.length >= 9
      ? 3
      : password.length >= 6
      ? 2
      : password.length > 0
      ? 1
      : 0;

  const resetView = () => {
    setIsForgotPassword(false);
    setIsSignUp(false);
    setMessage('');
    setSuggestions([]);
    setSuccess(false);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030305] text-white flex items-center justify-center px-4 py-16">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0">

        {/* Main purple atmosphere */}
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.16, 0.3, 0.16],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-purple-700/20 blur-[150px]"
        />

        {/* Secondary atmosphere */}
        <motion.div
          animate={{
            x: [-80, 80, -80],
            y: [40, -30, 40],
            opacity: [0.07, 0.18, 0.07],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-[5%] bottom-[-250px] w-[550px] h-[550px] rounded-full bg-indigo-700/20 blur-[150px]"
        />

        {/* Top atmosphere */}
        <motion.div
          animate={{
            x: [50, -50, 50],
            opacity: [0.06, 0.15, 0.06],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute right-[5%] top-[-250px] w-[450px] h-[450px] rounded-full bg-violet-600/20 blur-[130px]"
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '55px 55px',
          }}
        />
      </div>

      {/* =========================================================
          BACK BUTTON
      ========================================================= */}

      <motion.button
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </motion.button>

      {/* =========================================================
          MAIN
      ========================================================= */}

      <div className="relative z-10 w-full max-w-md">

        {/* =======================================================
            LOGO AREA
        ======================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: -20,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative mx-auto mb-5 w-[220px] h-[205px] flex items-center justify-center"
        >

          {/* Glow */}
          <motion.div
            animate={{
              scale: [0.85, 1.08, 0.85],
              opacity: [0.2, 0.42, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-[180px] h-[180px] rounded-full bg-purple-600/20 blur-[55px]"
          />

          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[200px] h-[200px] rounded-full border border-purple-500/20"
          >
            <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-14 h-[3px] rounded-full bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.9)]" />

            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-9 h-[2px] rounded-full bg-violet-400/60 blur-[1px]" />
          </motion.div>

          {/* Second ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[160px] h-[160px] rounded-full border border-violet-400/20 border-dashed"
          >
            <div className="absolute top-1/2 -right-[3px] -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)]" />

            <div className="absolute top-1/2 -left-[3px] -translate-y-1/2 w-[4px] h-[4px] rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,1)]" />
          </motion.div>

          {/* Particles */}
          {particles.map((particle, index) => (
            <motion.span
              key={index}
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
              }}
              animate={{
                x: [
                  particle.x,
                  particle.x + (index % 2 === 0 ? 12 : -12),
                  particle.x,
                ],
                y: [
                  particle.y,
                  particle.y - 15,
                  particle.y,
                ],
                opacity: [0.15, 1, 0.15],
                scale: [0.7, 1.25, 0.7],
              }}
              transition={{
                duration: 3.5 + (index % 4),
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full bg-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.9)]"
              style={{
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}

          {/* Orbiting particle */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-[215px] h-[215px] rounded-full"
          >
            <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-purple-300 shadow-[0_0_18px_rgba(216,180,254,1)]" />
          </motion.div>

          {/* Logo */}
          <motion.div
            animate={{
              y: [-6, 6, -6],
              rotate: [-1, 1, -1],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10"
          >
            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 10px rgba(139,92,246,0.35))',
                  'drop-shadow(0 0 28px rgba(139,92,246,0.75))',
                  'drop-shadow(0 0 10px rgba(139,92,246,0.35))',
                ],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <img
                src="/logo.png"
                alt="Butterfly Network"
                className="w-[140px] h-[140px] object-contain"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* =======================================================
            CARD
        ======================================================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 35,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="rounded-3xl border border-purple-500/20 bg-[#0b0b0f]/85 backdrop-blur-2xl p-7 sm:p-9 shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
        >

          <AnimatePresence mode="wait">

            {/* ===================================================
                SUCCESS
            =================================================== */}

            {success ? (
              <motion.div
                key="success"
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{
                    scale: 0,
                    rotate: -30,
                  }}
                  animate={{
                    scale: 1,
                    rotate: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 12,
                  }}
                  className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.15)]"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-bold">
                  {isForgotPassword
                    ? 'Check Your Email'
                    : isSignUp
                    ? 'Account Created!'
                    : 'Welcome Back!'}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {message}
                </p>

                {isForgotPassword && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetView}
                    className="mt-7 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-950/40"
                  >
                    Back to Login
                  </motion.button>
                )}
              </motion.div>
            ) : (

              /* =================================================
                 FORM
              ================================================= */

              <motion.div
                key={`${isForgotPassword}-${isSignUp}`}
                initial={{
                  opacity: 0,
                  x: 15,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -15,
                }}
              >

                {/* Header */}
                <div className="text-center mb-8">

                  <div className="inline-flex items-center justify-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5">
                    {isForgotPassword ? (
                      <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    ) : isSignUp ? (
                      <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    )}

                    <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-300">
                      {isForgotPassword
                        ? 'Account Recovery'
                        : isSignUp
                        ? 'Join Butterfly Network'
                        : 'Secure Login'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {isForgotPassword
                      ? 'Reset Password'
                      : isSignUp
                      ? 'Create Account'
                      : 'Welcome Back'}
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {isForgotPassword
                      ? 'Enter your email and we will send you a secure reset link.'
                      : isSignUp
                      ? 'Create your Butterfly Network account.'
                      : 'Log in to continue to your account.'}
                  </p>
                </div>

                {/* Message */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -10,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        height: 'auto',
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                        height: 0,
                      }}
                      className="mb-5 overflow-hidden"
                    >
                      <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                        <AlertCircle className="w-5 h-5 shrink-0" />

                        <div className="space-y-2">
                          <p>{message}</p>

                          {suggestions.length > 0 && (
                            <div className="pt-2 border-t border-red-500/10">
                              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                Suggested usernames:
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* Full Name */}
                  {isSignUp && !isForgotPassword && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>

                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) =>
                            setFullName(e.target.value)
                          }
                          placeholder="Your full name"
                          disabled={loading}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  )}

                  {/* Username */}
                  {isSignUp && !isForgotPassword && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Username
                      </label>

                      <div className="relative">
                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                        <input
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            setSuggestions([]);
                            setMessage('');
                          }}
                          placeholder="Choose a username"
                          disabled={loading}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        placeholder="you@example.com"
                        disabled={loading}
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  {!isForgotPassword && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-300">
                          Password
                        </label>

                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setMessage('');
                              setSuggestions([]);
                              setSuccess(false);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) =>
                            setPassword(e.target.value)
                          }
                          placeholder="Enter your password"
                          disabled={loading}
                          required
                          minLength={6}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 pr-12 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Password strength */}
                      {isSignUp && password.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((item) => (
                              <motion.div
                                key={item}
                                animate={{
                                  opacity:
                                    item <= passwordStrength
                                      ? 1
                                      : 0.15,
                                }}
                                className="h-1 flex-1 rounded-full bg-purple-500"
                              />
                            ))}
                          </div>

                          <p className="text-[11px] text-slate-600">
                            Use at least 6 characters. A longer password
                            is recommended.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm Password */}
                  {isSignUp && !isForgotPassword && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Confirm Password
                      </label>

                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />

                        <input
                          type={
                            showConfirmPassword
                              ? 'text'
                              : 'password'
                          }
                          value={confirmPassword}
                          onChange={(e) =>
                            setConfirmPassword(e.target.value)
                          }
                          placeholder="Confirm your password"
                          disabled={loading}
                          required
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-12 py-3.5 pr-12 text-white placeholder:text-slate-600 outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 disabled:opacity-60"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              !showConfirmPassword
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button
                    whileHover={{
                      scale: loading ? 1 : 1.01,
                    }}
                    whileTap={{
                      scale: loading ? 1 : 0.98,
                    }}
                    type="submit"
                    disabled={loading}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-950/40 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {/* Light sweep */}
                    {!loading && (
                      <motion.div
                        animate={{
                          x: ['-130%', '130%'],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          repeatDelay: 1.8,
                          ease: 'linear',
                        }}
                        className="absolute inset-y-0 w-20 bg-white/15 skew-x-12 blur-sm"
                      />
                    )}

                    <span className="relative z-10 flex items-center justify-center gap-2">

                      {loading ? (
                        <>
                          <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                          {isForgotPassword
                            ? 'Sending Reset Link...'
                            : isSignUp
                            ? 'Creating Account...'
                            : 'Signing In...'}
                        </>
                      ) : (
                        <>
                          {isForgotPassword ? (
                            <>
                              <KeyRound className="w-4 h-4" />
                              Send Reset Link
                            </>
                          ) : isSignUp ? (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Create Account
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4" />
                              Log In
                            </>
                          )}
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* Bottom navigation */}
                <div className="mt-6 text-center text-sm text-slate-400">

                  {isForgotPassword ? (
                    <button
                      onClick={() => {
                        setIsForgotPassword(false);
                        setMessage('');
                        setSuggestions([]);
                      }}
                      className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                    >
                      ← Back to Login
                    </button>
                  ) : (
                    <>
                      {isSignUp
                        ? 'Already have an account?'
                        : "Don't have an account?"}

                      <button
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setMessage('');
                          setSuggestions([]);
                          setPassword('');
                          setConfirmPassword('');
                          setSuccess(false);
                        }}
                        className="ml-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                      >
                        {isSignUp ? 'Log In' : 'Sign Up'}
                      </button>
                    </>
                  )}
                </div>

                {/* Security text */}
                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Securely handled by Supabase
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-[11px] text-slate-700"
        >
          Butterfly Network • Minecraft Server Network
        </motion.p>

      </div>
    </div>
  );
};