import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
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

type MiniGameConfig = { enabled: boolean; reward_coins: number; cooldown_minutes: number; daily_limit: number; difficulty?: string; pair_count?: number };
type TicTacToeDifficulty = 'easy' | 'normal' | 'hard';
const GAME_DEFAULTS: Record<string, MiniGameConfig> = {
  tic_tac_toe: { enabled: true, reward_coins: 10, cooldown_minutes: 1, daily_limit: 30, difficulty: 'normal' },
  rock_paper_scissors: { enabled: true, reward_coins: 5, cooldown_minutes: 1, daily_limit: 30 },
  number_guessing: { enabled: true, reward_coins: 10, cooldown_minutes: 2, daily_limit: 15 },
  memory_match: { enabled: true, reward_coins: 25, cooldown_minutes: 5, daily_limit: 10, pair_count: 10 },
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
const GAME_INSTRUCTIONS: Record<string, string> = {
  tic_tac_toe: 'Place X in a square. Get three in a row before the bot, or force a draw.',
  rock_paper_scissors: 'Start a round and choose Rock, Paper, or Scissors within 3 seconds. Your choice locks in; the result appears when the timer ends. If you do not choose, a move is picked for you.',
  number_guessing: 'Guess the hidden number from 1 to 10. The hint tells you whether your guess is too high or too low.',
  memory_match: 'Flip two cards at a time and find every matching pair. Fewer moves are better.',
  reaction_challenge: 'Start and wait for the color cue. Tap the matching color as quickly as you can.',
  math_challenge: 'Start the timer and solve the expression before it expires. Addition, subtraction, multiplication, and division can appear.',
  higher_or_lower: 'Predict whether the next number is higher or lower. Build a three-answer streak to win.',
  word_scramble: 'Rearrange the displayed letters to find the hidden Minecraft-themed word.',
};
const GAME_WORDS = ['BUTTERFLY', 'DIAMOND', 'CREEPER', 'PICKAXE', 'NETHER', 'DRAGON', 'EMERALD', 'REDSTONE'];
const MATH_TIME_LIMIT_SECONDS = 15;
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
  const [mathSeconds, setMathSeconds] = useState(MATH_TIME_LIMIT_SECONDS);
  const [mathActive, setMathActive] = useState(false);
  const [word, setWord] = useState(() => GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)]);
  const [wordAnswer, setWordAnswer] = useState('');
  const [rpsActive, setRpsActive] = useState(false);
  const [rpsSeconds, setRpsSeconds] = useState(3);
  const [rpsSelection, setRpsSelection] = useState<string | null>(null);
  const [higherNumber, setHigherNumber] = useState(() => 1 + Math.floor(Math.random() * 9));
  const [reactionState, setReactionState] = useState<'idle'|'wait'|'go'|'done'>('idle');
  const [reactionStart, setReactionStart] = useState(0);
  const [reactionResult, setReactionResult] = useState<number|null>(null);
  const [reactionTarget, setReactionTarget] = useState<'red' | 'green' | 'blue' | null>(null);
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [botThinking, setBotThinking] = useState(false);
  const botThinkingRef = useRef(false);
  const botThinkTimer = useRef<number | null>(null);
  const [memoryCards, setMemoryCards] = useState(() => shuffleMemory());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [lastRpsResult, setLastRpsResult] = useState('');
  const [higherCorrect, setHigherCorrect] = useState(0);
  const [scrambledWord, setScrambledWord] = useState(() => scrambleWord(word));
  const [rewardCelebration, setRewardCelebration] = useState<number | null>(null);
  const rpsTimer = useRef<number | null>(null);
  const rpsSelectionRef = useRef<string | null>(null);
  const reactionTimer = useRef<number | null>(null);
  const memoryPairCount = getMemoryPairCount(configs.memory_match?.pair_count);
  useEffect(() => {
    let cancelled = false;
    const loadConfigs = async () => {
      const { data, error } = await supabase
        .from('afk_admin_config')
        .select('config_value')
        .eq('config_key', 'minigames')
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('AFK minigame configuration load failed:', error);
        return;
      }
      if (data?.config_value) {
        setConfigs({
          ...GAME_DEFAULTS,
          ...(data.config_value as Record<string, MiniGameConfig>),
        });
      }
    };

    void loadConfigs();
    const intervalId = window.setInterval(() => void loadConfigs(), 30_000);
    window.addEventListener('focus', loadConfigs);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', loadConfigs);
      if (botThinkTimer.current !== null) {
        window.clearTimeout(botThinkTimer.current);
      }
      if (rpsTimer.current !== null) window.clearTimeout(rpsTimer.current);
      if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!mathActive) return;
    if (mathSeconds <= 0) {
      setMathActive(false);
      setMathQuestion(makeMathQuestion());
      setMathAnswer('');
      setNotice('Time is up! Start another math challenge to try again.');
      return;
    }

    const timerId = window.setTimeout(() => setMathSeconds((seconds) => seconds - 1), 1_000);
    return () => window.clearTimeout(timerId);
  }, [mathActive, mathSeconds]);
  useEffect(() => {
    if (activeGame !== 'memory_match') return;
    setMemoryCards(shuffleMemory(memoryPairCount));
    setFlipped([]);
    setMatched([]);
    setMemoryMoves(0);
  }, [activeGame, memoryPairCount]);
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
      const earnedCoins = result.reward_coins ?? cfg.reward_coins;
      setNotice(`You won! +${earnedCoins} Butterfly Coins.`);
      setRewardCelebration(earnedCoins);
      onBalance(result.new_balance);
      setBusy(false);
    }, (e: unknown) => {
      setNotice(`Game reward could not be claimed: ${e instanceof Error ? e.message : String(e)}. Check the AFK mini-game SQL migration.`);
      setBusy(false);
    });
  }
  const cfg = configs[activeGame] ?? GAME_DEFAULTS[activeGame];
  const gameButton = 'rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:border-purple-300/30 hover:bg-purple-500/20 hover:shadow-lg hover:shadow-purple-950/30 motion-reduce:transform-none motion-reduce:transition-none disabled:opacity-40';
  const primary = 'rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition duration-200 hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-900/40 motion-reduce:transform-none motion-reduce:transition-none disabled:opacity-40';
  const startReaction = () => {
    if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    setReactionState('wait');
    setReactionResult(null);
    setReactionTarget(null);
    reactionTimer.current = window.setTimeout(() => {
      const colors = ['red', 'green', 'blue'] as const;
      setReactionTarget(colors[Math.floor(Math.random() * colors.length)]);
      setReactionStart(Date.now());
      setReactionState('go');
      reactionTimer.current = null;
    }, 1_000 + Math.random() * 2_500);
  };
  const handleReaction = (color: 'red' | 'green' | 'blue') => {
    if (reactionState !== 'go' || !reactionTarget) return;
    const elapsed = Date.now() - reactionStart;
    setReactionState('done');
    setReactionResult(elapsed);
    if (color !== reactionTarget) {
      setNotice(`Wrong color. The cue was ${reactionTarget}. Start again.`);
    } else if (elapsed >= 650) {
      setNotice(`Correct color, but ${elapsed} ms was too slow. Try again.`);
    } else {
      finishGame('reaction_challenge', true);
    }
  };
  const resetMemory = () => { setMemoryCards(shuffleMemory(memoryPairCount)); setFlipped([]); setMatched([]); setMemoryMoves(0); };
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
  const ticDifficulty = normalizeTicDifficulty(configs.tic_tac_toe?.difficulty);
  const playTic = (idx: number) => {
    if (board[idx] || ticWinner(board) || busy || botThinkingRef.current) return;
    const human = [...board]; human[idx] = 'X';
    if (ticWinner(human)) { setBoard(human); finishGame('tic_tac_toe', true); return; }
    setBoard(human);
    if (human.every(Boolean)) {
      setNotice('It is a draw. Start a new round.');
      return;
    }

    botThinkingRef.current = true;
    setBotThinking(true);
    botThinkTimer.current = window.setTimeout(() => {
      const move = chooseTicMove(human, ticDifficulty);
      if (move === null) {
        botThinkingRef.current = false;
        setBotThinking(false);
        return;
      }
      const bot = [...human];
      bot[move] = 'O';
      setBoard(bot);
      botThinkingRef.current = false;
      botThinkTimer.current = null;
      setBotThinking(false);
      if (ticWinner(bot) === 'O') {
        setNotice('Bot won this round. Start a new round.');
      } else if (bot.every(Boolean)) {
        setNotice('It is a draw. Start a new round.');
      }
    }, 650 + Math.random() * 650);
  };
  const resetTic = () => {
    if (botThinkTimer.current !== null) {
      window.clearTimeout(botThinkTimer.current);
      botThinkTimer.current = null;
    }
    botThinkingRef.current = false;
    setBotThinking(false);
    setBoard(Array(9).fill(''));
    setNotice('');
  };
  const selectGame = (key: string) => {
    if (rpsTimer.current !== null) {
      window.clearTimeout(rpsTimer.current);
      rpsTimer.current = null;
    }
    if (reactionTimer.current !== null) {
      window.clearTimeout(reactionTimer.current);
      reactionTimer.current = null;
    }
    setRpsActive(false);
    rpsSelectionRef.current = null;
    setRpsSelection(null);
    setReactionState('idle');
    setReactionTarget(null);
    setMathActive(false);
    setActiveGame(key);
    setNotice('');
  };
  const selectRps = (pick: string) => {
    if (!rpsActive || rpsSelectionRef.current !== null) return;
    rpsSelectionRef.current = pick;
    setRpsSelection(pick);
  };
  const resolveRps = (pick: string, automatic = false) => {
    if (rpsTimer.current !== null) {
      window.clearTimeout(rpsTimer.current);
      rpsTimer.current = null;
    }
    setRpsActive(false);
    const options = ['Rock','Paper','Scissors'];
    const bot = options[Math.floor(Math.random()*3)];
    const won = (pick==='Rock'&&bot==='Scissors')||(pick==='Paper'&&bot==='Rock')||(pick==='Scissors'&&bot==='Paper');
    const draw = pick===bot;
    setLastRpsResult(`${automatic ? 'Time expired · Auto-picked' : 'You picked'} ${pick} · Bot: ${bot} — ${draw?'Draw':won?'You win!':'Bot wins'}`);
    if (automatic) setRpsSelection(pick);
    if (won) finishGame('rock_paper_scissors', true);
  };
  const startRpsRound = () => {
    if (rpsActive || busy) return;
    if (rpsTimer.current !== null) window.clearTimeout(rpsTimer.current);
    setLastRpsResult('');
    rpsSelectionRef.current = null;
    setRpsSelection(null);
    setRpsSeconds(3);
    setRpsActive(true);
    const tick = (seconds: number) => {
      setRpsSeconds(seconds);
      if (seconds === 0) {
        rpsTimer.current = null;
        const options = ['Rock', 'Paper', 'Scissors'];
        const selected = rpsSelectionRef.current;
        resolveRps(
          selected ?? options[Math.floor(Math.random() * options.length)],
          selected === null
        );
        return;
      }
      rpsTimer.current = window.setTimeout(() => tick(seconds - 1), 1_000);
    };
    rpsTimer.current = window.setTimeout(() => tick(2), 1_000);
  };
  const startMathChallenge = () => {
    setMathQuestion(makeMathQuestion());
    setMathAnswer('');
    setMathSeconds(MATH_TIME_LIMIT_SECONDS);
    setNotice('');
    setMathActive(true);
  };
  const submitGuess = () => { const n=Number(guess); if(n===numberTarget){finishGame('number_guessing',true);setGuess('');setNumberTarget(1+Math.floor(Math.random()*10));} else setNotice(n<numberTarget?'Too low — try again.':'Too high — try again.'); };
  const submitMath = () => { if(!mathActive) return; const ok=Number(mathAnswer)===mathQuestion.answer; if(ok){setMathActive(false);finishGame('math_challenge',true);setMathAnswer('');}else setNotice('Incorrect answer. Try again before the timer ends.'); };
  const submitWord = () => { if(wordAnswer.trim().toUpperCase()===word){finishGame('word_scramble',true);const next=GAME_WORDS[Math.floor(Math.random()*GAME_WORDS.length)];setWord(next);setScrambledWord(scrambleWord(next));setWordAnswer('');}else setNotice('Not the right word yet.'); };
  const guessHigher = (choice: 'higher'|'lower') => { const next=1+Math.floor(Math.random()*9); const won=(choice==='higher'&&next>higherNumber)||(choice==='lower'&&next<higherNumber); setHigherNumber(next); if(won){const score=higherCorrect+1;setHigherCorrect(score);if(score>=3){finishGame('higher_or_lower',true);setHigherCorrect(0);}}else{setHigherCorrect(0);setNotice(`New number: ${next}. Streak reset.`);} };
  return <section className="space-y-4">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black">Mini-games</h2><p className="mt-1 text-sm text-slate-400">Play against the bot and complete quick challenges to earn Coins.</p></div><span className="text-xs text-slate-500">Rewards are confirmed by Supabase</span></div>
    {!enabled ? <div className={cardClass}>Mini-games are disabled by an admin.</div> : <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.keys(GAME_TITLES).map((key)=><motion.button key={key} whileHover={{y:-2}} whileTap={{scale:0.97}} transition={{duration:0.16}} className={`${gameButton} ${activeGame===key?'border-purple-400/50 bg-purple-500/20 shadow-lg shadow-purple-950/20':''}`} onClick={()=>selectGame(key)} disabled={botThinking || !(configs[key]??GAME_DEFAULTS[key]).enabled}>{GAME_TITLES[key]}</motion.button>)}</div>
      <motion.div key={activeGame} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.24}} className={`${cardClass} relative overflow-hidden border-purple-300/15 bg-gradient-to-br from-white/[0.055] via-slate-950/70 to-purple-950/20`}>
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-300/20 bg-purple-500/10"><Gamepad2 className="h-5 w-5 text-purple-200" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-300">Arcade challenge</p><h3 className="text-xl font-bold">{GAME_TITLES[activeGame]}</h3></div></div><span className="rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-300/15 to-amber-600/5 px-3 py-2 text-sm font-black text-amber-200 shadow-lg shadow-amber-950/10"><Coins className="mr-1 inline h-4 w-4" />+{cfg.reward_coins}</span></div>
        <p className="relative mb-5 max-w-3xl text-sm leading-6 text-slate-400">{GAME_INSTRUCTIONS[activeGame]}</p>
        <div className="relative">
        {!cfg.enabled ? <p className="text-slate-400">This game is currently disabled.</p> : <div className="space-y-4">
          {activeGame==='tic_tac_toe' && <><div className="mb-3 flex flex-wrap items-center justify-end gap-3"><span className="rounded-full border border-purple-300/15 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200">Bot · {ticDifficulty}</span></div><div className="grid max-w-xs grid-cols-3 gap-2">{board.map((v,i)=><motion.button key={i} disabled={botThinking || busy || Boolean(v) || Boolean(ticWinner(board))} whileHover={!v&&!botThinking?{scale:1.04}:undefined} whileTap={{scale:0.95}} className={`aspect-square rounded-xl border text-3xl font-black transition-colors disabled:cursor-not-allowed ${v==='X'?'border-purple-300/30 bg-purple-500/15 text-purple-200':v==='O'?'border-sky-300/20 bg-sky-500/10 text-sky-200':'border-white/10 bg-black/20 hover:border-purple-300/30 disabled:opacity-70'}`} onClick={()=>playTic(i)}>{v}</motion.button>)}</div><div className="mt-4 flex min-h-9 items-center justify-between gap-3"><div className="text-sm text-slate-400">{botThinking ? <span className="inline-flex items-center gap-2 text-sky-200"><Loader2 className="h-4 w-4 animate-spin" />Bot is thinking…</span> : <span>{ticDifficulty==='hard'?'Unbeatable strategy enabled':ticDifficulty==='normal'?'Bot will win or block when it can':'Easy random moves'}</span>}</div><button className={gameButton} onClick={resetTic}>New round</button></div></>}
          {activeGame==='rock_paper_scissors' && <><div className="mb-4 flex flex-wrap items-center gap-3"><button className={primary} onClick={startRpsRound} disabled={rpsActive || busy}>{rpsActive ? 'Round in progress' : 'Start round'}</button>{rpsActive && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-sm font-black tabular-nums text-amber-200">{rpsSeconds}s</span>}</div><div className="flex flex-wrap gap-2">{['Rock','Paper','Scissors'].map((x)=><motion.button whileHover={{y:-3,scale:1.03}} whileTap={{scale:0.96}} transition={{duration:0.16}} className={`${primary} min-w-28 ${rpsSelection===x?'border-purple-300/50 bg-purple-500/20':''}`} key={x} onClick={()=>selectRps(x)} disabled={!rpsActive || busy || rpsSelection!==null}>{x}{rpsSelection===x?' · Locked':''}</motion.button>)}</div>{rpsActive && <p className="text-sm text-slate-400">{rpsSelection ? `Your ${rpsSelection} is locked. The result will appear when the timer ends.` : 'Choose before the timer ends. If you do not choose, a move will be picked for you.'}</p>}{lastRpsResult && <p className="text-sm text-slate-300">{lastRpsResult}</p>}</>}
          {activeGame==='number_guessing' && <div className="flex gap-2"><input className="w-32 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white" type="number" min="1" max="10" value={guess} onChange={e=>setGuess(e.target.value)}/><button className={primary} onClick={submitGuess}>Guess</button></div>}
          {activeGame==='memory_match' && <><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{memoryCards.length} cards · {memoryPairCount} pairs · {memoryMoves} moves</p><div className="grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{memoryCards.map((v,i)=>{const isFaceUp=flipped.includes(i)||matched.includes(i);return <motion.button key={i} animate={{rotateY:isFaceUp?180:0,scale:matched.includes(i)?1.03:1}} whileTap={{scale:0.94}} transition={{duration:0.22}} className={`aspect-square rounded-2xl border text-2xl font-black shadow-lg sm:text-3xl ${isFaceUp?'border-amber-300/30 bg-gradient-to-br from-amber-300/15 to-purple-500/15 text-amber-100':'border-white/10 bg-gradient-to-br from-white/[0.06] to-black/30 text-purple-200 hover:border-purple-300/30'}`} onClick={()=>flipMemory(i)} aria-label={isFaceUp?`Card ${i+1}: ${v}`:`Hidden card ${i+1}`}><span className="block" style={{transform:isFaceUp?'rotateY(180deg)':undefined}}>{isFaceUp?v:'?'}</span></motion.button>;})}</div><button className={gameButton} onClick={resetMemory}>Reset board</button></>}
          {activeGame==='reaction_challenge' && <><div className="mb-4 min-h-12">{reactionState==='idle' || reactionState==='done' ? <button className={primary} onClick={startReaction}>Start reaction test</button> : reactionState==='wait' ? <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300"><Loader2 className="h-4 w-4 animate-spin"/>Wait for the color cue…</span> : <p className="text-lg font-black uppercase tracking-wider text-white">Tap <span className={reactionTarget==='red'?'text-red-400':reactionTarget==='green'?'text-emerald-400':'text-sky-400'}>{reactionTarget}</span>!</p>}</div>{reactionState==='go' && <div className="grid max-w-lg grid-cols-3 gap-3">{([{id:'red',label:'Red',style:'border-red-300/30 bg-red-500/20 text-red-100 hover:bg-red-500/35'},{id:'green',label:'Green',style:'border-emerald-300/30 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/35'},{id:'blue',label:'Blue',style:'border-sky-300/30 bg-sky-500/20 text-sky-100 hover:bg-sky-500/35'}] as const).map(color=><motion.button key={color.id} whileHover={{scale:1.04}} whileTap={{scale:0.94}} className={`min-h-24 rounded-2xl border text-lg font-black uppercase tracking-wider shadow-lg transition ${color.style}`} onClick={()=>handleReaction(color.id)}>{color.label}</motion.button>)}</div>}{reactionState==='done' && reactionResult !== null && <p className="mt-3 text-sm text-slate-400">Reaction time: {reactionResult} ms</p>}</>}
          {activeGame==='math_challenge' && <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-2xl font-black tracking-wide text-white">{mathQuestion.label} = ?</p><span className={`rounded-full border px-3 py-1.5 text-sm font-black tabular-nums ${mathSeconds<=5&&mathActive?'border-red-300/25 bg-red-500/10 text-red-200':'border-purple-300/20 bg-purple-500/10 text-purple-200'}`}>{mathActive ? `${mathSeconds}s left` : `${MATH_TIME_LIMIT_SECONDS}s challenge`}</span></div>{mathActive ? <form className="flex flex-wrap gap-2" onSubmit={(event)=>{event.preventDefault();submitMath();}}><input autoFocus className="w-36 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-purple-300/50" type="number" step="1" value={mathAnswer} onChange={e=>setMathAnswer(e.target.value)} aria-label="Math answer"/><button className={primary} type="submit" disabled={!mathAnswer.trim()}>Submit answer</button></form> : <button className={primary} onClick={startMathChallenge}>Start timed challenge</button>}</>}
          {activeGame==='higher_or_lower' && <><p className="text-sm text-slate-400">Current number: <b className="text-white">{higherNumber}</b> · streak {higherCorrect}/3</p><div className="flex gap-2"><button className={primary} onClick={()=>guessHigher('higher')}>Higher</button><button className={primary} onClick={()=>guessHigher('lower')}>Lower</button></div></>}
          {activeGame==='word_scramble' && <><p className="text-sm text-slate-400">Unscramble: <b className="font-mono text-lg tracking-[0.25em] text-amber-100">{scrambledWord}</b></p><div className="flex gap-2"><input className="w-56 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white uppercase outline-none transition focus:border-purple-300/50" value={wordAnswer} onChange={e=>setWordAnswer(e.target.value)}/><button className={primary} onClick={submitWord}>Check</button></div></>}
        </div>}
        </div>
      </motion.div>
    </>}
    {notice && <motion.p key={notice} initial={{opacity:0,y:8,scale:0.98}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.2}} role="status" className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-gradient-to-r from-amber-300/[0.08] to-purple-500/[0.08] p-3 text-sm text-amber-100"><motion.span animate={rewardCelebration !== null ? {y:[0,-7,0],rotate:[0,12,-12,0],scale:[1,1.22,1]} : undefined} transition={{duration:0.65}} onAnimationComplete={() => { if (rewardCelebration !== null) setRewardCelebration(null); }} className="shrink-0 text-amber-300"><Coins className="h-4 w-4" /></motion.span><span>{notice}</span>{rewardCelebration !== null && <span className="ml-auto rounded-full border border-amber-200/20 bg-amber-300/10 px-2.5 py-1 text-xs font-black text-amber-200">+{rewardCelebration}</span>}</motion.p>}
  </section>;
}
function makeMathQuestion() {
  const pick = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
  const mode = Math.floor(Math.random() * 5);

  if (mode === 0 || mode === 1 || mode === 2) {
    const operatorCount = pick(3, 4);
    const operations = Array.from({ length: operatorCount }, () =>
      mode === 0 ? '+' : mode === 1 ? '-' : Math.random() < 0.5 ? '+' : '-'
    );
    if (mode === 2) {
      if (!operations.includes('+')) operations[0] = '+';
      if (!operations.includes('-')) operations[operations.length - 1] = '-';
    }

    const values = [pick(60, 100), ...Array.from({ length: operatorCount }, () => pick(2, 15))];
    const answer = operations.reduce(
      (total, operation, index) =>
        operation === '+' ? total + values[index + 1] : total - values[index + 1],
      values[0]
    );
    return {
      label: values.reduce(
        (expression, value, index) =>
          index === 0 ? String(value) : `${expression} ${operations[index - 1]} ${value}`,
        ''
      ),
      answer,
    };
  }

  if (mode === 3) {
    const factors = Array.from({ length: pick(2, 3) }, () => pick(2, 9));
    return {
      label: factors.join(' × '),
      answer: factors.reduce((product, factor) => product * factor, 1),
    };
  }

  const divisors = Array.from({ length: pick(2, 3) }, () => pick(2, 9));
  const quotient = pick(2, 12);
  const dividend = quotient * divisors.reduce((product, divisor) => product * divisor, 1);
  return {
    label: [dividend, ...divisors].join(' ÷ '),
    answer: quotient,
  };
}
function getMemoryPairCount(value: unknown): number {
  const count = Number(value);
  return Number.isInteger(count) && count >= 6 && count <= 16 ? count : 10;
}
function shuffleMemory(pairCount = 10) {
  const symbols = ['🍀','💎','🦋','⚡','🌙','🔥','🪙','🗡️','🧪','🧱','🏹','⛏️','🛡️','🪵','👑','🐉'];
  const cards = [...symbols.slice(0, pairCount), ...symbols.slice(0, pairCount)];
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[target]] = [cards[target], cards[index]];
  }
  return cards;
}
function scrambleWord(value:string) { const chars=value.split(''); for(let i=chars.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[chars[i],chars[j]]=[chars[j],chars[i]];} const result=chars.join(''); return result===value?`${result.slice(1)}${result[0]}`:result; }
function normalizeTicDifficulty(value: string | undefined): TicTacToeDifficulty {
  return value === 'easy' || value === 'hard' ? value : 'normal';
}
function chooseTicMove(board: string[], difficulty: TicTacToeDifficulty): number | null {
  const available = board.map((mark, index) => mark ? -1 : index).filter((index) => index >= 0);
  if (available.length === 0) return null;
  if (difficulty === 'easy') {
    return available[Math.floor(Math.random() * available.length)];
  }

  const winningMove = findTicWinningMove(board, 'O');
  if (winningMove !== null) return winningMove;

  if (difficulty === 'normal') {
    const blockingMove = findTicWinningMove(board, 'X');
    if (blockingMove !== null) return blockingMove;
    if (available.includes(4)) return 4;
    const corners = available.filter((index) => [0, 2, 6, 8].includes(index));
    const choices = corners.length > 0 ? corners : available;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: number[] = [];
  for (const index of available) {
    const next = [...board];
    next[index] = 'O';
    const score = minimaxTicScore(next, false, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [index];
    } else if (score === bestScore) {
      bestMoves.push(index);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
}
function findTicWinningMove(board: string[], mark: 'X' | 'O'): number | null {
  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) continue;
    const next = [...board];
    next[index] = mark;
    if (ticWinner(next) === mark) return index;
  }
  return null;
}
function minimaxTicScore(board: string[], botTurn: boolean, depth: number): number {
  const winner = ticWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  const available = board.map((mark, index) => mark ? -1 : index).filter((index) => index >= 0);
  if (available.length === 0) return 0;

  const scores = available.map((index) => {
    const next = [...board];
    next[index] = botTurn ? 'O' : 'X';
    return minimaxTicScore(next, !botTurn, depth + 1);
  });
  return botTurn ? Math.max(...scores) : Math.min(...scores);
}
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
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen overflow-hidden px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-16 -z-10 h-96 w-[min(90vw,900px)] -translate-x-1/2 rounded-full bg-purple-700/10 blur-[130px]" />
      <div className="mx-auto max-w-7xl space-y-7">
        <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
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
        </motion.header>
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
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className={`${cardClass} relative overflow-hidden border-amber-300/20 bg-gradient-to-br from-amber-300/[0.12] via-white/[0.035] to-purple-500/[0.06] shadow-xl shadow-amber-950/10`}>
                <div className="pointer-events-none absolute -right-7 -top-10 h-36 w-36 rounded-full bg-amber-300/10 blur-3xl" />
                <div className="relative flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-amber-100/80">Butterfly Coins</p>
                  <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-300/10">
                    <Coins className="h-5 w-5 text-amber-200" />
                  </motion.span>
                </div>
                <motion.p key={walletBalance} initial={{ opacity: 0.55, y: 5 }} animate={{ opacity: 1, y: 0 }} className="relative mt-4 text-3xl font-black tabular-nums tracking-tight text-white">{walletBalance.toLocaleString()}</motion.p>
                <p className="relative mt-1 text-xs text-amber-100/55">Your available reward balance</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.05 }} className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Current Session</p>
                  <Clock3 className="h-5 w-5 text-sky-300" />
                </div>
                <p className="mt-4 text-3xl font-black tabular-nums">{formatDuration(activeSeconds)}</p>
                <p className="mt-1 text-xs text-slate-500">Verified active time</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.1 }} className={cardClass}>
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
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.15 }} className={cardClass}>
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
              </motion.div>
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
                    onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    autoComplete="off"
                    maxLength={100}
                    disabled={redeemingPromo || !settings?.promo_codes_enabled}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-slate-500 focus:border-purple-400/60 disabled:opacity-50"
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
                      <motion.article key={mission.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className={`${cardClass} transition-colors hover:border-purple-300/20`}>
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
                      </motion.article>
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
    </MotionConfig>
  );
};
function ActivityIcon() {
  return <Clock3 className="h-5 w-5 text-emerald-300" />;
}
export default AfkRewardsPage;
