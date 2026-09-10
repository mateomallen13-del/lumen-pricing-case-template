"use client";
import { Card } from "@/components/ui";
import { calibration, fmtEur, fmtPct } from "@/lib/model";

export default function CalibrationPanel() {
  const c = calibration();
  return (
    <Card title="Does the model reproduce what we already know?" subtitle="Before trusting it on Germany, we run it on the markets where LUMEN already sells.">
      <div className="grid gap-4 md:grid-cols-2 text-xs text-ink-2">
        <div>
          <p className="mb-2"><strong className="text-ink">Home markets, 2025–26.</strong> Apply the channel cuts (Exhibit 9) and the cost of goods (Exhibit 8) to the actual home shelf price of {fmtEur(c.homePrice)} and the actual home channel mix from 78 weeks of sales (Exhibit 6):</p>
          <table className="w-full num">
            <tbody>
              <tr className="border-t border-line"><td className="py-1">Channel mix by units</td><td className="text-right">{Object.entries(c.homeMix).map(([k, v]) => `${k.replace(" Online", "").replace("/Grocery", "")} ${Math.round(v * 100)}%`).join(" · ")}</td></tr>
              <tr className="border-t border-line"><td className="py-1">Net price to LUMEN</td><td className="text-right">{fmtEur(c.homeNet)}</td></tr>
              <tr className="border-t border-line"><td className="py-1">Contribution per can</td><td className="text-right">{fmtEur(c.homeContribution)}</td></tr>
              <tr className="border-t border-line font-semibold text-ink"><td className="py-1">Gross margin, model</td><td className="text-right">{fmtPct(c.homeMarginModel, 1)}</td></tr>
              <tr className="border-t border-line font-semibold text-ink"><td className="py-1">Gross margin, reported (Exhibit 8)</td><td className="text-right">{fmtPct(c.homeMarginReported, 1)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2">The model lands on the reported margin to the decimal. The German answer uses the same machinery with German prices and a German channel mix.</p>
        </div>
        <div>
          <p className="mb-2"><strong className="text-ink">Exhibit 11, re-derived.</strong> The case reports net price, contribution and acceptance for the three candidates. Our model, fed only Exhibits 8, 9 and 10, gives:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full num">
              <thead><tr className="text-left text-ink-3"><th className="py-1 pr-2 font-medium">Price · channel</th><th className="pr-2 font-medium">Net (case / model)</th><th className="pr-2 font-medium">Contribution</th><th className="font-medium">Acceptance</th></tr></thead>
              <tbody>
                {c.exhibit11.map((t) => (
                  <tr key={`${t.price}-${t.channel}`} className="border-t border-line">
                    <td className="py-1 pr-2 whitespace-nowrap">{fmtEur(t.price)} · {t.channel.replace(" Online", "").replace("/Grocery", "")}</td>
                    <td className="pr-2 whitespace-nowrap">{fmtEur(t.netPrice)} / {fmtEur(t.modelNet)}</td>
                    <td className="pr-2 whitespace-nowrap">{fmtEur(t.contribution)} / {fmtEur(t.modelContribution)}</td>
                    <td className="whitespace-nowrap">{t.acceptancePct}% / {(t.modelAcceptance * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2">Economics match to the cent. Acceptance matches at €2.19 and €2.59; at €1.79 the raw survey is more generous ({(c.exhibit11[0].modelAcceptance * 100).toFixed(0)}% vs 61.7%). We keep the raw survey and say so, rather than tune the model to the summary.</p>
        </div>
      </div>
    </Card>
  );
}
