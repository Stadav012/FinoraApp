import { supabase } from '../supabase';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: string;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: string;
  remind_days_before: number;
  icon: string;
  color: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface SubscriptionInput {
  name: string;
  amount: number;
  category?: string;
  billing_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: string;
  remind_days_before?: number;
  icon?: string;
  color?: string;
  notes?: string;
}

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('next_billing_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Subscription[];
}

export async function createSubscription(input: SubscriptionInput): Promise<Subscription> {
  const userId = await getUserId();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user's currency from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', userId)
    .single();

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      name: input.name,
      amount: input.amount,
      currency: profile?.currency ?? 'USD',
      category: input.category ?? 'Other',
      billing_cycle: input.billing_cycle,
      next_billing_date: input.next_billing_date,
      remind_days_before: input.remind_days_before ?? 3,
      icon: input.icon ?? 'card',
      color: input.color ?? '#1cb0f6',
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Subscription;
}

export async function updateSubscription(
  id: string,
  updates: Partial<SubscriptionInput & { is_active: boolean }>
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Get total monthly cost of all active subscriptions (normalized to monthly). */
export function getMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((total, s) => {
    const amount = Number(s.amount);
    switch (s.billing_cycle) {
      case 'weekly': return total + amount * 4.33;
      case 'monthly': return total + amount;
      case 'quarterly': return total + amount / 3;
      case 'yearly': return total + amount / 12;
      default: return total + amount;
    }
  }, 0);
}

/** Get subscriptions due within the next N days. */
export function getUpcoming(subs: Subscription[], days: number = 7): Subscription[] {
  const now = Date.now();
  const cutoff = now + days * 86_400_000;
  return subs.filter(s => {
    const billing = new Date(s.next_billing_date).getTime();
    return billing >= now && billing <= cutoff;
  });
}
