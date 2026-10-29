import tempfile
import time
import unittest
import sys
from pathlib import Path
from projects import ProjectStore
from jobs import JobManager


class StateTests(unittest.TestCase):
    def test_restart_and_process_cancellation(self):
        with tempfile.TemporaryDirectory() as folder:
            store = ProjectStore(Path(folder))
            p = store.create('interrupted.mp4')
            store.update(p['id'], state='preparing')
            recovered = ProjectStore(Path(folder))
            self.assertEqual(recovered.get(p['id'])['state'], 'failed')
            manager = JobManager(recovered)
            def operation(job):
                job.run([sys.executable, '-c', 'import time; time.sleep(60)'])
            item = manager.submit(p['id'], 'render', 0, operation)
            for _ in range(100):
                if manager.items[item['id']].process is not None: break
                time.sleep(.01)
            with self.assertRaises(ValueError):
                manager.submit(p['id'], 'render', 0, operation)
            manager.cancel(item['id'])
            manager.close()
            self.assertEqual(manager.status(item['id'])['state'], 'cancelled')
            self.assertIsNone(manager.items[item['id']].process)

    def test_persistence_and_containment(self):
        with tempfile.TemporaryDirectory() as folder:
            store = ProjectStore(Path(folder))
            p = store.create('test.mp4')
            store.update(p['id'], duration=3, state='ready')
            self.assertEqual(ProjectStore(Path(folder)).get(p['id'])['duration'], 3)
            for name in ['../outside', '/absolute', 'unknown']:
                with self.assertRaises(ValueError): store.get(name)
            with self.assertRaises(ValueError): store.media_path(p['id'], '../outside')
            store.delete(p['id'])
            with self.assertRaises(ValueError): store.get(p['id'])

    def test_cancel_and_stale_revision(self):
        with tempfile.TemporaryDirectory() as folder:
            store = ProjectStore(Path(folder))
            p = store.create('test.mp4')
            store.update(p['id'], duration=3, state='ready')
            manager = JobManager(store)
            def slow(job):
                while True:
                    job.check()
                    time.sleep(.01)
            item = manager.submit(p['id'], 'render', 0, slow)
            manager.cancel(item['id'])
            for _ in range(100):
                if manager.status(item['id'])['state'] == 'cancelled': break
                time.sleep(.02)
            self.assertEqual(manager.status(item['id'])['state'], 'cancelled')
            store.save_settings(p['id'], dict(noise='off', regions=[]))
            def stale(job): return {'rendered_revision': 0}
            item = manager.submit(p['id'], 'render', 0, stale)
            for _ in range(100):
                if manager.status(item['id'])['state'] not in ('queued', 'running'): break
                time.sleep(.02)
            self.assertEqual(manager.status(item['id'])['state'], 'failed')
            self.assertIsNone(store.get(p['id'])['rendered_revision'])
            manager.close()
