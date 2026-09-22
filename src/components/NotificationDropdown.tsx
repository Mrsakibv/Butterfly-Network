import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Check } from 'lucide-react';
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
  type: 'post_like' | 'post_comment' | 'comment_like' | 'follow';
  post_id?: string | null;
  comment_id?: string | null;
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
      navigate(`/profile?id=${notification.actor_id}`);
    } else if (notification.post_id) {
      navigate(`/social`);
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
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const username = notification.actor?.username || 'Someone';
    switch (notification.type) {
      case 'post_like':
        return `liked your post`;
      case 'post_comment':
        return `commented on your post`;
      case 'comment_like':
        return `liked your comment`;
      case 'follow':
        return `started following you`;
      default:
        return 'interacted with you';
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
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[#0e101d]/98 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-950/60 overflow-hidden z-50"
        data-notification-dropdown
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No notifications yet</p>
              <p className="text-slate-500 text-xs mt-1">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notification) => {
                const avatarUrl = getMinecraftHead(
                  notification.actor?.minecraft_username
                );

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                      !notification.is_read ? 'bg-purple-950/20' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/20">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={notification.actor?.username}
                            className="w-full h-full object-cover pixelated"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-600/40 flex items-center justify-center text-purple-200 text-sm font-bold">
                            {notification.actor?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      {/* Icon Badge */}
                      <div className="absolute -bottom-1 -right-1 bg-[#0e101d] rounded-full p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.is_read
                            ? 'text-white font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="font-bold">
                          {notification.actor?.username || 'Someone'}
                        </span>{' '}
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
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
