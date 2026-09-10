// Pure decision model for the LUMEN Germany launch cockpit.
// Every number here traces back to an exhibit in data/ (see README "Our Approach").
import derived from "@/data/derived.json";

export const D = derived;
export type Channel = "DTC Online" | "Retail/Grocery" | "Gym & Office";
export type Segment = (typeof derived.segments)[number];
export type MarketingChannel = "Referral / Subscription" | "Influencer / Content" | "Paid Social" | "Retail Sampling";

export const CHANNELS = derived.channels as Channel[];
export const SEGMENTS = derived.segments as Segment[];
export const MARKETING_CHANNELS: MarketingChannel[] = ["Referral / Subscription", "Influencer / Content", "Paid Social", "Retail Sampling"];
export const COGS = derived.costs.cogsTotal; // €0.62 per can (Exhibit 8)
export const HOME_PRICE = 1.35; // average shelf price in NL/DK/SE (Exhibit 6 revenue / units)

export type Scenario = {
  price: number;                                   // shelf price, € per 330ml can
  channelMix: Record<Channel, number>;             // shares, sum ≈ 1 (Exhibit 9 / 11)
  marketingMix: Record<MarketingChannel, number>;  // shares of budget, sum ≈ 1 (Exhibit 7)
  marketingBudget: number;                         // € for launch year
  lifetimeMonths: number;                          // assumed customer lifetime for LTV
  launchMonth: number;                             // 1..12
};

export const PRESETS: Record<"recommended" | "cmo" | "cfo", { label: string; blurb: string; scenario: Scenario }> = {
  recommended: {
    label: "Recommended",
    blurb: "€2.19, DTC + Gym first, retail later. Premium enough for the brand, fast enough for the runway.",
    scenario: { price: 2.19, channelMix: { "DTC Online": 0.45, "Gym & Office": 0.35, "Retail/Grocery": 0.20 }, marketingMix: { "Referral / Subscription": 0.40, "Influencer / Content": 0.30, "Paid Social": 0.15, "Retail Sampling": 0.15 }, marketingBudget: 250_000, lifetimeMonths: 12, launchMonth: 4 },
  },
  cmo: {
    label: "CMO view",
    blurb: "Jonas: sit next to VoltFit and Root & Rise, build the brand on shelf, spend on sampling.",
    scenario: { price: 2.59, channelMix: { "DTC Online": 0.25, "Gym & Office": 0.25, "Retail/Grocery": 0.50 }, marketingMix: { "Referral / Subscription": 0.15, "Influencer / Content": 0.30, "Paid Social": 0.20, "Retail Sampling": 0.35 }, marketingBudget: 400_000, lifetimeMonths: 12, launchMonth: 5 },
  },
  cfo: {
    label: "CFO view",
    blurb: "Elena: lowest price, cheapest customers, DTC subscriptions, pay back the spend fast.",
    scenario: { price: 1.79, channelMix: { "DTC Online": 0.70, "Gym & Office": 0.20, "Retail/Grocery": 0.10 }, marketingMix: { "Referral / Subscription": 0.70, "Influencer / Content": 0.20, "Paid Social": 0.10, "Retail Sampling": 0.0 }, marketingBudget: 150_000, lifetimeMonths: 12, launchMonth: 4 },
  },
};

// ---------- guards ----------
export const clamp = (x: number, lo: number, hi: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : lo);
export function normalize<K extends string>(mix: Record<K, number>): Record<K, number> {
  const entries = Object.entries(mix) as [K, number][];
  const clean = entries.map(([k, v]) => [k, clamp(Number(v), 0, 1)] as [K, number]);
  const sum = clean.reduce((a, [, v]) => a + v, 0);
  if (sum <= 0) { const eq = 1 / clean.length; return Object.fromEntries(clean.map(([k]) => [k, eq])) as Record<K, number>; }
  return Object.fromEntries(clean.map(([k, v]) => [k, v / sum])) as Record<K, number>;
}
export function sanitize(s: Scenario): Scenario {
  return { price: clamp(s.price, 1.0, 3.5), channelMix: normalize(s.channelMix), marketingMix: normalize(s.marketingMix), marketingBudget: clamp(s.marketingBudget, 10_000, 5_000_000), lifetimeMonths: clamp(Math.round(s.lifetimeMonths), 1, 60), launchMonth: clamp(Math.round(s.launchMonth), 1, 12) };
}

