import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Calendar, Users, UserPlus, UserMinus, Settings } from 'lucide-react';
import { TikBadge } from './social/TikBadge';
import { RoleBadge } from './social/RoleBadge';
import { followUser, unfollowUser, checkIsFollowing, getFollowerCount, getFollowingCount } from '../services/social';
import type { BadgeType } from '../types/badges';

interface ProfileHeaderProps {
  userId: string;
  username: string;
  fullName?: string;
  bio?: string;
  role?: string | null;
  badge?: BadgeType | null;
  minecraftUsername?: string | null;
  createdAt?: string;
  coverImage?: string | null;
  isOwnProfile: boolean;
  currentUserId?: string;
  onEditClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userId,
  username,
  fullName,
  bio,
  role,
  badge,
  minecraftUsername,
  createdAt,
  coverImage,
  isOwnProfile,
  currentUserId,
  onEditClick,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    loadFollowData();
    loadCounts();
  }, [userId, currentUserId]);

  const loadFollowData = async () => {
    if (currentUserId && userId && currentUserId !== userId) {
      const { isFollowing } = await checkIsFollowing(currentUserId, userId);
      setIsFollowing(isFollowing);
    }
  };

  const loadCounts = async () => {
    const { count: followers } = await getFollowerCount(userId);
    const { count: following } = await getFollowingCount(userId);
    setFollowerCount(followers);
    setFollowingCount(following);
  };

  const handleFollow = async () => {
    if (!currentUserId || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        console.log('Unfollowing user:', userId);
        const result = await unfollowUser(currentUserId, userId);
        console.log('Unfollow result:', result);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        console.log('Following user:', userId);
        const result = await followUser(currentUserId, userId);
        console.log('Follow result:', result);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Follow/Unfollow failed. Check console for details.');
    } finally {
      setFollowLoading(false);
    }
  };

  const getMinecraftHead = (name?: string | null) => {
    return name ? `https://mc-heads.net/avatar/${encodeURIComponent(name)}/128` : '';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const avatarUrl = getMinecraftHead(minecraftUsername);

  const getCoverImageUrl = (coverUrl?: string | null) => {
    if (!coverUrl) return 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200';
    return coverUrl;
  };

  const coverImageUrl = getCoverImageUrl(coverImage);

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 overflow-hidden rounded-t-2xl">
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-violet-800/40 to-indigo-900/40"
          style={{
            backgroundImage: `url(${coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {isOwnProfile && (
          <button className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white transition-all">
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#050505] shadow-2xl"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center text-white font-bold text-4xl">
                {username[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>

          {/* Badge on Avatar */}
          <div className="absolute -bottom-2 -right-2">
            <TikBadge badgeType={badge} size="lg" />
          </div>
        </div>

        {/* Name & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {fullName || username}
              </h1>
              <RoleBadge role={role} />
            </div>
            <p className="text-purple-300 text-sm">@{username}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEditClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
              >
                <Settings className="w-4 h-4" />
                Edit Profile
              </motion.button>
            ) : currentUserId ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                  isFollowing
                    ? 'bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-500 hover:to-violet-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </motion.button>
            ) : null}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-slate-300 text-sm mb-4 max-w-2xl">{bio}</p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white font-semibold">{followerCount}</span>
            <span className="text-slate-400">Followers</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white font-semibold">{followingCount}</span>
            <span className="text-slate-400">Following</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Joined {formatDate(createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
