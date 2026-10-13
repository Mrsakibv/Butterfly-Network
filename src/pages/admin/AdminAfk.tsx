import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  Activity,
  BadgeDollarSign,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Database,
  Gamepad2,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Plus,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  X,
  Settings2,
  ShieldCheck,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';
type AfkTab =
  | 'overview'
  | 'rules'
  | 'missions'
  | 'games'
  | 'promos'
  | 'users'
  | 'logs'
  | 'ads'
  | 'security'
  | 'settings';
const sections: {
  id: AfkTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'rules', label: 'AFK Rules', icon: Clock3 },
  { id: 'missions', label: 'Daily Missions', icon: ListChecks },
  { id: 'games', label: 'Mini-games', icon: Gamepad2 },
  { id: 'promos', label: 'Promo Codes', icon: Ticket },
  { id: 'users', label: 'Live AFK Users', icon: Users },
  { id: 'logs', label: 'History & Logs', icon: History },
  { id: 'ads', label: 'Ads & Revenue', icon: Megaphone },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];
const panel =
  'rounded-2xl border border-white/10 bg-white/[0.035] p-5';
const field =
  'mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500';
type MissionType = 'afk_minutes' | 'minigame_wins' | 'games_played' | 'daily_visit';

interface AfkPromo {
  id: string;
  code: string;
  reward_coins: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface AfkPromoRedemption {
  redemption_id: string;
  promo_code_id: string;
  code: string;
  user_id: string;
  reward_coins: number;
  redeemed_at: string;
}

interface AfkMission {
  id: string;
  title: string;
  description: string;
  mission_type: MissionType;
  target: number;
  reward_coins: number;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MissionDraft {
  title: string;
  description: string;
  mission_type: MissionType;
  target: string;
  reward_coins: string;
  is_active: boolean;
  sort_order: string;
  starts_at: string;
  ends_at: string;
}

const emptyMissionDraft = (): MissionDraft => ({
  title: '',
  description: '',
  mission_type: 'afk_minutes',
  target: '30',
  reward_coins: '50',
  is_active: true,
  sort_order: '0',
  starts_at: '',
  ends_at: '',
});

const toDateTimeLocal = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const missionTypeLabels: Record<MissionType, string> = {
  afk_minutes: 'Stay AFK for minutes',
  minigame_wins: 'Win mini-games',
  games_played: 'Play mini-games',
  daily_visit: 'Daily visit',
};

type AfkAdminConfig = Record<string, unknown>;

const DEFAULT_GAME_CONFIG = {
  tic_tac_toe: { enabled: true, reward_coins: 10, cooldown_minutes: 1, daily_limit: 30, difficulty: 'normal' },
  rock_paper_scissors: { enabled: true, reward_coins: 5, cooldown_minutes: 1, daily_limit: 30, difficulty: 'normal' },
  number_guessing: { enabled: true, reward_coins: 10, cooldown_minutes: 2, daily_limit: 15, difficulty: 'normal' },
  memory_match: { enabled: true, reward_coins: 25, cooldown_minutes: 5, daily_limit: 10, difficulty: 'normal' },
  reaction_challenge: { enabled: true, reward_coins: 15, cooldown_minutes: 2, daily_limit: 20, difficulty: 'normal' },
  math_challenge: { enabled: true, reward_coins: 10, cooldown_minutes: 1, daily_limit: 30, difficulty: 'normal' },
  higher_or_lower: { enabled: true, reward_coins: 10, cooldown_minutes: 2, daily_limit: 15, difficulty: 'normal' },
  word_scramble: { enabled: true, reward_coins: 15, cooldown_minutes: 2, daily_limit: 20, difficulty: 'normal' },
};
const DEFAULT_AD_CONFIG = {
  enabled: false,
  provider: 'none',
  banner_enabled: false,
  rewarded_enabled: false,
  daily_impression_limit: 20,
};
const DEFAULT_SECURITY_CONFIG = {
  duplicate_claim_cooldown_seconds: 60,
  max_sessions_per_user: 1,
  heartbeat_timeout_seconds: 90,
  suspicious_reward_threshold: 1000,
  require_server_validation: true,
};
const DEFAULT_GENERAL_CONFIG = {
  maintenance_mode: false,
  show_afk_page: true,
  show_daily_missions: true,
  show_mini_games: true,
};

export const AdminAfk: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AfkTab>('overview');
  const [notice, setNotice] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [rewardMinutes, setRewardMinutes] = useState('10');
  const [rewardCoins, setRewardCoins] = useState('10');
  const [dailyCap, setDailyCap] = useState('500');
  const [promoCode, setPromoCode] = useState('kk');
  const [promoReward, setPromoReward] = useState('100');
  const [promos, setPromos] = useState<AfkPromo[]>([]);
  const [promoRedemptions, setPromoRedemptions] = useState<AfkPromoRedemption[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoMaxUses, setPromoMaxUses] = useState('');
  const [promoExpiresAt, setPromoExpiresAt] = useState('');
  const [promoActive, setPromoActive] = useState(true);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [missions, setMissions] = useState<AfkMission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [missionDraft, setMissionDraft] = useState<MissionDraft>(emptyMissionDraft);
  const [liveSessions, setLiveSessions] = useState<Array<{
    id: string; user_id: string; started_at: string; last_heartbeat_at: string;
    status: string; active_seconds: number; reward_coins: number;
  }>>([]);
  const [coinTransactions, setCoinTransactions] = useState<Array<{
    id: string; user_id: string; amount: number; transaction_type: string;
    description: string | null; created_at: string;
  }>>([]);
  const [dashboardStats, setDashboardStats] = useState({
    activeUsers: 0, coinsToday: 0, missionClaimsToday: 0, promoRedemptions: 0,
  });
  const [liveDataLoading, setLiveDataLoading] = useState(false);
  const [liveRefresh, setLiveRefresh] = useState(0);
  const [adminConfigs, setAdminConfigs] = useState<{
    minigames: typeof DEFAULT_GAME_CONFIG;
    ads: typeof DEFAULT_AD_CONFIG;
    security: typeof DEFAULT_SECURITY_CONFIG;
    general: typeof DEFAULT_GENERAL_CONFIG;
  }>({ minigames: DEFAULT_GAME_CONFIG, ads: DEFAULT_AD_CONFIG, security: DEFAULT_SECURITY_CONFIG, general: DEFAULT_GENERAL_CONFIG });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const loadAdminConfigs = async () => {
    setConfigLoading(true);
    try {
      const { data, error } = await supabase
        .from('afk_admin_config')
        .select('config_key, config_value');
      if (error) throw error;
      const map = new Map((data ?? []).map((row: { config_key: string; config_value: unknown }) => [row.config_key, row.config_value]));
      setAdminConfigs({
        minigames: { ...DEFAULT_GAME_CONFIG, ...(map.get('minigames') as Partial<typeof DEFAULT_GAME_CONFIG> | undefined) },
        ads: { ...DEFAULT_AD_CONFIG, ...(map.get('ads') as Partial<typeof DEFAULT_AD_CONFIG> | undefined) },
        security: { ...DEFAULT_SECURITY_CONFIG, ...(map.get('security') as Partial<typeof DEFAULT_SECURITY_CONFIG> | undefined) },
        general: { ...DEFAULT_GENERAL_CONFIG, ...(map.get('general') as Partial<typeof DEFAULT_GENERAL_CONFIG> | undefined) },
      });
    } catch (error) {
      setNotice(`AFK admin settings load failed: ${error instanceof Error ? error.message : String(error)}. Run the AFK admin config SQL first.`);
    } finally {
      setConfigLoading(false);
    }
  };

