-- DeFi Intelligence Agent Database Schema
-- For Cloudflare D1

-- Watched wallets table
CREATE TABLE IF NOT EXISTS watched_wallets (
  address TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  added_at INTEGER NOT NULL,
  alert_preferences TEXT NOT NULL, -- JSON
  profit_history TEXT, -- JSON (nullable until first analysis)
  last_checked INTEGER NOT NULL DEFAULT 0,
  nickname TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_watched_wallets_user ON watched_wallets(user_id);
CREATE INDEX idx_watched_wallets_last_checked ON watched_wallets(last_checked);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  contract_address TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  chain TEXT NOT NULL,
  discovered_at INTEGER NOT NULL,
  risk_score TEXT, -- JSON (nullable until analyzed)
  analysis TEXT, -- JSON (comprehensive analysis results)
  user_rating INTEGER, -- 1-5 stars, nullable
  user_notes TEXT,
  user_id TEXT NOT NULL,
  category TEXT,
  market_cap REAL,
  is_flagged INTEGER DEFAULT 0, -- 0 = normal, 1 = flagged as scam
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_contract ON projects(contract_address);
CREATE INDEX idx_projects_chain ON projects(chain);
CREATE INDEX idx_projects_discovered ON projects(discovered_at DESC);
CREATE INDEX idx_projects_flagged ON projects(is_flagged);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  alert_type TEXT NOT NULL,
  details TEXT NOT NULL, -- JSON
  read_status INTEGER NOT NULL DEFAULT 0, -- 0 = unread, 1 = read
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_wallet ON alerts(wallet_address);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_read_status ON alerts(read_status);
CREATE INDEX idx_alerts_user_unread ON alerts(user_id, read_status);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  project_criteria TEXT, -- JSON (nullable)
  alert_settings TEXT NOT NULL, -- JSON
  risk_tolerance TEXT NOT NULL DEFAULT 'MODERATE',
  favorite_chains TEXT, -- JSON array
  blocked_projects TEXT, -- JSON array of project IDs
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Transaction cache table (to avoid re-analyzing same transactions)
CREATE TABLE IF NOT EXISTS transaction_cache (
  hash TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  analysis TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_tx_cache_wallet ON transaction_cache(wallet_address);
CREATE INDEX idx_tx_cache_timestamp ON transaction_cache(timestamp DESC);

-- Scam patterns table (for pattern matching)
CREATE TABLE IF NOT EXISTS scam_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT NOT NULL, -- 'CONTRACT', 'BEHAVIOR', 'SOCIAL', etc.
  description TEXT NOT NULL,
  indicators TEXT NOT NULL, -- JSON array of indicators
  severity TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  examples TEXT, -- JSON array of known scam addresses
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_scam_patterns_type ON scam_patterns(pattern_type);
CREATE INDEX idx_scam_patterns_severity ON scam_patterns(severity);

-- Wallet profiles table (cached profitable wallet data)
CREATE TABLE IF NOT EXISTS wallet_profiles (
  address TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  total_profit REAL NOT NULL,
  profit_7d REAL NOT NULL,
  profit_30d REAL NOT NULL,
  profit_90d REAL NOT NULL,
  trade_count INTEGER NOT NULL,
  win_rate REAL NOT NULL,
  avg_position_size REAL NOT NULL,
  roi REAL NOT NULL,
  specialization TEXT,
  risk_profile TEXT,
  score REAL NOT NULL,
  last_analyzed INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_wallet_profiles_score ON wallet_profiles(score DESC);
CREATE INDEX idx_wallet_profiles_profit ON wallet_profiles(total_profit DESC);
CREATE INDEX idx_wallet_profiles_specialization ON wallet_profiles(specialization);
CREATE INDEX idx_wallet_profiles_last_analyzed ON wallet_profiles(last_analyzed);

-- Project discoveries table (feed of newly found projects)
CREATE TABLE IF NOT EXISTS project_discoveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  discovery_source TEXT NOT NULL, -- 'BLOCKCHAIN_SCAN', 'DEX_TRENDING', 'SOCIAL', etc.
  match_score REAL NOT NULL, -- how well it matches user criteria
  notified INTEGER DEFAULT 0, -- 0 = not sent, 1 = sent
  user_id TEXT NOT NULL,
  discovered_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_discoveries_user ON project_discoveries(user_id);
CREATE INDEX idx_discoveries_notified ON project_discoveries(notified);
CREATE INDEX idx_discoveries_score ON project_discoveries(match_score DESC);
CREATE INDEX idx_discoveries_timestamp ON project_discoveries(discovered_at DESC);

-- Insert some default scam patterns
INSERT INTO scam_patterns (pattern_type, description, indicators, severity, examples) VALUES
('CONTRACT', 'Honeypot - Can buy but cannot sell', '["no_sell_function", "transfer_restrictions", "blacklist_on_sell"]', 'CRITICAL', '[]'),
('CONTRACT', 'Hidden mint function in proxy contract', '["is_proxy", "has_mint", "ownership_not_renounced"]', 'CRITICAL', '[]'),
('TOKENOMICS', 'Extreme concentration in top holders', '["top_10_holders > 50%", "team_allocation > 30%"]', 'HIGH', '[]'),
('TOKENOMICS', 'Unlocked liquidity with high market cap', '["lp_not_locked", "market_cap > 1000000"]', 'HIGH', '[]'),
('TEAM', 'Anonymous team with no history', '["team_anonymous", "no_previous_projects", "no_linkedin"]', 'MEDIUM', '[]'),
('TEAM', 'Fake team members using stock photos', '["fake_profile_images", "copied_bios"]', 'CRITICAL', '[]'),
('SOCIAL', 'Sudden follower spike indicating bought followers', '["follower_spike > 1000%", "low_engagement_rate"]', 'MEDIUM', '[]'),
('BEHAVIOR', 'Multiple wallets controlled by same entity (Sybil)', '["similar_funding_source", "coordinated_trading", "same_gas_patterns"]', 'HIGH', '[]');

-- Create triggers to update timestamps
CREATE TRIGGER IF NOT EXISTS update_watched_wallets_timestamp
AFTER UPDATE ON watched_wallets
BEGIN
  UPDATE watched_wallets SET updated_at = unixepoch() WHERE address = NEW.address;
END;

CREATE TRIGGER IF NOT EXISTS update_projects_timestamp
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_preferences_timestamp
AFTER UPDATE ON user_preferences
BEGIN
  UPDATE user_preferences SET updated_at = unixepoch() WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_wallet_profiles_timestamp
AFTER UPDATE ON wallet_profiles
BEGIN
  UPDATE wallet_profiles SET updated_at = unixepoch() WHERE address = NEW.address;
END;
