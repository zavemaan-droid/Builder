import { supabase } from './supabaseClient';

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function grantAdminAccess(userId: string, grantedBy: string, notes: string = ''): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .insert({
        user_id: userId,
        granted_by: grantedBy,
        notes,
      });

    if (error) {
      console.error('Error granting admin access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error granting admin access:', error);
    return false;
  }
}

export async function revokeAdminAccess(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error revoking admin access:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error revoking admin access:', error);
    return false;
  }
}
