/**
 * Migration runner for Supabase
 * Applies supabase-init.sql to create linkedin_dms table
 */

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;

// Extract project ID from Supabase URL (format: https://[project-id].supabase.co)
const projectIdMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
if (!projectIdMatch) {
  console.error('❌ Could not extract Supabase project ID from URL:', supabaseUrl);
  process.exit(1);
}

const projectId = projectIdMatch[1];
console.log(`📊 Supabase Project ID: ${projectId}`);

const fs = require('fs');

// Read the SQL migration file
const sqlPath = './supabase-init.sql';
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// For now, just display the SQL that would be run
console.log(`\n📝 SQL Migration Content:\n`);
console.log(sqlContent);
console.log(`\n⚠️  Note: To apply this migration, run it in the Supabase SQL Editor:`);
console.log(`   https://supabase.com/dashboard/project/${projectId}/sql/new`);
console.log(`\n   Or use the Supabase CLI: supabase db push`);
