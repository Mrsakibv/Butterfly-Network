import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Power,
  RefreshCw,
  RotateCcw,
  Server,
  XCircle,
} from 'lucide-react';

import { AdminLayout } from './AdminLayout';
import { supabase } from '../../lib/supabase';

type BotStatus =
  | 'running'
  | 'stopped'
  | 'starting'
  | 'restarting'
  | 'error';

interface BotControl {
  id: string;
  bot_enabled: boolean;
  restart_requested: boolean;
  status: BotStatus;
  last_heartbeat: string | null;
  last_started_at: string | null;
  last_stopped_at: string | null;
  last_error: string | null;
  bot_version: string | null;
  bot_instance: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<
  BotStatus,
  {
    label: string;
    description: string;
    icon: React.ElementType;
  }
> = {
  running: {
    label: 'Running',
    description: 'Bot is online and working normally.',
    icon: CheckCircle2,
  },
  stopped: {
    label: 'Stopped',
    description: 'Bot is currently disabled.',
    icon: XCircle,
  },
  starting: {
    label: 'Starting',
    description: 'Bot is starting up.',
    icon: RefreshCw,
  },
  restarting: {
    label: 'Restarting',
    description: 'Bot restart has been requested.',
    icon: RotateCcw,
  },
  error: {
    label: 'Error',
    description: 'Bot reported an error.',
    icon: AlertCircle,
  },
};

const formatDate = (value: string | null) => {
  if (!value) return 'Never';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString();
};

const formatRelativeTime = (value: string | null) => {
  if (!value) return 'Never';

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
};

export const AdminBot: React.FC = () => {
  const [bot, setBot] = useState<BotControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadBot = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('bot_control')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setBot(data as BotControl | null);
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBot();

    const interval = window.setInterval(() => {
      loadBot();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadBot]);

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => {
      setMessage('');
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [message]);

  const updateBot = async (
    updates: Partial<
      Pick<
        BotControl,
        'bot_enabled' | 'restart_requested' | 'status'
      >
    >,
    successMessage: string
  ) => {
    if (!bot) return;

    setActionLoading(true);
    setError('');
    setMessage('');

    const { data, error: updateError } = await supabase
      .from('bot_control')
      .update(updates)
      .eq('id', bot.id)
      .select('*')
      .single();

    if (updateError) {
      setError(updateError.message);
      setActionLoading(false);
      return;
    }

    setBot(data as BotControl);
    setMessage(successMessage);
    setActionLoading(false);
  };

  const handleToggle = async () => {
    if (!bot) return;

    if (bot.bot_enabled) {
      await updateBot(
        {
          bot_enabled: false,
          restart_requested: false,
          status: 'stopped',
        },
        'AFK Bot has been turned OFF.'
      );
    } else {
      await updateBot(
        {
          bot_enabled: true,
          status: 'starting',
        },
        'AFK Bot has been turned ON.'
      );
    }
  };

  const handleRestart = async () => {
    if (!bot || !bot.bot_enabled) return;

    await updateBot(
      {
        restart_requested: true,
        status: 'restarting',
      },
      'Restart request sent to the bot.'
    );
  };

  if (loading) {
    return (
      <AdminLayout active="bot">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-white/60">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading bot control...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!bot) {
    return (
      <AdminLayout active="bot">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="mt-0.5 h-6 w-6 text-red-400" />

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Bot control is unavailable
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  {error ||
                    'No bot_control record was found in the database.'}
                </p>

                <button
                  onClick={loadBot}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[bot.status];
  const StatusIcon = statusConfig.icon;

  return (
    <AdminLayout active="bot">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Bot className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">
                  AFK Bot
                </h1>

                <p className="mt-1 text-sm text-white/50">
                  Control and monitor your Railway AFK automation bot.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadBot}
            disabled={actionLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                actionLoading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Status */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <StatusIcon
                    className={`h-8 w-8 ${
                      bot.status === 'running'
                        ? 'text-emerald-400'
                        : bot.status === 'error'
                          ? 'text-red-400'
                          : 'text-white/60'
                    } ${
                      bot.status === 'starting' ||
                      bot.status === 'restarting'
                        ? 'animate-spin'
                        : ''
                    }`}
                  />

                  {bot.status === 'running' && (
                    <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-emerald-400" />
                  )}
                </div>

                <div>
                  <p className="text-sm text-white/50">
                    Current Status
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {statusConfig.label}
                  </h2>

                  <p className="mt-1 text-sm text-white/50">
                    {statusConfig.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    bot.bot_enabled
                      ? 'bg-emerald-400'
                      : 'bg-white/30'
                  }`}
                />

                <span className="text-xs font-medium text-white/70">
                  {bot.bot_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleToggle}
                disabled={actionLoading}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  bot.bot_enabled
                    ? 'border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                <Power className="h-4 w-4" />

                {bot.bot_enabled
                  ? 'Turn Bot OFF'
                  : 'Turn Bot ON'}
              </button>

              <button
                onClick={handleRestart}
                disabled={actionLoading || !bot.bot_enabled}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                Restart Bot
              </button>
            </div>
          </div>

          {/* Live heartbeat */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <Activity className="h-5 w-5 text-white/70" />
              </div>

              <div>
                <p className="text-sm text-white/50">
                  Live Monitoring
                </p>

                <h3 className="font-semibold text-white">
                  Heartbeat
                </h3>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-bold text-white">
                {formatRelativeTime(bot.last_heartbeat)}
              </p>

              <p className="mt-2 text-sm text-white/40">
                Last heartbeat: {formatDate(bot.last_heartbeat)}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-white/40">
              <Clock3 className="h-4 w-4" />
              Auto-refresh every 3 seconds
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-white/50" />

              <span className="text-sm text-white/50">
                Bot Instance
              </span>
            </div>

            <p className="mt-4 truncate text-sm font-medium text-white">
              {bot.bot_instance || 'Not reported'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-white/50" />

              <span className="text-sm text-white/50">
                Bot Version
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-white">
              {bot.bot_version || 'Not reported'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-white/50" />

              <span className="text-sm text-white/50">
                Last Started
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-white">
              {formatDate(bot.last_started_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-white/50" />

              <span className="text-sm text-white/50">
                Last Stopped
              </span>
            </div>

            <p className="mt-4 text-sm font-medium text-white">
              {formatDate(bot.last_stopped_at)}
            </p>
          </div>
        </div>

        {/* Error */}
        {bot.last_error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-red-300">
                  Last Bot Error
                </h3>

                <p className="mt-2 break-words text-sm leading-6 text-red-200/70">
                  {bot.last_error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Restart request indicator */}
        {bot.restart_requested && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            <RotateCcw className="h-5 w-5" />
            Restart request is waiting for the Railway bot.
          </div>
        )}
      </div>
    </AdminLayout>
  );
};