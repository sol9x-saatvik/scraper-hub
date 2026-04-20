import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, Link2, Heart, Globe, MapPin } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { getDashboardStats, type DashboardStats } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { useGeoAnalysis } from "@/hooks/useGeoAnalysis";

const IntelligenceMap = lazy(() =>
  import("@/components/map/IntelligenceMap").then((m) => ({ default: m.IntelligenceMap }))
);

// 10 distinct colors so all top-user slots are covered
const CHART_COLORS = [
  "hsl(215, 90%, 56%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(350, 80%, 55%)",
  "hsl(185, 78%, 48%)",
  "hsl(25, 90%, 55%)",
  "hsl(320, 65%, 58%)",
  "hsl(95, 60%, 45%)",
  "hsl(55, 85%, 52%)",
];

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(222, 16%, 12%)",
  border: "1px solid hsl(220, 14%, 22%)",
  borderRadius: 8,
  fontSize: 12,
};

// Recharts splits text color into labelStyle + itemStyle — contentStyle.color has no effect on text
const TOOLTIP_LABEL_STYLE = { color: "hsl(220, 10%, 72%)" };
const TOOLTIP_ITEM_STYLE  = { color: "hsl(220, 10%, 92%)" };

const TICK_STYLE = { fontSize: 12, fill: "hsl(220, 10%, 54%)" };
const GRID_COLOR = "hsl(220, 14%, 20%)";

type PlatformFilter = "all" | "twitter" | "instagram";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { analyzeLast30Posts, progress, isRunning } = useGeoAnalysis();

  useEffect(() => {
    setError(null);
    getDashboardStats(platform)
      .then(setStats)
      .catch(() => {
        setError("Failed to load dashboard stats. Make sure the backend is running.");
        setStats(null);
      });
  }, [platform]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics overview of scraped data</p>
        </div>
        <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Posts" value={stats.totalPosts} icon={FileText} />
        <StatsCard title="Unique Users" value={stats.uniqueUsers} icon={Users} />
        <StatsCard title="Posts with Links" value={stats.totalLinks} icon={Link2} />
        <StatsCard title="Average Likes" value={stats.averageLikes} icon={Heart} />
      </div>

      {/* Charts — 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Posts Over Time */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Posts Over Time</h3>
          {stats.postsOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.postsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="date" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                <Line type="monotone" dataKey="posts" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Likes Distribution */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Likes Distribution</h3>
          {stats.likesDistribution.every((b: any) => b.count === 0) ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.likesDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="range" tick={TICK_STYLE} />
                <YAxis tick={TICK_STYLE} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Users */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Top Users</h3>
          {(stats.topUsers ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full max-w-[220px] shrink-0">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.topUsers}
                      dataKey="posts"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={85} innerRadius={45}
                      strokeWidth={0}
                    >
                      {stats.topUsers.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {stats.topUsers.map((user: any, i: number) => (
                  <div key={user.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-card-foreground font-mono text-xs truncate">{user.name}</span>
                    </div>
                    <span className="text-muted-foreground ml-2 shrink-0">{user.posts} posts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground mb-4">Source Breakdown</h3>
          {(stats.sourceBreakdown ?? []).every((s: any) => s.count === 0) ? (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.sourceBreakdown ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} allowDecimals={false} />
                <YAxis type="category" dataKey="source" tick={TICK_STYLE} width={60} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {(stats.sourceBreakdown ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Geographic Intelligence Map */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-card-foreground">Geographic Intelligence</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={analyzeLast30Posts}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MapPin className="h-3 w-3" />
              {isRunning
                ? `Geotagging posts... (${progress.current}/${progress.total})`
                : "Analyze Last 30 Posts for Map"}
            </button>
            <button
              onClick={() => navigate("/map")}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              View Full Map
            </button>
          </div>
        </div>
        <MapErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center h-[500px] text-muted-foreground text-sm">Loading map...</div>}>
            <IntelligenceMap height="500px" />
          </Suspense>
        </MapErrorBoundary>
      </div>

    </div>
  );
}
