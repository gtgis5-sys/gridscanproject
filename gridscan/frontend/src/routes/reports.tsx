import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileBox,
  FileText,
  Layers,
  Loader2,
  Map,
  Ruler,
  TowerControl,
  Waves,
  Zap,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { ReportHeader } from "../components/ReportHeader";
import {
  generateAssetInventoryReport,
  generateEnergyLossReport,
  generateFullSummaryReport,
  generateNetworkTopologyReport,
  generateSagAnalysisReport,
  generateSpanAnalyticsReport,
  generateTxtReport,
} from "../lib/generateReport";
import { NETWORK_SUMMARY, SPANS } from "../lib/reportData";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

// ─── types ────────────────────────────────────────────────────────────────────

type DownloadState = "idle" | "generating" | "success" | "error";

const STATUS_CONFIG = {
  normal:   { label: "Normal",   color: "oklch(68% 0.18 145)", bg: "oklch(68% 0.18 145 / 0.15)" },
  warning:  { label: "Warning",  color: "oklch(78% 0.17 80)",  bg: "oklch(78% 0.17 80 / 0.15)"  },
  critical: { label: "Critical", color: "oklch(65% 0.22 25)",  bg: "oklch(65% 0.22 25 / 0.15)"  },
};

// ─── report catalogue ─────────────────────────────────────────────────────────

const REPORT_CATALOGUE = [
  {
    id: "assets",
    label: "Asset Inventory Report",
    filename: "Asset_Inventory_Report",
    icon: TowerControl,
    desc: "Complete pole and conductor registry with coordinates and heights",
    color: "oklch(72% 0.19 235)",
    pdfFn: generateAssetInventoryReport,
    txtKey: "Asset Inventory Report",
  },
  {
    id: "topology",
    label: "Network Topology Report",
    filename: "Network_Topology_Report",
    icon: Map,
    desc: "Spatial layout of poles and spans across the transmission corridor",
    color: "oklch(78% 0.16 180)",
    pdfFn: generateNetworkTopologyReport,
    txtKey: "Network Topology Report",
  },
  {
    id: "span",
    label: "Span Analytics Report",
    filename: "Span_Analysis_Report",
    icon: Activity,
    desc: "Wire length, pole span, and expansion analysis per conductor",
    color: "oklch(68% 0.18 145)",
    pdfFn: generateSpanAnalyticsReport,
    txtKey: "Span Analytics Report",
  },
  {
    id: "sag",
    label: "Sag Analysis Report",
    filename: "Conductor_Sag_Report",
    icon: Waves,
    desc: "Conductor sag measurements, thresholds and field recommendations",
    color: "oklch(70% 0.2 320)",
    pdfFn: generateSagAnalysisReport,
    txtKey: "Sag Analysis Report",
  },
  {
    id: "energy",
    label: "Energy Loss Report",
    filename: "Energy_Loss_Report",
    icon: Zap,
    desc: "Additional power loss and annual energy waste per conductor",
    color: "oklch(65% 0.22 25)",
    pdfFn: generateEnergyLossReport,
    txtKey: "Energy Loss Report",
  },
  {
    id: "full",
    label: "Full Engineering Summary",
    filename: "Full_Engineering_Summary_Report",
    icon: FileText,
    desc: "Comprehensive LiDAR analysis — all sections in one document",
    color: "oklch(78% 0.17 80)",
    pdfFn: generateFullSummaryReport,
    txtKey: "Full Engineering Summary Report",
  },
];

// ─── main page ────────────────────────────────────────────────────────────────

