import { supabase } from '../lib/supabase';
import type { BadgeType } from '../types/badges';

// Get posts (with user profile info)
export const getPosts = async (limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('getPosts error:', error);
      return { data: null, error };
    }

    // Manually fetch profiles for each post including role
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(post => post.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, minecraft_username, role, badge')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const postsWithProfiles = data.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || null
      }));

      return { data: postsWithProfiles, error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('getPosts exception:', err);
    return { data: null, error: err as any };
  }
};

// Create a new post (supports single or multiple image URLs)
export const createPost = async (userId: string, content: string, mediaUrls?: string | string[]) => {
  let mediaPayload: string | null = null;
  if (Array.isArray(mediaUrls)) {
    const valid = mediaUrls.filter(u => typeof u === 'string' && u.trim().length > 0);
    if (valid.length === 1) {
      mediaPayload = valid[0].trim();
    } else if (valid.length > 1) {
      mediaPayload = JSON.stringify(valid);
    }
  } else if (typeof mediaUrls === 'string' && mediaUrls.trim().length > 0) {
    mediaPayload = mediaUrls.trim();
  }

  const { data, error } = await supabase
    .from('posts')
    .insert([{ user_id: userId, content, media_url: mediaPayload }])
    .select();

  return { data, error };
};

// Like a post
export const likePost = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .insert([{ post_id: postId, user_id: userId }])
    .select();

  // Create notification for post author
  if (!error && data) {
    // Get post author ID
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post?.user_id) {
      await createNotification(post.user_id, userId, 'post_like', postId);
    }
  }

  return { data, error };
};

// Unlike a post
export const unlikePost = async (postId: string, userId: string) => {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  return { error };
};

// Get like count for a post
export const getLikeCount = async (postId: string) => {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return { count, error };
};

// Check if user liked a post
export const checkUserLiked = async (postId: string, userId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return { liked: !!data, error };
};

// ==========================================
// COMMENT LIKES & REPLIES
// ==========================================

// Like a comment
export const likeComment = async (commentId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .insert([{ comment_id: commentId, user_id: userId }])
      .select();

    // Create notification for comment author
    if (!error && data) {
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id, post_id')
        .eq('id', commentId)
        .single();

      if (comment?.user_id) {
        await createNotification(comment.user_id, userId, 'comment_like', comment.post_id, commentId);
      }
    }

    return { data, error };
  } catch (err) {
    return { data: null, error: err as any };
  }
};

// Unlike a comment
export const unlikeComment = async (commentId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    return { error };
  } catch (err) {
    return { error: err as any };
  }
};

// Get like count for a comment
export const getCommentLikeCount = async (commentId: string) => {
  try {
    const { count, error } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    return { count: count || 0, error };
  } catch (err) {
    return { count: 0, error: err as any };
  }
};

// Check if user liked a comment
export const checkUserLikedComment = async (commentId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    return { liked: !!data, error };
  } catch (err) {
    return { liked: false, error: err as any };
  }
};

// Add a comment (with optional replyTo)
export const addComment = async (postId: string, userId: string, content: string, replyTo?: string | null) => {
  try {
    const payload: any = { post_id: postId, user_id: userId, content };
    if (replyTo) {
      payload.reply_to = replyTo;
    }

    let { data, error } = await supabase
      .from('comments')
      .insert([payload])
      .select('*')
      .single();

    // If failed because reply_to column is missing from DB, fallback to normal insert
    if (error && replyTo) {
      console.warn('reply_to insert failed, falling back to standard comment:', error);
      const fallback = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: userId, content }])
        .select('*')
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('addComment error:', error);
      return { data: null, error };
    }

    // Fetch author profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, minecraft_username, role, badge')
      .eq('id', userId)
      .maybeSingle();

    const commentWithProfile = {
      ...data,
      profiles: profile || null,
    };

    // Create notification for post author
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post?.user_id) {
      await createNotification(post.user_id, userId, 'post_comment', postId, data.id);
    }

    return { data: [commentWithProfile], error: null };
  } catch (err) {
    console.error('addComment exception:', err);
    return { data: null, error: err as any };
  }
};

// Get all comments for a post (both top-level and replies)
export const getComments = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getComments error:', error);
      return { data: null, error };
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, minecraft_username, role, badge')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const commentsWithProfiles = data.map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
      }));

      return { data: commentsWithProfiles, error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('getComments exception:', err);
    return { data: null, error: err as any };
  }
};

// Delete a comment (user's own comment only)
export const deleteComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('deleteComment error:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('deleteComment exception:', err);
    return { error: err as any };
  }
};

