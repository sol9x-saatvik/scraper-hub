import { useState } from "react";
import { Sparkles, X, Loader2, Target, BrainCircuit, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useScraperContext } from "@/context/ScraperContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

type TargetPlatform = "twitter" | "instagram" | "websearch";

export function AIKeywordGenerator() {
  const { addKeyword, addWebSearchKeyword } = useScraperContext();

  const [topic, setTopic] = useState("");
  const [platforms, setPlatforms] = useState<Set<TargetPlatform>>(new Set(["twitter", "instagram", "websearch"]));
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

    const prompt = `Generate 8-10 specific OSINT monitoring keywords for: ${topic.trim()}. Return ONLY a JSON array of strings.`;

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();
      const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      setChips(JSON.parse(cleaned));
    } catch (e) {
      setError("Failed to generate keywords. Verify your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  const handlePopulate = () => {
    if (chips.length === 0) return;
    const platformNames: string[] = [];
    chips.forEach((kw) => {
      if (platforms.has("instagram")) addKeyword({ platform: "INSTAGRAM", value: kw });
      if (platforms.has("twitter")) addKeyword({ platform: "TWITTER", value: kw });
      if (platforms.has("websearch")) addWebSearchKeyword(kw);
    });
    if (platforms.has("instagram")) platformNames.push("Instagram");
    if (platforms.has("twitter")) platformNames.push("Twitter");
    if (platforms.has("websearch")) platformNames.push("Web Search");
    toast.success(`${chips.length} intelligence signals added to ${platformNames.join(", ")}`);
    setChips([]);
    setTopic("");
  };

  return (
    <Card className="border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Signal Generator</CardTitle>
              <CardDescription>Leverage AI to expand your surveillance footprint.</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-black text-[10px] tracking-widest uppercase py-1 border-primary/30">Gemini 2.5 Active</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Strategic Topic / Objective</Label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Describe a topic, event, or entity to track... (e.g. State-sponsored disinformation campaigns)"
            className="bg-accent/10 border-none shadow-inner min-h-[100px] text-sm focus-visible:ring-primary/40"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Platforms</Label>
            <div className="flex flex-wrap gap-5">
              {(["twitter", "instagram", "websearch"] as const).map((id) => (
                <div key={id} className="flex items-center space-x-2 cursor-pointer group" onClick={() => togglePlatform(id)}>
                  <Checkbox checked={platforms.has(id)} className="border-primary/40 data-[state=checked]:bg-primary" />
                  <span className="text-sm font-medium capitalize group-hover:text-primary transition-colors">{id === "websearch" ? "Web Search" : id}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="h-11 px-8 font-bold gap-2 shadow-md hover:shadow-primary/20 transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Synthesizing..." : "Generate Intelligence Signals"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs">{error}</p>
          </Alert>
        )}

        {chips.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <Separator className="bg-border/50" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Draft Intelligence Signals</Label>
                <Button variant="ghost" size="sm" onClick={() => setChips([])} className="h-6 text-[10px] font-bold uppercase hover:text-destructive">Clear All</Button>
              </div>
              <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-accent/20 border border-dashed border-border/60">
                {chips.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 gap-1.5 border border-border group">
                    <span className="text-xs font-medium">{kw}</span>
                    <button onClick={() => setChips(chips.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={handlePopulate} className="bg-success hover:bg-success/90 text-success-foreground gap-2 font-bold px-8 h-10 shadow-lg">
                <CheckCircle2 className="h-4 w-4" /> Deploy to Monitoring
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