  const saveAdminConfig = async (key: 'minigames' | 'ads' | 'security' | 'general') => {
    setConfigSaving(true);
    setNotice('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Login required.');
      const { error } = await supabase.from('afk_admin_config').upsert({
        config_key: key,
        config_value: adminConfigs[key],
        updated_by: authData.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'config_key' });
      if (error) throw error;
      setNotice(`${key} configuration saved to Supabase.`);
    } catch (error) {
      setNotice(`Save ${key} failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => { void loadAdminConfigs(); }, []);

  // Load AFK settings from Supabase when this page opens.
  useEffect(() => {
    let cancelled = false;

    const loadAfkSettings = async () => {
      setSettingsLoading(true);
      try {
        const { data, error } = await supabase
          .from('afk_settings')
          .select('enabled, minutes_per_reward, coins_per_reward, daily_coin_cap')
          .eq('id', 'global')
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error(
            'AFK settings row পাওয়া যায়নি। Step 3 SQL সফলভাবে run হয়েছে কি না দেখো।'
          );
        }
        if (cancelled) return;

        setEnabled(data.enabled);
        setRewardMinutes(String(data.minutes_per_reward));
        setRewardCoins(String(data.coins_per_reward));
        setDailyCap(String(data.daily_coin_cap));
        setNotice('AFK settings loaded successfully.');
      } catch (error) {
        console.error('AFK settings load failed:', error);
        if (!cancelled) {
          setNotice(
            `Settings load failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    };

    void loadAfkSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'missions') return;

    let cancelled = false;

    const loadMissions = async () => {
      setMissionsLoading(true);
      try {
        const { data, error } = await supabase
          .from('afk_daily_missions')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!cancelled) setMissions((data ?? []) as AfkMission[]);
      } catch (error) {
        console.error('AFK missions load failed:', error);
        if (!cancelled) {
          setNotice(
            `Missions load failed: ${error instanceof Error ? error.message : String(error)}. Step 5 SQL ও AFK admin permission check করো।`
          );
        }
      } finally {
        if (!cancelled) setMissionsLoading(false);
      }
    };

    void loadMissions();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const resetMissionForm = () => {
    setEditingMissionId(null);
    setMissionDraft(emptyMissionDraft());
  };

  const editMission = (mission: AfkMission) => {
    setEditingMissionId(mission.id);
    setMissionDraft({
      title: mission.title,
      description: mission.description ?? '',
      mission_type: mission.mission_type,
      target: String(mission.target),
      reward_coins: String(mission.reward_coins),
      is_active: mission.is_active,
      sort_order: String(mission.sort_order),
      starts_at: toDateTimeLocal(mission.starts_at),
      ends_at: toDateTimeLocal(mission.ends_at),
    });
    setNotice('');
  };

  const saveMission = async () => {
    setNotice('');

    const title = missionDraft.title.trim();
    const description = missionDraft.description.trim();
    const target = Number(missionDraft.target);
    const rewardCoins = Number(missionDraft.reward_coins);
    const sortOrder = Number(missionDraft.sort_order);

    if (!title || title.length > 100) {
      setNotice('Mission title 1 থেকে 100 characters-এর মধ্যে হতে হবে।');
      return;
    }
    if (description.length > 500) {
      setNotice('Mission description সর্বোচ্চ 500 characters হতে পারবে।');
      return;
    }
    if (!Number.isInteger(target) || target < 1 || target > 1000000) {
      setNotice('Mission target 1 থেকে 1,000,000-এর মধ্যে পূর্ণসংখ্যা হতে হবে।');
      return;
    }
    if (!Number.isSafeInteger(rewardCoins) || rewardCoins < 0 || rewardCoins > 1000000000) {
      setNotice('Reward Coins 0 থেকে 1,000,000,000-এর মধ্যে হতে হবে।');
      return;
    }
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000000) {
      setNotice('Sort order 0 বা তার বেশি পূর্ণসংখ্যা হতে হবে।');
      return;
    }

    const startsAt = missionDraft.starts_at
      ? new Date(missionDraft.starts_at)
      : null;
    const endsAt = missionDraft.ends_at
      ? new Date(missionDraft.ends_at)
      : null;

    if (startsAt && Number.isNaN(startsAt.getTime())) {
      setNotice('Start date/time সঠিক নয়।');
      return;
    }
    if (endsAt && Number.isNaN(endsAt.getTime())) {
      setNotice('End date/time সঠিক নয়।');
      return;
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      setNotice('End date/time অবশ্যই start date/time-এর পরে হতে হবে।');
      return;
    }

