import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendAdminMessage } from '../../services/social';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Send, Users, User, MessageSquare, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  minecraft_username?: string;
  email?: string;
}

export const AdminMessages: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, minecraft_username')
        .order('username', { ascending: true });

      if (error) {
        console.error('Failed to load users:', error);
        showToast('Failed to load users', 'error');
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showToast('You must be logged in to send messages', 'error');
      return;
    }

    if (!message.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    setSending(true);

    try {
      if (selectedUser === 'all') {
        // Send to all users
        let successCount = 0;
        let failCount = 0;

        for (const targetUser of users) {
          // Skip sending to self
          if (targetUser.id === user.id) continue;

          const { error } = await sendAdminMessage(
            targetUser.id,
            user.id,
            message.trim()
          );

          if (error) {
            failCount++;
          } else {
            successCount++;
          }
        }

        showToast(
          `Message sent to ${successCount} users${failCount > 0 ? ` (${failCount} failed)` : ''}`,
          'success'
        );
      } else {
        // Send to specific user
        const target = users.find((u) => u.id === selectedUser);
        const { error } = await sendAdminMessage(
          selectedUser,
          user.id,
          message.trim()
        );

        if (error) {
          showToast(`Failed to send message to ${target?.username || 'user'}`, 'error');
          return;
        }

        showToast(`Message sent to ${target?.username || 'user'}`, 'success');
      }

      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.minecraft_username && u.minecraft_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          Send Direct Notification Messages
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Send direct messages to users. The message will appear in their notifications with an admin badge.
        </p>
      </div>

      {/* Message Form */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <form onSubmit={handleSendMessage} className="space-y-6">
          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Select Recipient
            </label>

            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                Loading users...
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search bar */}
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-400/50"
                />

                {/* Dropdown */}
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-purple-400/50"
                >
                  <option value="all" className="bg-slate-900 font-bold text-purple-300">
                    📢 All Users (Broadcast - {users.length} users)
                  </option>
                  {filteredUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900">
                      {u.username} {u.minecraft_username ? `(${u.minecraft_username})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Message Content
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here... (e.g. Server maintenance scheduled, Congratulations on winning the event!, etc.)"
              className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
              <span>This will be delivered instantly to the user's notification box</span>
              <span>{message.length}/500</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sending || !message.trim() || loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.3)] transition-all hover:shadow-[0_15px_40px_rgba(124,58,237,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Notification Message
              </>
            )}
          </button>
        </form>
      </div>

      {/* Quick Tips */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
        <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400" />
          Messaging Guidelines
        </h3>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
          <li>Messages sent from here will have a special <strong>Admin Message</strong> badge.</li>
          <li>Users will receive a floating notification indicator immediately.</li>
          <li>Use broadcast for network-wide announcements, maintenance notices, or special events.</li>
          <li>Use individual messages for warnings, rewards, or personal communications.</li>
        </ul>
      </div>
    </div>
  );
};
