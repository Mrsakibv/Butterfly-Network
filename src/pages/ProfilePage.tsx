import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../hooks/useRouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ProfileHeader } from '../components/ProfileHeader';
import { PostCard } from '../components/social/PostCard';
import { getUserPosts } from '../services/social';
import type { BadgeType } from '../types/badges';

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  created_at: string | null;
  minecraft_username: string | null;
  role: string | null;
  badge: BadgeType | null;
  cover_image: string | null;
}

export const ProfilePage: React.FC = () => {
  const { navigate } = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'posts'>('activity');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [window.location.pathname, window.location.search]);

  useEffect(() => {
    if (profile && activeTab === 'posts') {
      loadPosts();
    }
  }, [profile, activeTab]);

  const loadPosts = async () => {
    if (!profile) return;

    setPostsLoading(true);
    const { data, error } = await getUserPosts(profile.id);

    if (error) {
      console.error('Failed to load posts:', error);
    } else {
      // Attach profile data to each post
      const postsWithProfile = (data || []).map(post => ({
        ...post,
        profiles: {
          id: profile.id,
          username: profile.username,
          minecraft_username: profile.minecraft_username,
          role: profile.role,
          badge: profile.badge,
        }
      }));
      setUserPosts(postsWithProfile);
    }

    setPostsLoading(false);
  };

  const loadProfile = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('Auth user:', user);
    setCurrentUserId(user?.id || null);

    // Check if viewing someone else's profile via query params
    const searchParams = new URLSearchParams(window.location.search);
    const targetUserId = searchParams.get('id');
    const targetUsername = searchParams.get('u');

    console.log('Query params:', { targetUserId, targetUsername });

    let query = supabase
      .from('profiles')
      .select(
  'id, full_name, username, bio, created_at, minecraft_username, role, badge, cover_image'
);

    if (targetUserId) {
      console.log('Loading profile by ID:', targetUserId);
      query = query.eq('id', targetUserId);
    } else if (targetUsername) {
      console.log('Loading profile by username:', targetUsername);
      query = query.eq('username', targetUsername);
    } else {
      // Viewing own profile
      if (userError || !user) {
        console.log('Not logged in, redirecting to login');
        navigate('/login');
        return;
      }
      console.log('Loading own profile:', user.id);
      query = query.eq('id', user.id);
    }

    const { data, error } = await query.maybeSingle();

    console.log('Profile query result:', { data, error });

    if (error) {
      console.error('Profile load error:', error);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!data) {
      console.error('Profile not found for query:', { targetUserId, targetUsername });
      setProfile(null);
      setLoading(false);
      return;
    }

    console.log('Profile loaded successfully:', data);
    setProfile(data);
    setLoading(false);
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/');
    window.location.reload();
  };

  const handleEditClick = () => {
    navigate('/profile/edit');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 mx-auto mb-4 text-purple-500 animate-spin" />
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p className="text-slate-400">This user profile doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/social')}
            className="mt-6 px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
          >
            Back to Social
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 py-24">
      <div className="w-full max-w-5xl mx-auto">
        {/* Profile Card */}
        <div className="rounded-2xl border border-purple-500/20 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">
          <ProfileHeader
  userId={profile.id}
  username={profile.username || 'user'}
  fullName={profile.full_name || undefined}
  bio={profile.bio || undefined}
  role={profile.role}
  badge={profile.badge}
  minecraftUsername={profile.minecraft_username}
  createdAt={profile.created_at || undefined}
  coverImage={profile.cover_image || null}
  isOwnProfile={isOwnProfile}
  currentUserId={currentUserId || undefined}
  onEditClick={handleEditClick}
/>

          {/* Tabs Section */}
          <div className="px-6 py-4 border-t border-white/5">
            <div className="flex gap-4 border-b border-white/5">
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
                  activeTab === 'activity'
                    ? 'text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Activity
                {activeTab === 'activity' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 text-sm font-semibold transition-colors relative ${
                  activeTab === 'posts'
                    ? 'text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Posts
                {activeTab === 'posts' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-6 py-8">
            {activeTab === 'activity' ? (
              <div className="text-center text-slate-500 py-12">
                <p>No activity yet</p>
              </div>
            ) : postsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <p>No posts yet</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl mx-auto">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
