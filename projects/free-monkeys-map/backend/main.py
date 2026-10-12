from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title='Free Monkeys Map API')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

class Place(BaseModel):
    id: str
    title: str
    description: str
    lat: float
    lon: float
    tags: List[str] = []

@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'free-monkeys-map'}

@app.get('/api/places')
def places():
    # sample static places — replace with DB in real implementation
    sample = [
        {'id':'p1', 'title':'Monkey Market', 'description':'Local offers for collectors', 'lat':48.1375, 'lon':11.5756, 'tags':['market','offers']},
        {'id':'p2', 'title':'Retro Garage', 'description':'Classic car parts and services', 'lat':48.142, 'lon':11.58, 'tags':['garage']},
        {'id':'p3', 'title':'FM Hub', 'description':'Free Monkeys meetup & dev', 'lat':48.135, 'lon':11.58, 'tags':['hub','events']}
    ]
    return {'places': sample}

class VoiceUpload(BaseModel):
    name: str
    consent: bool = False

@app.post('/api/voice/upload')
def voice_upload(payload: VoiceUpload):
    if not payload.consent:
        return {'ok': False, 'error': 'consent required'}
    # store / process upload (stub)
    return {'ok': True, 'message': 'voice upload accepted (stub)'}
