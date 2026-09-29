import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Check, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '../services/social';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../hooks/useAuth';

interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type:
    | 'post_like'
    | 'post_comment'
    | 'comment_like'
    | 'follow'
    | 'admin_message'
    | 'system';
  post_id?: string | null;
  comment_id?: string | null;
  message?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    minecraft_username?: string;
    badge?: string | null;
  };
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}) => {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
    }
  }, [isOpen, user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data } = await getNotifications(user.id, 20);
      if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      onUnreadCountChange(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    }

    // Navigate based on notification type
    if (notification.type === 'follow') {
      // Go to the follower's profile
      navigate(`/profile?id=${notification.actor_id}`);
    } else if (notification.type === 'admin_message') {
      // Admin message - don't navigate, just mark as read
      // User can read the message in the notification itself
      return;
    } else if (notification.post_id) {
      // Go to social page with post highlighted (we'll scroll to it)
      navigate(`/social?post=${notification.post_id}`);
    }

    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
      case 'comment_like':
        return <Heart className="w-4 h-4 text-rose-400 fill-current" />;
      case 'post_comment':
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'admin_message':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'system':
        return <ShieldAlert className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'post_like':
        return `liked your post`;
      case 'post_comment':
        return `commented on your post`;
      case 'comment_like':
        return `liked your comment`;
      case 'follow':
        return `started following you`;
      case 'admin_message':
        return notification.message || 'sent you a message';
      case 'system':
        return notification.message || 'You have a new notification';
      default:
        return notification.message || 'You have a new notification';
    }
  };

  const getMinecraftHead = (username?: string) => {
    return username
      ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/32`
      : '';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-96 max-w-[calc(100vw-2rem)] bg-gradient-to-b from-[#0e101d] to-[#0a0c16] backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-[0_20px_80px_rgba(139,92,246,0.4)] overflow-hidden"
        data-notification-dropdown
      >
        {/* Header with gradient */}
        <div className="relative px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/30">
                <Bell className="h-4 w-4 text-purple-300" />
              </div>
              <h3 className="text-base font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="flex h-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-violet-500 px-2 text-[10px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-purple-500/10"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[450px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/30">
                <Bell className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-300 text-sm font-semibold">No notifications yet</p>
              <p className="text-slate-500 text-xs mt-1.5">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => {
                const avatarUrl = getMinecraftHead(
                  notification.actor?.minecraft_username
                );

                const isAdminMessage = notification.type === 'admin_message';

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-4 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-violet-500/10 transition-all text-left group ${
                      !notification.is_read
                        ? 'bg-gradient-to-r from-purple-950/30 to-violet-950/30 border-l-2 border-purple-500'
                        : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-11 h-11 rounded-xl overflow-hidden border-2 ${
                        isAdminMessage
                          ? 'border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                          : !notification.is_read
                            ? 'border-purple-500/40'
                            : 'border-white/10'
                      }`}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={notification.actor?.username}
                            className="w-full h-full object-cover pixelated"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${
                            isAdminMessage
                              ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 text-amber-200'
                              : 'bg-gradient-to-br from-purple-600/40 to-violet-600/40 text-purple-200'
                          }`}>
                            {isAdminMessage ? '⚡' : (notification.actor?.username?.[0]?.toUpperCase() || '?')}
                          </div>
                        )}
                      </div>
                      {/* Icon Badge with glow */}
                      <div className={`absolute -bottom-1 -right-1 rounded-full p-1.5 border-2 border-[#0e101d] ${
                        isAdminMessage
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'bg-gradient-to-br from-purple-600 to-violet-600'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {notification.type === 'admin_message' ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-transparent bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text">
                              Admin Message
                            </p>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                              Official
                            </span>
                          </div>
                          {notification.message && (
                            <p className="text-sm leading-6 text-slate-200 font-medium mt-1.5 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-l-2 border-amber-500/30 pl-2 py-1 rounded-r">
                              {notification.message}
                            </p>
                          )}
                        </>
                      ) : (
                        <p
                          className={`text-sm leading-6 ${
                            !notification.is_read
                              ? 'text-white font-semibold'
                              : 'text-slate-300 font-medium'
                          }`}
                        >
                          <span className="font-bold text-purple-300">
                            {notification.actor?.username || 'Someone'}
                          </span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className={!notification.is_read ? 'text-white' : 'text-slate-400'}>
                            {getNotificationText(notification)}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0 mt-2">
                        <div className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};