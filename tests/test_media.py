import json
import subprocess
import tempfile
import unittest
import wave
from pathlib import Path
import numpy as np
from media import probe, prepare, render, export


class DirectJob:
    def update(self, *args): pass
    def check(self): pass
    def run(self, args, **kwargs):
        return subprocess.run(args, check=True, capture_output=True, **kwargs)


class MediaTests(unittest.TestCase):
    def test_denoising_latency(self):
        for sr in (44100, 48000, 96000):
            with self.subTest(sample_rate=sr), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)
                samples = np.zeros(sr*2, dtype='<f4')
                samples[sr] = .8
                samples[-100] = .6
                samples.tofile(root/'original.f32')
                (root/'project.json').write_text(json.dumps(dict(duration=2, sample_rate=sr, channels=1)))
                rendered = render(root, dict(noise='gentle', regions=[]), 1, DirectJob())
                with wave.open(str(rendered)) as wav:
                    out = np.frombuffer(wav.readframes(wav.getnframes()), dtype='<i2')
                self.assertEqual(len(out), len(samples))
                self.assertLessEqual(abs(int(np.argmax(np.abs(out)))-sr), 1)
                self.assertGreater(abs(int(out[-100])), 1000)

    def test_unicode_offset_and_export(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'tutoriel été space.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i',
                            'color=c=blue:s=320x180:r=25:d=3', '-itsoffset', '0.5',
                            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2',
                            '-c:v', 'libx264', '-c:a', 'aac', str(source)], check=True)
            metadata = probe(source)
            self.assertEqual(len(metadata['audio_tracks']), 1)
            info = prepare(root, source, metadata['audio_tracks'][0]['index'], DirectJob())
            (root/'project.json').write_text(json.dumps(dict(info, source=source.name)), encoding='utf-8')
            original = np.fromfile(root/'original.f32', dtype='<f4').reshape(-1, info['channels'])
            self.assertLess(np.max(np.abs(original[:10000])), .001)
            settings = dict(noise='off', regions=[dict(start=1, end=1.5, reduction_db=12)])
            rendered = render(root, settings, 1, DirectJob())
            with wave.open(str(rendered)) as wav:
                cleaned = np.frombuffer(wav.readframes(wav.getnframes()), dtype='<i2').reshape(-1, info['channels'])/32768
            self.assertEqual(len(cleaned), len(original))
            a, b = int(1.1*info['sample_rate']), int(1.4*info['sample_rate'])
            ratio = np.sqrt(np.mean(cleaned[a:b]**2)/np.mean(original[a:b]**2))
            self.assertAlmostEqual(float(ratio), 10**(-12/20), places=3)
            output = export(root, 1, DirectJob())
            result = probe(output)
            self.assertAlmostEqual(result['duration'], info['duration'], delta=.1)
            self.assertEqual(len(result['audio_tracks']), 1)
            # Denoising must release all mapped views before removing its scratch file on Windows.
            settings['noise'] = 'medium'
            render(root, settings, 2, DirectJob())
            self.assertFalse((root/'denoised-2.f32').exists())
            settings['profile'] = dict(start=0, end=.2)
            render(root, settings, 3, DirectJob())
            previous = rendered.read_bytes()
            class StopJob(DirectJob):
                def check(self): raise RuntimeError('cancelled')
            settings['noise'] = 'off'
            with self.assertRaises(RuntimeError): render(root, settings, 1, StopJob())
            self.assertEqual(rendered.read_bytes(), previous)

    def test_invalid_media(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'bad.mp4'
            path.write_bytes(b'not a video')
            with self.assertRaises((ValueError, subprocess.CalledProcessError)):
                probe(path)

    def test_delayed_video_is_rebased(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root/'delayed-video.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-itsoffset', '1',
                            '-f', 'lavfi', '-i', 'color=s=320x180:r=25:d=3',
                            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
                            '-fps_mode', 'passthrough', '-c:v', 'libx264', '-c:a', 'aac', str(source)], check=True)
            info = prepare(root, source, 1, DirectJob())
            data = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(root/'video.mp4')]))
            self.assertAlmostEqual(float(data['streams'][0]['start_time']), 0, delta=.01)
            self.assertAlmostEqual(info['audio_offset'], -1, delta=.03)
