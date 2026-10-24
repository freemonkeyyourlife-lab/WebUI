import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from github_scout import candidates, github_get, run


class ScoutTests(unittest.TestCase):
    def test_public_unique_active_only(self):
        payload = {'items': [dict(full_name='a/tool'), dict(full_name='a/tool'),
                             dict(full_name='b/old', archived=True),
                             dict(full_name='b/private', private=True),
                             dict(full_name='https://evil.invalid') ]}
        self.assertEqual([r['repository'] for r in candidates(payload, 20)], ['a/tool'])

    def test_original_evidence_and_no_overwrite(self):
        raw = b'{"items":[{"full_name":"a/tool"}],"incomplete_results":false}'
        def fake(path, token):
            self.assertIn('is%3Apublic', path)
            return raw, json.loads(raw)
        with tempfile.TemporaryDirectory() as d:
            first, report = run('archive', 'Archiv', d, getter=fake)
            second, _ = run('archive', 'Archiv', d, getter=fake)
            self.assertNotEqual(first, second)
            self.assertEqual((first/'github-response.json').read_bytes(), raw)
            self.assertEqual(report['sha256'], hashlib.sha256(raw).hexdigest())
            self.assertFalse(report['repositories'][0]['integration_tested'])

    def test_failure_is_saved(self):
        def fail(path, token):
            raise RuntimeError('GitHub HTTP 403')
        with tempfile.TemporaryDirectory() as d:
            folder, report = run('test', 'Test', d, getter=fail)
            self.assertEqual(report['status'], 'fehlgeschlagen')
            self.assertTrue((folder/'bericht.json').exists())
            self.assertEqual(report['repositories'], [])

    def test_import_never_claims_live(self):
        with tempfile.TemporaryDirectory() as d:
            source = Path(d)/'input.json'
            source.write_text('{"items": [], "incomplete_results": true}')
            _, report = run('test', 'Test', d, input_file=source)
            self.assertEqual(report['mode'], 'import')
            self.assertEqual(report['status'], 'unvollstaendig')

    def test_budget_and_host_guard(self):
        with self.assertRaises(ValueError):
            run('test', 'Test', '.', limit=21)
        with self.assertRaises(ValueError):
            github_get('//evil.invalid')


if __name__ == '__main__':
    unittest.main()
