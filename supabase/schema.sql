-- supabase/schema.sql
-- Relational Schema for Carteira Predictor on Supabase (PostgreSQL).
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- All monetary figures are stored as INTEGER cents to avoid floating point drift.

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  name TEXT,
  risk_profile TEXT NOT NULL DEFAULT 'moderado' CHECK (risk_profile IN ('conservador', 'moderado', 'arrojado', 'agressivo')),
  risk_score INTEGER NOT NULL DEFAULT 50,
  horizon_years INTEGER NOT NULL DEFAULT 10,
  emergency_fund_months INTEGER NOT NULL DEFAULT 6,
  emergency_fund_cents BIGINT NOT NULL DEFAULT 0,
  monthly_expenses_cents BIGINT,
  monthly_net_income_cents BIGINT,
  privacy_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Portfolios
CREATE TABLE IF NOT EXISTS public.portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Carteira Principal',
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  stocks_pct INTEGER NOT NULL DEFAULT 4000,       -- 40.00%
  fiis_pct INTEGER NOT NULL DEFAULT 3500,         -- 35.00%
  fixed_income_pct INTEGER NOT NULL DEFAULT 2000, -- 20.00%
  cash_reserve_pct INTEGER NOT NULL DEFAULT 500,  -- 5.00%
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.portfolios(user_id);

-- 3. Portfolio Positions (Custódia Atual)
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'fii', 'fiagro', 'fiinfra', 'etf_br', 'fixed_income')),
  quantity NUMERIC(14, 4) NOT NULL,
  average_price_cents BIGINT NOT NULL,
  total_invested_cents BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(portfolio_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_positions_portfolio ON public.portfolio_positions(portfolio_id);

-- 4. Transactions (Histórico de Ordens e Notas da B3)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'dividend', 'jcp', 'split', 'bonus')),
  trade_date TEXT NOT NULL, -- "YYYY-MM-DD"
  quantity NUMERIC(14, 4) NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  total_costs_cents BIGINT NOT NULL DEFAULT 0,
  total_amount_cents BIGINT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_date ON public.transactions(portfolio_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_ticker ON public.transactions(user_id, ticker);

-- 5. Action Plan Entries (Plano de Ação Vigente)
CREATE TABLE IF NOT EXISTS public.action_plan_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  effective_from TEXT NOT NULL, -- "YYYY-MM"
  base_amount_cents BIGINT NOT NULL,
  annual_adjustment_type TEXT NOT NULL DEFAULT 'none' CHECK (annual_adjustment_type IN ('none', 'fixed_pct', 'ipca')),
  annual_adjustment_pct INTEGER, -- basis points (500 = 5.00%)
  end_date TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_action_plan_user_date ON public.action_plan_entries(user_id, effective_from DESC);

-- 6. Action Month Overrides (13º salário, bonificações)
CREATE TABLE IF NOT EXISTS public.action_month_overrides (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- "YYYY-MM"
  override_amount_cents BIGINT NOT NULL,
  is_one_off_deposit BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  UNIQUE(user_id, year_month)
);

-- 7. Action Actual Records (Acompanhamento Mensal Planejado vs Realizado)
CREATE TABLE IF NOT EXISTS public.action_actual_records (
  id TEXT PRIMARY KEY, -- user_id_year_month
  user_id TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- "YYYY-MM"
  planned_amount_cents BIGINT NOT NULL,
  actual_amount_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed')),
  cumulative_gap_cents BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, year_month)
);

-- Row Level Security (RLS) - Permite leitura e escrita com a chave pública/anon
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_month_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_actual_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on portfolios" ON public.portfolios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on portfolio_positions" ON public.portfolio_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on action_plan_entries" ON public.action_plan_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on action_month_overrides" ON public.action_month_overrides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on action_actual_records" ON public.action_actual_records FOR ALL USING (true) WITH CHECK (true);
