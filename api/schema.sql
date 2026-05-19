-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE transaction_type AS ENUM (
  'income',
  'expense'
);

CREATE TYPE account_type AS ENUM (
  'cash',
  'bank',
  'credit',
  'investment',
  'other'
);

CREATE TYPE budget_type AS ENUM (
  'category',
  'group',
  'merchant',
  'tag',
  'income_percentage'
);

CREATE TYPE budget_period AS ENUM (
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
);

CREATE TYPE rollover_type AS ENUM (
  'none',
  'carry_over',
  'subtract_overspend'
);

CREATE TYPE recurrence_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

CREATE TYPE theme_type AS ENUM (
  'light',
  'dark',
  'auto'
);

-- =====================================================
-- PROFILES
-- Extends Supabase auth.users
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  display_name TEXT NOT NULL,

  currency TEXT NOT NULL DEFAULT 'USD',

  custom_currency TEXT,

  language TEXT NOT NULL DEFAULT 'en',

  auto_backup BOOLEAN NOT NULL DEFAULT true,

  theme theme_type NOT NULL DEFAULT 'dark',

  use_openai BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ACCOUNTS
-- Represents wallets/accounts/cash sources
-- =====================================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  type account_type NOT NULL,

  balance NUMERIC(12,2) NOT NULL DEFAULT 0,

  currency TEXT NOT NULL DEFAULT 'USD',

  custom_currency TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES
-- Transaction categorization
-- =====================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  color TEXT NOT NULL,

  type transaction_type NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS
-- Core financial records
-- =====================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  account_id UUID
    REFERENCES accounts(id)
    ON DELETE SET NULL,

  category_id UUID
    REFERENCES categories(id)
    ON DELETE SET NULL,

  description TEXT NOT NULL,

  amount NUMERIC(12,2) NOT NULL
    CHECK (amount >= 0),

  type transaction_type NOT NULL,

  transaction_date TIMESTAMPTZ NOT NULL,

  parsed_from TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- BUDGETS
-- Budget definitions
-- =====================================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  name TEXT,

  type budget_type NOT NULL,

  amount NUMERIC(12,2) NOT NULL
    CHECK (amount >= 0),

  income_percentage NUMERIC(5,2),

  merchant_name TEXT,

  tag TEXT,

  account_id UUID
    REFERENCES accounts(id)
    ON DELETE SET NULL,

  period budget_period NOT NULL,

  start_date DATE,

  end_date DATE,

  rollover rollover_type DEFAULT 'none',

  alert_threshold NUMERIC(5,2) NOT NULL DEFAULT 80,

  is_active BOOLEAN NOT NULL DEFAULT true,

  parent_id UUID
    REFERENCES budgets(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- BUDGET CATEGORIES
-- Many-to-many relation
-- =====================================================

CREATE TABLE budget_categories (
  budget_id UUID NOT NULL
    REFERENCES budgets(id)
    ON DELETE CASCADE,

  category_id UUID NOT NULL
    REFERENCES categories(id)
    ON DELETE CASCADE,

  PRIMARY KEY (budget_id, category_id)
);

-- =====================================================
-- RECURRING PAYMENTS
-- Scheduled recurring financial activity
-- =====================================================

CREATE TABLE recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  account_id UUID NOT NULL
    REFERENCES accounts(id)
    ON DELETE CASCADE,

  category_id UUID
    REFERENCES categories(id)
    ON DELETE SET NULL,

  name TEXT NOT NULL,

  amount NUMERIC(12,2) NOT NULL
    CHECK (amount >= 0),

  type transaction_type NOT NULL,

  frequency recurrence_frequency NOT NULL,

  day_of_month INTEGER CHECK (
    day_of_month IS NULL
    OR (day_of_month >= 1 AND day_of_month <= 31)
  ),

  day_of_week INTEGER CHECK (
    day_of_week IS NULL
    OR (day_of_week >= 0 AND day_of_week <= 6)
  ),

  next_run_at TIMESTAMPTZ NOT NULL,

  notes TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_accounts_user_id
ON accounts(user_id);

CREATE INDEX idx_categories_user_id
ON categories(user_id);

CREATE INDEX idx_transactions_user_id
ON transactions(user_id);

CREATE INDEX idx_transactions_account_id
ON transactions(account_id);

CREATE INDEX idx_transactions_category_id
ON transactions(category_id);

CREATE INDEX idx_transactions_date
ON transactions(transaction_date);

CREATE INDEX idx_budgets_user_id
ON budgets(user_id);

CREATE INDEX idx_recurring_payments_user_id
ON recurring_payments(user_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_payments_updated_at
BEFORE UPDATE ON recurring_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'firstName', 'New User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attaching the profile creation trigger to the hidden auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ENABLING ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATING POLICIES FOR STANDARD TABLES
-- =====================================================

-- PROFILES: Users can only see/edit their own profile
-- (Note: 'id' maps directly to auth.uid() in this table)
CREATE POLICY "Users can manage their own profile" 
ON profiles 
FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- ACCOUNTS
CREATE POLICY "Users can manage their own accounts" 
ON accounts 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- CATEGORIES
CREATE POLICY "Users can manage their own categories" 
ON categories 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "Users can manage their own transactions" 
ON transactions 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- BUDGETS
CREATE POLICY "Users can manage their own budgets" 
ON budgets 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RECURRING PAYMENTS
CREATE POLICY "Users can manage their own recurring payments" 
ON recurring_payments 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CREATING POLICY FOR THE JOIN TABLE
-- =====================================================

-- BUDGET CATEGORIES: This table doesn't have a user_id column.
-- We must join it to the 'budgets' table to verify ownership.
CREATE POLICY "Users can manage their own budget categories" 
ON budget_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM budgets 
    WHERE budgets.id = budget_categories.budget_id 
    AND budgets.user_id = auth.uid()
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM budgets 
    WHERE budgets.id = budget_categories.budget_id 
    AND budgets.user_id = auth.uid()
  )
);

