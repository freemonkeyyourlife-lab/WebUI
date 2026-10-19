const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const multer = require('multer');

// Router for flexible file operations: upload, download, import, extract, convert, metadata
const router = express.Router();

// Base directories
const VOICE_DIR = path.join(__dirname, '..', 'voice');
const FILES_DIR = path.join(__dirname, '..', 'files');

// Ensure directories exist
[VOICE_DIR, FILES_DIR, path.join(VOICE_DIR, 'samples'), path.join(VOICE_DIR, 'jobs')].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Multer setup for multipart uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const target = (req.body.target || req.query.target || 'files').toLowerCase();
    let dest = FILES_DIR;
    if (target === 'voice' || target === 'samples') dest = path.join(VOICE_DIR, 'samples');
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const name = req.body.name || file.originalname;
    cb(null, `${Date.now()}-${name}`);
  }
});
const upload = multer({ storage });

// Helpers
function safeJoin(base, p) {
  const resolved = path.resolve(base, p || '');
  if (!resolved.startsWith(path.resolve(base))) throw new Error('Invalid path');
  return resolved;
}

function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode >= 400) return reject(new Error('Failed to download file: ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(destPath)));
    });
    req.on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

// 1) Multipart upload (files)
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ ok: true, path: req.file.path, filename: req.file.filename, size: req.file.size });
});

// 2) Base64 upload
router.post('/upload_base64', (req, res) => {
  const { filename, data_base64, target } = req.body;
  if (!filename || !data_base64) return res.status(400).json({ error: 'filename and data_base64 required' });
  const destDir = (target === 'voice' ? path.join(VOICE_DIR, 'samples') : FILES_DIR);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, `${Date.now()}-${filename}`);
  const buffer = Buffer.from(data_base64, 'base64');
  fs.writeFileSync(dest, buffer);
  res.json({ ok: true, path: dest, size: buffer.length });
});

