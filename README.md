# LUMEN — Pricing & Go-to-Market Case — ATELIA × ESCP Starter Kit

> This repo is your starting point. Codex should read this README first.

## How to Get Started

This repo is a **template**: click **Fork** (top right), not "Use this template." Fork keeps your copy linked back to the original — that's what lets ATELIA automatically find every team's work, without anyone needing to send a link.

Once you've forked it, add your teammates as collaborators (Settings → Collaborators on your fork), and leave the visibility as **Public** — don't switch it to Private, or we lose access to your work.

## The Brief

The full brief is in `LUMEN_Case_Brief.md` (and a formatted version in `LUMEN_Case_Brief.pdf`). The data is in the `data/` folder, documented in `data/README_data.md`.

One-sentence summary: LUMEN, a functional beverage brand, has to decide **price, positioning, and launch channel(s)** to enter the German market — with no real German sales data (LUMEN isn't there yet), and a real trade-off between the CMO (premium positioning) and the CFO (fast return on investment).

## Rule #1 — Prompt Logging Is Automatic

This repo includes an `AGENTS.md` file, which Codex reads automatically at the start of every task — you don't need to open or edit it. The first time you talk to Codex in a new conversation, it will ask for your **student ID**. Answer it, and from then on Codex logs every prompt you send it — automatically, verbatim — into `prompts/<your-id>/session-*.md`, without you doing anything else.

**You don't fill this in by hand.** Your only job is to make sure that log file gets committed along with your code changes — Codex writes it, but you still need to include it when your pull request is created and merged. If a pull request only has code changes and no updated log file, that's a sign something didn't get logged.

Why we're doing this: it's not to monitor you. It's what lets us understand, at the end, how you reasoned — not just what you produced. A good result reached with a clear prompt from the start isn't scored the same as a good result reached after fifteen random attempts.

## Rule #2 — Before You Code, Ask Yourself These Questions

Check each box in this README as you go — not at the end, while you're working:

- [x] **Data**: what data will your tool actually handle? Is any of it sensitive (personal data, company customer data)? `data/customer_survey.csv` has name/email columns — did you use them in your tool? If yes, how did you protect/anonymize them? If no, why did you choose not to expose them? (A team that never touches these columns should still be able to answer — "we chose not to use them" is a valid answer.)
  *Our answer:* the tool handles all 12 exhibits, but only as aggregates. `scripts/prepare-data.mjs` deletes the `first_name`, `last_name` and `email` columns before doing anything else, then writes segment- and city-level averages to `src/data/derived.json`. No individual respondent, name or email exists anywhere in the app or the built site. We did not need identity to answer a pricing question, so we never loaded it.
- [x] **API keys**: if your tool calls an external API (weather, or anything else), where is the key stored? Never hardcoded in a file committed to GitHub. (A valid answer: "we didn't use any external API.")
  *Our answer:* the “When to launch” panel calls Open-Meteo’s public forecast API directly from the browser for Berlin and Munich (16 days, daily mean temperature). No API key or `.env` is needed. A five-second timeout, HTTP errors, blocked requests and invalid data all fall back to the static seasonality panel with a one-line notice. Requests bypass the browser cache; only a temporary display summary lives in component memory, with no weather response saved to files, browser storage or a database. The comparison uses only forecast days in the current month (Europe/Berlin), against Exhibit 12’s national monthly temperature average. It offers qualitative launch context, not a causal correlation or an adjustment to the financial model.
- [x] **Deployment**: if you deployed a live demo, does any endpoint or response return raw, unfiltered data (e.g. the full survey with name/email) to any visitor?
  *Our answer:* no. The site is fully static (Next.js, no API routes, no server). The only data shipped to visitors is `derived.json`, which contains aggregates only. The raw CSVs are in the repo (as provided by the case) but are never served by the app.
- [x] **Files generated along the way**: if your tool (or Codex) created new files derived from the provided data, did you think about whether they should be committed to the repo or not?
  *Our answer:* one generated file, `src/data/derived.json` (60 KB). We commit it because it is small, contains no personal data, and is fully reproducible with `node scripts/prepare-data.mjs`. Build output (`.next/`) and `node_modules/` are git-ignored.
- [x] **Storage**: if you're keeping any data, in what structure, and why that choice over another?
  *Our answer:* no database. Two people never need to see the same scenario at the same time, so a shared backend would add setup and a data-protection surface for nothing (the workshop's "default to local" rule). The only state is the visitor's last scenario, kept in their own browser's `localStorage` as a convenience, wrapped in try/catch so a blocked storage never breaks the page.
- [x] **Robustness**: what happens if the user gives an empty, inconsistent, or unexpected input?
  *Our answer:* every scenario goes through `sanitize()` in `src/lib/model.ts`: prices are clamped to €1.00–€3.50, budgets and lifetimes to sensible ranges, channel and marketing mixes are re-normalised to 100% (an all-zero mix falls back to equal shares), and `NaN` becomes the lower bound. Prices outside the survey's range use the curve's end values instead of extrapolating. A price where a channel loses money is flagged in the headline rather than hidden.
- [x] **Explainability**: can you explain to someone non-technical why your tool does what it does?
  *Our answer:* yes, and the page does it itself. Each panel names the exhibit it is built on, the headline states the four numbers that matter in one sentence, and the memo generator writes the recommendation in plain English with the reasoning behind each number. The mechanism is simple: the shelf price sets how many Germans accept it (survey) and how much LUMEN keeps per can (channel cuts and costs); a customer who accepts costs less to acquire than one who has to be convinced, so price drives both margin and payback.
- [x] **Business relevance**: does your prototype actually answer the problem posed in the brief, or is it an interesting technical build that's off-target?
  *Our answer:* it answers Freya's four questions directly: price (€2.19), positioning (accessible premium, entry of the VoltFit band), channels (DTC and gym first, grocery second), timing (May, Berlin and Munich first), and it states what we deliberately give up (student volume, a boutique price, national grocery in year one). The CMO/CFO tension is not resolved by picking a side; the trade-off chart shows where it actually bites.

These questions aren't here to slow you down — they're part of what's being evaluated. A thoughtful answer to one of them is worth more than an extra feature nobody asked for.

## What We Expect at the End

- A prototype that works, even partially, on the LUMEN case
- Your prompt log (`prompts/<your-id>/session-*.md`) committed and up to date
- A short paragraph below, written in business language (not technical), explaining what you did and why
- A live URL (Vercel or similar) if you deployed it — not required to still get credit, but expected if you did

## Our Approach

**Live demo:** https://lumen-germany-launch-cockpit.vercel.app

**What we built.** A "Germany Launch Cockpit": one page where Freya can move the shelf price, the sales-channel mix and the marketing mix, and immediately see what it does to price acceptance, margin per can, customer acquisition cost, payback time and the year-one result. Three preset buttons load the CMO's scenario, the CFO's scenario and our recommendation, and a comparison table puts them side by side. A sensitivity panel shows how far the year-one result moves when each uncertain input is wrong, a calibration panel proves the model reproduces the 30% home-market gross margin and the Exhibit 11 figures before it is trusted on Germany, a phased roadmap gives the CFO a gate at each step, and a memo generator turns whichever scenario is on screen into a one-page note. "Share scenario" copies a link that opens exactly what you see, so teammates argue about the same numbers.

**What we found.** The CMO and the CFO are less far apart than the Slack thread suggests. Between roughly €1.70 and €2.30 the months needed to pay back a customer barely move: a higher price earns more per can but fewer people accept it, and the two effects cancel out. Above €2.50 the acceptance cliff wins and payback runs away. So the CFO gives up almost nothing by letting the brand price at the top of that plateau, and the CMO cannot credibly ask for more than that without a Root & Rise budget. Our recommendation: launch at €2.19, positioned as accessible premium at the entry of the VoltFit band, through direct-to-consumer and gyms first (grocery keeps 43% of the shelf price and is where you go for volume once the brand is known), in Berlin and Munich, in May when German demand starts to climb and no competitor promotion lands. What we deliberately do not optimise for: the student segment, which is the largest group in the survey but almost entirely lost at this price; a boutique price point; and national grocery coverage in year one.

**How we handled the data.** No German sales exist, so Germany is estimated only from what was collected in Germany (the two surveys, competitor prices, market size) while home-market data supplies what should transfer: cost structure, channel cuts, the shape of seasonality (which matches the German index month for month) and marketing efficiency. We removed 4 duplicate sales rows, flagged one anomalous week rather than deleting it, dropped the name and email columns before any aggregation, and re-derived the case's acceptance figures from the raw survey to check them (the €2.19 figure matches exactly).

**How we worked with AI.** The first version of the prototype was built in one session with Claude Code (Anthropic's coding agent), applying the logging rules of `AGENTS.md` by hand: every prompt of that session is recorded verbatim in `prompts/e263197/`, all work went through a branch and a pull request, and the AI never saw or handled a key or a personal record. From that base the team iterates in Codex, each member under their own student ID, so the `prompts/` folder shows who asked for what. We chose the case, the angle, the recommendation and the data-handling rules; the agents did the analysis and the build under those instructions. The model has automated tests (`npm test`) that pin the reproduced Exhibit 11 figures, the 30% home margin, the payback plateau, and the absence of personal data in the built site.

**Where it stops.** Acceptance comes from a stated-preference survey, not from real German purchases; the CAC link to price is a modelling assumption (home-market CAC scaled by acceptance) that a real launch test should replace; and city-level intent rests on as few as 32 respondents. The cockpit is for deciding what to test first, not for forecasting year one.
