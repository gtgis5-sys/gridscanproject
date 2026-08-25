"""
In-memory store for analysis results, keyed by analysis_id.

Fine for a single-process dev/demo deployment. Swap for Redis or a database
table (analysis_id -> JSON blob) for multi-worker/production deployments —
the interface below is intentionally small so that swap is a one-file change.
"""
from __future__ import annotations
from app.models.schemas import AnalysisResult

_store: dict[str, AnalysisResult] = {}


def save(analysis_id: str, result: AnalysisResult) -> None:
    _store[analysis_id] = result


def get(analysis_id: str) -> AnalysisResult | None:
    return _store.get(analysis_id)


def exists(analysis_id: str) -> bool:
    return analysis_id in _store
