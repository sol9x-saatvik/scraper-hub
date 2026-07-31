import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useScraperContext } from "@/context/ScraperContext";
import { getAllPosts, getPostId, type AllPost } from "@/services/api";
import { analyzePostWithOllama } from "@/services/ollama";

/**
 * Auto-analysis pipeline: analyzes ONLY posts scraped in the current session.
 *
 * A "session" starts when the user clicks Start Scraper (state.sessionStats.startedAt
 * gets set). The hook filters incoming posts by scraped_at > startedAt so
 * pre-existing posts in MongoDB (potentially thousands) are never touched.
 *
 * The manual "Analyze Selection" / "Deep Scan All" buttons on the Posts page
 * still work on any posts — this hook only governs the automatic background
 * analysis triggered by scraping.
 *
 * Flow:
 * - Waits until sessionStats.startedAt is set (i.e. a scraper has been started)
 * - While active (scraper running, or 60s cooldown after stop), polls
 *   /posts/all every 10s
 * - Enqueues posts where scraped_at > sessionStartedAt AND no analysis exists
 * - Processes queue sequentially with 500ms gap, 2s back-off on error
 * - Results persisted via setPostAnalysis (localStorage)
 */

const TOAST_ID = "auto-analyze-progress";

export function useAutoAnalyzePosts() {
  const { state, setPostAnalysis } = useScraperContext();
  const { isRunning, postAnalyses } = state;
  const sessionStartedAt = state.sessionStats.startedAt;

  const analysesRef = useRef(postAnalyses);
  analysesRef.current = postAnalyses;

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Millisecond epoch cutoff: only posts scraped AFTER this are eligible.
  // Null until a scraper session has started; the loop idles while null.
  const cutoffMsRef = useRef<number | null>(null);
  cutoffMsRef.current = sessionStartedAt ? Date.parse(sessionStartedAt) : null;

  const queueRef = useRef<Map<string, AllPost>>(new Map());
  const processingRef = useRef(false);
  const stoppedRef = useRef(false);
  const toastActiveRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    let cooldownUntil = 0;

    const showQueueToast = () => {
      const n = queueRef.current.size;
      if (n === 0) {
        if (toastActiveRef.current) {
          toast.dismiss(TOAST_ID);
          toastActiveRef.current = false;
        }
        return;
      }
      toast.loading(`Analyzing new posts… ${n} remaining`, { id: TOAST_ID });
      toastActiveRef.current = true;
    };

    const processQueue = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        while (queueRef.current.size > 0 && !stoppedRef.current) {
          const iter = queueRef.current.entries().next();
          if (iter.done) break;
          const [postId, post] = iter.value;
          queueRef.current.delete(postId);
          showQueueToast();

          try {
            const p = post as any;
            const content = [p.content, p.tweet, p.caption, p.text, p.title, p.snippet, p.scrapedContent]
              .find((c: any) => typeof c === "string" && c.trim())
              ?.trim() ?? "";
            if (!content) {
              console.warn(`[auto-analyze] skipping ${postId} — no analyzable content`);
              continue;
            }
            const result = await analyzePostWithOllama({
              content,
              author: p.user || p.handle || p.username || p.author,
              platform: post.platform,
              engagement: {
                likes: Number(p.likes) || 0,
                comments: Number(p.replies ?? p.comments) || 0,
                shares: Number(p.reposts ?? p.shares) || 0,
                views: Number(p.views) || 0,
              },
            });
            setPostAnalysis(postId, {
              postId,
              analyzedAt: new Date().toISOString(),
              ...result,
            });
            await sleep(500);
          } catch (err) {
            console.warn(`[auto-analyze] failed for ${postId}:`, err);
            await sleep(2000);
          }
        }
      } finally {
        processingRef.current = false;
        showQueueToast();
      }
    };

    const pollAndEnqueue = async () => {
      while (!stoppedRef.current) {
        const now = Date.now();
        const running = isRunningRef.current;
        const cutoffMs = cutoffMsRef.current;

        if (running) cooldownUntil = 0;
        else if (cooldownUntil === 0 && cutoffMs !== null) cooldownUntil = now + 60_000;

        // Idle if no session has ever started, or if we're past the cooldown.
        const shouldPoll = cutoffMs !== null && (running || now < cooldownUntil);
        if (!shouldPoll) {
          await sleep(3000);
          continue;
        }

        try {
          const posts = await getAllPosts();
          for (const post of posts) {
            const scrapedAtMs = getScrapedAtMs(post);
            // Skip anything scraped before the session started — that's the "no 3k backfill" guard.
            if (scrapedAtMs === null || scrapedAtMs <= cutoffMs) continue;

            const key = getPostId(post);
            if (!analysesRef.current.has(key) && !queueRef.current.has(key)) {
              queueRef.current.set(key, post);
            }
          }
          if (queueRef.current.size > 0) {
            showQueueToast();
            processQueue();
          }
        } catch (err) {
          console.warn("[auto-analyze] poll failed:", err);
        }

        await sleep(10_000);
      }
    };

    pollAndEnqueue();

    return () => {
      stoppedRef.current = true;
      if (toastActiveRef.current) {
        toast.dismiss(TOAST_ID);
        toastActiveRef.current = false;
      }
    };
  }, [setPostAnalysis]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Extract the post's scraped_at timestamp as ms since epoch. Handles both
 * snake_case (from /posts/all normalized docs) and camelCase (WebSearchPost).
 * Returns null if unparseable — treated as "skip this post" by the caller.
 */
function getScrapedAtMs(post: AllPost): number | null {
  const raw = (post as any).scraped_at ?? (post as any).scrapedAt;
  if (!raw) return null;
  const ms = typeof raw === "number" ? raw : Date.parse(String(raw));
  return Number.isFinite(ms) ? ms : null;
}
