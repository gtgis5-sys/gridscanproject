"""
Pole detection.

Direct port of the notebook's workflow:
  1. Extract points of the pole classification (e.g. class 18)
  2. DBSCAN cluster them — each cluster is one physical pole
  3. Pole center = mean(X, Y, Z) of the cluster
  4. Pole height = max(Z) - min(Z) of the cluster
  5. Sort poles along the corridor by their Y coordinate (matches notebook)

Noise points (DBSCAN label -1) are discarded, same as the notebook implicitly
did by only iterating over real cluster labels.
"""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np
from sklearn.cluster import DBSCAN


@dataclass
class DetectedPole:
    index: int  # final sorted index along the corridor (0, 1, 2, ...)
    x: float
    y: float
    z: float
    height_m: float
    point_count: int
    center_xyz: np.ndarray  # convenience for downstream span/conductor math


def detect_poles(pole_points: np.ndarray, eps: float, min_samples: int) -> list[DetectedPole]:
    """
    Cluster pole-classified points into individual poles.

    Args:
        pole_points: (N, 3) array of X, Y, Z for points already filtered to the pole class.
        eps: DBSCAN neighborhood radius (meters).
        min_samples: DBSCAN minimum cluster size.

    Returns:
        List of DetectedPole, sorted along the corridor (by Y coordinate),
        with `index` reassigned 0..N-1 in that sorted order.

    Raises:
        ValueError if no valid pole clusters are found (e.g. bad params or empty class).
    """
    if len(pole_points) == 0:
        raise ValueError(
            "No points found for the configured pole classification. "
            "Check that the pole_class parameter matches this dataset's classification scheme."
        )

    db = DBSCAN(eps=eps, min_samples=min_samples)
    labels = db.fit_predict(pole_points)

    unique_labels = [lbl for lbl in np.unique(labels) if lbl != -1]

    if not unique_labels:
        raise ValueError(
            "DBSCAN found no pole clusters — all points were classified as noise. "
            "Try increasing pole_dbscan_eps or decreasing pole_dbscan_min_samples."
        )

    raw_poles = []
    for label in unique_labels:
        cluster = pole_points[labels == label]
        center = cluster.mean(axis=0)
        height = float(cluster[:, 2].max() - cluster[:, 2].min())
        raw_poles.append({
            "center": center,
            "height_m": height,
            "point_count": int(len(cluster)),
        })

    # Sort along the corridor by Y coordinate (matches the notebook's approach)
    raw_poles.sort(key=lambda p: p["center"][1])

    poles: list[DetectedPole] = []
    for i, p in enumerate(raw_poles):
        c = p["center"]
        poles.append(DetectedPole(
            index=i,
            x=float(c[0]),
            y=float(c[1]),
            z=float(c[2]),
            height_m=p["height_m"],
            point_count=p["point_count"],
            center_xyz=c,
        ))

    return poles
