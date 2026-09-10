// Builds src/data/derived.json from the raw data room (data/*.csv).
// Design choices (see README "Our Approach"):
//  - PII columns of customer_survey.csv (first_name, last_name, email) are NEVER read into the output.
//  - Only aggregates leave this script: no individual survey respondent reaches the browser.
//  - Exact duplicate rows in historical_sales_weekly.csv are removed and counted.
//  - Statistical outlier weeks (|z| > 3 within a country x channel series) are flagged, not silently dropped.
// Run: node scripts/prepare-data.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(root, "data");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = ""; rows.push(row); row = [];
    } else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter(r => r.length === header.length).map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}
const load = (name) => parseCsv(readFileSync(resolve(dataDir, name), "utf8"));
const num = (v) => Number(v);
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;
const groupBy = (arr, key) => arr.reduce((m, x) => ((m[key(x)] ||= []).push(x), m), {});

// ---------- Exhibit 4: customer survey (PII dropped, aggregates only) ----------
const PII = ["first_name", "last_name", "email"];
const surveyRaw = load("customer_survey.csv");
const survey = surveyRaw.map(r => { const o = { ...r }; PII.forEach(k => delete o[k]); return o; });
const segments = ["Urban Wellness Professionals", "Fitness & Gym-Goers", "On-the-go Commuters", "Students & Budget-Conscious"];
const channels = ["DTC Online", "Retail/Grocery", "Gym & Office"];
const cities = ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt", "Other Germany"];

const segmentStats = segments.map(seg => {
  const g = survey.filter(r => r.segment === seg);
  const pref = Object.fromEntries(channels.map(c => [c, r3(g.filter(r => r.preferred_channel === c).length / g.length)]));
  return {
    segment: seg, n: g.length, share: r3(g.length / survey.length),
    purchaseFrequencyPerMonth: r2(mean(g.map(r => num(r.purchase_frequency_per_month)))),
    monthlySpendEur: r2(mean(g.map(r => num(r.monthly_beverage_spend_eur)))),
    priceSensitivity: r2(mean(g.map(r => num(r.price_sensitivity_1_10)))),
    purchaseIntent: r2(mean(g.map(r => num(r.lumen_purchase_intent_1_10)))),
    channelPreference: pref,
    awareness: { PulsUp: r2(mean(g.map(r => num(r.aware_pulsup)))), "Mate Libre": r2(mean(g.map(r => num(r.aware_matelibre)))), VoltFit: r2(mean(g.map(r => num(r.aware_voltfit)))), "Root & Rise": r2(mean(g.map(r => num(r.aware_rootandrise)))) },
    cityMix: Object.fromEntries(cities.map(c => [c, g.filter(r => r.city === c).length])),
  };
});
const cityStats = cities.map(city => {
  const g = survey.filter(r => r.city === city);
  return { city, n: g.length, purchaseIntent: r2(mean(g.map(r => num(r.lumen_purchase_intent_1_10)))), priceSensitivity: r2(mean(g.map(r => num(r.price_sensitivity_1_10)))), purchaseFrequencyPerMonth: r2(mean(g.map(r => num(r.purchase_frequency_per_month)))), segmentMix: Object.fromEntries(segments.map(s => [s, g.filter(r => r.segment === s).length])) };
});

