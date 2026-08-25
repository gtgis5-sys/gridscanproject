import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Gauge,
  Layers,
  Loader2,
  Mountain,
  Network,
  Radio,
  Route as RouteIcon,
  Ruler,
  Sparkles,
  TowerControl,
  Waves,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sidebar } from "../components/Sidebar";
import heroPowerline from "/assets/hero-powerline-CpU_UoHL.jpg";
import { useAnalysis } from "../lib/AnalysisContext";
import type { AnalysisResult, Pole, Span } from "../lib/api";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// Purely cosmetic per-class icon/color mapping for known ASPRS classes.
// This is UI theming only — every point count, label, and percentage next
// to it comes from the backend's classification_breakdown for the uploaded
// dataset. Unknown classes fall back to a generic icon/color.
const CLASS_META: Record<number, { icon: React.ComponentType<{ className?: string }>; swatch: string }> = {
  2: { icon: Mountain, swatch: "oklch(0.68 0.18 145)" },
  9: { icon: Layers, swatch: "oklch(0.78 0.17 80)" },
  18: { icon: TowerControl, swatch: "oklch(0.72 0.19 235)" },
  20: { icon: Radio, swatch: "oklch(0.7 0.2 320)" },
  21: { icon: Zap, swatch: "oklch(0.78 0.16 180)" },
};
const DEFAULT_CLASS_META = { icon: Layers, swatch: "oklch(0.6 0.05 245)" };
const classMeta = (id: number) => CLASS_META[id] ?? DEFAULT_CLASS_META;

const fmt = (n: number) => n.toLocaleString("en-US");

function HomePage() {
  const { status, error, fileMeta, result, analyze, reset } = useAnalysis();
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    void analyze(file);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Hero ready={status === "complete"} result={result} />
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pb-20 space-y-8">
          <ImportSection
            status={status}
            error={error}
            fileMeta={fileMeta}
            result={result}
            dragOver={dragOver}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onPick={() => fileRef.current?.click()}
            fileRef={fileRef}
            onFile={handleFile}
            onReset={reset}
          />
          {result && status === "complete" ? (
            <>
              <InfrastructureKPIs result={result} />
              <NetworkOverview result={result} />
              <Analytics result={result} />
              <IntelligenceAndComposition result={result} />
            </>
          ) : (
            <EmptyDashboardState status={status} />
          )}
        </div>
        <Footer filename={result?.summary?.filename} />
      </main>
    </div>
  );
}

// ── Empty state shown before a dataset is uploaded/processed ─────────────────

function EmptyDashboardState({ status }: { status: string }) {
  if (status === "uploading" || status === "processing") return null; // ImportSection shows the loading state
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
      <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mx-auto mb-4">
        <Network className="size-6" />
      </div>
      <h3 className="text-base font-semibold">No dataset analyzed yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        Upload a classified LAS/LAZ point cloud above to generate infrastructure KPIs,
        network topology, classification analytics, and engineering insights.
      </p>
    </section>
  );
}

function Hero({ ready, result }: { ready: boolean; result: AnalysisResult | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${heroPowerline})` }}
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-grid opacity-40" aria-hidden />
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />

      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-12 pb-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Powerline Inspection · Point Cloud Intelligence
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            LiDAR Powerline{" "}
            <span className="text-primary text-glow">Analytics</span>
            {" "}Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Automated detection and analysis of utility poles, conductors, spans, and powerline infrastructure using LiDAR point cloud data.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <Chip icon={CheckCircle2} tone={ready ? "emerald" : "muted"}>{ready ? "Dataset ingested" : "Awaiting dataset"}</Chip>
            <Chip icon={TowerControl} tone={ready ? "primary" : "muted"}>{ready ? "Assets extracted" : "Not yet extracted"}</Chip>
            <Chip icon={Activity} tone={ready ? "primary" : "muted"}>{ready ? "Analytics generated" : "Not yet generated"}</Chip>
          </div>
        </div>
        <div className="lg:col-span-5">
          <PointCloudPreview ready={ready} analysisId={result?.analysis_id} />
        </div>
      </div>
    </section>
  );
}

function Chip({ icon: Icon, children, tone }: { icon: React.ComponentType<{ className?: string }>, children: React.ReactNode, tone: string }) {
  const cls = tone === "emerald"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
    : tone === "muted"
    ? "border-border bg-muted/40 text-muted-foreground"
    : "border-primary/30 bg-primary/10 text-primary";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${cls}`}>
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}

