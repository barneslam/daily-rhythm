const express = require('express');
const fs = require('fs');
const path = require('path');
const { startContentScheduler } = require('./content-scheduler');

const app = express();
const DEFAULT_PORT = 3001;

function findAvailablePort(startPort) {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(findAvailablePort(startPort + 1)));
    server.once('listening', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.listen(startPort);
  });
}
const BASE = '/Users/b.lamoutlook.com/daily-rhythm';

app.use(express.json());

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(BASE, 'dashboard.html'));
});

// API: Get today's date
app.get('/api/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.json({ date: today, day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) });
});

// API: Get config
app.get('/api/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(BASE, 'config.json'), 'utf8'));
    res.json(config);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get 8-week program
app.get('/api/program', (req, res) => {
  try {
    const program = JSON.parse(fs.readFileSync(path.join(BASE, 'program-8week.json'), 'utf8'));
    res.json(program);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get tracker
app.get('/api/tracker', (req, res) => {
  try {
    const tracker = JSON.parse(fs.readFileSync(path.join(BASE, 'tracker.json'), 'utf8'));
    res.json(tracker);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get targets
app.get('/api/targets', (req, res) => {
  try {
    const targets = JSON.parse(fs.readFileSync(path.join(BASE, 'target-list.json'), 'utf8'));
    res.json(targets);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Update target status
app.post('/api/targets/:id/status', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(BASE, 'target-list.json'), 'utf8'));
    const target = data.targets.find(t => t.id === parseInt(req.params.id));
    if (!target) return res.status(404).json({ error: 'Target not found' });
    Object.assign(target, req.body);
    data.last_updated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(path.join(BASE, 'target-list.json'), JSON.stringify(data, null, 2));
    res.json(target);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: List drafts
app.get('/api/drafts', (req, res) => {
  try {
    const draftsDir = path.join(BASE, 'drafts');
    console.log('[/api/drafts] BASE =', BASE);
    console.log('[/api/drafts] draftsDir =', draftsDir);
    console.log('[/api/drafts] EXISTS =', fs.existsSync(draftsDir));
    if (!fs.existsSync(draftsDir)) {
      console.log('[/api/drafts] Directory does not exist, returning []');
      return res.json([]);
    }
    const files = fs.readdirSync(draftsDir).filter(f => f.endsWith('.md')).sort().reverse();
    console.log('[/api/drafts] FILES:', files);
    const drafts = files.map(f => ({
      filename: f,
      content: fs.readFileSync(path.join(draftsDir, f), 'utf8'),
      status: fs.readFileSync(path.join(draftsDir, f), 'utf8').includes('PENDING') ? 'pending' : 'approved'
    }));
    console.log('[/api/drafts] RESPONSE count:', drafts.length);
    res.json(drafts);
  } catch (e) {
    console.error('[/api/drafts] ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// API: Approve a draft
app.post('/api/drafts/:filename/approve', (req, res) => {
  try {
    const filePath = path.join(BASE, 'drafts', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Draft not found' });
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace('PENDING APPROVAL', 'APPROVED');
    content = content.replace(/☐ Approve/g, '☑ Approved');
    fs.writeFileSync(filePath, content);
    res.json({ status: 'approved', filename: req.params.filename });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get daily log
app.get('/api/log/:date', (req, res) => {
  try {
    const logPath = path.join(BASE, 'logs', `${req.params.date}.md`);
    if (!fs.existsSync(logPath)) return res.json({ content: 'No log for this date.' });
    res.json({ content: fs.readFileSync(logPath, 'utf8') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: List all logs
app.get('/api/logs', (req, res) => {
  try {
    const logsDir = path.join(BASE, 'logs');
    if (!fs.existsSync(logsDir)) return res.json([]);
    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.md')).sort().reverse();
    res.json(files.map(f => f.replace('.md', '')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get published content
app.get('/api/content', (req, res) => {
  try {
    const contentDir = path.join(BASE, 'content');
    if (!fs.existsSync(contentDir)) return res.json([]);
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md')).sort().reverse();
    const content = files.map(f => ({
      filename: f,
      content: fs.readFileSync(path.join(contentDir, f), 'utf8')
    }));
    res.json(content);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get offer doc
app.get('/api/offer-doc', (req, res) => {
  try {
    const offerPath = path.join(BASE, 'assets', 'offer-doc.md');
    if (!fs.existsSync(offerPath)) return res.json({ content: 'Not created yet.' });
    res.json({ content: fs.readFileSync(offerPath, 'utf8') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

findAvailablePort(DEFAULT_PORT).then((PORT) => {
  app.listen(PORT, () => {
    console.log(`GTM Content Scheduler running at http://localhost:${PORT}`);

    // Start content scheduler
    startContentScheduler();
  });
});
