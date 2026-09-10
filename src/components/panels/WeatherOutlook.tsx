"use client";
import { useEffect, useState } from "react";
import { MONTHS_LONG, timingTable } from "@/lib/model";
import { berlinDate, FORECAST_URL, summarizeForecast, type WeatherSummary } from "@/lib/weather";

type Outlook = { status: "loading" | "unavailable" } | { status: "ready"; summary: WeatherSummary };

export default function WeatherOutlook() {
  const [outlook, setOutlook] = useState<Outlook>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (active) setOutlook({ status: "unavailable" });
    }, 5000);
    async function load() {
      try {
        const response = await fetch(FORECAST_URL, { signal: controller.signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error("Weather unavailable");
        const summary = summarizeForecast(await response.json(), berlinDate());
        if (active && !controller.signal.aborted) setOutlook({ status: "ready", summary });
      } catch {
        if (active) setOutlook({ status: "unavailable" });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, []);

  if (outlook.status !== "ready") return (
    <p role="status" className="text-xs text-ink-2 mt-4 border-t border-line pt-3">
      {outlook.status === "loading" ? "Checking live weather; the static seasonality data remains available." : "Live weather unavailable; showing static seasonality data only."}
    </p>
  );

  const { summary } = outlook;
  const baseline = timingTable()[summary.month - 1];
  const month = MONTHS_LONG[summary.month - 1];
  const delta = summary.cities.reduce((sum, city) => sum + city.mean, 0) / 2 - baseline.tempC;
  const implication = delta >= 1 ? "warmer conditions may support a small launch test" : delta <= -1 ? "cooler conditions suggest a cautious launch test" : "near-average temperatures suggest following the usual seasonal launch plan";
  return (
    <div className="mt-4 border-t border-line pt-3 space-y-2" aria-label="Live weather outlook">
      <div className="flex flex-wrap justify-between gap-1 items-baseline">
        <h3 className="text-sm font-semibold">Weather for a launch this month</h3>
        <span className="text-[11px] text-ink-3">16-day forecast · {summary.start} to {summary.end}</span>
      </div>
      <p className="text-xs text-ink-2">{month} · German average {baseline.tempC.toFixed(1)}°C · seasonality index {baseline.index} (100 = annual average)</p>
      <div className="grid grid-cols-2 gap-2">
        {summary.cities.map((city) => {
          const difference = city.mean - baseline.tempC;
          return <div key={city.name} className="rounded-lg border border-line p-3">
            <p className="text-xs text-ink-2">{city.name}</p>
            <p className="text-lg font-semibold num">{city.mean.toFixed(1)}°C</p>
            <p className="text-xs text-ink-2">{difference >= 0 ? "+" : ""}{difference.toFixed(1)}°C vs {month} average</p>
          </div>;
        })}
      </div>
      <p className="text-xs text-ink-2">For a launch in {month}, {implication}, alongside a seasonality index of {baseline.index}.</p>
      <p className="text-[11px] text-ink-3">Means use the {summary.days} forecast days in {month}, compared with the case’s national monthly average, not city climate normals; this is context, not a measured sales effect, and does not change the model.</p>
      <p className="text-[11px] text-ink-3">Weather: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">Open-Meteo</a> · live forecast, no saved weather data.</p>
    </div>
  );
}
