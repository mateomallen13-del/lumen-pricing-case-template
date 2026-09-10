"use client";
import { Card } from "@/components/ui";
import { cityRanking, fmtPct } from "@/lib/model";

export default function CityPanel({ price }: { price: number }) {
  const rows = cityRanking(price);
  const cities = rows.filter((r) => r.city !== "Other Germany");
  const rest = rows.find((r) => r.city === "Other Germany")!;
  const max = Math.max(...cities.map((c) => c.score));
  return (
    <Card title="Which city first" subtitle="Market size × growth (Exhibit 1) × purchase intent and share of buying segments in that city (Exhibit 4), at the current price.">
      <ol className="space-y-2">
        {cities.map((c, i) => (
          <li key={c.city} className="grid grid-cols-[1.25rem_5.5rem_minmax(0,1fr)_auto] items-center gap-2 text-xs">
            <span className="text-ink-3 num">{i + 1}</span>
            <span className="font-medium">{c.city}</span>
            <div className="h-4 rounded overflow-hidden bg-line/40"><div className="h-full rounded" style={{ width: `${(c.score / max) * 100}%`, background: i < 3 ? "var(--s-dtc)" : "var(--ink-3)" }} /></div>
            <span className="num text-ink-2 whitespace-nowrap">€{c.marketMEur}m · +{Math.round(c.cagr * 100)}% · intent {c.intent.toFixed(1)} · fit {fmtPct(c.buyerFit)}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-ink-2 mt-3">
        <strong className="text-ink">Start with {cities[0].city} and {cities[1].city}.</strong> Together they hold {Math.round((rows.find((r) => r.city === cities[0].city)!.marketMEur + rows.find((r) => r.city === cities[1].city)!.marketMEur) / 91)}% of the German market and grow at 9% against 7% elsewhere. {cities[2].city} is the natural third: highest purchase intent in the survey ({cities.slice().sort((a, b) => b.intent - a.intent)[0].intent.toFixed(1)}/10 in {cities.slice().sort((a, b) => b.intent - a.intent)[0].city}) and a short hop from Copenhagen for the existing team. &ldquo;Other Germany&rdquo; is 40% of the market but no single city: that is the retail phase, later. Note the survey has only {cities.slice().sort((a, b) => a.respondents - b.respondents)[0].respondents} respondents in {cities.slice().sort((a, b) => a.respondents - b.respondents)[0].city}, so city-level intent is indicative, not proof.
      </p>
      <p className="sr-only">Other Germany: €{rest.marketMEur}m, intent {rest.intent}.</p>
    </Card>
  );
}
