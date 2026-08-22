import React from 'react';
import { useToast } from '../hooks/useToast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
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
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-[#0e101d]/95 backdrop-blur-xl border ${getBorderColor(
              t.type
            )} shadow-xl text-slate-100 relative overflow-hidden`}
          >
            {getIcon(t.type)}
            <div className="flex-1 text-sm min-w-0">
              <div className="font-semibold text-slate-100">{t.title}</div>
              {t.message && <div className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{t.message}</div>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Progress line */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: (t.duration || 3500) / 1000, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 ${
                t.type === 'success' ? 'bg-emerald-500' :
                t.type === 'error' ? 'bg-rose-500' :
                t.type === 'warning' ? 'bg-amber-500' : 'bg-purple-500'
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
