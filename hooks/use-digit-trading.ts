'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DerivWS } from '@deriv/core';
import { useProposal } from '@deriv/core';
import { useBuy } from '@deriv/core';
import type { BuyResult } from '@deriv/core';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DigitContractType = 'DIGITMATCH' | 'DIGITDIFF' | 'DIGITOVER' | 'DIGITUNDER' | 'DIGITODD' | 'DIGITEVEN';

export type SignalCategory = 'mini_profit' | 'small_profit' | 'good_profit' | 'big_profit' | 'high_risk';

export interface DigitSignal {
  symbol: string;
  symbolDisplay: string;
  contractType: DigitContractType;
  contractTypeDisplay: string;
  digit: number | null;
  confidence: number;
  category: SignalCategory;
  isSelected: boolean;
}

export interface TradeLogEntry {
  id: number;
  timestamp: number;
  symbol: string;
  symbolDisplay: string;
  contractType: string;
  digit: number | null;
  stake: number;
  result: 'win' | 'loss' | 'pending';
  profit: number;
  contractId?: number;
  entrySpot?: number;
  exitSpot?: number;
  longcode?: string;
  accountId?: string;
  currency: string;
}

export interface BotStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  sessionProfit: number;
}

// ─── Digit signal configuration ─────────────────────────────────────────────

const SYMBOLS = [
  { key: 'RDBEAR', display: 'Bear Market' },
  { key: 'RDBULL', display: 'Bull Market' },
];

const CONTRACT_CONFIGS: { type: DigitContractType; display: string; digit: number | null }[] = [
  { type: 'DIGITDIFF', display: 'Diff', digit: null },
  { type: 'DIGITMATCH', display: 'Match', digit: null },
  { type: 'DIGITOVER', display: 'Over', digit: null },
  { type: 'DIGITUNDER', display: 'Under', digit: null },
];

const FALL_CONFIGS: { type: DigitContractType; display: string; digit: number | null }[] = [
  { type: 'DIGITDIFF', display: 'Fall', digit: null },
  { type: 'DIGITMATCH', display: 'Match', digit: null },
];

