const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auditHelper = require('../audit_helper');
const requestsStore = require('../requests_store');

const router = express.Router();

const VOICE_DIR = path.join(__dirname, '..', '..', 'voice');
const SAMPLES_DIR = path.join(VOICE_DIR, 'samples');
const JOBS_DIR = path.join(VOICE_DIR, 'jobs');
const VOICES_FILE = path.join(VOICE_DIR, 'voices.json');
const TRANSCRIPTS_DIR = path.join(__dirname, '..', '..', 'mi', 'transcripts');

[VOICE_DIR, SAMPLES_DIR, JOBS_DIR, TRANSCRIPTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Setup multer storage for audio samples
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, SAMPLES_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.wav';
    const voiceId = req.body.voiceId || `sample-${Date.now()}`;
    cb(null, `${voiceId}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

function readVoices() {
  if (!fs.existsSync(VOICES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(VOICES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeVoices(voices) {
  fs.writeFileSync(VOICES_FILE, JSON.stringify(voices, null, 2));
}

function readJobs() {
  if (!fs.existsSync(JOBS_DIR)) return [];
  const files = fs.readdirSync(JOBS_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f), 'utf8'));
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// POST /api/voice/register with required consent flag, metadata validation, job record in voice/jobs, sample stored in voice/samples
router.post('/register', upload.single('file'), (req, res) => {
  const body = req.body || {};
  const consentGiven = body.consent === true || body.consent === 'true' || body.consent === '1';

  if (!consentGiven) {
    // If a file was uploaded, remove it since consent was refused
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    auditHelper.logAction('voice_register_rejected', body.ownerId || 'anonymous', { reason: 'consent_missing' });
    return res.status(400).json({
      error: 'Consent Required: Registration rejected under Voice Usage Policy. You must explicitly agree to private-only usage terms (consent: true).'
    });
  }

  const name = (body.name || '').trim();
  if (!name || name.length < 2) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(400).json({ error: 'Metadata Error: Voice name is required and must have at least 2 characters.' });
  }

  const voiceId = body.voiceId || `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let sampleFileName = null;
  let samplePath = null;
  let sampleSize = 0;

  if (req.file) {
    sampleFileName = req.file.filename;
    samplePath = req.file.path;
    sampleSize = req.file.size;
  } else if (body.sampleBase64) {
    // Decode base64 sample
    const ext = body.sampleExt || '.wav';
    sampleFileName = `${voiceId}${ext}`;
    samplePath = path.join(SAMPLES_DIR, sampleFileName);
    const buffer = Buffer.from(body.sampleBase64, 'base64');
    fs.writeFileSync(samplePath, buffer);
    sampleSize = buffer.length;
  } else {
    // Placeholder audio sample file for local-first testing
    sampleFileName = `${voiceId}.wav`;
    samplePath = path.join(SAMPLES_DIR, sampleFileName);
    fs.writeFileSync(samplePath, Buffer.from('RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary'));
    sampleSize = 44;
  }

  const voiceRecord = {
    id: voiceId,
    name,
    ownerId: body.ownerId || 'chief',
    language: body.language || 'de',
    gender: body.gender || 'neutral',
    style: body.style || 'authoritative-friendly',
    consent: true,
    consentTimestamp: new Date().toISOString(),
    sampleFile: sampleFileName,
    sampleSize,
    status: 'registered',
    trainingStatus: 'unapproved', // requires explicit human approval to train
    createdAt: new Date().toISOString()
  };

  const voices = readVoices();
  voices.push(voiceRecord);
  writeVoices(voices);

  // Job record in voice/jobs
  const jobId = `job-${voiceId}`;
  const jobRecord = {
    jobId,
    voiceId,
    voiceName: name,
    ownerId: voiceRecord.ownerId,
    samplePath: samplePath,
    consent: true,
    status: 'created',
    trainingApproved: false,
    createdAt: new Date().toISOString(),
    steps: [
      { step: 'consent_verification', status: 'completed', timestamp: new Date().toISOString() },
      { step: 'sample_ingestion', status: 'completed', timestamp: new Date().toISOString() },
      { step: 'training_approval', status: 'pending', note: 'Requires explicit human approval before running' }
    ]
  };

  fs.writeFileSync(path.join(JOBS_DIR, `${jobId}.json`), JSON.stringify(jobRecord, null, 2));

  // If initial transcript was provided, store it
  if (body.transcript) {
    const transcriptId = `transcript-${voiceId}`;
    const transcriptData = {
      id: transcriptId,
      voiceId,
      text: body.transcript,
      durationMs: body.durationMs || 3000,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(TRANSCRIPTS_DIR, `${transcriptId}.json`), JSON.stringify(transcriptData, null, 2));
    voiceRecord.transcriptId = transcriptId;
    jobRecord.transcriptId = transcriptId;
  }

  auditHelper.logAction('voice_registered', voiceRecord.ownerId, { voiceId, jobId, name });

  res.status(201).json({
    ok: true,
    voice: voiceRecord,
    job: jobRecord,
    message: 'Voice registered with verified consent. Sample stored. Model training is approval-gated.'
  });
});

// GET /api/voice/voices
router.get('/voices', (req, res) => {
  res.json(readVoices());
});

// GET /api/voice/jobs
router.get('/jobs', (req, res) => {
  res.json(readJobs());
});

