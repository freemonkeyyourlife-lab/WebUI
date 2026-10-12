from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
from .models import init_db, SessionLocal, Voice, Job
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="K.I.T.T. Voice Manager API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STORAGE = os.path.join(BASE_DIR, '..', 'storage')
os.makedirs(STORAGE, exist_ok=True)

init_db()

@app.post('/voices', status_code=201)
async def upload_voice(file: UploadFile = File(...), name: str = Form(...), owner_id: str = Form(None), consent: bool = Form(...)):
    if consent is None or consent is False:
        raise HTTPException(status_code=400, detail='Consent flag is required')
    vid = str(uuid.uuid4())
    voice_dir = os.path.join(STORAGE, vid)
    os.makedirs(voice_dir, exist_ok=True)
    file_path = os.path.join(voice_dir, file.filename)
    with open(file_path, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    db: Session = SessionLocal()
    v = Voice(id=vid, name=name, owner_id=owner_id, sample_path=file_path)
    db.add(v)
    db.commit()
    db.refresh(v)
    db.close()
    return {"id": vid, "name": name}

@app.get('/voices')
def list_voices():
    db = SessionLocal()
    vs = db.query(Voice).all()
    out = []
    for v in vs:
        out.append({"id": v.id, "name": v.name, "sample_path": v.sample_path, "created_at": v.created_at.isoformat()})
    db.close()
    return out

@app.post('/voices/{voice_id}/train', status_code=202)
def start_train(voice_id: str, mode: str = Form('rvc'), preset: str = Form(None)):
    db = SessionLocal()
    v = db.query(Voice).filter(Voice.id == voice_id).first()
    if not v:
        db.close()
        raise HTTPException(status_code=404, detail='Voice not found')
    job = Job(voice_id=voice_id, type='train', mode=mode, status='queued')
    db.add(job)
    db.commit()
    db.refresh(job)
    db.close()
    return {"job_id": job.id, "status": job.status}

@app.post('/voices/{voice_id}/synthesize')
def synthesize(voice_id: str, text: str = Form(...), pitch: float = Form(0.0), speed: float = Form(1.0), style: str = Form(None)):
    db = SessionLocal()
    v = db.query(Voice).filter(Voice.id == voice_id).first()
    if not v:
        db.close()
        raise HTTPException(status_code=404, detail='Voice not found')
    # For MVP: If a synthesized file exists for the voice, return it. Otherwise return 501.
    synth_path = os.path.join(STORAGE, voice_id, 'synth_preview.wav')
    if os.path.exists(synth_path):
        db.close()
        return FileResponse(synth_path, media_type='audio/wav')
    else:
        db.close()
        raise HTTPException(status_code=501, detail='Synthesis not yet available for this voice (train first)')

@app.get('/jobs')
def list_jobs():
    db = SessionLocal()
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(50).all()
    out = []
    for j in jobs:
        out.append({"id": j.id, "voice_id": j.voice_id, "type": j.type, "status": j.status, "created_at": j.created_at.isoformat()})
    db.close()
    return out
