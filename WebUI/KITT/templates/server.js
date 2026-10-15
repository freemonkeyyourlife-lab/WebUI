'use strict';
// K.I.T.T. minimaler lokaler Server (nur loopback, keine Abhängigkeiten).
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOME = process.env.KITT_HOME || path.resolve(__dirname, '..');
const PORT = parseInt(process.env.KITT_PORT || '3005', 10);
const HOST = '127.0.0.1';
const DATA = path.join(HOME, 'data');
const TODOS = path.join(DATA, 'todos.json');
const STATUSES = ['offen', 'in_arbeit', 'fertig', 'archiv'];
const REQUESTS = path.join(DATA, 'requests.json');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function saveTodos(list) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(TODOS, JSON.stringify(list, null, 2));
}
function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) { reject(new Error('zu gross')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
  });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  if (p === '/api/health') return send(res, 200, { status: 'ok', name: 'K.I.T.T.' });
  if (p === '/api/dna') {
    const dna = readJson(path.join(HOME, 'dna', 'kitt_dna.json'), {});
    let prompt = '';
    try { prompt = fs.readFileSync(path.join(HOME, 'prompts', 'system_prompt.md'), 'utf8'); } catch (e) { /* optional */ }
    return send(res, 200, { dna, system_prompt: prompt });
  }
  if (p === '/api/status') {
    return send(res, 200, { server: 'ok', install: readJson(path.join(DATA, 'install_state.json'), null) });
  }
  if (p === '/api/todos' && req.method === 'GET') {
    const all = url.searchParams.get('archiv') === '1';
    return send(res, 200, readJson(TODOS, []).filter((t) => all || t.status !== 'archiv'));
  }
  if (p === '/api/todos' && req.method === 'POST') {
    const b = await body(req);
    const title = String(b.title || '').trim();
    if (!title) return send(res, 400, { error: 'title fehlt' });
    const list = readJson(TODOS, []);
    const todo = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title, status: 'offen', created: new Date().toISOString() };
    list.push(todo);
    saveTodos(list);
    return send(res, 201, todo);
  }
  const m = p.match(/^\/api\/todos\/([\w-]+)$/);
  if (m && req.method === 'PATCH') {
    const b = await body(req);
    const list = readJson(TODOS, []);
    const todo = list.find((t) => t.id === m[1]);
    if (!todo) return send(res, 404, { error: 'nicht gefunden' });
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return send(res, 400, { error: 'status ungueltig' });
      todo.status = b.status;
    }
    if (typeof b.title === 'string' && b.title.trim()) todo.title = b.title.trim();
    todo.updated = new Date().toISOString();
    saveTodos(list);
    return send(res, 200, todo);
  }
  if (p === '/api/requests' && req.method === 'GET') {
    return send(res, 200, readJson(REQUESTS, []).filter((r) => r.status !== 'archiv'));
  }
  if (p === '/api/requests' && req.method === 'POST') {
    const b = await body(req);
    const text = String(b.text || '').trim();
    if (!text) return send(res, 400, { error: 'text fehlt' });
    const list = readJson(REQUESTS, []);
    const r = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, status: 'offen', created: new Date().toISOString() };
    list.push(r);
    fs.mkdirSync(DATA, { recursive: true });
    fs.writeFileSync(REQUESTS, JSON.stringify(list, null, 2));
    return send(res, 201, r);
  }
  const rm = p.match(/^\/api\/requests\/([\w-]+)$/);
  if (rm && req.method === 'PATCH') {
    const b = await body(req);
    const list = readJson(REQUESTS, []);
    const r = list.find((x) => x.id === rm[1]);
    if (!r) return send(res, 404, { error: 'nicht gefunden' });
    if (!STATUSES.includes(b.status)) return send(res, 400, { error: 'status ungueltig' });
    r.status = b.status;
    r.updated = new Date().toISOString();
    fs.writeFileSync(REQUESTS, JSON.stringify(list, null, 2));
    return send(res, 200, r);
  }
  if (p === '/' || p === '/index.html') {
    try { return send(res, 200, fs.readFileSync(path.join(__dirname, 'public', 'index.html')), 'text/html; charset=utf-8'); } catch (e) { return send(res, 404, { error: 'index.html fehlt' }); }
  }
  return send(res, 404, { error: 'not found' });
}

http.createServer((req, res) => {
  handle(req, res).catch((e) => send(res, 400, { error: e.message }));
}).listen(PORT, HOST, () => console.log(`K.I.T.T. läuft auf http://${HOST}:${PORT}`));
