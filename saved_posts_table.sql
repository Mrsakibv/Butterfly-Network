-- Create saved_posts table for bookmark feature
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_created_at ON saved_posts(created_at DESC);

-- Disable RLS to avoid 403 errors
ALTER TABLE saved_posts DISABLE ROW LEVEL SECURITY;
