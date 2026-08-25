"""
Full analysis pipeline orchestrator.

Runs, in order:
  1-2. Load LAS/LAZ, read X/Y/Z + classification         -> las_loader
  3-5. Detect poles, compute centers + heights, sort      -> pole_detection
  6.   Generate adjacent spans                            -> span_generation
  7-9. Extract conductors per span, fit curves            -> conductor_extraction
  10.  Compute sag/expansion/resistance/power/energy      -> energy_loss
  11.  Assemble structured JSON-ready result

Every number in the returned AnalysisResult is derived from the uploaded
point cloud and the request's AnalysisParams — nothing is hardcoded.
"""
from __future__ import annotations
import numpy as np

from app.models.schemas import (
    AnalysisParams, AnalysisResult, Summary, ClassificationBreakdown,
    Pole, Span, Conductor, KPIs, KPIRef,
)
from app.services.las_loader import load_point_cloud, PointCloudData
from app.services.pole_detection import detect_poles
from app.services.span_generation import generate_spans
from app.services.conductor_extraction import extract_conductors_for_span
from app.services.energy_loss import calculate_energy_loss

CLASS_LABELS = {
    2: "Ground Surface",
    9: "Other Classified Objects",
    18: "Utility Pole Structures",
    20: "Secondary Conductors / Auxiliary Wires",
    21: "Primary Conductors / Power Lines",
}


def _classification_breakdown(pc: PointCloudData) -> list[ClassificationBreakdown]:
    breakdown = pc.classification_breakdown()
    total = pc.total_points
    return [
        ClassificationBreakdown(
            class_id=class_id,
            label=CLASS_LABELS.get(class_id, f"Class {class_id}"),
            point_count=count,
            pct=round(count / total * 100, 2) if total else 0.0,
        )
        for class_id, count in breakdown
    ]


def run_analysis(analysis_id: str, file_path: str, filename: str,
                  params: AnalysisParams) -> AnalysisResult:
    """Execute the complete pipeline and return a populated AnalysisResult."""
    pc = load_point_cloud(file_path, filename)

    # --- Pole detection ---
    pole_class_points = pc.class_points(params.pole_class)
    detected_poles = detect_poles(
        pole_class_points,
        eps=params.pole_dbscan_eps,
        min_samples=params.pole_dbscan_min_samples,
    )

    # --- Span generation ---
    generated_spans = generate_spans(detected_poles)

    # --- Conductor extraction + sag + energy loss, per span ---
    conductor_points = pc.class_points_multi(params.conductor_classes)

    spans: list[Span] = []
    for span in generated_spans:
        raw_conductors = extract_conductors_for_span(
            span, conductor_points,
            buffer=params.span_crop_buffer_m,
            eps=params.conductor_dbscan_eps,
            min_samples=params.conductor_dbscan_min_samples,
            min_conductor_points=params.min_conductor_points,
            curve_fit_degree=params.curve_fit_degree,
        )

        conductors: list[Conductor] = []
        for idx, c in enumerate(raw_conductors):
            energy = calculate_energy_loss(
                wire_length_m=c.wire_length_m,
                pole_distance_m=span.distance_m,
                current_sag_m=c.sag_m,
                current_amps=params.current_amps,
                resistance_per_km_ohm=params.resistance_per_km_ohm,
                initial_sag_m=params.initial_sag_m,
            )
            conductors.append(Conductor(
                id=f"{span.start_pole}-{span.end_pole}-{c.label[:1]}{idx}",
                span_id=span.id,
                label=c.label,
                point_count=c.point_count,
                wire_length_m=round(c.wire_length_m, 4),
                sag_m=round(c.sag_m, 4),
                lowest_point=[round(v, 3) for v in c.lowest_point],
                curve_coeffs=c.curve_coeffs,
                cable_expansion_m=round(energy.cable_expansion_m, 4),
                expansion_pct=round(energy.expansion_pct, 4),
                additional_sag_m=round(energy.additional_sag_m, 4),
                extra_resistance_ohm=round(energy.extra_resistance_ohm, 8),
                extra_power_loss_w=round(energy.extra_power_loss_w, 4),
                annual_energy_loss_kwh=round(energy.annual_energy_loss_kwh, 4),
            ))

        spans.append(Span(
            id=span.id,
            start_pole=span.start_pole,
            end_pole=span.end_pole,
            distance_m=round(span.distance_m, 4),
            conductors=conductors,
        ))

    poles: list[Pole] = [
        Pole(id=p.index, x=round(p.x, 3), y=round(p.y, 3), z=round(p.z, 3),
             height_m=round(p.height_m, 3), point_count=p.point_count)
        for p in detected_poles
    ]

    kpis = _build_kpis(poles, spans)

    total_conductors = sum(len(s.conductors) for s in spans)

    return AnalysisResult(
        analysis_id=analysis_id,
        status="complete",
        params=params,
        summary=Summary(
            total_poles=len(poles),
            total_spans=len(spans),
            total_conductors=total_conductors,
            total_points=pc.total_points,
            filename=filename,
        ),
        classification_breakdown=_classification_breakdown(pc),
        poles=poles,
        spans=spans,
        kpis=kpis,
    )


def _build_kpis(poles: list[Pole], spans: list[Span]) -> KPIs | None:
    if not poles or not spans:
        return None

    highest_pole = max(poles, key=lambda p: p.height_m)

    all_conductors = [(s, c) for s in spans for c in s.conductors]
    if not all_conductors:
        avg_pole_height = float(np.mean([p.height_m for p in poles]))
        return KPIs(
            highest_pole=KPIRef(label=f"Pole {highest_pole.id}", value=highest_pole.height_m),
            longest_conductor=KPIRef(label="N/A", value=0.0),
            max_sag=KPIRef(label="N/A", value=0.0),
            avg_pole_height_m=round(avg_pole_height, 3),
            avg_sag_m=0.0,
            total_annual_energy_loss_kwh=0.0,
            total_cable_expansion_m=0.0,
        )

    longest = max(all_conductors, key=lambda sc: sc[1].wire_length_m)
    max_sag = max(all_conductors, key=lambda sc: sc[1].sag_m)

    avg_pole_height = float(np.mean([p.height_m for p in poles]))
    avg_sag = float(np.mean([c.sag_m for _, c in all_conductors]))
    total_energy = float(sum(c.annual_energy_loss_kwh for _, c in all_conductors))
    total_expansion = float(sum(c.cable_expansion_m for _, c in all_conductors))

    return KPIs(
        highest_pole=KPIRef(label=f"Pole {highest_pole.id}", value=highest_pole.height_m),
        longest_conductor=KPIRef(
            label=f"Span {longest[0].start_pole}-{longest[0].end_pole} {longest[1].label}",
            value=longest[1].wire_length_m,
        ),
        max_sag=KPIRef(
            label=f"Span {max_sag[0].start_pole}-{max_sag[0].end_pole} {max_sag[1].label}",
            value=max_sag[1].sag_m,
        ),
        avg_pole_height_m=round(avg_pole_height, 3),
        avg_sag_m=round(avg_sag, 3),
        total_annual_energy_loss_kwh=round(total_energy, 3),
        total_cable_expansion_m=round(total_expansion, 3),
    )
