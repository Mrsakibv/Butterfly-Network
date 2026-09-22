import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, ImageIcon, Plus, ExternalLink, Globe } from 'lucide-react';
import { updatePost } from '../../services/social';
import { motion, AnimatePresence } from 'motion/react';

interface Post {
  id: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  user_id: string;
}

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedPost: any) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ post, isOpen, onClose, onUpdated }) => {
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentInputUrl, setCurrentInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MAX_LENGTH = 1000;
  const MAX_IMAGES = 6;

  // Parse existing images from media_url
  useEffect(() => {
    if (!isOpen) return;

    setContent(post.content || '');

    if (post.media_url) {
      const trimmed = post.media_url.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            setImageUrls(parsed.filter(u => typeof u === 'string' && u.trim().length > 0));
          }
        } catch (e) {
          setImageUrls([trimmed]);
        }
      } else if (trimmed) {
        setImageUrls([trimmed]);
      }
    } else {
      setImageUrls([]);
    }

    setError('');
  }, [isOpen, post]);

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
      const { data, error: updateError } = await updatePost(
        post.id,
        post.user_id,
        content.trim(),
        imageUrls.length > 0 ? imageUrls : undefined
      );

      if (updateError) {
        setError('Failed to update post. Please try again.');
        console.error('Post update error:', updateError);
      } else if (data && data[0]) {
        onUpdated(data[0]);
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error('Post update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#150f24] via-[#0d0a17] to-[#08060f] border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(124,58,237,0.35)] overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Edit Post</h2>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
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
                placeholder="Edit your post..."
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
                          disabled={loading}
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
                  Add Image URL
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
                  placeholder="Paste image URL..."
                  disabled={loading || imageUrls.length >= MAX_IMAGES}
                  className="flex-1 bg-black/50 border border-white/10 focus:border-purple-500/60 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!currentInputUrl.trim() || imageUrls.length >= MAX_IMAGES || loading}
                  className="flex items-center gap-1.5 bg-purple-600/30 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed border border-purple-500/50 text-purple-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Free Image Hosting Recommendations */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">Free hosts:</span>
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
                onClick={onClose}
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
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
