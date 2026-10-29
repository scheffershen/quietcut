import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from server import make_server


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.server = make_server(0, Path(self.temp.name))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_port

    def tearDown(self):
        self.server.shutdown()
        self.server.jobs.close()
        self.server.server_close()
        self.temp.cleanup()

    def request(self, method, path, body=None, headers=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.port)
        conn.request(method, path, body=body, headers=headers or {})
        response = conn.getresponse()
        data = response.read()
        result = response.status, data, dict(response.getheaders())
        conn.close()
        return result

    def test_auth_origin_and_errors(self):
        self.assertEqual(self.request('POST', '/api/projects', b'bad')[0], 403)
        headers = {'X-Session-Token': self.server.token, 'Origin': 'https://evil.example'}
        self.assertEqual(self.request('POST', '/api/projects', b'bad', headers)[0], 403)
        headers.pop('Origin')
        self.assertEqual(self.request('POST', '/api/project/unknown/settings', b'{', headers)[0], 400)
        self.assertEqual(self.request('GET', '/api/session', headers={'Host': 'evil.example'})[0], 403)

    def test_translation_assets(self):
        for path in ('/i18n.js', '/languages.css'):
            status, data, _ = self.request('GET', path)
            self.assertEqual(status, 200)
            self.assertGreater(len(data), 100)
        status, data, _ = self.request('GET', '/')
        self.assertEqual(status, 200)
        html = data.decode('utf-8')
        self.assertIn('value="fr"', html)
        self.assertIn('value="zh-CN"', html)
        self.assertLess(html.index('src="/i18n.js"'), html.index('src="/app.js"'))

    def test_local_path_import_and_validation(self):
        import subprocess
        source = Path(self.temp.name)/'picked tutorial.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i',
                        'color=s=160x90:r=25:d=1', '-f', 'lavfi', '-i',
                        'sine=duration=1', '-c:v', 'libx264', '-c:a', 'aac', str(source)], check=True)
        headers = {'X-Session-Token': self.server.token}
        self.assertEqual(self.request('POST', '/api/import-path', b'{}')[0], 403)
        payload = json.dumps({'path': '"'+str(source)+'"'}).encode()
        status, data, _ = self.request('POST', '/api/import-path', payload, headers)
        self.assertEqual(status, 200)
        project = json.loads(data)
        self.assertEqual(project['name'], source.name)
        self.assertEqual(project['state'], 'uploaded')
        self.assertEqual(self.server.store.media_path(project['id'], 'source.media').read_bytes(), source.read_bytes())
        self.assertNotIn('path', project)
        for invalid in ('', 'relative.mp4', '//server/share/video.mp4', str(source.with_suffix('.txt'))):
            status, _, _ = self.request('POST', '/api/import-path', json.dumps({'path': invalid}).encode(), headers)
            self.assertEqual(status, 400)
        self.assertEqual(len(self.server.store.list()), 1)

    def test_range_and_unknown_media(self):
        p = self.server.store.create('x.mp4')
        path = self.server.store.directory(p['id'])/'video.mp4'
        path.write_bytes(b'0123456789')
        headers = {'Cookie': f'editor_session={self.server.token}', 'Range': 'bytes=2-5'}
        status, data, _ = self.request('GET', f"/media/{p['id']}/video.mp4", headers=headers)
        self.assertEqual((status, data), (206, b'2345'))
        self.assertEqual(self.request('GET', f"/media/{p['id']}/project.json", headers=headers)[0], 400)
        headers['Range'] = 'bytes=50-60'
        self.assertEqual(self.request('GET', f"/media/{p['id']}/video.mp4", headers=headers)[0], 416)
        status, _, _ = self.request('POST', f"/api/project/{p['id']}/delete", b'{}', {'X-Session-Token': self.server.token})
        self.assertEqual(status, 200)
        self.assertFalse(self.server.store.directory(p['id']).exists())
