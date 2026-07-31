import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { getAllPosts, getPostId, startScraper as apiStartScraper, type AllPost, type PostAnalysis } from "@/services/api";
import { analyzePostWithOllama } from "@/services/ollama";

export type Platform = "INSTAGRAM" | "TWITTER" | "FACEBOOK" | "REDDIT";

export interface Keyword {
  platform: Platform;
  value: string;
}

interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

interface SessionStats {
  startedAt: string | null;
  postsScraped: number;
  postsPerMinute: number;
  elapsedTime: number;
  activeTasks: number;
}

interface AnalysisProgress {
  current: number;
  total: number;
  rateLimited: boolean;
}

interface ScraperState {
  isRunning: boolean;
  isWebSearchRunning: boolean;
  duration: Duration;
  runInstaExplore: boolean;
  runTwitterHome: boolean;
  runFacebookExplore: boolean;
  runRedditHome: boolean;
  keywords: Keyword[];
  instaProfiles: string[];
  twitterProfiles: string[];
  facebookProfiles: string[];
  redditProfiles: string[];
  webSearchKeywords: string[];
  webSearchMaxResults: number;
  sessionStats: SessionStats;
  postAnalyses: Map<string, PostAnalysis>;
  isAnalyzing: boolean;
  analysisProgress: AnalysisProgress;
}

interface ScraperContextType {
  state: ScraperState;
  setDuration: (d: Duration) => void;
  setRunInstaExplore: (v: boolean) => void;
  setRunTwitterHome: (v: boolean) => void;
  setRunFacebookExplore: (v: boolean) => void;
  setRunRedditHome: (v: boolean) => void;
  addKeyword: (k: Keyword) => void;
  removeKeyword: (platform: Platform, value: string) => void;
  addInstaProfile: (username: string) => void;
  removeInstaProfile: (username: string) => void;
  addTwitterProfile: (username: string) => void;
  removeTwitterProfile: (username: string) => void;
  addFacebookProfile: (username: string) => void;
  removeFacebookProfile: (username: string) => void;
  addRedditProfile: (username: string) => void;
  removeRedditProfile: (username: string) => void;
  addWebSearchKeyword: (keyword: string) => void;
  removeWebSearchKeyword: (index: number) => void;
  setWebSearchMaxResults: (n: number) => void;
  startScraper: () => Promise<void>;
  stopScraper: () => Promise<void>;
  startWebSearch: () => Promise<void>;
  analyzePost: (post: AllPost) => Promise<PostAnalysis>;
  analyzeAllPosts: (posts: AllPost[]) => Promise<void>;
  getPostAnalysis: (post: AllPost) => PostAnalysis | null;
  setPostAnalysis: (postId: string, analysis: PostAnalysis) => void;
}

const ScraperContext = createContext<ScraperContextType | null>(null);

const API_BASE = "http://localhost:8081/api";

// ── localStorage helpers ────────────────────────────────────────────────────
const STORAGE_KEY = "scraper_post_analyses";

function accountStorageKey(baseKey: string): string {
  try {
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    return user?.id ? `${baseKey}_${user.id}` : baseKey;
  } catch {
    return baseKey;
  }
}

function loadAnalysesFromStorage(): Map<string, PostAnalysis> {
  try {
    const stored = localStorage.getItem(accountStorageKey(STORAGE_KEY));
    if (!stored) return new Map();
    const entries: [string, PostAnalysis][] = JSON.parse(stored);
    // Drop orphan entries from the old getPostId format that stored "undefined"
    // as the author segment (e.g. "Twitter_undefined_20-06-2026_00:20:41").
    // These can never be matched now that getPostId normalizes across aliases.
    const cleaned = entries.filter(([key]) => !/_undefined_/i.test(key));
    return new Map(cleaned);
  } catch {
    return new Map();
  }
}

