import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export type UserRole = Database["public"]["Enums"]["user_role"];
export type PermissionLevel = Database["public"]["Enums"]["permission_level"];

export async function getUserRole(userId: string): Promise<{ data: UserRole | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId } as unknown as undefined);
  return { data: data as UserRole | null, error: error as Error | null };
}

export async function hasRole(userId: string, role: UserRole): Promise<{ data: boolean | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: role } as unknown as undefined);
  return { data: data as boolean | null, error: error as Error | null };
}
