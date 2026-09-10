"use client";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Legend } from "@/components/ui";
import { type Result, D, SEGMENTS, competitorAvg, fmtEur, fmtPct } from "@/lib/model";

const SEG_COLORS: Record<string, string> = { "Urban Wellness Professionals": "var(--s-dtc)", "Fitness & Gym-Goers": "var(--s-retail)", "On-the-go Commuters": "var(--s-gym)", "Students & Budget-Conscious": "var(--s-4)" };
const short = (s: string) => s.replace("Urban Wellness Professionals", "Urban wellness").replace("Fitness & Gym-Goers", "Fitness & gym").replace("On-the-go Commuters", "Commuters").replace("Students & Budget-Conscious", "Students");
const tip = { contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" } };

export default function PricingPanel({ result: r }: { result: Result }) {
  const segData = r.segments.map((s) => ({ name: short(s.segment), segment: s.segment, acceptance: s.acceptance, weight: s.weight, intent: s.intent, share: s.surveyShare }));
  const ladder = ["PulsUp", "Mate Libre", "VoltFit", "Root & Rise"].map((c) => ({ name: c, price: competitorAvg(c), positioning: D.competitors.prices.find((p) => p.competitor === c)!.positioning, mkt: D.competitors.prices.find((p) => p.competitor === c)!.marketingIndex }));
  const withLumen = [...ladder, { name: "LUMEN", price: r.price, positioning: r.band.split(" (")[0], mkt: NaN }].sort((a, b) => a.price - b.price);
  const vw = D.vanWestendorp.all;
  return (
    <Card title="Who buys at this price, and where LUMEN sits on the shelf" subtitle="Acceptance by segment from the Van Westendorp survey (Exhibit 10); competitor single-can averages (Exhibit 2).">
      <div className="grid gap-5 md:grid-cols-2">
        <figure>
          <figcaption className="text-xs text-ink-2 mb-1">Acceptance at {fmtEur(r.price)} by segment</figcaption>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={segData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barSize={18}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip {...tip} formatter={(v, _n, p) => [`${Math.round(Number(v) * 100)}% accept · intent ${(p.payload as { intent: number }).intent}/10 · ${Math.round((p.payload as { share: number }).share * 100)}% of survey`, ""]} />
                <Bar dataKey="acceptance" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {segData.map((s) => <Cell key={s.segment} fill={SEG_COLORS[s.segment]} />)}
                  <LabelList dataKey="acceptance" position="right" formatter={(v: unknown) => `${Math.round(Number(v) * 100)}%`} style={{ fontSize: 11, fill: "var(--ink-2)" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-ink-2 mt-1">
            Who actually ends up in the customer base (survey share × acceptance × intent): {r.segments.slice().sort((a, b) => b.weight - a.weight).map((s) => `${short(s.segment)} ${fmtPct(s.weight)}`).join(", ")}.
          </p>
        </figure>
        <figure>
          <figcaption className="text-xs text-ink-2 mb-1">Shelf price ladder, single 330 ml can</figcaption>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={withLumen} margin={{ top: 18, right: 8, bottom: 0, left: -16 }} barSize={22}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 3.5]} tickFormatter={(v) => `€${v}`} />
                <Tooltip {...tip} formatter={(v, _n, p) => [`${fmtEur(Number(v))} · ${(p.payload as { positioning: string }).positioning}`, ""]} />
                <ReferenceLine y={vw.pmc ?? 0} stroke="var(--ink-3)" strokeWidth={1} />
                <ReferenceLine y={vw.pme ?? 0} stroke="var(--ink-3)" strokeWidth={1} label={{ value: "Van Westendorp acceptable range", position: "insideBottomLeft", fontSize: 10, fill: "var(--ink-3)" }} />
                <Bar dataKey="price" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {withLumen.map((c) => <Cell key={c.name} fill={c.name === "LUMEN" ? "var(--s-dtc)" : "var(--line)"} stroke={c.name === "LUMEN" ? "none" : "var(--ink-3)"} />)}
                  <LabelList dataKey="price" position="top" formatter={(v: unknown) => `€${Number(v).toFixed(2)}`} style={{ fontSize: 11, fill: "var(--ink-2)" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-ink-2 mt-1">
            Premium index {Math.round(r.premium)}/100 (0 = PulsUp, 100 = Root &amp; Rise). Competitor promo activity over 12 months: {D.competitors.history.filter((h) => h.promo).length} promo months across 4 brands, deepest {Math.max(...D.competitors.history.map((h) => h.discountPct))}% (PulsUp).
          </p>
        </figure>
      </div>
      <Legend items={SEGMENTS.map((s) => ({ label: short(s), color: SEG_COLORS[s] }))} />
      <details className="mt-3 text-xs text-ink-2">
        <summary className="cursor-pointer">Van Westendorp thresholds (all respondents and per segment)</summary>
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full text-xs num">
            <thead><tr className="text-left text-ink-3"><th className="pr-3 py-1">Group</th><th className="pr-3">n</th><th className="pr-3">Too cheap ∩ too expensive (OPP)</th><th className="pr-3">Cheap ∩ expensive (IPP)</th><th className="pr-3">Floor (PMC)</th><th className="pr-3">Ceiling (PME)</th></tr></thead>
            <tbody>
              <tr className="border-t border-line"><td className="pr-3 py-1">All</td><td>{D.vanWestendorp.n}</td><td>{fmtEur(vw.opp ?? 0)}</td><td>{fmtEur(vw.ipp ?? 0)}</td><td>{fmtEur(vw.pmc ?? 0)}</td><td>{fmtEur(vw.pme ?? 0)}</td></tr>
              {SEGMENTS.map((s) => { const v = (D.vanWestendorp.bySegment as Record<string, { n: number; opp: number | null; ipp: number | null; pmc: number | null; pme: number | null }>)[s]; return (
                <tr key={s} className="border-t border-line"><td className="pr-3 py-1">{short(s)}</td><td>{v.n}</td><td>{fmtEur(v.opp ?? 0)}</td><td>{fmtEur(v.ipp ?? 0)}</td><td>{fmtEur(v.pmc ?? 0)}</td><td>{fmtEur(v.pme ?? 0)}</td></tr>
              ); })}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  );
}
