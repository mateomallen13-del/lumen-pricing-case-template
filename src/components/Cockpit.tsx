"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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

function sameScenario(a: Scenario, b: Scenario) {
  const close = (x: number, y: number) => Math.abs(x - y) < 0.000001;
  return close(a.price, b.price) && close(a.marketingBudget, b.marketingBudget) && a.lifetimeMonths === b.lifetimeMonths && a.launchMonth === b.launchMonth
    && Object.keys(a.channelMix).every((key) => close(a.channelMix[key as Channel], b.channelMix[key as Channel]))
    && Object.keys(a.marketingMix).every((key) => close(a.marketingMix[key as MarketingChannel], b.marketingMix[key as MarketingChannel]));
}

export default function Cockpit() {
  const [scenario, setScenario] = useState<Scenario>(PRESETS.recommended.scenario);
  const [loaded, setLoaded] = useState(false);
  const [leversOpen, setLeversOpen] = useState(false);
  const leversToggle = useRef<HTMLButtonElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewLoaded, setViewLoaded] = useState("");

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
  const loadPreset = (k: keyof typeof PRESETS) => {
    setScenario(sanitize(PRESETS[k].scenario));
    setViewLoaded(`${PRESETS[k].label} loaded`);
    window.setTimeout(() => document.getElementById("scenario-output")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    window.setTimeout(() => setViewLoaded(""), 2200);
  };
  const copyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?${scenarioToQuery(scenario)}`;
      window.history.replaceState(null, "", url);
      await navigator.clipboard.writeText(url);
      setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500);
    } catch { setLinkCopied(false); }
  };
  const activePreset = (Object.keys(PRESETS) as (keyof typeof PRESETS)[]).find((k) => sameScenario(sanitize(PRESETS[k].scenario), sanitize(scenario)));

  return (
    <main className="cockpit flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <header className="relative flex flex-wrap items-end justify-between gap-3 pt-1 sm:pt-0">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-3">LUMEN · Strategy &amp; Analytics · Germany market entry</p>
          <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">Germany Launch Cockpit</h1>
          <p className="text-sm text-ink-2 mt-1 max-w-2xl">Move the price and the channel mix, and watch what it does to acceptance, margin, and the months it takes to pay back a customer. Built for Freya&apos;s question: where is the real CMO/CFO trade-off?</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-end sm:pt-7" role="group" aria-label="Load an executive scenario">
          <span className="text-[11px] uppercase tracking-wide text-ink-3 mr-1">Load a view</span>
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
            <button key={k} onClick={() => loadPreset(k)} title={PRESETS[k].blurb}
              aria-pressed={activePreset === k}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${activePreset === k ? "bg-ink text-white border-ink shadow-sm" : "bg-card border-line hover:border-ink-3"}`}>
              {PRESETS[k].label}
            </button>
          ))}
          <button onClick={copyLink} className="text-sm px-3 py-1.5 rounded-lg border border-dashed border-line bg-card hover:border-ink-3" title="Copy a link that opens exactly this scenario">{linkCopied ? "Link copied" : "Share scenario"}</button>
          <p className="basis-full text-[11px] text-ink-3 sm:text-right">{activePreset ? PRESETS[activePreset].blurb : "Custom scenario — adjust the levers below to test your own plan."}</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="absolute right-0 top-0 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--s-gym)] bg-[var(--s-gym)] text-white hover:brightness-95">My Launch Cockpit</button>
      </header>

      {createOpen && <CreateScenarioDialog onClose={() => setCreateOpen(false)} />}

      <div id="scenario-output" className="scroll-mt-4"><Headline result={result} scenario={scenario} /></div>
      {viewLoaded && <p role="status" className="text-xs text-[var(--s-gym)] text-right -mt-3">✓ {viewLoaded}</p>}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`levers-drawer lg:sticky lg:top-4 self-start ${leversOpen ? "is-open" : ""}`}
          aria-label="Scenario levers"
          onKeyDown={(event) => {
            if (event.key === "Escape" && leversOpen) {
              setLeversOpen(false);
              leversToggle.current?.focus();
            }
          }}>
          <button ref={leversToggle} type="button" className="levers-toggle"
            aria-expanded={leversOpen} aria-controls="levers-content"
            onClick={() => setLeversOpen((open) => !open)}>
            <span>Levers</span><span aria-hidden="true">{leversOpen ? "Close ↓" : "Adjust ↑"}</span>
          </button>
          <div id="levers-content" className="levers-content">
            <Card title="Your levers" subtitle="Everything below recomputes live. Values are per 330 ml can.">
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
          </div>
        </aside>

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

