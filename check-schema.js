require('dotenv').config();

const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("📋 Checking outreach_messages table schema...\n");
  
  try {
    // Try to select from the table to trigger schema cache refresh
    const { data, error } = await supabase
      .from("outreach_messages")
      .select("*")
      .limit(0);
    
    if (error) {
      console.error("❌ Error querying table:", error.message);
      console.error("Full error:", error);
    } else {
      console.log("✓ Table exists and is queryable");
      console.log("Schema columns should be available");
    }
  } catch (e) {
    console.error("Exception:", e.message);
  }
}

checkSchema();
