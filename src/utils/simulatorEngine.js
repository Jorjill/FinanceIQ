import AsyncStorage from '@react-native-async-storage/async-storage';

const SIM_KEY = '@financeiq_simulator';

// ─── Asset Definitions ────────────────────────────────────────────────────────
// mu = annualized expected return, sigma = annualized volatility
export const ASSETS = [
  { symbol: 'SPY',  name: 'S&P 500 ETF',      type: 'ETF',    icon: '📈', basePrice: 565,    mu: 0.10, sigma: 0.15 },
  { symbol: 'QQQ',  name: 'Nasdaq-100 ETF',    type: 'ETF',    icon: '💻', basePrice: 490,    mu: 0.12, sigma: 0.18 },
  { symbol: 'VTI',  name: 'Total Market ETF',  type: 'ETF',    icon: '🌍', basePrice: 285,    mu: 0.10, sigma: 0.15 },
  { symbol: 'GLD',  name: 'Gold ETF',          type: 'ETF',    icon: '🥇', basePrice: 240,    mu: 0.05, sigma: 0.14 },
  { symbol: 'AAPL', name: 'Apple',             type: 'Stock',  icon: '🍎', basePrice: 195,    mu: 0.12, sigma: 0.28 },
  { symbol: 'MSFT', name: 'Microsoft',         type: 'Stock',  icon: '🪟', basePrice: 415,    mu: 0.14, sigma: 0.22 },
  { symbol: 'NVDA', name: 'NVIDIA',            type: 'Stock',  icon: '🎮', basePrice: 130,    mu: 0.20, sigma: 0.45 },
  { symbol: 'GOOGL',name: 'Alphabet',          type: 'Stock',  icon: '🔍', basePrice: 180,    mu: 0.13, sigma: 0.26 },
  { symbol: 'AMZN', name: 'Amazon',            type: 'Stock',  icon: '📦', basePrice: 200,    mu: 0.15, sigma: 0.28 },
  { symbol: 'TSLA', name: 'Tesla',             type: 'Stock',  icon: '⚡', basePrice: 250,    mu: 0.08, sigma: 0.65 },
  { symbol: 'META', name: 'Meta',              type: 'Stock',  icon: '👓', basePrice: 590,    mu: 0.17, sigma: 0.30 },
  { symbol: 'JPM',  name: 'JPMorgan Chase',    type: 'Stock',  icon: '🏦', basePrice: 230,    mu: 0.10, sigma: 0.20 },
  { symbol: 'BTC',  name: 'Bitcoin',           type: 'Crypto', icon: '₿',  basePrice: 105000, mu: 0.30, sigma: 0.80 },
  { symbol: 'ETH',  name: 'Ethereum',          type: 'Crypto', icon: '🔷', basePrice: 3500,   mu: 0.25, sigma: 0.85 },
];

const DT = 1 / 252; // one trading day as a fraction of a year
const STARTING_CASH = 30000;

// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
function seededRandom(seed) {
  let s = (seed + 1) >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform → standard normal variate
function randn(rand) {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Price Engine ─────────────────────────────────────────────────────────────
// Each (asset, day) gets a unique independent seed derived from globalSeed
function getNextPrices(currentPrices, newDayIndex, globalSeed) {
  const next = {};
  ASSETS.forEach((asset, i) => {
    const rand = seededRandom(globalSeed * 100 + i * 1000000 + newDayIndex);
    const z = randn(rand);
    const ret = (asset.mu - 0.5 * asset.sigma ** 2) * DT + asset.sigma * Math.sqrt(DT) * z;
    next[asset.symbol] = Math.max(currentPrices[asset.symbol] * Math.exp(ret), 0.01);
  });
  return next;
}

function getBasePrices() {
  return Object.fromEntries(ASSETS.map(a => [a.symbol, a.basePrice]));
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
// Returns array of trading day date strings (skipping weekends) for N calendar days ahead
function tradingDatesAhead(startDateStr, calendarDays) {
  const dates = [];
  const current = new Date(startDateStr);
  for (let i = 0; i < calendarDays; i++) {
    current.setDate(current.getDate() + 1);
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
  }
  return dates;
}

function calendarDaysAhead(startDateStr, calendarDays) {
  const d = new Date(startDateStr);
  d.setDate(d.getDate() + calendarDays);
  return d.toISOString().split('T')[0];
}

// ─── Portfolio Helpers ────────────────────────────────────────────────────────
export function portfolioValue(holdings, prices) {
  return Object.entries(holdings).reduce((sum, [sym, h]) => {
    return sum + (prices[sym] ?? 0) * h.shares;
  }, 0);
}

export function holdingPnL(holding, currentPrice) {
  const currentValue = holding.shares * currentPrice;
  const costBasis = holding.shares * holding.avgCost;
  const pnl = currentValue - costBasis;
  const pct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  return { currentValue, costBasis, pnl, pct };
}

// ─── Formatters ───────────────────────────────────────────────────────────────
export function fmtCurrency(val, decimals = 2) {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return `${sign}$${abs.toFixed(decimals)}`;
}

export function fmtPct(val) {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function fmtShares(shares) {
  if (shares >= 100) return shares.toFixed(2);
  if (shares >= 1) return shares.toFixed(4);
  return shares.toFixed(6);
}

export function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Simulator Lifecycle ──────────────────────────────────────────────────────
export async function loadSim() {
  const raw = await AsyncStorage.getItem(SIM_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveSim(state) {
  await AsyncStorage.setItem(SIM_KEY, JSON.stringify(state));
}

export function createNewSim() {
  const today = new Date().toISOString().split('T')[0];
  const seed = Math.floor(Math.random() * 999998) + 1;
  return {
    startDate: today,
    currentDate: today,
    seed,
    dayIndex: 0,
    cash: STARTING_CASH,
    holdings: {},
    transactions: [],
    prices: getBasePrices(),
    portfolioHistory: [{ date: today, value: STARTING_CASH }],
  };
}

// ─── Time Advance ─────────────────────────────────────────────────────────────
export function advanceSim(state, calendarDays) {
  const tradingDates = tradingDatesAhead(state.currentDate, calendarDays);
  const endDate = calendarDaysAhead(state.currentDate, calendarDays);

  let prices = { ...state.prices };
  let dayIndex = state.dayIndex;
  const { cash, holdings, seed } = state;

  // Sample frequency: store every Nth trading day to keep history compact
  const sampleEvery = calendarDays <= 7 ? 1 : calendarDays <= 31 ? 1 : calendarDays <= 90 ? 3 : 10;
  const newHistory = [];

  tradingDates.forEach((date, i) => {
    dayIndex++;
    prices = getNextPrices(prices, dayIndex, seed);
    if (i % sampleEvery === 0 || i === tradingDates.length - 1) {
      newHistory.push({ date, value: cash + portfolioValue(holdings, prices) });
    }
  });

  const newDate = tradingDates.length > 0 ? tradingDates[tradingDates.length - 1] : endDate;

  return {
    ...state,
    currentDate: newDate,
    dayIndex,
    prices,
    portfolioHistory: [...state.portfolioHistory, ...newHistory],
  };
}

// ─── Trading ──────────────────────────────────────────────────────────────────
export function buyAsset(state, symbol, dollarAmount) {
  if (dollarAmount <= 0) return { error: 'Enter a valid amount.' };
  const price = state.prices[symbol];
  if (!price) return { error: 'Unknown asset.' };
  if (dollarAmount > state.cash + 0.001) return { error: 'Insufficient cash.' };

  const shares = dollarAmount / price;
  const existing = state.holdings[symbol] || { shares: 0, avgCost: 0 };
  const newTotalShares = existing.shares + shares;
  const newAvgCost = (existing.shares * existing.avgCost + dollarAmount) / newTotalShares;

  return {
    newState: {
      ...state,
      cash: state.cash - dollarAmount,
      holdings: {
        ...state.holdings,
        [symbol]: { shares: newTotalShares, avgCost: newAvgCost },
      },
      transactions: [
        { date: state.currentDate, type: 'BUY', symbol, shares, price, total: dollarAmount },
        ...state.transactions,
      ],
    },
  };
}

export function sellAsset(state, symbol, dollarAmount) {
  const holding = state.holdings[symbol];
  if (!holding || holding.shares < 1e-8) return { error: 'No position to sell.' };

  const price = state.prices[symbol];
  const maxDollars = holding.shares * price;
  const actual = Math.min(dollarAmount, maxDollars);
  if (actual <= 0) return { error: 'Enter a valid amount.' };

  const sharesSold = actual / price;
  const remainingShares = holding.shares - sharesSold;

  const newHoldings = { ...state.holdings };
  if (remainingShares < 1e-6) {
    delete newHoldings[symbol];
  } else {
    newHoldings[symbol] = { ...holding, shares: remainingShares };
  }

  return {
    newState: {
      ...state,
      cash: state.cash + actual,
      holdings: newHoldings,
      transactions: [
        { date: state.currentDate, type: 'SELL', symbol, shares: sharesSold, price, total: actual },
        ...state.transactions,
      ],
    },
  };
}

export { STARTING_CASH };
