"use client";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui";
import { type Result, type Scenario, priceSweep, fmtEur, D } from "@/lib/model";

const tip = { contentStyle: { fontSize: 12, borderRadius: 8, border: "1px solid var(--line)" } };

export default function TradeoffPanel({ scenario, result }: { scenario: Scenario; result: Result }) {
  const sweep = priceSweep(scenario);
  const plateau = sweep.filter((p) => p.payback <= Math.min(...sweep.map((x) => x.payback)) * 1.1);
  const lo = plateau[0]?.price, hi = plateau[plateau.length - 1]?.price;
  const vw = D.vanWestendorp.all;
  return (
    <Card title="Where the CMO/CFO trade-off actually is" subtitle="Sweep the price while holding your channel and marketing mix. Left: what the CFO watches. Right: what the CMO watches.">
      <div className="grid gap-4 md:grid-cols-2">
        <figure>
          <figcaption className="text-xs text-ink-2 mb-1">Months to pay back one customer&apos;s acquisition cost</figcaption>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={sweep} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} />
                {lo !== undefined && <ReferenceArea x1={lo} x2={hi} fill="var(--s-gym)" fillOpacity={0.08} />}
                <XAxis dataKey="price" type="number" domain={[1.3, 3.1]} tickFormatter={(v) => `€${v.toFixed(2)}`} ticks={[1.5, 1.79, 2.19, 2.59, 3.0]} />
                <YAxis domain={[0, 36]} tickFormatter={(v) => `${v}`} />
                <Tooltip {...tip} formatter={(v) => [`${Number(v).toFixed(1)} months`, "Payback"]} labelFormatter={(l) => `Price ${fmtEur(Number(l))}`} />
                <ReferenceLine x={scenario.price} stroke="var(--ink)" strokeWidth={1} />
                <ReferenceLine y={12} stroke="var(--ink-3)" strokeWidth={1} label={{ value: "12 mo", position: "insideTopRight", fontSize: 10, fill: "var(--ink-3)" }} />
                <Line type="monotone" dataKey="payback" stroke="var(--s-dtc)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
        <figure>
          <figcaption className="text-xs text-ink-2 mb-1">Share of Germans who accept the price (Exhibit 10)</figcaption>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={sweep} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid vertical={false} />
                <ReferenceArea x1={2.1} x2={2.72} fill="var(--s-retail)" fillOpacity={0.08} label={{ value: "VoltFit band", position: "insideTop", fontSize: 10, fill: "var(--ink-3)" }} />
                <XAxis dataKey="price" type="number" domain={[1.3, 3.1]} tickFormatter={(v) => `€${v.toFixed(2)}`} ticks={[1.5, 1.79, 2.19, 2.59, 3.0]} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip {...tip} formatter={(v) => [`${Math.round(Number(v) * 100)}%`, "Acceptance"]} labelFormatter={(l) => `Price ${fmtEur(Number(l))}`} />
                <ReferenceLine x={scenario.price} stroke="var(--ink)" strokeWidth={1} />
                <Line type="monotone" dataKey="acceptance" stroke="var(--s-retail)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
        <p className="text-ink-2">
          <strong className="text-ink">Payback is flat between {fmtEur(lo ?? 0)} and {fmtEur(hi ?? 0)}</strong> with this mix: higher contribution per can and a costlier customer cancel out. Past {fmtEur((hi ?? 0) + 0.2)} the acceptance cliff wins and payback runs away. So the CFO loses nothing by letting the CMO price at the top of that plateau.
        </p>
        <p className="text-ink-2">
          <strong className="text-ink">What the premium costs: reach, not margin.</strong> At {fmtEur(result.price)} {Math.round(result.acceptanceAll * 100)}% of the survey accepts the price versus {Math.round(priceSweep(scenario, 1.79, 1.79)[0].acceptance * 100)}% at €1.79. The Van Westendorp &ldquo;acceptable range&rdquo; is {fmtEur(vw.pmc ?? 0)}–{fmtEur(vw.pme ?? 0)}: every candidate price sits above it, which is the whole tension in one number.
        </p>
      </div>
    </Card>
  );
}
