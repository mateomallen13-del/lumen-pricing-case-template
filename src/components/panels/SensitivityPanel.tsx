"use client";
import { Card, Legend } from "@/components/ui";
import { type Scenario, type Result, sensitivity, fmtEur } from "@/lib/model";

export default function SensitivityPanel({ scenario, result }: { scenario: Scenario; result: Result }) {
  const rows = sensitivity(scenario);
  const max = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.low), Math.abs(r.high)]));
  const worst = rows[0];
  const floor = result.resultYear1 + Math.min(...rows.map((r) => Math.min(r.low, r.high)));
  const ceiling = result.resultYear1 + Math.max(...rows.map((r) => Math.max(r.low, r.high)));
  return (
    <Card title="How wrong can we be" subtitle={`One input at a time, everything else as in your scenario. Bars show the change in the year-one result (base ${fmtEur(result.resultYear1, 0)}).`}>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.driver} className="grid grid-cols-[7rem_5.5rem_minmax(0,1fr)_5.5rem] items-center gap-2 text-xs">
            <span className="text-ink-2 truncate">{r.driver}</span>
            <span className="text-[10px] text-ink-3 num text-right whitespace-nowrap">{r.lowLabel} {fmtEur(r.low, 0)}</span>
            <div className="relative h-5">
              <div className="absolute inset-y-0 left-1/2 w-px bg-ink-3" aria-hidden />
              {[r.low, r.high].map((v, i) => {
                const w = (Math.abs(v) / max) * 50;
                const left = v < 0 ? 50 - w : 50;
                return (
                  <div key={i} className="absolute inset-y-0.5 rounded" style={{ left: `${left}%`, width: `${w}%`, background: v < 0 ? "var(--s-retail)" : "var(--s-dtc)" }} title={`${i === 0 ? r.lowLabel : r.highLabel}: ${v >= 0 ? "+" : ""}${fmtEur(v, 0)}`} />
                );
              })}
            </div>
            <span className="text-[10px] text-ink-3 num whitespace-nowrap">{r.highLabel} {r.high >= 0 ? "+" : ""}{fmtEur(r.high, 0)}</span>
          </div>
        ))}
      </div>
      <Legend items={[{ label: "Downside", color: "var(--s-retail)" }, { label: "Upside", color: "var(--s-dtc)" }]} />
      <p className="text-xs text-ink-2 mt-2">
        <strong className="text-ink">The answer is a range, {fmtEur(floor, 0)} to {fmtEur(ceiling, 0)}, not a number.</strong> The biggest swing is {worst.driver}: the one input the surveys cannot pin down, because home-market CAC was earned on a known brand at €1.35. That is the argument for a two-city test before national spend: it turns the widest bar into a measured number. Frequency and acceptance move the result by the same amount, which is why repeat purchase, not price, is where the year-one result is made.
      </p>
    </Card>
  );
}
