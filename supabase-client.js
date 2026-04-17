const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL not found in .env file');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Supabase tables on first run
async function initializeTables() {
  try {
    console.log('📊 Supabase tables initialized');
    // Tables are created via Supabase migrations, skipping initialization checks

  } catch (error) {
    console.error('❌ Error initializing Supabase:', error.message);
  }
}

// Helper functions for CRUD operations
const db = {
  // Outreach messages
  async getOutreachMessages() {
    const { data, error } = await supabase
      .from('outreach_messages')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async addOutreachMessage(message) {
    const { data, error } = await supabase
      .from('outreach_messages')
      .insert([message])
      .select();
    return { data, error };
  },

  // Discovered leads
  async getDiscoveredLeads(date = null) {
    let query = supabase
      .from('discovered_leads')
      .select('*');

    if (date) {
      query = query.eq('discovered_date', date);
    }

    const { data, error } = await query.order('discovered_at', { ascending: false });
    return { data: data || [], error };
  },

  async addDiscoveredLeads(leads) {
    const { data, error } = await supabase
      .from('discovered_leads')
      .insert(leads)
      .select();
    return { data, error };
  },

  // Tracker
  async getTracker() {
    const { data, error } = await supabase
      .from('tracker')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    return { data: data ? data[0] : null, error };
  },

  async updateTracker(trackerData) {
    const { data, error } = await supabase
      .from('tracker')
      .insert([trackerData])
      .select();
    return { data, error };
  },

  // Outreach Approval
  async getApprovalStatus(week) {
    const { data, error } = await supabase
      .from('outreach_approval')
      .select('*')
      .eq('week', week)
      .order('created_at', { ascending: false })
      .limit(1);
    return { data: data ? data[0] : null, error };
  },

  async logApproval(approvalData) {
    const { data, error } = await supabase
      .from('outreach_approval')
      .insert([approvalData])
      .select();
    return { data, error };
  },

  async updateApprovalStatus(id, updates) {
    const { data, error } = await supabase
      .from('outreach_approval')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },
};

module.exports = {
  supabase,
  db,
  initializeTables,
};
