// Simple frontend for Free Monkeys® GO (Map demo)
// Connects to backend API at /api/places

const apiBase = 'http://127.0.0.1:9001/api';
const map = L.map('map').setView([48.137154, 11.576124], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const markers = L.layerGroup().addTo(map);

async function loadPlaces(){
  try{
    document.getElementById('info').textContent = 'Lade Mapdaten…';
    const res = await fetch(`${apiBase}/places`);
    const data = await res.json();
    markers.clearLayers();
    if (data && data.places){
      data.places.forEach(p => {
        const m = L.marker([p.lat, p.lon]).addTo(markers);
        m.bindPopup(`<b>${p.title}</b><br/>${p.description}<br/><small>${p.tags.join(', ')}</small>`);
      });
      document.getElementById('info').textContent = `Lade Mapdaten — ${data.places.length} Orte geladen`;
    } else {
      document.getElementById('info').textContent = 'Keine Orte gefunden.';
    }
  } catch(err){
    console.error(err);
    document.getElementById('info').textContent = 'Fehler beim Laden der Mapdaten. Backend gestartet?';
  }
}

document.getElementById('btn-refresh').addEventListener('click', loadPlaces);

// Demo voice trigger — plays a small notification and shows toast
document.getElementById('btn-voice').addEventListener('click', async ()=>{
  try{
    // call backend TTS endpoint (stub) - here we simulate
    playNotifTone();
    showToast('MI: Scanning map for offers...');
  } catch(e){ console.error(e); }
});

function showToast(txt){
  const t = document.createElement('div');
  t.style.position='fixed';t.style.right='18px';t.style.top='18px';t.style.background='rgba(0,0,0,0.6)';t.style.padding='10px 12px';t.style.borderRadius='8px';t.style.color='#fff';t.style.zIndex=9999;t.textContent=txt;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

function playNotifTone(){
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if(!AudioCtx) return;
  const ctx = new AudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type='sine';o.frequency.value=720;
  o.connect(g);g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001,ctx.currentTime);g.gain.linearRampToValueAtTime(0.12,ctx.currentTime+0.02);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.22);
  o.start();o.stop(ctx.currentTime+0.25);
}

// initial load
loadPlaces();
