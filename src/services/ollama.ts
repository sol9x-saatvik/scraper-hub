/**
 * Ollama client for per-post analysis.
 *
 * USED FOR:
 *   - Per-post AI analysis in PostModal ("Analyze This Post")
 *   - Auto-analysis pipeline (useAutoAnalyzePosts) — every scraped post is
 *     scored in the background as new posts arrive.
 *
 * NOT USED FOR:
 *   - Session Report generation → src/services/geminiReport.ts (Gemini)
 *   - Investigate page → uses Gemini
 *   - AI keyword generation → src/components/scraper/AIKeywordGenerator.tsx (Gemini)
 *
 * PREREQUISITE:
 *   Ollama must be running locally with the qwen2.5:7b model installed.
 *   Install:  `ollama pull qwen2.5:7b`
 *   Start:    Ollama runs automatically on Windows/macOS after install; the
 *             API listens on http://localhost:11434 by default.
 *
 * ENV:
 *   VITE_OLLAMA_URL   (default http://localhost:11434)
 *   VITE_OLLAMA_MODEL (default qwen2.5:7b)
 */

const OLLAMA_URL = (import.meta.env.VITE_OLLAMA_URL as string) || "http://localhost:11434";
export const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string) || "qwen2.5:7b";

export interface OllamaPostAnalysis {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  sentiment_score: number;
  harmful: boolean;
  harmful_reason: string | null;
  threat_level: "low" | "medium" | "high" | "critical";
  summary: string;
  emotions: string[];
  toxicity_score: number;
  fake_account_probability: number;
  geographic_signals: string[];
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

export interface OllamaHealth {
  available: boolean;
  model: string;
  error?: string;
}

interface PostInput {
  content: string;
  author?: string;
  platform?: string;
  engagement?: { likes?: number; comments?: number; shares?: number; views?: number };
}

const FOCUS_HINTS = [
  "the emotional tone and word choice",
  "any explicit threats, calls to action, or coordination signals",
  "the author's likely intent and target audience",
  "linguistic markers (repetition, hashtag stuffing, template phrasing) that suggest a bot or coordinated account",
  "sarcasm, irony, or subtext that shifts the surface meaning",
  "specific named entities, places, or events referenced",
];

function buildAnalysisPrompt(post: PostInput): string {
  const focus = FOCUS_HINTS[Math.floor(Math.random() * FOCUS_HINTS.length)];
  return `You are an OSINT analyst. Analyze the SPECIFIC post below and return ONLY valid JSON.
Every field must reflect what THIS post actually says — do not produce a generic template.

Focus this analysis on: ${focus}.

POST:
Platform: ${post.platform || "unknown"}
Author: ${post.author || "unknown"}
Content: """${post.content}"""
Engagement: likes=${post.engagement?.likes || 0}, comments=${post.engagement?.comments || 0}, shares=${post.engagement?.shares || 0}, views=${post.engagement?.views || 0}

Return JSON with EXACTLY these fields:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentiment_score": <0-100, higher = more positive>,
  "harmful": <true if content is threatening, extremist, promotes violence, illegal activity, or dangerous>,
  "harmful_reason": <string explaining why, or null>,
  "threat_level": "low" | "medium" | "high" | "critical",
  "summary": <1-2 sentence plain english summary that QUOTES OR PARAPHRASES the actual content of THIS post>,
  "emotions": <array of up to 3 dominant emotions from: anger, fear, joy, sadness, disgust, surprise, hope, hate>,
  "toxicity_score": <0-100, higher = more toxic>,
  "fake_account_probability": <0-100 — likelihood this is from a bot/fake account based on content style, repetition, and phrasing>,
  "geographic_signals": <array of locations/countries/regions mentioned in the post, empty array if none>
}

Return ONLY the JSON. No markdown, no explanation.`;
}

/** Stable positive int derived from the post content — used as an Ollama seed
 *  so different posts land in different sampling regions of the model. */
function contentSeed(content: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 2147483647;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeAnalysis(raw: any): OllamaPostAnalysis {
  const validSentiments = ["positive", "negative", "neutral", "mixed"] as const;
  const validThreats = ["low", "medium", "high", "critical"] as const;
  const sentiment = validSentiments.includes(raw?.sentiment) ? raw.sentiment : "neutral";
  const threat = validThreats.includes(raw?.threat_level) ? raw.threat_level : "low";

  return {
    sentiment,
    sentiment_score: clamp(Number(raw?.sentiment_score) || 50, 0, 100),
    harmful: Boolean(raw?.harmful),
    harmful_reason: raw?.harmful_reason || null,
    threat_level: threat,
    summary: typeof raw?.summary === "string" ? raw.summary : "",
    emotions: Array.isArray(raw?.emotions) ? raw.emotions.slice(0, 3).map(String) : [],
    toxicity_score: clamp(Number(raw?.toxicity_score) || 0, 0, 100),
    fake_account_probability: clamp(Number(raw?.fake_account_probability) || 0, 0, 100),
    geographic_signals: Array.isArray(raw?.geographic_signals) ? raw.geographic_signals.map(String) : [],
  };
}

/**
 * Extract the JSON object from a raw Ollama response. Handles common cases
 * where the model wraps output in prose or markdown fences despite
 * format:"json".
 */
function extractJson(raw: string): any {
  const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: find first { ... last }
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.substring(first, last + 1));
    }
    throw new Error("Ollama returned unparseable JSON");
  }
}

export async function analyzePostWithOllama(post: PostInput): Promise<OllamaPostAnalysis> {
  if (!post.content || !post.content.trim()) {
    throw new Error("Ollama: refusing to analyze empty post content");
  }

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: buildAnalysisPrompt(post),
      format: "json",
      stream: false,
      options: {
        temperature: 0.5,
        top_p: 0.9,
        seed: contentSeed(post.content),
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ollama request failed: ${response.status}${text ? ` - ${text}` : ""}`);
  }

  const data: OllamaGenerateResponse = await response.json();
  const parsed = extractJson(data.response ?? "");
  return normalizeAnalysis(parsed);
}

export async function checkOllamaHealth(): Promise<OllamaHealth> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { available: false, model: OLLAMA_MODEL, error: `Status ${res.status}` };
    const data = await res.json();
    const hasModel = Array.isArray(data.models) && data.models.some((m: any) => m?.name === OLLAMA_MODEL);
    if (!hasModel) {
      return {
        available: false,
        model: OLLAMA_MODEL,
        error: `Model ${OLLAMA_MODEL} not installed. Run: ollama pull ${OLLAMA_MODEL}`,
      };
    }
    return { available: true, model: OLLAMA_MODEL };
  } catch {
    return {
      available: false,
      model: OLLAMA_MODEL,
      error: "Ollama not running. Start Ollama on localhost:11434",
    };
  }
}
