import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  copyToClipboard: (text: string, label?: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info', duration: number = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { id, title, message, type, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const copyToClipboard = useCallback(async (text: string, label: string = 'IP Address'): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('Copied to Clipboard!', `${label} (${text}) copied successfully. Paste into Minecraft.`, 'success', 3000);
        return true;
      } else {
        // Fallback for non-secure contexts / older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          showToast('Copied to Clipboard!', `${label} (${text}) copied successfully.`, 'success', 3000);
          return true;
        }
        throw new Error('Fallback clipboard command failed');
      }
    } catch {
      showToast('Clipboard Error', `Could not automatically copy. Please select and copy: ${text}`, 'error', 5000);
      return false;
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, copyToClipboard }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
