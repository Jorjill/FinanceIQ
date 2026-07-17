import { Platform } from 'react-native';
import { batchAnalyze } from './llmService';

// ─── CORS proxy chain (web only — iOS fetches directly, no CORS restriction) ──
const PROXIES = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

function fetchTimeout(url, opts, ms = 8000) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms)),
  ]);
}

async function fetchWithProxy(url) {
  if (Platform.OS !== 'web') {
    const res = await fetchTimeout(url, { headers: { Accept: '*/*' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }
  for (const makeProxy of PROXIES) {
    try {
      const res = await fetchTimeout(makeProxy(url), { headers: { Accept: '*/*' } });
      if (res.ok) return res.text();
    } catch { /* try next proxy */ }
  }
  throw new Error('All proxies failed for ' + url);
}

// ─── Reliable RSS feeds ────────────────────────────────────────────────────────
const FEEDS = [
  {
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    source: 'BBC Business',
    category: 'Economy',
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    source: 'NY Times',
    category: 'Economy',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    source: 'BBC Tech',
    category: 'Stocks',
  },
  {
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    source: 'CoinDesk',
    category: 'Crypto',
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml',
    source: 'NY Times Economy',
    category: 'Markets',
  },
];

// ─── Keyword maps ────────────────────────────────────────────────────────────
const TOPIC_MAP = [
  {
    topic: 'Federal Reserve',
    icon: '🏛️',
    keywords: ['fed', 'federal reserve', 'fomc', 'powell', 'rate hike', 'rate cut', 'interest rate', 'monetary policy', 'central bank'],
    affected: ['Bonds', 'Stocks', 'REITs', 'S&P 500'],
  },
  {
    topic: 'Inflation',
    icon: '📈',
    keywords: ['inflation', 'cpi', 'pce', 'consumer price', 'price index', 'deflation', 'stagflation', 'cost of living'],
    affected: ['TIPS', 'Gold', 'Commodities', 'Real Estate'],
  },
  {
    topic: 'Earnings',
    icon: '💼',
    keywords: ['earnings', 'revenue', 'profit', 'quarterly results', 'eps', 'beats expectations', 'misses', 'guidance', 'outlook'],
    affected: ['Individual Stocks', 'Sector ETFs'],
  },
  {
    topic: 'Tech & AI',
    icon: '🤖',
    keywords: ['ai', 'artificial intelligence', 'tech', 'apple', 'microsoft', 'google', 'nvidia', 'amazon', 'semiconductor', 'chip', 'openai'],
    affected: ['QQQ', 'Tech Stocks', 'NVDA', 'MSFT', 'AAPL'],
  },
  {
    topic: 'Cryptocurrency',
    icon: '₿',
    keywords: ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'btc', 'eth', 'defi', 'nft', 'altcoin', 'stablecoin', 'binance', 'coinbase'],
    affected: ['BTC', 'ETH', 'Crypto ETFs'],
  },
  {
    topic: 'Economy & GDP',
    icon: '🌍',
    keywords: ['gdp', 'recession', 'unemployment', 'jobs report', 'nonfarm payroll', 'economic growth', 'trade war', 'tariff', 'deficit'],
    affected: ['S&P 500', 'Bonds', 'VTI'],
  },
  {
    topic: 'Real Estate',
    icon: '🏠',
    keywords: ['housing', 'mortgage', 'real estate', 'reit', 'home sales', 'home prices', 'property', 'housing market'],
    affected: ['VNQ', 'REITs', 'Mortgage REITs'],
  },
  {
    topic: 'Energy',
    icon: '⚡',
    keywords: ['oil', 'energy', 'opec', 'crude', 'natural gas', 'petroleum', 'gasoline', 'esg', 'renewable', 'solar', 'exxon'],
    affected: ['Energy ETFs', 'XLE', 'Oil Futures'],
  },
  {
    topic: 'Banking',
    icon: '🏦',
    keywords: ['bank', 'jpmorgan', 'goldman', 'morgan stanley', 'wells fargo', 'credit', 'loan', 'default', 'banking sector', 'svb'],
    affected: ['XLF', 'Bank Stocks', 'KRE'],
  },
  {
    topic: 'Market Outlook',
    icon: '📊',
    keywords: ['bull market', 'bear market', 'correction', 'rally', 'selloff', 'volatility', 'vix', 'market crash', 'all-time high', 's&p 500', 'dow jones', 'nasdaq'],
    affected: ['VOO', 'VTI', 'QQQ'],
  },
];

const POSITIVE_WORDS = [
  'surge', 'soar', 'rally', 'gain', 'rise', 'up', 'beat', 'exceed', 'strong',
  'growth', 'profit', 'record', 'bullish', 'optimistic', 'positive', 'rebound',
  'recover', 'boost', 'jump', 'spike', 'outperform', 'upgrade', 'buy', 'opportunity',
];

const NEGATIVE_WORDS = [
  'fall', 'drop', 'decline', 'crash', 'loss', 'down', 'miss', 'recession',
  'weak', 'bearish', 'warning', 'cut', 'risk', 'threat', 'concern', 'worry',
  'plunge', 'tumble', 'selloff', 'slump', 'downgrade', 'sell', 'avoid', 'fear',
];

// ─── Investment tip generator ────────────────────────────────────────────────
function generateTip(topic, sentiment, title) {
  const tips = {
    'Federal Reserve': {
      bullish: '💡 Rate cuts incoming? Bonds rally and growth stocks benefit. Consider adding to long-duration bond ETFs (TLT) or high-growth names in your portfolio.',
      bearish: '💡 Rate hikes pressure valuations. Growth stocks and long bonds suffer most. Shift weight toward value stocks, dividend payers, and short-duration bonds.',
      neutral: '💡 Fed uncertainty = volatility. Hold your asset allocation steady. Avoid reactionary moves — stick to your long-term plan.',
    },
    'Inflation': {
      bullish: '💡 Falling inflation is rocket fuel for stocks. The Fed can cut rates, boosting P/E multiples. This is great news for your index fund holdings.',
      bearish: '💡 Rising inflation erodes bond returns. Consider inflation-protected securities (TIPS), commodities, or real assets as hedges.',
      neutral: '💡 Moderate inflation is healthy for equity returns. Your S&P 500 index fund historically beats inflation by ~7% per year. Stay invested.',
    },
    'Earnings': {
      bullish: '💡 Strong earnings validate market valuations. If you own diversified ETFs, broad earnings beats support your holdings without single-stock risk.',
      bearish: '💡 Earnings misses can trigger sharp stock drops. This is exactly why diversified index funds beat individual stock picking — no single company can wreck you.',
      neutral: '💡 Mixed earnings are normal. Focus on the 10-year trend, not the quarter. Dollar-cost average into your positions.',
    },
    'Tech & AI': {
      bullish: '💡 AI tailwinds are real. QQQ (Nasdaq 100) gives you diversified exposure to the AI revolution without betting on a single company.',
      bearish: '💡 Tech pullbacks are opportunities for long-term investors. If you believe in AI long-term, consider adding to QQQ or VGT on dips.',
      neutral: '💡 Tech is ~30% of the S&P 500. Your VOO/VTI already gives meaningful tech exposure. Adding QQQ creates a growth tilt.',
    },
    'Cryptocurrency': {
      bullish: '💡 Crypto rally underway. If you have a small allocation (1-5%) to BTC/ETH, let it ride. Avoid adding more than your risk tolerance allows.',
      bearish: '💡 Crypto drawdowns of 40-80% are common. This is why it should be max 5-10% of your portfolio — enough to benefit on recovery, not enough to hurt you badly.',
      neutral: '💡 Bitcoin is maturing as an asset class. A 1-5% allocation captures asymmetric upside without threatening your core wealth-building plan.',
    },
    'Economy & GDP': {
      bullish: '💡 Strong economy supports corporate earnings and stocks. Stay invested — economic strength validates the case for equity ownership.',
      bearish: '💡 Recession fears spike volatility but historically last 6-18 months. The best strategy: don\'t sell, continue DCA. Recessions end, markets recover.',
      neutral: '💡 The economy grows most of the time. Time in the market beats timing the market. Keep your automatic investment contributions running.',
    },
    'Real Estate': {
      bullish: '💡 Real estate strength benefits REITs and homebuilder stocks. VNQ or O (Realty Income) offer liquid real estate exposure in your portfolio.',
      bearish: '💡 Housing slowdowns hurt REITs short-term. But well-run REITs with strong tenants recover. Consider holding or adding VNQ if you have a 5+ year horizon.',
      neutral: '💡 REITs offer 3-6% dividend yields plus appreciation. They\'re most tax-efficient in a Roth IRA. Consider 5-10% REIT allocation for diversification.',
    },
    'Energy': {
      bullish: '💡 Energy strength can hedge inflation. XLE (Energy Select SPDR ETF) gives diversified oil & gas exposure if you want to ride this move.',
      bearish: '💡 Energy pullbacks hurt commodity-heavy portfolios. If energy is less than 5% of your portfolio, this is just normal sector rotation.',
      neutral: '💡 Energy is a cyclical inflation hedge. A small 3-5% allocation to XLE or energy stocks can protect against oil price spikes.',
    },
    'Banking': {
      bullish: '💡 Bank strength signals economic confidence. XLF (Financial Select SPDR) offers diversified banking exposure tied to economic growth.',
      bearish: '💡 Banking stress can ripple through markets. Ensure your emergency fund is in an FDIC-insured account. Keep bank stock concentration low.',
      neutral: '💡 Banks profit from higher rates via net interest margin. If you own broad ETFs, you already have financial sector exposure.',
    },
    'Market Outlook': {
      bullish: '💡 Bull market in progress. Don\'t try to time the peak — just stay invested. The average bull market lasts 2.7 years with a +108% return.',
      bearish: '💡 Market corrections average -14% intra-year, every year. Long-term investors who hold through corrections earn ~10%/year. Don\'t sell in panic.',
      neutral: '💡 Markets move in cycles. Your job is simple: stay invested, keep adding monthly, and let compound interest do the work over 20-30 years.',
    },
  };

  const topicTips = tips[topic];
  if (!topicTips) {
    return '💡 Stay the course. News creates short-term noise but long-term fundamentals drive returns. Keep investing monthly in low-cost index funds.';
  }
  return topicTips[sentiment] || topicTips.neutral;
}

// ─── Core analysis function ───────────────────────────────────────────────────
function analyzeArticle(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();

  // Detect topic
  let detectedTopic = TOPIC_MAP.find((t) =>
    t.keywords.some((kw) => text.includes(kw))
  ) || { topic: 'General Markets', icon: '📰', affected: ['VOO', 'VTI'] };

  // Sentiment scoring
  let score = 0;
  POSITIVE_WORDS.forEach((w) => { if (text.includes(w)) score++; });
  NEGATIVE_WORDS.forEach((w) => { if (text.includes(w)) score--; });

  const sentiment = score > 0 ? 'bullish' : score < 0 ? 'bearish' : 'neutral';

  // Clean up description
  const summary = cleanSummary(article.description || article.title);

  return {
    id: article.guid || article.link || Math.random().toString(),
    title: article.title,
    summary,
    source: article.source || 'Financial News',
    category: article.category || 'Markets',
    pubDate: article.pubDate,
    link: article.link,
    thumbnail: article.thumbnail || article.enclosure?.link || null,
    topic: detectedTopic.topic,
    topicIcon: detectedTopic.icon,
    affected: detectedTopic.affected,
    sentiment,
    sentimentScore: score,
    tip: generateTip(detectedTopic.topic, sentiment, article.title),
  };
}

function cleanSummary(raw) {
  if (!raw) return '';
  // Strip HTML tags
  let clean = raw.replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  clean = clean.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  // Trim to ~200 chars at sentence boundary
  clean = clean.trim();
  if (clean.length > 220) {
    const cut = clean.slice(0, 220);
    const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    clean = lastDot > 100 ? cut.slice(0, lastDot + 1) : cut + '…';
  }
  return clean;
}

// ─── Simple RSS XML parser ────────────────────────────────────────────────────
function getXmlTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}
function stripCDATA(str) {
  return str.replace(/<\!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}
function parseRSS(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  blocks.slice(0, 10).forEach((block) => {
    const title = stripCDATA(getXmlTag(block, 'title'));
    const description = stripCDATA(getXmlTag(block, 'description'));
    const link = stripCDATA(getXmlTag(block, 'link')) || getXmlTag(block, 'guid');
    const pubDate = getXmlTag(block, 'pubDate') || getXmlTag(block, 'dc:date');
    if (title && title.length > 5) items.push({ title, description, link, pubDate });
  });
  return items;
}

// ─── Fetch from a single RSS feed ─────────────────────────────────────────────
async function fetchFeed(feed) {
  const xml = await fetchWithProxy(feed.url);
  if (!xml.includes('<item') && !xml.includes('<entry')) throw new Error('Not valid RSS');
  const items = parseRSS(xml);
  if (!items.length) throw new Error('No items parsed');
  return items.map((item) =>
    analyzeArticle({ ...item, source: feed.source, category: feed.category })
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────
export async function fetchAllNews() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const articles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // Deduplicate by title similarity and sort by date
  const seen = new Set();
  const unique = articles.filter((a) => {
    const key = a.title.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Enrich top articles with LLM analysis (falls back to rule-based if no key/error)
  const enriched = await batchAnalyze(unique, { limit: 8, concurrency: 3 });
  return enriched;
}

export function getSentimentLabel(sentiment) {
  if (sentiment === 'bullish') return '📈 Bullish';
  if (sentiment === 'bearish') return '📉 Bearish';
  return '➡️ Neutral';
}

export function getSentimentColor(sentiment) {
  if (sentiment === 'bullish') return '#2ED573';
  if (sentiment === 'bearish') return '#FF4757';
  return '#FFA502';
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