// ---------- Exhibit 10: Van Westendorp ----------
const psmRaw = load("price_sensitivity_survey.csv");
const psm = psmRaw.map(r => ({ segment: r.segment, tooCheap: num(r.too_cheap_eur), cheap: num(r.cheap_eur), expensive: num(r.expensive_eur), tooExpensive: num(r.too_expensive_eur) }));
const grid = []; for (let p = 0.8; p <= 4.0001; p += 0.05) grid.push(r2(p));
const share = (rows, fn) => rows.filter(fn).length / (rows.length || 1);
const curve = (rows) => grid.map(p => ({ price: p, tooCheap: r3(share(rows, r => r.tooCheap >= p)), cheap: r3(share(rows, r => r.cheap >= p)), expensive: r3(share(rows, r => r.expensive <= p)), tooExpensive: r3(share(rows, r => r.tooExpensive <= p)), acceptance: r3(share(rows, r => r.expensive > p)), notRejected: r3(share(rows, r => r.tooExpensive > p)) }));
const cross = (pts, a, b) => { for (let i = 0; i < pts.length - 1; i++) { const d0 = pts[i][a] - pts[i][b], d1 = pts[i + 1][a] - pts[i + 1][b]; if (d0 * d1 <= 0) { const t = d0 / (d0 - d1 || 1); return r2(pts[i].price + t * (pts[i + 1].price - pts[i].price)); } } return null; };
const allCurve = curve(psm);
const vanWestendorp = {
  n: psm.length,
  all: { curve: allCurve, opp: cross(allCurve, "tooCheap", "tooExpensive"), ipp: cross(allCurve, "cheap", "expensive"), pmc: cross(allCurve, "tooCheap", "expensive"), pme: cross(allCurve, "cheap", "tooExpensive") },
  bySegment: Object.fromEntries(segments.map(s => { const c = curve(psm.filter(r => r.segment === s)); return [s, { n: psm.filter(r => r.segment === s).length, curve: c.map(({ price, acceptance, notRejected }) => ({ price, acceptance, notRejected })), opp: cross(c, "tooCheap", "tooExpensive"), ipp: cross(c, "cheap", "expensive"), pmc: cross(c, "tooCheap", "expensive"), pme: cross(c, "cheap", "tooExpensive") }]; })),
};

// ---------- Exhibit 6: historical sales (dedupe + outlier flag) ----------
const salesRaw = load("historical_sales_weekly.csv");
const seen = new Set(); const sales = []; let duplicatesRemoved = 0;
for (const r of salesRaw) { const k = JSON.stringify(r); if (seen.has(k)) { duplicatesRemoved++; continue; } seen.add(k); sales.push(r); }
const outliers = [];
for (const g of Object.values(groupBy(sales, r => `${r.country}|${r.channel}`))) {
  const u = g.map(r => num(r.units_sold)); const m = mean(u); const sd = Math.sqrt(mean(u.map(x => (x - m) ** 2)));
  const sorted = [...u].sort((a, b) => a - b); const med = sorted[Math.floor(sorted.length / 2)];
  g.forEach(r => { const z = (num(r.units_sold) - med) / (sd || 1); if (Math.abs(z) > 3) outliers.push({ week: r.week_start_date, country: r.country, channel: r.channel, units: num(r.units_sold), median: med, z: r2(z), promo: r.promo_active === "True" }); });
}
const salesByCountryChannel = Object.entries(groupBy(sales, r => `${r.country}|${r.channel}`)).map(([k, g]) => { const [country, channel] = k.split("|"); const units = g.reduce((a, r) => a + num(r.units_sold), 0), revenue = g.reduce((a, r) => a + num(r.revenue_eur), 0); return { country, channel, units, revenue: r2(revenue), asp: r2(revenue / units), weeks: g.length, avgWeeklyUnits: Math.round(units / g.length) }; });
const monthlyIdx = {}; for (const r of sales) { const m = Number(r.week_start_date.slice(5, 7)); (monthlyIdx[m] ||= []).push(num(r.units_sold)); }
const homeMonthlyAvg = Object.fromEntries(Object.entries(monthlyIdx).map(([m, u]) => [m, Math.round(mean(u))]));
const homeMean = mean(Object.values(homeMonthlyAvg));
const promoEffect = channels.map(c => { const on = sales.filter(r => r.channel === c && r.promo_active === "True").map(r => num(r.units_sold)); const off = sales.filter(r => r.channel === c && r.promo_active !== "True").map(r => num(r.units_sold)); return { channel: c, promoWeeks: on.length, avgUnitsPromo: Math.round(mean(on)), avgUnitsNoPromo: Math.round(mean(off)), uplift: r3(mean(on) / mean(off) - 1) }; });

// ---------- Exhibit 7: marketing funnel ----------
const funnel = load("marketing_funnel_monthly.csv");
const marketingChannels = Object.entries(groupBy(funnel, r => r.channel)).map(([channel, g]) => { const conv = g.reduce((a, r) => a + num(r.conversions_customers_acquired), 0), spend = g.reduce((a, r) => a + num(r.spend_eur), 0), reach = g.reduce((a, r) => a + num(r.reach), 0); return { channel, months: g.length, reach, conversions: conv, spend: r2(spend), cac: r2(spend / conv), ltv: r2(mean(g.map(r => num(r.ltv_estimate_eur)))), ltvToCac: r2(mean(g.map(r => num(r.ltv_estimate_eur))) / (spend / conv)) }; });
const blendedCac = r2(funnel.reduce((a, r) => a + num(r.spend_eur), 0) / funnel.reduce((a, r) => a + num(r.conversions_customers_acquired), 0));