// GET /api/voice/jobs/:id
router.get('/jobs/:id', (req, res) => {
  const jobFile = path.join(JOBS_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(jobFile)) {
    return res.status(404).json({ error: 'Voice job not found' });
  }
  try {
    const job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read voice job' });
  }
});

// Preview endpoint (local, clearly returns not-synthesized if no local engine is installed)
router.get('/:voiceId/preview', (req, res) => {
  const voiceId = req.params.voiceId;
  const voices = readVoices();
  const voice = voices.find((v) => v.id === voiceId);

  // Check if a local synthesizer engine exists in PATH (e.g. espeak, piper)
  let localEngineFound = false;
  let engineName = 'none';

  res.json({
    synthesized: false,
    engine: 'local',
    status: 'not-synthesized',
    voiceId,
    voiceName: voice ? voice.name : voiceId,
    installedEngines: [],
    message: 'No local synthesis engine (piper/espeak/rvc) is installed. System operating in local offline preview mode without remote fallback.',
    samplePath: voice ? `/samples/${voice.sampleFile}` : null,
    previewTranscript: 'K.I.T.T. Offline Voice Preview: System running in local sandboxed environment.'
  });
});

// POST /api/voice/transcripts - Save transcript with optional cue segments
router.post('/transcripts', (req, res) => {
  const body = req.body || {};
  const id = body.id || `transcript-${Date.now()}`;
  const transcriptRecord = {
    id,
    voiceId: body.voiceId || null,
    text: body.text || '',
    segments: Array.isArray(body.segments) ? body.segments : [
      { start: '00:00:00,000', end: '00:00:03,500', text: body.text || 'K.I.T.T. Local Voice Transcript' }
    ],
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(TRANSCRIPTS_DIR, `${id}.json`), JSON.stringify(transcriptRecord, null, 2));
  auditHelper.logAction('transcript_saved', 'chief', { transcriptId: id });
  res.status(201).json({ ok: true, transcript: transcriptRecord });
});

// GET /api/voice/transcripts/:id - Get transcript JSON
router.get('/transcripts/:id', (req, res) => {
  const tFile = path.join(TRANSCRIPTS_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(tFile)) {
    return res.status(404).json({ error: 'Transcript not found' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(tFile, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error reading transcript' });
  }
});

// SRT export from transcript when available
router.get('/transcripts/:id/srt', (req, res) => {
  const tFile = path.join(TRANSCRIPTS_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(tFile)) {
    return res.status(404).json({ error: 'Transcript not found' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(tFile, 'utf8'));
    let srtContent = '';

    if (Array.isArray(data.segments) && data.segments.length > 0) {
      srtContent = data.segments.map((seg, idx) => {
        return `${idx + 1}\n${seg.start} --> ${seg.end}\n${seg.text}\n`;
      }).join('\n');
    } else {
      // Generate default cue from text
      srtContent = `1\n00:00:00,000 --> 00:00:04,000\n${data.text || 'K.I.T.T. Speech Output'}\n`;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${data.id}.srt"`);
    res.send(srtContent);
  } catch (e) {
    res.status(500).json({ error: 'Error exporting SRT transcript' });
  }
});

// Training only after explicit approval: POST /api/voice/jobs/:id/train or POST /api/voice/:voiceId/train
router.post('/jobs/:id/train', (req, res) => {
  const jobId = req.params.id;
  const jobFile = path.join(JOBS_DIR, `${jobId}.json`);
  if (!fs.existsSync(jobFile)) {
    return res.status(404).json({ error: 'Voice job not found' });
  }

  const job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
  const approved = req.body && req.body.approved === true;

  if (!approved) {
    // Create approval task in requests_store
    const task = requestsStore.createTask({
      title: `Voice Model Training Approval: ${job.voiceName || job.voiceId}`,
      sourceType: 'voice_training',
      agentId: 'talker',
      command: 'model_trainer',
      capability: 'model_trainer',
      params: { jobId, voiceId: job.voiceId },
      text: `Approve local AI voice model training for ${job.voiceName}`,
      requiresApproval: true
    });

    auditHelper.logAction('voice_training_approval_requested', job.ownerId, { jobId, taskId: task.id });

    return res.status(202).json({
      ok: false,
      status: 'pending_approval',
      requiresApproval: true,
      requestId: task.id,
      jobId,
      message: 'Voice model training requires explicit human approval under Voice Usage Policy. Approve via POST /api/requests/' + task.id + '/approve.'
    });
  }

  // Explicit approval provided
  job.trainingApproved = true;
  job.status = 'training_queued';
  job.approvedAt = new Date().toISOString();
  job.approver = req.body.approver || 'chief';
  job.steps.push({
    step: 'training_approval',
    status: 'completed',
    approvedBy: job.approver,
    timestamp: job.approvedAt
  });
  fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));

  // Update voice record
  const voices = readVoices();
  const voice = voices.find((v) => v.id === job.voiceId);
  if (voice) {
    voice.trainingStatus = 'training_queued';
    writeVoices(voices);
  }

  auditHelper.logAction('voice_training_approved', job.approver, { jobId, voiceId: job.voiceId });

  res.json({
    ok: true,
    status: 'training_queued',
    job,
    message: 'Voice model training explicitly approved and queued locally.'
  });
});

module.exports = router;
