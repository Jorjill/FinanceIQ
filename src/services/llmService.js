import { getOpenAIKey, getLLMEnabled } from '../utils/storage';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a concise financial analyst assistant for a retail investor learning to invest.
When given a news article headline and description, respond ONLY with valid JSON — no markdown, no extra text.

JSON schema:
{
  "summary": "2-sentence plain English summary of what happened",
  "sentiment": "bullish" | "bearish" | "neutral",
  "sentimentReason": "1 sentence explaining why this sentiment",
  "affectedAssets": ["list", "of", "affected", "tickers", "or", "asset", "names"],
  "topic": "one of: Federal Reserve | Inflation | Earnings | Tech & AI | Cryptocurrency | Economy & GDP | Real Estate | Energy | Banking | Market Outlook | General Markets",
  "topicIcon": "single relevant emoji",
  "tip": "2-3 sentence specific actionable tip for a retail investor with a $30K portfolio primarily in index funds (VOO/VTI). Be concrete — mention specific ETFs, actions, or strategies relevant to this exact news."
}`;

function buildUserMessage(title, description) {
  const desc = description ? description.slice(0, 500) : '';
  return `Headline: ${title}\n\nDescription: ${desc}`;
}

async function callOpenAI(apiKey, messages) {
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI HTTP ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content);
}

// Analyse a single article — returns LLM fields merged with article, or null on failure
export async function analyzeWithLLM(article) {
  const [apiKey, enabled] = await Promise.all([getOpenAIKey(), getLLMEnabled()]);
  if (!enabled || !apiKey) return null;

  try {
    const result = await callOpenAI(apiKey, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(article.title, article.description) },
    ]);

    return {
      summary: result.summary || article.summary,
      sentiment: ['bullish', 'bearish', 'neutral'].includes(result.sentiment)
        ? result.sentiment
        : 'neutral',
      sentimentReason: result.sentimentReason || '',
      affected: Array.isArray(result.affectedAssets) ? result.affectedAssets : article.affected,
      topic: result.topic || article.topic,
      topicIcon: result.topicIcon || article.topicIcon,
      tip: result.tip || article.tip,
      llmAnalyzed: true,
    };
  } catch (e) {
    console.warn('[LLM] Failed for article:', article.title, e.message);
    return null;
  }
}

// Batch analyse up to `limit` articles with concurrency cap to avoid rate limits
export async function batchAnalyze(articles, { limit = 8, concurrency = 3 } = {}) {
  const [apiKey, enabled] = await Promise.all([getOpenAIKey(), getLLMEnabled()]);
  if (!enabled || !apiKey) return articles;

  const toAnalyze = articles.slice(0, limit);
  const results = [...articles];

  // Process in chunks of `concurrency`
  for (let i = 0; i < toAnalyze.length; i += concurrency) {
    const chunk = toAnalyze.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(chunk.map((a) => analyzeWithLLM(a)));

    chunkResults.forEach((r, j) => {
      const idx = i + j;
      if (r.status === 'fulfilled' && r.value) {
        results[idx] = { ...results[idx], ...r.value };
      }
    });
  }

  return results;
}

export async function isLLMReady() {
  const [key, enabled] = await Promise.all([getOpenAIKey(), getLLMEnabled()]);
  return enabled && key.startsWith('sk-');
}

// ─── Simulator Tip ────────────────────────────────────────────────────────────
const SIM_SYSTEM_PROMPT = `You are a concise investment coach inside a stock market simulator app.
The user has a virtual portfolio. Give them specific, actionable advice based on their current holdings and simulated performance.
Respond ONLY with valid JSON — no markdown, no extra text.

JSON schema:
{
  "tip": "2-3 sentence specific actionable advice referencing their actual holdings and cash level",
  "action": "buy" | "sell" | "hold" | "rebalance" | "diversify",
  "focusAsset": "one ticker symbol most relevant to the advice, or null",
  "reasoning": "1 sentence explaining the core logic"
}`;

function buildSimMessage(sim, assets) {
  const { cash, holdings, prices, dayIndex } = sim;
  const invested = Object.entries(holdings).reduce(
    (sum, [sym, h]) => sum + (prices[sym] ?? 0) * h.shares, 0
  );
  const total = cash + invested;
  const cashPct = total > 0 ? ((cash / total) * 100).toFixed(0) : 100;

  const holdingLines = Object.entries(holdings)
    .filter(([, h]) => h.shares > 1e-8)
    .map(([sym, h]) => {
      const val = prices[sym] * h.shares;
      const cost = h.avgCost * h.shares;
      const pct = cost > 0 ? (((val - cost) / cost) * 100).toFixed(1) : '0.0';
      return `${sym}: $${val.toFixed(0)} (${pct > 0 ? '+' : ''}${pct}%)`;
    });

  const changes = assets
    .map(a => ({ symbol: a.symbol, pct: ((prices[a.symbol] - a.basePrice) / a.basePrice) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  const top3 = changes.slice(0, 3).map(a => `${a.symbol} ${a.pct >= 0 ? '+' : ''}${a.pct.toFixed(1)}%`).join(', ');
  const bot3 = changes.slice(-3).map(a => `${a.symbol} ${a.pct >= 0 ? '+' : ''}${a.pct.toFixed(1)}%`).join(', ');

  return `Day ${dayIndex} — Portfolio snapshot:
