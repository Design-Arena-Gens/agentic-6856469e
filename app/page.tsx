'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { indexTemplates, type IndexTemplate } from '@/lib/index-data';
import {
  buildScenario,
  type RiskAppetite,
  type ScenarioResult,
  type ScenarioInput
} from '@/lib/modeling';

type FormState = {
  template: IndexTemplate;
  indexLevel: number;
  annualVolatility: number;
  macroMomentum: number;
  riskAppetite: RiskAppetite;
};

const riskLabels: Record<RiskAppetite, string> = {
  defensive: 'Defensive',
  neutral: 'Neutral',
  aggressive: 'Aggressive'
};

const formatLevel = (value: number) =>
  value >= 1000 ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : value.toFixed(2);

const meterColor = (value: number) => {
  if (value > 0.06) return 'text-emerald-400';
  if (value > 0) return 'text-sky-300';
  if (value > -0.04) return 'text-amber-300';
  return 'text-rose-400';
};

const Panel = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-smart backdrop-blur-xl">
    <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300">{title}</h2>
    <div className="mt-4 text-sm text-slate-200">{children}</div>
  </div>
);

export default function Page() {
  const [form, setForm] = useState<FormState>(() => {
    const template = indexTemplates[0];
    return {
      template,
      indexLevel: template.baselineLevel,
      annualVolatility: template.annualVolatility,
      macroMomentum: template.macroMomentum,
      riskAppetite: 'neutral'
    };
  });

  const [scenario, setScenario] = useState<ScenarioResult>(() =>
    buildScenario({
      indexLevel: indexTemplates[0].baselineLevel,
      annualVolatility: indexTemplates[0].annualVolatility,
      macroMomentum: indexTemplates[0].macroMomentum,
      riskAppetite: 'neutral'
    })
  );

  useEffect(() => {
    const input: ScenarioInput = {
      indexLevel: form.indexLevel,
      annualVolatility: form.annualVolatility,
      macroMomentum: form.macroMomentum,
      riskAppetite: form.riskAppetite
    };
    setScenario(buildScenario(input));
  }, [form]);

  const pathPoints = useMemo(() => {
    const points = scenario.futuresTargets.map((target, idx) => {
      const x = idx / (scenario.futuresTargets.length - 1 || 1);
      return { x, y: target.target };
    });
    return [{ x: 0, y: form.indexLevel }, ...points];
  }, [scenario, form.indexLevel]);

  const yBounds = useMemo(() => {
    const values = pathPoints.map((point) => point.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      min: min * 0.98,
      max: max * 1.02
    };
  }, [pathPoints]);

  const polylinePath = useMemo(() => {
    const { min, max } = yBounds;
    const range = max - min || 1;
    const toSvg = (point: (typeof pathPoints)[number]) => {
      const x = point.x * 100;
      const y = 100 - ((point.y - min) / range) * 100;
      return `${x},${y}`;
    };
    return pathPoints.map(toSvg).join(' ');
  }, [pathPoints, yBounds]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 p-6 md:p-12">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-smart backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-sky-400">Index Intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
            Index Targets &amp; Option Guesses
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200">
            Upload an index context, align risk appetite, and get instant price targets, option
            strike ideas, and futures curve projections powered by a probabilistic regime model.
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 text-right text-xs text-slate-300">
          <p className="font-mono uppercase tracking-widest text-slate-400">Model Runtime</p>
          <p className="mt-2 text-base font-semibold text-white">
            {form.template.symbol}
            <span className="ml-2 text-sm text-slate-400">template</span>
          </p>
          <p className="mt-1 text-slate-400">{form.template.notes}</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Index Setup">
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                Index Template
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white outline-none focus:border-sky-400"
                  value={form.template.symbol}
                  onChange={(event) => {
                    const template =
                      indexTemplates.find((item) => item.symbol === event.target.value) ??
                      indexTemplates[0];
                    setForm((prev) => ({
                      ...prev,
                      template,
                      indexLevel: template.baselineLevel,
                      annualVolatility: template.annualVolatility,
                      macroMomentum: template.macroMomentum
                    }));
                  }}
                >
                  {indexTemplates.map((template) => (
                    <option key={template.symbol} value={template.symbol}>
                      {template.symbol} · {template.name} · {template.region}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  Spot Level
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white outline-none focus:border-sky-400"
                    value={form.indexLevel}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        indexLevel: Number(event.target.value || prev.indexLevel)
                      }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  Annual Volatility
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={Math.round(form.annualVolatility * 100)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        annualVolatility: Number(event.target.value) / 100
                      }))
                    }
                    className="accent-sky-400"
                  />
                  <span className="text-right text-[11px] tracking-[0.2em] text-slate-300">
                    {(form.annualVolatility * 100).toFixed(1)}%
                  </span>
                </label>
              </div>

              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                Macro Momentum Tilt
                <input
                  type="range"
                  min={-15}
                  max={20}
                  value={Math.round(form.macroMomentum * 100)}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      macroMomentum: Number(event.target.value) / 100
                    }))
                  }
                  className="accent-amber-400"
                />
                <span className="text-right text-[11px] tracking-[0.2em] text-slate-300">
                  {(form.macroMomentum * 100).toFixed(1)}%
                </span>
              </label>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Risk Appetite
                </p>
                <div className="mt-3 flex gap-2">
                  {(['defensive', 'neutral', 'aggressive'] as RiskAppetite[]).map((risk) => (
                    <button
                      key={risk}
                      type="button"
                      className={clsx(
                        'flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition',
                        form.riskAppetite === risk
                          ? 'border-sky-400 bg-sky-400/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30'
                      )}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          riskAppetite: risk
                        }))
                      }
                    >
                      {riskLabels[risk]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Volatility Signature">
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">30D Implied</p>
                  <p className="mt-1 text-3xl font-semibold text-white">
                    {formatLevel(scenario.thirtyDayMove)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Annual Drift</p>
                  <p className={clsx('mt-1 text-xl font-semibold', meterColor(scenario.annualizedDrift))}>
                    {(scenario.annualizedDrift * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <p>Support Cushion · {formatLevel(form.indexLevel - scenario.downsidePotential)}</p>
                <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-400/80"
                    style={{
                      width: `${Math.min(95, (scenario.downsidePotential / scenario.thirtyDayMove) * 42 + 30)}%`
                    }}
                  />
                </div>
                <p>Breakout Energy · {formatLevel(form.indexLevel + scenario.upsidePotential)}</p>
                <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 bg-sky-400/80"
                    style={{
                      width: `${Math.min(95, (scenario.upsidePotential / scenario.thirtyDayMove) * 42 + 30)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Futures Targets">
            <div className="grid gap-6 md:grid-cols-2">
              <svg viewBox="0 0 100 100" className="col-span-2 h-40 w-full">
                <defs>
                  <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1b7cff" />
                    <stop offset="100%" stopColor="#ff9f43" />
                  </linearGradient>
                  <linearGradient id="gradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(27,124,255,0.55)" />
                    <stop offset="100%" stopColor="rgba(27,124,255,0)" />
                  </linearGradient>
                </defs>
                <polyline
                  points={polylinePath}
                  fill="url(#gradientFill)"
                  stroke="url(#gradientLine)"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              </svg>
              {scenario.futuresTargets.map((target) => (
                <motion.div
                  key={target.tenor}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{target.tenor}</p>
                    <span className="text-[11px] uppercase tracking-[0.26em] text-slate-300">
                      {(target.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatLevel(target.target)}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">{target.narrative}</p>
                </motion.div>
              ))}
            </div>
          </Panel>

          <Panel title="Option Guesses">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Call Target</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {formatLevel(scenario.callTarget)}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  {riskLabels[form.riskAppetite]} bias pushes convexity toward{' '}
                  {scenario.callTarget > form.indexLevel ? 'upside' : 'mean reversion'}.
                </p>
              </div>
              <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Put Target</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {formatLevel(scenario.putTarget)}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  Incorporate this anchor for downside hedges and collars around portfolio beta.
                </p>
              </div>
              <div className="col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gamma Overlay</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {(scenario.annualizedDrift * 100 + form.annualVolatility * 50).toFixed(1)}%
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  Synthetic gauge of convexity demand relative to realized regime.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <AnimatePresence>
                {scenario.optionSuggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.label}
                    className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4"
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {suggestion.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{suggestion.rationale}</p>
                    <div className="mt-4 grid gap-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                      <p>
                        Call strike · <span className="text-white">{formatLevel(suggestion.callStrike)}</span>
                      </p>
                      <p>
                        Put strike · <span className="text-white">{formatLevel(suggestion.putStrike)}</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Panel>

          <Panel title="Technical Anchors">
            <div className="grid gap-4 md:grid-cols-3">
              {scenario.technicalLevels.map((level) => (
                <div
                  key={level.label}
                  className={clsx(
                    'rounded-2xl border px-4 py-5 text-xs uppercase tracking-[0.3em]',
                    level.type === 'support'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                  )}
                >
                  <p>{level.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {formatLevel(level.level)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
