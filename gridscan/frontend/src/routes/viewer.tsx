import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Box, Cable, CircuitBoard, Layers, Loader2, Maximize2, Mountain,
  Network, Radio, RotateCcw, TowerControl,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { PointCloudViewer3D, type ViewMode } from "../components/PointCloudViewer3D";
import { useAnalysis } from "../lib/AnalysisContext";
import type { ClassificationBreakdown } from "../lib/api";

export const Route = createFileRoute("/viewer")({
  component: ViewerPage,
});

// Purely cosmetic/educational per-class metadata: icon, render color, and
// plain-language description of what each ASPRS class typically represents.
// None of this carries any count, percentage, or measurement — those always
// come from the backend's classification_breakdown for the uploaded dataset.
const CLASS_META: Record<number, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  usedFor: string[];
}> = {
  2: {
    icon: Mountain, color: "#4ade80",
    description: "Ground terrain beneath the transmission corridor. Used as a reference plane for pole height and conductor clearance measurements.",
    usedFor: ["Terrain reference plane", "Conductor clearance baseline", "Corridor topography"],
  },
  9: {
    icon: Layers, color: "#facc15",
    description: "Miscellaneous classified objects within the corridor — vegetation clusters, structures, or unclassified obstacles.",
    usedFor: ["Obstacle detection", "Corridor encroachment review", "Manual reclassification candidates"],
  },
  18: {
    icon: TowerControl, color: "#38bdf8",
    description: "Vertical pole structures supporting the overhead transmission network. The foundation for span topology and pole-height analysis.",
    usedFor: ["Pole detection", "Pole center extraction", "Pole height estimation", "Span generation"],
  },
  20: {
    icon: Radio, color: "#e879f9",
    description: "Auxiliary and secondary conductors running alongside the primary transmission lines. Typically lower point density.",
    usedFor: ["Auxiliary conductor identification", "Secondary wire analysis"],
  },
  21: {
    icon: Cable, color: "#2dd4bf",
    description: "Primary overhead power conductors. Forms the catenary curves between poles and drives span-level sag, length, and clearance analytics.",
    usedFor: ["Conductor extraction", "Wire length calculation", "Sag analysis", "Span-level analysis"],
  },
};
const DEFAULT_META = {
  icon: Layers, color: "#94a3b8",
  description: "Unrecognized classification code present in this dataset.",
  usedFor: ["Manual review"],
};
const classMeta = (id: number) => CLASS_META[id] ?? DEFAULT_META;

