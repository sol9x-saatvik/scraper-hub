import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Check, ChevronDown, ChevronUp, X, Save, Play, RotateCcw, Search, Sparkles, AlertCircle, Info, ShieldAlert, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScraperContext } from "@/context/ScraperContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const OSINT_KEY = "osint_investigations";

interface Question { question: string; answer: string; }
interface ResearchStep { step: number; title: string; description: string; platform: string; keywords: string[]; priority: "High" | "Medium" | "Low"; }
interface Plan { investigationTitle: string; summary: string; threatLevel: "Low" | "Medium" | "High" | "Critical"; platforms: string[]; twitterKeywords: string[]; instagramKeywords: string[]; redditKeywords: string[]; webSearchKeywords: string[]; targetProfiles: { twitter: string[]; instagram: string[] }; researchSteps: ResearchStep[]; expectedFindings: string; risks: string; }
interface SavedInvestigation { id: string; title: string; query: string; threatLevel: string; plan: Plan; savedAt: string; }

const EXAMPLES = ["Cyber espionage campaigns", "Disinformation networks in elections", "Drug trafficking logistics", "Financial fraud syndicates"];

const THREAT_BADGE_STYLES: Record<string, string> = {
  Low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  High: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Critical: "bg-destructive/10 text-destructive border-destructive/20 animate-pulse",
};