// Update a comment
export const updateComment = async (commentId: string, newContent: string) => {
  try {
    const result = await supabase
      .from('comments')
      .update({ content: newContent })
      .eq('id', commentId)
      .select('*')
      .maybeSingle();

    if (result.error) {
      console.error('updateComment error:', result.error);
      return { data: null, error: result.error };
    }

    return { data: result.data || { id: commentId, content: newContent }, error: null };
  } catch (err) {
    console.error('updateComment exception:', err);
    return { data: null, error: err as any };
  }
};

// Delete a post (user's own post or admin)
export const deletePost = async (postId: string, userId?: string) => {
  try {
    // If userId provided, verify ownership
    if (userId) {
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error('deletePost fetch error:', fetchError);
        return { error: fetchError };
      }

      if (!post || post.user_id !== userId) {
        return { error: { message: 'Unauthorized: You can only delete your own posts' } };
      }
    }

    // Delete likes and comments first to ensure no constraint violations
    await supabase.from('likes').delete().eq('post_id', postId);
    await supabase.from('comments').delete().eq('post_id', postId);

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('deletePost error:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('deletePost exception:', err);
    return { error: err as any };
  }
};

// Update a post (user's own post only)
export const updatePost = async (
  postId: string,
  userId: string,
  content: string,
  mediaUrls?: string[]
) => {
  try {
    // Verify ownership first
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error('updatePost fetch error:', fetchError);
      return { data: null, error: fetchError };
    }

    if (!post || post.user_id !== userId) {
      return { data: null, error: { message: 'Unauthorized: You can only edit your own posts' } };
    }

    // Prepare media payload
    let mediaPayload: string | null = null;
    if (Array.isArray(mediaUrls)) {
      const valid = mediaUrls.filter(u => typeof u === 'string' && u.trim().length > 0);
      if (valid.length === 1) {
        mediaPayload = valid[0].trim();
      } else if (valid.length > 1) {
        mediaPayload = JSON.stringify(valid);
      }
    }

    // Update post
    const { data, error } = await supabase
      .from('posts')
      .update({
        content,
        media_url: mediaPayload,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select();

    if (error) {
      console.error('updatePost error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('updatePost exception:', err);
    return { data: null, error: err as any };
  }
};

// Toggle user post permission (admin only)
export const toggleUserPostPermission = async (userId: string, canPost: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ can_post_social: canPost })
    .eq('id', userId)
    .select();

  return { data, error };
};

// Get user's posts
export const getUserPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
};

// Get all users with their post permission status
export const getAllUsersWithPermissions = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, can_post_social')
    .order('username', { ascending: true });

  return { data, error };
};

// ==========================================
// BADGE MANAGEMENT (Admin Only)
// ==========================================

// Assign badge to user
export const assignBadge = async (userId: string, badgeType: BadgeType) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ badge: badgeType })
    .eq('id', userId)
    .select();

  return { data, error };
};

// Remove badge from user
export const removeBadge = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ badge: null })
    .eq('id', userId)
    .select();

  return { data, error };
};

// Get all users with badges for admin management
export const getAllUsersWithBadges = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, badge, minecraft_username')
    .order('username', { ascending: true });

  return { data, error };
};

// ==========================================
// FOLLOW SYSTEM
// ==========================================

// Follow a user
export const followUser = async (followerId: string, followingId: string) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .insert([{ follower_id: followerId, following_id: followingId }])
      .select();

    if (error) {
      console.error('Follow error:', error);
      // If table doesn't exist, simulate success in memory
      if (error.code === '42P01') {
        console.warn('follows table does not exist. Using localStorage fallback.');
        const follows = JSON.parse(localStorage.getItem('follows') || '[]');
        follows.push({ follower_id: followerId, following_id: followingId });
        localStorage.setItem('follows', JSON.stringify(follows));
        return { data: [{ id: 'local' }], error: null };
      }
    }

    // Create notification for followed user
    if (!error && data) {
      await createNotification(followingId, followerId, 'follow');
    }

    return { data, error };
  } catch (err) {
    console.error('Follow exception:', err);
    return { data: null, error: err as any };
  }
};

// Unfollow a user
export const unfollowUser = async (followerId: string, followingId: string) => {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Unfollow error:', error);
      // Fallback
      if (error.code === '42P01') {
        const follows = JSON.parse(localStorage.getItem('follows') || '[]');
        const filtered = follows.filter(
          (f: any) => !(f.follower_id === followerId && f.following_id === followingId)
        );
        localStorage.setItem('follows', JSON.stringify(filtered));
        return { error: null };
      }
    }

    return { error };
  } catch (err) {
    console.error('Unfollow exception:', err);
    return { error: err as any };
  }
};

// Check if user is following another user
export const checkIsFollowing = async (followerId: string, followingId: string) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) {
      // Fallback
      if (error.code === '42P01') {
        const follows = JSON.parse(localStorage.getItem('follows') || '[]');
        const isFollowing = follows.some(
          (f: any) => f.follower_id === followerId && f.following_id === followingId
        );
        return { isFollowing, error: null };
      }
    }

    return { isFollowing: !!data, error };
  } catch (err) {
    console.error('Check following exception:', err);
    return { isFollowing: false, error: err as any };
  }
};

