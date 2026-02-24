import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SessionStats {
  postsScraped: number;
  postsPerMinute: number;
  timeElapsed: number;
}

interface ScraperContextType {
  isRunning: boolean;
  duration: number;
  keywords: string[];
  sessionStats: SessionStats;
  startedAt: string | null;
  setDuration: (d: number) => void;
  addKeyword: (k: string) => void;
  removeKeyword: (k: string) => void;
  startScraper: () => void;
  stopScraper: () => void;
}

const ScraperContext = createContext<ScraperContextType | null>(null);

export function ScraperProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(30);
  const [keywords, setKeywords] = useState<string[]>(["AI", "machine learning", "web development"]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    postsScraped: 0,
    postsPerMinute: 0,
    timeElapsed: 0,
  });
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  const startScraper = useCallback(() => {
    setIsRunning(true);
    setStartedAt(new Date().toISOString());
    setSessionStats({ postsScraped: 0, postsPerMinute: 0, timeElapsed: 0 });

    const id = setInterval(() => {
      setSessionStats((prev) => {
        const elapsed = prev.timeElapsed + 1;
        const scraped = prev.postsScraped + Math.floor(Math.random() * 3);
        return {
          postsScraped: scraped,
          postsPerMinute: elapsed > 0 ? Math.round((scraped / elapsed) * 60) : 0,
          timeElapsed: elapsed,
        };
      });
    }, 1000);
    setIntervalId(id);
  }, []);

  const stopScraper = useCallback(() => {
    setIsRunning(false);
    setStartedAt(null);
    if (intervalId) clearInterval(intervalId);
    setIntervalId(null);
  }, [intervalId]);

  const addKeyword = useCallback((k: string) => {
    setKeywords((prev) => (prev.includes(k) ? prev : [...prev, k]));
  }, []);

  const removeKeyword = useCallback((k: string) => {
    setKeywords((prev) => prev.filter((item) => item !== k));
  }, []);

  return (
    <ScraperContext.Provider
      value={{ isRunning, duration, keywords, sessionStats, startedAt, setDuration, addKeyword, removeKeyword, startScraper, stopScraper }}
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
