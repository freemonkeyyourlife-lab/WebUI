import argparse
import json
import os
from datetime import datetime


def validate_audio_file(audio_path, consent_flag):
    if not consent_flag:
        return {
            "ok": False,
            "error": "Consent flag must be true before processing a voice sample."
        }

    if not os.path.exists(audio_path):
        return {
            "ok": False,
            "error": "Audio file not found."
        }

    ext = os.path.splitext(audio_path)[1].lower()
    if ext not in {'.wav', '.flac'}:
        return {
            "ok": False,
            "error": "Only WAV or FLAC files are supported."
        }

    return {
        "ok": True,
        "audio_path": audio_path,
        "file_extension": ext,
        "file_size_bytes": os.path.getsize(audio_path)
    }


def build_job_plan(audio_path, name, consent_flag, mode):
    validation = validate_audio_file(audio_path, consent_flag)
    if not validation["ok"]:
        return {
            "status": "blocked",
            "reason": validation["error"],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    return {
        "status": "queued",
        "mode": mode,
        "voice_name": name,
        "consent": consent_flag,
        "audio_path": audio_path,
        "quality_checks": [
            "sample rate check",
            "peak volume normalization",
            "noise floor sanity check",
            "speaker segmentation"
        ],
        "next_steps": [
            "preprocess audio",
            "extract speaker embedding",
            "prepare model job",
            "generate preview synthesis"
        ],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


def main():
    parser = argparse.ArgumentParser(description='K.I.T.T. voice worker stub')
    parser.add_argument('--audio', required=True, help='Path to WAV/FLAC voice sample')
    parser.add_argument('--name', required=True, help='Voice profile name')
    parser.add_argument('--consent', required=True, choices=['true', 'false'], help='Consent flag')
    parser.add_argument('--mode', default='rvc', choices=['rvc', 'tts'], help='Voice mode')
    args = parser.parse_args()

    consent_flag = args.consent.lower() == 'true'
    job = build_job_plan(args.audio, args.name, consent_flag, args.mode)

    print(json.dumps(job, indent=2))

    # Optional artifact file in a local workspace for later pipeline use
    out_dir = os.path.join(os.getcwd(), 'WebUI', 'KITT', 'voice', 'jobs')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{args.name.lower().replace(' ', '_')}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(job, f, indent=2)

    print(f"\nJob plan saved to: {out_file}")


if __name__ == '__main__':
    main()
