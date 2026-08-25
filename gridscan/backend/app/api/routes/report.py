from __future__ import annotations
from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalysisResult
from app.storage import analysis_store

router = APIRouter(tags=["report"])


@router.get("/report/{analysis_id}", response_model=AnalysisResult)
async def get_report(analysis_id: str):
    """
    Report data endpoint. For stage 1 this returns the same structured
    AnalysisResult the /analysis endpoint returns — report_builder.py and a
    dedicated PDF renderer (weasyprint/reportlab) get built in a later stage
    once the frontend Reports page is wired up, so the report layout can be
    driven by what that page actually needs.
    """
    result = analysis_store.get(analysis_id)
    if result is None:
        raise HTTPException(404, f"No analysis found for id '{analysis_id}'.")
    return result
