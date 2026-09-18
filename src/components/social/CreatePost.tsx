import React, { useState, useEffect } from 'react';
import { Send, Image as ImageIcon, Plus, X, Sparkles, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { createPost } from '../../services/social';
import { useAuth } from '../../hooks/useAuth';
import { useSocialPermission } from '../../hooks/useSocialPermission';
import { RoleBadge } from './RoleBadge';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface CreatePostProps {
  onPostCreated?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const { user, role } = useAuth();
  const { canPost, loading: permissionLoading } = useSocialPermission();

  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentInputUrl, setCurrentInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState<string>('Anonymous');
  const [minecraftUsername, setMinecraftUsername] = useState<string>('');

  const MAX_LENGTH = 1000;
  const MAX_IMAGES = 6;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('username, minecraft_username')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        if (data.username) setUsername(data.username);
        if (data.minecraft_username) setMinecraftUsername(data.minecraft_username);
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleAddImageUrl = () => {
    const trimmed = currentInputUrl.trim();
    if (!trimmed) return;
    if (imageUrls.length >= MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images per post.`);
      return;
    }
    if (imageUrls.includes(trimmed)) {
      setError('This image URL is already added.');
      return;
    }

    setImageUrls(prev => [...prev, trimmed]);
    setCurrentInputUrl('');
    setError('');
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !canPost) return;
    if (!content.trim() && imageUrls.length === 0) {
      setError('Please provide text or at least one image.');
      return;
    }
    if (content.length > MAX_LENGTH) {
      setError(`Post content too long (max ${MAX_LENGTH} characters).`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: postError } = await createPost(
        user.id,
        content.trim(),
        imageUrls.length > 0 ? imageUrls : undefined
      );

      if (postError) {
        setError('Failed to publish post. Please try again.');
        console.error('Post creation error:', postError);
      } else {
        setContent('');
        setImageUrls([]);
        setCurrentInputUrl('');
        setIsOpen(false);
        onPostCreated?.();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Post creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMinecraftHead = (uname: string) => {
    return uname
      ? `https://mc-heads.net/avatar/${encodeURIComponent(uname)}/64`
      : '';
  };

  if (permissionLoading || !user || !canPost) {
    return null;
  }

  const avatarUrl = getMinecraftHead(minecraftUsername);

  return (
    <div className="mb-8">
      {/* Trigger Bar (Instagram/Threads Style) */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-violet-900/30 to-black/60 border border-purple-500/30 p-4 shadow-[0_8px_32px_rgba(124,58,237,0.15)] backdrop-blur-xl hover:border-purple-500/60 transition-all cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)] flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover pixelated" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center text-white font-bold text-lg">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full px-5 py-3 transition-colors flex items-center justify-between">
              <span className="text-slate-400 group-hover:text-purple-200 text-sm font-medium transition-colors">
                Share what's happening on Butterfly Network...
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Post
                </span>
              </div>
            </div>

            <button
              type="button"
              className="p-3 rounded-full bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 transition-all flex-shrink-0 shadow-lg"
              title="Add Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Advanced Create Post Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-gradient-to-b from-[#150f24] via-[#0d0a17] to-[#08060f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(124,58,237,0.35)] overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={username} className="w-full h-full object-cover pixelated" />
                    ) : (
                      <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base">{username}</span>
                      <RoleBadge role={role} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-purple-300/70">
                      <Globe className="w-3 h-3" />
                      <span>Public Post</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content Scrollable */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something exciting, share achievements or game screenshots..."
                    disabled={loading}
                    rows={4}
                    maxLength={MAX_LENGTH}
                    className="w-full bg-black/40 border border-white/10 focus:border-purple-500/60 rounded-2xl p-4 text-white placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none transition-all shadow-inner"
                  />
                  <div className="text-right text-[11px] text-slate-400 mt-1 font-mono">
                    {content.length}/{MAX_LENGTH}
                  </div>
                </div>

                {/* Multiple Images Preview Section */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Attached Images ({imageUrls.length}/{MAX_IMAGES})</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-purple-500/30 bg-black/60 shadow-md"
                        >
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/400x400/2a1b4e/ffffff?text=Invalid+Image+URL';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                            <span className="text-[10px] text-white/90 font-mono">#{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImageUrl(idx)}
                              className="p-1 rounded-full bg-red-600/90 hover:bg-red-500 text-white transition-colors"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Image URL Input Section */}
                <div className="bg-black/30 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                      Add Image URL (9:16, 1:1, 16:9 supported)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {imageUrls.length}/{MAX_IMAGES}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={currentInputUrl}
                      onChange={(e) => setCurrentInputUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      placeholder="Paste image URL (e.g. https://myimgs.org/...)"
                      disabled={loading || imageUrls.length >= MAX_IMAGES}
                      className="flex-1 bg-black/50 border border-white/10 focus:border-purple-500/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!currentInputUrl.trim() || imageUrls.length >= MAX_IMAGES}
                      className="flex items-center gap-1.5 bg-purple-600/30 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-500/50 text-purple-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Free Image Hosting Recommendations */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">Free Image Hosts:</span>
                    <a
                      href="https://myimgs.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
                    >
                      MyImgs <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>•</span>
                    <a
                      href="https://imgur.com/upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-purple-400 hover:text-purple-300 underline underline-offset-2"
                    >
                      Imgur <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>•</span>
                    <a
                      href="https://imgbb.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-purple-400 hover:text-purple-300 underline underline-offset-2"
                    >
                      ImgBB <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>•</span>
                    <a
                      href="https://postimages.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-purple-400 hover:text-purple-300 underline underline-offset-2"
                    >
                      PostImages <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {error}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading || (!content.trim() && imageUrls.length === 0)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish Post</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
