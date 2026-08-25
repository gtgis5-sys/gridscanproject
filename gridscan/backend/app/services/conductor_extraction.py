"""
Conductor extraction and sag analysis.

Direct port of the notebook's per-span workflow, generalized to run over
every span automatically instead of being hand-copied 7 times:

  1. Crop conductor-class points to a bounding box around the pole pair
     (+ buffer margin), exactly like `extract_span_wire()` in the notebook.
  2. DBSCAN cluster the cropped points — each cluster is one physical
     conductor (e.g. an upper and lower wire on the same span).
  3. Sort each conductor's points along Y and sum consecutive segment
     lengths for wire length (matches `calculate_wire_length()`).
  4. Fit a parabola z = a*y_local^2 + b*y_local + c via np.polyfit degree 2
     (matches every per-span cell in the notebook) and take
     sag = z_fit.max() - z_fit.min().
  5. Label conductors by relative mean Z within the span ("Upper", "Lower",
     or "Wire N" if there are more than two).
"""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np
from sklearn.cluster import DBSCAN

from app.services.span_generation import GeneratedSpan


@dataclass
class ExtractedConductor:
    span_id: int
    label: str
    point_count: int
    wire_length_m: float
    sag_m: float
    lowest_point: list[float]
    curve_coeffs: list[float]


def _crop_span_points(pole1_xyz: np.ndarray, pole2_xyz: np.ndarray,
                       conductor_points: np.ndarray, buffer: float) -> np.ndarray:
    """Bounding-box crop between two poles, matching extract_span_wire()."""
    xmin = min(pole1_xyz[0], pole2_xyz[0]) - buffer
    xmax = max(pole1_xyz[0], pole2_xyz[0]) + buffer
    ymin = min(pole1_xyz[1], pole2_xyz[1]) - buffer
    ymax = max(pole1_xyz[1], pole2_xyz[1]) + buffer

    mask = (
        (conductor_points[:, 0] >= xmin) & (conductor_points[:, 0] <= xmax) &
        (conductor_points[:, 1] >= ymin) & (conductor_points[:, 1] <= ymax)
    )
    return conductor_points[mask]


def _wire_length(sorted_points: np.ndarray) -> float:
    """Sum of consecutive point-to-point distances, matching calculate_wire_length()."""
    if len(sorted_points) < 2:
        return 0.0
    diffs = np.diff(sorted_points, axis=0)
    segment_lengths = np.linalg.norm(diffs, axis=1)
    return float(np.sum(segment_lengths))


def extract_conductors_for_span(
    span: GeneratedSpan,
    conductor_points: np.ndarray,
    buffer: float,
    eps: float,
    min_samples: int,
    min_conductor_points: int,
    curve_fit_degree: int,
) -> list[ExtractedConductor]:
    """
    Crop, cluster, and analyze every conductor within a single span.

    Returns one ExtractedConductor per valid cluster (noise and
    below-min-size clusters are discarded).
    """
    span_points = _crop_span_points(span.pole1.center_xyz, span.pole2.center_xyz,
                                     conductor_points, buffer)

    if len(span_points) < min_samples:
        return []

    labels = DBSCAN(eps=eps, min_samples=min_samples).fit_predict(span_points)
    valid_labels = [lbl for lbl in np.unique(labels) if lbl != -1]

    clusters = []
    for lbl in valid_labels:
        cluster = span_points[labels == lbl]
        if len(cluster) < min_conductor_points:
            continue
        clusters.append(cluster)

    if not clusters:
        return []

    # Order conductors top-to-bottom by mean Z so labeling is stable/meaningful
    clusters.sort(key=lambda c: -c[:, 2].mean())

    conductors: list[ExtractedConductor] = []
    for i, cluster in enumerate(clusters):
        label = _label_for_index(i, len(clusters))

        sorted_cluster = cluster[np.argsort(cluster[:, 1])]
        wire_length = _wire_length(sorted_cluster)

        y = cluster[:, 1]
        y0 = y.min()
        y_local = y - y0
        z = cluster[:, 2]

        coeffs = np.polyfit(y_local, z, curve_fit_degree)
        z_fit = np.polyval(coeffs, y_local)
        sag = float(z_fit.max() - z_fit.min())

        lowest_idx = int(np.argmax(z_fit))  # highest z_fit value = the "top" of the parabola
        # lowest point on the wire = minimum actual Z within the cluster
        lowest_point_idx = int(np.argmin(cluster[:, 2]))
        lowest_point = cluster[lowest_point_idx].tolist()

        conductors.append(ExtractedConductor(
            span_id=span.id,
            label=label,
            point_count=int(len(cluster)),
            wire_length_m=wire_length,
            sag_m=sag,
            lowest_point=lowest_point,
            curve_coeffs=[float(c) for c in coeffs],
        ))

    return conductors


def _label_for_index(i: int, total: int) -> str:
    if total == 1:
        return "Wire"
    if total == 2:
        return "Upper" if i == 0 else "Lower"
    return f"Wire {i + 1}"
