import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

const TABS = ['Compound', 'DCA', 'Retirement', 'Loan'];

export default function CalculatorScreen() {
  const [tab, setTab] = useState('Compound');

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={styles.tabContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.calcContent}>
        {tab === 'Compound' && <CompoundCalc />}
        {tab === 'DCA' && <DCACalc />}
        {tab === 'Retirement' && <RetirementCalc />}
        {tab === 'Loan' && <LoanCalc />}
      </ScrollView>
    </View>
  );
}

// ─── Compound Interest Calculator ────────────────────────────────────────────
function CompoundCalc() {
  const [principal, setPrincipal] = useState('30000');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('30');
  const [monthly, setMonthly] = useState('0');

  const result = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;
    const m = parseFloat(monthly) || 0;
    if (r === 0) return { final: p + m * n, gain: m * n, total: p + m * n };
    const futureP = p * Math.pow(1 + r, n);
    const futureM = m * ((Math.pow(1 + r, n) - 1) / r);
    const final = futureP + futureM;
    const invested = p + m * n;
    return { final, gain: final - invested, total: invested };
  }, [principal, rate, years, monthly]);

  const milestones = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const m = parseFloat(monthly) || 0;
    return [5, 10, 20, 30].map((yr) => {
      const n = yr * 12;
      if (r === 0) return { yr, val: p + m * n };
      const val = p * Math.pow(1 + r, n) + m * ((Math.pow(1 + r, n) - 1) / r);
      return { yr, val };
    });
  }, [principal, rate, monthly]);

  return (
    <View>
      <ResultCard
        title="Future Value"
        main={fmt(result.final)}
        subs={[
          { label: 'Total Invested', value: fmt(result.total) },
          { label: 'Interest Earned', value: fmt(result.gain), color: colors.primary },
        ]}
      />
      <InputGroup label="Initial Investment ($)" value={principal} onChange={setPrincipal} prefix="$" keyboardType="numeric" />
      <InputGroup label="Annual Return (%)" value={rate} onChange={setRate} suffix="%" keyboardType="numeric" />
      <InputGroup label="Monthly Contribution ($)" value={monthly} onChange={setMonthly} prefix="$" keyboardType="numeric" />
      <InputGroup label="Time Period (years)" value={years} onChange={setYears} suffix="yrs" keyboardType="numeric" />

      <Text style={styles.timelineTitle}>Growth Milestones</Text>
      {milestones.map(({ yr, val }) => (
        <MilestoneRow key={yr} label={`${yr} years`} value={fmt(val)} pct={Math.min((val / result.final) * 100, 100)} />
      ))}
    </View>
  );
}

// ─── DCA Calculator ───────────────────────────────────────────────────────────
function DCACalc() {
  const [monthly, setMonthly] = useState('500');
  const [rate, setRate] = useState('10');
  const [years, setYears] = useState('30');

  const result = useMemo(() => {
    const m = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = (parseFloat(years) || 0) * 12;
    if (r === 0) return { final: m * n, invested: m * n, gain: 0 };
    const final = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = m * n;
    return { final, invested, gain: final - invested };
  }, [monthly, rate, years]);

  return (
    <View>
      <ResultCard
        title="DCA Final Value"
        main={fmt(result.final)}
        subs={[
          { label: 'Total Contributed', value: fmt(result.invested) },
          { label: 'Returns Earned', value: fmt(result.gain), color: colors.primary },
        ]}
      />
      <InputGroup label="Monthly Investment ($)" value={monthly} onChange={setMonthly} prefix="$" keyboardType="numeric" />
      <InputGroup label="Annual Return (%)" value={rate} onChange={setRate} suffix="%" keyboardType="numeric" />
      <InputGroup label="Time Period (years)" value={years} onChange={setYears} suffix="yrs" keyboardType="numeric" />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 DCA Insight</Text>
        <Text style={styles.infoText}>
          Investing {fmt(parseFloat(monthly) || 0)}/month consistently at {rate}% annual returns
          for {years} years turns {fmt((parseFloat(monthly) || 0) * (parseFloat(years) || 0) * 12)} of
          contributions into <Text style={{ color: colors.primary, fontWeight: '700' }}>{fmt(result.final)}</Text>.
        </Text>
      </View>
    </View>
  );
}

// ─── Retirement Calculator ────────────────────────────────────────────────────
function RetirementCalc() {
  const [currentAge, setCurrentAge] = useState('30');
  const [retireAge, setRetireAge] = useState('65');
  const [savings, setSavings] = useState('30000');
  const [monthly, setMonthly] = useState('500');
  const [rate, setRate] = useState('8');
  const [withdrawal, setWithdrawal] = useState('4');

  const result = useMemo(() => {
    const p = parseFloat(savings) || 0;
    const m = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const years = Math.max(0, (parseFloat(retireAge) || 65) - (parseFloat(currentAge) || 30));
    const n = years * 12;
    const w = (parseFloat(withdrawal) || 4) / 100;
    if (r === 0) return { nest: p + m * n, income: 0, years };
    const futureP = p * Math.pow(1 + r, n);
    const futureM = m * ((Math.pow(1 + r, n) - 1) / r);
    const nest = futureP + futureM;
    return { nest, income: (nest * w) / 12, years };
  }, [currentAge, retireAge, savings, monthly, rate, withdrawal]);

  return (
    <View>
      <ResultCard
        title="Retirement Nest Egg"
        main={fmt(result.nest)}
        subs={[
          { label: 'Monthly Income (4% rule)', value: fmt(result.income), color: colors.secondary },
          { label: 'Years to Grow', value: `${result.years} years` },
        ]}
      />
      <InputGroup label="Current Age" value={currentAge} onChange={setCurrentAge} suffix="yrs" keyboardType="numeric" />
      <InputGroup label="Retirement Age" value={retireAge} onChange={setRetireAge} suffix="yrs" keyboardType="numeric" />
      <InputGroup label="Current Savings ($)" value={savings} onChange={setSavings} prefix="$" keyboardType="numeric" />
      <InputGroup label="Monthly Contribution ($)" value={monthly} onChange={setMonthly} prefix="$" keyboardType="numeric" />
      <InputGroup label="Expected Annual Return (%)" value={rate} onChange={setRate} suffix="%" keyboardType="numeric" />
      <InputGroup label="Withdrawal Rate (%)" value={withdrawal} onChange={setWithdrawal} suffix="%" keyboardType="numeric" />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📋 The 4% Rule</Text>
        <Text style={styles.infoText}>
          The "4% rule" suggests withdrawing 4% of your portfolio in year 1, then adjusting for inflation each year. This has historically lasted 30+ years in retirement.
        </Text>
      </View>
    </View>
  );
}