// Live preview: renders a real downsampled sample of the uploaded point
// cloud (fetched from GET /analysis/{id}/pointcloud) once processing
// completes. Before that, it shows an inert grid with no synthetic points.
function PointCloudPreview({ ready, analysisId }: { ready: boolean; analysisId?: string }) {
  const { fetchPointCloud } = useAnalysis();
  const ref = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const [points, setPoints] = useState<{ x: number; y: number; cls: number }[]>([]);

  useEffect(() => {
    if (!ready || !analysisId) {
      setPoints([]);
      return;
    }
    let cancelled = false;
    fetchPointCloud({ maxPoints: 6000 }).then((pc) => {
      if (cancelled) return;
      const xs = pc.points.map((p) => p[0]);
      const ys = pc.points.map((p) => p[1]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;
      setPoints(
        pc.points.map(([x, y, , cls]) => ({
          x: (x - minX) / spanX,
          y: (y - minY) / spanY,
          cls,
        }))
      );
    }).catch(() => setPoints([]));
    return () => { cancelled = true; };
  }, [ready, analysisId, fetchPointCloud]);

  useEffect(() => {
    const canvas = ref.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      const step = 40;
      ctx.strokeStyle = "oklch(30% 0.03 245 / 0.3)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      if (points.length === 0) return;
      const cx = w / 2 + pan.x;
      const cy = h / 2 + pan.y;
      const scale = Math.min(w, h * 1.4) * zoom;
      const colors: Record<number, string> = {
        2: "oklch(68% 0.18 145)",
        18: "oklch(72% 0.19 235)",
        20: "oklch(70% 0.2 320)",
        21: "oklch(78% 0.16 180)",
        9: "oklch(78% 0.17 80)",
      };
      for (const p of points) {
        const px = cx + (p.x - 0.5) * scale;
        const py = cy + (1 - p.y - 0.5) * scale * 0.55;
        ctx.fillStyle = colors[p.cls] ?? "oklch(60% 0.05 245)";
        ctx.globalAlpha = 0.85;
        ctx.fillRect(px, py, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
    };

    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    draw();
    return () => ro.disconnect();
  }, [zoom, pan, points]);

  return (
    <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Live Preview</span>
          <span className="text-xs text-foreground font-medium">Point Cloud · Top View</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${ready ? "bg-primary animate-pulse" : "bg-muted-foreground/40"}`} />
          <span className="text-xs text-muted-foreground">{ready ? "Loaded" : "Waiting for dataset"}</span>
        </div>
      </div>
      <div
        ref={wrapRef}
        className="relative cursor-grab active:cursor-grabbing"
        style={{ height: 220 }}
        onWheel={(e) => {
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setZoom((z) => Math.max(0.5, Math.min(4, +(z + delta).toFixed(2))));
        }}
        onMouseDown={(e) => {
          dragging.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        }}
        onMouseMove={(e) => {
          if (!dragging.current) return;
          setPan({ x: dragging.current.px + e.clientX - dragging.current.sx, y: dragging.current.py + e.clientY - dragging.current.sy });
        }}
        onMouseUp={() => { dragging.current = null; }}
        onMouseLeave={() => { dragging.current = null; }}
      >
        <canvas ref={ref} className="w-full h-full" />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
            Upload a dataset to preview its point cloud
          </div>
        )}
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-muted-foreground">
          zoom {zoom.toFixed(2)}x
        </div>
        {ready && (
          <div className="absolute bottom-2 left-3 flex items-center gap-2 text-[10px]">
            {[
              { id: 2, color: "oklch(68% 0.18 145)", label: "C2" },
              { id: 9, color: "oklch(78% 0.17 80)", label: "C9" },
              { id: 18, color: "oklch(72% 0.19 235)", label: "C18" },
              { id: 20, color: "oklch(70% 0.2 320)", label: "C20" },
              { id: 21, color: "oklch(78% 0.16 180)", label: "C21" },
            ].map((c) => (
              <span key={c.id} className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ background: c.color }} />
                <span style={{ color: c.color }}>{c.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImportSection({
  status, error, fileMeta, result, dragOver, onDrop, onDragOver, onDragLeave, onPick, fileRef, onFile, onReset,
}: {
  status: string;
  error: string | null;
  fileMeta: { name: string; size: number } | null;
  result: AnalysisResult | null;
  dragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onPick: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onFile: (f: File) => void;
  onReset: () => void;
}) {
  if (status === "complete" && result) {
    return <DatasetIntelligencePanel fileMeta={fileMeta} result={result} onReset={onReset} />;
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Upload card */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
            <CloudUpload className="size-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary/80">Step 01</div>
            <h3 className="text-sm font-semibold">Dataset Upload</h3>
          </div>
        </div>
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={onPick}
        >
          <div className="size-12 rounded-xl bg-primary/20 grid place-items-center mx-auto mb-3">
            <CloudUpload className="size-6 text-primary" />
          </div>
          <p className="text-sm font-medium">Drop a point cloud file</p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse — <span className="font-mono">.LAS .LAZ</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept=".las,.laz"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          />
        </div>

        {(status === "uploading" || status === "processing") && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
            <Loader2 className="size-4 text-primary shrink-0 animate-spin" />
            <p className="text-xs text-primary">
              {status === "uploading" ? "Uploading point cloud…" : `Running detection pipeline on ${fileMeta?.name}…`}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5">
            <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-destructive font-medium">Analysis failed</p>
              <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {status === "idle" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <Network className="size-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">No dataset uploaded yet.</p>
          </div>
        )}
      </div>

      {/* KPI card — shows placeholders only until real data exists */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
            <Network className="size-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary/80">Infrastructure Overview</div>
            <h3 className="text-sm font-semibold">Engineering KPIs</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Assets extracted and analyzed from the classified point cloud.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Utility Poles", value: "—", icon: TowerControl },
            { label: "Powerline Spans", value: "—", icon: RouteIcon },
            { label: "Conductors", value: "—", icon: Zap },
            { label: "Avg Sag", value: "—", icon: Waves },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="size-3.5 text-primary" />
              </div>
              <div className="text-xl font-semibold tabular-nums">{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Dataset Intelligence Panel (shown after successful upload) ────────────────

const WORKFLOW_STEPS = [
  { label: "Dataset Loaded", icon: CheckCircle2 },
  { label: "Classification Complete", icon: Layers },
  { label: "Infrastructure Extracted", icon: TowerControl },
  { label: "Engineering Analytics Generated", icon: Activity },
];

function DatasetIntelligencePanel({
  fileMeta, result, onReset,
}: {
  fileMeta: { name: string; size: number } | null;
  result: AnalysisResult;
  onReset: () => void;
}) {
  const fileSizeMb = fileMeta ? (fileMeta.size / 1024 / 1024).toFixed(2) : "—";
  const summary = result.summary!;
  const corridorLengthM = result.spans.reduce((s, sp) => s + sp.distance_m, 0);

  const stats = [
    { label: "Dataset Name", value: summary.filename, icon: Layers, color: "oklch(72% 0.19 235)" },
    { label: "Total Points", value: fmt(summary.total_points), icon: Network, color: "oklch(78% 0.16 180)" },
    { label: "Classifications", value: `${result.classification_breakdown.length} Classes`, icon: Mountain, color: "oklch(68% 0.18 145)" },
    { label: "Corridor Length", value: `${corridorLengthM.toFixed(1)} m`, icon: RouteIcon, color: "oklch(70% 0.2 320)" },
    { label: "File Size", value: `${fileSizeMb} MB`, icon: CloudUpload, color: "oklch(78% 0.17 80)" },
    { label: "Processing Status", value: "Complete", icon: CheckCircle2, color: "oklch(68% 0.18 145)" },
  ];

  return (
    <section
      className="rounded-2xl border border-primary/40 overflow-hidden relative"
      style={{
        background: "radial-gradient(ellipse at top left, oklch(28% 0.08 235 / 0.5), oklch(19% 0.03 250) 65%)",
        boxShadow: "0 0 40px oklch(72% 0.19 235 / 0.12)",
      }}
    >
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="h-px w-full" style={{ background: "var(--gradient-electric)" }} />

      <div className="relative px-6 pt-5 pb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl grid place-items-center glow-ring" style={{ backgroundImage: "var(--gradient-electric)" }}>
              <Sparkles className="size-5" style={{ color: "oklch(12% 0.03 250)" }} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary/80 font-semibold">Dataset Intelligence</div>
              <h3 className="text-lg font-bold leading-tight tracking-tight">Point Cloud Analysis Complete</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Analysis complete
            </div>
            <button
              onClick={onReset}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Upload another dataset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 backdrop-blur-sm p-3 flex flex-col gap-1.5" style={{ background: "oklch(20% 0.035 250 / 0.7)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{s.label}</span>
                <div className="size-6 rounded-md grid place-items-center shrink-0" style={{ background: `color-mix(in oklab, ${s.color} 20%, transparent)`, color: s.color }}>
                  <s.icon className="size-3.5" />
                </div>
              </div>
              <div
                className="text-sm font-semibold leading-tight tabular-nums truncate"
                style={s.label === "Processing Status" ? { color: "oklch(68% 0.18 145)" } : undefined}
                title={s.value}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/50 p-4" style={{ background: "oklch(17% 0.03 250 / 0.6)" }}>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 font-semibold">Processing Pipeline</div>
          <div className="flex items-center gap-0 flex-wrap">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === WORKFLOW_STEPS.length - 1;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="size-8 rounded-lg grid place-items-center border"
                      style={{
                        background: "oklch(72% 0.19 235 / 0.15)",
                        borderColor: "oklch(72% 0.19 235 / 0.5)",
                        color: "oklch(72% 0.19 235)",
                        boxShadow: "0 0 12px oklch(72% 0.19 235 / 0.25)",
                      }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[10px] text-center leading-tight max-w-[80px] text-muted-foreground">{step.label}</span>
                  </div>
                  {!isLast && (
                    <div className="flex items-center mx-2 mb-4">
                      <div className="h-px w-8" style={{ background: "linear-gradient(90deg, oklch(72% 0.19 235 / 0.6), oklch(72% 0.19 235 / 0.2))" }} />
                      <svg width="8" height="10" viewBox="0 0 8 10" className="shrink-0">
                        <path d="M0 0 L8 5 L0 10 Z" fill="oklch(72% 0.19 235 / 0.5)" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfrastructureKPIs({ result }: { result: AnalysisResult }) {
  const summary = result.summary!;
  const kpis = result.kpis;
  const rows = [
    { label: "Total Point Cloud", value: fmt(summary.total_points), sub: "pts", icon: Layers, color: "oklch(72% 0.19 235)" },
    { label: "Utility Poles Detected", value: String(summary.total_poles), sub: "poles", icon: TowerControl, color: "oklch(78% 0.16 180)" },
    { label: "Powerline Spans", value: String(summary.total_spans), sub: "spans", icon: RouteIcon, color: "oklch(68% 0.18 145)" },
    { label: "Conductors Mapped", value: String(summary.total_conductors), sub: "wires", icon: Zap, color: "oklch(70% 0.2 320)" },
    { label: "Average Sag", value: kpis ? kpis.avg_sag_m.toFixed(2) : "—", sub: "m", icon: Waves, color: "oklch(78% 0.17 80)" },
    { label: "Max Pole Height", value: kpis ? kpis.highest_pole.value.toFixed(2) : "—", sub: "m", icon: Gauge, color: "oklch(72% 0.19 235)" },
  ];
  return (
    <section>
      <SectionHeader eyebrow="Infrastructure Overview" title="Engineering KPIs" subtitle="Assets extracted and analyzed from the classified point cloud." />
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{kpi.label}</span>
              <div className="size-8 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklab, ${kpi.color} 18%, transparent)`, color: kpi.color }}>
                <kpi.icon className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-1.5">
              <span className="text-3xl font-semibold tabular-nums tracking-tight">{kpi.value}</span>
              <span className="text-sm text-muted-foreground mb-0.5">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NetworkOverview({ result }: { result: AnalysisResult }) {
  const [hoveredPole, setHoveredPole] = useState<number | null>(null);
  const [hoveredSpan, setHoveredSpan] = useState<number | null>(null);

  const poles: Pole[] = result.poles;
  const spans: Span[] = result.spans;
  const poleCount = poles.length;
  const spanCount = spans.length;
  const conductorCount = result.summary!.total_conductors;
  const poleHeights = poles.map((p) => p.height_m);
  const spanDistances = spans.map((s) => s.distance_m);

  const SVG_W = 1100;
  const SVG_H = 260;
  const PADDING_L = 55;
  const PADDING_R = 55;
  const RAIL_Y = 168;
  const POLE_H = 80;
  const POLE_TOP_Y = RAIL_Y - POLE_H;
  const COND_SAG = 22;

  const maxH = poleHeights.length ? Math.max(...poleHeights) : 0;
  const longestSpanIdx = spanDistances.length ? spanDistances.indexOf(Math.max(...spanDistances)) : -1;
  const kpis = result.kpis;

  const poleX = (i: number) => PADDING_L + (poleCount > 1 ? (i / (poleCount - 1)) : 0) * (SVG_W - PADDING_L - PADDING_R);

  if (poleCount < 2) {
    return (
      <section>
        <SectionHeader eyebrow="Network Topology" title="Transmission Line Overview" subtitle="Not enough poles were detected to render a corridor topology." />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Network Topology"
        title="Transmission Line Overview"
        subtitle="Spatial layout of detected poles and conductor spans — all nodes aligned on the same baseline."
      />

      <div className="mt-5 rounded-2xl border border-border bg-card/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{poleCount} poles · {spanCount} spans · {conductorCount} conductors</span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "oklch(72% 0.19 235)" }} />
              Primary conductors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "oklch(78% 0.16 180)" }} />
              Secondary conductors
            </span>
          </div>
          <div className="flex items-center gap-3">
            {kpis && (
              <span className="flex items-center gap-1 text-primary font-medium">
                ★ {kpis.highest_pole.label} — highest ({kpis.highest_pole.value.toFixed(2)} m)
              </span>
            )}
            <span className="font-mono">{result.summary!.filename}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width="100%"
            style={{ minWidth: 620, height: 260 }}
            onMouseLeave={() => { setHoveredPole(null); setHoveredSpan(null); }}
          >
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1={0} y1={t * SVG_H} x2={SVG_W} y2={t * SVG_H} stroke="oklch(30% 0.03 245 / 0.2)" strokeWidth={0.5} strokeDasharray="4 6" />
            ))}

            <line x1={PADDING_L - 10} y1={RAIL_Y + 14} x2={SVG_W - PADDING_R + 10} y2={RAIL_Y + 14} stroke="oklch(40% 0.05 245 / 0.5)" strokeWidth={1.5} />

            {Array.from({ length: spanCount }, (_, i) => {
              const x1 = poleX(i);
              const x2 = poleX(i + 1);
              const midX = (x1 + x2) / 2;
              const isHov = hoveredSpan === i;
              return [-8, 0, 8].map((off, k) => {
                const topY = POLE_TOP_Y + off;
                const sagY = POLE_TOP_Y + COND_SAG + Math.abs(off) * 0.6;
                const isPrim = k === 1;
                const stroke = isHov ? "oklch(90% 0.14 200)" : isPrim ? "oklch(72% 0.19 235)" : "oklch(78% 0.16 180)";
                return (
                  <path
                    key={`${i}-${k}`}
                    d={`M ${x1} ${topY} Q ${midX} ${sagY} ${x2} ${topY}`}
                    stroke={stroke}
                    strokeWidth={isHov ? 2 : 1.4}
                    fill="none"
                    style={{ cursor: "pointer", transition: "stroke 0.15s" }}
                    onMouseEnter={() => setHoveredSpan(i)}
                  />
                );
              });
            })}

            {Array.from({ length: spanCount }, (_, i) => {
              const midX = (poleX(i) + poleX(i + 1)) / 2;
              const labelY = POLE_TOP_Y - 16;
              const isLon = i === longestSpanIdx;
              const isHov = hoveredSpan === i;
              return (
                <g key={`dist-${i}`}>
                  <line x1={poleX(i) + 4} y1={labelY + 2} x2={midX - 12} y2={labelY + 2}
                    stroke={isLon ? "oklch(78% 0.17 80 / 0.6)" : "oklch(50% 0.05 245 / 0.5)"} strokeWidth={0.8} />
                  <line x1={midX + 12} y1={labelY + 2} x2={poleX(i + 1) - 4} y2={labelY + 2}
                    stroke={isLon ? "oklch(78% 0.17 80 / 0.6)" : "oklch(50% 0.05 245 / 0.5)"} strokeWidth={0.8} />
                  <text x={midX} y={labelY} textAnchor="middle" fontSize={isLon ? 9.5 : 8.5}
                    fontWeight={isLon || isHov ? "700" : "400"}
                    fill={isLon ? "oklch(78% 0.17 80)" : isHov ? "oklch(82% 0.17 220)" : "oklch(60% 0.04 245)"}>
                    {spanDistances[i]?.toFixed(2)}m{isLon ? " ★" : ""}
                  </text>
                </g>
              );
            })}

            {poleHeights.map((h, i) => {
              const x = poleX(i);
              const isMax = h === maxH;
              const isHov = hoveredPole === i;
              const poleColor = isMax ? "oklch(72% 0.19 235)" : isHov ? "oklch(82% 0.17 220)" : "oklch(55% 0.09 240)";

              return (
                <g key={i} style={{ cursor: "pointer" }} onMouseEnter={() => setHoveredPole(i)}>
                  {isMax && (
                    <line x1={x} y1={POLE_TOP_Y - 4} x2={x} y2={RAIL_Y + 14} stroke="oklch(72% 0.19 235 / 0.18)" strokeWidth={14} strokeLinecap="round" />
                  )}
                  <line x1={x} y1={POLE_TOP_Y} x2={x} y2={RAIL_Y + 14} stroke={poleColor} strokeWidth={isHov ? 3 : isMax ? 2.5 : 2} strokeLinecap="round" style={{ transition: "stroke 0.15s" }} />
                  {[0, 26, 52].map((dy) => (
                    <line key={dy} x1={x - 14} y1={POLE_TOP_Y + dy} x2={x + 14} y2={POLE_TOP_Y + dy} stroke={poleColor} strokeWidth={1.6} strokeLinecap="round" style={{ transition: "stroke 0.15s" }} />
                  ))}
                  <circle cx={x} cy={POLE_TOP_Y} r={isMax ? 6 : isHov ? 5.5 : 4.5} fill={isMax ? "oklch(72% 0.19 235)" : "oklch(26% 0.04 250)"} stroke={poleColor} strokeWidth={1.8} style={{ transition: "all 0.15s" }} />
                  {isMax && <circle cx={x} cy={POLE_TOP_Y} r={10} fill="none" stroke="oklch(72% 0.19 235 / 0.4)" strokeWidth={1} />}
                  <text x={x} y={POLE_TOP_Y - 14} textAnchor="middle" fontSize={isMax ? 10 : 9} fontWeight={isMax ? "700" : "500"}
                    fill={isMax ? "oklch(72% 0.19 235)" : isHov ? "oklch(82% 0.17 220)" : "oklch(65% 0.04 245)"} style={{ transition: "fill 0.15s" }}>
                    {h.toFixed(2)}m
                  </text>
                  <text x={x} y={RAIL_Y + 28} textAnchor="middle" fontSize={9} fontWeight={isMax ? "700" : "400"} fill={isMax ? "oklch(72% 0.19 235)" : "oklch(55% 0.04 245)"}>
                    P{poles[i].id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="px-5 py-2.5 border-t border-border min-h-[38px] flex items-center gap-6 text-xs transition-all" style={{ background: "oklch(17% 0.03 250 / 0.5)" }}>
          {hoveredPole !== null ? (
            <>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: "oklch(72% 0.19 235)" }}>
                <TowerControl className="size-3.5" />
                Pole {poles[hoveredPole].id}
              </span>
              <span className="text-muted-foreground">Height: <span className="text-foreground font-mono">{poleHeights[hoveredPole].toFixed(2)} m</span></span>
              {poleHeights[hoveredPole] === maxH && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "oklch(72% 0.19 235 / 0.15)", color: "oklch(72% 0.19 235)" }}>
                  ★ Highest Pole in Network
                </span>
              )}
            </>
          ) : hoveredSpan !== null ? (
            <>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: "oklch(78% 0.16 180)" }}>
                <Zap className="size-3.5" />
                Span {spans[hoveredSpan].start_pole}–{spans[hoveredSpan].end_pole}
              </span>
              <span className="text-muted-foreground">
                Pole-to-pole distance: <span className="text-foreground font-mono">{spanDistances[hoveredSpan]?.toFixed(2)} m</span>
              </span>
              {hoveredSpan === longestSpanIdx && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "oklch(78% 0.17 80 / 0.15)", color: "oklch(78% 0.17 80)" }}>
                  ★ Longest Span in Network
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Hover over a pole or conductor span for details</span>
          )}
        </div>
      </div>
    </section>
  );
}

