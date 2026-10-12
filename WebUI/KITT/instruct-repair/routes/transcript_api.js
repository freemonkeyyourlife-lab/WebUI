'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const TRANS_DIR = path.join(__dirname, '..', '..', 'mi', 'transcripts');
if (!fs.existsSync(TRANS_DIR)) fs.mkdirSync(TRANS_DIR, { recursive: true });

// simple in-memory SSE clients per user
const sseClients = {};

function transcriptPath(user){
  return path.join(TRANS_DIR, `${user}-live.txt`);
}

// SSE stream endpoint: GET /api/transcript/:user/stream
router.get('/:user/stream', (req, res) => {
  const user = req.params.user;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const id = Date.now();
  const client = { id, res };
  if (!sseClients[user]) sseClients[user] = [];
  sseClients[user].push(client);

  req.on('close', () => {
    sseClients[user] = (sseClients[user] || []).filter(c => c.id !== id);
  });
});

function broadcast(user, data){
  const list = sseClients[user] || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  list.forEach(c => {
    try{ c.res.write(payload); }catch(e){ /* ignore */ }
  });
}

// Append transcript POST /api/transcript/:user { text, source }
router.post('/:user', (req, res) => {
  const user = req.params.user;
  const text = (req.body && req.body.text) ? String(req.body.text) : '';
  const source = req.body.source || 'browser';
  if (!text) return res.status(400).json({ error: 'text required' });

  const p = transcriptPath(user);
  const entry = { id: `t-${Date.now()}`, user, text, source, ts: new Date().toISOString() };
  try{
    fs.appendFileSync(p, JSON.stringify(entry) + '\n');
    // broadcast to SSE listeners
    broadcast(user, entry);
    res.json({ ok: true, entry });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// Get full transcript (raw) GET /api/transcript/:user
router.get('/:user', (req, res) => {
  const user = req.params.user;
  const p = transcriptPath(user);
  if (!fs.existsSync(p)) return res.json([]);
  const lines = fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch(e){return {raw:l}}});
  res.json(lines);
});

// Download transcript file GET /api/transcript/:user/download
router.get('/:user/download', (req, res) => {
  const user = req.params.user;
  const p = transcriptPath(user);
  if (!fs.existsSync(p)) return res.status(404).send('no transcript');
  res.download(p, `${user}-live-transcript.txt`);
});

module.exports = router;
