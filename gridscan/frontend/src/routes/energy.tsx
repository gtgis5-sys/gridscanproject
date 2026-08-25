import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sidebar } from "../components/Sidebar";

export const Route = createFileRoute("/energy")({
  component: EnergyPage,
});

const ENERGY_DATA = [
  { id: "2-3 U", span: "2–3", conductor: "Upper", powerLoss: 1.031, energyWaste: 9.034, sag: 1.17 },
  { id: "2-3 L", span: "2–3", conductor: "Lower", powerLoss: 2.531, energyWaste: 22.174, sag: 1.91 },
  { id: "3-4 U", span: "3–4", conductor: "Upper", powerLoss: 1.031, energyWaste: 9.034, sag: 1.01 },
  { id: "3-4 L", span: "3–4", conductor: "Lower", powerLoss: 4.031, energyWaste: 35.314, sag: 2.22 },
  { id: "4-5 U", span: "4–5", conductor: "Upper", powerLoss: 1.406, energyWaste: 12.319, sag: 0.74 },
  { id: "4-5 L", span: "4–5", conductor: "Lower", powerLoss: 1.500, energyWaste: 13.140, sag: 1.27 },
  { id: "5-6 U", span: "5–6", conductor: "Upper", powerLoss: 1.125, energyWaste: 9.855, sag: 1.04 },
  { id: "5-6 L", span: "5–6", conductor: "Lower", powerLoss: 2.156, energyWaste: 18.889, sag: 1.82 },
  { id: "6-7 U", span: "6–7", conductor: "Upper", powerLoss: 0.844, energyWaste: 7.391, sag: 1.20 },
  { id: "6-7 L", span: "6–7", conductor: "Lower", powerLoss: 1.688, energyWaste: 14.782, sag: 1.80 },
];

const totalPowerLoss = +ENERGY_DATA.reduce((s, d) => s + d.powerLoss, 0).toFixed(3);
const totalEnergyWaste = +ENERGY_DATA.reduce((s, d) => s + d.energyWaste, 0).toFixed(3);
const maxLoss = ENERGY_DATA.reduce((a, b) => (a.powerLoss > b.powerLoss ? a : b));
const maxSag = ENERGY_DATA.reduce((a, b) => (a.sag > b.sag ? a : b));

const powerChartData = ENERGY_DATA.map((d) => ({
  name: d.id,
  powerLoss: d.powerLoss,
  fill: d.powerLoss > 3 ? "oklch(65% 0.22 25)" : d.powerLoss > 1.5 ? "oklch(78% 0.17 80)" : "oklch(72% 0.19 235)",
}));

const energyChartData = ENERGY_DATA.map((d) => ({
  name: d.id,
  energyWaste: d.energyWaste,
  fill: d.energyWaste > 30 ? "oklch(65% 0.22 25)" : d.energyWaste > 15 ? "oklch(78% 0.17 80)" : "oklch(68% 0.18 145)",
}));

const RANKED = [...ENERGY_DATA].sort((a, b) => b.powerLoss - a.powerLoss);

