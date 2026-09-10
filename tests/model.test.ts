// Run with: npm test  (node's built-in test runner through tsx, no extra framework)
import { test } from "node:test";
import assert from "node:assert/strict";
import { acceptance, netPrice, unitContribution, evaluate, sanitize, calibration, priceSweep, scenarioToQuery, scenarioFromQuery, PRESETS, D, bestLaunchMonth, cityRanking } from "../src/lib/model";

const close = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} vs ${b} (tol ${tol})`);

test("channel economics reproduce Exhibit 11 net price and contribution to the cent", () => {
  for (const t of D.priceTests) {
    close(netPrice(t.price, t.channel as never), t.netPrice, 0.005, `${t.price} ${t.channel} net`);
    close(unitContribution(t.price, t.channel as never), t.contribution, 0.005, `${t.price} ${t.channel} contribution`);
  }
});

test("acceptance at €2.19 matches the case's 51.7% and falls with price", () => {
  close(acceptance(2.19), 0.517, 0.01);
  assert.ok(acceptance(1.79) > acceptance(2.19) && acceptance(2.19) > acceptance(2.59));
  assert.equal(acceptance(0.5), acceptance(0.8), "below the survey range the curve is flat, not extrapolated");
  assert.equal(acceptance(9), 0);
});

test("model reproduces the reported 30% home-market gross margin", () => {
  const c = calibration();
  close(c.homeMarginModel, c.homeMarginReported, 0.005);
});

test("sanitize survives empty, negative and NaN input", () => {
  const s = sanitize({ price: NaN, channelMix: { "DTC Online": 0, "Retail/Grocery": 0, "Gym & Office": 0 }, marketingMix: { "Referral / Subscription": -3, "Influencer / Content": NaN, "Paid Social": 0, "Retail Sampling": 0 }, marketingBudget: -1, lifetimeMonths: 0, launchMonth: 99 });
  assert.equal(s.price, 1);
  close(Object.values(s.channelMix).reduce((a, b) => a + b, 0), 1, 1e-9);
  close(Object.values(s.marketingMix).reduce((a, b) => a + b, 0), 1, 1e-9);
  assert.ok(s.marketingBudget >= 10_000 && s.lifetimeMonths >= 1 && s.launchMonth === 12);
  const r = evaluate(s);
  assert.ok(Number.isFinite(r.resultYear1) && Number.isFinite(r.cac));
});

test("every preset evaluates to finite numbers and the CMO case pays back slower than the CFO case", () => {
  const cmo = evaluate(PRESETS.cmo.scenario), cfo = evaluate(PRESETS.cfo.scenario), rec = evaluate(PRESETS.recommended.scenario);
  for (const r of [cmo, cfo, rec]) for (const v of [r.paybackMonths, r.ltvToCac, r.resultYear1, r.blendedContribution]) assert.ok(Number.isFinite(v));
  assert.ok(cmo.paybackMonths > rec.paybackMonths && rec.paybackMonths > cfo.paybackMonths);
  assert.ok(cmo.blendedContribution > rec.blendedContribution && rec.blendedContribution > cfo.blendedContribution);
});

test("payback plateau: the curve is flat around the candidates and explodes above €2.60", () => {
  const sweep = priceSweep(PRESETS.recommended.scenario);
  const at = (p: number) => sweep.find((x) => Math.abs(x.price - p) < 0.001)!.payback;
  assert.ok(Math.abs(at(1.8) - at(2.2)) < 1.0, "1.80 and 2.20 within one month of each other");
  assert.ok(at(2.8) > 2 * at(2.2), "2.80 more than double 2.20");
});

test("scenario survives a URL round-trip and rejects garbage", () => {
  const q = scenarioToQuery(PRESETS.cmo.scenario);
  const back = scenarioFromQuery(q, PRESETS.recommended.scenario)!;
  close(evaluate(back).resultYear1, evaluate(PRESETS.cmo.scenario).resultYear1, 0.01);
  assert.equal(scenarioFromQuery("", PRESETS.recommended.scenario), null);
  assert.equal(scenarioFromQuery("p=abc&c=1-2&m=x", PRESETS.recommended.scenario)!.price, 1);
});

test("timing and city helpers return sensible picks", () => {
  assert.ok([4, 5, 6].includes(bestLaunchMonth().month));
  const cities = cityRanking(2.19).filter((c) => c.city !== "Other Germany");
  assert.equal(cities[0].city, "Berlin");
  assert.equal(cities.length, 5);
});

test("derived data contains no personal data columns", () => {
  const text = JSON.stringify(D);
  assert.ok(!/@example\.com/.test(text), "no e-mail addresses");
  assert.ok(!("first_name" in (D as unknown as Record<string, unknown>)));
  assert.equal(D.sourceNotes.piiColumnsDropped.length, 3);
});
