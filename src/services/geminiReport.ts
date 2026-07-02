import type { PreparedPost, ReportData } from "@/services/api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
export const GEMINI_REPORT_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_REPORT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: { type: "string" },
    threat_assessment: {
      type: "object",
      properties: {
        overall_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
        harmful_posts_count: { type: "integer" },
        key_concerns: { type: "array", items: { type: "string" } },
      },
      required: ["overall_level", "harmful_posts_count", "key_concerns"],
    },
    sentiment_breakdown: {
      type: "object",
      properties: {
        positive_percentage: { type: "number" },
        negative_percentage: { type: "number" },
        neutral_percentage: { type: "number" },
        dominant_emotions: { type: "array", items: { type: "string" } },
      },
      required: ["positive_percentage", "negative_percentage", "neutral_percentage", "dominant_emotions"],
    },
    key_narratives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          theme: { type: "string" },
          description: { type: "string" },
          post_count: { type: "integer" },
          example_post_ids: { type: "array", items: { type: "string" } },
        },
        required: ["theme", "description", "post_count", "example_post_ids"],
      },
    },
    notable_actors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          username: { type: "string" },
          platform: { type: "string" },
          why_notable: { type: "string" },
          suggested_action: { type: "string" },
        },
        required: ["username", "platform", "why_notable", "suggested_action"],
      },
    },
    geographic_signals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          location: { type: "string" },
          context: { type: "string" },
          post_ids: { type: "array", items: { type: "string" } },
        },
        required: ["location", "context", "post_ids"],
      },
    },
    cross_platform_patterns: { type: "string" },
    flagged_posts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          post_id: { type: "string" },
          platform: { type: "string" },
          author: { type: "string" },
          reason: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
        },
        required: ["post_id", "platform", "author", "reason", "severity"],
      },
    },
    recommended_actions: { type: "array", items: { type: "string" } },
  },
  required: [
    "executive_summary",
    "threat_assessment",
    "sentiment_breakdown",
    "key_narratives",
    "notable_actors",
    "geographic_signals",
    "cross_platform_patterns",
    "flagged_posts",
    "recommended_actions",
  ],
};

function buildPrompt(
  posts: PreparedPost[],
  meta: { keywords: string[]; platforms: string[]; sessionStart: string; sessionEnd: string }
): string {
  const compactPosts = posts.map((p) => ({
    id: p.id,
    platform: p.platform,
    source: p.source,
    keyword: p.keyword,
    author: p.author,
    authorName: p.authorName,
    content: (p.content || "").substring(0, 500),
    url: p.url,
    timestamp: p.timestamp,
    engagement: p.engagement,
  }));

  return `You are a senior OSINT intelligence analyst working for SOL9X. You have been given a batch of social media posts collected during a single scraping session across multiple platforms. Your job is to produce a comprehensive intelligence report.

SESSION CONTEXT:
- Session window: ${meta.sessionStart} to ${meta.sessionEnd}
- Platforms scraped: ${meta.platforms.join(", ") || "—"}
- Keywords monitored: ${meta.keywords.join(", ") || "—"}
- Total posts to analyze: ${posts.length}

POSTS (JSON array — each item has id, platform, source, keyword, author, authorName, content, url, timestamp, engagement):
${JSON.stringify(compactPosts)}

INSTRUCTIONS:
1. Synthesize findings ACROSS platforms — do not just summarize each platform separately. Look for narratives, actors, or events that span multiple platforms.
2. Be specific. Reference post IDs in flagged_posts, key_narratives.example_post_ids, and geographic_signals.post_ids.
3. For threat_assessment: count posts you consider harmful (extremist content, threats, coordinated disinfo, illegal activity). Pick overall_level based on the most severe content present.
4. For sentiment_breakdown: estimate percentages — they should sum to ~100.
5. For notable_actors: pick 3-8 users worth flagging. Explain WHY each is notable and suggest an action (monitor, investigate, ignore).
6. For geographic_signals: extract any mentions of countries, cities, regions. Include the post IDs that mentioned them.
7. For cross_platform_patterns: write 2-4 sentences specifically about what patterns or themes appeared on MULTIPLE platforms.
8. For flagged_posts: include only the posts that warrant analyst attention — typically 5-20 items max.
9. For recommended_actions: 3-6 concrete next steps for the analyst.

Return ONLY valid JSON. Do not include markdown fences. Do not include any text outside the JSON.`;
}

export async function generateSessionReport(
  posts: PreparedPost[],
  sessionMeta: { keywords: string[]; platforms: string[]; sessionStart: string; sessionEnd: string }
): Promise<ReportData> {
  const body = {
    contents: [{ parts: [{ text: buildPrompt(posts, sessionMeta) }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 32768,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const doFetch = async (): Promise<ReportData> => {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 60_000));
      return doFetch();
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(cleaned) as ReportData;
    } catch (e) {
      throw new Error("Gemini returned malformed JSON");
    }
  };

  return doFetch();
}
