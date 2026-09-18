-- Check if posts table exists
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts';

-- Check if likes table exists
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes';

-- Check if comments table exists
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments';

-- Check posts table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'posts';
