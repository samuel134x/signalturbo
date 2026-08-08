'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useDigitTrading } from '@/hooks/use-digit-trading';
import type { DigitSignal, SignalCategory } from '@/hooks/use-digit-trading';
import { cn } from '@/lib/utils';

// ─── Category config ─────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<SignalCategory, { label: string; bg: string; text: string; dot: string }> = {
  mini_profit:  { label: 'Mini Lucro',    bg: 'bg-white/10',      text: 'text-white/70',  dot: 'bg-white/60' },
  small_profit: { label: 'Lucro Pequeno', bg: 'bg-blue-600',      text: 'text-white',     dot: 'bg-blue-300' },
  good_profit:  { label: 'Lucro Bom',     bg: 'bg-emerald-600',   text: 'text-white',     dot: 'bg-emerald-300' },
  big_profit:   { label: 'Lucro Grande',  bg: 'bg-yellow-500',    text: 'text-black',     dot: 'bg-yellow-200' },
  high_risk:    { label: 'Alto Risco',    bg: 'bg-red-600',       text: 'text-white',     dot: 'bg-red-300' },
};

// ─── Signal Card ─────────────────────────────────────────────────────────────
function SignalCard({ signal, index, onSelect }: { signal: DigitSignal; index: number; onSelect: () => void }) {
  const cat = CATEGORY_CONFIG[signal.category];
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col gap-1 rounded-xl p-3 text-left transition-all border',
        signal.isSelected
          ? 'border-blue-400 bg-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.4)]'
          : signal.category === 'good_profit' || signal.category === 'big_profit'
          ? 'border-emerald-500/40 bg-emerald-600/90 hover:bg-emerald-500'
          : signal.category === 'high_risk'
          ? 'border-red-500/40 bg-red-600/80 hover:bg-red-500'
          : 'border-white/10 bg-white/[0.06] hover:bg-white/[0.10]'
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium', signal.isSelected ? 'text-blue-200' : 'text-white/60')}>
          {signal.symbolDisplay}
        </span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', cat.bg, cat.text)}>
          {cat.label}
        </span>
      </div>
      <span className="text-sm font-bold text-white">{signal.contractTypeDisplay}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <div className="h-1 flex-1 rounded-full bg-black/20 overflow-hidden">
          <div className="h-full rounded-full bg-white/70" style={{ width: `${signal.confidence}%` }} />
        </div>
        <span className="text-[11px] font-medium text-white/80">{signal.confidence}%</span>
      </div>
      {signal.isSelected && (
        <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-cyan-400 ring-2 ring-[#0d0f16]" />
      )}
    </button>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, color = 'bg-cyan-400' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? color : 'bg-white/20')}
    >
      <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  );
}

