import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Loader2, Play, Trash2, Download, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  listSessionReports,
  deleteSessionReport,
  getLastSessionInfo,
  type SessionReport,
  type LastSessionInfo,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReportDetail } from "@/components/reports/ReportDetail";
import { downloadReportPDF } from "@/components/reports/ReportPDF";
import { threatBadgeClasses, threatLabel } from "@/components/reports/threatLevel";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { useScraperContext } from "@/context/ScraperContext";

function getCurrentAccountId(): string | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw)?.id ?? null;
  } catch {
    return null;
  }
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " at " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return iso;
  }
}

function formatRelative(iso: string): string {
  try {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  } catch {
    return iso;
  }
}

function truncate(text: string, max = 180): string {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

export default function Reports() {
  const accountId = getCurrentAccountId();
  const { state } = useScraperContext();
  const { isRunning } = state;
  const { generate, isGenerating, canGenerate } = useGenerateReport();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState<SessionReport[] | null>(null);
  const [sessionInfo, setSessionInfo] = useState<LastSessionInfo | null>(null);
  const [selected, setSelected] = useState<SessionReport | null>(null);

  function loadAll() {
    if (!accountId) return;
    listSessionReports(accountId).then(setReports).catch(() => setReports([]));
    getLastSessionInfo(accountId).then(setSessionInfo).catch(() => setSessionInfo({ lastStartedAt: null, keywords: [], platforms: [] }));
  }

  useEffect(() => { loadAll(); }, []);

  // Auto-open report when ?open=<id> is in URL (after generation navigates here)
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId && reports) {
      const found = reports.find((r) => r.id === openId);
      if (found) {
        setSelected(found);
        searchParams.delete("open");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [reports, searchParams, setSearchParams]);

  const hasSession = Boolean(sessionInfo?.lastStartedAt);
  const buttonDisabled = !hasSession || isRunning || !canGenerate;
  const disabledTooltip = !hasSession
    ? "No scraping session found. Start a scraper first."
    : isRunning
    ? "Stop the scraper before generating a report."
    : null;

  async function handleGenerate() {
    const saved = await generate();
    if (saved) loadAll();
  }

  async function handleDelete(id: string) {
    if (!accountId) return;
    try {
      await deleteSessionReport(id, accountId);
      toast.success("Report deleted.");
      loadAll();
    } catch {
      toast.error("Failed to delete report.");
    }
  }

  const sessionContext = useMemo(() => {
    if (!sessionInfo?.lastStartedAt) return null;
    const startedLabel = formatDateTime(sessionInfo.lastStartedAt);
    const platformsLabel = sessionInfo.platforms.length > 0 ? sessionInfo.platforms.join(", ") : "—";
    const kw = sessionInfo.keywords;
    const keywordsLabel = kw.length === 0 ? "—" : kw.length <= 6 ? kw.join(", ") : `${kw.slice(0, 6).join(", ")} (+${kw.length - 6} more)`;
    return { startedLabel, platformsLabel, keywordsLabel };
  }, [sessionInfo]);

  const generateButton = (
    <Button
      onClick={handleGenerate}
      disabled={buttonDisabled || isGenerating}
      size="lg"
      className="gap-2 font-bold"
    >
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {isGenerating ? "Generating…" : "Analyze Last Session"}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Session Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Gemini-powered intelligence reports for each scraping session.
          </p>
        </div>
      </div>

      {/* Generate card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5 text-primary" />
            Generate New Report
          </CardTitle>
          <CardDescription>
            Synthesizes posts captured since the most recent scraper start into a single intelligence report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionContext ? (
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Last session started: </span><span className="font-medium">{sessionContext.startedLabel}</span></div>
              <div><span className="text-muted-foreground">Platforms: </span><span className="font-medium">{sessionContext.platformsLabel}</span></div>
              <div><span className="text-muted-foreground">Keywords: </span><span className="font-medium">{sessionContext.keywordsLabel}</span></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No scraping session yet. Start a scraper first.</p>
          )}

          {disabledTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">{generateButton}</span>
              </TooltipTrigger>
              <TooltipContent>{disabledTooltip}</TooltipContent>
            </Tooltip>
          ) : (
            generateButton
          )}
        </CardContent>
      </Card>

      {/* Saved reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Saved Reports</h2>

        {reports === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 w-full" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No reports yet. Generate your first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((r) => {
              const level = r.reportData?.threat_assessment?.overall_level ?? "low";
              const summary = r.reportData?.executive_summary ?? "";
              const breakdown = Object.entries(r.postsByPlatform || {})
                .map(([k, v]) => `${k.charAt(0) + k.slice(1).toLowerCase()} ${v}`)
                .join(", ");
              return (
                <Card key={r.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold" title={formatDateTime(r.generatedAt)}>
                          {formatRelative(r.generatedAt)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(r.sessionStart)} → {formatDateTime(r.sessionEnd).split(" at ")[1] ?? ""}
                        </p>
                      </div>
                      <Badge className={threatBadgeClasses(level)}>{threatLabel(level)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{r.postsAnalyzedCount}</span> posts
                      {breakdown ? <> • {breakdown}</> : null}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{truncate(summary)}</p>
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/50">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(r)} className="gap-1.5">
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadReportPDF(r)} className="gap-1.5">
                        <Download className="h-4 w-4" /> PDF
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes the report from MongoDB. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(r.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selected && <ReportDetail report={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
