import { supabase } from '../supabase';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string;
  currency: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  transaction_date: string;
  parsed_from: string | null;
  category?: { name: string; color: string } | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

/** Returns a currency formatter. Falls back to USD. */
export function currencyFormatter(code: string = 'USD') {
  return (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  };
}

// ─────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────

/** Fetch the current user's profile. */
export async function getProfile(): Promise<UserProfile> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, currency')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/** Fetch all active accounts for the user. */
export async function getAccounts(): Promise<Account[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, type, balance, currency')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Account[];
}

/** Aggregate income and expense for the current calendar month. */
export async function getMonthSummary(): Promise<MonthSummary> {
  const userId = await getUserId();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('transaction_date', startOfMonth)
    .lte('transaction_date', endOfMonth);

  if (error) throw error;

  let income = 0;
  let expense = 0;
  (data ?? []).forEach((tx: { amount: number; type: string }) => {
    if (tx.type === 'income') income += Number(tx.amount);
    else expense += Number(tx.amount);
  });

  return { income, expense, balance: income - expense };
}

/** Fetch the most recent N transactions with optional category join. */
export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('transactions')
    .select('id, description, amount, type, transaction_date, parsed_from, category:categories(name, color)')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as Transaction[];
}

/** Create a default Cash account for a brand-new user. */
export async function seedDefaultAccount(currency: string = 'USD'): Promise<void> {
  const userId = await getUserId();

  // Check if user already has accounts (idempotent)
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existing && existing.length > 0) return; // Already seeded

  const { error } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      name: 'Cash',
      type: 'cash',
      balance: 0,
      currency,
    });

  if (error) throw error;
}

/**
 * Parse natural-language text and insert a transaction.
 * Stores the raw text in `parsed_from` for future AI re-processing.
 */
export async function logTransaction(
  text: string,
  accountId: string,
): Promise<Transaction> {
  
  try {
    // attempt first to use the AI service to log a transaction
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error('Not authenticated');

    // Dynamically build the URL using your new environment variable
    const baseUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!baseUrl) throw new Error('API URL is not defined in environment variables');

    const API_URL = `${baseUrl}/api/transactions/parse`; 

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ text, accountId })
    });

    if (!response.ok) {
      throw new Error('AI server responded with an error');
    }

    const transactionData = await response.json();
    return transactionData as Transaction;

  } catch (error) {
    // regex fallback in case of AI service failure
    console.warn('AI Parsing failed, falling back to local regex:', error);

    // Regex Math
    const amountMatch = text.match(/\$?([\d,]+\.?\d*)/);
    const rawAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    const lower = text.toLowerCase();
    const isIncome = lower.includes('received') || lower.includes('earned')
      || lower.includes('salary') || lower.includes('got paid')
      || lower.includes('income') || lower.includes('deposit');

    const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

    let description = text.trim()
      .replace(/^(spent|paid|bought)\s+/i, '')
      .replace(/\$[\d,.]+\s*(on|for)?\s*/i, '')
      .trim() || text.trim();

    // User ID directly from the phone's session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated for fallback saving');

    // Save directly to Supabase from the phone
    const { data, error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: accountId,
        description,
        amount: rawAmount,
        type,
        transaction_date: new Date().toISOString(),
        parsed_from: text,
      })
      .select('id, description, amount, type, transaction_date, parsed_from')
      .single();

    if (dbError) throw dbError;
    
    return data as Transaction;
  }
}
// awesome, done that i'd like to handle the IP issue in an env though also what about the routes setting and in server.js(ps; my server.js in api/ is blank)