function saveAnalysesToStorage(map: Map<string, PostAnalysis>): void {
  try {
    localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(Array.from(map.entries())));
  } catch {}
}

/** Resolve the analyzable body of a post across every scraper's field names. */
function resolvePostContent(p: any): string {
  const candidates = [p.content, p.tweet, p.caption, p.text, p.title, p.snippet, p.scrapedContent];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

// ── Default safe analysis ───────────────────────────────────────────────────
function defaultAnalysis(postId: string): PostAnalysis {
  return {
    postId,
    analyzedAt: new Date().toISOString(),
    sentiment: "neutral",
    sentiment_score: 50,
    harmful: false,
    harmful_reason: null,
    threat_level: "low",
    summary: "",
    emotions: [],
    toxicity_score: 0,
    fake_account_probability: 0,
    geographic_signals: [],
  };
}

/**
 * Ollama fetch with exponential backoff on network errors.
 * Retries 3 times at 2s / 4s / 8s. Returns a default analysis if all attempts fail.
 */
async function fetchOllamaAnalysisWithBackoff(post: AllPost): Promise<PostAnalysis> {
  const p = post as any;
  const postId = getPostId(post);
  const backoffMs = [2000, 4000, 8000];

  const content = resolvePostContent(p);
  if (!content) {
    console.warn("[Ollama] skipping post with no analyzable content:", postId);
    return defaultAnalysis(postId);
  }

  for (let attempt = 0; attempt <= backoffMs.length; attempt++) {
    try {
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
      return {
        postId,
        analyzedAt: new Date().toISOString(),
        ...result,
      };
    } catch (err) {
      if (attempt >= backoffMs.length) {
        console.warn("[Ollama] analysis failed after retries:", err);
        return defaultAnalysis(postId);
      }
      await new Promise((r) => setTimeout(r, backoffMs[attempt]));
    }
  }
  return defaultAnalysis(postId);
}

export function ScraperProvider({ children }: { children: ReactNode }) {
  const postAnalysesRef = useRef<Map<string, PostAnalysis>>(loadAnalysesFromStorage());
  const isAnalyzingRef = useRef(false);

  const [state, setState] = useState<ScraperState>({
    isRunning: false,
    isWebSearchRunning: false,
    duration: { hours: 0, minutes: 10, seconds: 0 },
    runInstaExplore: false,
    runTwitterHome: false,
    runFacebookExplore: false,
    runRedditHome: false,
    keywords: [],
    instaProfiles: [],
    twitterProfiles: [],
    facebookProfiles: [],
    redditProfiles: [],
    webSearchKeywords: [],
    webSearchMaxResults: 10,
    sessionStats: {
      startedAt: null,
      postsScraped: 0,
      postsPerMinute: 0,
      elapsedTime: 0,
      activeTasks: 0,
    },
    postAnalyses: postAnalysesRef.current,
    isAnalyzing: false,
    analysisProgress: { current: 0, total: 0, rateLimited: false },
  });

  // Holds the post count at scraper start to compute delta
  const baselinePostCountRef = useRef(0);

  // ── Elapsed time ticker + auto-stop ────────────────────────────────────────
  useEffect(() => {
    if (!state.isRunning) return;

    const totalSeconds =
      state.duration.hours * 3600 +
      state.duration.minutes * 60 +
      state.duration.seconds;

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.isRunning) return prev;

        const newElapsed = prev.sessionStats.elapsedTime + 1;

        if (totalSeconds > 0 && newElapsed >= totalSeconds) {
          return {
            ...prev,
            isRunning: false,
            sessionStats: { ...prev.sessionStats, elapsedTime: totalSeconds },
          };
        }

        return {
          ...prev,
          sessionStats: { ...prev.sessionStats, elapsedTime: newElapsed },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning]); // intentionally omits duration — captured once at start

  // ── Poll post count every 10 s while running (MOCKED) ──────────────────────
  useEffect(() => {
    if (!state.isRunning) return;

    // fetch(`${API_BASE}/dashboard/stats`)
    //   .then((r) => r.json())
    //   .then((data) => {
    //     baselinePostCountRef.current = data.totalPosts ?? 0;
    //   })
    //   .catch(() => {});
    baselinePostCountRef.current = 1250;

    const poll = setInterval(() => {
      // fetch(`${API_BASE}/dashboard/stats`)
      //   .then((r) => r.json())
      //   .then((data) => {
      //     const currentTotal = data.totalPosts ?? 0;
      //     const scraped = Math.max(0, currentTotal - baselinePostCountRef.current);

      //     setState((prev) => {
      //       if (!prev.isRunning) return prev;
      //       const elapsedMins = prev.sessionStats.elapsedTime / 60;
      //       const ppm = elapsedMins > 0 ? Math.round(scraped / elapsedMins) : 0;
      //       return {
      //         ...prev,
      //         sessionStats: { ...prev.sessionStats, postsScraped: scraped, postsPerMinute: ppm },
      //       };
      //     });
      //   })
      //   .catch(() => {});
      
      setState((prev) => {
        if (!prev.isRunning) return prev;
        const scraped = prev.sessionStats.postsScraped + Math.floor(Math.random() * 5);
        const elapsedMins = prev.sessionStats.elapsedTime / 60;
        const ppm = elapsedMins > 0 ? Math.round(scraped / elapsedMins) : 10;
        return {
          ...prev,
          sessionStats: { ...prev.sessionStats, postsScraped: scraped, postsPerMinute: ppm },
        };
      });
    }, 10_000);

    return () => clearInterval(poll);
  }, [state.isRunning]);

  // ── Simple state setters ────────────────────────────────────────────────────
  const setDuration = useCallback((d: Duration) => {
    setState((prev) => ({ ...prev, duration: d }));
  }, []);

  const setRunInstaExplore = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, runInstaExplore: v }));
  }, []);

  const setRunTwitterHome = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, runTwitterHome: v }));
  }, []);

  const setRunFacebookExplore = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, runFacebookExplore: v }));
  }, []);

  const setRunRedditHome = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, runRedditHome: v }));
  }, []);

  const addKeyword = useCallback((k: Keyword) => {
    setState((prev) => {
      if (prev.keywords.some((kw) => kw.platform === k.platform && kw.value === k.value)) return prev;
      return { ...prev, keywords: [...prev.keywords, k] };
    });
  }, []);

  const removeKeyword = useCallback((platform: Platform, value: string) => {
    setState((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => !(k.platform === platform && k.value === value)),
    }));
  }, []);

  const addInstaProfile = useCallback((username: string) => {
    setState((prev) => {
      if (prev.instaProfiles.includes(username)) return prev;
      return { ...prev, instaProfiles: [...prev.instaProfiles, username] };
    });
  }, []);

  const removeInstaProfile = useCallback((username: string) => {
    setState((prev) => ({ ...prev, instaProfiles: prev.instaProfiles.filter((p) => p !== username) }));
  }, []);

  const addTwitterProfile = useCallback((username: string) => {
    setState((prev) => {
      if (prev.twitterProfiles.includes(username)) return prev;
      return { ...prev, twitterProfiles: [...prev.twitterProfiles, username] };
    });
  }, []);

  const removeTwitterProfile = useCallback((username: string) => {
    setState((prev) => ({ ...prev, twitterProfiles: prev.twitterProfiles.filter((p) => p !== username) }));
  }, []);

  const addFacebookProfile = useCallback((username: string) => {
    setState((prev) => {
      if (prev.facebookProfiles.includes(username)) return prev;
      return { ...prev, facebookProfiles: [...prev.facebookProfiles, username] };
    });
  }, []);

  const removeFacebookProfile = useCallback((username: string) => {
    setState((prev) => ({ ...prev, facebookProfiles: prev.facebookProfiles.filter((p) => p !== username) }));
  }, []);

  const addRedditProfile = useCallback((username: string) => {
    setState((prev) => {
      if (prev.redditProfiles.includes(username)) return prev;
      return { ...prev, redditProfiles: [...prev.redditProfiles, username] };
    });
  }, []);

  const removeRedditProfile = useCallback((username: string) => {
    setState((prev) => ({ ...prev, redditProfiles: prev.redditProfiles.filter((p) => p !== username) }));
  }, []);

  const addWebSearchKeyword = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setState((prev) => {
      if (prev.webSearchKeywords.includes(trimmed)) return prev;
      return { ...prev, webSearchKeywords: [...prev.webSearchKeywords, trimmed] };
    });
  }, []);

  const removeWebSearchKeyword = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      webSearchKeywords: prev.webSearchKeywords.filter((_, i) => i !== index),
    }));
  }, []);

  const setWebSearchMaxResults = useCallback((n: number) => {
    setState((prev) => ({ ...prev, webSearchMaxResults: n }));
  }, []);

  // ── AI Analysis ─────────────────────────────────────────────────────────────

  const getPostAnalysis = useCallback((post: AllPost): PostAnalysis | null => {
    return postAnalysesRef.current.get(getPostId(post)) ?? null;
  }, []);

  const analyzePost = useCallback(async (post: AllPost): Promise<PostAnalysis> => {
    const postId = getPostId(post);
    const cached = postAnalysesRef.current.get(postId);
    if (cached) return cached;

    const analysis = await fetchOllamaAnalysisWithBackoff(post);
    postAnalysesRef.current.set(postId, analysis);
    saveAnalysesToStorage(postAnalysesRef.current);
    setState((prev) => ({ ...prev, postAnalyses: new Map(postAnalysesRef.current) }));
    return analysis;
  }, []);

  const setPostAnalysis = useCallback((postId: string, analysis: PostAnalysis) => {
    postAnalysesRef.current.set(postId, analysis);
    saveAnalysesToStorage(postAnalysesRef.current);
    setState((prev) => ({ ...prev, postAnalyses: new Map(postAnalysesRef.current) }));
  }, []);

  const analyzeAllPosts = useCallback(async (posts: AllPost[]): Promise<void> => {
    if (isAnalyzingRef.current) return;

    const unanalyzed = posts.filter((p) => !postAnalysesRef.current.has(getPostId(p)));
    if (unanalyzed.length === 0) return;

    isAnalyzingRef.current = true;
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      analysisProgress: { current: 0, total: unanalyzed.length, rateLimited: false },
    }));

    for (let i = 0; i < unanalyzed.length; i++) {
      const post = unanalyzed[i];
      const postId = getPostId(post);

      setState((prev) => ({
        ...prev,
        analysisProgress: { current: i, total: unanalyzed.length, rateLimited: false },
      }));

      const analysis = await fetchOllamaAnalysisWithBackoff(post);
      postAnalysesRef.current.set(postId, analysis);
      saveAnalysesToStorage(postAnalysesRef.current);

      setState((prev) => ({
        ...prev,
        postAnalyses: new Map(postAnalysesRef.current),
        analysisProgress: { current: i + 1, total: unanalyzed.length, rateLimited: false },
      }));
    }

    isAnalyzingRef.current = false;
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
      analysisProgress: { current: unanalyzed.length, total: unanalyzed.length, rateLimited: false },
    }));
  }, []);

  // ── Start / Stop ────────────────────────────────────────────────────────────
  const startScraper = useCallback(async () => {
    const {
      duration, runInstaExplore, runTwitterHome, runFacebookExplore, runRedditHome,
      keywords, instaProfiles, twitterProfiles, facebookProfiles, redditProfiles,
      webSearchKeywords, webSearchMaxResults,
    } = state;

    const instaKeywords = keywords.filter((k) => k.platform === "INSTAGRAM").map((k) => k.value);
    const twitterKeywords = keywords.filter((k) => k.platform === "TWITTER").map((k) => k.value);
    const facebookKeywords = keywords.filter((k) => k.platform === "FACEBOOK").map((k) => k.value);
    const redditKeywords = keywords.filter((k) => k.platform === "REDDIT").map((k) => k.value);

    const totalSeconds = (duration.hours * 3600) + (duration.minutes * 60) + duration.seconds;

    const activeTasks = [
      runInstaExplore, runTwitterHome, runFacebookExplore, runRedditHome,
      instaKeywords.length > 0, twitterKeywords.length > 0,
      facebookKeywords.length > 0, redditKeywords.length > 0,
      instaProfiles.length > 0, twitterProfiles.length > 0,
      facebookProfiles.length > 0, redditProfiles.length > 0,
    ].filter(Boolean).length;

    const requestBody = {
      instaExplore: runInstaExplore,
      twitterHome: runTwitterHome,
      facebookExplore: runFacebookExplore,
      redditHome: runRedditHome,
      instaKeywords,
      twitterKeywords,
      facebookKeywords,
      redditKeywords,
      instaProfiles,
      twitterProfiles,
      facebookProfiles,
      redditProfiles,
      webSearchKeywords,
      webSearchMaxResults,
      duration: totalSeconds,
    };

    try {
      await apiStartScraper(requestBody);
      setState((prev) => ({
        ...prev,
        isRunning: true,
        sessionStats: {
          startedAt: new Date().toISOString(),
          postsScraped: 0,
          postsPerMinute: 0,
          elapsedTime: 0,
          activeTasks,
        },
      }));
    } catch (err) {
      console.error('Failed to start scraper:', err);
      throw err;
    }
  }, [state]);

  const stopScraper = useCallback(async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'}/scraper/stop`, {
        method: 'POST',
      });
      setState((prev) => ({ ...prev, isRunning: false }));
    } catch (err) {
      console.error('Failed to stop scraper:', err);
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [state]);

  const startWebSearch = useCallback(async () => {
    const { webSearchKeywords, webSearchMaxResults } = state;
    if (webSearchKeywords.length === 0) return;

    const payload = {
      instaExplore: false,
      twitterHome: false,
      facebookExplore: false,
      redditHome: false,
      instaKeywords: [],
      twitterKeywords: [],
      facebookKeywords: [],
      redditKeywords: [],
      instaProfiles: [],
      twitterProfiles: [],
      facebookProfiles: [],
      redditProfiles: [],
      webSearchKeywords,
      webSearchMaxResults,
      duration: 0,
    };

    setState((prev) => ({ ...prev, isWebSearchRunning: true }));
    try {
      await apiStartScraper(payload);
    } catch (err) {
      console.error("Failed to start web search:", err);
    } finally {
      setState((prev) => ({ ...prev, isWebSearchRunning: false }));
    }
  }, [state]);

  return (
    <ScraperContext.Provider
      value={{
        state,
        setDuration,
        setRunInstaExplore,
        setRunTwitterHome,
        setRunFacebookExplore,
        setRunRedditHome,
        addKeyword,
        removeKeyword,
        addInstaProfile,
        removeInstaProfile,
        addTwitterProfile,
        removeTwitterProfile,
        addFacebookProfile,
        removeFacebookProfile,
        addRedditProfile,
        removeRedditProfile,
        addWebSearchKeyword,
        removeWebSearchKeyword,
        setWebSearchMaxResults,
        startScraper,
        stopScraper,
        startWebSearch,
        analyzePost,
        analyzeAllPosts,
        getPostAnalysis,
        setPostAnalysis,
      }}
    >
      {children}
    </ScraperContext.Provider>
  );
}

export function useScraperContext() {
  const ctx = useContext(ScraperContext);
  if (!ctx) throw new Error("useScraperContext must be used within ScraperProvider");
  return ctx;
}
