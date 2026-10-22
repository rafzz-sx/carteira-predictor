-- src/lib/db/schema.sql
-- Relational Schema for Carteira Predictor on Turso libSQL (SQLite-at-the-edge).
-- All monetary figures are stored as INTEGER cents. Foreign keys enforce referential integrity.

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  risk_profile TEXT NOT NULL CHECK(risk_profile IN ('conservador', 'moderado', 'arrojado', 'agressivo')),
  risk_score INTEGER NOT NULL,
  horizon_years INTEGER NOT NULL,
  emergency_fund_months INTEGER NOT NULL,
  emergency_fund_cents INTEGER NOT NULL DEFAULT 0,
  monthly_expenses_cents INTEGER,
  monthly_net_income_cents INTEGER,
  privacy_mode INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 1,
  stocks_pct INTEGER NOT NULL DEFAULT 4000,
  fiis_pct INTEGER NOT NULL DEFAULT 3500,
  fixed_income_pct INTEGER NOT NULL DEFAULT 2000,
  cash_reserve_pct INTEGER NOT NULL DEFAULT 500,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

CREATE TABLE IF NOT EXISTS portfolio_positions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  quantity REAL NOT NULL,
  average_price_cents INTEGER NOT NULL,
  total_invested_cents INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(portfolio_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_positions_portfolio ON portfolio_positions(portfolio_id);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('buy', 'sell', 'dividend', 'jcp', 'split', 'bonus')),
  trade_date TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  total_costs_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_date ON transactions(portfolio_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_ticker ON transactions(user_id, ticker);

CREATE TABLE IF NOT EXISTS action_plan_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  effective_from TEXT NOT NULL, -- "YYYY-MM"
  base_amount_cents INTEGER NOT NULL,
  annual_adjustment_type TEXT NOT NULL CHECK(annual_adjustment_type IN ('none', 'fixed_pct', 'ipca')),
  annual_adjustment_pct INTEGER, -- basis points (e.g. 500 = 5.00%)
  end_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_action_plan_user_date ON action_plan_entries(user_id, effective_from DESC);

CREATE TABLE IF NOT EXISTS action_month_overrides (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- "YYYY-MM"
  override_amount_cents INTEGER NOT NULL,
  is_one_off_deposit INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  UNIQUE(user_id, year_month)
);

CREATE TABLE IF NOT EXISTS action_actual_records (
  id TEXT PRIMARY KEY, -- user_id_year_month
  user_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- "YYYY-MM"
  planned_amount_cents INTEGER NOT NULL,
  actual_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending', 'partial', 'completed')),
  cumulative_gap_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, year_month)
);
