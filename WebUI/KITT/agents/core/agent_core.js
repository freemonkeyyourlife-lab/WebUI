const EventEmitter = require('events');
const path = require('path');
const { spawn } = require('child_process');

// Simple in-process event bus and Agent Manager for K.I.T.T.
class AgentCore extends EventEmitter {
  constructor() {
    super();
    this.agents = {}; // id -> agent meta
  }

  registerAgent(agent) {
    const id = agent.id;
    this.agents[id] = Object.assign({ status: 'stopped', lastSeen: null }, agent);
  }

  listAgents() {
    return Object.values(this.agents);
  }

  getAgent(id) {
    return this.agents[id] || null;
  }

  startAgent(id) {
    const a = this.getAgent(id);
    if (!a) throw new Error('agent not found');
    if (a.status === 'running') return a;

    // spawn a worker process or run in-process stub
    if (a.exec && a.exec.enabled) {
      const scriptPath = path.resolve(__dirname, a.exec.script);
      const proc = spawn('node', [scriptPath], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
      a._proc = proc;
      a.status = 'running';
      a.lastSeen = new Date().toISOString();

      proc.stdout.on('data', (d) => this.emit('agent-log', { id, type: 'stdout', data: String(d) }));
      proc.stderr.on('data', (d) => this.emit('agent-log', { id, type: 'stderr', data: String(d) }));
      proc.on('close', (code) => {
        a.status = 'stopped';
        a.lastSeen = new Date().toISOString();
        this.emit('agent-stopped', { id, code });
      });
    } else {
      // in-process simulation: mark running and emit heartbeat
      a.status = 'running';
      a.lastSeen = new Date().toISOString();
      a._heartbeat = setInterval(() => {
        a.lastSeen = new Date().toISOString();
        this.emit('agent-heartbeat', { id, ts: a.lastSeen });
      }, a.heartbeat || 5000);
    }

    this.emit('agent-started', { id });
    return a;
  }

  stopAgent(id) {
    const a = this.getAgent(id);
    if (!a) throw new Error('agent not found');
    if (a._proc) {
      try { a._proc.kill(); } catch(e){}
      a._proc = null;
    }
    if (a._heartbeat) {
      clearInterval(a._heartbeat);
      a._heartbeat = null;
    }
    a.status = 'stopped';
    a.lastSeen = new Date().toISOString();
    this.emit('agent-stopped', { id });
    return a;
  }

  sendCommand(id, command, params) {
    const a = this.getAgent(id);
    if (!a) throw new Error('agent not found');
    // For in-process agents, emit event
    this.emit('agent-command', { id, command, params });
    // If process-based, we could write to stdin or use IPC; for now, log
    return { ok: true, id, command, params };
  }
}

// Export a singleton
const core = new AgentCore();

// Register default K.I.T.T. agent that acts as the speech/relay (talker)
core.registerAgent({
  id: 'kitt',
  role: 'talker',
  label: 'K.I.T.T. (Relay / Talker)',
  description: 'Speech relay and coordination agent',
  exec: { enabled: false, script: '../agents/worker_stub.js' },
  heartbeat: 4000
});

// Register example agents: observer, listener
core.registerAgent({
  id: 'observer',
  role: 'observer',
  label: 'Observer',
  description: 'Monitors map, files and events',
  exec: { enabled: false, script: '../agents/worker_stub.js' },
  heartbeat: 6000
});

core.registerAgent({
  id: 'listener',
  role: 'listener',
  label: 'Listener',
  description: 'Parses user prompts and events into tasks',
  exec: { enabled: false, script: '../agents/worker_stub.js' },
  heartbeat: 5000
});

module.exports = core;
