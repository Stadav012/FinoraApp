import { supabase } from '../supabase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface FullProfile {
  id: string;
  display_name: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  auto_backup: boolean;
  financial_goal: string | null;
  knowledge_level: string | null;
  created_at: string;
}

export type ProfileUpdate = Partial<
  Pick<FullProfile, 'display_name' | 'currency' | 'language' | 'theme' | 'auto_backup'>
>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

// ─────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────

/** Fetch the full user profile for the settings screen. */
export async function getFullProfile(): Promise<FullProfile> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, currency, language, theme, auto_backup, financial_goal, knowledge_level, created_at')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as FullProfile;
}

/** Get the user's email from Supabase Auth (not stored in profiles). */
export async function getUserEmail(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.email ?? '';
}

/** Update specific profile fields. Only sends the fields you pass. */
export async function updateProfile(updates: ProfileUpdate): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

/** Update the user's email in Supabase Auth. Requires re-verification. */
export async function updateEmail(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

/** Update the user's password in Supabase Auth. */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Delete the user's account. Cascades through all tables via FK constraints. */
export async function deleteAccount(): Promise<void> {
  // Delete the profile first (which cascades to accounts, transactions, etc.)
  const userId = await getUserId();
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) throw profileError;

  // Sign them out
  await supabase.auth.signOut();
}
