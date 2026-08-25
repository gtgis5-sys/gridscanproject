// Typed client for the GridScan FastAPI backend.
// These types mirror app/models/schemas.py 1:1 — keep them in sync if the
// backend contract changes.

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface AnalysisParams {
  pole_class: number;
  conductor_classes: number[];
  ground_class: number;
  other_class: number;
  pole_dbscan_eps: number;
  pole_dbscan_min_samples: number;
  span_crop_buffer_m: number;
  conductor_dbscan_eps: number;
  conductor_dbscan_min_samples: number;
  min_conductor_points: number;
  curve_fit_degree: number;
  current_amps: number;
  resistance_per_km_ohm: number;
  initial_sag_m: number;
}

export interface ClassificationBreakdown {
  class_id: number;
  label: string;
  point_count: number;
  pct: number;
}

export interface Pole {
  id: number;
  x: number;
  y: number;
  z: number;
  height_m: number;
  point_count: number;
}

export interface Conductor {
  id: string;
  span_id: number;
  label: string;
  point_count: number;
  wire_length_m: number;
  sag_m: number;
  lowest_point: number[];
  curve_coeffs: number[];
  cable_expansion_m: number;
  expansion_pct: number;
  additional_sag_m: number;
  extra_resistance_ohm: number;
  extra_power_loss_w: number;
  annual_energy_loss_kwh: number;
}

export interface Span {
  id: number;
  start_pole: number;
  end_pole: number;
  distance_m: number;
  conductors: Conductor[];
}

export interface KPIRef {
  label: string;
  value: number;
}

export interface KPIs {
  highest_pole: KPIRef;
  longest_conductor: KPIRef;
  max_sag: KPIRef;
  avg_pole_height_m: number;
  avg_sag_m: number;
  total_annual_energy_loss_kwh: number;
  total_cable_expansion_m: number;
}

export interface Summary {
  total_poles: number;
  total_spans: number;
  total_conductors: number;
  total_points: number;
  filename: string;
}

export interface AnalysisResult {
  analysis_id: string;
  status: "processing" | "complete" | "failed";
  error?: string | null;
  params?: AnalysisParams | null;
  summary?: Summary | null;
  classification_breakdown: ClassificationBreakdown[];
  poles: Pole[];
  spans: Span[];
  kpis?: KPIs | null;
}

export interface PointCloudResponse {
  analysis_id: string;
  class_filter: number[] | null;
  total_points_in_class: number;
  returned_points: number;
  points: number[][]; // [x, y, z, classification][]
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON — fall back to statusText
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export async function uploadAndAnalyze(
  file: File,
  paramsOverride?: Partial<AnalysisParams>
): Promise<{ analysis_id: string; status: string }> {
  const form = new FormData();
  form.append("file", file);
  if (paramsOverride) {
    form.append("params", JSON.stringify(paramsOverride));
  }
  const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
  return handleResponse(res);
}

export async function getAnalysis(analysisId: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analysis/${analysisId}`);
  return handleResponse(res);
}

export async function getPointCloud(
  analysisId: string,
  opts?: { classes?: number[]; maxPoints?: number }
): Promise<PointCloudResponse> {
  const qs = new URLSearchParams();
  if (opts?.classes?.length) qs.set("classes", opts.classes.join(","));
  if (opts?.maxPoints) qs.set("max_points", String(opts.maxPoints));
  const res = await fetch(`${API_BASE}/analysis/${analysisId}/pointcloud?${qs.toString()}`);
  return handleResponse(res);
}

export async function getReport(analysisId: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/report/${analysisId}`);
  return handleResponse(res);
}
