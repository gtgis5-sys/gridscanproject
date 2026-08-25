"""
Span generation.

Direct port of the notebook's approach: once poles are sorted along the
corridor, generate one span between each pair of *adjacent* poles and
compute the straight-line pole-to-pole distance.
"""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np
from app.services.pole_detection import DetectedPole


@dataclass
class GeneratedSpan:
    id: int
    start_pole: int
    end_pole: int
    distance_m: float
    pole1: DetectedPole
    pole2: DetectedPole


def generate_spans(poles: list[DetectedPole]) -> list[GeneratedSpan]:
    """
    Build one span per adjacent pole pair, in corridor order.

    Distance uses full 3D norm between pole centers (the notebook used the
    2D XY norm in its first pass and the full center-to-center norm in its
    later, more complete pass — we use the 3D norm since pole elevation
    differences are part of the true structural span distance).
    """
    if len(poles) < 2:
        raise ValueError(
            f"Need at least 2 poles to generate spans, found {len(poles)}. "
            "Check pole detection parameters."
        )

    spans: list[GeneratedSpan] = []
    for i in range(len(poles) - 1):
        p1, p2 = poles[i], poles[i + 1]
        distance = float(np.linalg.norm(p2.center_xyz - p1.center_xyz))
        spans.append(GeneratedSpan(
            id=i,
            start_pole=p1.index,
            end_pole=p2.index,
            distance_m=distance,
            pole1=p1,
            pole2=p2,
        ))

    return spans