function ViewerPage() {
  const { result, status, fetchPointCloud } = useAnalysis();
  const classes: ClassificationBreakdown[] = result?.classification_breakdown ?? [];
  const totalPoints = result?.summary?.total_points ?? 0;

  const [allPoints, setAllPoints] = useState<number[][] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [visibleClasses, setVisibleClasses] = useState<Set<number>>(new Set());
  const [activeCode, setActiveCode] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [pointSize, setPointSize] = useState(2);
  const [resetToken, setResetToken] = useState(0);

  // Fetch the full (downsampled) multi-class point cloud once per analysis —
  // real LAS/LAZ points parsed server-side by laspy, not re-parsed in the
  // browser and not a chart of any kind.
  useEffect(() => {
    if (status !== "complete" || !result) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchPointCloud({ maxPoints: 250_000 })
      .then((pc) => {
        if (cancelled) return;
        setAllPoints(pc.points);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load point cloud data.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, result, fetchPointCloud]);

  useEffect(() => {
    if (classes.length && visibleClasses.size === 0) {
      setVisibleClasses(new Set(classes.map((c) => c.class_id)));
    }
    if (classes.length && activeCode === null) {
      const preferred = classes.find((c) => c.class_id === 18) ?? classes[0];
      setActiveCode(preferred.class_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  const classColors = useMemo(() => {
    const map: Record<number, string> = {};
    classes.forEach((c) => { map[c.class_id] = classMeta(c.class_id).color; });
    return map;
  }, [classes]);

  const active = classes.find((c) => c.class_id === activeCode) ?? null;
  const meta = active ? classMeta(active.class_id) : DEFAULT_META;
  const Icon = meta.icon;

  const toggleClass = (id: number) => {
    setVisibleClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderedCount = allPoints
    ? allPoints.filter((p) => visibleClasses.has(p[3])).length
    : 0;

  if (status !== "complete" || !result) {
    return (
      <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <Sidebar />
        <main className="flex-1 min-w-0 grid place-items-center p-10">
          <div className="text-center max-w-md">
            <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mx-auto mb-4">
              <Network className="size-6" />
            </div>
            <h1 className="text-lg font-semibold">No dataset loaded</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Upload a classified LAS/LAZ point cloud from the Home page to explore it here.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="border-b border-border bg-sidebar/40 backdrop-blur-xl">
          <div className="px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.2em]">
                <CircuitBoard className="size-3.5" /> Module 02
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Point Cloud Viewer</h1>
              <p className="text-sm text-muted-foreground mt-1">WebGL render of {result.summary!.filename} — {totalPoints.toLocaleString()} total points.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <Stat label="Total Points" value={totalPoints.toLocaleString()} />
              <Stat label="Rendered" value={renderedCount.toLocaleString()} />
              <Stat label="Classes" value={String(classes.length)} />
            </div>
          </div>
        </header>

        <div className="px-8 py-6 grid grid-cols-12 gap-6">
          {/* Class list / filter */}
          <aside className="col-span-12 lg:col-span-3 space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground px-1 mb-2">Classes · click to filter</div>
            {classes.map((c) => {
              const m = classMeta(c.class_id);
              const CIcon = m.icon;
              const isActive = c.class_id === activeCode;
              const isVisible = visibleClasses.has(c.class_id);
              return (
                <button key={c.class_id}
                  onClick={() => setActiveCode(c.class_id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${isActive ? "border-primary/60 bg-primary/5 shadow-[0_0_0_1px_var(--primary)] glow-ring" : "border-border bg-card/40 hover:bg-card/70"}`}>
                  <div className="flex items-center gap-3">
                    <label
                      onClick={(e) => { e.stopPropagation(); toggleClass(c.class_id); }}
                      className="size-9 rounded-lg grid place-items-center border border-border cursor-pointer shrink-0"
                      style={{ background: isVisible ? `color-mix(in oklab, ${m.color} 22%, transparent)` : "transparent", opacity: isVisible ? 1 : 0.35 }}
                    >
                      <CIcon className="size-4" style={{ color: m.color }} />
                    </label>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">CLS {c.class_id}</span>
                        {isActive && <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />}
                        {!isVisible && <span className="text-[9px] uppercase text-muted-foreground/70 border border-border rounded px-1">hidden</span>}
                      </div>
                      <div className="text-sm font-medium truncate">{c.label}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c.point_count.toLocaleString()} pts</span>
                    <span className="font-mono" style={{ color: m.color }}>{c.pct.toFixed(2)}%</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: m.color, opacity: isVisible ? 1 : 0.3 }} />
                  </div>
                </button>
              );
            })}
          </aside>

          {/* WebGL Viewer */}
          <section className="col-span-12 lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-border bg-background/60 p-0.5">
                    {([
                      { id: "top", label: "Top" },
                      { id: "side", label: "Side" },
                      { id: "3d", label: "3D" },
                    ] as { id: ViewMode; label: string }[]).map((v) => (
                      <button key={v.id} onClick={() => setViewMode(v.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${viewMode === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        {v.label} View
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setResetToken((t) => t + 1)}
                    className="size-7 grid place-items-center rounded-md border border-border bg-background/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Reset view">
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Maximize2 className="size-3.5" />
                  <span>Point size</span>
                  <input
                    type="range" min={0.5} max={8} step={0.5} value={pointSize}
                    onChange={(e) => setPointSize(Number(e.target.value))}
                    className="w-24 accent-primary"
                  />
                  <span className="font-mono w-6 text-right">{pointSize.toFixed(1)}</span>
                </div>
              </div>
              <div className="relative aspect-[16/10]" style={{ background: "#0a0f1a" }}>
                {loading ? (
                  <div className="absolute inset-0 grid place-items-center gap-2 text-muted-foreground text-xs z-10">
                    <Loader2 className="size-5 animate-spin" />
                    Loading point cloud…
                  </div>
                ) : loadError ? (
                  <div className="absolute inset-0 grid place-items-center text-xs text-destructive px-6 text-center z-10">
                    {loadError}
                  </div>
                ) : allPoints && allPoints.length > 0 ? (
                  <PointCloudViewer3D
                    points={allPoints}
                    visibleClasses={visibleClasses}
                    classColors={classColors}
                    viewMode={viewMode}
                    pointSizeMultiplier={pointSize}
                    resetToken={resetToken}
                  />
                ) : null}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur border border-white/10 text-[10px] font-mono uppercase tracking-wider text-muted-foreground pointer-events-none">
                  WebGL · {viewMode === "top" ? "Plan (XY)" : viewMode === "side" ? "Elevation Profile" : "Orbit / 3D"}
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur border border-white/10 text-[10px] font-mono text-muted-foreground pointer-events-none">
                  {renderedCount.toLocaleString()} pts rendered
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur border border-white/10 text-[10px] text-muted-foreground pointer-events-none">
                  {viewMode === "3d" ? "drag to orbit · scroll to zoom · right-drag to pan" : "drag to pan · scroll to zoom"}
                </div>
              </div>
            </div>
          </section>

          {/* Detail panel */}
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            {active && (
              <>
                <div className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl grid place-items-center border border-border"
                      style={{ background: `color-mix(in oklab, ${meta.color} 22%, transparent)` }}>
                      <Icon className="size-5" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">CLASS {active.class_id}</div>
                      <div className="font-semibold leading-tight">{active.label}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Points" value={active.point_count.toLocaleString()} />
                    <Metric label="Share" value={`${active.pct.toFixed(2)}%`} accent={meta.color} />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{meta.description}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Engineering Interpretation</div>
                  <div className="text-sm font-medium mb-2">Used for</div>
                  <ul className="space-y-2">
                    {meta.usedFor.map((u) => (
                      <li key={u} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                        <span className="text-muted-foreground">{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <Box className="size-3.5" /> Renderer
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Three.js WebGL point cloud</li>
                    <li>Real coordinates from the uploaded LAS/LAZ</li>
                    <li>Orbit / pan / zoom via OrbitControls</li>
                    <li>Colored by ASPRS classification</li>
                  </ul>
                </div>
              </>
            )}
          </aside>

          {/* Stats table */}
          <section className="col-span-12">
            <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Dataset Statistics</div>
                  <div className="text-xs text-muted-foreground">Classification summary across {classes.length} ASPRS classes</div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">Total · {totalPoints.toLocaleString()} pts</div>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background/40">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Class</th>
                    <th className="text-left px-5 py-3 font-medium">Description</th>
                    <th className="text-right px-5 py-3 font-medium">Points</th>
                    <th className="text-right px-5 py-3 font-medium">Percentage</th>
                    <th className="text-left px-5 py-3 font-medium w-48">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => {
                    const m = classMeta(c.class_id);
                    return (
                      <tr key={c.class_id} onClick={() => setActiveCode(c.class_id)}
                        className={`border-t border-border cursor-pointer transition-colors ${c.class_id === activeCode ? "bg-primary/5" : "hover:bg-accent/40"}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                            <span className="font-mono">Class {c.class_id}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{c.label}</td>
                        <td className="px-5 py-3 text-right font-mono">{c.point_count.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-mono" style={{ color: m.color }}>{c.pct.toFixed(2)}%</td>
                        <td className="px-5 py-3">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full" style={{ width: `${c.pct}%`, background: m.color }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-border bg-card/60">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-mono font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold font-mono" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