const PLATFORM_COLORS: Record<string, string> = {
  Twitter: "bg-sky-500/10 text-sky-600",
  Instagram: "bg-pink-500/10 text-pink-600",
  Reddit: "bg-orange-500/10 text-orange-600",
  Web: "bg-indigo-500/10 text-indigo-600",
};

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (res.status === 429) throw new Error("Rate limited. Please wait.");
  if (!res.ok) throw new Error("Gemini API error.");
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
  const [kwSelections, setKwSelections] = useState<Record<string, Set<string>>>({
    Twitter: new Set(), Instagram: new Set(), Reddit: new Set(), Web: new Set(),
  });
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
    if (!query.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const raw = await callGemini(`OSINT analyst task: Generate 5 clarifying questions for investigation on "${query}". Return ONLY JSON array of {"question": string, "answer": ""}.`);
      setQuestions(JSON.parse(raw));
      setStep(2);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function generatePlan() {
    setLoading(true);
    setErr(null);
    try {
      const prompt = `Generate a detailed OSINT research plan JSON for query: "${query}" with these answers: ${JSON.stringify(questions)}. Include investigationTitle, summary, threatLevel, twitterKeywords, instagramKeywords, redditKeywords, webSearchKeywords, targetProfiles: {twitter: [], instagram: []}, researchSteps: [{step, title, description, platform, keywords, priority}], expectedFindings, risks.`;
      const raw = await callGemini(prompt);
      const p: Plan = JSON.parse(raw);
      setPlan(p);
      setTwKws([...(p.twitterKeywords ?? [])]);
      setIgKws([...(p.instagramKeywords ?? [])]);
      setRdKws([...(p.redditKeywords ?? [])]);
      setWebKws([...(p.webSearchKeywords ?? [])]);
      setSelectedSteps(new Set((p.researchSteps ?? []).filter(s => s.priority === "High").map(s => s.step)));
      setSelTwProfiles(new Set(p.targetProfiles?.twitter ?? []));
      setSelIgProfiles(new Set(p.targetProfiles?.instagram ?? []));
      setStep(3);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  function saveInvestigation() {
    if (!plan) return;
    const inv: SavedInvestigation = { id: Date.now().toString(), title: plan.investigationTitle, query, threatLevel: plan.threatLevel, plan, savedAt: new Date().toISOString() };
    const next = [inv, ...saved];
    setSaved(next);
    localStorage.setItem(OSINT_KEY, JSON.stringify(next));
    toast.success("Intelligence profile archived");
  }

  function toggleKwSel(platform: string, kw: string) {
    setKwSelections(prev => {
      const next = new Set(prev[platform]);
      next.has(kw) ? next.delete(kw) : next.add(kw);
      return { ...prev, [platform]: next };
    });
  }

  function removeKwSelected(platform: string, kwList: string[], setter: (v: string[]) => void) {
    const sel = kwSelections[platform];
    setter(kwList.filter(k => !sel.has(k)));
    setKwSelections(prev => ({ ...prev, [platform]: new Set() }));
  }

  function executeInvestigation() {
    twKws.forEach(kw => addKeyword({ platform: "TWITTER", value: kw }));
    igKws.forEach(kw => addKeyword({ platform: "INSTAGRAM", value: kw }));
    rdKws.forEach(kw => addKeyword({ platform: "REDDIT", value: kw }));
    webKws.forEach(kw => addWebSearchKeyword(kw));
    selTwProfiles.forEach(p => addTwitterProfile(p));
    selIgProfiles.forEach(p => addInstaProfile(p));
    toast.success("Operational parameters synchronized");
    navigate("/scraper");
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigative AI</h1>
          <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest font-semibold opacity-70">Strategic Intelligence Workflow</p>
        </div>
        {saved.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPast(!showPast)}>
            <History className="h-4 w-4" /> Archives
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                step === s ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-110" :
                step > s ? "bg-success border-success text-success-foreground" :
                "bg-background border-muted text-muted-foreground"
              )}>
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              <span className={cn("text-[10px] font-black uppercase tracking-wider", step === s ? "text-primary" : "text-muted-foreground")}>
                {s === 1 ? "Initialization" : s === 2 ? "Intelligence" : "Strategic Plan"}
              </span>
            </div>
            {s < 3 && <div className={cn("h-[1px] flex-1 mx-2", step > s ? "bg-success" : "bg-muted")} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Initialization */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-accent/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Define Investigation
            </CardTitle>
            <CardDescription>Input your surveillance target or investigation focus.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Textarea 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="e.g. Analysis of geopolitical influence operations in Southeast Asia..." 
              className="min-h-[160px] text-base bg-background/50 border-border/40 focus:ring-primary shadow-inner"
            />
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Strategic Templates</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map(ex => (
                  <Badge key={ex} variant="secondary" className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors px-3 py-1" onClick={() => setQuery(ex)}>
                    {ex}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-accent/5 border-t py-4">
            <Button onClick={beginInvestigation} disabled={!query.trim() || loading} className="w-full h-12 text-base font-bold gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-5 w-5" /> Initiate Intelligence Sweep</>}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Clarification */}
      {step === 2 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intelligence Gathering</h2>
            <Badge variant="outline" className="font-mono">{questions.filter(q => q.answer).length} / {questions.length} COMPLETE</Badge>
          </div>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={i} className={cn("transition-all border-l-4", q.answer ? "border-l-success" : "border-l-primary/40")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                    <CardTitle className="text-sm font-semibold leading-relaxed">{q.question}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input 
                    value={q.answer} 
                    onChange={e => {
                      const upd = [...questions];
                      upd[i].answer = e.target.value;
                      setQuestions(upd);
                    }} 
                    placeholder="Provide details..." 
                    className="bg-accent/10 border-none shadow-inner h-10"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="px-8">Back</Button>
            <Button onClick={generatePlan} disabled={loading} className="flex-1 h-12 text-base font-bold gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5" /> Formulate Strategic Plan</>}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Plan */}
      {step === 3 && plan && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <Card className="border-primary/20 shadow-2xl">
            <CardHeader className="bg-primary/5 border-b pb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Badge className={cn("font-black uppercase text-[10px] px-2 py-0.5", THREAT_BADGE_STYLES[plan.threatLevel])}>
                    {plan.threatLevel} THREAT LEVEL
                  </Badge>
                  <CardTitle className="text-3xl font-black text-foreground">{plan.investigationTitle}</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={saveInvestigation} className="gap-2 bg-background">
                  <Save className="h-4 w-4" /> Archive Profile
                </Button>
              </div>
              <CardDescription className="text-base text-foreground/70 leading-relaxed mt-4">{plan.summary}</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Steps */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Operational Phases</h3>
                <div className="space-y-4">
                  {plan.researchSteps.map(s => (
                    <div key={s.step} className={cn("flex gap-4 p-4 rounded-xl border transition-all", selectedSteps.has(s.step) ? "bg-primary/[0.03] border-primary/30 shadow-sm" : "bg-accent/5 border-border/50 opacity-60")}>
                      <Checkbox 
                        checked={selectedSteps.has(s.step)} 
                        onCheckedChange={checked => {
                          const nxt = new Set(selectedSteps);
                          checked ? nxt.add(s.step) : nxt.delete(s.step);
                          setSelectedSteps(nxt);
                        }} 
                        className="mt-1"
                      />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded">PHASE {s.step}</span>
                          <span className="text-sm font-bold">{s.title}</span>
                          <Badge variant="secondary" className={cn("text-[9px] uppercase font-black", PLATFORM_COLORS[s.platform])}>{s.platform}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Target Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { p: "Twitter", k: twKws, sk: setTwKws },
                      { p: "Instagram", k: igKws, sk: setIgKws },
                      { p: "Reddit", k: rdKws, sk: setRdKws },
                      { p: "Web", k: webKws, sk: setWebKws }
                    ].map(col => (
                      <div key={col.p} className="p-4 rounded-xl bg-accent/10 border border-border/40">
                        {/* Header row: Select All + platform label + count */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              checked={col.k.length > 0 && kwSelections[col.p].size === col.k.length}
                              onCheckedChange={(checked) =>
                                setKwSelections(prev => ({
                                  ...prev,
                                  [col.p]: checked ? new Set(col.k) : new Set(),
                                }))
                              }
                              className="h-3 w-3"
                            />
                            <span className={cn("text-[10px] font-black uppercase tracking-wider", PLATFORM_COLORS[col.p])}>{col.p}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px]">{col.k.length}</Badge>
                        </div>
                        {/* Remove Selected button */}
                        {kwSelections[col.p].size > 0 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full mb-2 h-6 text-[10px] px-2"
                            onClick={() => removeKwSelected(col.p, col.k, col.sk)}
                          >
                            Remove {kwSelections[col.p].size} selected
                          </Button>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {col.k.map(kw => (
                            <Badge key={kw} variant="secondary" className="text-[10px] font-medium bg-background border-border/40 py-0.5 pl-1 pr-1 gap-1 flex items-center">
                              <Checkbox
                                checked={kwSelections[col.p].has(kw)}
                                onCheckedChange={() => toggleKwSel(col.p, kw)}
                                className="h-3 w-3 shrink-0"
                              />
                              {kw}
                              <X className="h-2.5 w-2.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => col.sk(col.k.filter(k => k !== kw))} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/20">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-2">Expected Yield</h4>
                    <p className="text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">{plan.expectedFindings}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-destructive/[0.03] border border-destructive/20">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-destructive mb-2">Operational Risks</h4>
                    <p className="text-xs leading-relaxed text-destructive/90">{plan.risks}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-primary/5 border-t p-6">
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Signals</p>
                    <p className="text-xl font-bold">{twKws.length + igKws.length + rdKws.length + webKws.length}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Identities</p>
                    <p className="text-xl font-bold">{selTwProfiles.size + selIgProfiles.size}</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2 h-11 px-6">
                    <RotateCcw className="h-4 w-4" /> New Task
                  </Button>
                  <Button onClick={executeInvestigation} className="flex-1 sm:flex-none h-11 px-10 text-base font-bold gap-2 shadow-lg">
                    <Play className="h-4 w-4 fill-current" /> Deploy Strategic Agents
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Archives Section */}
      {showPast && saved.length > 0 && (
        <div className="animate-in slide-in-from-bottom-5 duration-300">
          <Separator className="my-8" />
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Investigation Archives
          </h2>
          <ScrollArea className="h-[400px] rounded-xl border border-border/50 bg-accent/5 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saved.map(inv => (
                <Card key={inv.id} className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-md group" onClick={() => { setQuery(inv.query); setPlan(inv.plan); setStep(3); setShowPast(false); }}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <Badge className={cn("text-[9px] font-black uppercase", THREAT_BADGE_STYLES[inv.threatLevel])}>{inv.threatLevel}</Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">{new Date(inv.savedAt).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{inv.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{inv.query}"</p>
                  </CardContent>
                  <CardFooter className="pt-0 justify-end">
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
