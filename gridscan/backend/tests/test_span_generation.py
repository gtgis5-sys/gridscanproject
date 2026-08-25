from app.services.las_loader import load_point_cloud
from app.services.pole_detection import detect_poles
from app.services.span_generation import generate_spans


def test_generates_correct_number_of_spans(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)
    spans = generate_spans(poles)

    assert len(spans) == synthetic_las_path["expected_span_count"]


def test_span_distances_match_expected(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)
    spans = generate_spans(poles)

    for span, expected_dist in zip(spans, synthetic_las_path["expected_span_distances"]):
        assert abs(span.distance_m - expected_dist) < 0.3  # cluster-center jitter tolerance


def test_spans_reference_adjacent_poles_only(synthetic_las_path):
    pc = load_point_cloud(synthetic_las_path["path"], "synthetic.las")
    poles = detect_poles(pc.class_points(18), eps=0.5, min_samples=10)
    spans = generate_spans(poles)

    for span in spans:
        assert span.end_pole == span.start_pole + 1
