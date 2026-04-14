-- Daily Rhythm GTM Engine Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/new

-- 1. Outreach Messages Table
CREATE TABLE IF NOT EXISTS outreach_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  business TEXT NOT NULL,
  signal TEXT,
  channel TEXT,
  subject TEXT,
  body TEXT,
  full_body TEXT,
  send_date DATE,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Discovered Leads Table
CREATE TABLE IF NOT EXISTS discovered_leads (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  batch TEXT,
  revenue TEXT,
  funding_stage TEXT,
  trigger TEXT,
  linkedin_url TEXT,
  confidence TEXT,
  status TEXT DEFAULT 'discovered',
  requires_connection_first BOOLEAN DEFAULT TRUE,
  next_action TEXT,
  discovered_date DATE,
  discovered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tracker Table
CREATE TABLE IF NOT EXISTS tracker (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  current_week INT,
  start_date DATE,
  day_of_week TEXT,
  blocks_completed TEXT[],
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_messages(status);
CREATE INDEX IF NOT EXISTS idx_outreach_date ON outreach_messages(send_date);
CREATE INDEX IF NOT EXISTS idx_leads_discovered_date ON discovered_leads(discovered_date);
CREATE INDEX IF NOT EXISTS idx_leads_status ON discovered_leads(status);
CREATE INDEX IF NOT EXISTS idx_tracker_created ON tracker(created_at);
