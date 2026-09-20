import React, { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment, updateComment } from '../../services/social';
import { useAuth } from '../../hooks/useAuth';
import { Send, Loader2, Trash2, Edit2, X, Check } from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { TikBadge } from './TikBadge';
import type { BadgeType } from '../../types/badges';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  updated_at?: string;
  profiles?: {
    id?: string;
    username?: string;
    minecraft_username?: string;
    role?: string | null;
    badge?: string | null;
  } | null;
}

interface CommentSectionProps {
  postId: string;
}

const isBadgeType = (
  badge: string | null | undefined
): badge is BadgeType => {
  return (
    badge === 'blue' ||
    badge === 'red' ||
    badge === 'golden' ||
    badge === 'diamond' ||
    badge === 'cosmic' ||
    badge === 'crown'
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await getComments(postId);

      if (fetchError) {
        console.error('Comments load error:', fetchError);
      } else if (data) {
        setComments(data);
      }
    } catch (err) {
      console.error('Comments load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const { data, error: submitError } = await addComment(
        postId,
        user.id,
        commentText.trim()
      );

      if (submitError) {
        console.error('Comment submit error:', submitError);
        setError('Failed to post comment. Please try again.');
      } else if (data && data[0]) {
        setComments(prev => [...prev, data[0]]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment submit error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    setDeletingCommentId(commentId);

    try {
      const { error: deleteError } = await deleteComment(commentId);

      if (deleteError) {
        console.error('Comment delete error:', deleteError);
        alert('Failed to delete comment');
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      console.error('Comment delete error:', err);
      alert('Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    setSubmitting(true);

    try {
      const { data, error: updateError } = await updateComment(
        commentId,
        editText.trim()
      );

      if (updateError) {
        console.error('Comment update error:', updateError);
        alert('Failed to update comment');
      } else if (data) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? {
                  ...c,
                  content: editText.trim(),
                  updated_at: data.updated_at
                }
              : c
          )
        );

        setEditingCommentId(null);
        setEditText('');
      }
    } catch (err) {
      console.error('Comment update error:', err);
      alert('Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const canEditComment = (comment: Comment) => {
    if (!user || comment.user_id !== user.id) return false;

    const createdTime = new Date(comment.created_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - createdTime) / 1000 / 60;

    return diffMinutes < 5;
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
      day: 'numeric'
    });
  };

  const getMinecraftHead = (username?: string) => {
    return username
      ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/32`
      : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {comments.map(comment => {
            const username = comment.profiles?.username || 'Anonymous';
            const minecraftUsername = comment.profiles?.minecraft_username;
            const role = comment.profiles?.role;
            const isOwnComment = user?.id === comment.user_id;
            const isEditing = editingCommentId === comment.id;
            const isDeleting = deletingCommentId === comment.id;
            const canEdit = canEditComment(comment);
            const avatarUrl = getMinecraftHead(minecraftUsername);

            const badgeType = isBadgeType(
              comment.profiles?.badge
            )
              ? comment.profiles?.badge
              : null;

            return (
              <div
                key={comment.id}
                className="flex gap-2.5 bg-black/20 rounded-xl p-3 border border-white/5"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/20 flex-shrink-0 shadow-sm">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="w-full h-full object-cover pixelated"
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-600/40 flex items-center justify-center text-purple-200 text-xs font-bold">
                      {username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Username + Badge + Role + Date */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-purple-200">
                      {username}
                    </span>

                    <TikBadge
                      badgeType={badgeType}
                      size="sm"
                    />

                    <RoleBadge role={role} />

                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatDate(comment.created_at)}
                    </span>

                    {comment.updated_at &&
                      comment.updated_at !== comment.created_at && (
                        <span className="text-[11px] text-slate-500 italic">
                          (edited)
                        </span>
                      )}
                  </div>

                  {/* Comment text */}
                  {isEditing ? (
                    <div className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 bg-black/30 border border-purple-500/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                        maxLength={500}
                        autoFocus
                      />

                      <button
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={submitting || !editText.trim()}
                        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 p-1"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleCancelEdit}
                        disabled={submitting}
                        className="text-slate-400 hover:text-slate-300 p-1"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-100 break-words flex-1 leading-relaxed">
                        {comment.content}
                      </p>

                      {isOwnComment && (
                        <div className="flex gap-1">
                          {canEdit && (
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="text-slate-400 hover:text-purple-400 transition-colors p-1"
                              title="Edit (within 5 minutes)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(comment.id)}
                            disabled={isDeleting}
                            className="text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50 p-1"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Form */}
      {user ? (
        <div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={submitting}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              maxLength={500}
            />

            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:bg-purple-900/50 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {error && (
            <p className="text-xs text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4 text-center">
          <p className="text-purple-300 text-sm font-medium">
            <span className="underline cursor-pointer">Log in</span> to comment
          </p>
        </div>
      )}
    </div>
  );
};