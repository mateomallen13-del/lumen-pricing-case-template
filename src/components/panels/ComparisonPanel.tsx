"use client";
import { Card } from "@/components/ui";
import { PRESETS, evaluate, type Result, type Scenario, fmtEur, fmtPct, fmtInt, MONTHS_LONG } from "@/lib/model";

type Row = { label: string; get: (r: Result, s: Scenario) => string; better?: "high" | "low"; raw: (r: Result) => number };
const ROWS: Row[] = [
  { label: "Shelf price", get: (r) => fmtEur(r.price), raw: (r) => r.price },
  { label: "Positioning", get: (r) => r.band.split(" (")[0], raw: () => NaN },
  { label: "Lead channels", get: (r) => [...r.perChannel].sort((a, b) => b.share - a.share).filter((c) => c.share > 0.25).map((c) => c.channel.replace(" Online", "").replace("/Grocery", "")).join(" + "), raw: () => NaN },
  { label: "Launch month", get: (_r, s) => MONTHS_LONG[s.launchMonth - 1], raw: () => NaN },
  { label: "Price acceptance", get: (r) => fmtPct(r.acceptanceAll), better: "high", raw: (r) => r.acceptanceAll },
  { label: "Contribution per can", get: (r) => fmtEur(r.blendedContribution), better: "high", raw: (r) => r.blendedContribution },
  { label: "Contribution margin", get: (r) => fmtPct(r.blendedMarginPct), better: "high", raw: (r) => r.blendedMarginPct },
  { label: "Cost per German customer", get: (r) => fmtEur(r.cac, 0), better: "low", raw: (r) => r.cac },
  { label: "CAC payback", get: (r) => (Number.isFinite(r.paybackMonths) ? `${r.paybackMonths.toFixed(1)} mo` : "never"), better: "low", raw: (r) => r.paybackMonths },
  { label: "LTV : CAC", get: (r) => r.ltvToCac.toFixed(1), better: "high", raw: (r) => r.ltvToCac },
  { label: "Marketing budget", get: (_r, s) => fmtEur(s.marketingBudget, 0), raw: () => NaN },
  { label: "Customers, year 1", get: (r) => fmtInt(r.customersYear1), better: "high", raw: (r) => r.customersYear1 },
  { label: "Cans, year 1", get: (r) => fmtInt(r.unitsYear1), better: "high", raw: (r) => r.unitsYear1 },
  { label: "Result after marketing, year 1", get: (r) => fmtEur(r.resultYear1, 0), better: "high", raw: (r) => r.resultYear1 },
  { label: "Premium index (0 PulsUp – 100 Root & Rise)", get: (r) => Math.round(r.premium).toString(), better: "high", raw: (r) => r.premium },
  { label: "Students who accept the price", get: (r) => fmtPct(r.segments.find((s) => s.segment.startsWith("Students"))!.acceptance), better: "high", raw: (r) => r.segments.find((s) => s.segment.startsWith("Students"))!.acceptance },
];

export default function ComparisonPanel({ scenario, result }: { scenario: Scenario; result: Result }) {
  const cols = [
    { key: "cmo", label: "CMO (Jonas)", s: PRESETS.cmo.scenario, r: evaluate(PRESETS.cmo.scenario) },
    { key: "cfo", label: "CFO (Elena)", s: PRESETS.cfo.scenario, r: evaluate(PRESETS.cfo.scenario) },
    { key: "rec", label: "Recommended", s: PRESETS.recommended.scenario, r: evaluate(PRESETS.recommended.scenario) },
    { key: "you", label: "Your scenario", s: scenario, r: result },
  ];
  return (
    <Card title="The three positions, side by side" subtitle="What each camp asks for, what it costs, and what we propose. The last column follows your levers. Bold marks the best value in each row.">
      <div className="overflow-x-auto -mx-1">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-ink-3">
              <th className="py-1.5 pr-3 font-medium">Metric</th>
              {cols.map((c) => <th key={c.key} className={`py-1.5 px-2 font-medium whitespace-nowrap ${c.key === "rec" ? "text-ink" : ""}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const vals = cols.map((c) => row.raw(c.r));
              const finite = vals.filter(Number.isFinite);
              const best = row.better && finite.length ? (row.better === "high" ? Math.max(...finite) : Math.min(...finite)) : NaN;
              return (
                <tr key={row.label} className="border-t border-line">
                  <td className="py-1.5 pr-3 text-ink-2">{row.label}</td>
                  {cols.map((c, i) => <td key={c.key} className={`py-1.5 px-2 num whitespace-nowrap ${Number.isFinite(best) && Math.abs(vals[i] - best) < 1e-9 ? "font-semibold" : ""} ${c.key === "rec" ? "bg-surface" : ""}`}>{row.get(c.r, c.s)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-ink-2">
        <p><strong className="text-ink">The CMO&apos;s ask</strong> keeps {fmtEur(cols[0].r.blendedContribution)} per can, the best margin on the table, but only {fmtPct(cols[0].r.acceptanceAll)} of Germans accept the price, so each customer costs {fmtEur(cols[0].r.cac, 0)} and takes {cols[0].r.paybackMonths.toFixed(0)} months to pay back. With a {fmtEur(cols[0].s.marketingBudget, 0)} budget the first year ends at {fmtEur(cols[0].r.resultYear1, 0)}.</p>
        <p><strong className="text-ink">The CFO&apos;s ask</strong> pays back fastest ({cols[1].r.paybackMonths.toFixed(1)} months) and ends year one at {fmtEur(cols[1].r.resultYear1, 0)}, but at {fmtEur(cols[1].s.price)} LUMEN sits in Mate Libre&apos;s heritage band, {Math.round(cols[1].r.premium)}/100 on the premium index, and the clean-label story has no price to back it up.</p>
        <p><strong className="text-ink">The recommendation</strong> gives up {fmtEur(cols[1].r.resultYear1 - cols[2].r.resultYear1, 0)} of year-one result versus the CFO case (about {Math.round((1 - cols[2].r.resultYear1 / cols[1].r.resultYear1) * 100)}%) to buy a VoltFit-band price and {Math.round(cols[2].r.premium - cols[1].r.premium)} points of premium, while staying {(12 - cols[2].r.paybackMonths).toFixed(1)} months inside the 12-month payback the CFO can defend.</p>
      </div>
    </Card>
  );
}
