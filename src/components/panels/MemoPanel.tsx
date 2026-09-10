"use client";
import { useState } from "react";
import { Card } from "@/components/ui";
import { type Result, type Scenario, MONTHS_LONG, cityRanking, bestLaunchMonth, fmtEur, fmtPct, fmtInt } from "@/lib/model";

export function buildMemo(s: Scenario, r: Result): string {
  const chans = [...r.perChannel].sort((a, b) => b.share - a.share);
  const cities = cityRanking(s.price).filter((c) => c.city !== "Other Germany");
  const best = bestLaunchMonth();
  const lines = [
    `To: Freya Lindqvist, Head of Growth — Re: Germany launch recommendation`,
    ``,
    `Recommendation. Launch in Germany at ${fmtEur(s.price)} per 330 ml can, positioned as ${r.band.split(" (")[0].toLowerCase()}, through ${chans.filter((c) => c.share > 0.25).map((c) => `${c.channel} (${Math.round(c.share * 100)}%)`).join(" and ")}, starting in ${cities[0].city} and ${cities[1].city} in ${MONTHS_LONG[s.launchMonth - 1]}.`,
    ``,
    `Why this price. ${fmtPct(r.acceptanceAll)} of surveyed Germans do not find ${fmtEur(s.price)} expensive. LUMEN nets ${fmtEur(r.blendedNet)} per can with this channel mix and keeps ${fmtEur(r.blendedContribution)} after the ${fmtEur(0.62)} cost of goods (${fmtPct(r.blendedMarginPct)} contribution margin, versus 30% blended gross margin at home today). On the German shelf this sits at ${Math.round(r.premium)}/100 between PulsUp and Root & Rise.`,
    ``,
    `Why this channel mix. Grocery keeps 43% of the shelf price; online and gyms keep 3% and 20%. At ${fmtEur(s.price)} a can is worth ${fmtEur(r.perChannel[0].contribution)} to us online, ${fmtEur(r.perChannel[2].contribution)} in gyms and ${fmtEur(r.perChannel[1].contribution)} in grocery. The segments that accept this price (${r.segments.slice().sort((a, b) => b.weight - a.weight).slice(0, 2).map((x) => x.segment.toLowerCase()).join(", ")}) also say they buy online and in gyms. Retail follows once awareness exists.`,
    ``,
    `What the CFO gets. A German customer costs about ${fmtEur(r.cac, 0)} to acquire (home-market CAC scaled by price acceptance) and returns ${fmtEur(r.contributionPerCustomerMonth)} of contribution a month, so marketing pays back in ${Number.isFinite(r.paybackMonths) ? r.paybackMonths.toFixed(1) : "more than 36"} months. With a ${fmtEur(s.marketingBudget, 0)} launch budget that is ${fmtInt(r.customersYear1)} customers, ${fmtInt(r.unitsYear1)} cans and a year-one result of ${fmtEur(r.resultYear1, 0)} after marketing. LTV:CAC over ${s.lifetimeMonths} months is ${r.ltvToCac.toFixed(1)}.`,
    ``,
    `What the CMO gets. A price in the VoltFit band, a clean-label story that the urban wellness and fitness segments already pay for, and no grocery discounting in year one to cheapen the brand.`,
    ``,
    `What we are deliberately not optimising for. Volume from the student segment (the largest group in the survey, ${fmtPct(r.segments.find((x) => x.segment.startsWith("Students"))!.acceptance)} of whom accept this price), a Root & Rise boutique price point, and national grocery coverage in year one. We are also not assuming the 3:1 LTV:CAC in the plan: at ${s.lifetimeMonths} months of lifetime it is ${r.ltvToCac.toFixed(1)}, and the honest way to raise it is repeat purchase, not price.`,
    ``,
    `Timing. ${best.label} is the best launch window in the seasonality data (the three months after it average an index of ${best.rampIndex}); ${s.launchMonth === best.month ? "we recommend it" : `${MONTHS_LONG[s.launchMonth - 1]} is the current choice`}. Avoid January and February: lowest demand and the competitor promo cluster.`,
    ``,
    r.warnings.length ? `Flags on this scenario: ${r.warnings.join(" ")}` : `No flags on this scenario.`,
  ];
  return lines.join("\n");
}

export default function MemoPanel({ scenario, result }: { scenario: Scenario; result: Result }) {
  const memo = buildMemo(scenario, result);
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(memo); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } };
  return (
    <Card title="One-page memo for Freya" subtitle="Generated from the scenario above. Edit the levers, the memo follows.">
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-2 bg-surface rounded-lg p-4 border border-line">{memo}</pre>
      <button onClick={copy} className="mt-3 text-sm px-3 py-1.5 rounded-lg border border-line bg-card hover:border-ink-3">{copied ? "Copied" : "Copy memo"}</button>
    </Card>
  );
}
