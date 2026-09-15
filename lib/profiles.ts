import { supabase } from '@/lib/supabase';

export type Role = 'student' | 'teacher';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
};

export async function getProfile(
  userId: string
): Promise<Profile | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Get profile error:', error);
    return null;
  }

  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    email?: string;
  }
): Promise<{ error: string | null }> {
  if (!userId) {
    return {
      error: 'You must be logged in.',
    };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  return {
    error: error?.message ?? null,
  };
}