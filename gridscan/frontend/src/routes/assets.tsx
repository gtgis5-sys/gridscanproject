import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Database, TowerControl, Waves, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sidebar } from "../components/Sidebar";

export const Route = createFileRoute("/assets")({
  component: AssetsPage,
});

const POLES = [
  { id: 1, height: 8.20, x: 709606.5, y: 780.2, class: 18 },
  { id: 2, height: 9.10, x: 709616.3, y: 797.4, class: 18 },
  { id: 3, height: 8.70, x: 709626.1, y: 811.8, class: 18 },
  { id: 4, height: 9.85, x: 709636.0, y: 828.3, class: 18 },
  { id: 5, height: 8.40, x: 709645.8, y: 843.9, class: 18 },
  { id: 6, height: 9.30, x: 709655.6, y: 858.7, class: 18 },
  { id: 7, height: 8.60, x: 709665.4, y: 873.5, class: 18 },
  { id: 8, height: 7.80, x: 709675.3, y: 888.2, class: 18 },
];

const CONDUCTORS = [
  { id: "2-3 U", span: "2-3", type: "Upper", length: 24.15, sag: 1.17, class: 21 },
  { id: "2-3 L", span: "2-3", type: "Lower", length: 24.18, sag: 1.91, class: 21 },
  { id: "3-4 U", span: "3-4", type: "Upper", length: 23.41, sag: 1.01, class: 21 },
  { id: "3-4 L", span: "3-4", type: "Lower", length: 23.33, sag: 2.22, class: 21 },
  { id: "4-5 U", span: "4-5", type: "Upper", length: 20.85, sag: 0.74, class: 21 },
  { id: "4-5 L", span: "4-5", type: "Lower", length: 19.69, sag: 1.27, class: 21 },
  { id: "5-6 U", span: "5-6", type: "Upper", length: 25.16, sag: 1.04, class: 21 },
  { id: "5-6 L", span: "5-6", type: "Lower", length: 26.86, sag: 1.82, class: 21 },
  { id: "6-7 U", span: "6-7", type: "Upper", length: 22.67, sag: 1.20, class: 21 },
  { id: "6-7 L", span: "6-7", type: "Lower", length: 24.72, sag: 1.80, class: 21 },
];

const heightData = POLES.map((p) => ({ name: `P${p.id}`, height: p.height, fill: p.height === 9.85 ? "oklch(72% 0.19 235)" : "oklch(60% 0.1 235)" }));

function AssetsPage() {
  const [tab, setTab] = useState<"poles" | "conductors">("poles");

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="border-b border-border bg-sidebar/40 backdrop-blur-xl">
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.2em]">
              <Database className="size-3.5" /> Module 03
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Asset Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">Extracted poles and conductors from the classified point cloud.</p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Poles", value: "8", icon: TowerControl, color: "oklch(72% 0.19 235)" },
              { label: "Total Conductors", value: "10", icon: Zap, color: "oklch(78% 0.16 180)" },
              { label: "Avg Pole Height", value: "8.75 m", icon: Activity, color: "oklch(68% 0.18 145)" },
              { label: "Avg Sag", value: "1.42 m", icon: Waves, color: "oklch(70% 0.2 320)" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
                  <div className="size-8 rounded-lg grid place-items-center"
                    style={{ background: `color-mix(in oklab, ${kpi.color} 18%, transparent)`, color: kpi.color }}>
                    <kpi.icon className="size-4" />
                  </div>
                </div>
                <div className="text-2xl font-semibold tabular-nums">{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-border bg-card/60 p-5">
            <h3 className="text-sm font-semibold mb-4">Pole Height Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={heightData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(30% 0.03 245 / 0.5)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(70% 0.02 245)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 12]} unit=" m" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", fontSize: 12 }} formatter={(v: number) => [`${v} m`, "Height"]} />
                <Bar dataKey="height" radius={[4, 4, 0, 0]}>
                  {heightData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tab switch */}
          <div>
            <div className="inline-flex rounded-xl border border-border bg-background/60 p-1 mb-4">
              {(["poles", "conductors"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "poles" ? "Utility Poles" : "Conductors"}
                </button>
              ))}
            </div>

            {tab === "poles" ? (
              <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Pole Registry</div>
                  <div className="text-xs text-muted-foreground font-mono">{POLES.length} poles detected</div>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background/40">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Pole ID</th>
                      <th className="text-right px-5 py-3 font-medium">Height (m)</th>
                      <th className="text-right px-5 py-3 font-medium">X Coord</th>
                      <th className="text-right px-5 py-3 font-medium">Y Coord</th>
                      <th className="text-left px-5 py-3 font-medium">Class</th>
                      <th className="text-left px-5 py-3 font-medium w-32">Height Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {POLES.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-accent/40 transition-colors">
                        <td className="px-5 py-3 font-medium">Pole {p.id}{p.height === 9.85 ? " ★" : ""}</td>
                        <td className="px-5 py-3 text-right font-mono"
                          style={{ color: p.height === 9.85 ? "oklch(72% 0.19 235)" : undefined }}>{p.height.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">{p.x.toFixed(1)}</td>
                        <td className="px-5 py-3 text-right font-mono text-muted-foreground">{p.y.toFixed(1)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ borderColor: "oklch(72% 0.19 235 / 0.4)", color: "oklch(72% 0.19 235)", background: "oklch(72% 0.19 235 / 0.1)" }}>C{p.class}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(p.height / 10) * 100}%`, background: p.height === 9.85 ? "oklch(72% 0.19 235)" : "oklch(60% 0.1 235)" }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="text-sm font-semibold">Conductor Registry</div>
                  <div className="text-xs text-muted-foreground font-mono">{CONDUCTORS.length} conductors detected</div>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-background/40">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium">Conductor ID</th>
                      <th className="text-left px-5 py-3 font-medium">Span</th>
                      <th className="text-left px-5 py-3 font-medium">Type</th>
                      <th className="text-right px-5 py-3 font-medium">Length (m)</th>
                      <th className="text-right px-5 py-3 font-medium">Sag (m)</th>
                      <th className="text-left px-5 py-3 font-medium">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONDUCTORS.map((c) => (
                      <tr key={c.id} className="border-t border-border hover:bg-accent/40 transition-colors">
                        <td className="px-5 py-3 font-medium font-mono">{c.id}</td>
                        <td className="px-5 py-3 text-muted-foreground">Span {c.span}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.type === "Upper" ? "bg-primary/10 text-primary" : "bg-chart-5/10 text-chart-5"}`}
                            style={{ color: c.type === "Upper" ? "oklch(72% 0.19 235)" : "oklch(70% 0.2 320)", background: c.type === "Upper" ? "oklch(72% 0.19 235 / 0.1)" : "oklch(70% 0.2 320 / 0.1)" }}>
                            {c.type}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono">{c.length.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono"
                          style={{ color: c.sag > 2 ? "oklch(65% 0.22 25)" : c.sag > 1.5 ? "oklch(78% 0.17 80)" : undefined }}>
                          {c.sag.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono px-2 py-0.5 rounded border" style={{ borderColor: "oklch(78% 0.16 180 / 0.4)", color: "oklch(78% 0.16 180)", background: "oklch(78% 0.16 180 / 0.1)" }}>C{c.class}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
