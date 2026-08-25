from __future__ import annotations
import os
import uuid
import json

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.config import settings
from app.models.schemas import AnalysisParams, AnalyzeResponse, AnalysisResult
from app.core.pipeline import run_analysis
from app.storage import analysis_store

router = APIRouter(tags=["analyze"])

ALLOWED_EXTENSIONS = {".las", ".laz"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    params: str | None = Form(default=None),
):
    """
    Upload a LAS/LAZ point cloud and run the full engineering pipeline.

    `params` is an optional JSON string matching AnalysisParams — any field
    left out falls back to the server-side default in app/config.py.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Upload a .las or .laz file.")

    parsed_params = AnalysisParams()
    if params:
        try:
            parsed_params = AnalysisParams(**json.loads(params))
        except (json.JSONDecodeError, TypeError, ValueError) as exc:
            raise HTTPException(400, f"Invalid params payload: {exc}") from exc

    analysis_id = str(uuid.uuid4())
    os.makedirs(settings.upload_dir, exist_ok=True)
    dest_path = os.path.join(settings.upload_dir, f"{analysis_id}{ext}")

    size = 0
    max_bytes = settings.max_upload_mb * 1024 * 1024
    with open(dest_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                os.remove(dest_path)
                raise HTTPException(413, f"File exceeds max upload size of {settings.max_upload_mb} MB.")
            out.write(chunk)

    try:
        result: AnalysisResult = run_analysis(
            analysis_id=analysis_id,
            file_path=dest_path,
            filename=file.filename or "upload",
            params=parsed_params,
        )
    except ValueError as exc:
        # Domain-level errors (bad classification config, no poles found, etc.)
        failed = AnalysisResult(analysis_id=analysis_id, status="failed", error=str(exc))
        analysis_store.save(analysis_id, failed)
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        failed = AnalysisResult(analysis_id=analysis_id, status="failed", error=str(exc))
        analysis_store.save(analysis_id, failed)
        raise HTTPException(500, f"Analysis failed: {exc}") from exc

    analysis_store.save(analysis_id, result)
    return AnalyzeResponse(analysis_id=analysis_id, status="complete")
