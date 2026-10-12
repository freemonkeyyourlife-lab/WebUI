import React, { useEffect, useState } from 'react';

export default function VoiceManager() {
  const [voices, setVoices] = useState([]);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    fetch('/api/voice/voices').then(r => r.json()).then(setVoices).catch(console.error);
  }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Choose a file');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name || file.name);
    fd.append('consent', consent);
    const res = await fetch('/api/voice/voices', { method: 'POST', body: fd });
    if (res.ok) {
      alert('Uploaded');
      const v = await res.json();
      setVoices(prev => [v, ...prev]);
    } else {
      alert('Upload failed');
    }
  };

  const startTrain = async (id) => {
    const res = await fetch(`/api/voice/voices/${id}/train`, { method: 'POST' });
    if (res.ok) alert('Train job queued'); else alert('Failed to queue');
  };

  const preview = async (id) => {
    const res = await fetch(`/api/voice/voices/${id}/synthesize`, { method: 'POST', body: new URLSearchParams({ text }) });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('audio');
      a.src = url; a.controls = true; document.getElementById('previewPlayer').innerHTML = '';
      document.getElementById('previewPlayer').appendChild(a);
      a.play();
    } else {
      const j = await res.json(); alert(j.detail || 'No preview available');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">K.I.T.T. Voice Manager</h2>
      <form onSubmit={upload} encType="multipart/form-data" className="mt-4">
        <input type="file" accept="audio/*" onChange={e => setFile(e.target.files[0])} />
        <input placeholder="Speaker name" value={name} onChange={e => setName(e.target.value)} />
        <label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I have consent to use this voice</label>
        <button type="submit">Upload</button>
      </form>

      <div className="mt-6">
        <h3>Available voices</h3>
        <ul>
          {voices.map(v => (
            <li key={v.id}>{v.name} <button onClick={() => startTrain(v.id)}>Train</button></li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3>Preview / Synthesize</h3>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Text to synthesize" />
        <div id="previewPlayer"></div>
        <div>
          <select id="voiceSelect">
            <option value="">Select voice</option>
            {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button onClick={() => { const id = document.getElementById('voiceSelect').value; preview(id); }}>Preview</button>
        </div>
      </div>
    </div>
  );
}
