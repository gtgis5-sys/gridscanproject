import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Ruler,
  TrendingUp,
  Waves,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sidebar } from "../components/Sidebar";

export const Route = createFileRoute("/spans")({
  component: SpansPage,
});

const SPAN_DATA = [
  { id: "2-3 U", span: "2–3", conductor: "Upper", wireLength: 24.15, sag: 1.17, poleSpan: 24.04, expansion: 0.11 },
  { id: "2-3 L", span: "2–3", conductor: "Lower", wireLength: 24.18, sag: 1.91, poleSpan: 23.91, expansion: 0.27 },
  { id: "3-4 U", span: "3–4", conductor: "Upper", wireLength: 23.41, sag: 1.01, poleSpan: 23.30, expansion: 0.11 },
  { id: "3-4 L", span: "3–4", conductor: "Lower", wireLength: 23.33, sag: 2.22, poleSpan: 22.90, expansion: 0.43 },
  { id: "4-5 U", span: "4–5", conductor: "Upper", wireLength: 20.85, sag: 0.74, poleSpan: 20.70, expansion: 0.15 },
  { id: "4-5 L", span: "4–5", conductor: "Lower", wireLength: 19.69, sag: 1.27, poleSpan: 19.53, expansion: 0.16 },
  { id: "5-6 U", span: "5–6", conductor: "Upper", wireLength: 25.16, sag: 1.04, poleSpan: 25.04, expansion: 0.12 },
  { id: "5-6 L", span: "5–6", conductor: "Lower", wireLength: 26.86, sag: 1.82, poleSpan: 26.63, expansion: 0.23 },
  { id: "6-7 U", span: "6–7", conductor: "Upper", wireLength: 22.67, sag: 1.20, poleSpan: 22.58, expansion: 0.09 },
  { id: "6-7 L", span: "6–7", conductor: "Lower", wireLength: 24.72, sag: 1.80, poleSpan: 24.54, expansion: 0.18 },
];

const totalSpans = 5;
const avgSag = +(SPAN_DATA.reduce((s, d) => s + d.sag, 0) / SPAN_DATA.length).toFixed(2);
const maxSag = Math.max(...SPAN_DATA.map((d) => d.sag));
const maxSagSpan = SPAN_DATA.find((d) => d.sag === maxSag)!;
const avgLength = +(SPAN_DATA.reduce((s, d) => s + d.wireLength, 0) / SPAN_DATA.length).toFixed(2);

// Chart data by span
const sagChartData = SPAN_DATA.map((d) => ({
  name: d.id,
  sag: d.sag,
  fill: d.sag > 2 ? "oklch(65% 0.22 25)" : d.sag > 1.5 ? "oklch(78% 0.17 80)" : "oklch(72% 0.19 235)",
}));

const lengthChartData = SPAN_DATA.map((d) => ({
  name: d.id,
  wireLength: d.wireLength,
  poleSpan: d.poleSpan,
}));

// Comparison chart by span (grouped)
const spanGroups = ["2–3", "3–4", "4–5", "5–6", "6–7"];
const comparisonData = spanGroups.map((span) => {
  const upper = SPAN_DATA.find((d) => d.span === span && d.conductor === "Upper")!;
  const lower = SPAN_DATA.find((d) => d.span === span && d.conductor === "Lower")!;
  return {
    span,
    upperSag: upper.sag,
    lowerSag: lower.sag,
    upperLength: upper.wireLength,
    lowerLength: lower.wireLength,
  };
});

