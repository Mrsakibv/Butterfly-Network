import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  Gamepad2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Square,
  Ticket,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from '../hooks/useRouter';
type AfkSettings = {
  enabled: boolean;
  minutes_per_reward: number;
  coins_per_reward: number;
  daily_coin_cap: number;
  missions_enabled: boolean;
  minigames_enabled: boolean;
  promo_codes_enabled: boolean;
};
type AfkMission = {
  id: string;
  title: string;
  description: string;
  mission_type: 'afk_minutes' | 'minigame_wins' | 'games_played' | 'daily_visit';
  target: number;
  reward_coins: number;
  starts_at: string | null;
  ends_at: string | null;
};
type SessionRpcResult = {
  success?: boolean;
  session_id?: string;
  status?: string;
  reason?: string;
  active_seconds?: number;
  credited_seconds?: number;
};
type ClaimRpcResult = {
  success?: boolean;
  mission_id?: string;
  reward_coins?: number;
  new_balance?: number;
  progress?: number;
  target?: number;
};
const cardClass =
  'rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6';
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50';
function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? error);
  }
  return String(error);
}
function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

type MiniGameConfig = { enabled: boolean; reward_coins: number; cooldown_minutes: number; daily_limit: number; difficulty?: string };
const GAME_DEFAULTS: Record<string, MiniGameConfig> = {
  tic_tac_toe: { enabled: true, reward_coins: 10, cooldown_minutes: 1, daily_limit: 30 },
  rock_paper_scissors: { enabled: true, reward_coins: 5, cooldown_minutes: 1, daily_limit: 30 },
  number_guessing: { enabled: true, reward_coins: 10, cooldown_minutes: 2, daily_limit: 15 },
  memory_match: { enabled: true, reward_coins: 25, cooldown_minutes: 5, daily_limit: 10 },
  reaction_challenge: { enabled: true, reward_coins: 15, cooldown_minutes: 2, daily_limit: 20 },
  math_challenge: { enabled: true, reward_coins: 10, cooldown_minutes: 1, daily_limit: 30 },
  higher_or_lower: { enabled: true, reward_coins: 10, cooldown_minutes: 2, daily_limit: 15 },
  word_scramble: { enabled: true, reward_coins: 15, cooldown_minutes: 2, daily_limit: 20 },
};
const GAME_TITLES: Record<string, string> = {
  tic_tac_toe: 'Tic-Tac-Toe', rock_paper_scissors: 'Rock Paper Scissors',
  number_guessing: 'Number Guessing', memory_match: 'Memory Match',
  reaction_challenge: 'Reaction Challenge', math_challenge: 'Math Challenge',
  higher_or_lower: 'Higher or Lower', word_scramble: 'Word Scramble',
};
const GAME_WORDS = ['BUTTERFLY', 'DIAMOND', 'CREEPER', 'PICKAXE', 'NETHER', 'DRAGON', 'EMERALD', 'REDSTONE'];
function AfkMiniGames({ enabled, onBalance }: { enabled: boolean; onBalance: (balance?: number) => void }) {
  const [configs, setConfigs] = useState<Record<string, MiniGameConfig>>(GAME_DEFAULTS);
  const [activeGame, setActiveGame] = useState('tic_tac_toe');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [guess, setGuess] = useState('');
  const [numberTarget, setNumberTarget] = useState(() => 1 + Math.floor(Math.random() * 10));
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathQuestion, setMathQuestion] = useState(() => makeMathQuestion());
  const [word, setWord] = useState(() => GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)]);
  const [wordAnswer, setWordAnswer] = useState('');
  const [higherNumber, setHigherNumber] = useState(() => 1 + Math.floor(Math.random() * 9));
  const [reactionState, setReactionState] = useState<'idle'|'wait'|'go'|'done'>('idle');
  const [reactionStart, setReactionStart] = useState(0);
  const [reactionResult, setReactionResult] = useState<number|null>(null);
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [memoryCards, setMemoryCards] = useState(() => shuffleMemory());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [lastRpsResult, setLastRpsResult] = useState('');
  const [higherCorrect, setHigherCorrect] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('afk_admin_config').select('config_value').eq('config_key','minigames').maybeSingle();
      if (!cancelled && !error && data?.config_value) setConfigs({ ...GAME_DEFAULTS, ...(data.config_value as Record<string, MiniGameConfig>) });
    })();
    return () => { cancelled = true; };
  }, []);
  function finishGame(key: string, won: boolean) {
    if (!won) { setNotice('Not quite! Try again — no Coins were claimed.'); return; }
    const cfg = configs[key] ?? GAME_DEFAULTS[key];
    const now = Date.now();
    if (!enabled) { setNotice('Mini-games are disabled by an admin.'); return; }
    if (!cfg.enabled) { setNotice('This game is disabled by an admin.'); return; }
    if ((cooldowns[key] ?? 0) > now) { setNotice(`Please wait ${Math.ceil(((cooldowns[key] ?? 0)-now)/1000)} seconds before playing again.`); return; }
    if ((dailyCounts[key] ?? 0) >= cfg.daily_limit) { setNotice('You have reached today’s play limit for this game.'); return; }
    setBusy(true); setNotice('');
    // The server RPC applies reward, cooldown and daily-limit rules; no client-side wallet update is trusted.
    void supabase.rpc('claim_afk_minigame_reward', { p_game_key: key }).then(({data,error}) => {
      if (error) {
        setNotice(`Game reward could not be claimed: ${error.message}. Check the AFK mini-game SQL migration.`);
        setBusy(false);
        return;
      }
      const result = data as {success?: boolean; reason?: string; reward_coins?: number; new_balance?: number} | null;
      if (!result?.success) {
        setNotice(`Game reward could not be claimed: ${result?.reason || 'Server did not approve this reward.'}`);
        setBusy(false);
        return;
      }
      setCooldowns(c => ({...c, [key]: Date.now() + cfg.cooldown_minutes * 60_000}));
      setDailyCounts(c => ({...c, [key]: (c[key] ?? 0) + 1}));
      setNotice(`You won! +${result.reward_coins ?? cfg.reward_coins} Butterfly Coins.`);
      onBalance(result.new_balance);
      setBusy(false);
    }, (e: unknown) => {
      setNotice(`Game reward could not be claimed: ${e instanceof Error ? e.message : String(e)}. Check the AFK mini-game SQL migration.`);
      setBusy(false);
    });
  }
  const cfg = configs[activeGame] ?? GAME_DEFAULTS[activeGame];
  const gameButton = 'rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500/20 disabled:opacity-40';
  const primary = 'rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-40';
  const startReaction = () => {
    setReactionState('wait'); setReactionResult(null);
    window.setTimeout(() => { setReactionState(current => { if (current !== 'wait') return current; setReactionStart(Date.now()); return 'go'; }); }, 1000 + Math.random()*2500);
  };
  const handleReaction = () => {
    if (reactionState === 'wait') { setReactionState('done'); setReactionResult(-1); }
    else if (reactionState === 'go') { const ms = Date.now()-reactionStart; setReactionState('done'); setReactionResult(ms); finishGame('reaction_challenge', ms < 650); }
  };
  const resetMemory = () => { setMemoryCards(shuffleMemory()); setFlipped([]); setMatched([]); setMemoryMoves(0); };
  const flipMemory = (idx: number) => {
    if (flipped.includes(idx) || matched.includes(idx) || flipped.length >= 2) return;
    const next = [...flipped, idx]; setFlipped(next);
    if (next.length === 2) {
      setMemoryMoves(m => m+1);
      if (memoryCards[next[0]] === memoryCards[next[1]]) {
        const pairs = [...matched, ...next]; setMatched(pairs); setFlipped([]);
        if (pairs.length === memoryCards.length) finishGame('memory_match', true);
      } else window.setTimeout(() => setFlipped([]), 700);
    }
  };
  const playTic = (idx: number) => {
    if (board[idx] || ticWinner(board) || busy) return;
    const human = [...board]; human[idx] = 'X';
    if (ticWinner(human)) { setBoard(human); finishGame('tic_tac_toe', true); return; }
    const available = human.map((v,i)=>v ? -1 : i).filter(i=>i>=0);
    if (!available.length) { setBoard(human); return; }
    const bot = [...human]; bot[available[Math.floor(Math.random()*available.length)]] = 'O';
    setBoard(bot);
    if (ticWinner(bot)==='O' && bot.every(Boolean)) setNotice('Bot won this round. Start a new game.');
  };
  const chooseRps = (pick: string) => {
    const options = ['Rock','Paper','Scissors'];
    const bot = options[Math.floor(Math.random()*3)];
    const won = (pick==='Rock'&&bot==='Scissors')||(pick==='Paper'&&bot==='Rock')||(pick==='Scissors'&&bot==='Paper');
    const draw = pick===bot;
    setLastRpsResult(`You: ${pick} · Bot: ${bot} — ${draw?'Draw':won?'You win!':'Bot wins'}`);
    if (won) finishGame('rock_paper_scissors', true);
  };
  const submitGuess = () => { const n=Number(guess); if(n===numberTarget){finishGame('number_guessing',true);setGuess('');setNumberTarget(1+Math.floor(Math.random()*10));} else setNotice(n<numberTarget?'Too low — try again.':'Too high — try again.'); };
  const submitMath = () => { const ok=Number(mathAnswer)===mathQuestion.answer; if(ok){finishGame('math_challenge',true);setMathQuestion(makeMathQuestion());setMathAnswer('');}else setNotice('Incorrect answer. Try again.'); };
  const submitWord = () => { if(wordAnswer.trim().toUpperCase()===word){finishGame('word_scramble',true);const next=GAME_WORDS[Math.floor(Math.random()*GAME_WORDS.length)];setWord(next);setWordAnswer('');}else setNotice('Not the right word yet.'); };
  const guessHigher = (choice: 'higher'|'lower') => { const next=1+Math.floor(Math.random()*9); const won=(choice==='higher'&&next>higherNumber)||(choice==='lower'&&next<higherNumber); setHigherNumber(next); if(won){const score=higherCorrect+1;setHigherCorrect(score);if(score>=3){finishGame('higher_or_lower',true);setHigherCorrect(0);}}else{setHigherCorrect(0);setNotice(`New number: ${next}. Streak reset.`);} };
  const scramble = (w:string) => w.split('').sort(()=>Math.random()-.5).join('');
  return <section className="space-y-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black">Mini-games</h2><p className="mt-1 text-sm text-slate-400">Play against the bot and complete quick challenges to earn Coins.</p></div><span className="text-xs text-slate-500">Rewards are confirmed by Supabase</span></div>
    {!enabled ? <div className={cardClass}>Mini-games are disabled by an admin.</div> : <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.keys(GAME_TITLES).map(key=><button key={key} className={`${gameButton} ${activeGame===key?'border-purple-400/50 bg-purple-500/20':''}`} onClick={()=>{setActiveGame(key);setNotice('');}} disabled={!(configs[key]??GAME_DEFAULTS[key]).enabled}>{GAME_TITLES[key]}</button>)}</div>
      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-xl font-bold">{GAME_TITLES[activeGame]}</h3><span className="rounded-lg bg-amber-400/10 px-3 py-1.5 text-sm font-bold text-amber-200">+{cfg.reward_coins} Coins</span></div>
        {!cfg.enabled ? <p className="text-slate-400">This game is currently disabled.</p> : <div className="space-y-4">
          {activeGame==='tic_tac_toe' && <><p className="text-sm text-slate-400">You are X. Beat the bot to win.</p><div className="grid max-w-xs grid-cols-3 gap-2">{board.map((v,i)=><button key={i} className="aspect-square rounded-xl border border-white/10 bg-black/20 text-3xl font-black" onClick={()=>playTic(i)}>{v}</button>)}</div><button className={gameButton} onClick={()=>setBoard(Array(9).fill(''))}>New round</button></>}
          {activeGame==='rock_paper_scissors' && <><div className="flex flex-wrap gap-2">{['Rock','Paper','Scissors'].map(x=><button className={primary} key={x} onClick={()=>chooseRps(x)}>{x}</button>)}</div><p className="text-sm text-slate-300">{lastRpsResult}</p></>}
          {activeGame==='number_guessing' && <><p className="text-sm text-slate-400">Guess the secret number from 1 to 10.</p><div className="flex gap-2"><input className="w-32 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" type="number" min="1" max="10" value={guess} onChange={e=>setGuess(e.target.value)}/><button className={primary} onClick={submitGuess}>Guess</button></div></>}
          {activeGame==='memory_match' && <><p className="text-sm text-slate-400">Find all matching pairs. Moves: {memoryMoves}</p><div className="grid max-w-lg grid-cols-4 gap-2">{memoryCards.map((v,i)=><button key={i} className="aspect-square rounded-xl border border-white/10 bg-black/20 text-xl font-black" onClick={()=>flipMemory(i)}>{flipped.includes(i)||matched.includes(i)?v:'?'}</button>)}</div><button className={gameButton} onClick={resetMemory}>Reset board</button></>}
          {activeGame==='reaction_challenge' && <><p className="text-sm text-slate-400">Tap the button as soon as it turns green. Under 650ms wins.</p><button className={`${primary} min-h-20 w-full max-w-md ${reactionState==='go'?'bg-emerald-600':''}`} onClick={reactionState==='idle'||reactionState==='done'?startReaction:handleReaction}>{reactionState==='idle'?'Start reaction test':reactionState==='wait'?'Wait for green…':reactionState==='go'?'CLICK NOW!':reactionResult===-1?'Too early — try again':`${reactionResult} ms · Try again`}</button></>}
          {activeGame==='math_challenge' && <><p className="text-lg font-bold">{mathQuestion.label} = ?</p><div className="flex gap-2"><input className="w-32 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" type="number" value={mathAnswer} onChange={e=>setMathAnswer(e.target.value)}/><button className={primary} onClick={submitMath}>Submit</button></div></>}
          {activeGame==='higher_or_lower' && <><p className="text-sm text-slate-400">Current number: <b className="text-white">{higherNumber}</b> · streak {higherCorrect}/3</p><div className="flex gap-2"><button className={primary} onClick={()=>guessHigher('higher')}>Higher</button><button className={primary} onClick={()=>guessHigher('lower')}>Lower</button></div></>}
          {activeGame==='word_scramble' && <><p className="text-sm text-slate-400">Unscramble: <b className="text-white tracking-widest">{scramble(word)}</b></p><div className="flex gap-2"><input className="w-56 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white uppercase" value={wordAnswer} onChange={e=>setWordAnswer(e.target.value)}/><button className={primary} onClick={submitWord}>Check</button></div></>}
        </div>}
      </div>
    </>}
    {notice && <p role="status" className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-3 text-sm text-purple-100">{notice}</p>}
  </section>;
}
function makeMathQuestion() { const a=2+Math.floor(Math.random()*15), b=2+Math.floor(Math.random()*12); return {label:`${a} × ${b}`, answer:a*b}; }
function shuffleMemory() { const pairs=['🍀','💎','🦋','⚡','🌙','🔥']; return [...pairs,...pairs].sort(()=>Math.random()-.5); }
function ticWinner(b:string[]) { const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(const [a,c,d] of lines) if(b[a]&&b[a]===b[c]&&b[a]===b[d]) return b[a]; return ''; }

