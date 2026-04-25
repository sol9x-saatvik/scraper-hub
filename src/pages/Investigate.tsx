import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Check, ChevronDown, ChevronUp, X, Save, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScraperContext } from "@/context/ScraperContext";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const OSINT_KEY = "osint_investigations";

interface Question {
  question: string;
  answer: string;
}

interface ResearchStep {
  step: number;
  title: string;
  description: string;
  platform: string;
  keywords: string[];
  priority: "High" | "Medium" | "Low";
}

interface Plan {
  investigationTitle: string;
  summary: string;
  threatLevel: "Low" | "Medium" | "High" | "Critical";
  platforms: string[];
  twitterKeywords: string[];
  instagramKeywords: string[];
  redditKeywords: string[];
  webSearchKeywords: string[];
  targetProfiles: { twitter: string[]; instagram: string[] };
  researchSteps: ResearchStep[];
  expectedFindings: string;
  risks: string;
}

interface SavedInvestigation {
  id: string;
  title: string;
  query: string;
  threatLevel: string;
  plan: Plan;
  savedAt: string;
}

const EXAMPLES = [
  "Iran nuclear activity",
  "Drug trafficking Venezuela",
  "Cybercrime groups telegram",
];

const THREAT_CLS: Record<string, string> = {
  Low: "bg-green-500/15 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  High: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Critical: "bg-red-500/15 text-red-400 border-red-500/30 animate-pulse",
};

const PLAT_CLS: Record<string, string> = {
  Twitter: "bg-sky-500/15 text-sky-400",
  Instagram: "bg-pink-500/15 text-pink-400",
  Reddit: "bg-orange-500/15 text-orange-400",
  Web: "bg-violet-500/15 text-violet-400",
  "Web Search": "bg-violet-500/15 text-violet-400",
};

const PRIO_CLS: Record<string, string> = {
  High: "bg-orange-500/15 text-orange-400",
  Medium: "bg-yellow-500/15 text-yellow-400",
  Low: "bg-blue-500/15 text-blue-400",
};

