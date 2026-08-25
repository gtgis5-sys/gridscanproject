from app.services.las_loader import load_point_cloud
from app.services.pole_detection import detect_poles


def test_detects_correct_number_of_poles(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    pole_points = pc.class_points(18)

    poles = detect_poles(pole_points, eps=0.5, min_samples=10)

    assert len(poles) == synthetic_las_path["expected_pole_count"]


def test_poles_sorted_along_corridor(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)

    ys = [p.y for p in poles]
    assert ys == sorted(ys)


def test_pole_heights_approximately_correct(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)

    expected_heights = [8.0, 9.0, 8.5]
    for pole, expected in zip(poles, expected_heights):
        assert abs(pole.height_m - expected) < 0.15  # uniform random pole points, small tolerance


def test_no_pole_points_raises_value_error():
    import numpy as np
    with __import__("pytest").raises(ValueError):
        detect_poles(np.empty((0, 3)), eps=0.5, min_samples=10)