function EnergyPage() {
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
                <Zap className="size-3.5" /> Module 05
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Energy Loss Analysis</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Additional conductor resistance losses due to sag-induced length increase across all spans.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <StatBadge label="Total Loss" value={`${totalPowerLoss} W`} accent="oklch(65% 0.22 25)" />
              <StatBadge label="Annual Waste" value={`${totalEnergyWaste.toFixed(1)} kWh`} accent="oklch(78% 0.17 80)" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Zap}
              label="Total Additional Power Loss"
              value={`${totalPowerLoss} W`}
              sub="across all 10 conductors"
              color="oklch(65% 0.22 25)"
            />
            <KpiCard
              icon={BarChart2}
              label="Total Annual Energy Waste"
              value={`${totalEnergyWaste.toFixed(1)} kWh/yr`}
              sub="sag-induced resistance overhead"
              color="oklch(78% 0.17 80)"
            />
            <KpiCard
              icon={TrendingUp}
              label="Highest Loss Span"
              value={`${maxLoss.powerLoss} W`}
              sub={`Conductor ${maxLoss.id}`}
              color="oklch(65% 0.22 25)"
            />
            <KpiCard
              icon={Waves}
              label="Highest Sag Span"
              value={`${maxSag.sag} m`}
              sub={`Conductor ${maxSag.id}`}
              color="oklch(70% 0.2 320)"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Power loss */}
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-9 rounded-lg bg-accent grid place-items-center" style={{ color: "oklch(65% 0.22 25)" }}>
                  <Zap className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Extra Power Loss per Conductor</h3>
                  <p className="text-xs text-muted-foreground">Additional watts due to sag-induced length increase</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={powerChartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
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
                    unit=" W"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
                          <div className="font-semibold">{d.payload.name}</div>
                          <div className="mt-0.5" style={{ color: d.payload.fill }}>
                            Power Loss: {(d.value as number).toFixed(3)} W
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="powerLoss" radius={[4, 4, 0, 0]}>
                    {powerChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: "oklch(72% 0.19 235)" }} />Low (&lt;1.5W)</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: "oklch(78% 0.17 80)" }} />Medium</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: "oklch(65% 0.22 25)" }} />High (&gt;3W)</span>
              </div>
            </div>

            {/* Energy waste */}
            <div className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-9 rounded-lg bg-accent grid place-items-center" style={{ color: "oklch(78% 0.17 80)" }}>
                  <BarChart2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Annual Energy Waste per Conductor</h3>
                  <p className="text-xs text-muted-foreground">kWh/year lost to excess conductor length</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={energyChartData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
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
                    unit=" kWh"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-popover/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
                          <div className="font-semibold">{d.payload.name}</div>
                          <div className="mt-0.5" style={{ color: d.payload.fill }}>
                            Energy Waste: {(d.value as number).toFixed(3)} kWh/yr
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="energyWaste" radius={[4, 4, 0, 0]}>
                    {energyChartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking table */}
          <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Span Loss Ranking</div>
                <div className="text-xs text-muted-foreground">Conductors ranked by additional power loss (highest first)</div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{ENERGY_DATA.length} conductors</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background/40">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Rank</th>
                    <th className="text-left px-5 py-3 font-medium">Conductor</th>
                    <th className="text-left px-5 py-3 font-medium">Type</th>
                    <th className="text-right px-5 py-3 font-medium">Sag (m)</th>
                    <th className="text-right px-5 py-3 font-medium">Extra Power Loss (W)</th>
                    <th className="text-right px-5 py-3 font-medium">Energy Waste (kWh/yr)</th>
                    <th className="text-left px-5 py-3 font-medium w-40">Loss Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {RANKED.map((row, idx) => {
                    const lossColor = row.powerLoss > 3 ? "oklch(65% 0.22 25)" : row.powerLoss > 1.5 ? "oklch(78% 0.17 80)" : "oklch(72% 0.19 235)";
                    const maxLossVal = RANKED[0].powerLoss;
                    return (
                      <tr
                        key={row.id}
                        onMouseEnter={() => setHoveredRow(row.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`border-t border-border transition-colors ${hoveredRow === row.id ? "bg-accent/40" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <span className={`size-6 rounded-md grid place-items-center text-xs font-bold tabular-nums ${idx === 0 ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, fontSize: 11, fontWeight: 700, background: idx === 0 ? "oklch(65% 0.22 25 / 0.2)" : "", color: idx === 0 ? "oklch(65% 0.22 25)" : "" }}>
                            {idx + 1}
                          </span>
                        </td>
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
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">{row.sag.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono font-semibold" style={{ color: lossColor }}>{row.powerLoss.toFixed(3)}</td>
                        <td className="px-5 py-3 text-right font-mono">{row.energyWaste.toFixed(3)}</td>
                        <td className="px-5 py-3">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(row.powerLoss / maxLossVal) * 100}%`, background: lossColor }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical findings */}
          <div className="rounded-2xl border border-primary/30 p-6 relative overflow-hidden"
            style={{ background: "radial-gradient(ellipse at top left, oklch(30% 0.1 235 / 0.3), transparent 60%)" }}>
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl grid place-items-center"
                  style={{ background: "oklch(65% 0.22 25 / 0.2)", color: "oklch(65% 0.22 25)" }}>
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80">Engineering Report</div>
                  <h3 className="text-xl font-semibold">Critical Findings</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Span 3–4 Lower Conductor",
                    badge: "Critical",
                    badgeColor: "oklch(65% 0.22 25)",
                    badgeBg: "oklch(65% 0.22 25 / 0.15)",
                    details: [
                      `Sag: ${maxSag.sag} m (highest in network)`,
                      `Power Loss: 4.031 W`,
                      `Energy Waste: 35.314 kWh/yr`,
                      "Immediate retensioning recommended",
                    ],
                  },
                  {
                    title: "Span 2–3 Lower Conductor",
                    badge: "Elevated",
                    badgeColor: "oklch(78% 0.17 80)",
                    badgeBg: "oklch(78% 0.17 80 / 0.15)",
                    details: [
                      "Sag: 1.91 m (above normal)",
                      "Power Loss: 2.531 W",
                      "Energy Waste: 22.174 kWh/yr",
                      "Schedule maintenance within 90 days",
                    ],
                  },
                  {
                    title: "Total Network Impact",
                    badge: "Summary",
                    badgeColor: "oklch(72% 0.19 235)",
                    badgeBg: "oklch(72% 0.19 235 / 0.15)",
                    details: [
                      `Total extra loss: ${totalPowerLoss} W`,
                      `Annual waste: ${totalEnergyWaste.toFixed(1)} kWh/yr`,
                      "3 conductors above threshold",
                      "Avg sag: 1.42 m across network",
                    ],
                  },
                ].map((finding) => (
                  <div key={finding.title} className="rounded-xl border border-border bg-background/40 backdrop-blur p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold leading-tight">{finding.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold ml-2 shrink-0"
                        style={{ color: finding.badgeColor, background: finding.badgeBg }}>
                        {finding.badge}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {finding.details.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 size-1 rounded-full shrink-0" style={{ background: finding.badgeColor }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground leading-tight">{label}</span>
        <div className="size-8 rounded-lg grid place-items-center shrink-0 ml-2"
          style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, color }}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight" style={{ color }}>{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>
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
