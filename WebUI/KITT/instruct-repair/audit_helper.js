const fs = require('fs');
const path = require('path');

const MI_DIR = path.join(__dirname, '..', 'mi');
const AUDIT_FILE = path.join(MI_DIR, 'audit.log');

function ensureAuditFile() {
  if (!fs.existsSync(MI_DIR)) {
    fs.mkdirSync(MI_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, '', 'utf8');
  }
}

/**
 * Append-only audit logger for local K.I.T.T. actions.
 * @param {Object} entry
 * @param {string} entry.action - Name of the action (e.g. 'agent_command', 'request_approve', 'consent_update')
 * @param {string} [entry.userId] - Associated user or 'system' / 'local'
 * @param {Object|string} [entry.details] - Action payload or context
 * @param {string} [entry.status] - 'success' | 'denied' | 'pending' | 'failed'
 */
function logAudit(entry = {}) {
  try {
    ensureAuditFile();
    const record = {
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      action: entry.action || 'unknown',
      userId: entry.userId || 'local',
      status: entry.status || 'success',
      details: entry.details !== undefined ? entry.details : null
    };
    fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(record)}\n`, 'utf8');
    return record;
  } catch (err) {
    console.error('Failed to append to audit log:', err.message);
    return null;
  }
}

/**
 * Read audit log entries, optionally filtered by userId.
 * @param {Object} [filter]
 * @param {string} [filter.userId]
 * @param {number} [filter.limit]
 */
function readAuditLog(filter = {}) {
  ensureAuditFile();
  try {
    const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const records = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });

    let filtered = records;
    if (filter.userId) {
      filtered = filtered.filter((r) => r.userId === filter.userId);
    }
    if (filter.action) {
      filtered = filtered.filter((r) => r.action === filter.action);
    }
    if (filter.limit && filter.limit > 0) {
      filtered = filtered.slice(-filter.limit);
    }
    return filtered;
  } catch (err) {
    console.error('Failed to read audit log:', err.message);
    return [];
  }
}

function logAction(action, userId, details, status = 'success') {
  return logAudit({ action, userId, details, status });
}

function getRecentLogs(limit = 100, filterType = null) {
  return readAuditLog({ limit, action: filterType });
}

module.exports = {
  logAudit,
  logAction,
  readAuditLog,
  getRecentLogs,
  AUDIT_FILE
};
