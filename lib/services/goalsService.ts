import { supabase } from '../supabase';

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  color: string;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface GoalInput {
  name: string;
  target_amount: number;
  icon?: string;
  color?: string;
  deadline?: string | null;
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

export async function getGoals(): Promise<Goal[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function createGoal(input: GoalInput): Promise<Goal> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      name: input.name,
      target_amount: input.target_amount,
      icon: input.icon ?? 'flag',
      color: input.color ?? '#58cc02',
      deadline: input.deadline ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function addToGoal(goalId: string, amount: number): Promise<Goal> {
  // Fetch current, then update
  const { data: current, error: fetchErr } = await supabase
    .from('goals')
    .select('current_amount, target_amount')
    .eq('id', goalId)
    .single();
  if (fetchErr) throw fetchErr;

  const newAmount = Math.min(
    Number(current.current_amount) + amount,
    Number(current.target_amount)
  );
  const isCompleted = newAmount >= Number(current.target_amount);

  const { data, error } = await supabase
    .from('goals')
    .update({ current_amount: newAmount, is_completed: isCompleted })
    .eq('id', goalId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (error) throw error;
}
