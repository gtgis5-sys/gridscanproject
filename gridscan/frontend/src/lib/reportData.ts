// ─────────────────────────────────────────────────────────────────────────────
// reportData.ts  –  Single source of truth for all report data
// ─────────────────────────────────────────────────────────────────────────────

export const DATASET_NAME = "clip.las";
export const DATASET_INFO = "460,218 pts · 5 classes · 0.99 ha";
export const ENGINE_VERSION = "GridScan Engine v3.2 · LAS 1.4";
export const COMPANY_LOGO_PATH = "/assets/company-logo.jpeg";

export const POLES = [
  { id: 1, height: 8.20, x: 709606.5, y: 780.2 },
  { id: 2, height: 9.10, x: 709616.3, y: 797.4 },
  { id: 3, height: 8.70, x: 709626.1, y: 811.8 },
  { id: 4, height: 9.85, x: 709636.0, y: 828.3 },
  { id: 5, height: 8.40, x: 709645.8, y: 843.9 },
  { id: 6, height: 9.30, x: 709655.6, y: 858.7 },
  { id: 7, height: 8.60, x: 709665.4, y: 873.5 },
  { id: 8, height: 7.80, x: 709675.3, y: 888.2 },
];

export const SPANS = [
  { id: "2-3", poleFrom: 2, poleTo: 3, upperSag: 1.17, lowerSag: 1.91, upperLength: 24.15, lowerLength: 24.18, upperLoss: 1.031, lowerLoss: 2.531, poleSpan: 24.04, status: "warning" as const },
  { id: "3-4", poleFrom: 3, poleTo: 4, upperSag: 1.01, lowerSag: 2.22, upperLength: 23.41, lowerLength: 23.33, upperLoss: 1.031, lowerLoss: 4.031, poleSpan: 23.30, status: "critical" as const },
  { id: "4-5", poleFrom: 4, poleTo: 5, upperSag: 0.74, lowerSag: 1.27, upperLength: 20.85, lowerLength: 19.69, upperLoss: 1.406, lowerLoss: 1.500, poleSpan: 20.70, status: "normal" as const },
  { id: "5-6", poleFrom: 5, poleTo: 6, upperSag: 1.04, lowerSag: 1.82, upperLength: 25.16, lowerLength: 26.86, upperLoss: 1.125, lowerLoss: 2.156, poleSpan: 25.04, status: "warning" as const },
  { id: "6-7", poleFrom: 6, poleTo: 7, upperSag: 1.20, lowerSag: 1.80, upperLength: 22.67, lowerLength: 24.72, upperLoss: 0.844, lowerLoss: 1.688, poleSpan: 22.58, status: "warning" as const },
];

export const CONDUCTORS = SPANS.flatMap((s) => [
  { id: `${s.id} U`, span: s.id, type: "Upper" as const, length: s.upperLength, sag: s.upperSag, powerLoss: s.upperLoss, energyWaste: +(s.upperLoss * 8.76).toFixed(3) },
  { id: `${s.id} L`, span: s.id, type: "Lower" as const, length: s.lowerLength, sag: s.lowerSag, powerLoss: s.lowerLoss, energyWaste: +(s.lowerLoss * 8.76).toFixed(3) },
]);

export const NETWORK_SUMMARY = {
  totalPoints: 460218,
  totalPoles: 8,
  totalSpans: 5,
  totalConductors: 10,
  maxSag: 2.22,
  maxSagSpan: "Span 3-4 Lower",
  avgSag: +(SPANS.reduce((s, r) => s + r.upperSag + r.lowerSag, 0) / 10).toFixed(2),
  avgPoleHeight: +(POLES.reduce((s, p) => s + p.height, 0) / POLES.length).toFixed(2),
  totalPowerLoss: +CONDUCTORS.reduce((s, c) => s + c.powerLoss, 0).toFixed(3),
  totalEnergyWaste: +CONDUCTORS.reduce((s, c) => s + c.energyWaste, 0).toFixed(2),
};