// ─── Loan / Debt Payoff Calculator ───────────────────────────────────────────
function LoanCalc() {
  const [balance, setBalance] = useState('10000');
  const [rate, setRate] = useState('20');
  const [payment, setPayment] = useState('300');

  const result = useMemo(() => {
    const b = parseFloat(balance) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const p = parseFloat(payment) || 0;
    if (p <= b * r) return { months: Infinity, totalPaid: Infinity, interest: Infinity };
    if (r === 0) return { months: Math.ceil(b / p), totalPaid: b, interest: 0 };
    const months = Math.ceil(-Math.log(1 - (b * r) / p) / Math.log(1 + r));
    const totalPaid = p * months;
    return { months, totalPaid, interest: totalPaid - b };
  }, [balance, rate, payment]);

  const minPayment = useMemo(() => {
    const b = parseFloat(balance) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    return (b * r * 1.01).toFixed(2);
  }, [balance, rate]);

  return (
    <View>
      <ResultCard
        title="Debt Payoff"
        main={result.months === Infinity ? '∞ months' : `${result.months} months`}
        subs={[
          { label: 'Total Paid', value: result.totalPaid === Infinity ? '∞' : fmt(result.totalPaid) },
          { label: 'Interest Cost', value: result.interest === Infinity ? '∞' : fmt(result.interest), color: colors.danger },
        ]}
      />
      <InputGroup label="Current Balance ($)" value={balance} onChange={setBalance} prefix="$" keyboardType="numeric" />
      <InputGroup label="Annual Interest Rate (%)" value={rate} onChange={setRate} suffix="%" keyboardType="numeric" />
      <InputGroup label="Monthly Payment ($)" value={payment} onChange={setPayment} prefix="$" keyboardType="numeric" />

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>⚠️ Minimum Payment Warning</Text>
        <Text style={styles.infoText}>
          Minimum payment to make progress: <Text style={{ color: colors.warning, fontWeight: '700' }}>${minPayment}/month</Text>.
          Paying less than this means your balance GROWS even while making payments.
        </Text>
      </View>
    </View>
  );
}

// ─── Reusable Components ──────────────────────────────────────────────────────
function ResultCard({ title, main, subs }) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultMain}>{main}</Text>
      <View style={styles.resultSubs}>
        {subs.map((s) => (
          <View key={s.label} style={styles.resultSubItem}>
            <Text style={styles.resultSubLabel}>{s.label}</Text>
            <Text style={[styles.resultSubValue, s.color && { color: s.color }]}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function InputGroup({ label, value, onChange, prefix, suffix, keyboardType }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {prefix && <Text style={styles.inputAddon}>{prefix}</Text>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType || 'default'}
          placeholderTextColor={colors.textMuted}
        />
        {suffix && <Text style={styles.inputAddon}>{suffix}</Text>}
      </View>
    </View>
  );
}

function MilestoneRow({ label, value, pct }) {
  return (
    <View style={styles.milestoneRow}>
      <Text style={styles.milestoneLabel}>{label}</Text>
      <View style={styles.milestoneBarBg}>
        <View style={[styles.milestoneBarFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.milestoneValue}>{value}</Text>
    </View>
  );
}

function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: colors.background },
  calcContent: { padding: 16, paddingBottom: 40 },
  resultCard: {
    backgroundColor: colors.surfaceElevated, borderRadius: 20,
    padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  resultTitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  resultMain: { fontSize: 40, fontWeight: '900', color: colors.text, marginBottom: 16 },
  resultSubs: { flexDirection: 'row', gap: 24 },
  resultSubItem: { alignItems: 'center' },
  resultSubLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 3 },
  resultSubValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  inputAddon: {
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: colors.textSecondary,
    backgroundColor: colors.surfaceElevated, fontWeight: '600',
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    color: colors.text, fontSize: 16, fontWeight: '600',
  },
  infoBox: {
    backgroundColor: colors.surfaceElevated, borderRadius: 14,
    padding: 14, marginTop: 8, borderWidth: 1, borderColor: colors.border,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12, marginTop: 8 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  milestoneLabel: { width: 70, fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  milestoneBarBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  milestoneBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  milestoneValue: { width: 72, fontSize: 12, color: colors.text, fontWeight: '700', textAlign: 'right' },
});
