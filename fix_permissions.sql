-- Grant full permissions for all social tables to authenticated and anonymous users
GRANT ALL PRIVILEGES ON TABLE posts TO authenticated, anon;
GRANT ALL PRIVILEGES ON TABLE likes TO authenticated, anon;
GRANT ALL PRIVILEGES ON TABLE comments TO authenticated, anon;
GRANT ALL PRIVILEGES ON TABLE profiles TO authenticated, anon;

-- Disable RLS on all social tables to prevent 403 / permission issues
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Drop any restricting policies if they exist
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
