"""FFmpeg adapter. All media stays inside a project directory."""
import json
import math
import subprocess
import wave
from pathlib import Path
import numpy as np
from audio import PRESETS, apply_regions, validate_settings


def probe(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams',
                             '-of', 'json', str(path)], capture_output=True, timeout=60)
    if result.returncode:
        raise ValueError('Cannot read this video. Choose a valid video file.')
    data = json.loads(result.stdout)
    videos = [s for s in data['streams'] if s['codec_type'] == 'video' and not s.get('disposition', {}).get('attached_pic')]
    tracks = [s for s in data['streams'] if s['codec_type'] == 'audio']
    if not videos or not tracks:
        raise ValueError('The file needs a video stream and an audio track.')
    video = videos[0]
    duration = float(video.get('duration') or data['format'].get('duration', 0))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError('Could not determine the video duration.')
    return dict(duration=duration, video=video, audio_tracks=tracks)


def ff(job, args, label):
    job.update(label)
    job.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)])


def prepare(project_dir, source, audio_index, job):
    meta = probe(source)
    track = next((a for a in meta['audio_tracks'] if a['index'] == audio_index), None)
    if track is None:
        raise ValueError('Select an audio track from this video.')
    video = meta['video']
    duration = meta['duration']
    sr, channels = int(track.get('sample_rate', 48000)), min(2, int(track.get('channels', 1)))
    if sr not in (44100, 48000, 96000):
        sr = 48000
    offset = float(track.get('start_time', 0))-float(video.get('start_time', 0))
    filters = ['asetpts=PTS-STARTPTS']
    if offset < 0:
        filters += [f'atrim=start={-offset}', 'asetpts=PTS-STARTPTS']
    elif offset > 0:
        filters += [f'adelay={round(offset*1000)}:all=1']
    filters += ['apad', f'atrim=duration={duration}']
    ff(job, ['-i', source, '-map', f'0:{audio_index}', '-vn', '-af', ','.join(filters),
             '-ar', sr, '-ac', channels, '-f', 'f32le', project_dir/'original.f32'], 'Preparing aligned audio')
    ff(job, ['-f', 'f32le', '-ar', sr, '-ac', channels, '-i', project_dir/'original.f32',
             '-c:a', 'pcm_s16le', project_dir/'original.wav'], 'Preparing original comparison')
    # Explicit timestamp offset handles a video track that begins after other tracks.
    codec = video['codec_name']
    copy = codec == 'h264' and video.get('pix_fmt') == 'yuv420p'
    video_args = ['-c:v', 'copy'] if copy else ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p']
    ff(job, ['-copyts', '-itsoffset', str(-float(video.get('start_time', 0))),
             '-i', source, '-map', f"0:{video['index']}", '-an', *video_args,
             '-movflags', '+faststart', project_dir/'video.mp4'],
       'Preparing video preview' if copy else 'Converting video to H.264 for browser playback')
    raw = np.memmap(project_dir/'original.f32', dtype='<f4', mode='r').reshape(-1, channels)
    block = max(1, math.ceil(len(raw)/2400))
    peaks = [float(np.max(np.abs(raw[i:i+block]))) for i in range(0, len(raw), block)]
    del raw
    (project_dir/'waveform.json').write_text(json.dumps(peaks), encoding='utf-8')
    return dict(duration=duration, channels=channels, sample_rate=sr, audio_index=audio_index,
                audio_tracks=meta['audio_tracks'], video_copied=copy, audio_offset=offset,
                conversion=f'Audio processing: {sr} Hz, {channels} channel(s). '+
                ('Original H.264 video preserved.' if copy else 'Video converted to H.264 for preview and export.'))


def render(project_dir, settings, revision, job):
    info = json.loads((project_dir/'project.json').read_text(encoding='utf-8'))
    settings = validate_settings(settings, info['duration'])
    sr, channels = info['sample_rate'], info['channels']
    raw_path = project_dir/'original.f32'
    strength = PRESETS[settings['noise']]
    if strength:
        filters = f'afftdn=nr={strength}:nf=-50:tn=1:gs=8'
        if settings['profile']:
            # Measure the selected noise independently, then use its RMS as noise floor.
            source = np.memmap(raw_path, dtype='<f4', mode='r').reshape(-1, channels)
            p = settings['profile']
            section = source[round(p['start']*sr):round(p['end']*sr)]
            rms = float(np.sqrt(np.mean(section.astype(np.float64)**2)))
            floor = min(-20, max(-80, 20*math.log10(max(rms, 1e-8))))
            del section, source
            filters = f'afftdn=nr={strength}:nf={floor}:gs=8'
        raw_path = project_dir/f'denoised-{revision}.f32'
        # afftdn is a two-hop overlap/add filter: retain its tail, then remove its delay.
        delay = 2*(sr//80)
        frames = (project_dir/'original.f32').stat().st_size//(4*channels)
        filters = f'apad=pad_len={delay},'+filters+f',atrim=start_sample={delay}:end_sample={frames+delay},asetpts=PTS-STARTPTS'
        ff(job, ['-f', 'f32le', '-ar', sr, '-ac', channels, '-i', project_dir/'original.f32',
                 '-af', filters, '-f', 'f32le', raw_path], 'Reducing background noise')
    raw = np.memmap(raw_path, dtype='<f4', mode='r').reshape(-1, channels)
    expected = (project_dir/'original.f32').stat().st_size//(4*channels)
    target = project_dir/f'clean-{revision}.wav'
    temporary = project_dir/f'clean-{revision}.partial.wav'
    try:
        with wave.open(str(temporary), 'wb') as output:
            output.setparams((channels, 2, sr, 0, 'NONE', 'not compressed'))
            for start in range(0, expected, sr*5):
                job.check()
                end = min(expected, start+sr*5)
                chunk = np.zeros((end-start, channels), dtype=np.float32)
                available = raw[start:min(end, len(raw))]
                chunk[:len(available)] = available
                result = apply_regions(chunk, sr, settings['regions'], offset=start)
                output.writeframes((np.clip(result, -1, 1)*32767).astype('<i2').tobytes())
                job.update('Applying breath edits', start/max(1, expected))
        job.check()
        temporary.replace(target)
    finally:
        # Slice references can keep the underlying mapping alive on Windows.
        raw._mmap.close()
        temporary.unlink(missing_ok=True)
    if strength:
        raw_path.unlink(missing_ok=True)
    return target


def export(project_dir, revision, job):
    info = json.loads((project_dir/'project.json').read_text(encoding='utf-8'))
    audio = project_dir/f'clean-{revision}.wav'
    if not audio.is_file():
        raise ValueError('Generate a cleaned preview before exporting.')
    output = project_dir/f'export-{revision}.partial.mp4'
    ff(job, ['-i', project_dir/'video.mp4', '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
             '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output], 'Exporting MP4')
    result = probe(output)
    if abs(result['duration']-info['duration']) > .15:
        output.unlink(missing_ok=True)
        raise ValueError('Export duration did not match the source; output was not published.')
    if abs(float(result['video'].get('start_time', 0))) > .05 or abs(float(result['audio_tracks'][0].get('start_time', 0))) > .05:
        raise ValueError('Export start times did not match; output was not published.')
    job.check()
    target = project_dir/f'export-{revision}.mp4'
    output.replace(target)
    return target
