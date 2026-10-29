"""Validated cleanup settings and duration-preserving breath gain envelopes."""
import math
import numpy as np

PRESETS = {'off': 0, 'gentle': 6, 'medium': 12, 'strong': 18}


def number(value):
    value = float(value)
    if not math.isfinite(value):
        raise ValueError('Times and levels must be finite numbers.')
    return value


def validate_settings(settings, duration):
    noise = settings.get('noise', 'gentle')
    if noise not in PRESETS:
        raise ValueError('Choose a supported noise preset.')
    regions = settings.get('regions', [])
    if not isinstance(regions, list) or len(regions) > 2000:
        raise ValueError('Use at most 2000 breath regions.')
    clean = []
    for region in regions:
        start, end, reduction = (number(region[k]) for k in ('start', 'end', 'reduction_db'))
        if not 0 <= start < end <= duration or not 0 <= reduction <= 36:
            raise ValueError('Breath regions must be inside the video; reduction must be 0–36 dB.')
        clean.append(dict(start=start, end=end, reduction_db=reduction))
    profile = settings.get('profile')
    if profile is not None:
        start, end = number(profile['start']), number(profile['end'])
        if not 0 <= start < end <= duration or end-start < .1:
            raise ValueError('Select at least 0.1 seconds containing noise only.')
        profile = dict(start=start, end=end)
    return dict(noise=noise, regions=clean, profile=profile)


def apply_regions(samples, sample_rate, regions, offset=0):
    """Process a chunk at frame offset without allocating a whole-file envelope."""
    envelope = np.ones(len(samples), dtype=np.float32)
    for region in regions:
        first, last = round(region['start']*sample_rate), round(region['end']*sample_rate)
        lo, hi = max(first, offset), min(last, offset+len(samples))
        if hi <= lo:
            continue
        ramp = max(1, min(round(.01*sample_rate), (last-first)//2))
        positions = np.arange(lo, hi)
        depth = np.minimum(1, np.minimum((positions-first+1)/ramp, (last-positions)/ramp))
        gain = 1-depth*(1-10**(-region['reduction_db']/20))
        target = envelope[lo-offset:hi-offset]
        np.minimum(target, gain, out=target)
    return samples * envelope[:, None]
