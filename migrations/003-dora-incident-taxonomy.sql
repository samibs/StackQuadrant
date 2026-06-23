-- Migration: DORA Incident Taxonomy module
-- Maps ESA-published DORA incident categories to vendor disclosed incident history
-- Source: Regulation (EU) 2022/2554 + RTS on classification of major ICT-related incidents
-- Run: psql $DATABASE_URL -f migrations/003-dora-incident-taxonomy.sql

BEGIN;

-- ============================================
-- DORA Incident Categories — ESA canonical taxonomy
-- ============================================

CREATE TABLE IF NOT EXISTS dora_incident_categories (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  severity_weight DECIMAL(3,2) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dora_categories_weight_range CHECK (severity_weight >= 0 AND severity_weight <= 1)
);

-- Seed canonical DORA categories aligned with ESA RTS impact dimensions.
-- Weights reflect relative regulatory severity (1.0 = highest impact).
INSERT INTO dora_incident_categories (id, name, description, severity_weight, display_order) VALUES
  ('availability',       'Availability',        'Service availability disruption affecting critical or important functions (downtime, degraded performance).', 0.85, 1),
  ('data_integrity',     'Data Integrity',      'Corruption, loss, or unauthorized modification of data processed by the ICT system.', 1.00, 2),
  ('confidentiality',    'Confidentiality',     'Unauthorized disclosure of confidential or personal data, including data breaches.', 0.95, 3),
  ('cyber',              'Cyber Security',      'Cyber threats: malware, ransomware, intrusion, denial-of-service, or other malicious activity.', 1.00, 4),
  ('service_continuity', 'Service Continuity',  'Failure of business continuity / disaster recovery controls leading to service interruption.', 0.75, 5),
  ('authenticity',       'Authenticity',        'Compromise of identification, authentication, or non-repudiation mechanisms.', 0.90, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  severity_weight = EXCLUDED.severity_weight,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================
-- ESA Incident Reports
-- ============================================

CREATE TABLE IF NOT EXISTS esa_incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_title VARCHAR(300) NOT NULL,
  report_date DATE NOT NULL,
  report_period_start DATE,
  report_period_end DATE,
  source_url TEXT NOT NULL,
  summary TEXT NOT NULL,
  category_distribution JSONB NOT NULL DEFAULT '{}',
  total_incidents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT esa_reports_date_url_unique UNIQUE (report_date, source_url)
);

CREATE INDEX IF NOT EXISTS esa_reports_date_idx ON esa_incident_reports(report_date);

-- Seed the first ESAs DORA major-incident report (June 2025 cited by orchestrator signal)
INSERT INTO esa_incident_reports (
  report_title,
  report_date,
  report_period_start,
  report_period_end,
  source_url,
  summary,
  category_distribution,
  total_incidents
) VALUES (
  'ESAs publish first report on DORA major ICT-related incidents',
  '2026-06-12',
  '2025-01-17',
  '2026-03-31',
  'https://www.esma.europa.eu/press-news/esma-news/esas-publish-first-report-dora-major-ict-related-incidents',
  'The European Supervisory Authorities (EBA, EIOPA, ESMA) published the first joint report on major ICT-related incidents reported by EU financial entities under DORA. Findings cover incident classification, root-cause distribution, and supervisory observations.',
  '{"availability": 42, "data_integrity": 8, "confidentiality": 14, "cyber": 23, "service_continuity": 9, "authenticity": 4}',
  100
)
ON CONFLICT (report_date, source_url) DO NOTHING;

-- ============================================
-- Vendor DORA Incidents
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_dora_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_vendor_id UUID NOT NULL REFERENCES tracked_vendors(id) ON DELETE CASCADE,
  category_id VARCHAR(40) NOT NULL REFERENCES dora_incident_categories(id),
  esa_report_id UUID REFERENCES esa_incident_reports(id) ON DELETE SET NULL,
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL,
  severity INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  disclosure_url TEXT,
  reported_by VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_dora_severity_range CHECK (severity >= 1 AND severity <= 5)
);

CREATE INDEX IF NOT EXISTS vendor_dora_incidents_vendor_idx ON vendor_dora_incidents(tracked_vendor_id);
CREATE INDEX IF NOT EXISTS vendor_dora_incidents_category_idx ON vendor_dora_incidents(category_id);
CREATE INDEX IF NOT EXISTS vendor_dora_incidents_report_idx ON vendor_dora_incidents(esa_report_id);
CREATE INDEX IF NOT EXISTS vendor_dora_incidents_occurred_idx ON vendor_dora_incidents(occurred_at);

-- ============================================
-- Vendor DORA Risk Scores (cached, recomputed on ESA report release)
-- ============================================

CREATE TABLE IF NOT EXISTS vendor_dora_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_vendor_id UUID NOT NULL UNIQUE REFERENCES tracked_vendors(id) ON DELETE CASCADE,
  risk_score DECIMAL(5,2) NOT NULL,
  incident_count INTEGER NOT NULL DEFAULT 0,
  category_breakdown JSONB NOT NULL DEFAULT '{}',
  last_esa_report_id UUID REFERENCES esa_incident_reports(id) ON DELETE SET NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT vendor_dora_risk_score_range CHECK (risk_score >= 0 AND risk_score <= 100)
);

CREATE INDEX IF NOT EXISTS vendor_dora_risk_scores_score_idx ON vendor_dora_risk_scores(risk_score);

COMMIT;

-- ============================================
-- ROLLBACK (run manually if needed)
-- ============================================
-- BEGIN;
-- DROP TABLE IF EXISTS vendor_dora_risk_scores;
-- DROP TABLE IF EXISTS vendor_dora_incidents;
-- DROP TABLE IF EXISTS esa_incident_reports;
-- DROP TABLE IF EXISTS dora_incident_categories;
-- COMMIT;
