import React, { useEffect } from 'react';
import { CalendarDays, Sparkles, Trophy, Gift } from 'lucide-react';
import { usePageItems } from '../hooks/usePageItems';

export const EventsPage: React.FC = () => {
  const pageItems = usePageItems('events');

  useEffect(() => {
    document.title = 'Events | Butterfly network';
  }, []);

  const defaultEvents = [
    {
      title: 'Weekend PvP Tournament',
      date: 'Every Saturday',
      detail: 'Battle in ranked duels and win exclusive cosmetics, ranks, and bragging rights.',
      icon: Trophy,
    },
    {
      title: 'Community Build Contest',
      date: 'Monthly',
      detail: 'Show off your builds, vote for your favorites, and celebrate the best creations in the server.',
      icon: Sparkles,
    },
    {
      title: 'Daily Giveaways',
      date: 'Live in Discord',
      detail: 'Join us for recurring giveaways and special rewards for active members.',
      icon: Gift,
    },
  ];
  const events = pageItems.length > 0 ? pageItems.map((item, index) => ({
    title: item.title,
    date: item.subtitle,
    detail: item.description,
    icon: [Trophy, Sparkles, Gift][index % 3],
  })) : defaultEvents;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <CalendarDays className="h-3.5 w-3.5 text-purple-400" />
            Community Events
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ongoing adventures and big moments
          </h1>
          <p className="mt-4 text-base text-slate-300">
            We host themed events, competitions, and community challenges to keep the server fresh, competitive, and fun.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {events.map(({ title, date, detail, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-purple-300">{date}</div>
              <h2 className="mb-3 text-xl font-bold text-white">{title}</h2>
              <p className="text-sm leading-relaxed text-slate-400">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