function Analytics({ result }: { result: AnalysisResult }) {
  const data = useMemo(
    () =>
      result.classification_breakdown.map((c) => ({
        name: `C${c.class_id}`,
        full: c.label,
        points: c.point_count,
        fill: classMeta(c.class_id).swatch,
      })),
    [result]
  );
  return (
    <section>
      <SectionHeader eyebrow="Point Cloud Analytics" title="Classification Breakdown" subtitle="Distribution of points across ASPRS classification classes." />
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <ChartCard title="Points by Class" icon={Layers}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(30% 0.03 245 / 0.5)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                  {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-5">
          <ChartCard title="Class Composition" icon={Layers}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data} dataKey="points" nameKey="full" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [fmt(v), "Points"]} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

function IntelligenceAndComposition({ result }: { result: AnalysisResult }) {
  const kpis = result.kpis;
  return (
    <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 rounded-2xl border border-primary/30 p-6 relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at top right, oklch(30% 0.1 235 / 0.45), transparent 60%)" }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/20 grid place-items-center text-primary glow-ring">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80">Engineering Insight</div>
              <h3 className="text-xl font-semibold leading-tight">Infrastructure Intelligence</h3>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetectedAssets result={result} />
            {kpis && (
              <>
                <Insight icon={TowerControl} label="Highest Pole" primary={kpis.highest_pole.label} value={`${kpis.highest_pole.value.toFixed(2)} m`} />
                <Insight icon={Ruler} label="Longest Conductor" primary={kpis.longest_conductor.label} value={`${kpis.longest_conductor.value.toFixed(2)} m`} />
                <Insight icon={Waves} label="Maximum Sag" primary={kpis.max_sag.label} value={`${kpis.max_sag.value.toFixed(2)} m`} />
                <Insight icon={Gauge} label="Average Pole Height" primary="Network-wide" value={`${kpis.avg_pole_height_m.toFixed(2)} m`} />
                <Insight icon={Activity} label="Average Conductor Sag" primary="Network-wide" value={`${kpis.avg_sag_m.toFixed(2)} m`} />
              </>
            )}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-primary">
            <Activity className="size-3.5" />
            Ready for span clearance, sag, and right-of-way analysis
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card/70 backdrop-blur overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Dataset Composition</div>
            <h3 className="text-sm font-semibold mt-0.5">Asset Categories Present</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">{result.classification_breakdown.length} classes</span>
        </div>
        <ul className="divide-y divide-border">
          {result.classification_breakdown.map((c) => {
            const meta = classMeta(c.class_id);
            const Icon = meta.icon;
            return (
              <li key={c.class_id} className="flex items-center gap-3 px-5 py-3">
                <div className="size-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in oklab, ${meta.swatch} 18%, transparent)`, color: meta.swatch }}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground">Class {c.class_id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{fmt(c.point_count)}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">{c.pct.toFixed(2)}%</div>
                </div>
                <span className="ml-2 size-2 rounded-full" style={{ background: meta.swatch }} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function DetectedAssets({ result }: { result: AnalysisResult }) {
  const summary = result.summary!;
  return (
    <div className="rounded-xl border border-border bg-background/40 backdrop-blur p-4 md:col-span-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Detected Assets</div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { icon: TowerControl, label: "Utility Poles", value: summary.total_poles },
          { icon: RouteIcon, label: "Powerline Spans", value: summary.total_spans },
          { icon: Zap, label: "Conductors", value: summary.total_conductors },
        ].map((it) => (
          <div key={it.label} className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
              <it.icon className="size-4" />
            </div>
            <div>
              <div className="text-lg font-semibold tabular-nums leading-none">{it.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{it.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Insight({ icon: Icon, label, primary, value }: { icon: React.ComponentType<{ className?: string }>, label: string, primary: string, value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 backdrop-blur p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 text-base font-semibold leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 truncate" title={primary}>{primary}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string, title: string, subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80">{eyebrow}</div>
        <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string, icon: React.ComponentType<{ className?: string }>, children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 rounded-lg bg-accent grid place-items-center text-primary">
          <Icon className="size-4" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DarkTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { full?: string; name: string } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="font-medium">{p.payload.full ?? p.payload.name}</div>
      <div className="text-muted-foreground tabular-nums mt-0.5">{fmt(p.value)} points</div>
    </div>
  );
}

function Footer({ filename }: { filename?: string }) {
  return (
    <footer className="border-t border-border mt-6">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>GridScan · LiDAR Powerline Analytics · v1.0{filename ? ` · ${filename}` : ""}</div>
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-400" /> All systems operational
        </div>
      </div>
    </footer>
  );
}