// ---------- Exhibits 2, 3, 8, 9, 11, 12, 1, 5 ----------
const compPrices = load("competitor_prices_by_channel.csv").map(r => ({ competitor: r.competitor, positioning: r.positioning, channel: r.channel, format: r.format, price: num(r.price_eur), marketingIndex: num(r.marketing_spend_index_0_100) }));
const compHistory = load("competitor_price_history.csv").map(r => ({ competitor: r.competitor, month: r.month.slice(0, 7), listPrice: num(r.list_price_eur), promo: r.promo_active === "True", discountPct: num(r.promo_discount_pct), shelfPrice: num(r.shelf_price_eur) }));
const costRows = load("cost_breakdown.csv");
const cogs = costRows.filter(r => !r.cost_component.startsWith("TOTAL") && !r.cost_component.startsWith("[KPI")).map(r => ({ component: r.cost_component, eur: num(r.cost_per_unit_eur), pct: num(r.pct_of_total) }));
const cogsTotal = num(costRows.find(r => r.cost_component.startsWith("TOTAL")).cost_per_unit_eur);
const homeGrossMarginPct = num(costRows.find(r => r.cost_component.startsWith("[KPI")).cost_per_unit_eur);
const chanEcon = load("channel_economics.csv");
const channelEconomics = channels.map(c => { const r = chanEcon.find(x => x.channel === c); return { channel: c, retailerMarginPct: num(r.retailer_margin_pct), distributorCutPct: num(r.distributor_cut_pct), paymentProcessingPct: num(r.payment_processing_pct), fulfillmentCostEur: num(r.fulfillment_cost_eur) }; });
const priceTests = load("price_test_results.csv").map(r => ({ price: num(r.price_eur), channel: r.channel, acceptancePct: num(r.estimated_acceptance_pct_of_survey), netPrice: num(r.net_price_to_lumen_eur), contribution: num(r.unit_contribution_eur), contributionMarginPct: num(r.contribution_margin_pct) }));
const seasonality = load("seasonality_and_weather.csv").map(r => ({ month: num(r.month), index: num(r.seasonality_index_100_avg), tempC: num(r.avg_temp_germany_celsius), homeMarketIndex: Math.round((homeMonthlyAvg[num(r.month)] / homeMean) * 100) }));
const mc = load("market_context.csv");
const subcategories = Object.entries(groupBy(mc.filter(r => r.dimension_type === "subcategory"), r => r.name)).map(([name, g]) => ({ name, byYear: Object.fromEntries(g.map(r => [r.year, Math.round(num(r.value) / 1e6)])) }));
const regions = cities.map(c => ({ city: c, marketShare: num(mc.find(r => r.name === c && r.metric === "population_share_of_market").value), cagr: num(mc.find(r => r.name === c && r.metric === "regional_cagr").value) }));
const quotes = load("customer_quotes.csv").map(r => ({ segment: r.segment, sentiment: r.sentiment, quote: r.quote }));

const derived = {
  generatedAt: new Date().toISOString(),
  sourceNotes: { piiColumnsDropped: PII, surveyRespondents: survey.length, salesDuplicatesRemoved: duplicatesRemoved, salesRowsKept: sales.length, salesOutlierWeeks: outliers, homeMarkets: [...new Set(sales.map(r => r.country))], salesPeriod: { from: sales[0].week_start_date, to: sales[sales.length - 1].week_start_date } },
  segments, channels, cities, segmentStats, cityStats, vanWestendorp,
  sales: { byCountryChannel: salesByCountryChannel, promoEffect },
  marketing: { channels: marketingChannels, blendedCac },
  competitors: { prices: compPrices, history: compHistory },
  costs: { cogs, cogsTotal, homeGrossMarginPct },
  channelEconomics, priceTests, seasonality,
  market: { subcategories, regions, totalMarket2026MEur: Math.round(subcategories.reduce((a, s) => a + s.byYear["2026"], 0)) },
  quotes,
};
writeFileSync(resolve(root, "src/data/derived.json"), JSON.stringify(derived, null, 1));
console.log(`derived.json written: ${survey.length} survey rows aggregated (PII dropped: ${PII.join(", ")}), ${duplicatesRemoved} duplicate sales rows removed, ${outliers.length} outlier week(s) flagged.`);
