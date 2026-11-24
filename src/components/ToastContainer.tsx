import React from 'react';
import { useToast } from '../hooks/useToast';
import { CheckCircle2, AlertCircle, AlertTriangle, Coins, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-purple-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 shadow-emerald-900/20';
      case 'error':
        return 'border-rose-500/40 shadow-rose-900/20';
      case 'warning':
        return 'border-amber-500/40 shadow-amber-900/20';
      default:
        return 'border-purple-500/40 shadow-purple-900/20';
    }
  };

  return (
    <div 
      id="toast-notifications-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const isCoinReward = t.title === 'Butterfly Coins Added';
          return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl backdrop-blur-xl border shadow-xl text-slate-100 relative overflow-hidden ${
              isCoinReward
                ? 'border-amber-300/40 bg-gradient-to-br from-[#17132a]/95 via-[#241638]/95 to-[#35200b]/95 shadow-[0_16px_50px_rgba(245,158,11,0.20),0_0_0_1px_rgba(251,191,36,0.08)_inset]'
                : `bg-[#0e101d]/95 ${getBorderColor(t.type)}`
            }`}
          >
            {isCoinReward ? (
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [0, 8, -8, 0], scale: [1, 1.12, 1] }}
                transition={{ duration: 1.1, repeat: 1 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200/30 bg-gradient-to-br from-amber-300 to-yellow-600 shadow-[0_8px_24px_rgba(245,158,11,0.35)]"
              >
                <Coins className="h-5 w-5 text-amber-950" />
              </motion.div>
            ) : getIcon(t.type)}
            <div className="flex-1 text-sm min-w-0">
              <div className={`font-black ${isCoinReward ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-200 bg-clip-text text-transparent' : 'text-slate-100'}`}>{t.title}</div>
              {t.message && <div className={`text-xs mt-0.5 leading-relaxed break-words ${isCoinReward ? 'font-semibold text-amber-100/90' : 'text-slate-300'}`}>{t.message}</div>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
            
            {isCoinReward && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.2, 1.4, 1.8], x: [0, 8, 22], y: [0, -12, -28] }}
                transition={{ duration: 1.4, repeat: 2, repeatDelay: 0.4 }}
                className="absolute right-12 top-2 h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_12px_4px_rgba(251,191,36,0.45)]"
              />
            )}

            {/* Progress line */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (t.duration || 3500) / 1000, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 ${
                isCoinReward ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400' :
                t.type === 'success' ? 'bg-emerald-500' :
                t.type === 'error' ? 'bg-rose-500' :
                t.type === 'warning' ? 'bg-amber-500' : 'bg-purple-500'
              }`}
            />
          </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
