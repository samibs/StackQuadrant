-- ============================================
-- PainGaps Financial Services — Phase 1 Migration
-- Teams, Vendors, Regulations, Alerts
-- ============================================

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  plan_code VARCHAR(30) NOT NULL,
  stripe_customer_id VARCHAR(60) UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT teams_plan_check CHECK (plan_code IN ('analyst', 'team', 'business', 'enterprise'))
);
CREATE INDEX IF NOT EXISTS teams_plan_code_idx ON teams (plan_code);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  sector_access JSONB NOT NULL DEFAULT '["all"]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_members_team_user_unique UNIQUE (team_id, user_id),
  CONSTRAINT team_members_role_check CHECK (role IN ('team_admin', 'team_member'))
);
CREATE INDEX IF NOT EXISTS team_members_team_idx ON team_members (team_id);
CREATE INDEX IF NOT EXISTS team_members_user_idx ON team_members (user_id);

-- Tracked Vendors
CREATE TABLE IF NOT EXISTS tracked_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  vendor_name VARCHAR(240) NOT NULL,
  vendor_aliases JSONB NOT NULL DEFAULT '[]',
  sector VARCHAR(60) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tracked_vendors_sector_check CHECK (sector IN ('fund', 'banking', 'audit', 'wealth', 'fiduciary', 'accounting', 'cross-sector'))
);
CREATE INDEX IF NOT EXISTS tracked_vendors_team_idx ON tracked_vendors (team_id);
CREATE INDEX IF NOT EXISTS tracked_vendors_sector_idx ON tracked_vendors (sector);

-- Regulations
CREATE TABLE IF NOT EXISTS regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(240) NOT NULL,
  short_code VARCHAR(30) NOT NULL UNIQUE,
  issuing_body VARCHAR(120) NOT NULL,
  jurisdictions JSONB NOT NULL,
  effective_date DATE,
  implementation_deadline DATE,
  status VARCHAR(30) NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT NOT NULL,
  impact_map JSONB,
  pain_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT regulations_pain_range CHECK (pain_score IS NULL OR (pain_score >= 0 AND pain_score <= 100)),
  CONSTRAINT regulations_status_check CHECK (status IN ('proposed', 'consultation', 'adopted', 'effective', 'superseded'))
);
CREATE INDEX IF NOT EXISTS regulations_issuing_body_idx ON regulations (issuing_body);
CREATE INDEX IF NOT EXISTS regulations_status_idx ON regulations (status);
CREATE INDEX IF NOT EXISTS regulations_effective_date_idx ON regulations (effective_date);

-- Vendor Pains
CREATE TABLE IF NOT EXISTS vendor_pains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_vendor_id UUID NOT NULL REFERENCES tracked_vendors(id) ON DELETE CASCADE,
  scored_entity_id UUID REFERENCES scored_entities(id),
  title VARCHAR(240) NOT NULL,
  summary TEXT NOT NULL,
  intensity_score INT NOT NULL,
  frequency_score INT NOT NULL,
  trend_direction VARCHAR(20) NOT NULL,
  fix_detected BOOLEAN NOT NULL DEFAULT false,
  fix_detected_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL,
  evidence_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_pains_intensity_range CHECK (intensity_score >= 0 AND intensity_score <= 100),
  CONSTRAINT vendor_pains_frequency_range CHECK (frequency_score >= 0 AND frequency_score <= 100),
  CONSTRAINT vendor_pains_trend_check CHECK (trend_direction IN ('growing', 'stable', 'declining'))
);
CREATE INDEX IF NOT EXISTS vendor_pains_vendor_idx ON vendor_pains (tracked_vendor_id);
CREATE INDEX IF NOT EXISTS vendor_pains_intensity_idx ON vendor_pains (intensity_score);

-- Alert Configs
CREATE TABLE IF NOT EXISTS alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(60) NOT NULL,
  topic_filter JSONB NOT NULL,
  threshold INT NOT NULL,
  channel VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT alert_configs_channel_check CHECK (channel IN ('email', 'dashboard', 'both'))
);
CREATE INDEX IF NOT EXISTS alert_configs_team_idx ON alert_configs (team_id);
CREATE INDEX IF NOT EXISTS alert_configs_user_idx ON alert_configs (user_id);