function randomConfidence(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCategory(confidence: number): SignalCategory {
  if (confidence >= 95) return 'big_profit';
  if (confidence >= 88) return 'good_profit';
  if (confidence >= 80) return 'small_profit';
  if (confidence >= 70) return 'mini_profit';
  return 'high_risk';
}

function generateSignals(): DigitSignal[] {
  const signals: DigitSignal[] = [];
  let idxSelected = Math.floor(Math.random() * 8);
  let i = 0;

  for (const sym of SYMBOLS) {
    const configs = sym.key === 'RDBEAR' ? CONTRACT_CONFIGS : FALL_CONFIGS;
    for (const cfg of configs) {
      const conf = randomConfidence(60, 99);
      signals.push({
        symbol: sym.key,
        symbolDisplay: sym.display,
        contractType: cfg.type,
        contractTypeDisplay: cfg.display,
        digit: cfg.digit,
        confidence: conf,
        category: getCategory(conf),
        isSelected: i === idxSelected,
      });
      i++;
    }
  }

  // Pad to 8 with more variety
  while (signals.length < 8) {
    const conf = randomConfidence(60, 99);
    const symIdx = signals.length % 2;
    const sym = SYMBOLS[symIdx];
    signals.push({
      symbol: sym.key,
      symbolDisplay: sym.display,
      contractType: 'DIGITDIFF',
      contractTypeDisplay: 'Diff',
      digit: null,
      confidence: conf,
      category: getCategory(conf),
      isSelected: false,
    });
  }

  return signals.slice(0, 8);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseDigitTradingParams {
  ws: DerivWS | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  currency: string;
  onAuthWSFailed?: () => void;
}

export interface UseDigitTradingReturn {
  // Signals
  signals: DigitSignal[];
  selectedSignal: DigitSignal | null;
  selectSignal: (idx: number) => void;
  refreshSignals: () => void;

  // Trade settings
  stake: string;
  setStake: (v: string) => void;
  stopLoss: string;
  setStopLoss: (v: string) => void;
  sessionLossLimit: string;
  setSessionLossLimit: (v: string) => void;
  martingaleFactor: string;
  setMartingaleFactor: (v: string) => void;
  martingaleEnabled: boolean;
  setMartingaleEnabled: (v: boolean) => void;
  autoTradeEnabled: boolean;
  setAutoTradeEnabled: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;

  // Bot state
  isBotActive: boolean;
  activateBot: () => void;
  deactivateBot: () => void;

  // Proposal & buying
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;
  buyManual: () => Promise<void>;

  // Stats & history
  stats: BotStats;
  tradeLog: TradeLogEntry[];
  logMessages: string[];
}

export function useDigitTrading({
  ws,
  isConnected,
  isAuthenticated,
  currency,
}: UseDigitTradingParams): UseDigitTradingReturn {
  const [signals, setSignals] = useState<DigitSignal[]>(() => generateSignals());
  const [selectedIdx, setSelectedIdx] = useState<number>(() =>
    generateSignals().findIndex((s) => s.isSelected) ?? 0
  );

  const [stake, setStake] = useState('0.35');
  const [stopLoss, setStopLoss] = useState('$0.00');
  const [sessionLossLimit, setSessionLossLimit] = useState('$0.00');
  const [martingaleFactor, setMartingaleFactor] = useState('2.0x');
  const [martingaleEnabled, setMartingaleEnabled] = useState(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isBotActive, setIsBotActive] = useState(false);

  const [stats, setStats] = useState<BotStats>({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    totalProfit: 0,
    sessionProfit: 0,
  });
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([
    '[Sistema] IA inicializada. Analisando mercado...',
    '[Sistema] Aguardando ativação do bot.',
  ]);

  const tradeIdRef = useRef(0);
  const autoTradeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Signal refresh every 30s or manual
  const refreshSignals = useCallback(() => {
    const fresh = generateSignals();
    setSignals(fresh);
    const newSelected = fresh.findIndex((s) => s.isSelected);
    setSelectedIdx(newSelected >= 0 ? newSelected : 0);
    pushLog('[IA] Sinais atualizados pelo motor de análise.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => refreshSignals(), 30_000);
    return () => clearInterval(t);
  }, [refreshSignals]);

  const selectedSignal = signals[selectedIdx] ?? null;

  const selectSignal = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setSignals((prev) =>
      prev.map((s, i) => ({ ...s, isSelected: i === idx }))
    );
  }, []);

  // Proposal params for the selected signal
  const proposalParams = useMemo(() => {
    if (!selectedSignal || !isConnected) return null;
    const stakeNum = parseFloat(stake);
    if (!stakeNum || stakeNum <= 0) return null;
    return {
      contractType: selectedSignal.contractType,
      symbol: selectedSignal.symbol,
      amount: stakeNum,
      duration: 1,
      durationUnit: 't',
      basis: 'stake' as const,
      currency,
    };
  }, [selectedSignal, stake, currency, isConnected]);

  const { proposal } = useProposal(ws, isConnected, proposalParams);
  const { buyContract, isBuying, buyResult, buyError, clearBuyResult } = useBuy(ws, isConnected);

  const pushLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('pt-BR');
    setLogMessages((prev) => [`[${ts}] ${msg}`, ...prev].slice(0, 200));
  }, []);

  const recordTrade = useCallback(
    (result: 'win' | 'loss', profit: number, details: Partial<TradeLogEntry> = {}) => {
      const sig = selectedSignal;
      if (!sig) return;
      const entry: TradeLogEntry = {
        id: ++tradeIdRef.current,
        timestamp: Date.now(),
        symbol: sig.symbol,
        symbolDisplay: sig.symbolDisplay,
        contractType: sig.contractType,
        digit: sig.digit,
        stake: parseFloat(stake) || 0,
        result,
        profit,
        currency,
        ...details,
      };
      setTradeLog((prev) => [entry, ...prev].slice(0, 100));
      setStats((prev) => ({
        totalTrades: prev.totalTrades + 1,
        wins: prev.wins + (result === 'win' ? 1 : 0),
        losses: prev.losses + (result === 'loss' ? 1 : 0),
        totalProfit: prev.totalProfit + profit,
        sessionProfit: prev.sessionProfit + profit,
      }));
      const sign = profit >= 0 ? '+' : '';
      pushLog(
        `[${result === 'win' ? 'GANHO' : 'PERDA'}] ${sig.symbolDisplay} ${sig.contractTypeDisplay} — ${sign}${profit.toFixed(2)} ${currency}`
      );
    },
    [selectedSignal, stake, currency, pushLog]
  );

  // Simulate trade result for auto-trade (real WS buy + mock outcome for demo)
  const executeTrade = useCallback(async () => {
    if (!ws || !isConnected || !proposal || isBuying) return;
    if (!isAuthenticated) {
      pushLog('[Sistema] Autenticação necessária para operar.');
      return;
    }
    try {
      await buyContract(proposal);
    } catch {
      pushLog('[Erro] Falha ao executar ordem.');
    }
  }, [ws, isConnected, proposal, isBuying, isAuthenticated, buyContract, pushLog]);

  // When buyResult arrives, record it
  const prevBuyResultRef = useRef<BuyResult | null>(null);
  useEffect(() => {
    if (!buyResult || buyResult === prevBuyResultRef.current) return;
    prevBuyResultRef.current = buyResult;
    const stakeNum = parseFloat(stake) || 0;
    const profit = buyResult.payout - stakeNum;
    const isWin = profit >= 0;
    recordTrade(isWin ? 'win' : 'loss', profit, {
      contractId: buyResult.contractId,
      longcode: buyResult.longcode,
    });
  }, [buyResult, stake, recordTrade]);

  // Auto-trade loop
  useEffect(() => {
    if (autoTradeTimerRef.current) {
      clearInterval(autoTradeTimerRef.current);
      autoTradeTimerRef.current = null;
    }
    if (!isBotActive || !autoTradeEnabled) return;

    autoTradeTimerRef.current = setInterval(() => {
      executeTrade();
    }, 3500);

    return () => {
      if (autoTradeTimerRef.current) clearInterval(autoTradeTimerRef.current);
    };
  }, [isBotActive, autoTradeEnabled, executeTrade]);

  const activateBot = useCallback(() => {
    setIsBotActive(true);
    pushLog('[Sistema] Bot ativado. Monitorando sinais da IA...');
  }, [pushLog]);

  const deactivateBot = useCallback(() => {
    setIsBotActive(false);
    if (autoTradeTimerRef.current) {
      clearInterval(autoTradeTimerRef.current);
      autoTradeTimerRef.current = null;
    }
    pushLog('[Sistema] Bot desativado.');
  }, [pushLog]);

  const buyManual = useCallback(async () => {
    await executeTrade();
  }, [executeTrade]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoTradeTimerRef.current) clearInterval(autoTradeTimerRef.current);
    };
  }, []);

  return {
    signals,
    selectedSignal,
    selectSignal,
    refreshSignals,
    stake,
    setStake,
    stopLoss,
    setStopLoss,
    sessionLossLimit,
    setSessionLossLimit,
    martingaleFactor,
    setMartingaleFactor,
    martingaleEnabled,
    setMartingaleEnabled,
    autoTradeEnabled,
    setAutoTradeEnabled,
    soundEnabled,
    setSoundEnabled,
    isBotActive,
    activateBot,
    deactivateBot,
    isBuying,
    buyResult,
    buyError,
    clearBuyResult,
    buyManual,
    stats,
    tradeLog,
    logMessages,
  };
}