-- =====================================================
-- SAFETY IMPROVEMENTS (CONSTRAINTS)
-- =====================================================

-- Prevent users from accidentally creating duplicate categories
ALTER TABLE categories
ADD CONSTRAINT unique_category_per_user
UNIQUE(user_id, name, type);

-- Prevent users from creating identical accounts
ALTER TABLE accounts
ADD CONSTRAINT unique_account_per_user
UNIQUE(user_id, name);

-- Force rollover to never be empty
ALTER TABLE budgets 
ALTER COLUMN rollover SET NOT NULL;

-- Prevent impossible budget thresholds (e.g., alert me at 150%)
ALTER TABLE budgets
ADD CONSTRAINT check_alert_threshold 
CHECK (alert_threshold >= 0 AND alert_threshold <= 100);

-- Prevent impossible custom date ranges
ALTER TABLE budgets
ADD CONSTRAINT check_budget_dates 
CHECK (
  start_date IS NULL
  OR end_date IS NULL
  OR start_date <= end_date
);

-- =====================================================
-- AUTOMATED LEDGER SYSTEM (NULL-SAFE & OPTIMIZED)
-- =====================================================

-- This function intercepts changes to the transactions table
-- and automatically updates the corresponding account balance.
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- SCENARIO 1: A new transaction is created (INSERT)
    IF (TG_OP = 'INSERT') THEN
        IF NEW.account_id IS NOT NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
        END IF;
        RETURN NEW;

    -- SCENARIO 2: A transaction is deleted (DELETE)
    ELSIF (TG_OP = 'DELETE') THEN
        -- We do the exact opposite math to "refund" the balance
        IF OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
        END IF;
        RETURN OLD;

    -- SCENARIO 3: A transaction is edited (UPDATE)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- First, revert the old transaction's effect from the old account
        IF OLD.account_id IS NOT NULL THEN
            IF OLD.type = 'income' THEN
                UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
            ELSIF OLD.type = 'expense' THEN
                UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            END IF;
        END IF;

        -- Second, applying the new transaction's effect to the new account
        IF NEW.account_id IS NOT NULL THEN
            IF NEW.type = 'income' THEN
                UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
            ELSIF NEW.type = 'expense' THEN
                UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            END IF;
        END IF;

        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attaching the ledger function, optimized to ONLY fire when math-altering columns change
CREATE TRIGGER trigger_update_account_balance
AFTER INSERT OR DELETE OR UPDATE OF amount, type, account_id ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- edits after initial setup:
-- 1. Create the custom ENUM types based on your frontend arrays
CREATE TYPE goal_type AS ENUM ('track', 'save', 'subs', 'budget');
CREATE TYPE knowledge_type AS ENUM ('beginner', 'intermediate', 'advanced');

-- 2. Add the columns using your shiny new types
ALTER TABLE public.profiles 
ADD COLUMN financial_goal goal_type,
ADD COLUMN knowledge_level knowledge_type;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', 'New User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;