function ThreatBadge({ level }: { level: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      THREAT_CLS[level] ?? "bg-muted text-muted-foreground border-border"
    )}>
      {level}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      PLAT_CLS[platform] ?? "bg-muted text-muted-foreground"
    )}>
      {platform}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      PRIO_CLS[priority] ?? "bg-muted text-muted-foreground"
    )}>
      {priority}
    </span>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: "Define Query" },
    { n: 2 as const, label: "Clarify" },
    { n: 3 as const, label: "Research Plan" },
  ];
  return (
    <div className="flex items-center justify-center">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              current > s.n
                ? "bg-primary text-primary-foreground"
                : current === s.n
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            )}>
              {current > s.n ? <Check className="h-4 w-4" /> : s.n}
            </div>
            <span className={cn(
              "text-xs font-medium whitespace-nowrap",
              current === s.n ? "text-primary" : current > s.n ? "text-foreground" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
          </div>
          {i < 2 && (
            <div className={cn(
              "h-[2px] w-16 mx-3 mb-5 transition-colors",
              current > i + 1 ? "bg-primary" : "bg-border"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (res.status === 429) throw new Error("Rate limited. Please wait a moment and try again.");
  if (!res.ok) throw new Error("Gemini API error. Check your API key and try again.");
  const data = await res.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
}

export default function Investigate() {
  const navigate = useNavigate();
  const { addKeyword, addWebSearchKeyword, addInstaProfile, addTwitterProfile } = useScraperContext();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [query, setQuery] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [twKws, setTwKws] = useState<string[]>([]);
  const [igKws, setIgKws] = useState<string[]>([]);
  const [rdKws, setRdKws] = useState<string[]>([]);
  const [webKws, setWebKws] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<Set<number>>(new Set());
  const [selTwProfiles, setSelTwProfiles] = useState<Set<string>>(new Set());
  const [selIgProfiles, setSelIgProfiles] = useState<Set<string>>(new Set());

  const [saved, setSaved] = useState<SavedInvestigation[]>([]);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(OSINT_KEY);
      if (s) setSaved(JSON.parse(s));
    } catch {}
  }, []);

  async function beginInvestigation() {
    setLoading(true);
    setErr(null);
    try {
      const raw = await callGemini(
        `You are an expert OSINT analyst. The user wants to investigate the following topic: "${query}"

Generate exactly 5 clarifying questions to better understand the scope, target, and focus of this investigation. These questions should help identify the exact area for research and monitoring across social media platforms (Instagram, Twitter, Reddit), web search, and open sources.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {"question": "Question text here", "answer": ""},
  ...
]`
      );
      const parsed: Question[] = JSON.parse(raw);
      setQuestions(parsed.map(q => ({ question: q.question, answer: "" })));
      setStep(2);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    setLoading(true);
    setErr(null);
    try {
      const raw = await callGemini(
        `You are an expert OSINT analyst. Generate a detailed research and monitoring plan based on the following:

Initial Query: "${query}"

Clarification Q&A:
${questions.map(q => `Q: ${q.question}\nA: ${q.answer || "Not specified"}`).join("\n\n")}

Generate a comprehensive OSINT research plan. Return ONLY a valid JSON object:
{
  "investigationTitle": "Short title for this investigation",
  "summary": "2-3 sentence overview of what will be investigated and why",
  "threatLevel": "Low",
  "platforms": ["Twitter", "Instagram", "Reddit", "Web"],
  "twitterKeywords": ["keyword1", "keyword2"],
  "instagramKeywords": ["keyword1", "keyword2"],
  "redditKeywords": ["keyword1", "keyword2"],
  "webSearchKeywords": ["keyword1", "keyword2"],
  "targetProfiles": {
    "twitter": ["handle1"],
    "instagram": ["username1"]
  },
  "researchSteps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "What to do and why",
      "platform": "Twitter",
      "keywords": ["kw1"],
      "priority": "High"
    }
  ],
  "expectedFindings": "What kind of information this investigation is expected to surface",
  "risks": "Potential risks or limitations of this investigation"
}`
      );
      const p: Plan = JSON.parse(raw);
      setPlan(p);
      setTwKws([...(p.twitterKeywords ?? [])]);
      setIgKws([...(p.instagramKeywords ?? [])]);
      setRdKws([...(p.redditKeywords ?? [])]);
      setWebKws([...(p.webSearchKeywords ?? [])]);
      setSelectedSteps(new Set(
        (p.researchSteps ?? []).filter(s => s.priority === "High").map(s => s.step)
      ));
      setSelTwProfiles(new Set(p.targetProfiles?.twitter ?? []));
      setSelIgProfiles(new Set(p.targetProfiles?.instagram ?? []));
      setStep(3);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate research plan.");
    } finally {
      setLoading(false);
    }
  }

  function saveInvestigation() {
    if (!plan) return;
    const inv: SavedInvestigation = {
      id: Date.now().toString(),
      title: plan.investigationTitle,
      query,
      threatLevel: plan.threatLevel,
      plan,
      savedAt: new Date().toISOString(),
    };
    const next = [inv, ...saved];
    setSaved(next);
    try { localStorage.setItem(OSINT_KEY, JSON.stringify(next)); } catch {}
    toast.success("Investigation saved.");
  }

  function loadInvestigation(inv: SavedInvestigation) {
    setQuery(inv.query);
    setPlan(inv.plan);
    setTwKws([...(inv.plan.twitterKeywords ?? [])]);
    setIgKws([...(inv.plan.instagramKeywords ?? [])]);
    setRdKws([...(inv.plan.redditKeywords ?? [])]);
    setWebKws([...(inv.plan.webSearchKeywords ?? [])]);
    setSelectedSteps(new Set(
      (inv.plan.researchSteps ?? []).filter(s => s.priority === "High").map(s => s.step)
    ));
    setSelTwProfiles(new Set(inv.plan.targetProfiles?.twitter ?? []));
    setSelIgProfiles(new Set(inv.plan.targetProfiles?.instagram ?? []));
    setStep(3);
  }

  function executeInvestigation() {
    twKws.forEach(kw => addKeyword({ platform: "TWITTER", value: kw }));
    igKws.forEach(kw => addKeyword({ platform: "INSTAGRAM", value: kw }));
    rdKws.forEach(kw => addKeyword({ platform: "REDDIT", value: kw }));
    webKws.forEach(kw => addWebSearchKeyword(kw));
    selTwProfiles.forEach(p => addTwitterProfile(p));
    selIgProfiles.forEach(p => addInstaProfile(p));
    toast.success("Investigation loaded into Scraper Control. Review and start when ready.");
    navigate("/scraper");
  }

  function reset() {
    setStep(1);
    setQuery("");
    setQuestions([]);
    setPlan(null);
    setErr(null);
  }

  const answeredCnt = questions.filter(q => q.answer.trim() && q.answer !== "Not specified").length;
  const totalKws = twKws.length + igKws.length + rdKws.length + webKws.length;
  const totalProfiles = selTwProfiles.size + selIgProfiles.size;
  const activePlatforms = [
    twKws.length > 0 || selTwProfiles.size > 0,
    igKws.length > 0 || selIgProfiles.size > 0,
    rdKws.length > 0,
    webKws.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-semibold">OSINT Investigation</h1>
        <p className="text-sm text-muted-foreground">AI-guided open-source intelligence workflow</p>
      </div>

      <Stepper current={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-border bg-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Define Your Investigation</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Describe the topic, entity, or event you want to investigate
              </p>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Describe what you want to investigate..."
              rows={5}
              className="w-full bg-background border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setQuery(ex)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-foreground hover:bg-accent/80 border border-border transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <button
              onClick={beginInvestigation}
              disabled={!query.trim() || loading}
              className="w-full py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing query...</>
                : "Begin Investigation"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Clarify Your Investigation</h2>
              <p className="text-sm text-muted-foreground">Answer questions to focus the research plan</p>
            </div>
            <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {answeredCnt} / {questions.length} answered
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => {
              const skipped = q.answer === "Not specified";
              return (
                <div key={i} className={cn(
                  "rounded-lg border bg-card p-4 space-y-3 transition-colors",
                  skipped ? "border-border/50 opacity-60" : "border-border"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className={cn(
                        "flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                        skipped ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                      )}>
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                    </div>
                    <button
                      onClick={() => {
                        const upd = [...questions];
                        upd[i] = { ...upd[i], answer: skipped ? "" : "Not specified" };
                        setQuestions(upd);
                      }}
                      className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border transition-colors"
                    >
                      {skipped ? "Unskip" : "Skip"}
                    </button>
                  </div>
                  {!skipped ? (
                    <input
                      value={q.answer}
                      onChange={e => {
                        const upd = [...questions];
                        upd[i] = { ...upd[i], answer: e.target.value };
                        setQuestions(upd);
                      }}
                      placeholder="Your answer..."
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic pl-8">Will use "Not specified"</p>
                  )}
                </div>
              );
            })}
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setErr(null); }}
              className="px-4 py-2.5 rounded-md text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Back
            </button>
            <button
              onClick={generatePlan}
              disabled={loading}
              className="flex-1 py-2.5 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Generating plan...</>
                : "Generate Research Plan"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && plan && (
        <div className="space-y-6">
          {/* Header card */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-bold text-foreground">{plan.investigationTitle}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.summary}</p>
              </div>
              <button
                onClick={saveInvestigation}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Save className="h-4 w-4" />Save
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Threat:</span>
              <ThreatBadge level={plan.threatLevel} />
              <span className="text-xs text-muted-foreground ml-2">Platforms:</span>
              {(plan.platforms ?? []).map(p => <PlatformBadge key={p} platform={p} />)}
            </div>
          </div>

          {/* Research steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Research Steps
            </h3>
            {(plan.researchSteps ?? []).map(s => (
              <div key={s.step} className={cn(
                "rounded-lg border bg-card p-4 space-y-2.5 transition-colors",
                selectedSteps.has(s.step) ? "border-primary/40 bg-primary/[0.02]" : "border-border"
              )}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSteps.has(s.step)}
                    onChange={e => {
                      const nxt = new Set(selectedSteps);
                      e.target.checked ? nxt.add(s.step) : nxt.delete(s.step);
                      setSelectedSteps(nxt);
                    }}
                    className="mt-1 h-4 w-4 cursor-pointer accent-primary flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">STEP {s.step}</span>
                      <span className="text-sm font-semibold text-foreground">{s.title}</span>
                      <PlatformBadge platform={s.platform} />
                      <PriorityBadge priority={s.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                    {(s.keywords ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.keywords.map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Keywords
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { platform: "Twitter", kws: twKws, setKws: setTwKws, orig: plan.twitterKeywords ?? [] },
                { platform: "Instagram", kws: igKws, setKws: setIgKws, orig: plan.instagramKeywords ?? [] },
                { platform: "Reddit", kws: rdKws, setKws: setRdKws, orig: plan.redditKeywords ?? [] },
                { platform: "Web", kws: webKws, setKws: setWebKws, orig: plan.webSearchKeywords ?? [] },
              ].map(col => (
                <div key={col.platform} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <PlatformBadge platform={col.platform} />
                    <div className="flex gap-2">
                      <button
                        onClick={() => col.setKws([...col.orig])}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        All
                      </button>
                      <span className="text-muted-foreground/40 text-xs">|</span>
                      <button
                        onClick={() => col.setKws([])}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] content-start">
                    {col.kws.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">None selected</span>
                    ) : (
                      col.kws.map(kw => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs text-foreground"
                        >
                          {kw}
                          <button
                            onClick={() => col.setKws(col.kws.filter(k => k !== kw))}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target profiles */}
          {((plan.targetProfiles?.twitter?.length ?? 0) > 0 ||
            (plan.targetProfiles?.instagram?.length ?? 0) > 0) && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Target Profiles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(plan.targetProfiles?.twitter ?? []).length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <PlatformBadge platform="Twitter" />
                    <div className="space-y-1.5">
                      {plan.targetProfiles.twitter.map(handle => (
                        <label key={handle} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selTwProfiles.has(handle)}
                            onChange={e => {
                              const nxt = new Set(selTwProfiles);
                              e.target.checked ? nxt.add(handle) : nxt.delete(handle);
                              setSelTwProfiles(nxt);
                            }}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                            @{handle}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {(plan.targetProfiles?.instagram ?? []).length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <PlatformBadge platform="Instagram" />
                    <div className="space-y-1.5">
                      {plan.targetProfiles.instagram.map(username => (
                        <label key={username} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selIgProfiles.has(username)}
                            onChange={e => {
                              const nxt = new Set(selIgProfiles);
                              e.target.checked ? nxt.add(username) : nxt.delete(username);
                              setSelIgProfiles(nxt);
                            }}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                            @{username}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expected findings & risks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Expected Findings
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{plan.expectedFindings}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Risks & Limitations
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{plan.risks}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── PAST INVESTIGATIONS ── */}
      {saved.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowPast(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/30 transition-colors"
          >
            <span>Past Investigations ({saved.length})</span>
            {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showPast && (
            <div className="border-t border-border p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {saved.map(inv => (
                <div
                  key={inv.id}
                  className="rounded-md border border-border bg-background p-3 space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">
                      {inv.title}
                    </p>
                    <ThreatBadge level={inv.threatLevel} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{inv.query}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(inv.savedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => loadInvestigation(inv)}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Load →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STICKY ACTION BAR (Step 3 only) ── */}
      {step === 3 && plan && (
        <div className="sticky bottom-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalKws}</span> keywords and{" "}
              <span className="font-semibold text-foreground">{totalProfiles}</span> profiles selected
              across{" "}
              <span className="font-semibold text-foreground">{activePlatforms}</span> platforms
            </p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Investigation
              </button>
              <button
                onClick={executeInvestigation}
                className="flex items-center gap-1.5 px-5 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                Execute Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
