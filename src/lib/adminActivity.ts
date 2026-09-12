import { supabase } from './supabase';

export type AdminActivityAction = 'created' | 'updated' | 'deleted' | 'visibility_changed' | 'role_changed';

interface LogAdminActivityInput {
  action: AdminActivityAction;
  section: string;
  itemName?: string;
  details?: Record<string, unknown>;
}

export const logAdminActivity = async ({ action, section, itemName = '', details = {} }: LogAdminActivityInput) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, role')
      .eq('id', user.id)
      .maybeSingle();

    await supabase.from('admin_activity_log').insert({
      actor_id: user.id,
      actor_name: profile?.full_name || profile?.username || user.email || 'Unknown member',
      actor_role: profile?.role || 'unknown',
      action,
      section,
      item_name: itemName,
      details,
    });
  } catch (error) {
    console.error('Failed to record admin activity:', error);
  }
};
