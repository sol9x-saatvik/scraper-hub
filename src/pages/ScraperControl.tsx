import { useState } from "react";
import { Play, Square, Clock, Zap, BarChart3, X, Plus } from "lucide-react";
import { useScraperContext, type Platform } from "@/context/ScraperContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ScraperControl() {
  const { platforms, setDuration, addKeyword, removeKeyword, startScraper, stopScraper } = useScraperContext();
  const [activePlatform, setActivePlatform] = useState<Platform>("twitter");
  const [newKeyword, setNewKeyword] = useState("");

  const state = platforms[activePlatform];
  const { isRunning, duration, keywords, sessionStats } = state;

  const handleAddKeyword = () => {
    const k = newKeyword.trim();
    if (k) {
      addKeyword(activePlatform, k);
      setNewKeyword("");
    }
  };

  const updateDurationField = (field: "hours" | "minutes" | "seconds", val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0) {
      setDuration(activePlatform, { ...duration, [field]: n });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Scraper Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and monitor the scraping engine</p>
      </div>

      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
        <TabsList>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-1">
          <h3 className="text-sm font-medium text-card-foreground mb-4">
            {activePlatform === "twitter" ? "Twitter" : "Instagram"} Status
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <span className={cn("h-3 w-3 rounded-full", isRunning ? "bg-success animate-pulse-slow" : "bg-destructive")} />
            <span className="text-lg font-semibold text-card-foreground">{isRunning ? "Running" : "Stopped"}</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started at</span>
              <span className="text-card-foreground font-mono text-xs">
                {sessionStats.startedAt ? new Date(sessionStats.startedAt).toLocaleTimeString() : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-card-foreground">{duration.hours}h {duration.minutes}m {duration.seconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Posts scraped</span>
              <span className="text-card-foreground font-semibold">{sessionStats.postsScraped}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Controls</h3>

          {/* Duration Inputs */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground mb-1.5 block">Duration</label>
            <div className="grid grid-cols-3 gap-3">
              {(["hours", "minutes", "seconds"] as const).map((field) => (
                <div key={field}>
                  <Input
                    type="number"
                    value={duration[field]}
                    onChange={(e) => updateDurationField(field, e.target.value)}
                    disabled={isRunning}
                    min={0}
                    className="bg-background"
                  />
                  <span className="text-xs text-muted-foreground mt-1 block capitalize">{field}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Keyword */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground mb-1.5 block">Add Keyword</label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter keyword..."
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                disabled={isRunning}
                className="bg-background"
              />
              <Button variant="outline" size="icon" onClick={handleAddKeyword} disabled={isRunning || !newKeyword.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Keywords */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground mb-2 block">Keywords</label>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                  {k}
                  {!isRunning && (
                    <button onClick={() => removeKeyword(activePlatform, k)} className="hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {keywords.length === 0 && <span className="text-xs text-muted-foreground">No keywords added</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => startScraper(activePlatform)} disabled={isRunning} className="bg-success hover:bg-success/90 text-success-foreground">
              <Play className="h-4 w-4 mr-2" /> Start Scraper
            </Button>
            <Button onClick={() => stopScraper(activePlatform)} disabled={!isRunning} variant="destructive">
              <Square className="h-4 w-4 mr-2" /> Stop Scraper
            </Button>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-card-foreground mb-4">Session Stats — {activePlatform === "twitter" ? "Twitter" : "Instagram"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="flex items-center gap-3 p-3 rounded-md bg-background">
            <Zap className="h-4 w-4 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Posts/min</p>
              <p className="text-lg font-semibold text-card-foreground">{sessionStats.postsPerMinute}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-background">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Time Elapsed</p>
              <p className="text-lg font-semibold text-card-foreground">{formatTime(sessionStats.elapsedTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-md bg-background">
            <BarChart3 className="h-4 w-4 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Total Scraped</p>
              <p className="text-lg font-semibold text-card-foreground">{sessionStats.postsScraped}</p>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
    </div>
  );
}