export const AfkRewardsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const { navigate } = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [settings, setSettings] = useState<AfkSettings | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [missions, setMissions] = useState<AfkMission[]>([]);
  const [claimedMissionIds, setClaimedMissionIds] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);
  const heartbeatBusy = useRef(false);
  // Always return unauthenticated visitors to the normal login page.
  useEffect(() => {
    if (authLoading || userId) return;
    sessionStorage.setItem('redirectAfterLogin', '/afk');
    navigate('/login');
  }, [authLoading, userId, navigate]);
  const loadWallet = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('afk_user_wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    setWalletBalance(Number(data?.balance ?? 0));
  }, [userId]);
  const loadPageData = useCallback(async () => {
    if (!userId) return;
    setPageLoading(true);
    setNotice('');
    setNoticeIsError(false);
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('afk_settings')
        .select(
          'enabled, minutes_per_reward, coins_per_reward, daily_coin_cap, missions_enabled, minigames_enabled, promo_codes_enabled'
        )
        .eq('id', 'global')
        .maybeSingle();
      if (settingsError) throw settingsError;
      if (!settingsData) {
        throw new Error(
          'AFK settings পাওয়া যায়নি। Step 3-এর SQL সফলভাবে run হয়েছে কি না যাচাই করো।'
        );
      }
      setSettings(settingsData as AfkSettings);
      const { data: missionData, error: missionsError } = await supabase
        .from('afk_daily_missions')
        .select(
          'id, title, description, mission_type, target, reward_coins, starts_at, ends_at'
        )
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (missionsError) throw missionsError;
      setMissions((missionData ?? []) as AfkMission[]);
      const todayUtc = new Date().toISOString().slice(0, 10);
      const { data: claimData, error: claimsError } = await supabase
        .from('afk_mission_claims')
        .select('mission_id')
        .eq('user_id', userId)
        .eq('claim_date', todayUtc);
      if (claimsError) throw claimsError;
      setClaimedMissionIds((claimData ?? []).map((claim) => claim.mission_id));
      await loadWallet();
    } catch (error) {
      console.error('AFK page load failed:', error);
      setNotice(errorMessage(error));
      setNoticeIsError(true);
    } finally {
      setPageLoading(false);
    }
  }, [loadWallet, userId]);

  // Load the page data after authentication is ready. Without this effect,
  // pageLoading stays true forever and the AFK screen never leaves its spinner.
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setPageLoading(false);
      return;
    }
    void loadPageData();
  }, [authLoading, userId, loadPageData]);

  useEffect(() => {
    if (authLoading || !userId) return;

    // Keep the AFK enabled flag synced even when SPA navigation keeps this page mounted.
    let cancelled = false;
    const refreshAfkSettings = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data, error } = await supabase
          .from('afk_settings')
          .select('enabled, minutes_per_reward, coins_per_reward, daily_coin_cap, missions_enabled, minigames_enabled, promo_codes_enabled')
          .eq('id', 'global')
          .maybeSingle();
        if (error) throw error;
        if (!cancelled && data) setSettings(data as AfkSettings);
      } catch (error) {
        console.error('AFK settings refresh failed:', error);
      }
    };
    window.addEventListener('focus', refreshAfkSettings);
    document.addEventListener('visibilitychange', refreshAfkSettings);
    // Poll as a fallback in case Supabase Realtime is not enabled for this table.
    const refreshInterval = window.setInterval(() => void refreshAfkSettings(), 8000);

    const channel = supabase
      .channel('afk-settings-live-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'afk_settings', filter: 'id=eq.global' },
        () => { void refreshAfkSettings(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshAfkSettings);
      document.removeEventListener('visibilitychange', refreshAfkSettings);
      void supabase.removeChannel(channel);
    };
  }, [authLoading, userId, loadPageData]);
  // Keep the displayed wallet balance fresh while the AFK page is open.
  useEffect(() => {
    if (authLoading || !userId) return;

    const refreshWallet = () => {
      if (document.visibilityState !== 'visible') return;
      void loadWallet().catch((error) => {
        console.error('AFK wallet refresh failed:', error);
      });
    };

    const intervalId = window.setInterval(refreshWallet, 30_000);
    document.addEventListener('visibilitychange', refreshWallet);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWallet);
    };
  }, [authLoading, userId, loadWallet]);

  const stopSession = useCallback(
    async (reason?: string) => {
      if (!sessionId) return;
      try {
        const { data, error } = await supabase.rpc('stop_afk_session', {
          p_session_id: sessionId,
        });
        if (error) throw error;
        const result = data as SessionRpcResult | null;
        if (typeof result?.active_seconds === 'number') {
          setActiveSeconds(result.active_seconds);
        }
        setSessionId(null);
        setNotice(reason || 'AFK session stopped. Tracked time has been saved.');
        setNoticeIsError(false);
      } catch (error) {
        console.error('AFK stop failed:', error);
        setNotice(`Could not stop AFK session: ${errorMessage(error)}`);
        setNoticeIsError(true);
      }
    },
    [sessionId]
  );
  // Smoothly update the session timer between server heartbeats.
  // Heartbeat responses periodically replace this with the server's value.
  useEffect(() => {
    if (!sessionId) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setActiveSeconds((current) => current + 1);
      }
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [sessionId]);

  // Send server-timestamped heartbeats while the AFK page is visible.
  useEffect(() => {
    if (!sessionId) return;
    let disposed = false;
    const sendHeartbeat = async () => {
      if (
        disposed ||
        document.visibilityState !== 'visible' ||
        heartbeatBusy.current
      ) {
        return;
      }
      heartbeatBusy.current = true;
      try {
        const { data, error } = await supabase.rpc('heartbeat_afk_session', {
          p_session_id: sessionId,
        });
        if (error) throw error;
        const result = data as SessionRpcResult | null;
        if (typeof result?.active_seconds === 'number') {
          setActiveSeconds(result.active_seconds);
        }

        // Refresh promptly after the server processes this heartbeat/reward interval.
        void loadWallet().catch((walletError) => {
          console.error('AFK wallet refresh failed:', walletError);
        });

        if (result?.success === false) {
          setSessionId(null);
          setNotice(
            result.reason ||
              `AFK session is ${result.status || 'not active'}. Start a new session to continue.`
          );
          setNoticeIsError(true);
        }
      } catch (error) {
        console.error('AFK heartbeat failed:', error);
        if (!disposed) {
          setNotice(`AFK heartbeat failed: ${errorMessage(error)}`);
          setNoticeIsError(true);
        }
      } finally {
        heartbeatBusy.current = false;
      }
    };
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Per the AFK rule: leaving/minimizing this tab stops AFK tracking.
        void stopSession('AFK tracking stopped because the page became hidden.');
      }
    };
    const handlePageHide = () => {
      // Best effort when the browser tab/window is actually closed or navigated away.
      void stopSession();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      // Best-effort stop for in-app route changes. StrictMode's initial
      // effect replay occurs before the user can start a session.
      void supabase.rpc('stop_afk_session', { p_session_id: sessionId });
    };
  }, [sessionId, stopSession, loadWallet]);
  const startSession = async () => {
    setNotice('');
    setNoticeIsError(false);
    if (!settings?.enabled) {
      setNotice('AFK system এখন Admin দ্বারা disabled আছে।');
      setNoticeIsError(true);
      return;
    }
    setSessionBusy(true);
    try {
      const { data, error } = await supabase.rpc('start_afk_session');
      if (error) throw error;
      const result = data as SessionRpcResult | null;
      if (!result?.success || !result.session_id) {
        throw new Error('Server did not return an active AFK session.');
      }
      setSessionId(result.session_id);
      setActiveSeconds(0);
      setNotice(
        'AFK session started. Page visible থাকা অবস্থায় tracking চলবে; eligible interval পূর্ণ হলে server-side rules অনুযায়ী Coins update হবে।'
      );
      setNoticeIsError(false);
    } catch (error) {
      console.error('AFK start failed:', error);
      setNotice(`Could not start AFK session: ${errorMessage(error)}`);
      setNoticeIsError(true);
    } finally {
      setSessionBusy(false);
    }
  };
  const redeemPromoCode = async () => {
    if (!settings?.promo_codes_enabled) {
      setNotice('Promo codes are currently disabled by an admin.');
      setNoticeIsError(true);
      return;
    }

    const code = promoCode.trim();
    if (!code) {
      setNotice('একটি promo code লিখো।');
      setNoticeIsError(true);
      return;
    }

    setRedeemingPromo(true);
    setNotice('');
    setNoticeIsError(false);
    try {
      const { data, error } = await supabase.rpc('redeem_afk_promo_code', {
        p_code: code,
      });
      if (error) throw error;

      const result = data as {
        success?: boolean;
        reason?: string;
        reward_coins?: number;
        new_balance?: number;
      } | null;

      if (!result?.success) {
        const messages: Record<string, string> = {
          login_required: 'Promo code redeem করতে login করতে হবে।',
          empty_code: 'একটি promo code লিখো।',
          invalid_code: 'এই promo code সঠিক নয়।',
          inactive_code: 'এই promo code বর্তমানে active নয়।',
          expired_code: 'এই promo code-এর মেয়াদ শেষ।',
          usage_limit_reached: 'এই promo code-এর usage limit শেষ।',
          already_redeemed: 'তুমি এই promo code আগেই redeem করেছ।',
        };
        throw new Error(messages[result?.reason ?? ''] ?? 'Promo code redeem করা যায়নি।');
      }

      if (typeof result.new_balance === 'number') {
        setWalletBalance(result.new_balance);
      } else {
        await loadWallet();
      }
      setPromoCode('');
      setNotice(`সফল! তোমার wallet-এ ${Number(result.reward_coins ?? 0).toLocaleString()} Butterfly Coins যোগ হয়েছে।`);
      setNoticeIsError(false);
    } catch (error) {
      console.error('AFK promo redemption failed:', error);
      setNotice(errorMessage(error));
      setNoticeIsError(true);
    } finally {
      setRedeemingPromo(false);
    }
  };

  const claimMission = async (mission: AfkMission) => {
    if (!settings?.missions_enabled) {
      setNotice('Daily Missions Admin দ্বারা disabled আছে।');
      setNoticeIsError(true);
      return;
    }
    if (!['daily_visit', 'afk_minutes'].includes(mission.mission_type)) {
      setNotice(
        'এই mission type-এর verified progress system এখনো চালু হয়নি।'
      );
      setNoticeIsError(true);
      return;
    }
    setClaimingMissionId(mission.id);
    setNotice('');
    setNoticeIsError(false);
    try {
      const { data, error } = await supabase.rpc('claim_afk_daily_mission', {
        p_mission_id: mission.id,
      });
      if (error) throw error;
      const result = data as ClaimRpcResult | null;
      if (!result?.success) {
        throw new Error('The server did not confirm this mission claim.');
      }
      if (typeof result.new_balance === 'number') {
        setWalletBalance(result.new_balance);
      } else {
        await loadWallet();
      }
      setClaimedMissionIds((current) =>
        current.includes(mission.id) ? current : [...current, mission.id]
      );
      setNotice(`Mission claimed! ${result.reward_coins ?? mission.reward_coins} Coins added.`);
      setNoticeIsError(false);
    } catch (error) {
      console.error('Mission claim failed:', error);
      setNotice(`Mission not claimed: ${errorMessage(error)}`);
      setNoticeIsError(true);
    } finally {
      setClaimingMissionId(null);
    }
  };
  if (authLoading || (!userId && !authLoading)) {
    return (
      <div className="min-h-[65vh] px-4 pt-32 text-center text-white">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-300" />
        <p className="mt-4 text-sm text-slate-400">Checking your account…</p>
      </div>
    );
  }
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-16 -z-10 h-96 w-[min(90vw,900px)] -translate-x-1/2 rounded-full bg-purple-700/10 blur-[130px]" />
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200">
              <Sparkles className="h-3.5 w-3.5" /> Butterfly Coins · AFK Rewards
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">AFK Reward Hub</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Keep your session active while this page is visible, complete daily missions,
              and manage your Butterfly Coins.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadPageData()}
            disabled={pageLoading}
            className={secondaryButtonClass}
          >
            <RefreshCw className={`h-4 w-4 ${pageLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>
        {notice && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${
              noticeIsError
                ? 'border-red-400/20 bg-red-400/[0.06] text-red-200'
                : 'border-purple-400/20 bg-purple-400/[0.06] text-purple-100'
            }`}
          >
            {noticeIsError ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <span>{notice}</span>
          </div>
        )}
        {pageLoading ? (
          <div className={`${cardClass} flex min-h-48 items-center justify-center gap-3 text-slate-400`}>
            <Loader2 className="h-5 w-5 animate-spin text-purple-300" /> Loading AFK rewards…
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Butterfly Coins</p>
                  <Coins className="h-5 w-5 text-amber-300" />
                </div>
                <p className="mt-4 text-3xl font-black tabular-nums">{walletBalance.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">Current wallet balance</p>
              </div>
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Current Session</p>
                  <Clock3 className="h-5 w-5 text-sky-300" />
                </div>
                <p className="mt-4 text-3xl font-black tabular-nums">{formatDuration(activeSeconds)}</p>
                <p className="mt-1 text-xs text-slate-500">Verified active time</p>
              </div>
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">AFK Status</p>
                  <ActivityIcon />
                </div>
                <p className="mt-4 text-2xl font-black">
                  {sessionId ? 'Tracking' : settings?.enabled ? 'Ready' : 'Disabled'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {sessionId ? 'Session active in this tab' : 'Start a session when ready'}
                </p>
              </div>
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Daily AFK Rule</p>
                  <Zap className="h-5 w-5 text-purple-300" />
                </div>
                <p className="mt-4 text-2xl font-black">
                  {settings ? `${settings.minutes_per_reward} min` : '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {settings ? `${settings.coins_per_reward} Coins per interval · ${settings.daily_coin_cap} daily cap` : 'Settings unavailable'}
                </p>
              </div>
            </section>
            <section className={`${cardClass} relative overflow-hidden`}>
              <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="max-w-xl">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-purple-300">
                    <ShieldCheck className="h-4 w-4" /> Session protection
                  </div>
                  <h2 className="text-xl font-bold">{sessionId ? 'Your AFK session is tracking' : 'Start your AFK session'}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The server timestamps activity. Hiding or minimizing this page stops the session.
                    Eligible AFK-time rewards are processed by the server-side AFK rules.
                  </p>
                </div>
                {sessionId ? (
                  <button
                    type="button"
                    onClick={() => void stopSession()}
                    disabled={sessionBusy}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-400/15 disabled:opacity-50"
                  >
                    <Square className="h-4 w-4" /> Stop AFK Session
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startSession()}
                    disabled={sessionBusy || !settings?.enabled}
                    className={buttonClass}
                  >
                    {sessionBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 fill-current" />
                    )}
                    Start AFK Session
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
              {!settings?.enabled && (
                <p className="relative mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100">
                  AFK is currently disabled by an admin. Enable it in Admin → AFK Management → AFK Rules.
                </p>
              )}
            </section>
            <section className={cardClass}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
                    <Ticket className="h-4 w-4" /> Butterfly Coins
                  </div>
                  <h2 className="text-xl font-bold">Redeem a Promo Code</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Enter a valid AFK promo code to add Coins to your wallet. Each code can be redeemed once per account.
                  </p>
                </div>
                <form
                  className="flex w-full flex-col gap-3 sm:flex-row md:max-w-xl"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void redeemPromoCode();
                  }}
                >
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="Enter promo code"
                    autoComplete="off"
                    maxLength={100}
                    disabled={redeemingPromo || !settings?.promo_codes_enabled}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-400/60 disabled:opacity-50"
                    aria-label="Promo code"
                  />
                  <button
                    type="submit"
                    disabled={redeemingPromo || !settings?.promo_codes_enabled || !promoCode.trim()}
                    className={buttonClass}
                  >
                    {redeemingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                    Redeem Code
                  </button>
                </form>
              </div>
              {!settings?.promo_codes_enabled && (
                <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100">
                  Promo codes are disabled by an admin.
                </p>
              )}
            </section>
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black">Daily Missions</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Rewards are validated by the database before claiming.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <Ticket className="h-4 w-4" /> UTC daily reset
                </div>
              </div>
              {!settings?.missions_enabled ? (
                <div className={cardClass}>
                  <p className="text-sm text-slate-400">Daily Missions are disabled by an admin.</p>
                </div>
              ) : missions.length === 0 ? (
                <div className={cardClass}>
                  <p className="font-semibold">No active missions yet</p>
                  <p className="mt-1 text-sm text-slate-400">
                    New missions will appear here when Admin enables them.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {missions.map((mission) => {
                    const isClaimed = claimedMissionIds.includes(mission.id);
                    const claimSupported = ['daily_visit', 'afk_minutes'].includes(mission.mission_type);
                    const isClaiming = claimingMissionId === mission.id;
                    return (
                      <article key={mission.id} className={cardClass}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10">
                              <Gamepad2 className="h-5 w-5 text-purple-300" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-white">{mission.title}</h3>
                              <p className="mt-1 text-sm leading-5 text-slate-400">
                                {mission.description || `Target: ${mission.target} ${mission.mission_type === 'afk_minutes' ? 'minutes' : 'visit'}`}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-right">
                            <p className="text-lg font-black text-amber-200">+{mission.reward_coins}</p>
                            <p className="text-[10px] uppercase tracking-wider text-amber-200/70">Coins</p>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
                          <p className="text-xs text-slate-500">
                            Target: {mission.target} {mission.mission_type === 'afk_minutes' ? 'verified minutes' : mission.mission_type === 'daily_visit' ? 'visit today' : 'game actions'}
                          </p>
                          <button
                            type="button"
                            onClick={() => void claimMission(mission)}
                            disabled={isClaimed || isClaiming || !claimSupported}
                            title={!claimSupported ? 'This mission type needs verified mini-game tracking.' : undefined}
                            className={isClaimed ? secondaryButtonClass : buttonClass}
                          >
                            {isClaiming ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isClaimed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Coins className="h-4 w-4" />
                            )}
                            {isClaimed ? 'Claimed Today' : !claimSupported ? 'Not Available Yet' : 'Claim Reward'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
            <AfkMiniGames enabled={Boolean(settings?.minigames_enabled)} onBalance={(balance) => { if (typeof balance === 'number') setWalletBalance(balance); else void loadWallet(); }} />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-500">
              <p className="font-semibold text-slate-300">About AFK Coins</p>
              <p className="mt-1">
                Session time and eligible AFK-time rewards are handled by server-side AFK rules. Daily mission claims are validated by the database.
                Promo redemption and AFK-time rewards are handled by Supabase. Mini-game rewards are requested through the server-side mini-game claim function.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
function ActivityIcon() {
  return <Clock3 className="h-5 w-5 text-emerald-300" />;
}
export default AfkRewardsPage;
