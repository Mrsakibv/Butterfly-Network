import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-extrabold',
    lg: 'text-2xl sm:text-3xl font-extrabold',
  };

  return (
    <div
      className={`flex items-center gap-3 select-none ${className}`}
    >
      {!imgError ? (
        <div
          className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}
        >
          <img
            src="/logo.png"
            alt="Butterfly Network"
            onError={() => setImgError(true)}
            className="w-full h-full object-contain drop-shadow-[0_0_18px_rgba(168,85,247,0.7)]"
          />
        </div>
      ) : (
        <div
          className={`relative ${iconSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 via-violet-800/20 to-sky-600/30 border border-purple-500/40 shadow-[0_0_20px_rgba(139,92,246,0.4)] shrink-0`}
        >
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/4 h-3/4 text-purple-300"
          >
            <path
              d="M20 6C16 14 6 15 3 23C1 28 5 35 11 35C16 35 18 29 20 25C22 29 24 35 29 35C35 35 39 28 37 23C34 15 24 14 20 6Z"
              fill="url(#butterfly-grad)"
              fillOpacity="0.85"
            />

            <path
              d="M20 4L22 18L20 36L18 18L20 4Z"
              fill="#ffffff"
              fillOpacity="0.9"
            />

            <circle cx="20" cy="18" r="3" fill="#38bdf8" />
            <circle cx="12" cy="22" r="1.5" fill="#e9d5ff" />
            <circle cx="28" cy="22" r="1.5" fill="#e9d5ff" />

            <defs>
              <linearGradient
                id="butterfly-grad"
                x1="2"
                y1="6"
                x2="38"
                y2="35"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#a855f7" />
                <stop offset="0.5" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {showText && (
        <div className="flex flex-col">
          <span
            className={`tracking-tight text-white font-heading ${textSizes[size]} flex items-center gap-1.5`}
          >
            <span>Butterfly</span>

            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-sky-400">
              Network
            </span>
          </span>
        </div>
      )}
    </div>
  );
};