// ---------- Exhibit 9: retail price -> what LUMEN nets ----------
export function netPrice(price: number, channel: Channel): number {
  const e = derived.channelEconomics.find((c) => c.channel === channel)!;
  return price * (1 - e.retailerMarginPct - e.distributorCutPct - e.paymentProcessingPct) - e.fulfillmentCostEur;
}
export const unitContribution = (price: number, channel: Channel) => netPrice(price, channel) - COGS;

// ---------- Exhibit 10: acceptance from Van Westendorp thresholds ----------
type CurvePoint = { price: number; acceptance: number; notRejected: number };
function interp(curve: CurvePoint[], price: number, key: "acceptance" | "notRejected"): number {
  if (price <= curve[0].price) return curve[0][key];
  const last = curve[curve.length - 1];
  if (price >= last.price) return last[key];
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    if (price >= a.price && price <= b.price) { const t = (price - a.price) / (b.price - a.price); return a[key] + t * (b[key] - a[key]); }
  }
  return last[key];
}
/** Share of respondents who do NOT find this price "expensive" (Exhibit 11 uses the same definition: 51.7% at €2.19). */
export const acceptance = (price: number, segment?: Segment) =>
  interp(segment ? (derived.vanWestendorp.bySegment as Record<string, { curve: CurvePoint[] }>)[segment].curve : derived.vanWestendorp.all.curve, price, "acceptance");
/** Share who do not find the price "too expensive" (would still consider it). */
export const notRejected = (price: number, segment?: Segment) =>
  interp(segment ? (derived.vanWestendorp.bySegment as Record<string, { curve: CurvePoint[] }>)[segment].curve : derived.vanWestendorp.all.curve, price, "notRejected");

// ---------- Exhibit 2: where a price sits on the competitor ladder ----------
export function competitorAvg(name: string): number {
  const rows = derived.competitors.prices.filter((p) => p.competitor === name && p.format === "Single can (330ml)");
  return rows.reduce((a, r) => a + r.price, 0) / rows.length;
}
/** 0 = PulsUp (mass), 100 = Root & Rise (boutique). VoltFit ≈ 70. */
export function premiumIndex(price: number): number {
  const lo = competitorAvg("PulsUp"), hi = competitorAvg("Root & Rise");
  return clamp(((price - lo) / (hi - lo)) * 100, -20, 120);
}
export function positioningBand(price: number): string {
  if (price < 1.4) return "Mass market (PulsUp territory)";
  if (price < 1.9) return "Heritage / value (Mate Libre territory)";
  if (price < 2.35) return "Accessible premium (below VoltFit)";
  if (price < 2.8) return "Premium performance (VoltFit territory)";
  return "Boutique (Root & Rise territory)";
}

// ---------- Exhibit 4 + 10: who actually buys at this price ----------
export type SegmentOutcome = { segment: Segment; surveyShare: number; acceptance: number; intent: number; weight: number; frequency: number; preferredChannel: Record<Channel, number> };
export function segmentOutcomes(price: number): SegmentOutcome[] {
  const raw = derived.segmentStats.map((s) => {
    const acc = acceptance(price, s.segment as Segment);
    return { segment: s.segment as Segment, surveyShare: s.share, acceptance: acc, intent: s.purchaseIntent, weight: s.share * acc * (s.purchaseIntent / 10), frequency: s.purchaseFrequencyPerMonth, preferredChannel: s.channelPreference as Record<Channel, number> };
  });
  const sum = raw.reduce((a, r) => a + r.weight, 0) || 1;
  return raw.map((r) => ({ ...r, weight: r.weight / sum }));
}

