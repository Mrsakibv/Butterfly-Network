import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import confetti from 'canvas-confetti';

interface CopyIpButtonProps {
  ip?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'glass' | 'compact';
  className?: string;
  showIcon?: boolean;
}

export const CopyIpButton: React.FC<CopyIpButtonProps> = ({
  ip = 'play.firemc.fun',
  label = 'Copy IP',
  variant = 'primary',
  className = '',
  showIcon = true,
}) => {
  const [copied, setCopied] = useState(false);
  const { copyToClipboard } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(ip, 'Minecraft Server IP');
    if (success) {
      setCopied(true);
      
      // Fire subtle celebratory confetti from the button's position
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { x, y },
          colors: ['#a855f7', '#38bdf8', '#c084fc', '#ffffff'],
          ticks: 120,
          gravity: 1.2,
          scalar: 0.8,
          disableForReducedMotion: true
        });
      } catch {
        // Ignore confetti if canvas is restricted
      }

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-900/30 border border-purple-400/30 active:scale-[0.98]',
    secondary:
      'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 hover:border-purple-400/60 font-semibold active:scale-[0.98]',
    glass:
      'bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 hover:border-purple-400/40 backdrop-blur-md active:scale-[0.98]',
    compact:
      'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white border border-purple-500/30 text-xs px-2.5 py-1 rounded-lg',
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 rounded-xl cursor-pointer ${
        variant === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm sm:text-base'
      } ${variantStyles[variant]} ${className}`}
      aria-label={`Copy server IP ${ip} to clipboard`}
      title={`Click to copy: ${ip}`}
    >
      {showIcon && (
        <span className="shrink-0 transition-transform duration-200">
          {copied ? (
            <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
          ) : (
            <Copy className="w-4 h-4 opacity-80 group-hover:opacity-100" />
          )}
        </span>
      )}
      <span className="font-medium whitespace-nowrap">
        {copied ? 'Copied!' : label}
      </span>
    </button>
  );
};
