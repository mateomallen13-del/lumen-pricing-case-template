"use client";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Legend } from "@/components/ui";
import { type Scenario, timingTable, bestLaunchMonth, MONTHS_LONG } from "@/lib/model";

const tip = { contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" } };

export default function TimingPanel({ scenario, onPick }: { scenario: Scenario; onPick: (m: number) => void }) {
  const rows = timingTable();
  const best = bestLaunchMonth();
  const chosen = rows[scenario.launchMonth - 1];
  return (
    <Card title="When to launch" subtitle="German seasonality index (Exhibit 12) with competitor promo months (Exhibit 3). Click a bar to pick a launch month.">
      <div className="h-48">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 16, right: 4, bottom: 0, left: -20 }} barSize={16} onClick={(e) => { const idx = (e as { activeTooltipIndex?: number | string })?.activeTooltipIndex; if (idx !== undefined && idx !== null) onPick(Number(idx) + 1); }} style={{ cursor: "pointer" }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" />
            <YAxis domain={[0, 150]} />
            <Tooltip {...tip} formatter={(v, _n, p) => { const d = p.payload as { promos: number; homeIndex: number; tempC: number }; return [`index ${v} · home markets ${d.homeIndex} · ${d.tempC}°C · ${d.promos} competitor promo${d.promos === 1 ? "" : "s"}`, ""]; }} />
            <Bar dataKey="index" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((m) => <Cell key={m.month} fill={m.month === scenario.launchMonth ? "var(--ink)" : m.promos > 0 ? "var(--s-retail)" : "var(--s-dtc)"} />)}
              <LabelList dataKey="promos" position="top" formatter={(v: unknown) => (Number(v) > 0 ? "▼".repeat(Number(v)) : "")} style={{ fontSize: 9, fill: "var(--s-retail)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend items={[{ label: "Seasonality index", color: "var(--s-dtc)" }, { label: "Month with competitor promos ▼", color: "var(--s-retail)" }, { label: "Your launch month", color: "var(--ink)" }]} />
      <p className="text-xs text-ink-2 mt-2">
        <strong className="text-ink">Best window: {best.label}.</strong> The three months after a {best.label} launch average an index of {best.rampIndex}, the highest ramp in the year, and {best.promos === 0 ? "no competitor promo lands that month" : `${best.promos} competitor promo(s) land that month`}. Your pick, {MONTHS_LONG[scenario.launchMonth - 1]}, gives a ramp index of {chosen.rampIndex}{chosen.promos ? ` with ${chosen.promos} competitor promo(s) in the same month` : ""}. Home-market sales follow the same curve (index {rows.map((r) => r.homeIndex).slice(4, 8).join("/")} for May–Aug), so the seasonality file is trustworthy for Germany. A January launch would have the brand ramping into the two weakest months, straight into February&apos;s promo cluster.
      </p>
    </Card>
  );
}
