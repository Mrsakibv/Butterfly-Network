import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useSocialPermission = () => {
  const { user } = useAuth();
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.id) {
        setCanPost(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('can_post_social')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          setCanPost(data.can_post_social || false);
        }
      } catch (err) {
        console.error('Error checking social permission:', err);
        setCanPost(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user]);

  return { canPost, loading };
};
