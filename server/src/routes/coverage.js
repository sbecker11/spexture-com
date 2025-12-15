const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Coverage Report Routes
 * Serves markdown coverage reports for client and server tests
 */

// History file paths
const HISTORY_DIR = path.join(__dirname, '../../../coverage-reports');
const CLIENT_HISTORY_PATH = path.join(HISTORY_DIR, 'client-history.json');
const SERVER_HISTORY_PATH = path.join(HISTORY_DIR, 'server-history.json');

// Ensure history directory exists
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

/**
 * Load history from file
 */
function loadHistory(historyPath) {
  try {
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
  return [];
}

/**
 * Save history to file (keep last 10 entries)
 */
function saveHistory(historyPath, entry) {
  try {
    const history = loadHistory(historyPath);
    history.unshift(entry); // Add to beginning
    const trimmedHistory = history.slice(0, 10); // Keep only last 10
    fs.writeFileSync(historyPath, JSON.stringify(trimmedHistory, null, 2));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Parse test output to extract stats
 */
function parseTestOutput(output) {
  const stats = {
    tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
    suites: { total: 0, passed: 0, failed: 0 }
  };

  // Parse Jest output
  const testMatch = output.match(/Tests:\s+(?:(\d+) failed,?\s*)?(?:(\d+) skipped,?\s*)?(\d+) passed,?\s*(\d+) total/);
  if (testMatch) {
    stats.tests.failed = parseInt(testMatch[1] || 0);
    stats.tests.skipped = parseInt(testMatch[2] || 0);
    stats.tests.passed = parseInt(testMatch[3] || 0);
    stats.tests.total = parseInt(testMatch[4] || 0);
  }

  const suiteMatch = output.match(/Test Suites:\s+(?:(\d+) failed,?\s*)?(\d+) passed,?\s*(\d+) total/);
  if (suiteMatch) {
    stats.suites.failed = parseInt(suiteMatch[1] || 0);
    stats.suites.passed = parseInt(suiteMatch[2] || 0);
    stats.suites.total = parseInt(suiteMatch[3] || 0);
  }

  return stats;
}

// Get client coverage report
router.get('/client', (req, res) => {
  const reportPath = path.join(__dirname, '../../../coverage-reports/client-coverage.md');

  try {
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        error: 'Client coverage report not found',
        message: 'Please run tests with coverage first: npm run test:coverage'
      });
    }

    const markdown = fs.readFileSync(reportPath, 'utf8');
    const stats = fs.statSync(reportPath);

    res.json({
      markdown,
      lastModified: stats.mtime,
      size: stats.size
    });
  } catch (error) {
    console.error('Error reading client coverage report:', error);
    res.status(500).json({ error: 'Failed to read coverage report' });
  }
});

// Get server coverage report
router.get('/server', (req, res) => {
  const reportPath = path.join(__dirname, '../../../coverage-reports/server-coverage.md');

  try {
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        error: 'Server coverage report not found',
        message: 'Please run server tests with coverage first: cd server && npm test -- --coverage'
      });
    }

    const markdown = fs.readFileSync(reportPath, 'utf8');
    const stats = fs.statSync(reportPath);

    res.json({
      markdown,
      lastModified: stats.mtime,
      size: stats.size
    });
  } catch (error) {
    console.error('Error reading server coverage report:', error);
    res.status(500).json({ error: 'Failed to read coverage report' });
  }
});

