"use client";
import { Card } from "@/components/ui";
import { type Scenario, type Result, cityRanking, bestLaunchMonth, MONTHS_LONG, fmtEur } from "@/lib/model";

export default function RoadmapPanel({ scenario, result }: { scenario: Scenario; result: Result }) {
  const cities = cityRanking(scenario.price).filter((c) => c.city !== "Other Germany");
  const best = bestLaunchMonth();
  const m = scenario.launchMonth;
  const label = (offset: number) => MONTHS_LONG[(m - 1 + offset) % 12];
  const phases = [
    { when: `${label(0)} – ${label(2)}`, title: "Prove it", body: `DTC (subscription + referral) and 20–30 gyms and offices in ${cities[0].city} and ${cities[1].city} at ${fmtEur(scenario.price)}. Measure real acceptance, repeat rate and CAC against the survey. Kill criterion: payback above 14 months after 3 months.` },
    { when: `${label(3)} – ${label(6)}`, title: "Widen", body: `Add ${cities[2].city}, scale influencer and paid social on what converted. Hold price; test 4-packs and subscription discounts rather than shelf-price cuts.` },
    { when: `${label(7)} onward`, title: "Grocery, on our terms", body: `Approach premium grocery (organic and city-centre formats first) with a proven sell-through story. Retail keeps only ${fmtEur(result.perChannel[1].contribution)} of each ${fmtEur(scenario.price)} can, so it is a reach play once the brand is known, not a launch channel.` },
  ];
  return (
    <Card title="Launch roadmap" subtitle={`Starting ${MONTHS_LONG[m - 1]}${m !== best.month ? ` (the seasonality data favours ${best.label})` : " (best window in the seasonality data)"}. Each phase has a gate, so the CFO can stop the spend if the survey was wrong.`}>
      <ol className="grid gap-3 md:grid-cols-3">
        {phases.map((p, i) => (
          <li key={p.title} className="border border-line rounded-lg p-3 text-xs">
            <div className="text-[11px] uppercase tracking-wide text-ink-3">Phase {i + 1} · {p.when}</div>
            <div className="font-semibold text-sm mt-0.5">{p.title}</div>
            <p className="text-ink-2 mt-1">{p.body}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
