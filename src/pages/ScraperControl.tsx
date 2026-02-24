import { useState } from "react";
import { Play, Square, Clock, Zap, BarChart3, X, Plus } from "lucide-react";
import { useScraperContext } from "@/context/ScraperContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function ScraperControl() {
  const {
    isRunning, duration, keywords, sessionStats, startedAt,
    setDuration, addKeyword, removeKeyword, startScraper, stopScraper,
  } = useScraperContext();
  const [newKeyword, setNewKeyword] = useState("");
  const [durationInput, setDurationInput] = useState(String(duration));

  const handleAddKeyword = () => {
    const k = newKeyword.trim();
    if (k) {
      addKeyword(k);
      setNewKeyword("");
    }
  };

  const handleDurationChange = (val: string) => {
    setDurationInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) setDuration(n);
  };

  const progressPercent = duration > 0
    ? Math.min((sessionStats.timeElapsed / (duration * 60)) * 100, 100)
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Scraper Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and monitor the scraping engine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-1">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Scraper Status</h3>

          <div className="flex items-center gap-3 mb-4">
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                isRunning ? "bg-success animate-pulse-slow" : "bg-destructive"
              )}
            />
            <span className="text-lg font-semibold text-card-foreground">
              {isRunning ? "Running" : "Stopped"}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started at</span>
              <span className="text-card-foreground font-mono text-xs">
                {startedAt ? new Date(startedAt).toLocaleTimeString() : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-card-foreground">{duration} min</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Duration (minutes)</label>
              <Input
                type="number"
                value={durationInput}
                onChange={(e) => handleDurationChange(e.target.value)}
                disabled={isRunning}
                min={1}
                className="bg-background"
              />
            </div>
            <div>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddKeyword}
                  disabled={isRunning || !newKeyword.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="mb-5">
            <label className="text-xs text-muted-foreground mb-2 block">Keywords</label>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span
                  key={k}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
                >
                  {k}
                  {!isRunning && (
                    <button onClick={() => removeKeyword(k)} className="hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {keywords.length === 0 && (
                <span className="text-xs text-muted-foreground">No keywords added</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={startScraper}
              disabled={isRunning}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Scraper
            </Button>
            <Button
              onClick={stopScraper}
              disabled={!isRunning}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Scraper
            </Button>
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-medium text-card-foreground mb-4">Session Stats</h3>

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
              <p className="text-lg font-semibold text-card-foreground">{formatTime(sessionStats.timeElapsed)}</p>
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
