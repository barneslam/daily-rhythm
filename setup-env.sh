#!/bin/bash
# Create .env file with Netlify credentials
cat > .env << 'EOF'
SUPABASE_URL=https://qiwdgyilhwkndqkgqruf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpd2RneWlsaHdrbmRxa2dxcnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTc4NDcsImV4cCI6MjA5MTY3Mzg0N30.bEhiitzcDMOpViFFtBhfbUKcHVDah8t7DvsNlTxaOEk
EOF
echo "✅ .env file created"
