'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';

// ─── Mock signal data ────────────────────────────────────────────────────────
const MOCK_SIGNALS = [
  {
    id: 1,
    symbol: 'Volatility 75 (1s)',
    type: 'BUY' as const,
    entry: '1.2345',
    confidence: 94,
    payout: '+8.2%',
    time: '2s ago',
    status: 'live' as const,
  },
  {
    id: 2,
    symbol: 'EUR/USD',
    type: 'SELL' as const,
    entry: '1.0872',
    confidence: 87,
    payout: '+6.1%',
    time: '14s ago',
    status: 'live' as const,
  },
  {
    id: 3,
    symbol: 'Volatility 50 (1s)',
    type: 'BUY' as const,
    entry: '0.9811',
    confidence: 91,
    payout: '+7.5%',
    time: '38s ago',
    status: 'completed' as const,
  },
  {
    id: 4,
    symbol: 'GBP/USD',
    type: 'BUY' as const,
    entry: '1.2654',
    confidence: 78,
    payout: '+5.3%',
    time: '1m ago',
    status: 'completed' as const,
  },
  {
    id: 5,
    symbol: 'Volatility 25 (1s)',
    type: 'SELL' as const,
    entry: '0.4432',
    confidence: 83,
    payout: '+6.8%',
    time: '2m ago',
    status: 'completed' as const,
  },
];

const STATS = [
  { label: 'Win Rate', value: '89.4%', sub: 'Last 30 days' },
  { label: 'Signals Today', value: '147', sub: '+12 vs yesterday' },
  { label: 'Avg. Payout', value: '7.2%', sub: 'Per signal' },
  { label: 'Active Bots', value: '3', sub: 'Running now' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SignalBadge({ type }: { type: 'BUY' | 'SELL' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
        type === 'BUY'
          ? 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30'
          : 'bg-red-500/15 text-red-500 ring-1 ring-red-500/30'
      }`}
    >
      {type === 'BUY' ? '▲' : '▼'} {type}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 90 ? 'bg-emerald-500' : value >= 80 ? 'bg-cyan-400' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-white/60">{value}%</span>
    </div>
  );
}

function SignalRow({ signal }: { signal: (typeof MOCK_SIGNALS)[number] }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
        signal.status === 'live'
          ? 'border-cyan-400/40 bg-cyan-400/5 shadow-[0_0_12px_rgba(0,255,255,0.06)]'
          : 'border-white/[0.07] bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {signal.status === 'live' && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
        )}
        {signal.status === 'completed' && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-white/20" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{signal.symbol}</p>
          <p className="text-xs text-white/40">{signal.time}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <SignalBadge type={signal.type} />
        <ConfidenceBar value={signal.confidence} />
        <span className="text-sm font-bold text-emerald-400 w-14 text-right">
          {signal.payout}
        </span>
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 flex flex-col gap-1 hover:border-cyan-400/30 transition-colors">
      <p className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
      <p className="text-sm font-medium text-white/70">{stat.label}</p>
      <p className="text-xs text-white/40">{stat.sub}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignalBotPage() {
  const router = useRouter();
  const { auth } = useDerivWSContext();
  const [filter, setFilter] = useState<'all' | 'live' | 'completed'>('all');

  // Redirect authenticated users straight to the bot dashboard
  useEffect(() => {
    if (auth.authState === 'authenticated') {
      router.replace('/bot');
    }
  }, [auth.authState, router]);

  const filtered =
    filter === 'all' ? MOCK_SIGNALS : MOCK_SIGNALS.filter((s) => s.status === filter);

  return (
    <div className="min-h-screen bg-[#0d0f16] text-white flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0d0f16]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cyan-400" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-4 4 4 4-6" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Signal<span className="text-cyan-400">Bot</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <a href="#signals" className="hover:text-white transition-colors">Signals</a>
          <a href="#stats" className="hover:text-white transition-colors">Stats</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/trade"
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-[#0d0f16] hover:bg-cyan-300 transition-colors"
          >
            Open Trader
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-cyan-400/[0.07] blur-3xl" />
          <div className="absolute top-40 right-0 h-72 w-72 rounded-full bg-purple-500/[0.05] blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 text-xs font-medium text-cyan-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
            </span>
            AI-powered · Real-time signals · Deriv integration
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            Trade smarter with{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI signals
            </span>
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Automated signal generation for Deriv accumulators and more. The bot analyzes the market 24/7 and alerts you to high-probability entries in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/trade"
              className="w-full sm:w-auto rounded-xl bg-cyan-400 px-7 py-3.5 text-base font-bold text-[#0d0f16] hover:bg-cyan-300 transition-colors shadow-[0_0_24px_rgba(0,255,255,0.25)]"
            >
              Start Trading →
            </Link>
            <a
              href="#signals"
              className="w-full sm:w-auto rounded-xl border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 text-base font-medium text-white/80 hover:bg-white/[0.08] transition-colors"
            >
              View Live Signals
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="px-6 pb-12 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <StatCard key={s.label} stat={s} />
          ))}
        </div>
      </section>

      {/* ── Live Signals ── */}
      <section id="signals" className="px-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Live Signals</h2>
            <p className="text-sm text-white/40 mt-0.5">Updated every few seconds by the AI engine</p>
          </div>

          {/* Filter tabs */}
          <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.04] p-1 gap-1 text-xs font-medium">
            {(['all', 'live', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                  filter === tab
                    ? 'bg-cyan-400 text-[#0d0f16] font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-bold text-white mb-6">Why Signal Bot?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: '⚡',
              title: 'Real-time AI analysis',
              desc: 'The engine scans tick-by-tick data and generates signals with confidence scores in milliseconds.',
            },
            {
              icon: '🤖',
              title: 'Fully automated',
              desc: 'Connect your Deriv account, set your stake, and let the bot handle entries and exits.',
            },
            {
              icon: '📊',
              title: 'Transparent reporting',
              desc: 'Every signal is logged. Review your win rate, payout history and drawdowns at any time.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-cyan-400/30 transition-colors"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 text-base font-bold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-10 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/5 to-transparent" />
          </div>
          <h2 className="relative text-3xl font-extrabold text-white mb-3">Ready to start?</h2>
          <p className="relative text-white/50 mb-7 max-w-md mx-auto">
            Open the trading terminal, connect your Deriv account and let the bot do the rest.
          </p>
          <Link
            href="/trade"
            className="relative inline-flex rounded-xl bg-cyan-400 px-8 py-3.5 text-base font-bold text-[#0d0f16] hover:bg-cyan-300 transition-colors shadow-[0_0_32px_rgba(0,255,255,0.3)]"
          >
            Open Trader →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-white/[0.06] py-6 px-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} SignalBot · Powered by Deriv API · Trading involves risk.
      </footer>
    </div>
  );
}
