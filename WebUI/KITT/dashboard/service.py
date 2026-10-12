from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DASHBOARD = ROOT / "WebUI" / "KITT" / "dashboard" / "index.html"

app = FastAPI(title="K.I.T.T. Dashboard Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard_page():
    return DASHBOARD.read_text(encoding='utf-8')

@app.get("/health")
def health():
    return {"status": "ok", "service": "dashboard"}
