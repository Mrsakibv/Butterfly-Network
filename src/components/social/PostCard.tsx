import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Check, UserPlus, UserMinus, MoreVertical, Trash2, Edit2, Bookmark } from 'lucide-react';
import { getLikeCount, checkUserLiked, likePost, unlikePost, followUser, unfollowUser, checkIsFollowing, deletePost, checkIsSaved, savePost, unsavePost } from '../../services/social';
import { useAuth } from '../../hooks/useAuth';
import { CommentSection } from './CommentSection';
import { RoleBadge } from './RoleBadge';
import { TikBadge } from './TikBadge';
import { ImageModal } from './ImageModal';
import { EditPostModal } from './EditPostModal';
import { motion, AnimatePresence } from 'motion/react';
import type { BadgeType } from '../../types/badges';

import { useRouter } from '../../hooks/useRouter';

interface Post {
  id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  updated_at?: string;
  user_id: string;
  profiles?: {
    id?: string;
    username?: string;
    minecraft_username?: string;
    role?: string | null;
    badge?: BadgeType | null;
  } | null;
}

interface PostCardProps {
  post: Post;
  onComment?: () => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Multi-image state & Image Modal
  const [imageIndex, setImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  // Post actions state
  const [showMenu, setShowMenu] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Bookmark state
  const [isSaved, setIsSaved] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // Parse images from media_url (either JSON array string or plain URL string)
  const images: string[] = React.useMemo(() => {
    if (!post.media_url) return [];
    const trimmed = post.media_url.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(u => typeof u === 'string' && u.trim().length > 0);
        }
      } catch (e) {
        console.error('Failed to parse media_url JSON:', e);
      }
    }
    return [trimmed];
  }, [post.media_url]);

  useEffect(() => {
    loadLikes();
    loadFollowStatus();
    loadSavedStatus();
  }, [post.id, user]);

  const loadLikes = async () => {
    const { count } = await getLikeCount(post.id);
    setLikeCount(count || 0);

    if (user?.id) {
      const { liked } = await checkUserLiked(post.id, user.id);
      setIsLiked(liked);
    }
  };

  const loadFollowStatus = async () => {
    if (user?.id && post.profiles?.id && user.id !== post.profiles.id) {
      const { isFollowing } = await checkIsFollowing(user.id, post.profiles.id);
      setIsFollowing(isFollowing);
    }
  };

  const loadSavedStatus = async () => {
    if (user?.id) {
      const { isSaved } = await checkIsSaved(post.id, user.id);
      setIsSaved(isSaved);
    }
  };

  const handleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        await unlikePost(post.id, user.id);
      } else {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        await likePost(post.id, user.id);
        // Trigger heart animation
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 900);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !post.profiles?.id || followLoading || user.id === post.profiles.id) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id, post.profiles.id);
        setIsFollowing(false);
      } else {
        await followUser(user.id, post.profiles.id);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDoubleClickImage = () => {
    if (!user) return;
    if (!isLiked) {
      handleLike();
    }
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
  };

  const handleDeletePost = async () => {
    if (!user || !confirm('Delete this post? This cannot be undone.')) return;

    setDeletingPost(true);
    setShowMenu(false);

    const { error } = await deletePost(post.id, user.id);

    if (error) {
      alert('Failed to delete post');
      setDeletingPost(false);
    } else {
      onPostDeleted?.(post.id);
    }
  };

  const handleToggleSave = async () => {
    if (!user || savingPost) return;

    setSavingPost(true);

    try {
      if (isSaved) {
        setIsSaved(false);
        await unsavePost(post.id, user.id);
      } else {
        setIsSaved(true);
        await savePost(post.id, user.id);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      setIsSaved(!isSaved); // Revert on error
    } finally {
      setSavingPost(false);
    }
  };

  const canEditPost = () => {
    if (!user || post.user_id !== user.id) return false;
    const createdTime = new Date(post.created_at).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - createdTime) / 1000 / 60;
    return diffMinutes < 15; // 15 minutes window
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/social?post=${post.id}`;

    // ১. যদি Web Share API সাপোর্টেড থাকে (যেমন: Mobile Browsers / HTTPS)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Butterfly Network',
          text: post.content || 'Check out this post on Butterfly Network!',
          url: shareUrl,
        });
        return;
      } catch (error) {
        console.log('Share cancelled or failed, falling back to copy:', error);
      }
    }

    // ২. যদি Clipboard API সাপোর্টেড থাকে (HTTPS / Localhost)
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (clipboardError) {
        console.error('Error copying with Clipboard API:', clipboardError);
      }
    }

    // ৩. Fallback Copy Method (HTTP / IP Address network-এ ১০০% কাজ করবে)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        alert('Could not copy link automatically. URL: ' + shareUrl);
      }
    } catch (fallbackError) {
      console.error('Fallback copy error:', fallbackError);
      alert('Could not copy link automatically. URL: ' + shareUrl);
    }
  };

  const openImageModal = (index: number) => {
    setModalInitialIndex(index);
    setIsModalOpen(true);
  };

  const getMinecraftHead = (username?: string) => {
    return username
      ? `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64`
      : '';
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
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const username = post.profiles?.username || 'Anonymous';
  const minecraftUsername = post.profiles?.minecraft_username;
  const role = post.profiles?.role;
  const badge = post.profiles?.badge;
  const avatarUrl = getMinecraftHead(minecraftUsername);
  const isOwnPost = user?.id === post.profiles?.id;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#130e22] via-[#0d0a17] to-[#07050e] border border-purple-500/25 p-0 shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-purple-500/50 transition-all duration-300"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div
            onClick={() => {
              if (user && post.profiles?.id) {
                navigate(`/profile?id=${post.profiles.id}`);
              }
            }}
            className={`flex items-center gap-3.5 ${user ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover pixelated"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center text-white font-bold text-base">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white tracking-tight">{username}</span>
                <TikBadge badgeType={badge} size="sm" />
                <RoleBadge role={role} />
              </div>
              <p className="text-[11px] text-purple-300/60 font-medium">
                {formatDate(post.created_at)}
                {post.updated_at && post.updated_at !== post.created_at && (
                  <span className="text-slate-500 italic ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Follow Button - Only show if logged in, not own post */}
            {user && !isOwnPost && post.profiles?.id && (
              <motion.button
                onClick={handleFollow}
                disabled={followLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isFollowing
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-500 hover:to-violet-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followLoading ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Three-dot menu for own post */}
            {user && isOwnPost && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  disabled={deletingPost}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-black/95 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-xl overflow-hidden z-50">
                    {canEditPost() && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-200 hover:bg-purple-600/20 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit Post</span>
                      </button>
                    )}
                    <button
                      onClick={handleDeletePost}
                      disabled={deletingPost}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deletingPost ? 'Deleting...' : 'Delete Post'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Text Content */}
        {post.content && (
          <div className="px-5 pt-4 pb-3">
            <p className="text-slate-100 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </div>
        )}

        {/* Image / Multi-Image Carousel Section */}
        {images.length > 0 && (
          <div
            className="relative w-full bg-black/70 overflow-hidden select-none cursor-pointer group"
            onDoubleClick={handleDoubleClickImage}
            onClick={() => openImageModal(imageIndex)}
          >
            {/* Aspect container with max height to handle 9:16 and 16:9 elegantly */}
            <div className="relative w-full min-h-[260px] max-h-[580px] flex items-center justify-center bg-black/50 overflow-hidden">
              <img
                src={images[imageIndex]}
                alt={`Post media ${imageIndex + 1}`}
                className="w-full h-auto max-h-[580px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/600x400/181129/ffffff?text=Image+Unavailable';
                }}
              />

              {/* Double-click flying heart */}
              <AnimatePresence>
                {showHeartAnim && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: 1 }}
                    exit={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none drop-shadow-[0_0_25px_rgba(244,63,94,0.9)]"
                  >
                    <Heart className="w-24 h-24 text-rose-500 fill-rose-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Multiple Images Carousel Controls */}
            {images.length > 1 && (
              <>
                {/* Prev Button */}
                {imageIndex > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageIndex(prev => prev - 1);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-purple-600/90 text-white backdrop-blur-md transition-all border border-white/10 opacity-80 hover:opacity-100"
                    title="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Next Button */}
                {imageIndex < images.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageIndex(prev => prev + 1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-purple-600/90 text-white backdrop-blur-md transition-all border border-white/10 opacity-80 hover:opacity-100"
                    title="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Pagination Indicator Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 backdrop-blur-md text-[11px] font-mono font-semibold text-white/90">
                  {imageIndex + 1}/{images.length}
                </div>

                {/* Dots indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageIndex(idx);
                      }}
                      className={`transition-all rounded-full ${
                        idx === imageIndex
                          ? 'w-5 h-1.5 bg-gradient-to-r from-purple-400 to-pink-400'
                          : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!user || loading}
              className={`flex items-center gap-2 transition-all group ${
                isLiked
                  ? 'text-rose-400'
                  : 'text-slate-400 hover:text-rose-400'
              } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                    isLiked ? 'fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : ''
                  }`}
                />
              </motion.div>
              <span className="text-xs sm:text-sm font-semibold">{likeCount}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              disabled={!user}
              className={`flex items-center gap-2 text-slate-400 hover:text-purple-300 transition-all group ${
                !user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${showComments ? 'text-purple-300' : ''}`}
            >
              <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-xs sm:text-sm font-semibold">Comment</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-slate-400 hover:text-purple-300 transition-all text-xs sm:text-sm font-semibold cursor-pointer px-3 py-1.5 rounded-full hover:bg-white/5"
            title="Copy post link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Comments Section Drawer */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5 bg-black/40 px-5 py-4"
            >
              <CommentSection postId={post.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fullscreen Lightbox Modal */}
      <ImageModal
        images={images}
        currentIndex={modalInitialIndex}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigate={(newIdx) => setModalInitialIndex(newIdx)}
      />
    </>
  );
};