function ReportsPage() {
  const [activeSpan, setActiveSpan] = useState("3-4");
  const [dlStates, setDlStates] = useState<Record<string, DownloadState>>({});
  const [globalMsg, setGlobalMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const activeReport = SPANS.find((r) => r.id === activeSpan)!;

  // ── download handler ──────────────────────────────────────────────────────

  const handlePdfDownload = async (id: string, label: string, fn: () => Promise<void>) => {
    setDlStates((s) => ({ ...s, [id]: "generating" }));
    setGlobalMsg({ text: `Generating "${label}"…`, type: "info" });
    try {
      await fn();
      setDlStates((s) => ({ ...s, [id]: "success" }));
      setGlobalMsg({ text: `"${label}" opened for print / Save as PDF`, type: "success" });
    } catch (err) {
      console.error(err);
      setDlStates((s) => ({ ...s, [id]: "error" }));
      setGlobalMsg({ text: `Error generating "${label}". Please try again.`, type: "error" });
    } finally {
      setTimeout(() => {
        setDlStates((s) => ({ ...s, [id]: "idle" }));
        setGlobalMsg(null);
      }, 4000);
    }
  };

  const handleTxtDownload = (id: string, label: string, key: string) => {
    setDlStates((s) => ({ ...s, [`${id}_txt`]: "generating" }));
    setGlobalMsg({ text: `Generating TXT: "${label}"…`, type: "info" });
    try {
      generateTxtReport(key);
      setTimeout(() => {
        setDlStates((s) => ({ ...s, [`${id}_txt`]: "success" }));
        setGlobalMsg({ text: `"${label}.txt" downloaded successfully!`, type: "success" });
        setTimeout(() => {
          setDlStates((s) => ({ ...s, [`${id}_txt`]: "idle" }));
          setGlobalMsg(null);
        }, 3000);
      }, 400);
    } catch {
      setDlStates((s) => ({ ...s, [`${id}_txt`]: "error" }));
      setGlobalMsg({ text: "TXT export failed. Please try again.", type: "error" });
      setTimeout(() => setGlobalMsg(null), 3500);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header className="border-b border-border bg-sidebar/40 backdrop-blur-xl">
          <div className="px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.2em]">
                <FileBox className="size-3.5" /> Module 06
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Reports</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Generate and export professional engineering reports for all spans and conductors.
              </p>
            </div>

            {/* Global status toast */}
            {globalMsg && (
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  globalMsg.type === "success"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : globalMsg.type === "error"
                    ? "border-red-400/30 bg-red-400/10 text-red-300"
                    : "border-primary/30 bg-primary/10 text-primary animate-pulse"
                }`}
              >
                {globalMsg.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : globalMsg.type === "error" ? (
                  <AlertTriangle className="size-4 shrink-0" />
                ) : (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                )}
                {globalMsg.text}
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-6 space-y-8">

          {/* ── Branded preview banner ──────────────────────────────────────── */}
          <ReportHeader
            reportTitle="GridScan LiDAR Powerline Analytics — Report Centre"
            datasetName="clip.las"
          />

          {/* ── Report catalogue ─────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80">Available Reports</div>
                <h2 className="text-lg font-semibold mt-0.5">Export Engineering Reports</h2>
              </div>
              <div className="text-xs text-muted-foreground hidden md:block">
                PDF opens print dialog → Save as PDF &nbsp;·&nbsp; TXT downloads directly
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_CATALOGUE.map((rt) => {
                const pdfState = dlStates[rt.id] ?? "idle";
                const txtState = dlStates[`${rt.id}_txt`] ?? "idle";
                return (
                  <ReportCard
                    key={rt.id}
                    report={rt}
                    pdfState={pdfState}
                    txtState={txtState}
                    onPdf={() => handlePdfDownload(rt.id, rt.label, rt.pdfFn)}
                    onTxt={() => handleTxtDownload(rt.id, rt.label, rt.txtKey)}
                  />
                );
              })}
            </div>
          </section>

          {/* ── Span report cards + preview ─────────────────────────────── */}
          <section>
            <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80 mb-1">Per-Span Reports</div>
            <h2 className="text-lg font-semibold mb-4">Span Detail & Preview</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Span card list */}
              <div className="space-y-3">
                {SPANS.map((r) => {
                  const s = STATUS_CONFIG[r.status];
                  const isActive = r.id === activeSpan;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setActiveSpan(r.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isActive
                          ? "border-primary/60 bg-primary/5 shadow-[0_0_0_1px_var(--primary)]"
                          : "border-border bg-card/40 hover:bg-card/70 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono">Span {r.id}</span>
                          {isActive && <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ color: s.color, background: s.bg }}>
                          {s.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                        <span>Upper sag: <span className="text-foreground font-mono">{r.upperSag} m</span></span>
                        <span>Lower sag: <span className="font-mono"
                          style={{ color: r.lowerSag > 2 ? "oklch(65% 0.22 25)" : "var(--foreground)" }}>
                          {r.lowerSag} m</span>
                        </span>
                        <span>Upper loss: <span className="text-foreground font-mono">{r.upperLoss.toFixed(3)} W</span></span>
                        <span>Lower loss: <span className="text-foreground font-mono">{r.lowerLoss.toFixed(3)} W</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preview panel */}
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card/60 overflow-hidden flex flex-col">

                {/* Panel header */}
                <div className="px-5 py-4 border-b border-border bg-background/30">
                  <ReportHeader
                    reportTitle={`Span ${activeReport.id} — Conductor Analysis`}
                    compact
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
                      style={{
                        color: STATUS_CONFIG[activeReport.status].color,
                        background: STATUS_CONFIG[activeReport.status].bg,
                      }}>
                      {STATUS_CONFIG[activeReport.status].label}
                    </span>
                    <div className="flex items-center gap-2">
                      <DownloadBtn
                        label="PDF"
                        state={dlStates[`span_${activeReport.id}`] ?? "idle"}
                        onClick={() =>
                          handlePdfDownload(
                            `span_${activeReport.id}`,
                            `Span ${activeReport.id} Report`,
                            generateSpanAnalyticsReport
                          )
                        }
                      />
                      <DownloadBtn
                        label="TXT"
                        state={dlStates[`span_${activeReport.id}_txt`] ?? "idle"}
                        variant="secondary"
                        onClick={() =>
                          handleTxtDownload(
                            `span_${activeReport.id}`,
                            `Span_${activeReport.id}_Report`,
                            "Span Analytics Report"
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Panel body */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">

                  {/* Metadata */}
                  <div className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Span Metadata</div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {[
                        { label: "Span ID", value: `Span ${activeReport.id}` },
                        { label: "Pole From", value: `Pole ${activeReport.poleFrom}` },
                        { label: "Pole To", value: `Pole ${activeReport.poleTo}` },
                        { label: "Pole-to-Pole", value: `${activeReport.poleSpan} m` },
                        { label: "Conductors", value: "2 (Upper + Lower)" },
                        { label: "Status", value: STATUS_CONFIG[activeReport.status].label,
                          color: STATUS_CONFIG[activeReport.status].color },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="text-[10px] text-muted-foreground">{m.label}</div>
                          <div className="font-semibold mt-0.5 text-sm" style={m.color ? { color: m.color } : undefined}>
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conductors */}
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Conductor Analysis</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Upper Conductor",
                          color: "oklch(72% 0.19 235)",
                          sag: activeReport.upperSag,
                          length: activeReport.upperLength,
                          loss: activeReport.upperLoss,
                        },
                        {
                          label: "Lower Conductor",
                          color: "oklch(70% 0.2 320)",
                          sag: activeReport.lowerSag,
                          length: activeReport.lowerLength,
                          loss: activeReport.lowerLoss,
                        },
                      ].map((c) => (
                        <div key={c.label} className="rounded-xl border border-border bg-background/40 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="size-2 rounded-full" style={{ background: c.color }} />
                            <span className="text-xs font-semibold">{c.label}</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { icon: Waves,  label: "Sag",          value: `${c.sag} m`,                  alert: c.sag > 2 },
                              { icon: Ruler,  label: "Wire Length",   value: `${c.length} m`,               alert: false },
                              { icon: Zap,    label: "Power Loss",    value: `${c.loss.toFixed(3)} W`,       alert: c.loss > 2 },
                              { icon: Activity, label: "Energy Waste", value: `${(c.loss * 8.76).toFixed(2)} kWh/yr`, alert: false },
                            ].map((row) => (
                              <div key={row.label} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <row.icon className="size-3" />
                                  {row.label}
                                </div>
                                <span className="font-mono font-semibold"
                                  style={row.alert ? { color: "oklch(65% 0.22 25)" } : undefined}>
                                  {row.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="rounded-xl border border-border bg-background/40 p-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Recommendations</div>
                    {activeReport.status === "critical" && (
                      <div className="space-y-2">
                        {[
                          "Immediate conductor retensioning required on lower wire",
                          "Schedule inspection within 30 days",
                          "Review thermal expansion calculations for this span",
                          "Consider conductor replacement if retensioning is insufficient",
                        ].map((rec) => (
                          <div key={rec} className="flex items-start gap-2 text-xs">
                            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" style={{ color: "oklch(65% 0.22 25)" }} />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeReport.status === "warning" && (
                      <div className="space-y-2">
                        {[
                          "Monitor conductor sag over the next 90 days",
                          "Schedule maintenance during next planned outage",
                          "Document current sag measurements for trending",
                        ].map((rec) => (
                          <div key={rec} className="flex items-start gap-2 text-xs">
                            <Activity className="size-3.5 shrink-0 mt-0.5" style={{ color: "oklch(78% 0.17 80)" }} />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeReport.status === "normal" && (
                      <div className="space-y-2">
                        {[
                          "No immediate action required",
                          "Continue standard annual inspection schedule",
                          "All measurements within acceptable limits",
                        ].map((rec) => (
                          <div key={rec} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" style={{ color: "oklch(68% 0.18 145)" }} />
                            <span className="text-muted-foreground">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Project summary ───────────────────────────────────────────── */}
          <section
            className="rounded-2xl border border-primary/30 p-6 relative overflow-hidden"
            style={{ background: "radial-gradient(ellipse at bottom right, oklch(30% 0.1 235 / 0.35), transparent 60%)" }}
          >
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="size-10 rounded-xl bg-primary/20 grid place-items-center text-primary glow-ring">
                  <Layers className="size-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80">Final Summary</div>
                  <h3 className="text-xl font-semibold">Project Analysis Complete</h3>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <DownloadBtn
                    label="Full PDF"
                    state={dlStates["full"] ?? "idle"}
                    onClick={() =>
                      handlePdfDownload("full", "Full Engineering Summary", generateFullSummaryReport)
                    }
                    large
                  />
                  <DownloadBtn
                    label="Full TXT"
                    variant="secondary"
                    state={dlStates["full_txt"] ?? "idle"}
                    onClick={() =>
                      handleTxtDownload("full", "Full_Engineering_Summary", "Full Engineering Summary Report")
                    }
                    large
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Points", value: "460,218", sub: "LiDAR pts",   icon: Layers },
                  { label: "Utility Poles", value: "8",       sub: "detected",    icon: TowerControl },
                  { label: "Spans",         value: "5",       sub: "analyzed",    icon: Activity },
                  { label: "Conductors",    value: "10",      sub: "wires",       icon: Zap },
                  { label: "Max Sag",       value: "2.22 m",  sub: "Span 3–4 L", icon: Waves },
                  { label: "Annual Loss",   value: `${NETWORK_SUMMARY.totalEnergyWaste} kWh`, sub: "per year", icon: Zap },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-background/40 backdrop-blur p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                      <s.icon className="size-3.5 text-primary" />
                    </div>
                    <div className="text-lg font-semibold tabular-nums leading-none">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: "oklch(68% 0.18 145)" }} />
                    1 span normal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: "oklch(78% 0.17 80)" }} />
                    3 spans warning
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: "oklch(65% 0.22 25)" }} />
                    1 span critical
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Analysis generated · GridScan Engine v3.2 · LAS 1.4
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// ─── ReportCard component ─────────────────────────────────────────────────────

function ReportCard({
  report, pdfState, txtState, onPdf, onTxt,
}: {
  report: typeof REPORT_CATALOGUE[0];
  pdfState: DownloadState;
  txtState: DownloadState;
  onPdf: () => void;
  onTxt: () => void;
}) {
  const Icon = report.icon;
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors">
      {/* header */}
      <div className="flex items-start gap-3">
        <div
          className="size-10 rounded-xl grid place-items-center shrink-0"
          style={{
            background: `color-mix(in oklab, ${report.color} 18%, transparent)`,
            color: report.color,
          }}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{report.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{report.desc}</div>
        </div>
      </div>

      {/* download buttons */}
      <div className="flex items-center gap-2 mt-auto">
        <DownloadBtn label="PDF" state={pdfState} onClick={onPdf} fullWidth />
        <DownloadBtn label="TXT" state={txtState} onClick={onTxt} variant="secondary" />
      </div>
    </div>
  );
}

// ─── DownloadBtn ──────────────────────────────────────────────────────────────

function DownloadBtn({
  label, state, onClick, variant = "primary", fullWidth = false, large = false,
}: {
  label: string;
  state: DownloadState;
  onClick: () => void;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  large?: boolean;
}) {
  const base = `flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all
    ${large ? "px-4 py-2.5 text-sm" : "px-3 py-2 text-xs"}
    ${fullWidth ? "flex-1" : ""}
    disabled:opacity-50 disabled:cursor-not-allowed`;

  const primary = "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20";
  const secondary = "border border-border bg-background/60 text-muted-foreground hover:text-foreground hover:bg-accent";
  const success = "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  const error = "border border-red-400/30 bg-red-400/10 text-red-300";

  const cls =
    state === "success" ? success :
    state === "error"   ? error   :
    variant === "primary" ? primary : secondary;

  return (
    <button onClick={onClick} disabled={state === "generating"} className={`${base} ${cls}`}>
      {state === "generating" ? (
        <><Loader2 className="size-3.5 animate-spin" />Generating…</>
      ) : state === "success" ? (
        <><CheckCircle2 className="size-3.5" />Done</>
      ) : state === "error" ? (
        <><AlertTriangle className="size-3.5" />Error</>
      ) : (
        <><Download className="size-3.5" />{label}</>
      )}
    </button>
  );
}
