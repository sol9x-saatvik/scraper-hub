import { useState, useCallback } from "react";
import { getAllPosts, getGeoPosts, saveGeoPost, type AllPost, type PostGeo } from "@/services/api";
import { useScraperContext } from "@/context/ScraperContext";

export interface GeoAnalysisProgress {
  current: number;
  total: number;
  done: boolean;
}

export function useGeoAnalysis() {
  const { analyzePost } = useScraperContext();
  const [progress, setProgress] = useState<GeoAnalysisProgress>({ current: 0, total: 0, done: false });
  const [isRunning, setIsRunning] = useState(false);

  const analyzeLast30Posts = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress({ current: 0, total: 0, done: false });

    try {
      const [allPosts, geoPosts] = await Promise.all([getAllPosts(), getGeoPosts()]);

      const geoSet = new Set(geoPosts.map((g) => `${g.user}__${g.date}__${g.time}`));

      const sorted = [...allPosts].sort((a, b) => {
        const da = `${a.date} ${a.time}`;
        const db = `${b.date} ${b.time}`;
        return db.localeCompare(da);
      });

      const candidates = sorted
        .filter((p) => !geoSet.has(`${p.user}__${p.date}__${p.time}`))
        .slice(0, 30);

      setProgress({ current: 0, total: candidates.length, done: false });

      for (let i = 0; i < candidates.length; i++) {
        setProgress({ current: i, total: candidates.length, done: false });
        // analyzePost internally calls saveGeoPost when location is found
        await analyzePost(candidates[i]);
        setProgress({ current: i + 1, total: candidates.length, done: false });
      }

      setProgress({ current: candidates.length, total: candidates.length, done: true });
    } catch {
      setProgress((prev) => ({ ...prev, done: true }));
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, analyzePost]);

  return { analyzeLast30Posts, progress, isRunning };
}
