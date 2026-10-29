"""Loopback-only editor server. Run with python server.py --open."""
import argparse
import json
import mimetypes
import os
import re
import secrets
import shutil
import threading
import webbrowser
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from jobs import JobManager
from projects import ProjectStore
import media

ROOT = Path(__file__).resolve().parent


class Handler(BaseHTTPRequestHandler):
    server_version = 'TutorialEditor/1'

    def log_message(self, *args): pass

    def guard(self, mutation=False):
        origin = f'http://127.0.0.1:{self.server.server_port}'
        if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
            raise PermissionError('Open the editor using its 127.0.0.1 address.')
        if self.headers.get('Origin') not in (None, origin):
            raise PermissionError('Only the local editor may access this service.')
        if self.headers.get('Sec-Fetch-Site') == 'cross-site':
            raise PermissionError('Cross-site requests are not allowed.')
        if mutation:
            supplied = self.headers.get('X-Session-Token', '')
        else:
            cookie = SimpleCookie(self.headers.get('Cookie', ''))
            supplied = self.headers.get('X-Session-Token') or (cookie['editor_session'].value if 'editor_session' in cookie else '')
        if not secrets.compare_digest(supplied, self.server.token):
            raise PermissionError('Reload the editor to restore its local session.')

    def send_json(self, data, status=200, cookie=False):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if cookie:
            self.send_header('Set-Cookie', f'editor_session={self.server.token}; HttpOnly; SameSite=Strict; Path=/')
        self.end_headers()
        self.wfile.write(body)

    def body(self):
        size = int(self.headers.get('Content-Length', 0))
        if not 0 < size <= 1024*1024:
            raise ValueError('Invalid request size.')
        data = json.loads(self.rfile.read(size))
        if not isinstance(data, dict): raise ValueError('Expected a JSON object.')
        return data

    def fail(self, error):
        if isinstance(error, (BrokenPipeError, ConnectionResetError)): return
        status = 403 if isinstance(error, PermissionError) else 400
        if isinstance(error, FileNotFoundError): status = 404
        self.send_json({'error': str(error)}, status)

    def do_GET(self):
        try:
            path = urlparse(self.path).path
            if path in ('/', '/app.js', '/i18n.js', '/style.css', '/languages.css'):
                # Host validation also protects the session bootstrap from DNS rebinding.
                if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}':
                    raise PermissionError('Invalid Host.')
                return self.file(ROOT/'static'/('index.html' if path == '/' else path[1:]))
            if path == '/api/session':
                if self.headers.get('Host') != f'127.0.0.1:{self.server.server_port}' or self.headers.get('Sec-Fetch-Site') == 'cross-site' or self.headers.get('Origin') not in (None, f'http://127.0.0.1:{self.server.server_port}'):
                    raise PermissionError('Invalid session origin.')
                return self.send_json({'token': self.server.token}, cookie=True)
            self.guard()
            if path == '/api/projects': return self.send_json(self.server.store.list())
            parts = path.strip('/').split('/')
            if len(parts) == 3 and parts[:2] == ['api', 'project']:
                return self.send_json(self.server.store.get(parts[2]))
            if len(parts) == 3 and parts[:2] == ['api', 'job']:
                return self.send_json(self.server.jobs.status(parts[2]))
            if len(parts) == 3 and parts[0] == 'media':
                project_id, name = parts[1:]
                p = self.server.store.get(project_id)
                allowed = {'video.mp4', 'original.wav', 'waveform.json'}
                if p.get('rendered_revision') is not None:
                    allowed.add(f"clean-{p['rendered_revision']}.wav")
                if p.get('exported_revision') is not None:
                    allowed.add(f"export-{p['exported_revision']}.mp4")
                if name not in allowed: raise ValueError('Media is not ready or not accessible.')
                return self.file(self.server.store.media_path(project_id, name), name.startswith('export-'))
            raise FileNotFoundError('Unknown endpoint.')
        except Exception as error: self.fail(error)

    def do_POST(self):
        try:
            self.guard(True)
            parsed = urlparse(self.path)
            parts = parsed.path.strip('/').split('/')
            if parsed.path == '/api/import-path':
                if not self.server.picker_lock.acquire(blocking=False):
                    raise ValueError('Another video is being imported. Wait for it to finish.')
                try:
                    selected = self.body().get('path', '').strip().strip('"')
                    source = Path(selected)
                    if not source.is_absolute() or selected.startswith(('\\\\', '//')) or not source.drive or source.drive.startswith('\\\\'):
                        raise ValueError('Paste a full local video path, such as D:\\Videos\\tutorial.mp4. Network paths are not supported.')
                    if source.suffix.lower() not in ('.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v', '.wmv', '.mts', '.m2ts', '.flv', '.mpeg', '.mpg'):
                        raise ValueError('Choose a video file such as MP4, MOV, MKV, or WebM.')
                    if not source.is_file() or not 0 < source.stat().st_size <= 50*1024**3:
                        raise ValueError('Choose a nonempty video smaller than 50 GB.')
                    p = self.server.store.create(source.name)
                    directory = self.server.store.directory(p['id'])
                    try:
                        shutil.copyfile(source, directory/p['source'])
                        info = media.probe(directory/p['source'])
                        p = self.server.store.update(p['id'], state='uploaded', duration=info['duration'],
                                                     audio_tracks=info['audio_tracks'])
                    except Exception:
                        self.server.store.delete(p['id'])
                        raise
                    return self.send_json(p)
                finally:
                    self.server.picker_lock.release()
            if parsed.path == '/api/projects':
                return self.upload(parse_qs(parsed.query))
            if len(parts) == 4 and parts[:2] == ['api', 'job'] and parts[3] == 'cancel':
                return self.send_json(self.server.jobs.cancel(parts[2]))
            if len(parts) != 4 or parts[:2] != ['api', 'project']:
                raise FileNotFoundError('Unknown endpoint.')
            project_id, action = parts[2:]
            store, jobs = self.server.store, self.server.jobs
            if action == 'delete':
                jobs.delete_project(project_id)
                return self.send_json({'deleted': True})
            if action == 'settings':
                return self.send_json(store.save_settings(project_id, self.body()))
            p = store.get(project_id)
            directory = store.directory(project_id)
            if action == 'prepare':
                payload = self.body()
                if p['state'] not in ('uploaded', 'failed', 'ready'):
                    raise ValueError('This video is still being prepared.')
                index = int(payload['audio_index'])
                if index not in [a['index'] for a in p['audio_tracks']]:
                    raise ValueError('Invalid audio track.')
                # Re-preparation changes the selected track and invalidates cached renders.
                revision = p['revision']+1
                def operation(job):
                    info = media.prepare(directory, directory/p['source'], index, job)
                    return dict(info, state='ready', error=None)
                with store.lock:
                    item = jobs.submit(project_id, 'prepare', revision, operation)
                    store.update(project_id, state='preparing', revision=revision,
                                 rendered_revision=None, exported_revision=None)
                return self.send_json(item)
            if action in ('render', 'export'):
                if p['state'] != 'ready': raise ValueError('Prepare the video first.')
                revision = p['revision']
                if action == 'export' and p['rendered_revision'] != revision:
                    raise ValueError('Generate a current cleaned preview before exporting.')
                def operation(job):
                    if action == 'render':
                        media.render(directory, p['settings'], revision, job)
                        return {'rendered_revision': revision, 'exported_revision': None}
                    media.export(directory, revision, job)
                    return {'exported_revision': revision}
                return self.send_json(jobs.submit(project_id, action, revision, operation))
            raise FileNotFoundError('Unknown project action.')
        except Exception as error: self.fail(error)

    def upload(self, query):
        size = int(self.headers.get('Content-Length', 0))
        if not 0 < size <= 50*1024**3:
            raise ValueError('Choose a nonempty video smaller than 50 GB.')
        name = query.get('name', ['Tutorial video'])[0][:240]
        p = self.server.store.create(name)
        directory = self.server.store.directory(p['id'])
        try:
            with (directory/p['source']).open('wb') as output:
                remaining = size
                while remaining:
                    chunk = self.rfile.read(min(1024*1024, remaining))
                    if not chunk: raise ValueError('Upload was interrupted.')
                    output.write(chunk)
                    remaining -= len(chunk)
            info = media.probe(directory/p['source'])
            p = self.server.store.update(p['id'], state='uploaded', duration=info['duration'],
                                         audio_tracks=info['audio_tracks'])
            self.send_json(p)
        except Exception:
            self.server.store.delete(p['id'])
            raise

    def file(self, path, download=False):
        size = path.stat().st_size
        start, end, status = 0, size-1, 200
        header = self.headers.get('Range')
        if header:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', header)
            if not match or not any(match.groups()):
                self.send_error(416); return
            left, right = match.groups()
            if left:
                start, end = int(left), min(size-1, int(right) if right else size-1)
            else:
                start = max(0, size-int(right))
            if start >= size or end < start:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.end_headers(); return
            status = 206
        self.send_response(status)
        self.send_header('Content-Type', mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(max(0, end-start+1)))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        if status == 206: self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        if download: self.send_header('Content-Disposition', 'attachment; filename="tutorial-cleaned.mp4"')
        self.end_headers()
        with path.open('rb') as source:
            source.seek(start)
            remaining = end-start+1
            while remaining > 0:
                chunk = source.read(min(1024*1024, remaining))
                if not chunk: break
                self.wfile.write(chunk)
                remaining -= len(chunk)


def make_server(port=8765, data_root=None):
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.token = secrets.token_urlsafe(32)
    server.store = ProjectStore(data_root or ROOT/'data')
    server.jobs = JobManager(server.store)
    server.picker_lock = threading.Lock()
    return server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--open', action='store_true')
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    for executable in ('ffmpeg', 'ffprobe'):
        if not shutil.which(executable):
            raise SystemExit(f'{executable} is missing. Install FFmpeg and add its bin folder to PATH; then restart.')
    try: server = make_server(args.port)
    except OSError:
        raise SystemExit(f'Port {args.port} is busy. Open the running editor or run with --port 8766.')
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'Tutorial Audio Editor: {url}\nKeep this window open. Ctrl+C stops the editor.', flush=True)
    if args.open: threading.Timer(.5, lambda: webbrowser.open(url)).start()
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally:
        server.jobs.close()
        server.server_close()


if __name__ == '__main__': main()
