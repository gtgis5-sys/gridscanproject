"""
Synthetic LAS fixture for testing.

We don't have a real clip.las sample in this environment, so this builds a
synthetic point cloud with KNOWN geometry (pole positions, heights, span
distances, and a parabolic sag profile) so we can assert the pipeline
recovers those exact numbers. This is a TEST FIXTURE ONLY — it never ships
in the app and the app never falls back to it; production runs always
require a real uploaded LAS/LAZ file.
"""
import numpy as np
import laspy
import pytest


def _make_pole(cx, cy, base_z, height, n_points=400, radius=0.15, rng=None):
    rng = rng or np.random.default_rng(0)
    z = rng.uniform(base_z, base_z + height, n_points)
    theta = rng.uniform(0, 2 * np.pi, n_points)
    r = rng.uniform(0, radius, n_points)
    x = cx + r * np.cos(theta)
    y = cy + r * np.sin(theta)
    return np.column_stack([x, y, z])


def _make_conductor(y_start, y_end, x, z_pole, sag, n_points=300, noise=0.01, rng=None):
    """Parabolic wire between two poles at the same X, sagging by `sag` meters at midspan."""
    rng = rng or np.random.default_rng(1)
    y = np.linspace(y_start, y_end, n_points)
    y_mid = (y_start + y_end) / 2
    half_span = (y_end - y_start) / 2
    # parabola: z = z_pole - sag * (1 - ((y - y_mid)/half_span)^2)
    z = z_pole - sag * (1 - ((y - y_mid) / half_span) ** 2)
    z += rng.normal(0, noise, n_points)
    x_arr = np.full_like(y, x) + rng.normal(0, 0.02, n_points)
    return np.column_stack([x_arr, y, z])


@pytest.fixture
def synthetic_las_path(tmp_path):
    """
    Builds a 3-pole, 2-span synthetic corridor:
      Pole 0 at y=0,   height 8.0m, base_z=100
      Pole 1 at y=25,  height 9.0m, base_z=100.2
      Pole 2 at y=50,  height 8.5m, base_z=100.1

    Each span has one conductor (class 21) sagging by a known amount so the
    pipeline's recovered sag can be checked against ground truth.
    """
    rng = np.random.default_rng(42)

    pole_specs = [
        (0.0, 0.0, 100.0, 8.0),
        (0.5, 25.0, 100.2, 9.0),
        (0.2, 50.0, 100.1, 8.5),
    ]
    pole_pts = np.vstack([_make_pole(cx, cy, bz, h, rng=rng) for cx, cy, bz, h in pole_specs])

    conductor_top_z = [100.0 + 8.0, 100.2 + 9.0, 100.1 + 8.5]  # attach near pole top
    known_sags = [0.8, 1.2]  # span0-1 sag, span1-2 sag -- used by the test to assert against

    cond1 = _make_conductor(0.0, 25.0, x=0.25, z_pole=min(conductor_top_z[0], conductor_top_z[1]) - 0.5,
                             sag=known_sags[0], rng=rng)
    cond2 = _make_conductor(25.0, 50.0, x=0.35, z_pole=min(conductor_top_z[1], conductor_top_z[2]) - 0.5,
                             sag=known_sags[1], rng=rng)
    conductor_pts = np.vstack([cond1, cond2])

    # Some ground + "other" noise so classification_breakdown has more than one class
    ground_pts = np.column_stack([
        rng.uniform(-5, 5, 500),
        rng.uniform(-5, 55, 500),
        rng.uniform(99.5, 99.7, 500),
    ])

    all_points = np.vstack([pole_pts, conductor_pts, ground_pts])
    classifications = np.concatenate([
        np.full(len(pole_pts), 18, dtype=np.uint8),
        np.full(len(conductor_pts), 21, dtype=np.uint8),
        np.full(len(ground_pts), 2, dtype=np.uint8),
    ])

    header = laspy.LasHeader(point_format=3, version="1.2")
    header.offsets = all_points.min(axis=0)
    header.scales = [0.001, 0.001, 0.001]

    las = laspy.LasData(header)
    las.x = all_points[:, 0]
    las.y = all_points[:, 1]
    las.z = all_points[:, 2]
    las.classification = classifications

    path = tmp_path / "synthetic.las"
    las.write(str(path))

    return {
        "path": str(path),
        "expected_pole_count": 3,
        "expected_span_count": 2,
        "expected_span_distances": [
            float(np.linalg.norm(np.array([0.5, 25.0, 100.2]) - np.array([0.0, 0.0, 100.0]))),
            float(np.linalg.norm(np.array([0.2, 50.0, 100.1]) - np.array([0.5, 25.0, 100.2]))),
        ],
        "expected_sags": known_sags,
    }