// ---------- Exhibit 7: CAC ----------
export function cacFor(mc: MarketingChannel): number { return derived.marketing.channels.find((c) => c.channel === mc)!.cac; }
export function blendedCac(mix: Record<MarketingChannel, number>): number {
  const m = normalize(mix);
  return MARKETING_CHANNELS.reduce((a, k) => a + m[k] * cacFor(k), 0);
}

// ---------- The whole P&L of one scenario ----------
export type Result = {
  price: number; premium: number; band: string;
  acceptanceAll: number; notRejectedAll: number;
  segments: SegmentOutcome[];
  perChannel: { channel: Channel; share: number; net: number; contribution: number; marginPct: number }[];
  blendedNet: number; blendedContribution: number; blendedMarginPct: number;
  unitsPerCustomerMonth: number; contributionPerCustomerMonth: number;
  cacBase: number; cac: number; paybackMonths: number; ltv: number; ltvToCac: number;
  customersYear1: number; unitsYear1: number; netRevenueYear1: number; contributionYear1: number; resultYear1: number;
  channelFit: number; // how well the channel mix matches where buyers say they shop (0..1)
  warnings: string[];
};
export function evaluate(input: Scenario): Result {
  const s = sanitize(input);
  const segs = segmentOutcomes(s.price);
  const perChannel = CHANNELS.map((c) => { const net = netPrice(s.price, c); const contribution = net - COGS; return { channel: c, share: s.channelMix[c], net, contribution, marginPct: net > 0 ? contribution / net : 0 }; });
  const blendedNet = perChannel.reduce((a, c) => a + c.share * c.net, 0);
  const blendedContribution = perChannel.reduce((a, c) => a + c.share * c.contribution, 0);
  const unitsPerCustomerMonth = segs.reduce((a, r) => a + r.weight * r.frequency, 0);
  const contributionPerCustomerMonth = unitsPerCustomerMonth * blendedContribution;
  // Home-market CAC was earned at €1.35, where ~everyone accepts the price. At a higher price a smaller
  // share of the people reached will convert, so the cost of one paying German customer scales with
  // the acceptance ratio (Exhibit 7 x Exhibit 10). This is the mechanism that links price to payback.
  const cacBase = blendedCac(s.marketingMix);
  const homeAcceptance = acceptance(HOME_PRICE);
  const acceptanceAll = acceptance(s.price);
  const cac = cacBase * (homeAcceptance / Math.max(acceptanceAll, 0.05));
  const paybackMonths = contributionPerCustomerMonth > 0 ? cac / contributionPerCustomerMonth : Infinity;
  const ltv = contributionPerCustomerMonth * s.lifetimeMonths;
  const customersYear1 = s.marketingBudget / cac;
  const unitsYear1 = customersYear1 * unitsPerCustomerMonth * Math.min(12, s.lifetimeMonths);
  const netRevenueYear1 = unitsYear1 * blendedNet;
  const contributionYear1 = unitsYear1 * blendedContribution;
  const buyerChannelPref = CHANNELS.map((c) => segs.reduce((a, r) => a + r.weight * r.preferredChannel[c], 0));
  const channelFit = 1 - 0.5 * CHANNELS.reduce((a, c, i) => a + Math.abs(s.channelMix[c] - buyerChannelPref[i]), 0);
  const warnings: string[] = [];
  if (perChannel.some((c) => c.share > 0 && c.contribution <= 0)) warnings.push("At this price at least one channel loses money on every can (contribution ≤ 0).");
  if (s.price < derived.vanWestendorp.all.pmc!) warnings.push(`Below the Van Westendorp floor (€${derived.vanWestendorp.all.pmc}): buyers start doubting quality.`);
  if (s.price > derived.vanWestendorp.all.pme!) warnings.push(`Above the Van Westendorp ceiling (€${derived.vanWestendorp.all.pme}): acceptance is driven by the two least price-sensitive segments only.`);
  if (paybackMonths > 12) warnings.push("Payback longer than 12 months: this is the scenario the CFO is worried about.");
  if (ltv / cac < 3) warnings.push(`LTV:CAC ${(ltv / cac).toFixed(1)} is below the 3:1 the plan assumes (Exhibit 7).`);
  if (s.price < 2.1) warnings.push("Priced below VoltFit's cheapest format (€2.10): the CMO's premium story is not credible at this level.");
  if (s.price >= 2.8) warnings.push("Priced in Root & Rise territory with 15/100 marketing weight behind that brand: a boutique price needs boutique distribution, not grocery.");
  return { price: s.price, premium: premiumIndex(s.price), band: positioningBand(s.price), acceptanceAll, notRejectedAll: notRejected(s.price), segments: segs, perChannel, blendedNet, blendedContribution, blendedMarginPct: blendedNet > 0 ? blendedContribution / blendedNet : 0, unitsPerCustomerMonth, contributionPerCustomerMonth, cacBase, cac, paybackMonths, ltv, ltvToCac: cac > 0 ? ltv / cac : 0, customersYear1, unitsYear1, netRevenueYear1, contributionYear1, resultYear1: contributionYear1 - s.marketingBudget, channelFit, warnings };
}

