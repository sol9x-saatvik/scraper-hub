import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Platform = "INSTAGRAM" | "TWITTER";

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

interface ScraperState {
  isRunning: boolean;
  duration: Duration;
  runInstaExplore: boolean;
  runTwitterHome: boolean;
  keywords: Keyword[];
  instaProfiles: string[];
  twitterProfiles: string[];
  sessionStats: SessionStats;
}

interface ScraperContextType {
  state: ScraperState;
  setDuration: (d: Duration) => void;
  setRunInstaExplore: (v: boolean) => void;
  setRunTwitterHome: (v: boolean) => void;
  addKeyword: (k: Keyword) => void;
  removeKeyword: (platform: Platform, value: string) => void;
  addInstaProfile: (username: string) => void;
  removeInstaProfile: (username: string) => void;
  addTwitterProfile: (username: string) => void;
  removeTwitterProfile: (username: string) => void;
  startScraper: () => Promise<void>;
  stopScraper: () => Promise<void>;
}

const ScraperContext = createContext<ScraperContextType | null>(null);

const API_BASE = "http://localhost:8081/api";

export function ScraperProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScraperState>({
    isRunning: false,
    duration: { hours: 0, minutes: 10, seconds: 0 },
    runInstaExplore: false,
    runTwitterHome: false,
    keywords: [],
    instaProfiles: [],
    twitterProfiles: [],
    sessionStats: {
      startedAt: null,
      postsScraped: 0,
      postsPerMinute: 0,
      elapsedTime: 0,
      activeTasks: 0,
    },
  });

  const setDuration = useCallback((d: Duration) => {
    setState((prev) => ({ ...prev, duration: d }));
  }, []);

  const setRunInstaExplore = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, runInstaExplore: v }));
  }, []);

  const setRunTwitterHome = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, runTwitterHome: v }));
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

  const startScraper = useCallback(async () => {
    const { duration, runInstaExplore, runTwitterHome, keywords, instaProfiles, twitterProfiles } = state;

    const totalSeconds = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;

    const instaKeywords = keywords.filter((k) => k.platform === "INSTAGRAM").map((k) => k.value);
    const twitterKeywords = keywords.filter((k) => k.platform === "TWITTER").map((k) => k.value);

    const payload = {
      instaExplore: runInstaExplore,
      twitterHome: runTwitterHome,
      instaKeywords,
      twitterKeywords,
      instaProfiles,
      twitterProfiles,
      duration: totalSeconds,
    };

    try {
      const res = await fetch(`${API_BASE}/scraper/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to start scraper");

      const activeTasks =
        (runInstaExplore ? 1 : 0) +
        (runTwitterHome ? 1 : 0) +
        instaKeywords.length +
        twitterKeywords.length +
        instaProfiles.length +
        twitterProfiles.length;

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
      console.error("Failed to start scraper:", err);
    }
  }, [state]);

  const stopScraper = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scraper/stop`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to stop scraper");
      setState((prev) => ({ ...prev, isRunning: false }));
    } catch (err) {
      console.error("Failed to stop scraper:", err);
    }
  }, []);

  return (
    <ScraperContext.Provider
      value={{
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
        startScraper,
        stopScraper,
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
