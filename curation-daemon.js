#!/usr/bin/env node

/**
 * Content Curation Daemon
 * Runs 24/7, executes curation at 9am ET Mon-Fri
 * Logs all activity to /logs/curation-*.log
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { curate, getMonthlyReport } = require('./curation-skill');

// Setup logging
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;

  console.log(logEntry);

  // Append to daily log
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `curation-${dateStr}.log`);
  fs.appendFileSync(logFile, logEntry + '\n');
}

/**
 * Main daemon
 */
function startDaemon() {
  log('🚀 Content Curation Daemon starting...');
  log('   Schedule: Mon-Fri 9am ET (America/New_York timezone)');
  log('   Duration: 12 months (April 2026 - March 2027)');

  // Primary job: Curate at 9am ET Mon-Fri
  const curateJob = cron.schedule('0 9 * * 1-5', () => {
    log('▶️  CURATION TRIGGERED (9am ET)');
    curate();
  }, {
    timezone: 'America/New_York'
  });

  // Weekly report: Every Monday at 8am ET
  const reportJob = cron.schedule('0 8 * * 1', () => {
    log('▶️  WEEKLY REPORT (Monday 8am ET)');
    getMonthlyReport();
  }, {
    timezone: 'America/New_York'
  });

  // Healthcheck: Every hour
  const healthJob = cron.schedule('0 * * * *', () => {
    const now = new Date();
    log(`✓ Daemon alive — ${now.toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`);
  }, {
    timezone: 'America/New_York'
  });

  log('✅ Daemon active. Scheduled tasks:');
  log('   • Curation: Mon-Fri 9am ET');
  log('   • Weekly report: Monday 8am ET');
  log('   • Healthcheck: Every hour');
  log('\n📊 Monitor: tail -f logs/curation-*.log');
  log('🛑 Stop: Press Ctrl+C\n');

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('\n🛑 Daemon shutting down...');
    curateJob.stop();
    reportJob.stop();
    healthJob.stop();
    process.exit(0);
  });
}

/**
 * Health check endpoint (for monitoring)
 */
function startHealthServer() {
  const express = require('express');
  const app = express();

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'curation-daemon',
      timezone: 'America/New_York'
    });
  });

  const PORT = process.env.CURATION_HEALTH_PORT || 3003;
  app.listen(PORT, () => {
    log(`✓ Health endpoint available at http://localhost:${PORT}/health`);
  });
}

// Start
if (require.main === module) {
  try {
    startDaemon();

    // Only start health server if express is available
    try {
      startHealthServer();
    } catch (e) {
      log('⚠️  Health server skipped (express not available)');
    }

  } catch (error) {
    log(`❌ Daemon error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { startDaemon };
