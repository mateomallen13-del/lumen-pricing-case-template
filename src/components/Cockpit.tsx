"use client";
import { useEffect, useMemo, useState } from "react";
import { PRESETS, evaluate, sanitize, type Scenario, type Channel, type MarketingChannel, cacFor, fmtEur, MARKETING_CHANNELS, D, scenarioToQuery, scenarioFromQuery } from "@/lib/model";
import { Card, MixSliders, Slider } from "@/components/ui";
import Headline from "@/components/panels/Headline";
import PricingPanel from "@/components/panels/PricingPanel";
import ChannelPanel from "@/components/panels/ChannelPanel";
import TradeoffPanel from "@/components/panels/TradeoffPanel";
import TimingPanel from "@/components/panels/TimingPanel";
import CityPanel from "@/components/panels/CityPanel";
import DataNotesPanel from "@/components/panels/DataNotesPanel";
import MemoPanel from "@/components/panels/MemoPanel";
import ComparisonPanel from "@/components/panels/ComparisonPanel";
import SensitivityPanel from "@/components/panels/SensitivityPanel";
import CalibrationPanel from "@/components/panels/CalibrationPanel";
import RoadmapPanel from "@/components/panels/RoadmapPanel";

export const CHANNEL_COLORS: Record<Channel, string> = { "DTC Online": "var(--s-dtc)", "Retail/Grocery": "var(--s-retail)", "Gym & Office": "var(--s-gym)" };
const MKT_COLORS: Record<MarketingChannel, string> = { "Referral / Subscription": "var(--s-dtc)", "Influencer / Content": "var(--s-retail)", "Paid Social": "var(--s-gym)", "Retail Sampling": "var(--s-4)" };
const STORAGE_KEY = "lumen-cockpit-scenario-v1";

export default function Cockpit() {
  const [scenario, setScenario] = useState<Scenario>(PRESETS.recommended.scenario);
  const [loaded, setLoaded] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Restore the last scenario after hydration (per-browser convenience only, nothing is sent anywhere).
  useEffect(() => {
    const t = setTimeout(() => {
      // A shared link wins over the locally remembered scenario.
      const fromUrl = scenarioFromQuery(window.location.search.slice(1), PRESETS.recommended.scenario);
      if (fromUrl) setScenario(fromUrl);
      else { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setScenario(sanitize({ ...PRESETS.recommended.scenario, ...JSON.parse(raw) })); } catch { /* no stored scenario or storage blocked: keep the default */ } }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario)); } catch { /* storage unavailable (private mode): ignore */ } }, [scenario, loaded]);

  const result = useMemo(() => evaluate(scenario), [scenario]);
  const set = (patch: Partial<Scenario>) => setScenario((s) => sanitize({ ...s, ...patch }));
  const copyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?${scenarioToQuery(scenario)}`;
      window.history.replaceState(null, "", url);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500);
    } catch { setLinkCopied(false); }
  };
  const activePreset = (Object.keys(PRESETS) as (keyof typeof PRESETS)[]).find((k) => JSON.stringify(sanitize(PRESETS[k].scenario)) === JSON.stringify(sanitize(scenario)));

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-3">LUMEN · Strategy &amp; Analytics · Germany market entry</p>
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">Germany Launch Cockpit</h1>
          <p className="text-sm text-ink-2 mt-1 max-w-2xl">Move the price and the channel mix, and watch what it does to acceptance, margin, and the months it takes to pay back a customer. Built for Freya&apos;s question: where is the real CMO/CFO trade-off?</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Scenario presets">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
            <button key={k} onClick={() => setScenario(sanitize(PRESETS[k].scenario))} title={PRESETS[k].blurb}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${activePreset === k ? "bg-ink text-white border-ink" : "bg-card border-line hover:border-ink-3"}`}>
              {PRESETS[k].label}
            </button>
          ))}
          <button onClick={copyLink} className="text-sm px-3 py-1.5 rounded-lg border border-dashed border-line bg-card hover:border-ink-3" title="Copy a link that opens exactly this scenario">{linkCopied ? "Link copied" : "Share scenario"}</button>
        </div>
      </header>

      <Headline result={result} scenario={scenario} />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card title="Your levers" subtitle="Everything below recomputes live. Values are per 330 ml can." className="lg:sticky lg:top-4 self-start">
          <div className="space-y-5">
            <Slider label="Shelf price" value={scenario.price} min={1.2} max={3.2} step={0.01} onChange={(v) => set({ price: v })} format={(v) => fmtEur(v)} />
            <div className="flex gap-2 text-xs">
              {[1.79, 2.19, 2.59].map((p) => (
                <button key={p} onClick={() => set({ price: p })} className={`px-2 py-1 rounded border ${Math.abs(scenario.price - p) < 0.005 ? "bg-ink text-white border-ink" : "border-line hover:border-ink-3"}`}>{fmtEur(p)}</button>
              ))}
              <span className="text-ink-3 self-center">Exhibit 11 candidates</span>
            </div>
            <MixSliders label="Sales channel mix (share of cans)" mix={scenario.channelMix} colors={CHANNEL_COLORS} onChange={(m) => set({ channelMix: m })} hint="Exhibit 9" />
            <MixSliders label="Marketing budget mix" mix={scenario.marketingMix} colors={MKT_COLORS} onChange={(m) => set({ marketingMix: m })} hint="Exhibit 7" />
            <p className="text-[11px] text-ink-3 -mt-2">Home-market CAC: {MARKETING_CHANNELS.map((k) => `${k.split(" /")[0]} ${fmtEur(cacFor(k), 0)}`).join(" · ")}</p>
            <Slider label="Launch-year marketing budget" value={scenario.marketingBudget} min={50_000} max={1_000_000} step={10_000} onChange={(v) => set({ marketingBudget: v })} format={(v) => fmtEur(v, 0)} />
            <Slider label="Assumed customer lifetime" value={scenario.lifetimeMonths} min={3} max={36} step={1} onChange={(v) => set({ lifetimeMonths: v })} format={(v) => `${v} months`} />
            <p className="text-[11px] text-ink-3">Fixed inputs: COGS {fmtEur(D.costs.cogsTotal)} per can (Exhibit 8), channel cuts from Exhibit 9, acceptance from the {D.vanWestendorp.n}-person Van Westendorp survey (Exhibit 10), purchase frequency and intent from the {D.sourceNotes.surveyRespondents}-person German survey (Exhibit 4).</p>
          </div>
        </Card>

        <div className="space-y-5 min-w-0">
          <TradeoffPanel scenario={scenario} result={result} />
          <ComparisonPanel scenario={scenario} result={result} />
          <PricingPanel result={result} />
          <ChannelPanel result={result} />
          <div className="grid gap-5 md:grid-cols-2">
            <TimingPanel scenario={scenario} onPick={(m) => set({ launchMonth: m })} />
            <CityPanel price={scenario.price} />
          </div>
          <SensitivityPanel scenario={scenario} result={result} />
          <RoadmapPanel scenario={scenario} result={result} />
          <MemoPanel scenario={scenario} result={result} />
          <CalibrationPanel />
          <DataNotesPanel />
        </div>
      </div>
      <footer className="text-[11px] text-ink-3 pt-4 border-t border-line">
        ATELIA × ESCP workshop, September 2026. All figures derive from the 12 exhibits in the case data room; the German survey data is synthetic and no individual respondent data is loaded in this page. This is a decision-support prototype, not a forecast.
      </footer>
    </main>
  );
}
