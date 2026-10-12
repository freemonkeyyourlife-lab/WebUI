# Voice Worker

This module is the local worker behind K.I.T.T.'s Voice Manager.

Responsibilities
- validate uploaded audio file
- inspect consent metadata
- generate a voice job plan
- prepare a model artifact record
- create a preview synthesis request model

Design goal
- Start with a local-first voice conversion workflow and later support full TTS training.
- Keep the worker deterministic, auditable, and easy to retrain on new sample sets.

Example invocation

```bash
python WebUI/KITT/voice/worker/voice_worker.py \
  --audio /path/to/voice.wav \
  --name "KITT Primary" \
  --consent true \
  --mode rvc
```
