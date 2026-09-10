"use client";
import { Card, Legend } from "@/components/ui";
import { type Result, type Channel, D, COGS, fmtEur, fmtPct } from "@/lib/model";

const COLORS: Record<Channel, string> = { "DTC Online": "var(--s-dtc)", "Retail/Grocery": "var(--s-retail)", "Gym & Office": "var(--s-gym)" };

export default function ChannelPanel({ result: r }: { result: Result }) {
  const rows = r.perChannel.map((c) => {
    const e = D.channelEconomics.find((x) => x.channel === c.channel)!;
    const cuts = r.price * (e.retailerMarginPct + e.distributorCutPct + e.paymentProcessingPct) + e.fulfillmentCostEur;
    return { ...c, cuts, cutLabel: [e.retailerMarginPct && `retailer ${Math.round(e.retailerMarginPct * 100)}%`, e.distributorCutPct && `distributor ${Math.round(e.distributorCutPct * 100)}%`, e.paymentProcessingPct && `payment ${(e.paymentProcessingPct * 100).toFixed(1)}%`, e.fulfillmentCostEur && `fulfilment ${fmtEur(e.fulfillmentCostEur)}`].filter(Boolean).join(", ") };
  });
  const pref = D.segmentStats;
  return (
    <Card title="What one can leaves for LUMEN, channel by channel" subtitle={`Shelf price ${fmtEur(r.price)} split into channel cuts, COGS (${fmtEur(COGS)}) and contribution (Exhibits 8 and 9).`}>
      <div className="space-y-3">
        {rows.map((c) => {
          const w = (x: number) => `${Math.max(0, (x / r.price) * 100)}%`;
          return (
            <div key={c.channel}>
              <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full" style={{ background: COLORS[c.channel] }} aria-hidden />{c.channel} <span className="text-ink-3">· {Math.round(c.share * 100)}% of your mix</span></span>
                <span className="num">nets {fmtEur(c.net)} · keeps <strong>{fmtEur(c.contribution)}</strong> ({fmtPct(c.marginPct)})</span>
              </div>
              <div className="flex h-5 rounded overflow-hidden gap-[2px]" role="img" aria-label={`${c.channel}: cuts ${fmtEur(c.cuts)}, COGS ${fmtEur(COGS)}, contribution ${fmtEur(c.contribution)}`}>
                <div style={{ width: w(c.cuts), background: "var(--line)" }} title={`Channel cuts ${fmtEur(c.cuts)}: ${c.cutLabel}`} />
                <div style={{ width: w(COGS), background: "var(--ink-3)" }} title={`COGS ${fmtEur(COGS)}`} />
                <div style={{ width: w(c.contribution), background: c.contribution > 0 ? COLORS[c.channel] : "var(--bad)" }} title={`Contribution ${fmtEur(c.contribution)}`} />
              </div>
              <div className="text-[11px] text-ink-3 mt-0.5">{c.cutLabel}</div>
            </div>
          );
        })}
      </div>
      <Legend items={[{ label: "Channel cuts", color: "var(--line)" }, { label: "COGS", color: "var(--ink-3)" }, { label: "LUMEN contribution", color: "var(--s-dtc)" }]} />
      <div className="mt-4 grid gap-3 md:grid-cols-2 text-xs text-ink-2">
        <p><strong className="text-ink">Where the buyers say they shop (Exhibit 4):</strong> {pref.map((s) => `${s.segment.split(" ")[0]}${s.segment.startsWith("On") ? " commuters" : s.segment.startsWith("Urban") ? " wellness" : ""}: ${Object.entries(s.channelPreference).sort((a, b) => b[1] - a[1])[0][0].replace(" Online", "").replace("/Grocery", "")} ${Math.round(Object.entries(s.channelPreference).sort((a, b) => b[1] - a[1])[0][1] * 100)}%`).join(" · ")}. Your mix matches the buyer base at {fmtPct(r.channelFit)}.</p>
        <p><strong className="text-ink">Why retail waits:</strong> grocery takes 43% of the shelf price before LUMEN sees a cent, and needs listing fees plus promo support the data room does not even include. At {fmtEur(r.price)} a retail can keeps {fmtEur(rows[1].contribution)} against {fmtEur(rows[0].contribution)} online and {fmtEur(rows[2].contribution)} in gyms. Retail is where you go for volume once the brand is known, not where you learn whether Germans want the product.</p>
      </div>
    </Card>
  );
}
