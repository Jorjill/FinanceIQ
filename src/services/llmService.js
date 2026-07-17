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
