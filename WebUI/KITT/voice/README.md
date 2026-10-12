# Voice Manager (K.I.T.T.)

This folder contains the initial scaffold for the K.I.T.T. Voice Manager: upload, training, synthesis and management of voice models.

Important: By default the platform requires an explicit consent flag for any uploaded voice sample. This is configurable in the service .env (VOICE_REQUIRE_CONSENT=true). If you want a different default, update the .env or tell me.

What is included
- OpenAPI spec placeholder (api/voice_spec.yaml)
- React UI stub (ui/VoiceManager.stub.tsx)
- Docker compose scaffold for voice services (docker/voice-compose.yml)
- README with usage notes and next steps

Next steps (what I'll implement next):
- FastAPI or Node API endpoints to handle uploads + training jobs.
- Worker process wrapper for RVC or YourTTS depending on configuration.
- Admin UI for consent, model download, delete and audit.