    setMissionSaving(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Mission save করতে login করতে হবে।');

      const payload = {
        title,
        description,
        mission_type: missionDraft.mission_type,
        target,
        reward_coins: rewardCoins,
        is_active: missionDraft.is_active,
        sort_order: sortOrder,
        starts_at: startsAt ? startsAt.toISOString() : null,
        ends_at: endsAt ? endsAt.toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editingMissionId) {
        const { data, error } = await supabase
          .from('afk_daily_missions')
          .update(payload)
          .eq('id', editingMissionId)
          .select('*')
          .single();
        if (error) throw error;

        setMissions((current) =>
          current.map((item) => item.id === editingMissionId ? data as AfkMission : item)
        );
        setNotice('Mission successfully updated.');
      } else {
        const { data, error } = await supabase
          .from('afk_daily_missions')
          .insert({ ...payload, created_by: user.id })
          .select('*')
          .single();
        if (error) throw error;

        setMissions((current) => [data as AfkMission, ...current].sort((a, b) =>
          a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at)
        ));
        setNotice('Mission successfully created.');
      }

      resetMissionForm();
    } catch (error) {
      console.error('AFK mission save failed:', error);
      setNotice(
        `Mission save failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setMissionSaving(false);
    }
  };

  const toggleMission = async (mission: AfkMission) => {
    setNotice('');
    try {
      const { data, error } = await supabase
        .from('afk_daily_missions')
        .update({ is_active: !mission.is_active, updated_at: new Date().toISOString() })
        .eq('id', mission.id)
        .select('id, is_active')
        .single();
      if (error) throw error;

      setMissions((current) => current.map((item) =>
        item.id === mission.id ? { ...item, is_active: data.is_active } : item
      ));
      setNotice(`Mission ${data.is_active ? 'activated' : 'deactivated'}.`);
    } catch (error) {
      console.error('AFK mission status update failed:', error);
      setNotice(
        `Status update failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const deleteMission = async (mission: AfkMission) => {
    const confirmed = window.confirm(
      `Delete mission "${mission.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setNotice('');
    try {
      const { error } = await supabase
        .from('afk_daily_missions')
        .delete()
        .eq('id', mission.id);
      if (error) throw error;

      setMissions((current) => current.filter((item) => item.id !== mission.id));
      if (editingMissionId === mission.id) resetMissionForm();
      setNotice('Mission deleted.');
    } catch (error) {
      console.error('AFK mission delete failed:', error);
      setNotice(
        `Delete failed: ${error instanceof Error ? error.message : String(error)}. Mission already referenced by claim history হলে SQL-এর ON DELETE RESTRICT delete আটকাবে।`
      );
    }
  };

  useEffect(() => {
    if (!['overview', 'users', 'logs'].includes(activeTab)) return;
    let cancelled = false;
    const loadLiveData = async () => {
      setLiveDataLoading(true);
      try {
        const [sessionsResult, txResult, claimsResult, promoResult] = await Promise.all([
          supabase.from('afk_sessions')
            .select('id,user_id,started_at,last_heartbeat_at,status,active_seconds,reward_coins')
            .order('started_at', { ascending: false }).limit(100),
          supabase.from('afk_coin_transactions')
            .select('id,user_id,amount,transaction_type,description,created_at')
            .order('created_at', { ascending: false }).limit(100),
          supabase.from('afk_mission_claims')
            .select('id,reward_coins,claimed_at').gte('claimed_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
          supabase.from('afk_promo_redemptions')
            .select('id,reward_coins,redeemed_at').gte('redeemed_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
        ]);
        if (sessionsResult.error) throw sessionsResult.error;
        if (cancelled) return;
        const sessions = (sessionsResult.data ?? []) as typeof liveSessions;
        const transactions = (txResult.data ?? []) as typeof coinTransactions;
        setLiveSessions(sessions);
        if (!txResult.error) setCoinTransactions(transactions);
        const today = new Date(); today.setHours(0,0,0,0);
        const coinsToday = transactions
          .filter((item) => new Date(item.created_at) >= today && Number(item.amount) > 0)
          .reduce((sum, item) => sum + Number(item.amount), 0);
        setDashboardStats({
          activeUsers: sessions.filter((item) => item.status === 'active' &&
            Date.now() - new Date(item.last_heartbeat_at).getTime() <= 90000).length,
          coinsToday,
          missionClaimsToday: claimsResult.error ? 0 : (claimsResult.data ?? []).length,
          promoRedemptions: promoResult.error ? 0 : (promoResult.data ?? []).length,
        });
        if (txResult.error && activeTab === 'logs') {
          setNotice(`Coin history load failed: ${txResult.error.message}`);
        }
      } catch (error) {
        console.error('AFK live data load failed:', error);
        if (!cancelled) setNotice(
          `Live AFK data load failed: ${error instanceof Error ? error.message : String(error)}. AFK Step 3/8/10 SQL ও admin read policy check করো।`
        );
      } finally {
        if (!cancelled) setLiveDataLoading(false);
      }
    };
    void loadLiveData();
    return () => { cancelled = true; };
  }, [activeTab, liveRefresh]);

  const loadPromos = async () => {
    setPromosLoading(true);
    try {
      const promoResult = await supabase.rpc('admin_list_afk_promos');
      if (promoResult.error) throw promoResult.error;
      setPromos((promoResult.data ?? []) as AfkPromo[]);

      const redemptionResult = await supabase.rpc('admin_list_afk_promo_redemptions');
      if (redemptionResult.error) {
        console.error('AFK redemption history load failed:', redemptionResult.error);
        setPromoRedemptions([]);
        setNotice(
          `Promo codes loaded, but redemption history failed: ${redemptionResult.error.message}`
        );
        return;
      }
      setPromoRedemptions((redemptionResult.data ?? []) as AfkPromoRedemption[]);
    } catch (error) {
      console.error('AFK promo load failed:', error);
      setNotice(
        `Promo load failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setPromosLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'promos') return;

    let cancelled = false;

    const loadPromoData = async () => {
      setPromosLoading(true);
      try {
        const promoResult = await supabase.rpc('admin_list_afk_promos');
        if (promoResult.error) throw promoResult.error;

        if (!cancelled) setPromos((promoResult.data ?? []) as AfkPromo[]);

        const redemptionResult = await supabase.rpc('admin_list_afk_promo_redemptions');
        if (redemptionResult.error) {
          console.error('AFK redemption history load failed:', redemptionResult.error);
          if (!cancelled) {
            setPromoRedemptions([]);
            setNotice(
              `Promo codes loaded, but redemption history failed: ${redemptionResult.error.message}`
            );
          }
          return;
        }

        if (!cancelled) {
          setPromoRedemptions((redemptionResult.data ?? []) as AfkPromoRedemption[]);
        }
      } catch (error) {
        console.error('AFK promo load failed:', error);
        if (!cancelled) {
          setNotice(
            `Promo load failed: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } finally {
        if (!cancelled) setPromosLoading(false);
      }
    };

    void loadPromoData();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const resetPromoForm = () => {
    setEditingPromoId(null);
    setPromoCode('');
    setPromoReward('100');
    setPromoMaxUses('');
    setPromoExpiresAt('');
    setPromoActive(true);
  };

  const editPromo = (promo: AfkPromo) => {
    setEditingPromoId(promo.id);
    setPromoCode(promo.code);
    setPromoReward(String(promo.reward_coins));
    setPromoMaxUses(
      promo.max_uses === null ? '' : String(promo.max_uses)
    );
    setPromoExpiresAt(toDateTimeLocal(promo.expires_at));
    setPromoActive(promo.is_active);
    setNotice('');
  };

  const savePromo = async () => {
    setNotice('');

    const code = promoCode.trim().toUpperCase();
    const reward = Number(promoReward);
    const maxUses =
      promoMaxUses.trim() === '' ? null : Number(promoMaxUses);

    if (!code || code.length > 50) {
      setNotice('Promo code 1–50 characters হতে হবে।');
      return;
    }

    if (!Number.isSafeInteger(reward) || reward < 1) {
      setNotice('Reward Coins positive পূর্ণসংখ্যা হতে হবে।');
      return;
    }

    if (
      maxUses !== null &&
      (!Number.isSafeInteger(maxUses) || maxUses < 1)
    ) {
      setNotice('Max uses 1 বা তার বেশি হতে হবে, অথবা ফাঁকা রাখো।');
      return;
    }

    const expiresAt = promoExpiresAt ? new Date(promoExpiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      setNotice('Expiry date/time সঠিক নয়।');
      return;
    }

    setPromoSaving(true);
    try {
      const { error } = await supabase.rpc('admin_save_afk_promo', {
        p_code: code,
        p_reward_coins: reward,
        p_max_uses: maxUses,
        p_expires_at: expiresAt ? expiresAt.toISOString() : null,
        p_is_active: promoActive,
      });

      if (error) throw error;

      setNotice(
        editingPromoId
          ? 'Promo details saved. Existing code was matched by code.'
          : 'Promo code created successfully.'
      );
      resetPromoForm();
      await loadPromos();
    } catch (error) {
      console.error('AFK promo save failed:', error);
      setNotice(
        `Promo save failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setPromoSaving(false);
    }
  };

  const togglePromo = async (promo: AfkPromo) => {
    setNotice('');
    try {
      const { error } = await supabase.rpc('admin_toggle_afk_promo', {
        p_promo_id: promo.id,
        p_is_active: !promo.is_active,
      });

      if (error) throw error;

      setNotice(
        `Promo ${!promo.is_active ? 'activated' : 'deactivated'}.`
      );
      await loadPromos();
    } catch (error) {
      setNotice(
        `Status update failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const deletePromo = async (promo: AfkPromo) => {
    const confirmed = window.confirm(
      `Delete promo code "${promo.code}"? This cannot be undone. Promo codes with redemption history cannot be deleted; deactivate those instead.`
    );
    if (!confirmed) return;

    setNotice('');
    try {
      const { error } = await supabase.rpc('admin_delete_afk_promo', {
        p_promo_id: promo.id,
      });
      if (error) throw error;

      setPromos((current) => current.filter((item) => item.id !== promo.id));
      if (editingPromoId === promo.id) resetPromoForm();
      setNotice(`Promo code ${promo.code} deleted.`);
      await loadPromos();
    } catch (error) {
      console.error('AFK promo delete failed:', error);
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      setNotice(
        `Promo delete failed: ${errorMessage || 'Unknown error. Check browser console.'}`
      );
    }
  };

  const saveAfkSettings = async (enabledOverride?: boolean) => {
    setNotice('');
    const enabledToSave = enabledOverride ?? enabled;
    const minutes = Number(rewardMinutes);
    const coins = Number(rewardCoins);
    const cap = Number(dailyCap);

    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setNotice('Reward interval 1–1440 minutes হতে হবে.');
      return;
    }
    if (!Number.isInteger(coins) || coins < 0 || coins > 1000000) {
      setNotice('Coins per reward-এর মান সঠিক নয়।');
      return;
    }
    if (!Number.isSafeInteger(cap) || cap < 0) {
      setNotice('Daily coin limit-এর মান সঠিক নয়।');
      return;
    }

    setSettingsSaving(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Settings save করতে login করতে হবে।');

      const { data, error } = await supabase
        .from('afk_settings')
        .update({
          enabled: enabledToSave,
          minutes_per_reward: minutes,
          coins_per_reward: coins,
          daily_coin_cap: cap,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'global')
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error(
          'Save হয়নি। Global settings row ও admin permission/RLS policy check করো।'
        );
      }

      setEnabled(enabledToSave);
      setNotice(`AFK settings saved successfully. AFK is now ${enabledToSave ? 'ENABLED' : 'DISABLED'}.`);
    } catch (error) {
      console.error('AFK settings save failed:', error);
      if (enabledOverride !== undefined) setEnabled(!enabledToSave);
      setNotice(
        `Settings save failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const activeSection = sections.find(
    (item) => item.id === activeTab
  );
  const heading = (
    title: string,
    description: string
  ) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
  return (
    <AdminLayout active="afk" permission="afk">
      <div className="mx-auto max-w-[1500px] space-y-6 text-white">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10">
            <Zap className="h-7 w-7 text-purple-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold sm:text-3xl">
                AFK Management
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Butterfly Network · AFK Rewards Control Center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border border-white/10 px-3 py-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              enabled ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
          <span className="text-xs text-slate-300">
            AFK: {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[230px_minmax(0,1fr)]">
        {/* AFK sections inside one admin page */}
        <aside className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            AFK Control
          </p>
          <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const selected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setNotice('');
                  }}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-xs font-medium transition ${
                    selected
                      ? 'bg-purple-600/20 text-purple-200 ring-1 ring-purple-400/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
        {/* Current section */}
        <main className="min-w-0 space-y-5">
          {activeSection && (
            <div className={`${panel} flex items-center gap-3`}>
              {React.createElement(activeSection.icon, {
                className: 'h-6 w-6 text-purple-300',
              })}
              <div>
                <h2 className="font-semibold">{activeSection.label}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  AFK Control Center
                </p>
              </div>
            </div>
          )}
          {activeTab === 'overview' && (
            <>
              {heading(
                'Dashboard Overview',
                'AFK system-এর activity, rewards ও quick controls এক জায়গায়।'
              )}
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  { label: 'Active AFK Users', icon: Users, value: dashboardStats.activeUsers },
                  { label: 'Coins Earned Today', icon: BadgeDollarSign, value: dashboardStats.coinsToday },
                  { label: 'Mission Claims Today', icon: CalendarCheck2, value: dashboardStats.missionClaimsToday },
                  { label: 'Promo Redemptions Today', icon: Ticket, value: dashboardStats.promoRedemptions },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className={panel}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-400">
                          {item.label}
                        </span>
                        <Icon className="h-5 w-5 text-purple-300" />
                      </div>
                      <p className="mt-4 text-2xl font-bold">
                        {liveDataLoading ? '…' : Number(item.value).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Live Supabase data
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className={panel}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">AFK System</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Global AFK status saved in Supabase.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextEnabled = !enabled;
                      setEnabled(nextEnabled);
                      void saveAfkSettings(nextEnabled);
                    }}
                    disabled={settingsSaving}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${
                      enabled
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-slate-500/15 text-slate-300'
                    }`}
                  >
                    {enabled ? 'Enabled' : 'Disabled'} · Toggle
                  </button>
                </div>
              </div>
            </>
          )}
          {activeTab === 'rules' && (
            <>
              {heading(
                'AFK Reward Rules',
                'AFK সময়, coin rate, daily cap ও earning policy।'
              )}
              <div className={`${panel} grid gap-5 md:grid-cols-2`}>
                <label className="text-sm text-slate-300">
                  Reward interval (minutes)
                  <input
                    className={field}
                    type="number"
                    min="1"
                    value={rewardMinutes}
                    onChange={(e) => setRewardMinutes(e.target.value)}
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Coins per interval
                  <input
                    className={field}
                    type="number"
                    min="0"
                    value={rewardCoins}
                    onChange={(e) => setRewardCoins(e.target.value)}
                  />
                </label>
                <label className="text-sm text-slate-300 md:col-span-2">
                  Maximum AFK coins per day
                  <input
                    className={field}
                    type="number"
                    min="0"
                    value={dailyCap}
                    onChange={(e) => setDailyCap(e.target.value)}
                  />
                </label>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => void saveAfkSettings()}
                    disabled={settingsLoading || settingsSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {settingsLoading
                      ? 'Loading Settings...'
                      : settingsSaving
                        ? 'Saving...'
                        : 'Save Settings'}
                  </button>
                </div>
              </div>
            </>
          )}
          {activeTab === 'missions' && (
            <>
              {heading(
                'Daily Missions',
                'Mission তৈরি/edit, reward, schedule এবং active status এই section থেকে পরিচালনা করো।'
              )}

              <div className={`${panel} space-y-5`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {editingMissionId ? 'Edit Mission' : 'Create Mission'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Mission config Supabase-এ save হবে। Player claim/reward processing এখনো চালু নয়।
                    </p>
                  </div>
                  {editingMissionId && (
                    <button
                      type="button"
                      onClick={resetMissionForm}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                    >
                      <X className="h-4 w-4" /> Cancel edit
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-300 md:col-span-2">
                    Mission title *
                    <input
                      className={field}
                      maxLength={100}
                      value={missionDraft.title}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, title: event.target.value }))}
                      placeholder="Stay AFK for 30 minutes"
                    />
                  </label>

                  <label className="text-sm text-slate-300 md:col-span-2">
                    Description
                    <textarea
                      className={field}
                      rows={2}
                      maxLength={500}
                      value={missionDraft.description}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, description: event.target.value }))}
                      placeholder="Describe what the player needs to do..."
                    />
                  </label>

                  <label className="text-sm text-slate-300">
                    Mission type
                    <select
                      className={field}
                      value={missionDraft.mission_type}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, mission_type: event.target.value as MissionType }))}
                    >
                      <option value="afk_minutes">Stay AFK for minutes</option>
                      <option value="minigame_wins">Win mini-games</option>
                      <option value="games_played">Play mini-games</option>
                      <option value="daily_visit">Daily visit</option>
                    </select>
                  </label>

                  <label className="text-sm text-slate-300">
                    Target amount *
                    <input
                      className={field}
                      type="number"
                      min="1"
                      max="1000000"
                      step="1"
                      value={missionDraft.target}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, target: event.target.value }))}
                    />
                  </label>

                  <label className="text-sm text-slate-300">
                    Reward Coins *
                    <input
                      className={field}
                      type="number"
                      min="0"
                      max="1000000000"
                      step="1"
                      value={missionDraft.reward_coins}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, reward_coins: event.target.value }))}
                    />
                  </label>

                  <label className="text-sm text-slate-300">
                    Sort order
                    <input
                      className={field}
                      type="number"
                      min="0"
                      step="1"
                      value={missionDraft.sort_order}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, sort_order: event.target.value }))}
                    />
                  </label>

                  <label className="text-sm text-slate-300">
                    Starts at (optional)
                    <input
                      className={field}
                      type="datetime-local"
                      value={missionDraft.starts_at}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, starts_at: event.target.value }))}
                    />
                  </label>

                  <label className="text-sm text-slate-300">
                    Ends at (optional)
                    <input
                      className={field}
                      type="datetime-local"
                      value={missionDraft.ends_at}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, ends_at: event.target.value }))}
                    />
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm text-slate-300 md:col-span-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-purple-500"
                      checked={missionDraft.is_active}
                      onChange={(event) => setMissionDraft((draft) => ({ ...draft, is_active: event.target.checked }))}
                    />
                    Mission active
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void saveMission()}
                  disabled={missionSaving || missionsLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {missionSaving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {missionSaving ? 'Saving...' : editingMissionId ? 'Update Mission' : 'Create Mission'}
                </button>
              </div>

              <div className={`${panel} space-y-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Saved Missions</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {missions.length} mission{missions.length === 1 ? '' : 's'} in database
                    </p>
                  </div>
                  {missionsLoading && <RefreshCw className="h-4 w-4 animate-spin text-purple-300" />}
                </div>

                {missionsLoading ? (
                  <p className="py-6 text-sm text-slate-400">Loading missions...</p>
                ) : missions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <ListChecks className="mx-auto h-8 w-8 text-slate-500" />
                    <p className="mt-3 font-medium">No missions created yet</p>
                    <p className="mt-1 text-sm text-slate-500">
                      উপরের form দিয়ে প্রথম mission তৈরি করো।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missions.map((mission) => (
                      <div key={mission.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold">{mission.title}</h4>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${mission.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-400/10 text-slate-300'}`}>
                                {mission.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {mission.description && (
                              <p className="mt-1 text-sm text-slate-400">{mission.description}</p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                              <span className="rounded-lg bg-white/5 px-2.5 py-1">{missionTypeLabels[mission.mission_type]}</span>
                              <span className="rounded-lg bg-white/5 px-2.5 py-1">Target: {mission.target}</span>
                              <span className="rounded-lg bg-purple-400/10 px-2.5 py-1 text-purple-200">Reward: {mission.reward_coins} Coins</span>
                              <span className="rounded-lg bg-white/5 px-2.5 py-1">Order: {mission.sort_order}</span>
                            </div>
                            {(mission.starts_at || mission.ends_at) && (
                              <p className="mt-2 text-xs text-slate-500">
                                {mission.starts_at ? `Starts: ${new Date(mission.starts_at).toLocaleString()}` : 'No start limit'}
                                {' · '}
                                {mission.ends_at ? `Ends: ${new Date(mission.ends_at).toLocaleString()}` : 'No end limit'}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => editMission(mission)}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleMission(mission)}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                            >
                              {mission.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteMission(mission)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs leading-5 text-slate-500">
                  Security: mission management requires the AFK admin permission in Supabase RLS. This section only manages mission definitions; it does not grant player rewards or accept claims.
                </p>
              </div>
            </>
          )}
          {activeTab === 'games' && (
            <>
              {heading('Mini-game Configuration', 'Reward, cooldown, daily limit ও game availability Supabase-এ save হবে।')}
              {configLoading ? <div className={panel}>Loading configuration…</div> : (
                <div className="space-y-4">
                  {([
                    ['tic_tac_toe', 'Tic-Tac-Toe', Gamepad2],
                    ['rock_paper_scissors', 'Rock Paper Scissors', Activity],
                    ['number_guessing', 'Number Guessing', BrainCircuit],
                    ['memory_match', 'Memory Match', BrainCircuit],
                    ['reaction_challenge', 'Reaction Challenge', Zap],
                    ['math_challenge', 'Math Challenge', BadgeDollarSign],
                    ['higher_or_lower', 'Higher or Lower', Activity],
                    ['word_scramble', 'Word Scramble', BrainCircuit],
                  ] as const).map(([key, title, Icon]) => {
                    const game = adminConfigs.minigames[key];
                    return <div className={panel} key={key}>
                      <div className="mb-4 flex items-center gap-3"><Icon className="h-5 w-5 text-purple-300"/><h3 className="font-semibold">{title}</h3></div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-sm text-slate-300">Enabled<select className={field} value={game.enabled ? 'true' : 'false'} onChange={e => setAdminConfigs(c => ({...c, minigames: {...c.minigames, [key]: {...c.minigames[key], enabled: e.target.value === 'true'}}}))}><option value="true">Enabled</option><option value="false">Disabled</option></select></label>
                        <label className="text-sm text-slate-300">Win reward coins<input className={field} type="number" min="0" value={game.reward_coins} onChange={e => setAdminConfigs(c => ({...c, minigames: {...c.minigames, [key]: {...c.minigames[key], reward_coins: Math.max(0, Number(e.target.value) || 0)}}}))}/></label>
                        <label className="text-sm text-slate-300">Cooldown (minutes)<input className={field} type="number" min="0" value={game.cooldown_minutes} onChange={e => setAdminConfigs(c => ({...c, minigames: {...c.minigames, [key]: {...c.minigames[key], cooldown_minutes: Math.max(0, Number(e.target.value) || 0)}}}))}/></label>
                        <label className="text-sm text-slate-300">Daily limit<input className={field} type="number" min="0" value={game.daily_limit} onChange={e => setAdminConfigs(c => ({...c, minigames: {...c.minigames, [key]: {...c.minigames[key], daily_limit: Math.max(0, Number(e.target.value) || 0)}}}))}/></label>
                        <label className="text-sm text-slate-300">Difficulty<select className={field} value={game.difficulty ?? 'normal'} onChange={e => setAdminConfigs(c => ({...c, minigames: {...c.minigames, [key]: {...c.minigames[key], difficulty: e.target.value}}}))}><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select></label>
                      </div>
                    </div>;
                  })}
                  <button type="button" disabled={configSaving} onClick={() => void saveAdminConfig('minigames')} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Save className="h-4 w-4"/>{configSaving ? 'Saving…' : 'Save Mini-game Settings'}</button>
                  <p className="text-xs text-slate-500">Each game can be enabled/disabled independently. Reward, cooldown, daily limit and difficulty are saved in Supabase. Player rewards must be verified by a server-side claim function.</p>
                </div>
              )}
            </>
          )}
          {activeTab === 'promos' && (
            <>
              {heading(
                'Promo Code Manager',
                'Create codes, manage rewards, expiry, usage limits and redemption history.'
              )}

              <div className={`${panel} space-y-5`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    {editingPromoId ? 'Edit Promo Code' : 'Create Promo Code'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => void loadPromos()}
                    disabled={promosLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${promosLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Promo code
                    <input
                      className={field}
                      value={promoCode}
                      maxLength={50}
                      disabled={Boolean(editingPromoId)}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BUTTERFLY100"
                    />
                    {editingPromoId && (
                      <span className="mt-1 block text-xs text-slate-500">
                        Existing promo code name cannot be changed while editing.
                      </span>
                    )}
                  </label>

                  <label className="block text-sm text-slate-300">
                    Reward Coins
                    <input
                      className={field}
                      type="number"
                      min="1"
                      step="1"
                      value={promoReward}
                      onChange={(e) => setPromoReward(e.target.value)}
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    Maximum redemptions
                    <input
                      className={field}
                      type="number"
                      min="1"
                      step="1"
                      value={promoMaxUses}
                      onChange={(e) => setPromoMaxUses(e.target.value)}
                      placeholder="Unlimited"
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      ফাঁকা রাখলে unlimited uses।
                    </span>
                  </label>

                  <label className="block text-sm text-slate-300">
                    Expiry date/time
                    <input
                      className={field}
                      type="datetime-local"
                      value={promoExpiresAt}
                      onChange={(e) => setPromoExpiresAt(e.target.value)}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      ফাঁকা রাখলে expiry থাকবে না।
                    </span>
                  </label>
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={promoActive}
                    onChange={(e) => setPromoActive(e.target.checked)}
                    className="h-4 w-4 accent-purple-500"
                  />
                  Promo active
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void savePromo()}
                    disabled={promoSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold hover:bg-purple-500 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {promoSaving
                      ? 'Saving...'
                      : editingPromoId
                        ? 'Update Promo'
                        : 'Create Promo'}
                  </button>

                  {editingPromoId && (
                    <button
                      type="button"
                      onClick={resetPromoForm}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-slate-400">Preview</p>
                  <p className="mt-2 font-semibold">
                    {promoCode.trim().toUpperCase() || 'YOUR-CODE'}
                  </p>
                  <p className="mt-1 text-sm text-purple-300">
                    {promoReward || '0'} Coins
                  </p>
                </div>
              </div>

              <div className={`${panel} mt-6`}>
                <h3 className="mb-4 font-semibold">Existing Promo Codes</h3>

                {promosLoading ? (
                  <p className="text-sm text-slate-400">Loading promos...</p>
                ) : promos.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    কোনো promo code পাওয়া যায়নি।
                  </p>
                ) : (
                  <div className="space-y-3">
                    {promos.map((promo) => (
                      <div
                        key={promo.id}
                        className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold">{promo.code}</span>
                            <span className={`rounded-full px-2 py-1 text-xs ${
                              promo.is_active
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {promo.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-purple-300">
                            {promo.reward_coins.toLocaleString()} Coins
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Redeemed: {promo.used_count} / {promo.max_uses ?? 'Unlimited'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Expires: {promo.expires_at
                              ? new Date(promo.expires_at).toLocaleString()
                              : 'Never'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => editPromo(promo)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                          >
                            <Pencil className="mr-1 inline h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void togglePromo(promo)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                          >
                            {promo.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deletePromo(promo)}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="mr-1 inline h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`${panel} mt-6`}>
                <h3 className="mb-4 font-semibold">Redemption History</h3>
                {promosLoading ? (
                  <p className="text-sm text-slate-400">Loading history...</p>
                ) : promoRedemptions.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    এখনো কোনো redemption পাওয়া যায়নি।
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="px-3 py-3">Promo</th>
                          <th className="px-3 py-3">Player ID</th>
                          <th className="px-3 py-3">Reward</th>
                          <th className="px-3 py-3">Redeemed at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promoRedemptions.map((item) => (
                          <tr key={item.redemption_id} className="border-b border-white/5">
                            <td className="px-3 py-3 font-medium">{item.code}</td>
                            <td className="px-3 py-3 font-mono text-xs">{item.user_id}</td>
                            <td className="px-3 py-3 text-purple-300">
                              {item.reward_coins.toLocaleString()}
                            </td>
                            <td className="px-3 py-3 text-slate-400">
                              {new Date(item.redeemed_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              {heading('Live AFK Users', 'Active session heartbeat, start time, duration ও earned coins।')}
              <div className={panel}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{liveSessions.filter((item) => item.status === 'active' && Date.now() - new Date(item.last_heartbeat_at).getTime() <= 90000).length} active session(s)</p>
                  <button type="button" onClick={() => setLiveRefresh((value) => value + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Refresh data</button>
                </div>
                {liveDataLoading ? <p className="py-6 text-sm text-slate-400">Loading live sessions…</p> :
                  liveSessions.length === 0 ? <p className="py-6 text-sm text-slate-400">No AFK sessions found in database.</p> :
                  <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">User ID</th><th className="pb-3">Status</th><th className="pb-3">Started</th><th className="pb-3">Last heartbeat</th><th className="pb-3">Active time</th><th className="pb-3">Coins</th></tr></thead>
                    <tbody>{liveSessions.map((session) => <tr key={session.id} className="border-t border-white/5">
                      <td className="py-3 font-mono text-xs">{session.user_id}</td>
                      <td className="py-3"><span className={session.status === 'active' && Date.now() - new Date(session.last_heartbeat_at).getTime() <= 90000 ? 'text-emerald-300' : 'text-slate-400'}>{session.status}</span></td>
                      <td className="py-3 text-slate-300">{new Date(session.started_at).toLocaleString()}</td>
                      <td className="py-3 text-slate-300">{new Date(session.last_heartbeat_at).toLocaleString()}</td>
                      <td className="py-3">{Math.floor(Number(session.active_seconds || 0) / 60)}m</td>
                      <td className="py-3">{Number(session.reward_coins || 0).toLocaleString()}</td>
                    </tr>)}</tbody>
                  </table></div>}
              </div>
            </>
          )}
          {activeTab === 'logs' && (
            <>
              {heading('History & Logs', 'Recent AFK coin ledger entries from Supabase.')}
              <div className={panel}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">Latest {coinTransactions.length} transaction(s)</p>
                  <button type="button" onClick={() => setLiveRefresh((value) => value + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Refresh data</button>
                </div>
                {liveDataLoading ? <p className="py-6 text-sm text-slate-400">Loading coin history…</p> :
                  coinTransactions.length === 0 ? <p className="py-6 text-sm text-slate-400">No transactions found, or the admin role cannot read the ledger.</p> :
                  <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3">Time</th><th className="pb-3">User ID</th><th className="pb-3">Type</th><th className="pb-3">Amount</th><th className="pb-3">Description</th></tr></thead>
                    <tbody>{coinTransactions.map((tx) => <tr key={tx.id} className="border-t border-white/5">
                      <td className="py-3 text-slate-300">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="py-3 font-mono text-xs">{tx.user_id}</td>
                      <td className="py-3">{tx.transaction_type}</td>
                      <td className={`py-3 font-semibold ${Number(tx.amount) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}</td>
                      <td className="py-3 text-slate-400">{tx.description || '—'}</td>
                    </tr>)}</tbody>
                  </table></div>}
              </div>
            </>
          )}
          {activeTab === 'ads' && (
            <>
              {heading('Ads & Revenue Settings', 'Ad options are stored in Supabase. Add provider credentials through secure server-side secrets, not this public client.')}
              <div className={panel}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">Ads enabled<select className={field} value={adminConfigs.ads.enabled ? 'true' : 'false'} onChange={e => setAdminConfigs(c => ({...c, ads: {...c.ads, enabled: e.target.value === 'true'}}))}><option value="false">Disabled</option><option value="true">Enabled</option></select></label>
                  <label className="text-sm text-slate-300">Provider<select className={field} value={adminConfigs.ads.provider} onChange={e => setAdminConfigs(c => ({...c, ads: {...c.ads, provider: e.target.value}}))}><option value="none">None</option><option value="adsense">Google AdSense</option><option value="custom">Custom provider</option></select></label>
                  <label className="text-sm text-slate-300">Banner placement<select className={field} value={adminConfigs.ads.banner_enabled ? 'true' : 'false'} onChange={e => setAdminConfigs(c => ({...c, ads: {...c.ads, banner_enabled: e.target.value === 'true'}}))}><option value="false">Disabled</option><option value="true">Enabled</option></select></label>
                  <label className="text-sm text-slate-300">Rewarded ads<select className={field} value={adminConfigs.ads.rewarded_enabled ? 'true' : 'false'} onChange={e => setAdminConfigs(c => ({...c, ads: {...c.ads, rewarded_enabled: e.target.value === 'true'} }))}><option value="false">Disabled</option><option value="true">Enabled</option></select></label>
                  <label className="text-sm text-slate-300 sm:col-span-2">Daily impressions limit<input className={field} type="number" min="0" value={adminConfigs.ads.daily_impression_limit} onChange={e => setAdminConfigs(c => ({...c, ads: {...c.ads, daily_impression_limit: Math.max(0, Number(e.target.value) || 0)}}))}/></label>
                </div>
                <button type="button" disabled={configSaving} onClick={() => void saveAdminConfig('ads')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Save className="h-4 w-4"/>Save Ad Settings</button>
              </div>
            </>
          )}
          {activeTab === 'security' && (
            <>
              {heading('Security & Anti-Abuse', 'Security thresholds are saved to Supabase. Critical reward checks must also be enforced by server-side RPCs.')}
              <div className={panel}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">Duplicate claim cooldown (seconds)<input className={field} type="number" min="0" value={adminConfigs.security.duplicate_claim_cooldown_seconds} onChange={e => setAdminConfigs(c => ({...c, security: {...c.security, duplicate_claim_cooldown_seconds: Math.max(0, Number(e.target.value) || 0)}}))}/></label>
                  <label className="text-sm text-slate-300">Max sessions per user<input className={field} type="number" min="1" value={adminConfigs.security.max_sessions_per_user} onChange={e => setAdminConfigs(c => ({...c, security: {...c.security, max_sessions_per_user: Math.max(1, Number(e.target.value) || 1)}}))}/></label>
                  <label className="text-sm text-slate-300">Heartbeat timeout (seconds)<input className={field} type="number" min="15" value={adminConfigs.security.heartbeat_timeout_seconds} onChange={e => setAdminConfigs(c => ({...c, security: {...c.security, heartbeat_timeout_seconds: Math.max(15, Number(e.target.value) || 15)}}))}/></label>
                  <label className="text-sm text-slate-300">Suspicious reward threshold<input className={field} type="number" min="1" value={adminConfigs.security.suspicious_reward_threshold} onChange={e => setAdminConfigs(c => ({...c, security: {...c.security, suspicious_reward_threshold: Math.max(1, Number(e.target.value) || 1)}}))}/></label>
                  <label className="text-sm text-slate-300">Require server-side validation<select className={field} value={adminConfigs.security.require_server_validation ? 'true' : 'false'} onChange={e => setAdminConfigs(c => ({...c, security: {...c.security, require_server_validation: e.target.value === 'true'}}))}><option value="true">Required</option><option value="false">Not required</option></select></label>
                </div>
                <button type="button" disabled={configSaving} onClick={() => void saveAdminConfig('security')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Save className="h-4 w-4"/>Save Security Settings</button>
              </div>
            </>
          )}
          {activeTab === 'settings' && (
            <>
              {heading('General AFK Settings', 'Control feature visibility and maintenance mode. Changes are saved to Supabase.')}
              <div className={panel}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    ['maintenance_mode', 'Maintenance mode'],
                    ['show_afk_page', 'Show AFK page'],
                    ['show_daily_missions', 'Show daily missions'],
                    ['show_mini_games', 'Show mini-games'],
                  ] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 p-4 text-sm"><span>{label}</span><input type="checkbox" checked={adminConfigs.general[key]} onChange={e => setAdminConfigs(c => ({...c, general: {...c.general, [key]: e.target.checked}}))}/></label>)}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" disabled={configSaving} onClick={() => void saveAdminConfig('general')} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><Save className="h-4 w-4"/>Save General Settings</button>
                  <button type="button" disabled={configLoading} onClick={() => void loadAdminConfigs()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm"><RefreshCw className="h-4 w-4"/>Reload</button>
                </div>
              </div>
            </>
          )}
          {notice && (
            <div
              role="status"
              className="rounded-xl border border-purple-400/20 bg-purple-400/[0.06] p-4 text-sm text-purple-200"
            >
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              {notice}
            </div>
          )}
        </main>
      </div>
      </div>
    </AdminLayout>
  );
};
export default AdminAfk;