// Get follower count
export const getFollowerCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) {
      // Fallback
      if (error.code === '42P01') {
        const follows = JSON.parse(localStorage.getItem('follows') || '[]');
        const count = follows.filter((f: any) => f.following_id === userId).length;
        return { count, error: null };
      }
    }

    return { count: count || 0, error };
  } catch (err) {
    console.error('Get follower count exception:', err);
    return { count: 0, error: err as any };
  }
};

// Get following count
export const getFollowingCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) {
      // Fallback
      if (error.code === '42P01') {
        const follows = JSON.parse(localStorage.getItem('follows') || '[]');
        const count = follows.filter((f: any) => f.follower_id === userId).length;
        return { count, error: null };
      }
    }

    return { count: count || 0, error };
  } catch (err) {
    console.error('Get following count exception:', err);
    return { count: 0, error: err as any };
  }
};

// ==========================================
// NOTIFICATIONS SYSTEM
// ==========================================

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

// Create a notification (internal helper)
const createNotification = async (
  recipientId: string,
  actorId: string,
  type: 'post_like' | 'post_comment' | 'comment_like' | 'follow',
  postId?: string | null,
  commentId?: string | null
) => {
  // Don't create notification for self-interactions
  if (recipientId === actorId) return { data: null, error: null };

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        post_id: postId || null,
        comment_id: commentId || null,
      }])
      .select();

    if (error) {
      console.error('Create notification error:', error);
    }

    return { data, error };
  } catch (err) {
    console.error('Create notification exception:', err);
    return { data: null, error: err as any };
  }
};

// Get user notifications with actor profiles
export const getNotifications = async (userId: string, limit = 20, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get notifications error:', error);
      return { data: null, error };
    }

    if (data && data.length > 0) {
      // Fetch actor profiles
      const actorIds = [...new Set(data.map(n => n.actor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, minecraft_username, badge')
        .in('id', actorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const notificationsWithActors: Notification[] = data.map(notification => ({
        ...notification,
        actor: profileMap.get(notification.actor_id) || undefined,
      }));

      return { data: notificationsWithActors, error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Get notifications exception:', err);
    return { data: null, error: err as any };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Mark notification as read error:', error);
    }

    return { error };
  } catch (err) {
    console.error('Mark notification as read exception:', err);
    return { error: err as any };
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all notifications as read error:', error);
    }

    return { error };
  } catch (err) {
    console.error('Mark all notifications as read exception:', err);
    return { error: err as any };
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Get unread notification count error:', error);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    console.error('Get unread notification count exception:', err);
    return { count: 0, error: err as any };
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Delete notification error:', error);
    }

    return { error };
  } catch (err) {
    console.error('Delete notification exception:', err);
    return { error: err as any };
  }
};

// ==========================================
// BOOKMARK/SAVE POSTS
// ==========================================

// Save a post
export const savePost = async (postId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .insert([{ post_id: postId, user_id: userId }])
      .select();

    if (error) {
      console.error('Save post error:', error);
    }

    return { data, error };
  } catch (err) {
    console.error('Save post exception:', err);
    return { data: null, error: err as any };
  }
};

// Unsave a post
export const unsavePost = async (postId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Unsave post error:', error);
    }

    return { error };
  } catch (err) {
    console.error('Unsave post exception:', err);
    return { error: err as any };
  }
};

// Check if user saved a post
export const checkIsSaved = async (postId: string, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Check is saved error:', error);
      return { isSaved: false, error };
    }

    return { isSaved: !!data, error: null };
  } catch (err) {
    console.error('Check is saved exception:', err);
    return { isSaved: false, error: err as any };
  }
};

// Get user's saved posts
export const getSavedPosts = async (userId: string, limit = 20, offset = 0) => {
  try {
    const { data: savedData, error: savedError } = await supabase
      .from('saved_posts')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (savedError || !savedData || savedData.length === 0) {
      console.error('Get saved posts error:', savedError);
      return { data: [], error: savedError };
    }

    // Fetch full posts
    const postIds = savedData.map(s => s.post_id);
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Get posts error:', postsError);
      return { data: null, error: postsError };
    }

    // Fetch profiles for posts
    if (posts && posts.length > 0) {
      const userIds = [...new Set(posts.map(post => post.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, minecraft_username, role, badge')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const postsWithProfiles = posts.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || null
      }));

      return { data: postsWithProfiles, error: null };
    }

    return { data: posts || [], error: null };
  } catch (err) {
    console.error('Get saved posts exception:', err);
    return { data: null, error: err as any };
  }
};