function SpansPage() {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-sidebar/40 backdrop-blur-xl">
          <div className="px-8 py-6 flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.2em]">
                <Activity className="size-3.5" /> Module 04
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Span Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Conductor sag, wire length, and span geometry analysis across all detected spans.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <StatBadge label="Spans" value={String(totalSpans)} />
              <StatBadge label="Conductors" value="10" />
              <StatBadge label="Max Sag" value={`${maxSag} m`} accent="oklch(65% 0.22 25)" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Activity}
              label="Total Spans"
              value={String(totalSpans)}
              sub="detected"
              color="oklch(72% 0.19 235)"
            />
            <KpiCard
              icon={Waves}
              label="Average Sag"
              value={`${avgSag} m`}
              sub="across 10 conductors"
              color="oklch(78% 0.16 180)"
              delta={avgSag > 1.5 ? "above threshold" : "within normal"}
              deltaUp={avgSag > 1.5}
            />
            <KpiCard
              icon={TrendingUp}
              label="Maximum Sag"
              value={`${maxSag} m`}
              sub={`${maxSagSpan.id} conductor`}
              color="oklch(65% 0.22 25)"
              deltaUp
              delta="critical level"
            />
            <KpiCard
              icon={Ruler}
              label="Avg Conductor Length"
              value={`${avgLength} m`}
              sub="wire length"
              color="oklch(68% 0.18 145)"
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sag by span */}
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-9 rounded-lg bg-accent grid place-items-center text-primary">
                  <Waves className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Sag by Conductor</h3>
                  <p className="text-xs text-muted-foreground">Measured sag per span wire</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={sagChartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(30% 0.03 245 / 0.5)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "oklch(70% 0.02 245)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" m"
                    domain={[0, 2.5]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
                          <div className="font-semibold">{d.payload.name}</div>
                          <div className="mt-0.5" style={{ color: d.payload.fill }}>Sag: {(d.value as number).toFixed(2)} m</div>
                        </div>
                      );
                    }}
                  />
                  {/* Reference line at 2.0m */}
                  <Bar dataKey="sag" radius={[4, 4, 0, 0]}>
                    {sagChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: "oklch(72% 0.19 235)" }} />Normal</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: "oklch(78% 0.17 80)" }} />Elevated (&gt;1.5m)</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: "oklch(65% 0.22 25)" }} />Critical (&gt;2.0m)</span>
              </div>
            </div>

            {/* Cable length by span */}
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-9 rounded-lg bg-accent grid place-items-center text-primary">
                  <Ruler className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Cable Length by Conductor</h3>
                  <p className="text-xs text-muted-foreground">Wire length vs. pole-to-pole distance</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={lengthChartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(30% 0.03 245 / 0.5)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "oklch(70% 0.02 245)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" m"
                    domain={[15, 30]}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${v.toFixed(2)} m`, name === "wireLength" ? "Wire Length" : "Pole Span"]}
                  />
                  <Legend formatter={(v) => v === "wireLength" ? "Wire Length" : "Pole Span"} wrapperStyle={{ fontSize: 11, color: "oklch(70% 0.02 245)" }} />
                  <Bar dataKey="wireLength" fill="oklch(72% 0.19 235)" radius={[4, 4, 0, 0]} name="wireLength" />
                  <Bar dataKey="poleSpan" fill="oklch(78% 0.16 180 / 0.6)" radius={[4, 4, 0, 0]} name="poleSpan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Span comparison chart */}
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-lg bg-accent grid place-items-center text-primary">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Span Comparison — Upper vs Lower Conductor</h3>
                <p className="text-xs text-muted-foreground">Sag comparison between upper and lower conductors per span</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(30% 0.03 245 / 0.5)" vertical={false} />
                <XAxis dataKey="span" tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }} axisLine={false} tickLine={false} unit=" m" domain={[0, 2.8]} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(2)} m`, name === "upperSag" ? "Upper Sag" : "Lower Sag"]}
                />
                <Legend formatter={(v) => v === "upperSag" ? "Upper Conductor" : "Lower Conductor"} wrapperStyle={{ fontSize: 11, color: "oklch(70% 0.02 245)" }} />
                <Bar dataKey="upperSag" fill="oklch(72% 0.19 235)" radius={[4, 4, 0, 0]} name="upperSag" />
                <Bar dataKey="lowerSag" fill="oklch(70% 0.2 320)" radius={[4, 4, 0, 0]} name="lowerSag" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Span data table */}
          <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Span Detail Table</div>
                <div className="text-xs text-muted-foreground">All conductors with geometry metrics</div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{SPAN_DATA.length} conductors · 5 spans</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background/40">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Span ID</th>
                    <th className="text-left px-5 py-3 font-medium">Conductor</th>
                    <th className="text-right px-5 py-3 font-medium">Pole Span (m)</th>
                    <th className="text-right px-5 py-3 font-medium">Wire Length (m)</th>
                    <th className="text-right px-5 py-3 font-medium">Sag (m)</th>
                    <th className="text-right px-5 py-3 font-medium">Expansion (m)</th>
                    <th className="text-left px-5 py-3 font-medium">Sag Level</th>
                  </tr>
                </thead>
                <tbody>
                  {SPAN_DATA.map((row) => {
                    const sagColor = row.sag > 2 ? "oklch(65% 0.22 25)" : row.sag > 1.5 ? "oklch(78% 0.17 80)" : "oklch(68% 0.18 145)";
                    const sagLabel = row.sag > 2 ? "Critical" : row.sag > 1.5 ? "Elevated" : "Normal";
                    const sagBg = row.sag > 2 ? "oklch(65% 0.22 25 / 0.12)" : row.sag > 1.5 ? "oklch(78% 0.17 80 / 0.12)" : "oklch(68% 0.18 145 / 0.12)";
                    return (
                      <tr
                        key={row.id}
                        onMouseEnter={() => setHoveredRow(row.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`border-t border-border transition-colors ${hoveredRow === row.id ? "bg-accent/40" : ""}`}
                      >
                        <td className="px-5 py-3 font-mono font-medium">{row.id}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              color: row.conductor === "Upper" ? "oklch(72% 0.19 235)" : "oklch(70% 0.2 320)",
                              background: row.conductor === "Upper" ? "oklch(72% 0.19 235 / 0.1)" : "oklch(70% 0.2 320 / 0.1)",
                            }}>
                            {row.conductor}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">{row.poleSpan.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono">{row.wireLength.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold" style={{ color: sagColor }}>{row.sag.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">+{row.expansion.toFixed(2)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ color: sagColor, background: sagBg }}>
                            {sagLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color, delta, deltaUp,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
  delta?: string;
  deltaUp?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="size-8 rounded-lg grid place-items-center"
          style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight" style={{ color }}>{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span>{sub}</span>
        {delta && (
          <span className="flex items-center gap-0.5" style={{ color: deltaUp ? "oklch(65% 0.22 25)" : "oklch(68% 0.18 145)" }}>
            <ArrowUpRight className="size-3" />
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-border bg-card/60">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-mono font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
    </div>
  );
}
