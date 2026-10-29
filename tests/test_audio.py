import unittest
import numpy as np
from audio import validate_settings, apply_regions


class AudioTests(unittest.TestCase):
    def test_validation(self):
        for region in [dict(start=float('nan'), end=1, reduction_db=12),
                       dict(start=2, end=1, reduction_db=12),
                       dict(start=0, end=4, reduction_db=12),
                       dict(start=0, end=1, reduction_db=37)]:
            with self.assertRaises(ValueError):
                validate_settings({'noise': 'off', 'regions': [region]}, 3)

    def test_gain_overlap_and_length(self):
        samples = np.ones((3000, 2), dtype=np.float32)
        regions = [dict(start=.5, end=2, reduction_db=12),
                   dict(start=1, end=1.5, reduction_db=24)]
        result = apply_regions(samples, 1000, regions)
        self.assertEqual(result.shape, samples.shape)
        np.testing.assert_array_equal(result[:400], samples[:400])
        self.assertAlmostEqual(float(result[750, 0]), 10**(-12/20), places=5)
        self.assertAlmostEqual(float(result[1250, 1]), 10**(-24/20), places=5)
        self.assertLess(float(np.max(np.abs(np.diff(result[:, 0])))), .15)

    def test_empty_and_tiny_regions(self):
        samples = np.ones((100, 1), dtype=np.float32)
        np.testing.assert_array_equal(apply_regions(samples, 1000, []), samples)
        result = apply_regions(samples, 1000, [dict(start=.01, end=.011, reduction_db=36)])
        self.assertEqual(len(result), 100)
        self.assertTrue(np.isfinite(result).all())
        self.assertGreaterEqual(float(result.min()), 10**(-36/20)-1e-6)


if __name__ == '__main__':
    unittest.main()
