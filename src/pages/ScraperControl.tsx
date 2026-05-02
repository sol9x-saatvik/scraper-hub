import { useState } from "react";
import { Play, Square, Clock, Zap, BarChart3, X, Plus, AlertCircle, Globe, Loader2, Settings2, Activity, ListFilter, Users } from "lucide-react";
import { useScraperContext, type Platform } from "@/context/ScraperContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIKeywordGenerator } from "@/components/scraper/AIKeywordGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

const IG_HASHTAG_REGEX = /^[A-Za-z0-9_]+$/;
const TW_KEYWORD_REGEX = /^[A-Za-z0-9_]+$/;
const IG_PROFILE_REGEX = /^(?!.*\.$)[A-Za-z0-9._]+$/;
const TW_PROFILE_REGEX = /^[A-Za-z0-9_]+$/;

export default function ScraperControl() {
  const {
    state,
    setDuration,
    setRunInstaExplore,
    setRunTwitterHome,
    addKeyword,
    removeKeyword,
    addInstaProfile,
    removeInstaProfile,
    addTwitterProfile,
    removeTwitterProfile,
    addWebSearchKeyword,
    removeWebSearchKeyword,
    setWebSearchMaxResults,
    startScraper,
    stopScraper,
    startWebSearch,
  } = useScraperContext();

  const {
    isRunning, isWebSearchRunning, duration, runInstaExplore, runTwitterHome,
    keywords, instaProfiles, twitterProfiles, sessionStats,
    webSearchKeywords, webSearchMaxResults,
  } = state;

  const [newKeyword, setNewKeyword] = useState("");
  const [keywordPlatform, setKeywordPlatform] = useState<Platform>("INSTAGRAM");
  const [newInstaProfile, setNewInstaProfile] = useState("");
  const [newTwitterProfile, setNewTwitterProfile] = useState("");
  const [newWebSearchKeyword, setNewWebSearchKeyword] = useState("");

  const [durationStr, setDurationStr] = useState({
    hours: String(duration.hours),
    minutes: String(duration.minutes),
    seconds: String(duration.seconds),
  });

  const keywordValid = newKeyword.trim().length > 0 && (
    keywordPlatform === "INSTAGRAM"
      ? IG_HASHTAG_REGEX.test(newKeyword.trim())
      : TW_KEYWORD_REGEX.test(newKeyword.trim())
  );

  const instaProfileValid = newInstaProfile.trim().length > 0 && IG_PROFILE_REGEX.test(newInstaProfile.trim());
  const twitterProfileValid = newTwitterProfile.trim().length > 0 && TW_PROFILE_REGEX.test(newTwitterProfile.trim());

  const handleAddKeyword = () => {
    if (keywordValid) {
      addKeyword({ platform: keywordPlatform, value: newKeyword.trim() });
      setNewKeyword("");
    }
  };

  const updateDurationField = (field: "hours" | "minutes" | "seconds", val: string) => {
    if (val !== "" && !/^\d+$/.test(val)) return;
    let display = val;
    let numeric = val === "" ? 0 : parseInt(val, 10);
    if (val !== "" && (field === "minutes" || field === "seconds")) {
      numeric = Math.min(numeric, 59);
      display = String(numeric);
    }
    setDurationStr(prev => ({ ...prev, [field]: display }));
    setDuration({ ...duration, [field]: numeric });
  };

  const blurDurationField = (field: "hours" | "minutes" | "seconds") => {
    if (durationStr[field] === "") {
      setDurationStr(prev => ({ ...prev, [field]: "0" }));
    }
  };

  const totalSeconds = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
  const progressPercent = totalSeconds > 0 ? Math.min((sessionStats.elapsedTime / totalSeconds) * 100, 100) : 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  const hasTasks = runInstaExplore || runTwitterHome || keywords.length > 0 || instaProfiles.length > 0 || twitterProfiles.length > 0;
  const canStart = hasTasks && totalSeconds >= 10;
  const durationError = !isRunning && totalSeconds > 0 && totalSeconds < 10
    ? "Minimum duration is 10 seconds"
    : !isRunning && totalSeconds === 0
      ? "Set a duration greater than 0"
      : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AI OSINT Agent Control</h1>
        <p className="text-muted-foreground">Manage and monitor your automated scraping agents from a central dashboard.</p>
      </div>

      <AIKeywordGenerator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Scraper Status
            </CardTitle>
            <CardDescription>Real-time agent monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 border border-border">
              <span className={cn("h-3 w-3 rounded-full shadow-[0_0_8px_rgba(var(--success),0.5)]", isRunning ? "bg-success animate-pulse" : "bg-destructive")} />
              <span className="text-xl font-bold text-foreground">{isRunning ? "Running" : "Stopped"}</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Started At</span>
                <Badge variant="outline" className="font-mono font-normal">
                  {sessionStats.startedAt ? new Date(sessionStats.startedAt).toLocaleTimeString() : "—"}
                </Badge>
              </div>
              <Separator className="opacity-50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Duration</span>
                <span className="font-medium text-foreground">{duration.hours}h {duration.minutes}m {duration.seconds}s</span>
              </div>
              <Separator className="opacity-50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Active Tasks</span>
                <Badge variant="secondary" className="font-bold">{sessionStats.activeTasks}</Badge>
              </div>
              <Separator className="opacity-50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Posts Scraped</span>
                <span className="font-bold text-primary">{sessionStats.postsScraped}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Agent Configuration
            </CardTitle>
            <CardDescription>Configure session parameters and active modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Duration Inputs */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Session Duration</Label>
              <div className="grid grid-cols-3 gap-4">
                {(["hours", "minutes", "seconds"] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={durationStr[field]}
                      onChange={(e) => updateDurationField(field, e.target.value)}
                      onBlur={() => blurDurationField(field)}
                      disabled={isRunning}
                      className="text-center font-mono text-lg py-6"
                      placeholder="00"
                    />
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">{field}</p>
                  </div>
                ))}
              </div>
              {durationError && (
                <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {durationError}
                </div>
              )}
            </div>

            {/* Task Toggles */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Discovery Modules</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-md border border-border bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => !isRunning && setRunInstaExplore(!runInstaExplore)}>
                  <Checkbox
                    id="insta-explore"
                    checked={runInstaExplore}
                    onCheckedChange={(v) => setRunInstaExplore(!!v)}
                    disabled={isRunning}
                  />
                  <Label htmlFor="insta-explore" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Instagram Explore Feed
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-md border border-border bg-accent/20 hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => !isRunning && setRunTwitterHome(!runTwitterHome)}>
                  <Checkbox
                    id="twitter-home"
                    checked={runTwitterHome}
                    onCheckedChange={(v) => setRunTwitterHome(!!v)}
                    disabled={isRunning}
                  />
                  <Label htmlFor="twitter-home" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Twitter Home Timeline
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-2">
              <Button
                onClick={startScraper}
                disabled={isRunning || !canStart}
                className="flex-1 h-11 text-base font-semibold shadow-md bg-success hover:bg-success/90 text-success-foreground"
              >
                <Play className="h-5 w-5 mr-2 fill-current" /> Start Agents
              </Button>
              <Button
                onClick={stopScraper}
                disabled={!isRunning}
                variant="destructive"
                className="flex-1 h-11 text-base font-semibold shadow-md"
              >
                <Square className="h-5 w-5 mr-2 fill-current" /> Stop Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyword & Profile Management */}
      <Tabs defaultValue="keywords" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="keywords" className="gap-2"><ListFilter className="h-4 w-4" /> Keywords</TabsTrigger>
          <TabsTrigger value="profiles" className="gap-2"><Users className="h-4 w-4" /> Profiles</TabsTrigger>
          <TabsTrigger value="web" className="gap-2"><Globe className="h-4 w-4" /> Web Search</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Target Keywords</CardTitle>
              <CardDescription>Add specific hashtags or search terms for the agents to monitor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-48 space-y-2">
                  <Label>Platform</Label>
                  <Select value={keywordPlatform} onValueChange={(v) => setKeywordPlatform(v as Platform)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                      <SelectItem value="TWITTER">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Keyword</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="e.g. cybersecurity"
                      onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                      disabled={isRunning}
                      className={cn(newKeyword.trim() && !keywordValid && "border-destructive")}
                    />
                    <Button onClick={handleAddKeyword} disabled={isRunning || !keywordValid} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newKeyword.trim() && !keywordValid && (
                    <p className="text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Invalid format (letters, numbers, _ only)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-md bg-accent/20 border border-dashed border-border">
                {keywords.map((k, i) => (
                  <Badge key={i} variant="secondary" className="pl-1 pr-1.5 py-1 gap-2 border border-border">
                    <Badge className={cn("px-1.5 py-0 text-[9px] uppercase", k.platform === "INSTAGRAM" ? "bg-accent text-accent-foreground" : "bg-primary/20 text-primary hover:bg-primary/20")}>
                      {k.platform === "INSTAGRAM" ? "IG" : "TW"}
                    </Badge>
                    <span className="font-medium">{k.value}</span>
                    {!isRunning && (
                      <button onClick={() => removeKeyword(k.platform, k.value)} className="hover:text-destructive transition-colors rounded-full hover:bg-background p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {keywords.length === 0 && <span className="text-xs text-muted-foreground flex items-center justify-center w-full">No keywords active</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Instagram Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instagram Accounts</CardTitle>
                <CardDescription>Scrape recent posts from specific users.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newInstaProfile}
                    onChange={(e) => setNewInstaProfile(e.target.value)}
                    placeholder="Username..."
                    onKeyDown={(e) => e.key === "Enter" && instaProfileValid && !isRunning && (addInstaProfile(newInstaProfile.trim()), setNewInstaProfile(""))}
                    disabled={isRunning}
                    className={cn(newInstaProfile.trim() && !instaProfileValid && "border-destructive")}
                  />
                  <Button
                    disabled={isRunning || !instaProfileValid}
                    onClick={() => { addInstaProfile(newInstaProfile.trim()); setNewInstaProfile(""); }}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-md bg-accent/20 border border-dashed border-border min-h-[100px]">
                  {instaProfiles.map((p, i) => (
                    <Badge key={i} variant="outline" className="gap-2 bg-background font-mono">
                      <span className="text-accent font-bold">IG</span>
                      @{p}
                      {!isRunning && (
                        <button onClick={() => removeInstaProfile(p)} className="hover:text-destructive text-muted-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {instaProfiles.length === 0 && <span className="text-xs text-muted-foreground m-auto">No IG profiles</span>}
                </div>
              </CardContent>
            </Card>

            {/* Twitter Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Twitter Accounts</CardTitle>
                <CardDescription>Monitor specific Twitter handles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTwitterProfile}
                    onChange={(e) => setNewTwitterProfile(e.target.value)}
                    placeholder="Handle..."
                    onKeyDown={(e) => e.key === "Enter" && twitterProfileValid && !isRunning && (addTwitterProfile(newTwitterProfile.trim()), setNewTwitterProfile(""))}
                    disabled={isRunning}
                    className={cn(newTwitterProfile.trim() && !twitterProfileValid && "border-destructive")}
                  />
                  <Button
                    disabled={isRunning || !twitterProfileValid}
                    onClick={() => { addTwitterProfile(newTwitterProfile.trim()); setNewTwitterProfile(""); }}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-md bg-accent/20 border border-dashed border-border min-h-[100px]">
                  {twitterProfiles.map((p, i) => (
                    <Badge key={i} variant="outline" className="gap-2 bg-background font-mono">
                      <span className="text-primary font-bold">TW</span>
                      @{p}
                      {!isRunning && (
                        <button onClick={() => removeTwitterProfile(p)} className="hover:text-destructive text-muted-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {twitterProfiles.length === 0 && <span className="text-xs text-muted-foreground m-auto">No Twitter profiles</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="web">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Web Search</CardTitle>
              <CardDescription>Search for keywords across news and web sources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Web Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newWebSearchKeyword}
                      onChange={(e) => setNewWebSearchKeyword(e.target.value)}
                      placeholder="e.g. data breach report"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newWebSearchKeyword.trim()) {
                          addWebSearchKeyword(newWebSearchKeyword.trim());
                          setNewWebSearchKeyword("");
                        }
                      }}
                      disabled={isWebSearchRunning}
                    />
                    <Button
                      disabled={isWebSearchRunning || !newWebSearchKeyword.trim()}
                      onClick={() => { addWebSearchKeyword(newWebSearchKeyword.trim()); setNewWebSearchKeyword(""); }}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-full sm:w-48 space-y-2">
                  <Label>Max Results</Label>
                  <Select
                    value={String(webSearchMaxResults)}
                    onValueChange={(v) => setWebSearchMaxResults(Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 results</SelectItem>
                      <SelectItem value="10">10 results</SelectItem>
                      <SelectItem value="15">15 results</SelectItem>
                      <SelectItem value="20">20 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-md bg-accent/20 border border-dashed border-border">
                {webSearchKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="gap-2">
                    <Globe className="h-3 w-3" />
                    {kw}
                    {!isWebSearchRunning && (
                      <button onClick={() => removeWebSearchKeyword(i)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {webSearchKeywords.length === 0 && <span className="text-xs text-muted-foreground m-auto">No web keywords</span>}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={startWebSearch}
                  disabled={isWebSearchRunning || webSearchKeywords.length === 0}
                  className="w-full sm:w-auto font-bold h-11"
                  variant="secondary"
                >
                  {isWebSearchRunning
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Executing Search...</>
                    : <><Globe className="h-4 w-4 mr-2" /> Execute Web Search</>
                  }
                </Button>
                <p className="text-xs text-muted-foreground">Note: Web search executes sequentially after social media agents finish.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Session Stats */}
      <Card className="shadow-inner bg-accent/10">
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border shadow-sm">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-black text-foreground">{sessionStats.postsPerMinute} <span className="text-xs font-normal">p/m</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border shadow-sm">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Elapsed Time</p>
                <p className="text-2xl font-black text-foreground">{formatTime(sessionStats.elapsedTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border shadow-sm">
              <div className="p-2 rounded-lg bg-success/10 text-success">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Harvested</p>
                <p className="text-2xl font-black text-foreground">{sessionStats.postsScraped}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Session Progress</span>
                <Badge variant="outline" className="text-[10px]">{Math.round(progressPercent)}% Complete</Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{formatTime(sessionStats.elapsedTime)} / {formatTime(totalSeconds)}</span>
            </div>
            <Progress value={progressPercent} className="h-3 shadow-inner" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
