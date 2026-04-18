#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const { runDiscovery } = require('./lead-discovery');
const { db, supabase } = require('./supabase-client');

const PORT = process.env.PORT || 3001;
const BASE_DIR = __dirname;

// Helper to read JSON files
function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return {};
  }
}

// Helper to read markdown files
function readFile(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8');
  } catch (e) {
    return '';
  }
}

const routes = {
  '/api/today': () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = now.toISOString().split('T')[0];
    return {
      day: days[now.getDay()],
      date: date,
    };
  },

  '/api/config': () => readJSON(path.join(BASE_DIR, 'config.json')),

  '/api/tracker': () => readJSON(path.join(BASE_DIR, 'tracker.json')),

  '/api/targets': async () => {
    try {
      const { data: targets, error } = await supabase
        .from('gtm_targets')
        .select('*')
        .order('date_found', { ascending: false });

      if (error) {
        console.error('Error fetching targets:', error);
        return { targets: [] };
      }

      // Transform database fields to match dashboard expectations
      const formattedTargets = (targets || []).map(target => ({
        id: target.id,
        name: target.name,
        business: target.business,
        signal: target.signal,
        channel: target.outreach_channel,
        status: target.status || 'identified',
        confidence: target.confidence || 'MEDIUM',
        linkedin_url: target.linkedin_url,
        qualified: target.qualified
      }));

      return { targets: formattedTargets };
    } catch (e) {
      console.error('Targets API error:', e.message);
      return { targets: [] };
    }
  },

  '/api/drafts': () => {
    const drafts = [];
    const assetsDir = path.join(BASE_DIR, 'assets');

    if (fs.existsSync(assetsDir)) {
      fs.readdirSync(assetsDir).forEach(file => {
        if (file.endsWith('.md')) {
          // Mark outreach messages as pending
          const status = file.includes('outreach') ? 'pending' : 'approved';
          drafts.push({
            filename: file,
            status: status,
            content: readFile(path.join(assetsDir, file)).substring(0, 500),
          });
        }
      });
    }

    return drafts;
  },

  '/api/logs': () => {
    const logsDir = path.join(BASE_DIR, 'logs');
    if (!fs.existsSync(logsDir)) return [];
    return fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .reverse();
  },

  '/api/offer-doc': () => {
    return {
      content: readFile(path.join(BASE_DIR, 'assets/offer-doc.md')),
    };
  },

  '/api/program': () => readJSON(path.join(BASE_DIR, 'program-8week.json')),

  '/api/outreach': async () => {
    try {
      const { data: outreachData, error } = await db.getOutreachMessages();
      if (error) {
        console.error('Error fetching outreach messages:', error);
        return { outreach: [] };
      }
      return { outreach: outreachData || [] };
    } catch (e) {
      console.error('Outreach API error:', e.message);
      return { outreach: [] };
    }
  },

  '/api/dm-outreach': async () => {
    try {
      const { data, error } = await supabase
        .from('dm_outreach')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching dm_outreach:', error);
        return { dmOutreach: [], error: error.message };
      }
      return { dmOutreach: data || [] };
    } catch (e) {
      console.error('DM Outreach API error:', e.message);
      return { dmOutreach: [], error: e.message };
    }
  },

  '/api/send-dm-response': async (body) => {
    try {
      const { handler } = require('./functions/send-dm-response');
      const mockEvent = {
        httpMethod: 'POST',
        body: JSON.stringify(body)
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('Send DM response error:', e.message);
      return { error: e.message };
    }
  },

  '/api/content': async () => {
    try {
      const { data: drafts, error } = await supabase
        .from('content_drafts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !drafts || drafts.length === 0) {
        return {
          content: [
            {
              id: 1,
              business: 'TechCorp Series B',
              trigger: 'funding_event',
              signal: 'Series B Funding',
              linkedin_draft: '🚀 TechCorp Series B = GTM refresh incoming 🔥',
              instagram_draft: '🚀 TechCorp Series B = GTM refresh 🔥',
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ],
          status_counts: { pending: 1, approved: 0, published: 0 },
          total_count: 1
        };
      }

      const statusCounts = {
        pending: drafts.filter(d => d.status === 'pending').length,
        approved: drafts.filter(d => d.status === 'approved').length,
        published: drafts.filter(d => d.status === 'published').length
      };

      return {
        content: drafts,
        status_counts: statusCounts,
        total_count: drafts.length
      };
    } catch (e) {
      console.error('Content API error:', e.message);
      return {
        content: [],
        status_counts: { pending: 0, approved: 0, published: 0 },
        total_count: 0,
        error: e.message
      };
    }
  },

  '/api/inbound': async () => {
    try {
      const { data: messages, error } = await supabase
        .from('inbound_messages')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50);

      if (error || !messages || messages.length === 0) {
        return {
          messages: [
            {
              id: 1,
              channel: 'email',
              sender_name: 'Jennifer Martinez',
              sender_email: 'jen@acmecorp.com',
              sender_title: 'CRO',
              sender_company: 'ACME Corp',
              message_text: 'Hi, we\'re looking to improve our go-to-market strategy...',
              auto_qualified: true,
              qualification_score: 88,
              lead_status: 'new',
              received_at: new Date().toISOString()
            }
          ],
          qualification_metrics: { total: 1, qualified: 1, percentQualified: 100, avgScore: 88 },
          status_metrics: { new: 1, contacted: 0, responded: 0, qualified: 0, booked: 0 },
          channel_metrics: { email: 1 }
        };
      }

      const qualified = messages.filter(m => m.auto_qualified).length;
      const statusMetrics = {
        new: messages.filter(m => m.lead_status === 'new').length,
        contacted: messages.filter(m => m.lead_status === 'contacted').length,
        responded: messages.filter(m => m.lead_status === 'responded').length,
        qualified: messages.filter(m => m.lead_status === 'qualified').length,
        booked: messages.filter(m => m.lead_status === 'booked').length
      };

      const channelMetrics = {};
      messages.forEach(m => {
        channelMetrics[m.channel] = (channelMetrics[m.channel] || 0) + 1;
      });

      return {
        messages,
        qualification_metrics: {
          total: messages.length,
          qualified,
          notQualified: messages.length - qualified,
          percentQualified: (qualified / messages.length) * 100,
          avgScore: messages.reduce((sum, m) => sum + (m.qualification_score || 0), 0) / messages.length
        },
        status_metrics: statusMetrics,
        channel_metrics: channelMetrics
      };
    } catch (e) {
      console.error('Inbound API error:', e.message);
      return {
        messages: [],
        qualification_metrics: { total: 0, qualified: 0, percentQualified: 0, avgScore: 0 },
        status_metrics: { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0 },
        channel_metrics: {},
        error: e.message
      };
    }
  },

  '/api/discovered-leads': async () => {
    try {
      const { data: leads, error } = await db.getDiscoveredLeads();
      if (error) {
        console.error('Error fetching discovered leads:', error);
        return { leads: [], count: 0, lastDiscoveryDate: null };
      }

      // Get the most recent discovery date
      const lastDiscoveryDate = leads && leads.length > 0
        ? leads[0].discovered_date
        : null;

      return {
        leads: leads || [],
        count: leads?.length || 0,
        lastDiscoveryDate
      };
    } catch (e) {
      console.error('Discovered leads API error:', e.message);
      return { leads: [], count: 0, lastDiscoveryDate: null };
    }
  },

  '/api/approval-status': async (body) => {
    try {
      const week = body?.week || 1;
      const { data, error } = await db.getApprovalStatus(week);
      if (error) {
        console.error('Error fetching approval status:', error);
        return { status: 'pending', error: error.message };
      }
      return { status: data?.status || 'pending', data };
    } catch (e) {
      console.error('Approval status API error:', e.message);
      return { status: 'pending', error: e.message };
    }
  },

  '/api/dms': async () => {
    try {
      const { handler } = require('./functions/dms');
      const mockEvent = {
        httpMethod: 'GET',
        queryStringParameters: { limit: '50', days: '7', status: 'all' }
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('DMs API error:', e.message);
      return { error: e.message };
    }
  },

  '/api/linkedin-webhook-handler': async (body) => {
    // This will be called via POST handler below
    try {
      const { handler } = require('./functions/linkedin-webhook');
      const mockEvent = {
        httpMethod: 'POST',
        body: JSON.stringify(body),
        headers: { 'x-blotato-signature': 'test-signature' }
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('LinkedIn webhook error:', e.message);
      return { error: e.message };
    }
  },

  '/api/test-dm-pipeline': async () => {
    try {
      const { handler } = require('./functions/test-dm-pipeline');
      const mockEvent = {
        httpMethod: 'POST',
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('Test DM pipeline error:', e.message);
      return { error: e.message };
    }
  },

  '/api/blotato-dm-poller': async () => {
    try {
      const { handler } = require('./functions/blotato-dm-poller');
      const mockEvent = {
        httpMethod: 'POST',
      };
      const response = await handler(mockEvent);
      return JSON.parse(response.body);
    } catch (e) {
      console.error('Blotato DM poller error:', e.message);
      return { error: e.message };
    }
  },

  '/api/lead/update-status': async (body) => {
    try {
      const { leadId, status } = body;
      const { error } = await supabase
        .from('gtm_targets')
        .update({ status })
        .eq('id', leadId);

      if (error) {
        return { error: error.message };
      }
      return { success: true };
    } catch (e) {
      console.error('Lead status update error:', e.message);
      return { error: e.message };
    }
  },

  '/api/test-full-pipeline': async () => {
    try {
      console.log('🧪 Running full pipeline test...');

      // Step 1: Get top 20 leads
      const { data: topLeads } = await supabase
        .from('gtm_targets')
        .select('id, name, business, signal')
        .eq('status', 'connection_req')
        .limit(20);

      if (!topLeads || topLeads.length === 0) {
        return { error: 'No leads found for content generation' };
      }

      let createdCount = 0;
      const draftIds = [];

      // Step 2: Generate content
      for (const lead of topLeads) {
        const linkedinDraft = `🚀 ${lead.name} at ${lead.business.split(',')[0]} - ${lead.signal}. Expert on GTM scaling & revenue acceleration. Open to strategic conversations.`;
        const instagramDraft = `Meet ${lead.name}: ${lead.signal}. Leading GTM at scale. 📈`;

        const { data: draft } = await supabase
          .from('content_drafts')
          .insert({
            business: lead.business,
            trigger: lead.signal,
            signal: lead.signal,
            linkedin_draft: linkedinDraft,
            instagram_draft: instagramDraft,
            status: 'pending',
            created_at: new Date().toISOString(),
            scheduled_for: new Date(Date.now() + 24 * 3600000).toISOString()
          })
          .select('id')
          .single();

        if (draft) {
          createdCount++;
          draftIds.push(draft.id);
        }
      }

      // Step 3: Auto-approve all drafts
      let approvedCount = 0;
      for (const draftId of draftIds) {
        const { error } = await supabase
          .from('content_drafts')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', draftId);
        if (!error) approvedCount++;
      }

      // Step 4: Mark as published (mock Blotato)
      let publishedCount = 0;
      for (const draftId of draftIds) {
        const { error } = await supabase
          .from('content_drafts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            published_to: 'linkedin,instagram',
            blotato_post_id: `test_${Date.now()}`
          })
          .eq('id', draftId);
        if (!error) publishedCount++;
      }

      return {
        status: 'success',
        message: 'Full pipeline test completed',
        generated: createdCount,
        approved: approvedCount,
        published: publishedCount,
        leadsSampled: topLeads.length,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      console.error('Pipeline test error:', e.message);
      return { error: e.message };
    }
  },
};

// Serve log file
function serveLog(date, callback) {
  const logPath = path.join(BASE_DIR, 'logs', `${date}.md`);
  const content = readFile(logPath);
  callback({
    date,
    content: content || `No log found for ${date}`,
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse POST body
  let body = '';
  if (req.method === 'POST') {
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};
        await handleRequest(req, res, parsedBody);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Handle GET requests
  await handleRequest(req, res, {});
});

async function handleRequest(req, res, body) {
  // Handle /api/log/:date
  if (req.url.startsWith('/api/log/')) {
    const date = req.url.replace('/api/log/', '');
    serveLog(date, (data) => {
      res.writeHead(200);
      res.end(JSON.stringify(data));
    });
    return;
  }

  // Handle /api/linkedin-webhook (POST)
  if (req.url === '/api/linkedin-webhook' && req.method === 'POST') {
    try {
      const result = await routes['/api/linkedin-webhook-handler'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('LinkedIn webhook error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/send-dm-response (POST)
  if (req.url === '/api/send-dm-response' && req.method === 'POST') {
    try {
      const result = await routes['/api/send-dm-response'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('Send DM response error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/approval/log (POST)
  if (req.url === '/api/approval/log' && req.method === 'POST') {
    try {
      const { week, approved_by, checklist_items, message_count, notes } = body;
      const approvalData = {
        week: week || 1,
        approval_date: new Date().toISOString().split('T')[0],
        approved_at: new Date().toISOString(),
        status: 'approved',
        approved_by: approved_by || 'user',
        checklist_completed: checklist_items || 7,
        checklist_items: 7,
        message_count: message_count || 7,
        approval_notes: notes || '',
        batch_id: `week-${week}-${Date.now()}`,
      };

      const { data, error } = await db.logApproval(approvalData);
      if (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data }));
    } catch (e) {
      console.error('Approval logging error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle /api/lead/update-status (POST)
  if (req.url === '/api/lead/update-status' && req.method === 'POST') {
    try {
      const result = await routes['/api/lead/update-status'](body);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (e) {
      console.error('Lead status update error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Handle other API routes
  const basePath = req.url.split('?')[0];
  if (routes[basePath]) {
    try {
      const data = await routes[basePath]();
      res.writeHead(200);
      res.end(JSON.stringify(data));
    } catch (e) {
      console.error('Route error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  // Serve dashboard.html for root
  if (req.url === '/' || req.url === '/dashboard.html') {
    const dashContent = readFile(path.join(BASE_DIR, 'dashboard.html'));
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(dashContent);
    return;
  }

  // Serve approval dashboard
  if (req.url === '/approval' || req.url === '/approval.html') {
    const approvalContent = readFile(path.join(BASE_DIR, 'approval-dashboard.html'));
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(approvalContent);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Schedule daily lead discovery at 7am
const discoverySchedule = cron.schedule('0 7 * * *', async () => {
  console.log('\n🔔 [7am] Running scheduled lead discovery...');
  try {
    await runDiscovery();
  } catch (e) {
    console.error('Lead discovery error:', e.message);
  }
});

// Also run discovery on startup (in case server restarts after 7am)
(async () => {
  const now = new Date();
  if (now.getHours() >= 7) {
    console.log('⏰ Server started after 7am - running discovery now');
    try {
      await runDiscovery();
    } catch (e) {
      console.error('Lead discovery error:', e.message);
    }
  }
})();

server.listen(PORT, () => {
  console.log(`\n✓ GTM Engine Dashboard running on http://localhost:${PORT}\n`);
  console.log('📊 Lead Discovery: Scheduled daily at 7:00 AM');
  console.log('Open in browser: http://localhost:3001');
  console.log('Press Ctrl+C to stop\n');
});
