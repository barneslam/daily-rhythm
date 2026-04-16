-- GTM Engine — Supabase Schema
-- Run this in Supabase SQL Editor to create all required tables
-- Dashboard: netlify/gtm-dashboard.html

-- ─────────────────────────────────────────────
-- 1. gtm_targets  (your lead/prospect pipeline)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gtm_targets (
  id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name            TEXT NOT NULL,
  business        TEXT,
  linkedin_url    TEXT,
  source          TEXT,
  platform        TEXT,
  qualified       BOOLEAN DEFAULT FALSE,
  revenue_fit     TEXT,
  role_fit        TEXT,
  industry_fit    TEXT,
  signal          TEXT,
  qual_reason     TEXT,
  priority        INT DEFAULT 50,       -- 80-95 HIGH, 60-79 GOOD, 40-59 WEAK
  status          TEXT DEFAULT 'identified',
    -- identified | connection_req | connected | messaged
    -- responded | call_booked | call_completed
    -- proposal_sent | closed_won | cold | disqualified
  connection_note TEXT,                 -- Copy for LinkedIn connection request
  draft_message   TEXT,                 -- Full outreach message body
  needs_regen     BOOLEAN DEFAULT FALSE, -- Flagged for message rewrite
  date_found      DATE,
  date_messaged   DATE,
  follow_ups      INT DEFAULT 0,
  response        TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtm_targets_status   ON gtm_targets(status);
CREATE INDEX IF NOT EXISTS idx_gtm_targets_priority ON gtm_targets(priority DESC);
CREATE INDEX IF NOT EXISTS idx_gtm_targets_needs_regen ON gtm_targets(needs_regen) WHERE needs_regen = TRUE;

-- ─────────────────────────────────────────────
-- 2. gtm_drafts  (outreach & content drafts)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gtm_drafts (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  status      TEXT DEFAULT 'pending',  -- pending | approved | skipped
  draft_type  TEXT,                    -- outreach | content | follow_up
  draft_date  DATE DEFAULT CURRENT_DATE,
  channel     TEXT,                    -- email | linkedin | twitter
  title       TEXT,
  content     TEXT,
  target_id   BIGINT REFERENCES gtm_targets(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtm_drafts_status ON gtm_drafts(status);
CREATE INDEX IF NOT EXISTS idx_gtm_drafts_date   ON gtm_drafts(draft_date DESC);

-- ─────────────────────────────────────────────
-- 3. gtm_config  (week number + weekly targets)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gtm_config (
  id              BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  week            INT DEFAULT 1,
  weekly_targets  JSONB DEFAULT '{
    "messages_sent": 20,
    "responses": "3-5",
    "calls_booked": 2,
    "revenue": 0
  }'::jsonb,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Seed with Week 1 config if empty
INSERT INTO gtm_config (week, weekly_targets)
SELECT 1, '{"messages_sent":20,"responses":"3-5","calls_booked":2,"revenue":0}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM gtm_config LIMIT 1);

-- ─────────────────────────────────────────────
-- 4. gtm_tracker  (daily activity log)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gtm_tracker (
  id                  BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  track_date          DATE UNIQUE DEFAULT CURRENT_DATE,
  messages_sent       INT DEFAULT 0,
  responses_received  INT DEFAULT 0,
  calls_booked        INT DEFAULT 0,
  revenue             NUMERIC(10,2) DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtm_tracker_date ON gtm_tracker(track_date DESC);

-- ─────────────────────────────────────────────
-- 5. gtm_daily_logs  (full daily log text)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gtm_daily_logs (
  id        BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  log_date  DATE UNIQUE DEFAULT CURRENT_DATE,
  content   TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gtm_daily_logs_date ON gtm_daily_logs(log_date DESC);
