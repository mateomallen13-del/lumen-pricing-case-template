import { test } from "node:test";
import assert from "node:assert/strict";
import { berlinDate, summarizeForecast } from "../src/lib/weather";

function fixture(today: string) {
  return [0, 1].map((city) => ({
    daily_units: { temperature_2m_mean: "°C" },
    daily: {
      time: Array.from({ length: 16 }, (_, day) => { const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + day); return date.toISOString().slice(0, 10); }),
      temperature_2m_mean: Array.from({ length: 16 }, (_, day) => 10 + city + day),
    },
  }));
}

test("forecast crossing a year boundary compares only this month's days", () => {
  const summary = summarizeForecast(fixture("2026-12-30"), "2026-12-30");
  assert.equal(summary.days, 2);
  assert.equal(summary.month, 12);
  assert.equal(summary.cities[0].mean, 10.5);
  assert.equal(summary.cities[1].mean, 11.5);
  assert.equal(summary.end, "2027-01-14");
});

test("Berlin date handles the month boundary independently of browser timezone", () => {
  assert.equal(berlinDate(new Date("2026-08-31T22:30:00Z")), "2026-09-01");
});

test("rejects malformed, incomplete, stale and non-Celsius forecasts", () => {
  assert.throws(() => summarizeForecast({}, "2026-09-10"));
  assert.throws(() => summarizeForecast(fixture("2026-09-09"), "2026-09-10"));
  const missing = fixture("2026-09-10"); missing[1].daily.temperature_2m_mean.pop();
  assert.throws(() => summarizeForecast(missing, "2026-09-10"));
  const invalid = fixture("2026-09-10"); invalid[0].daily.temperature_2m_mean[0] = NaN;
  assert.throws(() => summarizeForecast(invalid, "2026-09-10"));
  const units = fixture("2026-09-10"); units[0].daily_units.temperature_2m_mean = "°F";
  assert.throws(() => summarizeForecast(units, "2026-09-10"));
});
