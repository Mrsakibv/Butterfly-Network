import React, { useEffect } from 'react';
import { Gamepad2, Rocket, Shield, Sparkles } from 'lucide-react';
import { usePageItems } from '../hooks/usePageItems';

export const CommandsPage: React.FC = () => {
  const pageItems = usePageItems('commands');

  useEffect(() => {
    document.title = 'Commands | Butterfly network';
  }, []);

  const defaultCommands = [
    { command: '/spawn', description: 'Return to the main lobby instantly.' },
    { command: '/warp', description: 'Travel to special event, lobby, or shop areas.' },
    { command: '/kits', description: 'Open the available starter and ranked starter kits.' },
    { command: '/msg', description: 'Send a private message to another player.' },
    { command: '/helpop', description: 'Ask staff for support in an emergency or issue.' },
    { command: '/vote', description: 'Vote for the server and claim rewards.' },
  ];
  const commands = pageItems.length > 0 ? pageItems.map((item) => ({
    command: item.title,
    description: item.description,
  })) : defaultCommands;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-3.5 py-1.5 text-xs font-semibold text-purple-300">
            <Gamepad2 className="h-3.5 w-3.5 text-purple-400" />
            Commands
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Useful in-game commands
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Learn the essentials and move around the server with confidence.
          </p>
        </div>

        <div className="grid gap-4">
          {commands.map(({ command, description }, index) => (
            <div
              key={command}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
                  {index % 3 === 0 ? <Rocket className="h-5 w-5" /> : index % 3 === 1 ? <Shield className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-mono text-lg font-bold text-white">{command}</div>
                  <div className="text-sm text-slate-400">{description}</div>
                </div>
              </div>
              <div className="rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                Ready to use
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
