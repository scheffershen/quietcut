"""Atomic project persistence and strict project-owned path lookup."""
import json
import shutil
import threading
import time
import uuid
from pathlib import Path
from audio import validate_settings


class ProjectStore:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        for path in self.root.glob('*/project.json'):
            try:
                data = json.loads(path.read_text(encoding='utf-8'))
                if data.get('state') in ('uploading', 'preparing'):
                    self.update(data['id'], state='failed', error='Preparation was interrupted. Import again.')
            except (ValueError, OSError, KeyError):
                continue

    def directory(self, project_id):
        try:
            if str(uuid.UUID(project_id)) != project_id:
                raise ValueError()
        except (ValueError, AttributeError):
            raise ValueError('Unknown project.') from None
        path = (self.root/project_id).resolve()
        if path.parent != self.root:
            raise ValueError('Invalid project path.')
        return path

    def get(self, project_id):
        with self.lock:
            try:
                return json.loads((self.directory(project_id)/'project.json').read_text(encoding='utf-8'))
            except FileNotFoundError:
                raise ValueError('Unknown project.') from None

    def update(self, project_id, **changes):
        with self.lock:
            data = self.get(project_id)
            data.update(changes)
            self._write(data)
            return data

    def _write(self, data):
        path = self.directory(data['id'])/'project.json'
        temporary = path.with_suffix('.tmp')
        temporary.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        temporary.replace(path)

    def create(self, name):
        with self.lock:
            project_id = str(uuid.uuid4())
            self.directory(project_id).mkdir()
            data = dict(id=project_id, name=name, version=1, revision=0, rendered_revision=None,
                        exported_revision=None, state='uploading', source='source.media',
                        settings=dict(noise='gentle', regions=[], profile=None))
            self._write(data)
            return data

    def list(self):
        result = []
        for path in sorted(self.root.glob('*/project.json'), key=lambda p: p.stat().st_mtime, reverse=True):
            try: result.append(self.get(path.parent.name))
            except (ValueError, OSError): pass
        return result

    def save_settings(self, project_id, settings):
        with self.lock:
            data = self.get(project_id)
            if data['state'] != 'ready':
                raise ValueError('Wait for video preparation to finish.')
            clean = validate_settings(settings, data['duration'])
            if clean == data['settings']:
                return data
            return self.update(project_id, settings=clean, revision=data['revision']+1,
                               exported_revision=None)

    def media_path(self, project_id, name):
        self.get(project_id)
        path = (self.directory(project_id)/name).resolve()
        if path.parent != self.directory(project_id) or name == 'project.json':
            raise ValueError('Invalid media path.')
        return path

    def delete(self, project_id):
        with self.lock:
            self.get(project_id)
            directory = self.directory(project_id)
            # Browser range responses can take a moment to release Windows file handles.
            for attempt in range(30):
                try:
                    shutil.rmtree(directory)
                    return
                except PermissionError:
                    if attempt == 29: raise
                    time.sleep(.1)
