import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSimulatorTip } from '../services/llmService';
import { colors } from '../theme/colors';
import {
  ASSETS, STARTING_CASH,
  loadSim, saveSim, createNewSim, advanceSim, buyAsset, sellAsset,
  portfolioValue, holdingPnL,
  fmtCurrency, fmtPct, fmtShares, fmtDate,
} from '../utils/simulatorEngine';

const TABS = ['Portfolio', 'Market', 'History'];
const TIME_STEPS = [
  { label: '+1D', days: 1 },
  { label: '+1W', days: 7 },
  { label: '+1M', days: 30 },
  { label: '+1Y', days: 365 },
];
const CHART_H = 100;

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SimulatorScreen() {
  const [sim, setSim] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [marketFilter, setMarketFilter] = useState('All');
  const [tip, setTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(false);
  const tipFetchedRef = useRef(false);

  const fetchTip = useCallback(async (simState) => {
    if (!simState) return;
    setTipLoading(true);
    const result = await getSimulatorTip(simState, ASSETS);
    setTip(result);
    setTipLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadSim().then(s => {
      setSim(s);
      setLoading(false);
      if (s && !tipFetchedRef.current) {
        tipFetchedRef.current = true;
        fetchTip(s);
      }
    });
  }, [fetchTip]));

  const save = async (newSim) => { setSim(newSim); await saveSim(newSim); };

  const handleStart = async () => { const ns = createNewSim(); tipFetchedRef.current = true; await save(ns); fetchTip(ns); };

  const handleAdvance = async (days) => {
    if (!sim || advancing) return;
    setAdvancing(true);
    await new Promise(r => setTimeout(r, 0));
    const newSim = advanceSim(sim, days);
    await save(newSim);
    setAdvancing(false);
    fetchTip(newSim);
  };

  const handleReset = () => {
    const doReset = async () => { const ns = createNewSim(); await save(ns); setTab(0); fetchTip(ns); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Reset simulation and start fresh with $${STARTING_CASH.toLocaleString()}?`)) doReset();
    } else {
      Alert.alert('Reset Simulation', `Start fresh with ${fmtCurrency(STARTING_CASH, 0)}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doReset },
      ]);
    }
  };

  const handleTrade = async (symbol, amount, isSell) => {
    const fn = isSell ? sellAsset : buyAsset;
    const result = fn(sim, symbol, amount);
    if (result.error) return result.error;
    await save(result.newState);
    fetchTip(result.newState);
    return null;
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} /></View>;

  if (!sim) {
    return (
      <View style={s.center}>
        <Text style={s.startIcon}>📈</Text>
        <Text style={s.startTitle}>Investment Simulator</Text>
        <Text style={s.startSub}>
          Practice with ${STARTING_CASH.toLocaleString()} virtual cash.{'\n'}
          Buy stocks, ETFs and crypto. Skip time.{'\n'}
          Learn how markets behave before risking real money.
        </Text>
        <TouchableOpacity style={s.startBtn} onPress={handleStart}>
          <Text style={s.startBtnText}>Start with ${STARTING_CASH.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const invested = portfolioValue(sim.holdings, sim.prices);
  const total = sim.cash + invested;
  const totalGain = total - STARTING_CASH;
  const totalGainPct = (totalGain / STARTING_CASH) * 100;
  const gainColor = totalGain >= 0 ? colors.success : colors.error;

  return (
    <View style={s.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerDate}>{fmtDate(sim.currentDate)}  ·  Day {sim.dayIndex}</Text>
          <Text style={s.headerValue}>{fmtCurrency(total)}</Text>
          <Text style={[s.headerGain, { color: gainColor }]}>
            {totalGain >= 0 ? '▲' : '▼'} {fmtCurrency(Math.abs(totalGain))}  ({fmtPct(totalGainPct)})
          </Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={s.resetBtn}>
          <Text style={s.resetText}>↺ Reset</Text>
        </TouchableOpacity>
      </View>

      {/* ── Time controls ──────────────────────────────────────────────── */}
      <View style={s.timeRow}>
        <Text style={s.timeLabel}>Skip to:</Text>
        {TIME_STEPS.map(({ label, days }) => (
          <TouchableOpacity
            key={label}
            style={s.timeBtn}
            onPress={() => handleAdvance(days)}
            disabled={advancing}
          >
            <Text style={s.timeBtnText}>{advancing ? '…' : label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.divider} />

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <View style={s.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={s.tabItem} onPress={() => setTab(i)}>
            <Text style={[s.tabText, tab === i && s.tabActive]}>{t}</Text>
            {tab === i && <View style={s.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.divider} />

      {/* ── Tab content ────────────────────────────────────────────────── */}
      {tab === 0 && (
        <PortfolioTab
          sim={sim} total={total} invested={invested} onSelect={setSelectedSymbol}
          tip={tip} tipLoading={tipLoading} onFetchTip={() => fetchTip(sim)}
        />
      )}
      {tab === 1 && (
        <MarketTab
          sim={sim}
          filter={marketFilter}
          onFilterChange={setMarketFilter}
          onSelect={setSelectedSymbol}
        />
      )}
      {tab === 2 && <HistoryTab sim={sim} />}

      {/* ── Trade modal ────────────────────────────────────────────────── */}
      {selectedSymbol && (
        <TradeModal
          asset={ASSETS.find(a => a.symbol === selectedSymbol)}
          sim={sim}
          onTrade={handleTrade}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </View>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────
function PortfolioTab({ sim, total, invested, onSelect, tip, tipLoading, onFetchTip }) {
  const holdingEntries = Object.entries(sim.holdings).filter(([, h]) => h.shares > 1e-8);
  const allocationPct = total > 0 ? (invested / total) * 100 : 0;

  return (
    <ScrollView contentContainerStyle={s.tabContent}>
      {/* Summary row */}
      <View style={s.summaryRow}>
        <SummaryCell label="Cash" value={fmtCurrency(sim.cash)} />
        <View style={s.summaryDivider} />
        <SummaryCell label="Invested" value={fmtCurrency(invested)} />
        <View style={s.summaryDivider} />
        <SummaryCell label="Allocation" value={`${allocationPct.toFixed(0)}%`} />
      </View>

      {/* Allocation bar */}
      <View style={s.allocBarBg}>
        <View style={[s.allocBarFill, { width: `${allocationPct}%` }]} />
      </View>

      <View style={s.divider} />

      {/* AI Coach Tip */}
      <TipCard tip={tip} loading={tipLoading} onRefresh={onFetchTip} />

      <View style={s.divider} />

      {holdingEntries.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyText}>No holdings yet.</Text>
          <Text style={s.emptyHint}>Go to Market tab to buy assets.</Text>
        </View>
      ) : (
        <>
          <Text style={s.sectionLabel}>HOLDINGS</Text>
          {holdingEntries.map(([symbol, holding], idx) => {
            const asset = ASSETS.find(a => a.symbol === symbol);
            const price = sim.prices[symbol];
            const { currentValue, pnl, pct } = holdingPnL(holding, price);
            const pnlColor = pnl >= 0 ? colors.success : colors.error;
            return (
              <TouchableOpacity
                key={symbol}
                style={[s.holdingRow, idx < holdingEntries.length - 1 && s.rowBorder]}
                onPress={() => onSelect(symbol)}
                activeOpacity={0.7}
              >
                <Text style={s.holdingIcon}>{asset?.icon ?? '💹'}</Text>
                <View style={s.holdingBody}>
                  <View style={s.holdingTop}>
                    <Text style={s.holdingSymbol}>{symbol}</Text>
                    <Text style={s.holdingValue}>{fmtCurrency(currentValue)}</Text>
                  </View>
                  <View style={s.holdingBottom}>
                    <Text style={s.holdingShares}>{fmtShares(holding.shares)} shares @ {fmtCurrency(sim.prices[symbol])}</Text>
                    <Text style={[s.holdingPnL, { color: pnlColor }]}>
                      {pnl >= 0 ? '+' : ''}{fmtCurrency(pnl)}  ({fmtPct(pct)})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function SummaryCell({ label, value }) {
  return (
    <View style={s.summaryCell}>
      <Text style={s.summaryCellValue}>{value}</Text>
      <Text style={s.summaryCellLabel}>{label}</Text>
    </View>
  );
}

// ─── Tip Card ─────────────────────────────────────────────────────────────────
const ACTION_COLORS = {
  buy: colors.success, sell: colors.error,
  hold: colors.textMuted, rebalance: '#F59E0B', diversify: colors.primary,
};

function TipCard({ tip, loading, onRefresh }) {
  const actionColor = tip ? (ACTION_COLORS[tip.action] ?? colors.primary) : colors.textMuted;

  return (
    <View style={s.tipWrap}>
      <View style={s.tipHeader}>
        <Text style={s.tipTitle}>💡 AI Coach</Text>
        <View style={s.tipHeaderRight}>
          {tip?.llm && <Text style={s.tipBadgeLLM}>GPT-4o-mini</Text>}
          <TouchableOpacity onPress={onRefresh} style={s.tipRefreshBtn} disabled={loading}>
            <Text style={s.tipRefreshText}>{loading ? '…' : '↻ Refresh'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !tip ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : tip ? (
        <>
          <View style={s.tipActionRow}>
            <View style={[s.tipActionBadge, { backgroundColor: actionColor + '22', borderColor: actionColor + '55' }]}>
              <Text style={[s.tipActionText, { color: actionColor }]}>{tip.action?.toUpperCase()}</Text>
            </View>
            {tip.focusAsset && <Text style={s.tipFocusAsset}>Focus: {tip.focusAsset}</Text>}
          </View>
          <Text style={s.tipText}>{tip.tip}</Text>
          {tip.reasoning ? <Text style={s.tipReasoning}>{tip.reasoning}</Text> : null}
        </>
      ) : (
        <TouchableOpacity onPress={onRefresh} style={s.tipGetBtn}>
          <Text style={s.tipGetBtnText}>Get AI Tip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Market Tab ───────────────────────────────────────────────────────────────
const MARKET_FILTERS = ['All', 'ETF', 'Stock', 'Crypto'];

function MarketTab({ sim, filter, onFilterChange, onSelect }) {
  const displayed = ASSETS.filter(a => filter === 'All' || a.type === filter);

  return (
    <View style={{ flex: 1 }}>
      {/* Type filter */}
      <View style={s.marketFilters}>
        {MARKET_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.mfBtn, filter === f && s.mfBtnActive]}
            onPress={() => onFilterChange(f)}
          >
            <Text style={[s.mfText, filter === f && s.mfTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.divider} />

      <ScrollView>
        {displayed.map((asset, idx) => {
          const price = sim.prices[asset.symbol];
          const holding = sim.holdings[asset.symbol];
          // Day change: compare today's price to yesterday's (day - 1 price not stored, use random hint)
          // We'll approximate: compare to cost basis if holding, else show N/A aesthetically
          const hasPosition = holding && holding.shares > 1e-8;
          const positionValue = hasPosition ? holding.shares * price : 0;

          return (
            <TouchableOpacity
              key={asset.symbol}
              style={[s.assetRow, idx < displayed.length - 1 && s.rowBorder]}
              onPress={() => onSelect(asset.symbol)}
              activeOpacity={0.7}
            >
              <Text style={s.assetIcon}>{asset.icon}</Text>
              <View style={s.assetBody}>
                <View style={s.assetTop}>
                  <Text style={s.assetSymbol}>{asset.symbol}</Text>
                  <Text style={s.assetPrice}>{fmtCurrency(price)}</Text>
                </View>
                <View style={s.assetBottom}>
                  <Text style={s.assetName}>{asset.name}  ·  {asset.type}</Text>
                  {hasPosition && (
                    <Text style={s.assetOwned}>{fmtCurrency(positionValue)} owned</Text>
                  )}
                </View>
              </View>
              <Text style={s.assetArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ sim }) {
  const history = sim.portfolioHistory;
  const recent = history.slice(-60);

  const values = recent.map(h => h.value);
  const minVal = Math.min(...values) * 0.995;
  const maxVal = Math.max(...values) * 1.005;
  const range = maxVal - minVal || 1;

  const startVal = history[0]?.value ?? STARTING_CASH;
  const endVal = history[history.length - 1]?.value ?? STARTING_CASH;
  const overallGain = endVal - startVal;

  return (
    <ScrollView contentContainerStyle={s.tabContent}>
      {/* Chart */}
      <View style={s.chartWrap}>
        <Text style={s.chartTopLabel}>{fmtCurrency(maxVal, 0)}</Text>
        <View style={s.chartBars}>
          {recent.map((h, i) => {
            const barH = Math.max(((h.value - minVal) / range) * CHART_H, 2);
            const isUp = i === 0 ? true : h.value >= recent[i - 1].value;
            return (
              <View key={i} style={s.chartBarCol}>
                <View
                  style={[
                    s.chartBar,
                    { height: barH, backgroundColor: isUp ? colors.success : colors.error },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <Text style={s.chartBotLabel}>{fmtCurrency(minVal, 0)}</Text>
      </View>

      {/* Stats */}
      <View style={s.histStatsRow}>
        <HistStat label="Start" value={fmtCurrency(STARTING_CASH, 0)} />
        <HistStat label="Current" value={fmtCurrency(endVal)} />
        <HistStat
          label="Total P&L"
          value={`${overallGain >= 0 ? '+' : ''}${fmtCurrency(overallGain)}`}
          color={overallGain >= 0 ? colors.success : colors.error}
        />
      </View>

      <View style={s.divider} />

      {/* Transaction log */}
      <Text style={s.sectionLabel}>TRANSACTIONS ({sim.transactions.length})</Text>
      {sim.transactions.length === 0 ? (
        <Text style={[s.emptyText, { paddingHorizontal: 16, paddingTop: 12 }]}>No trades yet.</Text>
      ) : (
        sim.transactions.map((tx, i) => {
          const asset = ASSETS.find(a => a.symbol === tx.symbol);
          const isBuy = tx.type === 'BUY';
          return (
            <View key={i} style={[s.txRow, i < sim.transactions.length - 1 && s.rowBorder]}>
              <View style={[s.txBadge, { backgroundColor: (isBuy ? colors.success : colors.error) + '22' }]}>
                <Text style={[s.txBadgeText, { color: isBuy ? colors.success : colors.error }]}>{tx.type}</Text>
              </View>
              <Text style={s.txIcon}>{asset?.icon}</Text>
              <View style={s.txBody}>
                <Text style={s.txSymbol}>{tx.symbol}</Text>
                <Text style={s.txDetail}>{fmtShares(tx.shares)} shares @ {fmtCurrency(tx.price)}</Text>
              </View>
              <View style={s.txRight}>
                <Text style={[s.txTotal, { color: isBuy ? colors.error : colors.success }]}>
                  {isBuy ? '-' : '+'}{fmtCurrency(tx.total)}
                </Text>
                <Text style={s.txDate}>{tx.date}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function HistStat({ label, value, color }) {
  return (
    <View style={s.histStat}>
      <Text style={[s.histStatValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.histStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ asset, sim, onTrade, onClose }) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('buy'); // 'buy' | 'sell'
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const price = sim.prices[asset.symbol];
  const holding = sim.holdings[asset.symbol];
  const hasPosition = holding && holding.shares > 1e-8;
  const dollarAmount = parseFloat(amount) || 0;
  const sharesEquiv = dollarAmount > 0 ? dollarAmount / price : 0;
  const maxBuy = sim.cash;
  const maxSell = hasPosition ? holding.shares * price : 0;
  const { pnl, pct: pnlPct } = hasPosition ? holdingPnL(holding, price) : { pnl: 0, pct: 0 };

  const handleConfirm = async () => {
    setError('');
    const err = await onTrade(asset.symbol, dollarAmount, mode === 'sell');
    if (err) { setError(err); return; }
    setDone(true);
    setTimeout(onClose, 800);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modal}>
        {/* Modal header */}
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose} style={s.modalClose}>
            <Text style={s.modalCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>{asset.icon} {asset.symbol} — {asset.name}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.modalBody}>
          {/* Price + type */}
          <View style={s.modalPriceRow}>
            <View>
              <Text style={s.modalPrice}>{fmtCurrency(price)}</Text>
              <Text style={s.modalAssetType}>{asset.type}</Text>
            </View>
            {hasPosition && (
              <View style={s.modalPositionBox}>
                <Text style={s.modalPositionLabel}>Your position</Text>
                <Text style={s.modalPositionShares}>{fmtShares(holding.shares)} shares</Text>
                <Text style={[s.modalPositionPnL, { color: pnl >= 0 ? colors.success : colors.error }]}>
                  {pnl >= 0 ? '+' : ''}{fmtCurrency(pnl)} ({fmtPct(pnlPct)})
                </Text>
              </View>
            )}
          </View>

          <View style={s.divider} />

          {/* Buy / Sell toggle */}
          <View style={s.modeRow}>
            {['buy', 'sell'].map(m => (
              <TouchableOpacity
                key={m}
                style={[s.modeBtn, mode === m && { backgroundColor: m === 'buy' ? colors.success : colors.error }]}
                onPress={() => { setMode(m); setError(''); }}
                disabled={m === 'sell' && !hasPosition}
              >
                <Text style={[s.modeBtnText, mode === m && { color: '#fff' }]}>
                  {m === 'buy' ? 'Buy' : 'Sell'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount input */}
          <Text style={s.inputLabel}>Amount (USD)</Text>
          <View style={s.inputRow}>
            <Text style={s.inputPrefix}>$</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={v => { setAmount(v.replace(/[^0-9.]/g, '')); setError(''); }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>

          {/* Quick-fill buttons */}
          <View style={s.quickRow}>
            {[0.25, 0.5, 0.75, 1.0].map(pct => {
              const max = mode === 'buy' ? maxBuy : maxSell;
              const val = (max * pct).toFixed(2);
              return (
                <TouchableOpacity
                  key={pct}
                  style={s.quickBtn}
                  onPress={() => setAmount(val)}
                >
                  <Text style={s.quickBtnText}>{pct * 100}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview */}
          {dollarAmount > 0 && (
            <View style={s.preview}>
              <PreviewRow label="Shares" value={fmtShares(sharesEquiv)} />
              <PreviewRow label="Price per share" value={fmtCurrency(price)} />
              <PreviewRow label="Total" value={fmtCurrency(dollarAmount)} bold />
              <PreviewRow
                label={mode === 'buy' ? 'Cash after' : 'Cash after'}
                value={fmtCurrency(mode === 'buy' ? sim.cash - dollarAmount : sim.cash + dollarAmount)}
              />
            </View>
          )}

          {error ? <Text style={s.errorText}>{error}</Text> : null}
          {done ? <Text style={s.doneText}>✓ Trade executed!</Text> : null}

          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: mode === 'buy' ? colors.success : colors.error }]}
            onPress={handleConfirm}
            disabled={done || dollarAmount <= 0}
          >
            <Text style={s.confirmBtnText}>
              {mode === 'buy' ? `Buy ${fmtCurrency(dollarAmount)}` : `Sell ${fmtCurrency(dollarAmount)}`}
            </Text>
          </TouchableOpacity>

          <Text style={s.disclaimer}>
            Simulated only. Prices use geometric Brownian motion — not real market data.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PreviewRow({ label, value, bold }) {
  return (
    <View style={s.previewRow}>
      <Text style={s.previewLabel}>{label}</Text>
      <Text style={[s.previewValue, bold && { color: colors.text, fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  divider: { height: 1, backgroundColor: colors.border },

  // Start screen
  startIcon: { fontSize: 48, marginBottom: 12 },
  startTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 8 },
  startSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  startBtn: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
  startBtnText: { color: colors.background, fontSize: 15, fontWeight: '700' },

  // Header
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, paddingBottom: 12 },
  headerLeft: {},
  headerDate: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  headerValue: { fontSize: 28, fontWeight: '700', color: colors.text },
  headerGain: { fontSize: 13, marginTop: 2 },
  resetBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  resetText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },

  // Time controls
  timeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  timeLabel: { fontSize: 12, color: colors.textMuted, marginRight: 4, fontWeight: '600' },
  timeBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  timeBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Tab bar
  tabBar: { flexDirection: 'row', height: 36 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabActive: { color: colors.text },
  tabLine: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, backgroundColor: colors.primary, borderRadius: 1 },

  tabContent: { paddingBottom: 40 },

  // Summary
  summaryRow: { flexDirection: 'row', paddingVertical: 14 },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  summaryCellValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  summaryCellLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  allocBarBg: { height: 3, backgroundColor: colors.border, marginHorizontal: 16, marginBottom: 12, borderRadius: 2, overflow: 'hidden' },
  allocBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },

  // Holdings
  holdingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  holdingIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  holdingBody: { flex: 1 },
  holdingTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  holdingSymbol: { fontSize: 14, fontWeight: '700', color: colors.text },
  holdingValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  holdingBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  holdingShares: { fontSize: 12, color: colors.textMuted },
  holdingPnL: { fontSize: 12, fontWeight: '600' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: colors.textMuted, marginTop: 6 },

  // Market
  marketFilters: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  mfBtn: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  mfBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mfText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  mfTextActive: { color: colors.background },
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  assetIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  assetBody: { flex: 1 },
  assetTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  assetSymbol: { fontSize: 14, fontWeight: '700', color: colors.text },
  assetPrice: { fontSize: 14, fontWeight: '700', color: colors.text },
  assetBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  assetName: { fontSize: 12, color: colors.textMuted },
  assetOwned: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  assetArrow: { fontSize: 18, color: colors.textMuted },

  // Chart
  chartWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  chartTopLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_H, gap: 1 },
  chartBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: CHART_H },
  chartBar: { width: '100%', borderRadius: 1 },
  chartBotLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  // History stats
  histStatsRow: { flexDirection: 'row', paddingVertical: 12 },
  histStat: { flex: 1, alignItems: 'center' },
  histStatValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  histStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Transaction log
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11, gap: 10 },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  txBadgeText: { fontSize: 10, fontWeight: '700' },
  txIcon: { fontSize: 16 },
  txBody: { flex: 1 },
  txSymbol: { fontSize: 13, fontWeight: '700', color: colors.text },
  txDetail: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  txRight: { alignItems: 'flex-end' },
  txTotal: { fontSize: 13, fontWeight: '700' },
  txDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalClose: { padding: 4, width: 32 },
  modalCloseText: { fontSize: 18, color: colors.textSecondary },
  modalTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  modalBody: { padding: 20, paddingBottom: 48 },
  modalPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalPrice: { fontSize: 26, fontWeight: '700', color: colors.text },
  modalAssetType: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalPositionBox: { alignItems: 'flex-end' },
  modalPositionLabel: { fontSize: 11, color: colors.textMuted },
  modalPositionShares: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 },
  modalPositionPnL: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  // Buy/sell mode toggle
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  modeBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },

  // Amount input
  inputLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 6, marginBottom: 12 },
  inputPrefix: { fontSize: 22, color: colors.textMuted, marginRight: 6 },
  input: { flex: 1, fontSize: 26, fontWeight: '700', color: colors.text },

  // Quick fill
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  quickBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  // Preview
  preview: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 16 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  previewLabel: { fontSize: 13, color: colors.textMuted },
  previewValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  errorText: { color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  doneText: { color: colors.success, fontSize: 14, fontWeight: '700', marginBottom: 12, textAlign: 'center' },

  confirmBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },

  // Tip card
  tipWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  tipHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipBadgeLLM: { fontSize: 10, color: colors.primary, fontWeight: '700', borderWidth: 1, borderColor: colors.primary + '55', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  tipRefreshBtn: { paddingHorizontal: 8, paddingVertical: 3 },
  tipRefreshText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  tipActionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tipActionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  tipActionText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tipFocusAsset: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  tipText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  tipReasoning: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  tipGetBtn: { paddingVertical: 8, alignItems: 'center' },
  tipGetBtnText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
});
