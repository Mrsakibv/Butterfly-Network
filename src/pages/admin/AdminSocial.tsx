import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  getAllUsersWithPermissions,
  toggleUserPostPermission,
  getUserPosts,
  deletePost
} from '../../services/social';
import { useToast } from '../../hooks/useToast';
import { Users, FileText, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  can_post_social: boolean;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
}

export const AdminSocial: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<Record<string, Post[]>>({});
  const [loadingPosts, setLoadingPosts] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await getAllUsersWithPermissions();

      if (fetchError) {
        setError('Failed to load users');
        console.error('Users fetch error:', fetchError);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Users loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (userId: string, currentStatus: boolean, username: string) => {
    try {
      const newStatus = !currentStatus;
      const { error: updateError } = await toggleUserPostPermission(userId, newStatus);

      if (updateError) {
        console.error('Permission toggle error:', updateError);
        showToast(`Failed to update permission for ${username}`, 'error');
        return;
      }

      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, can_post_social: newStatus } : u
        )
      );

      showToast(
        newStatus
          ? `Granted posting permission to ${username}`
          : `Revoked posting permission from ${username}`,
        'success'
      );
    } catch (err) {
      console.error('Permission toggle error:', err);
      showToast(`Failed to update permission for ${username}`, 'error');
    }
  };

  const loadUserPosts = async (userId: string) => {
    if (userPosts[userId]) {
      setExpandedUser(expandedUser === userId ? null : userId);
      return;
    }

    setLoadingPosts(userId);
    setExpandedUser(userId);

    try {
      const { data, error: fetchError } = await getUserPosts(userId);

      if (fetchError) {
        console.error('Posts fetch error:', fetchError);
        alert('Failed to load posts');
        return;
      }

      setUserPosts(prev => ({ ...prev, [userId]: data || [] }));
    } catch (err) {
      console.error('Posts loading error:', err);
      alert('Failed to load posts');
    } finally {
      setLoadingPosts(null);
    }
  };

  const handleDeletePost = async (postId: string, userId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeletingPost(postId);

    try {
      const { error: deleteError } = await deletePost(postId);

      if (deleteError) {
        console.error('Post delete error:', deleteError);
        showToast(`Failed to delete post: ${deleteError.message || 'Error'}`, 'error');
        return;
      }

      setUserPosts(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(p => p.id !== postId),
      }));

      showToast('Post deleted successfully', 'success');
    } catch (err: any) {
      console.error('Post delete error:', err);
      showToast(`Failed to delete post: ${err?.message || 'Error'}`, 'error');
    } finally {
      setDeletingPost(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const usersWithPermission = users.filter(u => u.can_post_social);

  return (
    <AdminLayout active="social" permission="users">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Social Media Management</h1>
        <p className="text-slate-400 mt-1">Manage posting permissions and moderate content</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: Permission Management */}
          <div className="bg-gradient-to-br from-purple-950/20 to-violet-950/20 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Permission Management</h2>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No users found</p>
              ) : (
                users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between bg-black/20 border border-white/5 rounded-lg p-3 hover:border-purple-500/30 transition-colors"
                  >
                    <span className="text-white text-sm">{user.username}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user.can_post_social}
                        onChange={() => handleTogglePermission(user.id, user.can_post_social, user.username)}
                        className="w-4 h-4 rounded border-purple-500/30 bg-black/30 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400">Can Post</span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Box 2: Post Moderation */}
          <div className="bg-gradient-to-br from-purple-950/20 to-violet-950/20 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Post Moderation</h2>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {usersWithPermission.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  No users with posting permission
                </p>
              ) : (
                usersWithPermission.map(user => {
                  const posts = userPosts[user.id] || [];
                  const isExpanded = expandedUser === user.id;
                  const isLoading = loadingPosts === user.id;

                  return (
                    <div key={user.id} className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
                      <button
                        onClick={() => loadUserPosts(user.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white text-sm font-medium">{user.username}</span>
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                          ) : (
                            <>
                              {posts.length > 0 && (
                                <span className="text-xs text-slate-400">
                                  {posts.length} post{posts.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </>
                          )}
                        </div>
                      </button>

                      {isExpanded && !isLoading && (
                        <div className="border-t border-white/5 p-3 space-y-2">
                          {posts.length === 0 ? (
                            <p className="text-slate-500 text-xs text-center py-2">No posts yet</p>
                          ) : (
                            posts.map(post => (
                              <div
                                key={post.id}
                                className="bg-black/30 border border-white/5 rounded p-3 space-y-2"
                              >
                                <p className="text-white text-sm whitespace-pre-wrap break-words">
                                  {post.content}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-500">
                                    {formatDate(post.created_at)}
                                  </span>
                                  <button
                                    onClick={() => handleDeletePost(post.id, user.id)}
                                    disabled={deletingPost === post.id}
                                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    {deletingPost === post.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