// 3) Import from URL
router.post('/import_url', async (req, res) => {
  const { url, filename, target } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const destDir = (target === 'voice' ? path.join(VOICE_DIR, 'samples') : FILES_DIR);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const name = filename || path.basename(new URL(url).pathname) || `download-${Date.now()}`;
    const dest = path.join(destDir, `${Date.now()}-${name}`);
    await downloadToFile(url, dest);
    res.json({ ok: true, path: dest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4) List files
router.get('/list', (req, res) => {
  const dir = req.query.dir || '.';
  try {
    const base = dir.startsWith('voice') ? VOICE_DIR : FILES_DIR;
    const target = safeJoin(base, dir === '.' ? '' : dir.replace(/^voice\//, ''));
    if (!fs.existsSync(target)) return res.json([]);
    const entries = fs.readdirSync(target).map(f => {
      const s = fs.statSync(path.join(target, f));
      return { name: f, size: s.size, mtime: s.mtime, isFile: s.isFile() };
    });
    res.json(entries);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5) Download file
router.get('/download', (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path query required' });
  try {
    let resolved;
    if (p.startsWith('voice/')) resolved = safeJoin(VOICE_DIR, p.replace(/^voice\//, ''));
    else resolved = safeJoin(FILES_DIR, p);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'not found' });
    res.download(resolved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6) Extract zip
router.post('/extract_zip', (req, res) => {
  const { path: p, dest } = req.body;
  if (!p) return res.status(400).json({ error: 'path required' });
  try {
    const src = p.startsWith('voice/') ? safeJoin(VOICE_DIR, p.replace(/^voice\//, '')) : safeJoin(FILES_DIR, p);
    if (!fs.existsSync(src)) return res.status(404).json({ error: 'source not found' });
    const outDir = dest ? (dest.startsWith('voice/') ? safeJoin(VOICE_DIR, dest.replace(/^voice\//, '')) : safeJoin(FILES_DIR, dest)) : path.dirname(src);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const unzip = spawn('unzip', ['-o', src, '-d', outDir]);
    unzip.on('close', (code) => {
      if (code === 0) return res.json({ ok: true, extractedTo: outDir });
      return res.status(500).json({ error: 'unzip failed, code ' + code });
    });
    unzip.on('error', (err) => res.status(500).json({ error: 'unzip not available: ' + err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7) Metadata extraction
router.post('/metadata', (req, res) => {
  const { path: p } = req.body;
  if (!p) return res.status(400).json({ error: 'path required' });
  try {
    const resolved = p.startsWith('voice/') ? safeJoin(VOICE_DIR, p.replace(/^voice\//, '')) : safeJoin(FILES_DIR, p);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'not found' });
    const s = fs.statSync(resolved);
    const ext = path.extname(resolved).toLowerCase();
    res.json({ path: resolved, size: s.size, mtime: s.mtime, ext });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 8) Convert audio using ffmpeg if available
router.post('/convert_audio', (req, res) => {
  const { path: p, format } = req.body;
  if (!p || !format) return res.status(400).json({ error: 'path and format required' });
  try {
    const resolved = p.startsWith('voice/') ? safeJoin(VOICE_DIR, p.replace(/^voice\//, '')) : safeJoin(FILES_DIR, p);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'not found' });
    const out = resolved.replace(path.extname(resolved), '.' + format);
    const ff = spawn('ffmpeg', ['-y', '-i', resolved, out]);
    let logs = '';
    ff.stderr.on('data', (d) => logs += d.toString());
    ff.on('close', (code) => {
      if (code === 0) return res.json({ ok: true, output: out });
      return res.status(500).json({ error: 'ffmpeg failed', code, logs });
    });
    ff.on('error', (err) => res.status(500).json({ error: 'ffmpeg not available: ' + err.message }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9) Delete file
router.delete('/', (req, res) => {
  const p = req.body.path || req.query.path;
  if (!p) return res.status(400).json({ error: 'path required' });
  try {
    const resolved = p.startsWith('voice/') ? safeJoin(VOICE_DIR, p.replace(/^voice\//, '')) : safeJoin(FILES_DIR, p);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'not found' });
    fs.unlinkSync(resolved);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 10) extract text (pdf -> pdftotext, image -> tesseract)
router.post('/extract_text', (req, res) => {
  const { path: p } = req.body;
  if (!p) return res.status(400).json({ error: 'path required' });
  try {
    const resolved = p.startsWith('voice/') ? safeJoin(VOICE_DIR, p.replace(/^voice\//, '')) : safeJoin(FILES_DIR, p);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'not found' });
    const ext = path.extname(resolved).toLowerCase();
    if (ext === '.pdf') {
      const out = resolved + '.txt';
      const pdftotext = spawn('pdftotext', [resolved, out]);
      pdftotext.on('close', (code) => {
        if (code === 0) return res.json({ ok: true, text_path: out });
        return res.status(500).json({ error: 'pdftotext failed' });
      });
      pdftotext.on('error', (err) => res.status(500).json({ error: 'pdftotext not available: ' + err.message }));
    } else {
      const out = resolved + '.txt';
      const tess = spawn('tesseract', [resolved, out.replace(/\.txt$/, '')]);
      tess.on('close', (code) => {
        if (code === 0) return res.json({ ok: true, text_path: out });
        return res.status(500).json({ error: 'tesseract failed or not installed' });
      });
      tess.on('error', (err) => res.status(500).json({ error: 'tesseract not available: ' + err.message }));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 11) webhook registration
const webhooksFile = path.join(__dirname, 'data', 'file_webhooks.json');
if (!fs.existsSync(path.dirname(webhooksFile))) fs.mkdirSync(path.dirname(webhooksFile), { recursive: true });
if (!fs.existsSync(webhooksFile)) fs.writeFileSync(webhooksFile, JSON.stringify([], null, 2));

router.post('/webhook_register', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const hooks = JSON.parse(fs.readFileSync(webhooksFile, 'utf8')) || [];
  hooks.push({ id: `hook-${Date.now()}`, url, createdAt: new Date().toISOString() });
  fs.writeFileSync(webhooksFile, JSON.stringify(hooks, null, 2));
  res.json({ ok: true });
});

module.exports = router;
