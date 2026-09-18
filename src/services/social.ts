import { supabase } from '../lib/supabase';

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
        .select('id, username, minecraft_username, role')
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
    .single();

  return { liked: !!data, error };
};

// Add a comment
export const addComment = async (postId: string, userId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, content }])
      .select('*')
      .single();

    if (error) {
      console.error('addComment error:', error);
      return { data: null, error };
    }

    // Fetch author profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, minecraft_username, role')
      .eq('id', userId)
      .maybeSingle();

    const commentWithProfile = {
      ...data,
      profiles: profile || null,
    };

    return { data: [commentWithProfile], error: null };
  } catch (err) {
    console.error('addComment exception:', err);
    return { data: null, error: err as any };
  }
};

// Get comments for a post
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
        .select('id, username, minecraft_username, role')
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

// Update a comment (within 5 minutes only, fallback gracefully if updated_at is missing)
export const updateComment = async (commentId: string, newContent: string) => {
  try {
    let result = await supabase
      .from('comments')
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select('*')
      .maybeSingle();

    if (result.error) {
      // Fallback if updated_at column doesn't exist
      result = await supabase
        .from('comments')
        .update({ content: newContent })
        .eq('id', commentId)
        .select('*')
        .maybeSingle();
    }

    if (result.error) {
      console.error('updateComment error:', result.error);
      return { data: null, error: result.error };
    }

    return { data: result.data || { id: commentId, content: newContent, updated_at: new Date().toISOString() }, error: null };
  } catch (err) {
    console.error('updateComment exception:', err);
    return { data: null, error: err as any };
  }
};

// Delete a post (admin only)
export const deletePost = async (postId: string) => {
  try {
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
