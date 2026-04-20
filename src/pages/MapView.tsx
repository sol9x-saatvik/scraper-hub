import { lazy, Suspense } from "react";
import { MapPin } from "lucide-react";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { useGeoAnalysis } from "@/hooks/useGeoAnalysis";

const IntelligenceMap = lazy(() =>
  import("@/components/map/IntelligenceMap").then((m) => ({ default: m.IntelligenceMap }))
);

export default function MapView() {
  const { analyzeLast30Posts, progress, isRunning } = useGeoAnalysis();

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Geographic Intelligence Map</h1>
          <p className="text-sm text-muted-foreground mt-1">Location data extracted from scraped posts via AI analysis</p>
        </div>
        <button
          onClick={analyzeLast30Posts}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MapPin className="h-4 w-4" />
          {isRunning
            ? `Geotagging posts... (${progress.current}/${progress.total})`
            : "Analyze Last 30 Posts for Map"}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <MapErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading map...</div>}>
            <IntelligenceMap height="calc(100vh - 160px)" />
          </Suspense>
        </MapErrorBoundary>
      </div>
    </div>
  );
}
