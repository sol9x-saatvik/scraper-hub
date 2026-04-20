import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useScraperContext } from "@/context/ScraperContext";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

type TargetPlatform = "twitter" | "instagram" | "websearch";

export function AIKeywordGenerator() {
  const { addKeyword, addWebSearchKeyword } = useScraperContext();

  const [topic, setTopic] = useState("");
  const [platforms, setPlatforms] = useState<Set<TargetPlatform>>(new Set());
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (p: TargetPlatform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const canGenerate = topic.trim().length > 0 && platforms.size > 0 && !cooldown;

  const handleGenerate = async () => {
    setError(null);
    setChips([]);
    setLoading(true);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);

    const prompt = `You are a social media monitoring assistant. Generate 8-10 specific, effective search keywords for monitoring the following topic across social media platforms and the web.

Topic: ${topic.trim()}

Rules:
- Return ONLY a valid JSON array of strings, nothing else
- No explanation, no markdown, no code blocks
- Keywords should be specific and varied (include hashtags, names, phrases)
- Mix short keywords and longer phrases
- Example format: ["keyword1", "keyword2", "keyword phrase 3"]`;

    try {
      let res: Response;
      try {
        console.log("[Gemini] Calling URL:", GEMINI_URL);
        res = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });
      } catch {
        setError("Network error. Could not reach Gemini API.");
        return;
      }

      if (!res.ok) {
        if (res.status === 429) setError("Rate limit reached. Please wait a moment and try again.");
        else if (res.status === 400) setError("Invalid request. Check your API key in the .env file.");
        else if (res.status === 403) setError("API key unauthorized. Check your VITE_GEMINI_API_KEY in .env");
        else setError(`Gemini API error (status ${res.status}). Try again.`);
        return;
      }

      let keywords: string[];
      try {
        const data = await res.json();
        const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        keywords = JSON.parse(cleaned);
        if (!Array.isArray(keywords)) throw new Error();
      } catch {
        setError("Received unexpected response from Gemini. Try again.");
        return;
      }

      setChips(keywords.map((k) => String(k).trim()).filter(Boolean));
    } finally {
      setLoading(false);
    }
  };

  const removeChip = (index: number) => {
    setChips((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePopulate = () => {
    if (chips.length === 0) return;

    const platformNames: string[] = [];

    chips.forEach((kw) => {
      if (platforms.has("instagram")) {
        addKeyword({ platform: "INSTAGRAM", value: kw });
      }
      if (platforms.has("twitter")) {
        addKeyword({ platform: "TWITTER", value: kw });
      }
      if (platforms.has("websearch")) {
        addWebSearchKeyword(kw);
      }
    });

    if (platforms.has("instagram")) platformNames.push("Instagram");
    if (platforms.has("twitter")) platformNames.push("Twitter");
    if (platforms.has("websearch")) platformNames.push("Web Search");

    toast.success(`${chips.length} keywords added to ${platformNames.join(", ")}`);
    setChips([]);
    setTopic("");
  };

  const handleClear = () => {
    setChips([]);
    setTopic("");
    setError(null);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-card-foreground">AI Keyword Generator</h3>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary tracking-wide">
          AI
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Describe a topic or event to monitor... (e.g. Iran vs USA attacks)"
        className="bg-background resize-none mb-4 text-sm"
        rows={3}
        disabled={loading}
      />

      {/* Platform Checkboxes */}
      <div className="flex flex-wrap gap-4 mb-4">
        <label className="text-xs text-muted-foreground mb-0.5 w-full block">Populate platforms</label>
        {(
          [
            { id: "twitter", label: "Twitter" },
            { id: "instagram", label: "Instagram" },
            { id: "websearch", label: "Web Search" },
          ] as { id: TargetPlatform; label: string }[]
        ).map(({ id, label }) => (
          <label key={id} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={platforms.has(id)}
              onCheckedChange={() => togglePlatform(id)}
              disabled={loading}
            />
            <span className="text-sm text-card-foreground">{label}</span>
          </label>
        ))}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Keywords
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive mb-4">{error}</p>
      )}

      {/* Chips Preview */}
      {chips.length > 0 && (
        <>
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-2">
              Preview — remove any you don't want before applying
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((kw, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                >
                  {kw}
                  <button
                    onClick={() => removeChip(i)}
                    className="hover:text-destructive transition-colors ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handlePopulate}
              disabled={chips.length === 0 || platforms.size === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Populate Selected Platforms
            </Button>
            <Button variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