// ---------- Trade-off frontier: sweep price, hold the rest ----------
export function priceSweep(base: Scenario, from = 1.3, to = 3.1, step = 0.1) {
  const out = [];
  for (let p = from; p <= to + 1e-9; p += step) { const r = evaluate({ ...base, price: Math.round(p * 100) / 100 }); out.push({ price: r.price, acceptance: r.acceptanceAll, payback: Math.min(r.paybackMonths, 36), premium: r.premium, contribution: r.blendedContribution, ltvToCac: r.ltvToCac }); }
  return out;
}

// ---------- Exhibit 12 + 3: launch timing ----------
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function timingTable() {
  const promoByMonth: Record<number, number> = {};
  for (const h of derived.competitors.history) if (h.promo) { const m = Number(h.month.slice(5, 7)); promoByMonth[m] = (promoByMonth[m] || 0) + 1; }
  return derived.seasonality.map((s) => {
    const next3 = [0, 1, 2].map((k) => derived.seasonality[(s.month - 1 + k) % 12].index);
    const rampIndex = next3.reduce((a, b) => a + b, 0) / 3; // demand during the first 3 months after launch
    const promos = promoByMonth[s.month] || 0;
    const score = rampIndex - 8 * promos;
    return { month: s.month, label: MONTHS[s.month - 1], index: s.index, homeIndex: s.homeMarketIndex, tempC: s.tempC, promos, rampIndex: Math.round(rampIndex), score: Math.round(score) };
  });
}
export function bestLaunchMonth() { return timingTable().reduce((b, m) => (m.score > b.score ? m : b)); }

// ---------- Exhibit 1 + 4: which city first ----------
export function cityRanking(price: number) {
  const meanIntent = derived.cityStats.reduce((a, c) => a + c.purchaseIntent, 0) / derived.cityStats.length;
  const segW = Object.fromEntries(segmentOutcomes(price).map((s) => [s.segment, s.weight]));
  return derived.market.regions.map((r) => {
    const c = derived.cityStats.find((x) => x.city === r.city)!;
    const n = Object.values(c.segmentMix).reduce((a, b) => a + b, 0) || 1;
    const mixBySeg = c.segmentMix as Record<string, number>;
    const buyerFit = SEGMENTS.reduce((a, s) => a + (mixBySeg[s] / n) * segW[s], 0); // share of the city's respondents in the segments that buy at this price
    const meanFit = 0.25;
    const marketMEur = derived.market.totalMarket2026MEur * r.marketShare;
    const score = marketMEur * (1 + r.cagr) * (c.purchaseIntent / meanIntent) * (buyerFit / meanFit);
    return { city: r.city, marketMEur: Math.round(marketMEur), cagr: r.cagr, intent: c.purchaseIntent, respondents: c.n, buyerFit, score: Math.round(score) };
  }).sort((a, b) => b.score - a.score);
}

export const fmtEur = (x: number, d = 2) => (Number.isFinite(x) ? `€${x.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d })}` : "n/a");
export const fmtPct = (x: number, d = 0) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : "n/a");
export const fmtInt = (x: number) => (Number.isFinite(x) ? Math.round(x).toLocaleString("en-GB") : "n/a");