function CreateScenarioDialog({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [researchChoice, setResearchChoice] = useState<"pending" | "web" | "provided">("pending");
  const [error, setError] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [needsFollowup, setNeedsFollowup] = useState(false);
  const [email, setEmail] = useState("");
  const [decision, setDecision] = useState("");
  const [scope, setScope] = useState("");
  const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
  const validBrief = (value: string) => wordCount(value) >= 2 && /[a-zA-Z]{3}/.test(value);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const reviewEvidence = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validEmail) { setError("Enter a valid email address, for example name@company.com."); return; }
    if ((decision.trim() && !validBrief(decision)) || (scope.trim() && !validBrief(scope))) { setError("That looks incomplete. Add a few readable words, or leave the field empty and let the analyst ask follow-up questions."); return; }
    setError(""); setNeedsFollowup(!decision.trim() || !scope.trim() || wordCount(decision) < 5 || wordCount(scope) < 5); setSubmitted(true);
  };
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 p-4 flex items-center justify-center" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-scenario-title" title={needsFollowup ? "Follow-up questions recommended for a stronger evidence base" : undefined} className="bg-card rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between gap-4 items-start">
          <div><p className="text-[11px] uppercase tracking-wide text-ink-3">Guided intake</p><h2 id="create-scenario-title" className="text-xl font-semibold mt-1">Create my own scenario</h2></div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-3 text-xl">×</button>
        </div>
        {!emailConfirmed ? <form onSubmit={(e) => { e.preventDefault(); if (!validEmail) { setError("Enter a valid email address, for example name@company.com."); return; } setError(""); setEmailConfirmed(true); }} className="space-y-4 mt-5">
          <div className="rounded-xl bg-paper-2 p-4"><p className="font-semibold">Secure access before we begin</p><p className="text-sm text-ink-2 mt-1">Enter your work email to start your private analysis workspace. We ask first so a future production version can verify your identity and send your results securely.</p></div>
          <label className="block text-sm"><span className="font-medium">Work email</span><input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" inputMode="email" autoComplete="email" autoFocus className="mt-1 w-full rounded-lg border border-line p-2 text-sm bg-card" placeholder="name@company.com" /><span className="text-[11px] text-ink-3">This prototype checks the format locally; it does not send or store your email.</span></label>
          {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">Access blocked: {error}</p>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-3 py-2 text-sm">Cancel</button><button type="submit" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-semibold">Continue securely →</button></div>
        </form> : !submitted ? <form onSubmit={reviewEvidence} className="space-y-4 mt-5">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]"><div className="rounded-lg bg-ink text-white px-2 py-2"><strong>1</strong><br />Define</div><div className="rounded-lg bg-paper-2 text-ink-2 px-2 py-2"><strong>2</strong><br />Evidence</div><div className="rounded-lg bg-paper-2 text-ink-2 px-2 py-2"><strong>3</strong><br />Decision</div></div>
          <div className="rounded-lg border border-line p-3"><p className="text-sm font-semibold">Executive-grade analysis</p><p className="text-xs text-ink-2 mt-1">The analyst will separate facts from assumptions, quantify uncertainty, and produce a recommendation that a CFO, CEO, and COO can challenge.</p></div>
          <label className="block text-sm"><span className="font-medium">What decision are you making? <span className="font-normal text-ink-3">(optional)</span></span><textarea value={decision} onChange={(e) => setDecision(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-line p-2 text-sm bg-card" placeholder="Leave blank if you want the analyst to guide you." /></label>
          <label className="block text-sm"><span className="font-medium">Which market, product, and time horizon? <span className="font-normal text-ink-3">(optional)</span></span><input value={scope} onChange={(e) => setScope(e.target.value)} className="mt-1 w-full rounded-lg border border-line p-2 text-sm bg-card" placeholder="Leave blank if you do not know yet." /></label>
          <label className="block text-sm"><span className="font-medium">Work email</span><input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" inputMode="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-line p-2 text-sm bg-card" placeholder="name@company.com" /><span className="text-[11px] text-ink-3">A verified company email will be required before a real AI analysis can be run.</span></label>
          <div><p className="font-medium text-sm">Evidence checklist <span className="font-normal text-ink-3">(missing items become explicit risks)</span></p><ul className="text-xs text-ink-2 mt-2 space-y-1"><li>• Demand or customer research — willingness, segments, retention.</li><li>• Cost and channel economics — margin, CAC, payback, break-even.</li><li>• Competitors and market size — positioning, whitespace, realistic ceiling.</li><li>• Sales, seasonality, or campaign history — timing and operating benchmarks.</li></ul></div>
          <label className="block text-sm"><span className="font-medium">Select the files you want to review</span><input type="file" multiple className="mt-1 block w-full text-xs" accept=".csv,.xlsx,.xls,.pdf,.docx,.txt,.md" /><span className="text-[11px] text-ink-3">Files are not uploaded by this prototype. A production version must encrypt them in transit and at rest, restrict access, and delete them on the stated retention schedule.</span></label>
          <div className="rounded-lg border border-line p-3 text-xs text-ink-2"><strong className="text-ink">Privacy promise:</strong> we will never invent encryption or email verification. This screen only validates the email format locally; no email or file leaves your browser until a secure backend is connected.</div>
          {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">Request blocked: {error}</p>}
          <div className="rounded-lg bg-paper-2 p-3 text-xs text-ink-2"><strong className="text-ink">Planned output:</strong> recommendation, three scenarios, sensitivity range, cash and payback view, operating milestones, key risks, and a source note for every important number.</div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-3 py-2 text-sm">Cancel</button><button type="submit" className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-semibold">Review evidence →</button></div>
        </form> : <div className="mt-5 space-y-4"><div className="grid grid-cols-3 gap-2 text-center text-[11px]"><div className="rounded-lg bg-paper-2 text-ink-2 px-2 py-2">✓ Define</div><div className="rounded-lg bg-ink text-white px-2 py-2">✓ Evidence</div><div className="rounded-lg bg-paper-2 text-ink-2 px-2 py-2">Next: Decision</div></div><div className="rounded-lg bg-paper-2 p-4"><p className="font-semibold">Evidence review ready</p><p className="text-sm text-ink-2 mt-1">The analyst will first inspect the evidence you supplied, then identify gaps and contradictions. Your files stay under your control.</p></div><div className="rounded-xl border-2 border-[var(--s-gym)] p-4"><p className="font-semibold">Before I use any AI research</p><p className="text-sm text-ink-2 mt-1">I can research current market size, competitors, pricing, customer signals, regulations, and operating benchmarks. Research will be labeled with source, date, confidence, and fact vs. assumption status.</p>{researchChoice === "pending" ? <div className="flex flex-wrap gap-2 mt-4"><button type="button" onClick={() => setResearchChoice("web")} className="rounded-lg bg-[var(--s-gym)] text-white px-3 py-2 text-sm font-semibold">Use AI research + my evidence</button><button type="button" onClick={() => setResearchChoice("provided")} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Use only my evidence</button></div> : <p role="status" className="mt-3 text-sm font-semibold text-[var(--s-gym)]">✓ {researchChoice === "web" ? "AI research approved. It will be shown with sources before entering the recommendation." : "Confirmed: use only the evidence I provide."}</p>}</div>{researchChoice !== "pending" && <div className="rounded-lg border border-line p-3 text-xs text-ink-2">Approval boundary: no external findings should affect the final recommendation until they are displayed for review and explicitly accepted. Unsupported claims remain excluded.</div>}<button type="button" onClick={onClose} className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-semibold">Back to cockpit</button></div>}
      </section>
    </div>
  );
}
