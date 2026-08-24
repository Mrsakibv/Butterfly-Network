import React, { useEffect, useState } from 'react';
import { SERVER_CONFIG } from '../config/server';
import { CopyIpButton } from '../components/CopyIpButton';
import { 
  Monitor, 
  Smartphone, 
  Gamepad, 
  Check, 
  HelpCircle, 
  ShieldAlert, 
  Terminal, 
  Wifi, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';

interface HowToPlayPageProps {
  onOpenPlayModal: () => void;
}

export const HowToPlayPage: React.FC<HowToPlayPageProps> = () => {
  const [activePlatform, setActivePlatform] = useState<'java' | 'bedrock' | 'console'>('java');

  useEffect(() => {
    document.title = 'How to Join | Butterfly Network';
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Connection & Setup Guide</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
            How to Connect to Butterfly Network
          </h1>

          <p className="text-slate-300 text-base sm:text-lg">
            Complete step-by-step instructions for all Minecraft platforms, versions, and clients.
          </p>

          {/* Platform Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setActivePlatform('java')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activePlatform === 'java'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Java Edition (PC / Mac)</span>
            </button>
            <button
              onClick={() => setActivePlatform('bedrock')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activePlatform === 'bedrock'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Bedrock (iOS / Android / Win 10)</span>
            </button>
            <button
              onClick={() => setActivePlatform('console')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activePlatform === 'console'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Gamepad className="w-4 h-4" />
              <span>Consoles (Xbox / PS / Switch)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Platform Instructions */}
        {activePlatform === 'java' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20 space-y-6">
              <h2 className="text-2xl font-bold text-white font-heading">
                Connecting via Minecraft Java Edition
              </h2>

              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Launch Minecraft</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Start Minecraft Java Edition on version 1.8.9 through 1.21.x using the official launcher or third-party clients like Lunar Client, Badlion, or Prism.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Add Server Address</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Click <strong>Multiplayer</strong> &rarr; <strong>Add Server</strong>. Name the server <strong>Butterfly Network</strong> and enter the address below.
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row items-center gap-3">
                      <div className="px-4 py-2 rounded-xl bg-black/50 border border-purple-500/30 font-mono font-bold text-purple-200 text-sm w-full sm:w-auto">
                        {SERVER_CONFIG.javaIp}
                      </div>
                      <CopyIpButton ip={SERVER_CONFIG.javaIp} label="Copy Java IP" variant="primary" />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Join and Enjoy</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Click <strong>Done</strong>, select Butterfly Network in your multiplayer list, and click <strong>Join Server</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePlatform === 'bedrock' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20 space-y-6">
              <h2 className="text-2xl font-bold text-white font-heading">
                Connecting via Minecraft Bedrock (Mobile & Windows 10/11)
              </h2>

              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Open Bedrock Minecraft</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Launch the game on iOS, Android, or Windows 10/11 PC, then press <strong>Play</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Servers Tab &rarr; Add Server</h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Tap the <strong>Servers</strong> tab, scroll down to the bottom of the list, and select <strong>Add Server</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Input Server IP & Port</h3>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-black/50 border border-purple-500/20">
                        <span className="text-[11px] text-slate-400 uppercase font-semibold">Server Address</span>
                        <div className="font-mono font-bold text-white text-sm">{SERVER_CONFIG.bedrockIp}</div>
                        <CopyIpButton ip={SERVER_CONFIG.bedrockIp} label="Copy IP" variant="glass" className="w-full mt-2" />
                      </div>
                      <div className="p-3 rounded-xl bg-black/50 border border-purple-500/20">
                        <span className="text-[11px] text-slate-400 uppercase font-semibold">Port (Default)</span>
                        <div className="font-mono font-bold text-purple-300 text-sm">{SERVER_CONFIG.bedrockPort}</div>
                        <CopyIpButton ip={SERVER_CONFIG.bedrockPort.toString()} label="Copy Port" variant="glass" className="w-full mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePlatform === 'console' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20 space-y-6">
              <h2 className="text-2xl font-bold text-white font-heading">
                Connecting via Consoles (Xbox, PlayStation, Nintendo Switch)
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Consoles do not provide a native "Add Server" button due to platform constraints. You can easily connect using BedrockTogether or DNS proxy redirection!
              </p>

              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <h3 className="font-bold text-purple-300 text-base">Method A: BedrockTogether App (Recommended)</h3>
                  <ol className="list-decimal list-inside text-xs sm:text-sm text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Download the free <strong>BedrockTogether</strong> app from the iOS App Store or Google Play Store.</li>
                    <li>Connect your phone and console to the same local Wi-Fi network.</li>
                    <li>Inside the app, enter IP: <strong className="text-white font-mono">{SERVER_CONFIG.bedrockIp}</strong> and Port: <strong className="text-purple-300 font-mono">{SERVER_CONFIG.port}</strong>.</li>
                    <li>Tap <strong>Run</strong> in the app, then open Minecraft on your console.</li>
                    <li>Butterfly Network will appear automatically in your in-game <strong>Friends Tab</strong> under LAN games!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting Section */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white font-heading">Troubleshooting Connection Issues</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-semibold text-white">"Cannot resolve hostname":</span>
              <p className="text-slate-400 leading-relaxed">
                Check for trailing spaces when copying the IP address. Verify you typed <code className="text-purple-300">play.firemc.fun</code> without http:// or https://.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="font-semibold text-white">"Outdated Client / Server":</span>
              <p className="text-slate-400 leading-relaxed">
                Butterfly Network supports 1.8.9 through 1.21.x. If using a newer snapshot or preview release, switch to the latest official release version.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
