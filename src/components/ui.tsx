"use client";
import type { ReactNode } from "react";

export function Card({ title, subtitle, children, className = "" }: { title?: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-card border border-line rounded-xl p-4 sm:p-5 ${className}`}>
      {title && (
        <header className="mb-3">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ink-2 mt-0.5">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "warn" | "bad" }) {
  const dot = tone === "good" ? "bg-[var(--good)]" : tone === "warn" ? "bg-[var(--warn)]" : tone === "bad" ? "bg-[var(--bad)]" : "";
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className="text-2xl font-semibold num leading-tight flex items-center gap-2">
        {dot && <span className={`inline-block w-2 h-2 rounded-full ${dot}`} aria-hidden />}
        <span>{value}</span>
      </div>
      {hint && <div className="text-xs text-ink-2 mt-0.5">{hint}</div>}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-2">{label}</span>
        <span className="num font-medium">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </label>
  );
}

export function MixSliders<K extends string>({ label, mix, colors, onChange, hint }: { label: string; mix: Record<K, number>; colors?: Partial<Record<K, string>>; onChange: (m: Record<K, number>) => void; hint?: string }) {
  const keys = Object.keys(mix) as K[];
  const sum = keys.reduce((a, k) => a + mix[k], 0) || 1;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-2">{label}</span>
        {hint && <span className="text-ink-3">{hint}</span>}
      </div>
      <div className="flex h-2 rounded overflow-hidden gap-[2px] mb-2" aria-hidden>
        {keys.map((k) => (
          <div key={k} style={{ width: `${(mix[k] / sum) * 100}%`, background: colors?.[k] ?? "var(--ink-3)" }} />
        ))}
      </div>
      <div className="space-y-1">
        {keys.map((k) => (
          <label key={k} className="block text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: colors?.[k] ?? "var(--ink-3)" }} aria-hidden />
              <span>{k}</span>
              <span className="num ml-auto">{Math.round((mix[k] / sum) * 100)}%</span>
            </span>
            <input type="range" min={0} max={100} step={5} value={Math.round((mix[k] / sum) * 100)} onChange={(e) => onChange({ ...mix, [k]: Number(e.target.value) / 100 })} aria-label={`${label}: ${k}`} className="mt-0.5" />
          </label>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2 mt-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function Warn({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-xs text-ink-2">
      <span aria-hidden className="text-[var(--warn)]">▲</span>
      <span>{children}</span>
    </li>
  );
}
