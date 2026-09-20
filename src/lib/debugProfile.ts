import { supabase } from '../lib/supabase';

// Quick Profile Debug Utility
export const debugProfile = async () => {
  try {
    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('=== AUTH CHECK ===');
    console.log('User:', user);
    console.log('Auth Error:', authError);

    if (!user) {
      console.error('❌ Not logged in!');
      return;
    }

    // 2. Check if profile exists
    console.log('\n=== PROFILE CHECK ===');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('Profile:', profile);
    console.log('Profile Error:', profileError);

    if (!profile) {
      console.error('❌ Profile does not exist!');
      console.log('🔧 Creating profile...');

      // Try to create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.email?.split('@')[0] || 'User',
          can_post_social: true,
        })
        .select()
        .single();

      console.log('New Profile:', newProfile);
      console.log('Create Error:', createError);

      if (createError) {
        console.error('❌ Failed to create profile:', createError.message);
        console.log('💡 Possible reasons:');
        console.log('  1. Username already taken');
        console.log('  2. Missing columns in profiles table');
        console.log('  3. RLS policies blocking insert');
      } else {
        console.log('✅ Profile created successfully!');
      }
    } else {
      console.log('✅ Profile exists!');
      console.log('Profile data:', profile);
    }

    // 3. Check if badge column exists
    console.log('\n=== BADGE COLUMN CHECK ===');
    if (profile && 'badge' in profile) {
      console.log('✅ Badge column exists');
      console.log('Current badge:', profile.badge || 'None');
    } else {
      console.log('❌ Badge column does NOT exist!');
      console.log('⚠️ Run migrations from DATABASE_MIGRATION.md');
    }

    // 4. Check posts
    console.log('\n=== POSTS CHECK ===');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, content, user_id, created_at')
      .eq('user_id', user.id)
      .limit(5);

    console.log('Your posts:', posts);
    console.log('Posts error:', postsError);

    // 5. Summary
    console.log('\n=== SUMMARY ===');
    console.log('Auth:', user ? '✅' : '❌');
    console.log('Profile:', profile ? '✅' : '❌');
    console.log('Badge column:', profile && 'badge' in profile ? '✅' : '❌');
    console.log('Posts count:', posts?.length || 0);

  } catch (err) {
    console.error('Debug error:', err);
  }
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).debugProfile = debugProfile;
}
