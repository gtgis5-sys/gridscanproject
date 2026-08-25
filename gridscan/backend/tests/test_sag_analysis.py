from app.services.las_loader import load_point_cloud
from app.services.pole_detection import detect_poles
from app.services.span_generation import generate_spans
from app.services.conductor_extraction import extract_conductors_for_span


def test_finds_one_conductor_per_span(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)
    spans = generate_spans(poles)
    conductor_points = pc.class_points_multi([21])

    for span in spans:
        conductors = extract_conductors_for_span(
            span, conductor_points, buffer=0.3, eps=0.5, min_samples=10,
            min_conductor_points=20, curve_fit_degree=2,
        )
        assert len(conductors) == 1


def test_recovered_sag_close_to_known_value(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)
    spans = generate_spans(poles)
    conductor_points = pc.class_points_multi([21])

    expected_sags = synthetic_las_path["expected_sags"]

    for span, expected_sag in zip(spans, expected_sags):
        conductors = extract_conductors_for_span(
            span, conductor_points, buffer=0.3, eps=0.5, min_samples=10,
            min_conductor_points=20, curve_fit_degree=2,
        )
        assert abs(conductors[0].sag_m - expected_sag) < 0.15


def test_wire_length_exceeds_straight_line_distance(synthetic_las_path):
    """A sagging wire must always be longer than the straight pole-to-pole distance."""
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)
    spans = generate_spans(poles)
    conductor_points = pc.class_points_multi([21])

    for span in spans:
        conductors = extract_conductors_for_span(
            span, conductor_points, buffer=0.3, eps=0.5, min_samples=10,
            min_conductor_points=20, curve_fit_degree=2,
        )
        assert conductors[0].wire_length_m > span.distance_m
