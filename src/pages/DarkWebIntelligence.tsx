import { useEffect, useRef, useState } from "react";
import { EyeOff, RefreshCw, Search, Database, AlertTriangle, Loader2, Timer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  getDarkWebInvestigations,
  getDarkWebStats,
  triggerDarkWebIngest,
  triggerDarkWebSearch,
  type DarkWebInvestigation,
  type DarkWebStats,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function formatTimestamp(ts: string): string {
  if (!ts) return "—";
  try {
    const d = new Date(ts.substring(0, 19));
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " at " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return ts;
  }
}

const COUNTDOWN_SECONDS = 5 * 60; // 5 minutes

export default function DarkWebIntelligence() {
  const [investigations, setInvestigations] = useState<DarkWebInvestigation[] | null>(null);
  const [stats, setStats] = useState<DarkWebStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selected, setSelected] = useState<DarkWebInvestigation | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Ref mirrors isSearching so async callbacks always read the current value
  const isSearchingRef = useRef(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function loadData() {
    getDarkWebInvestigations().then(setInvestigations).catch(() => setInvestigations([]));
    getDarkWebStats().then(setStats).catch(() => {});
  }

  useEffect(() => { loadData(); }, []);

  // Keep ref in sync with state
  useEffect(() => { isSearchingRef.current = isSearching; }, [isSearching]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // When countdown reaches exactly 0, auto-sync (no async work inside setInterval callback)
  useEffect(() => {
    if (countdown === 0) handleTimerExpired();
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopSearching() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setIsSearching(false);
    isSearchingRef.current = false;
  }

  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(COUNTDOWN_SECONDS);
    // Interval only decrements — async work is handled by the countdown === 0 effect
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleTimerExpired() {
    setCountdown(null);
    setIsSyncing(true);
    try {
      const result = await triggerDarkWebIngest();
      if (result.newFiles > 0) {
        toast.success(`Found ${result.newFiles} new investigation${result.newFiles !== 1 ? "s" : ""}!`);
        loadData();
      } else {
        toast.error("Search may have failed. Try again.");
      }
    } catch {
      toast.error("Sync failed — check backend connection");
    } finally {
      setIsSyncing(false);
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  }

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    isSearchingRef.current = true;
    try {
      await triggerDarkWebSearch(q);
      toast.info(`Dark web search started for "${q}". This takes 3–5 minutes.`);
      startCountdown();
    } catch {
      toast.error("Failed to start search — check backend connection");
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  }

  async function handleSync() {
    const searching = isSearchingRef.current;
    setIsSyncing(true);
    try {
      const result = await triggerDarkWebIngest();
      if (result.newFiles > 0) {
        toast.success(`Found ${result.newFiles} new investigation${result.newFiles !== 1 ? "s" : ""}!`);
        loadData();
        if (searching) stopSearching();
      } else {
        if (searching) {
          toast.info("No new results yet. Search may still be in progress.");
          // Banner and timer stay active
        } else {
          toast.info("No new files to sync");
        }
      }
    } catch {
      toast.error("Sync failed — check backend connection");
    } finally {
      setIsSyncing(false);
    }
  }

  function formatCountdown(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <EyeOff className="h-8 w-8 text-purple-400" />
            Dark Web Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            Scraped investigations from the dark web
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-purple-700 hover:bg-purple-600 text-white gap-2"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync New Results
        </Button>
      </div>

      {/* Search Section */}
      <Card className="border-purple-500/40 bg-purple-950/10">
        <CardContent className="pt-5 pb-4">
          <p className="text-sm font-medium text-purple-300 mb-3">Search the Dark Web</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearch()}
              placeholder="Enter dark web search query..."
              disabled={isSearching}
              className="flex-1 rounded-md border border-purple-500/30 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-purple-700 hover:bg-purple-600 text-white gap-2 shrink-0"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search Dark Web
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Banner */}
      {isSearching && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-purple-600 bg-purple-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-white animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Searching dark web...</p>
              <p className="text-xs text-purple-200">Dark web search in progress. This typically takes 3–5 minutes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {countdown !== null && (
              <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-white">
                <Timer className="h-4 w-4" />
                {formatCountdown(countdown)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Investigations"
          value={stats?.totalInvestigations ?? 0}
          icon={Search}
          className="border-purple-500/30 bg-purple-950/5"
        />
        <StatsCard
          title="Total Sources Scraped"
          value={stats?.totalSources ?? 0}
          icon={Database}
          className="border-purple-500/30 bg-purple-950/5"
        />
        <Card className="overflow-hidden border-purple-500/30 bg-purple-950/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Query</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate">
              {stats?.latestQuery || "—"}
            </div>
            {stats?.latestTimestamp && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimestamp(stats.latestTimestamp)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investigations Grid */}
      {investigations === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : investigations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <EyeOff className="h-14 w-14 text-purple-400/30 mb-5" />
          <p className="text-muted-foreground">No investigations ingested yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Click "Sync New Results" to import files from Robin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {investigations.map((inv) => (
            <Card
              key={inv.id}
              className="cursor-pointer border border-purple-500/30 bg-purple-950/5 hover:border-purple-400/50 hover:bg-purple-950/10 transition-colors flex flex-col"
              onClick={() => setSelected(inv)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                    {inv.refinedQuery || inv.query}
                  </CardTitle>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                </div>
                {inv.refinedQuery && inv.refinedQuery !== inv.query && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Original: {inv.query}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {inv.model && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 font-mono border-purple-500/30 max-w-[140px] truncate"
                    >
                      {inv.model}
                    </Badge>
                  )}
                  {inv.preset && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 border-purple-500/30 max-w-[160px] truncate"
                    >
                      {inv.preset}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTimestamp(inv.timestamp)}</span>
                  <span className="text-purple-400 font-medium">
                    {inv.sources?.length ?? 0} source{(inv.sources?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 text-base pr-6">
              <EyeOff className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{selected?.refinedQuery || selected?.query}</span>
            </DialogTitle>
          </DialogHeader>

          {selected?.query && selected.query !== selected.refinedQuery && (
            <p className="text-xs text-muted-foreground -mt-2">
              Original query:{" "}
              <span className="text-foreground font-medium">{selected.query}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 pb-3 border-b border-border">
            {selected?.model && (
              <Badge variant="outline" className="font-mono text-[10px] border-purple-500/30">
                {selected.model}
              </Badge>
            )}
            {selected?.preset && (
              <Badge variant="outline" className="text-[10px] border-purple-500/30">
                {selected.preset}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {formatTimestamp(selected?.timestamp ?? "")}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {selected?.sources?.length ?? 0} sources
            </Badge>
          </div>

          <Tabs defaultValue="analysis">
            <TabsList className="w-full">
              <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
              <TabsTrigger value="sources" className="flex-1">
                Sources ({selected?.sources?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex-1">Raw JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-3">
              <ScrollArea className="h-[55vh] pr-3">
                <div className="prose prose-sm dark:prose-invert max-w-none pb-4">
                  <ReactMarkdown>
                    {selected?.summary ?? "*No analysis available.*"}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sources" className="mt-3">
              <ScrollArea className="h-[55vh] pr-3">
                {(selected?.sources?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    No sources recorded.
                  </p>
                ) : (
                  <div className="space-y-2 pb-4">
                    {selected?.sources?.map((source, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{source.title}</p>
                          <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                            {source.link}
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Requires Tor Browser to access</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="mt-3">
              <ScrollArea className="h-[55vh]">
                <pre className="bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap break-all pb-4">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
