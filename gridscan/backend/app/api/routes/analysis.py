from __future__ import annotations
import os
import numpy as np
from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.models.schemas import AnalysisResult, PointCloudResponse
from app.services.las_loader import load_point_cloud
from app.storage import analysis_store

router = APIRouter(tags=["analysis"])


def _find_uploaded_file(analysis_id: str) -> str | None:
    for ext in (".las", ".laz"):
        candidate = os.path.join(settings.upload_dir, f"{analysis_id}{ext}")
        if os.path.exists(candidate):
            return candidate
    return None


@router.get("/analysis/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(analysis_id: str):
    result = analysis_store.get(analysis_id)
    if result is None:
        raise HTTPException(404, f"No analysis found for id '{analysis_id}'.")
    return result


@router.get("/analysis/{analysis_id}/pointcloud", response_model=PointCloudResponse)
async def get_pointcloud(
    analysis_id: str,
    classes: str | None = Query(default=None, description="Comma-separated class IDs, e.g. '18,20,21'"),
    max_points: int = Query(default=None),
):
    """
    Return a (optionally downsampled) point cloud for the 3D viewer, colored
    by classification. Points are read fresh from the stored upload rather
    than cached in the analysis result, keeping AnalysisResult lightweight.
    """
    if analysis_store.get(analysis_id) is None:
        raise HTTPException(404, f"No analysis found for id '{analysis_id}'.")

    file_path = _find_uploaded_file(analysis_id)
    if file_path is None:
        raise HTTPException(404, "Source point cloud file no longer available on server.")

    pc = load_point_cloud(file_path, filename=analysis_id)

    class_ids = None
    if classes:
        try:
            class_ids = [int(c.strip()) for c in classes.split(",") if c.strip()]
        except ValueError as exc:
            raise HTTPException(400, f"Invalid classes filter: {exc}") from exc
        mask = np.isin(pc.classification, class_ids)
    else:
        mask = np.ones(len(pc.points), dtype=bool)

    filtered_points = pc.points[mask]
    filtered_class = pc.classification[mask]
    total_in_class = int(len(filtered_points))

    limit = max_points or settings.pointcloud_max_points_default
    if total_in_class > limit:
        step = total_in_class // limit
        idx = np.arange(0, total_in_class, max(step, 1))[:limit]
        filtered_points = filtered_points[idx]
        filtered_class = filtered_class[idx]

    rows = np.column_stack([filtered_points, filtered_class]).tolist()

    return PointCloudResponse(
        analysis_id=analysis_id,
        class_filter=class_ids,
        total_points_in_class=total_in_class,
        returned_points=len(rows),
        points=rows,
    )
