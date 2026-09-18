import React from 'react';
import { ShieldCheck, Crown, Sparkles, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role?: string | null;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
  if (!role || role === 'user' || role === 'member') {
    return null;
  }

  const normalized = role.toLowerCase().trim();

  let label = role.toUpperCase();
  let badgeClasses = 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10';
  let Icon = ShieldCheck;

  if (normalized === 'owner') {
    label = 'OWNER';
    badgeClasses = 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    Icon = Crown;
  } else if (normalized === 'admin') {
    label = 'ADMIN';
    badgeClasses = 'bg-gradient-to-r from-red-500/20 via-rose-500/20 to-purple-500/20 text-rose-300 border-red-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
    Icon = ShieldCheck;
  } else if (normalized === 'gamemod' || normalized === 'mod' || normalized === 'moderator') {
    label = 'MOD';
    badgeClasses = 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]';
    Icon = ShieldCheck;
  } else if (normalized === 'vip' || normalized === 'mvp' || normalized === 'pro') {
    label = normalized.toUpperCase();
    badgeClasses = 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
    Icon = Sparkles;
  } else if (normalized === 'staff') {
    label = 'STAFF';
    badgeClasses = 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.25)]';
    Icon = UserCheck;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${badgeClasses} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
};
