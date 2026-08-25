// ─────────────────────────────────────────────────────────────────────────────
// ReportHeader.tsx  –  Reusable branded report header for preview panel
// ─────────────────────────────────────────────────────────────────────────────

import { COMPANY_LOGO_PATH, DATASET_INFO, DATASET_NAME, ENGINE_VERSION } from "../lib/reportData";

interface ReportHeaderProps {
  reportTitle: string;
  datasetName?: string;
  generatedDate?: string;
  logoPath?: string;
  compact?: boolean;
}

export function ReportHeader({
  reportTitle,
  datasetName = DATASET_NAME,
  generatedDate,
  logoPath = COMPANY_LOGO_PATH,
  compact = false,
}: ReportHeaderProps) {
  const date = generatedDate ?? new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  return (
    <div
      className={`rounded-xl border border-border overflow-hidden ${compact ? "mb-3" : "mb-5"}`}
      style={{ background: "linear-gradient(135deg, oklch(20% 0.04 250), oklch(18% 0.03 250))" }}
    >
      {/* top accent bar */}
      <div className="h-1 w-full" style={{ background: "var(--gradient-electric)" }} />

      <div className={`flex items-center gap-4 ${compact ? "px-4 py-3" : "px-6 py-4"}`}>
        {/* Logo */}
        <div
          className={`shrink-0 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center ${compact ? "h-10" : "h-14"}`}
          style={{ minWidth: compact ? 80 : 120 }}
        >
          <img
            src={logoPath}
            alt="Company Logo"
            className="h-full w-auto object-contain p-1"
            onError={(e) => {
              // fallback if logo fails to load
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const parent = e.currentTarget.parentElement!;
              parent.style.background = "oklch(20% 0.04 250)";
              parent.innerHTML = `<span style="color:oklch(72% 0.19 235);font-weight:700;font-size:14px;padding:8px;">GS</span>`;
            }}
          />
        </div>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-0.5"
            style={{ color: "oklch(72% 0.19 235)" }}
          >
            GridScan LiDAR Powerline Analytics Platform
          </div>
          <div className={`font-bold leading-tight tracking-tight truncate ${compact ? "text-base" : "text-xl"}`}>
            {reportTitle}
          </div>
          {!compact && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              <span><span className="text-foreground/60">Dataset:</span> {datasetName}</span>
              <span className="text-border">·</span>
              <span>{DATASET_INFO}</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            <div><span className="text-foreground/50">Generated</span></div>
            <div className="font-mono text-[11px] text-foreground/80">{date}</div>
            {!compact && (
              <div className="mt-1 text-[10px]" style={{ color: "oklch(72% 0.19 235 / 0.7)" }}>
                {ENGINE_VERSION}
              </div>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <div
          className="px-6 py-2 border-t border-border/50 flex items-center justify-between text-[10px]"
          style={{ background: "oklch(14% 0.025 250 / 0.6)" }}
        >
          <span className="text-muted-foreground uppercase tracking-widest">Confidential Engineering Report</span>
          <span className="flex items-center gap-1.5" style={{ color: "oklch(72% 0.19 235)" }}>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Analysis Complete
          </span>
        </div>
      )}
    </div>
  );
}
