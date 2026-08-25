"""
Parses an uploaded LAS/LAZ file into raw numpy arrays.

This is the only place that touches `laspy` directly — every other service
works on plain numpy arrays so they stay easy to test and reason about.
"""
from __future__ import annotations
import numpy as np
import laspy


class PointCloudData:
    """Container for parsed point cloud data."""

    def __init__(self, points: np.ndarray, classification: np.ndarray, filename: str):
        self.points = points  # (N, 3) float64 array of X, Y, Z
        self.classification = classification  # (N,) int array
        self.filename = filename

    @property
    def total_points(self) -> int:
        return len(self.points)

    def class_points(self, class_id: int) -> np.ndarray:
        """Return the (M, 3) subset of points belonging to a single classification."""
        return self.points[self.classification == class_id]

    def class_points_multi(self, class_ids: list[int]) -> np.ndarray:
        """Return the (M, 3) subset of points belonging to any of the given classifications."""
        return self.points[np.isin(self.classification, class_ids)]

    def classification_breakdown(self) -> list[tuple[int, int]]:
        """Return [(class_id, point_count), ...] sorted by class_id."""
        unique, counts = np.unique(self.classification, return_counts=True)
        return list(zip(unique.tolist(), counts.tolist()))


def load_point_cloud(file_path: str, filename: str) -> PointCloudData:
    """
    Read a LAS/LAZ file and extract X, Y, Z coordinates and classification codes.

    Raises ValueError with a clear message if the file is unreadable or has no
    classification data, so the API layer can surface a 4xx instead of a 500.
    """
    try:
        las = laspy.read(file_path)
    except Exception as exc:  # laspy raises various error types depending on the failure mode
        raise ValueError(f"Could not read LAS/LAZ file: {exc}") from exc

    if not hasattr(las, "classification"):
        raise ValueError("The uploaded file has no classification data — "
                          "GridScan requires a classified point cloud.")

    points = np.vstack((las.x, las.y, las.z)).T.astype(np.float64)
    classification = np.asarray(las.classification, dtype=np.int32)

    if len(points) == 0:
        raise ValueError("The uploaded file contains zero points.")

    return PointCloudData(points=points, classification=classification, filename=filename)
