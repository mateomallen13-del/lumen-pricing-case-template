"use client";
import { Card, Stat, Warn } from "@/components/ui";
import { type Result, type Scenario, fmtEur, fmtPct, fmtInt, MONTHS_LONG } from "@/lib/model";

export default function Headline({ result: r, scenario: s }: { result: Result; scenario: Scenario }) {
  const payTone = r.paybackMonths <= 9 ? "good" : r.paybackMonths <= 14 ? "warn" : "bad";
  const accTone = r.acceptanceAll >= 0.5 ? "good" : r.acceptanceAll >= 0.35 ? "warn" : "bad";
  const y1Tone = r.resultYear1 >= 0 ? "good" : "bad";
  const topChannels = [...r.perChannel].sort((a, b) => b.share - a.share).filter((c) => c.share > 0.25).map((c) => c.channel.replace(" Online", "").replace("/Grocery", ""));
  return (
    <Card className="!p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-3">Current scenario</div>
          <p className="text-lg sm:text-xl font-semibold leading-snug mt-1">
            Launch at <span className="num">{fmtEur(s.price)}</span> in {topChannels.join(" + ") || "—"}, {MONTHS_LONG[s.launchMonth - 1]}, positioned as <em className="not-italic underline decoration-[var(--accent)] decoration-2 underline-offset-2">{r.band.split(" (")[0].toLowerCase()}</em>.
          </p>
          <p className="text-sm text-ink-2 mt-2">
            {fmtPct(r.acceptanceAll)} of surveyed Germans find this price acceptable. LUMEN nets {fmtEur(r.blendedNet)} per can and keeps {fmtEur(r.blendedContribution)} after COGS. A customer costs {fmtEur(r.cac, 0)} to win and pays that back in {Number.isFinite(r.paybackMonths) ? r.paybackMonths.toFixed(1) : "∞"} months.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Price acceptance" value={fmtPct(r.acceptanceAll)} hint="share not calling it expensive" tone={accTone} />
          <Stat label="Contribution / can" value={fmtEur(r.blendedContribution)} hint={`${fmtPct(r.blendedMarginPct)} of net price`} />
          <Stat label="CAC payback" value={Number.isFinite(r.paybackMonths) ? `${r.paybackMonths.toFixed(1)} mo` : "never"} hint={`CAC ${fmtEur(r.cac, 0)} · LTV:CAC ${r.ltvToCac.toFixed(1)}`} tone={payTone} />
          <Stat label="Year-1 result" value={fmtEur(r.resultYear1, 0)} hint={`${fmtInt(r.customersYear1)} customers · ${fmtInt(r.unitsYear1)} cans`} tone={y1Tone} />
        </div>
      </div>
      {r.warnings.length > 0 && (
        <ul className="mt-4 grid gap-1 sm:grid-cols-2">{r.warnings.map((w) => <Warn key={w}>{w}</Warn>)}</ul>
      )}
    </Card>
  );
}
