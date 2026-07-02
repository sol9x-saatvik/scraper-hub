import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  prepareSessionPosts,
  saveSessionReport,
  getLastSessionInfo,
  type SessionReport,
} from "@/services/api";
import { generateSessionReport, GEMINI_REPORT_MODEL } from "@/services/geminiReport";
import { useScraperContext } from "@/context/ScraperContext";

function getCurrentAccountId(): string | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function useGenerateReport() {
  const { state } = useScraperContext();
  const { isRunning } = state;
  const navigate = useNavigate();

  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (): Promise<SessionReport | null> => {
    const accountId = getCurrentAccountId();
    if (!accountId) {
      toast.error("You must be signed in to generate a report.");
      return null;
    }
    if (isRunning) {
      toast.error("Stop the scraper before generating a report.");
      return null;
    }
    if (isGenerating) return null;

    setIsGenerating(true);
    const toastId = "generate-report";

    try {
      toast.loading("Fetching session posts…", { id: toastId });

      const sessionInfo = await getLastSessionInfo(accountId);
      if (!sessionInfo.lastStartedAt) {
        toast.error("No scraping session found. Start a scraper first.", { id: toastId });
        return null;
      }

      const prepared = await prepareSessionPosts(accountId);
      if (prepared.totalCount === 0) {
        toast.error("No posts found in this session window.", { id: toastId });
        return null;
      }

      toast.loading(
        `Generating intelligence report with Gemini… ${prepared.totalCount} posts (this may take 30-90 seconds)`,
        { id: toastId }
      );

      const sessionStart = sessionInfo.lastStartedAt;
      const sessionEnd = new Date().toISOString();

      const reportData = await generateSessionReport(prepared.posts, {
        keywords: sessionInfo.keywords,
        platforms: sessionInfo.platforms,
        sessionStart,
        sessionEnd,
      });

      toast.loading("Saving report…", { id: toastId });

      const saved = await saveSessionReport({
        accountId,
        sessionStart,
        sessionEnd,
        postsAnalyzedCount: prepared.totalCount,
        postsByPlatform: prepared.countsByPlatform,
        keywords: sessionInfo.keywords,
        platforms: sessionInfo.platforms,
        reportData,
        geminiModel: GEMINI_REPORT_MODEL,
      });

      toast.success("Report generated.", { id: toastId });
      navigate(`/reports?open=${saved.id}`);
      return saved;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate report";
      toast.error(msg, { id: toastId });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isRunning, isGenerating, navigate]);

  const canGenerate = !isRunning && !isGenerating;

  return { generate, isGenerating, canGenerate };
}