// ─── Number stepper ───────────────────────────────────────────────────────────
function NumberStepper({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const num = parseFloat(value) || 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-white/40 uppercase tracking-wide">{label}</span>
      <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.05] overflow-hidden">
        <button onClick={() => onChange(String(Math.max(0, num - 0.01).toFixed(2)))}
          className="px-1.5 py-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm">−</button>
        <span className="flex-1 text-center text-xs font-bold text-white py-1">{value}</span>
        <button onClick={() => onChange(String((num + 0.01).toFixed(2)))}
          className="px-1.5 py-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm">+</button>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function BotHeader({ accountDisplay, onLogout }: { accountDisplay: string; onLogout: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-[#0d0f16]/90 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cyan-400" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-4 4 4 4-6" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">Signal<span className="text-cyan-400">Bot</span></span>
        </Link>
        <span className="hidden sm:inline text-xs text-white/30">|</span>
        <span className="hidden sm:inline text-xs text-white/50">Painel do Bot</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/50 hidden sm:inline">{accountDisplay}</span>
        <button onClick={onLogout}
          className="text-xs rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-red-400 hover:bg-red-500/20 transition-colors">
          Sair
        </button>
      </div>
    </header>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
type LeftTab = 'historico' | 'log' | 'ia_status';

function LeftPanel({
  activeTab, setActiveTab, tradeLog, logMessages, stats, isBotActive,
}: {
  activeTab: LeftTab;
  setActiveTab: (t: LeftTab) => void;
  tradeLog: ReturnType<typeof useDigitTrading>['tradeLog'];
  logMessages: string[];
  stats: ReturnType<typeof useDigitTrading>['stats'];
  isBotActive: boolean;
}) {
  const tabs: { id: LeftTab; label: string }[] = [
    { id: 'historico', label: 'HISTÓRICO' },
    { id: 'log', label: 'LOG' },
    { id: 'ia_status', label: 'IA STATUS' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] shrink-0">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn('flex-1 py-2.5 text-xs font-bold tracking-wide transition-colors',
              activeTab === t.id
                ? 'text-purple-400 border-b-2 border-purple-400 -mb-px'
                : 'text-white/40 hover:text-white/70')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
        {activeTab === 'historico' && (
          tradeLog.length === 0
            ? <p className="text-xs text-white/30 text-center mt-8">Nenhuma operação ainda.</p>
            : tradeLog.map((t) => (
              <div key={t.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className={cn('font-bold', t.result === 'win' ? 'text-emerald-400' : t.result === 'loss' ? 'text-red-400' : 'text-yellow-400')}>
                    {t.result === 'win' ? 'Ganho' : t.result === 'loss' ? 'Perda' : 'Pendente'}
                  </span>
                  <span className="text-white/40">{new Date(t.timestamp).toLocaleString('pt-BR')}</span>
                </div>
                <div className="font-semibold text-white">{t.symbolDisplay}</div>
                <div className="flex justify-between">
                  <span className="text-white/50">{t.contractType}</span>
                  <span className={cn('font-bold', t.profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)} {t.currency}
                  </span>
                </div>
                {t.longcode && <p className="text-white/30 text-[10px] leading-relaxed">{t.longcode}</p>}
              </div>
            ))
        )}

        {activeTab === 'log' && (
          logMessages.length === 0
            ? <p className="text-xs text-white/30 text-center mt-8">Nenhum log.</p>
            : logMessages.map((msg, i) => (
              <p key={i} className="text-[11px] text-white/60 font-mono leading-relaxed border-b border-white/[0.04] pb-1">{msg}</p>
            ))
        )}

        {activeTab === 'ia_status' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
              <span className="text-sm font-semibold text-emerald-400">Sistema IA {isBotActive ? 'Ativo' : 'Em espera'}</span>
            </div>
            {[
              { label: 'Total de trades', value: stats.totalTrades },
              { label: 'Vitórias', value: stats.wins },
              { label: 'Derrotas', value: stats.losses },
              { label: 'Taxa de acerto', value: stats.totalTrades ? `${((stats.wins / stats.totalTrades) * 100).toFixed(1)}%` : '—' },
              { label: 'Lucro da sessão', value: `${stats.sessionProfit >= 0 ? '+' : ''}${stats.sessionProfit.toFixed(2)}` },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
                <span className="text-xs text-white/50">{r.label}</span>
                <span className="text-sm font-bold text-white">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────
type RightTab = 'digitos' | 'configuracoes';

function RightPanel({
  signals, selectedSignal, selectSignal,
  stake, setStake,
  stopLoss, setStopLoss,
  sessionLossLimit, setSessionLossLimit,
  martingaleFactor, setMartingaleFactor,
  martingaleEnabled, setMartingaleEnabled,
  autoTradeEnabled, setAutoTradeEnabled,
  soundEnabled, setSoundEnabled,
  isBotActive, activateBot, deactivateBot,
  isBuying, buyManual,
  buyError,
  refreshSignals,
}: {
  signals: DigitSignal[];
  selectedSignal: DigitSignal | null;
  selectSignal: (i: number) => void;
  stake: string; setStake: (v: string) => void;
  stopLoss: string; setStopLoss: (v: string) => void;
  sessionLossLimit: string; setSessionLossLimit: (v: string) => void;
  martingaleFactor: string; setMartingaleFactor: (v: string) => void;
  martingaleEnabled: boolean; setMartingaleEnabled: (v: boolean) => void;
  autoTradeEnabled: boolean; setAutoTradeEnabled: (v: boolean) => void;
  soundEnabled: boolean; setSoundEnabled: (v: boolean) => void;
  isBotActive: boolean; activateBot: () => void; deactivateBot: () => void;
  isBuying: boolean; buyManual: () => Promise<void>;
  buyError: string | null;
  refreshSignals: () => void;
}) {
  const [tab, setTab] = useState<RightTab>('digitos');
  const tabs: { id: RightTab; label: string }[] = [
    { id: 'digitos', label: 'DÍGITOS' },
    { id: 'configuracoes', label: 'CONFIGURAÇÕES' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] shrink-0">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-6 py-2.5 text-xs font-bold tracking-wide transition-colors',
              tab === t.id
                ? 'text-purple-400 border-b-2 border-purple-400 -mb-px'
                : 'text-white/40 hover:text-white/70')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Signals grid */}
      {tab === 'digitos' && (
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
          {/* Category legend */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
            <span className="text-xs text-white/50 font-medium">📊 Categorias de Sinais</span>
            {(Object.entries(CATEGORY_CONFIG) as [SignalCategory, typeof CATEGORY_CONFIG[SignalCategory]][]).map(([, v]) => (
              <span key={v.label} className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', v.bg, v.text)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
                {v.label}
              </span>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 flex-1">
            {signals.map((sig, i) => (
              <SignalCard key={i} signal={sig} index={i} onSelect={() => selectSignal(i)} />
            ))}
          </div>

          <div className="px-4 pb-2 flex justify-end">
            <button onClick={refreshSignals} className="text-xs text-white/40 hover:text-cyan-400 transition-colors">
              ↻ Atualizar sinais
            </button>
          </div>
        </div>
      )}

      {/* Settings */}
      {tab === 'configuracoes' && (
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Gerenciamento de risco</h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberStepper label="Stop Loss ($)" value={stopLoss.replace('$','')} onChange={(v) => setStopLoss(`$${v}`)} />
              <NumberStepper label="Perda por sessão ($)" value={sessionLossLimit.replace('$','')} onChange={(v) => setSessionLossLimit(`$${v}`)} />
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Martingale</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Ativar Martingale</span>
              <Toggle checked={martingaleEnabled} onChange={setMartingaleEnabled} />
            </div>
            {martingaleEnabled && (
              <NumberStepper label="Fator" value={martingaleFactor.replace('x','')} onChange={(v) => setMartingaleFactor(`${v}x`)} />
            )}
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Preferências</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Som ao operar</span>
              <Toggle checked={soundEnabled} onChange={setSoundEnabled} color="bg-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls bar */}
      <div className="shrink-0 border-t border-white/[0.08] bg-[#0d0f16] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Stake */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Entrada</span>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.05] overflow-hidden">
              <button onClick={() => setStake(String(Math.max(0.01, parseFloat(stake||'0') - 0.01).toFixed(2)))}
                className="px-2 py-1 text-white/50 hover:text-white text-sm">−</button>
              <span className="px-2 text-xs font-bold text-cyan-400 min-w-[50px] text-center">${stake}</span>
              <button onClick={() => setStake(String((parseFloat(stake||'0') + 0.01).toFixed(2)))}
                className="px-2 py-1 text-white/50 hover:text-white text-sm">+</button>
            </div>
          </div>

          {/* Stop Loss display */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Lim. Perda</span>
            <span className="text-xs font-bold text-red-400 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.05]">{stopLoss}</span>
          </div>

          {/* Perda sessão */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Perda Sessão</span>
            <span className="text-xs font-bold text-red-400 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.05]">{sessionLossLimit}</span>
          </div>

          {/* Auto Trade */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Auto Trade</span>
            <Toggle checked={autoTradeEnabled} onChange={setAutoTradeEnabled} />
          </div>

          {/* Martingale */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Martingale</span>
            <Toggle checked={martingaleEnabled} onChange={setMartingaleEnabled} color="bg-purple-500" />
          </div>

          {/* Sound */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Som</span>
            <Toggle checked={soundEnabled} onChange={setSoundEnabled} color="bg-purple-500" />
          </div>

          {/* Fator display */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 uppercase">Fator</span>
            <span className="text-xs font-bold text-white/70 px-2 py-1 rounded-lg border border-white/10 bg-white/[0.05]">{martingaleFactor}</span>
          </div>

          {/* Manual buy */}
          <button onClick={buyManual} disabled={isBuying}
            className="ml-auto rounded-xl bg-yellow-400 px-4 py-2 text-xs font-extrabold text-black hover:bg-yellow-300 disabled:opacity-50 transition-colors">
            {isBuying ? '...' : 'MULTIPLICAR'}
          </button>

          {/* Activate bot */}
          {isBotActive ? (
            <button onClick={deactivateBot}
              className="rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors">
              PARAR BOT
            </button>
          ) : (
            <button onClick={activateBot}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-extrabold text-[#0d0f16] hover:bg-cyan-300 transition-colors shadow-[0_0_12px_rgba(0,255,255,0.3)]">
              ATIVAR BOT
            </button>
          )}
        </div>

        {buyError && (
          <p className="mt-2 text-xs text-red-400">Erro: {buyError}</p>
        )}

        {/* Status bar */}
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/[0.05]">
          <span className="flex items-center gap-1.5 text-[10px] text-white/50">
            <span className={cn('h-1.5 w-1.5 rounded-full', isBotActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20')} />
            {isBotActive ? 'IA ATIVA' : 'IA INATIVA'}
          </span>
          {selectedSignal && (
            <span className="text-[10px] text-white/40">
              Sinal: {selectedSignal.symbolDisplay} · {selectedSignal.contractTypeDisplay} · {selectedSignal.confidence}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BotPage() {
  const router = useRouter();
  const { ws, isConnected, auth } = useDerivWSContext();
  const { authState, activeAccount, accounts, logout } = auth;
  const [leftTab, setLeftTab] = useState<LeftTab>('historico');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (authState === 'unauthenticated' || authState === 'error') {
      router.replace('/');
    }
  }, [authState, router]);

  const currency = activeAccount?.currency ?? 'USD';
  const accountDisplay = activeAccount
    ? `${activeAccount.account_type === 'demo' ? 'Demo' : 'Real'} · ${parseFloat(activeAccount.balance).toFixed(2)} ${activeAccount.currency}`
    : '';

  const trading = useDigitTrading({
    ws,
    isConnected,
    isAuthenticated: authState === 'authenticated',
    currency,
  });

  if (authState === 'authenticating' || authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#0d0f16] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-[#0d0f16] text-white flex flex-col overflow-hidden">
      <BotHeader accountDisplay={accountDisplay} onLogout={logout} />

      {/* Main layout: left sidebar + right panel */}
      <div className="flex flex-1 min-h-0 divide-x divide-white/[0.07]">
        {/* Left: history/log/status */}
        <div className="w-72 shrink-0 flex flex-col min-h-0 hidden lg:flex">
          <LeftPanel
            activeTab={leftTab}
            setActiveTab={setLeftTab}
            tradeLog={trading.tradeLog}
            logMessages={trading.logMessages}
            stats={trading.stats}
            isBotActive={trading.isBotActive}
          />
        </div>

        {/* Right: signals + controls */}
        <div className="flex-1 flex flex-col min-h-0">
          <RightPanel
            signals={trading.signals}
            selectedSignal={trading.selectedSignal}
            selectSignal={trading.selectSignal}
            stake={trading.stake}
            setStake={trading.setStake}
            stopLoss={trading.stopLoss}
            setStopLoss={trading.setStopLoss}
            sessionLossLimit={trading.sessionLossLimit}
            setSessionLossLimit={trading.setSessionLossLimit}
            martingaleFactor={trading.martingaleFactor}
            setMartingaleFactor={trading.setMartingaleFactor}
            martingaleEnabled={trading.martingaleEnabled}
            setMartingaleEnabled={trading.setMartingaleEnabled}
            autoTradeEnabled={trading.autoTradeEnabled}
            setAutoTradeEnabled={trading.setAutoTradeEnabled}
            soundEnabled={trading.soundEnabled}
            setSoundEnabled={trading.setSoundEnabled}
            isBotActive={trading.isBotActive}
            activateBot={trading.activateBot}
            deactivateBot={trading.deactivateBot}
            isBuying={trading.isBuying}
            buyManual={trading.buyManual}
            buyError={trading.buyError}
            refreshSignals={trading.refreshSignals}
          />
        </div>
      </div>
    </div>
  );
}