Total: $${total.toFixed(0)} | Cash: $${cash.toFixed(0)} (${cashPct}%) | Invested: $${invested.toFixed(0)}
Holdings: ${holdingLines.length ? holdingLines.join('; ') : 'None'}
Best since sim start: ${top3}
Worst since sim start: ${bot3}
Starting capital: $30,000`;
}

function fallbackSimTip(sim, assets) {
  const { cash, holdings, prices } = sim;
  const invested = Object.entries(holdings).reduce(
    (sum, [sym, h]) => sum + (prices[sym] ?? 0) * h.shares, 0
  );
  const total = cash + invested;
  const cashPct = total > 0 ? cash / total : 1;
  const holdingCount = Object.keys(holdings).filter(k => holdings[k].shares > 1e-8).length;

  if (holdingCount === 0) {
    return { tip: 'You\'re holding 100% cash. A good starting point is a broad index ETF like SPY or VTI — they give instant diversification across hundreds of companies with low fees.', action: 'buy', focusAsset: 'SPY', reasoning: 'Index ETFs reduce single-stock risk for new investors.', llm: false };
  }
  if (cashPct > 0.6) {
    return { tip: `You have ${(cashPct * 100).toFixed(0)}% in cash. Consider putting some to work in diversified ETFs (SPY, QQQ, VTI). Sitting in cash means your capital isn't compounding.`, action: 'buy', focusAsset: 'SPY', reasoning: 'High cash drag reduces long-term portfolio returns.', llm: false };
  }

  // Check concentration — find largest single holding
  const byValue = Object.entries(holdings)
    .filter(([, h]) => h.shares > 1e-8)
    .map(([sym, h]) => ({ sym, val: prices[sym] * h.shares }))
    .sort((a, b) => b.val - a.val);

  if (byValue.length > 0 && byValue[0].val / total > 0.4) {
    const sym = byValue[0].sym;
    return { tip: `${sym} makes up over ${((byValue[0].val / total) * 100).toFixed(0)}% of your portfolio — that's concentrated single-stock risk. Consider trimming and spreading into index ETFs (SPY, VTI) or other sectors.`, action: 'rebalance', focusAsset: sym, reasoning: 'Concentration in one asset amplifies volatility and downside risk.', llm: false };
  }

  // Check overall P&L
  const totalCost = Object.entries(holdings)
    .filter(([, h]) => h.shares > 1e-8)
    .reduce((sum, [, h]) => sum + h.avgCost * h.shares, 0);
  const pnlPct = totalCost > 0 ? ((invested - totalCost) / totalCost) * 100 : 0;

  if (pnlPct > 15) {
    return { tip: `You\'re up ${pnlPct.toFixed(1)}% — well done! Consider taking some profits on your top gainer and rebalancing into steadier assets like GLD or bonds to lock in gains.`, action: 'rebalance', focusAsset: byValue[0]?.sym ?? null, reasoning: 'Taking profits at high gains protects against mean reversion.', llm: false };
  }
  if (pnlPct < -10) {
    return { tip: `Your portfolio is down ${Math.abs(pnlPct).toFixed(1)}%. If your thesis is unchanged, this could be a good time to dollar-cost average — buy more of your index ETFs at lower prices.`, action: 'buy', focusAsset: 'SPY', reasoning: 'Dollar-cost averaging lowers your average cost basis during downturns.', llm: false };
  }

  return { tip: 'Your portfolio looks balanced. Keep monitoring concentration and rebalance if any single position exceeds 40% of your total. Regular contributions to index ETFs tend to outperform market timing.', action: 'hold', focusAsset: null, reasoning: 'Consistency and diversification are key to long-term wealth building.', llm: false };
}

export async function getSimulatorTip(sim, assets) {
  const fallback = fallbackSimTip(sim, assets);
  const [apiKey, enabled] = await Promise.all([getOpenAIKey(), getLLMEnabled()]);
  if (!enabled || !apiKey) return fallback;

  try {
    const result = await callOpenAI(apiKey, [
      { role: 'system', content: SIM_SYSTEM_PROMPT },
      { role: 'user', content: buildSimMessage(sim, assets) },
    ]);
    return {
      tip: result.tip || fallback.tip,
      action: ['buy', 'sell', 'hold', 'rebalance', 'diversify'].includes(result.action) ? result.action : fallback.action,
      focusAsset: result.focusAsset || null,
      reasoning: result.reasoning || '',
      llm: true,
    };
  } catch (e) {
    console.warn('[LLM] Simulator tip failed:', e.message);
    return { ...fallback, llmError: e.message };
  }
}
