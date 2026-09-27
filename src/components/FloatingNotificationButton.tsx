import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationDropdown } from './NotificationDropdown';
import { getUnreadNotificationCount } from '../services/social';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const FloatingNotificationButton: React.FC = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Load unread notification count
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const loadUnreadCount = async () => {
      try {
        const { count } = await getUnreadNotificationCount(user.id);
        setUnreadCount(count || 0);
      } catch (err) {
        console.error('Failed to load unread count:', err);
      }
    };

    loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    // Listen to notification changes via Supabase realtime
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleClose = () => {
    setShowNotifications(false);
  };

  const handleUnreadCountChange = (newCount: number) => {
    setUnreadCount(newCount);
  };

  // Don't show if user is not logged in
  if (!isVisible || !user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="fixed bottom-6 right-6 z-[100]"
      >
        <button
          onClick={handleToggleNotifications}
          data-notification-bell
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-500 shadow-[0_8px_32px_rgba(124,58,237,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] active:scale-95"
        >
          <Bell className="h-6 w-6 text-white" />

          {/* Unread Badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-lg"
              >
                <span className="text-[10px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse effect when there are unread notifications */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-20" />
          )}
        </button>
      </motion.div>

      {/* Notification Dropdown - positioned relative to button */}
      {showNotifications && (
        <div className="fixed bottom-24 right-6 z-[100]">
          <NotificationDropdown
            isOpen={showNotifications}
            onClose={handleClose}
            unreadCount={unreadCount}
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>
      )}

      {/* Backdrop overlay */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
};
