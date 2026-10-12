import React from 'react';

export default function VoiceManagerStub() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">K.I.T.T. Voice Manager (Stub)</h2>
      <p className="mt-2">Upload voice samples, start training and preview synthesized audio.</p>

      <section className="mt-6">
        <h3 className="font-semibold">Upload</h3>
        <form encType="multipart/form-data">
          <label htmlFor="file">Audio file (WAV/FLAC)</label>
          <input id="file" name="file" type="file" accept="audio/wav,audio/flac" />
          <label htmlFor="name">Speaker name</label>
          <input id="name" name="name" type="text" />
          <label>
            <input type="checkbox" name="consent" /> I confirm I have the rights / consent to use this voice
          </label>
          <button type="submit">Upload</button>
        </form>
      </section>

      <section className="mt-6">
        <h3 className="font-semibold">Available voices</h3>
        <div id="voicesList">(list populated by API)</div>
      </section>

      <section className="mt-6">
        <h3 className="font-semibold">Preview / Synthesize</h3>
        <textarea placeholder="Text to synthesize" />
        <div>
          <label>Pitch</label>
          <input type="range" min="-5" max="5" defaultValue={0} />
        </div>
        <div>
          <label>Speed</label>
          <input type="range" min="0.5" max="2" step="0.01" defaultValue={1} />
        </div>
        <button>Preview</button>
      </section>
    </div>
  );
}
