"use client";
import { Card } from "@/components/ui";
import { D, fmtPct } from "@/lib/model";

export default function DataNotesPanel() {
  const n = D.sourceNotes;
  const quotes = D.quotes;
  return (
    <Card title="What we did to the data before trusting it" subtitle="A real export, not a textbook table. Every step below runs in scripts/prepare-data.mjs and is reproducible.">
      <div className="grid gap-4 md:grid-cols-2 text-xs text-ink-2">
        <ul className="space-y-2">
          <li><strong className="text-ink">Personal data never leaves the data room.</strong> The survey has {n.piiColumnsDropped.join(", ")} columns. The build script drops them before anything is aggregated; this page only ever receives segment- and city-level averages over {n.surveyRespondents} respondents. No endpoint serves rows.</li>
          <li><strong className="text-ink">{n.salesDuplicatesRemoved} duplicate sales rows removed</strong> out of {n.salesRowsKept + n.salesDuplicatesRemoved} (exact copies of existing weeks), so home-market averages are not inflated.</li>
          <li><strong className="text-ink">{n.salesOutlierWeeks.length} anomalous week flagged, not deleted:</strong> {n.salesOutlierWeeks.map((o) => `${o.country} ${o.channel}, week of ${o.week}: ${o.units} cans against a median of ${o.median} (z = ${o.z}), no promo recorded`).join("; ")}. We keep it in the totals but do not build the seasonality on single weeks.</li>
          <li><strong className="text-ink">No German sales exist.</strong> Everything about Germany comes from German survey data (Exhibits 4, 10), German competitor prices (Exhibits 2, 3) and German market size (Exhibit 1). Home-market data (Exhibits 6, 7, 8, 9) is used only for what should transfer: cost structure, channel cuts, the shape of seasonality, and marketing efficiency at a known price.</li>
          <li><strong className="text-ink">Exhibit 11 acceptance re-derived.</strong> The case quotes 61.7 / 51.7 / 26.7% for the three candidates. Recomputing &ldquo;share who do not find the price expensive&rdquo; from Exhibit 10 gives {[1.79, 2.19, 2.59].map((p) => `${fmtPct(D.vanWestendorp.all.curve.find((c) => Math.abs(c.price - Math.round(p * 20) / 20) < 0.001)?.acceptance ?? 0, 1)}`).join(" / ")} at €1.80 / €2.20 / €2.60. The middle candidate matches exactly; the low one is more forgiving in the raw survey than in the case summary. We use the raw curve, so the cockpit is slightly kinder to low prices than the brief.</li>
        </ul>
        <div>
          <p className="mb-2"><strong className="text-ink">Where the verbatims disagree with the numbers (Exhibit 5 vs 4):</strong></p>
          <ul className="space-y-1.5">
            <li>Fitness &amp; gym-goers score {D.segmentStats.find((s) => s.segment.startsWith("Fitness"))!.purchaseIntent}/10 intent and accept every candidate price in the survey, yet say &ldquo;{quotes.find((q) => q.segment.startsWith("Fitness") && q.sentiment === "mixed")!.quote}&rdquo; The survey measures willingness, the quote measures the reason: performance, not packaging. Positioning must lead with function.</li>
            <li>Students score the lowest intent ({D.segmentStats.find((s) => s.segment.startsWith("Students"))!.purchaseIntent}/10) but are the largest segment ({fmtPct(D.segmentStats.find((s) => s.segment.startsWith("Students"))!.share)} of respondents). &ldquo;{quotes.find((q) => q.segment.startsWith("Students") && q.sentiment === "negative")!.quote}&rdquo; They are the volume the CMO&apos;s price gives up, on purpose.</li>
            <li>Urban wellness professionals accept any price ({D.segmentStats.find((s) => s.segment.startsWith("Urban"))!.priceSensitivity}/10 sensitivity), but warn: &ldquo;{quotes.find((q) => q.segment.startsWith("Urban") && q.sentiment === "negative")!.quote}&rdquo; The risk at the top of the ladder is taste, which no pricing tool can fix.</li>
            <li>Commuters prefer retail ({fmtPct(D.segmentStats.find((s) => s.segment.startsWith("On"))!.channelPreference["Retail/Grocery"])}) and say &ldquo;{quotes.find((q) => q.segment.startsWith("On") && q.sentiment === "positive")!.quote}&rdquo; That is the argument for the retail phase, and for why it comes second.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
