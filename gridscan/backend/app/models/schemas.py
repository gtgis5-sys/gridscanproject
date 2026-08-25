from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request: engineering/algorithm parameter overrides for POST /analyze
# ---------------------------------------------------------------------------
class AnalysisParams(BaseModel):
    pole_class: int = 18
    conductor_classes: list[int] = [20, 21]
    ground_class: int = 2
    other_class: int = 9

    pole_dbscan_eps: float = 0.5
    pole_dbscan_min_samples: int = 10

    span_crop_buffer_m: float = 2.0
    conductor_dbscan_eps: float = 0.5
    conductor_dbscan_min_samples: int = 10
    min_conductor_points: int = 20

    curve_fit_degree: int = 2

    current_amps: float = 250.0
    resistance_per_km_ohm: float = 0.15
    initial_sag_m: float = 0.09


# ---------------------------------------------------------------------------
# Core domain models
# ---------------------------------------------------------------------------
class ClassificationBreakdown(BaseModel):
    class_id: int
    label: str
    point_count: int
    pct: float


class Pole(BaseModel):
    id: int
    x: float
    y: float
    z: float
    height_m: float
    point_count: int


class Conductor(BaseModel):
    id: str  # e.g. "0-1-U" (span 0-1, upper wire)
    span_id: int
    label: str  # e.g. "Upper", "Lower", "Wire 2"
    point_count: int
    wire_length_m: float
    sag_m: float
    lowest_point: list[float]  # [x, y, z]
    curve_coeffs: list[float]  # parabola coefficients [a, b, c]

    # Energy loss (all derived from wire_length_m vs span distance)
    cable_expansion_m: float
    expansion_pct: float
    additional_sag_m: float
    extra_resistance_ohm: float
    extra_power_loss_w: float
    annual_energy_loss_kwh: float


class Span(BaseModel):
    id: int
    start_pole: int
    end_pole: int
    distance_m: float
    conductors: list[Conductor]


class KPIRef(BaseModel):
    label: str
    value: float


class KPIs(BaseModel):
    highest_pole: KPIRef
    longest_conductor: KPIRef
    max_sag: KPIRef
    avg_pole_height_m: float
    avg_sag_m: float
    total_annual_energy_loss_kwh: float
    total_cable_expansion_m: float


class Summary(BaseModel):
    total_poles: int
    total_spans: int
    total_conductors: int
    total_points: int
    filename: str


class AnalysisResult(BaseModel):
    analysis_id: str
    status: Literal["processing", "complete", "failed"]
    error: str | None = None
    params: AnalysisParams | None = None
    summary: Summary | None = None
    classification_breakdown: list[ClassificationBreakdown] = []
    poles: list[Pole] = []
    spans: list[Span] = []
    kpis: KPIs | None = None


class AnalyzeResponse(BaseModel):
    analysis_id: str
    status: Literal["processing", "complete", "failed"]


class PointCloudPoint(BaseModel):
    x: float
    y: float
    z: float
    classification: int


class PointCloudResponse(BaseModel):
    analysis_id: str
    class_filter: list[int] | None
    total_points_in_class: int
    returned_points: int
    points: list[list[float]]  # [x, y, z, classification] rows — array form for payload size
