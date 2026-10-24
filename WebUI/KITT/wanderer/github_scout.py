"""Wanderer GitHub Scout: bounded public repository discovery, no code execution."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

VERSION = '0.1.0'
MAX_BYTES = 4_000_000


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def github_get(path, token=None):
    if not path.startswith('/') or path.startswith('//'):
        raise ValueError('Nur relative GitHub-API-Pfade erlaubt')
    headers = {'Accept': 'application/vnd.github+json',
               'User-Agent': 'KITT-Wanderer/' + VERSION,
               'X-GitHub-Api-Version': '2022-11-28'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request('https://api.github.com' + path, headers=headers)
    try:
        with urllib.request.build_opener(NoRedirect).open(req, timeout=20) as response:
            raw = response.read(MAX_BYTES + 1)
    except urllib.error.HTTPError as exc:
        raise RuntimeError('GitHub HTTP %s; Zugriff/Rate-Limit prüfen. Kein automatischer Retry.' % exc.code) from None
    except (urllib.error.URLError, TimeoutError) as exc:
        raise RuntimeError('GitHub nicht erreichbar; Lauf später erneut starten.') from None
    if len(raw) > MAX_BYTES:
        raise ValueError('GitHub-Antwort überschreitet das Größenbudget')
    return raw, json.loads(raw)


def candidates(payload, limit):
    if not isinstance(payload, dict) or not isinstance(payload.get('items'), list):
        raise ValueError('Erwartet wird eine GitHub-Repositories-Suchantwort mit items')
    rows, seen = [], set()
    for item in payload['items']:
        name = item.get('full_name', '')
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', name):
            continue
        if name.lower() in seen or item.get('private') or item.get('archived') or item.get('disabled'):
            continue
        seen.add(name.lower())
        lic = item.get('license') or {}
        rows.append({'repository': name, 'url': 'https://github.com/' + name,
                     'description': item.get('description'), 'language': item.get('language'),
                     'stars': item.get('stargazers_count'), 'pushed_at': item.get('pushed_at'),
                     'license_spdx': lic.get('spdx_id'),
                     'status': 'ungepruefter_kandidat', 'integration_tested': False})
        if len(rows) >= limit:
            break
    return rows


def run(query, area, output, limit=10, getter=github_get, token=None, input_file=None):
    if not query.strip() or len(query) > 300:
        raise ValueError('Suchauftrag muss 1 bis 300 Zeichen enthalten')
    if not 1 <= limit <= 20:
        raise ValueError('Limit muss zwischen 1 und 20 liegen')
    # A new run directory prevents overwriting any prior report.
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    import tempfile
    folder = Path(tempfile.mkdtemp(prefix='lauf-', dir=output))
    started = datetime.now(timezone.utc).isoformat()
    report = {'version': VERSION, 'created_at': started, 'query': query, 'area': area,
              'mode': 'import' if input_file else 'live', 'status': 'gestartet',
              'repositories': [], 'errors': [], 'training_approved': False}
    try:
        path = '/search/repositories?' + urllib.parse.urlencode(
            {'q': query + ' is:public archived:false', 'sort': 'updated',
             'order': 'desc', 'per_page': limit})
        if input_file:
            with Path(input_file).open('rb') as source:
                raw = source.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise ValueError('Import zu groß')
            payload = json.loads(raw)
        else:
            raw, payload = getter(path, token)
        # Save original evidence before interpreting it.
        (folder / 'github-response.json').write_bytes(raw)
        report['source'] = 'https://api.github.com' + path if not input_file else 'importierte Suchantwort; Herkunft extern prüfen'
        report['sha256'] = hashlib.sha256(raw).hexdigest()
        report['incomplete_results'] = payload.get('incomplete_results') if isinstance(payload, dict) else None
        report['repositories'] = candidates(payload, limit)
        report['status'] = 'unvollstaendig' if report['incomplete_results'] else 'abgerufen'
    except (RuntimeError, ValueError, OSError) as exc:
        report['status'] = 'fehlgeschlagen'
        report['errors'] = [str(exc)]
    (folder / 'bericht.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# Wanderer GitHub-Suche', '', 'Status: ' + report['status'],
             'Fachgebiet: ' + area, 'Suchauftrag: ' + query, '',
             'Kandidaten sind nicht getestet. Sterne belegen keine Qualität oder Lizenzrechte.', '']
    for r in report['repositories']:
        lines.extend(['## ' + r['repository'], r['url'],
                      'Lizenzangabe: ' + str(r['license_spdx']),
                      str(r['description'] or ''),
                      'Offen: README, Lizenztext, Voraussetzungen, API/CLI und isolierter Funktionstest.', ''])
    lines.extend(report['errors'])
    (folder / 'bericht.md').write_text('\n'.join(lines), encoding='utf-8')
    return folder, report


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--query', required=True)
    p.add_argument('--area', default='Werkzeuge')
    p.add_argument('--limit', type=int, default=10)
    p.add_argument('--output', type=Path, default=Path.home() / 'KITT_WANDERER_DATEN' / 'github')
    p.add_argument('--input', type=Path, help='Gespeicherte Suchantwort statt Livezugriff; als Import markiert')
    a = p.parse_args()
    try:
        folder, report = run(a.query, a.area, a.output, a.limit,
                             token=os.environ.get('GITHUB_TOKEN'), input_file=a.input)
    except (ValueError, OSError) as exc:
        p.exit(2, str(exc) + '\n')
    print('Status: ' + report['status'] + '\nErgebnis: ' + str(folder / 'bericht.md'))
    return 1 if report['status'] == 'fehlgeschlagen' else 0


if __name__ == '__main__':
    raise SystemExit(main())
