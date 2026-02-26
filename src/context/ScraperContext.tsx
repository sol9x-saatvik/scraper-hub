import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Platform = "twitter" | "instagram";

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
}

interface PlatformState {
  isRunning: boolean;
  keywords: string[];
  duration: Duration;
  sessionStats: SessionStats;
}

interface ScraperContextType {
  platforms: Record<Platform, PlatformState>;
  setDuration: (platform: Platform, d: Duration) => void;
  addKeyword: (platform: Platform, k: string) => void;
  removeKeyword: (platform: Platform, k: string) => void;
  startScraper: (platform: Platform) => void;
  stopScraper: (platform: Platform) => void;
  isAnyRunning: boolean;
}

const defaultPlatformState = (): PlatformState => ({
  isRunning: false,
  keywords: [],
  duration: { hours: 0, minutes: 10, seconds: 0 },
  sessionStats: { startedAt: null, postsScraped: 0, postsPerMinute: 0, elapsedTime: 0 },
});

const ScraperContext = createContext<ScraperContextType | null>(null);

export function ScraperProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState<Record<Platform, PlatformState>>({
    twitter: { ...defaultPlatformState(), keywords: ["AI", "machine learning"] },
    instagram: { ...defaultPlatformState(), keywords: ["web development", "coding"] },
  });
  const [intervals, setIntervals] = useState<Record<string, ReturnType<typeof setInterval> | null>>({
    twitter: null,
    instagram: null,
  });

  const startScraper = useCallback((platform: Platform) => {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        isRunning: true,
        sessionStats: { startedAt: new Date().toISOString(), postsScraped: 0, postsPerMinute: 0, elapsedTime: 0 },
      },
    }));

    const id = setInterval(() => {
      setPlatforms((prev) => {
        const ps = prev[platform].sessionStats;
        const elapsed = ps.elapsedTime + 1;
        const scraped = ps.postsScraped + Math.floor(Math.random() * 3);
        return {
          ...prev,
          [platform]: {
            ...prev[platform],
            sessionStats: {
              ...ps,
              postsScraped: scraped,
              postsPerMinute: elapsed > 0 ? Math.round((scraped / elapsed) * 60) : 0,
              elapsedTime: elapsed,
            },
          },
        };
      });
    }, 1000);
    setIntervals((prev) => ({ ...prev, [platform]: id }));
  }, []);

  const stopScraper = useCallback((platform: Platform) => {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        isRunning: false,
      },
    }));
    setIntervals((prev) => {
      if (prev[platform]) clearInterval(prev[platform]!);
      return { ...prev, [platform]: null };
    });
  }, []);

  const setDuration = useCallback((platform: Platform, d: Duration) => {
    setPlatforms((prev) => ({ ...prev, [platform]: { ...prev[platform], duration: d } }));
  }, []);

  const addKeyword = useCallback((platform: Platform, k: string) => {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        keywords: prev[platform].keywords.includes(k) ? prev[platform].keywords : [...prev[platform].keywords, k],
      },
    }));
  }, []);

  const removeKeyword = useCallback((platform: Platform, k: string) => {
    setPlatforms((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        keywords: prev[platform].keywords.filter((item) => item !== k),
      },
    }));
  }, []);

  const isAnyRunning = platforms.twitter.isRunning || platforms.instagram.isRunning;

  return (
    <ScraperContext.Provider value={{ platforms, setDuration, addKeyword, removeKeyword, startScraper, stopScraper, isAnyRunning }}>
      {children}
    </ScraperContext.Provider>
  );
}

export function useScraperContext() {
  const ctx = useContext(ScraperContext);
  if (!ctx) throw new Error("useScraperContext must be used within ScraperProvider");
  return ctx;
}
