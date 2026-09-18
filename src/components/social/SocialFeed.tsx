import React, { useState, useEffect } from 'react';
import { getPosts } from '../../services/social';
import { PostCard } from './PostCard';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    id: string;
    username: string;
    minecraft_username?: string;
  };
}

interface SocialFeedProps {
  refresh?: number;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ refresh = 0 }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const POSTS_PER_PAGE = 20;

  useEffect(() => {
    loadPosts(true);
  }, [user, refresh]);

  const loadPosts = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    setError('');

    try {
      const limit = user ? POSTS_PER_PAGE : 20;
      const currentOffset = reset ? 0 : offset;

      const { data, error: fetchError } = await getPosts(limit, currentOffset);

      if (fetchError) {
        setError('Failed to load posts');
        console.error('Posts fetch error:', fetchError);
        return;
      }

      const newPosts = data || [];

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === limit);
      if (!reset) {
        setOffset(currentOffset + newPosts.length);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Posts loading error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => loadPosts(true)}
          className="mt-4 text-sm text-purple-400 hover:text-purple-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-950/20 to-violet-950/20 border border-purple-500/20 rounded-xl p-12 text-center">
        <p className="text-slate-400 text-lg">No posts yet</p>
        <p className="text-slate-500 text-sm mt-2">
          Be the first to share something!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onComment={() => {
            // Comment functionality to be implemented
            console.log('Comment on post:', post.id);
          }}
        />
      ))}

      {user && hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-violet-600/20 hover:from-purple-600/30 hover:to-violet-600/30 border border-purple-500/30 text-purple-300 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {!user && (
        <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-6 text-center mt-6">
          <p className="text-purple-300 font-medium mb-2">
            Want to see more posts?
          </p>
          <p className="text-slate-400 text-sm">
            Log in to view all posts and interact with the community
          </p>
        </div>
      )}
    </div>
  );
};
