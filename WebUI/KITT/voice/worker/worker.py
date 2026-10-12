"""
Simple worker that polls the database for queued jobs and simulates training/conversion.
Replace the simulate_training function with real calls to RVC/YourTTS training scripts.
"""
import time
import os
from .api.models import SessionLocal, Job, Voice

POLL_INTERVAL = int(os.environ.get('VOICE_WORKER_POLL', '5'))

def simulate_training(job, session):
    print(f"[worker] Starting simulated training for job {job.id} (voice {job.voice_id})")
    job.status = 'running'
    job.logs = (job.logs or '') + '\nStarted simulation.'
    session.commit()
    # simulate work
    time.sleep(10)
    # create a dummy synth_preview.wav in the voice dir
    voice = session.query(Voice).filter(Voice.id == job.voice_id).first()
    storage_dir = os.path.dirname(voice.sample_path)
    preview_path = os.path.join(storage_dir, 'synth_preview.wav')
    with open(preview_path, 'wb') as f:
        f.write(b'RIFF....WAVEfmt ')
    job.status = 'completed'
    job.logs = (job.logs or '') + '\nCompleted simulation; preview created.'
    session.commit()
    print(f"[worker] Completed job {job.id}")


def run_worker():
    print('[worker] Booting voice worker...')
    while True:
        session = SessionLocal()
        job = session.query(Job).filter(Job.status == 'queued').first()
        if job:
            try:
                simulate_training(job, session)
            except Exception as e:
                job.status = 'failed'
                job.logs = (job.logs or '') + f'\nException: {e}'
                session.commit()
        else:
            session.close()
            time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    run_worker()
