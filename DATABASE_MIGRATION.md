# 🗄️ Database Migration Guide for Butterfly Network

## Required Database Changes

Run these SQL commands in your Supabase SQL Editor:

```sql
-- ==========================================
-- 1. ADD BADGE COLUMN TO PROFILES
-- ==========================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS badge TEXT;

-- Add check constraint for valid badge types
ALTER TABLE profiles
ADD CONSTRAINT valid_badge_type 
CHECK (badge IN ('blue', 'red', 'golden', 'diamond', 'cosmic', 'crown') OR badge IS NULL);

-- ==========================================
-- 2. CREATE FOLLOWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created ON follows(created_at DESC);

-- ==========================================
-- 3. VERIFY PROFILES TABLE HAS REQUIRED COLUMNS
-- ==========================================
-- Check if these columns exist, if not add them:

-- Username column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Role column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Minecraft username column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS minecraft_username TEXT;

-- Full name column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Bio column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Can post social column (should already exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS can_post_social BOOLEAN DEFAULT false;

-- ==========================================
-- 4. CREATE INDEXES FOR BETTER PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_badge ON profiles(badge) WHERE badge IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ==========================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view follows
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT USING (true);

-- Policy: Users can follow others
CREATE POLICY "Users can create follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ==========================================
-- 6. VERIFY POSTS TABLE
-- ==========================================
-- Make sure posts table exists with correct structure
-- (This should already be set up, just verification)

-- Check posts table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts';

-- ==========================================
-- 7. TEST QUERIES
-- ==========================================

-- Test: Get all badge types in use
SELECT badge, COUNT(*) as count 
FROM profiles 
WHERE badge IS NOT NULL 
GROUP BY badge;

-- Test: Get follow counts
SELECT 
  p.username,
  (SELECT COUNT(*) FROM follows WHERE following_id = p.id) as followers,
  (SELECT COUNT(*) FROM follows WHERE follower_id = p.id) as following
FROM profiles p
LIMIT 10;

-- Test: Check if profiles are properly linked
SELECT 
  posts.id,
  posts.content,
  profiles.username,
  profiles.badge,
  profiles.role
FROM posts
LEFT JOIN profiles ON posts.user_id = profiles.id
LIMIT 5;
```

## 🔍 Debugging Steps

### If posts show "Anonymous":

1. **Check if profile exists:**
```sql
SELECT id, username, role, badge 
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

2. **Check if posts have correct user_id:**
```sql
SELECT id, user_id, content, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;
```

3. **Verify the join works:**
```sql
SELECT 
  posts.*,
  profiles.username,
  profiles.role,
  profiles.badge
FROM posts
LEFT JOIN profiles ON posts.user_id = profiles.id
WHERE posts.user_id = 'YOUR_USER_ID';
```

### If profile page shows "Profile not found":

1. **Check profile exists:**
```sql
SELECT * FROM profiles WHERE id = 'USER_ID_FROM_URL';
```

2. **Check username lookup:**
```sql
SELECT * FROM profiles WHERE username = 'USERNAME_FROM_URL';
```

## 🎯 Quick Fix: Ensure Your Profile Exists

If you're logged in but profile doesn't exist, create it manually:

```sql
INSERT INTO profiles (id, username, full_name, role, can_post_social)
VALUES (
  'YOUR_AUTH_USER_ID',
  'your_username',
  'Your Full Name',
  'owner',
  true
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  can_post_social = EXCLUDED.can_post_social;
```

## 🚀 After Migration

1. Clear browser cache and reload
2. Log out and log back in
3. Try creating a new post
4. Click on your avatar to view profile
5. Go to Admin Panel → Social → Badge Management
6. Assign a badge to yourself

## 📝 Notes

- All badge types: `blue`, `red`, `golden`, `diamond`, `cosmic`, `crown`
- Badges are optional (can be NULL)
- Follow system prevents self-follows
- Indexes are created for performance optimization
- RLS policies ensure users can only manage their own follows