// Get both reports
router.get('/all', (req, res) => {
  const clientPath = path.join(__dirname, '../../../coverage-reports/client-coverage.md');
  const serverPath = path.join(__dirname, '../../../coverage-reports/server-coverage.md');

  const result = {
    client: null,
    server: null
  };

  try {
    if (fs.existsSync(clientPath)) {
      const markdown = fs.readFileSync(clientPath, 'utf8');
      const stats = fs.statSync(clientPath);
      result.client = {
        markdown,
        lastModified: stats.mtime,
        size: stats.size
      };
    }

    if (fs.existsSync(serverPath)) {
      const markdown = fs.readFileSync(serverPath, 'utf8');
      const stats = fs.statSync(serverPath);
      result.server = {
        markdown,
        lastModified: stats.mtime,
        size: stats.size
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error reading coverage reports:', error);
    res.status(500).json({ error: 'Failed to read coverage reports' });
  }
});

// Get coverage history
router.get('/history', (req, res) => {
  try {
    const clientHistory = loadHistory(CLIENT_HISTORY_PATH);
    const serverHistory = loadHistory(SERVER_HISTORY_PATH);

    res.json({
      client: clientHistory,
      server: serverHistory
    });
  } catch (error) {
    console.error('Error reading coverage history:', error);
    res.status(500).json({ error: 'Failed to read coverage history' });
  }
});

// Regenerate client coverage report
router.post('/regenerate/client', async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('Regenerating client coverage report...');

    // Run the client tests with coverage
    const { stdout, stderr } = await execPromise('npm run test:coverage', {
      cwd: path.join(__dirname, '../../..'),
      timeout: 300000 // 5 minute timeout
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000); // seconds

    console.log('Client coverage regenerated:', stdout);
    if (stderr) console.error('Stderr:', stderr);

    // Parse test output for stats
    const stats = parseTestOutput(stderr || stdout);

    // Save to history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      duration,
      stats,
      success: true
    };
    saveHistory(CLIENT_HISTORY_PATH, historyEntry);

    res.json({
      success: true,
      message: 'Client coverage report regenerated successfully',
      duration,
      stats
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.error('Error regenerating client coverage:', error);

    // Save failed attempt to history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      duration,
      success: false,
      error: error.message
    };
    saveHistory(CLIENT_HISTORY_PATH, historyEntry);

    res.status(500).json({
      error: 'Failed to regenerate client coverage report',
      details: error.message
    });
  }
});

// Regenerate server coverage report
router.post('/regenerate/server', async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('Regenerating server coverage report...');

    // Run the server tests with coverage
    const { stdout, stderr } = await execPromise('npm run test:coverage', {
      cwd: path.join(__dirname, '../../'),
      timeout: 300000 // 5 minute timeout
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000); // seconds

    console.log('Server coverage regenerated:', stdout);
    if (stderr) console.error('Stderr:', stderr);

    // Parse test output for stats
    const stats = parseTestOutput(stderr || stdout);

    // Save to history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      duration,
      stats,
      success: true
    };
    saveHistory(SERVER_HISTORY_PATH, historyEntry);

    res.json({
      success: true,
      message: 'Server coverage report regenerated successfully',
      duration,
      stats
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.error('Error regenerating server coverage:', error);

    // Save failed attempt to history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      duration,
      success: false,
      error: error.message
    };
    saveHistory(SERVER_HISTORY_PATH, historyEntry);

    res.status(500).json({
      error: 'Failed to regenerate server coverage report',
      details: error.message
    });
  }
});

// Serve HTML coverage reports
router.get('/html/:type', (req, res) => {
  const type = req.params.type; // 'client' or 'server'

  if (type !== 'client' && type !== 'server') {
    return res.status(400).json({ error: 'Invalid type. Must be "client" or "server"' });
  }

  const htmlPath = path.join(__dirname, `../../../coverage-reports/${type}-coverage.html`);

  if (!fs.existsSync(htmlPath)) {
    return res.status(404).json({
      error: `${type.charAt(0).toUpperCase() + type.slice(1)} coverage HTML report not found`,
      hint: `Run coverage tests first: ${type === 'client' ? 'npm run test:coverage' : 'cd server && npm run test:coverage'}`
    });
  }

  res.sendFile(htmlPath);
});

// Open terminal and run coverage script
router.post('/run/:type', async (req, res) => {
  const type = req.params.type; // 'client' or 'server'

  if (type !== 'client' && type !== 'server') {
    return res.status(400).json({ error: 'Invalid type. Must be "client" or "server"' });
  }

  const scriptPath = path.join(__dirname, `../../../scripts/run-${type}-coverage.sh`);

  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({
      error: `Coverage script not found: ${scriptPath}`
    });
  }

  try {
    // Open a new terminal window with the script
    const { exec } = require('child_process');
    exec(`open -a Terminal "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error opening terminal:', error);
      }
    });

    res.json({
      success: true,
      message: `Opening new terminal to run ${type} coverage tests...`,
      script: scriptPath
    });
  } catch (error) {
    console.error('Error triggering coverage script:', error);
    res.status(500).json({
      error: 'Failed to open terminal',
      details: error.message
    });
  }
});

module.exports = router;
