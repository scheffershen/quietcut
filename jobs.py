"""Single-worker jobs with subprocess cancellation and revision-safe publication."""
import concurrent.futures
import subprocess
import threading
import time
import uuid


class Cancelled(Exception): pass


class Job:
    def __init__(self, project_id, kind, revision):
        self.id = str(uuid.uuid4())
        self.project_id, self.kind, self.revision = project_id, kind, revision
        self.state, self.message, self.progress = 'queued', 'Waiting', 0
        self.event = threading.Event()
        self.process = None

    def snapshot(self):
        return dict(id=self.id, project_id=self.project_id, kind=self.kind, revision=self.revision,
                    state=self.state, message=self.message, progress=self.progress)

    def check(self):
        if self.event.is_set(): raise Cancelled()

    def update(self, message, progress=None):
        self.check()
        self.message = message
        if progress is not None: self.progress = progress

    def run(self, args):
        self.check()
        # communicate drains stderr while polling, preventing a pipe-buffer deadlock.
        self.process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                        creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        try:
            while True:
                if self.event.is_set():
                    self.process.kill()
                    self.process.communicate()
                    raise Cancelled()
                try:
                    out, err = self.process.communicate(timeout=.2)
                    break
                except subprocess.TimeoutExpired:
                    continue
            if self.process.returncode:
                raise ValueError(err.decode('utf-8', errors='replace')[-1800:] or 'Media processing failed.')
            return subprocess.CompletedProcess(args, 0, out, err)
        finally:
            self.process = None


class JobManager:
    def __init__(self, store):
        self.store, self.items = store, {}
        self.pool = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        self.lock = threading.Lock()

    def submit(self, project_id, kind, revision, operation):
        with self.lock:
            if any(j.project_id == project_id and j.state in ('queued', 'running') for j in self.items.values()):
                raise ValueError('This project already has a job. Wait or cancel it first.')
            job = Job(project_id, kind, revision)
            self.items[job.id] = job
            self.pool.submit(self._execute, job, operation)
            return job.snapshot()

    def _execute(self, job, operation):
        try:
            job.check()
            job.state = 'running'
            changes = operation(job) or {}
            job.check()
            with self.store.lock:
                data = self.store.get(job.project_id)
                if data['revision'] != job.revision:
                    raise ValueError('Settings changed during processing. Generate a new preview.')
                self.store.update(job.project_id, **changes)
            job.state, job.message, job.progress = 'completed', 'Done', 1
        except Cancelled:
            job.state, job.message = 'cancelled', 'Cancelled; incomplete output is unavailable.'
        except Exception as error:
            job.state, job.message = 'failed', str(error)
        finally:
            if job.kind == 'prepare' and job.state != 'completed':
                try: self.store.update(job.project_id, state='failed', error=job.message)
                except ValueError: pass

    def status(self, job_id):
        if job_id not in self.items: raise ValueError('Unknown job.')
        return self.items[job_id].snapshot()

    def cancel(self, job_id):
        if job_id not in self.items: raise ValueError('Unknown job.')
        self.items[job_id].event.set()
        return self.status(job_id)

    def delete_project(self, project_id):
        for job in list(self.items.values()):
            if job.project_id == project_id and job.state in ('queued', 'running'):
                job.event.set()
                deadline = time.monotonic()+10
                while job.state in ('queued', 'running') and time.monotonic() < deadline:
                    time.sleep(.02)
                if job.state in ('queued', 'running'):
                    raise ValueError('Cancellation is still finishing. Try deleting again shortly.')
        self.store.delete(project_id)

    def close(self):
        for job in self.items.values(): job.event.set()
        self.pool.shutdown(wait=True, cancel_futures=True)
